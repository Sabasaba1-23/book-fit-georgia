import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertTriangle, Clock, ChevronRight } from "lucide-react";

interface ConfirmationCardProps {
  bookingId: string;
  completionRequest: {
    id: string;
    user_status: string;
    partner_status: string;
  } | null;
  /** Whether the current viewer is the partner (trainer) for this booking */
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
  const [loading, setLoading] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);

  if (!user) return null;

  const myStatus = isPartner
    ? completionRequest?.partner_status
    : completionRequest?.user_status;
  const otherStatus = isPartner
    ? completionRequest?.user_status
    : completionRequest?.partner_status;

  // Already confirmed by this side
  if (myStatus === "confirmed") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">You confirmed this session</p>
          <p className="text-[10px] text-muted-foreground">
            {otherStatus === "confirmed"
              ? "Both sides confirmed — you can now leave a review"
              : "Waiting for the other party to confirm"}
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
          <p className="text-xs font-semibold text-foreground">Issue reported</p>
          <p className="text-[10px] text-muted-foreground">Our team is reviewing this dispute</p>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (!completionRequest) {
        // Create the completion request
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

      // Check if both confirmed → complete booking
      const otherConfirmed = otherStatus === "confirmed";
      if (otherConfirmed) {
        await supabase
          .from("bookings")
          .update({ booking_status: "completed" })
          .eq("id", bookingId);
      }

      toast({ title: "Session confirmed ✓" });
      onUpdate();
    } catch (err: any) {
      toast({ title: "Failed to confirm", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (reason: string, note: string) => {
    setLoading(true);
    try {
      // Update or create completion request with disputed status
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

      // Create issue
      await supabase.from("session_issues").insert({
        booking_id: bookingId,
        reporter_id: user.id,
        reporter_role: isPartner ? "partner" : "user",
        reason,
        note: note || null,
      });

      // Mark booking as disputed
      await supabase
        .from("bookings")
        .update({ booking_status: "disputed" })
        .eq("id", bookingId);

      toast({ title: "Issue reported", description: "Our team will review this shortly." });
      setShowIssueForm(false);
      onUpdate();
    } catch (err: any) {
      toast({ title: "Failed to report issue", description: err.message, variant: "destructive" });
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
        <p className="text-xs font-bold text-foreground">Did this session happen?</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Confirm
        </button>
        <button
          onClick={() => setShowIssueForm(true)}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full border-2 border-destructive/30 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive/5 active:scale-95 disabled:opacity-50"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Report Issue
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
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const REASONS = [
    "Session didn't happen",
    "Trainer was absent",
    "Wrong time/location",
    "Quality issue",
    "Safety concern",
    "Other",
  ];

  return (
    <div className="rounded-2xl bg-destructive/5 border border-destructive/10 p-4 space-y-3">
      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        Report an Issue
      </p>

      <div className="space-y-1.5">
        {REASONS.map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
              reason === r
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-card border border-border/40 text-foreground hover:bg-muted/50"
            }`}
          >
            {r}
            {reason === r && <CheckCircle2 className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Additional details (optional)"
        className="w-full rounded-xl bg-card border border-border/40 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        rows={2}
      />

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full border-2 border-border py-2.5 text-xs font-bold text-foreground transition-all active:scale-95"
        >
          Cancel
        </button>
        <button
          onClick={() => reason && onSubmit(reason, note)}
          disabled={!reason || loading}
          className="flex-1 rounded-full bg-destructive py-2.5 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </div>
  );
}
