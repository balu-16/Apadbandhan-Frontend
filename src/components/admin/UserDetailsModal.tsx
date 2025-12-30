import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Smartphone,
  Clock,
  History,
  Monitor,
  Globe,
  X,
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

interface UserData {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  devices?: Array<{
    _id?: string;
    id?: string;
    name: string;
    code: string;
    status: string;
  }>;
}

interface UserDetailsModalProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailsModal = ({ user, open, onOpenChange }: UserDetailsModalProps) => {
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchLoginLogs = useCallback(async () => {
    if (!user) return;
    setIsLoadingLogs(true);
    try {
      const userId = user._id || user.id;
      const response = await adminAPI.getUserLoginLogs(userId!, 5);
      setLoginLogs(response.data || []);
    } catch (error) {
      console.error("Failed to fetch login logs:", error);
      setLoginLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchLoginLogs();
    }
  }, [open, user, fetchLoginLogs]);

  if (!user) return null;

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
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center ring-4 ring-primary/10">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize",
                      user.role === "admin" || user.role === "superadmin"
                        ? "bg-orange-500/20 text-orange-500 border-orange-500/30"
                        : "bg-blue-500/20 text-blue-500 border-blue-500/30"
                    )}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      user.isActive
                        ? "bg-green-500/20 text-green-500 border-green-500/30"
                        : "bg-red-500/20 text-red-500 border-red-500/30"
                    )}
                  >
                    {user.isActive ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
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
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="font-medium font-mono">+91 {user.phone}</p>
                </div>
              </div>
            </div>
          </div>

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
                  <p className="font-medium text-sm">{formatDateOnly(user.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="font-medium text-sm">{formatDate(user.lastLoginAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User ID */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              System Information
            </h3>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">User ID</p>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {user._id || user.id}
              </code>
            </div>
          </div>

          {/* Devices (if any) */}
          {user.devices && user.devices.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
                Registered Devices ({user.devices.length})
              </h3>
              <div className="space-y-2">
                {user.devices.map((device, index) => (
                  <div
                    key={device._id || device.id || index}
                    className="flex items-center justify-between bg-background/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{device.code}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        device.status === "online"
                          ? "bg-green-500/20 text-green-500 border-green-500/30"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {device.status || "offline"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

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

export default UserDetailsModal;

