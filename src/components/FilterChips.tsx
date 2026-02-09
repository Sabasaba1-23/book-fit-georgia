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
    <div className="hide-scrollbar relative z-30 flex gap-2 overflow-x-auto px-4 md:px-6 pb-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1 text-[12px] font-medium transition-all duration-150 active:scale-95",
            active === option
              ? "bg-primary/90 text-primary-foreground"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {translateSport(option, lang)}
        </button>
      ))}
    </div>
  );
});
