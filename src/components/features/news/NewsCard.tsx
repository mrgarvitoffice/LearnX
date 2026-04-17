
"use client";

import type { NewsArticle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CalendarDays, Globe, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';
import { useProgression } from '@/contexts/ProgressionContext';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const { t, isReady } = useTranslation();
  const { updateQuest } = useProgression();
  
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  useEffect(() => {
    const placeholderTextContent = article.title?.substring(0, 25) || article.category?.[0] || 'News';
    const placeholderImage = `https://placehold.co/600x400.png?text=${encodeURIComponent(placeholderTextContent)}`;
    setCurrentImageSrc(article.image_url || placeholderImage);
    setImageLoadError(false);
  }, [article.article_id, article.link, article.image_url, article.title, article.category]);

  if (!isReady) {
    return (
      <Card className="flex flex-col h-full overflow-hidden">
        <Skeleton className="h-48 w-full" />
        <CardHeader className="pb-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
        <CardContent className="flex-grow pb-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent>
        <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
      </Card>
    );
  }

  const placeholderTextContent = article.title?.substring(0, 25) || article.category?.[0] || 'News';
  const placeholderImageWithText = `https://placehold.co/600x400.png?text=${encodeURIComponent(placeholderTextContent)}`;
  const dataAiHintForPlaceholder = placeholderTextContent.toLowerCase().split(' ').slice(0, 2).join(' ');

  const handleError = () => {
    if (currentImageSrc === placeholderImageWithText) {
      setImageLoadError(true);
    } else {
      setCurrentImageSrc(placeholderImageWithText);
    }
  };

  const formattedDate = article.pubDate
    ? format(new Date(article.pubDate), "do MMM ''yy")
    : t('news.card.dateNotAvailable');

  const handleReadMore = () => {
    updateQuest('newsRead');
    window.open(article.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-48 overflow-hidden bg-muted flex items-center justify-center">
        {imageLoadError ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
            <ImageOff className="w-10 h-10 mb-1" />
            <span className="text-xs text-center">{t('news.card.imageUnavailable')}</span>
          </div>
        ) : (
          <img
            src={currentImageSrc}
            alt={article.title || "News article image"}
            className="w-full h-full object-cover"
            onError={handleError}
            loading="lazy"
            data-ai-hint={article.title?.toLowerCase().split(' ').slice(0,2).join(' ') || 'news article'}
          />
        )}
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {article.source_id}</span>
          {article.pubDate && (
             <span className="flex items-center gap-1 mt-1">
                <CalendarDays className="w-3 h-3" />
                {formattedDate}
             </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {article.description || t('news.card.noDescription')}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleReadMore} variant="outline" size="sm" className="w-full">
            {t('news.card.readMore')} <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
