import { Home, CalendarCheck, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "home" as const, icon: Home, path: "/" },
  { key: "bookings" as const, icon: CalendarCheck, path: "/bookings" },
  { key: "messages" as const, icon: MessageCircle, path: "/messages" },
  { key: "profile" as const, icon: User, path: "/profile" },
];

export default function BottomNav() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map(({ key, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(key)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
