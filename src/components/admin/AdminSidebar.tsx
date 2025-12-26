import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  Smartphone,
  LogOut,
  UserCog
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
}

const AdminSidebar = ({ isExpanded, setIsExpanded, basePath }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isSuperAdmin } = useAuth();

  const navItems: NavItem[] = [
    { icon: Home, label: "Dashboard", path: basePath },
    { icon: Users, label: "Users", path: `${basePath}/users` },
    { icon: UserCog, label: "Admins", path: `${basePath}/admins`, superAdminOnly: true },
    { icon: Smartphone, label: "Devices", path: `${basePath}/devices` },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.superAdminOnly || (item.superAdminOnly && isSuperAdmin)
  );

  const isActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === basePath;
    }
    return location.pathname.startsWith(path);
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
        "border-b border-border/30 flex items-center transition-all duration-300",
        isExpanded ? "p-6" : "p-4 justify-center"
      )}>
        <Link to={basePath} className="flex items-center gap-3 group">
          <img 
            src="/logoAB.png" 
            alt="Apadbandhav Logo" 
            className="w-12 h-12 object-contain flex-shrink-0"
          />
          {isExpanded && (
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 whitespace-nowrap overflow-hidden">
                Apadbandhav
              </span>
              <span className="text-xs text-primary font-medium">
                {isSuperAdmin ? "Super Admin" : "Admin Panel"}
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
};

export default AdminSidebar;
