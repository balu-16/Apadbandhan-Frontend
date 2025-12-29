import { useState, useEffect } from "react";
import { policeAPI, hospitalAPI } from "@/services/api";
import { 
  Users,
  Search,
  Loader2,
  RefreshCw,
  User,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UserData {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  isActive?: boolean;
}

interface UsersReadOnlyPageProps {
  portalType: 'police' | 'hospital';
}

const UsersReadOnlyPage = ({ portalType }: UsersReadOnlyPageProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const api = portalType === 'police' ? policeAPI : hospitalAPI;
      const response = await api.getAllUsers();
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return user.fullName?.toLowerCase().includes(searchLower) || 
           user.email?.toLowerCase().includes(searchLower) ||
           user.phone?.includes(searchQuery);
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPortalColor = () => {
    return portalType === 'police' ? 'blue' : 'red';
  };

  const color = getPortalColor();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-12 h-12 text-${color}-500 animate-spin`} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className={cn("w-7 h-7", portalType === 'police' ? "text-blue-500" : "text-red-500")} />
            Registered Users
          </h1>
          <p className="text-muted-foreground">View all registered users in the system</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchUsers(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, email or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Stats */}
      <div className="bg-card border border-border/50 rounded-xl p-4 mb-6 text-center">
        <p className="text-3xl font-bold text-foreground">{users.length}</p>
        <p className="text-sm text-muted-foreground">Total Registered Users</p>
      </div>

      {/* Users List - Read Only, No Click Action */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div 
              key={user._id}
              className="bg-card border border-border/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.fullName}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>+91 {user.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {user.role}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border/50 rounded-xl">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Users Found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "No users match your search" : "No users have registered yet"}
          </p>
        </div>
      )}
    </div>
  );
};

export default UsersReadOnlyPage;
