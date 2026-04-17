
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitCommit, History, RotateCcw } from 'lucide-react';
import type { CodeFile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Commit {
  id: string;
  message: string;
  timestamp: number;
  files: CodeFile[];
}

interface SourceControlPanelProps {
  files: CodeFile[];
  onRevert: (files: CodeFile[]) => void;
}

const HISTORY_KEY = 'learnx-code-playground-history';

const SourceControlPanel: React.FC<SourceControlPanelProps> = ({ files, onRevert }) => {
  const [history, setHistory] = useState<Commit[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load commit history from localStorage:", error);
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  const saveHistory = (newHistory: Commit[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error("Failed to save commit history to localStorage:", error);
      toast({ title: "Storage Error", description: "Could not save commit history. Your browser storage might be full.", variant: "destructive"});
    }
  };

  const handleCommit = () => {
    if (!commitMessage.trim()) {
      toast({ title: "Commit Message Required", description: "Please enter a short description of your changes.", variant: "destructive"});
      return;
    }

    const newCommit: Commit = {
      id: `commit-${Date.now()}`,
      message: commitMessage,
      timestamp: Date.now(),
      files: JSON.parse(JSON.stringify(files)), // Deep copy of files
    };

    const newHistory = [newCommit, ...history];
    saveHistory(newHistory);
    setCommitMessage('');
    toast({ title: "Changes Committed!", description: `Saved snapshot "${commitMessage}".` });
  };

  const handleRevert = (commitId: string) => {
    const commitToRevert = history.find(c => c.id === commitId);
    if (commitToRevert) {
      if (window.confirm("Reverting will replace your current code with this version. Are you sure?")) {
        onRevert(commitToRevert.files);
        toast({ title: "Reverted!", description: `Workspace restored to version "${commitToRevert.message}".` });
      }
    }
  };

  return (
    <div className="flex flex-col h-full text-sm p-2">
      <div className="p-2 border-b border-gray-900/50 flex-shrink-0">
        <h3 className="font-semibold text-gray-200 mb-2">Commit Changes</h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="e.g., Initial layout"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="w-full bg-[#3c3c3c] border border-gray-600 rounded-md px-2 py-1.5 text-sm placeholder-gray-500 text-gray-200 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleCommit}
          >
            <GitCommit className="h-4 w-4 mr-2" />
            Commit
          </Button>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="font-semibold text-gray-200 p-2">History</h3>
        <ScrollArea className="flex-1 pr-1">
          {history.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No commits yet.</p>
          ) : (
            <div className="space-y-1">
              {history.map(commit => (
                <div key={commit.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700/50 group">
                  <div className="truncate">
                    <p className="font-medium text-gray-300 truncate" title={commit.message}>{commit.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(commit.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRevert(commit.id)}
                    title={`Revert to "${commit.message}"`}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default SourceControlPanel;
