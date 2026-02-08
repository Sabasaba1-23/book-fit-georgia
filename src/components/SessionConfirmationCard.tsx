import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface ConfirmationCardProps {
  bookingId: string;
  completionRequest: {
    id: string;
    user_status: string;
    partner_status: string;
  } | null;
  isPartner: boolean;
  onUpdate: () => void;
}

export default function SessionConfirmationCard({
  bookingId,
  completionRequest,
  isPartner,
  onUpdate,
}: ConfirmationCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);

  if (!user) return null;

  const myStatus = isPartner
    ? completionRequest?.partner_status
    : completionRequest?.user_status;
  const otherStatus = isPartner
    ? completionRequest?.user_status
    : completionRequest?.partner_status;

  if (myStatus === "confirmed") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">{t("youConfirmedSession")}</p>
          <p className="text-[10px] text-muted-foreground">
            {otherStatus === "confirmed" ? t("bothConfirmed") : t("waitingOtherParty")}
          </p>
        </div>
      </div>
    );
  }

  if (myStatus === "disputed") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-destructive/5 border border-destructive/10 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <div>
          <p className="text-xs font-semibold text-foreground">{t("issueReported")}</p>
          <p className="text-[10px] text-muted-foreground">{t("teamReviewing")}</p>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (!completionRequest) {
        const insertData: any = {
          booking_id: bookingId,
          [isPartner ? "partner_status" : "user_status"]: "confirmed",
          [isPartner ? "partner_confirmed_at" : "user_confirmed_at"]: new Date().toISOString(),
          auto_complete_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        const { error } = await supabase.from("completion_requests").insert(insertData);
        if (error) throw error;
      } else {
        const updateData: any = {
          [isPartner ? "partner_status" : "user_status"]: "confirmed",
          [isPartner ? "partner_confirmed_at" : "user_confirmed_at"]: new Date().toISOString(),
        };
        const { error } = await supabase
          .from("completion_requests")
          .update(updateData)
          .eq("id", completionRequest.id);
        if (error) throw error;
      }

      const otherConfirmed = otherStatus === "confirmed";
      if (otherConfirmed) {
        await supabase
          .from("bookings")
          .update({ booking_status: "completed" })
          .eq("id", bookingId);
      }

      toast({ title: t("sessionConfirmed") });
      onUpdate();
    } catch (err: any) {
      toast({ title: t("failedToConfirm"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (reason: string, note: string) => {
    setLoading(true);
    try {
      if (!completionRequest) {
        await supabase.from("completion_requests").insert({
          booking_id: bookingId,
          [isPartner ? "partner_status" : "user_status"]: "disputed",
        });
      } else {
        await supabase
          .from("completion_requests")
          .update({ [isPartner ? "partner_status" : "user_status"]: "disputed" })
          .eq("id", completionRequest.id);
      }

      await supabase.from("session_issues").insert({
        booking_id: bookingId,
        reporter_id: user.id,
        reporter_role: isPartner ? "partner" : "user",
        reason,
        note: note || null,
      });

      await supabase
        .from("bookings")
        .update({ booking_status: "disputed" })
        .eq("id", bookingId);

      toast({ title: t("issueReportedToast"), description: t("teamWillReview") });
      setShowIssueForm(false);
      onUpdate();
    } catch (err: any) {
      toast({ title: t("failedToReport"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (showIssueForm) {
    return (
      <IssueForm
        onSubmit={handleReportIssue}
        onCancel={() => setShowIssueForm(false)}
        loading={loading}
      />
    );
  }

  return (
    <div className="rounded-2xl bg-muted/40 border border-border/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-primary" />
        <p className="text-xs font-bold text-foreground">{t("didSessionHappen")}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t("confirmBtn")}
        </button>
        <button
          onClick={() => setShowIssueForm(true)}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full border-2 border-destructive/30 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive/5 active:scale-95 disabled:opacity-50"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("reportIssue")}
        </button>
      </div>
    </div>
  );
}

function IssueForm({
  onSubmit,
  onCancel,
  loading,
}: {
  onSubmit: (reason: string, note: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const REASONS = [
    { key: "sessionDidntHappen", value: "Session didn't happen" },
    { key: "trainerWasAbsent", value: "Trainer was absent" },
    { key: "wrongTimeLocation", value: "Wrong time/location" },
    { key: "qualityIssue", value: "Quality issue" },
    { key: "safetyConcern", value: "Safety concern" },
    { key: "otherReason", value: "Other" },
  ] as const;

  return (
    <div className="rounded-2xl bg-destructive/5 border border-destructive/10 p-4 space-y-3">
      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        {t("reportAnIssue")}
      </p>

      <div className="space-y-1.5">
        {REASONS.map((r) => (
          <button
            key={r.value}
            onClick={() => setReason(r.value)}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
              reason === r.value
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-card border border-border/40 text-foreground hover:bg-muted/50"
            }`}
          >
            {t(r.key as any)}
            {reason === r.value && <CheckCircle2 className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("additionalDetails")}
        className="w-full rounded-xl bg-card border border-border/40 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        rows={2}
      />

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full border-2 border-border py-2.5 text-xs font-bold text-foreground transition-all active:scale-95"
        >
          {t("cancel")}
        </button>
        <button
          onClick={() => reason && onSubmit(reason, note)}
          disabled={!reason || loading}
          className="flex-1 rounded-full bg-destructive py-2.5 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? t("submittingReport") : t("submitReport")}
        </button>
      </div>
    </div>
  );
}
