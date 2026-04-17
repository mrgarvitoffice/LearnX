
"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

const TimeBlockScheduler = dynamic(() => import('@/components/features/scheduler/TimeBlockScheduler'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  ),
});

export default function SchedulerPage() {
  return (
    <div className="container mx-auto">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-primary" />}>
        <TimeBlockScheduler />
      </Suspense>
    </div>
  );
}
