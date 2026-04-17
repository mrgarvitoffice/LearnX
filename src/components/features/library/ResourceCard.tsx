

"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';

interface ResourceCardProps {
  title: string;
  description: string;
  link: string;
  imageUrl?: string;
  dataAiHint?: string;
  icon?: LucideIcon;
  linkText: string;
}

export function ResourceCard({ title, description, link, imageUrl, icon: Icon, linkText, dataAiHint }: ResourceCardProps) {
  const { t, isReady } = useTranslation();
  
  if (!isReady) {
      return (
          <Card className="flex flex-col h-full overflow-hidden">
              {imageUrl && <Skeleton className="h-40 w-full" />}
              <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full mt-2" />
              </CardHeader>
              <CardContent className="flex-grow" />
              <CardFooter>
                  <Skeleton className="h-9 w-full" />
              </CardFooter>
          </Card>
      )
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {imageUrl && (
        <div className="relative w-full h-40">
          <Image 
            src={imageUrl} 
            alt={title} 
            layout="fill" 
            objectFit="cover" 
            data-ai-hint={dataAiHint || title.toLowerCase().split(" ").slice(0,2).join(" ")}
            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x200.png?text=${encodeURIComponent(title)}`; }}
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          {t(title)}
        </CardTitle>
        <CardDescription className="text-xs pt-1">{t(description)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow" /> {/* Spacer */}
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={link} target="_blank" rel="noopener noreferrer">
            {t(linkText)} <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

    