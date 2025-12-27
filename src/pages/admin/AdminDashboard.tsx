import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Smartphone, UserCog, Activity, Shield, Cross } from "lucide-react";
import { adminAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalUsers: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalAdmins?: number;
  totalSuperAdmins?: number;
  totalPolice?: number;
  totalHospitals?: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isSuperAdmin } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isSuperAdmin ? "Super Admin" : "Admin"} Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.fullName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Devices
            </CardTitle>
            <Smartphone className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats?.totalDevices || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active devices
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Online Devices
            </CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {stats?.onlineDevices || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently online
            </p>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Admins
              </CardTitle>
              <UserCog className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats?.totalAdmins || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                System administrators
              </p>
            </CardContent>
          </Card>
        )}

        {isSuperAdmin && (
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Police
              </CardTitle>
              <Shield className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {stats?.totalPolice || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Police accounts
              </p>
            </CardContent>
          </Card>
        )}

        {isSuperAdmin && (
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Hospitals
              </CardTitle>
              <Cross className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {stats?.totalHospitals || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Hospital accounts
              </p>
            </CardContent>
          </Card>
        )}

        {!isSuperAdmin && (
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Offline Devices
              </CardTitle>
              <Smartphone className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {stats?.offlineDevices || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently offline
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Use the sidebar to navigate to different sections:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span><strong>Users</strong> - Manage user accounts</span>
              </li>
              {isSuperAdmin && (
                <li className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-orange-500" />
                  <span><strong>Admins</strong> - Manage admin accounts</span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-500" />
                <span><strong>Devices</strong> - View all registered devices</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isSuperAdmin ? 'bg-orange-500/20' : 'bg-primary/20'
              }`}>
                {isSuperAdmin ? (
                  <UserCog className="h-8 w-8 text-orange-500" />
                ) : (
                  <Users className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {isSuperAdmin ? 'Super Administrator' : 'Administrator'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isSuperAdmin 
                    ? 'Full access to all system features'
                    : 'Access to user and device management'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
