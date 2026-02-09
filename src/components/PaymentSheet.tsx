import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { BankCard, PaymentMethod, Iphone } from "@icon-park/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  title: string;
  onPaymentSuccess: (method: string) => void;
  loading?: boolean;
}

type PaymentMethod = "card" | "apple" | "google";

export default function PaymentSheet({
  open,
  onOpenChange,
  amount,
  title,
  onPaymentSuccess,
  loading: externalLoading,
}: PaymentSheetProps) {
  const { t } = useLanguage();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handlePay = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    setSuccess(true);
    setTimeout(() => {
      onPaymentSuccess(method);
      setSuccess(false);
      setCardNumber("");
      setExpiry("");
      setCvc("");
      setCardName("");
      setMethod("card");
    }, 1200);
  };

  const canPay =
    method === "card"
      ? cardNumber.replace(/\s/g, "").length >= 4 && expiry.length >= 4 && cvc.length >= 3
      : true;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!processing && !success) onOpenChange(o);
      }}
    >
      <SheetContent
        side="bottom"
        className="h-auto max-h-[90vh] rounded-t-[2rem] p-0 overflow-hidden border-0"
      >
        <div className="flex flex-col bg-background">
          {success && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background animate-in fade-in duration-300">
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
          )}

          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
            <SheetTitle className="text-xl font-extrabold text-foreground">
              {t("completePayment")}
            </SheetTitle>
            <p className="text-sm text-muted-foreground mt-1">{title}</p>
          </SheetHeader>

          <div className="px-6 py-5 space-y-5">
            <div className="flex items-center justify-between rounded-2xl bg-primary/5 p-4">
              <span className="text-sm font-semibold text-foreground">
                {t("totalAmount")}
              </span>
              <span className="text-2xl font-extrabold text-primary">
                {amount}₾
              </span>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                {t("paymentMethod")}
              </p>
              <div className="flex rounded-2xl border border-border bg-muted/30 p-1 gap-1">
                <button
                  onClick={() => setMethod("card")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all",
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
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all",
                    method === "apple"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Apple Pay
                </button>
                <button
                  onClick={() => setMethod("google")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all",
                    method === "google"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Google Pay
                </button>
              </div>
            </div>

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
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
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

            {method !== "card" && (
              <div className="flex flex-col items-center py-6 animate-in fade-in duration-200">
                <Smartphone className="h-12 w-12 text-primary/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {t("tapToPayWith")}{" "}
                  {method === "apple" ? "Apple Pay" : "Google Pay"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("demoPaymentNote")}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                {t("demoModeNote")}
              </p>
            </div>
          </div>

          <div className="px-6 pb-8 pt-2">
            <Button
              disabled={!canPay || processing || externalLoading}
              onClick={handlePay}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary h-14 text-base font-bold text-primary-foreground shadow-lg"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {t("processing")}
                </>
              ) : (
                <>
                  {t("payAmount")} {amount}₾
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
