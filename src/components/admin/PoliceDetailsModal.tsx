import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Monitor,
  Globe,
  X,
  MapPin,
  BadgeCheck,
  Building,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { adminAPI } from "@/services/api";

interface LoginLog {
  _id: string;
  loginAt: string;
  ipAddress?: string;
  deviceInfo?: string;
  userAgent?: string;
  success: boolean;
}

interface PoliceData {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  onDuty?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  stationName?: string;
  badgeNumber?: string;
  jurisdiction?: string;
  address?: string;
  baseLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface PoliceDetailsModalProps {
  police: PoliceData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PoliceDetailsModal = ({ police, open, onOpenChange }: PoliceDetailsModalProps) => {
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchLoginLogs = useCallback(async () => {
    if (!police) return;
    setIsLoadingLogs(true);
    try {
      const userId = police._id || police.id;
      // Use admin login logs endpoint for police users
      const response = await adminAPI.getUserLoginLogs(userId!, 5);
      setLoginLogs(response.data || []);
    } catch (error) {
      console.error("Failed to fetch login logs:", error);
      setLoginLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [police]);

  useEffect(() => {
    if (open && police) {
      fetchLoginLogs();
    }
  }, [open, police, fetchLoginLogs]);

  if (!police) return null;

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

  const formatLoginDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 [&>button]:hidden">
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
        <div className="bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center ring-4 ring-blue-500/10">
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{police.fullName}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge
                    variant="outline"
                    className="bg-blue-500/20 text-blue-500 border-blue-500/30"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Police
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      police.isActive
                        ? "bg-green-500/20 text-green-500 border-green-500/30"
                        : "bg-red-500/20 text-red-500 border-red-500/30"
                    )}
                  >
                    {police.isActive ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {police.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {police.onDuty !== undefined && (
                    <Badge
                      variant="outline"
                      className={cn(
                        police.onDuty
                          ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                          : "bg-gray-500/20 text-gray-500 border-gray-500/30"
                      )}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      {police.onDuty ? "On Duty" : "Off Duty"}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Contact Information */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="font-medium">{police.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="font-medium font-mono">+91 {police.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Station Details */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4" />
              Station Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Station Name</p>
                  <p className="font-medium text-sm">{police.stationName || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Badge Number</p>
                  <p className="font-medium text-sm font-mono">{police.badgeNumber || "N/A"}</p>
                </div>
              </div>
            </div>
            {police.jurisdiction && (
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3 mt-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Jurisdiction Area</p>
                  <p className="font-medium">{police.jurisdiction}</p>
                </div>
              </div>
            )}
            {police.address && (
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3 mt-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Station Address</p>
                  <p className="font-medium text-sm">{police.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Base Location */}
          {police.baseLocation && police.baseLocation.latitude != null && police.baseLocation.longitude != null && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Base Location
              </h3>
              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Coordinates</p>
                    <p className="font-medium font-mono text-sm">
                      {police.baseLocation.latitude.toFixed(6)}, {police.baseLocation.longitude.toFixed(6)}
                    </p>
                    {police.baseLocation.address && (
                      <p className="text-xs text-muted-foreground mt-1">{police.baseLocation.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Details */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              Account Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium text-sm">{formatDateOnly(police.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="font-medium text-sm">{formatDate(police.lastLoginAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              System Information
            </h3>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">User ID</p>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {police._id || police.id}
              </code>
            </div>
          </div>

          {/* Login History */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Login History
            </h3>
            {isLoadingLogs ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Loading login history...
              </div>
            ) : loginLogs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No login history available
              </div>
            ) : (
              <div className="space-y-2">
                {loginLogs.map((log) => (
                  <div
                    key={log._id}
                    className="flex items-center justify-between bg-background/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatLoginDate(log.loginAt)}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {log.deviceInfo && (
                            <span className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {log.deviceInfo}
                            </span>
                          )}
                          {log.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PoliceDetailsModal;
