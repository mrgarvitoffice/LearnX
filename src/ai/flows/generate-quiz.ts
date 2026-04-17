/**
 * @fileoverview DEPRECATED. This flow is no longer in active use.
 * The more robust `generate-quiz-questions.ts` flow has replaced it.
 * This file is kept for historical reference and can be safely removed.
 * Exports:
 * - generateQuiz: A function that handles the quiz generation process.
 * - GenerateQuizInput: The input type for the function.
 * - GenerateQuizOutput: The return type for the function.
 */

'use server';

import {aiForQuizzes} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the quiz.'),
  numQuestions: z.number().describe('The number of questions to generate.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Output schema is defined locally, not exported as an object
const GenerateQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers.'),
      answer: z.string().describe('The correct answer.'),
      explanation: z.string().optional().describe('A brief explanation for why the answer is correct.'),
    })
  ).describe('The generated quiz, including explanations for answers.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

const prompt = aiForQuizzes.definePrompt({
  name: 'generateQuizPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are a quiz generator. Generate a quiz with {{numQuestions}} questions about {{topic}}. Each question should have multiple choice options, one correct answer, and a brief explanation for why the answer is correct.

Output the questions in JSON format. Here is the schema:
\n{{{outputSchema}}}
`,
});

const generateQuizFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
     if (!output || !output.quiz || !Array.isArray(output.quiz) || output.quiz.length === 0) {
        console.error("[AI Flow Error - Quiz] AI returned empty or invalid quiz data:", output);
        throw new Error("AI failed to generate quiz questions in the expected format.");
    }
    return output!;
  }
);

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  console.log(`[Server Action] generateQuiz called for topic: ${input.topic}, numQuestions: ${input.numQuestions}`);
  try {
    const result = await generateQuizFlow(input);
    return result;
  } catch (error: any) {
    console.error("[Server Action Error - generateQuiz] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate quiz. Please try again.";
    if (error.message && (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY"))) {
      clientErrorMessage = "Quiz Generation: Failed due to an API key issue. Please check server configuration.";
    } else if (error.message) {
      clientErrorMessage = `Quiz Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
