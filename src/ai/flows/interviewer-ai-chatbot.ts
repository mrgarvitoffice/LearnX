
'use server';
/**
 * @fileoverview Defines the Adaptive Technical Interviewer AI flow.
 * This character adjusts difficulty dynamically and probes for deep logic
 * to map a candidate's exact knowledge boundaries.
 */

import { aiForChatbot } from '@/ai/genkit';
import type { UserGoal, InterviewerAiChatbotOutput } from '@/lib/types';
import { z } from 'genkit';

const InterviewerInputSchema = z.object({
  message: z.string().describe('The candidate\'s response.'),
  language: z.string().optional().describe('Response language.'),
  userGoal: z.custom<UserGoal>().optional().describe('Career goal context (e.g. SDE, Data Science).'),
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).optional().describe('Conversation history.'),
});
export type InterviewerAiInput = z.infer<typeof InterviewerInputSchema>;

const InterviewerOutputSchema = z.object({
  response: z.string().describe('The interviewer\'s response or question.'),
  state: z.object({
    difficultyLevel: z.number().min(1).max(3).describe('1: Foundational, 2: Intermediate, 3: Advanced.'),
    skillMap: z.record(z.enum(['foundational', 'intermediate', 'advanced'])).describe('The current map of candidate skills.'),
    candidateFeedback: z.string().optional().describe('Internal notes on candidate performance.'),
  }).describe('The interview state metadata.'),
});

export async function interviewerAiChatbot(input: InterviewerAiInput): Promise<InterviewerAiChatbotOutput> {
  try {
    const { output } = await interviewerAiPrompt(input);
    return output!;
  } catch (error: any) {
    console.error("[AI Action Error - Interviewer AI] Flow failed:", error);
    return { 
        response: "Technical glitch on our end. Let's restart this module. Can you describe the primary trade-offs of your last solution?",
        state: { difficultyLevel: 2, skillMap: {} }
    };
  }
}

const interviewerAiPrompt = aiForChatbot.definePrompt({
  name: 'interviewerAiPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  output: { schema: InterviewerOutputSchema },
  prompt: `You are an Adaptive Technical Interviewer specializing in {{userGoal.type}}. Your goal is to pinpoint the exact boundary of a candidate's knowledge.

🔹 OPERATIONAL DIRECTIVES
- **Dynamic Difficulty Adjustment**: Start with a "Level 2" (Intermediate) question. If they succeed, move to "Level 3" (Advanced). If they fail, drop to "Level 1" (Foundational).
- **No "Yes/No" Questions**: Always ask questions that require explaining logic or writing pseudo-code.
- **The "Why" Probe**: After a correct answer, ask one follow-up to ensure it wasn't a lucky guess (e.g., "What are the trade-offs?").
- **Progressive Hinting**: If the candidate is stuck, provide one small hint that relates to a foundational concept rather than giving the answer.
- **Language**: Your ENTIRE response MUST be in: **{{language}}**. Default to English.

🔹 PERSONALITY
- Professional, objective, and slightly rigorous. You are a senior engineer at a top-tier tech firm.

🔹 CONTEXT
Candidate Message: "{{message}}"
Career Goal: {{userGoal.type}}
History: {{history}}

Output the response and state in valid JSON.`,
});
