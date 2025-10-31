import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileVideo, Info, MessageSquare, Video, Users, Car, TrafficCone } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  const { isListening, isSpeaking, startListening, speak } = useVoiceRecognition({
    onResult: (transcript) => {
      const text = transcript.toLowerCase();
      if (text.includes("upload")) {
        speak("Opening upload section").then(() => navigate("/upload"));
      } else if (text.includes("detection")) {
        speak("Opening your detections").then(() => navigate("/detections"));
      } else if (text.includes("about")) {
        speak("Opening about page").then(() => navigate("/about"));
      } else if (text.includes("feedback")) {
        speak("Opening feedback").then(() => navigate("/feedback"));
      } else if (text.includes("profile")) {
        speak("Opening your profile").then(() => navigate("/profile"));
      } else if (text.includes("settings")) {
        speak("Opening settings").then(() => navigate("/settings"));
      }
    },
    onError: (error: any) => {
      console.error("Voice recognition error:", error);
    }
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", session.user.id)
        .single();

      if (profile?.first_name) {
        setUserName(profile.first_name);
        setTimeout(() => {
          speak(`Welcome back ${profile.first_name}! You can say upload, my detections, about, feedback, profile, or settings to navigate.`).then(() => startListening());
        }, 1000);
      }
    };

    checkAuth();
  }, []);

  const detectionClasses = [
    { icon: Car, label: "Vehicles", color: "text-primary" },
    { icon: Users, label: "Humans", color: "text-secondary" },
    { icon: TrafficCone, label: "Traffic signal", color: "text-accent" },
    { icon: Video, label: "Objects", color: "text-muted-foreground" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <Navigation />
      <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome {userName ? `${userName}!` : "Back!"}
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-Powered Object Detection at Your Command
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {detectionClasses.map((item, index) => (
            <Card key={index} className="hover:shadow-medium transition-shadow animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <CardContent className="pt-6 text-center">
                <item.icon className={`h-12 w-12 mx-auto mb-4 ${item.color}`} />
                <h3 className="font-semibold text-lg">{item.label}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/upload")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload className="h-6 w-6 text-primary" />
                <CardTitle>Upload & Detect</CardTitle>
              </div>
              <CardDescription>Upload videos for real-time object detection</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/detections")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileVideo className="h-6 w-6 text-secondary" />
                <CardTitle>My Detections</CardTitle>
              </div>
              <CardDescription>View your saved detection results</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/about")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Info className="h-6 w-6 text-accent" />
                <CardTitle>About</CardTitle>
              </div>
              <CardDescription>Learn about the application</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/feedback")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <CardTitle>Feedback</CardTitle>
              </div>
              <CardDescription>Share your experience with us</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Home;
