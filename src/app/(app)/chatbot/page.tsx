
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { ChatMessage as ChatMessageType, ChatbotCharacter } from '@/lib/types';
import { helperAiChatbot } from '@/ai/flows/helper-ai-chatbot';
import { coderAiChatbot } from '@/ai/flows/coder-ai-chatbot';
import { tutorAiChatbot } from '@/ai/flows/tutor-ai-chatbot';
import { interviewerAiChatbot } from '@/ai/flows/interviewer-ai-chatbot';
import { Bot, PlayCircle, PauseCircle, StopCircle, Loader2, LifeBuoy, Code2, GraduationCap, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { GuestLock } from '@/components/features/auth/GuestLock';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_LANGUAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const TYPING_INDICATOR_ID = 'typing-indicator';

export default function ChatbotPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<ChatbotCharacter>('helper');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t, isReady: i18nReady } = useTranslation();
  const { appLanguage, userGoal } = useSettings();
  const [lastSpokenMessageId, setLastSpokenMessageId] = useState<string | null>(null);

  const {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    setVoicePreference,
  } = useTTS();

  const currentSpokenMessageRef = useRef<string | null>(null);
  
  const getGreetingKey = (char: ChatbotCharacter) => {
    switch(char) {
        case 'helper': return 'chatbot.helper.greeting';
        case 'coder': return 'chatbot.coder.greeting';
        case 'tutor': return 'chatbot.tutor.greeting';
        case 'interviewer': return 'chatbot.interviewer.greeting';
    }
  }
  
  useEffect(() => {
    if (!i18nReady || user?.isAnonymous) {
      if (user?.isAnonymous) setMessages([]);
      cancelTTS();
      return; 
    }

    cancelTTS();
    // Synchronize TTS voice with selected character
    setVoicePreference(selectedCharacter); 

    const greetingText = t(getGreetingKey(selectedCharacter));
    const greetingId = `${selectedCharacter}-initial-greeting`;

    const initialGreetingMessage: ChatMessageType = {
      id: greetingId, role: 'assistant',
      content: greetingText, timestamp: new Date()
    };
    
    setMessages([initialGreetingMessage]);
    
    if (lastSpokenMessageId !== greetingId) {
        currentSpokenMessageRef.current = greetingText;
        speak(greetingText, { priority: 'essential' });
        setLastSpokenMessageId(greetingId);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter, user, i18nReady]);


  useEffect(() => {
    return () => {
      cancelTTS();
    };
  }, [cancelTTS]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);
  
  const getTypingIndicatorKey = (char: ChatbotCharacter) => {
    switch(char) {
        case 'helper': return 'chatbot.helper.typing';
        case 'coder': return 'chatbot.coder.typing';
        case 'tutor': return 'chatbot.tutor.typing';
        case 'interviewer': return 'chatbot.interviewer.typing';
    }
  }
  
  const handleSendMessage = async (messageText: string, image?: string, pdfText?: string, pdfFileName?: string, audio?: string, video?: string) => {
    if (!messageText.trim() && !image && !pdfText && !audio && !video) return;
    
    cancelTTS();

    const userMessage: ChatMessageType = { 
      id: Date.now().toString() + '-user', 
      role: 'user', 
      content: messageText, 
      image: image,
      pdfFileName: pdfFileName,
      timestamp: new Date() 
    };
    
    const currentHistory = messages.filter(m => m.type !== 'typing_indicator' && !m.isError);
    const typingIndicator: ChatMessageType = { id: TYPING_INDICATOR_ID, role: 'assistant', content: t(getTypingIndicatorKey(selectedCharacter)), timestamp: new Date(), type: 'typing_indicator' };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsAiResponding(true);

    try {
      const languageLabel = APP_LANGUAGES.find(l => l.value === appLanguage)?.label || 'English';
      const input = {
        message: messageText,
        language: languageLabel,
        userGoal: userGoal || undefined,
        history: currentHistory.map(m => ({ role: m.role, content: m.content })),
      };

      let response;
      if (selectedCharacter === 'helper') response = await helperAiChatbot(input);
      else if (selectedCharacter === 'coder') response = await coderAiChatbot(input);
      else if (selectedCharacter === 'tutor') response = await tutorAiChatbot(input);
      else if (selectedCharacter === 'interviewer') response = await interviewerAiChatbot(input);
      
      const resText = (response as any).response || "System Error";
      const assistantMessageId = Date.now().toString() + '-assistant';
      const assistantMessage: ChatMessageType = { id: assistantMessageId, role: 'assistant', content: resText, timestamp: new Date() };

      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, assistantMessage]);

      if (lastSpokenMessageId !== assistantMessageId) {
        currentSpokenMessageRef.current = assistantMessage.content;
        speak(assistantMessage.content, { priority: 'essential' });
        setLastSpokenMessageId(assistantMessageId);
      }
      
    } catch (error) {
      console.error('Chatbot error:', error);
      toast({ title: t('chatbot.toast.errorTitle'), variant: "destructive" });
      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
    } finally {
      setIsAiResponding(false);
    }
  };

  const handlePlaybackControl = () => {
    playClickSound();
    if (isSpeaking && !isPaused) { pauseTTS(); return; }
    if (isPaused) { resumeTTS(); return; }
    if (currentSpokenMessageRef.current) speak(currentSpokenMessageRef.current, { priority: 'manual' });
  };

  const handleStopTTS = () => { playClickSound(); cancelTTS(); };

  const handleCharacterChange = (newCharacter: ChatbotCharacter) => {
    if (newCharacter === selectedCharacter) return;
    playClickSound();
    setSelectedCharacter(newCharacter);
  };
  
  const charData = {
    helper: { avatar: "/images/Helper.jpg", nameKey: 'chatbot.helper.name', descKey: 'chatbot.helper.description', fallback: <LifeBuoy />, background: '/images/Helper.jpg' },
    coder: { avatar: "/images/Coder.jpg", nameKey: 'chatbot.coder.name', descKey: 'chatbot.coder.description', fallback: <Code2 />, background: '/images/Coder.jpg' },
    tutor: { avatar: "/images/Jarvis.jpg", nameKey: 'chatbot.tutor.name', descKey: 'chatbot.tutor.description', fallback: <GraduationCap />, background: '/images/Jarvis.jpg' },
    interviewer: { avatar: "/images/Alya.jpg", nameKey: 'chatbot.interviewer.name', descKey: 'chatbot.interviewer.description', fallback: <Briefcase />, background: '/images/Alya.jpg' },
  }[selectedCharacter];
  
  if (authLoading || !i18nReady) return <div className="flex min-h-[60vh] w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (user?.isAnonymous) return <GuestLock featureName="guestLock.features.chatbot" featureDescription="guestLock.features.chatbotDesc" Icon={Bot} />;

  return (
    <div className="h-full flex flex-col py-4">
    <Card className="h-full flex flex-col flex-1 relative overflow-hidden">
      <Image src={charData.background} alt="bg" fill style={{ objectFit: 'cover' }} className="absolute top-0 left-0 w-full h-full -z-10 opacity-20" />
      <CardHeader className="border-b bg-background/40 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarImage src={charData.avatar} alt={t(charData.nameKey)} />
                  <AvatarFallback>{charData.fallback}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-xl font-bold text-primary">{t(charData.nameKey)}</CardTitle>
                    <CardDescription>{t(charData.descKey)}</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg shrink-0">
                    <TooltipProvider>
                        {(['helper', 'coder', 'tutor', 'interviewer'] as const).map(char => {
                            return (
                                <Tooltip key={char}>
                                    <TooltipTrigger asChild>
                                        <Button onClick={() => handleCharacterChange(char)} variant={selectedCharacter === char ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-3 relative">
                                            {char === 'helper' && <LifeBuoy className="w-3 h-3 mr-1" />}
                                            {char === 'coder' && <Code2 className="w-3 h-3 mr-1" />}
                                            {char === 'tutor' && <GraduationCap className="w-3 h-3 mr-1" />}
                                            {char === 'interviewer' && <Briefcase className="w-3 h-3 mr-1" />}
                                            {t(`chatbot.${char}.name`)}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t(`chatbot.${char}.description`)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </TooltipProvider>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button onClick={handlePlaybackControl} variant="outline" size="icon" className="h-8 w-8">{isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}</Button>
                    <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-8 w-8" disabled={!isSpeaking && !isPaused}><StopCircle className="h-4 w-4" /></Button>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} character={selectedCharacter}/>)}
          </div>
        </ScrollArea>
      </CardContent>
      <ChatInput onSendMessage={handleSendMessage} isLoading={setIsAiResponding} character={selectedCharacter} />
    </Card>
    </div>
  );
}
