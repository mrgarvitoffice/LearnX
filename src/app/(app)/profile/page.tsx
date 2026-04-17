

"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuests } from '@/contexts/QuestContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, KeyRound, LogOut, CheckCircle, Brain, User, MessageSquareText, Loader2, Github, Code2, ArrowLeft, Target, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GoalSelectionDialog } from '@/components/features/auth/GoalSelectionDialog';
import { GOAL_CARDS_DATA } from '@/lib/constants';
import { GuestLock } from '@/components/features/auth/GuestLock';


const DailyQuestItem = ({ isCompleted, text }: { isCompleted: boolean; text: string }) => (
    <div className={cn("flex items-center gap-3 p-3 bg-muted/50 rounded-md", isCompleted && "text-muted-foreground line-through")}>
        {isCompleted ? (
            <CheckCircle className="text-green-500 h-5 w-5 shrink-0" />
        ) : (
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50" />
            </div>
        )}
        <span className="text-sm">{text}</span>
    </div>
);

export default function ProfilePage() {
  const { user, signOutUser, loading: authLoading } = useAuth();
  const { quests } = useQuests();
  const { t, isReady: i18nReady } = useTranslation();
  const { userGoal } = useSettings();
  const router = useRouter();
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  const isLoading = authLoading || !i18nReady;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should ideally not be hit if auth routing is correct, but it's a safeguard.
    return <GuestLock featureName="Profile" featureDescription="View your profile and track progress." Icon={User} />;
  }
  
  if (user.isAnonymous) {
     return <GuestLock featureName="Profile" featureDescription="View your profile and track progress." Icon={User} />;
  }

  const userDisplayName = user.displayName || user.email?.split('@')[0] || "User";
  const selectedGoalDetails = userGoal ? GOAL_CARDS_DATA.find(g => g.type === userGoal.type) : null;
  const SelectedGoalIcon = selectedGoalDetails?.icon || Target;

  return (
    <div className="py-8">
      <Card className="shadow-xl relative overflow-hidden text-center bg-cover bg-center" style={{ backgroundImage: "url('/icons/v1.mp4')" }}>
          <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
          <div className="relative z-10">
              <CardHeader>
                  <Avatar className="mx-auto h-24 w-24 text-primary/80 border-4 border-primary/30">
                    <AvatarImage src={user.isAnonymous ? '' : user.photoURL || ''} alt={userDisplayName} />
                    <AvatarFallback className="text-4xl bg-secondary">
                        {user.isAnonymous ? <User className="h-10 w-10"/> : userDisplayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-3xl font-bold text-primary mt-4">
                    {user.isAnonymous ? t('profile.guestGreeting') : t('header.profile.greeting', { name: userDisplayName })}
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-1">
                      {user.isAnonymous 
                        ? t('profile.guestDescription')
                        : t('profile.userDescription')
                      }
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-left px-4 sm:px-6">
                 <div className="space-y-3">
                   <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                     <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                     <div>
                       <p className="text-xs text-muted-foreground">{t('profile.emailLabel')}</p>
                       {user.isAnonymous ? (
                         <p className="italic text-muted-foreground/80">{t('profile.guestAddEmail')}</p>
                       ) : (
                         <p className="font-semibold break-all">{user.email}</p>
                       )}
                     </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                     <KeyRound className="h-5 w-5 text-muted-foreground shrink-0" />
                     <div>
                       <p className="text-xs text-muted-foreground">{t('profile.userIdLabel')}</p>
                       <p className="font-mono text-xs break-all">{user.uid}</p>
                     </div>
                   </div>
                </div>

                <Card className="bg-background/50 card-bg-1 relative overflow-hidden group">
                  <div className="absolute -top-8 -right-8 w-24 h-24 text-primary/10 transition-transform duration-500 ease-in-out group-hover:rotate-12 group-hover:scale-125">
                     <SelectedGoalIcon className="w-full h-full"/>
                  </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <Target className="text-primary"/> Current Learning Goal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {userGoal && selectedGoalDetails ? (
                            <div>
                                <p className="font-bold text-lg text-foreground">{selectedGoalDetails.title}</p>
                                {userGoal.type === 'college' && (
                                    <p className="text-sm text-muted-foreground">
                                        {userGoal.university}, {userGoal.branch} - Semester {userGoal.semester}
                                    </p>
                                )}
                                 <p className="text-sm text-muted-foreground">{selectedGoalDetails.description}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">No goal selected yet.</p>
                        )}
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="text-xs" onClick={() => setIsGoalDialogOpen(true)}>Change Goal</Button>
                    </CardFooter>
                </Card>

                <Card className="bg-background/50 card-bg-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <Brain className="text-primary"/> {t('dashboard.dailyQuests.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <DailyQuestItem isCompleted={quests.quest1Completed} text={t('dashboard.dailyQuests.quest1')} />
                        <DailyQuestItem isCompleted={quests.quest2Completed} text={t('dashboard.dailyQuests.quest2')} />
                        <DailyQuestItem isCompleted={quests.quest3Completed} text={t('dashboard.dailyQuests.quest3')} />
                    </CardContent>
                </Card>

                {user.isAnonymous && (
                    <Card className="mt-4 border-primary/30 bg-primary/10 text-center p-4">
                        <CardTitle className="text-lg text-primary">{t('profile.guestUnlockTitle')}</CardTitle>
                        <CardDescription className="text-primary/80 mt-1">{t('profile.guestUnlockDesc')}</CardDescription>
                        <Button asChild className="mt-3">
                            <Link href="/sign-up">{t('profile.guestSignUpButton')}</Link>
                        </Button>
                    </Card>
                )}

                <div className="space-y-2 pt-6 border-t border-border/50">
                    <a href="mailto:learnmint.ai@gmail.com?subject=LearnMint%20App%20Feedback" className="w-full">
                    <Button variant="outline" className="w-full justify-start gap-2">
                            <MessageSquareText className="mr-2 h-4 w-4" />
                            {t('profile.sendFeedback')}
                        </Button>
                    </a>
                    <Button onClick={signOutUser} variant="destructive" className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('header.profile.signOut')}
                    </Button>
                 </div>
              </CardContent>
          </div>
      </Card>

      <GoalSelectionDialog
        isOpen={isGoalDialogOpen}
        onClose={() => setIsGoalDialogOpen(false)}
      />
    </div>
  );
}

    