import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileVideo, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Detection {
  id: string;
  video_url: string;
  detection_results: any;
  language: string;
  created_at: string;
}

const Detections = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("english");

  const { isListening, isSpeaking, speak, startListening } = useVoiceRecognition({
    onResult: (transcript) => {
      const text = transcript.toLowerCase();

      // Example navigation voice commands
      if (text.includes("go back")) {
        speak("Going back").then(() => navigate(-1));
        return;
      }
      if (text.includes("go to home") || text === "home") {
        speak("Going to home").then(() => navigate("/"));
        return;
      }
      // Add more voice commands as needed (e.g. play detection audio)
    }
  });

  useEffect(() => {
    speak(
      "Here you have your saved detections. You can view them as video files and also play their audio summaries."
    ).then(() => startListening());

    fetchDetections();
  }, []);

  const fetchDetections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("detections")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDetections(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const playDetectionAudio = (detection: Detection) => {
    const results = Array.isArray(detection.detection_results) ? detection.detection_results : [];
    let objects = results.map((d: any) => d.class).join(", ");
    // Remove any trailing punctuation from objects string
    objects = objects.replace(/[.。]+$/, "");
    const text = `Detected objects: ${objects}`;
    const langMap: { [key: string]: string } = {
      english: "en-US",
      hindi: "hi-IN",
      tamil: "ta-IN",
      telugu: "te-IN"
    };
    speak(text, langMap[selectedLanguage] || "en-US");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <Navigation />
      <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">My Detections</h1>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Audio Language:</label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="tamil">Tamil</SelectItem>
                <SelectItem value="telugu">Telugu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FileVideo className="h-6 w-6 text-primary" />
              Saved Videos
            </h2>
            <div className="space-y-4">
              {detections.map((detection) => (
                <Card key={detection.id} className="hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Detection {new Date(detection.created_at).toLocaleDateString()}
                    </CardTitle>
                    <CardDescription>
                      {detection.detection_results.length} objects detected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playDetectionAudio(detection)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                      >
                        <Volume2 className="h-4 w-4" />
                        Play Audio
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {detections.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No detections saved yet
                </p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="h-6 w-6 text-secondary" />
              Audio Summaries
            </h2>
            <p className="text-muted-foreground">
              Audio summaries are generated from your saved detections. Select a language above and click "Play Audio" on any detection.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Detections;
