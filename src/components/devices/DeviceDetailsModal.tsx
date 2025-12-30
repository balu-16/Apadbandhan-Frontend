import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocationTracking } from "@/contexts/LocationTrackingContext";
import { cn } from "@/lib/utils";
import { deviceLocationsAPI } from "@/services/api";

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

// Custom marker icon for waypoints
const deviceIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Start point icon (green)
const startIcon = new L.DivIcon({
  className: 'custom-start-marker',
  html: `<div style="
    width: 24px; 
    height: 24px; 
    background: #22c55e; 
    border: 3px solid white; 
    border-radius: 50%; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// End point icon (arrow/destination)
const endIcon = new L.DivIcon({
  className: 'custom-end-marker',
  html: `<div style="
    width: 0; 
    height: 0; 
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 24px solid #ef4444;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    transform: rotate(0deg);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

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
  _id?: string | { $oid: string };
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

const LOCATION_REFRESH_INTERVAL = 20000; // 20 seconds

const DeviceDetailsModal = ({ device, open, onOpenChange }: DeviceDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("info");
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Location tracking context for permission status and current location
  const { permissionStatus, currentLocation, lastKnownLocation, locationError, requestLocationPermission } = useLocationTracking();

  // Calculate derived values - must be before any early returns
  const hasLocation = device?.location?.latitude && device?.location?.longitude;
  const hasLocationHistory = locationHistory.length > 0;
  const hasBrowserLocation = currentLocation?.latitude && currentLocation?.longitude;
  const hasLastKnownLocation = lastKnownLocation?.latitude && lastKnownLocation?.longitude;
  
  // Priority: locationHistory > device.location > currentLocation > lastKnownLocation > default
  const lat = hasLocationHistory 
    ? locationHistory[locationHistory.length - 1].latitude 
    : hasLocation 
      ? device?.location?.latitude ?? 20.5937
      : hasBrowserLocation 
        ? currentLocation?.latitude ?? 20.5937
        : hasLastKnownLocation 
          ? lastKnownLocation?.latitude ?? 20.5937
          : 20.5937;
  const lng = hasLocationHistory 
    ? locationHistory[locationHistory.length - 1].longitude 
    : hasLocation 
      ? device?.location?.longitude ?? 78.9629
      : hasBrowserLocation 
        ? currentLocation?.longitude ?? 78.9629
        : hasLastKnownLocation 
          ? lastKnownLocation?.longitude ?? 78.9629
          : 78.9629;
  
  // Check if we have any location to show
  const hasAnyLocation = hasLocationHistory || hasLocation || hasBrowserLocation || hasLastKnownLocation;

  // Create route coordinates for polyline - memoize to avoid unnecessary recalculations
  const routeCoordinates: [number, number][] = useMemo(() => 
    locationHistory.map(loc => [loc.latitude, loc.longitude]),
    [locationHistory]
  );

  // Map key to force re-render when locations change
  const mapKey = useMemo(() => 
    `map-${locationHistory.length}-${lat}-${lng}`,
    [locationHistory.length, lat, lng]
  );

  // Extract device ID properly - handle both _id and id formats
  const getDeviceId = useCallback((): string | null => {
    if (!device) return null;
    // Try _id first (MongoDB format), then id (transformed format)
    const id = device._id || device.id;
    if (!id) return null;
    
    // If it's an object with $oid (MongoDB extended JSON), extract it
    if (typeof id === 'object' && id !== null && '$oid' in id) {
      return (id as { $oid: string }).$oid;
    }
    // If it's an object with toString method (ObjectId), convert it
    if (typeof id === 'object' && id !== null && typeof (id as { toString: () => string }).toString === 'function') {
      return (id as { toString: () => string }).toString();
    }
    // Otherwise return as string
    return String(id);
  }, [device]);

  // Fetch location history function - memoized for reuse
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
        // Sort by recordedAt ascending (oldest first for route)
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
      console.error('Failed to fetch location history:', err.response?.data || err.message);
      if (isInitialLoad) {
        setLocationHistory([]);
      }
    } finally {
      setIsLoadingLocations(false);
      setIsRefreshing(false);
    }
  }, [getDeviceId]);

  // Initial fetch and auto-refresh for online devices
  useEffect(() => {
    if (!open || !device) {
      // Reset location history and clear interval when modal closes
      if (!open) {
        setLocationHistory([]);
        setIsLoadingLocations(false);
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      }
      return;
    }

    // Initial fetch
    fetchLocationHistory(true);

    // Set up auto-refresh only for online devices
    if (device.status === 'online') {
      refreshIntervalRef.current = setInterval(() => {
        fetchLocationHistory(false);
      }, LOCATION_REFRESH_INTERVAL);
    }

    // Cleanup interval on unmount or when modal closes
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [open, device, fetchLocationHistory]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    fetchLocationHistory(false);
  }, [fetchLocationHistory]);

  // Backfill addresses for locations without address data
  const [isBackfilling, setIsBackfilling] = useState(false);
  const handleBackfillAddresses = useCallback(async () => {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    setIsBackfilling(true);
    try {
      await deviceLocationsAPI.backfillAddresses(deviceId, 100);
      // Refresh location history to show updated addresses
      await fetchLocationHistory(false);
    } catch (error) {
      console.error('Failed to backfill addresses:', error);
    } finally {
      setIsBackfilling(false);
    }
  }, [getDeviceId, fetchLocationHistory]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Early return AFTER all hooks
  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl font-bold truncate">{device.name}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">{device.code}</p>
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
          <DialogDescription className="sr-only">
            View device details, location history, and map for {device.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Device </span>Info
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Location </span>Map
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              History
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
            {/* Location Permission Warning */}
            {permissionStatus === 'denied' && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Location Permission Not Granted
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Showing last known location. Enable location access for real-time tracking.
                  </p>
                </div>
              </div>
            )}

            {permissionStatus === 'unavailable' && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Location Unavailable
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Geolocation is not supported by this browser.
                  </p>
                </div>
              </div>
            )}

            {/* Auto-refresh status and controls */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 flex-wrap">
                {device.status === 'online' && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                    <RefreshCw className={cn("w-3 h-3 mr-1", isRefreshing && "animate-spin")} />
                    <span className="hidden sm:inline">Auto-refresh: </span>20s
                  </Badge>
                )}
                {lastRefreshTime && (
                  <span className="text-xs text-muted-foreground">
                    <span className="hidden sm:inline">Last updated: </span>{lastRefreshTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing || isLoadingLocations}
                  className="gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <RefreshCw className={cn("w-3 h-3 sm:w-4 sm:h-4", isRefreshing && "animate-spin")} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1 bg-red-600 hover:bg-red-700 flex-1 sm:flex-none text-xs sm:text-sm"
                  onClick={async () => {
                    const deviceId = getDeviceId();
                    if (!deviceId) return;
                    
                    // Get current location from browser
                    if (currentLocation?.latitude && currentLocation?.longitude) {
                      try {
                        await deviceLocationsAPI.create({
                          deviceId,
                          latitude: currentLocation.latitude,
                          longitude: currentLocation.longitude,
                          accuracy: currentLocation.accuracy,
                          source: 'browser',
                          isSOS: true,
                        });
                        // Refresh to show the new SOS location
                        fetchLocationHistory(false);
                      } catch (error) {
                        console.error('Failed to record SOS location:', error);
                      }
                    } else if (lastKnownLocation?.latitude && lastKnownLocation?.longitude) {
                      try {
                        await deviceLocationsAPI.create({
                          deviceId,
                          latitude: lastKnownLocation.latitude,
                          longitude: lastKnownLocation.longitude,
                          source: 'browser',
                          isSOS: true,
                        });
                        fetchLocationHistory(false);
                      } catch (error) {
                        console.error('Failed to record SOS location:', error);
                      }
                    }
                  }}
                >
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                  SOS
                </Button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-border">
              {isLoadingLocations ? (
                <div className="h-[250px] sm:h-[350px] md:h-[400px] w-full flex flex-col items-center justify-center bg-muted/30">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Loading location data...</p>
                </div>
              ) : hasAnyLocation ? (
                <div className="h-[250px] sm:h-[350px] md:h-[400px] w-full">
                  <MapContainer
                    key={mapKey}
                    center={[lat, lng]}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Auto-fit bounds to markers */}
                    {routeCoordinates.length > 0 && (
                      <FitBoundsToMarkers locations={routeCoordinates} />
                    )}
                    
                    {/* Route line connecting all points */}
                    {locationHistory.length > 1 && (
                      <Polyline
                        positions={routeCoordinates}
                        color="#3b82f6"
                        weight={4}
                        opacity={0.8}
                        dashArray="10, 5"
                      />
                    )}

                    {/* Start Point Marker (Green Circle) - Show for first location in history */}
                    {locationHistory.length > 0 && (
                      <Marker 
                        position={[locationHistory[0].latitude, locationHistory[0].longitude]} 
                        icon={startIcon}
                      >
                        <Tooltip permanent={false} direction="top" offset={[0, -10]}>
                          <div className="text-xs font-mono">
                            🟢 Start: {locationHistory[0].latitude.toFixed(4)}, {locationHistory[0].longitude.toFixed(4)}
                          </div>
                        </Tooltip>
                        <Popup>
                          <div className="text-center min-w-[150px]">
                            <div className="font-bold text-green-600 mb-1">🟢 Start Point</div>
                            <div className="text-sm font-medium">{locationHistory[0].city || 'Unknown'}</div>
                            {locationHistory[0].address && (
                              <div className="text-xs text-gray-600">{locationHistory[0].address}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Lat: {locationHistory[0].latitude.toFixed(6)}<br/>
                              Lng: {locationHistory[0].longitude.toFixed(6)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(locationHistory[0].recordedAt)}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Waypoint Markers - Middle points between start and end */}
                    {locationHistory.length > 2 && locationHistory.slice(1, -1).map((loc, index) => (
                      <CircleMarker
                        key={loc._id}
                        center={[loc.latitude, loc.longitude]}
                        radius={loc.isSOS ? 10 : 8}
                        fillColor={loc.isSOS ? "#ef4444" : "#3b82f6"}
                        fillOpacity={0.9}
                        color="white"
                        weight={loc.isSOS ? 4 : 3}
                      >
                        <Tooltip permanent={false} direction="top" offset={[0, -5]}>
                          <div className="text-xs font-mono">
                            {loc.isSOS ? "🚨 SOS" : "📍"} {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                          </div>
                        </Tooltip>
                        <Popup>
                          <div className="text-center min-w-[150px]">
                            <div className={`font-bold mb-1 ${loc.isSOS ? "text-red-600" : "text-blue-600"}`}>
                              {loc.isSOS ? "🚨 SOS Alert" : `📍 Waypoint ${index + 1}`}
                            </div>
                            <div className="text-sm font-medium">{loc.city || 'Unknown'}</div>
                            {loc.address && (
                              <div className="text-xs text-gray-600">{loc.address}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Lat: {loc.latitude.toFixed(6)}<br/>
                              Lng: {loc.longitude.toFixed(6)}
                            </div>
                            {loc.speed && (
                              <div className="text-xs text-gray-500">Speed: {loc.speed} km/h</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(loc.recordedAt)}
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}

                    {/* End Point Marker (Arrow/Destination) - Show only if more than 1 location */}
                    {locationHistory.length > 1 && (
                      <Marker 
                        position={[
                          locationHistory[locationHistory.length - 1].latitude, 
                          locationHistory[locationHistory.length - 1].longitude
                        ]} 
                        icon={endIcon}
                      >
                        <Tooltip permanent={false} direction="top" offset={[0, -20]}>
                          <div className="text-xs font-mono">
                            🏁 End: {locationHistory[locationHistory.length - 1].latitude.toFixed(4)}, {locationHistory[locationHistory.length - 1].longitude.toFixed(4)}
                          </div>
                        </Tooltip>
                        <Popup>
                          <div className="text-center min-w-[150px]">
                            <div className="font-bold text-red-600 mb-1">🏁 Current Location</div>
                            <div className="text-sm font-medium">
                              {locationHistory[locationHistory.length - 1].city || 'Unknown'}
                            </div>
                            {locationHistory[locationHistory.length - 1].address && (
                              <div className="text-xs text-gray-600">
                                {locationHistory[locationHistory.length - 1].address}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Lat: {locationHistory[locationHistory.length - 1].latitude.toFixed(6)}<br/>
                              Lng: {locationHistory[locationHistory.length - 1].longitude.toFixed(6)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(locationHistory[locationHistory.length - 1].recordedAt)}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Fallback: Single marker when no location history - uses device.location or browser location */}
                    {locationHistory.length === 0 && hasAnyLocation && (
                      <Marker position={[lat, lng]} icon={deviceIcon}>
                        <Tooltip permanent={false} direction="top" offset={[0, -35]}>
                          <div className="text-xs font-mono">
                            📍 {lat.toFixed(4)}, {lng.toFixed(4)}
                          </div>
                        </Tooltip>
                        <Popup>
                          <div className="text-center min-w-[150px]">
                            <div className="font-bold text-blue-600 mb-1">
                              📍 {hasBrowserLocation || hasLastKnownLocation ? 'Your Location' : 'Device Location'}
                            </div>
                            <div className="text-sm font-medium">{device.name}</div>
                            <div className="text-xs text-gray-500">{device.code}</div>
                            {device.location?.address && (
                              <div className="text-xs text-gray-600 mt-1">{device.location.address}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Lat: {lat.toFixed(6)}<br/>
                              Lng: {lng.toFixed(6)}
                            </div>
                            {(hasBrowserLocation || hasLastKnownLocation) && !hasLocation && (
                              <div className="text-xs text-orange-500 mt-1">
                                Using browser location
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              ) : (
                <div className="h-[250px] sm:h-[350px] md:h-[400px] w-full flex flex-col items-center justify-center bg-muted/30">
                  <MapPin className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-lg font-medium">No Location Data</p>
                  <p className="text-muted-foreground text-sm text-center px-4">
                    {permissionStatus === 'denied' 
                      ? 'Location permission denied. Please enable it in your browser settings.'
                      : permissionStatus === 'prompt'
                        ? 'Enable location to see your current position on the map.'
                        : 'Device location will appear here once the device comes online'}
                  </p>
                  {permissionStatus === 'prompt' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-2"
                      onClick={requestLocationPermission}
                    >
                      <Navigation className="w-4 h-4" />
                      Enable Location
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Route Legend - Show when there are multiple locations */}
            {locationHistory.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                  <span className="text-muted-foreground">Start</span>
                </div>
                {locationHistory.length > 2 && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                    <span className="text-muted-foreground">Waypoints</span>
                  </div>
                )}
                {locationHistory.some(loc => loc.isSOS) && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
                    <span className="text-muted-foreground">SOS</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-l-transparent border-r-transparent border-b-red-500"></div>
                  <span className="text-muted-foreground">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-blue-500 rounded" style={{ borderStyle: 'dashed' }}></div>
                  <span className="text-muted-foreground">Route</span>
                </div>
              </div>
            )}

            {/* Location History List - Show when there are locations */}
            {locationHistory.length > 0 && (
              <div className="mt-4 bg-muted/30 rounded-xl p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Location History ({locationHistory.length} points)
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {[...locationHistory].reverse().map((loc, index) => (
                    <div 
                      key={loc._id} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg text-sm",
                        index === 0 ? "bg-red-500/10" : index === locationHistory.length - 1 ? "bg-green-500/10" : "bg-background/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {index === 0 ? "🏁" : index === locationHistory.length - 1 ? "🟢" : "📍"}
                        </span>
                        <div>
                          <p className="font-medium">{loc.city || loc.address || 'Unknown location'}</p>
                          <p className="text-xs text-muted-foreground">
                            {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatDate(loc.recordedAt)}</p>
                        {loc.speed && <p className="text-xs text-blue-500">{loc.speed} km/h</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Details */}
            {hasAnyLocation && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Current Latitude</p>
                  <p className="font-mono text-lg">{lat.toFixed(6)}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Current Longitude</p>
                  <p className="font-mono text-lg">{lng.toFixed(6)}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {/* Refresh controls */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Location History
                </h3>
                <div className="flex items-center gap-2">
                  {locationHistory.some(loc => !loc.address && !loc.city) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBackfillAddresses}
                      disabled={isBackfilling || isRefreshing || isLoadingLocations}
                      className="gap-1"
                    >
                      <MapPin className={cn("w-4 h-4", isBackfilling && "animate-pulse")} />
                      {isBackfilling ? "Loading..." : "Get Addresses"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing || isLoadingLocations}
                    className="gap-1"
                  >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </div>

              {isLoadingLocations ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Loading location history...</p>
                </div>
              ) : locationHistory.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    {locationHistory.length} location{locationHistory.length > 1 ? 's' : ''} recorded
                  </p>
                  {[...locationHistory].reverse().map((loc, index) => (
                    <div 
                      key={loc._id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border",
                        index === 0 
                          ? "bg-red-500/10 border-red-500/30" 
                          : index === locationHistory.length - 1 
                            ? "bg-green-500/10 border-green-500/30" 
                            : "bg-muted/30 border-border/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {index === 0 ? "🏁" : index === locationHistory.length - 1 ? "🟢" : "📍"}
                        </span>
                        <div>
                          <p className="font-medium">
                            {index === 0 ? "Current Location" : index === locationHistory.length - 1 ? "Start Point" : `Waypoint ${locationHistory.length - index - 1}`}
                          </p>
                          <p className="text-sm text-muted-foreground break-words">
                            {loc.address || loc.displayName || loc.city || 'Unknown location'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(loc.recordedAt)}</p>
                        {loc.speed && (
                          <p className="text-xs text-blue-500">{loc.speed} km/h</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-xl">
                  <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-lg font-medium">No History Yet</p>
                  <p className="text-muted-foreground text-sm text-center px-4">
                    Location history will appear here as your device tracks your movements.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsModal;
