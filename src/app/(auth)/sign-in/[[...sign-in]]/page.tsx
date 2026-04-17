
"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, LogIn } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type FormData = z.infer<typeof formSchema>;

export default function SignInPage() {
  const { signInWithEmail, signInAnonymously, loading } = useAuth();
  const { t, isReady } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleEmailSignIn = async (data: FormData) => {
    await signInWithEmail(data.email, data.password);
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm shadow-xl border-border/50 bg-card/80 backdrop-blur-lg">
      <CardHeader className="text-center">
        <Logo size={48} className="mx-auto mb-2" />
        <CardTitle className="text-2xl mt-2">{t('auth.signInWelcomeBack')}</CardTitle>
        <CardDescription>Log in to access your LearnX dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <div className="absolute inset-0 bg-background/50 flex justify-center items-center z-10 rounded-lg"><Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" /></div>}
        
        <div className="space-y-2">
            <Button onClick={signInAnonymously} variant="secondary" className="w-full" disabled={loading}>
                <User className="mr-2 h-4 w-4" />
                {t('auth.continueAsGuest')}
            </Button>
        </div>

        <div className="relative">
          <Separator className="my-1" />
          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            {t('auth.orSignInWithEmail')}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleEmailSignIn)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.emailLabel')}</Label>
            <Input id="email" type="email" placeholder={t('auth.emailPlaceholder')} {...register('email')} disabled={loading} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
            <Input id="password" type="password" {...register('password')} disabled={loading} placeholder={t('auth.passwordLabel')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            {t('auth.signInButton')}
          </Button>
        </form>
        
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          {t('auth.noAccountPrompt')}{' '}
          <Link href="/sign-up" className="font-semibold text-primary hover:underline">
            {t('auth.signUpLink')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
