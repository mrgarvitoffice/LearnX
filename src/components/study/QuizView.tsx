
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Lightbulb, RotateCcw, Loader2, AlertTriangle, FileText, MonitorPlay } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useQuests } from '@/contexts/QuestContext';
import { cn } from '@/lib/utils';
import type { QuizQuestion as QuizQuestionType } from '@/lib/types';
import { useTranslation } from '@/hooks/useTranslation';
import PptxGenJS from 'pptxgenjs';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '../icons/Logo';

interface QuizViewProps {
  questions: QuizQuestionType[] | null;
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const QuizView: React.FC<QuizViewProps> = ({ questions, topic, difficulty = 'medium' }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Array<string | undefined>>([]);
  const [isAnswerFinalized, setIsAnswerFinalized] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [shortAnswerValue, setShortAnswerValue] = useState('');
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);
  
  const { playSound: playCorrectSound } = useSound('/sounds/correct-answer.mp3', { volume: 0.5, priority: 'essential' });
  const { playSound: playIncorrectSound } = useSound('/sounds/incorrect-answer.mp3', { volume: 0.5, priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { speak, isSpeaking, isPaused, setVoicePreference } = useTTS();
  const { quests, completeQuest2 } = useQuests();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  useEffect(() => {
    setVoicePreference('gojo');
  }, [setVoicePreference]);

  useEffect(() => {
    if (questions && questions.length > 0) {
      setUserAnswers(Array(questions.length).fill(undefined));
      setIsAnswerFinalized(false);
      setQuizFinished(false);
      setScore(0);
      setCurrentQuestionIndex(0);
      setShortAnswerValue('');
      setSelectedMcqOption(null);
    }
  }, [questions]);

  const currentQuestion = questions ? questions[currentQuestionIndex] : null;

  const finalizeAnswer = useCallback((answerGiven: string) => {
    if (!currentQuestion || isAnswerFinalized) return;

    const isCorrect = answerGiven.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerGiven;
    setUserAnswers(newAnswers);

    if (isCorrect) {
      setScore(prev => prev + 4);
      if (!isSpeaking && !isPaused) speak(t('quizView.correct'));
      playCorrectSound();
    } else {
      setScore(prev => prev - 1); 
      if (!isSpeaking && !isPaused) speak(t('quizView.incorrect'));
      playIncorrectSound();
    }
    setIsAnswerFinalized(true);
  }, [currentQuestion, isAnswerFinalized, userAnswers, currentQuestionIndex, playCorrectSound, playIncorrectSound, speak, isSpeaking, isPaused, t]);


  const handleMcqOptionClick = useCallback((optionValue: string) => {
    if (isAnswerFinalized || !currentQuestion || currentQuestion.type !== 'multiple-choice') return;
    playClickSound();
    setSelectedMcqOption(optionValue);
    finalizeAnswer(optionValue);
  }, [isAnswerFinalized, currentQuestion, finalizeAnswer, playClickSound, setSelectedMcqOption]);

  const handleShortAnswerSubmit = useCallback(() => {
    if (isAnswerFinalized || !currentQuestion || !shortAnswerValue.trim()) return;
    const isEffectivelyShortAnswer = currentQuestion.type === 'short-answer' || 
                                 (currentQuestion.type === 'multiple-choice' && (!currentQuestion.options || currentQuestion.options.length === 0));
    if (!isEffectivelyShortAnswer) return;

    playClickSound();
    finalizeAnswer(shortAnswerValue);
  }, [isAnswerFinalized, currentQuestion, shortAnswerValue, finalizeAnswer, playClickSound]);

  const handleNextQuestion = () => {
    playClickSound();
    if (!questions || currentQuestionIndex >= questions.length - 1) {
      if (!quizFinished) handleViewResults(); 
      return;
    }
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    
    const nextQuestionData = questions[nextIndex];
    const nextUserAnswer = userAnswers[nextIndex];

    setIsAnswerFinalized(!!nextUserAnswer); 
    setSelectedMcqOption(nextQuestionData?.type === 'multiple-choice' && nextUserAnswer ? nextUserAnswer : null);
    setShortAnswerValue(nextUserAnswer || ''); 
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (currentQuestionIndex <= 0) return;
    const prevIndex = currentQuestionIndex - 1;
    setCurrentQuestionIndex(prevIndex);
    
    const prevQuestionData = questions?.[prevIndex];
    const prevUserAnswer = userAnswers[prevIndex];

    setIsAnswerFinalized(!!prevUserAnswer);
    setSelectedMcqOption(prevQuestionData?.type === 'multiple-choice' && prevUserAnswer ? prevUserAnswer : null);
    setShortAnswerValue(prevUserAnswer || ''); 
  };

  const handleViewResults = () => {
    playClickSound();
    if (!questions) return;
    setQuizFinished(true);
    if (!quests.quest2Completed) {
      completeQuest2();
    }
    const totalPossibleScore = questions.length * 4;
    const finalScoreMessage = t('quizView.speak.results', { score, totalPossibleScore });
    if (!isSpeaking && !isPaused) speak(finalScoreMessage);
  };
  
  const handleRestartQuiz = () => {
    playClickSound();
    if (questions) {
        setUserAnswers(Array(questions.length).fill(undefined));
    }
    setQuizFinished(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setIsAnswerFinalized(false);
    setShortAnswerValue('');
    setSelectedMcqOption(null);
    if (!isSpeaking && !isPaused) speak(t('quizView.speak.restarted'));
  };

  const handleDownloadResultsPpt = () => {
    playClickSound();
    if (!quizFinished || !questions) return;
    toast({ title: "Generating PPTX...", description: "Your quiz results are being created." });

    const pptx = new PptxGenJS();
    pptx.defineSlideMaster({
      title: 'LEARNX_MASTER',
      background: { color: '0A0A0C' },
      objects: [
        { 'line': { x: 0.5, y: 5.3, w: 9.0, h: 0, line: { color: 'FF5A2F', width: 1 } } },
        { 'text': { text: 'LearnX Intelligence Report', options: { x: 0.5, y: 5.3, w: '90%', h: 0.2, align: 'left', fontFace: 'Arial', fontSize: 10, color: '94A3B8' } } },
        { 'image': { path: '/icons/icon-512x512.png', x: 9.2, y: 0.3, w: 0.5, h: 0.5 } }
      ]
    });
    
    const titleSlide = pptx.addSlide({ masterName: 'LEARNX_MASTER' });
    titleSlide.addText(`Assessment Analysis: ${topic}`, {
      x: 0.5, y: 2, w: '90%', h: 1,
      align: 'center', fontSize: 36, bold: true, color: 'FFFFFF',
      fontFace: 'Arial', shadow: { type: 'outer', color: 'FF5A2F', blur: 3, offset: 2, angle: 45, opacity: 0.6 }
    });
    const totalPossibleScore = questions.length * 4;
    titleSlide.addText(`Final Verification Score: ${score}/${totalPossibleScore}`, {
      x: 0, y: 3.2, w: '100%', h: 1,
      align: 'center', fontSize: 20, color: '94A3B8'
    });

    questions.forEach((q, index) => {
      const slide = pptx.addSlide({ masterName: 'LEARNX_MASTER' });
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();

      slide.addText(`Module ${index + 1}: ${q.question}`, { 
          x: 0.5, y: 0.4, w: '85%', h: 1.2, 
          fontSize: 20, bold: true, color: 'FF5A2F',
          anim: { type: 'slideUp', duration: 0.5 }
      });
      
      let yPos = 1.8;
      
      const addTextWithBullet = (text: string, color: string, isBold = false) => {
        slide.addText([{
          text: `• `,
          options: { fontSize: 16, color: color }
        }, {
          text: text,
          options: { fontSize: 16, color: color, bold: isBold }
        }], { x: 0.7, y: yPos, w: '88%', h: 0.4, anim: { type: 'fadeIn', delay: 0.3 } });
        yPos += 0.5;
      };

      if (q.type === 'multiple-choice' && q.options) {
        q.options.forEach(opt => {
          let color = 'E2E8F0'; 
          let isUserChoice = (opt === userAnswer);
          let isTheCorrectAnswer = (opt === q.answer);
          if (isTheCorrectAnswer) color = '22C55E'; 
          if (isUserChoice && !isCorrect) color = 'EF4444'; 
          
          addTextWithBullet(opt, color, isTheCorrectAnswer);
        });
        yPos += 0.2;
      }

      addTextWithBullet(`User Response: ${userAnswer || 'NULL'}`, isCorrect ? '22C55E' : 'EF4444', true);
      if (!isCorrect) {
          addTextWithBullet(`System Validation: ${q.answer}`, '22C55E', true);
      }
      
      if(q.explanation) {
         slide.addText([{
          text: 'Logic: ', options: { fontSize: 14, color: '94A3B8', bold: true }
         }, {
          text: q.explanation, options: { fontSize: 14, color: '94A3B8' }
         }], { x: 0.7, y: yPos, w: '88%', h: 1, anim: { type: 'fadeIn', delay: 0.6 } });
      }
    });

    pptx.writeFile({ fileName: `LearnX_Logic_Report_${topic.replace(/\s+/g, '_')}.pptx` });
  };

  if (!questions || questions.length === 0) {
    return (
      <Card className="glass-card mt-0 flex-1 flex flex-col min-h-0">
        <CardHeader><CardTitle className="text-lg md:text-xl text-primary font-semibold">{t('quizView.title', { topic })}</CardTitle></CardHeader>
        <CardContent className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">{t('quizView.unavailable')}</p></CardContent>
      </Card>
    );
  }
  
  if (quizFinished) {
    const totalPossibleScore = questions.length * 4;
    return (
      <Card className="glass-card mt-0 shadow-lg flex-1 flex flex-col min-h-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">{t('quizView.results.title')}</CardTitle>
          <CardDescription>{t('quizView.results.topic', { topic, difficulty })}</CardDescription>
          <p className="text-3xl font-bold mt-2">{t('quizView.results.score', { score, totalPossibleScore })}</p>
          <Progress value={((score / (totalPossibleScore || 1)) * 100)} className="w-3/4 mx-auto mt-3 h-3" />
        </CardHeader>
        <CardContent className="space-y-3 flex-1 overflow-y-auto p-4" >
          {questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
            return (
              <Card key={index} className={cn("p-3 bg-background/30", isCorrect ? "border-green-500 bg-green-500/5" : userAnswer !== undefined ? "border-destructive bg-destructive/5" : "border-border")}>
                <p className="font-semibold text-sm mb-1">{t('customTest.results.questionPrefix', { index: index + 1 })}: <ReactMarkdown className="prose prose-sm dark:prose-invert max-none inline">{q.question}</ReactMarkdown></p>
                <p className="text-xs">{t('customTest.results.yourAnswer', { answer: '' })} <span className={cn("font-medium", isCorrect ? "text-green-700 dark:text-green-400" : "text-destructive")}>{userAnswer || t('customTest.results.notAnswered')}</span></p>
                {!isCorrect && <p className="text-xs">{t('customTest.results.correctAnswer', { answer: '' })} <span className="font-medium text-green-700 dark:text-green-500">{q.answer}</span></p>}
                {q.explanation && (
                  <Alert variant="default" className="mt-1.5 p-2 text-xs bg-accent/10 border-accent/30">
                    <Lightbulb className="h-3.5 w-3.5 text-accent-foreground/80" />
                    <AlertTitle className="text-xs font-semibold text-accent-foreground/90">{t('customTest.results.explanation')}</AlertTitle>
                    <AlertDescription className="prose prose-xs dark:prose-invert max-none text-muted-foreground"><ReactMarkdown>{q.explanation}</ReactMarkdown></AlertDescription>
                  </Alert>
                )}
              </Card>
            );
          })}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-6 border-t">
          <Button onClick={handleRestartQuiz} variant="outline" size="lg"><RotateCcw className="w-4 h-4 mr-2" />{t('quizView.restart')}</Button>
          <Button variant="secondary" onClick={handleDownloadResultsPpt} size="lg"><MonitorPlay className="w-4 h-4 mr-2"/>Download PPT Report</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!currentQuestion) return <div className="p-4 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /><p className="text-muted-foreground mt-2">{t('quizView.loading')}</p></div>;

  const isCurrentAnswerCorrect = isAnswerFinalized && userAnswers[currentQuestionIndex]?.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();

  const isEffectivelyMultipleChoice = currentQuestion.type === 'multiple-choice' && 
                                      currentQuestion.options && currentQuestion.options.length > 0;
  const isEffectivelyShortAnswer = currentQuestion.type === 'short-answer' || 
                                   (currentQuestion.type === 'multiple-choice' && (!currentQuestion.options || currentQuestion.options.length === 0));


  return (
    <Card className="glass-card mt-0 shadow-lg flex-1 flex flex-col min-h-0"> 
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg md:text-xl text-primary font-semibold">{t('quizView.title', { topic })}</CardTitle>
            <CardDescription>{t('customTest.test.questionProgress', { current: currentQuestionIndex + 1, total: questions.length })} ({t('customTest.settings.difficulty.label')}: {difficulty})</CardDescription>
          </div>
        </div>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full mt-2 h-2.5" />
      </CardHeader>
      <CardContent className="space-y-4 flex-1 p-4 sm:p-6">
        <div className="text-base sm:text-lg font-semibold mb-4"><ReactMarkdown className="prose dark:prose-invert max-none">{currentQuestion.question}</ReactMarkdown></div>

        {isEffectivelyMultipleChoice && currentQuestion.options && (
          <RadioGroup 
            value={selectedMcqOption || undefined} 
            className="space-y-2"
          >
            {currentQuestion.options.map((option, i) => {
              const isThisOptionSelected = selectedMcqOption === option;
              const isCorrectAnswer = option === currentQuestion.answer;
              return (
                <Label key={i} htmlFor={`option-${i}-${currentQuestionIndex}`}
                  onClick={() => handleMcqOptionClick(option)}
                  className={cn(
                    "flex items-center space-x-3 p-3 border rounded-md transition-all",
                    isAnswerFinalized && isThisOptionSelected && isCorrectAnswer && "bg-green-500/20 border-green-600 text-green-700 dark:text-green-400 ring-2 ring-green-500",
                    isAnswerFinalized && isThisOptionSelected && !isCorrectAnswer && "bg-destructive/20 border-destructive text-destructive-foreground ring-2 ring-destructive",
                    isAnswerFinalized && !isThisOptionSelected && isCorrectAnswer && "border-green-600 bg-green-500/10", 
                    !isAnswerFinalized && "hover:bg-muted cursor-pointer",
                    isAnswerFinalized && "cursor-default"
                  )}>
                  <RadioGroupItem 
                    value={option} 
                    id={`option-${i}-${currentQuestionIndex}`} 
                    disabled={isAnswerFinalized} 
                    checked={selectedMcqOption === option} 
                    className="sr-only" 
                  />
                  <div className={cn(
                      "w-4 h-4 rounded-full border border-primary flex items-center justify-center shrink-0",
                      isAnswerFinalized && isThisOptionSelected && isCorrectAnswer && "bg-green-600 border-green-700",
                      isAnswerFinalized && isThisOptionSelected && !isCorrectAnswer && "bg-destructive border-destructive",
                      selectedMcqOption === option && !isAnswerFinalized && "bg-primary/20"
                  )}>
                      {(isAnswerFinalized && isThisOptionSelected && isCorrectAnswer) && <CheckCircle className="h-3 w-3 text-white" />}
                      {(isAnswerFinalized && isThisOptionSelected && !isCorrectAnswer) && <XCircle className="h-3 w-3 text-white" />}
                      {(selectedMcqOption === option && !isAnswerFinalized) && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                  <span className="text-sm sm:text-base">{option}</span>
                </Label>
              );
            })}
          </RadioGroup>
        )}

        {isEffectivelyShortAnswer && (
          <div className="space-y-2">
            <Input type="text" placeholder={t('customTest.test.shortAnswerPlaceholder')} value={shortAnswerValue}
              onChange={(e) => setShortAnswerValue(e.target.value)}
              disabled={isAnswerFinalized} className="text-sm sm:text-base bg-muted/20"
              onKeyDown={(e) => { if (e.key === 'Enter' && !isAnswerFinalized && shortAnswerValue.trim()) handleShortAnswerSubmit(); }}
            />
            {!isAnswerFinalized && (
              <Button onClick={handleShortAnswerSubmit} disabled={!shortAnswerValue.trim()} className="mt-2">{t('quizView.submitAnswer')}</Button>
            )}
          </div>
        )}

        {isAnswerFinalized && (
          <Alert variant={isCurrentAnswerCorrect ? 'default' : 'destructive'} className={cn("mt-4", isCurrentAnswerCorrect ? "bg-green-500/10 border-green-500/50" : "bg-destructive/10 border-destructive/50")}>
            {isCurrentAnswerCorrect ? <CheckCircle className="h-5 w-5 text-green-600"/> : <XCircle className="h-5 w-5 text-destructive"/>}
            <AlertTitle>{isCurrentAnswerCorrect ? t('quizView.correct') : t('quizView.incorrect')}</AlertTitle>
            <AlertDescription className="text-xs">
              {!isCurrentAnswerCorrect && <p>{t('customTest.results.correctAnswer', { answer: '' })} <span className="font-semibold text-green-700 dark:text-green-500">{currentQuestion.answer}</span></p>}
              {currentQuestion.explanation && <div className="mt-1 prose prose-xs dark:prose-invert max-none"><ReactMarkdown>{currentQuestion.explanation}</ReactMarkdown></div>}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-4 sm:p-6 border-t">
        <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>{t('customTest.test.previousButton')}</Button>
        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={handleNextQuestion} disabled={!isAnswerFinalized}>{t('quizView.nextQuestion')}</Button>
        ) : (
          <Button onClick={handleViewResults} variant="default" disabled={!isAnswerFinalized}>{t('quizView.viewResults')}</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizView;
