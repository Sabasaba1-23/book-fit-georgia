import { memo, useCallback } from "react";
import { Home, CalendarThirtyTwo, Message, User } from "@icon-park/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { key: "home" as const, labelKey: "navExplore" as const, Icon: Home, path: "/", requiresAuth: false },
  { key: "bookings" as const, labelKey: "navBookings" as const, Icon: CalendarThirtyTwo, path: "/bookings", requiresAuth: true },
  { key: "messages" as const, labelKey: "navChat" as const, Icon: Message, path: "/messages", requiresAuth: true },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/50 pb-[var(--sab)]">
      <div className="mx-auto max-w-lg">
        <div className="flex h-[60px] items-center justify-around px-4">
        {navItems.map(({ key, labelKey, Icon, path, requiresAuth }) => {
            const active = location.pathname === path;
            return (
              <button
                key={key}
                onClick={() => handleNav(path, requiresAuth)}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-4 py-1.5 transition-all duration-200 active:scale-95",
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 3 : 2}
                  fill={active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-[0.12em]",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
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
