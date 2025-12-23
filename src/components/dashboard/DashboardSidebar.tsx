import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  PlusCircle, 
  Smartphone, 
  Settings,
  Shield,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: PlusCircle, label: "Add Device", path: "/dashboard/add-device" },
  { icon: Smartphone, label: "Devices", path: "/dashboard/devices" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

interface DashboardSidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const DashboardSidebar = ({ isExpanded, setIsExpanded }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
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
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-glow group-hover:shadow-glow-strong transition-shadow duration-300 flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {isExpanded && (
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 whitespace-nowrap overflow-hidden">
              Apadbandhav
            </span>
          )}
        </Link>
      </div>

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

export default DashboardSidebar;
