
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { UserGoal } from '@/lib/types';

export type SoundMode = 'full' | 'essential' | 'muted';
export type FontSize = 'small' | 'normal' | 'large';
export type AssistantMode = 'jarvis';

interface SettingsContextType {
  soundMode: SoundMode;
  setSoundMode: (mode: SoundMode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  appLanguage: string;
  setAppLanguage: (lang: string) => void;
  mode: AssistantMode; 
  setMode: (mode: AssistantMode) => void;
  userGoal: UserGoal | null;
  setUserGoal: (goal: UserGoal | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundMode, setSoundModeState] = useState<SoundMode>('essential');
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');
  const [appLanguage, setAppLanguageState] = useState<string>('en');
  const [mode, setModeState] = useState<AssistantMode>('jarvis');
  const [userGoal, setUserGoalState] = useState<UserGoal | null>(null);

  useEffect(() => {
    const savedSoundMode = localStorage.getItem('learnx-soundMode') as SoundMode;
    const savedFontSize = localStorage.getItem('learnx-fontSize') as FontSize;
    const savedLanguage = localStorage.getItem('learnx-appLanguage');
    const savedGoal = localStorage.getItem('learnx-user-goal');

    if (savedSoundMode && ['full', 'essential', 'muted'].includes(savedSoundMode)) {
      setSoundModeState(savedSoundMode);
    } else {
      setSoundModeState('essential');
    }
    if (savedFontSize && ['small', 'normal', 'large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }
    if (savedLanguage) setAppLanguageState(savedLanguage);
    
    // Default to 'jarvis' as Alya is removed
    setModeState('jarvis');

    if (savedGoal) {
        try { setUserGoalState(JSON.parse(savedGoal)); } catch(e) { console.error("Failed to parse user goal"); }
    } else {
      setUserGoalState({ type: 'college', university: 'RGPV', program: 'B.Tech', branch: 'CSE', semester: '4', country: 'in'});
    }

  }, []);

  const handleSetFontSize = useCallback((size: FontSize) => {
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-normal', 'font-size-large');
    root.classList.add(`font-size-${size}`);
    localStorage.setItem('learnx-fontSize', size);
    setFontSizeState(size);
  }, []);

  useEffect(() => {
    handleSetFontSize(fontSize);
  }, [fontSize, handleSetFontSize]);

  const handleSetSoundMode = useCallback((mode: SoundMode) => {
    localStorage.setItem('learnx-soundMode', mode);
    setSoundModeState(mode);
  }, []);
  
  const handleSetAppLanguage = useCallback((lang: string) => {
    localStorage.setItem('learnx-appLanguage', lang);
    setAppLanguageState(lang);
  }, []);

  const handleSetMode = useCallback((newMode: AssistantMode) => {
    // Only 'jarvis' is allowed now
    localStorage.setItem('learnx-assistantMode', 'jarvis');
    setModeState('jarvis');
  }, []);

  const handleSetUserGoal = useCallback((goal: UserGoal | null) => {
    if (goal) {
      localStorage.setItem('learnx-user-goal', JSON.stringify(goal));
    } else {
      localStorage.removeItem('learnx-user-goal');
    }
    setUserGoalState(goal);
  }, []);

  const providerValue = {
    soundMode,
    setSoundMode: handleSetSoundMode,
    fontSize,
    setFontSize: handleSetFontSize,
    appLanguage,
    setAppLanguage: handleSetAppLanguage,
    mode,
    setMode: handleSetMode,
    userGoal,
    setUserGoal: handleSetUserGoal,
  };

  return (
    <SettingsContext.Provider value={providerValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
