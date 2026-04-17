

/**
 * @fileoverview Provides utility functions used throughout the application.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts text content from a PDF file page by page using pdfjs-dist.
 * This function is designed to run on the client-side.
 * @param file The PDF file to process.
 * @returns A promise that resolves to an array of strings, where each string is the text content of a page.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamically import pdfjs-dist to ensure it's client-side only.
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set the worker source. This is a crucial step for the library to work in most web environments.
  // We point it to the hosted version from a reliable CDN.
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // 'str' is the property containing the text in the items array.
      // We filter for items that have 'str' to avoid errors with other content types.
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      pageTexts.push(pageText);
    } catch (error) {
      console.error(`Error processing page ${i} of PDF:`, error);
      // If a single page fails, we'll push an empty string to avoid breaking the entire process.
      pageTexts.push(""); 
    }
  }

  return pageTexts.join('\n\n'); // Return a single string with pages separated
}
