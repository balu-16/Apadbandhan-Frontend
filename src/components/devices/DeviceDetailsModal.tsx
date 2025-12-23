import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  MapPin,
  User,
  Phone,
  Shield,
  Heart,
  Car,
  FileText,
  Clock,
  Wifi,
  WifiOff,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const deviceIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  isActive?: boolean;
}

interface Insurance {
  healthInsuranceNumber?: string;
  healthInsuranceProvider?: string;
  vehicleInsuranceNumber?: string;
  vehicleInsuranceProvider?: string;
  termInsuranceNumber?: string;
  termInsuranceProvider?: string;
}

interface Location {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lastUpdatedAt?: string;
}

interface Device {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  type?: string;
  status?: string;
  location?: Location;
  emergencyContacts?: EmergencyContact[];
  insurance?: Insurance;
  batteryLevel?: number;
  lastOnlineAt?: string;
  registeredAt?: string;
  createdAt?: string;
}

interface DeviceDetailsModalProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeviceDetailsModal = ({ device, open, onOpenChange }: DeviceDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("info");

  if (!device) return null;

  const hasLocation = device.location?.latitude && device.location?.longitude;
  const lat = device.location?.latitude || 20.5937; // Default to India center
  const lng = device.location?.longitude || 78.9629;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{device.name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{device.code}</p>
            </div>
            <Badge
              variant={device.status === "online" ? "default" : "secondary"}
              className={cn(
                "ml-auto",
                device.status === "online" 
                  ? "bg-green-500/20 text-green-500" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {device.status === "online" ? (
                <Wifi className="w-3 h-3 mr-1" />
              ) : (
                <WifiOff className="w-3 h-3 mr-1" />
              )}
              {device.status || "offline"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="gap-2">
              <FileText className="w-4 h-4" />
              Device Information
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <MapPin className="w-4 h-4" />
              Location Map
            </TabsTrigger>
          </TabsList>

          {/* Device Information Tab */}
          <TabsContent value="info" className="mt-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  Device Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium">{device.type || "Vehicle"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className={cn(
                      "ml-2 font-medium",
                      device.status === "online" ? "text-green-500" : "text-muted-foreground"
                    )}>
                      {device.status || "offline"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Battery:</span>
                    <span className="ml-2 font-medium">{device.batteryLevel || 0}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Registered:</span>
                    <span className="ml-2 font-medium">{formatDate(device.registeredAt || device.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              {device.emergencyContacts && device.emergencyContacts.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Emergency Contacts ({device.emergencyContacts.length})
                  </h3>
                  <div className="space-y-3">
                    {device.emergencyContacts.map((contact, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-background/50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.relation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm font-mono">{contact.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurance Information */}
              {device.insurance && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Insurance Information
                  </h3>
                  <div className="space-y-3">
                    {device.insurance.healthInsuranceNumber && (
                      <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                        <Heart className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Health Insurance</p>
                          <p className="font-mono">{device.insurance.healthInsuranceNumber}</p>
                        </div>
                      </div>
                    )}
                    {device.insurance.vehicleInsuranceNumber && (
                      <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                        <Car className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Vehicle Insurance</p>
                          <p className="font-mono">{device.insurance.vehicleInsuranceNumber}</p>
                        </div>
                      </div>
                    )}
                    {device.insurance.termInsuranceNumber && (
                      <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                        <FileText className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Term Insurance</p>
                          <p className="font-mono">{device.insurance.termInsuranceNumber}</p>
                        </div>
                      </div>
                    )}
                    {!device.insurance.healthInsuranceNumber && 
                     !device.insurance.vehicleInsuranceNumber && 
                     !device.insurance.termInsuranceNumber && (
                      <p className="text-muted-foreground text-sm">No insurance information added</p>
                    )}
                  </div>
                </div>
              )}

              {/* Location Info */}
              {device.location && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary" />
                    Last Known Location
                  </h3>
                  <div className="space-y-2 text-sm">
                    {device.location.address && (
                      <p><span className="text-muted-foreground">Address:</span> {device.location.address}</p>
                    )}
                    {hasLocation && (
                      <p>
                        <span className="text-muted-foreground">Coordinates:</span>{" "}
                        <span className="font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                      </p>
                    )}
                    {device.location.lastUpdatedAt && (
                      <p>
                        <span className="text-muted-foreground">Updated:</span>{" "}
                        {formatDate(device.location.lastUpdatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="mt-4">
            <div className="rounded-xl overflow-hidden border border-border">
              {hasLocation ? (
                <div className="h-[400px] w-full">
                  <MapContainer
                    center={[lat, lng]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lng]} icon={deviceIcon}>
                      <Popup>
                        <div className="text-center">
                          <strong>{device.name}</strong>
                          <br />
                          <span className="text-sm">{device.code}</span>
                          {device.location?.address && (
                            <>
                              <br />
                              <span className="text-xs text-gray-600">{device.location.address}</span>
                            </>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="h-[400px] w-full flex flex-col items-center justify-center bg-muted/30">
                  <MapPin className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-lg font-medium">No Location Data</p>
                  <p className="text-muted-foreground text-sm">
                    Device location will appear here once the device comes online
                  </p>
                </div>
              )}
            </div>

            {/* Location Details */}
            {hasLocation && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Latitude</p>
                  <p className="font-mono text-lg">{lat.toFixed(6)}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Longitude</p>
                  <p className="font-mono text-lg">{lng.toFixed(6)}</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsModal;
