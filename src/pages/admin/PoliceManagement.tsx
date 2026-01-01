import { useState, useEffect, useCallback } from "react";
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
  Shield,
  Plus,
  Trash2,
  Search,
  Loader2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BadgeCheck,
  Building,
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

interface PoliceUser {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  stationName?: string;
  badgeNumber?: string;
  jurisdiction?: string;
  address?: string;
}

const PoliceManagement = () => {
  const [policeUsers, setPoliceUsers] = useState<PoliceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPolice, setSelectedPolice] = useState<PoliceUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editPolice, setEditPolice] = useState({
    fullName: "",
    email: "",
    stationName: "",
    badgeNumber: "",
    jurisdiction: "",
    address: "",
  });

  const [newPolice, setNewPolice] = useState({
    fullName: "",
    email: "",
    phone: "",
    stationName: "",
    badgeNumber: "",
    jurisdiction: "",
    address: "",
  });

  const { toast } = useToast();

  const fetchPoliceUsers = useCallback(async () => {
    try {
      const response = await adminAPI.getAllPoliceUsers();
      setPoliceUsers(response.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch police accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPoliceUsers();
  }, [fetchPoliceUsers]);

  const handleAddPolice = async () => {
    if (!newPolice.fullName || !newPolice.email || !newPolice.phone || !newPolice.stationName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.createPoliceUser({
        fullName: newPolice.fullName,
        email: newPolice.email,
        phone: newPolice.phone,
        stationName: newPolice.stationName,
        badgeNumber: newPolice.badgeNumber || undefined,
        jurisdiction: newPolice.jurisdiction || undefined,
        address: newPolice.address || undefined,
      });
      toast({
        title: "Success",
        description: "Police account created successfully",
      });
      setIsAddDialogOpen(false);
      setNewPolice({
        fullName: "", email: "", phone: "",
        stationName: "", badgeNumber: "",
        jurisdiction: "", address: ""
      });
      fetchPoliceUsers();
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create police account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePolice = async () => {
    if (!selectedPolice) return;

    setIsSubmitting(true);
    try {
      await adminAPI.deletePoliceUser(selectedPolice._id || selectedPolice.id);
      toast({
        title: "Success",
        description: "Police account deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedPolice(null);
      fetchPoliceUsers();
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete police account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPolice = async () => {
    if (!selectedPolice || !editPolice.fullName) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.updatePoliceUser(selectedPolice._id || selectedPolice.id, {
        fullName: editPolice.fullName,
        email: editPolice.email,
        stationName: editPolice.stationName || undefined,
        badgeNumber: editPolice.badgeNumber || undefined,
        jurisdiction: editPolice.jurisdiction || undefined,
        address: editPolice.address || undefined,
      });
      toast({
        title: "Success",
        description: "Police account updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedPolice(null);
      fetchPoliceUsers();
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update police account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (police: PoliceUser) => {
    setSelectedPolice(police);
    setEditPolice({
      fullName: police.fullName || "",
      email: police.email || "",
      stationName: police.stationName || "",
      badgeNumber: police.badgeNumber || "",
      jurisdiction: police.jurisdiction || "",
      address: police.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const filteredPolice = policeUsers.filter(
    (police) =>
      police.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      police.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      police.phone?.includes(searchTerm)
  );

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
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-500" />
            Police Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage police accounts ({policeUsers.length} total)
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Police
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Police Account</DialogTitle>
              <DialogDescription>
                Create a new police account. They will receive login credentials via SMS.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Contact Info Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Officer Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter officer name"
                      value={newPolice.fullName}
                      onChange={(e) => setNewPolice({ ...newPolice, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="10-digit phone number"
                      value={newPolice.phone}
                      onChange={(e) => setNewPolice({ ...newPolice, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newPolice.email}
                    onChange={(e) => setNewPolice({ ...newPolice, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Police Station Info Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Building className="h-4 w-4" /> Station Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stationName">Police Station Name *</Label>
                    <Input
                      id="stationName"
                      placeholder="Enter station name"
                      value={newPolice.stationName}
                      onChange={(e) => setNewPolice({ ...newPolice, stationName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="badgeNumber" className="flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3" /> Badge Number
                    </Label>
                    <Input
                      id="badgeNumber"
                      placeholder="Enter badge/ID number"
                      value={newPolice.badgeNumber}
                      onChange={(e) => setNewPolice({ ...newPolice, badgeNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction Area</Label>
                  <Input
                    id="jurisdiction"
                    placeholder="e.g., Central District, North Zone"
                    value={newPolice.jurisdiction}
                    onChange={(e) => setNewPolice({ ...newPolice, jurisdiction: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Station Address
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter complete station address"
                    value={newPolice.address}
                    onChange={(e) => setNewPolice({ ...newPolice, address: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPolice} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Police Account
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
                placeholder="Search police accounts..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPolice.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No police accounts match your search" : "No police accounts found"}
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
                  {filteredPolice.map((police) => (
                    <TableRow key={police._id || police.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">{police.fullName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{police.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {police.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            +91 {police.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(police.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => openEditDialog(police)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedPolice(police);
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
              <Pencil className="h-5 w-5 text-blue-500" />
              Edit Police Account
            </DialogTitle>
            <DialogDescription>
              Update the details for {selectedPolice?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name *</Label>
              <Input
                id="edit-fullName"
                value={editPolice.fullName}
                onChange={(e) => setEditPolice({ ...editPolice, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editPolice.email}
                onChange={(e) => setEditPolice({ ...editPolice, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-stationName">Station Name</Label>
                <Input
                  id="edit-stationName"
                  value={editPolice.stationName}
                  onChange={(e) => setEditPolice({ ...editPolice, stationName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-badgeNumber">Badge Number</Label>
                <Input
                  id="edit-badgeNumber"
                  value={editPolice.badgeNumber}
                  onChange={(e) => setEditPolice({ ...editPolice, badgeNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jurisdiction">Jurisdiction</Label>
              <Input
                id="edit-jurisdiction"
                value={editPolice.jurisdiction}
                onChange={(e) => setEditPolice({ ...editPolice, jurisdiction: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={editPolice.address}
                onChange={(e) => setEditPolice({ ...editPolice, address: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPolice} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Police Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the police account for "{selectedPolice?.fullName}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePolice}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent >
      </Dialog >
    </div >
  );
};

export default PoliceManagement;
