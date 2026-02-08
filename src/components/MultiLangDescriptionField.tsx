import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Languages, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LangField {
  key: string;
  label: string;
  flag: string;
}

const LANG_OPTIONS: LangField[] = [
  { key: "ka", label: "ქართული (Georgian)", flag: "🇬🇪" },
  { key: "ru", label: "Русский (Russian)", flag: "🇷🇺" },
];

interface MultiLangDescriptionFieldProps {
  label: string;
  placeholder: string;
  mainValue: string;
  onMainChange: (v: string) => void;
  kaValue: string;
  onKaChange: (v: string) => void;
  ruValue: string;
  onRuChange: (v: string) => void;
  rows?: number;
}

export default function MultiLangDescriptionField({
  label,
  placeholder,
  mainValue,
  onMainChange,
  kaValue,
  onKaChange,
  ruValue,
  onRuChange,
  rows = 3,
}: MultiLangDescriptionFieldProps) {
  const [openLangs, setOpenLangs] = useState<string[]>([]);

  const toggleLang = (key: string) => {
    setOpenLangs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const closedLangs = LANG_OPTIONS.filter((l) => !openLangs.includes(l.key));

  return (
    <div className="space-y-3">
      {/* Main (English) field */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-base font-bold text-foreground">
          {label}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">🇬🇧 EN</span>
        </label>
        <Textarea
          placeholder={placeholder}
          value={mainValue}
          onChange={(e) => onMainChange(e.target.value)}
          rows={rows}
          className="rounded-2xl border-0 bg-muted/60 px-4 py-3 text-[15px] font-medium shadow-none resize-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Add language button */}
      {closedLangs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {closedLangs.map((lang) => (
            <button
              key={lang.key}
              type="button"
              onClick={() => toggleLang(lang.key)}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10 active:scale-95"
            >
              <Plus className="h-3 w-3" />
              {lang.flag} {lang.label}
            </button>
          ))}
        </div>
      )}

      {/* Georgian field */}
      {openLangs.includes("ka") && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">🇬🇪 KA</span>
              {label}
            </label>
            <button
              type="button"
              onClick={() => toggleLang("ka")}
              className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
            >
              Remove
            </button>
          </div>
          <Textarea
            placeholder={`${placeholder} (ქართულად)`}
            value={kaValue}
            onChange={(e) => onKaChange(e.target.value)}
            rows={rows}
            className="rounded-2xl border-0 bg-muted/60 px-4 py-3 text-[15px] font-medium shadow-none resize-none placeholder:text-muted-foreground/60"
          />
        </div>
      )}

      {/* Russian field */}
      {openLangs.includes("ru") && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">🇷🇺 RU</span>
              {label}
            </label>
            <button
              type="button"
              onClick={() => toggleLang("ru")}
              className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
            >
              Remove
            </button>
          </div>
          <Textarea
            placeholder={`${placeholder} (на русском)`}
            value={ruValue}
            onChange={(e) => onRuChange(e.target.value)}
            rows={rows}
            className="rounded-2xl border-0 bg-muted/60 px-4 py-3 text-[15px] font-medium shadow-none resize-none placeholder:text-muted-foreground/60"
          />
        </div>
      )}
    </div>
  );
}
