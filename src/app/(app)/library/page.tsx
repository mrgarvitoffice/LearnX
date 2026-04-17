
"use client";

import { useState, useEffect, useRef, type FormEvent, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OTHER_RESOURCES } from '@/lib/constants';
import { getTranslatedMathFact } from '@/lib/actions/fact-actions';
import type { MathFact, YoutubeVideoItem, GoogleBookItem, QueryError, YoutubeSearchInput, GoogleBooksSearchInput, YoutubeSearchOutput, GoogleBooksSearchOutput } from '@/lib/types';
import { ResourceCard } from '@/components/features/library/ResourceCard';
import { YoutubeVideoResultItem } from '@/components/features/library/YoutubeVideoResultItem';
import { BookResultItem } from '@/components/features/library/BookResultItem';
import { BookMarked, Search, Youtube, Lightbulb, BookOpen, Brain, ExternalLink, Loader2, Quote, Video, X, Mic, AlertTriangle, RefreshCw, Calculator as CalculatorIcon, Sigma, Variable, Bot, Shapes } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { directYoutubeSearch, directGoogleBooksSearch } from '@/lib/actions'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { useSound } from '@/hooks/useSound';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useAssistant } from '@/contexts/AssistantContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScientificCalculator } from '@/components/features/calculator/ScientificCalculator';
import { UnitConverter } from '@/components/features/calculator/UnitConverter';
import { MatrixCalculator } from '@/components/features/calculator/MatrixCalculator';
import { EquationSolver } from '@/components/features/calculator/EquationSolver';
import { StatsCalculator } from '@/components/features/calculator/StatsCalculator';

const calculatorTabs = [
    { value: 'scientific', label: 'Scientific', Icon: CalculatorIcon },
    { value: 'matrix', label: 'Matrix', Icon: Bot },
    { value: 'equation', label: 'Equation', Icon: Variable },
    { value: 'stats', label: 'Statistics', Icon: Sigma },
    { value: 'unit', label: 'Unit Converter', Icon: Shapes },
];


