import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { adminAPI } from "@/services/api";

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
  _id?: string;
  id?: string;
  name: string;
  code: string;
  type: string;
  status: string;
  userId?: any;
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

const DeviceDetailsPopup = ({ device, deviceType, open, onOpenChange, onDelete }: DeviceDetailsPopupProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  const isQrCode = deviceType === "qrcode";
  const qrDevice = device as QrCodeDevice;
  const regDevice = device as RegisteredDevice;

  const apiUrl = import.meta.env.VITE_API_URL || "https://apadbandhan-backend.onrender.com/api";

  // Fetch QR code for registered devices
  useEffect(() => {
    if (open && device && !isQrCode) {
      fetchQrCodeForDevice();
    }
  }, [open, device, isQrCode]);

  const fetchQrCodeForDevice = async () => {
    if (!regDevice.code) return;
    setIsLoadingQr(true);
    try {
      const response = await adminAPI.getQrCodeByDeviceCode(regDevice.code);
      if (response.data && response.data.qrImageUrl) {
        setQrCodeUrl(response.data.qrImageUrl);
      } else {
        setQrCodeUrl(null);
      }
    } catch (error) {
      console.error("Failed to fetch QR code:", error);
      setQrCodeUrl(null);
    } finally {
      setIsLoadingQr(false);
    }
  };

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

        {/* Content - QR on left, Details on right */}
        <div className="p-6 pt-2">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Side - QR Code */}
            <div className="flex-shrink-0">
              <div className="bg-white rounded-xl p-4 shadow-lg w-48 h-48 flex items-center justify-center">
                {isLoadingQr ? (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-xs">Loading QR...</span>
                  </div>
                ) : qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt={`QR Code for ${isQrCode ? qrDevice.deviceCode : regDevice.code}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
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
              <p className="text-center text-xs text-muted-foreground mt-2">
                Scan to register device
              </p>
            </div>

            {/* Right Side - Device Details */}
            <div className="flex-1 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {/* Device Info */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
                  Device Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium">{isQrCode ? "QR Code" : regDevice.type || "Vehicle"}</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={cn("font-medium capitalize", getStatusColor(isQrCode ? qrDevice.status : regDevice.status).split(" ")[1])}>
                      {isQrCode ? qrDevice.status : regDevice.status}
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDateOnly(isQrCode ? qrDevice.createdAt : regDevice.createdAt)}</p>
                  </div>
                  {!isQrCode && (
                    <div className="bg-background/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Last Online</p>
                      <p className="font-medium">{formatDate(regDevice.lastOnlineAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location for registered devices */}
              {!isQrCode && regDevice.location && (regDevice.location.latitude || regDevice.location.longitude) && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Location
                  </h3>
                  <div className="space-y-2 text-sm">
                    {regDevice.location.address && (
                      <div className="bg-background/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium">{regDevice.location.address}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-background/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Latitude</p>
                        <p className="font-mono font-medium">{regDevice.location.latitude?.toFixed(6)}</p>
                      </div>
                      <div className="bg-background/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Longitude</p>
                        <p className="font-mono font-medium">{regDevice.location.longitude?.toFixed(6)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assigned User (for QR codes) */}
              {isQrCode && qrDevice.assignedUser && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
                    Assigned User
                  </h3>
                  <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold">{qrDevice.assignedUser.fullName}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          +91 {qrDevice.assignedUser.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {qrDevice.assignedUser.email}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Not Assigned Message */}
              {isQrCode && !qrDevice.assignedUser && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-semibold text-green-500">Available for Assignment</p>
                      <p className="text-sm text-muted-foreground">
                        This device code is ready to be assigned to a user
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Device ID */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-2 text-sm uppercase tracking-wider">
                  System Information
                </h3>
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Device ID</p>
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
                    {device._id || device.id}
                  </code>
                </div>
              </div>

              {/* Delete Button */}
              {isQrCode && onDelete && (
                <Button
                  variant="destructive"
                  className="w-full mt-4"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Device
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsPopup;
