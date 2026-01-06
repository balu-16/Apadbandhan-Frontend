import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useAuth } from "@/contexts/AuthContext";
import { alertsAPI, sosAPI } from "@/services/api";
import { toast } from "sonner";
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
  Home,
  HandHelping,
  Building2,
  BadgeCheck,
  Trash2
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from "react-leaflet";
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

// Blinking SOS alert marker icon
const sosAlertIcon = L.divIcon({
  className: '',
  html: `
    <div style="position: relative; width: 40px; height: 40px; margin-left: -20px; margin-top: -20px;">
      <div style="position: absolute; top: 0; left: 0; width: 40px; height: 40px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: sos-pulse-ring 1.5s ease-out infinite;"></div>
      <div style="position: absolute; top: 0; left: 0; width: 40px; height: 40px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: sos-pulse-ring 1.5s ease-out infinite 0.5s;"></div>
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 40px;
        height: 40px;
        background: #ef4444;
        border: 3px solid #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
        animation: sos-blink 0.8s ease-in-out infinite;
      ">
        <span style="color: white; font-weight: bold; font-size: 14px;">🚨</span>
      </div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
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

interface RespondedByInfo {
  responderId: string;
  role: 'police' | 'hospital';
  name: string;
  phone: string;
  respondedAt: string;
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
  respondedBy?: RespondedByInfo[];
  currentSearchRadius?: number;
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
                  {/* Use blinking marker for active alerts, static for resolved */}
                  {alert.status !== 'resolved' ? (
                    <Marker
                      position={[alert.location!.latitude, alert.location!.longitude]}
                      icon={sosAlertIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold text-red-600">🚨 {alert.source === 'sos' ? 'SOS' : 'Alert'} Location</p>
                          <p className="text-xs mt-1">{user?.fullName || 'User in Distress'}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ) : (
                    <CircleMarker
                      center={[alert.location!.latitude, alert.location!.longitude]}
                      radius={12}
                      fillColor="#22c55e"
                      fillOpacity={0.9}
                      color="white"
                      weight={3}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold text-green-600">✓ Resolved</p>
                          <p className="text-xs mt-1">{user?.fullName || 'User'}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )}
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

          {/* Response Status Section - Shows both police and hospital status */}
          {alert.source === 'sos' && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <HandHelping className="w-4 h-4 text-primary" />
                Response Status
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Police Response Status */}
                {(() => {
                  const policeResponder = alert.respondedBy?.find(r => r.role === 'police');
                  return (
                    <div className={cn(
                      "rounded-xl p-4 border-2",
                      policeResponder
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-yellow-500/10 border-yellow-500/30"
                    )}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          policeResponder ? "bg-green-500/20" : "bg-blue-500/20"
                        )}>
                          <Shield className={cn(
                            "w-6 h-6",
                            policeResponder ? "text-green-500" : "text-blue-500"
                          )} />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-600">Police</p>
                          <Badge className={cn(
                            "text-xs",
                            policeResponder
                              ? "bg-green-500/20 text-green-600"
                              : "bg-yellow-500/20 text-yellow-600"
                          )}>
                            {policeResponder ? 'Responded' : 'Waiting'}
                          </Badge>
                        </div>
                      </div>
                      {policeResponder ? (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">{policeResponder.name}</p>
                          <p className="text-xs text-muted-foreground">
                            +91 {policeResponder.phone}
                          </p>
                          <p className="text-xs text-green-600">
                            Responded: {new Date(policeResponder.respondedAt).toLocaleString()}
                          </p>
                          <Button size="sm" variant="outline" className="w-full gap-1 mt-2" asChild>
                            <a href={`tel:+91${policeResponder.phone}`}>
                              <Phone className="w-3 h-3" /> Call Police
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Waiting for police to respond...
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Hospital Response Status */}
                {(() => {
                  const hospitalResponder = alert.respondedBy?.find(r => r.role === 'hospital');
                  return (
                    <div className={cn(
                      "rounded-xl p-4 border-2",
                      hospitalResponder
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-yellow-500/10 border-yellow-500/30"
                    )}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          hospitalResponder ? "bg-green-500/20" : "bg-red-500/20"
                        )}>
                          <Building2 className={cn(
                            "w-6 h-6",
                            hospitalResponder ? "text-green-500" : "text-red-500"
                          )} />
                        </div>
                        <div>
                          <p className="font-semibold text-red-600">Hospital</p>
                          <Badge className={cn(
                            "text-xs",
                            hospitalResponder
                              ? "bg-green-500/20 text-green-600"
                              : "bg-yellow-500/20 text-yellow-600"
                          )}>
                            {hospitalResponder ? 'Responded' : 'Waiting'}
                          </Badge>
                        </div>
                      </div>
                      {hospitalResponder ? (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">{hospitalResponder.name}</p>
                          <p className="text-xs text-muted-foreground">
                            +91 {hospitalResponder.phone}
                          </p>
                          <p className="text-xs text-green-600">
                            Responded: {new Date(hospitalResponder.respondedAt).toLocaleString()}
                          </p>
                          <Button size="sm" variant="outline" className="w-full gap-1 mt-2" asChild>
                            <a href={`tel:+91${hospitalResponder.phone}`}>
                              <Phone className="w-3 h-3" /> Call Hospital
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Waiting for hospital to respond...
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Search radius info */}
              {alert.currentSearchRadius && alert.status !== 'resolved' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Navigation className="w-3 h-3" />
                  Current search radius: {(alert.currentSearchRadius / 1000).toFixed(0)}km
                </div>
              )}
            </div>
          )}

          {/* All Responders List (if multiple of same type) */}
          {alert.respondedBy && alert.respondedBy.length > 2 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Users className="w-4 h-4 text-green-500" />
                All Responders ({alert.respondedBy.length})
              </h3>
              <div className="space-y-2">
                {alert.respondedBy.map((responder, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        responder.role === 'hospital'
                          ? "bg-red-500/20"
                          : "bg-blue-500/20"
                      )}>
                        {responder.role === 'hospital' ? (
                          <Building2 className="w-5 h-5 text-red-500" />
                        ) : (
                          <Shield className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{responder.name}</p>
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            responder.role === 'hospital'
                              ? "border-red-500/50 text-red-500 bg-red-500/10"
                              : "border-blue-500/50 text-blue-500 bg-blue-500/10"
                          )}>
                            {responder.role === 'hospital' ? 'Hospital' : 'Police'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          +91 {responder.phone} • {new Date(responder.respondedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1" asChild>
                      <a href={`tel:+91${responder.phone}`}>
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
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
  const { userRole, user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    resolved: number;
    alerts: { total: number; pending: number; resolved: number };
    sos: { total: number; pending: number; resolved: number };
  } | null>(null);

  const isResponder = portalType === 'police' || portalType === 'hospital';
  const canDelete = portalType === 'superadmin' || userRole === 'user';

  const fetchAlerts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);


    try {
      let alertsRes, statsRes;

      if (portalType === 'police') {
        // Use police-specific APIs
        const { policeAPI } = await import('@/services/api');
        [alertsRes, statsRes] = await Promise.all([
          policeAPI.getAllAlerts(),
          policeAPI.getStats(),
        ]);

        // Adapt police stats to match AlertsPage expected shape
        const policeStats = statsRes.data;
        statsRes = {
          data: {
            total: policeStats.totalAlerts || 0,
            pending: policeStats.pendingAlerts || 0,
            resolved: policeStats.resolvedAlerts || 0,
            alerts: { total: policeStats.totalAlerts || 0, pending: policeStats.pendingAlerts || 0, resolved: policeStats.resolvedAlerts || 0 },
            sos: { total: 0, pending: 0, resolved: 0 } // Police stats don't separate SOS currently
          }
        };
      } else if (portalType === 'hospital') {
        const { hospitalAPI } = await import('@/services/api');
        [alertsRes, statsRes] = await Promise.all([
          hospitalAPI.getAllAlerts(),
          hospitalAPI.getStats(),
        ]);
        // Adapt hospital stats if needed (assuming similar to police or alerts)
        // For now using same adaptation as police for safety if structure matches
        const hospStats = statsRes.data;
        statsRes = {
          data: {
            total: hospStats.totalAlerts || hospStats.total || 0,
            pending: hospStats.pendingAlerts || hospStats.pending || 0,
            resolved: hospStats.resolvedAlerts || hospStats.resolved || 0,
            alerts: { total: 0, pending: 0, resolved: 0 },
            sos: { total: 0, pending: 0, resolved: 0 }
          }
        };
      } else {
        // Admin / SuperAdmin uses generic combined API with pagination
        [alertsRes, statsRes] = await Promise.all([
          alertsAPI.getCombined(sourceFilter, {
            page,
            limit: 10,
          }),
          alertsAPI.getCombinedStats(),
        ]);
      }

      // Handle paginated response structure { data: [...], meta: {...} } or direct array
      const alertsData = Array.isArray(alertsRes.data) 
        ? alertsRes.data 
        : (alertsRes.data?.data || []);
      setAlerts(alertsData);
      
      // Set pagination info for admin/superadmin
      if (portalType === 'admin' || portalType === 'superadmin') {
        setTotalPages(alertsRes.data?.meta?.totalPages || 1);
        setTotalItems(alertsRes.data?.meta?.total || alertsData.length);
      }
      setStats(statsRes.data);
    } catch {
      setAlerts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sourceFilter, page, portalType]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [sourceFilter, debouncedSearchQuery]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleViewAlert = async (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
    
    // Mark the alert as viewed by this user (reduces sidebar badge count)
    try {
      await alertsAPI.markAsViewed(alert._id, alert.source || 'alert');
      // Dispatch custom event to notify sidebars to refresh their badge count
      window.dispatchEvent(new CustomEvent('alert-viewed'));
    } catch (error) {
      // Silently fail - viewing should still work even if marking fails
      console.error('Failed to mark alert as viewed:', error);
    }
  };

  const handleRespondToAlert = async (alert: Alert) => {
    if (!alert.source || alert.source !== 'sos') {
      toast.error("Can only respond to SOS alerts");
      return;
    }

    setRespondingToId(alert._id);
    try {
      await sosAPI.respond(alert._id);
      toast.success("Successfully responded to alert! The user has been notified.");
      fetchAlerts(true);
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (error as any).response?.data?.message || "Failed to respond to alert";
      toast.error(message);
    } finally {
      setRespondingToId(null);
    }
  };

  const hasUserResponded = (alert: Alert): boolean => {
    if (!user?.id || !alert.respondedBy) return false;
    return alert.respondedBy.some(r => r.responderId === user.id);
  };

  const handleDeleteClick = (alert: Alert) => {
    setAlertToDelete(alert);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!alertToDelete) return;

    setDeletingId(alertToDelete._id);
    try {
      const source = alertToDelete.source || 'alert';
      await alertsAPI.delete(alertToDelete._id, source);
      toast.success(`${source === 'sos' ? 'SOS alert' : 'Alert'} deleted successfully`);
      // Dispatch event to refresh sidebar badge count
      window.dispatchEvent(new CustomEvent('alert-viewed'));
      fetchAlerts(true);
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (error as any).response?.data?.message || "Failed to delete alert";
      toast.error(message);
    } finally {
      setDeletingId(null);
      setAlertToDelete(null);
      setIsDeleteDialogOpen(false);
    }
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
              className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => handleViewAlert(alert)}
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
                  {/* Show responder badges */}
                  {alert.respondedBy && alert.respondedBy.length > 0 && (
                    <div className="flex items-center gap-1">
                      {alert.respondedBy.some(r => r.role === 'hospital') && (
                        <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/30 gap-1">
                          <Building2 className="w-3 h-3" />
                          Hospital
                        </Badge>
                      )}
                      {alert.respondedBy.some(r => r.role === 'police') && (
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 gap-1">
                          <Shield className="w-3 h-3" />
                          Police
                        </Badge>
                      )}
                    </div>
                  )}
                  <Badge className={cn(
                    alert.status === 'resolved'
                      ? "bg-green-500/20 text-green-500"
                      : alert.status === 'responding'
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-red-500/20 text-red-500"
                  )}>
                    {alert.status === 'responding' 
                      ? (alert.respondedBy && 
                         alert.respondedBy.some(r => r.role === 'police') && 
                         alert.respondedBy.some(r => r.role === 'hospital') 
                           ? 'responded' 
                           : 'responding')
                      : (alert.status || 'pending')}
                  </Badge>
                  {/* Respond button for police/hospital on SOS alerts */}
                  {isResponder && alert.source === 'sos' && alert.status !== 'resolved' && (
                    <Button
                      variant={hasUserResponded(alert) ? "secondary" : "default"}
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleRespondToAlert(alert); }}
                      disabled={respondingToId === alert._id || hasUserResponded(alert)}
                      className={cn(
                        "gap-1",
                        hasUserResponded(alert)
                          ? "bg-green-500/20 text-green-600 hover:bg-green-500/30"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      )}
                    >
                      {respondingToId === alert._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : hasUserResponded(alert) ? (
                        <BadgeCheck className="w-4 h-4" />
                      ) : (
                        <HandHelping className="w-4 h-4" />
                      )}
                      {hasUserResponded(alert) ? 'Responded' : 'Respond'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleViewAlert(alert); }}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                  {/* Delete button for superadmin and user */}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(alert); }}
                      disabled={deletingId === alert._id}
                      className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30"
                    >
                      {deletingId === alert._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </Button>
                  )}
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

      {/* Pagination Controls - Only show for admin/superadmin */}
      {(portalType === 'admin' || portalType === 'superadmin') && totalPages > 0 && (
        <div className="mt-6">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Alert Details Modal */}
      <AlertDetailsModal
        alert={selectedAlert}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {alertToDelete?.source === 'sos' ? 'SOS alert' : 'alert'}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deletingId ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AlertsPage;
