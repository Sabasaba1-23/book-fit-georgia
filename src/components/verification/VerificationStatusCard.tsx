import { Shield, ShieldCheck, Clock, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  verificationStatus: string;
  partnerType: "individual" | "gym";
  verificationStep?: number;
  repStatus?: string;
  bizStatus?: string;
  onGetVerified: () => void;
}

const STATUS_CONFIG = {
  unverified: {
    icon: Shield,
    iconColor: "text-muted-foreground",
    bg: "bg-muted/60",
    border: "border-border/50",
    label: "Not Verified",
    description: "Build trust with your clients by verifying your identity",
    cta: "Get Verified",
  },
  pending: {
    icon: Clock,
    iconColor: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200/50",
    label: "Under Review",
    description: "Our team is reviewing your verification — usually takes 24-48h",
    cta: "View Details",
  },
  verified: {
    icon: ShieldCheck,
    iconColor: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200/50",
    label: "Verified",
    description: "Your identity has been verified — you're all set!",
    cta: "View Details",
  },
  rejected: {
    icon: XCircle,
    iconColor: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200/50",
    label: "Needs Update",
    description: "Please review the feedback and resubmit your verification",
    cta: "Update & Resubmit",
  },
} as const;

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors = {
    pending: "bg-amber-100 text-amber-700",
    verified: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    unverified: "bg-muted text-muted-foreground",
  }[status] || "bg-muted text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", colors)}>
      {label}
    </span>
  );
}

export default function VerificationStatusCard({
  verificationStatus,
  partnerType,
  verificationStep = 1,
  repStatus,
  bizStatus,
  onGetVerified,
}: Props) {
  const config = STATUS_CONFIG[verificationStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.unverified;
  const Icon = config.icon;

  const totalSteps = partnerType === "gym" ? 2 : 3;
  const stepsRemaining = verificationStatus === "unverified"
    ? totalSteps - (verificationStep - 1)
    : 0;

  return (
    <button
      onClick={onGetVerified}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.98]",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", config.bg)}>
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">Identity Verification</p>
            <StatusBadge status={verificationStatus} label={config.label} />
          </div>

          {partnerType === "gym" && (repStatus || bizStatus) && verificationStatus !== "unverified" && (
            <div className="mt-1.5 flex gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Rep:</span>
                <StatusBadge status={repStatus || "pending"} label={repStatus === "verified" ? "✓" : repStatus || "pending"} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Business:</span>
                <StatusBadge status={bizStatus || "pending"} label={bizStatus === "verified" ? "✓" : bizStatus || "pending"} />
              </div>
            </div>
          )}

          <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
            {stepsRemaining > 0
              ? `Complete ${stepsRemaining} step${stepsRemaining > 1 ? "s" : ""} to get verified`
              : config.description}
          </p>
        </div>
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </button>
  );
}
