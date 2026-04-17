
'use server';
/**
 * @fileoverview Defines a reusable Genkit flow for translating text.
 * This flow takes a string of text and a target language name (e.g., "Spanish")
 * and returns the translated text. It is designed to be a reliable, general-purpose translation utility.
 * Exports:
 * - translateText: The main function to perform the translation.
 * - TranslateTextInput: The Zod schema for the input.
 * - TranslateTextOutput: The Zod schema for the output.
 */

import { aiForNotes } from '@/ai/genkit';
import { z } from 'zod';

const TranslateTextInputSchema = z.object({
  textToTranslate: z.string().describe('The English text to be translated.'),
  targetLanguageName: z.string().describe('The target language for the translation (e.g., "Spanish", "Japanese").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The text, translated into the target language.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

// This is a more reliable, direct prompt.
// Using format: 'text' is crucial as it prevents the model from trying to wrap the response in JSON.
const translatePrompt = aiForNotes.definePrompt({
    name: 'translateTextPrompt',
    model: 'googleai/gemini-2.5-flash-lite',
    input: { schema: TranslateTextInputSchema },
    output: { format: 'text' }, 
    prompt: `You are a professional translator. Your ONLY task is to translate the given text into the specified target language. Do not add any extra commentary, notes, or quotation marks. The output must be ONLY the translated text.

Target Language: {{targetLanguageName}}

Text to translate: "{{textToTranslate}}"`,
    config: {
        temperature: 0.3, 
    },
});

const translateTextFlow = aiForNotes.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    try {
      const llmResponse = await translatePrompt(input);
      const translatedText = llmResponse.text?.trim() || '';
      
      // If the AI returns an empty string, it's a failure.
      if (!translatedText) {
          console.warn(`[AI Flow Warning - Translate Text] AI failed to translate to "${input.targetLanguageName}". Falling back to English.`);
          return { translatedText: input.textToTranslate }; // Fallback to English
      }
      
      // A simple check to see if the output is just a slight variation of the input (like adding quotes), which can indicate translation failure.
      const normalizedInput = input.textToTranslate.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedOutput = translatedText.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (normalizedOutput === normalizedInput) {
          console.warn(`[AI Flow Warning - Translate Text] AI returned the original English text for language "${input.targetLanguageName}". Falling back.`);
          return { translatedText: input.textToTranslate }; // Fallback to English
      }

      return { translatedText };

    } catch(e) {
        console.error(`[AI Flow Error - Translate Text] Flow failed for language "${input.targetLanguageName}":`, e);
        // If the entire flow fails, fall back to the original English text.
        return { translatedText: input.textToTranslate };
    }
  }
);

/**
 * Wrapper function to be called from server actions.
 * @param {TranslateTextInput} input - The text and target language.
 * @returns {Promise<TranslateTextOutput>} The translated text.
 */
export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}
