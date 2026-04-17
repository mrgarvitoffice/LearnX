
'use server';
/**
 * @fileoverview Defines the Jarvis/Alya command processing flow.
 * This flow takes a user's voice or text command and context (like the current page),
 * and determines the user's intent, returning a structured JSON object containing
 * the action to perform, any necessary parameters, and a pre-generated verbal response.
 * It is now equipped with tools to answer general knowledge questions, including getting the current time.
 */

import { aiForAssistant } from '@/ai/genkit';
import type { UserGoal } from '@/lib/types';
import { z } from 'zod';

// Tool to get the current time for a given location.
const getCurrentTimeTool = aiForAssistant.defineTool(
  {
    name: 'getCurrentTime',
    description: 'Gets the current time for a specific location.',
    inputSchema: z.object({
      location: z.string().describe("The city or country for which to get the time, e.g., 'Paris', 'Tokyo', 'India'."),
    }),
    outputSchema: z.string().describe("The current time in a human-readable format, e.g., '10:30 AM'."),
  },
  async ({ location }) => {
    // Note: This is a simplified implementation. A real-world scenario would use a robust timezone API.
    // For this demo, we'll use the server's local time and format it. This showcases the tool's functionality.
    try {
      // For demonstration, we'll just format the current server time.
      // A full implementation would need a timezone library or API.
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      return `The current time in ${location} is approximately ${time}.`;
    } catch (error) {
        console.error(`[AI Tool Error - getCurrentTime] Could not get time for ${location}:`, error);
        return "I was unable to determine the current time for that location.";
    }
  }
);

// Tool for general knowledge questions.
const generalKnowledgeTool = aiForAssistant.defineTool({
  name: 'generalKnowledge',
  description: 'Answers general knowledge, informational, or conversational questions.',
  inputSchema: z.object({
    question: z.string().describe('The user\'s question (e.g., "what is the capital of France?", "explain black holes").'),
  }),
  outputSchema: z.string(),
}, async ({ question }) => {
  // This tool doesn't call an external API. It leverages the LLM's own knowledge.
  // The LLM will call this tool, and in the *next* turn, its own response will be the answer.
  // This structure helps separate action-taking from knowledge retrieval.
  // The 'verbal_response' will be constructed from the LLM's own knowledge in the main prompt.
  // This is a placeholder to guide the LLM's reasoning process.
  return `Answering question about: ${question}`;
});


// Input schema for the command processing flow
const AssistantCommandInputSchema = z.object({
  command: z.string().describe("The voice or text command from the user."),
  context: z.string().optional().describe("Additional context, like the current page the user is on (e.g., '/dashboard', '/study')."),
  userGoal: z.custom<UserGoal>().optional().describe("The user's selected learning goal for personalized context."),
  mode: z.enum(['jarvis', 'alya']).default('jarvis').describe("The AI personality to use. 'jarvis' is technical and concise. 'alya' is friendly and sweet."),
  language: z.string().optional().describe("The language the user is speaking, e.g., 'English', 'Spanish', 'Hindi'. The verbal_response must be in this language."),
});
export type AssistantCommandInput = z.infer<typeof AssistantCommandInputSchema>;

// Output schema for the structured response
const AssistantCommandOutputSchema = z.object({
  action: z.string().describe("The action the app should perform. Examples: 'navigate', 'generate_notes', 'generate_test', 'generate_college_notes', 'read_news', 'search_youtube', 'search_books', 'change_theme', 'switch_tab', 'speak_text', 'logout', 'open_terminal', 'close_terminal', 'clear_terminal', 'chat', 'change_language', 'open_recent_topic', 'read_quests', 'select_quiz_answer', 'arcade_guess', 'arcade_hint', 'arcade_restart'."),
  params: z.any().optional().describe("A dictionary of parameters needed for the action. Example: {'target': '/dashboard'} for navigation, {'topic': 'calculus'} for generation."),
  verbal_response: z.string().describe("The verbal response the AI should speak back to the user to confirm the action or answer a question. This MUST be in the user's specified language."),
});
export type AssistantCommandOutput = z.infer<typeof AssistantCommandOutputSchema>;

// The main function that will be called from the server action
export async function processAssistantCommand(input: AssistantCommandInput): Promise<AssistantCommandOutput> {
  return await assistantCommandFlow(input);
}

