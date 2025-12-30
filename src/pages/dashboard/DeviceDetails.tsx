import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Smartphone, 
  MapPin, 
  ArrowLeft, 
  Edit, 
  Trash2,
  Wifi,
  WifiOff,
  Calendar,
  Users,
  FileText,
  Phone,
  Navigation,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data - in real app this would come from API
const mockDeviceData = {
  "1": {
    id: "1",
    name: "My Car",
    type: "Vehicle",
    code: "4829173650482917",
    registeredDate: "2024-01-15",
    lastUpdate: "2 minutes ago",
    status: "online" as const,
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: "Connaught Place, New Delhi"
    },
    emergencyContacts: [
      { name: "Rajesh Kumar", relation: "Father", phone: "9876543210" },
      { name: "Priya Kumar", relation: "Mother", phone: "9876543211" },
      { name: "Amit Kumar", relation: "Brother", phone: "9876543212" },
      { name: "Sneha Kumar", relation: "Sister", phone: "9876543213" },
      { name: "Vikram Singh", relation: "Friend", phone: "9876543214" },
    ],
    insurance: {
      health: "HLTH-2024-001234",
      vehicle: "VEH-2024-005678",
      term: "TERM-2024-009012",
    }
  },
  "2": {
    id: "2",
    name: "Bike",
    type: "Two Wheeler",
    code: "9182736450918273",
    registeredDate: "2024-02-20",
    lastUpdate: "1 hour ago",
    status: "online" as const,
    location: {
      lat: 28.5355,
      lng: 77.3910,
      address: "Sector 18, Noida"
    },
    emergencyContacts: [
      { name: "Suresh Patel", relation: "Father", phone: "9988776655" },
      { name: "Kamla Patel", relation: "Mother", phone: "9988776656" },
    ],
    insurance: {
      health: "HLTH-2024-002345",
      vehicle: "VEH-2024-006789",
      term: "",
    }
  },
  "3": {
    id: "3",
    name: "Smart Helmet",
    type: "Wearable",
    code: "5647382910564738",
    registeredDate: "2024-03-10",
    lastUpdate: "3 days ago",
    status: "offline" as const,
    location: {
      lat: 28.4595,
      lng: 77.0266,
      address: "Cyber City, Gurugram"
    },
    emergencyContacts: [
      { name: "Arun Sharma", relation: "Father", phone: "8877665544" },
    ],
    insurance: {
      health: "",
      vehicle: "",
      term: "",
    }
  },
};

const DeviceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const device = id ? mockDeviceData[id as keyof typeof mockDeviceData] : null;

  if (!device) {
    return (
      <div className="w-full text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
          <Smartphone className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Device Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The device you're looking for doesn't exist.
        </p>
        <Link to="/dashboard/devices">
          <Button variant="hero">
            <ArrowLeft className="w-5 h-5" />
            Back to Devices
          </Button>
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      toast({
        title: "Device Deleted",
        description: `${device.name} has been removed from your account.`,
      });
      navigate("/dashboard/devices");
    }, 1000);
  };

  return (
    <div className="w-full">
      {/* Back Button */}
      <Link 
        to="/dashboard/devices" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 animate-fade-up"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Devices
      </Link>

      {/* Device Overview */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              device.status === "online" 
                ? "bg-green-500/20" 
                : "bg-muted"
            )}>
              <Smartphone className={cn(
                "w-8 h-8",
                device.status === "online" ? "text-green-500" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{device.name}</h1>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1",
                device.status === "online"
                  ? "bg-green-500/20 text-green-500"
                  : "bg-muted text-muted-foreground"
              )}>
                {device.status === "online" ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                {device.status === "online" ? "Online" : "Offline"}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit Device
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Device?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete 
                    "{device.name}" and remove all associated data including 
                    emergency contacts and insurance information.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Device"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Type</p>
            <p className="font-semibold text-foreground">{device.type}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Device Code</p>
            <p className="font-mono font-semibold text-primary text-sm">
              {device.code.match(/.{1,4}/g)?.join(" ")}
            </p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              Registered
            </div>
            <p className="font-semibold text-foreground">
              {new Date(device.registeredDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Last Update</p>
            <p className="font-semibold text-foreground">{device.lastUpdate}</p>
          </div>
        </div>
      </section>

      {/* Live Map */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Live Location
        </h2>
        
        {/* Map Placeholder - In production, integrate with actual map API */}
        <div className="relative rounded-2xl overflow-hidden bg-muted/50 h-64 lg:h-80">
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/30 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Navigation className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium text-foreground">{device.location.address}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {device.location.lat.toFixed(4)}, {device.location.lng.toFixed(4)}
              </p>
            </div>
          </div>
          
          {/* GPS Pointer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-primary shadow-glow animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Emergency Contacts
        </h2>
        
        <div className="grid gap-3">
          {device.emergencyContacts.map((contact, index) => (
            <div 
              key={index}
              className="flex items-center justify-between bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-semibold text-primary">
                    {contact.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.relation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm text-foreground">+91 {contact.phone}</span>
              </div>
            </div>
          ))}
          
          {device.emergencyContacts.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No emergency contacts added
            </p>
          )}
        </div>
      </section>

      {/* Insurance Information */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Insurance Information
        </h2>
        
        <div className="grid gap-3">
          <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <span className="font-medium text-foreground">Health Insurance</span>
            </div>
            <span className={cn(
              "font-mono text-sm",
              device.insurance.health ? "text-foreground" : "text-muted-foreground"
            )}>
              {device.insurance.health || "Not provided"}
            </span>
          </div>
          
          <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-medium text-foreground">Vehicle Insurance</span>
            </div>
            <span className={cn(
              "font-mono text-sm",
              device.insurance.vehicle ? "text-foreground" : "text-muted-foreground"
            )}>
              {device.insurance.vehicle || "Not provided"}
            </span>
          </div>
          
          <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-500" />
              </div>
              <span className="font-medium text-foreground">Term Insurance</span>
            </div>
            <span className={cn(
              "font-mono text-sm",
              device.insurance.term ? "text-foreground" : "text-muted-foreground"
            )}>
              {device.insurance.term || "Not provided"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeviceDetails;
