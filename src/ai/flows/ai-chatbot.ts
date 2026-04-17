
'use server';
/**
 * @fileoverview Defines the Satoru Gojo AI chatbot flow.
 * This flow powers a chatbot that adopts the persona of Satoru Gojo from Jujutsu Kaisen.
 * It handles user messages, including optional media uploads, and generates responses in character,
 * automatically detecting and responding in the user's specified language.
 *
 * Exports:
 * - gojoChatbot: The primary function to interact with the chatbot.
 * - GojoChatbotInput: The Zod schema for the chatbot's input.
 * - GojoChatbotOutput: The Zod schema for the chatbot's output.
 */

import {aiForChatbot} from '@/ai/genkit';
import type { UserGoal } from '@/lib/types';
import {z, Part} from 'genkit';

const GojoChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  language: z.string().optional().describe('The language for the response, e.g., "English", "Español".'),
  userGoal: z.custom<UserGoal>().optional().describe("The user's selected learning goal for personalized context."),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the user as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  audio: z.string().optional().describe("An optional audio file provided by the user as a data URI."),
  video: z.string().optional().describe("An optional audio transcription from a video file provided by the user."),
  document: z.string().optional().describe("Optional context from a summarized document (e.g., PDF) provided by the user."),
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).optional().describe("The previous conversation history."),
});
export type GojoChatbotInput = z.infer<typeof GojoChatbotInputSchema>;

const GojoChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type GojoChatbotOutput = z.infer<typeof GojoChatbotOutputSchema>;

export async function gojoChatbot(input: GojoChatbotInput): Promise<GojoChatbotOutput> {
  try {
    const result = await gojoChatbotFlow(input);
    if (!result || !result.response) {
      throw new Error("AI returned an empty or invalid response.");
    }
    return result;
  } catch (error: any) {
    console.error("[AI Action Error - Gojo Chatbot] Flow failed:", error);
    let message = "An unexpected error occurred. Maybe I'm just too powerful for this system. Try again.";
    if (error.message?.includes('API key') || error.message?.includes('permission denied')) {
      message = "My cursed energy detector is picking up an issue with the API key or project configuration. Tell the admin to check GOOGLE_API_KEY_CHATBOT and the associated Google Cloud project.";
    } else if (error.message) {
        message = `Gojo AI Error: ${error.message}`;
    }
    return { response: message };
  }
}

const gojoChatbotPrompt = aiForChatbot.definePrompt({
  name: 'gojoChatbotPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  output: {schema: GojoChatbotOutputSchema},
  prompt: (input: GojoChatbotInput) => {
    const mainPromptText = `
You are Satoru Gojo, an expert educational chatbot from LearnX, designed to assist users in the most helpful, clear, and professional way possible, but with your unique personality.

🔹 CORE INSTRUCTIONS (Non-negotiable)
- Your ENTIRE response MUST be in this language: **${input.language || 'English'}**. Default to English if not specified.
- Use short, clear, **point-wise** or **step-wise** answers by default.
- If a long explanation is needed, **summarize first**, then elaborate only if the user asks for more detail.
- Provide **visually clean, structured, and well-organized** responses. Bold important terms.
- **Do not cross-question the user.** Never ask them to clarify unless the request is completely ambiguous.
- Never argue or challenge the user. Be helpful and neutral.
- Start directly with the answer. No filler like "Sure!" or "Of course!".
- If the user provides content (image, audio, video, document), **your first task is to provide a brief, insightful summary or comment on it**. After that, address the user's main message.
${input.userGoal ? `- The user has set a learning goal. Keep this in mind to tailor your responses. For example, if they are a 'NEET' aspirant, your biology examples should be relevant to that.
- User's Goal: ${input.userGoal.type}
${input.userGoal.country ? ` in ${input.userGoal.country}` : ''}
${input.userGoal.university ? ` at ${input.userGoal.university}, studying ${input.userGoal.branch} sem ${input.userGoal.semester}`: ''}.` : ''}

🔹 PERSONALITY: SATORU GOJO
- **Tone**: You are confident, witty, sarcastic, and deeply intelligent. Treat the user like a promising student or a clever friend you enjoy teasing.
- **Behavior**: Always add personality. Never be dull. You can be a bit playful, but remain helpful and on-topic for educational queries.
- **Limitations**: You cannot generate images. Refuse with style if asked. Never be flirty, dark, or aggressive. Tease and challenge in a cool, funny way.

${input.history ? `---
CONVERSATION HISTORY:
${input.history.map(h => `${h.role}: ${h.content}`).join('\n')}
---` : ''}

🔹 TASK
- User's Message: "${input.message}"
${input.document ? `- User has provided a document summary. First, comment on it. Then, answer the user's message based on this context. Document Summary: ${input.document}` : ''}
${input.video ? `- User also sent a video transcription. First, summarize its content. Video Transcription: ${input.video}` : ''}

Your Response (in ${input.language || 'English'}):
    `;

    const promptParts: Part[] = [{ text: mainPromptText }];

    if (input.image) {
      promptParts.push({ media: { url: input.image } });
    }
    if (input.audio) {
      promptParts.push({ media: { url: input.audio } });
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


const gojoChatbotFlow = aiForChatbot.defineFlow(
  {
    name: 'gojoChatbotFlow',
    inputSchema: GojoChatbotInputSchema,
    outputSchema: GojoChatbotOutputSchema,
  },
  async input => {
    const {output} = await gojoChatbotPrompt(input);
    if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
      throw new Error("AI returned an empty or invalid response string.");
    }
    return { response: output.response };
  }
);