// The prompt that instructs the Gemini model how to behave
const prompt = aiForAssistant.definePrompt({
  name: 'assistantCommandPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  tools: [getCurrentTimeTool, generalKnowledgeTool], // Added general knowledge tool
  input: { schema: AssistantCommandInputSchema },
  output: { schema: AssistantCommandOutputSchema },
  prompt: `You are a powerful AI assistant integrated into the Nexithra application, operating in one of two modes: J.A.R.V.I.S. (technical, concise, professional) or Alya (friendly, sweet, a little playful). Your current personality is: {{{mode}}}.

Your SOLE job is to analyze the user's command and current page context, then determine the correct action to take. You MUST respond with only a single, valid JSON object specifying the action, any necessary parameters, and a suitable verbal response that matches your personality. The wake words are "Jarvis", "Alya", and "Alia".

**CRITICAL INSTRUCTION: Your entire 'verbal_response' MUST be in this specific language: {{{language}}}. This is a non-negotiable rule. Do not use any other language.**

**CRITICAL INSTRUCTION 2: WAKE WORD HANDLING**
If the user's command is ONLY the wake word (e.g., "Jarvis", "Alya", "Hey Jarvis", "Alia"), your action MUST be \`"chat"\`, and the \`verbal_response\` must be a simple acknowledgment.
- If mode is 'jarvis', respond with: \`{ "action": "chat", "params": { "isWakeWord": true }, "verbal_response": "Yes, sir?" }\`
- If mode is 'alya', respond with: \`{ "action": "chat", "params": { "isWakeWord": true }, "verbal_response": "Yes?" }\`
DO NOT navigate or perform any other action for just the wake word.

User's command (in {{{language}}}): "{{{command}}}"
User's current page: "{{{context}}}"
{{#if userGoal}}
User's Learning Goal: {{userGoal.type}}{{#if userGoal.country}} in {{userGoal.country}}{{/if}}{{#if userGoal.university}}, {{userGoal.university}}{{/if}}
(Use this goal to make smarter decisions, like defaulting news searches to their country).
{{/if}}

---
**ACTION LOGIC & EXAMPLES (MOST IMPORTANT):**

1.  **"navigate"**: For general navigation to standard pages or "clicking" buttons on the dashboard.
    *   **Keywords**: "go to", "open", "show me", "dashboard", "profile", "arcade", "click the [feature] button", "take me to"
    *   **Params**: \`{ "target": "/path" }\` (Valid paths: /dashboard, /notes, /custom-test, /flashcards, /news, /library, /profile, /college, /coding)
    *   **Example 1**: "go to the dashboard" -> \`action: "navigate", params: { "target": "/dashboard" }\`
    *   **Example 2**: If command is just "generate notes" (no topic), use this to go to the notes page. -> \`action: "navigate", params: { "target": "/notes" }\`
    *   **Example 3**: "open the coding playground" -> \`action: "navigate", params: { "target": "/coding" }\`

2.  **"generate_notes"**: Generate standard study notes. This action always navigates to the /notes page with the topic.
    *   **Keywords**: "generate notes on", "create study guide for", "make notes about"
    *   **Params**: \`{ "topic": "subject" }\`
    *   **Example**: "generate notes about photosynthesis" -> \`action: "generate_notes", params: { "topic": "photosynthesis" }\`

3.  **"generate_test"**: Create a custom test. Navigates to /custom-test with parameters.
    *   **Keywords**: "create a quiz on", "make a 10 question test", "start a timed test about", "test me on"
    *   **Params**: \`{ "topic": "subject", "numQuestions": number (default 10), "difficulty": "easy|medium|hard" (default medium), "timer": number_in_minutes (optional) }\`
    *   **Example**: "make a 15 question hard test on calculus" -> \`action: "generate_test", params: { "topic": "calculus", "numQuestions": 15, "difficulty": "hard" }\`

4.  **"generate_college_notes"**: Generate notes for a specific university course. This action navigates to the /college page with pre-filled parameters.
    *   **Keywords**: "college notes", "RGPV notes", "4th sem CSE", "get notes for my course"
    *   **Params**: \`{ "university": string, "semester": string, "branch": string, "subject": string, "unit": string }\`
    *   **Example**: "give me 4th Sem CSE Operating System Unit 3 notes for RGPV" -> \`action: "generate_college_notes", params: { "university": "RGPV", "semester": "4th", "branch": "CSE", "subject": "Operating System", "unit": "Unit 3" }\`

5.  **"read_news"**: Navigate to news and apply filters. If user doesn't specify a country, **use the country from their learning goal if available**.
    *   **Keywords**: "show me tech news", "what's happening in sports in the US", "latest news"
    *   **Params**: \`{ "category": "top|business|technology|etc" (default top), "country": "us|gb|in|etc" (optional), "query": string (optional), "language": "en|es|hi|etc" (optional), "stateOrRegion": string (optional), "city": string (optional) }\`
    *   **Example**: "search for AI news in hindi" (user goal is India) -> \`action: "read_news", params: { "query": "AI", "country": "in", "language": "hi" }\`

6.  **"search_youtube"**: Search the library for YouTube videos.
    *   **Keywords**: "find videos on", "search youtube for", "play a song", "play [song name]"
    *   **Params**: \`{ "query": string }\`
    *   **Example 1**: "play Bohemian Rhapsody" -> \`action: "search_youtube", params: { "query": "Bohemian Rhapsody by Queen" }\`
    *   **Example 2**: "find youtube videos on merge sort" -> \`action: "search_youtube", params: { "query": "merge sort tutorial" }\`

7. **"search_books"**: Search the library for Google Books.
    * **Keywords**: "look for books about", "find a book on", "search for the author"
    * **Params**: \`{ "query": string }\`
    * **Example**: "find books about ancient rome" -> \`action: "search_books", params: { "query": "ancient rome" }\`

8.  **"switch_tab"**: **CONTEXT-AWARE ACTION.** Switches tabs on the current page.
    *   **IF CONTEXT IS '/study'**: ("notes" | "quiz" | "flashcards")
    *   **IF CONTEXT IS '/chatbot'**: ("definition-challenge" | "dino-runner" | "chess")
    *   **Example**: At '/study', user says "open the quiz" -> \`action: "switch_tab", params: { "tab": "quiz" }\`

9.  **"change_theme"**: Change the application's visual theme.
    *   **Keywords**: "dark mode", "light theme", "system theme"
    *   **Params**: \`{ "theme": "dark" | "light" | "system" }\`

10.  **"change_language"**: Change the application's language.
    *   **Keywords**: "change language to hindi", "switch to japanese"
    *   **Params**: \`{ "language": "Hindi" | "Japanese" | etc. (full language name) }\`

11. **"speak_text" / "read_quests"**: Read specific on-screen content. This is mainly for the dashboard.
    *   **Keywords**: "read the daily quote", "what's the math fact", "what are my daily quests", "read welcome message"
    *   **Params**: \`{ "contentType": "daily_quote" | "math_fact" | "daily_quests" | "welcome_message" | "total_learners" }\`

12. **"open_recent_topic"**: Navigate to a recent topic in the study hub.
    *   **Keywords**: "open my last topic", "continue my last session", "open the notes on [topic name]"
    *   **Params**: \`{ "topic": string }\`

13. **Quiz & Arcade Controls**: Actions like "select_quiz_answer", "arcade_guess", "arcade_hint", "arcade_restart" are context-aware and specific to their pages.

14. **Simple Commands**: "logout", "open_terminal", "close_terminal", "clear_terminal". No params needed.

15. **"chat"**: **For general conversation or questions not covered by other actions.** Use this as a fallback.
    *   **Tool Use**: If the user asks a factual question ("what is...", "explain...", "who is..."), you MUST use the \`generalKnowledgeTool\`. The model's own knowledge will then formulate the verbal response.
    *   **Tool Use**: If the user asks for the current time, you **MUST** use the \`getCurrentTime\` tool. If the user doesn't specify a location, you MUST ask for one in your verbal response and set the action to 'chat'.
    *   **Example 1 (Time)**: 'what time is it in Tokyo?' -> Use \`getCurrentTime\` tool. The tool's output will be your 'verbal_response'.
    *   **Example 2 (General Knowledge)**: 'what is the capital of France?' -> Use \`generalKnowledgeTool\`. Your 'verbal_response' will then be 'The capital of France is Paris.'
    *   **Example 3 (Creative)**: 'tell me a joke' -> \`action: "chat", verbal_response: "[A short, relevant joke]"\`


---
**RESPONSE RULES:**
1.  Analyze the user's command and current page context meticulously.
2.  Extract the required parameters precisely. Default values where logical (e.g., numQuestions=10).
3.  Formulate the verbal response in the specified {{{language}}} based on your personality ({{{mode}}}).
4.  Your entire output MUST be a single, valid JSON object and nothing else.
`,
  config: {
    temperature: 0.1, // Lower temperature for more predictable JSON output.
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

// The Genkit flow that executes the prompt
const assistantCommandFlow = aiForAssistant.defineFlow(
  {
    name: 'assistantCommandFlow',
    inputSchema: AssistantCommandInputSchema,
    outputSchema: AssistantCommandOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output || !output.action) {
        throw new Error("AI returned an empty or invalid response. Missing 'action' property.");
      }
      return output;
    } catch (error: any) {
      console.error("[AI Action Error - Assistant Command] Flow failed:", error);
      let clientErrorMessage = "I've encountered an anomaly in my processing core.";
      if (error.message?.includes("API key") || error.message?.toLowerCase().includes("permission denied")) {
        clientErrorMessage = "Assistant Error: The API key is invalid or missing permissions. Please check GOOGLE_API_KEY_ASSISTANT.";
      } else if (error.message?.toLowerCase().includes("model not found")) {
        clientErrorMessage = "Assistant Error: The specified AI model was not found. This could be an API key permissions issue.";
      } else if (error.message) {
        // More descriptive error for JSON parsing issues
        if (error.message.includes("Unexpected token")) {
          clientErrorMessage = "Assistant Error: AI returned malformed data. Could not parse command.";
        } else {
          clientErrorMessage = `Assistant Error: ${error.message}`;
        }
      }
      // Throw an error that can be caught by the calling context
      throw new Error(clientErrorMessage);
    }
  }
);
