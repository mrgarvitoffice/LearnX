
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/useSound';

interface FlashcardProps {
  term: string;
  definition: string;
  className?: string;
}

export function FlashcardComponent({ term, definition, className }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { playSound: playFlipSound } = useSound('/sounds/ting.mp3', 0.2);

  const handleFlip = () => {
    playFlipSound();
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={cn("perspective w-full h-64 md:h-80 rounded-lg cursor-pointer", className)}
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleFlip()}
      aria-pressed={isFlipped}
      aria-label={`Flashcard: ${term}. Click to flip.`}
    >
      <Card
        className={cn(
          "relative w-full h-full preserve-3d transition-transform duration-700 ease-in-out shadow-xl",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front of the card */}
        <CardContent className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 bg-card border rounded-lg">
          <h3 className="text-xl md:text-2xl font-semibold text-center text-card-foreground">{term}</h3>
           <Button variant="ghost" size="sm" className="absolute bottom-4 right-4 text-muted-foreground">
            <RotateCcw className="w-4 h-4 mr-1" /> Flip
          </Button>
        </CardContent>

        {/* Back of the card */}
        <CardContent className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 bg-secondary border rounded-lg">
          <p className="text-sm md:text-base text-center text-secondary-foreground">{definition}</p>
          <Button variant="ghost" size="sm" className="absolute bottom-4 right-4 text-muted-foreground">
            <RotateCcw className="w-4 h-4 mr-1" /> Flip
          </Button>
        </CardContent>
      </Card>
      <style jsx global>{`
        .perspective {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden; /* Safari */
        }
      `}</style>
    </div>
  );
}
