
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { COLLEGE_DATA, GOAL_CARDS_DATA, NEWS_COUNTRIES } from '@/lib/constants';
import type { UserGoal, GoalType } from '@/lib/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface GoalSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GoalCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  goalType: GoalType;
  isSelected: boolean;
  onSelect: (type: GoalType) => void;
}

const GoalCard = ({ icon: Icon, title, description, goalType, isSelected, onSelect }: GoalCardProps) => (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card
        className={cn(
          "text-left p-4 cursor-pointer hover:shadow-primary/20 transition-all flex items-start gap-4 h-full relative overflow-hidden group",
          isSelected && "ring-2 ring-primary bg-primary/5"
        )}
        onClick={() => onSelect(goalType)}
      >
        <Icon className="h-8 w-8 text-primary mt-1 shrink-0" />
        <div>
            <h4 className="font-semibold text-base">{title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </Card>
    </motion.div>
  );


export function GoalSelectionDialog({ isOpen, onClose }: GoalSelectionDialogProps) {
  const { userGoal, setUserGoal } = useSettings();
  const { toast } = useToast();

  const [selectedCountry, setSelectedCountry] = useState(userGoal?.country || 'us');
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(userGoal?.type || null);
  
  const [university, setUniversity] = useState(userGoal?.type === 'college' ? userGoal.university || '' : '');
  const [program, setProgram] = useState(userGoal?.type === 'college' ? userGoal.program || '' : '');
  const [branch, setBranch] = useState(userGoal?.type === 'college' ? userGoal.branch || '' : '');
  const [semester, setSemester] = useState(userGoal?.type === 'college' ? userGoal.semester || '' : '');

  useEffect(() => {
    if (isOpen) {
        setSelectedCountry(userGoal?.country || 'us');
        setSelectedGoal(userGoal?.type || null);
        if (userGoal?.type === 'college') {
            setUniversity(userGoal.university || '');
            setProgram(userGoal.program || '');
            setBranch(userGoal.branch || '');
            setSemester(userGoal.semester || '');
        }
    }
  }, [isOpen, userGoal]);

  const handleSaveGoal = () => {
    let goalData: UserGoal;
    
    switch(selectedGoal) {
        case 'college':
            if (!university || !program || !branch || !semester) {
                toast({ title: "Incomplete Selection", description: "Please select all college options.", variant: "destructive" });
                return;
            }
            goalData = { type: 'college', country: selectedCountry, university, program, branch, semester };
            break;
        case null:
             toast({ title: "No Goal Selected", description: "Please select a goal.", variant: "destructive" });
             return;
        default:
            goalData = { type: selectedGoal, country: selectedCountry };
    }
    
    setUserGoal(goalData);
    toast({ title: "Goal Updated!", description: "Experience personalized." });
    onClose();
  };
  
  const filteredGoals = useMemo(() => {
    return GOAL_CARDS_DATA.filter(goal => {
      if (selectedCountry === 'in') return true;
      return goal.location === 'global';
    });
  }, [selectedCountry]);

  const universities = useMemo(() => Object.keys(COLLEGE_DATA || {}), []);
  const programs = useMemo(() => (university && COLLEGE_DATA[university]) ? Object.keys(COLLEGE_DATA[university].programs || {}) : [], [university]);
  const branches = useMemo(() => (university && program && COLLEGE_DATA[university]?.programs?.[program]) ? Object.keys(COLLEGE_DATA[university].programs[program].branches || {}) : [], [university, program]);
  const semesters = useMemo(() => (university && program && branch && COLLEGE_DATA[university]?.programs?.[program]?.branches?.[branch]) ? Object.keys(COLLEGE_DATA[university].programs[program].branches[branch].semesters || {}) : [], [university, program, branch]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden flex flex-col h-[85vh] sm:h-auto bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl text-center font-bold text-primary">Customize Your Stream</DialogTitle>
          <DialogDescription className="text-center">Select your node parameters.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 space-y-6 py-4">
             <div className="space-y-2">
                <Label htmlFor="country-select" className="font-semibold">Region Node</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger id="country-select" className="glass-card">
                        <SelectValue placeholder="Select Country..." />
                    </SelectTrigger>
                    <SelectContent>
                        {NEWS_COUNTRIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {filteredGoals.map(goal => (
                    <GoalCard 
                        key={goal.type}
                        icon={goal.icon}
                        title={goal.title}
                        description={goal.description}
                        goalType={goal.type as GoalType}
                        isSelected={selectedGoal === goal.type}
                        onSelect={setSelectedGoal}
                    />
                 ))}
            </div>
            
            {selectedGoal === 'college' && (
                <Card className="p-4 bg-muted/20 border-primary/20 glass-card">
                    <CardContent className="p-0 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select onValueChange={setUniversity} value={university}>
                              <SelectTrigger><SelectValue placeholder="University" /></SelectTrigger>
                              <SelectContent>{universities.map(u => <SelectItem key={u} value={u}>{COLLEGE_DATA[u].name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select onValueChange={setProgram} value={program} disabled={!university}>
                              <SelectTrigger><SelectValue placeholder="Program" /></SelectTrigger>
                              <SelectContent>{programs.map(p => <SelectItem key={p} value={p}>{COLLEGE_DATA[university]?.programs?.[p]?.name || p}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select onValueChange={setBranch} value={branch} disabled={!program}>
                              <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                              <SelectContent>{branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select onValueChange={setSemester} value={semester} disabled={!branch}>
                              <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                              <SelectContent>{semesters.map(s => <SelectItem key={s} value={s}>{s} Sem</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
        <DialogFooter className="p-6 pt-2">
          <Button onClick={handleSaveGoal} disabled={!selectedGoal} className="w-full h-12 text-lg font-bold">
            Sync Profile Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
