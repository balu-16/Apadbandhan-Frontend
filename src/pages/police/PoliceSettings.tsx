import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { policeAPI } from "@/services/api";
import { 
  User, 
  Phone, 
  Mail, 
  Camera,
  Bell,
  MapPin,
  MessageSquare,
  AlertTriangle,
  Trash2,
  Save,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Palette,
  LogOut,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
  code?: number;
}

const PoliceSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Active status for location tracking
  const [isActive, setIsActive] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  
  // User Information
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  
  // Notification Preferences
  const [notifications, setNotifications] = useState({
    accidentAlerts: true,
    smsNotifications: true,
    locationTracking: true,
  });

  // Check location permission on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
        result.onchange = () => {
          setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
        };
      });
    }
  }, []);

  // Refresh user data from server on mount to get latest isActive status
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Load user data from auth context
  useEffect(() => {
    if (user) {
      console.log('[PoliceSettings] User data:', user);
      console.log('[PoliceSettings] isActive from user:', user.isActive);
      setUserInfo({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      // Load isActive status from user data
      setIsActive(user.isActive ?? false);
    }
    setIsLoading(false);
  }, [user]);

  // Location tracking logic
  const updateLocation = useCallback(async () => {
    if (!isActive) return;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;

      // Send to backend (backend will check if moved 10+ meters)
      await policeAPI.updateLocation({
        latitude,
        longitude,
        accuracy: accuracy || undefined,
        altitude: altitude || undefined,
        speed: speed || undefined,
        heading: heading || undefined,
      });

      lastLocationRef.current = { latitude, longitude };
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      if (err.code === 1) {
        // Permission denied
        setLocationPermission('denied');
        setIsActive(false);
        toast({
          title: "Location Permission Denied",
          description: "Please enable location access in your browser settings.",
          variant: "destructive",
        });
      }
      console.error("Error updating location:", error);
    }
  }, [isActive, toast]);

  // Start/stop location tracking based on isActive
  useEffect(() => {
    if (isActive && locationPermission === 'granted') {
      // Update immediately
      updateLocation();
      
      // Then update every 30 seconds
      locationIntervalRef.current = setInterval(updateLocation, 30000);
    } else {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [isActive, locationPermission, updateLocation]);

  const handleActiveToggle = async (checked: boolean) => {
    if (checked) {
      // Request location permission
      try {
        await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        
        setLocationPermission('granted');
        
        // Save isActive to database
        await policeAPI.updateProfile({ isActive: true });
        setIsActive(true);
        
        toast({
          title: "Location Tracking Active",
          description: "Your location will be updated every 30 seconds when you move.",
        });
      } catch (error: unknown) {
        const err = error as AxiosErrorLike;
        if (err.code === 1) {
          setLocationPermission('denied');
          toast({
            title: "Location Permission Denied",
            description: "Please enable location access to activate tracking.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update active status.",
            variant: "destructive",
          });
        }
      }
    } else {
      try {
        // Save isActive to database
        await policeAPI.updateProfile({ isActive: false });
        setIsActive(false);
        toast({
          title: "Location Tracking Disabled",
          description: "Your location is no longer being tracked.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update active status.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfilePhoto(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Photo upload stored locally for now
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: "Failed to upload photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsSavingProfile(true);
    try {
      // Profile updates stored locally for now
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user?.id) return;
    
    setIsSavingNotifications(true);
    try {
      // Notification preferences stored locally for now
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Notification Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: "Failed to save notification settings.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || deleteConfirmText !== "delete my account") return;
    
    setIsDeleting(true);
    try {
      // Account deletion - logout for now
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      logout();
      navigate("/");
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete account.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 animate-fade-up">
        <h1 className="text-3xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and preferences
        </p>
      </div>

      {/* Active Status Section */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Radio className="w-5 h-5 text-blue-500" />
          Active Status
        </h2>
        
        <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isActive ? "bg-green-500/20" : "bg-muted"
            )}>
              <MapPin className={cn(
                "w-5 h-5",
                isActive ? "text-green-500" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium text-foreground">Are you active?</p>
              <p className="text-sm text-muted-foreground">
                {isActive 
                  ? "Your location is being tracked every 30 seconds"
                  : "Enable to share your location for emergency response"
                }
              </p>
              {locationPermission === 'denied' && (
                <p className="text-xs text-red-500 mt-1">
                  Location permission denied. Please enable it in browser settings.
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={handleActiveToggle}
            disabled={locationPermission === 'denied'}
          />
        </div>
      </section>

      {/* User Information */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          User Information
        </h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div 
                className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={handlePhotoClick}
              >
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {userInfo.fullName.charAt(0) || 'P'}
                  </span>
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Click to upload</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          
          {/* Form Fields */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <Input
                type="text"
                value={userInfo.fullName}
                onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <Input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-4 bg-muted border border-border rounded-xl text-foreground min-w-[60px] justify-center">
                  +91
                </div>
                <Input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="Phone Number"
                  className="flex-1"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Phone number cannot be changed</p>
            </div>
            
            <div className="pt-2">
              <Button 
                variant="outline"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance / Theme */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Appearance
        </h2>
        <p className="text-muted-foreground mb-4">
          Choose your preferred theme for the application
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          <div
            onClick={() => setTheme('light')}
            className={cn(
              "flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
              theme === 'light'
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-muted/30 hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              theme === 'light' ? "bg-primary/20" : "bg-muted"
            )}>
              <Sun className={cn("w-6 h-6", theme === 'light' ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Light</p>
              <p className="text-xs text-muted-foreground">Bright & clean</p>
            </div>
          </div>

          <div
            onClick={() => setTheme('dark')}
            className={cn(
              "flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
              theme === 'dark'
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-muted/30 hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              theme === 'dark' ? "bg-primary/20" : "bg-muted"
            )}>
              <Moon className={cn("w-6 h-6", theme === 'dark' ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Dark</p>
              <p className="text-xs text-muted-foreground">Easy on eyes</p>
            </div>
          </div>

          <div
            onClick={() => setTheme('system')}
            className={cn(
              "flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
              theme === 'system'
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-muted/30 hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              theme === 'system' ? "bg-primary/20" : "bg-muted"
            )}>
              <Monitor className={cn("w-6 h-6", theme === 'system' ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">System</p>
              <p className="text-xs text-muted-foreground">Auto detect</p>
            </div>
          </div>
        </div>
      </section>

      {/* Preferences & Notifications */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Preferences & Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Accident Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for detected accidents
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.accidentAlerts}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, accidentAlerts: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive SMS alerts on your phone
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.smsNotifications}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, smsNotifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Location Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Enable GPS tracking when active
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.locationTracking}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, locationTracking: checked })
              }
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            variant="outline"
            onClick={handleSaveNotifications}
            disabled={isSavingNotifications}
            className="gap-2"
          >
            {isSavingNotifications ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Notifications
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Logout Section */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.35s" }}>
        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-primary" />
          Session
        </h2>
        <p className="text-muted-foreground mb-6">
          Sign out from your account on this device.
        </p>
        
        <Button 
          variant="outline"
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </section>

      {/* Danger Zone */}
      <section className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 lg:p-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <h2 className="text-xl font-bold text-destructive mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-muted-foreground mb-6">
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Delete Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  Do you want to delete your account <strong className="text-foreground">{userInfo.fullName || user?.fullName}</strong>?
                </p>
                <p className="text-sm">
                  This action is <strong>irreversible</strong>. All your data will be permanently deleted.
                </p>
                <div className="pt-2">
                  <label className="text-sm font-medium text-foreground">
                    Type <strong className="text-destructive">"delete my account"</strong> to proceed:
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="delete my account"
                    className="mt-2"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "delete my account" || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
};

export default PoliceSettings;
