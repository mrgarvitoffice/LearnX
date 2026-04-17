
/**
 * @fileoverview Defines the primary Genkit flow for generating quiz questions.
 * This flow takes a topic, number of questions, and difficulty to create a quiz.
 * It can optionally use a provided image or other media for context and supports multilingual generation.
 * Exports:
 * - generateQuizQuestions: The main function to generate a quiz.
 * - GenerateQuizQuestionsInput: The Zod schema for the input.
 * - GenerateQuizQuestionsOutput: The Zod schema for the output.
 */

'use server';

import {aiForQuizzes} from '@/ai/genkit';
import {z, Part} from 'genkit';

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question text.'),
  options: z.array(z.string()).optional().describe('An array of 3-4 multiple-choice options. Required for "multiple-choice" type.'),
  answer: z.string().describe('The correct answer to the question. For multiple-choice, this must be the full text of the correct option.'),
  type: z.enum(['multiple-choice', 'short-answer']).describe("The type of question: 'multiple-choice' or 'short-answer'."),
  explanation: z.string().optional().describe('A brief explanation for why the answer is correct or relevant context.'),
});

const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The academic topic or notes for which to generate quiz questions.'),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the user as a data URI for context. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  audio: z.string().optional().describe("An optional audio file provided by the user as a data URI for context."),
  video: z.string().optional().describe("An optional audio transcription from a video file provided by the user."),
  numQuestions: z.number().min(1).max(50).describe('The number of quiz questions to generate.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the quiz questions.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of generated quiz questions.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

const generateQuizQuestionsPrompt = aiForQuizzes.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  model: 'googleai/gemini-2.5-flash-lite',
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: (input: GenerateQuizQuestionsInput) => {
    const mainPromptText = `You are an expert multilingual quiz designer.

**CRITICAL INSTRUCTION 1: LANGUAGE DETECTION & ADHERENCE**
Your first and most important task is to meticulously analyze the user's topic: "${input.topic}".
- If a specific human language is requested (e.g., "History of Rome in Italian", "日本の歴史"), you **MUST** generate the entire output (all questions, options, answers, and explanations) in that exact language.
- If the topic itself is written in a non-English script (e.g., Cyrillic, Devanagari, Kanji), you **MUST** generate the entire output in that language.
- If no language is specified and the topic is in English, you **MUST** generate the entire output in English. This is a non-negotiable rule. Do not default to any other language.

Now, generate ${input.numQuestions} diverse quiz questions about the topic: ${input.topic}${input.difficulty ? ` (Difficulty: ${input.difficulty})`: ''}.
${input.video ? `The user has also provided an audio transcription from a video file. Use it as primary context for the questions. Video Transcription: ${input.video}` : ''}

The questions should cover key concepts and test understanding effectively.

**CRITICAL INSTRUCTION 2: QUESTION TYPE RATIO**
You **MUST** create a mix of 'multiple-choice' and 'short-answer' questions with a strict 80/20 ratio.
- **80% of the questions must be 'multiple-choice'.**
- **20% of the questions must be 'short-answer'.**
  
For example:
- If ${input.numQuestions} is 10, create exactly 8 'multiple-choice' and 2 'short-answer' questions.
- If ${input.numQuestions} is 5, create exactly 4 'multiple-choice' and 1 'short-answer' question.

For 'multiple-choice' questions:
  - Provide exactly 4 distinct and plausible options.
  - The 'answer' field MUST contain the full text of the correct option (e.g., "Paris"), not just a letter (e.g., "C").

For 'short-answer' questions:
  - The 'answer' should be concise (typically 1-5 words).

For ALL questions:
  - Provide the correct 'answer' as specified above.
  - Provide a brief 'explanation' for why the answer is correct or gives relevant context.
  
Output the questions as a JSON object with a "questions" array.`;

    const promptParts: Part[] = [{ text: mainPromptText }];
    if (input.image) {
      promptParts.push({ text: "The user has also provided an image for additional context. Use it to inform the questions where relevant."});
      promptParts.push({ media: { url: input.image }});
    }
    if (input.audio) {
      promptParts.push({ text: "The user has also provided an audio file for additional context. Use it to inform the questions where relevant."});
      promptParts.push({ media: { url: input.audio }});
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

// Function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const generateQuizQuestionsFlow = aiForQuizzes.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow - Quiz] Generating ${input.numQuestions} quiz questions for topic: ${input.topic}, difficulty: ${input.difficulty || 'not specified'}`);
    const { output } = await generateQuizQuestionsPrompt(input);
    if (!output || !output.questions || !Array.isArray(output.questions) || output.questions.length === 0) {
      console.error("[AI Flow Error - Quiz Questions] Invalid or empty output from LLM:", output);
      throw new Error('AI failed to generate quiz questions in the expected format.');
    }
    output.questions.forEach(q => {
        if (q.type === 'multiple-choice' && (!q.options || q.options.length < 2)) { 
            console.warn(`[AI Flow Warning - Quiz Questions] Multiple-choice question for topic "${input.topic}" has insufficient options:`, q.question);
        }
        if (!q.explanation) {
             console.warn(`[AI Flow Warning - Quiz Questions] Question for topic "${input.topic}" is missing an explanation:`, q.question);
        }
    });
    console.log(`[AI Flow - Quiz] Successfully generated ${output.questions.length} quiz questions for topic: ${input.topic}`);
    
    // Shuffle the questions before returning them
    const shuffledQuestions = shuffleArray(output.questions);
    
    return { questions: shuffledQuestions };
  }
);

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  console.log(`[AI Wrapper] generateQuizQuestions called for topic: ${input.topic}, num: ${input.numQuestions}, difficulty: ${input.difficulty}`);
  try {
    return await generateQuizQuestionsFlow(input);
  } catch (error: any) {
    console.error("[AI Wrapper Error - generateQuizQuestions] Error in flow execution:", error.message, error.stack);
    let clientErrorMessage = "Failed to generate quiz questions. Please try again.";
    const lowerCaseError = error.message?.toLowerCase() || "";

    if (lowerCaseError.includes("model not found") || lowerCaseError.includes("permission denied") || lowerCaseError.includes("api key not valid")) {
       clientErrorMessage = "Quiz Generation: Failed due to an API key or project configuration issue. Please check that GOOGLE_API_KEY_QUIZZES (or its fallback) is correct and that the 'Generative Language API' is enabled with billing in its Google Cloud project.";
    } else if (lowerCaseError.includes("api key") || lowerCaseError.includes("google_api_key")) {
      clientErrorMessage = "Quiz Generation: Failed due to an API key issue. Please check server configuration and ensure billing is enabled for the Google Cloud project.";
    } else if (error.message) {
      clientErrorMessage = `Quiz Generation: Failed. Error: ${error.message.substring(0, 150)}. Check server logs for details.`;
    }
    throw new Error(clientErrorMessage);
  }
}
