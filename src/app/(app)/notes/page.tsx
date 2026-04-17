
"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mic, FileSignature, Loader2, AlertTriangle, ImageIcon, XCircle, FileText, AudioLines, Video, School, Sparkles } from "lucide-react"; 
import Image from 'next/image';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useSettings } from '@/contexts/SettingsContext';
import { useQuests } from '@/contexts/QuestContext';
import { useProgression } from '@/contexts/ProgressionContext';

import { generateNotesAction } from "@/lib/actions";
import type { CombinedStudyMaterialsOutput } from '@/lib/types'; 
import { useTranslation } from '@/hooks/useTranslation';
import { extractTextFromPdf } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const RECENT_TOPICS_LS_KEY = "learnmint-recent-topics";
const LOCALSTORAGE_KEY_PREFIX = "learnmint-study-";

export default function GenerateNotesPage() {
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const { toast } = useToast(); 
  const { t, isReady } = useTranslation();
  const { completeQuest1 } = useQuests();
  const { updateQuest } = useProgression();

  const [topic, setTopic] = useState<string>("");
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);

  const [audioData, setAudioData] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [notesError, setNotesError] = useState<string | null>(null);

  const { speak, setVoicePreference } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });

  const pageTitleSpokenRef = useRef(false);
  const generationTriggeredRef = useRef(false);
  
  useEffect(() => {
    setVoicePreference('holo'); 
  }, [setVoicePreference]);

  const getCacheKey = (type: string, topicKey: string) => `${LOCALSTORAGE_KEY_PREFIX}${type}-${topicKey.toLowerCase().replace(/\s+/g, '-')}`;

  const handleGenerateAllMaterials = useCallback(async (topicOverride?: string) => {
    playActionSound(); 

    const topicToUse = topicOverride || topic;
    if (topicToUse.trim().length < 3 && !pdfText && !imageData) {
      toast({ title: t('generate.toast.invalidTopic'), description: "Subject signature too short. Minimum 3 characters.", variant: "destructive" });
      return;
    }

    setNotesError(null);
    setIsLoadingAll(true);
    pageTitleSpokenRef.current = true; 

    speak("Initializing neural synthesis. Please stand by.", { priority: 'optional' });

    const trimmedTopic = topicToUse.trim() || `Node ${new Date().getTime()}`;
    
    try {
      const combinedResult: CombinedStudyMaterialsOutput = await generateNotesAction({ 
        topic: trimmedTopic, 
        image: imageData || undefined,
        notes: pdfText || undefined,
        audio: audioData || undefined,
        video: videoData || undefined,
      });

      if (combinedResult.notesOutput?.notes) {
        localStorage.setItem(getCacheKey("notes", trimmedTopic), JSON.stringify(combinedResult.notesOutput));
        if (combinedResult.quizOutput?.questions?.length) {
            localStorage.setItem(getCacheKey("quiz", trimmedTopic), JSON.stringify(combinedResult.quizOutput));
        }
        if (combinedResult.flashcardsOutput?.flashcards?.length) {
            localStorage.setItem(getCacheKey("flashcards", trimmedTopic), JSON.stringify(combinedResult.flashcardsOutput));
        }

        const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
        let recentTopicsArray = storedTopics ? JSON.parse(storedTopics) : [];
        if (!recentTopicsArray.includes(trimmedTopic)) {
          recentTopicsArray.unshift(trimmedTopic);
          localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(recentTopicsArray.slice(0, 10)));
        }

        completeQuest1(); 
        updateQuest('notesCreated');
        
        toast({ title: "Synthesis Complete", description: `Knowledge node for "${trimmedTopic}" mapped successfully.` });
        speak("Knowledge node mapped. Entering study hub.", { priority: 'essential' });
        router.push(`/study?topic=${encodeURIComponent(trimmedTopic)}`);
      } else {
        throw new Error(combinedResult.notesError || "Neural core failed to respond.");
      }
    } catch (err: any) { 
      setNotesError(err.message);
      toast({ title: "Synthesis Interrupted", description: err.message, variant: 'destructive' });
    } finally {
      setIsLoadingAll(false);
    }
  }, [topic, imageData, pdfText, audioData, videoData, playActionSound, toast, t, speak, router, completeQuest1, updateQuest]);

  useEffect(() => {
    const topicFromUrl = searchParams.get('topic');
    if (topicFromUrl && !generationTriggeredRef.current) {
      const decodedTopic = decodeURIComponent(topicFromUrl);
      setTopic(decodedTopic);
      handleGenerateAllMaterials(decodedTopic);
      generationTriggeredRef.current = true;
    }
  }, [searchParams, handleGenerateAllMaterials]);

  useEffect(() => {
    if (!isReady || pageTitleSpokenRef.current || isLoadingAll) return;
    const timer = setTimeout(() => {
      speak(t('generate.title'), { priority: 'optional' });
      pageTitleSpokenRef.current = true;
    }, 800);
    return () => clearTimeout(timer);
  }, [speak, isLoadingAll, t, isReady]);

  useEffect(() => { if (transcript) setTopic(transcript); }, [transcript]);

  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) stopListening();
    else { setTopic(""); startListening(); }
  }, [isListening, startListening, stopListening, playClickSound]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (file) {
      handleRemoveFile(false); 
      setIsProcessingFile(true);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => { setImagePreview(reader.result as string); setImageData(reader.result as string); };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        setPdfFileName(file.name);
        try {
          const text = await extractTextFromPdf(file);
          setPdfText(text);
          toast({ title: "Node Injected", description: "PDF text synchronized." });
        } catch (err: any) {
          toast({ title: "Injection Error", description: "Could not sync PDF data.", variant: "destructive" });
          setPdfFileName(null);
        }
      } else if (file.type.startsWith('audio/')) {
        setAudioFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => { setAudioData(reader.result as string); };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        setVideoFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => { setVideoData(reader.result as string); };
        reader.readAsDataURL(file);
      }
      setIsProcessingFile(false);
    }
  };

  const handleRemoveFile = (withSound = true) => {
    if (withSound) playClickSound();
    setImagePreview(null); setImageData(null);
    setPdfFileName(null); setPdfText(null);
    setAudioData(null); setVideoData(null);
    setAudioFileName(null); setVideoFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  if (!isReady) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="py-8 space-y-12 max-w-7xl mx-auto px-4">
      <Card className="w-full shadow-2xl relative overflow-hidden border-primary/20 bg-card/60 backdrop-blur-md">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-10">
            <source src="/icons/v1.mp4" type="video/mp4" />
        </video>
        <CardHeader className="text-center py-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10 ring-2 ring-primary/20 animate-pulse">
                <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl sm:text-5xl font-black text-primary uppercase tracking-tighter">{t('generate.title')}</CardTitle>
          <CardDescription className="text-base sm:text-lg lg:text-xl text-muted-foreground px-2 max-w-2xl mx-auto mt-4 font-bold">
            {t('generate.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-10">
          <div className="flex items-center gap-3">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('generate.placeholder')}
              className="flex-1 h-16 text-lg sm:text-2xl py-3 px-6 bg-background/50 border-primary/20 focus-visible:ring-primary font-bold"
              onKeyDown={(e) => e.key === 'Enter' && !isLoadingAll && handleGenerateAllMaterials()}
              disabled={isLoadingAll}
            />
            <Button type="button" variant="outline" size="icon" className="h-16 w-16 border-primary/20" onClick={() => fileInputRef.current?.click()} disabled={isLoadingAll}>
              {isProcessingFile ? <Loader2 className="w-6 h-6 animate-spin"/> : <ImageIcon className="w-6 h-6 text-primary" />}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf,audio/*,video/*" className="hidden" />
             {browserSupportsSpeechRecognition && (
                <Button variant="outline" size="icon" className="h-16 w-16 border-primary/20" onClick={handleVoiceCommand} disabled={isLoadingAll || isListening}>
                  <Mic className={cn("w-6 h-6", isListening ? 'text-destructive animate-pulse' : 'text-primary')} />
                </Button>
              )}
          </div>
          
          <div className="flex flex-wrap gap-4">
            {imagePreview && (
              <div className="relative w-32 h-32 ring-2 ring-primary/50 rounded-xl overflow-hidden">
                <Image src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" />
                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-8 w-8 bg-destructive text-white rounded-full" onClick={() => handleRemoveFile()}><XCircle className="h-5 w-5" /></Button>
              </div>
            )}
            {pdfFileName && (
                <div className="p-4 border-2 border-primary/30 rounded-xl bg-primary/5 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary" />
                    <span className="text-sm font-black uppercase tracking-tight truncate max-w-[200px]">{pdfFileName}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-8 w-8 text-destructive"><XCircle className="w-5 h-5" /></Button>
                </div>
            )}
            {(audioFileName || videoFileName) && (
              <div className="p-4 border-2 border-primary/30 rounded-xl bg-primary/5 flex items-center gap-3">
                  {audioFileName ? <AudioLines className="w-6 h-6 text-primary" /> : <Video className="w-6 h-6 text-primary" />}
                  <span className="text-sm font-black uppercase tracking-tight truncate max-w-[200px]">{audioFileName || videoFileName}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-8 w-8 text-destructive"><XCircle className="w-5 h-5" /></Button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button onClick={() => handleGenerateAllMaterials()} disabled={isLoadingAll || (!topic.trim() && !pdfText && !imageData)} className="w-full sm:w-auto h-16 text-xl px-12 font-black uppercase tracking-widest transition-all active:scale-95 shadow-primary/20 shadow-2xl">
                {isLoadingAll ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Sparkles className="mr-3 h-6 w-6" />}
                {isLoadingAll ? "SYNTHESIZING..." : "INITIALIZE SYNTHESIS"}
              </Button>
               <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 text-xl font-bold border-primary/30">
                  <Link href="/college"><School className="mr-3 h-6 w-6 text-primary" /> LEARNX COLLEGE</Link>
              </Button>
          </div>
        </CardContent>
      </Card>

      {isLoadingAll && (
        <div className="text-center py-20 space-y-4">
          <div className="relative inline-block">
            <Loader2 className="h-20 w-20 animate-spin text-primary mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 bg-primary rounded-full animate-ping opacity-20" />
            </div>
          </div>
          <p className="text-2xl text-primary font-black uppercase tracking-tighter animate-pulse">Mapping Knowledge Streams...</p>
        </div>
      )}
      {!isLoadingAll && notesError && (
        <Alert variant="destructive" className="max-w-4xl mx-auto border-2 border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-6 w-6" />
          <AlertTitle className="text-lg font-bold">SYNTHESIS ANOMALY</AlertTitle>
          <AlertDescription className="text-base font-medium">{notesError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
