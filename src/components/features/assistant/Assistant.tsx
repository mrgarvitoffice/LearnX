"use client";

import { useAssistant } from '@/contexts/AssistantContext';
import { Button } from '@/components/ui/button';
import { Mic, Terminal as TerminalIcon, Brain, Loader2, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

const Assistant = () => {
  const { toggleAssistant, toggleTerminal, status, browserSupportsSpeechRecognition, isAssistantActive } = useAssistant();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'essential' });

  const handleToggle = () => {
    playClickSound();
    toggleAssistant();
  };
  
  const handleToggleTerminal = () => {
    playClickSound();
    toggleTerminal();
  }

  const getStatusIcon = () => {
    if (!isAssistantActive) return <Power className="h-4 w-4 text-muted-foreground" />;
    if (status === 'listening') return <Mic className="h-4 w-4 text-destructive" />;
    if (status === 'processing') return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === 'speaking') return <Brain className="h-4 w-4 text-purple-400" />;
    return <Mic className="h-4 w-4" />;
  };
  
  const getStatusTitle = () => {
    if (!browserSupportsSpeechRecognition) return "Voice recognition not supported";
    if (isAssistantActive) {
        if (status === 'listening') return "Listening...";
        if (status === 'processing') return "Processing command...";
        if (status === 'speaking') return "Speaking response...";
        return "Assistant is ON (Click to turn off)";
    }
    return "Activate Assistant";
  }
  
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleToggle}
        disabled={!browserSupportsSpeechRecognition}
        variant="outline"
        size="icon"
        className={cn(
          "h-9 w-9 transition-all duration-300",
          isAssistantActive && "ring-2 ring-primary/80 bg-primary/10",
          status === 'listening' && "ring-destructive/80 bg-destructive/10 animate-pulse",
          status === 'speaking' && "ring-purple-500/80 bg-purple-500/10"
        )}
        title={getStatusTitle()}
      >
        {getStatusIcon()}
      </Button>
      
      {isAssistantActive && (
        <Button
          onClick={handleToggleTerminal}
          variant="outline"
          size="icon"
          className="h-9 w-9"
          title="Toggle Terminal"
        >
          <TerminalIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default Assistant;
