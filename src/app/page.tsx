

"use client";

/**
 * @fileoverview Root page component for the application.
 * This page is responsible for redirecting users from the root URL ('/') to the main dashboard.
 * It provides a loading state to ensure a smooth user experience during the redirection.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function RootPage() {
  const router = useRouter();
  const { t, isReady } = useTranslation();

  useEffect(() => {
    // Immediately replace the current history entry with the dashboard route.
    router.replace('/dashboard');
  }, [router]);

  // Display a full-screen loader to provide visual feedback while the redirect occurs.
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-3 text-lg">{isReady ? t('dashboard.loading') : 'Loading...'}</p>
    </div>
  );
}

    