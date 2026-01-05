import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Share2,
  UserPlus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { adminAPI, deviceSharingAPI, DeviceShareInfo } from "@/services/api";

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
  const [activeTab, setActiveTab] = useState("info");
  
  // Device sharing state
  const [ownedDevices, setOwnedDevices] = useState<any[]>([]);
  const [sharedByUser, setSharedByUser] = useState<DeviceShareInfo[]>([]);
  const [sharedWithUser, setSharedWithUser] = useState<DeviceShareInfo[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

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

  const fetchUserDevices = useCallback(async () => {
    if (!user) return;
    setIsLoadingDevices(true);
    try {
      const userId = user._id || user.id;
      const response = await deviceSharingAPI.getUserShares(userId!);
      setOwnedDevices(response.data.ownedDevices || []);
      setSharedByUser(response.data.sharedByUser || []);
      setSharedWithUser(response.data.sharedWithUser || []);
    } catch (error) {
      console.error("Failed to fetch user devices:", error);
      setOwnedDevices([]);
      setSharedByUser([]);
      setSharedWithUser([]);
    } finally {
      setIsLoadingDevices(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchLoginLogs();
      fetchUserDevices();
      setActiveTab("info");
    }
  }, [open, user, fetchLoginLogs, fetchUserDevices]);

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

        {/* Tabs */}
        <div className="px-6 pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="info" className="text-xs sm:text-sm">Info</TabsTrigger>
              <TabsTrigger value="devices" className="text-xs sm:text-sm gap-1">
                <Smartphone className="w-3 h-3" />
                <span className="hidden sm:inline">Devices</span>
                <span className="ml-1 px-1 rounded bg-primary/20 text-xs">{ownedDevices.length}</span>
              </TabsTrigger>
              <TabsTrigger value="shared" className="text-xs sm:text-sm gap-1">
                <Share2 className="w-3 h-3" />
                <span className="hidden sm:inline">Shared</span>
                <span className="ml-1 px-1 rounded bg-blue-500/20 text-xs">{sharedByUser.length}</span>
              </TabsTrigger>
              <TabsTrigger value="received" className="text-xs sm:text-sm gap-1">
                <UserPlus className="w-3 h-3" />
                <span className="hidden sm:inline">Received</span>
                <span className="ml-1 px-1 rounded bg-purple-500/20 text-xs">{sharedWithUser.length}</span>
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="max-h-[50vh] overflow-y-auto space-y-4 pb-4">
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
            </TabsContent>

            {/* Devices Tab */}
            <TabsContent value="devices" className="max-h-[50vh] overflow-y-auto pb-4">
              {isLoadingDevices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : ownedDevices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No devices registered</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ownedDevices.map((device, index) => (
                    <div
                      key={device.id || index}
                      className="flex items-center justify-between bg-muted/30 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {device.code?.match(/.{1,4}/g)?.join(" ")}
                          </p>
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
              )}
            </TabsContent>

            {/* Shared Devices Tab */}
            <TabsContent value="shared" className="max-h-[50vh] overflow-y-auto pb-4">
              {isLoadingDevices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : sharedByUser.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No devices shared by this user</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedByUser.map((share, index) => (
                    <div
                      key={share.id || index}
                      className="bg-muted/30 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">{share.deviceName}</p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {share.deviceCode?.match(/.{1,4}/g)?.join(" ")}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                          {share.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground pl-13">
                        <span className="text-foreground">Shared with:</span> {share.sharedWith?.fullName} ({share.sharedWith?.phone})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Received Devices Tab */}
            <TabsContent value="received" className="max-h-[50vh] overflow-y-auto pb-4">
              {isLoadingDevices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : sharedWithUser.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No devices shared with this user</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedWithUser.map((share, index) => (
                    <div
                      key={share.id || index}
                      className="bg-muted/30 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-medium">{share.deviceName}</p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {share.deviceCode?.match(/.{1,4}/g)?.join(" ")}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                          {share.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground pl-13">
                        <span className="text-foreground">Shared by:</span> {share.owner?.fullName} ({share.owner?.phone})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;

