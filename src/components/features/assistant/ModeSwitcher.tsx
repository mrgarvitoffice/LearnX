
"use client";

import { useSettings } from '@/contexts/SettingsContext'; // Changed from useAssistant
import { useSound } from '@/hooks/useSound';
import InteractiveCharacterElement from '@/components/features/InteractiveCharacterElement';
import { cn } from '@/lib/utils';

const ModeSwitcher = () => {
  const { mode, setMode } = useSettings(); // Changed from useAssistant
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');

  const switchMode = (newMode: 'jarvis' | 'alya') => {
    if (mode !== newMode) {
      playClickSound();
      setMode(newMode);
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-muted p-1 rounded-full">
      <div onClick={() => switchMode('jarvis')} className={cn('p-0.5 cursor-pointer', mode === 'jarvis' && 'bg-background rounded-full ring-2 ring-primary')}>
        <InteractiveCharacterElement
          characterName="J.A.R.V.I.S."
          imageUrl="/images/Jarvis.jpg"
          className="h-7 w-7"
        />
      </div>
      <div onClick={() => switchMode('alya')} className={cn('p-0.5 cursor-pointer', mode === 'alya' && 'bg-background rounded-full ring-2 ring-pink-500')}>
         <InteractiveCharacterElement
          characterName="Alya"
          imageUrl="/images/Alya.jpg"
          className="h-7 w-7"
        />
      </div>
    </div>
  );
};

export default ModeSwitcher;
