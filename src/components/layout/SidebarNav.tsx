
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSound } from '@/hooks/useSound';
import { Button } from '../ui/button';

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);

  const handleItemClick = () => {
    playClickSound();
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!items?.length) {
    return null;
  }

  return (
    <nav className="grid items-start p-2 text-sm font-medium">
      {items.map((item) => {
        const Icon = item.icon;
        const isGroupActive = item.children?.some(child => pathname === child.href) ?? false;

        return item.children?.length ? (
          <Accordion key={item.title} type="single" collapsible className="w-full" defaultValue={isGroupActive ? item.title : undefined}>
            <AccordionItem value={item.title} className="border-b-0">
              <AccordionTrigger
                onClick={() => playClickSound()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary [&[data-state=open]>svg]:rotate-180",
                  isGroupActive && "text-primary bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-4">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={handleItemClick}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          pathname === child.href && "bg-muted text-primary"
                        )}
                      >
                        <ChildIcon className="h-4 w-4" />
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === item.href && "bg-muted text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
