import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Mic, Video, Brain } from "lucide-react";

const About = () => {
  const { isListening, isSpeaking, speak, startListening } = useVoiceRecognition({
    onResult: () => {},
    onError: (error: any) => {
      console.error("Voice recognition error:", error);
    }
  });

  useEffect(() => {
    setTimeout(() => {
      speak("About Object Detection Application: An AI-powered interactive application that detects and narrates objects in your videos using natural voice communication.").then(() => startListening());
    }, 1000);
  }, []);

  const features = [
    {
      icon: Mic,
      title: "Voice Control",
      description: "Navigate and control the entire application using natural voice commands"
    },
    {
      icon: Video,
      title: "Live Detection",
      description: "Real-time object detection with visual bounding boxes and labels"
    },
    {
      icon: Brain,
      title: "AI Powered",
      description: "Advanced machine learning models for accurate object recognition"
    },
    {
      icon: Sparkles,
      title: "Multi-language",
      description: "Audio narration in English, Hindi, Tamil, and Telugu"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <Navigation />
      <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Our Application</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            An AI-powered interactive application that detects and narrates objects in your videos using natural voice communication.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-medium transition-all animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <CardContent className="pt-6">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="p-8 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Our application combines cutting-edge AI technology with intuitive voice interaction to create a seamless object detection experience.
            </p>
            <p>
              Upload your videos, and our advanced machine learning models will identify and track objects in real-time, displaying bounding boxes and providing voice narration of detected items.
            </p>
            <p>
              All interactions can be controlled through natural voice commands, making the app accessible and easy to use. Save your detection results and review them anytime with audio summaries in your preferred language.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default About;
