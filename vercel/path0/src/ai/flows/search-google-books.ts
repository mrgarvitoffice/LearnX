
/**
 * @fileoverview This file is DEPRECATED and no longer in use.
 * The library page now calls the Google Books API directly via a server action (`lib/actions.ts`)
 * for improved performance and reliability. This flow can be safely removed.
 */

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GoogleBookItemSchema = z.object({
  bookId: z.string().describe('The Google Books volume ID.'),
  title: z.string().describe('The title of the book.'),
  authors: z.array(z.string()).optional().describe('A list of authors for the book.'),
  description: z.string().optional().describe('A short description of the book.'),
  thumbnailUrl: z.string().url().optional().describe('URL of the book cover thumbnail.'),
  publishedDate: z.string().optional().describe('The publication date of the book.'),
  pageCount: z.number().optional().describe('The number of pages in the book.'),
  infoLink: z.string().url().optional().describe('A link to more information about the book on Google Books.'),
});

const GoogleBooksSearchInputSchema = z.object({
  query: z.string().describe('The search query for Google Books.'),
  maxResults: z.number().min(1).max(40).default(10).describe('Maximum number of results to return (max 40 for Google Books API).'),
});
export type GoogleBooksSearchInput = z.infer<typeof GoogleBooksSearchInputSchema>;

const GoogleBooksSearchOutputSchema = z.object({
  books: z.array(GoogleBookItemSchema).describe('A list of found Google Books.'),
});
export type GoogleBooksSearchOutput = z.infer<typeof GoogleBooksSearchOutputSchema>;

// Tool to fetch Google Books
const fetchGoogleBooksTool = ai.defineTool(
  {
    name: 'fetchGoogleBooks',
    description: 'Fetches a list of books from Google Books based on a search query.',
    inputSchema: GoogleBooksSearchInputSchema,
    outputSchema: GoogleBooksSearchOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    
    const params = new URLSearchParams({
      q: input.query,
      maxResults: input.maxResults.toString(),
    });
    if (apiKey) {
      params.append('key', apiKey);
    }

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Books API Error:', errorData);
      throw new Error(`Google Books API request failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const books = data.items?.map((item: any) => ({
      bookId: item.id,
      title: item.volumeInfo?.title,
      authors: item.volumeInfo?.authors || [],
      description: item.volumeInfo?.description,
      thumbnailUrl: item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail,
      publishedDate: item.volumeInfo?.publishedDate,
      pageCount: item.volumeInfo?.pageCount,
      infoLink: item.volumeInfo?.infoLink,
    })).filter((book: any) => book.title) || []; 

    return { books };
  }
);

// Genkit flow definition
const searchGoogleBooksFlow = ai.defineFlow(
  {
    name: 'searchGoogleBooksFlow',
    inputSchema: GoogleBooksSearchInputSchema,
    outputSchema: GoogleBooksSearchOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      prompt: `You MUST use the fetchGoogleBooks tool to find books. Search Google Books for "${input.query}" and get ${input.maxResults} results using the fetchGoogleBooks tool. Return ONLY the tool's output.`, 
      tools: [fetchGoogleBooksTool],
      toolChoice: "fetchGoogleBooks", 
      config: {
        temperature: 0.1,
      },
    });

    if (llmResponse.output && typeof llmResponse.output === 'object' && 'books' in llmResponse.output) {
        try {
            const validatedOutput = GoogleBooksSearchOutputSchema.parse(llmResponse.output);
            console.log("LLM directly returned structured book data:", validatedOutput.books.length);
            return validatedOutput;
        } catch (e) {
            console.warn("LLM output looked like book data but failed Zod parsing:", e, llmResponse.output);
        }
    }

    const toolResponse = llmResponse.toolRequest?.tool?.response as GoogleBooksSearchOutput | undefined;

    if (toolResponse && toolResponse.books) {
      console.log("Tool successfully returned book data:", toolResponse.books.length);
      return toolResponse;
    }
    
    console.warn("LLM did not use the Google Books tool as expected, or tool did not return book data. LLM Response Text:", llmResponse.text, "Tool Request:", llmResponse.toolRequest);
    return { books: [] };
  }
);

// Exported async wrapper function
export async function searchGoogleBooks(input: GoogleBooksSearchInput): Promise<GoogleBooksSearchOutput> {
   try {
    return await searchGoogleBooksFlow(input);
  } catch (error) {
    console.error("Error in searchGoogleBooks flow:", error);
    return { books: [] };
  }
}
