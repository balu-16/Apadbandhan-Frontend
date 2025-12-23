import { ReactNode } from "react";
import { MapPin } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  heroImage: string;
}

const AuthLayout = ({ children, heroImage }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-transparent to-transparent z-10" />
        <img
          src={heroImage}
          alt="Apadbandhav Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
          <div className="relative">
            <MapPin className="w-10 h-10 text-primary animate-pulse-glow" />
            <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3" />
          </div>
          <span className="text-3xl font-bold text-foreground drop-shadow-lg">
            Apadbandhav
          </span>
        </div>
        <div className="absolute bottom-8 left-8 right-8 z-20">
          <p className="text-foreground/90 text-lg max-w-md drop-shadow-lg">
            AIoT-based accident detection ensuring rapid emergency response when every second counts.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="relative">
              <MapPin className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 w-2 h-2 bg-primary rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              Apadbandhav
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
