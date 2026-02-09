import {
  ShieldCheck, Award, Building2, Clock, Trophy, Star,
  CheckCircle2, Heart, Repeat, Flame, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  "shield-check": ShieldCheck,
  "award": Award,
  "building": Building2,
  "clock": Clock,
  "trophy": Trophy,
  "star": Star,
  "check-circle": CheckCircle2,
  "heart": Heart,
  "repeat": Repeat,
  "flame": Flame,
  "zap": Zap,
};

const TIER_COLORS: Record<string, string> = {
  trust: "text-primary bg-primary/10 border-primary/20",
  experience: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800",
  performance: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800",
  loyalty: "text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950/30 dark:border-violet-800",
};

interface BadgeIconProps {
  icon: string;
  tier: string;
  size?: "sm" | "md";
  className?: string;
}

export function BadgeIcon({ icon, tier, size = "sm", className }: BadgeIconProps) {
  const Icon = ICON_MAP[icon] || Award;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full border",
      size === "sm" ? "h-5 w-5" : "h-7 w-7",
      TIER_COLORS[tier] || TIER_COLORS.trust,
      className,
    )}>
      <Icon className={iconSize} />
    </div>
  );
}
