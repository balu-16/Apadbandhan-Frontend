import { useState, useEffect, useCallback } from "react";
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
  X,
  Filter,
  Car,
  Siren,
  Smartphone,
  Heart,
  Calendar,
  Shield,
  Users,
  Navigation,
  Droplets,
  AlertCircle,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

interface DeviceInfo {
  _id: string;
  name: string;
  code: string;
  status: string;
}

interface UserInfo {
  _id?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  emergencyContacts?: EmergencyContact[];
  bloodGroup?: string;
  medicalConditions?: string[];
  address?: string;
  devices?: DeviceInfo[];
}

interface Alert {
  _id: string;
  deviceId?: string | { _id: string; name: string; code: string };
  userId?: UserInfo;
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

type SourceFilter = 'all' | 'alert' | 'sos';

interface AlertDetailsModalProps {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDetailsModal = ({ alert, open, onOpenChange }: AlertDetailsModalProps) => {
  if (!alert) return null;

  const user = alert.userId as UserInfo | undefined;
  const hasLocation = alert.location?.latitude && alert.location?.longitude;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 [&>button]:hidden">
        {/* Custom Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 rounded-full bg-muted/80 hover:bg-muted"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Header */}
        <div className={cn(
          "p-6 pb-4",
          alert.source === 'sos' 
            ? "bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent"
            : "bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent"
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center ring-4",
                alert.source === 'sos' 
                  ? "bg-purple-500/20 ring-purple-500/10"
                  : "bg-orange-500/20 ring-orange-500/10"
              )}>
                {alert.source === 'sos' ? (
                  <Siren className="w-8 h-8 text-purple-500" />
                ) : (
                  <Car className="w-8 h-8 text-orange-500" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{alert.type || 'Emergency Alert'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn(
                    alert.source === 'sos' 
                      ? "bg-purple-500/20 text-purple-500 border-purple-500/30"
                      : "bg-orange-500/20 text-orange-500 border-orange-500/30"
                  )}>
                    {alert.source === 'sos' ? 'SOS Alert' : 'Accident Alert'}
                  </Badge>
                  <Badge className={cn(
                    alert.status === 'resolved' 
                      ? "bg-green-500/20 text-green-500" 
                      : "bg-red-500/20 text-red-500"
                  )}>
                    {alert.status || 'pending'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Location Map - Priority Section */}
          {hasLocation && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Navigation className="w-4 h-4 text-red-500" />
                Emergency Location
              </h3>
              
              {/* Map */}
              <div className="rounded-xl overflow-hidden border border-border h-[200px] mb-3">
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
                        <p className="font-semibold text-red-600">🚨 {alert.source === 'sos' ? 'SOS' : 'Alert'} Location</p>
                        <p className="text-xs mt-1">{user?.fullName || 'User in Distress'}</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              {/* Coordinates & Address */}
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
              
              {/* Open in Maps Button */}
              <Button 
                variant="outline" 
                className="w-full mt-3 gap-2"
                onClick={() => window.open(`https://www.google.com/maps?q=${alert.location!.latitude},${alert.location!.longitude}`, '_blank')}
              >
                <Navigation className="w-4 h-4" />
                Open in Google Maps
              </Button>
            </div>
          )}

          {/* User Information - Complete Details */}
          {user && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <User className="w-4 h-4 text-primary" />
                Victim Information
              </h3>
              
              {/* User Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-xl">{user.fullName || user.name || 'Unknown User'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.role && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </Badge>
                    )}
                    {user.isActive !== undefined && (
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        user.isActive ? "text-green-500" : "text-red-500"
                      )}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 mb-4">
                {user.phone && (
                  <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="font-medium font-mono">+91 {user.phone}</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1" asChild>
                      <a href={`tel:+91${user.phone}`}>
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    </Button>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Email Address</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Home className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Home Address</p>
                      <p className="font-medium">{user.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Medical Information */}
              {(user.bloodGroup || (user.medicalConditions && user.medicalConditions.length > 0)) && (
                <div className="border-t border-border/50 pt-4 mb-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Medical Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {user.bloodGroup && (
                      <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <Droplets className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Blood Group</p>
                          <p className="font-bold text-lg">{user.bloodGroup}</p>
                        </div>
                      </div>
                    )}
                    {user.createdAt && (
                      <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Member Since</p>
                          <p className="font-medium">{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {user.medicalConditions && user.medicalConditions.length > 0 && (
                    <div className="mt-3 bg-background/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Medical Conditions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {user.medicalConditions.map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Emergency Contacts */}
              {user.emergencyContacts && user.emergencyContacts.length > 0 && (
                <div className="border-t border-border/50 pt-4 mb-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    Emergency Contacts ({user.emergencyContacts.length})
                  </h4>
                  <div className="space-y-2">
                    {user.emergencyContacts.map((contact, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.relation} • +91 {contact.phone}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1" asChild>
                          <a href={`tel:+91${contact.phone}`}>
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User's Devices */}
              {user.devices && user.devices.length > 0 && (
                <div className="border-t border-border/50 pt-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    Registered Devices ({user.devices.length})
                  </h4>
                  <div className="space-y-2">
                    {user.devices.map((device, idx) => (
                      <div key={device._id || idx} className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{device.name}</p>
                            <p className="text-xs font-mono text-muted-foreground">{device.code}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(
                          device.status === "online" 
                            ? "bg-green-500/20 text-green-500 border-green-500/30"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {device.status || "offline"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alert Timeline */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              Alert Timeline
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Alert Type</p>
                <p className="font-medium">{alert.source === 'sos' ? 'SOS Emergency' : 'Accident Detection'}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Severity</p>
                <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/30">
                  {alert.severity || 'Critical'}
                </Badge>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Triggered At</p>
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
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    resolved: number;
    alerts: { total: number; pending: number; resolved: number };
    sos: { total: number; pending: number; resolved: number };
  } | null>(null);

  const fetchAlerts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [alertsResponse, statsResponse] = await Promise.all([
        alertsAPI.getCombined(sourceFilter),
        alertsAPI.getCombinedStats(),
      ]);
      setAlerts(Array.isArray(alertsResponse.data) ? alertsResponse.data : []);
      setStats(statsResponse.data);
    } catch (error: unknown) {
      console.error("Failed to fetch alerts:", error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sourceFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

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

  const getFilterLabel = () => {
    switch (sourceFilter) {
      case 'alert': return 'Accident Alerts';
      case 'sos': return 'SOS Alerts';
      default: return 'All Alerts';
    }
  };

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
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className={`w-7 h-7 text-orange-500`} />
            Emergency Alerts
          </h1>
          <p className="text-muted-foreground">View and respond to emergency alerts and SOS requests</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {getFilterLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setSourceFilter('all')}
                className={cn(sourceFilter === 'all' && "bg-accent")}
              >
                <Bell className="w-4 h-4 mr-2" />
                All Alerts
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSourceFilter('alert')}
                className={cn(sourceFilter === 'alert' && "bg-accent")}
              >
                <Car className="w-4 h-4 mr-2" />
                Accident Alerts
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSourceFilter('sos')}
                className={cn(sourceFilter === 'sos' && "bg-accent")}
              >
                <Siren className="w-4 h-4 mr-2" />
                SOS Alerts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAlerts(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
          </Button>
        </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{stats?.pending || 0}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{stats?.resolved || 0}</p>
          <p className="text-xs text-muted-foreground">Resolved</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Car className="w-4 h-4 text-orange-500" />
            <p className="text-2xl font-bold text-orange-500">{stats?.alerts?.total || 0}</p>
          </div>
          <p className="text-xs text-muted-foreground">Accidents</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Siren className="w-4 h-4 text-purple-500" />
            <p className="text-2xl font-bold text-purple-500">{stats?.sos?.total || 0}</p>
          </div>
          <p className="text-xs text-muted-foreground">SOS</p>
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
