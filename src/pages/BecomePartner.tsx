import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Building2, 
  Shield, 
  Trees, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Loader2,
  Navigation,
  LocateFixed
} from "lucide-react";
import { toast } from "sonner";
import { partnersAPI } from "@/services/api";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

type PartnerType = "hospital" | "police" | "ranger" | null;

interface PartnerFormData {
  partnerType: PartnerType;
  organizationName: string;
  registrationNumber: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  description: string;
  // Hospital specific
  hospitalType?: string;
  numberOfBeds?: string;
  emergencyServices?: string;
  // Police specific
  stationCode?: string;
  jurisdiction?: string;
  // Ranger specific
  forestDivision?: string;
  patrolArea?: string;
}

const initialFormData: PartnerFormData = {
  partnerType: null,
  organizationName: "",
  registrationNumber: "",
  contactPersonName: "",
  contactPersonDesignation: "",
  email: "",
  phone: "",
  alternatePhone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  latitude: "",
  longitude: "",
  description: "",
  hospitalType: "",
  numberOfBeds: "",
  emergencyServices: "",
  stationCode: "",
  jurisdiction: "",
  forestDivision: "",
  patrolArea: "",
};

const partnerTypes = [
  {
    id: "hospital" as PartnerType,
    name: "Hospital",
    icon: Building2,
    description: "Medical facilities, clinics, and healthcare providers",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    hoverBorder: "hover:border-red-500",
  },
  {
    id: "police" as PartnerType,
    name: "Police",
    icon: Shield,
    description: "Law enforcement agencies and police stations",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    hoverBorder: "hover:border-blue-500",
  },
  {
    id: "ranger" as PartnerType,
    name: "Forest Ranger",
    icon: Trees,
    description: "Forest department and wildlife protection services",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    hoverBorder: "hover:border-green-500",
  },
];

