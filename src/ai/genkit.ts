/**
 * @fileoverview Configures and exports Genkit AI clients for the application.
 * This setup allows for different API keys to be used for different AI features (e.g., notes, chatbot, images)
 * by reading from specific environment variables. If a feature-specific key is not provided, it gracefully
 * falls back to the main `GOOGLE_API_KEY`, ensuring continuous operation.
 * This provides flexibility for managing API usage, costs, and permissions across various services.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Retrieve all potential API keys from environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_KEY_NOTES = process.env.GOOGLE_API_KEY_NOTES;
const GOOGLE_API_KEY_CHATBOT = process.env.GOOGLE_API_KEY_CHATBOT;
const GOOGLE_API_KEY_IMAGES = process.env.GOOGLE_API_KEY_IMAGES;
const GOOGLE_API_KEY_QUIZZES = process.env.GOOGLE_API_KEY_QUIZZES;
const GOOGLE_API_KEY_TTS = process.env.GOOGLE_API_KEY_TTS;
const GOOGLE_API_KEY_ASSISTANT = process.env.GOOGLE_API_KEY_ASSISTANT;

// A robust helper to check if a key is a known placeholder or simply missing.
const isApiKeyMissingOrPlaceholder = (keyToCheck?: string, keyName?: string) => {
  if (!keyToCheck || keyToCheck.trim() === '') {
    if (keyName) {
      console.warn(
        `LearnMint AI Config: ${keyName} is not set. The feature will use the main GOOGLE_API_KEY as a fallback.`
      );
    }
    return true;
  }
  return false;
};

// --- Main AI Client (General Purpose & Fallback) ---
if (isApiKeyMissingOrPlaceholder(GOOGLE_API_KEY)) {
  console.error(
    '************************************************************************************'
  );
  console.error(
    'CRITICAL AI CONFIG ERROR: The main GOOGLE_API_KEY is MISSING in your .env file.'
  );
  console.error(
    'At least one primary key is required for AI features to function.'
  );
  console.error('Please ensure GOOGLE_API_KEY is set correctly.');
  console.error(
    '************************************************************************************'
  );
}
export const ai = genkit({
  plugins: [googleAI({apiKey: GOOGLE_API_KEY})],
  enableTracingAndMetrics: true,
});

// --- Notes-Specific AI Client ---
// Uses GOOGLE_API_KEY_NOTES if available, otherwise falls back to the main key.
const notesApiKey = !isApiKeyMissingOrPlaceholder(
  GOOGLE_API_KEY_NOTES,
  'GOOGLE_API_KEY_NOTES'
)
  ? GOOGLE_API_KEY_NOTES
  : GOOGLE_API_KEY;
export const aiForNotes = genkit({
  plugins: [googleAI({apiKey: notesApiKey})],
  enableTracingAndMetrics: true,
});

// --- Chatbot-Specific AI Client ---
// Uses GOOGLE_API_KEY_CHATBOT if available, otherwise falls back to the main key.
const chatbotApiKey = !isApiKeyMissingOrPlaceholder(
  GOOGLE_API_KEY_CHATBOT,
  'GOOGLE_API_KEY_CHATBOT'
)
  ? GOOGLE_API_KEY_CHATBOT
  : GOOGLE_API_KEY;
export const aiForChatbot = genkit({
  plugins: [googleAI({apiKey: chatbotApiKey})],
  enableTracingAndMetrics: true,
});

// --- Image Generation-Specific AI Client ---
// Uses GOOGLE_API_KEY_IMAGES if available, falls back to GOOGLE_API_KEY_NOTES, then to the main key.
let imageApiKey = GOOGLE_API_KEY_IMAGES;
if (isApiKeyMissingOrPlaceholder(imageApiKey, 'GOOGLE_API_KEY_IMAGES')) {
  imageApiKey = GOOGLE_API_KEY_NOTES;
  if (
    isApiKeyMissingOrPlaceholder(
      imageApiKey,
      'GOOGLE_API_KEY_NOTES (as fallback for images)'
    )
  ) {
    imageApiKey = GOOGLE_API_KEY;
  }
}
export const aiForImages = genkit({
  plugins: [googleAI({apiKey: imageApiKey})],
  enableTracingAndMetrics: true,
});

// --- Quizzes & Flashcards-Specific AI Client ---
// Uses GOOGLE_API_KEY_QUIZZES if available, otherwise falls back to the main key.
const quizzesApiKey = !isApiKeyMissingOrPlaceholder(
  GOOGLE_API_KEY_QUIZZES,
  'GOOGLE_API_KEY_QUIZZES'
)
  ? GOOGLE_API_KEY_QUIZZES
  : GOOGLE_API_KEY;
export const aiForQuizzes = genkit({
  plugins: [googleAI({apiKey: quizzesApiKey})],
  enableTracingAndMetrics: true,
});

// --- Text-to-Speech (TTS) Specific AI Client ---
// Uses GOOGLE_API_KEY_TTS if available, otherwise falls back to the main key.
const ttsApiKey = !isApiKeyMissingOrPlaceholder(
    GOOGLE_API_KEY_TTS,
    'GOOGLE_API_KEY_TTS'
)
    ? GOOGLE_API_KEY_TTS
    : GOOGLE_API_KEY;
export const aiForTTS = genkit({
    plugins: [googleAI({ apiKey: ttsApiKey })],
    enableTracingAndMetrics: true,
});

// --- AI Assistant (Jarvis/Holo) Specific Client ---
// Uses GOOGLE_API_KEY_ASSISTANT if available, otherwise falls back to the chatbot key, then the main key.
let assistantApiKey = GOOGLE_API_KEY_ASSISTANT;
if (isApiKeyMissingOrPlaceholder(assistantApiKey, 'GOOGLE_API_KEY_ASSISTANT')) {
    assistantApiKey = GOOGLE_API_KEY_CHATBOT; // Fallback to chatbot key first
    if (isApiKeyMissingOrPlaceholder(assistantApiKey, 'GOOGLE_API_KEY_CHATBOT (as fallback for assistant)')) {
        assistantApiKey = GOOGLE_API_KEY; // Final fallback to main key
    }
}
export const aiForAssistant = genkit({
    plugins: [googleAI({ apiKey: assistantApiKey })],
    enableTracingAndMetrics: true,
});
