import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Clock,
  Heart,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Navigation,
  Droplet,
  FileText,
  Shield,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
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

interface AlertData {
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

interface AlertDetailModalProps {
  alert: AlertData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (alertId: string, status: string, notes?: string) => Promise<void>;
  userRole: 'police' | 'hospital';
}

const AlertDetailModal = ({
  alert,
  isOpen,
  onClose,
  onUpdateStatus,
  userRole,
}: AlertDetailModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<'user' | 'location'>('user');

  if (!alert) return null;

  const user = alert.userId;
  const location = alert.location;

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(alert._id, newStatus, notes || undefined);
      onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'assigned':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'dispatched':
      case 'responding':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-500';
      case 'high':
        return 'bg-orange-500/20 text-orange-500';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'low':
        return 'bg-green-500/20 text-green-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const openInMaps = () => {
    if (location?.latitude && location?.longitude) {
      window.open(
        `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              alert.source === 'sos' ? "bg-red-500/20" : "bg-orange-500/20"
            )}>
              <AlertTriangle className={cn(
                "w-5 h-5",
                alert.source === 'sos' ? "text-red-500" : "text-orange-500"
              )} />
            </div>
            <div>
              <span className="text-xl">
                {alert.source === 'sos' ? 'SOS Emergency' : `${alert.type} Alert`}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-xs", getStatusColor(alert.status))}>
                  {alert.status}
                </Badge>
                {alert.severity && (
                  <Badge className={cn("text-xs", getSeverityColor(alert.severity))}>
                    {alert.severity}
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('user')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
              activeTab === 'user'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="w-4 h-4" />
            User Details
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
              activeTab === 'location'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="w-4 h-4" />
            Alert Location
          </button>
        </div>

        {/* User Details Tab */}
        {activeTab === 'user' && (
          <div className="space-y-4">
            {user ? (
              <>
                {/* Basic Info */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="font-medium">{user.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a href={`tel:${user.phone}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {user.phone || 'N/A'}
                      </a>
                    </div>
                    {user.email && (
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    )}
                    {user.address && (
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium">{user.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Info */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Group</p>
                      <p className="font-medium flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-red-500" />
                        {user.bloodGroup || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Medical Conditions</p>
                      <p className="font-medium">
                        {user.medicalConditions?.length
                          ? user.medicalConditions.join(', ')
                          : 'None reported'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contacts */}
                {user.emergencyContacts && user.emergencyContacts.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Emergency Contacts
                    </h3>
                    <div className="space-y-2">
                      {user.emergencyContacts.map((contact, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-background rounded-lg">
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.relation}</p>
                          </div>
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Devices */}
                {user.devices && user.devices.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      Registered Devices
                    </h3>
                    <div className="space-y-2">
                      {user.devices.map((device, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-background rounded-lg">
                          <div>
                            <p className="font-medium">{device.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{device.code}</p>
                          </div>
                          <Badge className={cn(
                            "text-xs",
                            device.status === 'online'
                              ? "bg-green-500/20 text-green-500"
                              : "bg-gray-500/20 text-gray-500"
                          )}>
                            {device.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>User information not available</p>
              </div>
            )}
          </div>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <div className="space-y-4">
            {location ? (
              <>
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Alert Triggered Location
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Latitude</p>
                        <p className="font-mono font-medium">{location.latitude?.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Longitude</p>
                        <p className="font-mono font-medium">{location.longitude?.toFixed(6)}</p>
                      </div>
                    </div>
                    {location.address && (
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium">{location.address}</p>
                      </div>
                    )}
                    {(location.city || location.state) && (
                      <div>
                        <p className="text-xs text-muted-foreground">City/State</p>
                        <p className="font-medium">
                          {[location.city, location.state].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={openInMaps}
                  className="w-full"
                  variant="outline"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Open in Google Maps
                </Button>

                {/* Map Preview */}
                <div className="rounded-xl overflow-hidden border border-border h-48">
                  <MapContainer
                    center={[location.latitude, location.longitude]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <CircleMarker
                      center={[location.latitude, location.longitude]}
                      radius={12}
                      fillColor="#ef4444"
                      fillOpacity={0.9}
                      color="white"
                      weight={3}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold text-red-600">🚨 Alert Location</p>
                          <p className="text-xs mt-1">{user?.fullName || 'User in Distress'}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </MapContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Location information not available</p>
              </div>
            )}
          </div>
        )}

        {/* Alert Timestamp */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
          <Clock className="w-4 h-4" />
          <span>Alert triggered: {new Date(alert.createdAt).toLocaleString()}</span>
        </div>

        {/* Response Actions */}
        {alert.status !== 'resolved' && (
          <div className="space-y-4 mt-4 pt-4 border-t border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Response Actions
            </h3>

            <Textarea
              placeholder="Add notes about your response..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />

            <div className="flex gap-2">
              {alert.status === 'pending' || alert.status === 'assigned' ? (
                <Button
                  onClick={() => handleStatusUpdate('responding')}
                  disabled={isUpdating}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Building2 className="w-4 h-4 mr-2" />
                  )}
                  {userRole === 'hospital' ? 'Accept & Respond' : 'Accept & Dispatch'}
                </Button>
              ) : null}

              <Button
                onClick={() => handleStatusUpdate('resolved')}
                disabled={isUpdating}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Mark Resolved
              </Button>

              <Button
                onClick={() => handleStatusUpdate('false_alarm')}
                disabled={isUpdating}
                variant="outline"
                className="text-red-500 border-red-500/30 hover:bg-red-500/10"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                False Alarm
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AlertDetailModal;
