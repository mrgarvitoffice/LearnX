/**
 * @fileoverview Defines a Genkit flow for creating flashcards from user-provided notes.
 * This flow is used in the Custom Test feature to generate study materials from raw text.
 * It automatically detects the language of the notes to provide multilingual output.
 * Exports:
 * - generateFlashcardsFromNotes: The main function to generate flashcards.
 * - GenerateFlashcardsFromNotesInput: The Zod schema for the input.
 * - GenerateFlashcardsOutput: The Zod schema for the output.
 */

'use server';

import {aiForQuizzes} from '@/ai/genkit';
import {z} from 'zod';
import type { GenerateFlashcardsOutput } from './generate-flashcards'; // Reuse existing output type

// Define GenerateFlashcardsOutputSchema locally for this flow's prompt
const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z
    .array(
      z.object({
        term: z.string().describe('The term to be defined.'),
        definition: z.string().describe('The definition of the term.'),
      })
    )
    .describe('An array of flashcards, each with a term and its definition.'),
});

const GenerateFlashcardsFromNotesInputSchema = z.object({
  notesContent: z.string().describe('The study notes content in markdown format to base the flashcards on.'),
  numFlashcards: z.number().min(1).max(50).describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsFromNotesInput = z.infer<typeof GenerateFlashcardsFromNotesInputSchema>;

export async function generateFlashcardsFromNotes(input: GenerateFlashcardsFromNotesInput): Promise<GenerateFlashcardsOutput> {
  try {
    return await generateFlashcardsFromNotesFlow(input);
  } catch (error: any) {
    console.error("[AI Action Error - Flashcards From Notes] Flow failed:", error);
    throw new Error(`Failed to generate flashcards from notes. Error: ${error.message}`);
  }
}

const prompt = aiForQuizzes.definePrompt({
  name: 'generateFlashcardsFromNotesPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  input: {schema: GenerateFlashcardsFromNotesInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert multilingual educator specializing in creating flashcards. Your task is to generate {{numFlashcards}} flashcards based *solely* on the provided study notes.

**CRITICAL INSTRUCTION: LANGUAGE DETECTION & ADHERENCE**
First, meticulously analyze the provided "Study Notes Content" to determine its primary language (e.g., English, Japanese, Hindi, Spanish, etc.).
- If the notes are clearly in a non-English language, you **MUST** write all 'term' and 'definition' fields in that same detected language.
- If the notes are in English, you **MUST** generate the entire output in English. This is a strict, non-negotiable rule. Do not default to any other language.

Please ensure all terms and definitions are derived directly from the information within the provided notes. Do not use any external knowledge.
The flashcards should cover the most important aspects of the notes.

Study Notes Content:
---
{{{notesContent}}}
---

Format the output as a JSON array of objects, where each object has a 'term' and a 'definition' field.
Example schema for output:
\n{{{outputSchema}}}
`,
});

const generateFlashcardsFromNotesFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateFlashcardsFromNotesFlow',
    inputSchema: GenerateFlashcardsFromNotesInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.flashcards || !Array.isArray(output.flashcards)) {
      console.error("[AI Flow Error - Flashcards From Notes] AI returned empty or invalid data:", output);
      return { flashcards: [] };
    }
    return output;
  }
);
