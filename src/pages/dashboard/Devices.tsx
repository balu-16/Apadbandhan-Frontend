import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  MapPin,
  Plus,
  Wifi,
  WifiOff,
  Clock,
  ChevronRight,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Share2,
  UserPlus,
  Users,
  X,
  Ban
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatTimeAgo } from "@/lib/utils";
import { devicesAPI, deviceLocationsAPI, sosAPI, deviceSharingAPI, DeviceShareInfo } from "@/services/api";
import { useLocationTracking } from "@/contexts/LocationTrackingContext";
import { useToast } from "@/hooks/use-toast";
import DeviceDetailsModal from "@/components/devices/DeviceDetailsModal";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
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
  _id: string;
  name: string;
  code: string;
  type: string;
  status: "online" | "offline" | "maintenance";
  location?: Location;
  emergencyContacts?: EmergencyContact[];
  insurance?: Insurance;
  batteryLevel?: number;
  lastOnlineAt?: string;
  registeredAt?: string;
  lastUpdate?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}


interface DeviceCardProps {
  device: Device;
  delay: string;
  onClick: () => void;
  onToggleStatus?: (device: Device) => void;
  onDelete?: (device: Device) => void;
  onSOS?: (device: Device) => void;
  onShare?: (device: Device) => void;
  isShared?: boolean;
  isReceived?: boolean;
  sharedWithName?: string;
  ownerName?: string;
}

