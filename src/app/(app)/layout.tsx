
"use client";
/**
 * @fileoverview Main layout with optimized, high-performance transitions.
 */

import { type ReactNode, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { TopMobileNav } from '@/components/layout/TopMobileNav';
import { BottomMobileNav } from '@/components/layout/BottomMobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { open } = useSidebar();
  const pathname = usePathname();

  if (pathname === '/coding') {
    return (
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
        {children}
      </Suspense>
    );
  }

  return (
    <>
      {isMobile ? (
        <div className="flex min-h-screen flex-col">
          <div className="no-print fixed top-0 left-0 right-0 z-40">
            <TopMobileNav />
          </div>
          <div className="flex-1 flex flex-col min-h-0 pt-28 pb-16">
            <AnimatePresence mode="wait">
              <motion.main
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "linear" }}
                className="w-full max-w-7xl mx-auto px-4 py-4 flex-1 flex flex-col min-h-0"
              >
                <Suspense fallback={<div className="flex min-h-[50vh] w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
                  {children}
                </Suspense>
              </motion.main>
            </AnimatePresence>
          </div>
          <div className="no-print fixed bottom-0 left-0 right-0 z-40">
            <BottomMobileNav />
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen bg-transparent">
          <div className="no-print">
            <DesktopSidebar />
          </div>
          <div className={cn(
            "flex flex-col flex-1 transition-all duration-300 ease-in-out min-w-0",
            open ? "md:ml-64" : "md:ml-20"
          )}>
            <div className="no-print">
              <Header />
            </div>
            <ScrollArea className="flex-1 w-full">
              <AnimatePresence mode="wait">
                <motion.main
                  key={pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "linear" }}
                  className="w-full max-w-7xl mx-auto px-4 py-8 lg:px-12 flex-1 flex flex-col min-h-0"
                >
                  <Suspense fallback={<div className="flex min-h-[50vh] w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
                    {children}
                  </Suspense>
                </motion.main>
              </AnimatePresence>
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  );
}
