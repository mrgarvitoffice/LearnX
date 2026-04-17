
/**
 * @fileoverview Generates a text summary from provided content (text or image).
 * This flow is used by the Audio Factory feature to create a summary before client-side text-to-speech is applied.
 * It automatically detects the language of the source text for multilingual summarization.
 * Exports:
 * - generateAudioSummary: The main function to generate a text summary.
 * - GenerateAudioSummaryInput: The Zod schema for the function's input.
 * - GenerateAudioSummaryOutput: The Zod schema for the function's output.
 */

'use server';

import { aiForNotes } from '@/ai/genkit';
import { z, Part } from 'genkit';
import type { GenerateAudioSummaryOutput } from '@/lib/types';

const GenerateAudioSummaryInputSchema = z.object({
  text: z.string().optional().describe("Text content to be summarized."),
  imageDataUri: z.string().optional().describe("An image (as a data URI) to be described and summarized."),
}).refine(data => data.text || data.imageDataUri, {
  message: "Either text or an image data URI must be provided.",
});
export type GenerateAudioSummaryInput = z.infer<typeof GenerateAudioSummaryInputSchema>;

const GenerateAudioSummaryOutputSchema = z.object({
  summary: z.string().describe("The generated text summary."),
  audioDataUri: z.string().optional().describe("DEPRECATED: This will no longer be populated. Audio is handled client-side."),
});

// This function is exported and called from a server action.
export async function generateAudioSummary(input: GenerateAudioSummaryInput): Promise<GenerateAudioSummaryOutput> {
  return generateAudioSummaryFlow(input);
}

// Define a prompt specifically for summarizing TEXT content.
const summaryPrompt = aiForNotes.definePrompt({
  name: 'generateSummaryForAudioPrompt',
  model: 'googleai/gemini-2.5-flash-lite', 
  input: { schema: z.object({ content: z.string() }) },
  output: { schema: z.object({ summary: z.string() }) },
  prompt: `You are an expert multilingual summarizer. Your task is to provide a clear, concise, and informative summary of the provided text content.

**Crucial Instruction:** First, analyze the content to determine the user's intent and language.
- If the user explicitly asks for the summary to be in a specific language (e.g., "Summarize this in Japanese: ..."), you **MUST** provide the summary in that requested language.
- Otherwise, provide the summary in the same language as the main body of the provided text.

The summary should capture the main points and be easy to understand when read aloud.

Content to Summarize:
---
{{{content}}}
---
  
Please provide your summary below.`,
});

const imageSummaryPrompt = aiForNotes.definePrompt({
    name: 'generateSummaryFromImagePrompt',
    model: 'googleai/gemini-2.5-flash-lite',
    output: { schema: z.object({ summary: z.string() }) },
    prompt: (input: { imageDataUri: string }) => {
        const promptParts: Part[] = [
            { text: "You are an expert at describing and summarizing images. Your task is to provide a clear, concise, and informative summary of the provided image. The summary should capture the main subjects, actions, and environment, and be easy to understand when read aloud.\n\n**Crucial Instruction**: The summary **MUST** be in English, unless the user's accompanying text prompt (which is not available to you) implies a different language. Default to English.\n\nImage to Summarize:" },
            { media: { url: input.imageDataUri } },
            { text: "\nPlease provide your summary below." }
        ];
        return promptParts;
    }
});


// The main Genkit flow definition.
const generateAudioSummaryFlow = aiForNotes.defineFlow(
  {
    name: 'generateAudioSummaryFlow',
    inputSchema: GenerateAudioSummaryInputSchema,
    outputSchema: GenerateAudioSummaryOutputSchema,
  },
  async (input) => {
    let summaryText: string | undefined;

    // Step 1: If an image is provided, use the new dedicated image summarization prompt.
    if (input.imageDataUri) {
      console.log(`[AI Flow - Audio Summary] Summarizing provided image directly using dedicated prompt...`);
      const { output: imageSummaryOutput } = await imageSummaryPrompt({
        imageDataUri: input.imageDataUri,
      });
      summaryText = imageSummaryOutput?.summary;

      if (!summaryText) {
        throw new Error('Failed to get a summary from the image.');
      }
      console.log("[AI Flow - Audio Summary] Image summary generated successfully via dedicated prompt.");

    } else if (input.text) {
      // Step 2: If text is provided, use the existing text summarization prompt.
      console.log(`[AI Flow - Audio Summary] Summarizing text content (length: ${input.text.length})...`);
      const { output: summaryOutput } = await summaryPrompt({ content: input.text });
      summaryText = summaryOutput?.summary;
      console.log(`[AI Flow - Audio Summary] Text summary generated successfully.`);
    }

    if (!summaryText) {
      throw new Error("No content available to summarize or summary generation failed.");
    }

    console.log(`[AI Flow - Audio Summary] Final summary generated: "${summaryText.substring(0, 50)}..."`);

    // Step 3: Return the final output.
    return {
      summary: summaryText,
      audioDataUri: undefined,
    };
  }
);
