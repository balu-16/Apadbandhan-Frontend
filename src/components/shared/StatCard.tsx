import React from 'react';
import { LucideIcon, TrendingUp, Loader2 } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: string | number;
    description: string;
    delay?: string;
    trend?: string;
    isLoading?: boolean;
    iconColor?: string;
    valueColor?: string;
}

/**
 * Reusable StatCard component for dashboards
 */
export const StatCard: React.FC<StatCardProps> = ({
    icon: Icon,
    title,
    value,
    description,
    delay = "0s",
    trend,
    isLoading,
    iconColor = "text-primary",
    valueColor = "text-foreground"
}) => (
    <div
        className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group animate-fade-up opacity-0"
        style={{ animationDelay: delay, animationFillMode: "forwards" }}
    >
        <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-sm text-green-500">
                    <TrendingUp className="w-4 h-4" />
                    <span>{trend}</span>
                </div>
            )}
        </div>
        {isLoading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        ) : (
            <h3 className={`text-3xl font-bold ${valueColor} mb-1`}>{value}</h3>
        )}
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
    </div>
);

export default StatCard;
