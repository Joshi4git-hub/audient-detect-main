import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useObjectDetection } from "@/hooks/useObjectDetection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload as UploadIcon, Play, Pause, Save, Repeat } from "lucide-react";

const Upload = () => {
  const { toast } = useToast();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectionResults, setDetectionResults] = useState<any[]>([]);
  const [lastResults, setLastResults] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);

  const { model, isLoading: modelLoading, detect } = useObjectDetection();

  const { isListening, isSpeaking, startListening, speak } = useVoiceRecognition({
    onResult: (transcript: string) => {
      const text = transcript.toLowerCase();
      if (text.includes("go back")) {
        speak("Going back").then(() => window.history.back());
        return;
      } else if (text.includes("go to home") || text === "home") {
        speak("Going to home").then(() => { window.location.href = "/Home"; });
        return;
      } else if (text.includes("save")) {
        handleSave();
      } else if (text.includes("repeat")) {
        if (lastResults) speak(lastResults);
      } else if (text.includes("upload")) {
        fileInputRef.current?.click();
      }
    },
    onError: (error: any) => {
      console.error("Voice recognition error:", error);
    }
  });

  useEffect(() => {
    startListening();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      speak("Video uploaded successfully. Click play to start detection.");
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      if (detectionInterval.current) clearInterval(detectionInterval.current);
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      startDetection();
    }
  };

  const startDetection = async () => {
    if (!videoRef.current || !model) return;

    detectionInterval.current = setInterval(async () => {
      if (videoRef.current && model) {
        const detected = await detect(videoRef.current);
        setDetectionResults(detected);
        drawDetections(detected);
        
        if (detected.length > 0) {
          const summary = detected.map(d => d.class).join(", ");
          const resultText = `Detected: ${summary}`;
          setLastResults(resultText);
          speak(resultText);
        }
      }
    }, 2000);
  };

  const drawDetections = (detections: any[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((detection) => {
      const [x, y, width, height] = detection.bbox;
      ctx.strokeStyle = "#6B9BD1";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = "#6B9BD1";
      ctx.fillRect(x, y - 25, width, 25);
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText(`${detection.class} ${Math.round(detection.score * 100)}%`, x + 5, y - 7);
    });
  };

  const handleSave = async () => {
    if (!videoFile || !detectionResults.length) {
      toast({ title: "Error", description: "No detection data to save", variant: "destructive" });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const filePath = `${session.user.id}/${Date.now()}_${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("detections")
        .insert({
          user_id: session.user.id,
          video_url: filePath,
          detection_results: detectionResults
        });

      if (dbError) throw dbError;

      speak("Detection saved successfully!");
      toast({ title: "Success", description: "Detection saved to your library" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <Navigation />
      <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Upload & Detect</h1>
        
        <Card className="p-6 space-y-6">
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
              <UploadIcon className="h-4 w-4" />
              Upload Video
            </Button>
          </div>

          {videoUrl && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full"
                  onEnded={() => {
                    setIsPlaying(false);
                    if (detectionInterval.current) clearInterval(detectionInterval.current);
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={handlePlayPause} className="gap-2">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button onClick={handleSave} variant="secondary" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button onClick={() => lastResults && speak(lastResults)} variant="outline" className="gap-2">
                  <Repeat className="h-4 w-4" />
                  Repeat Results
                </Button>
              </div>
            </div>
          )}

          {modelLoading && (
            <p className="text-center text-muted-foreground">Loading detection model...</p>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Upload;
