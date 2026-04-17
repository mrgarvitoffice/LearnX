
"use client";
/**
 * @fileoverview Renders the top navigation bar for mobile devices.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOP_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { Settings } from 'lucide-react';
import SettingsMenuContent from './SettingsMenuContent';
import ProfileMenuContent from './ProfileMenuContent';
import Assistant from '../features/assistant/Assistant';

export function TopMobileNav() {
  const pathname = usePathname();
  const { playSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden border-b bg-background/90 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-4">
        <motion.div whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center gap-2.5 font-semibold">
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Logo size={32} />
                </motion.div>
                <span className="font-bold text-xl text-foreground whitespace-nowrap">
                  LearnX
                </span>
            </Link>
        </motion.div>
        
        <div className="flex items-center gap-2">
            <Assistant />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                    <div className="p-2 w-64">
                        <ProfileMenuContent />
                        <div className="mt-2 pt-2 border-t">
                            <SettingsMenuContent />
                        </div>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
      <div className="flex h-12 items-center justify-center overflow-x-auto px-2 border-t border-border/50">
        <nav className="flex w-full items-center justify-around gap-1.5 text-sm font-medium">
          {TOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;
            const title = t(item.title);

            return (
              <Button asChild key={item.href} variant={isActive ? "secondary" : "ghost"} size="sm" className="flex-1 h-8">
                <Link
                  href={item.href}
                  onClick={playSound}
                  className={cn("flex items-center justify-center gap-1.5 p-1 transition-colors")}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium leading-tight text-center break-words">{title}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>

    </header>
  );
}
