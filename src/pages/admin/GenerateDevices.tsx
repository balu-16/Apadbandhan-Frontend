import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  QrCode,
  Plus,
  Loader2,
  CheckCircle,
  Package,
  Smartphone,
  User,
  Mail,
  Phone
} from "lucide-react";
import { adminAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface AssignedUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface QrCode {
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

interface Stats {
  total: number;
  available: number;
  assigned: number;
}

const GenerateDevices = () => {
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [count, setCount] = useState("10");
  const [generatedDevices, setGeneratedDevices] = useState<any[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [qrCodesRes, statsRes] = await Promise.all([
        adminAPI.getAllQrCodes(),
        adminAPI.getQrCodesStats(),
      ]);
      setQrCodes(qrCodesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch device data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    const countNum = parseInt(count);
    if (isNaN(countNum) || countNum < 1 || countNum > 100) {
      toast({
        title: "Error",
        description: "Please enter a number between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedDevices([]);

    try {
      const response = await adminAPI.generateDevices(countNum);
      setGeneratedDevices(response.data.devices);
      toast({
        title: "Success",
        description: response.data.message,
      });
      // Refresh the data
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <QrCode className="h-8 w-8 text-primary" />
          Generate Devices
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate new device codes that users can register
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-500">{stats?.available || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold text-orange-500">{stats?.assigned || 0}</p>
              </div>
              <Smartphone className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Form */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate New Devices
          </CardTitle>
          <CardDescription>
            Enter the number of devices to generate (1-100) and press Enter or click Generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="number"
              min="1"
              max="100"
              placeholder="Number of devices to generate"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              onKeyPress={handleKeyPress}
              className="max-w-xs"
            />
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Generate Devices
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recently Generated Devices */}
      {generatedDevices.length > 0 && (
        <Card className="bg-card border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-500 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Just Generated ({generatedDevices.length} devices)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Code</TableHead>
                    <TableHead>Device Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedDevices.map((device) => (
                    <TableRow key={device.id} className="bg-green-500/5">
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {device.deviceCode}
                        </code>
                      </TableCell>
                      <TableCell>{device.deviceName}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                          {device.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All QR Codes */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle>All Device Codes ({qrCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {qrCodes.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No device codes generated yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate some devices using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {qrCodes.map((qr) => (
                <Card key={qr._id || qr.id} className="bg-muted/30 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* QR Code Image */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center">
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}${qr.qrImageUrl}`}
                            alt={`QR Code ${qr.deviceCode}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';
                            }}
                          />
                        </div>
                      </div>

                      {/* Device Info */}
                      <div className="flex-1 space-y-3">
                        {/* 16-Digit Code */}
                        <div className="flex items-center gap-2">
                          <QrCode className="h-5 w-5 text-primary" />
                          <code className="text-lg font-mono font-bold tracking-wider bg-muted px-3 py-1 rounded">
                            {qr.deviceCode}
                          </code>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${qr.status === 'available'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-orange-500/20 text-orange-500'
                            }`}>
                            {qr.status}
                          </span>
                        </div>

                        {/* Device Name */}
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{qr.deviceName}</span>
                          <span className="mx-2">•</span>
                          <span>Created {formatDate(qr.createdAt)}</span>
                        </div>

                        {/* Assigned User Info */}
                        <div className="pt-2 border-t border-border/50">
                          {qr.assignedUser ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <div className="flex items-center gap-2 text-orange-500 font-medium">
                                <User className="h-4 w-4" />
                                <span>Assigned to:</span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{qr.assignedUser.fullName}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>+91 {qr.assignedUser.phone}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  <span>{qr.assignedUser.email}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-500">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Available for assignment</span>
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
    </div>
  );
};

export default GenerateDevices;
