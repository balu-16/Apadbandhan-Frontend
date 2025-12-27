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
  Shield, 
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

interface PoliceUser {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const PoliceManagement = () => {
  const [policeUsers, setPoliceUsers] = useState<PoliceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPolice, setSelectedPolice] = useState<PoliceUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newPolice, setNewPolice] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchPoliceUsers();
  }, []);

  const fetchPoliceUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers('police');
      setPoliceUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch police users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch police accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPolice = async () => {
    if (!newPolice.fullName || !newPolice.email || !newPolice.phone) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.createUser({
        ...newPolice,
        role: 'police',
      });
      toast({
        title: "Success",
        description: "Police account created successfully",
      });
      setIsAddDialogOpen(false);
      setNewPolice({ fullName: "", email: "", phone: "" });
      fetchPoliceUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create police account",
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
      await adminAPI.deleteUser(selectedPolice._id || selectedPolice.id);
      toast({
        title: "Success",
        description: "Police account deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedPolice(null);
      fetchPoliceUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete police account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Police Account</DialogTitle>
              <DialogDescription>
                Create a new police account. They will receive login credentials via SMS.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="Enter full name"
                  value={newPolice.fullName}
                  onChange={(e) => setNewPolice({ ...newPolice, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newPolice.email}
                  onChange={(e) => setNewPolice({ ...newPolice, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="Enter 10-digit phone number"
                  value={newPolice.phone}
                  onChange={(e) => setNewPolice({ ...newPolice, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPolice} disabled={isSubmitting}>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoliceManagement;
