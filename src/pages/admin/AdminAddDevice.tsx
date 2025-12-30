import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PlusCircle, 
  Smartphone, 
  User,
  Loader2,
  QrCode
} from "lucide-react";
import { devicesAPI, adminAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

interface User {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

const AdminAddDevice = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "Vehicle",
    userId: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const basePath = isSuperAdmin ? "/superadmin" : "/admin";

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.userId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.code.length !== 16) {
      toast({
        title: "Error",
        description: "Device code must be 16 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create device for the selected user
      await devicesAPI.create({
        name: formData.name,
        code: formData.code,
        type: formData.type,
      });
      
      toast({
        title: "Success",
        description: "Device added successfully",
      });
      navigate(`${basePath}/devices`);
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to add device",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <PlusCircle className="h-8 w-8 text-primary" />
          Add New Device
        </h1>
        <p className="text-muted-foreground mt-1">
          Register a new device for a user
        </p>
      </div>

      {/* Form */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Information
          </CardTitle>
          <CardDescription>
            Enter the device details to register a new device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device Name */}
          <div>
            <label className="text-sm font-medium">Device Name *</label>
            <Input
              placeholder="e.g., My Smart Helmet"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Device Code */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Device Code (16 characters) *
            </label>
            <Input
              placeholder="Enter 16-character device code"
              value={formData.code}
              maxLength={16}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is the unique code printed on the device or QR sticker
            </p>
          </div>

          {/* Device Type */}
          <div>
            <label className="text-sm font-medium">Device Type *</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vehicle">Vehicle</SelectItem>
                <SelectItem value="Bike">Bike</SelectItem>
                <SelectItem value="Car">Car</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Smart Helmet">Smart Helmet</SelectItem>
                <SelectItem value="Wearable">Wearable</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Selection */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Assign to User *
            </label>
            <Select
              value={formData.userId}
              onValueChange={(value) => setFormData({ ...formData, userId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user._id || user.id} value={user._id || user.id}>
                    <div className="flex flex-col">
                      <span>{user.fullName}</span>
                      <span className="text-xs text-muted-foreground">{user.phone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate(`${basePath}/devices`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding Device...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Device
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAddDevice;
