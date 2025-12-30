import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Smartphone, 
  Bell, 
  MapPin, 
  FileText, 
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { devicesAPI, alertsAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description: string;
  delay: string;
  trend?: string;
  isLoading?: boolean;
}

const StatCard = ({ icon: Icon, title, value, description, delay, trend, isLoading }: StatCardProps) => (
  <div 
    className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group animate-fade-up opacity-0"
    style={{ animationDelay: delay, animationFillMode: "forwards" }}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
        <Icon className="w-6 h-6 text-primary" />
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
      <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
    )}
    <p className="text-sm font-medium text-foreground mb-1">{title}</p>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

interface DashboardStats {
  deviceCount: number;
  onlineDevices: number;
  alertsCount: number;
  hasInsurance: boolean;
  locationEnabled: boolean;
}

interface Device {
  status: string;
  healthInsurance?: string;
  vehicleInsurance?: string;
  termInsurance?: string;
}

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    deviceCount: 0,
    onlineDevices: 0,
    alertsCount: 0,
    hasInsurance: false,
    locationEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          // User not logged in, show default state
          setIsLoading(false);
          return;
        }
        
        // Fetch devices
        const devicesResponse = await devicesAPI.getAll();
        const devices: Device[] = devicesResponse.data || [];
        
        // Fetch alert stats
        let alertStats = { total: 0 };
        try {
          const alertsResponse = await alertsAPI.getStats();
          alertStats = alertsResponse.data;
        } catch (e) {
          // Alerts API might not be ready
          console.log('Could not fetch alerts stats');
        }
        
        // Check if any device has insurance
        const hasInsurance = devices.some((d: Device) => 
          d.healthInsurance || d.vehicleInsurance || d.termInsurance
        );
        
        setStats({
          deviceCount: devices.length,
          onlineDevices: devices.filter((d: Device) => d.status === 'online').length,
          alertsCount: alertStats.total || 0,
          hasInsurance,
          locationEnabled: user?.locationTracking ?? true,
        });
      } catch (error: unknown) {
        // Don't log auth errors
        const err = error as AxiosErrorLike;
        if (err.response?.status !== 401) {
          console.error('Error fetching dashboard data:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="mb-12 animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-muted/50 border border-border/50 p-8 lg:p-12">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <Activity className="w-4 h-4 animate-pulse" />
                System Active
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Welcome to <span className="text-gradient-orange">Apadbandhav</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                Real-time accident detection using AIoT sensors. Monitor your devices, 
                manage emergency contacts, and stay protected on every journey.
              </p>
            </div>
            
            {/* Hero Illustration */}
            <div className="relative">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-float">
                <Shield className="w-32 h-32 text-primary/50" />
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center animate-float" style={{ animationDelay: "0.5s" }}>
                <AlertTriangle className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center animate-float" style={{ animationDelay: "1s" }}>
                <MapPin className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Dashboard Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Smartphone}
            title="Connected Devices"
            value={stats.deviceCount}
            description={`${stats.onlineDevices} device${stats.onlineDevices !== 1 ? 's' : ''} currently online`}
            delay="0.2s"
            isLoading={isLoading}
            trend={stats.onlineDevices > 0 ? `${stats.onlineDevices} online` : undefined}
          />
          <StatCard
            icon={Bell}
            title="Alerts Sent"
            value={stats.alertsCount}
            description="Total emergency alerts triggered"
            delay="0.3s"
            isLoading={isLoading}
          />
          <StatCard
            icon={MapPin}
            title="Location Tracking"
            value={stats.locationEnabled ? "Enabled" : "Disabled"}
            description="Real-time GPS tracking status"
            delay="0.4s"
            isLoading={isLoading}
          />
          <StatCard
            icon={FileText}
            title="Insurance Details"
            value={stats.hasInsurance ? "Stored" : "Not Set"}
            description={stats.hasInsurance ? "Insurance details linked" : "Add insurance to your devices"}
            delay="0.5s"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="animate-fade-up" style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            to="/dashboard/add-device" 
            className="group bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              Add New Device
            </h3>
            <p className="text-sm text-muted-foreground">
              Scan QR code to register a new AIoT device
            </p>
          </Link>
          
          <Link 
            to="/dashboard/devices" 
            className="group bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              View Devices
            </h3>
            <p className="text-sm text-muted-foreground">
              Monitor all connected devices and locations
            </p>
          </Link>
          
          <Link 
            to="/dashboard/settings" 
            className="group bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              Manage Settings
            </h3>
            <p className="text-sm text-muted-foreground">
              Update profile and notification preferences
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;
