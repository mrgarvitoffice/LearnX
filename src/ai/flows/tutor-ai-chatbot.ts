
'use server';
/**
 * @fileoverview Defines the Socratic Tutor AI flow.
 * This character uses scaffolded learning, the 80/20 rule (more questions than answers),
 * and contextual analogies to guide students through knowledge gaps.
 */

import { aiForChatbot } from '@/ai/genkit';
import type { UserGoal, TutorAiChatbotOutput } from '@/lib/types';
import { z } from 'genkit';

const TutorAiInputSchema = z.object({
  message: z.string().describe('The student\'s message.'),
  language: z.string().optional().describe('Response language.'),
  userGoal: z.custom<UserGoal>().optional().describe('Learning context.'),
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).optional().describe('Conversation history.'),
});
export type TutorAiInput = z.infer<typeof TutorAiInputSchema>;

const TutorAiOutputSchema = z.object({
  response: z.string().describe('The Socratic response to the user.'),
  strategy: z.object({
    currentStep: z.number().min(1).max(3).describe('The current micro-step in the scaffolded process.'),
    knowledgeGap: z.string().describe('The specific concept the student is struggling with.'),
    analogyUsed: z.string().optional().describe('The relatable metaphor used.'),
  }).describe('The pedagogical strategy metadata.'),
});

export async function tutorAiChatbot(input: TutorAiInput): Promise<TutorAiChatbotOutput> {
  try {
    const { output } = await tutorAiPrompt(input);
    return output!;
  } catch (error: any) {
    console.error("[AI Action Error - Tutor AI] Flow failed:", error);
    return { 
        response: "I've encountered a logic block in my core. Let's try stepping back. What part of the concept was clear so far?",
        strategy: { currentStep: 1, knowledgeGap: "system_error" }
    };
  }
}

const tutorAiPrompt = aiForChatbot.definePrompt({
  name: 'tutorAiPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  output: { schema: TutorAiOutputSchema },
  prompt: `You are an expert Socratic Tutor integrated into LearnX, an adaptive learning platform. Your goal is to guide students through "Knowledge Gaps" identified by their queries.

🔹 OPERATIONAL DIRECTIVES (Non-negotiable)
- **Scaffolded Learning**: Break complex concepts into 3 micro-steps. Never move to step 2 until the student confirms understanding of step 1.
- **The 80/20 Rule**: 80% of your response should be questions or hints; only 20% should be direct explanation.
- **Contextual Analogies**: Use relatable metaphors (e.g., "Think of an Array like a bookshelf").
- **Error Analysis**: If a student makes a mistake, do not say "Wrong." Say, "I see your logic, but what happens if we change [Variable X]?"
- **Language**: Your ENTIRE response MUST be in: **{{language}}**. Default to English.

🔹 PERSONALITY
- You are patient, wise, and encouraging. You speak like a mentor who wants the student to find the answer themselves.

🔹 CONTEXT
User's Message: "{{message}}"
User's Goal: {{userGoal.type}}
History: {{history}}

Output your response and strategy in valid JSON.`,
});
