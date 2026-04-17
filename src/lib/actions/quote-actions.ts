

'use server';
/**
 * @fileoverview Server action for fetching a translated motivational quote.
 * This action selects a random quote from a predefined English list and uses the `translateText`
 * flow to provide a localized version based on the user's selected language.
 */

import { translateText } from '@/ai/flows/translate-text';
import { APP_LANGUAGES, MOTIVATIONAL_QUOTES_EN } from '@/lib/constants';
import type { TranslatedQuote } from '@/lib/types';

/**
 * Gets a motivational quote, translated into the specified language.
 * It randomly selects a quote from a predefined English list and then calls an AI flow
 * to translate it.
 * 
 * @param {string} languageCode - The two-letter language code (e.g., "en", "es").
 * @returns {Promise<TranslatedQuote>} A promise that resolves to the translated quote.
 * @throws Will throw an error if the AI translation operation fails, though it has internal fallbacks.
 */
export async function getTranslatedQuote(languageCode: string): Promise<TranslatedQuote> {
  if (!MOTIVATIONAL_QUOTES_EN || MOTIVATIONAL_QUOTES_EN.length === 0) {
    throw new Error("Motivational quotes list is empty or not available.");
  }
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES_EN.length);
  const quoteToTranslate = MOTIVATIONAL_QUOTES_EN[randomIndex];
  
  if (languageCode === 'en') {
    return { quote: quoteToTranslate.quote, author: quoteToTranslate.author };
  }

  const languageInfo = APP_LANGUAGES.find(lang => lang.value === languageCode);
  const targetLanguageName = languageInfo?.englishName || 'English';
  
  try {
    const translationResult = await translateText({ 
        textToTranslate: quoteToTranslate.quote, 
        targetLanguageName 
    });
    
    // The author's name is generally not translated.
    return { quote: translationResult.translatedText, author: quoteToTranslate.author };

  } catch (error) {
    console.error(`[Action Error - Quote] Translation flow failed for language "${targetLanguageName}":`, error);
    // Fallback to English
    return { quote: quoteToTranslate.quote, author: quoteToTranslate.author };
  }
}

    