
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Info } from 'lucide-react';
import type { CodeFile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProgression } from '@/contexts/ProgressionContext';

const languageMap: Record<string, { language: string; version: string }> = {
  py: { language: 'python', version: '3.10.0' },
  js: { language: 'javascript', version: '18.15.0' },
  ts: { language: 'typescript', version: '5.0.3' },
  cpp: { language: 'cpp', version: '10.2.0' },
  c: { language: 'c', version: '10.2.0' },
  java: { language: 'java', version: '15.0.2' },
  go: { language: 'go', version: '1.16.2' },
  rs: { language: 'rust', version: '1.68.2' },
  cs: { language: 'csharp', version: '6.12.0' },
  php: { language: 'php', version: '8.2.3' },
};

interface TerminalProps {
  activeFile: CodeFile | undefined;
}

const Terminal: React.FC<TerminalProps> = ({ activeFile }) => {
  const [output, setOutput] = useState(
    'Output Will Appear Here'
  );
  const [stdin, setStdin] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  const { updateQuest } = useProgression();

  const fileExtension = activeFile?.name.split('.').pop() || '';
  const pistonConfig = languageMap[fileExtension];
  const isRunnable = !!pistonConfig;

  const runCode = async () => {
    if (!activeFile || !isRunnable) {
      toast({
        title: 'Unsupported File',
        description: 'This file type cannot be run in the terminal. Use the Live Preview for HTML/CSS.',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setOutput('⏳ Running...');

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonConfig.language,
          version: pistonConfig.version,
          files: [{ name: activeFile.name, content: activeFile.content }],
          stdin: stdin,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      let finalOutput = '';
      if (result.run.stdout) finalOutput += result.run.stdout;
      if (result.run.stderr) finalOutput += `\n❌ Error:\n${result.run.stderr}`;

      const success = result.run.code === 0;
      if (success) {
          updateQuest('codeRuns'); // Track successful code run
      }

      setOutput(finalOutput.trim() || '✅ Code ran successfully with no output.');
    } catch (error: any) {
      setOutput(`❌ Network or API Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      <div className="flex-shrink-0 bg-[#252526] p-2 flex items-center justify-between border-b border-gray-900/50">
        <p className="text-sm text-gray-400" aria-live="polite">
          Runnable:{' '}
          <span className="font-semibold text-gray-200">
            {isRunnable ? `${activeFile?.name} (v${pistonConfig.version})` : 'None (Use Preview)'}
          </span>
        </p>
        <Button
          size="sm"
          onClick={runCode}
          disabled={isRunning || !isRunnable}
          className="bg-green-600 hover:bg-green-700 text-white h-8"
          aria-label="Run code"
        >
          {isRunning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Run Code
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 bg-black">
            <pre className="p-3 font-mono text-sm text-white whitespace-pre-wrap break-words min-h-full">
              {output}
            </pre>
          </ScrollArea>
          
          <div className="flex-shrink-0 p-3 bg-black border-t border-gray-900/50 h-32 flex flex-col">
            <label htmlFor="terminal-stdin" className="text-xs font-semibold text-gray-400 mb-1">
              Standard Input (stdin)
            </label>
            <Textarea
              id="terminal-stdin"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input for your program here..."
              aria-label="Code standard input"
              className="w-full flex-1 bg-[#1a1a1a] text-white font-mono text-sm resize-none border border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>
      </div>

      {!isRunnable && activeFile && (
        <Alert
          variant="default"
          className="m-2 bg-blue-900/40 border-blue-500/50 text-blue-300 flex-shrink-0"
          role="alert"
        >
          <Info className="h-4 w-4 text-blue-400" aria-hidden="true" />
          <AlertTitle>Frontend File Detected</AlertTitle>
          <AlertDescription>
            .{fileExtension} files are for the browser. View your changes in the "Live Preview"
            pane above. The "Run Code" button is for backend languages like Python.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Terminal;
