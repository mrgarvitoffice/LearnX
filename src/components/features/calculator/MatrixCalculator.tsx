
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, AlertTriangle } from 'lucide-react';
import * as math from 'mathjs';

export function MatrixCalculator() {
  const [matrixA, setMatrixA] = useState('[[1, 2], [3, 4]]');
  const [matrixB, setMatrixB] = useState('[[5, 6], [7, 8]]');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const parseMatrix = (input: string) => {
    try {
      // Use math.evaluate to safely parse the matrix string
      return math.evaluate(input.trim());
    } catch (e) {
      return null;
    }
  };

  const performOperation = (op: 'add' | 'multiply' | 'inv' | 'det') => {
    setError('');
    setResult('');
    const A = parseMatrix(matrixA);
    const B = op === 'add' || op === 'multiply' ? parseMatrix(matrixB) : null;

    if (!A) {
      setError('Matrix A is invalid. Please use JSON format, e.g., [[1, 2], [3, 4]]');
      return;
    }
    if ((op === 'add' || op === 'multiply') && !B) {
      setError('Matrix B is invalid. Please use JSON format, e.g., [[1, 2], [3, 4]]');
      return;
    }

    try {
      let opResult;
      switch (op) {
        case 'add': opResult = math.add(A, B); break;
        case 'multiply': opResult = math.multiply(A, B); break;
        case 'inv': opResult = math.inv(A); break;
        case 'det': opResult = math.det(A); break;
      }
      setResult(math.format(opResult, { precision: 4 }));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Card className="w-full shadow-lg card-bg-1">
      <CardHeader>
        <CardTitle>Matrix Operations</CardTitle>
        <CardDescription>Perform matrix calculations. Enter matrices in JSON array format.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea 
            value={matrixA} 
            onChange={(e) => setMatrixA(e.target.value)}
            placeholder="Matrix A, e.g., [[1, 2], [3, 4]]"
            rows={4}
            className="font-mono bg-muted/50"
          />
          <Textarea 
            value={matrixB} 
            onChange={(e) => setMatrixB(e.target.value)}
            placeholder="Matrix B (for Add/Multiply)"
            rows={4}
            className="font-mono bg-muted/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => performOperation('add')}>Add A + B</Button>
          <Button onClick={() => performOperation('multiply')}>Multiply A * B</Button>
          <Button onClick={() => performOperation('inv')}>Inverse of A</Button>
          <Button onClick={() => performOperation('det')}>Determinant of A</Button>
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
                <Bot className="h-4 w-4" />
                <AlertTitle>Result</AlertTitle>
                <AlertDescription>
                    <pre className="whitespace-pre-wrap font-mono text-sm">{result}</pre>
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
