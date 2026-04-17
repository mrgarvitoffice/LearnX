

"use client";
/**
 * @fileoverview Layout for the authentication pages (e.g., sign-in, sign-up).
 * This component ensures that users who are already fully authenticated (i.e., not guests)
 * are redirected to the main application dashboard, preventing them from seeing login or
 * registration forms unnecessarily.
 */

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, isReady: i18nReady } = useTranslation();

  const isLoading = authLoading || !i18nReady;

  useEffect(() => {
    // If auth state is determined and a permanent (non-anonymous) user exists,
    // they should be on the main app, not the auth pages.
    if (!isLoading && user && !user.isAnonymous) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // While loading auth/i18n, or if a permanent user exists and is about to be redirected, show a loader.
  if (isLoading || (user && !user.isAnonymous)) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">{i18nReady ? t('auth.verifying') : 'Verifying authentication...'}</p>
      </div>
    );
  }
  
  // If not loading and there's no user OR the user is a guest, show the auth pages.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {children}
    </div>
  );
}

    