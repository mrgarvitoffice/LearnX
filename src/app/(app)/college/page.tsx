"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { School, ArrowRight, BookCopy, Code2 } from 'lucide-react';
import { COLLEGE_DATA, COLLEGE_RESOURCES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/contexts/SettingsContext';

const TopResourceCard = ({ title, description, href, icon: Icon }: { title: string, description: string, href: string, icon: React.ElementType }) => {
    const { t } = useTranslation();
    const isInternalLink = href.startsWith('/');

    return (
        <motion.div whileHover={{ y: -5 }} className="h-full">
            <a href={href} target={isInternalLink ? '_self' : '_blank'} rel="noopener noreferrer" className="block h-full">
                <Card 
                  className="h-full flex flex-col hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden group bg-cover bg-center"
                  style={{ backgroundImage: "url('/icons/2.jpg')" }}
                >
                    <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
                    <div className="relative z-10 flex flex-col flex-grow">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Icon className="h-8 w-8 text-primary" />
                                <CardTitle className="text-xl">{t(title)}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{t(description)}</p>
                        </CardContent>
                    </div>
                </Card>
            </a>
        </motion.div>
    );
};

export default function CollegePage() {
  const [university, setUniversity] = useState<keyof typeof COLLEGE_DATA | ''>('RGPV');
  const [program, setProgram] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  
  const router = useRouter();
  const { t } = useTranslation();
  const { userGoal } = useSettings();

  useEffect(() => {
    if (userGoal?.type === 'college' && userGoal.university && userGoal.program && userGoal.branch && userGoal.semester) {
        const uniKey = Object.keys(COLLEGE_DATA).find(key => key === userGoal.university) as keyof typeof COLLEGE_DATA | undefined;
        if(uniKey) {
            setUniversity(uniKey);
            setProgram(userGoal.program);
            setBranch(userGoal.branch);
            setSemester(userGoal.semester);
        }
    }
  }, [userGoal]);

  const handleUniversityChange = (value: string) => {
    setUniversity(value as keyof typeof COLLEGE_DATA);
    setProgram('');
    setBranch('');
    setSemester('');
  };

  const handleProgramChange = (value: string) => {
    setProgram(value);
    setBranch('');
    setSemester('');
  };

  const handleBranchChange = (value: string) => {
    setBranch(value);
    setSemester('');
  };

  const programs = useMemo(() => university ? Object.keys(COLLEGE_DATA[university].programs) : [], [university]);
  
  const branches = useMemo(() => {
    if (university && program && COLLEGE_DATA[university]?.programs[program]?.branches) {
      return Object.keys(COLLEGE_DATA[university].programs[program].branches);
    }
    return [];
  }, [university, program]);

  const semesters = useMemo(() => {
    if (university && program && branch && COLLEGE_DATA[university]?.programs[program]?.branches[branch]?.semesters) {
      return Object.keys(COLLEGE_DATA[university].programs[program].branches[branch].semesters);
    }
    return [];
  }, [university, program, branch]);

  const subjects = useMemo(() => {
    if (university && program && branch && semester && COLLEGE_DATA[university]?.programs[program]?.branches[branch]?.semesters[semester]?.subjects) {
      return COLLEGE_DATA[university].programs[program].branches[branch].semesters[semester].subjects;
    }
    return [];
  }, [university, program, branch, semester]);

  return (
    <div className="w-full mx-auto py-8 space-y-8">
      <Card className="w-full shadow-xl relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-20">
            <source src="/icons/v2.mp4" type="video/mp4" />
        </video>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><School className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">LearnX College</CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">
            Select your university, program, branch, and semester to find curated notes and AI-powered study tools.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Card 
        className="w-full shadow-xl relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/icons/1.jpg')" }}
      >
        <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
        <div className="relative z-10">
            <CardHeader>
              <CardTitle className="text-2xl">Top Resources</CardTitle>
              <CardDescription>Hand-picked, high-quality resources for students.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COLLEGE_RESOURCES.map(resource => (
                   <TopResourceCard key={resource.title} title={resource.title} description={resource.description} href={resource.link} icon={resource.icon} />
                ))}
            </CardContent>
        </div>
      </Card>

      <Card 
        className="w-full shadow-xl relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/icons/1.jpg')" }}
      >
        <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
        <div className="relative z-10">
            <CardHeader>
                <CardTitle>Find Your Syllabus</CardTitle>
                <CardDescription>Select your course details to find AI-powered tools for your subjects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 bg-background/50 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select onValueChange={handleUniversityChange} value={university}>
                  <SelectTrigger><SelectValue placeholder="Select University/Board" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(COLLEGE_DATA).map(uni => (
                      <SelectItem key={uni} value={uni}>{COLLEGE_DATA[uni].name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={handleProgramChange} value={program} disabled={!university}>
                  <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                  <SelectContent>
                    {programs.map(prog => (
                      <SelectItem key={prog} value={prog}>{COLLEGE_DATA[university as keyof typeof COLLEGE_DATA].programs[prog].name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={handleBranchChange} value={branch} disabled={!program}>
                  <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map(br => (
                       <SelectItem key={br} value={br}>{COLLEGE_DATA[university as keyof typeof COLLEGE_DATA].programs[program].branches[br].name || br}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={setSemester} value={semester} disabled={!branch}>
                  <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                  <SelectContent>
                    {semesters.map(sem => (
                      <SelectItem key={sem} value={sem}>{COLLEGE_DATA[university as keyof typeof COLLEGE_DATA].programs[program].branches[branch].semesters[sem].name} Semester</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
        </div>
      </Card>

      <AnimatePresence>
        {subjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-center text-primary">Subjects for Semester {semester}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject: any) => (
                <motion.div key={subject.id} whileHover={{ y: -5, scale: 1.03 }}>
                  <Card 
                    className="h-full flex flex-col hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden group bg-cover bg-center"
                    style={{ backgroundImage: "url('/icons/3.jpg')" }}
                  >
                     <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
                     <div className="relative z-10 flex flex-col flex-grow">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg"><BookCopy className="h-5 w-5 text-primary"/>{subject.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-xs text-muted-foreground">{subject.description}</p>
                        </CardContent>
                        <CardFooter>
                          <Button onClick={() => router.push(`/college/${subject.id}`)} className="w-full">
                            Open Study Hub <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardFooter>
                     </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
