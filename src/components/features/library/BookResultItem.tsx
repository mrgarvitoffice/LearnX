

"use client";

import type { GoogleBookItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ExternalLink, BookText } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';

interface BookResultItemProps {
  book: GoogleBookItem;
  onPreviewRequest: (book: GoogleBookItem) => void;
}

export function BookResultItem({ book, onPreviewRequest }: BookResultItemProps) {
  const { t, isReady } = useTranslation();

  if (!isReady) {
    return (
        <Card className="flex flex-col overflow-hidden h-full">
            <CardHeader className="p-3 pb-2">
                <Skeleton className="w-full aspect-[2/3] mb-2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent className="p-3 pt-0 flex-grow space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
            </CardContent>
            <CardFooter className="p-3 pt-1">
                <Skeleton className="h-9 w-full" />
            </CardFooter>
        </Card>
    );
  }

  const placeholderImage = `https://placehold.co/300x450.png?text=${encodeURIComponent(book.title.substring(0, 10) + '...')}`;
  const dataAiHintKeywords = book.title.toLowerCase().split(' ').slice(0, 2).join(' ');

  const handlePrimaryAction = () => {
    onPreviewRequest(book); 
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 group h-full">
      <CardHeader className="p-3 pb-2 cursor-pointer" onClick={handlePrimaryAction}>
        <div className="relative w-full aspect-[2/3] mb-2 rounded overflow-hidden bg-muted group-hover:opacity-90 transition-opacity">
          <Image
            src={book.thumbnailUrl || placeholderImage}
            alt={t('library.books.coverAlt', { title: book.title })}
            fill={true}
            sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, 30vw"
            style={{ objectFit: book.thumbnailUrl ? 'cover' : 'contain' }}
            data-ai-hint={dataAiHintKeywords}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.srcset = placeholderImage;
              target.src = placeholderImage;
              target.style.objectFit = 'contain';
            }}
            quality={85} 
          />
           {(book.embeddable || !book.thumbnailUrl) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <BookText className="w-10 h-10 text-white/80" />
            </div>
          )}
        </div>
        <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </CardTitle>
        {book.authors && <CardDescription className="text-xs line-clamp-1 pt-0.5">{book.authors.join(', ')}</CardDescription>}
      </CardHeader>
      <CardContent className="p-3 pt-0 text-xs line-clamp-3 flex-grow text-muted-foreground cursor-pointer" onClick={handlePrimaryAction}>
        {book.description || t('library.books.noDescription')}
      </CardContent>
      <CardFooter className="p-3 pt-1 flex-col items-stretch gap-1.5">
        {book.embeddable ? (
          <Button variant="default" size="sm" onClick={handlePrimaryAction} className="w-full text-xs">
            <BookText className="mr-1.5 h-3.5 w-3.5" /> {t('library.books.readInApp')}
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild className="w-full text-xs">
            <a href={book.webReaderLink || book.infoLink} target="_blank" rel="noopener noreferrer">
             <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> {t('library.books.viewOnGoogle')}
            </a>
          </Button>
        )}
        {book.infoLink && (book.embeddable || (!book.embeddable && book.infoLink !== (book.webReaderLink || book.infoLink))) && (
           <Button variant="link" size="sm" asChild className="w-full text-xs justify-center h-auto py-1 px-2">
            <a href={book.infoLink} target="_blank" rel="noopener noreferrer">
              {t('library.books.moreInfo')} <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

    