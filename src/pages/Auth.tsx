import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, Eye, EyeOff, Handshake, ArrowRight, User, Building2, Mail, BadgeCheck, ShieldCheck, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register-choice" | "register-user" | "register-partner" | "forgot-password";

function ContactPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="underline text-primary">
        Contact Us
      </button>
      {open && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-48 rounded-2xl bg-card border border-border shadow-lg p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <a
            href="mailto:support@fitbook.my"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <Mail className="h-3.5 w-3.5 text-primary" />
            Email Us
          </a>
          <a
            href="https://wa.me/995511102916"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5 text-green-500" />
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

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

  // Partner-specific fields
  const [partnerType, setPartnerType] = useState<"individual" | "gym">("individual");
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    // Check if user is a partner and redirect accordingly
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "partner" as any })
      .then(({ data: isPartner }) => {
        if (isPartner) {
          navigate("/partner/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("Incorrect email or password. Please try again.");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Please check your email and confirm your account first.");
      } else {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (error) {
      if (error.message.includes("already registered")) {
        setError("This email is already registered. Try logging in instead.");
      } else {
        setError(error.message);
      }
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link to verify your account.",
      });
    }
    setLoading(false);
  };

  const handleRegisterPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!partnerName.trim()) {
      setError("Please enter your name or gym name.");
      return;
    }
    if (!partnerEmail.trim()) {
      setError("Please enter your professional email.");
      return;
    }
    if (!partnerPhone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // Sign up the user with partner metadata
    // Sign up - the handle_new_user trigger will create partner profile & role
    const { error: signUpError } = await supabase.auth.signUp({
      email: partnerEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: partnerName.trim(),
          is_partner: true,
          partner_type: partnerType,
          phone_number: partnerPhone.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    toast({
      title: "Partner account created! 🎉",
      description: "Check your email for verification. Our team will review your profile shortly.",
    });
    setLoading(false);
    setMode("login");
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
      toast({ title: "Reset link sent", description: "Check your email for a password reset link." });
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

      {/* ─── LOGIN ─── */}
      {mode === "login" && (
        <div className="relative z-10 flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-2" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top, 3.5rem))' }}>
            <button onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <span className="text-base font-semibold text-foreground">Sign In</span>
            <div className="w-11" />
          </div>

          <div className="flex flex-1 flex-col px-6 pt-6">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold leading-tight text-foreground">
                Get Moving in<br />
                <span className="text-primary">Georgia</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Access top trainers and facilities near you.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input placeholder="Enter your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-13 rounded-2xl border-border bg-card px-4 text-sm shadow-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input placeholder="••••••••" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-13 rounded-2xl border-border bg-card px-4 pr-12 text-sm shadow-none" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-1.5 text-right">
                  <button type="button" onClick={() => setMode("forgot-password")} className="text-sm font-medium text-primary">Forgot Password?</button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90">
                {loading ? t("loading") : "Log In"}
              </Button>
            </form>

            <Button variant="outline" onClick={() => setMode("register-partner")} className="mt-3 h-14 w-full rounded-2xl border-primary/30 bg-primary/5 text-base font-semibold text-primary hover:bg-primary/10">
              <Handshake className="mr-2 h-5 w-5" />
              Join as a Partner
            </Button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">Or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button onClick={handleGoogleSignIn} className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-accent">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
              <span>By continuing, you agree to our</span>
              <button type="button" onClick={() => navigate("/terms")} className="underline text-primary">Terms</button>
              <span>&</span>
              <button type="button" onClick={() => navigate("/privacy")} className="underline text-primary">Privacy</button>
              <span>·</span>
              <ContactPopover />
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button type="button" onClick={() => setMode("register-choice")} className="font-semibold text-primary">{t("signUp")}</button>
            </p>

            <p className="mt-4 pb-8 text-center text-[11px] text-muted-foreground/60">© 2026 Fitbook Georgia. All rights reserved.</p>
          </div>
        </div>
      )}

      {/* ─── FORGOT PASSWORD ─── */}
      {mode === "forgot-password" && (
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex items-center justify-between px-5 pb-2" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top, 3.5rem))' }}>
            <button onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <span className="text-base font-semibold text-foreground">Reset Password</span>
            <div className="w-11" />
          </div>
          <div className="flex flex-1 flex-col px-6 pt-6">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold leading-tight text-foreground">Reset Your<br /><span className="text-primary">Password</span></h1>
              <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input placeholder="Enter your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-13 rounded-2xl border-border bg-card px-4 text-sm shadow-none" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90">
                {loading ? t("loading") : "Send Reset Link"}
              </Button>
            </form>
            <p className="mt-6 pb-8 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary">Log In</button>
            </p>
          </div>
        </div>
      )}

      {/* ─── REGISTER CHOICE ─── */}
      {mode === "register-choice" && (
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex items-center justify-between px-5 pb-2" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top, 3.5rem))' }}>
            <button onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <span className="text-base font-semibold text-foreground">{t("signUp")}</span>
            <div className="w-11" />
          </div>
          <div className="flex flex-1 flex-col px-6 pt-6">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold leading-tight text-foreground">Join<br /><span className="text-primary">FitBook</span></h1>
              <p className="mt-2 text-sm text-muted-foreground">How do you want to use FitBook?</p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => setMode("register-user")} variant="outline" className="h-16 w-full rounded-2xl border-border bg-card text-base font-semibold shadow-sm">
                {t("registerAsUser")}
              </Button>
              <Button onClick={() => setMode("register-partner")} variant="outline" className="h-16 w-full rounded-2xl border-primary/30 bg-primary/5 text-base font-semibold text-primary">
                <Handshake className="mr-2 h-5 w-5" />
                {t("registerAsPartner")}
              </Button>
            </div>
            <p className="mt-6 pb-8 text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary">{t("login")}</button>
            </p>
          </div>
        </div>
      )}

      {/* ─── REGISTER USER ─── */}
      {mode === "register-user" && (
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex items-center justify-between px-5 pb-2" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top, 3.5rem))' }}>
            <button onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <span className="text-base font-semibold text-foreground">{t("signUp")}</span>
            <div className="w-11" />
          </div>
          <div className="flex flex-1 flex-col px-6 pt-6">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold leading-tight text-foreground">Create Your<br /><span className="text-primary">Account</span></h1>
              <p className="mt-2 text-sm text-muted-foreground">Start your fitness journey today.</p>
            </div>
            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fullName")}</label>
                <Input placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-13 rounded-2xl border-border bg-card px-4 text-sm shadow-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <Input placeholder="Enter your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-13 rounded-2xl border-border bg-card px-4 text-sm shadow-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input placeholder="Create a password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-13 rounded-2xl border-border bg-card px-4 pr-12 text-sm shadow-none" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground text-center">
                By signing up, you agree to our{" "}
                <button type="button" onClick={() => navigate("/terms")} className="underline text-primary">Terms & Conditions</button>
                {" "}and{" "}
                <button type="button" onClick={() => navigate("/privacy")} className="underline text-primary">Privacy Policy</button>.
              </p>
              <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90">
                {loading ? t("loading") : t("signUp")}
              </Button>
            </form>
            <p className="mt-6 pb-8 text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary">{t("login")}</button>
            </p>
          </div>
        </div>
      )}

      {/* ─── REGISTER PARTNER ─── */}
      {mode === "register-partner" && (
        <div className="relative z-10 flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-2" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top, 3.5rem))' }}>
            <button onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <span className="rounded-full border border-primary/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              Partner
            </span>
            <div className="w-11" />
          </div>

          <div className="flex flex-1 flex-col px-6 pt-4 pb-8">
            {/* Hero */}
            <div className="mb-8">
              <h1 className="text-[32px] font-extrabold leading-[1.1] text-foreground">
                Start Training{"\n"}<br />
                <span className="text-primary">with Us</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Join the elite network of fitness professionals and grow your sports business.
              </p>
            </div>

            {/* Partner type selector */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">I am a...</p>
              <div className="flex rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPartnerType("individual")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all",
                    partnerType === "individual"
                      ? "bg-foreground text-background shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <User className="h-4 w-4" />
                  Individual Trainer
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerType("gym")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all",
                    partnerType === "gym"
                      ? "bg-foreground text-background shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  Gym / Place
                </button>
              </div>
            </div>

            <form onSubmit={handleRegisterPartner} className="space-y-5">
              {/* Name */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Name / Gym Name
                </label>
                <div className="relative">
                  <Input
                    placeholder={partnerType === "individual" ? "Alex Rivera" : "FitZone Gym"}
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    required
                    className="h-14 rounded-2xl border-0 bg-muted/60 px-4 pr-12 text-[15px] font-medium shadow-none placeholder:text-muted-foreground/50"
                  />
                  <BadgeCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Professional Email
                </label>
                <div className="relative">
                  <Input
                    placeholder="alex@training.pro"
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    required
                    className="h-14 rounded-2xl border-0 bg-muted/60 px-4 pr-12 text-[15px] font-medium shadow-none placeholder:text-muted-foreground/50"
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="+995 5XX XXX XXX"
                    type="tel"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    required
                    className="h-14 rounded-2xl border-0 bg-muted/60 px-4 pr-12 text-[15px] font-medium shadow-none placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    placeholder="Create a secure password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-14 rounded-2xl border-0 bg-muted/60 px-4 pr-12 text-[15px] font-medium shadow-none placeholder:text-muted-foreground/50"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Verification badge */}
              <div className="flex items-start gap-4 rounded-2xl bg-muted/60 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Premium Verification</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                    All partners undergo a brief screening to ensure the highest quality of service for our community.
                  </p>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <p className="text-xs text-muted-foreground text-center">
                By creating a partner account, you agree to our{" "}
                <button type="button" onClick={() => navigate("/terms")} className="underline text-primary">Terms & Conditions</button>
                {" "}and{" "}
                <button type="button" onClick={() => navigate("/privacy")} className="underline text-primary">Privacy Policy</button>.
              </p>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                {loading ? t("loading") : (
                  <span className="flex items-center gap-2">
                    Create Partner Account
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already a partner?{" "}
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary">
                Log in
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
