
"use client";

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { generateQuizAction } from '@/lib/actions';
import type { TestSettings, QuizQuestion as TestQuestionType, GenerateQuizQuestionsOutput } from '@/lib/types';
import { Loader2, TestTubeDiagonal, CheckCircle, XCircle, Clock, Lightbulb, Mic, Sparkles, FileText, XCircle as XCircleIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { cn, extractTextFromPdf } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { GuestLock } from '@/components/features/auth/GuestLock';
import { useTranslation } from '@/hooks/useTranslation';
import { useSearchParams } from 'next/navigation';
import { useProgression } from '@/contexts/ProgressionContext';

const RECENT_TOPICS_LS_KEY = 'learnx-recent-topics';
const MAX_RECENT_TOPICS_DISPLAY = 15;
const MAX_RECENT_TOPICS_SELECT = 5;

const formSchema = z.object({
  sourceType: z.enum(['topic', 'notes', 'recent']).default('topic'),
  topics: z.string().optional(),
  notes: z.string().optional(),
  selectedRecentTopics: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  numQuestions: z.coerce.number().min(1).max(50).default(10),
  timer: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof formSchema>;

interface CustomTestState {
  settings: TestSettings;
  questions: TestQuestionType[];
  userAnswers: (string | undefined)[];
  currentQuestionIndex: number;
  showResults: boolean;
  score: number;
  timeLeft?: number;
  performanceTag?: string;
}

export default function CustomTestPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [testState, setTestState] = useState<CustomTestState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const { updateQuest } = useProgression();
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const notesFileRef = useRef<HTMLInputElement>(null);
  const generationTriggeredRef = useRef(false);

  const { t, isReady } = useTranslation();
  const { toast } = useToast();
  const { playSound: playCorrectSound } = useSound('/sounds/correct-answer.mp3', { priority: 'essential' });
  const { playSound: playIncorrectSound } = useSound('/sounds/incorrect-answer.mp3', { priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });

  const { speak, setVoicePreference } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  
  const pageTitleSpokenRef = useRef(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: 'topic', difficulty: 'medium', numQuestions: 10, timer: 0, selectedRecentTopics: [], 
    }
  });

  const sourceType = watch('sourceType');
  const selectedRecentTopicsWatch = watch('selectedRecentTopics');

  const handleSubmitTest = useCallback((autoSubmitted = false) => {
    setTestState(prev => {
      if (!prev || prev.showResults) return prev;
      let currentScore = 0;
      const updatedQuestions = prev.questions.map((q, index) => {
        const userAnswer = prev.userAnswers[index];
        const isCorrect = userAnswer !== undefined && q.answer !== undefined && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
        if (isCorrect) currentScore += 4;
        else if (userAnswer !== undefined && userAnswer.trim() !== "") currentScore -= 1;
        return { ...q, userAnswer, isCorrect };
      });
      const percentage = (currentScore / (prev.questions.length * 4)) * 100;
      const tag = percentage >= 90 ? t('customTest.results.performance.ace') : percentage >= 70 ? t('customTest.results.performance.gold') : t('customTest.results.performance.practice');
      updateQuest('testsAttempted');
      return { ...prev, questions: updatedQuestions, score: currentScore, showResults: true, performanceTag: tag };
    });
  }, [t, updateQuest]);

  const onSubmit: SubmitHandler<FormData> = useCallback(async (data) => {
    playActionSound();
    setIsLoading(true);
    try {
      const result = await generateQuizAction({
        topic: data.sourceType === 'topic' ? data.topics || '' : 'Custom Test',
        numQuestions: data.numQuestions,
        difficulty: data.difficulty,
        notes: data.sourceType === 'notes' ? data.notes : undefined,
      });
      if (result.questions?.length > 0) {
        setTestState({
          settings: data, questions: result.questions, userAnswers: Array(result.questions.length).fill(undefined),
          currentQuestionIndex: 0, showResults: false, score: 0, timeLeft: data.timer ? data.timer * 60 : undefined
        });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  }, [playActionSound, toast]);

  useEffect(() => { setVoicePreference('interviewer'); }, [setVoicePreference]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RECENT_TOPICS_LS_KEY);
      if (stored) setRecentTopics(JSON.parse(stored).slice(0, MAX_RECENT_TOPICS_DISPLAY));
    }
  }, []);

  if (authLoading || !isReady) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (user?.isAnonymous) return <GuestLock featureName="customTest.pageTitle" featureDescription="guestLock.features.customTestDesc" Icon={TestTubeDiagonal} />;

  if (!testState) {
    return (
      <div className="py-8 max-w-4xl mx-auto px-4">
        <Card className="glass-card shadow-2xl relative overflow-hidden">
          <CardHeader className="text-center py-10">
            <TestTubeDiagonal className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold">{t('customTest.pageTitle')}</CardTitle>
            <CardDescription>{t('customTest.pageDescription')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
               <Controller name="sourceType" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                    <Label className="flex items-center gap-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 flex-1">
                      <RadioGroupItem value="topic" /> {t('customTest.source.topic')}
                    </Label>
                    <Label className="flex items-center gap-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 flex-1">
                      <RadioGroupItem value="notes" /> {t('customTest.source.notes')}
                    </Label>
                  </RadioGroup>
               )} />
               {sourceType === 'topic' && <Input {...register('topics')} placeholder={t('customTest.topic.placeholder')} className="h-12" />}
               {sourceType === 'notes' && <Textarea {...register('notes')} placeholder={t('customTest.notes.placeholder')} rows={6} />}
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('customTest.settings.difficulty.label')}</Label>
                    <Controller name="difficulty" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">{t('customTest.settings.difficulty.easy')}</SelectItem>
                          <SelectItem value="medium">{t('customTest.settings.difficulty.medium')}</SelectItem>
                          <SelectItem value="hard">{t('customTest.settings.difficulty.hard')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('customTest.settings.numQuestions.label')}</Label>
                    <Input type="number" {...register('numQuestions')} />
                  </div>
               </div>
            </CardContent>
            <CardFooter className="pb-10">
              <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                {t('customTest.generateButton.default')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  const currentQ = testState.questions[testState.currentQuestionIndex];

  return (
    <div className="py-8 max-w-4xl mx-auto px-4">
      <Card className="glass-card shadow-2xl overflow-hidden">
        <CardHeader className="border-b bg-card/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-primary">{t('customTest.test.questionProgress', { current: testState.currentQuestionIndex + 1, total: testState.questions.length })}</CardTitle>
            {testState.timeLeft !== undefined && <div className="font-mono text-lg flex items-center gap-2"><Clock className="h-4 w-4" /> {Math.floor(testState.timeLeft/60)}:{(testState.timeLeft%60).toString().padStart(2,'0')}</div>}
          </div>
          <Progress value={((testState.currentQuestionIndex + 1) / testState.questions.length) * 100} className="h-2 mt-4" />
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="text-xl font-bold"><ReactMarkdown>{currentQ.question}</ReactMarkdown></div>
          <RadioGroup 
            onValueChange={(val) => {
              const answers = [...testState.userAnswers];
              answers[testState.currentQuestionIndex] = val;
              setTestState({ ...testState, userAnswers: answers });
              playClickSound();
            }}
            value={testState.userAnswers[testState.currentQuestionIndex]}
            className="space-y-3"
          >
            {currentQ.options?.map((opt, i) => (
              <Label key={i} className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/30 cursor-pointer">
                <RadioGroupItem value={opt} /> {opt}
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="outline" onClick={() => setTestState({ ...testState, currentQuestionIndex: Math.max(0, testState.currentQuestionIndex - 1) })} disabled={testState.currentQuestionIndex === 0}>{t('customTest.test.previousButton')}</Button>
          {testState.currentQuestionIndex < testState.questions.length - 1 ? (
             <Button onClick={() => setTestState({ ...testState, currentQuestionIndex: testState.currentQuestionIndex + 1 })}>{t('customTest.test.nextButton')}</Button>
          ) : (
             <Button onClick={() => handleSubmitTest()} className="font-bold">{t('customTest.test.submitButton')}</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
