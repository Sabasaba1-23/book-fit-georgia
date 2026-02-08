import { CheckCircle2, Calendar, Clock, MapPin, Copy, X, CreditCard, Hash, Receipt } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface BookingTicketProps {
  open: boolean;
  onClose: () => void;
  booking: {
    id: string;
    title: string;
    sport: string;
    date: string;
    duration: number;
    price: number;
    trainerName: string;
    location?: string;
    paymentMethod?: string;
    paymentId?: string;
    bookedAt?: string;
    spots?: number;
    bookingStatus?: string;
  };
}

function extractPaymentMethod(paymentId?: string, method?: string): string {
  if (method) return method;
  if (!paymentId) return "Unknown";
  if (paymentId.includes("card")) return "Credit Card";
  if (paymentId.includes("apple")) return "Apple Pay";
  if (paymentId.includes("google")) return "Google Pay";
  if (paymentId.includes("bog")) return "BOG Pay";
  if (paymentId.includes("demo")) {
    const parts = paymentId.split("_");
    if (parts[1]) return parts[1].replace(/^\w/, (c) => c.toUpperCase()) + " (Demo)";
    return "Demo Payment";
  }
  return "Online Payment";
}

export default function BookingTicket({ open, onClose, booking }: BookingTicketProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const ticketCode = `FB-${booking.id.slice(0, 8).toUpperCase()}`;
  const dateObj = new Date(booking.date);
  const bookedDate = booking.bookedAt ? new Date(booking.bookedAt) : new Date();
  const paymentMethod = extractPaymentMethod(booking.paymentId, booking.paymentMethod);
  const transactionId = booking.paymentId
    ? booking.paymentId.slice(0, 20).toUpperCase()
    : ticketCode;

  const copyCode = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200 p-5">
      <div className="relative w-full max-w-sm animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-lg"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="overflow-hidden rounded-3xl bg-card shadow-2xl">
          <div className="bg-gradient-to-br from-primary to-secondary px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">{t("bookingConfirmedTitle")}</h3>
            <p className="mt-1 text-sm text-white/80">{t("sessionSecured")}</p>
          </div>

          <div className="relative h-6">
            <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-foreground/40" />
            <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-foreground/40" />
            <div className="absolute inset-x-6 top-1/2 border-t border-dashed border-border" />
          </div>

          <div className="px-6 pb-6 space-y-4">
            <div>
              <p className="text-lg font-medium text-foreground">{booking.title}</p>
              <p className="text-sm text-muted-foreground">{t("withTrainer")} {booking.trainerName}</p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{format(dateObj, "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>{format(dateObj, "hh:mm a")} · {booking.duration} {t("min")}</span>
              </div>
              {booking.location && (
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{booking.location}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-muted/50 p-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">{t("ticketCode")}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl tracking-widest text-foreground">{ticketCode}</span>
                <button onClick={copyCode} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className={cn("h-4 w-4", copied && "text-primary")} />
                </button>
              </div>
              {copied && <p className="mt-1 text-[10px] text-primary">{t("copiedLabel")}</p>}
            </div>

            <div className="rounded-2xl border border-border/50 p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                {t("paymentReceipt")}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    {t("paymentMethod")}
                  </span>
                  <span className="text-xs font-semibold text-foreground">{paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    {t("transactionId")}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-foreground">{transactionId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {t("bookedOn")}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {format(bookedDate, "MMM d, yyyy · HH:mm")}
                  </span>
                </div>
                {booking.spots && booking.spots > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("spots")}</span>
                    <span className="text-xs font-semibold text-foreground">{booking.spots}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span className="text-sm text-muted-foreground">{t("amountPaid")}</span>
              <span className="text-lg font-semibold text-foreground">{booking.price}₾</span>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all active:scale-95"
            >
              {t("doneBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
