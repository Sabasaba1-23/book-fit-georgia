import { cn } from "@/lib/utils";
import { BadgeIcon } from "./BadgeIcon";

const TIER_PILL_COLORS: Record<string, string> = {
  trust: "bg-primary/5 border-primary/15 text-primary",
  experience: "bg-amber-50 border-amber-200/50 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800/50 dark:text-amber-400",
  performance: "bg-emerald-50 border-emerald-200/50 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800/50 dark:text-emerald-400",
  loyalty: "bg-violet-50 border-violet-200/50 text-violet-700 dark:bg-violet-950/20 dark:border-violet-800/50 dark:text-violet-400",
};

interface BadgePillProps {
  title: string;
  icon: string;
  tier: string;
  className?: string;
}

export function BadgePill({ title, icon, tier, className }: BadgePillProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
      TIER_PILL_COLORS[tier] || TIER_PILL_COLORS.trust,
      className,
    )}>
      <BadgeIcon icon={icon} tier={tier} size="sm" />
      {title}
    </span>
  );
}
