
/**
 * @fileoverview Defines the primary Genkit flow for generating flashcards.
 * This flow takes a topic and creates a set of flashcards with terms and definitions.
 * It can optionally use a provided image for additional context and supports multilingual generation.
 * Exports:
 * - generateFlashcards: The main function to generate flashcards.
 * - GenerateFlashcardsInput: The Zod schema for the input.
 * - GenerateFlashcardsOutput: The Zod schema for the output.
 */

'use server';

import {aiForQuizzes} from '@/ai/genkit';
import {z, Part} from 'genkit';

const FlashcardSchema = z.object({
  term: z.string().describe('The key term, concept, or question for the flashcard front.'),
  definition: z.string().describe('A concise definition, explanation, or answer for the flashcard back. For complex topics, use 2-3 bullet points. Include formulas if relevant and concise enough for a flashcard.'),
});

const GenerateFlashcardsInputSchema = z.object({
  topic: z.string().describe('The academic topic for which to generate flashcards.'),
  numFlashcards: z.number().min(1).max(50).describe('The number of flashcards to generate.'),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the user as a data URI for context. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

const generateFlashcardsPrompt = aiForQuizzes.definePrompt({
  name: 'generateFlashcardsPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: (input: GenerateFlashcardsInput) => {
    const mainPromptText = `You are an expert multilingual educator specializing in creating study materials.
Your primary task is to generate a list of ${input.numFlashcards} flashcards based on the provided topic.

**CRITICAL INSTRUCTION: LANGUAGE DETECTION & ADHERENCE**
Your first and most important task is to meticulously analyze the user's topic: "${input.topic}".
- If a specific human language is requested (e.g., "Quantum Physics in Spanish", "ハリー・ポッターのキャラクター"), you **MUST** generate both the 'term' and 'definition' for all flashcards in that exact language.
- If the topic itself is written in a non-English script (e.g., Devanagari, Cyrillic, Kanji), you **MUST** generate the entire output in that language.
- If no language is specified and the topic is in English, you **MUST** generate the entire output in English. This is a strict, non-negotiable rule. Do not default to any other language.

Each flashcard must have a key 'term' (for the front) and its corresponding 'definition' (for the back).
The 'term' should be a specific keyword, concept, or a short question.
The 'definition' should be concise and clear. For more complex definitions, use 2-3 bullet points to break down the information. If the term involves a formula crucial for quick recall, include it in the definition in a clear, simple format.
The flashcards should cover the most important vocabulary, formulas, and core concepts of the topic suitable for quick recall and study.

Format the output as a JSON object with a "flashcards" array.
`;

    const promptParts: Part[] = [{ text: mainPromptText }];
    if (input.image) {
      promptParts.push({ text: "The user has also provided an image for additional context. Analyze the image and incorporate relevant information from it into the flashcards, respecting the language instruction above."});
      promptParts.push({ media: { url: input.image }});
    }

    return promptParts;
  },
  config: {
     safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateFlashcardsFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Flashcards] Generating ${input.numFlashcards} flashcards for topic: ${input.topic}${input.image ? ' with image' : ''}`);
    const { output } = await generateFlashcardsPrompt(input);
    if (!output || !output.flashcards || !Array.isArray(output.flashcards) || output.flashcards.length === 0) {
      console.error("[AI Flow Error - Flashcards] Invalid or empty output from LLM:", output);
      throw new Error('AI failed to generate flashcards in the expected format.');
    }
    console.log(`[AI Flow - Flashcards] Successfully generated ${output.flashcards.length} flashcards for topic: ${input.topic}`);
    return output;
  }
);

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  console.log(`[AI Wrapper] generateFlashcards called for topic: ${input.topic}, num: ${input.numFlashcards}`);
  try {
    return await generateFlashcardsFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error - generateFlashcards] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate flashcards. Please try again.";
    const lowerCaseError = error.message?.toLowerCase() || "";

    if (lowerCaseError.includes("model not found") || lowerCaseError.includes("permission denied") || lowerCaseError.includes("api key not valid")) {
       clientErrorMessage = "Flashcard Generation: Failed due to an API key or project configuration issue. Please check that GOOGLE_API_KEY_QUIZZES (or its fallback) is correct and that the 'Generative Language API' is enabled with billing in its Google Cloud project.";
    } else if (lowerCaseError.includes("api key") || lowerCaseError.includes("google_api_key")) {
      clientErrorMessage = "Flashcard Generation: Failed due to an API key issue. Please check server configuration and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Flashcard Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
