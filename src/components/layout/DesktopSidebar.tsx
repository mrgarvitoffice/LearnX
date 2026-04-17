
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { ScrollArea } from '../ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSidebar } from '../ui/sidebar';

function SidebarNavItem({ item, pathname, isExpanded }: { item: NavItem, pathname: string, isExpanded: boolean }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all duration-300 hover:text-primary group relative overflow-hidden",
        isActive && "text-primary"
      )}
    >
      <Icon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 z-10" />
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 } }}
            exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
            className="whitespace-nowrap font-semibold z-10"
          >
            {t(item.title)}
          </motion.span>
        )}
      </AnimatePresence>
       {isActive && (
        <motion.div
          layoutId="active-sidebar-indicator"
          className="absolute inset-0 bg-primary/10 border-l-2 border-primary rounded-r-lg"
          initial={false}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { open, setOpen } = useSidebar();
  
  return (
    <motion.aside
      className="fixed top-0 left-0 z-50 h-full border-r bg-background/95 backdrop-blur-xl flex-col hidden md:flex"
      initial={false}
      animate={open ? "open" : "closed"}
      variants={{
        closed: { width: '5rem' },
        open: { width: '16rem' },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
    >
      <div className="flex h-16 items-center shrink-0 px-5 border-b overflow-hidden">
        <Link href="/" className="flex items-center gap-3 font-bold w-full">
            <Logo size={32} className="drop-shadow-[0_0_8px_rgba(255,90,47,0.4)]" />
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.4, delay: 0.15 } }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  className="text-2xl text-foreground tracking-tighter whitespace-nowrap"
                 >
                  LearnX
                </motion.span>
              )}
            </AnimatePresence>
        </Link>
      </div>

      <ScrollArea className="flex-1 mt-4">
        <nav className="grid items-start p-3 gap-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href} item={item} pathname={pathname} isExpanded={open} />
          ))}
        </nav>
      </ScrollArea>
      
      <div className="mt-auto p-3 border-t">
        {user && (
          <Link href="/profile" className="flex items-center w-full gap-3 rounded-xl px-2 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-primary/5 hover:text-primary">
            <Avatar className="h-9 w-9 shrink-0 border border-primary/20">
              <AvatarImage src={user.isAnonymous ? undefined : user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary">
                  {user.isAnonymous ? <User className="h-5 w-5"/> : user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
              </AvatarFallback>
            </Avatar>
             <AnimatePresence>
              {open && (
                <motion.div
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 } }}
                   exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
                   className="flex flex-col items-start text-left overflow-hidden"
                 >
                  <span className="font-bold text-foreground leading-none whitespace-nowrap mb-1">{user.isAnonymous ? "Guest Pilot" : user.displayName || "Operator"}</span>
                    {!user.isAnonymous && <span className="text-[10px] text-muted-foreground leading-none truncate">{user.email}</span>}
                </motion.div>
              )}
             </AnimatePresence>
          </Link>
        )}
      </div>
    </motion.aside>
  );
}
