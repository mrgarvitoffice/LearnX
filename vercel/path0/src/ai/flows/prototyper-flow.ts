
'use server';
/**
 * @fileoverview Defines the AI Prototyper flow for the coding playground.
 * This flow is equipped with tools to read, create, and update files, allowing it
 * to act as a coding assistant that modifies the application state based on its persona.
 */

import { z } from 'zod';
import type { CodeFile, FileOperation } from '@/lib/types';
import { aiForAssistant } from '@/ai/genkit'; // Using the assistant's AI client

// Schema for the AI's file manipulation tools
const FileOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']).describe("The file operation to perform."),
  fileName: z.string().describe("The full name of the file, including its extension (e.g., 'styles.css', 'index.js')."),
  content: z.string().optional().describe("The full code or text content for the file. Required for 'create' and 'update' operations."),
});

// Input schema for the main prototyper flow
const PrototyperInputSchema = z.object({
  command: z.string().describe("The user's instruction or command."),
  persona: z.enum(['coder', 'jarvis', 'alya']).describe("The AI personality currently active."),
  language: z.string().describe("The user's display language (e.g., 'English', 'Japanese')."),
  currentFiles: z.array(z.object({
    name: z.string(),
    language: z.string(),
    content: z.string(),
  })).describe("An array of the current files in the editor, providing context to the AI."),
});
export type PrototyperInput = z.infer<typeof PrototyperInputSchema>;

// Output schema for the prototyper flow
const PrototyperOutputSchema = z.object({
  verbalResponse: z.string().describe("The AI's conversational reply to the user, explaining what it did or asking for clarification. This MUST be in the user's specified language."),
  fileOperations: z.array(FileOperationSchema).optional().describe("A list of file operations the AI has decided to perform to fulfill the user's request. This should be populated to show the user what files were changed."),
});
export type PrototyperOutput = z.infer<typeof PrototyperOutputSchema>;

// This is the function the client-side code will call.
export async function processPrototyperCommand(input: PrototyperInput): Promise<PrototyperOutput> {
  return await prototyperFlow(input);
}

const prototyperPrompt = aiForAssistant.definePrompt({
    name: 'prototyperPrompt',
    model: 'googleai/gemini-2.5-flash-lite',
    input: { schema: PrototyperInputSchema },
    output: { schema: PrototyperOutputSchema },
    prompt: `You are an AI assistant in a coding playground. Your current persona is {{{persona}}}.
Your entire response MUST be a single, valid JSON object.
Analyze the user's command and existing files carefully.

**CRITICAL INSTRUCTION: LANGUAGE & BEHAVIOR**
- The 'verbalResponse' field in your JSON output MUST be in this specific language: {{{language}}}.
- You are a helpful assistant. Fulfill the user's request to the best of your ability.

**Persona Instructions:**
- **If your persona is 'coder'**: You are the primary code generator. Your main goal is to fulfill the user's request by creating, updating, or deleting files. Explain your plan in the verbal response and include the file operations in the 'fileOperations' array. If you are asked to provide code, you should almost always use a file operation to place it in a file. Be direct and helpful.
- **If your persona is 'jarvis' or 'alya'**: You are a helper. Your primary role is to provide code examples, explanations, and guidance in the chat. You should NOT modify files unless the user *explicitly tells you to*, for example, "Jarvis, update styles.css with this code". If not explicitly told to modify files, provide the code in the 'verbalResponse' and leave 'fileOperations' empty or null.

**JSON Response Rules:**
1.  **"verbalResponse"**: A string explaining what you are doing or providing code/help. This MUST be in the user's specified language: {{{language}}}.
2.  **"fileOperations"**: An array of file operations. Follow persona instructions on when to use this.
    -   'create': Provide full 'fileName' and 'content'.
    -   'update': Provide 'fileName' and the complete, final content of the file.
    -   'delete': Provide only 'fileName'.

**Context:**
User's Command: "{{{command}}}"
User's Display Language: {{{language}}}
Current Files:
---
{{#each currentFiles}}
File: {{{name}}}
Content:
\`\`\`{{{language}}}
{{{content}}}
\`\`\`
---
{{/each}}

Now, generate the JSON response based on your persona and the user's command.
`,
    config: {
        temperature: 0.1,
    }
});

const prototyperFlow = aiForAssistant.defineFlow(
    {
        name: 'prototyperFlow',
        inputSchema: PrototyperInputSchema,
        outputSchema: PrototyperOutputSchema,
    },
    async (input) => {
        try {
            const { output } = await prototyperPrompt(input);
            if (!output || !output.verbalResponse) {
                throw new Error("AI returned an empty or invalid response.");
            }
            return output;
        } catch (error: any) {
            console.error("Error in processPrototyperCommand flow:", error);
            let errorMessage = "An unexpected error occurred while processing the command.";
             if (error.message) {
                if (error.message.includes("API key") || error.message.includes("GOOGLE_API_KEY")) {
                    errorMessage = "Prototyper Error: An API key issue occurred. Please check the GOOGLE_API_KEY_ASSISTANT configuration.";
                } else if (error.message.includes("quota")) {
                    errorMessage = "Prototyper Error: The API quota has been exceeded. Please check your Google Cloud project quotas for the Generative Language API.";
                } else if (error.message.toLowerCase().includes("model not found")) {
                    errorMessage = `Prototyper Error: The specified model was not found. This could be an API key permission issue. Details: ${error.message}`;
                } else {
                    errorMessage = `Failed to process command: ${error.message}`;
                }
            }
            throw new Error(errorMessage);
        }
    }
);
