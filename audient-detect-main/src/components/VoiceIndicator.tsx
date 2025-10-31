import { Mic, Volume2 } from "lucide-react";

interface VoiceIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export const VoiceIndicator = ({ isListening, isSpeaking }: VoiceIndicatorProps) => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isSpeaking && (
        <div className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-3 rounded-full shadow-lg animate-pulse-glow">
          <Volume2 className="h-5 w-5" />
          <span className="font-medium">Speaking...</span>
        </div>
      )}
      {isListening && !isSpeaking && (
        <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg animate-pulse-glow">
          <Mic className="h-5 w-5 animate-pulse" />
          <span className="font-medium">Listening...</span>
        </div>
      )}
    </div>
  );
};
