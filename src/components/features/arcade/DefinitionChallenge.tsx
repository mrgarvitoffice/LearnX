
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DEFINITION_CHALLENGE_WORDS } from '@/lib/constants';
import type { DefinitionChallengeWord } from '@/lib/types';
import { Lightbulb, CheckCircle, XCircle, Zap, RotateCcw, Loader2 } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS'; 
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useAssistant } from '@/contexts/AssistantContext';

export function DefinitionChallenge() {
  const [words, setWords] = useState<DefinitionChallengeWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [mistakesMadeThisWord, setMistakesMadeThisWord] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wordFailedMessage, setWordFailedMessage] = useState('');
  
  const { playSound: playCorrectSound } = useSound('/sounds/correct-answer.mp3', { volume: 0.5, priority: 'essential' }); 
  const { playSound: playIncorrectSound } = useSound('/sounds/incorrect-answer.mp3', { volume: 0.5, priority: 'essential' }); 
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { speak, setVoicePreference } = useTTS();
  const { t, isReady } = useTranslation();
  const { lastAssistantAction, setLastAssistantAction } = useAssistant();
  const guessInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setVoicePreference('holo'); 
  }, [setVoicePreference]);

  const shuffleArray = (array: DefinitionChallengeWord[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  const initializeGame = useCallback(() => {
    playClickSound();
    setWords(shuffleArray(DEFINITION_CHALLENGE_WORDS));
    setCurrentWordIndex(0);
    setGuess('');
    setFeedback('');
    setIsCorrect(null);
    setHintsUsed(0);
    setShowHint(false);
    setGameOver(false);
    setMistakesMadeThisWord(0);
    setWordFailedMessage('');
  }, [playClickSound]);

  useEffect(() => {
    const storedHighScore = localStorage.getItem('learnx-dc-highscore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
    initializeGame();
  }, [initializeGame]);

  const currentWord = words[currentWordIndex];

  const nextWord = useCallback(() => {
    if (!isReady) return;
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setGuess('');
      setFeedback('');
      setIsCorrect(null);
      setHintsUsed(0);
      setShowHint(false);
      setMistakesMadeThisWord(0);
      setWordFailedMessage('');
    } else {
      setGameOver(true);
      const finalMessage = t('arcade.challenge.gameOverMessage', { streak: streak.toString(), highScore: highScore.toString() });
      setFeedback(finalMessage);
      speak(finalMessage, { priority: 'essential' });
    }
  }, [currentWordIndex, words.length, streak, highScore, speak, t, isReady]);

  const handleGuessSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    playClickSound();
    if (!currentWord || gameOver || isCorrect === true || !isReady) return;

    if (guess.trim().toLowerCase() === currentWord.term.toLowerCase()) {
      setFeedback(t('arcade.challenge.feedback.correct'));
      setIsCorrect(true);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highScore) {
        setHighScore(newStreak);
        localStorage.setItem('learnx-dc-highscore', newStreak.toString());
      }
      playCorrectSound();
      speak(t('arcade.challenge.feedback.correct'), { priority: 'essential' });
      setTimeout(nextWord, 1500);
    } else {
      const newMistakes = mistakesMadeThisWord + 1;
      setMistakesMadeThisWord(newMistakes);
      setStreak(0);
      playIncorrectSound();
      speak(t('arcade.challenge.feedback.incorrect'), { priority: 'essential' });

      if (newMistakes >= 3) {
        const failMsg = t('arcade.challenge.feedback.fail', { term: currentWord.term });
        setFeedback(failMsg);
        setWordFailedMessage(t('arcade.challenge.feedback.wordWas', { term: currentWord.term }));
        speak(t('arcade.challenge.speak.correctWordWas', { term: currentWord.term }), { priority: 'essential' });
        setIsCorrect(false); 
        setTimeout(nextWord, 2500); 
      } else {
        setFeedback(t('arcade.challenge.feedback.attemptsLeft', { attempts: (3 - newMistakes).toString() }));
        setIsCorrect(false);
      }
    }
  }, [playClickSound, currentWord, gameOver, isCorrect, guess, streak, highScore, mistakesMadeThisWord, nextWord, playCorrectSound, playIncorrectSound, speak, t, isReady]);

  const handleUseHint = useCallback(() => {
    playClickSound();
    if (!currentWord || hintsUsed >= 3 || gameOver || isCorrect === true || !isReady) return; 
    setShowHint(true);
    const newHintsUsed = hintsUsed + 1;
    setHintsUsed(newHintsUsed);
    let hintText = "";
    if (newHintsUsed === 1) {
      hintText = t('arcade.challenge.hints.hint1', { hint: currentWord.hint });
    } else if (newHintsUsed === 2) {
      hintText = t('arcade.challenge.hints.hint2', { letter: currentWord.term[0] });
    } else if (newHintsUsed === 3) {
      const lettersToShow = Math.ceil(currentWord.term.length / 3);
      hintText = t('arcade.challenge.hints.hint3', { letters: currentWord.term.substring(0, lettersToShow) });
    }
    setFeedback(hintText);
    speak(hintText, { priority: 'essential' });
  }, [playClickSound, currentWord, hintsUsed, gameOver, isCorrect, isReady, t, speak]);

  const handleResetGameAndStreak = useCallback(() => {
    playClickSound();
    setStreak(0); 
    initializeGame();
    if (isReady) speak(t('arcade.challenge.speak.newGame'), { priority: 'essential' });
  }, [initializeGame, isReady, playClickSound, speak, t]);
  
  // Effect to handle assistant actions
  useEffect(() => {
    if (!lastAssistantAction) return;

    switch (lastAssistantAction.action) {
        case 'arcade_guess':
            if (lastAssistantAction.params?.guess) {
                setGuess(lastAssistantAction.params.guess);
                // Use a timeout to allow state to update before submitting
                setTimeout(() => guessInputRef.current?.form?.requestSubmit(), 100);
            }
            break;
        case 'arcade_hint':
            handleUseHint();
            break;
        case 'arcade_restart':
            handleResetGameAndStreak();
            break;
        default:
            // Not an arcade action, ignore
            return;
    }

    setLastAssistantAction(null); // Consume the action
  }, [lastAssistantAction, setLastAssistantAction, handleUseHint, handleResetGameAndStreak]);

  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentWord && !gameOver) {
    return (
      <div className="flex justify-center items-center h-40">
        <Zap className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">{t('arcade.challenge.loading')}</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-primary">{t('arcade.challenge.title')}</CardTitle>
        <CardDescription>{t('arcade.challenge.description')}</CardDescription>
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{t('arcade.challenge.wordProgress', { current: (currentWordIndex + 1).toString(), total: words.length.toString() })}</span>
          <div className="space-x-3">
            <span>{t('arcade.challenge.streak', { streak: streak.toString() })} <Zap className="inline h-4 w-4 text-yellow-500" /></span>
            <span>{t('arcade.challenge.highScore', { highScore: highScore.toString() })}</span>
          </div>
        </div>
         {!gameOver && currentWord && <p className="text-xs text-muted-foreground">{t('arcade.challenge.attemptsLeft', { attempts: (3 - mistakesMadeThisWord).toString() })}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {gameOver ? (
          <Alert variant="default" className="bg-green-500/10 border-green-500">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle>{t('arcade.challenge.gameOverTitle')}</AlertTitle>
            <AlertDescription>{feedback}</AlertDescription>
          </Alert>
        ) : currentWord ? (
          <>
            <div className="p-4 bg-muted rounded-md min-h-[6rem] flex items-center justify-center">
              <p className="text-md text-center">{currentWord.definition}</p>
            </div>
            {showHint && feedback.startsWith(t('arcade.challenge.hints.hint1Prefix')) && (
              <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Lightbulb className="h-5 w-5 text-primary" />
                <AlertTitle>{t('arcade.challenge.hints.title')}</AlertTitle>
                <AlertDescription>{feedback}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleGuessSubmit} className="space-y-3">
              <div>
                <Label htmlFor="guess">{t('arcade.challenge.yourGuess')}</Label>
                <Input
                  id="guess"
                  ref={guessInputRef}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  disabled={isCorrect === true || gameOver || mistakesMadeThisWord >=3}
                  className={cn(isCorrect === false && mistakesMadeThisWord < 3 ? 'border-destructive focus-visible:ring-destructive' : '')}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCorrect === true || gameOver || mistakesMadeThisWord >=3 || !guess.trim()}>
                {t('arcade.challenge.submitButton')}
              </Button>
            </form>
            {wordFailedMessage && (
                 <Alert variant="destructive">
                    <XCircle className="h-5 w-5" />
                    <AlertTitle>{t('arcade.challenge.wordFailedTitle')}</AlertTitle>
                    <AlertDescription>{wordFailedMessage}</AlertDescription>
                </Alert>
            )}
            {isCorrect === true && (
              <Alert variant="default" className="bg-green-500/10 border-green-500">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle>{t('arcade.challenge.feedback.correct')}</AlertTitle>
              </Alert>
            )}
            {isCorrect === false && feedback && !feedback.startsWith(t('arcade.challenge.hints.hint1Prefix')) && mistakesMadeThisWord < 3 && (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertTitle>{t('arcade.challenge.feedback.incorrect')}</AlertTitle>
                <AlertDescription>{feedback}</AlertDescription>
              </Alert>
            )}
          </>
        ) : null }
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
        <Button 
            variant="outline" 
            onClick={handleUseHint} 
            disabled={hintsUsed >= 3 || isCorrect === true || gameOver || mistakesMadeThisWord >= 3}
            className="w-full sm:w-auto"
        >
          <Lightbulb className="w-4 h-4 mr-2" /> {t('arcade.challenge.useHintButton', { count: (3 - hintsUsed).toString() })}
        </Button>
        <Button onClick={handleResetGameAndStreak} variant="secondary" className="w-full sm:w-auto">
          <RotateCcw className="w-4 h-4 mr-2" /> {t('arcade.challenge.resetButton')}
        </Button>
      </CardFooter>
    </Card>
  );
}
