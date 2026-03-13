import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Database,
  Upload,
  Shield,
  FileSearch,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock,
  LogOut,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Database, label: "Database", path: "/database" },
  { icon: Upload, label: "Upload", path: "/upload" },
  { icon: FileSearch, label: "PII Detection", path: "/detection" },
  { icon: Shield, label: "Masking & Anonymization", path: "/masking" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export const Sidebar = ({ collapsed, onCollapsedChange }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('LoggedInUser');
      setIsLoggedIn(!!storedUser);
    };

    checkAuth();
    window.addEventListener('userLoggedIn', checkAuth);
    window.addEventListener('userLoggedOut', checkAuth);

    return () => {
      window.removeEventListener('userLoggedIn', checkAuth);
      window.removeEventListener('userLoggedOut', checkAuth);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('LoggedInUser');
    window.dispatchEvent(new Event('userLoggedOut'));
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 flex h-screen flex-col border-r transition-all duration-300 overflow-hidden",
        collapsed ? "w-[72px]" : "w-64"
      )}
      style={{ background: "linear-gradient(180deg, hsl(230, 30%, 96%) 0%, hsl(260, 25%, 94%) 100%)" }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-4 flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary flex-shrink-0">
          <Lock className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-lg truncate">DataMask</h1>
            <p className="text-xs text-muted-foreground truncate">PII Protection Tool</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-hidden">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const NavItem = (
            <Link
              key={`${item.path}-${item.label}`}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={`${item.path}-${item.label}`} delayDuration={0}>
                <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={`${item.path}-${item.label}`}>{NavItem}</div>;
        })}
      </nav>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-card shadow-md"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Footer */}
      {isLoggedIn && (
        <div className="border-t border-border/50 p-4 flex-shrink-0">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Logout
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={handleLogout}
              className="w-full justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      )}
    </aside>
  );
};
