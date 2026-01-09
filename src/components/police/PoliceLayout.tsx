import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import PoliceSidebar from "./PoliceSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApadbandhavChatbot from "@/components/chatbot/ApadbandhavChatbot";

const PoliceLayout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading, userRole } = useAuth();
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
    if (!isLoading && isAuthenticated && userRole !== 'police') {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, userRole, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'police') {
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
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          <span className="font-bold text-foreground">Police Portal</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "lg:block",
        isMobileSidebarOpen ? "block" : "hidden"
      )}>
        <PoliceSidebar
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
        "pt-16 lg:pt-0",
        isSidebarExpanded ? "lg:ml-64" : "lg:ml-20",
        "ml-0"
      )}>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* AI Chatbot */}
      <ApadbandhavChatbot userRole="police" />
    </div>
  );
};

export default PoliceLayout;
