

"use client";

import { useState, useRef, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, ImageIcon, Loader2, X, FileText, AudioLines, Video } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useSound } from '@/hooks/useSound';
import { extractTextFromPdf } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (
    message: string,
    image?: string,
    pdfText?: string,
    pdfFileName?: string,
    audio?: string,
    video?: string,
    audioFileName?: string,
    videoFileName?: string
  ) => void;
  isLoading: boolean;
  character?: 'gojo' | 'helper' | 'coder' | 'jarvis' | 'alya';
}

export function ChatInput({ onSendMessage, isLoading, character }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [pdfTextContent, setPdfTextContent] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t } = useTranslation();

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  useEffect(() => { 
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (file) {
      handleRemoveFile(false); // Clear previous file state without sound
      setIsProcessingFile(true);
      if (file.type.startsWith('image/')) {
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
          toast({ title: t('chatbot.file.image.tooLargeTitle'), description: t('chatbot.file.image.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setImageData(reader.result as string);
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ title: t('customTest.file.pdf.tooLarge'), description: t('customTest.file.pdf.tooLargeDesc'), variant: "destructive" });
            setIsProcessingFile(false);
            return;
        }
        try {
          const text = await extractTextFromPdf(file);
          setPdfTextContent(text);
          setPdfFileName(file.name);
          toast({ title: t('customTest.file.pdf.processed'), description: t('customTest.file.pdf.processedDesc') });
        } catch(err) {
          console.error("PDF processing error in ChatInput:", err);
          toast({ title: t('chatbot.file.pdf.errorTitle'), description: (err as Error).message || t('chatbot.file.pdf.errorDesc'), variant: "destructive" });
        } finally {
          setIsProcessingFile(false);
        }
      } else if (file.type.startsWith('audio/')) {
        if (file.size > 25 * 1024 * 1024) { // 25MB limit
          toast({ title: t('chatbot.file.audio.tooLargeTitle'), description: t('chatbot.file.audio.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioData(reader.result as string);
          setAudioFileName(file.name);
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        if (file.size > 25 * 1024 * 1024) { // 25MB limit
          toast({ title: t('chatbot.file.video.tooLargeTitle'), description: t('chatbot.file.video.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoData(reader.result as string);
          setVideoFileName(file.name);
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
      } else {
        toast({ title: t('chatbot.file.unsupportedTitle'), description: t('chatbot.file.unsupportedDesc'), variant: "default" });
        setIsProcessingFile(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (isLoading || (!inputValue.trim() && !imageData && !pdfTextContent && !audioData && !videoData)) return;

    onSendMessage(
      inputValue.trim(), 
      imageData || undefined, 
      pdfTextContent || undefined,
      pdfFileName || undefined,
      audioData || undefined, 
      videoData || undefined, 
      audioFileName || undefined, 
      videoFileName || undefined
    );

    setInputValue('');
    handleRemoveFile(false); // Reset all file states without sound
  };

  const toggleListening = () => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleRemoveFile = (withSound = true) => {
    if (withSound) playClickSound();
    setImagePreview(null); 
    setImageData(null); 
    setPdfTextContent(null);
    setPdfFileName(null);
    setAudioData(null);
    setVideoData(null);
    setAudioFileName(null);
    setVideoFileName(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const isCoderTheme = character === 'coder' || character === 'jarvis' || character === 'alya';
  
  return (
    <div className={cn("p-2 sm:p-4 border-t", isCoderTheme ? "bg-[#252526] border-gray-900/50" : "bg-background/80 backdrop-blur-md")}>
      <form onSubmit={handleSubmit} >
        <div className="flex flex-wrap gap-2 mb-2">
          {imagePreview && (
            <div className="relative w-20 h-20">
              <Image src={imagePreview} alt={t('chatbot.file.image.previewAlt')} layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="image preview" />
              <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-destructive/80 text-destructive-foreground rounded-full" onClick={() => handleRemoveFile()}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {pdfFileName && (
              <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate flex-1" title={pdfFileName}>{pdfFileName}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full">
                      <X className="w-4 w-4 text-destructive/70" />
                  </Button>
              </div>
          )}
          {audioFileName && (
            <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                <AudioLines className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate flex-1" title={audioFileName}>{audioFileName}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full">
                    <X className="w-4 w-4 text-destructive/70" />
                </Button>
            </div>
          )}
          {videoFileName && (
            <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                <Video className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate flex-1" title={videoFileName}>{videoFileName}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full">
                    <X className="w-4 w-4 text-destructive/70" />
                </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isProcessingFile} title={t('chatbot.controls.attach')}>
             {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5" />}
          </Button>
          <input type="file" accept="image/*,application/pdf,audio/*,video/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

          {browserSupportsSpeechRecognition && (
            <Button type="button" variant="ghost" size="icon" onClick={toggleListening} disabled={isLoading} title={t('chatbot.controls.voice')}>
              <Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              <span className="sr-only">{t(isListening ? 'chatbot.controls.stopListening' : 'chatbot.controls.startListening')}</span>
            </Button>
          )}

          <Input
            type="text"
            placeholder={t('chatbot.placeholder')}
            value={inputValue}
            onChange={handleInputChange}
            disabled={isLoading || isProcessingFile}
            className={cn("flex-1", isCoderTheme ? "bg-[#3c3c3c] border-gray-600 placeholder-gray-500 font-sans" : "bg-input/50")}
          />
          <Button type="submit" size="icon" disabled={isLoading || isProcessingFile || (!inputValue.trim() && !imageData && !pdfTextContent && !audioData && !videoData)}
            className={cn(isCoderTheme && "bg-blue-600 hover:bg-blue-700")}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span className="sr-only">{t('chatbot.controls.send')}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
