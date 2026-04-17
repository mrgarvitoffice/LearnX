
"use client";

import type { ChatMessage as ChatMessageType, FileOperation } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Loader2, FileText, AudioLines, Video, LifeBuoy, Code2, Edit, FilePlus, Trash2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';
import { useTypewriter } from '@/hooks/useTypewriter'; // Import the new hook
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: ChatMessageType;
  character?: 'gojo' | 'helper' | 'coder' | 'jarvis' | 'alya';
  onFileSelect?: (fileName: string) => void;
}

const getOperationIcon = (op: FileOperation['operation']) => {
  switch (op) {
    case 'create': return <FilePlus className="h-4 w-4 text-green-400" />;
    case 'update': return <Edit className="h-4 w-4 text-yellow-400" />;
    case 'delete': return <Trash2 className="h-4 w-4 text-red-400" />;
    default: return <FileText className="h-4 w-4 text-gray-400" />;
  }
};

export function ChatMessage({ message, character = 'gojo', onFileSelect }: ChatMessageProps) {
  const { t, isReady } = useTranslation();
  
  const isUser = message.role === 'user';
  
  const contentToDisplay = message.type === 'typing_indicator' || isUser || message.isError || message.fileOperations ? message.content : useTypewriter(message.content, 5);


  const alignment = isUser ? 'items-end' : 'items-start';
  const bubbleColor = isUser 
    ? 'bg-primary text-primary-foreground'
    : message.isError
    ? 'bg-destructive/80 text-destructive-foreground'
    : 'bg-muted text-muted-foreground';
  const bubbleAlignment = isUser ? 'flex-row-reverse' : 'flex-row';
  const textAlignment = isUser ? 'text-right' : 'text-left';

  const getAvatarSrc = () => {
    if (isUser) return undefined;
    switch(character) {
        case 'gojo': return "/images/Gojo.jpg";
        case 'jarvis': return "/images/Jarvis.jpg";
        case 'alya': return "/images/Alya.jpg";
        case 'helper': return "/images/Helper.jpg";
        case 'coder': return "/images/Coder.jpg";
        default: return undefined;
    }
  };
  
  const getAvatarFallback = () => {
    if (isUser) return <User />;
     switch(character) {
        case 'gojo': return <Bot />;
        case 'jarvis': return <Bot className="text-blue-400" />;
        case 'alya': return <Bot className="text-pink-400" />;
        case 'helper': return <LifeBuoy />;
        case 'coder': return <Code2 />;
        default: return <Bot />;
    }
  };

  const getAvatarAlt = () => {
    if (isUser) return t('chatbot.avatar.userAlt');
    switch(character) {
        case 'gojo': return t('chatbot.avatar.gojoAlt');
        case 'jarvis': return 'Jarvis AI';
        case 'alya': return 'Alya AI';
        case 'helper': return t('chatbot.avatar.helperAlt');
        case 'coder': return t('chatbot.avatar.coderAlt');
    }
  };

  if (!isReady) {
    return (
       <div className={cn('flex flex-col gap-2 py-3', alignment)}>
        <div className={cn('flex gap-3 items-start', bubbleAlignment)}>
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            <div className="max-w-[75%] rounded-lg px-4 py-3 shadow-md flex items-center gap-2 bg-muted animate-pulse h-10 w-40">
            </div>
        </div>
      </div>
    )
  }

  if (message.type === 'typing_indicator') {
    return (
      <div className={cn('flex flex-col gap-2 py-3', alignment)}>
        <div className={cn('flex gap-3 items-start', bubbleAlignment)}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarSrc()} alt={getAvatarAlt()} />
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <div className={cn('max-w-[75%] rounded-lg px-4 py-3 shadow-md flex items-center gap-2', bubbleColor)}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm italic">{message.content}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2 py-3', alignment)}>
      <div className={cn('flex gap-3 items-start', bubbleAlignment)}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={getAvatarSrc()} alt={getAvatarAlt()} />
          <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
        </Avatar>
        <div className={cn('max-w-[75%] rounded-lg px-3 py-2 shadow-md space-y-2', bubbleColor, (character === 'coder' || character === 'jarvis' || character === 'alya') && 'bg-[#3c3c3c] text-gray-300')}>
          {message.image && message.role === 'user' && (
            <div className="mb-2">
              <Image
                src={message.image}
                alt={t('chatbot.file.image.userAlt')}
                width={200}
                height={200}
                className="rounded-md object-cover"
                data-ai-hint="user image"
              />
            </div>
          )}
          {message.pdfFileName && message.role === 'user' && (
            <div className="mb-2 p-2 border border-muted-foreground/30 rounded-md bg-black/10">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground/80"/>
                <span className="text-sm font-medium text-muted-foreground/90 truncate">{message.pdfFileName}</span>
              </div>
            </div>
          )}
          {message.audioFileName && message.role === 'user' && (
            <div className="mb-2 p-2 border border-muted-foreground/30 rounded-md bg-black/10">
              <div className="flex items-center gap-2">
                <AudioLines className="h-5 w-5 text-muted-foreground/80"/>
                <span className="text-sm font-medium text-muted-foreground/90 truncate">{message.audioFileName}</span>
              </div>
            </div>
          )}
          {message.videoFileName && message.role === 'user' && (
            <div className="mb-2 p-2 border border-muted-foreground/30 rounded-md bg-black/10">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-muted-foreground/80"/>
                <span className="text-sm font-medium text-muted-foreground/90 truncate">{message.videoFileName}</span>
              </div>
            </div>
          )}
          {message.isError && (
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Error</span>
              </div>
          )}
          {message.content && (
            <ReactMarkdown
              className={cn("prose prose-sm max-w-none [&_p]:m-0", character !== 'coder' && "dark:prose-invert", (character === 'coder' || character === 'jarvis' || character === 'alya') && "prose-coder")}
              components={{
                p: ({node, ...props}) => <p className="mb-0 last:mb-0" {...props} />,
                pre: ({node, ...props}) => <pre className="bg-black/30 p-2 rounded my-1" {...props} />,
                code: ({node, ...props}) => <code className="bg-black/20 px-1 rounded text-white" {...props} />
              }}
            >
              {contentToDisplay}
            </ReactMarkdown>
          )}
          {message.fileOperations && message.fileOperations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <p className="text-xs font-semibold mb-1.5">File Changes:</p>
              <div className="space-y-1">
                {message.fileOperations.map((op, index) => (
                  <Button 
                    key={index} 
                    variant="ghost" 
                    className="flex items-center gap-2 text-xs p-1 h-auto justify-start w-full hover:bg-white/10"
                    onClick={() => onFileSelect?.(op.fileName)}
                    disabled={!onFileSelect}
                  >
                    {getOperationIcon(op.operation)}
                    <span className="font-mono">{op.fileName}</span>
                    <span className="capitalize text-gray-400">({op.operation})</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <p className={cn('text-xs text-muted-foreground/70 px-12', textAlignment)}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
