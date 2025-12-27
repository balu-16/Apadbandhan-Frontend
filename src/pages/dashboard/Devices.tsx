import { useState, useEffect } from "react";
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
  Power
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
import { cn, formatTimeAgo } from "@/lib/utils";
import { devicesAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import DeviceDetailsModal from "@/components/devices/DeviceDetailsModal";

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
  status: "online" | "offline";
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
  onToggleStatus: (device: Device) => void;
  onDelete: (device: Device) => void;
}

const DeviceCard = ({ device, delay, onClick, onToggleStatus, onDelete }: DeviceCardProps) => (
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

          {/* Toggle Online/Offline */}
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

          {/* Delete Button */}
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
        </div>
      </div>

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
  const [searchQuery, setSearchQuery] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete confirmation state
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (device: Device) => {
    const newStatus = device.status === "online" ? "offline" : "online";
    try {
      await devicesAPI.update(device._id, { status: newStatus });
      setDevices(prev => prev.map(d =>
        d._id === device._id ? { ...d, status: newStatus as "online" | "offline" } : d
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

  const fetchDevices = async (showRefreshState = false) => {
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
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      // Don't show error toast for auth errors (handled by interceptor)
      if (error.response?.status !== 401) {
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
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.code.includes(searchQuery)
  );

  const onlineCount = devices.filter(d => d.status === "online").length;
  const offlineCount = devices.filter(d => d.status === "offline").length;

  return (
    <div className="max-w-5xl mx-auto">
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
    </div>
  );
};

export default Devices;
