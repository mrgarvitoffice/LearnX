
"use client";
/**
 * @fileoverview Defines the header for the main application layout on desktop.
 * It provides access to global settings such as theme, sound mode, font size, and language,
 * which are managed through the `useSettings` hook and applied globally.
 */

import React from 'react';
import { useTheme } from "next-themes";
import { useSettings } from '@/contexts/SettingsContext';
import { useSound } from '@/hooks/useSound';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Settings, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import Assistant from '@/components/features/assistant/Assistant';
import SettingsMenuContent from './SettingsMenuContent';

export function Header() {
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b bg-background/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sm:px-6">
       <div className="flex items-center gap-2">
            <Assistant />
            <Button asChild variant="outline" size="icon" className="h-9 w-9">
                <Link href="/chatbot">
                    <Bot className="h-5 w-5" />
                </Link>
            </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
                <div className="p-4 w-64">
                  <SettingsMenuContent />
                </div>
            </DropdownMenuContent>
          </DropdownMenu>
       </div>
    </header>
  );
}
