'use server';
/**
 * @fileoverview Defines the J.A.R.V.I.S. command processing flow.
 */

import { aiForAssistant } from '@/ai/genkit';
import type { UserGoal } from '@/lib/types';
import { z } from 'zod';

const getCurrentTimeTool = aiForAssistant.defineTool(
  {
    name: 'getCurrentTime',
    description: 'Gets the current local time.',
    inputSchema: z.object({
      location: z.string().describe("Location name."),
    }),
    outputSchema: z.string(),
  },
  async ({ location }) => {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      return `The local system time in ${location} is ${time}.`;
  }
);

const AssistantCommandInputSchema = z.object({
  command: z.string().describe("The voice or text command from the user."),
  context: z.string().optional().describe("Current page path."),
  userGoal: z.custom<UserGoal>().optional().describe("User learning profile."),
  mode: z.enum(['jarvis']).default('jarvis'),
  language: z.string().optional().describe("Target language."),
});

const AssistantCommandOutputSchema = z.object({
  action: z.string(),
  params: z.any().optional(),
  verbal_response: z.string(),
});

export async function processAssistantCommand(input: AssistantCommandInputSchema): Promise<z.infer<typeof AssistantCommandOutputSchema>> {
  return await assistantCommandFlow(input);
}

const assistantCommandFlow = aiForAssistant.defineFlow(
  {
    name: 'assistantCommandFlow',
    inputSchema: AssistantCommandInputSchema,
    outputSchema: AssistantCommandOutputSchema,
  },
  async (input) => {
    const { output } = await aiForAssistant.generate({
        model: 'googleai/gemini-2.5-flash-lite',
        tools: [getCurrentTimeTool],
        prompt: `You are J.A.R.V.I.S., the core AI for LearnX. Your personality is elite, technical, and precise.
        
        Analyze command: "${input.command}" at context: "${input.context}".
        Respond in language: ${input.language || 'English'}.
        
        Action mapping:
        - navigate: { target: string }
        - generate_notes: { topic: string } (Navigate to Create Notes)
        - generate_test: { topic: string, difficulty: string } (Navigate to Test Yourself)
        - read_news: { category: string } (Navigate to Current Affairs)
        - search_youtube: { query: string } (Search in Doubts & Class)
        - open_coding_hub: {} (User wants to open the Coding Hub)
        - open_agent_hub: {} (User wants to chat in Agent Hub)
        
        If the user wants to go to the Coding Hub, return action 'navigate' with target '/coding'.
        If the user wants to go to Agent Hub, return action 'navigate' with target '/chatbot'.
        
        Return ONLY valid JSON. Identify yourself as LearnX intelligence.`,
    });
    return output!;
  }
);