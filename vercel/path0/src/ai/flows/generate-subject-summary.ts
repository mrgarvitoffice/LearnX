
'use server';
/**
 * @fileoverview Defines a Genkit flow for generating a summary of a college subject.
 * This flow is designed for the "Nexithra College" feature to provide quick overviews.
 */

import { aiForNotes } from '@/ai/genkit';
import { z } from 'zod';

const GenerateSubjectSummaryInputSchema = z.object({
  subjectName: z.string().describe("The name of the college subject."),
  description: z.string().optional().describe("A brief description of the subject for additional context."),
});
export type GenerateSubjectSummaryInput = z.infer<typeof GenerateSubjectSummaryInputSchema>;

const GenerateSubjectSummaryOutputSchema = z.object({
  summary: z.string().describe("A concise, well-structured summary of the subject in Markdown format."),
});
export type GenerateSubjectSummaryOutput = z.infer<typeof GenerateSubjectSummaryOutputSchema>;

const generateSummaryPrompt = aiForNotes.definePrompt({
  name: 'generateSubjectSummaryPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  input: { schema: GenerateSubjectSummaryInputSchema },
  output: { format: 'text' },
  prompt: `You are an expert academic summarizer. Your task is to generate a concise summary of the key concepts for the following college subject. The summary should be easy to read and provide a high-level overview suitable for revision.

**Subject:** {{{subjectName}}}
**Description:** {{{description}}}

Please structure your response in Markdown with the following format:
- A brief introduction.
- A bulleted list of 3-5 key topics covered in the subject.
- A concluding sentence.

Example for "Operating Systems":
---
An Operating System (OS) is the foundational software that manages all computer hardware and software resources, acting as an intermediary between the user and the computer hardware.

Key topics include:
- **Process Management:** Handling the creation, scheduling, and termination of processes.
- **Memory Management:** Allocating and deallocating memory space for programs.
- **File Systems:** Organizing and managing how data is stored and retrieved.
- **I/O Management:** Managing communication with hardware devices.
- **Security & Protection:** Ensuring system integrity and controlling access.

Understanding these core concepts is crucial for building efficient and reliable software applications.
---

Now, generate a similar summary for the requested subject.
`,
});

const generateSubjectSummaryFlow = aiForNotes.defineFlow(
  {
    name: 'generateSubjectSummaryFlow',
    inputSchema: GenerateSubjectSummaryInputSchema,
    outputSchema: GenerateSubjectSummaryOutputSchema,
  },
  async (input) => {
    const llmResponse = await generateSummaryPrompt(input);
    const summaryText = llmResponse.text?.trim();

    if (!summaryText) {
      throw new Error("AI failed to generate a summary for the subject.");
    }
    return { summary: summaryText };
  }
);

export async function generateSubjectSummary(input: GenerateSubjectSummaryInput): Promise<GenerateSubjectSummaryOutput> {
  return generateSubjectSummaryFlow(input);
}
