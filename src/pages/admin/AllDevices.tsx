import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Smartphone,
  Search,
  QrCode,
  Plus,
  Loader2,
  CheckCircle,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Activity,
  Trash2
} from "lucide-react";
import { adminAPI, qrCodesAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import DeviceDetailsPopup from "@/components/admin/DeviceDetailsPopup";
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

interface AssignedUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface QrCodeDevice {
  _id: string;
  id: string;
  deviceCode: string;
  deviceName: string;
  status: string;
  isAssigned: boolean;
  qrImageUrl: string;
  assignedUser: AssignedUser | null;
  createdAt: string;
}

interface RegisteredDevice {
  _id: string;
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  batteryLevel: number;
  userId: any;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isActive: boolean;
  createdAt: string;
  lastOnlineAt?: string;
}

interface Stats {
  total: number;
  available: number;
  assigned: number;
}

const AllDevices = () => {
  const [qrCodes, setQrCodes] = useState<QrCodeDevice[]>([]);
  const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [generateCount, setGenerateCount] = useState("10");

  // Device details popup state
  const [selectedDevice, setSelectedDevice] = useState<QrCodeDevice | RegisteredDevice | null>(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState<"qrcode" | "registered">("qrcode");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<QrCodeDevice | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  // API base URL for QR images
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [qrCodesRes, statsRes, devicesRes] = await Promise.all([
        adminAPI.getAllQrCodes(),
        adminAPI.getQrCodesStats(),
        adminAPI.getAllDevices(),
      ]);
      setQrCodes(qrCodesRes.data);
      setStats(statsRes.data);
      setRegisteredDevices(devicesRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch devices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    const count = parseInt(generateCount);
    if (isNaN(count) || count < 1 || count > 100) {
      toast({
        title: "Error",
        description: "Please enter a number between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await adminAPI.generateDevices(count);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate devices",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, device: QrCodeDevice) => {
    e.stopPropagation(); // Prevent opening the details popup
    setDeviceToDelete(device);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deviceToDelete || deleteConfirmText !== "confirm delete") {
      toast({
        title: "Error",
        description: "Please type 'confirm delete' to proceed",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await qrCodesAPI.delete(deviceToDelete._id || deviceToDelete.id);
      toast({
        title: "Success",
        description: `Device ${deviceToDelete.deviceCode} deleted successfully`,
      });
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
      setDeleteConfirmText("");
      fetchData(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete device",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get QR image URL
  const getQrImageUrl = (deviceCode: string) => {
    return `${apiBaseUrl}/qrcodes/image/${deviceCode}`;
  };

  const filteredQrCodes = qrCodes.filter(device =>
    device.deviceCode.includes(searchTerm) ||
    device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (device.assignedUser?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredRegisteredDevices = registeredDevices.filter(device =>
    device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.code?.includes(searchTerm) ||
    device.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-500';
      case 'offline': return 'bg-red-500/20 text-red-500';
      case 'available': return 'bg-green-500/20 text-green-500';
      case 'assigned': return 'bg-orange-500/20 text-orange-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Smartphone className="h-8 w-8 text-blue-500" />
          Devices Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate and manage device codes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registered Devices</p>
                <p className="text-2xl font-bold">{registeredDevices.length}</p>
              </div>
              <Smartphone className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-500">
                  {registeredDevices.filter(d => d.status === 'online').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">QR Codes</p>
                <p className="text-2xl font-bold text-purple-500">{stats?.total || 0}</p>
              </div>
              <QrCode className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available QR Codes</p>
                <p className="text-2xl font-bold text-green-500">{stats?.available || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate New Devices
          </CardTitle>
          <CardDescription>
            Enter number of devices (1-100) and press Enter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="number"
              min="1"
              max="100"
              placeholder="Number of devices"
              value={generateCount}
              onChange={(e) => setGenerateCount(e.target.value)}
              onKeyDown={handleKeyPress}
              className="max-w-xs"
            />
            <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
              ) : (
                <><Plus className="h-4 w-4" />Generate</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, name, or user..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="registered" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="registered">Registered Devices ({filteredRegisteredDevices.length})</TabsTrigger>
          <TabsTrigger value="qrcodes">QR Codes ({filteredQrCodes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="registered">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Registered Devices</CardTitle>
              <CardDescription>Devices that users have registered and are using</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRegisteredDevices.length === 0 ? (
                <div className="text-center py-12">
                  <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No registered devices found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRegisteredDevices.map((device) => (
                    <Card
                      key={device._id || device.id}
                      className="bg-muted/30 border-border/50 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all duration-200"
                      onClick={() => {
                        setSelectedDevice(device);
                        setSelectedDeviceType("registered");
                        setIsDetailsOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Smartphone className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-lg">{device.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                                {device.status}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500">
                                {device.type}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                                {device.code}
                              </code>
                              {device.location?.latitude && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{device.location.address || `${device.location.latitude.toFixed(4)}, ${device.location.longitude.toFixed(4)}`}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Registered: {formatDate(device.createdAt)} • Last online: {formatDate(device.lastOnlineAt || '')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrcodes">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>QR Codes</CardTitle>
              <CardDescription>Generated device codes ready for assignment</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredQrCodes.length === 0 ? (
                <div className="text-center py-12">
                  <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No QR codes found</p>
                  <p className="text-sm text-muted-foreground mt-1">Generate devices above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQrCodes.map((device) => (
                    <Card
                      key={device._id || device.id}
                      className="bg-muted/30 border-border/50 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 relative group"
                      onClick={() => {
                        setSelectedDevice(device);
                        setSelectedDeviceType("qrcode");
                        setIsDetailsOpen(true);
                      }}
                    >
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
                        onClick={(e) => handleDeleteClick(e, device)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden">
                              <img
                                src={getQrImageUrl(device.deviceCode)}
                                alt={`QR ${device.deviceCode}`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1.5'%3E%3Crect x='3' y='3' width='7' height='7'/%3E%3Crect x='14' y='3' width='7' height='7'/%3E%3Crect x='3' y='14' width='7' height='7'/%3E%3Crect x='14' y='14' width='7' height='7'/%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <QrCode className="h-4 w-4 text-primary" />
                              <code className="text-sm font-mono font-bold bg-muted px-2 py-1 rounded">
                                {device.deviceCode}
                              </code>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                                {device.status}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {device.deviceName} • {formatDate(device.createdAt)}
                            </div>
                            <div className="pt-1 border-t border-border/50">
                              {device.assignedUser ? (
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <User className="h-3 w-3 text-orange-500" />
                                  <span className="font-medium">{device.assignedUser.fullName}</span>
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">+91 {device.assignedUser.phone}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-green-500 text-sm">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Available</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Device Details Popup */}
      <DeviceDetailsPopup
        device={selectedDevice}
        deviceType={selectedDeviceType}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onDelete={(device) => {
          setIsDetailsOpen(false);
          setDeviceToDelete(device as QrCodeDevice);
          setDeleteConfirmText("");
          setDeleteDialogOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Device
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Are you sure you want to delete the device{" "}
                <strong className="text-foreground">{deviceToDelete?.deviceName}</strong> with code{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-sm">
                  {deviceToDelete?.deviceCode}
                </code>
                ?
              </p>
              <p className="text-destructive font-medium">
                This action cannot be reversed.
              </p>
              <div className="space-y-2 pt-2">
                <p className="text-sm text-muted-foreground">
                  Type <strong className="text-foreground">confirm delete</strong> to proceed:
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="confirm delete"
                  className="font-mono"
                  autoFocus
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
              disabled={deleteConfirmText !== "confirm delete" || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
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

export default AllDevices;
