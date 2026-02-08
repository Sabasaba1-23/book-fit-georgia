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
    <div className="hide-scrollbar relative z-30 flex gap-2.5 overflow-x-auto px-5 pb-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 active:scale-95",
            active === option
              ? "bg-foreground text-background shadow-lg"
              : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          {translateSport(option, lang).toUpperCase()}
        </button>
      ))}
    </div>
  );
});
