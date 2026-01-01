import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, Tooltip } from "react-leaflet";
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
  QrCode,
  User,
  Phone,
  Mail,
  MapPin,
  Wifi,
  WifiOff,
  CheckCircle,
  X,
  Loader2,
  Trash2,
  FileText,
  Clock,
  History,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { adminAPI, deviceLocationsAPI } from "@/services/api";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

// Fix for default marker icons in Leaflet with Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Start point icon (green)
const startIcon = new L.DivIcon({
  className: 'custom-start-marker',
  html: `<div style="width: 24px; height: 24px; background: #22c55e; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// End point icon (arrow/destination)
const endIcon = new L.DivIcon({
  className: 'custom-end-marker',
  html: `<div style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 24px solid #ef4444; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Component to fit map bounds when locations change
const FitBoundsToMarkers = ({ locations }: { locations: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 1) {
      const bounds = L.latLngBounds(locations);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (locations.length === 1) {
      map.setView(locations[0], 13);
    }
  }, [locations, map]);
  return null;
};

interface LocationHistory {
  _id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  displayName?: string;
  speed?: number;
  heading?: number;
  recordedAt: string;
  isSOS?: boolean;
}

interface AssignedUser {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
}

interface Location {
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface QrCodeDevice {
  _id?: string;
  id?: string;
  deviceCode: string;
  deviceName: string;
  status: string;
  isAssigned: boolean;
  qrImageUrl: string;
  assignedUser: AssignedUser | null;
  createdAt: string;
}

interface RegisteredDevice {
  _id?: string | { $oid: string };
  id?: string;
  name: string;
  code: string;
  type: string;
  status: string;
  userId?: AssignedUser | string;
  location?: Location;
  isActive: boolean;
  createdAt: string;
  lastOnlineAt?: string;
}

interface DeviceDetailsPopupProps {
  device: QrCodeDevice | RegisteredDevice | null;
  deviceType: "qrcode" | "registered";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (device: QrCodeDevice | RegisteredDevice) => void;
}

const LOCATION_REFRESH_INTERVAL = 20000; // 20 seconds

const DeviceDetailsPopup = ({ device, deviceType, open, onOpenChange, onDelete }: DeviceDetailsPopupProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isQrCode = deviceType === "qrcode";
  const qrDevice = device as QrCodeDevice;
  const regDevice = device as RegisteredDevice;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // Calculate location values
  const hasLocation = !isQrCode && regDevice?.location?.latitude && regDevice?.location?.longitude;
  const hasLocationHistory = locationHistory.length > 0;

  const lat = hasLocationHistory
    ? locationHistory[locationHistory.length - 1].latitude
    : (regDevice?.location?.latitude || 20.5937);
  const lng = hasLocationHistory
    ? locationHistory[locationHistory.length - 1].longitude
    : (regDevice?.location?.longitude || 78.9629);

  // Route coordinates for polyline
  const routeCoordinates: [number, number][] = useMemo(() =>
    locationHistory.map(loc => [loc.latitude, loc.longitude]),
    [locationHistory]
  );

  // Map key to force re-render when locations change
  const mapKey = useMemo(() =>
    `admin-map-${locationHistory.length}-${lat}-${lng}`,
    [locationHistory.length, lat, lng]
  );

  // Get device ID
  const getDeviceId = useCallback((): string | null => {
    if (!device) return null;
    if (isQrCode) return null;
    const id = regDevice._id || regDevice.id;
    if (!id) return null;

    if (typeof id === 'object' && id !== null && '$oid' in id) {
      return (id as { $oid: string }).$oid;
    }

    if (typeof id === 'object' && typeof (id as { toString: () => string }).toString === 'function') {
      return (id as { toString: () => string }).toString();
    }

    return String(id);
  }, [device, isQrCode, regDevice]);

  // Fetch location history
  const fetchLocationHistory = useCallback(async (isInitialLoad = false) => {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    if (isInitialLoad) {
      setIsLoadingLocations(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await deviceLocationsAPI.getByDevice(deviceId);

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const sortedLocations = response.data.sort((a: LocationHistory, b: LocationHistory) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        );
        setLocationHistory(sortedLocations);
      } else {
        setLocationHistory([]);
      }
      setLastRefreshTime(new Date());
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      if (isInitialLoad) {
        setLocationHistory([]);
      }
    } finally {
      setIsLoadingLocations(false);
      setIsRefreshing(false);
    }
  }, [getDeviceId]);

  // Fetch QR code for registered devices
  const fetchQrCodeForDevice = useCallback(async () => {
    if (!regDevice?.code) return;
    setIsLoadingQr(true);
    try {
      const response = await adminAPI.getQrCodeByDeviceCode(regDevice.code);
      if (response.data && response.data.qrImageUrl) {
        setQrCodeUrl(response.data.qrImageUrl);
      } else {
        setQrCodeUrl(null);
      }
    } catch {
      setQrCodeUrl(null);
    } finally {
      setIsLoadingQr(false);
    }
  }, [regDevice?.code]);

  useEffect(() => {
    if (open && device && !isQrCode) {
      fetchQrCodeForDevice();
    }
  }, [open, device, isQrCode, fetchQrCodeForDevice]);

  // Fetch location history for registered devices
  useEffect(() => {
    if (!open || !device || isQrCode) {
      if (!open) {
        setLocationHistory([]);
        setIsLoadingLocations(false);
        setActiveTab("info");
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      }
      return;
    }

    fetchLocationHistory(true);

    // Auto-refresh for online devices
    if (regDevice.status === 'online') {
      refreshIntervalRef.current = setInterval(() => {
        fetchLocationHistory(false);
      }, LOCATION_REFRESH_INTERVAL);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [open, device, isQrCode, regDevice?.status, fetchLocationHistory]);

  const handleManualRefresh = useCallback(() => {
    fetchLocationHistory(false);
  }, [fetchLocationHistory]);

  if (!device) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper to get device ID as string (handles MongoDB $oid format)
  const getDeviceIdString = (id: string | { $oid: string } | undefined): string => {
    if (!id) return '';
    if (typeof id === 'object' && '$oid' in id) return id.$oid;
    return String(id);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "online":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "offline":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      case "available":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "assigned":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  // Get the QR image URL based on device type - always use device code for reliability
  const getQrImageUrl = () => {
    const deviceCode = isQrCode ? qrDevice.deviceCode : regDevice.code;
    if (deviceCode) {
      return `${apiUrl}/qrcodes/image/${deviceCode}`;
    }
    return null;
  };

  const qrImageUrl = getQrImageUrl();

  const handleDelete = () => {
    if (device && onDelete) {
      onDelete(device);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 [&>button]:hidden">
        {/* Action Buttons */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          {/* Delete Button - Only for QR codes */}
          {isQrCode && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-muted/80 hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-transparent p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center ring-4 ring-primary/10">
                {isQrCode ? (
                  <QrCode className="w-7 h-7 text-primary" />
                ) : (
                  <Smartphone className="w-7 h-7 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {isQrCode ? qrDevice.deviceName : regDevice.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded">
                    {isQrCode ? qrDevice.deviceCode : regDevice.code}
                  </code>
                  <Badge
                    variant="outline"
                    className={cn(getStatusColor(isQrCode ? qrDevice.status : regDevice.status))}
                  >
                    {(isQrCode ? qrDevice.status : regDevice.status) === "online" ? (
                      <Wifi className="w-3 h-3 mr-1" />
                    ) : (isQrCode ? qrDevice.status : regDevice.status) === "offline" ? (
                      <WifiOff className="w-3 h-3 mr-1" />
                    ) : (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {isQrCode ? qrDevice.status : regDevice.status}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 pt-2">
          {/* QR Code Devices - Original Layout */}
          {isQrCode ? (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Side - QR Code */}
              <div className="flex-shrink-0">
                <div className="bg-white rounded-xl p-4 shadow-lg w-48 h-48 flex items-center justify-center">
                  {qrImageUrl ? (
                    <img
                      src={qrImageUrl}
                      alt={`QR Code for ${qrDevice.deviceCode}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Crect x='3' y='3' width='7' height='7'/%3E%3Crect x='14' y='3' width='7' height='7'/%3E%3Crect x='3' y='14' width='7' height='7'/%3E%3Crect x='14' y='14' width='7' height='7'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <QrCode className="w-16 h-16 mb-2 opacity-30" />
                      <span className="text-xs">No QR Code</span>
                    </div>
                  )}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">Scan to register device</p>
              </div>

              {/* Right Side - QR Device Details */}
              <div className="flex-1 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Device Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-background/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium">QR Code</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className={cn("font-medium capitalize", getStatusColor(qrDevice.status).split(" ")[1])}>{qrDevice.status}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDateOnly(qrDevice.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {qrDevice.assignedUser && (
                  <div className="bg-muted/30 rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Assigned User</h3>
                    <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold">{qrDevice.assignedUser.fullName}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1"><Phone className="w-3 h-3" />+91 {qrDevice.assignedUser.phone}</div>
                          <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{qrDevice.assignedUser.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!qrDevice.assignedUser && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-semibold text-green-500">Available for Assignment</p>
                        <p className="text-sm text-muted-foreground">This device code is ready to be assigned to a user</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2 text-sm uppercase tracking-wider">System Information</h3>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Device ID</p>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">{getDeviceIdString(device._id) || device.id}</code>
                  </div>
                </div>

                {onDelete && (
                  <Button variant="destructive" className="w-full mt-4" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />Delete Device
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Registered Devices - Tabbed Layout with Location Map & History */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="info" className="gap-1 text-xs sm:text-sm">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Device </span>Info
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-1 text-xs sm:text-sm">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Location </span>Map
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-1 text-xs sm:text-sm">
                  <History className="w-3 h-3 sm:w-4 sm:h-4" />
                  History
                </TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="max-h-[50vh] overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* QR Code */}
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="bg-white rounded-xl p-3 shadow-lg w-32 h-32 flex items-center justify-center">
                      {isLoadingQr ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      ) : qrImageUrl ? (
                        <img src={qrImageUrl} alt={`QR Code for ${regDevice.code}`} className="w-full h-full object-contain" />
                      ) : (
                        <QrCode className="w-12 h-12 opacity-30" />
                      )}
                    </div>
                  </div>

                  {/* Device Details */}
                  <div className="flex-1 space-y-4">
                    <div className="bg-muted/30 rounded-xl p-4">
                      <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Device Information</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-background/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="font-medium">{regDevice.type || "Vehicle"}</p>
                        </div>
                        <div className="bg-background/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className={cn("font-medium capitalize", getStatusColor(regDevice.status).split(" ")[1])}>{regDevice.status}</p>
                        </div>
                        <div className="bg-background/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="font-medium">{formatDateOnly(regDevice.createdAt)}</p>
                        </div>
                        <div className="bg-background/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Last Online</p>
                          <p className="font-medium">{formatDate(regDevice.lastOnlineAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Assigned User for Registered Devices */}
                    {regDevice.userId && (
                      <div className="bg-muted/30 rounded-xl p-4">
                        <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          Assigned To
                        </h3>
                        <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {typeof regDevice.userId === 'object'
                                ? (regDevice.userId.fullName || 'Unknown User')
                                : 'User ID: ' + regDevice.userId}
                            </p>
                            {typeof regDevice.userId === 'object' && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                {regDevice.userId.phone && (
                                  <div className="flex items-center gap-1"><Phone className="w-3 h-3" />+91 {regDevice.userId.phone}</div>
                                )}
                                {regDevice.userId.email && (
                                  <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{regDevice.userId.email}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current Location */}
                    {hasLocation && (
                      <div className="bg-muted/30 rounded-xl p-4">
                        <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-primary" />
                          Current Location
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-background/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Latitude</p>
                            <p className="font-mono font-medium">{lat.toFixed(6)}</p>
                          </div>
                          <div className="bg-background/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Longitude</p>
                            <p className="font-mono font-medium">{lng.toFixed(6)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-muted/30 rounded-xl p-4">
                      <h3 className="font-semibold text-foreground mb-2 text-sm uppercase tracking-wider">System Information</h3>
                      <div className="bg-background/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Device ID</p>
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">{getDeviceIdString(device._id) || device.id}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Map Tab */}
              <TabsContent value="map" className="space-y-4">
                {/* Refresh Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {regDevice.status === 'online' && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                        <RefreshCw className={cn("w-3 h-3 mr-1", isRefreshing && "animate-spin")} />
                        Auto-refresh: 20s
                      </Badge>
                    )}
                    {lastRefreshTime && (
                      <span className="text-xs text-muted-foreground">Updated: {lastRefreshTime.toLocaleTimeString()}</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing || isLoadingLocations} className="gap-1">
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    Refresh
                  </Button>
                </div>

                {/* Map Container */}
                <div className="rounded-xl overflow-hidden border border-border h-[300px]">
                  {isLoadingLocations ? (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-muted/30">
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                      <p className="text-muted-foreground text-sm">Loading location data...</p>
                    </div>
                  ) : hasLocationHistory || hasLocation ? (
                    <MapContainer key={mapKey} center={[lat, lng]} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
                      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {routeCoordinates.length > 0 && <FitBoundsToMarkers locations={routeCoordinates} />}
                      {locationHistory.length > 1 && (
                        <Polyline positions={routeCoordinates} color="#3b82f6" weight={4} opacity={0.8} dashArray="10, 5" />
                      )}
                      {locationHistory.length > 0 && (
                        <Marker position={[locationHistory[0].latitude, locationHistory[0].longitude]} icon={startIcon}>
                          <Tooltip direction="top">🟢 Start Point</Tooltip>
                        </Marker>
                      )}
                      {locationHistory.length > 1 && (
                        <Marker position={[locationHistory[locationHistory.length - 1].latitude, locationHistory[locationHistory.length - 1].longitude]} icon={endIcon}>
                          <Tooltip direction="top">🏁 Current Location</Tooltip>
                        </Marker>
                      )}
                      {locationHistory.length > 2 && locationHistory.slice(1, -1).map((loc) => (
                        <CircleMarker
                          key={loc._id}
                          center={[loc.latitude, loc.longitude]}
                          radius={loc.isSOS ? 8 : 6}
                          fillColor={loc.isSOS ? "#ef4444" : "#3b82f6"}
                          fillOpacity={0.9}
                          color="white"
                          weight={loc.isSOS ? 3 : 2}
                        >
                          {loc.isSOS && <Tooltip direction="top">🚨 SOS</Tooltip>}
                        </CircleMarker>
                      ))}
                    </MapContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-muted/30">
                      <MapPin className="w-12 h-12 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground font-medium">No Location Data</p>
                      <p className="text-muted-foreground text-xs">Location will appear when device comes online</p>
                    </div>
                  )}
                </div>

                {/* Map Legend */}
                {hasLocationHistory && (
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div>Start</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Waypoints</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div>SOS</div>
                    <div className="flex items-center gap-1"><div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>Current</div>
                    <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-blue-500 border-dashed"></div>Route</div>
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Location History ({locationHistory.length} points)
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing || isLoadingLocations} className="gap-1">
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    Refresh
                  </Button>
                </div>

                {isLoadingLocations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : locationHistory.length > 0 ? (
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {[...locationHistory].reverse().map((loc, index) => (
                      <div
                        key={loc._id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg text-sm",
                          index === 0 ? "bg-red-500/10 border border-red-500/20" :
                            index === locationHistory.length - 1 ? "bg-green-500/10 border border-green-500/20" :
                              "bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {index === 0 ? "🏁" : index === locationHistory.length - 1 ? "🟢" : "📍"}
                          </span>
                          <div>
                            <p className="font-medium break-words">
                              {loc.address || loc.displayName || loc.city || 'Unknown location'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</span>
                              {loc.pincode && (
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                  📮 {loc.pincode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{formatDate(loc.recordedAt)}</p>
                          {loc.speed && <p className="text-xs text-blue-500">{loc.speed} km/h</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No Location History</p>
                    <p className="text-muted-foreground text-xs">History will appear as the device moves</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsPopup;
