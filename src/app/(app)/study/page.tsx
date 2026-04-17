
"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpenText, Brain, Layers, RefreshCw, AlertTriangle, Loader2, Home } from "lucide-react"; 

import { useToast } from "@/hooks/use-toast";
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';

import { generateNotesAction } from "@/lib/actions";
import type { CombinedStudyMaterialsOutput, GenerateQuizQuestionsOutput, GenerateFlashcardsOutput, QueryError } from '@/lib/types';
import { COLLEGE_DATA } from '@/lib/constants';

import NotesView from '@/components/study/NotesView';
import QuizView from '@/components/study/QuizView';
import FlashcardsView from '@/components/study/FlashcardsView';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAssistant } from '@/contexts/AssistantContext';

const LOCALSTORAGE_KEY_PREFIX = "learnmint-study-";
const getCacheKey = (type: string, topicKey: string) => `${LOCALSTORAGE_KEY_PREFIX}${type}-${topicKey.toLowerCase().replace(/\s+/g, '-')}`;

const NotesLoadingSkeleton = () => (
    <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3"><Skeleton className="h-5 w-3/4" /></CardHeader>
        <CardContent className="p-6">
            <div className="space-y-3">
                <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-32 w-full mt-4" />
            </div>
        </CardContent>
    </Card>
);
const QuizLoadingSkeleton = () => (
    <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3"><Skeleton className="h-5 w-3/4" /></CardHeader>
        <CardContent className="p-6">
            <div className="space-y-3">
                <Skeleton className="h-6 w-1/2 mb-4" />
                {[...Array(3)].map((_, i) => ( <div key={i} className="space-y-2 mb-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>))}
            </div>
        </CardContent>
    </Card>
);
const FlashcardsLoadingSkeleton = () => (
   <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0">
    <CardHeader className="pb-3"><Skeleton className="h-5 w-3/4" /></CardHeader>
    <CardContent className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    </CardContent>
  </Card>
);

const ErrorDisplay = ({ error, onRetry, contentType }: { error: string | null, onRetry: () => void, contentType: string }) => {
  const { t } = useTranslation();
  return (
    <Alert variant="destructive" className="mt-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('studyHub.error.loading', { contentType })}</AlertTitle>
      <AlertDescription>
        {error || t('studyHub.error.failed', { contentType })}
        <Button onClick={onRetry} variant="link" className="pl-1 text-destructive h-auto py-0">{t('studyHub.error.retry')}</Button>
      </AlertDescription>
    </Alert>
  );
};

function StudyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); 
  const topicParam = searchParams.get("topic");
  const { activeStudyTab, setActiveStudyTab } = useAssistant();

  const [activeTopic, setActiveTopic] = useState<string>(""); 
  const [notesData, setNotesData] = useState<CombinedStudyMaterialsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { t, isReady } = useTranslation();
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { volume: 0.4, priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { speak, setVoicePreference } = useTTS();
  
  const pageTitleSpokenRef = useRef(false);

  useEffect(() => {
    const decodedTopic = topicParam ? decodeURIComponent(topicParam).trim() : "";
    if (decodedTopic) {
      setActiveTopic(decodedTopic);
    } else {
        setIsLoading(false);
    }
  }, [topicParam]);

  const loadCachedData = useCallback(() => {
    if (!activeTopic) return;
    setIsLoading(true);

    try {
      const cachedNotes = localStorage.getItem(getCacheKey("notes", activeTopic));
      const cachedQuiz = localStorage.getItem(getCacheKey("quiz", activeTopic));
      const cachedFlashcards = localStorage.getItem(getCacheKey("flashcards", activeTopic));

      const combinedData: CombinedStudyMaterialsOutput = {
          notesOutput: cachedNotes ? JSON.parse(cachedNotes) : { notes: ""},
          quizOutput: cachedQuiz ? JSON.parse(cachedQuiz) : undefined,
          flashcardsOutput: cachedFlashcards ? JSON.parse(cachedFlashcards) : undefined,
      };
      
      setNotesData(combinedData);

      if (!cachedNotes) {
          toast({
              title: "Content Not Found",
              description: "Could not find generated notes in cache. Please generate them first.",
              variant: "destructive"
          });
      }

    } catch (e) {
      console.error("Failed to parse cached study materials", e);
      toast({title: "Cache Error", description: "Failed to load materials from cache. They might be corrupted.", variant: "destructive"});
      setNotesData(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeTopic, toast]);

  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);


  useEffect(() => {
    setVoicePreference('holo');
  }, [setVoicePreference]);

  useEffect(() => {
    if (!isReady || pageTitleSpokenRef.current || !activeTopic) return;
    const timer = setTimeout(() => {
        speak(t('studyHub.titleForTopic', { topic: activeTopic }), { priority: 'optional' });
        pageTitleSpokenRef.current = true;
    }, 500);

    return () => clearTimeout(timer);
  }, [speak, activeTopic, t, isReady]);

  const handleRefreshContent = useCallback(() => {
    playActionSound();
    if (activeTopic) {
      toast({ title: t('studyHub.toast.refreshingTitle'), description: `Clearing cache and redirecting to generate new materials for ${activeTopic}` });
      localStorage.removeItem(getCacheKey("notes", activeTopic));
      localStorage.removeItem(getCacheKey("quiz", activeTopic));
      localStorage.removeItem(getCacheKey("flashcards", activeTopic));
      router.push(`/notes?topic=${encodeURIComponent(activeTopic)}`);
    } else {
      toast({ title: t('studyHub.toast.noTopicError'), description: t('studyHub.toast.noTopicErrorDesc'), variant: "destructive" });
    }
  }, [activeTopic, toast, playActionSound, t, router]);

  const handleTabChange = (value: string) => {
    playClickSound();
    setActiveStudyTab(value);
  };

  const renderContent = () => {
    if (isLoading || !isReady) {
      return (
        <div className="flex-1 mt-4">
          <NotesLoadingSkeleton />
        </div>
      );
    }

    if (!activeTopic) { 
      return (
        <Alert variant="default" className="mt-6 flex flex-col items-center justify-center text-center p-6">
          <Home className="h-10 w-10 text-muted-foreground mb-3" />
          <AlertTitle className="text-xl">{t('studyHub.noTopic.title')}</AlertTitle>
          <AlertDescription className="mb-4">
            {t('studyHub.noTopic.description')}
          </AlertDescription>
          <Button onClick={() => router.push('/notes')} variant="outline">
            {t('studyHub.noTopic.button')}
          </Button>
        </Alert>
      );
    }
    
    return (
      <Tabs defaultValue="notes" value={activeStudyTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 mx-auto md:max-w-md sticky top-[calc(theme(spacing.16)_+_1px)] sm:top-0 z-10 bg-background/80 backdrop-blur-sm py-1.5 h-auto">
          <TabsTrigger value="notes" className="py-2.5 text-sm sm:text-base"><BookOpenText className="mr-1.5 sm:mr-2 h-4 w-4"/>{t('studyHub.tabs.notes')}</TabsTrigger>
          <TabsTrigger value="quiz" className="py-2.5 text-sm sm:text-base"><Brain className="mr-1.5 sm:mr-2 h-4 w-4"/>{t('studyHub.tabs.quiz')}</TabsTrigger>
          <TabsTrigger value="flashcards" className="py-2.5 text-sm sm:text-base"><Layers className="mr-1.5 sm:mr-2 h-4 w-4"/>{t('studyHub.tabs.flashcards')}</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 mt-0">
          {notesData?.notesOutput?.notes ? <NotesView notesContent={notesData.notesOutput.notes} topic={activeTopic} /> : <ErrorDisplay error={t('studyHub.notes.unavailable')} onRetry={handleRefreshContent} contentType={t('studyHub.tabs.notes')} />}
        </TabsContent>
        
        <TabsContent value="quiz" className="flex-1 mt-0">
          {notesData?.quizOutput?.questions ? <QuizView questions={notesData.quizOutput.questions} topic={activeTopic} difficulty="medium" /> : <ErrorDisplay error={t('studyHub.quiz.unavailable')} onRetry={handleRefreshContent} contentType={t('studyHub.tabs.quiz')} />}
        </TabsContent>

        <TabsContent value="flashcards" className="flex-1 mt-0">
          {notesData?.flashcardsOutput?.flashcards ? <FlashcardsView flashcards={notesData.flashcardsOutput.flashcards} topic={activeTopic} /> : <ErrorDisplay error={t('studyHub.flashcards.unavailable')} onRetry={handleRefreshContent} contentType={t('studyHub.tabs.flashcards')} />}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-2 py-6 sm:px-4 sm:py-8 flex flex-col flex-1 min-h-0">
      {activeTopic && isReady ? (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 flex-shrink-0 mt-4 sm:mt-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center sm:text-left truncate max-w-2xl">
            {t('studyHub.titleForTopic', { topic: activeTopic })}
          </h1>
          <Button onClick={handleRefreshContent} variant="outline" size="sm" className="active:scale-95" disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" /> {t('studyHub.refreshButton')}
          </Button>
        </div>
      ) : null}
      <div className="flex-1 flex flex-col min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}

export default function StudyPage() {
  const { t, isReady } = useTranslation();
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-7xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{isReady ? t('studyHub.loading.title') : 'Loading...'}</p>
      </div>
    }>
      <StudyPageContent />
    </Suspense>
  );
}
