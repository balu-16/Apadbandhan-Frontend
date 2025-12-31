import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { policeAPI, alertsAPI } from "@/services/api";
import { 
  Users, 
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Shield,
  MapPin,
  RefreshCw,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AlertDetailModal from "@/components/shared/AlertDetailModal";

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

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

interface AlertLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
}

interface UserInfo {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  medicalConditions?: string[];
  emergencyContacts?: EmergencyContact[];
  address?: string;
  devices?: Array<{
    _id: string;
    name: string;
    code: string;
    status: string;
  }>;
}

interface Alert {
  _id: string;
  type: string;
  source: 'alert' | 'sos';
  status: string;
  severity?: string;
  location?: AlertLocation;
  userId?: UserInfo;
  createdAt: string;
  resolvedAt?: string;
  notes?: string;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const [statsRes, alertsRes] = await Promise.all([
        alertsAPI.getCombinedStats().catch(() => ({ data: {} })),
        alertsAPI.getCombined('all').catch(() => ({ data: [] })),
      ]);
      
      interface CombinedStats {
        total?: number;
        pending?: number;
        resolved?: number;
        alerts?: { total?: number };
        sos?: { total?: number };
      }

      const statsData = statsRes.data as CombinedStats;
      
      setStats({
        totalUsers: 0,
        totalAlerts: statsData.total || 0,
        pendingAlerts: statsData.pending || 0,
        resolvedAlerts: statsData.resolved || 0,
      });
      
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data as Alert[] : []);
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      console.error("Failed to fetch dashboard data:", err.response?.data || err.message);
      toast.error("Failed to load alerts");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh alerts every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (alertId: string, status: string, notes?: string) => {
    try {
      await policeAPI.updateAlertStatus(alertId, status, notes);
      toast.success(`Alert ${status === 'resolved' ? 'resolved' : 'updated'} successfully`);
      fetchData(true);
    } catch (error) {
      const err = error as AxiosErrorLike;
      toast.error(err.response?.data?.message || "Failed to update alert");
      throw error;
    }
  };

  const pendingAlerts = alerts.filter(a => a.status !== 'resolved' && a.status !== 'false_alarm');
  const recentAlerts = alerts.slice(0, 10);

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

      {/* Active Alerts Section */}
      {pendingAlerts.length > 0 && (
        <div 
          className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-8 animate-fade-up opacity-0"
          style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              Active Emergencies ({pendingAlerts.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
          
          <div className="space-y-3">
            {pendingAlerts.map((alert) => (
              <div 
                key={alert._id}
                onClick={() => handleAlertClick(alert)}
                className="flex items-center justify-between p-4 bg-card rounded-xl border border-red-500/20 
                  cursor-pointer hover:border-red-500/50 transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    alert.source === 'sos' ? "bg-red-500/20" : "bg-orange-500/20"
                  )}>
                    <AlertTriangle className={cn(
                      "w-6 h-6",
                      alert.source === 'sos' ? "text-red-500" : "text-orange-500"
                    )} />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {alert.source === 'sos' ? 'SOS Emergency' : alert.type}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                    {alert.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        {alert.location.address || `${alert.location.latitude?.toFixed(4)}, ${alert.location.longitude?.toFixed(4)}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    alert.status === 'pending' ? "bg-yellow-500/20 text-yellow-500" :
                    alert.status === 'assigned' ? "bg-blue-500/20 text-blue-500" :
                    "bg-orange-500/20 text-orange-500"
                  )}>
                    {alert.status}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      <div 
        className="bg-card border border-border/50 rounded-2xl p-6 animate-fade-up opacity-0"
        style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            All Alerts
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
        
        {recentAlerts.length > 0 ? (
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div 
                key={alert._id}
                onClick={() => handleAlertClick(alert)}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl cursor-pointer 
                  hover:bg-muted/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    alert.status === 'resolved' ? "bg-green-500/20" : 
                    alert.source === 'sos' ? "bg-red-500/20" : "bg-orange-500/20"
                  )}>
                    {alert.status === 'resolved' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className={cn(
                        "w-5 h-5",
                        alert.source === 'sos' ? "text-red-500" : "text-orange-500"
                      )} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {alert.source === 'sos' ? 'SOS Emergency' : alert.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    alert.status === 'resolved' ? "bg-green-500/20 text-green-500" :
                    alert.status === 'pending' ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-red-500/20 text-red-500"
                  )}>
                    {alert.status}
                  </span>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No alerts yet</p>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAlert(null);
        }}
        onUpdateStatus={handleUpdateStatus}
        userRole="police"
      />
    </div>
  );
};

export default PoliceDashboard;
