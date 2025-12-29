import { useState, useEffect } from "react";
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
  Calendar
} from "lucide-react";
import { adminAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface HospitalUser {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const HospitalManagement = () => {
  const [hospitalUsers, setHospitalUsers] = useState<HospitalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<HospitalUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newHospital, setNewHospital] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchHospitalUsers();
  }, []);

  const fetchHospitalUsers = async () => {
    try {
      const response = await adminAPI.getAllHospitalUsers();
      setHospitalUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch hospital users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch hospital accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHospital = async () => {
    if (!newHospital.fullName || !newHospital.email || !newHospital.phone) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.createHospitalUser(newHospital);
      toast({
        title: "Success",
        description: "Hospital account created successfully",
      });
      setIsAddDialogOpen(false);
      setNewHospital({ fullName: "", email: "", phone: "" });
      fetchHospitalUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create hospital account",
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete hospital account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHospitals = hospitalUsers.filter(
    (hospital) =>
      hospital.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.phone?.includes(searchTerm)
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Hospital Account</DialogTitle>
              <DialogDescription>
                Create a new hospital account. They will receive login credentials via SMS.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hospital/Staff Name</label>
                <Input
                  placeholder="Enter hospital or staff name"
                  value={newHospital.fullName}
                  onChange={(e) => setNewHospital({ ...newHospital, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newHospital.email}
                  onChange={(e) => setNewHospital({ ...newHospital, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="Enter 10-digit phone number"
                  value={newHospital.phone}
                  onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddHospital} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};

export default HospitalManagement;
