import { memo, useCallback } from "react";
import { Home, CalendarCheck, MessageSquareMore } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { key: "home" as const, labelKey: "navExplore" as const, icon: Home, path: "/", requiresAuth: false },
  { key: "bookings" as const, labelKey: "navBookings" as const, icon: CalendarCheck, path: "/bookings", requiresAuth: true },
  { key: "messages" as const, labelKey: "navChat" as const, icon: MessageSquareMore, path: "/messages", requiresAuth: true },
];

export default memo(function BottomNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNav = useCallback((path: string, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      toast({ title: t("loginRequired"), variant: "destructive" });
      navigate("/auth");
      return;
    }
    navigate(path);
  }, [user, toast, t, navigate]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="glass-card mx-auto max-w-lg rounded-t-3xl border-t border-border/30">
        <div className="flex h-[76px] items-center justify-around px-4 pb-1">
          {navItems.map(({ key, labelKey, icon: Icon, path, requiresAuth }) => {
            const active = location.pathname === path;
            return (
              <button
                key={key}
                onClick={() => handleNav(path, requiresAuth)}
                className="flex flex-col items-center gap-1.5 px-4 py-1.5 transition-all duration-200 active:scale-95"
              >
                <Icon
                  className={cn("h-[22px] w-[22px] transition-colors", active ? "text-primary" : "text-muted-foreground")}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span className={cn("text-[10px] font-semibold tracking-[0.12em]", active ? "text-primary" : "text-muted-foreground")}>
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
