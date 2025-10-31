import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentField, setCurrentField] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    secondName: "",
    email: "",
    password: ""
  });

  const fields = ["firstName", "secondName", "email", "password"];
  const fieldLabels = ["first name", "second name", "email", "password"];

  const { isListening, isSpeaking, startListening, speak } = useVoiceRecognition({
    onResult: (transcript) => {
      const text = transcript.toLowerCase();

      // Remove trailing full stop from input
      const cleaned = transcript.trim().replace(/[.。]+$/, "");

      if (text.includes("register") && currentField === fields.length) {
        handleSubmit();
      } else if (currentField < fields.length) {
        setFormData(prev => ({
          ...prev,
          [fields[currentField]]: cleaned // <-- use cleaned transcript
        }));

        const nextField = currentField + 1;
        setCurrentField(nextField);

        if (nextField < fields.length) {
          setTimeout(() => {
            speak(`Please say your ${fieldLabels[nextField]}`).then(() => startListening());
          }, 500);
        } else {
          setTimeout(() => {
            speak("All fields complete! Say register to create your account.").then(() => startListening());
          }, 500);
        }
      }
    },
    onError: (error: any) => {
      console.error("Voice recognition error:", error);
    }
  });

  useEffect(() => {
    setTimeout(() => {
      speak(`Welcome to registration. Please say your ${fieldLabels[0]}`).then(() => startListening());
    }, 1000);
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            second_name: formData.secondName
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      await speak("Registration successful! Redirecting to login.");
      toast({ title: "Success", description: "Account created successfully!" });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      await speak("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center p-4">
      <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
      
      <Card className="w-full max-w-md shadow-medium animate-scale-in">
        <CardHeader>
          <CardTitle className="text-3xl">Register</CardTitle>
          <CardDescription>Create your account with voice or manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className={currentField === 0 ? "ring-2 ring-primary" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secondName">Second Name</Label>
            <Input
              id="secondName"
              value={formData.secondName}
              onChange={(e) => setFormData({ ...formData, secondName: e.target.value })}
              className={currentField === 1 ? "ring-2 ring-primary" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={currentField === 2 ? "ring-2 ring-primary" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={currentField === 3 ? "ring-2 ring-primary" : ""}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/auth")}
          >
            Already have an account? Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
