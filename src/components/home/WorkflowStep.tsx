import { LucideIcon } from "lucide-react";

interface WorkflowStepProps {
  icon: LucideIcon;
  step: number;
  title: string;
  description: string;
  isLast?: boolean;
  delay?: string;
}

const WorkflowStep = ({ icon: Icon, step, title, description, isLast = false, delay = "0s" }: WorkflowStepProps) => {
  return (
    <div 
      className="relative flex flex-col items-center text-center opacity-0 animate-fade-up"
      style={{ animationDelay: delay }}
    >
      {/* Connector Line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-primary to-primary/30" />
      )}
      
      {/* Step Circle */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30 group-hover:border-primary transition-colors">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          {step}
        </div>
      </div>
      
      <h4 className="text-lg font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-[200px]">{description}</p>
    </div>
  );
};

export default WorkflowStep;
