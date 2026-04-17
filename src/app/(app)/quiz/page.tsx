
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useTranslation } from "@/hooks/useTranslation";

export default function RemovedQuizPage() {
  const router = useRouter();
  const { t, isReady } = useTranslation();

  if (!isReady) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full text-center p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-destructive">{t('quiz.removed.title')}</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {t('quiz.removed.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            {t('quiz.removed.p1_1')}{" "}
            <Link href="/notes" className="text-primary underline hover:text-primary/80">
              {t('quiz.removed.p1_link1')}
            </Link>{" "}
            {t('quiz.removed.p1_2')}{" "}
            <Link href="/custom-test" className="text-primary underline hover:text-primary/80">
              {t('quiz.removed.p1_link2')}
            </Link>.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('quiz.removed.goBack')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
