

"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, LogIn, LogOut } from 'lucide-react';

export default function ProfileMenuContent() {
  const { user, signOutUser } = useAuth();
  const { t } = useTranslation();

  if (!user) {
    return (
      <>
        <DropdownMenuLabel>{t('header.profile.signIn')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/sign-in">
            <LogIn className="mr-2 h-4 w-4" />
            <span>{t('auth.signInButton')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/sign-up">
            <User className="mr-2 h-4 w-4" />
            <span>{t('auth.signUpButton')}</span>
          </Link>
        </DropdownMenuItem>
      </>
    );
  }

  return (
    <>
      <DropdownMenuLabel>
        {t('header.profile.greeting', { name: user.displayName || 'User' })}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/profile">
          <User className="mr-2 h-4 w-4" />
          <span>{t('header.profile.profile')}</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={signOutUser}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>{t('header.profile.signOut')}</span>
      </DropdownMenuItem>
    </>
  );
}

    