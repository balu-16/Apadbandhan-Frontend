import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WorkflowStep from "@/components/home/WorkflowStep";
import ApadbandhavChatbot from "@/components/chatbot/ApadbandhavChatbot";
import { 
  AlertTriangle, 
  Satellite, 
  Server, 
  Siren,
  Shield,
  Clock,
  MapPin,
  CheckCircle,
  ArrowRight,
  Activity
} from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-up">
              <Activity className="w-4 h-4 animate-pulse" />
              Dashboard Active
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-up stagger-1">
              Welcome to <span className="text-gradient-orange">Apadbandhav</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up stagger-2">
              Your AIoT-powered guardian on the road. Real-time accident detection 
              and instant emergency response coordination at your fingertips.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-32 bg-card/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-up">
              How Our <span className="text-gradient-orange">AIoT System</span> Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-up stagger-1">
              From detection to rescue in seconds - our intelligent workflow ensures rapid response
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            <WorkflowStep 
              icon={AlertTriangle}
              step={1}
              title="Accident Detection"
              description="AIoT sensors detect collision impact instantly"
              delay="0.1s"
            />
            <WorkflowStep 
              icon={Satellite}
              step={2}
              title="Signal Transmission"
              description="GPS coordinates sent to cloud servers"
              delay="0.2s"
            />
            <WorkflowStep 
              icon={Server}
              step={3}
              title="Server Processing"
              description="Alert processed and dispatchers notified"
              delay="0.3s"
            />
            <WorkflowStep 
              icon={Siren}
              step={4}
              title="Rescue Dispatch"
              description="Emergency services en route immediately"
              isLast
              delay="0.4s"
            />
          </div>
        </div>
      </section>

      {/* Why Apadbandhav Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6 animate-fade-up">
                Why Apadbandhav <span className="text-gradient-orange">Saves Lives</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-10 animate-fade-up stagger-1">
                Every second counts during an emergency. Our advanced system ensures 
                the fastest possible response time.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Quick Response</h4>
                    <p className="text-muted-foreground">Average response time under 3 seconds from accident detection to dispatch</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Accurate Location</h4>
                    <p className="text-muted-foreground">Precise GPS coordinates ensure rescue teams reach the exact accident site</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Automated Alerting</h4>
                    <p className="text-muted-foreground">No manual intervention needed - alerts are sent automatically upon impact</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Card */}
            <div className="relative">
              <div className="bg-card border border-border/50 rounded-3xl p-8 lg:p-10">
                <h3 className="text-2xl font-bold text-foreground mb-8">Platform Statistics</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 rounded-2xl bg-muted/50">
                    <p className="text-3xl lg:text-4xl font-bold text-primary mb-2">10K+</p>
                    <p className="text-sm text-muted-foreground">Vehicles Protected</p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-muted/50">
                    <p className="text-3xl lg:text-4xl font-bold text-primary mb-2">500+</p>
                    <p className="text-sm text-muted-foreground">Lives Saved</p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-muted/50">
                    <p className="text-3xl lg:text-4xl font-bold text-primary mb-2">{"<"}30s</p>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-muted/50">
                    <p className="text-3xl lg:text-4xl font-bold text-primary mb-2">99.9%</p>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 animate-float" />
              <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 animate-float" style={{ animationDelay: "0.5s" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Infographics Section */}
      <section className="py-20 lg:py-32 bg-card/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-up">
              Our <span className="text-gradient-orange">Technology Stack</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-card border border-border/50 rounded-3xl p-8 text-center hover:border-primary/50 transition-all duration-300 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Crash Detection Sensor</h3>
              <p className="text-muted-foreground">High-precision accelerometers detect sudden impacts with 99% accuracy</p>
            </div>
            
            <div className="group bg-card border border-border/50 rounded-3xl p-8 text-center hover:border-primary/50 transition-all duration-300 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Satellite className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">GPS Signal Module</h3>
              <p className="text-muted-foreground">Real-time location tracking with multi-constellation satellite support</p>
            </div>
            
            <div className="group bg-card border border-border/50 rounded-3xl p-8 text-center hover:border-primary/50 transition-all duration-300 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Server className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Dispatcher Console</h3>
              <p className="text-muted-foreground">24/7 monitoring center coordinating emergency response teams</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center bg-card border border-border/50 rounded-3xl p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <Shield className="w-16 h-16 text-primary mx-auto mb-6 animate-pulse-glow" />
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Explore More Features
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Discover how Apadbandhav can protect you and your loved ones on every journey.
              </p>
              <Button variant="hero" size="xl" className="group">
                Explore Features
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* AI Chatbot for public visitors */}
      <ApadbandhavChatbot />
    </div>
  );
};

export default Home;
