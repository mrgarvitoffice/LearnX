/**
 * @fileoverview Defines a Genkit flow that converts text into a multi-speaker audio discussion.
 * This flow first generates a two-person dialogue script from the input content,
 * then uses a text-to-speech model to generate a multi-speaker audio file.
 * It is designed to automatically detect and adhere to the language of the source content.
 *
 * Exports:
 * - generateDiscussionAudio: The main function to handle the discussion generation process.
 * - GenerateDiscussionAudioInput: The Zod schema for the function's input.
 * - GenerateDiscussionAudioOutput: The Zod schema for the function's output.
 */

'use server';

// Use separate AI clients for text generation and text-to-speech for correctness.
import { aiForNotes, aiForTTS } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const GenerateDiscussionAudioInputSchema = z.object({
  content: z.string().describe('The content to be turned into a discussion.'),
});
export type GenerateDiscussionAudioInput = z.infer<typeof GenerateDiscussionAudioInputSchema>;

const GenerateDiscussionAudioOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio discussion as a data URI.'),
});
export type GenerateDiscussionAudioOutput = z.infer<typeof GenerateDiscussionAudioOutputSchema>;

export async function generateDiscussionAudio(input: GenerateDiscussionAudioInput): Promise<GenerateDiscussionAudioOutput> {
  try {
    return await generateDiscussionAudioFlow(input);
  } catch (error: any) {
    console.error("[AI Action Error - Discussion Audio] Flow failed:", error);
    const errorMessage = error.message || "An unexpected error occurred.";
    // Provide a more specific error message if the script generation fails.
    if (errorMessage.toLowerCase().includes("dialogue script")) {
      throw new Error("The AI failed to create a discussion script from the provided text. This can sometimes happen with very short or complex content. Please try rephrasing or using a longer text.");
    }
    throw new Error(`Failed to generate discussion audio. Error: ${errorMessage}`);
  }
}

// Helper to convert PCM data to WAV Base64
async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels, sampleRate: rate, bitDepth: sampleWidth * 8 });
    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

// Prompt to generate the dialogue script. Uses the text-generation client.
const dialoguePrompt = aiForNotes.definePrompt({
    name: 'generateDialogueForTtsPrompt',
    model: 'googleai/gemini-2.5-flash-lite',
    input: { schema: z.object({ content: z.string() }) },
    output: { format: 'text' }, // Request raw text for easier cleanup.
    prompt: `You are an expert multilingual scriptwriter. Your primary task is to convert the following text content into a natural-sounding, two-person dialogue script.

**CRUCIAL INSTRUCTION: LANGUAGE DETECTION & ADHERENCE**
First, meticulously analyze the provided "Content to convert" to determine its primary language (e.g., English, Japanese, Hindi, Spanish, etc.).
You **MUST** write the entire dialogue script in that same detected language. This is a non-negotiable rule.

The dialogue should be between "Speaker1" (a knowledgeable and slightly formal expert) and "Speaker2" (an inquisitive and friendly learner). It should discuss and explain the key points from the provided content. Speaker1 should present the information, and Speaker2 should ask clarifying questions or make comments to guide the conversation.

**CRITICAL FORMATTING RULE:** The output MUST be a script formatted *exactly* like this, with each line starting with "Speaker1:" or "Speaker2:".
Speaker1: [First line of dialogue in detected language]
Speaker2: [Second line of dialogue in detected language]
...and so on.

Do NOT add any other text, introductions, or summaries. The entire output should be just the dialogue script.

Content to convert:
---
{{{content}}}
---

Please provide the dialogue script below in the detected language.`
});

// The main Genkit flow
const generateDiscussionAudioFlow = aiForTTS.defineFlow(
  {
    name: 'generateDiscussionAudioFlow',
    inputSchema: GenerateDiscussionAudioInputSchema,
    outputSchema: GenerateDiscussionAudioOutputSchema,
  },
  async (input) => {
    // 1. Generate the dialogue script from the input content.
    console.log('[AI Flow - Discussion Audio] Generating dialogue script...');
    const llmResponse = await dialoguePrompt({ content: input.content });
    let dialogueScript = llmResponse.text.trim();

    // Self-healing: Clean up the script to ensure it only contains valid dialogue lines.
    dialogueScript = dialogueScript
      .split('\n')
      .filter(line => line.startsWith('Speaker1:') || line.startsWith('Speaker2:'))
      .join('\n');

    if (!dialogueScript) {
      throw new Error("Failed to generate a valid dialogue script from the content.");
    }
    console.log('[AI Flow - Discussion Audio] Dialogue script generated and cleaned successfully.');

    // 2. Generate multi-speaker audio from the script.
    console.log('[AI Flow - Discussion Audio] Generating multi-speaker TTS...');
    const { media } = await aiForTTS.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Speaker1', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } }, // Male
              { speaker: 'Speaker2', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } } }, // Female
            ],
          },
        },
      },
      prompt: dialogueScript,
    });

    if (!media) {
      throw new Error('TTS model did not return any media.');
    }
    console.log('[AI Flow - Discussion Audio] TTS audio data received.');

    // 3. Convert PCM audio to WAV format.
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);
    console.log('[AI Flow - Discussion Audio] Audio converted to WAV successfully.');

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
