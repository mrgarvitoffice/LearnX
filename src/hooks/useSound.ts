
"use client";

import { useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface SoundOptions {
  volume?: number;
  priority?: 'essential' | 'incidental' | 'optional';
}

// Global cache to store a single Audio element instance per sound file.
// This is crucial for performance and reliability, especially on mobile.
const audioCache = new Map<string, { audio: HTMLAudioElement; hasError: boolean }>();

export function useSound(soundPath: string, options: SoundOptions = {}) {
  const { volume = 0.5, priority = 'incidental' } = options;
  const { soundMode } = useSettings();

  const playSound = useCallback(() => {
    // Determine if the sound should play based on the sound mode and priority.
    if (soundMode === 'muted') {
      return; // Never play sounds when muted.
    }
    if (soundMode === 'essential' && (priority === 'optional' || priority === 'incidental')) {
      return; // In "Essential" mode, only play sounds with 'essential' priority.
    }
    // All sounds play in 'full' mode.

    let cacheEntry = audioCache.get(soundPath);

    if (!cacheEntry) {
      if (typeof window === 'undefined') return; // Cannot create Audio element on server
      
      const audio = new Audio(soundPath);
      audio.volume = volume;
      cacheEntry = { audio, hasError: false };
      audioCache.set(soundPath, cacheEntry);

      audio.addEventListener('error', () => {
        console.warn(`LearnMint Sound System: Failed to load sound from "${soundPath}". Playback for this sound is now disabled.`);
        const entry = audioCache.get(soundPath);
        if (entry) {
          entry.hasError = true;
        }
      });
    }

    if (cacheEntry.hasError) return;

    // A common mobile browser fix: ensure any previous play is paused before starting a new one.
    if (!cacheEntry.audio.paused) {
      cacheEntry.audio.pause();
      cacheEntry.audio.currentTime = 0;
    }

    cacheEntry.audio.play().catch(playError => {
      // Don't log 'AbortError' which happens on fast navigations.
      if (playError.name !== 'AbortError' && cacheEntry && !cacheEntry.hasError) {
        console.warn(`LearnMint Sound System: Playback failed for "${soundPath}". Error: ${playError.message}`);
        // Do not disable on first failure, as it might be an intermittent issue.
        // Caching the error state might be too aggressive.
      }
    });
  }, [soundMode, soundPath, volume, priority]);
  
  return { playSound };
}
