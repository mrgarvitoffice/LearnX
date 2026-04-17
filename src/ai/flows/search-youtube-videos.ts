
/**
 * @fileoverview This file is DEPRECATED and no longer in use.
 * The library page now calls the YouTube Data API directly via a server action (`lib/actions.ts`)
 * for improved performance and reliability. This flow can be safely removed.
 */

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const YoutubeVideoItemSchema = z.object({
  videoId: z.string().describe('The YouTube video ID.'),
  title: z.string().describe('The title of the YouTube video.'),
  description: z.string().optional().describe('A short description of the video.'),
  thumbnailUrl: z.string().url().describe('URL of the video thumbnail.'),
  channelTitle: z.string().optional().describe('The title of the YouTube channel.'),
  publishedAt: z.string().optional().describe('The date the video was published (ISO 8601 format).'),
});

const YoutubeSearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube videos.'),
  maxResults: z.number().min(1).max(25).default(5).describe('Maximum number of results to return.'),
});
export type YoutubeSearchInput = z.infer<typeof YoutubeSearchInputSchema>;

const YoutubeSearchOutputSchema = z.object({
  videos: z.array(YoutubeVideoItemSchema).describe('A list of found YouTube videos.'),
});
export type YoutubeSearchOutput = z.infer<typeof YoutubeSearchOutputSchema>;

// Tool to fetch YouTube videos
const fetchYouTubeVideosTool = ai.defineTool(
  {
    name: 'fetchYouTubeVideos',
    description: 'Fetches a list of YouTube videos based on a search query.',
    inputSchema: YoutubeSearchInputSchema,
    outputSchema: YoutubeSearchOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured.');
    }

    const params = new URLSearchParams({
      key: apiKey,
      part: 'snippet',
      q: input.query,
      type: 'video',
      maxResults: input.maxResults.toString(),
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error:', errorData);
      throw new Error(`YouTube API request failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const videos = data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.default.url, // or medium/high
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    })) || [];

    return { videos };
  }
);

// Genkit flow definition
const searchYoutubeVideosFlow = ai.defineFlow(
  {
    name: 'searchYoutubeVideosFlow',
    inputSchema: YoutubeSearchInputSchema,
    outputSchema: YoutubeSearchOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      prompt: `You MUST use the fetchYouTubeVideos tool to find videos. Search YouTube for "${input.query}" and get ${input.maxResults} results using the fetchYouTubeVideos tool. Return ONLY the tool's output.`, 
      tools: [fetchYouTubeVideosTool],
      toolChoice: "fetchYouTubeVideos", 
      config: {
        temperature: 0.1,
      },
    });

    if (llmResponse.output && typeof llmResponse.output === 'object' && 'videos' in llmResponse.output) {
        try {
            const validatedOutput = YoutubeSearchOutputSchema.parse(llmResponse.output);
            console.log("LLM directly returned structured YouTube video data:", validatedOutput.videos.length);
            return validatedOutput;
        } catch (e) {
            console.warn("LLM output looked like YouTube video data but failed Zod parsing:", e, llmResponse.output);
        }
    }
    
    const toolResponse = llmResponse.toolRequest?.tool?.response as YoutubeSearchOutput | undefined;

    if (toolResponse && toolResponse.videos) {
      console.log("Tool successfully returned YouTube video data:", toolResponse.videos.length);
      return toolResponse;
    }
    
    console.warn("LLM did not use the YouTube tool as expected or tool did not return video data. LLM Response Text:", llmResponse.text, "Tool Request:", llmResponse.toolRequest);
    return { videos: [] }; 
  }
);

// Exported async wrapper function
export async function searchYoutubeVideos(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  try {
    return await searchYoutubeVideosFlow(input);
  } catch (error) {
    console.error("Error in searchYoutubeVideos flow:", error);
    return { videos: [] };
  }
}
