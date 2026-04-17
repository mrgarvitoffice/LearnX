"use client";

import { useEffect } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSound } from '@/hooks/useSound';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { playSound: playTransitionSound } = useSound('/sounds/custom-sound-2.mp3', 0.4);

  useEffect(() => {
    NProgress.configure({ showSpinner: false, minimum: 0.1, speed: 300, trickleSpeed: 150 });
    NProgress.done();
    
    return () => {
      NProgress.remove(); 
    };
  }, []);

  useEffect(() => {
    playTransitionSound(); // Play sound on navigation start
    NProgress.start();

    const timer = setTimeout(() => {
      NProgress.done();
    }, 300); 

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams, playTransitionSound]); 

  return null;
}
