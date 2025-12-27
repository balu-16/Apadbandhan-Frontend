import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { alertsAPI } from "@/services/api";
import { 
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  User,
  Phone,
  Mail,
  RefreshCw,
  Search,
  Eye,
  X
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
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Alert {
  _id: string;
  deviceId: any;
  userId: any;
  type: string;
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

interface AlertDetailsModalProps {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDetailsModal = ({ alert, open, onOpenChange }: AlertDetailsModalProps) => {
  if (!alert) return null;

  const user = alert.userId;
  const hasLocation = alert.location?.latitude && alert.location?.longitude;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              alert.status === 'resolved' ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              {alert.status === 'resolved' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{alert.type || 'SOS Alert'}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge className={cn(
              "ml-auto",
              alert.status === 'resolved' 
                ? "bg-green-500/20 text-green-500" 
                : "bg-red-500/20 text-red-500"
            )}>
              {alert.status || 'pending'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* User Information */}
          {user && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                User Information
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{user.fullName || user.name || 'Unknown User'}</p>
                  <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        +91 {user.phone}
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Location */}
          {hasLocation && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                Current Location
              </h3>
              
              {/* Map */}
              <div className="rounded-xl overflow-hidden border border-border h-[250px] mb-3">
                <MapContainer
                  center={[alert.location!.latitude, alert.location!.longitude]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[alert.location!.latitude, alert.location!.longitude]}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold text-red-600">🚨 Alert Location</p>
                        <p className="text-xs mt-1">{user?.fullName || 'User'}</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Latitude</p>
                  <p className="font-mono font-medium">{alert.location!.latitude.toFixed(6)}</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Longitude</p>
                  <p className="font-mono font-medium">{alert.location!.longitude.toFixed(6)}</p>
                </div>
              </div>
              {alert.location?.address && (
                <div className="mt-3 bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{alert.location.address}</p>
                </div>
              )}
            </div>
          )}

          {/* Alert Details */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3">Alert Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium">{alert.type || 'SOS'}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Severity</p>
                <p className="font-medium capitalize">{alert.severity || 'High'}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Created At</p>
                <p className="font-medium">{new Date(alert.createdAt).toLocaleString()}</p>
              </div>
              {alert.resolvedAt && (
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Resolved At</p>
                  <p className="font-medium">{new Date(alert.resolvedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface AlertsPageProps {
  portalType: 'police' | 'hospital' | 'admin' | 'superadmin';
}

const AlertsPage = ({ portalType }: AlertsPageProps) => {
  const { userRole } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await alertsAPI.getAll();
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const filteredAlerts = alerts.filter(alert => {
    const searchLower = searchQuery.toLowerCase();
    const userName = alert.userId?.fullName || alert.userId?.name || '';
    const alertType = alert.type || '';
    return userName.toLowerCase().includes(searchLower) || 
           alertType.toLowerCase().includes(searchLower);
  });

  const getPortalColor = () => {
    switch (portalType) {
      case 'police': return 'blue';
      case 'hospital': return 'red';
      default: return 'primary';
    }
  };

  const color = getPortalColor();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-12 h-12 text-${color}-500 animate-spin`} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className={`w-7 h-7 text-orange-500`} />
            Emergency Alerts
          </h1>
          <p className="text-muted-foreground">View and respond to emergency SOS alerts</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchAlerts(true)}
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
          placeholder="Search by user name or alert type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
          <p className="text-xs text-muted-foreground">Total Alerts</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-500">
            {alerts.filter(a => a.status !== 'resolved').length}
          </p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">
            {alerts.filter(a => a.status === 'resolved').length}
          </p>
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
                    alert.status === 'resolved' ? "bg-green-500/20" : "bg-red-500/20"
                  )}>
                    {alert.status === 'resolved' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{alert.type || 'SOS Alert'}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.userId?.fullName || 'Unknown User'} • {new Date(alert.createdAt).toLocaleString()}
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
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border/50 rounded-xl">
          <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Alerts Found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "No alerts match your search" : "No emergency alerts have been received"}
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

export default AlertsPage;
