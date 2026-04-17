
"use client";

import React, { useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PauseCircle, PlayCircle, FileDown, Presentation } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { cn } from '@/lib/utils';
import PptxGenJS from 'pptxgenjs';
import { useToast } from '@/hooks/use-toast';

interface NotesViewProps {
  notesContent: string | null;
  topic: string;
}

const NotesView: React.FC<NotesViewProps> = ({ notesContent, topic }) => {
  const { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, setVoicePreference } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => { 
    setVoicePreference('jarvis'); 
    return () => cancelTTS(); 
  }, [setVoicePreference, cancelTTS]);

  const handlePlaybackControl = useCallback(() => {
    playClickSound();
    if (!notesContent) return;
    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else speak(notesContent.replace(/\[VISUAL_PROMPT:[^\]]+\]/gi, ""), { priority: 'manual' });
  }, [playClickSound, notesContent, isSpeaking, isPaused, pauseTTS, resumeTTS, speak]);

  const handleDownloadPdf = async () => {
    playClickSound();
    const { default: html2pdf } = await import('html2pdf.js');
    const element = document.getElementById('printable-notes-area');
    if (element) {
        document.body.classList.add('printing');
        const options = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `LearnX_Notes_${topic.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { 
              scale: 2.5, 
              useCORS: true,
              letterRendering: true,
              backgroundColor: '#0a0a0c' // Force dark background in canvas
            },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        
        html2pdf().from(element).set(options).save().then(() => {
          document.body.classList.remove('printing');
        });
    }
  };

  const handleDownloadPpt = () => {
    playClickSound();
    if (!notesContent) return;
    toast({ title: "Generating PPTX...", description: "Architecting smart content distribution." });

    const pptx = new PptxGenJS();
    
    // Define Master Slide for Deep Dark Theme
    pptx.defineSlideMaster({
      title: 'LEARNX_MASTER',
      background: { color: '0A0A0C' },
      objects: [
        { 'line': { x: 0.5, y: 5.2, w: 9.0, h: 0, line: { color: 'FF5A2F', width: 1 } } },
        { 'text': { text: 'LearnX Intelligence Deck', options: { x: 0.5, y: 5.3, w: '90%', h: 0.2, align: 'left', fontFace: 'Arial', fontSize: 10, color: '94A3B8' } } },
        { 'image': { path: '/icons/icon-512x512.png', x: 9.2, y: 0.3, w: 0.5, h: 0.5 } }
      ]
    });

    // Title Slide
    const titleSlide = pptx.addSlide({ masterName: 'LEARNX_MASTER' });
    titleSlide.addText(`NOTES NODE: ${topic}`, {
      x: 0.5, y: 2.2, w: '90%', h: 1,
      align: 'center', fontSize: 36, bold: true, color: 'FFFFFF',
      fontFace: 'Arial', shadow: { type: 'outer', color: 'FF5A2F', blur: 3, offset: 2, angle: 45, opacity: 0.6 }
    });

    // Smart Content Parsing & Splitting
    const sections = notesContent.split(/(?=# )|(?=## )|(?=### )/g);
    const CHAR_LIMIT_PER_SLIDE = 800; // Optimal for standard slide text

    sections.forEach(section => {
        const lines = section.split('\n');
        const titleLine = lines[0].replace(/[#\s]/g, '');
        const contentLines = lines.slice(1).filter(l => l.trim() && !l.startsWith('![') && !l.startsWith('['));
        
        let currentSlideContent = "";
        let partCount = 1;

        contentLines.forEach((line, index) => {
            currentSlideContent += line + "\n";
            
            // Check if we hit the limit or it's the last line
            if (currentSlideContent.length > CHAR_LIMIT_PER_SLIDE || index === contentLines.length - 1) {
                const slide = pptx.addSlide({ masterName: 'LEARNX_MASTER' });
                
                // Add Title with "Part X" if overflowed
                const displayTitle = partCount > 1 ? `${titleLine} (Cont.)` : titleLine;
                slide.addText(displayTitle, { x: 0.5, y: 0.5, w: '90%', h: 0.8, fontSize: 24, bold: true, color: 'FF5A2F' });
                
                // Add Body Text
                slide.addText(currentSlideContent.trim(), { 
                    x: 0.5, y: 1.5, w: '90%', h: 3.5, 
                    fontSize: 14, color: 'E2E8F0', 
                    lineSpacing: 24,
                    align: 'left',
                    valign: 'top'
                });
                
                currentSlideContent = "";
                partCount++;
            }
        });
    });

    pptx.writeFile({ fileName: `LearnX_Notes_${topic.replace(/\s+/g, '_')}.pptx` });
  };

  return (
    <Card className="glass-card mt-0 flex-1 flex flex-col min-h-0 w-full overflow-hidden border-primary/20">
      <CardHeader className="border-b bg-card/40 py-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl font-bold tracking-tight text-primary uppercase">
            {t('notesView.title', { topic })}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button onClick={handlePlaybackControl} variant="secondary" size="sm" className="h-9 font-bold">
              {isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              {isSpeaking && !isPaused ? "PAUSE FEED" : "LISTEN"}
            </Button>
            <Button onClick={handleDownloadPdf} variant="outline" size="sm" className="h-9 font-bold border-primary/40 hover:bg-primary/10">
                <FileDown className="h-4 w-4 mr-2" /> PDF
            </Button>
             <Button onClick={handleDownloadPpt} variant="outline" size="sm" className="h-9 font-bold border-primary/40 hover:bg-primary/10">
                <Presentation className="h-4 w-4 mr-2" /> PPT
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        <ScrollArea className="h-full w-full">
          <div id="printable-notes-area" className="p-8 sm:p-12 bg-[#0a0a0c] text-white printable-notes-area">
            {/* PDF Header - Visible only during print */}
            <div className="hidden print:block text-center mb-10 border-b-2 border-primary/30 pb-6">
              <Logo size={80} className="mx-auto" />
              <h1 className="text-5xl font-black mt-6 text-primary uppercase tracking-tighter">LearnX Intelligence</h1>
              <p className="text-lg font-bold text-muted-foreground mt-2 tracking-widest opacity-80">KNOWLEDGE NODE: {topic}</p>
              <div className="mt-4 flex justify-center gap-8 text-[10px] uppercase font-bold text-primary/60">
                 <span>Sync Date: {new Date().toLocaleDateString()}</span>
                 <span>Security: Class-A Verified</span>
              </div>
            </div>

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-invert max-w-none prose-orange prose-headings:text-primary prose-strong:text-primary/90 prose-a:text-blue-400"
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-black uppercase tracking-tight mb-8 mt-12 border-l-4 border-primary pl-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold uppercase tracking-widest mb-6 mt-10 text-primary/80" {...props} />,
                p: ({node, ...props}) => <p className="text-lg leading-relaxed text-foreground/90 mb-6" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-3 mb-8" {...props} />,
                li: ({node, ...props}) => <li className="text-base text-foreground/80" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/40 bg-primary/5 p-4 rounded-r-lg italic mb-8" {...props} />,
                img: ({node, ...props}) => <img className="rounded-xl border border-primary/20 shadow-2xl my-10 w-full object-cover aspect-video" {...props} />,
              }}
            >
              {notesContent || ""}
            </ReactMarkdown>

            {/* PDF Footer - Visible only during print */}
            <div className="hidden print:block mt-16 pt-6 border-t border-primary/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    System Record Generated by LearnX Core v1.0. Unauthorized duplication is a breach of protocol.
                </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotesView;
