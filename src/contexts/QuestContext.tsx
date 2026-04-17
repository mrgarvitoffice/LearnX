
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { format } from 'date-fns';

interface QuestState {
  quest1Completed: boolean;
  quest2Completed: boolean;
  quest3Completed: boolean;
}

interface StoredQuestData {
  date: string;
  quests: QuestState;
}

interface QuestContextType {
  quests: QuestState;
  completeQuest1: () => void;
  completeQuest2: () => void;
  completeQuest3: () => void;
  resetQuests: () => void;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

const QUESTS_LS_KEY = 'learnx-quests';

const initialQuestState: QuestState = {
  quest1Completed: false,
  quest2Completed: false,
  quest3Completed: false,
};

export function QuestProvider({ children }: { children: ReactNode }) {
  const [quests, setQuests] = useState<QuestState>(initialQuestState);

  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let storedData: StoredQuestData | null = null;
    try {
      const item = localStorage.getItem(QUESTS_LS_KEY);
      if (item) {
        storedData = JSON.parse(item);
      }
    } catch (e) {
      console.error("Failed to parse quest data from localStorage", e);
      localStorage.removeItem(QUESTS_LS_KEY);
    }

    if (storedData && storedData.date === todayStr) {
      setQuests(storedData.quests);
    } else {
      // It's a new day or no data exists, reset quests
      const newStoredData: StoredQuestData = { date: todayStr, quests: initialQuestState };
      localStorage.setItem(QUESTS_LS_KEY, JSON.stringify(newStoredData));
      setQuests(initialQuestState);
    }
  }, []);
  
  const updateQuestCompletion = useCallback((questUpdater: (prevQuests: QuestState) => QuestState) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setQuests(prevQuests => {
      const updatedQuests = questUpdater(prevQuests);
      const newStoredData: StoredQuestData = { date: todayStr, quests: updatedQuests };
      localStorage.setItem(QUESTS_LS_KEY, JSON.stringify(newStoredData));
      return updatedQuests;
    });
  }, []);

  const completeQuest1 = useCallback(() => {
    updateQuestCompletion(prev => ({...prev, quest1Completed: true}));
  }, [updateQuestCompletion]);

  const completeQuest2 = useCallback(() => {
    updateQuestCompletion(prev => ({...prev, quest2Completed: true}));
  }, [updateQuestCompletion]);

  const completeQuest3 = useCallback(() => {
     updateQuestCompletion(prev => ({...prev, quest3Completed: true}));
  }, [updateQuestCompletion]);

  const resetQuests = useCallback(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newStoredData: StoredQuestData = { date: todayStr, quests: initialQuestState };
    localStorage.setItem(QUESTS_LS_KEY, JSON.stringify(newStoredData));
    setQuests(initialQuestState);
  }, []);

  const providerValue = {
    quests,
    completeQuest1,
    completeQuest2,
    completeQuest3,
    resetQuests,
  };

  return (
    <QuestContext.Provider value={providerValue}>
      {children}
    </QuestContext.Provider>
  );
}

export const useQuests = () => {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuests must be used within a QuestProvider');
  }
  return context;
};
