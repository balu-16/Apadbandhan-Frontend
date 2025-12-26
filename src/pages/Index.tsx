import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FeatureCard from "@/components/home/FeatureCard";
import SafetyCard from "@/components/home/SafetyCard";
import { 
  AlertTriangle, 
  Cpu, 
  Clock, 
  MapPin, 
  Radar, 
  Radio, 
  Shield, 
  ArrowRight 
} from "lucide-react";
import heroLanding from "@/assets/hero-landing.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Content */}
            <div className="order-2 lg:order-1">
              <div className="space-y-6 lg:space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fade-up">
                  <Radio className="w-4 h-4 animate-pulse" />
                  Real-time AIoT Accident Alerts
                </div>
                
                <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight animate-fade-up stagger-1">
                  Accident Detected.
                  <br />
                  <span className="text-gradient-orange">Rescue Initiated.</span>
                </h1>
                
                <p className="text-lg lg:text-xl text-muted-foreground max-w-xl animate-fade-up stagger-2">
                  Apadbandhav uses advanced AIoT sensors to instantly detect vehicle accidents 
                  and automatically dispatch emergency services. Every second counts.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-up stagger-3">
                  <Link to="/signup">
                    <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                      Get Started
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/#how-it-works">
                    <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Right - Hero Image */}
            <div className="order-1 lg:order-2 relative animate-fade-up">
              <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 shadow-glow-strong">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10" />
                <img 
                  src={heroLanding} 
                  alt="Vehicle accident rescue illustration"
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 lg:-left-8 bg-card border border-border/50 rounded-2xl p-4 shadow-card animate-float z-20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{"<"}3s</p>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-card/50" id="how-it-works">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-up">
              How We <span className="text-gradient-orange">Save Lives</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-up stagger-1">
              Our AIoT-powered system ensures immediate response when accidents occur
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard 
              icon={AlertTriangle}
              title="What We Do"
              description="Provide immediate rescue support the moment accidents occur, connecting victims with emergency services in real-time."
              delay="0.1s"
            />
            <FeatureCard 
              icon={Cpu}
              title="AIoT Accident Detection"
              description="Vehicle-mounted AIoT devices with advanced sensors auto-detect collisions and instantly transmit distress signals."
              delay="0.2s"
            />
            <FeatureCard 
              icon={Clock}
              title="Why Fast Rescue Matters"
              description="Rapid emergency response significantly reduces injury severity and saves lives during the critical golden hour."
              delay="0.3s"
            />
          </div>
        </div>
      </section>

      {/* Safety & Technology Section */}
      <section className="py-20 lg:py-32" id="about">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6 animate-fade-up">
                Safety Meets <span className="text-gradient-orange">Technology</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-10 animate-fade-up stagger-1">
                Our cutting-edge technology stack ensures reliable, secure, and instant 
                emergency response coordination.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <SafetyCard 
                  icon={MapPin}
                  title="Real-time GPS"
                  description="Precise location tracking for accurate rescue dispatch"
                  delay="0.1s"
                />
                <SafetyCard 
                  icon={Radar}
                  title="High-Accuracy Sensors"
                  description="Advanced crash detection with minimal false positives"
                  delay="0.2s"
                />
                <SafetyCard 
                  icon={Radio}
                  title="Automated Alerts"
                  description="Instant distress signals to emergency services"
                  delay="0.3s"
                />
                <SafetyCard 
                  icon={Shield}
                  title="Secure Transmission"
                  description="End-to-end encrypted data for privacy protection"
                  delay="0.4s"
                />
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                    <Shield className="w-16 h-16 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise Grade</h3>
                  <p className="text-muted-foreground">Security & Reliability</p>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 animate-float" style={{ animationDelay: "0.5s" }} />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 animate-float" style={{ animationDelay: "1s" }} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-card/50" id="contact">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6 animate-fade-up">
              Ready to Make Roads <span className="text-gradient-orange">Safer</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 animate-fade-up stagger-1">
              Join thousands of vehicles protected by Apadbandhav's intelligent 
              accident detection and emergency response system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up stagger-2">
              <Link to="/signup">
                <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                  Get Started Today
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                  Login to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
