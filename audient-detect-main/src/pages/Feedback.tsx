import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

const Feedback = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentField, setCurrentField] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const fields = ["name", "email", "message"];
  const fieldPrompts = ["name", "email", "feedback message"];

  const { isListening, isSpeaking, speak, startListening } = useVoiceRecognition({
    onResult: (transcript) => {
      const text = transcript.toLowerCase();

      // Navigation voice commands
      if (text.includes("go back")) {
        speak("Going back").then(() => navigate(-1));
        return;
      }
      if (text.includes("go to home") || text === "home") {
        speak("Going to home").then(() => navigate("/"));
        return;
      }

      // Remove trailing full stop/punctuation for fields
      const cleaned = transcript.trim().replace(/[.。]+$/, "");

      if (text.includes("submit") && currentField === 3) {
        handleSubmit();
      } else if (currentField < 3) {
        setFormData(prev => ({
          ...prev,
          [fields[currentField]]: cleaned
        }));

        const nextField = currentField + 1;
        setCurrentField(nextField);

        if (nextField < 3) {
          setTimeout(() => {
            speak(`Please say your ${fieldPrompts[nextField]}`).then(() => startListening());
          }, 500);
        } else {
          setTimeout(() => {
            speak("Say submit to send your feedback.").then(() => startListening());
          }, 500);
        }
      }
    }
  });

  useEffect(() => {
    setTimeout(() => {
      speak("Share your feedback with us. Please say your name.").then(() => startListening());
    }, 1000);
  }, []);

  const handleSubmit = () => {
    toast({
      title: "Thank you!",
      description: "Your feedback has been received."
    });
    speak("Thank you for your feedback!");
    setFormData({ name: "", email: "", message: "" });
    setCurrentField(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      <Navigation />
      <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <Card className="shadow-medium animate-scale-in">
          <CardHeader>
            <CardTitle className="text-3xl">Feedback</CardTitle>
            <CardDescription>
              We'd love to hear from you! Use voice or type your feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={currentField === 0 ? "ring-2 ring-primary" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={currentField === 1 ? "ring-2 ring-primary" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={currentField === 2 ? "ring-2 ring-primary" : ""}
                rows={5}
              />
            </div>

            <Button onClick={handleSubmit} className="w-full gap-2">
              <Send className="h-4 w-4" />
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Feedback;
