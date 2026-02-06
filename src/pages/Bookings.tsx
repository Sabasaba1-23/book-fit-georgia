import { useLanguage } from "@/i18n/LanguageContext";
import BottomNav from "@/components/BottomNav";

export default function Bookings() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">{t("bookings")}</h1>
      </header>
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No bookings yet</p>
      </div>
      <BottomNav />
    </div>
  );
}
