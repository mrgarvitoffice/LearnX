
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchNews } from '@/lib/news-api';
import type { NewsArticle } from '@/lib/types';
import { NewsCard } from '@/components/features/news/NewsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Loader2, AlertTriangle, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
import { NewsFilters } from '@/components/features/news/NewsFilters';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/useTTS';
import { useTranslation } from '@/hooks/useTranslation';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { useProgression } from '@/contexts/ProgressionContext';

interface NewsPageFilters {
  query: string;
  country: string;
  stateOrRegion: string;
  city: string;
  category: string;
  language: string;
}

const initialFilters: NewsPageFilters = { query: '', country: '', stateOrRegion: '', city: '', category: 'top', language: 'en' };

export default function NewsPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<NewsPageFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<NewsPageFilters>(initialFilters);
  const { t, isReady } = useTranslation();
  const { userGoal } = useSettings();
  const { updateQuest } = useProgression();
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, setVoicePreference } = useTTS();
  const pageTitleSpokenRef = useRef(false);

  useEffect(() => {
    const cat = searchParams.get('category') || 'top';
    const country = searchParams.get('country') || userGoal?.country || '';
    setAppliedFilters({ ...initialFilters, category: cat, country });
    setFilters({ ...initialFilters, category: cat, country });
  }, [searchParams, userGoal]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['news', appliedFilters],
    queryFn: ({ pageParam }) => fetchNews({ ...appliedFilters, page: pageParam as string }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setVoicePreference('gojo');
    return () => cancelTTS();
  }, [setVoicePreference, cancelTTS]);

  const articles = useMemo(() => data?.pages.flatMap(page => page?.results ?? []) ?? [], [data]);

  if (!isReady) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="py-8 space-y-10 max-w-7xl mx-auto px-4">
      <Card className="shadow-xl relative overflow-hidden glass-card">
        <CardHeader className="text-center py-10">
          <Newspaper className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">{t('news.title')}</CardTitle>
          <CardDescription>{t('news.description')}</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <NewsFilters 
            filters={filters} 
            onFilterChange={(n, v) => setFilters(prev => ({...prev, [n]: v}))} 
            onApplyFilters={() => setAppliedFilters(filters)} 
            onResetFilters={() => {setFilters(initialFilters); setAppliedFilters(initialFilters);}} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
      ) : isError ? (
        <Alert variant="destructive"><AlertTriangle /><AlertTitle>Error</AlertTitle><AlertDescription>{(error as any).message}</AlertDescription></Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, i) => <NewsCard key={i} article={article} />)}
        </div>
      )}
      {hasNextPage && <Button onClick={() => fetchNextPage()} className="mx-auto block" disabled={isFetchingNextPage}>{isFetchingNextPage ? 'Loading...' : t('news.loadMore')}</Button>}
    </div>
  );
}
