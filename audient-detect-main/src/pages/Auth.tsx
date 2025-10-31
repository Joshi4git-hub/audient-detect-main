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

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentField, setCurrentField] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const fields = ["email", "password"];

  const { isListening, isSpeaking, startListening, speak } = useVoiceRecognition({
    onResult: (transcript) => {
      const text = transcript.toLowerCase();
      
      if (text.includes("login") && currentField === 2) {
        handleLogin();
      } else if (currentField < 2) {
        setFormData(prev => ({
          ...prev,
          [fields[currentField]]: transcript
        }));
        
        const nextField = currentField + 1;
        setCurrentField(nextField);
        
        if (nextField < 2) {
          setTimeout(() => {
            speak(`Please say your ${fields[nextField]}`).then(() => startListening());
          }, 500);
        } else {
          setTimeout(() => {
            speak("Say login to continue").then(() => startListening());
          }, 500);
        }
      }
    },
    onError: (error: any) => {
      console.error("Voice recognition error:", error);
    }
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/home");
      }
    };
    checkUser();

    setTimeout(() => {
      speak("Welcome back! Please say your email").then(() => startListening());
    }, 1000);
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      await speak("Login successful! Welcome back.");
      navigate("/home");
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
      await speak("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center p-4">
      <VoiceIndicator isListening={isListening} isSpeaking={isSpeaking} />
      
      <Card className="w-full max-w-md shadow-medium animate-scale-in">
        <CardHeader>
          <CardTitle className="text-3xl">Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={currentField === 0 ? "ring-2 ring-primary" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className={currentField === 1 ? "ring-2 ring-primary" : ""}
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/register")}
          >
            Don't have an account? Register
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
