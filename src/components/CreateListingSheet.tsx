import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, User, Users, CalendarDays, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateListingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  onCreated: () => void;
}

const SPORTS = ["Yoga", "HIIT", "Boxing", "Tennis", "Pilates", "Swimming", "CrossFit", "MMA", "Weightlifting"];

export default function CreateListingSheet({ open, onOpenChange, partnerId, onCreated }: CreateListingSheetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title_en: "",
    description_en: "",
    sport: "Yoga",
    training_type: "one_on_one" as "one_on_one" | "group" | "event",
    scheduled_at: "",
    duration_minutes: 60,
    price_gel: 0,
    max_spots: 1,
    equipment_notes_en: "",
    location: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_en.trim() || !form.scheduled_at || form.price_gel <= 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);

    let backgroundImageUrl: string | null = null;

    // Upload image if selected
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${partnerId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, imageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
        backgroundImageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("training_listings").insert({
      partner_id: partnerId,
      title_en: form.title_en.trim(),
      description_en: form.description_en.trim() || null,
      sport: form.sport,
      training_type: form.training_type,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes,
      price_gel: form.price_gel,
      max_spots: form.max_spots,
      equipment_notes_en: form.equipment_notes_en.trim() || null,
      background_image_url: backgroundImageUrl,
      location: form.location.trim() || null,
      status: "pending",
    });

    if (error) {
      toast({ title: "Failed to create listing", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing submitted for review! 🎉", description: "Our admin team will review it shortly." });
      onCreated();
      onOpenChange(false);
      // Reset form
      setForm({
        title_en: "", description_en: "", sport: "Yoga", training_type: "one_on_one",
        scheduled_at: "", duration_minutes: 60, price_gel: 0, max_spots: 1,
        equipment_notes_en: "", location: "",
      });
      setImageFile(null);
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-[2rem] p-0 overflow-hidden border-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="px-6 pt-5 pb-3 border-b border-border/40">
            <SheetTitle className="text-xl font-extrabold text-foreground">Create New Listing</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-32 space-y-5 pt-4">
            {/* Title */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Training Title *</label>
              <Input
                placeholder="e.g. Morning Yoga Flow"
                value={form.title_en}
                onChange={(e) => updateField("title_en", e.target.value)}
                required
                className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
              />
            </div>

            {/* Sport */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Sport / Activity *</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateField("sport", s)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95",
                      form.sport === s
                        ? "bg-foreground text-background shadow-lg"
                        : "border border-border bg-card text-muted-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Training Type */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Training Type *</label>
              <div className="flex gap-2">
                {[
                  { key: "one_on_one" as const, label: "Individual", icon: <User className="h-4 w-4" /> },
                  { key: "group" as const, label: "Group", icon: <Users className="h-4 w-4" /> },
                  { key: "event" as const, label: "Event", icon: <CalendarDays className="h-4 w-4" /> },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => updateField("training_type", t.key)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 transition-all active:scale-95",
                      form.training_type === t.key
                        ? "bg-foreground text-background shadow-lg"
                        : "border border-border bg-card text-muted-foreground"
                    )}
                  >
                    {t.icon}
                    <span className="text-xs font-semibold">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Date & Time *</label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => updateField("scheduled_at", e.target.value)}
                  required
                  className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-sm font-medium shadow-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Duration (min)</label>
                <Input
                  type="number"
                  min={15}
                  max={240}
                  value={form.duration_minutes}
                  onChange={(e) => updateField("duration_minutes", parseInt(e.target.value) || 60)}
                  className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-sm font-medium shadow-none"
                />
              </div>
            </div>

            {/* Price & Spots */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Price (₾) *</label>
                <Input
                  type="number"
                  min={1}
                  step={0.5}
                  value={form.price_gel || ""}
                  onChange={(e) => updateField("price_gel", parseFloat(e.target.value) || 0)}
                  required
                  placeholder="25"
                  className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-sm font-medium shadow-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Max Spots</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.max_spots}
                  onChange={(e) => updateField("max_spots", parseInt(e.target.value) || 1)}
                  className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-sm font-medium shadow-none"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Location</label>
              <Input
                placeholder="e.g. Tbilisi, Vake"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Description</label>
              <Textarea
                placeholder="Describe the training session..."
                value={form.description_en}
                onChange={(e) => updateField("description_en", e.target.value)}
                rows={4}
                className="rounded-2xl border-0 bg-muted/60 px-4 py-3 text-[15px] font-medium shadow-none resize-none"
              />
            </div>

            {/* Equipment */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Equipment Notes</label>
              <Input
                placeholder="Yoga Mat, Water, Towel"
                value={form.equipment_notes_en}
                onChange={(e) => updateField("equipment_notes_en", e.target.value)}
                className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Cover Image</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 py-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30">
                <Upload className="h-5 w-5" />
                {imageFile ? imageFile.name : "Tap to upload an image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </form>

          {/* Submit button */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl px-6 pb-8 pt-4 border-t border-border/50">
            <Button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 h-14 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              {loading ? "Submitting..." : "Submit for Review"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
