import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: string;
}

const FeatureCard = ({ icon: Icon, title, description, delay = "0s" }: FeatureCardProps) => {
  return (
    <div 
      className="group p-6 lg:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover-scale card-glow opacity-0 animate-fade-up"
      style={{ animationDelay: delay }}
    >
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;
