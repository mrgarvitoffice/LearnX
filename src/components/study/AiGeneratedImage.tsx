
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image'; 
import { useTranslation } from '@/hooks/useTranslation';

interface AiGeneratedImageProps {
  promptText: string;
}

const AiGeneratedImage: React.FC<AiGeneratedImageProps> = ({ promptText }) => {
  const { t } = useTranslation();
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(promptText)}`;
  
  const placeholderText = promptText.length > 50 ? promptText.substring(0, 47) + "..." : promptText;
  const placeholderUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(placeholderText)}`;
  const hintKeywords = promptText.toLowerCase().split(/\s+/).slice(0, 2).join(" ");

  return (
    <div className="my-6 p-3 sm:p-4 border border-dashed border-primary/50 rounded-lg bg-muted/20 text-center shadow-md">
      <div className="flex items-center justify-center text-xs text-primary/80 mb-1 uppercase tracking-wider">
        <ImageIcon className="w-4 h-4 mr-2" />
        <span>{t('notesView.visualAid.title')}</span>
      </div>
      <p className="font-semibold text-foreground/90 mb-2 text-sm sm:text-base italic">"{promptText}"</p>
      <div className="aspect-video bg-muted/30 rounded overflow-hidden flex items-center justify-center mb-3 ring-1 ring-border/50">
        <NextImage 
            src={placeholderUrl}
            alt={`Placeholder for: ${promptText}`}
            width={600} 
            height={400} 
            className="max-w-full max-h-full object-contain"
            data-ai-hint={hintKeywords} 
        />
      </div>
      <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
        <a href={googleImagesUrl} target="_blank" rel="noopener noreferrer">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {t('notesView.visualAid.searchButton')}
        </a>
      </Button>
    </div>
  );
};

export default AiGeneratedImage;
