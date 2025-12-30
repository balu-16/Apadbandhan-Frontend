import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocationTracking } from "@/contexts/LocationTrackingContext";
import { authAPI } from "@/services/api";
import AuthLayout from "@/components/auth/AuthLayout";
import authHero from "@/assets/auth-hero.png";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

type AuthMode = "login" | "signup";

const Auth = () => {
  // Auth mode toggle
  const [mode, setMode] = useState<AuthMode>("login");
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  
  // State
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { requestLocationPermission } = useLocationTracking();

  // Toggle between login and signup without page refresh
  const toggleMode = (newMode: AuthMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    // Reset form state when switching modes
    setOtpSent(false);
    setOtp("");
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }
    
    setIsSendingOtp(true);
    try {
      const response = await authAPI.sendOtp(phone);
      setOtpSent(true);
      
      // Handle based on current mode
      if (mode === "login" && !response.data.userExists) {
        toast({
          title: "New User",
          description: "This phone number is not registered. Switching to signup.",
        });
        setMode("signup");
      } else if (mode === "signup" && response.data.userExists) {
        toast({
          title: "Account Exists",
          description: "This phone number is already registered. Switching to login.",
        });
        setMode("login");
      }
      
      toast({
        title: "OTP Sent!",
        description: "A 6-digit OTP has been sent to your phone",
      });
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleLogin = async () => {
    if (!otp || otp.length < 6) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOtp(phone, otp);
      const { access_token, user } = response.data;
      
      login(access_token, user);
      
      // Request location permission after successful login
      requestLocationPermission().then((granted) => {
        if (!granted) {
          toast({
            title: "Location Access",
            description: "Location permission not granted. Some features may be limited.",
            variant: "default",
          });
        }
      });
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in",
      });
      
      // Redirect based on role
      const role = user.role || 'user';
      if (role === 'superadmin') {
        navigate("/superadmin");
      } else if (role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!fullName || !email || !otp) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (otp.length < 6) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authAPI.signup({
        phone,
        otp,
        fullName,
        email,
      });
      
      const { access_token, user } = response.data;
      login(access_token, user);
      
      // Request location permission after successful signup
      requestLocationPermission().then((granted) => {
        if (!granted) {
          toast({
            title: "Location Access",
            description: "Location permission not granted. Some features may be limited.",
            variant: "default",
          });
        }
      });
      
      toast({
        title: "Account Created!",
        description: "Welcome to Apadbandhav",
      });
      
      // Redirect based on role
      const role = user.role || 'user';
      if (role === 'superadmin') {
        navigate("/superadmin");
      } else if (role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === "login") {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  const canSubmit = () => {
    if (!otpSent || !otp || otp.length < 6) return false;
    if (mode === "signup" && (!fullName || !email)) return false;
    return true;
  };

  return (
    <AuthLayout heroImage={authHero}>
      <div className="animate-fade-up">
        {/* Tabs - Toggle without page refresh */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => toggleMode("login")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300",
              mode === "login"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            LOGIN
          </button>
          <button
            onClick={() => toggleMode("signup")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300",
              mode === "signup"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            SIGN UP
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {mode === "login" ? "Welcome Back" : "Create an Account"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "login" 
                ? "Login to access your dashboard" 
                : "Join Apadbandhav today"}
            </p>
          </div>

          <div className="space-y-4">
            {/* Signup only fields */}
            {mode === "signup" && (
              <>
                <div className="animate-fade-up">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Phone number field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-4 bg-muted border border-border rounded-xl text-foreground min-w-[60px] justify-center">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || !phone || phone.length < 10}
                  className="whitespace-nowrap"
                >
                  {isSendingOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : otpSent ? (
                    "Resend"
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
            </div>

            {/* OTP field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Enter OTP
              </label>
              <Input
                type="text"
                placeholder="6-digit OTP"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={!otpSent}
              />
            </div>

            {/* Submit button */}
            <Button 
              variant="hero" 
              className="w-full" 
              size="lg"
              onClick={handleSubmit}
              disabled={isLoading || !canSubmit()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {mode === "login" ? "Logging in..." : "Creating Account..."}
                </>
              ) : (
                mode === "login" ? "Login" : "Sign Up"
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => toggleMode("signup")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button 
                    onClick={() => toggleMode("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Auth;
