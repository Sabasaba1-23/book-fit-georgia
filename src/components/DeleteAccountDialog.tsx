import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [checked, setChecked] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canProceedStep1 = checked;
  const canDelete = confirmText === "DELETE";

  function handleClose() {
    if (deleting) return;
    setStep(1);
    setChecked(false);
    setConfirmText("");
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!user || deleting) return;
    setDeleting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast({ title: t("sessionExpired"), variant: "destructive" });
        setDeleting(false);
        return;
      }

      const res = await fetch(
        `https://zipgluionntzkhgtqkgx.supabase.co/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcGdsdWlvbm50emtoZ3Rxa2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg5MTgsImV4cCI6MjA4NTk3NDkxOH0.d4fIOvFqWEfWmr_bPAuMLhQM2HFolhcJYO-j-VNAbJk",
          },
          body: JSON.stringify({ confirmation: "DELETE" }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        toast({ title: result.error || t("failedToConfirm"), variant: "destructive" });
        setDeleting(false);
        return;
      }

      await signOut();
      handleClose();
      navigate("/auth", { replace: true });
      toast({ title: t("accountDeleted") });
    } catch {
      toast({ title: t("failedToConfirm"), variant: "destructive" });
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-lg">{t("deleteAccountTitle")}</DialogTitle>
          <DialogDescription className="text-center">
            {step === 1 ? t("deleteAccountDesc1") : t("deleteAccountDesc2")}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-border accent-destructive"
              />
              <span className="text-sm text-foreground leading-snug">
                {t("understandPermanent")}
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {t("cancel")}
              </button>
              <button
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              >
                {t("continueLabel")}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-2">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder={t("typeDeleteConfirm")}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-center text-sm font-mono tracking-widest text-foreground outline-none focus:border-destructive"
              autoFocus
              disabled={deleting}
            />

            <div className="flex gap-2">
              <button
                onClick={() => { setStep(1); setConfirmText(""); }}
                disabled={deleting}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                {t("backLabel")}
              </button>
              <button
                disabled={!canDelete || deleting}
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("deletingAccount")}
                  </>
                ) : (
                  t("permanentlyDelete")
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
