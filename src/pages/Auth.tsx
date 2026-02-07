import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { ChevronLeft, Eye, EyeOff, Handshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "register-choice" | "register-user" | "register-partner" | "forgot-password";

export default function Auth() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link to verify your account.",
      });
      if (isPartner) {
        navigate("/partner/setup");
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) setError(error.message);
    else {
      toast({
        title: "Reset link sent",
        description: "Check your email for a password reset link.",
      });
      setMode("login");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  };

  const goBack = () => {
    if (mode === "login") navigate(-1);
    else if (mode === "register-choice" || mode === "forgot-password") setMode("login");
    else setMode("register-choice");
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Background blobs */}
      <div className="blob-warm-1 absolute -top-20 -right-20 h-64 w-64 rounded-full" />
      <div className="blob-warm-2 absolute top-1/3 -left-32 h-72 w-72 rounded-full" />

      {/* Header */}
      <div className="relative flex items-center justify-center px-4 pt-14 pb-2">
        <button
          onClick={goBack}
          className="absolute left-4 top-14 flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="text-base font-semibold text-foreground">
          {mode === "login" && "Sign In"}
          {mode === "forgot-password" && "Reset Password"}
          {mode === "register-choice" && t("signUp")}
          {(mode === "register-user" || mode === "register-partner") && t("signUp")}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col px-6 pt-6">
        {/* ─── LOGIN ─── */}
        {mode === "login" && (
          <>
            {/* Hero text */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold leading-tight text-foreground">
                Get Moving in<br />
                <span className="text-primary">Georgia</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Access top trainers and facilities near you.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-13 rounded-2xl border-border bg-card px-4 text-sm shadow-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-13 rounded-2xl border-border bg-card px-4 pr-12 text-sm shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-sm font-medium text-primary"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                {loading ? t("loading") : "Log In"}
              </Button>
            </form>

            {/* Join as Partner */}
            <Button
              variant="outline"
              onClick={() => setMode("register-partner")}
              className="mt-3 h-14 w-full rounded-2xl border-primary/30 bg-primary/5 text-base font-semibold text-primary hover:bg-primary/10"
            >
              <Handshake className="mr-2 h-5 w-5" />
              Join as a Partner
            </Button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">Or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Social buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleGoogleSignIn}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card shadow-sm"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                <span className="text-sm font-bold text-foreground">iOS</span>
              </button>
            </div>

            {/* Sign up link */}
            <p className="mt-6 pb-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("register-choice")}
                className="font-semibold text-primary"
              >
                {t("signUp")}
              </button>
            </p>
          </>
        )}

        {/* ─── FORGOT PASSWORD ─── */}
        {mode === "forgot-password" && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold leading-tight text-foreground">
                Reset Your<br />
                <span className="text-primary">Password</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-13 rounded-2xl border-border bg-card px-4 text-sm shadow-none"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                {loading ? t("loading") : "Send Reset Link"}
              </Button>
            </form>

            <p className="mt-6 pb-8 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary">
                Log In
              </button>
            </p>
          </>
        )}

        {/* ─── REGISTER CHOICE ─── */}
        {mode === "register-choice" && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold leading-tight text-foreground">
                Join<br />
                <span className="text-primary">FitBook</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                How do you want to use FitBook?
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setMode("register-user")}
                variant="outline"
                className="h-16 w-full rounded-2xl border-border bg-card text-base font-semibold shadow-sm"
              >
                {t("registerAsUser")}
              </Button>
              <Button
                onClick={() => setMode("register-partner")}
                variant="outline"
                className="h-16 w-full rounded-2xl border-primary/30 bg-primary/5 text-base font-semibold text-primary"
              >
                <Handshake className="mr-2 h-5 w-5" />
                {t("registerAsPartner")}
              </Button>
            </div>

            <p className="mt-6 pb-8 text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary">
                {t("login")}
              </button>
            </p>
          </>
        )}

        {/* ─── REGISTER FORM (User or Partner) ─── */}
        {(mode === "register-user" || mode === "register-partner") && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold leading-tight text-foreground">
                Create Your<br />
                <span className="text-primary">Account</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "register-partner"
                  ? "Set up your partner profile."
                  : "Start your fitness journey today."}
              </p>
            </div>

            <form onSubmit={(e) => handleRegister(e, mode === "register-partner")} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fullName")}</label>
                <Input
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-13 rounded-2xl border-border bg-card px-4 text-sm shadow-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-13 rounded-2xl border-border bg-card px-4 text-sm shadow-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    placeholder="Create a password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-13 rounded-2xl border-border bg-card px-4 pr-12 text-sm shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                {loading ? t("loading") : t("signUp")}
              </Button>
            </form>

            <p className="mt-6 pb-8 text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary">
                {t("login")}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
