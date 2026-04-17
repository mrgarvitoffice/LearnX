
"use server";

import type { NewsApiResponse, NewsArticle } from './types';

const NEWS_API_URL = "https://newsdata.io/api/1/news";

interface FetchNewsParams {
  query?: string;
  country?: string;
  stateOrRegion?: string;
  city?: string;
  category?: string;
  page?: string; // For pagination, newsdata.io uses a 'page' token
  language?: string; // Added language parameter
}

export async function fetchNews(params: FetchNewsParams): Promise<NewsApiResponse> {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    console.error("NEWSDATA_API_KEY is not set.");
    return { status: "error", totalResults: 0, results: [{
      article_id: "error-no-apikey",
      title: "API Key Missing",
      link: "#",
      description: "Newsdata.io API key is not configured. Please set it in your environment variables.",
      pubDate: new Date().toISOString(), category: ["error"], country: [], language: params.language || "en", source_id: "learnx-error", source_priority: 0, keywords: null, creator: null, video_url: null, image_url: null,
    }], nextPage: undefined };
  }

  const queryParams = new URLSearchParams({
    apikey: apiKey,
    language: params.language || "en",
  });
  
  let qValue = params.query ? params.query.trim() : "";

  // The newsdata.io API suggests adding specific locations to the 'q' parameter for better results.
  // We'll combine them with 'AND' for more precise filtering.
  const locationParts = [params.city, params.stateOrRegion].filter(Boolean);
  if (locationParts.length > 0) {
      const locationQuery = locationParts.join(" AND ");
      qValue = qValue ? `${qValue} AND (${locationQuery})` : locationQuery;
  }
  
  if (qValue) {
      queryParams.append("q", qValue);
  }

  // The 'country' parameter works best on its own for broad filtering.
  if (params.country) {
    queryParams.append("country", params.country);
  }

  // Handle category
  if (params.category) { 
    queryParams.append("category", params.category);
  } else if (!queryParams.has("q")) {
    // If no query or category is provided, default to top headlines
    queryParams.set("category", "top");
  }

  if (params.page) {
    queryParams.append("page", params.page);
  }
  
  try {
    const response = await fetch(`${NEWS_API_URL}?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`News API Error (${response.status}):`, errorData);
      const message = errorData?.results?.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }
    const data: NewsApiResponse = await response.json();
    
    const cleanedResults = data.results.filter(article => article.title && article.link);
    
    return { ...data, results: cleanedResults };

  } catch (error) {
    console.error("Failed to fetch news:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching news.";
    return { 
        status: "error", 
        totalResults: 0, 
        results: [{ 
            article_id: "error-" + Date.now(),
            title: "Failed to Load News",
            link: "#",
            description: errorMessage,
            pubDate: new Date().toISOString(),
            category: ["error"],
            country: [],
            language: params.language || "en",
            source_id: "learnx-error",
            source_priority: 0,
            keywords: null,
            creator: null,
            video_url: null,
            image_url: null,
        } as NewsArticle], 
        nextPage: undefined 
    };
  }
}
