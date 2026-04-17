
"use client";

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Sparkles, AudioLines, Mic, Layers, FileText, Image as ImageIcon, XCircle, PlayCircle, PauseCircle, StopCircle, Users, Download, MonitorPlay } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { generateAudioFlashcardsAction, generateDiscussionAudioAction } from '@/lib/actions';
import type { GenerateAudioFlashcardsOutput } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import FlashcardItem from '@/components/study/FlashcardItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '@/hooks/useTranslation';
import NextImage from 'next/image';
import { extractTextFromPdf } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useTTS } from '@/hooks/useTTS';
import { useAuth } from '@/contexts/AuthContext';
import { GuestLock } from '@/components/features/auth/GuestLock';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_LANGUAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import PptxGenJS from 'pptxgenjs';
import { Logo } from '@/components/icons/Logo';


// Sub-component for Audio Flashcards
function AudioFlashcardsGenerator() {
  const { t } = useTranslation();
  const { appLanguage } = useSettings();
  const [topic, setTopic] = useState('');
  const [numFlashcards, setNumFlashcards] = useState(10);
  const [generatedContent, setGeneratedContent] = useState<GenerateAudioFlashcardsOutput | null>(null);
  const [discussionAudio, setDiscussionAudio] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  const { speak, cancelTTS, isSpeaking, isPaused, pauseTTS, resumeTTS, isLoading: isTTSLoading } = useTTS();

  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioFlashcardsAction,
    onSuccess: (data) => {
      if (!data.flashcards || data.flashcards.length === 0) {
        toast({ title: t('generate.toast.flashcardsError'), description: t('generate.toast.noQuestionsDesc'), variant: 'default' });
        setGeneratedContent(null);
        return;
      }
      setGeneratedContent(data);
      setDiscussionAudio(null);
      toast({ title: t('generate.toast.flashcardsSuccess'), description: t('generate.toast.flashcardsSuccessDesc', { topic: topic, count: data.flashcards.length }) });
    },
    onError: (error) => {
      toast({ title: t('generate.toast.flashcardsError'), description: error.message, variant: "destructive" });
      setGeneratedContent(null);
    }
  });

  const { mutate: generateDiscussion, isPending: isGeneratingDiscussion } = useMutation({
    mutationFn: generateDiscussionAudioAction,
    onSuccess: (data) => {
      setDiscussionAudio(data.audioDataUri);
      toast({ title: t('audioFactory.discussion.successTitle'), description: t('audioFactory.discussion.successDesc') });
    },
    onError: (error) => {
      toast({ title: t('audioFactory.discussion.errorTitle'), description: error.message, variant: "destructive" });
    }
  });

  const handleGenerate = () => {
    playActionSound();
    if (topic.trim().length < 3) {
      toast({ title: t('generate.toast.invalidTopic'), description: t('generate.toast.invalidTopicDesc'), variant: "destructive" });
      return;
    }
    cancelTTS();
    setGeneratedContent(null);
    setDiscussionAudio(null);
    generate({ topic, numFlashcards });
  };
  
  const handleMicClick = () => {
    playClickSound();
    if (isListening) stopListening();
    else startListening();
  };
  
  useEffect(() => { if (transcript) setTopic(transcript); }, [transcript]);

  const handleReadAllFlashcards = () => {
    if (!generatedContent || generatedContent.flashcards.length === 0) return;
    const textToRead = generatedContent.flashcards.map(fc => `${t('audioFactory.flashcards.speakTerm')}: ${fc.term}. ${t('audioFactory.flashcards.speakDefinition')}: ${fc.definition}`).join('\n\n');
    speak(textToRead, { priority: 'manual' });
  }
  
  const handleGenerateDiscussion = () => {
    playActionSound();
    if (!generatedContent || generatedContent.flashcards.length === 0) return;
    const textToConvert = generatedContent.flashcards.map(fc => `${t('audioFactory.flashcards.speakTerm')}: ${fc.term}. ${t('audioFactory.flashcards.speakDefinition')}: ${fc.definition}`).join('\n\n');
    generateDiscussion({ content: textToConvert });
  }

  const handlePlaybackControl = () => {
    playClickSound();
    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else handleReadAllFlashcards();
  }

  const handleDownloadPdf = async () => {
    playClickSound();
    if (!generatedContent) return;
    const { default: html2pdf } = await import('html2pdf.js');
    const element = document.getElementById('flashcards-for-pdf');
    if (!element) return;
    
    const opt = {
      margin: 0.5,
      filename: `LearnX_Flashcards_${topic}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  const handleDownloadPpt = () => {
      playClickSound();
      if (!generatedContent) return;
      toast({ title: "Generating PPTX...", description: "Your presentation is being created." });

      const pptx = new PptxGenJS();
      pptx.defineSlideMaster({
        title: 'LEARNX_MASTER',
        background: { color: '0A0A0C' },
        objects: [
          { 'line': { x: 0.5, y: 5.3, w: 9.0, h: 0, line: { color: 'FF5A2F', width: 1 } } },
          { 'text': { text: 'Generated by LearnX AI', options: { x: 0.5, y: 5.3, w: '90%', h: 0.2, align: 'left', fontFace: 'Arial', fontSize: 10, color: '94A3B8' } } },
          { 'image': { path: '/icons/icon-512x512.png', x: 9.2, y: 0.3, w: 0.5, h: 0.5 } }
        ]
      });
      
      const titleSlide = pptx.addSlide({ masterName: 'LEARNX_MASTER' });
      titleSlide.addText(`Flashcards: ${topic}`, {
        x: 0.5, y: 2.5, w: '90%', h: 1, align: 'center', fontSize: 36, bold: true, color: 'FFFFFF',
        fontFace: 'Arial', shadow: { type: 'outer', color: 'FF5A2F', blur: 3, offset: 2, angle: 45, opacity: 0.6 }
      });

      generatedContent.flashcards.forEach(card => {
          // Term Slide
          const termSlide = pptx.addSlide({ masterName: 'LEARNX_MASTER' });
          termSlide.addText(card.term, { x: 0.5, y: 2.5, w: '90%', h: 1, align: 'center', fontSize: 32, bold: true, color: 'FFFFFF' });

          // Definition Slide
          const defSlide = pptx.addSlide({ masterName: 'LEARNX_MASTER' });
          defSlide.addText(card.definition, { x: 0.5, y: 1.5, w: '90%', h: 3, align: 'center', fontSize: 20, color: 'E2E8F0', lineSpacing: 32 });
      });

      pptx.writeFile({ fileName: `LearnX_Flashcards_${topic}.pptx` });
  };


  return (
    <Card className="shadow-lg border-none card-bg-2">
      <CardHeader>
        <CardTitle>{t('audioFactory.flashcards.title')}</CardTitle>
        <CardDescription>{t('audioFactory.flashcards.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic-input">{t('audioFactory.topic')}</Label>
          <div className="flex gap-2">
            <Input id="topic-input" placeholder={t('generate.placeholder')} value={topic} onChange={(e) => setTopic(e.target.value)} disabled={isLoading} />
            {browserSupportsSpeechRecognition && (
              <Button variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading} title={t('generate.useVoiceInput')}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="num-flashcards">{t('audioFactory.numFlashcards')}: {numFlashcards}</Label>
          <Slider id="num-flashcards" min={5} max={15} step={1} value={[numFlashcards]} onValueChange={(value) => setNumFlashcards(value[0])} disabled={isLoading} />
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button size="lg" onClick={handleGenerate} disabled={isLoading || isGeneratingDiscussion}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
          {t('audioFactory.generate')} {t('audioFactory.tabs.flashcards')}
        </Button>
      </CardFooter>
      {(isLoading || isGeneratingDiscussion) && (
        <CardContent className="text-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground">{isLoading ? t('audioFactory.generating') : t('audioFactory.discussion.generating')}</p>
        </CardContent>
      )}
      {generatedContent && (
        <CardContent>
          <CardTitle className="mb-4 text-lg">{t('audioFactory.generatedContent')}</CardTitle>
          {generatedContent.flashcards.length > 0 && (
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <Button onClick={handlePlaybackControl} disabled={isTTSLoading || isGeneratingDiscussion}>
                {isTTSLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4 mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>}
                {isSpeaking && !isPaused ? t('notesView.speak.pause') : isPaused ? t('notesView.speak.resume') : t('notesView.speak.start')}
              </Button>
              {(isSpeaking || isPaused) && (
                <Button onClick={() => { playClickSound(); cancelTTS() }} variant="ghost" size="icon"><StopCircle className="h-5 w-5" /></Button>
              )}
               <Button onClick={handleGenerateDiscussion} disabled={isGeneratingDiscussion || isLoading}>
                {isGeneratingDiscussion ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Users className="h-4 w-4 mr-2"/>}
                {t('audioFactory.discussion.button')}
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf}><FileText className="mr-2 h-4 w-4"/> PDF</Button>
              <Button variant="outline" onClick={handleDownloadPpt}><MonitorPlay className="mr-2 h-4 w-4"/> PPT</Button>
            </div>
          )}
          {discussionAudio && (
            <div className="my-4">
              <h4 className="font-semibold mb-2">{t('audioFactory.discussion.title')}:</h4>
              <audio controls src={discussionAudio} className="w-full">{t('audioFactory.audioNotSupported')}</audio>
            </div>
          )}
          <ScrollArea className="h-[500px] w-full pr-4">
            <div id="flashcards-for-pdf" className="dark printable-notes-area">
                <div className="hidden print:block text-center p-4 border-b border-border">
                    <Logo size={40} className="mx-auto"/>
                    <h1 className="text-2xl font-bold mt-2" style={{ color: 'hsl(var(--primary))' }}>Flashcards: {topic}</h1>
                    <p className="text-xs text-muted-foreground">Generated by LearnX on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedContent.flashcards.map((card, index) => (
                        <div key={index} className="print:break-inside-avoid" style={{'--card-background': 'hsl(var(--card))', '--card-foreground': 'hsl(var(--card-foreground))', '--secondary-background': 'hsl(var(--secondary))', '--secondary-foreground': 'hsl(var(--secondary-foreground))'}}>
                           <FlashcardItem flashcard={card} className="h-56" />
                        </div>
                    ))}
                </div>
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}

export default function AudioFactoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, isReady: i18nReady } = useTranslation();

  if (authLoading || !i18nReady) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.isAnonymous) {
    return (
      <GuestLock
        featureName="guestLock.features.audioFactory"
        featureDescription="guestLock.features.audioFactoryDesc"
        Icon={AudioLines}
      />
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8 card-bg-1 relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-10">
            <source src="/icons/v4.mp4" type="video/mp4" />
        </video>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <AudioLines className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">{t('audioFactory.title')}</CardTitle>
          <CardDescription className="text-lg">
            {t('audioFactory.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="flashcards" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-8 max-w-md mx-auto">
          <TabsTrigger value="flashcards" className="py-3">
            <Layers className="mr-2 h-5 w-5" /> {t('audioFactory.tabs.flashcards')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards">
          <AudioFlashcardsGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
