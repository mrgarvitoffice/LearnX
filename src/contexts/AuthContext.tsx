
"use client";
/**
 * @fileoverview Provides authentication context and logic for the application.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { GoalSelectionDialog } from '@/components/features/auth/GoalSelectionDialog';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const handleUserCreationInFirestore = useCallback(async (user: User) => {
    if (!user || user.isAnonymous) return;
    
    const userRef = doc(db, 'users', user.uid);
    try {
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                xp: 0,
                quests: {
                    notesCreated: 0,
                    terminalDoubts: 0,
                    newsRead: 0,
                    testsAttempted: 0,
                    codeRuns: 0
                },
                unlockedFeatures: [],
                lastLogin: serverTimestamp(),
                joinedAt: serverTimestamp(),
            });
            setShowGoalSelection(true); 
        } else {
            await setDoc(userRef, {
                lastLogin: serverTimestamp(),
            }, { merge: true });
        }
    } catch (error: any) {
        console.error("Firestore user creation error:", error);
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await handleUserCreationInFirestore(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [handleUserCreationInFirestore]);
  

  const signOutUser = async () => {
    try {
      await signOut(auth);
      toast({ title: t('auth.signOutTitle'), description: t('auth.signOutDesc') });
      router.push('/sign-in');
    } catch (error: any) {
      toast({ title: t('auth.signOutErrorTitle'), description: error.message, variant: "destructive" });
    }
  };
  
  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await firebaseSignInAnonymously(auth);
      router.push('/dashboard');
      toast({ title: t('auth.guestWelcome'), description: t('auth.guestWelcomeDesc') });
    } catch (error: any) {
      toast({ title: t('auth.guestErrorTitle'), description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: t('auth.signInErrorTitle'), description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };
  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: t('auth.googleErrorTitle'), description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        await handleUserCreationInFirestore(userCredential.user);
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({ title: t('auth.signUpErrorTitle'), description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleGoalSelectionComplete = () => {
    setShowGoalSelection(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOutUser, signInWithEmail, signUpWithEmail, signInAnonymously, signInWithGoogle }}>
      {children}
      <GoalSelectionDialog
        isOpen={showGoalSelection}
        onClose={handleGoalSelectionComplete}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
