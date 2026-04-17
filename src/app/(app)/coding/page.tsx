
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Bot, Files, Search, Play, User, X, Github, MessageSquare, ChevronLeft, Eye, EyeOff, ExternalLink, Share2, GitMerge, Terminal as TerminalIcon, GripHorizontal, Settings, FileDown, FolderPlus, Save, Trash2, FilePlus, Keyboard, Palette, ChevronsUpDown, Code2, Edit, Code, Minus
} from 'lucide-react';
import FileExplorer from '@/components/features/coding/FileExplorer';
import SourceControlPanel from '@/components/features/coding/SourceControlPanel';
import ExtensionsPanel from '@/components/features/coding/ExtensionsPanel';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { editor } from 'monaco-editor';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { processPrototyperCommand, type PrototyperOutput } from '@/ai/flows/prototyper-flow';
import type { ChatMessage as ChatMessageType, CodeFile, ProjectSlot, FileOperation } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APP_LANGUAGES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import SettingsMenuContent from '@/components/layout/SettingsMenuContent';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import InteractiveCharacterElement from '@/components/features/InteractiveCharacterElement';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/icons/Logo';
import { useAssistant } from '@/contexts/AssistantContext';


const CodePlayground = dynamic(() => import('@/components/features/coding/CodePlayground'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]"><Bot className="h-8 w-8 animate-spin text-blue-400"/></div>,
});
const Terminal = dynamic(() => import('@/components/features/coding/Terminal'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-black text-gray-400">Loading Terminal...</div>,
});


type CodingAssistant = 'coder' | 'jarvis';
type PreviewMode = 'live' | 'on-run';

const TYPING_INDICATOR_ID = 'typing-indicator';
const PROJECT_SLOTS_KEY = 'learnmint-playground-slots';
const MAX_PROJECT_SLOTS = 5;


const INITIAL_FILES: CodeFile[] = [
  { name: 'index.html', language: 'html', content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello LearnMint</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello, Coder!</h1>\n  <p>Your HTML, CSS, and JS will render here live.</p>\n  <button id="alertButton">Click Me</button>\n  <script src="script.js"></script>\n</body>\n</html>` },
  { name: 'style.css', language: 'css', content: `body {\n  font-family: sans-serif;\n  background-color: #f0f0f0;\n  color: #333;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  text-align: center;\n}` },
  { name: 'script.js', language: 'javascript', content: `// This is a client-side script that runs in the browser preview.\n// It can interact with the DOM.\n\ndocument.addEventListener('DOMContentLoaded', () => {\n  const button = document.getElementById('alertButton');\n  if (button) {\n    button.addEventListener('click', () => {\n      alert('Hello from your script!');\n    });\n  }\n});\n\nconsole.log("Client-side script loaded.");` }
];

const compress = (str: string) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
const decompress = (str: string) => decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));


