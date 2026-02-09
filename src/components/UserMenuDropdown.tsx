import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function UserMenuDropdown() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: isPartner } = useQuery({
    queryKey: ["isPartner", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("partner_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const userInitial =
    user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "?";

  const displayName =
    user?.user_metadata?.full_name || user?.email || "";

  if (!user) {
    return (
      <button
        onClick={() => navigate("/auth")}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] transition-transform active:scale-95"
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
          <span className="text-sm font-medium text-primary">?</span>
        </div>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] transition-transform active:scale-95">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
            <span className="text-sm font-medium text-primary">{userInitial}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl">
        <DropdownMenuLabel className="font-bold truncate">{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
          <User className="h-4 w-4" />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
          <Settings className="h-4 w-4" />
          {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            navigate("/auth", { replace: true });
          }}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t("logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
