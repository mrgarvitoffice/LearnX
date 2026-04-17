
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

interface TranslationState {
  translations: Record<string, any> | null;
  isReady: boolean;
  currentLang: string;
}

const localeLoaders: Record<string, () => Promise<any>> = {
  en: () => import('@/locales/en.json'),
  hi: () => import('@/locales/hi.json'),
  ja: () => import('@/locales/ja.json'),
  es: () => import('@/locales/es.json'),
};

/**
 * A highly optimized translation hook that handles both flat and nested JSON structures.
 * Uses recursive traversal to resolve dot-notated keys.
 */
export function useTranslation(): { t: TFunction, isReady: boolean } {
  const { appLanguage } = useSettings();
  const [state, setState] = useState<TranslationState>({
    translations: null,
    isReady: false,
    currentLang: '',
  });

  useEffect(() => {
    let isMounted = true;
    const langCode = appLanguage?.split('-')[0] || 'en';
    
    if (state.currentLang === langCode && state.isReady) return;

    const loadTranslations = async () => {
      const loader = localeLoaders[langCode as keyof typeof localeLoaders] || localeLoaders.en;

      try {
        const module = await loader();
        if (isMounted) {
          // Some bundlers wrap JSON in a default export, others don't.
          const translations = module.default || module;
          setState({ 
            translations, 
            isReady: true, 
            currentLang: langCode 
          });
        }
      } catch (error) {
        console.warn(`Translation load failed for: "${langCode}". Falling back to English.`, error);
        try {
          const fallback = await localeLoaders.en();
          if (isMounted) {
            const translations = fallback.default || fallback;
            setState({ translations, isReady: true, currentLang: 'en' });
          }
        } catch (e) {
          if (isMounted) setState({ translations: {}, isReady: true, currentLang: 'error' });
        }
      }
    };
    
    loadTranslations();
    return () => { isMounted = false; };
  }, [appLanguage, state.currentLang, state.isReady]);

  const t: TFunction = useCallback((key, options) => {
    if (!state.isReady || !state.translations) return key;

    // 1. Try direct lookup first (handles "dashboard.welcome" as a flat key if defined that way)
    let result = state.translations[key];

    // 2. If not found, try recursive lookup (handles nested objects like dashboard: { welcome: "..." })
    if (result === undefined && key.includes('.')) {
      const keys = key.split('.');
      let current: any = state.translations;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          current = undefined;
          break;
        }
      }
      result = current;
    }

    // Fallback to the key name if nothing was found or if result isn't a string
    if (result === undefined || result === null || typeof result !== 'string') return key;

    let val = result;
    if (options) {
      Object.keys(options).forEach(optKey => {
        val = val.replace(new RegExp(`{{${optKey}}}`, 'g'), String(options[optKey]));
      });
    }

    return val;
  }, [state.translations, state.isReady]);

  return { t, isReady: state.isReady && !!state.translations };
}
