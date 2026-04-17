

'use server';
/**
 * @fileoverview Server action for fetching a translated math fact.
 * This action uses a predefined list of English facts and a dedicated translation flow for reliability.
 */

import { translateText } from '@/ai/flows/translate-text';
import { APP_LANGUAGES, MATH_FACTS_EN } from '@/lib/constants';
import type { MathFact } from '@/lib/types';

/**
 * Gets an interesting math fact, translated into the specified language.
 * It randomly selects a fact from a predefined English list and then calls an AI flow
 * to translate it, ensuring high reliability and availability.
 * 
 * @param {string} languageCode - The two-letter language code (e.g., "en", "es").
 * @returns {Promise<MathFact>} A promise that resolves to the translated math fact.
 * @throws Will throw an error if the AI translation operation fails, though it has internal fallbacks.
 */
export async function getTranslatedMathFact(languageCode: string): Promise<MathFact> {
  // 1. Select a random fact from the predefined English list.
  if (!MATH_FACTS_EN || MATH_FACTS_EN.length === 0) {
    throw new Error("Math facts list is empty or not available.");
  }
  const randomIndex = Math.floor(Math.random() * MATH_FACTS_EN.length);
  const factToTranslate = MATH_FACTS_EN[randomIndex];
  
  // If the target language is English, no need to call the AI. Return immediately.
  if (languageCode === 'en') {
    return { fact: factToTranslate };
  }

  // 2. Find the English name for the target language to use in the prompt.
  const languageInfo = APP_LANGUAGES.find(lang => lang.value === languageCode);
  
  // Default to "English" if the language code is not found or has no specific englishName.
  const targetLanguageName = languageInfo?.englishName || 'English';
  
  // 3. Call the AI flow to translate the selected fact.
  try {
    console.log(`[Action - Math Fact] Requesting translation of fact into: ${targetLanguageName}`);
    const result = await translateText({ 
        textToTranslate: factToTranslate, 
        targetLanguageName 
    });
    
    // The flow has a fallback, but we double-check here.
    if (!result || !result.translatedText || result.translatedText.trim() === '') {
        console.warn(`[Action - Math Fact] AI did not return a valid translation for ${targetLanguageName}. Falling back to English.`);
        return { fact: factToTranslate };
    }
    
    console.log(`[Action - Math Fact] Successfully received translated fact.`);
    return { fact: result.translatedText };
  } catch (error) {
    console.error(`[Action Error - Math Fact] Translation flow failed for language "${targetLanguageName}":`, error);
    // If the entire action fails catastrophically, fall back to the original English fact to ensure UI doesn't break.
    return { fact: factToTranslate };
  }
}

    