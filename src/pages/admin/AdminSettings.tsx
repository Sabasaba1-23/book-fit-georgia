import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminSettings() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <h1 className="text-lg font-bold text-foreground">Settings</h1>

      <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Admin Account</span>
        </div>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>

      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
