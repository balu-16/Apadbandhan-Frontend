import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useUsers, useCreateUser, useDeleteUser, User } from "@/hooks/useUsers";
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
  Users,
  Plus,
  Trash2,
  Search,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Heart,
  MapPin,
  Droplet,
  UserPlus,
  X
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import UserDetailsModal from "@/components/admin/UserDetailsModal";

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // User details modal state
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form fields
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    bloodGroup: "",
    address: "",
    medicalConditions: "",
    emergencyContacts: [{ name: "", phone: "", relation: "" }],
  });

  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  // React Query hooks for data fetching and mutations
  const { 
    data: usersData, 
    isLoading, 
    isFetching,
    error: fetchError 
  } = useUsers({
    role: 'user',
    page,
    limit: 10,
    search: debouncedSearchTerm || undefined,
  });

  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  // Extract data from query result
  const users = usersData?.data || [];
  const totalPages = usersData?.meta.totalPages || 1;
  const totalItems = usersData?.meta.total || 0;

  // Show error toast if fetch fails
  useEffect(() => {
    if (fetchError) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  }, [fetchError, toast]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty emergency contacts
    const validEmergencyContacts = newUser.emergencyContacts.filter(
      ec => ec.name && ec.phone
    );

    createUserMutation.mutate(
      {
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: 'user',
        bloodGroup: newUser.bloodGroup || undefined,
        address: newUser.address || undefined,
        medicalConditions: newUser.medicalConditions
          ? newUser.medicalConditions.split(',').map(c => c.trim()).filter(Boolean)
          : undefined,
        emergencyContacts: validEmergencyContacts.length > 0 ? validEmergencyContacts : undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "User created successfully",
          });
          setIsAddDialogOpen(false);
          setNewUser({
            fullName: "", email: "", phone: "",
            bloodGroup: "", address: "", medicalConditions: "",
            emergencyContacts: [{ name: "", phone: "", relation: "" }]
          });
        },
        onError: (error: unknown) => {
          const err = error as AxiosErrorLike;
          toast({
            title: "Error",
            description: err.response?.data?.message || "Failed to create user",
            variant: "destructive",
          });
        },
      }
    );
  };

  const addEmergencyContact = () => {
    setNewUser({
      ...newUser,
      emergencyContacts: [...newUser.emergencyContacts, { name: "", phone: "", relation: "" }]
    });
  };

  const removeEmergencyContact = (index: number) => {
    setNewUser({
      ...newUser,
      emergencyContacts: newUser.emergencyContacts.filter((_, i) => i !== index)
    });
  };

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    const updated = [...newUser.emergencyContacts];
    updated[index] = { ...updated[index], [field]: value };
    setNewUser({ ...newUser, emergencyContacts: updated });
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    deleteUserMutation.mutate(selectedUser._id || selectedUser.id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
      },
      onError: (error: unknown) => {
        const err = error as AxiosErrorLike;
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to delete user",
          variant: "destructive",
        });
      },
    });
  };

  // Server-side filtering - no client-side filter needed
  const filteredUsers = users;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all registered users
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. The user will be able to login using OTP verification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter full name"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="10-digit phone number"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Address
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter home address"
                    value={newUser.address}
                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Medical Info Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Medical Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup" className="flex items-center gap-1">
                      <Droplet className="h-3 w-3" /> Blood Group
                    </Label>
                    <Select
                      value={newUser.bloodGroup}
                      onValueChange={(value) => setNewUser({ ...newUser, bloodGroup: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalConditions">Medical Conditions</Label>
                    <Input
                      id="medicalConditions"
                      placeholder="e.g., Diabetes, Asthma (comma separated)"
                      value={newUser.medicalConditions}
                      onChange={(e) => setNewUser({ ...newUser, medicalConditions: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contacts Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Emergency Contacts
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={addEmergencyContact}>
                    <Plus className="h-3 w-3 mr-1" /> Add Contact
                  </Button>
                </div>
                {newUser.emergencyContacts.map((contact, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        placeholder="Contact name"
                        value={contact.name}
                        onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        placeholder="Phone number"
                        value={contact.phone}
                        onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value.replace(/\D/g, "").slice(0, 10))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Relation</Label>
                      <Input
                        placeholder="e.g., Father"
                        value={contact.relation}
                        onChange={(e) => updateEmergencyContact(index, 'relation', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeEmergencyContact(index)}
                      disabled={newUser.emergencyContacts.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-card border-border/50">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user._id || user.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setViewUser(user);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          +91 {user.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                          }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.fullName}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
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

      {/* User Details Modal */}
      <UserDetailsModal
        user={viewUser}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </div>
  );
};

export default UsersManagement;
