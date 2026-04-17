
"use client";
/**
 * @fileoverview Root layout for the entire application.
 * This component wraps all pages and is responsible for setting up global providers (like theme and auth),
 * defining metadata for SEO and PWA functionality, and including global styles and fonts.
 */

import { Orbitron } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { TopProgressBar } from '@/components/layout/TopProgressBar';
import { Suspense, type ReactNode } from 'react';
import DynamicBackground from '@/components/layout/DynamicBackground';
import { AppProviders } from '@/components/providers/AppProviders';
import Terminal from '@/components/features/assistant/Terminal';

// Initialize Orbitron font with a CSS variable for easy use in Tailwind.
const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

/**
 * The top-level layout component for the entire application.
 * It wraps all page content with necessary providers and global elements.
 * @param {Readonly<{children: React.ReactNode}>} props - The component's props.
 * @returns {JSX.Element} The rendered root layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <title>LearnX</title>
        <meta name="description" content="LearnX: The AI-Powered Learning Ecosystem" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${orbitron.variable} font-sans antialiased`}>
        <DynamicBackground />
        <AppProviders>
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          {children}
          <Toaster />
          <Terminal />
        </AppProviders>
      </body>
    </html>
  );
}
