
'use server';
/**
 * @fileoverview Defines a Genkit flow for generating top questions for a college subject.
 * This flow helps students prepare for exams by creating a list of likely short and long answer questions.
 */

import { aiForNotes } from '@/ai/genkit';
import { z } from 'zod';

const GenerateTopQuestionsInputSchema = z.object({
  subjectName: z.string().describe("The name of the college subject to generate questions for."),
});
export type GenerateTopQuestionsInput = z.infer<typeof GenerateTopQuestionsInputSchema>;

const GenerateTopQuestionsOutputSchema = z.object({
  shortQuestions: z.array(z.string()).describe("A list of 5-7 short-answer questions (2-5 marks)."),
  longQuestions: z.array(z.string()).describe("A list of 3-5 long-answer or essay-style questions (10-15 marks)."),
});
export type TopQuestionsOutput = z.infer<typeof GenerateTopQuestionsOutputSchema>;


const generateQuestionsPrompt = aiForNotes.definePrompt({
  name: 'generateTopQuestionsPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  input: { schema: GenerateTopQuestionsInputSchema },
  output: { schema: GenerateTopQuestionsOutputSchema },
  prompt: `You are an expert academic tutor and exam paper setter for university-level courses.
Your task is to generate a list of the most important and frequently asked questions for the subject: **{{{subjectName}}}**.

The list should be divided into two categories:
1.  **Short Answer Questions**: 5 to 7 questions that would typically be worth 2-5 marks. These should test core definitions, concepts, and basic principles.
2.  **Long Answer Questions**: 3 to 5 questions that would be worth 10-15 marks. These should require detailed explanations, comparisons, diagrams, or in-depth analysis.

Please provide a diverse set of questions covering the breadth of the subject.

Format your output as a JSON object with 'shortQuestions' and 'longQuestions' arrays.
{{{outputSchema}}}
`,
});

const generateTopQuestionsFlow = aiForNotes.defineFlow(
  {
    name: 'generateTopQuestionsFlow',
    inputSchema: GenerateTopQuestionsInputSchema,
    outputSchema: GenerateTopQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuestionsPrompt(input);
    if (!output || (!output.shortQuestions?.length && !output.longQuestions?.length)) {
      throw new Error("AI failed to generate any questions for the subject.");
    }
    return output;
  }
);

export async function generateTopQuestions(input: GenerateTopQuestionsInput): Promise<TopQuestionsOutput> {
  return generateTopQuestionsFlow(input);
}
