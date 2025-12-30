import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { alertsAPI, sosAPI } from "@/services/api";
import { 
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Eye,
  X,
  Car,
  Siren
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserInfo {
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
}

interface Alert {
  _id: string;
  type: string;
  source?: 'alert' | 'sos';
  status: string;
  severity?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

interface SosEvent {
  _id: string;
  status: string;
  victimLocation?: {
    coordinates: [number, number];
  };
  createdAt: string;
  resolvedAt?: string;
}

const AlertDetailsModal = ({ alert, open, onOpenChange }: { alert: Alert | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {alert.source === 'sos' ? (
              <Siren className="w-5 h-5 text-purple-500" />
            ) : (
              <Car className="w-5 h-5 text-orange-500" />
            )}
            {alert.type} Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={cn(
                alert.status === 'resolved' 
                  ? "bg-green-500/20 text-green-500" 
                  : "bg-red-500/20 text-red-500"
              )}>
                {alert.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge variant="outline">
                {alert.source === 'sos' ? 'SOS' : 'Accident'}
              </Badge>
            </div>
          </div>
          
          {alert.location && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <span>
                  {alert.location.address || `${alert.location.latitude?.toFixed(6)}, ${alert.location.longitude?.toFixed(6)}`}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{new Date(alert.createdAt).toLocaleString()}</p>
            </div>
            {alert.resolvedAt && (
              <div>
                <p className="text-muted-foreground">Resolved</p>
                <p>{new Date(alert.resolvedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UserAlertsPage = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUserAlerts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Fetch user's SOS history
      const sosResponse = await sosAPI.getHistory();
      const sosEvents: SosEvent[] = Array.isArray(sosResponse.data) ? sosResponse.data : [];
      
      // Convert SOS events to alert format
      const userAlerts: Alert[] = sosEvents.map((sos) => ({
        _id: sos._id,
        type: 'SOS',
        source: 'sos' as const,
        status: sos.status,
        severity: 'critical',
        location: sos.victimLocation ? {
          latitude: sos.victimLocation.coordinates[1],
          longitude: sos.victimLocation.coordinates[0],
        } : undefined,
        createdAt: sos.createdAt,
        resolvedAt: sos.resolvedAt,
      }));

      // Sort by date descending
      userAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAlerts(userAlerts);
    } catch (error: unknown) {
      console.error("Failed to fetch user alerts:", error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAlerts();
  }, [fetchUserAlerts]);

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const filteredAlerts = alerts.filter(alert => {
    const searchLower = searchQuery.toLowerCase();
    const alertType = alert.type || '';
    const alertStatus = alert.status || '';
    return alertType.toLowerCase().includes(searchLower) || 
           alertStatus.toLowerCase().includes(searchLower);
  });

  const stats = {
    total: alerts.length,
    pending: alerts.filter(a => a.status !== 'resolved').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-7 h-7 text-orange-500" />
            My Alerts
          </h1>
          <p className="text-muted-foreground">View all SOS alerts you have raised</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchUserAlerts(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by type or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
          <p className="text-xs text-muted-foreground">Resolved</p>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div 
              key={alert._id}
              className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    alert.source === 'sos' 
                      ? "bg-purple-500/20" 
                      : alert.status === 'resolved' 
                        ? "bg-green-500/20" 
                        : "bg-orange-500/20"
                  )}>
                    {alert.source === 'sos' ? (
                      <Siren className="w-6 h-6 text-purple-500" />
                    ) : alert.status === 'resolved' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Car className="w-6 h-6 text-orange-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{alert.type || 'Alert'}</p>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        alert.source === 'sos' 
                          ? "border-purple-500/50 text-purple-500" 
                          : "border-orange-500/50 text-orange-500"
                      )}>
                        {alert.source === 'sos' ? 'SOS' : 'Accident'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    alert.status === 'resolved' 
                      ? "bg-green-500/20 text-green-500" 
                      : "bg-red-500/20 text-red-500"
                  )}>
                    {alert.status || 'pending'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAlert(alert)}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Alerts Found</h3>
          <p className="text-muted-foreground">
            You haven't raised any SOS alerts yet
          </p>
        </div>
      )}

      {/* Alert Details Modal */}
      <AlertDetailsModal
        alert={selectedAlert}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default UserAlertsPage;
