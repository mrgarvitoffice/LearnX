
/**
 * @fileoverview Defines a Genkit flow to generate an image from a text prompt.
 * This flow is used internally by other flows, such as `generate-study-notes`, to create visual aids.
 */

'use server';

import { aiForImages } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('A data URI of the generated image. Format: data:image/png;base64,...'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageFromPrompt(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFromPromptFlow(input);
}

const generateImageFromPromptFlow = aiForImages.defineFlow(
  {
    name: 'generateImageFromPromptFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    try {
      const model = 'googleai/gemini-2.5-flash-lite';

      const { media, finishReason } = await aiForImages.generate({
        model,
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (finishReason !== 'STOP' && finishReason !== 'MODEL') {
        throw new Error(`Generation did not finish successfully. Reason: ${finishReason}.`);
      }
      
      if (media?.url && media.url.startsWith('data:image/')) {
        return { imageUrl: media.url };
      } else {
        throw new Error(`Image generation did not produce a valid image data URI.`);
      }

    } catch (error: any) {
      console.error(`[AI Flow Error - Image Gen] Error processing prompt "${input.prompt.substring(0,50)}...":`, error);
      throw new Error(error.message || "Failed to generate image.");
    }
  }
);
