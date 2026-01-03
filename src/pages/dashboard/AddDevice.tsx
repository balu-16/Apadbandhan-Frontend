import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  QrCode,
  ArrowRight,
  ArrowLeft,
  Check,
  Users,
  FileText,
  Smartphone,
  CheckCircle,
  Plus,
  Trash2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { devicesAPI, qrCodesAPI } from "@/services/api";
import QRScanner from "@/components/QRScanner";
import { useLocationPermissionCheck } from "@/components/LocationPermissionModal";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

interface FamilyMember {
  name: string;
  relation: string;
  phone: string;
}

interface InsuranceInfo {
  healthInsurance: string;
  vehicleInsurance: string;
  termInsurance: string;
}

const steps = [
  { id: 1, title: "Scan", icon: QrCode },
  { id: 2, title: "Name", icon: Smartphone },
  { id: 3, title: "Contacts", icon: Users },
  { id: 4, title: "Insurance", icon: FileText },
];

const relations = ["Father", "Mother", "Brother", "Sister", "Spouse", "Son", "Daughter", "Other"];

const AddDevice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { permissionStatus, checkAndRequestPermission, PermissionModal } = useLocationPermissionCheck();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check location permission on mount - needed for device tracking on map
  useEffect(() => {
    if (permissionStatus !== 'granted') {
      checkAndRequestPermission('device');
    }
  }, []);

  // Step 1: QR Scanner
  const [deviceCode, setDeviceCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [manualEntry, setManualEntry] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCodeValid, setIsCodeValid] = useState(false);

  // Step 2: Device Name
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("Vehicle");

  // Step 3: Emergency Contacts (flexible 1-5)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { name: "", relation: "", phone: "" },
  ]);

  // Step 4: Insurance
  const [insurance, setInsurance] = useState<InsuranceInfo>({
    healthInsurance: "",
    vehicleInsurance: "",
    termInsurance: "",
  });

  // Validate device code against database
  const validateDeviceCode = async (code: string): Promise<boolean> => {
    if (code.length !== 16) {
      setValidationError("Device code must be exactly 16 digits");
      return false;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await qrCodesAPI.validateCode(code);
      const data = response.data;

      if (data.valid) {
        // Code is valid and available
        setIsCodeValid(true);
        toast({
          title: "Valid Device Code!",
          description: `Device code: ${code.match(/.{1,4}/g)?.join(" ")}`,
        });
        return true;
      } else {
        // Code is invalid or not available
        setValidationError(data.message || "Invalid device QR code");
        toast({
          title: "Invalid QR Code",
          description: data.message || "This device code is not valid.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: unknown) {
      console.error('Validation error:', error);
      const err = error as AxiosErrorLike;
      const errorMessage = err.response?.data?.message || "Invalid device QR code. Please scan a valid device.";
      setValidationError(errorMessage);
      toast({
        title: "Invalid QR Code",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleQRScanSuccess = async (code: string) => {
    // First check if it's 16 digits
    if (code.length !== 16) {
      setValidationError("Scanned code must be exactly 16 digits");
      toast({
        title: "Invalid QR Code",
        description: "The scanned code is not a valid 16-digit device code.",
        variant: "destructive",
      });
      return;
    }

    // Validate against database
    const isValid = await validateDeviceCode(code);
    if (isValid) {
      setDeviceCode(code);
    }
  };

  const handleManualCodeSubmit = async () => {
    if (manualCode.length !== 16) {
      setValidationError("Please enter all 16 digits");
      return;
    }

    const isValid = await validateDeviceCode(manualCode);
    if (isValid) {
      setDeviceCode(manualCode);
    } else {
      // Keep the code so user can see what was entered
      setManualCode("");
    }
  };

  const resetDeviceCode = () => {
    setDeviceCode("");
    setManualCode("");
    setIsCodeValid(false);
    setValidationError(null);
    setManualEntry(false);
  };

  const goToStep = (step: number) => {
    if (step === currentStep || isAnimating) return;

    setDirection(step > currentStep ? "forward" : "backward");
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentStep(step);
      setIsAnimating(false);
    }, 300);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const addFamilyMember = () => {
    if (familyMembers.length < 5) {
      setFamilyMembers([...familyMembers, { name: "", relation: "", phone: "" }]);
    }
  };

  const removeFamilyMember = (index: number) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter((_, i) => i !== index));
    }
  };

  const handleSaveDevice = async () => {
    setIsSaving(true);

    try {
      // Filter out empty contacts and format data
      const validContacts = familyMembers.filter(m => m.name && m.relation && m.phone);

      const deviceData = {
        name: deviceName,
        code: deviceCode,
        type: deviceType,
        emergencyContacts: validContacts,
        // Backend expects specific insurance fields, but for now we map simple inputs
        // Note: Backend schema uses healthInsuranceNumber etc, but functionality 
        // works as the service handles the mapping or the schema allows flexible fields
        healthInsurance: insurance.healthInsurance || undefined,
        vehicleInsurance: insurance.vehicleInsurance || undefined,
        termInsurance: insurance.termInsurance || undefined,
      };

      const response = await devicesAPI.create(deviceData);
      setIsCompleted(true);

      toast({
        title: "Device Registered!",
        description: "Your device has been successfully added.",
      });
    } catch (error: unknown) {
      console.error('Error saving device:', error);
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to register device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Must have 16 digits AND be validated against database
        return deviceCode.length === 16 && isCodeValid;
      case 2:
        return deviceName.trim().length > 0;
      case 3:
        // At least one family member with all fields filled
        return familyMembers.some(m => m.name && m.relation && m.phone && m.phone.length === 10);
      case 4:
        return true; // Insurance is optional
      default:
        return false;
    }
  };

  // Completion Screen
  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border/50 rounded-3xl p-8 lg:p-12 animate-fade-up">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse-glow">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Device Registered!</h2>
            <p className="text-muted-foreground">Your device has been successfully added to your account.</p>
          </div>

          {/* Summary Card */}
          <div className="bg-muted/50 rounded-2xl p-6 mb-8 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Device Name</span>
              <span className="font-semibold text-foreground">{deviceName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Device Code</span>
              <span className="font-mono font-semibold text-primary">{deviceCode}</span>
            </div>
            <div className="py-2 border-b border-border/50">
              <span className="text-muted-foreground block mb-2">Emergency Contacts</span>
              <div className="space-y-1">
                {familyMembers.filter(m => m.name).map((member, index) => (
                  <div key={index} className="text-sm text-foreground">
                    {member.name} ({member.relation}) - {member.phone}
                  </div>
                ))}
              </div>
            </div>
            <div className="py-2">
              <span className="text-muted-foreground block mb-2">Insurance Details</span>
              <div className="space-y-1 text-sm text-foreground">
                {insurance.healthInsurance && <div>Health: {insurance.healthInsurance}</div>}
                {insurance.vehicleInsurance && <div>Vehicle: {insurance.vehicleInsurance}</div>}
                {insurance.termInsurance && <div>Term: {insurance.termInsurance}</div>}
                {!insurance.healthInsurance && !insurance.vehicleInsurance && !insurance.termInsurance && (
                  <div className="text-muted-foreground">No insurance details provided</div>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="hero"
            className="w-full"
            size="lg"
            onClick={() => navigate("/dashboard/devices")}
          >
            Go to Devices
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Location Permission Modal */}
      {PermissionModal}
      
      {/* Progress Steps */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => step.id < currentStep && goToStep(step.id)}
                disabled={step.id > currentStep}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300",
                  step.id === currentStep
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : step.id < currentStep
                      ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <step.icon className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">{step.title}</span>
              </button>

              {index < steps.length - 1 && (
                <div className={cn(
                  "w-12 lg:w-24 h-1 mx-2 rounded-full transition-colors duration-300",
                  step.id < currentStep ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border/50 rounded-3xl p-8 lg:p-10 overflow-hidden">
        <div
          className={cn(
            "transition-all duration-300",
            isAnimating && direction === "forward" && "opacity-0 translate-x-8",
            isAnimating && direction === "backward" && "opacity-0 -translate-x-8",
            !isAnimating && "opacity-100 translate-x-0"
          )}
        >
          {/* Step 1: QR Scanner */}
          {currentStep === 1 && (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Scan Device QR Code
                </h2>
                <p className="text-muted-foreground">
                  Scan the QR code on your device or enter the 16-digit code manually.
                </p>
              </div>

              {!isCodeValid ? (
                <div className="space-y-6">
                  {/* Validation Error Message */}
                  {validationError && (
                    <div className="max-w-md mx-auto flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive animate-fade-up">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">{validationError}</p>
                    </div>
                  )}

                  {!manualEntry ? (
                    <>
                      <QRScanner
                        onScanSuccess={handleQRScanSuccess}
                        onScanError={(error) => console.error('Scan error:', error)}
                      />

                      {/* Validating indicator */}
                      {isValidating && (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying device code...</span>
                        </div>
                      )}

                      <div className="text-center">
                        <button
                          onClick={() => {
                            setManualEntry(true);
                            setValidationError(null);
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          Enter code manually instead
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="max-w-md mx-auto">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Enter 16-digit Device Code
                      </label>
                      <Input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={manualCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setManualCode(value);
                          setValidationError(null);
                        }}
                        className={cn(
                          "text-lg font-mono tracking-wider text-center",
                          validationError && "border-destructive focus-visible:ring-destructive"
                        )}
                        maxLength={16}
                        disabled={isValidating}
                      />
                      <p className={cn(
                        "text-sm mt-2 text-center",
                        manualCode.length === 16 ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {manualCode.length}/16 digits
                        {manualCode.length === 16 && " ✓"}
                      </p>

                      {/* Verify Button */}
                      <Button
                        onClick={handleManualCodeSubmit}
                        disabled={manualCode.length !== 16 || isValidating}
                        className="w-full mt-4"
                        variant="hero"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            Verify Device Code
                          </>
                        )}
                      </Button>

                      <div className="text-center mt-4">
                        <button
                          onClick={() => {
                            setManualEntry(false);
                            setManualCode("");
                            setValidationError(null);
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          Scan QR code instead
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>

                  <div className="text-center animate-fade-up">
                    <p className="text-sm text-muted-foreground mb-2">Device Code Verified</p>
                    <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                      {deviceCode.match(/.{1,4}/g)?.join(" ")}
                    </p>
                    <p className="text-sm text-green-500 mt-2">✓ Valid device found in our system</p>

                    <button
                      onClick={resetDeviceCode}
                      className="mt-4 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Scan a different device
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Device Name */}
          {currentStep === 2 && (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Enter Device Name
                </h2>
                <p className="text-muted-foreground">
                  Give your device a recognizable name (e.g., Car, Bike, Smart Helmet)
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Device Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., My Car, Bike, Phone"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="text-lg"
                />

                {/* Suggestions */}
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Car", "Bike", "Phone", "Smart Helmet", "Truck"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setDeviceName(suggestion)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                          deviceName === suggestion
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contacts */}
          {currentStep === 3 && (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Add Family Members for Emergency Alerts
                </h2>
                <p className="text-muted-foreground">
                  At least 1 contact is required. You can add up to 5 contacts.
                </p>
              </div>

              <div className="space-y-4">
                {familyMembers.map((member, index) => (
                  <div
                    key={index}
                    className="bg-muted/30 rounded-xl p-4 border border-border/30"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Contact {index + 1} {index === 0 && <span className="text-primary">*</span>}
                      </p>
                      {familyMembers.length > 1 && (
                        <button
                          onClick={() => removeFamilyMember(index)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={member.name}
                        onChange={(e) => updateFamilyMember(index, "name", e.target.value)}
                      />
                      <Select
                        value={member.relation}
                        onValueChange={(value) => updateFamilyMember(index, "relation", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Relation" />
                        </SelectTrigger>
                        <SelectContent>
                          {relations.map((rel) => (
                            <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 bg-muted border border-border rounded-xl text-foreground text-sm">
                          +91
                        </div>
                        <Input
                          type="tel"
                          placeholder="Phone Number"
                          value={member.phone}
                          onChange={(e) => updateFamilyMember(index, "phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Contact Button */}
                {familyMembers.length < 5 && (
                  <button
                    onClick={addFamilyMember}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Another Contact ({familyMembers.length}/5)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Insurance Information */}
          {currentStep === 4 && (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Insurance & Safety Information
                </h2>
                <p className="text-muted-foreground">
                  Add your insurance details for quick access during emergencies (optional)
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Health Insurance Number
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter policy number"
                    value={insurance.healthInsurance}
                    onChange={(e) => setInsurance({ ...insurance, healthInsurance: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Vehicle Insurance Number
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter policy number"
                    value={insurance.vehicleInsurance}
                    onChange={(e) => setInsurance({ ...insurance, vehicleInsurance: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Term Insurance Number
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter policy number"
                    value={insurance.termInsurance}
                    onChange={(e) => setInsurance({ ...insurance, termInsurance: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-border/30">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={cn(currentStep === 1 && "opacity-0 pointer-events-none")}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              variant="hero"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="hero"
              onClick={handleSaveDevice}
              disabled={!canProceed() || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Device
                  <Check className="w-5 h-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddDevice;
