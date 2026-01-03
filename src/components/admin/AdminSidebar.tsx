import React, { memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  Smartphone,
  LogOut,
  UserCog,
  Bell,
  Shield,
  Cross,
  FileText,
  Settings,
  Send
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  superAdminOnly?: boolean;
}

interface AdminSidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  basePath: string;
  currentPath: string;
}

const AdminSidebar = memo(({ isExpanded, setIsExpanded, basePath, currentPath }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const { logout, isSuperAdmin, user } = useAuth();

  const navItems: NavItem[] = [
    { icon: Home, label: "Dashboard", path: basePath },
    { icon: Users, label: "Users", path: `${basePath}/users` },
    { icon: UserCog, label: "Admins", path: `${basePath}/admins`, superAdminOnly: true },
    { icon: Shield, label: "Police", path: `${basePath}/police`, superAdminOnly: true },
    { icon: Cross, label: "Hospitals", path: `${basePath}/hospitals`, superAdminOnly: true },
    { icon: Smartphone, label: "Devices", path: `${basePath}/devices` },
    { icon: FileText, label: "Requests", path: `${basePath}/requests` },
    { icon: Bell, label: "Alerts", path: `${basePath}/alerts` },
    { icon: Send, label: "Notifications", path: `${basePath}/notifications`, superAdminOnly: true },
    { icon: Settings, label: "Settings", path: `${basePath}/settings` },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.superAdminOnly || (item.superAdminOnly && isSuperAdmin)
  );

  const isActive = (path: string) => {
    if (path === basePath) {
      return currentPath === basePath;
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
        "fixed left-0 top-0 h-screen bg-deepblue border-r border-border/30 flex flex-col z-50 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Section */}
      <div className={cn(
        "border-b border-border/30 flex items-center transition-all duration-300 overflow-hidden",
        isExpanded ? "p-4" : "p-2 justify-center"
      )}>
        <Link to={basePath} className="flex items-center gap-3 group">
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
                {user?.fullName || (isSuperAdmin ? "Super Admin" : "Admin")}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-2 transition-all duration-300",
        isExpanded ? "p-4" : "px-2 py-4"
      )}>
        {filteredNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                "relative flex items-center rounded-xl font-medium transition-all duration-300 group",
                isExpanded ? "gap-3 px-4 py-3" : "justify-center p-3",
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
              
              {isExpanded && (
                <span className="transition-colors duration-300 whitespace-nowrap overflow-hidden">
                  {item.label}
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
          onClick={handleLogout}
          title={!isExpanded ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group",
            isExpanded ? "gap-3 px-4 py-3" : "justify-center p-3"
          )}
        >
          <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1 flex-shrink-0" />
          {isExpanded && <span className="whitespace-nowrap overflow-hidden">Logout</span>}
        </button>
      </div>
    </aside>
  );
});

AdminSidebar.displayName = 'AdminSidebar';

export default AdminSidebar;
