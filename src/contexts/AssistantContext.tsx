
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { processAssistantCommand, type AssistantCommandOutput } from '@/ai/flows/jarvis-command';
import { useToast } from '@/hooks/use-toast';
import { useQuests } from './QuestContext';
import { useAuth } from './AuthContext';
import { useAssistantVoice, type AssistantStatus } from '@/hooks/useAssistantVoice';
import { useSettings } from './SettingsContext';
import { useTheme } from 'next-themes';
import { APP_LANGUAGES } from '@/lib/constants';
import { useTTS } from '@/hooks/useTTS';
import { useProgression } from './ProgressionContext';

interface TerminalMessage {
  id: number;
  content: string;
  type: 'user' | 'ai' | 'system' | 'error';
}

interface AssistantContextType {
  isTerminalOpen: boolean;
  status: AssistantStatus;
  isAssistantActive: boolean;
  terminalContent: TerminalMessage[];
  toggleAssistant: () => void;
  toggleTerminal: () => void;
  processCommand: (command: string) => Promise<void>;
  addToTerminal: (message: string, type: TerminalMessage['type']) => void;
  activeStudyTab: string;
  setActiveStudyTab: (tab: string) => void;
  lastAssistantAction: AssistantCommandOutput | null;
  setLastAssistantAction: (action: AssistantCommandOutput | null) => void;
  activeArcadeTab: string;
  setActiveArcadeTab: (tab: string) => void;
  dialogToOpen: 'calculator' | 'arcade' | null;
  setDialogToOpen: (dialog: 'calculator' | 'arcade' | null) => void;
  textToType: { targetId: string, text: string } | null;
  setTextToType: (typingRequest: { targetId: string, text: string } | null) => void;
  browserSupportsSpeechRecognition: boolean;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalContent, setTerminalContent] = useState<TerminalMessage[]>([]);
  const [activeStudyTab, setActiveStudyTab] = useState('notes');
  const [activeArcadeTab, setActiveArcadeTab] = useState('definition-challenge');
  const [lastAssistantAction, setLastAssistantAction] = useState<AssistantCommandOutput | null>(null);
  const [dialogToOpen, setDialogToOpen] = useState<'calculator' | 'arcade' | null>(null);
  const [textToType, setTextToType] = useState<{ targetId: string, text: string } | null>(null);

  const { signOutUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { completeQuest1, completeQuest2 } = useQuests();
  const { updateQuest } = useProgression();
  const { toast } = useToast();
  const { appLanguage, setAppLanguage, mode, userGoal } = useSettings();
  const { setTheme } = useTheme();
  const { speak, cancelTTS } = useTTS();

  const addToTerminal = useCallback((content: string, type: TerminalMessage['type']) => {
    setTerminalContent(prev => [...prev, { id: Date.now(), content, type }]);
  }, []);

  const toggleTerminal = useCallback(() => {
    setIsTerminalOpen(prev => !prev);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "'") {
        e.preventDefault();
        toggleTerminal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTerminal]);

  const executeAction = useCallback((action: AssistantCommandOutput) => {
    setLastAssistantAction(action);
    
    if(action.params?.isWakeWord === true) {
        return;
    }

    switch (action.action) {
      case 'navigate':
        if (action.params?.target) router.push(action.params.target as string);
        break;
      case 'generate_notes':
         if (action.params?.topic) {
            toast({ title: "System Synthesis", description: `Generating notes for "${action.params.topic}". Redirecting...` });
            completeQuest1();
            router.push(`/notes?topic=${encodeURIComponent(action.params.topic as string)}`);
        } else {
            router.push('/notes');
        }
        break;
      case 'generate_test':
        if (action.params?.topic) {
            toast({ title: "Assessment Protocol", description: `Creating test for "${action.params.topic}". Redirecting...` });
            const query = new URLSearchParams({
              sourceType: 'topic',
              topics: action.params.topic as string,
              numQuestions: (action.params.numQuestions || 10).toString(),
              difficulty: (action.params.difficulty as string) || 'medium',
              timer: (action.params.timer || 0).toString()
            }).toString();
            completeQuest2();
            router.push(`/custom-test?${query}`);
        } else {
             router.push('/custom-test');
        }
        break;
      case 'read_news':
        toast({ title: "Intel Stream", description: `Fetching news terminal...` });
        const newsQuery = new URLSearchParams({ ...action.params as Record<string, string> }).toString();
        router.push(`/news?${newsQuery}`);
        break;
      case 'search_youtube':
      case 'search_books':
        toast({ title: "Library Retrieval", description: `Searching for "${action.params.query}"...`});
        const libraryQuery = new URLSearchParams({
            feature: action.action === 'search_youtube' ? 'youtube' : 'books',
            query: action.params.query as string
        }).toString();
        router.push(`/library?${libraryQuery}`);
        break;
      case 'change_theme':
        if (action.params?.theme && ['light', 'dark', 'system'].includes(action.params.theme as string)) {
          setTheme(action.params.theme as string);
        }
        break;
      case 'change_language':
         if (action.params?.language) {
            const langInfo = APP_LANGUAGES.find(l => l.label.toLowerCase().includes((action.params.language as string).toLowerCase()) || l.englishName.toLowerCase().includes((action.params.language as string).toLowerCase()));
            if (langInfo) setAppLanguage(langInfo.value);
            else toast({ title: "Protocol Error", description: `Language matching "${action.params.language}" not found.`, variant: "destructive" });
        }
        break;
      case 'switch_tab':
        if (pathname === '/study' && action.params?.tab && ['notes', 'quiz', 'flashcards'].includes(action.params.tab as string)) {
          setActiveStudyTab(action.params.tab as string);
        }
        break;
      case 'open_terminal':
        setIsTerminalOpen(true);
        break;
      case 'close_terminal':
        setIsTerminalOpen(false);
        break;
      case 'logout':
        signOutUser();
        break;
      default:
        break;
    }
  }, [router, pathname, toast, completeQuest1, completeQuest2, signOutUser, setTheme, setAppLanguage]);

  const processCommandFromSource = useCallback(async (command: string): Promise<{ verbalResponse: string, action: () => void } | undefined> => {
    if (!command.trim()) return;

    addToTerminal(`> ${command}`, 'user');
    
    // Check if it's a doubt (question mark or question words)
    const doubtWords = ['what', 'why', 'how', 'when', 'who', 'explain', 'tell me about'];
    const isDoubt = command.includes('?') || doubtWords.some(word => command.toLowerCase().includes(word));
    
    if (isDoubt) {
        updateQuest('terminalDoubts');
    }

    try {
      const languageInfo = APP_LANGUAGES.find(l => l.value === appLanguage);
      const languageName = languageInfo?.englishName || 'English';

      const response = await processAssistantCommand({ command, context: pathname, mode, language: languageName, userGoal: userGoal || undefined });
      const verbalResponse = response.verbal_response || 'Acknowledged.';
      addToTerminal(`J.A.R.V.I.S.: ${verbalResponse}`, 'ai');

      return { verbalResponse, action: () => executeAction(response) };

    } catch (error: any) {
      const errorMessage = error.message || "Unknown anomaly detected.";
      addToTerminal(errorMessage, 'error');
      const verbalError = "I've encountered an anomaly in my core processing. Please check the terminal logs.";
      speak(verbalError, { priority: 'manual' });
      return { verbalResponse: verbalError, action: () => {} };
    }
  }, [pathname, mode, appLanguage, userGoal, addToTerminal, executeAction, speak, updateQuest]);

  const { status, toggleAssistant, browserSupportsSpeechRecognition, isAssistantActive } = useAssistantVoice({
    onCommand: processCommandFromSource,
  });

  const processCommandForUi = useCallback(async (cmd: string) => {
      cancelTTS();
      const result = await processCommandFromSource(cmd);
      if (result) {
          speak(result.verbalResponse, { priority: 'manual' });
          result.action();
      }
  }, [processCommandFromSource, speak, cancelTTS]);


  return (
    <AssistantContext.Provider value={{
      isTerminalOpen, status, isAssistantActive,
      terminalContent,
      toggleAssistant, toggleTerminal,
      processCommand: processCommandForUi,
      addToTerminal,
      activeStudyTab, setActiveStudyTab,
      lastAssistantAction, setLastAssistantAction,
      activeArcadeTab, setActiveArcadeTab,
      dialogToOpen, setDialogToOpen,
      textToType, setTextToType,
      browserSupportsSpeechRecognition
    }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
