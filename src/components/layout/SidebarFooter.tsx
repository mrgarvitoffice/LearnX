"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronsRightLeft } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function SidebarFooter({ isExpanded }: { isExpanded: boolean }) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex items-center justify-center">
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }}>
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("transition-transform", isExpanded ? "rotate-180" : "rotate-0")} onClick={toggleSidebar}>
                        <ChevronsRightLeft className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </motion.div>
    </div>
  );
}