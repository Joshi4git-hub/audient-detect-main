import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export const useVoiceRecognition = ({
  onResult,
  onError,
  continuous = true,
  language = 'en-US'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError?.('Speech recognition not supported');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = continuous;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = language;

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      onResultRef.current(transcript.trim());
    };

    recognitionRef.current.onerror = (event) => {
      onError?.(event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
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

  const speak = useCallback((text, lang = 'en-US') => {
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
          if (isListening) {
            startListening();
          }
          resolve();
        }, 300);
      };

      synthRef.current?.cancel();
      synthRef.current?.speak(utterance);
    });
  }, [stopListening, startListening, isListening]);

  return { isListening, isSpeaking, startListening, stopListening, speak };
};
