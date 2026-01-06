import React, { memo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  PlusCircle, 
  Smartphone, 
  Bell,
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { alertsAPI } from "@/services/api";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: PlusCircle, label: "Add Device", path: "/dashboard/add-device" },
  { icon: Smartphone, label: "Devices", path: "/dashboard/devices" },
  { icon: Bell, label: "My Alerts", path: "/dashboard/alerts" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

interface DashboardSidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
  currentPath: string;
}

const DashboardSidebar = memo(({ isExpanded, setIsExpanded, isMobile = false, onMobileClose, currentPath }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0);

  // Fetch unviewed alerts count for user's devices
  useEffect(() => {
    const fetchUnviewedCount = async () => {
      try {
        const response = await alertsAPI.getCombinedStats();
        // Use unviewed count (alerts not yet viewed by this user) instead of pending
        setPendingAlertsCount(response.data?.unviewed || 0);
      } catch (error) {
        console.error('Failed to fetch unviewed alerts count:', error);
      }
    };
    fetchUnviewedCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnviewedCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 h-screen bg-deepblue border-r border-border/30 flex flex-col z-50 transition-all duration-300 ease-in-out",
        isMobile ? "top-16 w-64" : "top-0",
        isMobile ? "w-64" : (isExpanded ? "w-64" : "w-20")
      )}
      onMouseEnter={() => !isMobile && setIsExpanded(true)}
      onMouseLeave={() => !isMobile && setIsExpanded(false)}
    >
      {/* Logo Section - Hidden on mobile since header has logo */}
      {!isMobile && (
        <div className={cn(
          "border-b border-border/30 flex items-center transition-all duration-300 overflow-hidden",
          isExpanded ? "p-4" : "p-2 justify-center"
        )}>
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <img 
              src="/logoAB.png" 
              alt="Apadbandhav Logo" 
              className={cn(
                "object-contain flex-shrink-0 transition-all duration-300",
                isExpanded ? "w-16 h-16" : "w-14 h-14"
              )}
            />
            {isExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                  Apadbandhav
                </span>
                <span className="text-xs text-primary font-medium truncate">
                  {user?.fullName || 'User'}
                </span>
              </div>
            )}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-2 transition-all duration-300",
        isExpanded ? "p-4" : "px-2 py-4"
      )}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              title={!isExpanded && !isMobile ? item.label : undefined}
              onClick={() => isMobile && onMobileClose?.()}
              className={cn(
                "relative flex items-center rounded-xl font-medium transition-all duration-300 group",
                (isExpanded || isMobile) ? "gap-3 px-4 py-3" : "justify-center p-3",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-glow" />
              )}
              
              <item.icon className={cn(
                "w-5 h-5 transition-all duration-300 flex-shrink-0",
                active ? "text-primary" : "group-hover:text-foreground"
              )} />
              
              {(isExpanded || isMobile) && (
                <span className="transition-colors duration-300 whitespace-nowrap overflow-hidden flex-1">
                  {item.label}
                </span>
              )}

              {/* Pending alerts badge for Alerts menu item */}
              {item.path === '/dashboard/alerts' && pendingAlertsCount > 0 && (
                <span className={cn(
                  "flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full animate-pulse",
                  (isExpanded || isMobile) ? "h-5 min-w-5 px-1.5" : "absolute -top-1 -right-1 h-4 min-w-4 px-1"
                )}>
                  {pendingAlertsCount > 99 ? '99+' : pendingAlertsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className={cn(
        "border-t border-border/30 transition-all duration-300",
        isExpanded ? "p-4" : "px-2 py-4"
      )}>
        <button
          onClick={() => {
            handleLogout();
            if (isMobile && onMobileClose) {
              onMobileClose();
            }
          }}
          title={!isExpanded && !isMobile ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group",
            (isExpanded || isMobile) ? "gap-3 px-4 py-3" : "justify-center p-3"
          )}
        >
          <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1 flex-shrink-0" />
          {(isExpanded || isMobile) && <span className="whitespace-nowrap overflow-hidden">Logout</span>}
        </button>
      </div>
    </aside>
  );
});

DashboardSidebar.displayName = 'DashboardSidebar';

export default DashboardSidebar;
