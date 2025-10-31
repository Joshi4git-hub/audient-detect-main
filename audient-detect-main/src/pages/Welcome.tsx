import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { Sparkles, Mic } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();
  const [hasSpoken, setHasSpoken] = useState(false);

  // Voice recognition logic
  const { isListening, isSpeaking, startListening, speak } = useVoiceRecognition({
    onResult: (transcript) => {
      const text = transcript.toLowerCase();
      if (text.includes("register") || text.includes("sign up")) {
        speak("Taking you to registration").then(() => navigate("/register"));
      } else if (text.includes("login") || text.includes("sign in")) {
        speak("Taking you to login").then(() => navigate("/auth"));
      } else {
        // Persistent listening and helpful prompt
        speak("Sorry, I didn't get that. Please say register or login.")
          .then(() => startListening());
      }
    },
    onError: (error) => {
      console.error("Voice error:", error);
    }
  });

  useEffect(() => {
    if (!hasSpoken) {
      setTimeout(() => {
        speak("Welcome to Object Detection Application! Say Register if you're new, or Login if you already have an account.")
          .then(() => {
            setHasSpoken(true);
            startListening();
          });
      }, 1000);
    }
  }, [hasSpoken, speak, startListening]);

  const handleTapToSpeak = () => {
    if (!isListening && !isSpeaking) {
      startListening();
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center p-4"
      onClick={handleTapToSpeak}
    >
      <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Sparkles className="h-24 w-24 text-primary animate-float" />
              <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse-glow" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Object Detection
            <span className="block text-primary mt-2">Application</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            AI-powered detection with natural voice interaction
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={() => navigate("/register")}
            className="gap-2 shadow-medium hover:shadow-glow transition-all"
          >
            Register
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/auth")}
            className="gap-2"
          >
            Login
          </Button>
        </div>

        <div className="pt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Mic className="h-5 w-5 animate-pulse" />
          <p className="text-sm">Tap anywhere to start voice commands</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
