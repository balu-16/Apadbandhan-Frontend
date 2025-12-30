import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { policeAPI, alertsAPI } from "@/services/api";
import { 
  Users, 
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Shield
} from "lucide-react";
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

interface Stats {
  totalUsers: number;
  totalAlerts: number;
  pendingAlerts: number;
  resolvedAlerts: number;
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color,
  delay 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string; 
  color: string;
  delay: string;
}) => (
  <div 
    className="bg-card border border-border/50 rounded-2xl p-6 animate-fade-up opacity-0"
    style={{ animationDelay: delay, animationFillMode: "forwards" }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", color)}>
        <Icon className="w-7 h-7" />
      </div>
    </div>
  </div>
);

interface Alert {
  _id: string;
  type: string;
  status: string;
  createdAt: string;
}

const PoliceDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAlerts: 0,
    pendingAlerts: 0,
    resolvedAlerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        policeAPI.getStats().catch(() => ({ data: {} })),
        alertsAPI.getAll({ limit: 5 }).catch(() => ({ data: [] })),
      ]);
      
      interface PoliceStats {
        totalUsers?: number;
        totalAlerts?: number;
        pendingAlerts?: number;
        resolvedAlerts?: number;
      }

      const statsData = statsRes.data as PoliceStats;
      
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalAlerts: statsData.totalAlerts || 0,
        pendingAlerts: statsData.pendingAlerts || 0,
        resolvedAlerts: statsData.resolvedAlerts || 0,
      });
      
      setRecentAlerts(Array.isArray(alertsRes.data) ? alertsRes.data as Alert[] : []);
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      console.error("Failed to fetch dashboard data:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Welcome, {user?.fullName?.split(' ')[0] || 'Officer'}
            </h1>
            <p className="text-muted-foreground">Police Dashboard - Emergency Response Center</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-blue-500/20 text-blue-500"
          delay="0.1s"
        />
        <StatCard
          icon={Bell}
          label="Total Alerts"
          value={stats.totalAlerts}
          color="bg-orange-500/20 text-orange-500"
          delay="0.2s"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Alerts"
          value={stats.pendingAlerts}
          color="bg-red-500/20 text-red-500"
          delay="0.3s"
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved"
          value={stats.resolvedAlerts}
          color="bg-green-500/20 text-green-500"
          delay="0.4s"
        />
      </div>

      {/* Recent Alerts */}
      <div 
        className="bg-card border border-border/50 rounded-2xl p-6 animate-fade-up opacity-0"
        style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            Recent Alerts
          </h2>
        </div>
        
        {recentAlerts.length > 0 ? (
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <div 
                key={alert._id || index}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    alert.status === 'resolved' ? "bg-green-500/20" : "bg-red-500/20"
                  )}>
                    {alert.status === 'resolved' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{alert.type || 'SOS Alert'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  alert.status === 'resolved' 
                    ? "bg-green-500/20 text-green-500" 
                    : "bg-red-500/20 text-red-500"
                )}>
                  {alert.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No recent alerts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliceDashboard;
