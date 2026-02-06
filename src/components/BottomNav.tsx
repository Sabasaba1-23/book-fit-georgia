import { Home, CalendarCheck, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { key: "home" as const, icon: Home, path: "/", requiresAuth: false },
  { key: "bookings" as const, icon: CalendarCheck, path: "/bookings", requiresAuth: true },
  { key: "messages" as const, icon: MessageCircle, path: "/messages", requiresAuth: true },
  { key: "profile" as const, icon: User, path: "/profile", requiresAuth: true },
];

export default function BottomNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNav = (path: string, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      toast({ title: t("loginRequired"), variant: "destructive" });
      navigate("/auth");
      return;
    }
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-card mx-auto max-w-lg border-t-0 rounded-t-3xl">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map(({ key, icon: Icon, path, requiresAuth }) => {
            const active = location.pathname === path;
            return (
              <button
                key={key}
                onClick={() => handleNav(path, requiresAuth)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-4 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  active && "bg-primary/10"
                )}>
                  <Icon className={cn("h-5 w-5", active && "text-primary")} />
                </div>
                <span>{t(key)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