export default function LibraryPage() {
  const searchParams = useSearchParams();
  const [youtubeSearchTerm, setYoutubeSearchTerm] = useState('');
  const [googleBooksSearchTerm, setGoogleBooksSearchTerm] = useState('');
  
  const [youtubeResults, setYoutubeResults] = useState<YoutubeVideoItem[]>([]);
  const [selectedYoutubeVideo, setSelectedYoutubeVideo] = useState<YoutubeVideoItem | null>(null);

  const [googleBooksResults, setGoogleBooksResults] = useState<GoogleBookItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<GoogleBookItem | null>(null);
  
  const { speak, setVoicePreference } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const searchTriggeredRef = useRef(false);

  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { volume: 0.4, priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { t, isReady } = useTranslation();
  const { appLanguage } = useSettings();
  const { lastAssistantAction, setLastAssistantAction, dialogToOpen, setDialogToOpen, textToType, setTextToType } = useAssistant();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);


  const { isListening, transcript, startListening, stopListening, error: voiceError, browserSupportsSpeechRecognition } = useVoiceRecognition();
  const [voiceSearchTarget, setVoiceSearchTarget] = useState<'youtube' | 'books' | null>(null);
  
  useEffect(() => {
    if (dialogToOpen === 'calculator') {
      setIsCalculatorOpen(true);
      setDialogToOpen(null); // Reset the trigger
    }
  }, [dialogToOpen, setDialogToOpen]);
  
  useEffect(() => {
    if (textToType) {
        if (textToType.targetId === 'youtube-search') {
            setYoutubeSearchTerm(textToType.text);
        } else if (textToType.targetId === 'books-search') {
            setGoogleBooksSearchTerm(textToType.text);
        }
        setTextToType(null);
    }
  }, [textToType, setTextToType]);

  useEffect(() => {
    if (!isReady || pageTitleSpokenRef.current) return;
    const PAGE_TITLE = t('library.title');
    const timer = setTimeout(() => {
        speak(PAGE_TITLE, { priority: 'optional' });
        pageTitleSpokenRef.current = true;
    }, 500);

    return () => clearTimeout(timer);
  }, [speak, t, isReady]);
  
  const youtubeSearchMutation = useMutation<YoutubeSearchOutput, QueryError, YoutubeSearchInput>({
    mutationFn: directYoutubeSearch, 
    onSuccess: (data) => {
      if (data.videos && data.videos.length > 0) {
        setYoutubeResults(data.videos);
        toast({ title: t('library.youtube.toast.successTitle'), description: t('library.youtube.toast.successDesc', { count: data.videos.length }) });
      } else {
        setYoutubeResults([]);
        toast({ title: t('library.youtube.toast.noResultsTitle'), description: t('library.youtube.toast.noResultsDesc') });
      }
    },
    onError: (error) => {
      console.error("YouTube search error:", error);
      toast({ title: t('library.youtube.toast.errorTitle'), description: error.message || t('library.youtube.toast.errorDesc'), variant: "destructive" });
      setYoutubeResults([]);
    }
  });

  const googleBooksSearchMutation = useMutation<GoogleBooksSearchOutput, QueryError, GoogleBooksSearchInput>({
    mutationFn: directGoogleBooksSearch, 
    onSuccess: (data) => {
      if (data.books && data.books.length > 0) {
        setGoogleBooksResults(data.books);
        toast({ title: t('library.books.toast.successTitle'), description: t('library.books.toast.successDesc', { count: data.books.length }) });
      } else {
        setGoogleBooksResults([]);
        toast({ title: t('library.books.toast.noResultsTitle'), description: t('library.books.toast.noResultsDesc') });
      }
    },
    onError: (error) => {
      console.error("Google Books search error:", error);
      toast({ title: t('library.books.toast.errorTitle'), description: error.message || t('library.books.toast.errorDesc'), variant: "destructive" });
      setGoogleBooksResults([]);
    }
  });

  const handleYoutubeSearchSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();
    if (youtubeSearchTerm.trim()) {
      playActionSound();
      speak(t('library.youtube.speak.searching', { term: youtubeSearchTerm.trim() }), { priority: 'optional' });
      setYoutubeResults([]); 
      youtubeSearchMutation.mutate({ query: youtubeSearchTerm.trim(), maxResults: 12 });
      if (isListening && voiceSearchTarget === 'youtube') stopListening();
      setVoiceSearchTarget(null);
    }
  }, [youtubeSearchTerm, playActionSound, speak, t, isListening, voiceSearchTarget, stopListening, youtubeSearchMutation]);

  const handleGoogleBooksSearchSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();
    if (googleBooksSearchTerm.trim()) {
      playActionSound();
      speak(t('library.books.speak.searching', { term: googleBooksSearchTerm.trim() }), { priority: 'optional' });
      setGoogleBooksResults([]); 
      googleBooksSearchMutation.mutate({ query: googleBooksSearchTerm.trim(), maxResults: 12 });
      if (isListening && voiceSearchTarget === 'books') stopListening();
      setVoiceSearchTarget(null);
    }
  }, [googleBooksSearchTerm, playActionSound, speak, t, isListening, voiceSearchTarget, stopListening, googleBooksSearchMutation]);

  useEffect(() => {
    const feature = searchParams.get('feature');
    const query = searchParams.get('query');

    if (query && !searchTriggeredRef.current) {
      if (feature === 'youtube') {
        setYoutubeSearchTerm(query);
        handleYoutubeSearchSubmit();
      } else if (feature === 'books') {
        setGoogleBooksSearchTerm(query);
        handleGoogleBooksSearchSubmit();
      }
      searchTriggeredRef.current = true;
    }
  }, [searchParams, handleYoutubeSearchSubmit, handleGoogleBooksSearchSubmit]);


  useEffect(() => {
    if (transcript && voiceSearchTarget) {
      if (voiceSearchTarget === 'youtube') setYoutubeSearchTerm(transcript);
      else if (voiceSearchTarget === 'books') setGoogleBooksSearchTerm(transcript);
    }
  }, [transcript, voiceSearchTarget]);

  useEffect(() => {
    if (voiceError) toast({ title: t('chatbot.voiceError.title'), description: voiceError, variant: "destructive" });
  }, [voiceError, toast, t]);

  const handleMicClick = (target: 'youtube' | 'books') => {
    playClickSound();
    if (isListening && voiceSearchTarget === target) {
      stopListening();
      setVoiceSearchTarget(null);
    } else {
      if (target === 'youtube') setYoutubeSearchTerm('');
      else if (target === 'books') setGoogleBooksSearchTerm('');
      startListening();
      setVoiceSearchTarget(target);
    }
  };

  const { data: mathFact, isLoading: isLoadingMathFact, isError: isErrorMathFact, refetch: refetchMathFact } = useQuery<MathFact>({
    queryKey: ['mathFact', appLanguage],
    queryFn: () => getTranslatedMathFact(appLanguage),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 65,
    refetchOnWindowFocus: false,
  });

  const handleSpeak = useCallback((textToSpeak: string | undefined) => {
      if (!textToSpeak) return;
      speak(textToSpeak, { priority: 'manual' });
      setLastAssistantAction(null); // Clear the trigger
  }, [speak, setLastAssistantAction]);

  useEffect(() => {
    if (lastAssistantAction?.action === 'speak_text' && lastAssistantAction?.params?.contentType === 'math_fact' && mathFact) {
        handleSpeak(mathFact.fact);
    }
  }, [lastAssistantAction, mathFact, handleSpeak]);

  const handleRefreshMathFact = () => {
    playClickSound(); refetchMathFact();
    speak(t('library.mathFact.speak.fetching'), { priority: 'optional' });
  };

  const openBookInViewer = (book: GoogleBookItem) => {
    playClickSound();
    const bookPreviewUrl = book.previewLink || book.webReaderLink || book.infoLink || `https://books.google.com/books?id=${book.bookId}`;
    if (book.embeddable) {
      setSelectedBook(book);
    }
    else {
      window.open(bookPreviewUrl, '_blank', 'noopener,noreferrer');
      toast({ title: t('library.books.toast.openingExternalTitle'), description: t('library.books.toast.openingExternalDesc') });
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-8 space-y-12 max-w-7xl mx-auto px-4">
      <Card 
        className="shadow-xl relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/icons/bg2.jpg')" }}
      >
        <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
        <div className="relative z-10">
            <CardHeader className="text-center py-12">
              <div className="flex items-center justify-center mb-4"><BookMarked className="h-16 w-16 text-primary" /></div>
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">{t('library.title')}</CardTitle>
              <CardDescription className="text-lg lg:text-xl max-w-2xl mx-auto">{t('library.description')}</CardDescription>
            </CardHeader>
        </div>
      </Card>
      
      <Card 
        className="bg-secondary/30 border-orange-500/30 hover:shadow-xl transition-shadow duration-300 group relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/icons/bg1.jpg')" }}
      >
        <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
        <div className="relative z-10">
            <CardHeader className="pb-2 pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="h-8 w-8 text-orange-500/80 group-hover:text-orange-600 transition-colors" />
                <CardTitle className="text-2xl font-semibold text-orange-600 dark:text-orange-500">{t('library.mathFact.title')}</CardTitle>
              </div>
              {isLoadingMathFact ? (
                <div className="flex items-center justify-center space-x-2 text-muted-foreground p-6 min-h-[160px]"><Loader2 className="h-6 w-6 animate-spin" /><span>{t('library.mathFact.loading')}</span></div>
              ) : isErrorMathFact ? (
                 <div className="flex items-center justify-center space-x-2 text-destructive p-6 min-h-[160px]"><AlertTriangle className="h-6 w-6" /><span>{t('library.mathFact.error')}</span></div>
              ) : mathFact ? (
                <CardDescription className="text-xl md:text-2xl text-orange-700 dark:text-orange-400 font-medium pt-1 italic p-6 min-h-[160px] flex items-center justify-center text-center">
                  "{mathFact.fact}"
                </CardDescription>
              ) : (
                <CardDescription className="text-xl text-muted-foreground p-6 min-h-[160px] flex items-center justify-center">{t('library.mathFact.error')}</CardDescription>
              )}
            </CardHeader>
            <CardFooter className="pt-2 pb-6 flex justify-center sm:justify-start">
              <Button onClick={handleRefreshMathFact} variant="outline" size="lg" disabled={isLoadingMathFact} className="bg-background/70 group-hover:border-orange-500/50 group-hover:text-orange-600 transition-colors">
                {isLoadingMathFact ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <RefreshCw className="w-5 w-5 mr-2"/>} {t('library.mathFact.newButton')}
              </Button>
            </CardFooter>
        </div>
      </Card>

      <section>
        <Card 
            className="relative overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: "url('/icons/1.jpg')" }}
        >
            <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
            <div className="relative z-10">
              <CardHeader className="py-8"><CardTitle className="text-2xl lg:text-3xl flex items-center gap-3"><Youtube className="w-8 h-8 text-red-500" />{t('library.youtube.title')}</CardTitle></CardHeader>
              <form onSubmit={handleYoutubeSearchSubmit}>
                <CardContent className="flex gap-3 items-center px-8">
                  <Input id="youtube-search" className="h-12 text-lg" type="search" placeholder={t('library.youtube.placeholder')} value={youtubeSearchTerm} onChange={(e) => setYoutubeSearchTerm(e.target.value)} disabled={youtubeSearchMutation.isPending}/>
                  {browserSupportsSpeechRecognition && (
                    <Button type="button" variant="ghost" size="icon" className="h-12 w-12" onClick={() => handleMicClick('youtube')} disabled={youtubeSearchMutation.isPending} title={t('generate.useVoiceInput')}>
                      <Mic className={`w-6 h-6 ${isListening && voiceSearchTarget === 'youtube' ? 'text-destructive animate-pulse' : ''}`} />
                    </Button>
                  )}
                  <Button type="submit" size="lg" className="h-12 px-8" disabled={youtubeSearchMutation.isPending || !youtubeSearchTerm.trim()}>
                    {youtubeSearchMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} {t('library.searchButton')}
                  </Button>
                </CardContent>
              </form>
              {youtubeSearchMutation.isPending && youtubeResults.length === 0 && (
                <div className="px-8 pb-12 flex items-center justify-center space-x-3 text-muted-foreground h-48">
                    <Loader2 className="h-8 w-8 animate-spin" /><span>{t('library.youtube.searching')}</span>
                </div>
              )}
              {youtubeResults.length > 0 && (
                <div className="px-8 pb-12">
                  <h3 className="text-xl font-semibold mb-4 mt-6">{t('library.resultsTitle')}:</h3>
                  <ScrollArea className="h-[500px] w-full pr-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {youtubeResults.map(video => (
                        <YoutubeVideoResultItem
                          key={video.videoId}
                          video={video}
                          onPlay={() => { playClickSound(); setSelectedYoutubeVideo(video);}}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              {!youtubeSearchMutation.isPending && youtubeSearchMutation.isSuccess && youtubeResults.length === 0 && (
                <div className="px-8 pb-12 text-center text-muted-foreground h-48 flex flex-col justify-center items-center">
                    <Video className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-lg">{t('library.youtube.noResults', { term: youtubeSearchTerm })}</p>
                </div>
              )}
          </div>
        </Card>
      </section>

      {selectedYoutubeVideo && (
        <Dialog open={!!selectedYoutubeVideo} onOpenChange={(isOpen) => { if (!isOpen) setSelectedYoutubeVideo(null); }}>
          <DialogContent className="max-w-5xl lg:max-w-7xl p-0 border-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
            <DialogHeader className="sr-only"><DialogTitle>{selectedYoutubeVideo.title}</DialogTitle></DialogHeader>
            <div className="aspect-video relative">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${selectedYoutubeVideo.videoId}?autoplay=1`} title={selectedYoutubeVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="rounded-lg"></iframe>
              <DialogClose asChild><Button variant="ghost" size="icon" className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 z-10" aria-label="Close video player"><X className="h-6 w-6" /></Button></DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedBook && (
        <Dialog open={!!selectedBook} onOpenChange={(isOpen) => { if (!isOpen) setSelectedBook(null); }}>
          <DialogContent className="max-w-6xl lg:max-w-7xl xl:max-w-screen-2xl w-[95vw] h-[90vh] flex flex-col p-0 border-0">
            <DialogHeader className="p-4 flex-row items-center justify-between border-b">
              <DialogTitle className="truncate text-lg lg:text-xl font-bold">{selectedBook.title}</DialogTitle>
              <DialogClose asChild><Button variant="ghost" size="icon"><X className="h-6 w-6" /></Button></DialogClose>
            </DialogHeader>
            <div className="flex-1 w-full h-full">
              <iframe src={`https://books.google.com/books?id=${selectedBook.bookId}&pg=PP1&output=embed`} title={`Read ${selectedBook.title}`} className="w-full h-full border-0" allow="fullscreen"></iframe>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Card 
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/icons/3.jpg')" }}
      >
        <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
        <div className="relative z-10">
            <CardHeader className="py-8">
              <CardTitle className="text-2xl lg:text-3xl flex items-center gap-3"><CalculatorIcon className="h-8 w-8 text-primary" /> {t('calculator.title')}</CardTitle>
              <CardDescription className="text-lg">
                A powerful suite of tools for all your calculation needs, accessible in a click.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-12">
                <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
                    <DialogTrigger asChild>
                        <Button id="calculator-dialog-trigger" className="w-full h-16 text-xl lg:text-2xl font-bold" size="lg">Open Advanced Calculator</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl lg:max-w-7xl w-[95vw] p-0">
                        <DialogHeader className="p-5 border-b">
                          <DialogTitle className="text-2xl lg:text-3xl font-bold">Advanced Calculator</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="scientific" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto rounded-t-lg rounded-b-none p-1 bg-muted/50">
                                {calculatorTabs.map(({ value, label, Icon }) => (
                                    <TabsTrigger key={value} value={value} className="py-3 text-sm md:text-base lg:text-lg">
                                        <Icon className="w-5 h-5 mr-2"/>{label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="p-4 sm:p-8 max-h-[75vh] overflow-y-auto">
                                <TabsContent value="scientific">
                                    <ScientificCalculator />
                                </TabsContent>
                                <TabsContent value="matrix">
                                    <MatrixCalculator />
                                </TabsContent>
                                <TabsContent value="equation">
                                    <EquationSolver />
                                </TabsContent>
                                <TabsContent value="stats">
                                    <StatsCalculator />
                                </TabsContent>
                                <TabsContent value="unit">
                                    <UnitConverter />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </div>
      </Card>

      <section>
        <Card 
            className="relative overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: "url('/icons/1.jpg')" }}
        >
          <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
          <div className="relative z-10">
              <CardHeader className="py-8"><CardTitle className="text-2xl lg:text-3xl flex items-center gap-3"><BookOpen className="w-8 h-8 text-blue-500" />{t('library.books.title')}</CardTitle></CardHeader>
              <form onSubmit={handleGoogleBooksSearchSubmit}>
                <CardContent className="flex gap-3 items-center px-8">
                  <Input id="books-search" className="h-12 text-lg" type="search" placeholder={t('library.books.placeholder')} value={googleBooksSearchTerm} onChange={(e) => setGoogleBooksSearchTerm(e.target.value)} disabled={googleBooksSearchMutation.isPending}/>
                   {browserSupportsSpeechRecognition && (
                      <Button type="button" variant="ghost" size="icon" className="h-12 w-12" onClick={() => handleMicClick('books')} disabled={googleBooksSearchMutation.isPending} title={t('generate.useVoiceInput')}>
                        <Mic className={`w-6 h-6 ${isListening && voiceSearchTarget === 'books' ? 'text-destructive animate-pulse' : ''}`} />
                      </Button>
                   )}
                  <Button type="submit" size="lg" className="h-12 px-8" disabled={googleBooksSearchMutation.isPending || !googleBooksSearchTerm.trim()}>
                    {googleBooksSearchMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} {t('library.searchButton')}
                  </Button>
                </CardContent>
              </form>
              {googleBooksSearchMutation.isPending && googleBooksResults.length === 0 && (
                <div className="px-8 pb-12 flex items-center justify-center space-x-3 text-muted-foreground h-48">
                    <Loader2 className="h-8 w-8 animate-spin" /><span>{t('library.books.searching')}</span>
                </div>
              )}
              {googleBooksResults.length > 0 && (
                <div className="px-8 pb-12">
                  <h3 className="text-xl font-semibold mb-4 mt-6">{t('library.resultsTitle')}:</h3>
                  <ScrollArea className="h-[500px] w-full pr-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {googleBooksResults.map(book => (
                        <BookResultItem key={book.bookId} book={book} onPreviewRequest={openBookInViewer} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              {!googleBooksSearchMutation.isPending && googleBooksSearchMutation.isSuccess && googleBooksResults.length === 0 && (
                <div className="px-8 pb-12 text-center text-muted-foreground h-48 flex flex-col justify-center items-center">
                    <BookOpen className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-lg">{t('library.books.noResults', { term: googleBooksSearchTerm })}</p>
                </div>
              )}
          </div>
        </Card>
      </section>

      <section className="px-4">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 flex items-center gap-3">
          <BookMarked className="h-8 w-8 text-primary" />
          {t('library.resources.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {OTHER_RESOURCES.map(resource => <ResourceCard key={resource.title} title={resource.title} description={resource.description} link={resource.link} icon={resource.icon} linkText={t('library.resources.visitSite')}/>)}
        </div>
      </section>
    </div>
  );
}
