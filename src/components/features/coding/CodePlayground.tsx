
"use client";

import React from 'react';
import Editor, { type OnChange, type OnMount, type Monaco } from "@monaco-editor/react";
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import type { editor } from 'monaco-editor';

interface CodePlaygroundProps {
  language?: string;
  value?: string;
  onChange?: OnChange;
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
  theme?: 'vs-dark' | 'light';
}

const CodePlayground: React.FC<CodePlaygroundProps> = ({
  language = "javascript",
  value = "",
  onChange,
  onMount,
  theme,
}) => {
  const { theme: appTheme } = useTheme();
  
  const editorTheme = theme || (appTheme === 'dark' ? 'vs-dark' : 'light');

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      onMount={onMount}
      theme={editorTheme}
      loading={<div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]"><Loader2 className="h-8 w-8 animate-spin text-blue-400"/></div>}
      options={{
        fontSize: 14,
        minimap: { enabled: true },
        contextmenu: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        padding: {
          top: 15,
          bottom: 15,
        }
      }}
    />
  );
};

export default CodePlayground;