const BecomePartner = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PartnerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePartnerTypeSelect = (type: PartnerType) => {
    setFormData({ ...formData, partnerType: type });
    setStep(2);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      // Validate basic info
      if (!formData.organizationName || !formData.contactPersonName || !formData.email || !formData.phone) {
        toast.error("Please fill in all required fields");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate final step
    if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast.error("Please fill in all required fields");
      return;
    }

    // For hospitals, validate coordinates
    if (formData.partnerType === 'hospital' && (!formData.latitude || !formData.longitude)) {
      toast.error("Please provide the hospital's exact coordinates (latitude and longitude)");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for API based on partner type
      let specialization = '';
      let coverageArea = '';
      
      if (formData.partnerType === 'hospital') {
        specialization = [formData.hospitalType, formData.emergencyServices].filter(Boolean).join(', ');
        coverageArea = formData.numberOfBeds ? `${formData.numberOfBeds} beds` : '';
      } else if (formData.partnerType === 'police') {
        specialization = formData.stationCode || '';
        coverageArea = formData.jurisdiction || '';
      } else if (formData.partnerType === 'ranger') {
        specialization = formData.forestDivision || '';
        coverageArea = formData.patrolArea || '';
      }

      await partnersAPI.submitRequest({
        partnerType: formData.partnerType!,
        organizationName: formData.organizationName,
        contactPerson: formData.contactPersonName,
        email: formData.email,
        phone: formData.phone,
        registrationNumber: formData.registrationNumber || undefined,
        specialization: specialization || undefined,
        jurisdiction: formData.jurisdiction || undefined,
        coverageArea: coverageArea || undefined,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        additionalInfo: formData.description || undefined,
      });
      
      toast.success("Application submitted successfully! Check your email for confirmation.");
      setStep(4); // Success step
    } catch (error: unknown) {
      console.error('Partner request error:', error);
      const err = error as AxiosErrorLike;
      toast.error(err.response?.data?.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPartnerTypeSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          What type of partner are you?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Select the category that best describes your organization to help us 
          tailor the partnership experience for you.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {partnerTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handlePartnerTypeSelect(type.id)}
            className={`p-6 rounded-2xl border-2 ${type.borderColor} ${type.hoverBorder} 
              transition-all duration-300 hover:shadow-lg hover:scale-105 
              bg-card text-left group`}
          >
            <div className={`w-14 h-14 rounded-xl ${type.bgColor} flex items-center justify-center mb-4`}>
              <type.icon className={`w-7 h-7 ${type.color}`} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {type.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {type.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderBasicInfoForm = () => (
    <form className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Organization Details
        </h2>
        <p className="text-muted-foreground">
          Tell us about your organization and primary contact person.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="organizationName" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Organization Name *
          </Label>
          <Input
            id="organizationName"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleInputChange}
            placeholder="Enter organization name"
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="registrationNumber" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Registration Number
          </Label>
          <Input
            id="registrationNumber"
            name="registrationNumber"
            value={formData.registrationNumber}
            onChange={handleInputChange}
            placeholder="Official registration number"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="contactPersonName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Contact Person Name *
          </Label>
          <Input
            id="contactPersonName"
            name="contactPersonName"
            value={formData.contactPersonName}
            onChange={handleInputChange}
            placeholder="Full name"
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="contactPersonDesignation">Designation</Label>
          <Input
            id="contactPersonDesignation"
            name="contactPersonDesignation"
            value={formData.contactPersonDesignation}
            onChange={handleInputChange}
            placeholder="e.g., Director, Manager"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="organization@email.com"
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number *
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+91 XXXXX XXXXX"
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="alternatePhone">Alternate Phone</Label>
          <Input
            id="alternatePhone"
            name="alternatePhone"
            type="tel"
            value={formData.alternatePhone}
            onChange={handleInputChange}
            placeholder="+91 XXXXX XXXXX"
            className="mt-2"
          />
        </div>

        {/* Partner-specific fields */}
        {formData.partnerType === "hospital" && (
          <>
            <div>
              <Label htmlFor="hospitalType">Hospital Type</Label>
              <select
                id="hospitalType"
                name="hospitalType"
                value={formData.hospitalType}
                onChange={handleInputChange}
                className="mt-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select type</option>
                <option value="government">Government Hospital</option>
                <option value="private">Private Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="trauma-center">Trauma Center</option>
              </select>
            </div>
            <div>
              <Label htmlFor="numberOfBeds">Number of Beds</Label>
              <Input
                id="numberOfBeds"
                name="numberOfBeds"
                type="number"
                value={formData.numberOfBeds}
                onChange={handleInputChange}
                placeholder="e.g., 100"
                className="mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="emergencyServices">Emergency Services Available</Label>
              <Input
                id="emergencyServices"
                name="emergencyServices"
                value={formData.emergencyServices}
                onChange={handleInputChange}
                placeholder="e.g., ICU, Trauma, Ambulance"
                className="mt-2"
              />
            </div>
          </>
        )}

        {formData.partnerType === "police" && (
          <>
            <div>
              <Label htmlFor="stationCode">Station Code</Label>
              <Input
                id="stationCode"
                name="stationCode"
                value={formData.stationCode}
                onChange={handleInputChange}
                placeholder="e.g., PS-001"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="jurisdiction">Jurisdiction Area</Label>
              <Input
                id="jurisdiction"
                name="jurisdiction"
                value={formData.jurisdiction}
                onChange={handleInputChange}
                placeholder="e.g., North District"
                className="mt-2"
              />
            </div>
          </>
        )}

        {formData.partnerType === "ranger" && (
          <>
            <div>
              <Label htmlFor="forestDivision">Forest Division</Label>
              <Input
                id="forestDivision"
                name="forestDivision"
                value={formData.forestDivision}
                onChange={handleInputChange}
                placeholder="e.g., Western Ghats Division"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="patrolArea">Patrol Area</Label>
              <Input
                id="patrolArea"
                name="patrolArea"
                value={formData.patrolArea}
                onChange={handleInputChange}
                placeholder="e.g., 500 sq km"
                className="mt-2"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button type="button" variant="hero" onClick={handleNext}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );

  const renderAddressForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Location & Additional Details
        </h2>
        <p className="text-muted-foreground">
          Provide your organization's address and any additional information.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Full Address *
          </Label>
          <Textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Street address, landmark"
            className="mt-2"
            rows={3}
            required
          />
        </div>

        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="City name"
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="State name"
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="pincode">Pincode *</Label>
          <Input
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleInputChange}
            placeholder="6-digit pincode"
            className="mt-2"
            required
          />
        </div>

        {/* Hospital-specific: Exact Coordinates */}
        {formData.partnerType === "hospital" && (
          <>
            <div className="md:col-span-2">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <LocateFixed className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Hospital Location Coordinates Required</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please provide exact GPS coordinates of your hospital. This is essential for 
                      emergency alert routing. You can find coordinates using Google Maps (right-click on location).
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="latitude" className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Latitude *
              </Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="e.g., 28.6139"
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Longitude *
              </Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="e.g., 77.2090"
                className="mt-2"
                required
              />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <Label htmlFor="description">Why do you want to partner with us?</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Tell us about your interest in partnering with Apadbandhav..."
            className="mt-2"
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button type="submit" variant="hero" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Application
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6 max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-3xl font-bold text-foreground">
        Application Submitted!
      </h2>
      <p className="text-muted-foreground">
        Thank you for your interest in partnering with Apadbandhav. Our team will 
        review your application and contact you within 3-5 business days.
      </p>
      <div className="pt-4">
        <Link to="/">
          <Button variant="hero">
            Return to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-12">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
              step >= s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
          </div>
          {s < 3 && (
            <div
              className={`w-16 h-1 mx-2 rounded transition-all ${
                step > s ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="container mx-auto px-4 lg:px-8">
          {step < 4 && renderStepIndicator()}
          
          {step === 1 && renderPartnerTypeSelection()}
          {step === 2 && renderBasicInfoForm()}
          {step === 3 && renderAddressForm()}
          {step === 4 && renderSuccess()}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BecomePartner;
