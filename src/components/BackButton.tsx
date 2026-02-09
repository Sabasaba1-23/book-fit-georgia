import { useNavigate } from "react-router-dom";
import { Left } from "@icon-park/react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  /** Override default navigate(-1) behavior */
  onClick?: () => void;
  /** Use white icon (for dark overlays / hero images) */
  variant?: "default" | "overlay";
  className?: string;
}

export default function BackButton({ onClick, variant = "default", className }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    // Use history if available, otherwise go home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <button
      onClick={handleBack}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90",
        variant === "overlay"
          ? "bg-black/20 backdrop-blur-sm hover:bg-black/40"
          : "bg-muted/50 hover:bg-muted",
        className
      )}
      aria-label="Go back"
    >
      <Left
        size={20}
        fill={variant === "overlay" ? "#fff" : "currentColor"}
        strokeWidth={3}
      />
    </button>
  );
}
