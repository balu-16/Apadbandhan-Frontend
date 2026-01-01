import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Cross,
  Plus,
  Trash2,
  Search,
  Loader2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Navigation,
  Building2,
  Stethoscope,
  Pencil
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

interface HospitalUser {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  hospitalPreference?: string;
  specialization?: string;
  address?: string;
  baseLocation?: {
    coordinates?: [number, number];
  };
}

const HospitalManagement = () => {
  const [hospitalUsers, setHospitalUsers] = useState<HospitalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<HospitalUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [editHospital, setEditHospital] = useState({
    fullName: "",
    email: "",
    hospitalPreference: "",
    specialization: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  const [newHospital, setNewHospital] = useState({
    fullName: "",
    email: "",
    phone: "",
    hospitalPreference: "",
    specialization: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  const { toast } = useToast();

  const fetchHospitalUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getAllHospitalUsers({
        page,
        limit: 10,
        search: debouncedSearchTerm || undefined,
      });
      setHospitalUsers(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotalItems(response.data.meta.total);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch hospital accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, page, debouncedSearchTerm]);

  useEffect(() => {
    fetchHospitalUsers();
  }, [fetchHospitalUsers]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleAddHospital = async () => {
    if (!newHospital.fullName || !newHospital.email || !newHospital.phone || !newHospital.hospitalPreference) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!newHospital.latitude || !newHospital.longitude) {
      toast({
        title: "Error",
        description: "Hospital location coordinates are required for emergency alerts",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.createHospitalUser({
        fullName: newHospital.fullName,
        email: newHospital.email,
        phone: newHospital.phone,
        hospitalPreference: newHospital.hospitalPreference,
        specialization: newHospital.specialization || undefined,
        address: newHospital.address || undefined,
        latitude: parseFloat(newHospital.latitude),
        longitude: parseFloat(newHospital.longitude),
      });
      toast({
        title: "Success",
        description: "Hospital account created successfully",
      });
      setIsAddDialogOpen(false);
      setNewHospital({
        fullName: "", email: "", phone: "",
        hospitalPreference: "", specialization: "",
        address: "", latitude: "", longitude: ""
      });
      fetchHospitalUsers();
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create hospital account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHospital = async () => {
    if (!selectedHospital) return;

    setIsSubmitting(true);
    try {
      await adminAPI.deleteHospitalUser(selectedHospital._id || selectedHospital.id);
      toast({
        title: "Success",
        description: "Hospital account deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedHospital(null);
      fetchHospitalUsers();
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete hospital account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHospital = async () => {
    if (!selectedHospital || !editHospital.fullName) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.updateHospitalUser(selectedHospital._id || selectedHospital.id, {
        fullName: editHospital.fullName,
        email: editHospital.email,
        hospitalPreference: editHospital.hospitalPreference || undefined,
        specialization: editHospital.specialization || undefined,
        address: editHospital.address || undefined,
        latitude: editHospital.latitude ? parseFloat(editHospital.latitude) : undefined,
        longitude: editHospital.longitude ? parseFloat(editHospital.longitude) : undefined,
      });
      toast({
        title: "Success",
        description: "Hospital account updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedHospital(null);
      fetchHospitalUsers();
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update hospital account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (hospital: HospitalUser) => {
    setSelectedHospital(hospital);
    setEditHospital({
      fullName: hospital.fullName || "",
      email: hospital.email || "",
      hospitalPreference: hospital.hospitalPreference || "",
      specialization: hospital.specialization || "",
      address: hospital.address || "",
      latitude: hospital.baseLocation?.coordinates?.[1]?.toString() || "",
      longitude: hospital.baseLocation?.coordinates?.[0]?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  // Server-side filtering - no client-side filter needed
  const filteredHospitals = hospitalUsers;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Cross className="h-8 w-8 text-red-500" />
            Hospital Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage hospital accounts ({hospitalUsers.length} total)
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Hospital
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Hospital Account</DialogTitle>
              <DialogDescription>
                Create a new hospital account. They will receive login credentials via SMS.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Contact Person Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter contact person name"
                      value={newHospital.fullName}
                      onChange={(e) => setNewHospital({ ...newHospital, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="10-digit phone number"
                      value={newHospital.phone}
                      onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newHospital.email}
                    onChange={(e) => setNewHospital({ ...newHospital, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Hospital Info Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Hospital Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hospitalPreference">Hospital Name *</Label>
                    <Input
                      id="hospitalPreference"
                      placeholder="Enter hospital name"
                      value={newHospital.hospitalPreference}
                      onChange={(e) => setNewHospital({ ...newHospital, hospitalPreference: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      placeholder="e.g., Emergency, Trauma, Multi-specialty"
                      value={newHospital.specialization}
                      onChange={(e) => setNewHospital({ ...newHospital, specialization: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Hospital Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter complete hospital address"
                    value={newHospital.address}
                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Location Coordinates
                </h3>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-2">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Exact coordinates are required for emergency alert routing.
                    You can find coordinates using Google Maps (right-click on location).
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" /> Latitude *
                    </Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 28.6139"
                      value={newHospital.latitude}
                      onChange={(e) => setNewHospital({ ...newHospital, latitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" /> Longitude *
                    </Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 77.2090"
                      value={newHospital.longitude}
                      onChange={(e) => setNewHospital({ ...newHospital, longitude: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddHospital} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Hospital Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hospital accounts..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHospitals.length === 0 ? (
            <div className="text-center py-12">
              <Cross className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No hospital accounts match your search" : "No hospital accounts found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHospitals.map((hospital) => (
                    <TableRow key={hospital._id || hospital.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Cross className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium">{hospital.fullName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{hospital.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {hospital.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            +91 {hospital.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(hospital.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => openEditDialog(hospital)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedHospital(hospital);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-red-500" />
              Edit Hospital Account
            </DialogTitle>
            <DialogDescription>
              Update the details for {selectedHospital?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name *</Label>
              <Input
                id="edit-fullName"
                value={editHospital.fullName}
                onChange={(e) => setEditHospital({ ...editHospital, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editHospital.email}
                onChange={(e) => setEditHospital({ ...editHospital, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hospitalPreference">Hospital Type</Label>
                <Input
                  id="edit-hospitalPreference"
                  value={editHospital.hospitalPreference}
                  onChange={(e) => setEditHospital({ ...editHospital, hospitalPreference: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-specialization">Specialization</Label>
                <Input
                  id="edit-specialization"
                  value={editHospital.specialization}
                  onChange={(e) => setEditHospital({ ...editHospital, specialization: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={editHospital.address}
                onChange={(e) => setEditHospital({ ...editHospital, address: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  value={editHospital.latitude}
                  onChange={(e) => setEditHospital({ ...editHospital, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  value={editHospital.longitude}
                  onChange={(e) => setEditHospital({ ...editHospital, longitude: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditHospital} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hospital Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the hospital account for "{selectedHospital?.fullName}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteHospital}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default HospitalManagement;
