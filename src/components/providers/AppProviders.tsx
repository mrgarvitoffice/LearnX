
"use client";

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { QuestProvider } from '@/contexts/QuestContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AssistantProvider } from '@/contexts/AssistantContext';
import { ProgressionProvider } from '@/contexts/ProgressionContext';
import { useState, type ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <AuthProvider>
            <ProgressionProvider>
              <QuestProvider>
                <AssistantProvider>
                  <SidebarProvider>
                    {children}
                  </SidebarProvider>
                </AssistantProvider>
              </QuestProvider>
            </ProgressionProvider>
          </AuthProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
