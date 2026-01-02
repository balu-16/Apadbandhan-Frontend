import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardLayout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize callbacks to prevent unnecessary sidebar re-renders
  const handleSetExpanded = useCallback((expanded: boolean) => {
    setIsSidebarExpanded(expanded);
  }, []);

  const handleMobileClose = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-deepblue border-b border-border/30 flex items-center justify-between px-4 z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="text-foreground"
        >
          {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
        <img src="/logoAB.png" alt="Apadbandhav" className="w-10 h-10" />
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide in */}
      <div className={cn(
        "lg:block",
        isMobileSidebarOpen ? "block" : "hidden"
      )}>
        <DashboardSidebar
          isExpanded={isSidebarExpanded}
          setIsExpanded={handleSetExpanded}
          isMobile={isMobileSidebarOpen}
          onMobileClose={handleMobileClose}
          currentPath={location.pathname}
        />
      </div>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        "pt-16 lg:pt-0", // Add top padding for mobile header
        isSidebarExpanded ? "lg:ml-64" : "lg:ml-20",
        "ml-0" // No left margin on mobile
      )}>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
