
// For AI Generated Content
export interface QuizQuestion {
  question: string;
  options?: string[]; 
  answer: string;
  type: 'multiple-choice' | 'short-answer'; 
  explanation?: string; 
  userAnswer?: string; 
  isCorrect?: boolean; 
}

export interface Flashcard {
  term: string;
  definition: string; 
}

// Input/Output types for AI flows (matching Zod schemas in flows)
export type GenerateStudyNotesInput = { 
  topic: string;
  image?: string;
  notes?: string; 
  audio?: string;
  video?: string;
};
export type GenerateStudyNotesOutput = { notes: string };

export type GenerateQuizQuestionsInput = { 
  topic: string, 
  numQuestions: number, 
  difficulty?: 'easy' | 'medium' | 'hard',
  image?: string;
  audio?: string;
  video?: string;
  notes?: string; 
};
export type GenerateQuizQuestionsOutput = { questions: QuizQuestion[] };

export type GenerateFlashcardsInput = { 
  topic: string; 
  numFlashcards: number;
  image?: string; 
};
export type GenerateFlashcardsOutput = { flashcards: Flashcard[] };

// For Audio Flashcard Generation
export type GenerateAudioFlashcardsInput = { 
  topic: string; 
  numFlashcards: number;
};
export type GenerateAudioFlashcardsOutput = {
  flashcards: Flashcard[];
  audioDataUri?: string;
};

// For Audio Summary Generation
export interface GenerateAudioSummaryInput {
  text?: string;
  imageDataUri?: string;
  language?: string; 
}
export interface GenerateAudioSummaryOutput {
  summary: string;
  audioDataUri?: string; 
}

// For Audio Discussion Generation
export interface GenerateDiscussionAudioInput {
  content: string;
}
export interface GenerateDiscussionAudioOutput {
  audioDataUri: string;
}

// For News API
export interface NewsArticle {
  article_id: string;
  title: string;
  link: string;
  keywords: string[] | null;
  creator: string[] | null;
  video_url: string | null;
  description: string | null;
  content?: string; 
  pubDate: string;
  image_url: string | null;
  source_id: string;
  source_priority: number;
  country: string[];
  category: string[];
  language: string;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
  nextPage?: string;
}

// For Math Fact API
export interface MathFact {
  fact: string;
}

// For Motivational Quote
export interface TranslatedQuote {
  quote: string;
  author: string;
}

// For Calculator
export type CalculatorButtonType = 
  | 'digit' 
  | 'operator' 
  | 'action' 
  | 'equals'
  | 'decimal'
  | 'memory' 
  | 'scientific';

export interface CalculatorButtonConfig {
  value: string;
  label: string; 
  type: CalculatorButtonType;
  className?: string; 
  action?: string; 
}

export type UnitCategory = 'Length' | 'Temperature' | 'Weight/Mass' | 'Volume' | 'Area' | 'Speed';

export interface Unit {
  name: string;
  symbol: string;
  factor: number; 
  offset?: number; 
}

export interface UnitConverterState {
  fromUnit: string;
  toUnit: string;
  inputValue: string;
  outputValue: string;
  category: UnitCategory;
}

// For Chatbot
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; 
  pdfFileName?: string;
  audioFileName?: string;
  videoFileName?: string;
  timestamp: Date;
  type?: 'typing_indicator';
  fileOperations?: FileOperation[];
  isError?: boolean;
}

// For Custom Test
export interface TestSettings {
  topics: string[];
  notes?: string;
  sourceType: 'topic' | 'notes' | 'recent';
  selectedRecentTopics?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  timer?: number; 
  perQuestionTimer?: number;
}


// For Definition Challenge Game in /arcade
export interface DefinitionChallengeWord {
  term: string;
  definition: string;
  hint: string; 
}

// For YouTube Search Flow
export interface YoutubeVideoItem {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelTitle?: string;
  publishedAt?: string; 
}
export interface YoutubeSearchInput {
  query: string;
  maxResults?: number;
}
export interface YoutubeSearchOutput {
  videos: YoutubeVideoItem[];
}

// For Google Books Search Flow
export interface GoogleBookItem {
  bookId: string;
  title: string;
  authors?: string[];
  description?: string;
  thumbnailUrl?: string;
  publishedDate?: string;
  pageCount?: number;
  infoLink?: string;
  embeddable: boolean; 
  previewLink?: string; 
  webReaderLink?: string; 
}
export interface GoogleBooksSearchInput {
  query: string;
  maxResults?: number;
}
export interface GoogleBooksSearchOutput {
  books: GoogleBookItem[];
}

// For Combined Study Materials Action
export interface CombinedStudyMaterialsOutput {
  notesOutput: GenerateStudyNotesOutput;
  notesError?: string;
  quizOutput?: GenerateQuizQuestionsOutput;
  flashcardsOutput?: GenerateFlashcardsOutput;
  quizError?: string;
  flashcardsError?: string;
}

// Generic type for TanStack Query useQuery error
export type QueryError = Error & { cause?: any; errors?: {message: string}[] };


// For Coding Playground
export interface CodeFile {
  name: string;
  language: string;
  content: string;
}

// For Prototyper AI Flow
export interface FileOperation {
  operation: 'create' | 'update' | 'delete';
  fileName: string;
  content?: string;
}

// For Playground Project Slots
export interface ProjectSlot {
  id: number;
  name: string;
  timestamp: number;
  files: CodeFile[];
}

// For Goal Selection
export type GoalType = 'college' | 'general' | 'neet' | 'jee' | 'school-boards' | 'ias' | 'school-prep' | 'olympiad' | 'govt-exams' | 'entrance-exam' | 'gate' | 'finance';

export interface UserGoal {
  type: GoalType;
  country: string; 
  university?: string;
  program?: string;
  branch?: string;
  semester?: string;
  board?: 'CBSE' | 'ICSE' | 'International';
  class?: string;
}

// --- NEW PERSONA TYPES ---
export type ChatbotCharacter = 'helper' | 'coder' | 'tutor' | 'interviewer';

export interface TutorAiChatbotOutput {
    response: string;
    strategy: {
        currentStep: number;
        knowledgeGap: string;
        analogyUsed?: string;
    };
}

export interface InterviewerAiChatbotOutput {
    response: string;
    state: {
        difficultyLevel: number;
        skillMap: Record<string, 'foundational' | 'intermediate' | 'advanced'>;
        candidateFeedback?: string;
    };
}
