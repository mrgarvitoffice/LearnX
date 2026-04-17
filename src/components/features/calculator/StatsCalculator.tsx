
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sigma, AlertTriangle } from 'lucide-react';
import * as math from 'mathjs';

export function StatsCalculator() {
  const [data, setData] = useState('1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    setError('');
    setResult(null);
    if (!data.trim()) {
      setError('Please enter a data set.');
      return;
    }
    
    try {
      const dataArray = data.split(',').map(s => {
          const num = parseFloat(s.trim());
          if (isNaN(num)) throw new Error(`'${s.trim()}' is not a valid number.`);
          return num;
      });

      if (dataArray.length < 2) {
          setError('Please enter at least two data points.');
          return;
      }

      const mean = math.mean(dataArray);
      const std = math.std(dataArray);
      const variance = math.variance(dataArray);
      
      const statsResult = [
          `Count (n): ${dataArray.length}`,
          `Mean (μ): ${math.format(mean, { precision: 4 })}`,
          `Standard Deviation (σ): ${math.format(std, { precision: 4 })}`,
          `Variance (σ²): ${math.format(variance, { precision: 4 })}`
      ].join('\n');

      setResult(statsResult);

    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Card className="w-full shadow-lg card-bg-1">
      <CardHeader>
        <CardTitle>Statistical Functions</CardTitle>
        <CardDescription>Enter comma-separated numbers to calculate statistical properties.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            value={data} 
            onChange={(e) => setData(e.target.value)}
            placeholder="e.g., 1, 2, 3, 4, 5"
            className="font-mono bg-muted/50"
            onKeyDown={(e) => e.key === 'Enter' && calculate()}
          />
          <Button onClick={calculate}>Calculate</Button>
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
                <Sigma className="h-4 w-4" />
                <AlertTitle>Results</AlertTitle>
                <AlertDescription>
                    <pre className="whitespace-pre-wrap font-mono text-sm">{result}</pre>
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
