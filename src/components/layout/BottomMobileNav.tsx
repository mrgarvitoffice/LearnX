
"use client";
/**
 * @fileoverview Renders the bottom navigation bar for mobile devices.
 * This component provides quick access to the five most essential features of the application,
 * ensuring a user-friendly experience on smaller screens.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BOTTOM_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export function BottomMobileNav() {
  const pathname = usePathname();
  const { playSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t } = useTranslation();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/90 backdrop-blur-lg md:hidden">
      <div className="grid h-16 grid-cols-5 items-center justify-around px-1">
        {BOTTOM_NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;
          const title = t(item.title);
          const isMiddleButton = index === 2;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-full flex-col items-center justify-center gap-1 rounded-md text-muted-foreground transition-all duration-300 hover:text-primary group",
                isActive && "text-primary"
              )}
              onClick={playSound}
            >
              <div className={cn(
                "flex items-center justify-center rounded-full transition-all duration-300",
                isMiddleButton && "h-12 w-12 -translate-y-3 border-4 border-background bg-primary shadow-lg",
                !isMiddleButton && "h-10 w-10"
              )}>
                <Icon className={cn(
                    "transition-transform duration-200 group-hover:scale-110",
                    isMiddleButton ? "h-5 w-5 text-primary-foreground" : "h-5 w-5"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-tight text-center break-words",
                isMiddleButton && "absolute bottom-0"
              )}>
                {title}
              </span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