const DeviceCard = ({ device, delay, onClick, onToggleStatus, onDelete, onSOS, onShare, isShared, isReceived, sharedWithName, ownerName }: DeviceCardProps) => (
  <div
    className="block animate-fade-up opacity-0"
    style={{ animationDelay: delay, animationFillMode: "forwards" }}
  >
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 group hover:shadow-glow">
      {/* Mobile: Stack layout, Desktop: Row layout */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
        <div
          className="flex items-center gap-3 cursor-pointer flex-1"
          onClick={onClick}
        >
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors duration-300 flex-shrink-0",
            device.status === "online"
              ? "bg-green-500/20 group-hover:bg-green-500/30"
              : "bg-muted group-hover:bg-muted/80"
          )}>
            <Smartphone className={cn(
              "w-5 h-5 sm:w-6 sm:h-6",
              device.status === "online" ? "text-green-500" : "text-muted-foreground"
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-sm sm:text-base">
              {device.name}
            </h3>
            <p className="text-xs sm:text-sm font-mono text-muted-foreground truncate">
              {device.code.match(/.{1,4}/g)?.join(" ")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
          {/* Status Badge */}
          <div className={cn(
            "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium",
            device.status === "online"
              ? "bg-green-500/20 text-green-500"
              : "bg-muted text-muted-foreground"
          )}>
            {device.status === "online" ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="hidden xs:inline">{device.status === "online" ? "Online" : "Offline"}</span>
          </div>

          {/* Only show controls for owned devices, not received */}
          {!isReceived && (
            <>
              {/* Toggle Online/Offline */}
              {onToggleStatus && (
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={device.status === "online"}
                    onCheckedChange={() => onToggleStatus(device)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              )}

              {/* SOS Button */}
              {onSOS && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSOS(device);
                  }}
                  className="p-1.5 sm:p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                  title="Trigger SOS"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              )}

              {/* Share Button */}
              {onShare && !isShared && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(device);
                  }}
                  className="p-1.5 sm:p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                  title="Share device"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}

              {/* Delete Button */}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(device);
                  }}
                  className="p-1.5 sm:p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                  title="Delete device"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sharing Info Badge */}
      {(isShared || isReceived) && (
        <div className="mb-3 flex items-center gap-2">
          {isShared && sharedWithName && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs">
              <Users className="w-3 h-3" />
              Shared with {sharedWithName}
            </span>
          )}
          {isReceived && ownerName && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs">
              <UserPlus className="w-3 h-3" />
              Shared by {ownerName}
            </span>
          )}
        </div>
      )}

      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{formatTimeAgo(device.lastUpdate || device.updatedAt)}</span>
          </div>
          {device.address && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="truncate max-w-[100px] sm:max-w-[150px]">{device.address}</span>
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
      </div>
    </div>
  </div>
);

const Devices = () => {
  const { toast } = useToast();
  const { currentLocation, lastKnownLocation } = useLocationTracking();
  const [searchQuery, setSearchQuery] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-devices");

  // Delete confirmation state
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sharing state
  const [sharedByMe, setSharedByMe] = useState<DeviceShareInfo[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<DeviceShareInfo[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [deviceToShare, setDeviceToShare] = useState<Device | null>(null);
  const [sharePhoneNumber, setSharePhoneNumber] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (device: Device) => {
    const newStatus = device.status === "online" ? "offline" : "online";
    try {
      await devicesAPI.updateStatus(device._id, newStatus);
      setDevices(prev => prev.map(d =>
        d._id === device._id ? { ...d, status: newStatus as "online" | "offline" | "maintenance" } : d
      ));
      toast({
        title: "Status Updated",
        description: `${device.name} is now ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update device status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (device: Device) => {
    setDeviceToDelete(device);
    setDeleteConfirmText("");
    setIsDeleteDialogOpen(true);
  };

  const handleShareClick = (device: Device) => {
    setDeviceToShare(device);
    setSharePhoneNumber("");
    setIsShareDialogOpen(true);
  };

  const handleShareSubmit = async () => {
    if (!deviceToShare || !sharePhoneNumber) return;

    setIsSharing(true);
    try {
      const response = await deviceSharingAPI.shareDevice({
        deviceId: deviceToShare._id,
        phoneNumber: sharePhoneNumber.replace(/\D/g, ''),
      });

      if (response.data.success) {
        toast({
          title: "Device Shared",
          description: response.data.message,
        });
        setIsShareDialogOpen(false);
        fetchSharedDevices();
      }
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Failed to Share",
        description: err.response?.data?.message || "Could not share device",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    setIsRevoking(shareId);
    try {
      const response = await deviceSharingAPI.revokeShare({ shareId });
      if (response.data.success) {
        toast({
          title: "Access Revoked",
          description: response.data.message,
        });
        fetchSharedDevices();
      }
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Failed to Revoke",
        description: err.response?.data?.message || "Could not revoke access",
        variant: "destructive",
      });
    } finally {
      setIsRevoking(null);
    }
  };

  const fetchSharedDevices = useCallback(async () => {
    try {
      const [sharedByMeRes, sharedWithMeRes] = await Promise.all([
        deviceSharingAPI.getSharedByMe(),
        deviceSharingAPI.getSharedWithMe(),
      ]);
      setSharedByMe(sharedByMeRes.data.shares);
      setSharedWithMe(sharedWithMeRes.data.shares);
    } catch (error) {
      console.error('Error fetching shared devices:', error);
    }
  }, []);

  const handleSOS = async (device: Device) => {
    const location = currentLocation || lastKnownLocation;
    if (!location?.latitude || !location?.longitude) {
      toast({
        title: "Location Required",
        description: "Unable to get your current location for SOS",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call SOS API to create SOS event and find responders
      const sosResponse = await sosAPI.trigger({
        lat: location.latitude,
        lng: location.longitude,
      });

      // Also save location with SOS flag
      await deviceLocationsAPI.create({
        deviceId: device._id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        source: 'browser',
        isSOS: true,
      });

      const respondersFound = sosResponse.data?.responders?.totalFound || 0;
      toast({
        title: "🚨 SOS Triggered",
        description: respondersFound > 0
          ? `Emergency alert sent! ${respondersFound} responders notified.`
          : `Emergency location recorded for ${device.name}. Searching for responders...`,
      });
    } catch (error) {
      console.error('Failed to trigger SOS:', error);
      toast({
        title: "Error",
        description: "Failed to trigger SOS. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deviceToDelete || deleteConfirmText !== "confirm to delete") return;

    setIsDeleting(true);
    try {
      await devicesAPI.delete(deviceToDelete._id);
      setDevices(prev => prev.filter(d => d._id !== deviceToDelete._id));
      toast({
        title: "Device Deleted",
        description: `${deviceToDelete.name} has been deleted successfully`,
      });
      setIsDeleteDialogOpen(false);
      setDeviceToDelete(null);
      setDeleteConfirmText("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchDevices = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) {
      setIsRefreshing(true);
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // User not logged in, show empty state
        setDevices([]);
        setIsLoading(false);
        return;
      }

      const response = await devicesAPI.getAll();
      setDevices(response.data);
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      console.error('Error fetching devices:', err);
      // Don't show error toast for auth errors (handled by interceptor)
      if (err.response?.status !== 401) {
        toast({
          title: "Error",
          description: "Failed to load devices. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDevices();
    fetchSharedDevices();
  }, [fetchDevices, fetchSharedDevices]);

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.code.includes(searchQuery)
  );

  const onlineCount = devices.filter(d => d.status === "online").length;
  const offlineCount = devices.filter(d => d.status === "offline").length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Your Devices</h1>
          <p className="text-muted-foreground">
            Manage and monitor all your connected AIoT devices
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDevices(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
          </Button>
          <Link to="/dashboard/add-device">
            <Button variant="hero">
              <Plus className="w-5 h-5" />
              Add Device
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search devices by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Tabs for device sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="my-devices" className="gap-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">My Devices</span>
            <span className="sm:hidden">Mine</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-xs">{devices.length}</span>
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Shared</span>
            <span className="sm:hidden">Shared</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-xs">{sharedByMe.length}</span>
          </TabsTrigger>
          <TabsTrigger value="received" className="gap-2">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Received</span>
            <span className="sm:hidden">Received</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-xs">{sharedWithMe.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* My Devices Tab */}
        <TabsContent value="my-devices">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="bg-card border border-border/50 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{devices.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-500">{onlineCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Online</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-muted-foreground">{offlineCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Offline</p>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading your devices...</p>
            </div>
          ) : (
            <>
              {/* Device List */}
              {filteredDevices.length > 0 ? (
                <div className="grid gap-4">
                  {filteredDevices.map((device, index) => (
                    <DeviceCard
                      key={device._id}
                      device={device}
                      delay={`${0.2 + index * 0.1}s`}
                      onClick={() => handleDeviceClick(device)}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDeleteClick}
                      onSOS={handleSOS}
                      onShare={handleShareClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 animate-fade-up">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                    <Smartphone className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No devices found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "Start by adding your first AIoT device"
                    }
                  </p>
                  {!searchQuery && (
                    <Link to="/dashboard/add-device">
                      <Button variant="hero">
                        <Plus className="w-5 h-5" />
                        Add Your First Device
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Shared Devices Tab */}
        <TabsContent value="shared">
          <div className="mb-4">
            <p className="text-muted-foreground text-sm">Devices you have shared with other users</p>
          </div>
          {sharedByMe.length > 0 ? (
            <div className="grid gap-4">
              {sharedByMe.map((share, index) => (
                <div
                  key={share.id}
                  className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 animate-fade-up"
                  style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: "forwards" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{share.deviceName}</h3>
                        <p className="text-sm text-muted-foreground font-mono">
                          {share.deviceCode.match(/.{1,4}/g)?.join(" ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Shared with</p>
                        <p className="font-medium text-foreground">{share.sharedWith?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{share.sharedWith?.phone}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeShare(share.id)}
                        disabled={isRevoking === share.id}
                      >
                        {isRevoking === share.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Ban className="w-4 h-4 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-up">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <Share2 className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No shared devices</h3>
              <p className="text-muted-foreground">
                Share your devices with family or friends by clicking the share button
              </p>
            </div>
          )}
        </TabsContent>

        {/* Received Devices Tab */}
        <TabsContent value="received">
          <div className="mb-4">
            <p className="text-muted-foreground text-sm">Devices shared with you by other users</p>
          </div>
          {sharedWithMe.length > 0 ? (
            <div className="grid gap-4">
              {sharedWithMe.map((share, index) => (
                <DeviceCard
                  key={share.id}
                  device={{
                    _id: share.deviceId,
                    name: share.deviceName,
                    code: share.deviceCode,
                    type: share.deviceType,
                    status: share.deviceStatus as "online" | "offline" | "maintenance",
                    createdAt: share.sharedAt,
                    updatedAt: share.sharedAt,
                  }}
                  delay={`${0.1 + index * 0.05}s`}
                  onClick={() => {}}
                  isReceived={true}
                  ownerName={share.owner.fullName}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-up">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <UserPlus className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No received devices</h3>
              <p className="text-muted-foreground">
                When someone shares a device with you, it will appear here
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Device Details Modal */}
      <DeviceDetailsModal
        device={selectedDevice}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Device?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Do you want to delete <strong className="text-foreground">{deviceToDelete?.name}</strong>?
              </p>
              <p className="text-sm">
                This action is <strong>irreversible</strong>. All device data including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Emergency contacts</li>
                <li>Insurance information</li>
                <li>Location history</li>
                <li>Alert records</li>
              </ul>
              <p className="text-sm">will be permanently deleted.</p>
              <div className="pt-2">
                <label className="text-sm font-medium text-foreground">
                  Type <strong className="text-destructive">"confirm to delete"</strong> to proceed:
                </label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="confirm to delete"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmText("");
              setDeviceToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText !== "confirm to delete" || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Device
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Device Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share Device
            </DialogTitle>
            <DialogDescription>
              Share <strong>{deviceToShare?.name}</strong> with another user by entering their phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="Enter phone number (e.g., 9876543210)"
                value={sharePhoneNumber}
                onChange={(e) => setSharePhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The user must be registered with this phone number
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsShareDialogOpen(false);
                setDeviceToShare(null);
                setSharePhoneNumber("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShareSubmit}
              disabled={!sharePhoneNumber || sharePhoneNumber.length < 10 || isSharing}
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Device
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Devices;
