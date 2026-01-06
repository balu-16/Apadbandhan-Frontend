import React, { memo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Bell,
  LogOut,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hospitalAPI } from "@/services/api";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface HospitalSidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
  currentPath: string;
}

const HospitalSidebar = memo(({ isExpanded, setIsExpanded, isMobile = false, onMobileClose, currentPath }: HospitalSidebarProps) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0);

  // Fetch unviewed alerts count from hospital-specific API
  useEffect(() => {
    const fetchUnviewedCount = async () => {
      try {
        const response = await hospitalAPI.getStats();
        // Use unviewed count if available, fallback to pending for backward compatibility
        setPendingAlertsCount(response.data?.unviewed || response.data?.pendingAlerts || response.data?.pending || 0);
      } catch (error) {
        console.error('Failed to fetch unviewed alerts count:', error);
      }
    };
    fetchUnviewedCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnviewedCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems: NavItem[] = [
    { icon: Home, label: "Dashboard", path: "/hospital" },
    { icon: Users, label: "Users", path: "/hospital/users" },
    { icon: Bell, label: "Alerts", path: "/hospital/alerts" },
    { icon: Settings, label: "Settings", path: "/hospital/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/hospital") {
      return currentPath === "/hospital";
    }
    return currentPath.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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
      {/* Logo Section - Hidden on mobile */}
      {!isMobile && (
        <div className={cn(
          "border-b border-border/30 flex items-center transition-all duration-300 overflow-hidden",
          isExpanded ? "p-4" : "p-2 justify-center"
        )}>
          <Link to="/hospital" className="flex items-center gap-3 group">
            <img
              src="/logoAB.png"
              alt="Apadbandhav Logo"
              className={cn(
                "object-contain flex-shrink-0 transition-all duration-300",
                isExpanded ? "w-14 h-14" : "w-12 h-12"
              )}
            />
            {isExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                  Apadbandhav
                </span>
                <span className="text-xs text-red-500 font-medium truncate">
                  {user?.fullName || 'Hospital'}
                </span>
              </div>
            )}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-2 transition-all duration-300",
        isExpanded || isMobile ? "p-4" : "px-2 py-4"
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
                  ? "bg-red-500/10 text-red-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r-full shadow-glow" />
              )}

              <item.icon className={cn(
                "w-5 h-5 transition-all duration-300 flex-shrink-0",
                active ? "text-red-500" : "group-hover:text-foreground"
              )} />

              {(isExpanded || isMobile) && (
                <span className="transition-colors duration-300 whitespace-nowrap overflow-hidden flex-1">
                  {item.label}
                </span>
              )}

              {/* Pending alerts badge for Alerts menu item */}
              {item.path === '/hospital/alerts' && pendingAlertsCount > 0 && (
                <span className={cn(
                  "flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full",
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
        (isExpanded || isMobile) ? "p-4" : "px-2 py-4"
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

HospitalSidebar.displayName = 'HospitalSidebar';

export default HospitalSidebar;
