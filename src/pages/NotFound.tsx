import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 text-center px-4">
        <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
          <AlertTriangle className="w-12 h-12 text-primary" />
        </div>
        
        <h1 className="text-7xl lg:text-9xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl lg:text-2xl text-muted-foreground mb-8">
          Oops! This page doesn't exist
        </p>
        
        <Link to="/">
          <Button variant="hero" size="lg" className="group">
            <Home className="w-5 h-5" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
