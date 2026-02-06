import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">{t("profile")}</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <div>
          <p className="text-sm text-muted-foreground">{t("email")}</p>
          <p className="font-medium text-foreground">{user?.email}</p>
        </div>

        <div>
          <p className="mb-2 text-sm text-muted-foreground">{t("languageLabel")}</p>
          <div className="flex gap-2">
            <Button
              variant={lang === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLang("en")}
            >
              English
            </Button>
            <Button
              variant={lang === "ka" ? "default" : "outline"}
              size="sm"
              onClick={() => setLang("ka")}
            >
              ქართული
            </Button>
          </div>
        </div>

        <Button variant="outline" onClick={signOut} className="w-full">
          {t("logOut")}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
