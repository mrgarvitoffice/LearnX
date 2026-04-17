
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Variable, AlertTriangle } from 'lucide-react';
import * as math from 'mathjs';

export function EquationSolver() {
  const [equation, setEquation] = useState('x^2 + 2x + 1 = 0');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const solve = () => {
    setError('');
    setResult('');
    if (!equation.trim()) {
      setError('Please enter a quadratic equation to solve.');
      return;
    }
    
    try {
      // Improved regex to handle various quadratic equation formats
      const simplified = equation.replace(/\s/g, '').replace('x^2', '1x^2').replace('+x', '+1x').replace('-x', '-1x');
      const match = simplified.match(/([+-]?\d*\.?\d*)x\^2([+-]?\d*\.?\d*)x([+-]?\d*\.?\d*)=0/);

      if (!match) {
        throw new Error("Invalid format. Please use the form ax^2+bx+c=0.");
      }
      
      const a = parseFloat(match[1]) || 1;
      const b = parseFloat(match[2]) || 0;
      const c = parseFloat(match[3]) || 0;

      if (isNaN(a) || isNaN(b) || isNaN(c)) {
          throw new Error("Invalid coefficients found in the equation.");
      }
      
      if (a === 0) {
        setError("This is not a quadratic equation (coefficient 'a' cannot be zero).");
        return;
      }
      
      const discriminant = b * b - 4 * a * c;

      if (discriminant > 0) {
        const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        setResult(`${math.format(root1, { precision: 4 })}, ${math.format(root2, { precision: 4 })}`);
      } else if (discriminant === 0) {
        const root = -b / (2 * a);
        setResult(math.format(root, { precision: 4 }));
      } else {
        setResult("No real roots (solution involves complex numbers).");
      }
      
    } catch (e: any) {
      setError(`Could not solve the equation. Please check the syntax. Error: ${e.message}`);
    }
  };

  return (
    <Card className="w-full shadow-lg card-bg-2">
      <CardHeader>
        <CardTitle>Quadratic Equation Solver</CardTitle>
        <CardDescription>
          Enter a quadratic equation in the form <strong>ax²+bx+c=0</strong> to solve for 'x'.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            value={equation} 
            onChange={(e) => setEquation(e.target.value)}
            placeholder="e.g., x^2+2x-3=0"
            className="font-mono bg-muted/50"
            onKeyDown={(e) => e.key === 'Enter' && solve()}
          />
          <Button onClick={solve}>Solve for x</Button>
        </div>
        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {result && (
             <Alert>
                <Variable className="h-4 w-4" />
                <AlertTitle>Solution(s)</AlertTitle>
                <AlertDescription>
                    <p className="font-mono text-lg">x = {result}</p>
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
