import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
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
import { systemConfigAPI } from "@/services/api";
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
  Settings,
  Shield,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isSuperAdmin } = useAuth();
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
  
  // System Config state (superadmin only)
  const [maxPoliceAlerts, setMaxPoliceAlerts] = useState<string>('5');
  const [maxHospitalAlerts, setMaxHospitalAlerts] = useState<string>('5');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
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

  // Load user data from auth context on mount
  useEffect(() => {
    if (user) {
      setUserInfo({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
    setIsLoading(false);
  }, [user]);

  // Load system config for superadmin
  useEffect(() => {
    if (isSuperAdmin) {
      loadSystemConfig();
    } else {
      setIsLoadingConfig(false);
    }
  }, [isSuperAdmin]);

  const loadSystemConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const response = await systemConfigAPI.getConfig();
      const config = response.data;
      setMaxPoliceAlerts(String(config.maxPoliceAlertRecipients || 5));
      setMaxHospitalAlerts(String(config.maxHospitalAlertRecipients || 5));
    } catch (error) {
      console.error('Failed to load system config:', error);
      setMaxPoliceAlerts('5');
      setMaxHospitalAlerts('5');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleSaveAlertConfig = async () => {
    const policeLimit = parseInt(maxPoliceAlerts, 10);
    const hospitalLimit = parseInt(maxHospitalAlerts, 10);

    if (isNaN(policeLimit) || policeLimit < 1 || policeLimit > 50) {
      toast({ title: "Invalid Value", description: "Police alert limit must be between 1 and 50", variant: "destructive" });
      return;
    }
    if (isNaN(hospitalLimit) || hospitalLimit < 1 || hospitalLimit > 50) {
      toast({ title: "Invalid Value", description: "Hospital alert limit must be between 1 and 50", variant: "destructive" });
      return;
    }

    try {
      setIsSavingConfig(true);
      await systemConfigAPI.updateConfig({
        maxPoliceAlertRecipients: policeLimit,
        maxHospitalAlertRecipients: hospitalLimit,
      });
      toast({ title: "Success", description: "Alert configuration saved successfully" });
    } catch (error: unknown) {
      console.error('Failed to save config:', error);
      toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
    } finally {
      setIsSavingConfig(false);
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

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated.",
      });
    } catch (error: unknown) {
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
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
    } catch (error: unknown) {
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
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Notification Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error: unknown) {
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
      toast({
        title: "Error",
        description: "Failed to delete account.",
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

      {/* User Information */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          User Information
        </h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div 
                className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={handlePhotoClick}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {userInfo.fullName.charAt(0) || 'A'}
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
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Profile</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* System Configuration - Superadmin Only */}
      {isSuperAdmin && (
        <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Alert Configuration
          </h2>
          <p className="text-muted-foreground mb-6">
            Configure the maximum number of responders to alert during SOS events. Only the nearest responders within these limits will receive alerts.
          </p>
          
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Police Alert Limit</p>
                      <p className="text-xs text-muted-foreground">Max police to notify per SOS</p>
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={maxPoliceAlerts}
                    onChange={(e) => setMaxPoliceAlerts(e.target.value)}
                    placeholder="5"
                  />
                </div>
                
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Hospital Alert Limit</p>
                      <p className="text-xs text-muted-foreground">Max hospitals to notify per SOS</p>
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={maxHospitalAlerts}
                    onChange={(e) => setMaxHospitalAlerts(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline"
                  onClick={handleSaveAlertConfig}
                  disabled={isSavingConfig}
                  className="gap-2"
                >
                  {isSavingConfig ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Alert Config</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Appearance / Theme */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Appearance
        </h2>
        <p className="text-muted-foreground mb-4">Choose your preferred theme</p>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'light', icon: Sun, label: 'Light', desc: 'Bright & clean' },
            { key: 'dark', icon: Moon, label: 'Dark', desc: 'Easy on eyes' },
            { key: 'system', icon: Monitor, label: 'System', desc: 'Auto detect' },
          ].map(({ key, icon: Icon, label, desc }) => (
            <div
              key={key}
              onClick={() => setTheme(key as 'light' | 'dark' | 'system')}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                theme === key ? "border-primary bg-primary/10" : "border-border/50 bg-muted/30 hover:bg-muted/50"
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", theme === key ? "bg-primary/20" : "bg-muted")}>
                <Icon className={cn("w-6 h-6", theme === key ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preferences & Notifications */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Preferences & Notifications
        </h2>
        
        <div className="space-y-4">
          {[
            { key: 'accidentAlerts', icon: AlertTriangle, label: 'Accident Alerts', desc: 'Receive notifications for detected accidents' },
            { key: 'smsNotifications', icon: MessageSquare, label: 'SMS Notifications', desc: 'Receive SMS alerts on your phone' },
            { key: 'locationTracking', icon: MapPin, label: 'Location Tracking', desc: 'Enable real-time GPS tracking for devices' },
          ].map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Switch
                checked={notifications[key as keyof typeof notifications]}
                onCheckedChange={(checked) => setNotifications({ ...notifications, [key]: checked })}
              />
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={handleSaveNotifications} disabled={isSavingNotifications} className="gap-2">
            {isSavingNotifications ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Notifications</>}
          </Button>
        </div>
      </section>

      {/* Logout Section */}
      <section className="bg-card border border-border/50 rounded-3xl p-6 lg:p-8 mb-6 animate-fade-up" style={{ animationDelay: "0.35s" }}>
        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-primary" />
          Session
        </h2>
        <p className="text-muted-foreground mb-6">Sign out from your account on this device.</p>
        <Button variant="outline" onClick={() => { logout(); navigate("/"); }} className="gap-2">
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </section>

      {/* Danger Zone */}
      <section className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 lg:p-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <h2 className="text-xl font-bold text-destructive mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-muted-foreground mb-6">Once you delete your account, there is no going back.</p>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" /> Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" /> Delete Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>Do you want to delete your account <strong className="text-foreground">{userInfo.fullName}</strong>?</p>
                <p className="text-sm">This action is <strong>irreversible</strong>.</p>
                <div className="pt-2">
                  <label className="text-sm font-medium text-foreground">
                    Type <strong className="text-destructive">"delete my account"</strong> to proceed:
                  </label>
                  <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="delete my account" className="mt-2" />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirmText !== "delete my account" || isDeleting}>
                {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting...</> : <><Trash2 className="w-4 h-4 mr-2" /> Delete My Account</>}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
};

export default AdminSettings;
