import { memo } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateSport } from "@/i18n/sportTranslations";

interface FilterChipsProps {
  options: string[];
  active: string;
  onChange: (value: string) => void;
}

export default memo(function FilterChips({ options, active, onChange }: FilterChipsProps) {
  const { lang } = useLanguage();
  return (
    <div className="hide-scrollbar relative z-30 flex gap-2 overflow-x-auto px-5 md:px-6 pb-2">
      {options.map((option) => {
        const isActive = active === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2.5 text-[14px] font-semibold tracking-[-0.01em] transition-all duration-200 active:scale-95",
              isActive
                ? "bg-foreground text-background shadow-[0_8px_20px_-8px_hsl(0_0%_0%/0.35)]"
                : "bg-card text-foreground/75 hover:text-foreground border border-border/60",
            )}
          >
            {translateSport(option, lang)}
          </button>
        );
      })}
    </div>
  );
});
