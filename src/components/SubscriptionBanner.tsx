import { useState } from "react";
import { AlertTriangle, Crown, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";

interface SubscriptionBannerProps {
  bookingsLast30Days: number;
  isOverFreeLimit: boolean;
  isPro: boolean;
  onUpgrade: () => Promise<void>;
}

export default function SubscriptionBanner({
  bookingsLast30Days,
  isOverFreeLimit,
  isPro,
  onUpgrade,
}: SubscriptionBannerProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (isPro) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Pro Plan Active</p>
          <p className="text-[12px] text-muted-foreground">Unlimited bookings • Priority support</p>
        </div>
      </div>
    );
  }

  if (!isOverFreeLimit) return null;

  const handleUpgrade = async () => {
    setProcessing(true);
    // Mock payment delay
    await new Promise((r) => setTimeout(r, 2000));
    await onUpgrade();
    setProcessing(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setShowUpgradeDialog(false);
    }, 1500);
  };

  return (
    <>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Free Plan Limit Reached</p>
            <p className="mt-1 text-[13px] text-amber-700">
              You've received <span className="font-bold">{bookingsLast30Days}</span> bookings in the
              last 30 days. Upgrade to Pro (50₾/month) for unlimited bookings.
            </p>
            <Button
              onClick={() => setShowUpgradeDialog(true)}
              className="mt-3 h-10 rounded-xl bg-amber-600 text-sm font-bold text-white hover:bg-amber-700"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          {success ? (
            <div className="flex flex-col items-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Upgrade Successful!</h3>
              <p className="mt-1 text-sm text-muted-foreground">Welcome to Pro 🎉</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-extrabold">
                  <Crown className="h-5 w-5 text-primary" />
                  Upgrade to Pro
                </DialogTitle>
                <DialogDescription>Unlock unlimited bookings for your business</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="rounded-2xl bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Pro Plan</span>
                    <span className="text-2xl font-extrabold text-primary">50₾<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                  </div>
                  <div className="space-y-2">
                    {["Unlimited bookings", "Priority in search results", "Analytics dashboard", "Priority support"].map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-center text-muted-foreground">
                  This is a demo payment. No real charges will be made.
                </p>

                <Button
                  onClick={handleUpgrade}
                  disabled={processing}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary text-base font-bold text-primary-foreground"
                >
                  {processing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay 50₾ & Upgrade
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
