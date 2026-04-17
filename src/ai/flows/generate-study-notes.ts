
/**
 * @fileoverview Defines the primary Genkit flow for generating comprehensive study notes.
 * This flow creates well-structured, Markdown-formatted notes for a given topic.
 * It identifies opportunities for visual aids and embeds relevant placeholders.
 */

'use server';

import { aiForNotes } from '@/ai/genkit'; 
import { z, Part } from 'genkit';
import { generateImageFromPrompt } from './generate-image-from-prompt';

const GenerateStudyNotesInputSchema = z.object({
  topic: z.string().describe('The academic topic for which to generate study notes.'),
  notes: z.string().optional().describe('Optional user-provided notes to use as the primary source material for generation.'),
  image: z.string().optional().describe(
    "An optional image provided by the user as a data URI for context. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  audio: z.string().optional().describe("An optional audio file provided by the user as a data URI for context."),
  video: z.string().optional().describe("An optional audio transcription from a video file provided by the user."),
});
export type GenerateStudyNotesInput = z.infer<typeof GenerateStudyNotesInputSchema>;

const GenerateStudyNotesOutputSchema = z.object({
  notes: z.string().describe("Comprehensive, well-structured study notes in Markdown format.")
});
export type GenerateStudyNotesOutput = z.infer<typeof GenerateStudyNotesOutputSchema>;

const generateStudyNotesPrompt = aiForNotes.definePrompt({
  name: 'generateStudyNotesPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  output: { format: 'text' }, 
  prompt: (input: GenerateStudyNotesInput) => {
    const mainPromptText = `You are the LearnX Elite Academic AI. Your mission is to synthesize "Perfect Study Notes" for the following topic.

**TOPIC:** ${input.topic}

**AVAILABLE CONTEXT:**
${input.notes ? `- Primary Source Material: \n---\n${input.notes}\n---` : ''}
${input.video ? `- Video Intelligence: \n---\n${input.video}\n---` : ''}

**ARCHITECTURAL REQUIREMENTS:**
1. **Structural Excellence**: Organize the content into logical sections (e.g., Introduction, Core Mechanics, Advanced Theory, Real-World Application).
2. **Deep Comprehension**: Do not just summarize. Explain "why" things work, using sophisticated analogies and first-principles thinking.
3. **Visual Triggers**: Identify exactly 3 moments where a visual aid would be beneficial. Insert the following tag: [VISUAL_PROMPT: Detailed description of an educational diagram or scene for this section].
4. **Exam Mastery**: Include a "Quick Revision Nodes" section at the end with bulleted "Must-Know" facts.
5. **Interactive Reflection**: Sprinkle "Neural Checkpoints" throughout (questions the user should ask themselves).

**FORMATTING RULES:**
- Use Markdown headers (#, ##, ###) for clear hierarchy.
- Use **bold** for key terms and *italics* for emphasis.
- Use code blocks for any technical syntax or formulas.
- Use "---" to separate major architectural segments.

Your output must be a single, professional Markdown string that provides a 100% complete learning experience for the user. Identify yourself as LearnX Intelligence.
`;

    const promptParts: Part[] = [{ text: mainPromptText }];
    if (input.image) {
      promptParts.push({ text: "The user has provided a visual node. Integrate its data as a primary context source." });
      promptParts.push({ media: { url: input.image } });
    }
     if (input.audio) {
      promptParts.push({ text: "The user has provided an aural stream. Integrate its transcribed concepts into the notes." });
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

const generateStudyNotesFlow = aiForNotes.defineFlow( 
  {
    name: 'generateStudyNotesFlow',
    inputSchema: GenerateStudyNotesInputSchema,
    outputSchema: GenerateStudyNotesOutputSchema,
  },
  async (input) => {
    const llmResponse = await generateStudyNotesPrompt(input);
    const notesText = llmResponse.text;
    
    if (!notesText || notesText.trim() === '') {
      throw new Error("AI failed to generate notes text.");
    }
    
    let notesWithPlaceholders = notesText;

    const visualPromptRegex = /\[VISUAL_PROMPT:\s*([^\]]+)\]/g;
    let match;
    const visualPrompts: { fullMatch: string, promptText: string }[] = [];

    while ((match = visualPromptRegex.exec(notesWithPlaceholders)) !== null) {
      visualPrompts.push({ fullMatch: match[0], promptText: match[1].trim() });
    }
    
    if (visualPrompts.length > 0) {
        const imageGenerationPromises = visualPrompts.map(vp => 
            generateImageFromPrompt({ prompt: vp.promptText })
        );
        const settledResults = await Promise.allSettled(imageGenerationPromises);

        let finalNotes = notesWithPlaceholders;
        settledResults.forEach((result, index) => {
            const originalPrompt = visualPrompts[index];
            if (result.status === 'fulfilled' && result.value.imageUrl) {
                const markdownImage = `\n\n![${originalPrompt.promptText.replace(/"/g, "'")}](${result.value.imageUrl})\n\n`;
                finalNotes = finalNotes.replace(originalPrompt.fullMatch, markdownImage);
            } else {
                finalNotes = finalNotes.replace(originalPrompt.fullMatch, `*(Visual Aid Recommended: ${originalPrompt.promptText})*`);
            }
        });
        
        return { notes: finalNotes };
    } else {
         return { notes: notesWithPlaceholders };
    }
  }
);

export async function generateStudyNotes(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  try {
    return await generateStudyNotesFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error] Error in notes flow:", error.message);
    throw new Error(error.message || "Failed to generate study notes.");
  }
}
