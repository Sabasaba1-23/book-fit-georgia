import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

type AuthMode = "login" | "register-choice" | "register-user" | "register-partner";

export default function Auth() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent, isPartner: boolean) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, is_partner: isPartner },
      },
    });
    if (error) setError(error.message);
    else {
      if (isPartner) {
        navigate("/partner/setup");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">FitBook</h1>
          <p className="mt-1 text-sm text-muted-foreground">Georgia</p>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input placeholder={t("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder={t("password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{t("login")}</Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <button type="button" onClick={() => setMode("register-choice")} className="text-primary underline">
                {t("signUp")}
              </button>
            </p>
          </form>
        )}

        {mode === "register-choice" && (
          <div className="space-y-4">
            <Button onClick={() => setMode("register-user")} variant="outline" className="w-full h-16 text-base">
              {t("registerAsUser")}
            </Button>
            <Button onClick={() => setMode("register-partner")} variant="outline" className="w-full h-16 text-base">
              {t("registerAsPartner")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary underline">
                {t("login")}
              </button>
            </p>
          </div>
        )}

        {(mode === "register-user" || mode === "register-partner") && (
          <form onSubmit={(e) => handleRegister(e, mode === "register-partner")} className="space-y-4">
            <Input placeholder={t("fullName")} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input placeholder={t("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder={t("password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{t("signUp")}</Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary underline">
                {t("login")}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
