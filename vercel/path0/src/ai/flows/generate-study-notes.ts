
/**
 * @fileoverview Defines the primary Genkit flow for generating comprehensive study notes.
 * This flow creates well-structured, Markdown-formatted notes for a given topic.
 * It also identifies opportunities for visual aids and calls the `generate-image-from-prompt` flow
 * to create and embed relevant images directly into the notes.
 */

'use server';

import {aiForNotes} from '@/ai/genkit'; 
import {z, Part} from 'genkit';
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
  output: { format: 'text' }, // Request raw Markdown text for higher reliability
  prompt: (input: GenerateStudyNotesInput) => {
    const mainPromptText = `You are a highly intelligent academic AI tutor. Your task is to generate top-quality, exam-focused study notes. Your output MUST be a single, well-formatted Markdown string.

**TOPIC:** ${input.topic}

**CONTEXT:**
${input.notes ? `- Use the following user-provided notes as the primary source material: \n---\n${input.notes}\n---` : ''}
${input.video ? `- Use the following user-provided video transcription as context: \n---\n${input.video}\n---` : ''}

**YOUR GOAL:**
- Provide a comprehensive understanding of the topic, making it easy for anyone to learn.
- Make the content suitable for scoring high in exams or for deep understanding.
- Ensure the notes are easy to revise and visually memorable.
- Include mini-reflection points like "Remember this," "Quick tip," or "Check yourself."
- Add helpful examples, formulas, and visual placeholders where needed.

**CRITICAL INSTRUCTIONS - FOLLOW THIS FORMAT EXACTLY:**
Use "---" as a hard separator between sections. Use the exact Emojis and Markdown headings as shown in this example.

---
[EXAMPLE START]
# 🟦 UNIT 2: FEASIBILITY ANALYSIS AND COST ESTIMATION

## 🧠 INTRODUCTION

A software feasibility study is conducted in the early stages of the Software Development Life Cycle (SDLC). Its purpose is to determine whether the proposed system is viable, cost-effective, legally compliant, and technically achievable. This unit also covers cost estimation, a critical part of project planning and resource allocation.

---
## ✅ CORE CONCEPTS

---
### 🔹 Feasibility Study: Definition

- It is an evaluation of how successfully a software project can be completed.
- Involves analyzing the project's technical, economic, legal, operational, and scheduling aspects.
- Conducted before the main development begins to avoid project failure or cost overruns.

---
### 🔸 Types of Feasibility (Mnemonic: TELOS)

1.  **🛠 Technical Feasibility**
    - Determines whether the existing technology is sufficient.
    - Checks hardware, software, and technical skills.
    - Example: Can your team build a mobile app using Flutter if they’ve only used Java before?

2.  **💰 Economic Feasibility**
    - Cost-benefit analysis: Will the benefits outweigh the development costs?
    - Includes ROI, break-even point, and risk of loss.
    - Example: Is it worth spending ₹10 lakhs to build an e-learning app that may generate ₹12 lakhs?

---
## 🖼 DIAGRAMS & VISUAL AID

| 🧩 Topic | Description | 🌐 Preview Link |
|---|---|---|
| Spiral Model | Iterative dev with risk analysis | [VISUAL_PROMPT: Diagram of the Spiral Model in software engineering] |
| Feasibility Tree | Decision diagram with TELOS branches | [VISUAL_PROMPT: A decision tree showing the types of feasibility study] |
| COCOMO Graph | Cost vs. KLOC estimation graph | [VISUAL_PROMPT: A graph showing the COCOMO cost estimation curve] |

---
## 💡 TIPS & EXAM HACKS

- ✍ TELOS mnemonic is essential for types of feasibility — write all 5 in answers!
- 📉 Draw a simple COCOMO formula box for extra marks
- ✅ Mention at least 2 real-world examples (e.g., mobile app, banking system)

---
## ❓ PRACTICE QUESTIONS

1.  Define feasibility study. Explain its types with real-world examples.
2.  Compare Function Point and COCOMO models.
3.  Explain cost estimation and factors affecting it.

---
## 📎 SUMMARY

- A feasibility study ensures that a software idea is practical and justified.
- Cost estimation helps avoid over-budgeting and delays.
- Models like COCOMO make predictions based on project size.
[EXAMPLE END]
---

Now, generate the notes for the user's topic following the exact structure, spacing, and formatting shown in the example above. Use Markdown headings (#, ##, ###) to create a clear hierarchy. Ensure the output is visually rich and ready for a good student handout.
`;

    const promptParts: Part[] = [{ text: mainPromptText }];
    if (input.image) {
      promptParts.push({ text: "The user has provided an image. Use it as primary context for the notes." });
      promptParts.push({ media: { url: input.image } });
    }
     if (input.audio) {
      promptParts.push({ text: "The user has provided an audio file. Use its content as context." });
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
    console.log(`[AI Flow - Notes Text] Generating notes text for topic: ${input.topic}`);
    const llmResponse = await generateStudyNotesPrompt(input);
    const notesText = llmResponse.text;
    
    if (!notesText || notesText.trim() === '') {
      console.error("[AI Flow Error - Notes Text] AI returned empty or invalid notes data.");
      throw new Error("AI failed to generate notes text in the expected style. The returned data was empty or invalid.");
    }
    
    let notesWithPlaceholders = notesText;
    console.log(`[AI Flow - Notes Text] Successfully generated notes text for topic: ${input.topic}. Length: ${notesWithPlaceholders.length}`);

    const visualPromptRegex = /\[VISUAL_PROMPT:\s*([^\]]+)\]/g;
    let match;
    const visualPrompts: { fullMatch: string, promptText: string }[] = [];

    while ((match = visualPromptRegex.exec(notesWithPlaceholders)) !== null) {
      visualPrompts.push({ fullMatch: match[0], promptText: match[1].trim() });
    }
    
    console.log(`[AI Flow - Notes Images] Found ${visualPrompts.length} visual prompts to process for image generation:`, visualPrompts.map(vp => vp.promptText));

    if (visualPrompts.length > 0) {
        const imageGenerationPromises = visualPrompts.map(vp => 
            generateImageFromPrompt({ prompt: vp.promptText })
        );
        const settledResults = await Promise.allSettled(imageGenerationPromises);

        let finalNotes = notesWithPlaceholders;
        settledResults.forEach((result, index) => {
            const originalPrompt = visualPrompts[index];
            if (result.status === 'fulfilled' && result.value.imageUrl) {
                console.log(`[AI Flow - Notes Images] Got image URL for: "${originalPrompt.promptText.substring(0,30)}...". Replacing placeholder with image link.`);
                const markdownImage = `![${originalPrompt.promptText.replace(/"/g, "'")}](${result.value.imageUrl})`;
                finalNotes = finalNotes.replace(originalPrompt.fullMatch, markdownImage);
            } else {
                console.warn(`[AI Flow - Notes Images] Failed to generate image for prompt: "${originalPrompt.promptText}". The placeholder will remain.`);
            }
        });
        
        console.log(`[AI Flow - Notes Images] Finished processing all visual prompts. Final notes length: ${finalNotes.length}`);
        return { notes: finalNotes };
    } else {
         console.log(`[AI Flow - Notes Images] No visual prompts found. Returning original notes.`);
         return { notes: notesWithPlaceholders };
    }
  }
);

export async function generateStudyNotes(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  console.log(`[AI Wrapper] generateStudyNotes called for topic: ${input.topic}. Using notes-specific AI configuration if GOOGLE_API_KEY_NOTES is set.`);
  try {
    return await generateStudyNotesFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error - generateStudyNotes] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate study notes. Please try again.";
    const lowerCaseError = error.message?.toLowerCase() || "";

    if (lowerCaseError.includes("model not found") || lowerCaseError.includes("permission denied") || lowerCaseError.includes("api key not valid")) {
      clientErrorMessage = "Study Notes: Generation failed due to an API key or project configuration issue. Please check that the GOOGLE_API_KEY_NOTES (or its fallback) is correct and that the 'Generative Language API' is enabled with billing in its Google Cloud project.";
    } else if (lowerCaseError.includes("api key") || lowerCaseError.includes("google_api_key")) {
       clientErrorMessage = "Study Notes: Generation failed due to an API key issue. Please check server configuration (GOOGLE_API_KEY, GOOGLE_API_KEY_NOTES, or GOOGLE_API_KEY_IMAGES) and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Study Notes: Generation failed. Error: ${error.message.substring(0, 150)}. Check server logs for full details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
