
/**
 * @file Genkit development server entry point.
 */
import { config } from 'dotenv';
config(); 

import './genkit'; 

// Import all flows
import '@/ai/flows/generate-study-notes';
import '@/ai/flows/generate-quiz-questions';
import '@/ai/flows/generate-flashcards';
import '@/ai/flows/helper-ai-chatbot';
import '@/ai/flows/coder-ai-chatbot';
import '@/ai/flows/tutor-ai-chatbot';
import '@/ai/flows/interviewer-ai-chatbot';
import '@/ai/flows/generate-quiz-from-notes';
import '@/ai/flows/generate-flashcards-from-notes';
import '@/ai/flows/search-youtube-videos';
import '@/ai/flows/search-google-books';
import '@/ai/flows/generate-image-from-prompt';
import '@/ai/flows/generate-math-fact';
import '@/ai/flows/generate-college-notes';
import '@/ai/flows/jarvis-command';
import '@/ai/flows/prototyper-flow';
import '@/ai/flows/generate-subject-summary';
import '@/ai/flows/generate-top-questions';
