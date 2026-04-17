

"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculatorDisplay } from '@/components/features/calculator/CalculatorDisplay';
import { CalculatorButton } from '@/components/features/calculator/CalculatorButton';
import type { CalculatorButtonConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useTranslation } from '@/hooks/useTranslation';

const LOCAL_STORAGE_HISTORY_KEY = 'nexithra-calculator-history';

export function ScientificCalculator() {
  const [visualExpression, setVisualExpression] = useState('');
  const [internalExpression, setInternalExpression] = useState('');
  const [previousCalculation, setPreviousCalculation] = useState('');
  
  const [calculationHistory, setCalculationHistory] = useState<{ expression: string, result: string }[]>([]);
  const [isRadians, setIsRadians] = useState(true); 
  const [justEvaluated, setJustEvaluated] = useState(false);

  const { playSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { speak, setVoicePreference } = useTTS();
  const { t, isReady } = useTranslation();
  
  const getCalculatorButtonsConfig = (): CalculatorButtonConfig[] => [
    // Row 1
    { value: 'deg', label: isRadians ? t('calculator.buttons.rad') : t('calculator.buttons.deg'), type: 'action', action: 'toggleMode', className: 'bg-secondary' },
    { value: 'sin(', label: t('calculator.buttons.sin'), type: 'scientific', action: 'sin' },
    { value: 'cos(', label: t('calculator.buttons.cos'), type: 'scientific', action: 'cos' },
    { value: 'tan(', label: t('calculator.buttons.tan'), type: 'scientific', action: 'tan' },
    // Row 2
    { value: '**', label: 'xʸ', type: 'operator' },
    { value: 'log10(', label: t('calculator.buttons.log'), type: 'scientific', action: 'log10' }, 
    { value: 'log(', label: t('calculator.buttons.ln'), type: 'scientific', action: 'log' },
    { value: 'sqrt(', label: '√', type: 'scientific', action: 'sqrt' },
    // Row 3
    { value: 'Math.PI', label: 'π', type: 'digit', action: 'pi' },
    { value: 'Math.E', label: 'e', type: 'digit', action: 'e' }, 
    { value: '(', label: '(', type: 'operator' },
    { value: ')', label: ')', type: 'operator' },
    // Row 4
    { value: '7', label: '7', type: 'digit' }, { value: '8', label: '8', type: 'digit' }, { value: '9', label: '9', type: 'digit' },
    { value: '/', label: '÷', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
    // Row 5
    { value: '4', label: '4', type: 'digit' }, { value: '5', label: '5', type: 'digit' }, { value: '6', label: '6', type: 'digit' },
    { value: '*', label: '×', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
    // Row 6
    { value: '1', label: '1', type: 'digit' }, { value: '2', label: '2', type: 'digit' }, { value: '3', label: '3', type: 'digit' },
    { value: '-', label: '−', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
    // Row 7
    { value: '0', label: '0', type: 'digit' }, { value: '.', label: '.', type: 'decimal' },
    { value: 'AC', label: t('calculator.buttons.ac'), type: 'action', action: 'clear', className: 'bg-destructive/80 hover:bg-destructive text-destructive-foreground' },
    { value: '+', label: '+', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
    // Row 8
    { value: '=', label: '=', type: 'equals', className: 'col-span-4 bg-accent hover:bg-accent/90 text-accent-foreground' },
  ];

  const calculatorButtonsConfig = getCalculatorButtonsConfig();


  useEffect(() => {
    setVoicePreference('gojo');
  }, [setVoicePreference]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        try { setCalculationHistory(JSON.parse(storedHistory)); } 
        catch (e) { console.error("Failed to parse calculator history", e); localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY); }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(calculationHistory));
    }
  }, [calculationHistory]);

  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const evaluateInternalExpression = (expr: string): string => {
    try {
      let exprToEval = expr;
      if (!isRadians) {
        exprToEval = exprToEval.replace(/Math\.sin\(([^)]+)\)/g, (_, p1) => `Math.sin(${toRadians(eval(p1))})`);
        exprToEval = exprToEval.replace(/Math\.cos\(([^)]+)\)/g, (_, p1) => `Math.cos(${toRadians(eval(p1))})`);
        exprToEval = exprToEval.replace(/Math\.tan\(([^)]+)\)/g, (_, p1) => `Math.tan(${toRadians(eval(p1))})`);
      }
      // eslint-disable-next-line no-eval
      let result = eval(exprToEval);
      if (typeof result === 'number' && !Number.isFinite(result)) return t('calculator.error.general');
      if (typeof result === 'number' && result.toString().length > 15) return result.toPrecision(10);
      return String(result);
    } catch (error) { return t('calculator.error.general'); }
  };

  const handleButtonClick = (value: string, type: CalculatorButtonConfig['type'], action?: string) => {
    playSound();
    if (visualExpression.startsWith(t('calculator.error.prefix'))) {
      setVisualExpression(''); setInternalExpression(''); setPreviousCalculation('');
    }
    if (justEvaluated && type !== 'operator' && type !== 'equals') {
        setVisualExpression(''); setInternalExpression(''); 
    }
    setJustEvaluated(false);

    switch (type) {
      case 'digit':
        if (action === 'pi') { setVisualExpression(p => p + 'π'); setInternalExpression(p => p + 'Math.PI'); }
        else if (action === 'e') { setVisualExpression(p => p + 'e'); setInternalExpression(p => p + 'Math.E'); }
        else { setVisualExpression(p => p + value); setInternalExpression(p => p + value); }
        break;
      case 'decimal':
        const segments = internalExpression.split(/[\+\-\*\/\(\)\^\s]/);
        const lastSegment = segments[segments.length - 1];
        if (!lastSegment.includes('.')) { setVisualExpression(p => p + '.'); setInternalExpression(p => p + '.'); }
        break;
      case 'operator':
        const lastChar = internalExpression.trim().slice(-1);
        const isOperator = ['+', '-', '*', '/', '^'].includes(lastChar);
        if (isOperator && value !== '(' && value !== ')') {
             setVisualExpression(p => p.slice(0, -1) + (calculatorButtonsConfig.find(b=>b.value===value)?.label || value) );
             setInternalExpression(p => p.slice(0, -1) + value);
        } else {
            setVisualExpression(p => p + (calculatorButtonsConfig.find(b=>b.value===value)?.label || value));
            setInternalExpression(p => p + value);
        }
        break;
      case 'equals':
        if (internalExpression) {
          const result = evaluateInternalExpression(internalExpression);
          setPreviousCalculation(visualExpression + (result.startsWith(t('calculator.error.prefix')) ? '' : ' ='));
          setVisualExpression(result); 
          setInternalExpression(result.startsWith(t('calculator.error.prefix')) ? '' : result);
          if (!result.startsWith(t('calculator.error.prefix'))) {
             setCalculationHistory(prev => [{expression: visualExpression, result}, ...prev.slice(0,4)]);
             setJustEvaluated(true);
          }
        }
        break;
      case 'action': performAction(action || value); break;
      case 'scientific':
        setVisualExpression(p => p + (calculatorButtonsConfig.find(b=>b.action===action)?.label || action) + '(');
        if (action === 'log10') setInternalExpression(p => p + 'Math.log10(');
        else if (action === 'log') setInternalExpression(p => p + 'Math.log(');
        else if (action === 'sqrt') setInternalExpression(p => p + 'Math.sqrt(');
        else setInternalExpression(p => p + `Math.${action}(`);
        break;
    }
  };

  const performAction = (action: string) => {
    switch (action) {
      case 'clear': setVisualExpression(''); setInternalExpression(''); setPreviousCalculation(''); setJustEvaluated(false); break;
      case 'toggleSign':
        if (visualExpression && !isNaN(parseFloat(visualExpression)) && /^[-\+]?\d*\.?\d+$/.test(visualExpression)) {
            const negated = (parseFloat(visualExpression) * -1).toString();
            setVisualExpression(negated); setInternalExpression(negated);
        }
        break;
      case 'percentage':
        if (visualExpression && !isNaN(parseFloat(visualExpression)) && /^[-\+]?\d*\.?\d+$/.test(visualExpression)) {
            const percentVal = (parseFloat(visualExpression) / 100).toString();
            setVisualExpression(percentVal); setInternalExpression(percentVal);
        }
        break;
      case 'toggleMode': setIsRadians(p => !p); break;
    }
  };
    
  const useHistoryItem = (item: { expression: string, result: string }) => {
    playSound(); 
    setVisualExpression(item.result); 
    setInternalExpression(item.result);
    setPreviousCalculation(`${item.expression} =`);
    setJustEvaluated(true);
  };
  const deleteHistoryItem = (index: number) => { playSound(); setCalculationHistory(p => p.filter((_, i) => i !== index)); };
  const clearAllHistory = () => { playSound(); setCalculationHistory([]); }

  return (
    <Card className="w-full lg:max-w-md mx-auto shadow-lg card-bg-1">
      <CardHeader className="border-b">
        <CardTitle className="text-xl">{t('calculator.scientific.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <CalculatorDisplay 
          mainDisplay={visualExpression} 
          historyDisplay={previousCalculation}
          mode={isRadians ? t('calculator.buttons.rad') : t('calculator.buttons.deg')}
        />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {calculatorButtonsConfig.map(btn => <CalculatorButton key={`${btn.label}-${btn.value}`} config={btn} onClick={handleButtonClick} isModeActive={!isRadians && btn.action === 'toggleMode'} />)}
        </div>
        
        {calculationHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t('calculator.history.title')}</h3>
              <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-xs text-destructive hover:text-destructive/80">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> {t('calculator.history.clear')}
              </Button>
            </div>
            <ul className="space-y-1.5">
              {calculationHistory.map((item, index) => (
                <li key={index} className="flex justify-between items-center p-1.5 border rounded-md bg-muted/40 text-xs hover:bg-muted/60">
                  <button onClick={() => useHistoryItem(item)} className="truncate text-left hover:text-primary flex-1" title={t('calculator.history.use', { expression: item.expression, result: item.result })}>
                    <span className="text-muted-foreground/80">{item.expression} = </span> 
                    <span className="font-semibold">{item.result}</span>
                  </button>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" onClick={() => useHistoryItem(item)} className="h-6 w-6"><RotateCcw className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteHistoryItem(index)} className="h-6 w-6"><Trash2 className="h-3 w-3 text-destructive/70" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    