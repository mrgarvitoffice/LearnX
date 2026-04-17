
'use server';
/**
 * @fileoverview Defines the Genkit flow for generating high-quality, university-level study notes.
 * This flow is specifically designed for the "Nexithra College" feature, taking academic
 * context as input to produce structured, export-ready notes based on a detailed prompt.
 */

import { aiForNotes } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCollegeNotesInputSchema = z.object({
  subject: z.string().describe("The subject for which notes are required."),
  unit: z.string().describe("The specific unit or topic name."),
});
export type GenerateCollegeNotesInput = z.infer<typeof GenerateCollegeNotesInputSchema>;

const GenerateCollegeNotesOutputSchema = z.object({
  notes: z.string().describe("Comprehensive, well-structured study notes in Markdown format, optimized for PDF/PPT export."),
});
export type GenerateCollegeNotesOutput = z.infer<typeof GenerateCollegeNotesOutputSchema>;

const generateCollegeNotesPrompt = aiForNotes.definePrompt({
  name: 'generateCollegeNotesPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  input: { schema: GenerateCollegeNotesInputSchema },
  output: { format: 'text' },
  prompt: `You are an expert academic content generator for engineering and school-level students. Your primary goal is to generate comprehensive, exam-focused study notes for the specified topic, formatted as a single Markdown string.

ACADEMIC CONTEXT:
- Subject: {{{subject}}}
- Unit/Topic: {{{unit}}}

---
CRITICAL INSTRUCTIONS: Your entire output MUST be a single Markdown string. Follow this structured format precisely. Use "---" as a hard separator between sections. Use the exact Emojis and Markdown headings as shown in this example.

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

Now, generate the notes for the user's topic ("{{{unit}}}") within the subject ("{{{subject}}}") following the exact structure, spacing, and formatting shown in the example above.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});


const generateCollegeNotesFlow = aiForNotes.defineFlow(
  {
    name: 'generateCollegeNotesFlow',
    inputSchema: GenerateCollegeNotesInputSchema,
    outputSchema: GenerateCollegeNotesOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - College Notes] Generating notes for unit: ${input.unit}`);
    const llmResponse = await generateCollegeNotesPrompt(input);
    const notesText = llmResponse.text?.trim();

    if (!notesText) {
      throw new Error("AI failed to generate notes. The response was empty.");
    }
     return { notes: notesText };
  }
);

export async function generateCollegeNotes(input: GenerateCollegeNotesInput): Promise<GenerateCollegeNotesOutput> {
  console.log(`[AI Wrapper] generateCollegeNotes called for unit: ${input.unit}`);
  try {
    return await generateCollegeNotesFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error - generateCollegeNotes] Error in flow execution:", error.message);
    throw new Error(`Failed to generate college notes. Error: ${error.message}`);
  }
}
