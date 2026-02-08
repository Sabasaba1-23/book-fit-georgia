import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

interface Props {
  verificationStatus: string;
  onGetVerified: () => void;
}

const STORAGE_KEY = "verification_nudge_dismissed_at";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function VerificationNudgeDialog({ verificationStatus, onGetVerified }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (verificationStatus !== "unverified") return;

    const lastDismissed = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (!lastDismissed || now - Number(lastDismissed) > SEVEN_DAYS) {
      // Small delay so it feels natural, not instant
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  };

  const handleVerify = () => {
    setOpen(false);
    onGetVerified();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="max-w-sm rounded-3xl p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Build trust with your clients</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Verified profiles appear more trustworthy and are more likely to get bookings from users.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={handleVerify} className="h-12 rounded-xl font-bold">
            Get Verified
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="h-10 text-sm text-muted-foreground">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
