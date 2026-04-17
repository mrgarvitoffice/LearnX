
"use client";

import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, UserPlus, Languages } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_LANGUAGES } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  appLanguage: z.string().default('en'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const { signUpWithEmail, signInAnonymously, loading } = useAuth();
  const { t, isReady } = useTranslation();
  const { appLanguage, setAppLanguage } = useSettings();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { appLanguage: appLanguage }
  });
  
  const handleEmailSignUp = async (data: FormData) => {
    setAppLanguage(data.appLanguage);
    await signUpWithEmail(data.email, data.password, data.displayName);
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
        <CardTitle className="text-2xl mt-2">{t('auth.createAccountTitle')}</CardTitle>
        <CardDescription>Join LearnX to unlock all features.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="absolute inset-0 bg-background/50 flex justify-center items-center z-10 rounded-lg"><Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" /></div>}
        <div className="space-y-2">
            <Button onClick={signInAnonymously} variant="secondary" className="w-full" disabled={loading}>
                <User className="mr-2 h-4 w-4" />
                {t('auth.continueAsGuest')}
            </Button>
        </div>

        <div className="relative my-4">
          <Separator className="my-1" />
          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            {t('auth.orSignUpWithEmail')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit(handleEmailSignUp)} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="displayName">{t('auth.displayNameLabel')}</Label>
            <Input id="displayName" type="text" placeholder={t('auth.displayNamePlaceholder')} {...register('displayName')} disabled={loading} />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.confirmPasswordLabel')}</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} disabled={loading} placeholder={t('auth.confirmPasswordLabel')} />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <div className="space-y-2">
              <Label htmlFor="appLanguage">{t('header.appLanguage')}</Label>
              <Controller
                name="appLanguage"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                    <SelectTrigger id="appLanguage">
                      <SelectValue placeholder={t('header.appLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {APP_LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
             {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {t('auth.createAccountButton')}
          </Button>
        </form>

      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          {t('auth.alreadyHaveAccountPrompt')}{' '}
          <Link href="/sign-in" className="font-semibold text-primary hover:underline">
            {t('auth.signInLink')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
