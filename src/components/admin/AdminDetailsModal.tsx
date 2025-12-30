import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  UserCog,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Key,
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

interface AdminData {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  permissions?: string[];
}

interface AdminDetailsModalProps {
  admin: AdminData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminDetailsModal = ({ admin, open, onOpenChange }: AdminDetailsModalProps) => {
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchLoginLogs = useCallback(async () => {
    if (!admin) return;
    setIsLoadingLogs(true);
    try {
      const userId = admin._id || admin.id;
      const response = await adminAPI.getAdminLoginLogs(userId!, 5);
      setLoginLogs(response.data || []);
    } catch (error) {
      console.error("Failed to fetch login logs:", error);
      setLoginLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [admin]);

  useEffect(() => {
    if (open && admin) {
      fetchLoginLogs();
    }
  }, [open, admin, fetchLoginLogs]);

  if (!admin) return null;

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

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "superadmin":
        return "bg-purple-500/20 text-purple-500 border-purple-500/30";
      case "admin":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      default:
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    }
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
        <div className="bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center ring-4 ring-orange-500/10">
                <UserCog className="w-8 h-8 text-orange-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{admin.fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={cn("capitalize", getRoleBadgeColor(admin.role))}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {admin.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      admin.isActive
                        ? "bg-green-500/20 text-green-500 border-green-500/30"
                        : "bg-red-500/20 text-red-500 border-red-500/30"
                    )}
                  >
                    {admin.isActive ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {admin.isActive ? "Active" : "Inactive"}
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
                  <p className="font-medium">{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="font-medium font-mono">+91 {admin.phone}</p>
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
                  <p className="font-medium text-sm">{formatDateOnly(admin.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="font-medium text-sm">{formatDate(admin.lastLoginAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin ID */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              System Information
            </h3>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Admin ID</p>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {admin._id || admin.id}
              </code>
            </div>
          </div>

          {/* Permissions (if any) */}
          {admin.permissions && admin.permissions.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
                Permissions
              </h3>
              <div className="flex flex-wrap gap-2">
                {admin.permissions.map((permission, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-background/50 border-border"
                  >
                    <Key className="w-3 h-3 mr-1" />
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Role Description */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              Role Capabilities
            </h3>
            <div className="bg-background/50 rounded-lg p-3">
              {admin.role === "superadmin" ? (
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Full system access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Manage administrators
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Manage all users
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Generate & manage devices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    View all alerts & reports
                  </li>
                </ul>
              ) : (
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Manage users
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    View & manage devices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    View alerts & reports
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Cannot manage other admins
                  </li>
                </ul>
              )}
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

export default AdminDetailsModal;

