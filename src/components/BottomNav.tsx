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
  { key: "profile" as const, labelKey: "navProfile" as const, Icon: User, path: "/profile", requiresAuth: true },
];

export default memo(function BottomNav() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNav = useCallback(
    (path: string, requiresAuth: boolean) => {
      if (requiresAuth && !user) {
        toast({ title: t("loginRequired"), variant: "destructive" });
        navigate("/auth");
        return;
      }
      navigate(path);
    },
    [user, toast, t, navigate],
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      aria-label="Primary"
    >
      <div className="mx-auto w-full max-w-sm px-5 pointer-events-auto">
        <div className="flex h-[64px] items-center justify-between rounded-full bg-foreground px-2.5 shadow-[0_18px_40px_-12px_hsl(0_0%_0%/0.35)]">
          {navItems.map(({ key, labelKey, Icon, path, requiresAuth }) => {
            const active = location.pathname === path;
            return (
              <button
                key={key}
                onClick={() => handleNav(path, requiresAuth)}
                aria-label={t(labelKey)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-[52px] flex-1 items-center justify-center transition-transform duration-200 active:scale-95",
                )}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300",
                    active
                      ? "bg-background text-foreground shadow-[0_6px_16px_-4px_hsl(0_0%_0%/0.4)]"
                      : "bg-transparent text-background/55",
                  )}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 3 : 2.4}
                    fill={active ? "hsl(var(--foreground))" : "hsl(var(--background) / 0.55)"}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
