import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { BankCard, PaymentMethod, Iphone } from "@icon-park/react";
import { cn } from "@/lib/utils";
import BookingTicket from "@/components/BookingTicket";

type PayMethod = "card" | "apple" | "google";

export interface PaymentLocationState {
  amount: number;
  title: string;
  listingId: string;
  sport: string;
  scheduledAt: string;
  durationMinutes: number;
  trainerName: string;
  spots?: number;
  isPackage?: boolean;
  sessionsCount?: number;
}

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const state = location.state as PaymentLocationState | null;

  const [method, setMethod] = useState<PayMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Redirect if no state
  if (!state || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-muted-foreground">No payment data found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const canPay =
    method === "card"
      ? cardNumber.replace(/\s/g, "").length >= 4 && expiry.length >= 4 && cvc.length >= 3
      : true;

  const handlePay = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);

    // Create booking
    setBooking(true);
    try {
      const paymentId = state.isPackage
        ? `demo_${method}_pkg_${Date.now()}`
        : `demo_${method}_${Date.now()}`;

      const { data, error } = await supabase.from("bookings").insert({
        user_id: user.id,
        listing_id: state.listingId,
        spots: state.spots || 1,
        total_price: state.amount,
        payment_status: "paid",
        booking_status: "confirmed",
        stripe_payment_id: paymentId,
      }).select("id").single();

      if (error) {
        const msg = error.code === "23505"
          ? t("alreadyBooked") || "You've already booked this session."
          : t("bookingFailed") || "Booking failed. Please try again.";
        toast({ title: msg, variant: "destructive" });
        setBooking(false);
        return;
      }

      setConfirmedBookingId(data.id);
      setSuccess(true);
      setTimeout(() => {
        setShowTicket(true);
      }, 1200);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (showTicket) {
    return (
      <BookingTicket
        open={true}
        onClose={() => navigate("/bookings")}
        booking={{
          id: confirmedBookingId,
          title: state.title,
          sport: state.sport,
          date: state.scheduledAt,
          duration: state.durationMinutes,
          price: state.amount,
          trainerName: state.trainerName,
          spots: state.spots,
        }}
      />
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background animate-in fade-in duration-300 p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-extrabold text-foreground">
          {t("paymentSuccessful")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("bookingConfirmed")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/40 bg-background/95 backdrop-blur-sm px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-foreground">{t("completePayment")}</h1>
          <p className="text-xs text-muted-foreground line-clamp-1">{state.title}</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
        {/* Amount */}
        <div className="flex items-center justify-between rounded-2xl bg-primary/5 p-5">
          <span className="text-sm font-semibold text-foreground">{t("totalAmount")}</span>
          <span className="text-3xl font-extrabold text-primary">{state.amount}₾</span>
        </div>

        {/* Payment method tabs */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {t("paymentMethod")}
          </p>
          <div className="flex rounded-2xl border border-border bg-muted/30 p-1 gap-1">
            <button
              onClick={() => setMethod("card")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-all",
                method === "card"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <BankCard size={14} fill="currentColor" />
              {t("cardLabel")}
            </button>
            <button
              onClick={() => setMethod("apple")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-all",
                method === "apple"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <Iphone size={14} fill="currentColor" />
              Apple Pay
            </button>
            <button
              onClick={() => setMethod("google")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-all",
                method === "google"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              <PaymentMethod size={14} fill="currentColor" />
              Google Pay
            </button>
          </div>
        </div>

        {/* Card form */}
        {method === "card" && (
          <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                {t("cardNumber")}
              </label>
              <div className="relative">
                <Input
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="h-13 rounded-2xl border-0 bg-muted/60 pl-4 pr-12 text-[15px] font-medium shadow-none tracking-wider"
                />
                <BankCard size={20} fill="hsl(var(--muted-foreground) / 0.5)" className="absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                {t("cardholderName")}
              </label>
              <Input
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="h-13 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  {t("expiry")}
                </label>
                <Input
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className="h-13 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none tracking-wider"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  {t("cvcLabel")}
                </label>
                <Input
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  type="password"
                  className="h-13 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none tracking-wider"
                />
              </div>
            </div>
          </div>
        )}

        {/* Apple/Google Pay placeholder */}
        {method !== "card" && (
          <div className="flex flex-col items-center py-8 animate-in fade-in duration-200">
            <Iphone size={48} fill="hsl(var(--primary) / 0.4)" className="mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("tapToPayWith")} {method === "apple" ? "Apple Pay" : "Google Pay"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("demoPaymentNote")}
            </p>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-muted/30 px-4 py-3">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("demoModeNote")}
          </p>
        </div>

        {/* Secure badges */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>SSL Encrypted</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            <span>Secure Payment</span>
          </div>
        </div>
      </div>

      {/* Fixed bottom pay button */}
      <div className="fixed inset-x-0 bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/40 px-4 pb-8 pt-4">
        <div className="mx-auto max-w-lg">
          <Button
            disabled={!canPay || processing || booking}
            onClick={handlePay}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary h-14 text-base font-bold text-primary-foreground shadow-lg"
          >
            {processing || booking ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {t("processing")}
              </>
            ) : (
              <>
                {t("payAmount")} {state.amount}₾
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
