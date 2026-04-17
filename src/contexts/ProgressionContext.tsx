
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, onSnapshot, increment, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';

interface Quests {
  notesCreated: number;
  terminalDoubts: number;
  newsRead: number;
  testsAttempted: number;
  codeRuns: number;
}

interface ProgressionData {
  xp: number;
  quests: Quests;
  unlockedFeatures: string[];
}

interface ProgressionContextType extends ProgressionData {
  addXP: (amount: number) => void;
  updateQuest: (quest: keyof Quests) => void;
  isLoading: boolean;
}

const ProgressionContext = createContext<ProgressionContextType | undefined>(undefined);

const INITIAL_DATA: ProgressionData = {
  xp: 0,
  quests: {
    notesCreated: 0,
    terminalDoubts: 0,
    newsRead: 0,
    testsAttempted: 0,
    codeRuns: 0
  },
  unlockedFeatures: []
};

const QUEST_TARGETS: Record<keyof Quests, number> = {
    notesCreated: 2,
    terminalDoubts: 1,
    newsRead: 3,
    testsAttempted: 1,
    codeRuns: 1
};

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressionData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { playSound: playLevelUpSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setData(INITIAL_DATA);
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const docData = snapshot.data();
        setData({
          xp: docData.xp || 0,
          quests: docData.quests || INITIAL_DATA.quests,
          unlockedFeatures: docData.unlockedFeatures || []
        });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addXP = useCallback(async (amount: number) => {
    if (!user || user.isAnonymous) return;
    const userRef = doc(db, 'users', user.uid);
    
    await updateDoc(userRef, {
      xp: increment(amount)
    });

    toast({
      title: "XP Earned!",
      description: `You earned ${amount} XP.`,
    });
  }, [user, toast]);

  const updateQuest = useCallback(async (quest: keyof Quests) => {
    if (!user || user.isAnonymous) return;
    const userRef = doc(db, 'users', user.uid);
    
    const currentCount = data.quests[quest] || 0;
    if (currentCount >= QUEST_TARGETS[quest]) return; // Quest already done

    const newCount = currentCount + 1;
    await updateDoc(userRef, {
      [`quests.${quest}`]: increment(1)
    });

    // If target reached, add 5 XP
    if (newCount === QUEST_TARGETS[quest]) {
        addXP(5);
        
        // Check for overall bonus (all quests completed)
        const allCompleted = (Object.keys(QUEST_TARGETS) as Array<keyof Quests>).every(k => {
            const count = (k === quest) ? newCount : (data.quests[k] || 0);
            return count >= QUEST_TARGETS[k];
        });
        
        if (allCompleted) {
            addXP(5); // The final bonus to reach 30 XP
        }
    }
  }, [user, data, addXP]);

  // Handle unlocks based on XP threshold
  useEffect(() => {
    if (!user || user.isAnonymous || data.xp < 30 || data.unlockedFeatures.includes('premium_pro')) return;

    const performUnlock = async () => {
        const userRef = doc(db, 'users', user.uid);
        playLevelUpSound();
        await updateDoc(userRef, {
            unlockedFeatures: arrayUnion('premium_pro', 'advanced_analytics', 'personal_tutor'),
        });
        toast({
            title: "🎉 Reward Unlocked!",
            description: "You've earned 30 XP! Access to Pro Features, Advanced Analytics, and Personal Tutor characters is now granted.",
            variant: "default"
        });
    };

    performUnlock();
  }, [data.xp, data.unlockedFeatures, user, playLevelUpSound, toast]);

  return (
    <ProgressionContext.Provider value={{ ...data, addXP, updateQuest, isLoading }}>
      {children}
    </ProgressionContext.Provider>
  );
}

export function useProgression() {
  const context = useContext(ProgressionContext);
  if (context === undefined) {
    throw new Error('useProgression must be used within a ProgressionProvider');
  }
  return context;
}
