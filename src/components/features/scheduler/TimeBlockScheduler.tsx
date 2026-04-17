
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, CloudSync, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  text: string;
  completed: boolean;
}

interface ScheduleData {
  [hour: string]: Task;
}

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h;
  return `${displayH.toString().padStart(2, '0')}:00 ${ampm}`;
});

export default function TimeBlockScheduler() {
  const { user } = useAuth();
  const { t, isReady } = useTranslation();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ScheduleData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dateStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'users', user.uid, 'schedules', dateStr);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setTasks(snapshot.data().tasks || {});
      } else {
        setTasks({});
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Schedule Listener Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, dateStr]);

  const saveToFirebase = useCallback(async (dataToSave: ScheduleData) => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const docRef = doc(db, 'users', user.uid, 'schedules', dateStr);
      await setDoc(docRef, {
        tasks: dataToSave,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      setHasChanges(false);
    } catch (error: any) {
      console.error("Schedule Save Error:", error);
      toast({ title: "Sync Failed", description: "Could not save schedule to server.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [user, dateStr, toast]);

  const triggerDebouncedSave = useCallback((newTasks: ScheduleData) => {
    setHasChanges(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToFirebase(newTasks);
    }, 1500);
  }, [saveToFirebase]);

  const handleTaskChange = (hour: string, text: string) => {
    const newTasks = {
      ...tasks,
      [hour]: { ...tasks[hour], text }
    };
    setTasks(newTasks);
    triggerDebouncedSave(newTasks);
  };

  const handleToggleComplete = (hour: string) => {
    const newTasks = {
      ...tasks,
      [hour]: { ...tasks[hour], completed: !tasks[hour]?.completed }
    };
    setTasks(newTasks);
    saveToFirebase(newTasks);
  };

  if (isLoading || !isReady) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-2 sm:px-6">
      <Card className="glass-card shadow-2xl border-primary/20 overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-card/40 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
          <div>
            <CardTitle className="text-2xl font-black text-primary flex items-center gap-2">
              <Calendar className="h-6 w-6" /> {t('planner.title')}
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-mono mt-1 opacity-70">
              {format(new Date(), 'EEEE, MMMM do')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
             <AnimatePresence>
                {isSaving && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse">
                    <CloudSync className="h-3 w-3" /> SYNCING...
                  </motion.div>
                )}
             </AnimatePresence>
             <Button 
                onClick={() => saveToFirebase(tasks)} 
                disabled={!hasChanges || isSaving}
                size="sm"
                variant={hasChanges ? "default" : "outline"}
                className="h-9 px-4 font-bold tracking-tighter"
             >
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
               {t('planner.saveButton')}
             </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="divide-y divide-border/30">
              {HOURS.map((hour) => {
                const task = tasks[hour] || { text: '', completed: false };
                const isEmpty = !task.text.trim();

                return (
                  <div 
                    key={hour} 
                    className={cn(
                        "group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-primary/5",
                        task.completed && "bg-muted/30 opacity-70"
                    )}
                  >
                    <div className="w-20 shrink-0 text-xs font-mono text-muted-foreground select-none">
                      {hour}
                    </div>
                    
                    <div className="flex-1 flex items-center gap-3">
                      <Checkbox 
                        checked={task.completed} 
                        onCheckedChange={() => handleToggleComplete(hour)}
                        className="rounded-full h-5 w-5 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        disabled={isEmpty}
                      />
                      <Input 
                        value={task.text}
                        onChange={(e) => handleTaskChange(hour, e.target.value)}
                        placeholder={t('planner.placeholder')}
                        className={cn(
                            "border-none bg-transparent shadow-none focus-visible:ring-0 text-base py-0 h-auto",
                            task.completed && "line-through text-muted-foreground",
                            !isEmpty && "font-medium"
                        )}
                      />
                    </div>

                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : !isEmpty ? (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
