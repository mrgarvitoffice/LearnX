/**
 * @fileoverview Global error boundary for the application.
 * This component catches unhandled errors that occur during rendering and provides a user-friendly
 * fallback UI with an option to retry the action.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service or console
    console.error("Global Error Boundary Caught:", error);
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-2xl text-destructive">Application Error</CardTitle>
          <CardDescription>
            Oops! Something went wrong while trying to load the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md text-sm text-destructive-foreground overflow-auto max-h-40">
            <p className="font-semibold">Error: {error.message}</p>
            {error.digest && <p className="text-xs">Digest: {error.digest}</p>}
            {error.stack && <details className="mt-2 text-xs"><summary>Stack Trace</summary><pre className="whitespace-pre-wrap">{error.stack}</pre></details>}
          </div>
          <p className="text-sm text-muted-foreground">
            This might be due to a misconfiguration. Please ensure all API keys in your <code>.env</code> file (especially your Firebase project configuration) are correctly set up and that you have restarted your server after any changes.
          </p>
          <Button
            onClick={() => reset()}
            className="w-full"
          >
            Try to Reload Page
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
