import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI } from "@/services/api";
import AuthLayout from "@/components/auth/AuthLayout";
import authHero from "@/assets/auth-hero.png";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authAPI.sendOtp(phone);
      setOtpSent(true);
      
      // If user already exists, redirect to login
      if (response.data.userExists) {
        toast({
          title: "Account Exists",
          description: "This phone number is already registered. Please login instead.",
        });
        navigate("/login");
        return;
      }
      
      toast({
        title: "OTP Sent!",
        description: "A 6-digit OTP has been sent to your phone",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send OTP. Please try again.",
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
      
      toast({
        title: "Account Created!",
        description: "Welcome to Apadbandhav",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout heroImage={authHero}>
      <div className="animate-fade-up">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Link to="/login" className="flex-1">
            <button
              className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 bg-muted text-muted-foreground hover:bg-muted/80"
            >
              LOGIN
            </button>
          </Link>
          <button
            className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 bg-primary/10 text-primary border border-primary/30"
          >
            SIGN UP
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Create an Account</h2>
            <p className="text-muted-foreground">Join Apadbandhav today</p>
          </div>

          <div className="space-y-4">
            <div>
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

            <div>
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
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={handleSendOtp}
                  disabled={isLoading || !phone}
                  className="whitespace-nowrap"
                >
                  Send OTP
                </Button>
              </div>
            </div>

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

            <Button 
              variant="hero" 
              className="w-full" 
              size="lg"
              onClick={handleSignup}
              disabled={isLoading || !otpSent || !otp || !fullName || !email}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;
