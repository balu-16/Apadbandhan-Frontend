import { LucideIcon } from "lucide-react";

interface SafetyCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: string;
}

const SafetyCard = ({ icon: Icon, title, description, delay = "0s" }: SafetyCardProps) => {
  return (
    <div 
      className="flex items-start gap-4 p-5 rounded-xl bg-muted/50 border border-border/30 hover:bg-muted transition-all duration-300 opacity-0 animate-fade-up"
      style={{ animationDelay: delay }}
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default SafetyCard;
