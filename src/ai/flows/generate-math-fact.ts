
'use server';
/**
 * @fileoverview Defines a Genkit flow for translating a math fact into a specified language.
 * This flow is designed to take an English fact and a target language name, returning the translated text.
 * Exports:
 * - generateTranslatedMathFact: The main function to perform the translation.
 * - TranslateMathFactInput: The Zod schema for the input.
 * - TranslateMathFactOutput: The Zod schema for the output.
 */

import { aiForNotes } from '@/ai/genkit';
import { z } from 'zod';

const TranslateMathFactInputSchema = z.object({
  factToTranslate: z.string().describe('The English math fact to be translated.'),
  targetLanguageName: z.string().describe('The target language for the translation (e.g., "Spanish", "Japanese").'),
});
export type TranslateMathFactInput = z.infer<typeof TranslateMathFactInputSchema>;

const TranslateMathFactOutputSchema = z.object({
  fact: z.string().describe('The math fact, translated into the target language.'),
});
export type TranslateMathFactOutput = z.infer<typeof TranslateMathFactOutputSchema>;


const translateMathFactPrompt = aiForNotes.definePrompt({
    name: 'translateMathFactPrompt',
    model: 'googleai/gemini-2.5-flash-lite',
    input: { schema: TranslateMathFactInputSchema },
    // Simplified Output: Expect a raw string, not a JSON object for higher reliability.
    output: { format: 'text' },
    // Simplified Prompt: A direct, imperative command for better translation accuracy.
    prompt: `Translate the following English fact into {{{targetLanguageName}}}.
Fact: "{{{factToTranslate}}}"
**CRITICAL**: Your entire response MUST be ONLY the translated text of the fact. Do NOT add any extra words, explanations, or quotation marks.`,
    config: {
        temperature: 0.1, // Lower temperature for more deterministic, direct translation.
    },
});

const translateMathFactFlow = aiForNotes.defineFlow(
  {
    name: 'generateMathFactFlow', // Keep original name to avoid breaking dev server import
    inputSchema: TranslateMathFactInputSchema,
    outputSchema: TranslateMathFactOutputSchema,
  },
  async (input) => {
    try {
      // Call the prompt and get the raw text response.
      const llmResponse = await translateMathFactPrompt(input);
      const translatedText = llmResponse.text;
      
      if (!translatedText || translatedText.trim() === '') {
          console.error(`[AI Flow Error - Translate Math Fact] AI returned an empty translation for language "${input.targetLanguageName}".`);
          // Fallback to English if translation is empty.
          return { fact: input.factToTranslate };
      }
      
      // Return the translated text wrapped in the expected output schema.
      return { fact: translatedText.trim() };

    } catch(e) {
        console.error(`[AI Flow Error - Translate Math Fact] Flow failed for language "${input.targetLanguageName}":`, e);
        // If the entire flow fails, fall back to the original English fact to ensure something is always displayed.
        return { fact: input.factToTranslate };
    }
  }
);

/**
 * Wrapper function to be called from server actions.
 * This is now a translation function.
 * @param {TranslateMathFactInput} input - The fact and target language.
 * @returns {Promise<TranslateMathFactOutput>} The translated math fact.
 */
export async function generateTranslatedMathFact(input: TranslateMathFactInput): Promise<TranslateMathFactOutput> {
  return translateMathFactFlow(input);
}
