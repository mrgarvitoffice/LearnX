
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion'; // For simple animations
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface InteractiveCharacterElementProps {
  characterName: string; // For alt text and conceptual association
  initials?: string; // For AvatarFallback, e.g., "OP" for One Piece
  imageUrl?: string; // Optional image URL for the character/logo
  Icon?: LucideIcon; // Optional Lucide icon as placeholder
  soundUrl?: string; // Optional specific sound URL
  className?: string;
  containerClassName?: string;
  dataAiHint?: string; // For placeholder images
  onClick?: () => void; // Added onClick prop
}

const InteractiveCharacterElement: React.FC<InteractiveCharacterElementProps> = ({
  characterName,
  initials,
  imageUrl,
  Icon,
  soundUrl = '/sounds/ting.mp3', // Default to a generic pop/ting sound
  className,
  containerClassName,
  dataAiHint,
  onClick, // Use the onClick prop
}) => {
  const { playSound } = useSound(soundUrl, { volume: 0.4 });
  const [isInteracting, setIsInteracting] = useState(false);

  const handleClick = () => {
    playSound();
    setIsInteracting(true);
    onClick?.(); // Call the passed onClick handler
    setTimeout(() => setIsInteracting(false), 300); // Reset animation state
  };

  const IconComponent = Icon;

  return (
    <motion.div
      className={cn("cursor-pointer select-none", containerClassName)}
      onClick={handleClick}
      whileHover={{ scale: 1.1, rotate: isInteracting ? 0 : 5 }}
      whileTap={{ scale: 0.9 }}
      animate={{
        scale: isInteracting ? [1, 1.2, 0.95, 1.05, 1] : 1,
        rotate: isInteracting ? [0, -10, 10, -5, 0] : 0,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      title={`Interact with ${characterName}`}
    >
      <Avatar className={cn("h-12 w-12 shadow-lg border-2 border-primary/50 hover:border-primary transition-all", className)}>
        <AvatarImage src={imageUrl} alt={characterName} />
        <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
          {IconComponent ? <IconComponent className="h-6 w-6" /> : initials || characterName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </motion.div>
  );
};

export default InteractiveCharacterElement;
