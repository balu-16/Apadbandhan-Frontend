import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
  basePath: string;
  requiredRole: 'admin' | 'superadmin';
}

const AdminLayout = ({ basePath, requiredRole }: AdminLayoutProps) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { isAuthenticated, isAdmin, isSuperAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize setIsExpanded to prevent unnecessary re-renders
  const handleSetExpanded = useCallback((expanded: boolean) => {
    setIsSidebarExpanded(expanded);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      // Check role-based access
      if (requiredRole === 'superadmin' && !isSuperAdmin) {
        navigate("/dashboard");
        return;
      }

      if (requiredRole === 'admin' && !isAdmin) {
        navigate("/dashboard");
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isSuperAdmin, isLoading, navigate, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={handleSetExpanded}
        basePath={basePath}
        currentPath={location.pathname}
      />
      
      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        isSidebarExpanded ? "ml-64" : "ml-20"
      )}>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
