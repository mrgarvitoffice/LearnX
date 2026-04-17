

/**
 * @fileoverview Defines a Genkit flow for creating a quiz from user-provided notes.
 * This flow is used in the Custom Test feature to generate questions from raw text.
 * It automatically detects the language of the notes to provide multilingual output.
 * Exports:
 * - generateQuizFromNotes: The main function to generate quiz questions.
 * - GenerateQuizFromNotesInput: The Zod schema for the input.
 * - GenerateQuizOutput: The Zod schema for the output.
 */

'use server';

import {aiForQuizzes} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateQuizQuestionsOutput as GenerateQuizOutput } from './generate-quiz-questions'; // Reuse existing output type

// Define GenerateQuizOutputSchema locally for this flow's prompt
const GenerateQuizOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).optional().describe('An array of 3-4 multiple-choice options. Required for "multiple-choice" type.'),
      answer: z.string().describe('The correct answer.'),
      type: z.enum(['multiple-choice', 'short-answer']).describe("The type of question."),
      explanation: z.string().optional().describe('A brief explanation for why the answer is correct.'),
    })
  ).describe('The generated quiz, including explanations for answers.'),
});

const GenerateQuizFromNotesInputSchema = z.object({
  notesContent: z.string().describe('The study notes content in markdown format to base the quiz on.'),
  numQuestions: z.number().min(1).max(50).describe('The number of questions to generate.'),
  language: z.string().optional().describe('An optional instruction to generate the quiz in a specific language (e.g., "English", "Hindi"). If not provided, the language will be auto-detected from the notes.'),
});
export type GenerateQuizFromNotesInput = z.infer<typeof GenerateQuizFromNotesInputSchema>;

export async function generateQuizFromNotes(input: GenerateQuizFromNotesInput): Promise<GenerateQuizOutput> {
  try {
    return await generateQuizFromNotesFlow(input);
  } catch (error: any) {
    console.error("[AI Action Error - Quiz From Notes] Flow failed:", error);
    throw new Error(`Failed to generate quiz from notes. Error: ${error.message}`);
  }
}

const prompt = aiForQuizzes.definePrompt({
  name: 'generateQuizFromNotesPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  input: {schema: GenerateQuizFromNotesInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert multilingual quiz generator. Your task is to create a quiz with {{numQuestions}} questions based *solely* on the provided study notes.

**CRITICAL INSTRUCTION 1: LANGUAGE ADHERENCE**
- If a specific language is provided (e.g., 'Hindi', 'Spanish'), you **MUST** write all questions, options, answers, and explanations in that exact language: **{{{language}}}**.
- If no specific language is provided, you must meticulously analyze the provided "Study Notes Content" to determine its primary language (e.g., English, Japanese, etc.) and generate the entire quiz in that same detected language.

**CRITICAL INSTRUCTION 2: QUESTION TYPE RATIO**
You **MUST** create a mix of 'multiple-choice' and 'short-answer' questions with a strict 80/20 ratio.
- **80% of the questions must be 'multiple-choice'.**
- **20% of the questions must be 'short-answer'.**

For example:
- If {{numQuestions}} is 10, create exactly 8 'multiple-choice' and 2 'short-answer' questions.
- If {{numQuestions}} is 5, create exactly 4 'multiple-choice' and 1 'short-answer' question.

**CRITICAL INSTRUCTION 3: FORMATTING**
Each question must have one correct answer and a brief explanation. For multiple-choice, provide 4 options. The 'answer' field must contain the full text of the correct option.

Study Notes Content:
---
{{{notesContent}}}
---

Output the questions in a valid JSON format, matching this schema precisely:
\n{{{outputSchema}}}
`,
});

// Function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const generateQuizFromNotesFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateQuizFromNotesFlow',
    inputSchema: GenerateQuizFromNotesInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.questions || !Array.isArray(output.questions)) {
      console.error("[AI Flow Error - Quiz From Notes] AI returned empty or invalid data:", output);
      // Return a valid empty structure to prevent downstream errors
      return { questions: [] }; 
    }
    
    // Shuffle the questions before returning them
    const shuffledQuestions = shuffleArray(output.questions);
    
    return { questions: shuffledQuestions };
  }
);