export default function CodingPage() {
  const [files, setFiles] = useState<CodeFile[]>(INITIAL_FILES);
  const [activeFileName, setActiveFileName] = useState('index.html');
  const [activeAi, setActiveAi] = useState<CodingAssistant>('coder');
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const { appLanguage } = useSettings();
  const { user } = useAuth();
  
  const [activeSideTab, setActiveSideTab] = useState('explorer'); 
  const [sidePanelWidth, setSidePanelWidth] = useState(350);
  const [isSideResizing, setIsSideResizing] = useState(false);

  const [previewSrcDoc, setPreviewSrcDoc] = useState('');
  const [runTrigger, setRunTrigger] = useState(0);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('live');

  const [activeBottomTab, setActiveBottomTab] = useState('editor');
  
  const [isVerticalResizing, setIsVerticalResizing] = useState(false);
  const [topPaneHeight, setTopPaneHeight] = useState(50); 
  
  const [isExplorerResizing, setIsExplorerResizing] = useState(false);
  const [explorerHeight, setExplorerHeight] = useState(40); 


  const [projectSlots, setProjectSlots] = useState<ProjectSlot[]>([]);
  
  const { toggleTerminal } = useAssistant();


  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeFile = files.find(f => f.name === activeFileName);

  const getPreviewContent = useCallback(() => {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    let htmlContent = htmlFile ? htmlFile.content : '<body></body>';

    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    let cssToInject = '';
    cssFiles.forEach(f => {
       cssToInject += `\n<style>\n/* --- Injected from ${f.name} --- */\n${f.content}\n</style>`;
    });

    if (cssToInject) {
      const headTagEnd = htmlContent.indexOf('</head>');
      if (headTagEnd !== -1) {
        htmlContent = `${htmlContent.slice(0, headTagEnd)}${cssToInject}${htmlContent.slice(headTagEnd)}`;
      } else {
        htmlContent = `<head>${cssToInject}</head>${htmlContent}`;
      }
    }

    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    const jsContent = jsFiles.map(f => `
      // --- Executing ${f.name} ---
      try {
        ${f.content}
      } catch (err) {
        console.error('Error in ${f.name}:', err);
      }
    `).join('\n');
    
    if (jsContent) {
       const bodyTagEnd = htmlContent.indexOf('</body>');
       if (bodyTagEnd !== -1) {
          htmlContent = `${htmlContent.slice(0, bodyTagEnd)}<script type="module">${jsContent}</script>${htmlContent.slice(bodyTagEnd)}`;
       } else {
          htmlContent += `<script type="module">${jsContent}</script>`;
       }
    }
    
    return `
      <!DOCTYPE html>
      <html>
        ${htmlContent}
      </html>
    `;
  }, [files]);
  
  useEffect(() => {
    if (previewMode === 'live') {
      const timeout = setTimeout(() => {
        setPreviewSrcDoc(getPreviewContent());
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [files, previewMode, getPreviewContent]);

  useEffect(() => {
    if (previewMode === 'on-run' && runTrigger > 0) {
      setPreviewSrcDoc(getPreviewContent());
    }
  }, [runTrigger]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        const trigger = document.getElementById('terminal-dialog-trigger');
        trigger?.click();
      }
       if (e.ctrlKey && e.key === 'p') {
          e.preventDefault();
          const trigger = document.getElementById('command-palette-trigger');
          trigger?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileName]);

  useEffect(() => {
    const filesParam = searchParams.get('files');
    if (filesParam) {
      try {
        const decoded = decompress(filesParam);
        const loadedFiles = JSON.parse(decoded);
        if (Array.isArray(loadedFiles) && loadedFiles.length > 0) {
          setFiles(loadedFiles);
          setActiveFileName(loadedFiles[0].name);
        }
      } catch (e) {
        console.error("Failed to load project from URL:", e);
        setFiles(INITIAL_FILES);
      }
    } else {
      setFiles(INITIAL_FILES);
    }

     try {
      const savedSlots = localStorage.getItem(PROJECT_SLOTS_KEY);
      if (savedSlots) setProjectSlots(JSON.parse(savedSlots));
    } catch (e) {
      console.error("Failed to load project slots:", e);
    }
  }, []); 
  
  useEffect(() => {
    const initialMessages: Record<CodingAssistant, string> = {
        coder: "Coder AI initialized. I can write files, explain code, and help you build. How can I assist?",
        jarvis: "J.A.R.V.I.S. online. All systems are operational. How can I assist with your project?"
    };

    setMessages([{
      id: `${activeAi}-initial-greeting`,
      role: 'assistant',
      content: initialMessages[activeAi],
      timestamp: new Date()
    }]);
  }, [activeAi]);
  
  const handleStartSideResize = (e: React.MouseEvent) => { e.preventDefault(); setIsSideResizing(true); };
  const handleSideResize = useCallback((e: MouseEvent) => {
    if (isSideResizing) {
      const newWidth = e.clientX - 48; 
      if (newWidth > 250 && newWidth < 600) setSidePanelWidth(newWidth);
    }
  }, [isSideResizing]);
  const handleStopSideResize = useCallback(() => { setIsSideResizing(false); }, []);
  
  const handleStartVerticalResize = (e: React.MouseEvent) => { e.preventDefault(); setIsVerticalResizing(true); };
  const handleVerticalResize = useCallback((e: MouseEvent) => {
    if (isVerticalResizing) {
      const mainContentElement = document.getElementById('main-content-area');
      if (mainContentElement) {
        const rect = mainContentElement.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        if (newHeight > 10 && newHeight < 90) setTopPaneHeight(newHeight);
      }
    }
  }, [isVerticalResizing]);
  const handleStopVerticalResize = useCallback(() => { setIsVerticalResizing(false); }, []);

  const handleStartExplorerResize = (e: React.MouseEvent) => { e.preventDefault(); setIsExplorerResizing(true); };
  const handleExplorerResize = useCallback((e: MouseEvent) => {
    if (isExplorerResizing) {
      const explorerPanel = document.getElementById('explorer-panel');
      if (explorerPanel && explorerPanel.parentElement) {
        const parentRect = explorerPanel.parentElement.getBoundingClientRect();
        const newHeight = ((e.clientY - parentRect.top) / parentRect.height) * 100;
        if (newHeight > 15 && newHeight < 85) setExplorerHeight(newHeight);
      }
    }
  }, [isExplorerResizing]);
  const handleStopExplorerResize = useCallback(() => { setIsExplorerResizing(false); }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleSideResize);
    window.addEventListener('mouseup', handleStopSideResize);
    window.addEventListener('mousemove', handleVerticalResize);
    window.addEventListener('mouseup', handleStopVerticalResize);
    window.addEventListener('mousemove', handleStartExplorerResize);
    window.addEventListener('mouseup', handleStopExplorerResize);
    window.addEventListener('mouseleave', () => { handleStopSideResize(); handleStopExplorerResize(); });
    return () => {
      window.removeEventListener('mousemove', handleSideResize);
      window.removeEventListener('mouseup', handleStopSideResize);
      window.removeEventListener('mousemove', handleVerticalResize);
      window.removeEventListener('mouseup', handleStopVerticalResize);
      window.removeEventListener('mousemove', handleStartExplorerResize);
      window.removeEventListener('mouseup', handleStopExplorerResize);
      window.removeEventListener('mouseleave', () => { handleStopSideResize(); handleStopExplorerResize(); });
    };
  }, [handleSideResize, handleStopSideResize, handleVerticalResize, handleStopVerticalResize, handleStartExplorerResize, handleStopExplorerResize]);

  const handleSelectFile = (fileName: string) => { setActiveFileName(fileName); setActiveBottomTab('editor'); };
  
  const handleCodeChange = useCallback((newCode: string | undefined) => {
    setFiles(prevFiles => {
      return prevFiles.map(file => 
        file.name === activeFileName ? { ...file, content: newCode || "" } : file
      );
    });
  }, [activeFileName]);

  const handleSendMessage = useCallback(async (messageText: string) => {
     if (!messageText.trim()) return;

    const userMessage: ChatMessageType = { 
      id: Date.now().toString() + '-user', role: 'user', content: messageText, timestamp: new Date() 
    };
    
    const typingMessages: Record<CodingAssistant, string> = { coder: 'Coder AI is building...', jarvis: 'J.A.R.V.I.S. is processing...' };
    const typingIndicator: ChatMessageType = { id: TYPING_INDICATOR_ID, role: 'assistant', content: typingMessages[activeAi], timestamp: new Date(), type: 'typing_indicator' };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsAiResponding(true);

    try {
      const languageLabel = APP_LANGUAGES.find(l => l.value === appLanguage)?.label || 'English';
      
      const response: PrototyperOutput = await processPrototyperCommand({
        command: messageText, persona: activeAi, language: languageLabel, currentFiles: files,
      });

      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));

      if (response.fileOperations && response.fileOperations.length > 0) {
        setFiles(prevFiles => {
          let newFiles = [...prevFiles];
          let didUpdateActiveFile = false;
          response.fileOperations?.forEach((op: FileOperation) => {
            const lang = op.fileName.split('.').pop() || 'plaintext';
            if (op.operation === 'create') {
              if(!newFiles.some(f => f.name === op.fileName)) {
                newFiles.push({ name: op.fileName, content: op.content || '', language: lang });
              } else {
                newFiles = newFiles.map(f => f.name === op.fileName ? { ...f, content: op.content || '' } : f);
              }
              setActiveFileName(op.fileName);
              didUpdateActiveFile = true;
            } else if (op.operation === 'update') {
              const idx = newFiles.findIndex(f => f.name === op.fileName);
              if (idx > -1) newFiles[idx] = { ...newFiles[idx], content: op.content || '' };
              else newFiles.push({ name: op.fileName, content: op.content || '', language: lang });
              if (!didUpdateActiveFile) setActiveFileName(op.fileName);
            } else if (op.operation === 'delete') {
              newFiles = newFiles.filter(f => f.name !== op.fileName);
              if (activeFileName === op.fileName && !didUpdateActiveFile) {
                 setActiveFileName(newFiles.length > 0 ? newFiles[0].name : '');
              }
            }
          });
          return newFiles;
        });
      }

      const assistantMessage: ChatMessageType = { 
        id: Date.now().toString() + '-assistant', role: 'assistant', content: response.verbalResponse, timestamp: new Date(), fileOperations: response.fileOperations
      };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
       let errorMessage = "An unexpected error occurred.";
       if (error.message) errorMessage = `Failed to process command: ${error.message}`;
      toast({ title: "Prototyper AI Error", description: errorMessage, variant: "destructive" });
      const errorMessageBubble: ChatMessageType = { id: Date.now().toString() + '-error', role: 'system', content: `Error: ${errorMessage}`, timestamp: new Date() };
      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, errorMessageBubble]);
    } finally {
      setIsAiResponding(false);
    }
  }, [appLanguage, toast, files, activeFileName, activeAi]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleAddNewFile = useCallback(() => {
    const newFileName = prompt("Enter new file name (e.g., 'app.py', 'README.md'):");
    if (newFileName && newFileName.trim()) {
      const trimmedName = newFileName.trim();
      if (files.some(f => f.name === trimmedName)) {
        toast({ title: "File Exists", description: "A file with that name already exists.", variant: "destructive" });
        return;
      }
      const language = trimmedName.split('.').pop() || 'plaintext';
      const newFile: CodeFile = { name: trimmedName, language, content: `// ${trimmedName} created\n` };
      setFiles(prev => [...prev, newFile]);
      setActiveFileName(newFile.name);
      setActiveSideTab('explorer');
    }
  }, [files, toast]);

  const handleDeleteFile = useCallback((fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) {
      setFiles(prev => {
        const newFiles = prev.filter(f => f.name !== fileName);
        if (activeFileName === fileName) {
          setActiveFileName(newFiles.length > 0 ? newFiles[0].name : '');
        }
        return newFiles;
      });
      toast({ title: "File Deleted", description: `"${fileName}" has been deleted.` });
    }
  }, [activeFileName, toast]);
  
  const handleRenameFile = useCallback((oldName: string) => {
    const newName = prompt(`Enter new name for "${oldName}":`, oldName);
    if (newName && newName.trim() && newName !== oldName) {
      const trimmedName = newName.trim();
      if (files.some(f => f.name === trimmedName)) {
        toast({ title: "File Exists", description: "A file with that name already exists.", variant: "destructive" });
        return;
      }
      setFiles(prev => prev.map(f => {
        if (f.name === oldName) {
          return { ...f, name: trimmedName, language: trimmedName.split('.').pop() || 'plaintext' };
        }
        return f;
      }));
      if (activeFileName === oldName) {
        setActiveFileName(trimmedName);
      }
      toast({ title: "File Renamed", description: `"${oldName}" was renamed to "${trimmedName}".` });
    }
  }, [files, activeFileName, toast]);
  
  const handleOpenInNewTab = () => {
    const previewContent = getPreviewContent();
    const blob = new Blob([previewContent], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const data = JSON.stringify(files);
    const compressed = compress(data);
    const url = `${window.location.origin}${window.location.pathname}?files=${compressed}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Public Link Copied!", description: "A shareable link to your project has been copied." });
  };
  
  const handleToggleSidePanel = (panel: 'explorer' | 'source-control' | 'extensions') => {
    if (activeSideTab === panel) setActiveSideTab('');
    else setActiveSideTab(panel);
  };
  
  const handleAddLibrary = useCallback((libraryUrl: string, libraryName: string) => {
    setFiles(prevFiles => {
      const htmlIndex = prevFiles.findIndex(f => f.name.endsWith('.html'));
      if (htmlIndex === -1) {
        toast({ title: "No HTML file found", description: "Cannot add library without an HTML file.", variant: "destructive" });
        return prevFiles;
      }
      let newFiles = [...prevFiles];
      let htmlFile = { ...newFiles[htmlIndex] };
      const urls = libraryUrl.split('\n');
      let added = false;
      urls.forEach(url => {
        if (!htmlFile.content.includes(url)) {
          if (url.endsWith('.css')) {
            htmlFile.content = htmlFile.content.replace('</head>', `  <link rel="stylesheet" href="${url}">\n</head>`);
          } else {
            htmlFile.content = htmlFile.content.replace('</body>', `  <script src="${url}"></script>\n</body>`);
          }
          added = true;
        }
      });
      if (!added) {
        toast({ title: "Library already exists" });
        return newFiles;
      }
      newFiles[htmlIndex] = htmlFile;
      toast({ title: "Library Added!", description: `${libraryName} added to your project.` });
      return newFiles;
    });
  }, [toast]);


  const handleDownloadProject = async () => {
    const zip = new JSZip();
    files.forEach(file => { zip.file(file.name, file.content); });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "learnmint-project.zip");
    toast({ title: "Project Downloading", description: "Your project is being saved as a .zip file." });
  };

  const handleNewProject = () => {
    if(window.confirm("Are you sure you want to start a new project? Any unsaved changes will be lost.")) {
      setFiles(INITIAL_FILES);
      setActiveFileName('index.html');
      toast({ title: "New Project Started", description: "Playground has been reset." });
    }
  };

  const handleSaveToSlot = (slotId: number) => {
    const name = prompt("Enter a name for this project save:", `Project ${slotId}`);
    if (!name) return;
    const newSlot: ProjectSlot = { id: slotId, name, timestamp: Date.now(), files: JSON.parse(JSON.stringify(files)) };
    const newSlots = [...projectSlots.filter(s => s.id !== slotId), newSlot].sort((a,b) => a.id - b.id);
    setProjectSlots(newSlots);
    localStorage.setItem(PROJECT_SLOTS_KEY, JSON.stringify(newSlots));
    toast({ title: "Project Saved", description: `Saved to slot ${slotId} as "${name}".` });
  };
  
  const handleLoadFromSlot = (slotId: number) => {
    const slotToLoad = projectSlots.find(s => s.id === slotId);
    if (slotToLoad && window.confirm(`Load "${slotToLoad.name}"? This will overwrite your current workspace.`)) {
      setFiles(slotToLoad.files);
      setActiveFileName(slotToLoad.files[0]?.name || 'index.html');
      toast({ title: "Project Loaded", description: `Restored project "${slotToLoad.name}".` });
    }
  };

  const handleDeleteSlot = (slotId: number) => {
      if (window.confirm("Are you sure you want to delete this saved project?")) {
        const newSlots = projectSlots.filter(s => s.id !== slotId);
        setProjectSlots(newSlots);
        localStorage.setItem(PROJECT_SLOTS_KEY, JSON.stringify(newSlots));
        toast({ title: "Project Slot Deleted", variant: "destructive" });
      }
  };


  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || "User";
  const isAnySidePanelOpen = !!activeSideTab;

  const ShortcutsDialogContent = () => (
    <DialogContent className="sm:max-w-xl lg:max-w-2xl bg-[#252526] border-gray-700 text-gray-300">
      <DialogHeader>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <DialogDescription>Boost your productivity with these shortcuts.</DialogDescription>
      </DialogHeader>
      <div className="text-sm lg:text-base space-y-2 py-4">
        <div className="flex justify-between p-1.5 rounded-md hover:bg-gray-700/50"><span>Open Command Palette</span><kbd className="px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-900 border border-gray-700 rounded-md">Ctrl + P</kbd></div>
        <div className="flex justify-between p-1.5 rounded-md hover:bg-gray-700/50"><span>Toggle Side Terminal</span><kbd className="px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-900 border border-gray-700 rounded-md">Ctrl + Q</kbd></div>
        <div className="flex justify-between p-1.5 rounded-md hover:bg-gray-700/50"><span>Find in Editor</span><kbd className="px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-900 border border-gray-700 rounded-md">Ctrl + F</kbd></div>
      </div>
    </DialogContent>
  );

   const CommandPaletteDialogContent = () => (
    <DialogContent className="sm:max-w-xl lg:max-w-2xl bg-[#252526] border-gray-700 text-gray-300">
      <DialogHeader>
        <DialogTitle>Command Palette</DialogTitle>
      </DialogHeader>
      <div className="text-sm lg:text-base space-y-2 py-4">
        <p className="text-gray-400 mb-4">Run commands directly. More will be added soon.</p>
        <Button onClick={() => { handleAddNewFile(); (document.querySelector('[aria-label="Close"]') as HTMLElement)?.click(); }} variant="outline" className="w-full justify-start gap-2"> <FilePlus className="h-4 w-4"/> Create New File </Button>
        <Button onClick={() => { handleDownloadProject(); (document.querySelector('[aria-label="Close"]') as HTMLElement)?.click(); }} variant="outline" className="w-full justify-start gap-2"> <FileDown className="h-4 w-4"/> Download Project as .zip </Button>
        <Button onClick={() => { setPreviewMode('on-run'); setRunTrigger(t => t + 1); (document.querySelector('[aria-label="Close"]') as HTMLElement)?.click(); }} variant="outline" className="w-full justify-start gap-2"> <Play className="h-4 w-4"/> Run Preview </Button>
      </div>
    </DialogContent>
  );
  
  const AiSwitcher = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex items-center gap-1">
      <InteractiveCharacterElement
        characterName="Coder AI"
        Icon={Code2}
        imageUrl="/images/Coder.jpg"
        className={cn("ring-2 ring-transparent", mobile ? "h-6 w-6" : "h-6 w-6", activeAi === 'coder' && 'ring-blue-500')}
        containerClassName="cursor-pointer"
        onClick={() => setActiveAi('coder')}
      />
      <InteractiveCharacterElement
        characterName="J.A.R.V.I.S."
        imageUrl="/images/Jarvis.jpg"
        className={cn("ring-2 ring-transparent", mobile ? "h-6 w-6" : "h-6 w-6", activeAi === 'jarvis' && 'ring-primary')}
        containerClassName="cursor-pointer"
        onClick={() => setActiveAi('jarvis')}
      />
    </div>
  );

  const SidePanelContent = () => {
    switch (activeSideTab) {
      case 'explorer':
        return (
          <div className="flex-1 mt-0 flex flex-col min-h-0">
            <div id="explorer-panel" style={{ height: `${explorerHeight}%` }} className="flex flex-col min-h-0">
              <FileExplorer files={files.map(f => f.name)} activeFile={activeFileName} onSelectFile={handleSelectFile} onRenameFile={handleRenameFile} onDeleteFile={handleDeleteFile}>
                  <Button onClick={handleAddNewFile} variant="outline" className="w-[calc(100%-1rem)] mx-2 my-2 justify-start gap-2 h-8"><FilePlus className="h-4 w-4"/>Create New File</Button>
              </FileExplorer>
            </div>
            <div onMouseDown={handleStartExplorerResize} className="w-full h-1.5 cursor-row-resize bg-gray-900/50 hover:bg-primary/50 transition-colors flex-shrink-0" />
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-gray-900/50 flex-shrink-0">
                    <h3 className="text-xs font-semibold text-gray-200 flex items-center gap-2">PROTOTYPER</h3>
                    <AiSwitcher />
                </div>
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-2 space-y-4">
                        {messages.map((msg) => <ChatMessage key={msg.id} message={msg} character={activeAi} onFileSelect={handleSelectFile}/>)}
                    </div>
                </ScrollArea>
                <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} character={activeAi} />
            </div>
          </div>
        );
      case 'source-control':
        return <ScrollArea className="h-full"><SourceControlPanel files={files} onRevert={setFiles} /></ScrollArea>;
      case 'extensions':
        return <ScrollArea className="h-full"><ExtensionsPanel onAddLibrary={handleAddLibrary} /></ScrollArea>;
      default:
        return null;
    }
  }


  // MOBILE UI
  if (isMobile) {
    return (
      <div className="flex h-screen w-full bg-transparent text-gray-300 font-sans flex-col relative">
          <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-10">
            <source src="/icons/v4.mp4" type="video/mp4" />
          </video>
          <div id="main-content-area" className="flex-1 flex flex-col overflow-hidden">
              <div style={{ height: `${topPaneHeight}%` }} className="flex flex-col border-b-2 border-transparent">
                  <div className="h-8 bg-[#333333] flex-shrink-0 flex items-center justify-between px-2 border-b border-gray-900/50">
                      <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'live' | 'on-run')} className="w-auto">
                          <TabsList className="bg-transparent rounded-none p-0 h-full">
                              <TabsTrigger value="live" className="h-full rounded-none text-xs px-3 data-[state=active]:bg-[#1e1e1e] data-[state=active]:shadow-none flex items-center gap-1.5 text-green-400"><Eye className="h-3.5 w-3.5"/> Live</TabsTrigger>
                              <TabsTrigger value="on-run" className="h-full rounded-none text-xs px-3 data-[state=active]:bg-[#1e1e1e] data-[state=active]:shadow-none flex items-center gap-1.5 text-yellow-400"><EyeOff className="h-3.5 w-3.5"/> On Run</TabsTrigger>
                              <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" title="Run Preview" onClick={() => setRunTrigger(t => t + 1)}><Play className="h-4 w-4" /></Button>
                          </TabsList>
                      </Tabs>
                      <div className='flex items-center gap-2'>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Open in new tab" onClick={handleOpenInNewTab}><ExternalLink className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Make Preview Public & Copy URL" onClick={handleShare}><Share2 className="h-4 w-4" /></Button>
                      </div>
                  </div>
                  <iframe srcDoc={previewSrcDoc} title="Live Preview" sandbox="allow-scripts allow-modals allow-same-origin allow-popups" className="w-full h-full border-0 bg-white" />
              </div>

              <div onMouseDown={handleStartVerticalResize} className="w-full h-1.5 cursor-row-resize bg-gray-900/50 hover:bg-primary/50 transition-colors flex items-center justify-center"><ChevronsUpDown className="h-3 w-5 text-gray-600"/></div>
              
               <div style={{ height: `${100 - topPaneHeight}%` }} className="flex flex-col min-h-0">
                  <Tabs value={activeBottomTab} onValueChange={setActiveBottomTab} className="w-full flex-1 flex flex-col">
                      <TabsList className="bg-[#252526] rounded-none justify-start px-2 h-8 border-t border-gray-900/50">
                        <TabsTrigger value="editor" className="h-full rounded-none text-xs px-3 data-[state=active]:bg-[#1e1e1e] data-[state=active]:shadow-none flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5 text-blue-400"/> {activeFile?.name || 'Editor'}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="editor" className="flex-1 mt-0">
                          <CodePlayground key={activeFile?.name} language={activeFile?.language || 'plaintext'} value={activeFile?.content || ''} onChange={handleCodeChange} theme={'vs-dark'} onMount={(editor) => { editorRef.current = editor; }} />
                      </TabsContent>
                  </Tabs>
              </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg z-50 bg-primary/80 backdrop-blur-md hover:bg-primary">
                <Logo size={32} />
              </Button>
            </DialogTrigger>
            <DialogContent className="h-[80vh] p-0 bg-[#252526] border-t-gray-700 flex flex-col">
                <ScrollArea className="flex-1">
                    <Tabs defaultValue="prototyper" className="flex-1 flex flex-col min-h-0">
                       <DialogHeader className="p-2 border-b border-gray-800">
                        <DialogTitle className="sr-only">Coding Playground Controls</DialogTitle>
                        <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0">
                          <TabsTrigger value="prototyper" className="flex-col gap-1 h-auto p-2"><Bot className="h-5 w-5"/><span className="text-xs">AI</span></TabsTrigger>
                          <TabsTrigger value="files" className="flex-col gap-1 h-auto p-2"><Files className="h-5 w-5"/><span className="text-xs">Files</span></TabsTrigger>
                          <TabsTrigger value="source-control" className="flex-col gap-1 h-auto p-2"><GitMerge className="h-5 w-5"/><span className="text-xs">Source</span></TabsTrigger>
                          <TabsTrigger value="extensions" className="flex-col gap-1 h-auto p-2"><Code2 className="h-5 w-5"/><span className="text-xs">Libs</span></TabsTrigger>
                          <Dialog>
                            <DialogTrigger asChild>
                                <button className="flex-col gap-1 h-auto p-2 flex items-center justify-center text-xs text-muted-foreground data-[state=active]:text-foreground"><TerminalIcon className="h-5 w-5"/><span className="text-xs">Terminal</span></button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[90vw] w-[90vw] h-[70vh] p-0 border-gray-700 bg-[#1e1e1e] flex flex-col">
                                <DialogHeader className="p-2 border-b border-gray-800 flex-row items-center justify-between">
                                    <DialogTitle className="text-gray-200 flex items-center gap-2 text-base">
                                        <TerminalIcon className="h-4 w-4" /> Terminal
                                    </DialogTitle>
                                    <div className="flex items-center gap-1">
                                        <DialogClose asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Minimize">
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                        </DialogClose>
                                        <DialogClose className="text-gray-400 hover:text-white h-7 w-7 flex items-center justify-center" />
                                    </div>
                                </DialogHeader>
                                <Terminal activeFile={activeFile} />
                            </DialogContent>
                          </Dialog>
                          <TabsTrigger value="profile" className="flex-col gap-1 h-auto p-2"><User className="h-5 w-5"/><span className="text-xs">Profile</span></TabsTrigger>
                          <TabsTrigger value="settings" className="flex-col gap-1 h-auto p-2"><Settings className="h-5 w-5"/><span className="text-xs">Settings</span></TabsTrigger>
                        </TabsList>
                      </DialogHeader>
                      <TabsContent value="prototyper" className="flex-1 flex flex-col min-h-0 mt-0">
                         <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-gray-800">
                            <h3 className="text-xs font-semibold text-gray-200 flex items-center gap-2">
                                PROTOTYPER
                            </h3>
                             <AiSwitcher mobile />
                         </div>
                         <ScrollArea className="flex-1" ref={scrollAreaRef}>
                            <div className="p-2 space-y-4">
                            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} character={activeAi} onFileSelect={handleSelectFile} />)}
                            </div>
                        </ScrollArea>
                        <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} character={activeAi} />
                      </TabsContent>
                      <TabsContent value="files" className="flex-1 flex flex-col min-h-0 mt-0">
                        <FileExplorer files={files.map(f => f.name)} activeFile={activeFileName} onSelectFile={handleSelectFile} onRenameFile={handleRenameFile} onDeleteFile={handleDeleteFile}>
                          <Button onClick={handleAddNewFile} variant="outline" className="w-[calc(100%-1rem)] mx-2 my-2 justify-start gap-2 h-8"><FilePlus className="h-4 w-4"/>Create New File</Button>
                        </FileExplorer>
                      </TabsContent>
                       <TabsContent value="source-control" className="flex-1 overflow-y-auto mt-0">
                         <ScrollArea className="h-full">
                           <SourceControlPanel files={files} onRevert={setFiles} />
                         </ScrollArea>
                       </TabsContent>
                       <TabsContent value="extensions" className="flex-1 overflow-y-auto mt-0">
                         <ScrollArea className="h-full">
                           <ExtensionsPanel onAddLibrary={handleAddLibrary} />
                         </ScrollArea>
                       </TabsContent>
                       <TabsContent value="profile" className="flex-1 overflow-y-auto mt-0 p-4">
                           <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent border-gray-600 hover:bg-gray-700/50" onClick={() => window.open("https://github.com/mrgarvitoffice/LearnMint", "_blank")}>
                                  <Github className="h-4 w-4" /> Connect to GitHub
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent border-gray-600 hover:bg-gray-700/50" onClick={() => window.open("https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmrgarvitoffice%2FLearnMint", "_blank")}>
                                  <svg className="h-4 w-4" viewBox="0 0 116 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M57.5 0L115 100H0L57.5 0z"/></svg> Deploy on Vercel
                                </Button>
                                <a href="mailto:learnmint.ai@gmail.com?subject=LearnMint%20Playground%20Feedback" className="w-full">
                                  <Button variant="outline" className="w-full justify-start gap-2 bg-transparent border-gray-600 hover:bg-gray-700/50">
                                      <MessageSquare className="mr-2 h-4 w-4" /> Send Feedback
                                  </Button>
                                </a>
                                 <Button onClick={() => router.push('/profile')} variant="secondary" className="w-full justify-start gap-2">
                                    <ChevronLeft className="h-4 w-4" /> Back to Profile Page
                                </Button>
                           </div>
                       </TabsContent>
                       <TabsContent value="settings" className="flex-1 overflow-y-auto mt-0 p-4">
                           <SettingsMenuContent />
                       </TabsContent>
                    </Tabs>
                </ScrollArea>
            </DialogContent>
          </Dialog>
      </div>
    );
  }

  // DESKTOP UI
  return (
    <div className="h-screen w-full bg-transparent text-gray-300 font-sans overflow-hidden border border-gray-700/50 relative">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-10">
          <source src="/icons/v4.mp4" type="video/mp4" />
        </video>
        <div className="flex h-full w-full relative z-10">
            <div className="w-12 bg-[#333333] flex flex-col items-center py-4 space-y-6 text-gray-400 border-r border-gray-900/50 z-20">
                <Files className={cn("h-6 w-6 cursor-pointer hover:text-white", activeSideTab === 'explorer' && "text-white")} title="Explorer & AI" onClick={() => handleToggleSidePanel('explorer')} />
                <Search className="h-6 w-6 cursor-pointer hover:text-white" title="Search File (Ctrl+F)" onClick={() => editorRef.current?.getAction('actions.find')?.run()} />
                <GitMerge className={cn("h-6 w-6 cursor-pointer hover:text-white", activeSideTab === 'source-control' && "text-white")} title="Source Control" onClick={() => handleToggleSidePanel('source-control')} />
                <Code2 className={cn("h-6 w-6 cursor-pointer hover:text-white", activeSideTab === 'extensions' && "text-white")} title="Extensions / Playgrounds" onClick={() => handleToggleSidePanel('extensions')} />
                
                <div className="flex-grow"></div>

                <Dialog>
                    <DialogTrigger asChild>
                      <button id="terminal-dialog-trigger" title="Terminal (Ctrl+Q)" className="hover:text-white">
                        <TerminalIcon className="h-6 w-6 cursor-pointer" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[80vw] lg:max-w-[85vw] xl:max-w-[90vw] w-[80vw] h-[70vh] p-0 border-gray-700 bg-[#1e1e1e] flex flex-col">
                        <DialogHeader className="p-2 border-b border-gray-800 flex-row items-center justify-between">
                            <DialogTitle className="text-gray-200 flex items-center gap-2 text-base">
                                <TerminalIcon className="h-4 w-4" /> Terminal
                            </DialogTitle>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Minimize" onClick={toggleTerminal}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <DialogClose className="text-gray-400 hover:text-white h-7 w-7 flex items-center justify-center" />
                            </div>
                        </DialogHeader>
                        <Terminal activeFile={activeFile} />
                    </DialogContent>
                </Dialog>

                <Dialog>
                    <DialogTrigger asChild>
                        <button title="Account & Actions" className="hover:text-white"><User className="h-6 w-6 cursor-pointer" /></button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md lg:max-w-xl bg-[#252526] border-gray-700 text-gray-300 max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 lg:h-12 lg:w-12">
                                    <AvatarImage src={user?.photoURL || ''} alt={userDisplayName} />
                                    <AvatarFallback>{userDisplayName.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-lg font-bold">{userDisplayName}</p>
                                    <p className="text-xs lg:text-sm font-normal text-gray-400">{user?.email}</p>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 pt-4">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent border-gray-600 hover:bg-gray-700/50" onClick={() => window.open("https://github.com/mrgarvitoffice/LearnMint", "_blank")}>
                                <Github className="h-4 w-4" /> Connect to GitHub
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent border-gray-600 hover:bg-gray-700/50" onClick={() => window.open("https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmrgarvitoffice%2FLearnMint", "_blank")}>
                                <svg className="h-4 w-4" viewBox="0 0 116 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M57.5 0L115 100H0L57.5 0z"/></svg> Deploy on Vercel
                            </Button>
                            <a href="mailto:learnmint.ai@gmail.com?subject=LearnMint%20Playground%20Feedback" className="w-full">
                                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent border-gray-600 hover:bg-gray-700/50">
                                    <MessageSquare className="mr-2 h-4 w-4" /> Send Feedback
                                </Button>
                            </a>
                            <Button onClick={() => router.push('/profile')} variant="secondary" className="w-full justify-start gap-2">
                                    <ChevronLeft className="h-4 w-4" /> Back to Profile Page
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog>
                    <DialogTrigger asChild>
                        <button id="settings-trigger" title="Settings" className="hover:text-white"><Settings className="h-6 w-6 cursor-pointer" /></button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl lg:max-w-3xl bg-[#252526] border-gray-700 text-gray-300 max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl lg:text-2xl font-bold">Playground Settings</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="app-settings" className="w-full pt-2">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="app-settings">Application</TabsTrigger>
                                <TabsTrigger value="playground-settings">Playground</TabsTrigger>
                            </TabsList>
                            <TabsContent value="app-settings" className="pt-4">
                            <div className="space-y-4">
                                <SettingsMenuContent />
                            </div>
                            </TabsContent>
                            <TabsContent value="playground-settings" className="pt-4 space-y-4">
                            <Dialog>
                                <DialogTrigger asChild><Button id="command-palette-trigger" variant="outline" className="w-full justify-start gap-2"><Palette className="h-4 w-4" /> View Command Palette</Button></DialogTrigger>
                                <CommandPaletteDialogContent />
                            </Dialog>
                                <Dialog>
                                <DialogTrigger asChild><Button variant="outline" className="w-full justify-start gap-2"><Keyboard className="h-4 w-4" /> View Keyboard Shortcuts</Button></DialogTrigger>
                                <ShortcutsDialogContent />
                            </Dialog>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <AnimatePresence>
                {isAnySidePanelOpen && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: sidePanelWidth, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="bg-[#252526] flex flex-col overflow-hidden"
                    >
                     <div className="flex-1 flex flex-col min-h-0">
                        {SidePanelContent()}
                      </div>
                    </motion.div>
                )}
                </AnimatePresence>
                
                <div 
                onMouseDown={handleStartSideResize} 
                className={cn("w-1.5 cursor-col-resize bg-gray-900/50 hover:bg-primary/50 transition-colors", isSideResizing && "bg-primary", !isAnySidePanelOpen && "hidden")}
                />

                <div id="main-content-area" className="flex-1 flex flex-col overflow-hidden">
                    <div style={{ height: `${topPaneHeight}%` }} className="flex flex-col border-b-2 border-transparent">
                        <div className="h-8 bg-[#333333] flex-shrink-0 flex items-center justify-between px-2 border-b border-gray-900/50">
                            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'live' | 'on-run')} className="w-auto">
                                <TabsList className="bg-transparent rounded-none p-0 h-full">
                                    <TabsTrigger value="live" className="h-full rounded-none text-xs px-3 data-[state=active]:bg-[#1e1e1e] data-[state=active]:shadow-none flex items-center gap-1.5 text-green-400"><Eye className="h-3.5 w-3.5"/> Live</TabsTrigger>
                                    <TabsTrigger value="on-run" className="h-full rounded-none text-xs px-3 data-[state=active]:bg-[#1e1e1e] data-[state=active]:shadow-none flex items-center gap-1.5 text-yellow-400"><EyeOff className="h-3.5 w-3.5"/> On Run</TabsTrigger>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" title="Run Preview" onClick={() => setRunTrigger(t => t + 1)}><Play className="h-4 w-4" /></Button>
                                </TabsList>
                            </Tabs>
                            <div className='flex items-center gap-2'>
                                <Button variant="ghost" size="icon" className="h-6 w-6" title="Open in new tab" onClick={handleOpenInNewTab}><ExternalLink className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" title="Make Preview Public & Copy URL" onClick={handleShare}><Share2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <iframe srcDoc={previewSrcDoc} title="Live Preview" sandbox="allow-scripts allow-modals allow-same-origin allow-popups" className="w-full h-full border-0 bg-white" />
                    </div>

                    <div onMouseDown={handleStartVerticalResize} className="w-full h-1.5 cursor-row-resize bg-gray-900/50 hover:bg-primary/50 transition-colors flex items-center justify-center"><GripHorizontal className="h-3 w-5 text-gray-600"/></div>
                    
                    <div style={{ height: `${100 - topPaneHeight}%` }} className="flex flex-col min-h-0">
                        <Tabs value={activeBottomTab} onValueChange={setActiveBottomTab} className="w-full flex-1 flex flex-col">
                            <TabsList className="bg-[#252526] rounded-none justify-start px-2 h-8 border-t border-gray-900/50">
                            <TabsTrigger value="editor" className="h-full rounded-none text-xs px-3 data-[state=active]:bg-[#1e1e1e] data-[state=active]:shadow-none flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5 text-blue-400"/> {activeFile?.name || 'Editor'}</TabsTrigger>
                            <div className="flex-grow"></div>
                            <Dialog>
                                <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><FolderPlus className="h-4 w-4"/></Button></DialogTrigger>
                                <DialogContent className="sm:max-w-xl lg:max-w-3xl bg-[#252526] border-gray-700 text-gray-300 max-h-[80vh] overflow-y-auto">
                                    <DialogHeader><DialogTitle className="text-xl lg:text-2xl font-bold">Project Management</DialogTitle></DialogHeader>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                        <Button onClick={handleNewProject} variant="outline" className="h-12"><FilePlus className="h-4 w-4 mr-2"/>New Project</Button>
                                        <Button onClick={handleDownloadProject} variant="outline" className="h-12"><FileDown className="h-4 w-4 mr-2"/>Download Project</Button>
                                        <Button variant="outline" className="sm:col-span-2 h-12" asChild>
                                            <a href="https://vscode.dev/" target="_blank" rel="noopener noreferrer">
                                                <Code className="h-4 w-4 mr-2"/> Advanced - Use VS Code
                                            </a>
                                        </Button>
                                    </div>
                                    <div className="pt-4 mt-6 border-t border-gray-700">
                                        <h3 className="font-semibold text-lg lg:text-xl mb-4">Project Slots</h3>
                                        <div className="space-y-3">
                                        {Array.from({ length: MAX_PROJECT_SLOTS }).map((_, i) => {
                                            const slot = projectSlots.find(s => s.id === i + 1);
                                            return (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                                                <div className="flex items-center gap-4">
                                                    <div className="font-mono text-xs bg-gray-700 px-2 py-1 rounded text-primary">Slot {i + 1}</div>
                                                    {slot ? (
                                                    <div>
                                                        <p className="font-semibold text-sm lg:text-base">{slot.name}</p>
                                                        <p className="text-xs text-gray-500 italic">Saved: {new Date(slot.timestamp).toLocaleString()}</p>
                                                    </div>
                                                    ) : <p className="text-sm lg:text-base text-gray-500 italic">Empty Slot</p>}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => handleSaveToSlot(i+1)} className="h-9"><Save className="h-4 w-4 mr-1.5"/>Save</Button>
                                                    {slot && <Button size="sm" variant="outline" onClick={() => handleLoadFromSlot(i+1)} className="h-9">Load</Button>}
                                                    {slot && <Button size="sm" variant="destructive" onClick={() => handleDeleteSlot(i+1)} className="h-9"><Trash2 className="h-4 w-4"/></Button>}
                                                </div>
                                                </div>
                                            )
                                        })}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            </TabsList>
                            <TabsContent value="editor" className="flex-1 mt-0">
                                <CodePlayground key={activeFile?.name} language={activeFile?.language || 'plaintext'} value={activeFile?.content || ''} onChange={handleCodeChange} theme={'vs-dark'} onMount={(editor) => { editorRef.current = editor; }} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
