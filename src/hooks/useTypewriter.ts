
"use client";

import { useState, useEffect } from 'react';

/**
 * A custom hook that simulates a typewriter effect for a given string.
 * It now types word by word to handle Markdown formatting gracefully.
 *
 * @param text The full string to be typed out.
 * @param speed The delay in milliseconds between each word. Defaults to 50ms.
 * @returns The progressively typed out string.
 */
export function useTypewriter(text: string, speed: number = 50): string {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) {
        setDisplayedText('');
        return;
    };
    
    // Set the full text immediately if it's short, or for performance.
    // Let's use a threshold. If text is less than, say, 50 chars, show it instantly.
    if (text.length < 50) {
        setDisplayedText(text);
        return;
    }

    setDisplayedText(''); // Reset on text change
    
    // Split text into words (including spaces and punctuation) to render markdown correctly.
    const words = text.split(/(\s+)/);
    let i = 0;

    const intervalId = setInterval(() => {
      if (i < words.length) {
        // Fix: Ensure the word at index 'i' is not undefined before appending.
        const nextWord = words[i];
        if (nextWord !== undefined) {
            setDisplayedText((prev) => prev + nextWord);
        }
        i++;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  return displayedText;
}
