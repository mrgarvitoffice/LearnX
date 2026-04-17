

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface CustomSpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface CustomSpeechRecognitionErrorEvent extends Event {
  error: SpeechRecognitionErrorCode;
}

interface VoiceRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: (continuous?: boolean) => void;
  stopListening: () => void;
  error: string | null;
  browserSupportsSpeechRecognition: boolean;
}

// This hook now manages its own instance of SpeechRecognition
export function useVoiceRecognition(): VoiceRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for browser support once on component mount, AFTER initial render.
  useEffect(() => {
    // This check now runs after the initial render to prevent hydration mismatches.
    const hasSupport = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setBrowserSupportsSpeechRecognition(hasSupport);
  }, []);

  // Initialize or clean up recognition instance
  useEffect(() => {
    if (browserSupportsSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.onresult = (event: Event) => {
        const speechEvent = event as CustomSpeechRecognitionEvent;
        let finalTranscript = '';
        for (let i = speechEvent.resultIndex; i < speechEvent.results.length; ++i) {
          if (speechEvent.results[i].isFinal) {
            finalTranscript += speechEvent.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript);
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as CustomSpeechRecognitionErrorEvent;
        const errorType = errorEvent.error;
        // Don't report common, non-critical errors
        if (errorType !== 'no-speech' && errorType !== 'aborted') {
          // Do not set error state to prevent UI display
          console.warn('Speech recognition error:', errorType);
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        // onend can be called by the API itself, so we must sync state
        setIsListening(false);
      };

    } else if (typeof window !== 'undefined') { // Only set error if we've determined there's no support
      // Do not set error state to prevent UI display
      console.warn("Speech recognition not supported in this browser.");
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [browserSupportsSpeechRecognition]);

  const startListening = useCallback((continuous = false) => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) {
      return;
    }

    try {
      setTranscript('');
      setError(null);
      
      recognition.continuous = continuous;
      recognition.interimResults = false; // Only finalize results for simplicity
      recognition.lang = 'en-US';
      
      // Safety check to prevent the 'already started' error.
      if (!isListening) {
          recognition.start();
          setIsListening(true);
      }
    } catch (e: any) {
      // This handles cases where start() is called erratically.
      if (e.name === 'InvalidStateError') {
         console.warn("Recognition is already active. Ignoring redundant start call.");
      } else {
        console.error("Error starting recognition:", e);
        // Do not set error state to prevent UI display
        setIsListening(false);
      }
    }
  }, [isListening]);
  
  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition && isListening) {
        // stop() can also trigger onend, which sets isListening to false.
        recognition.stop();
        setIsListening(false); // Manually set state to be safe
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, error, browserSupportsSpeechRecognition };
}
