import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations, Language, TranslationKey } from "./translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectDeviceLanguage(): Language {
  const saved = localStorage.getItem("fitbook-lang") as Language | null;
  if (saved && saved in translations) return saved;

  // Check navigator languages (works on iOS, Android WebView, and browsers)
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const locale of languages) {
    const code = locale.toLowerCase().split("-")[0];
    if (code === "ka") return "ka";
    if (code === "ru") return "ru";
    if (code === "en") return "en";
  }

  return "en"; // default fallback
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectDeviceLanguage);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("fitbook-lang", newLang);
    document.documentElement.setAttribute("data-lang", newLang);
  }, []);

  // Set data-lang on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-lang", lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key] || key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
