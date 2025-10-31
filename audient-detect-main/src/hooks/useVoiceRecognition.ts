import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
}

export const useVoiceRecognition = ({
  onResult,
  onError,
  continuous = true,
  language = 'en-US'
}: VoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onErrorRef.current?.('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = continuous;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = language;

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      onResultRef.current(transcript.trim());
    };

    recognitionRef.current.onerror = (event: any) => {
      onErrorRef.current?.(event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      // If listening is still wanted (unless explicitly stopped), restart
      if (isListening && !isSpeaking) {
        recognitionRef.current?.start();
      }
    };

    synthRef.current = window.speechSynthesis;

    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, [continuous, language]);

  const startListening = useCallback(() => {
    if (!isSpeaking && recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isSpeaking]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  const speak = useCallback((text: string, lang = 'en-US') => {
    return new Promise<void>((resolve) => {
      setIsSpeaking(true);
      stopListening();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onend = () => {
        setIsSpeaking(false);
        setTimeout(() => {
          // After speaking, resume listening if desired
          if (isListening) startListening();
          resolve();
        }, 500);
      };

      synthRef.current?.cancel();
      synthRef.current?.speak(utterance);
    });
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak
  };
};
