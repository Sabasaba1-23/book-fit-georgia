import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Star, Send, X, Camera } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const REVIEW_TAG_KEYS = [
  "tagGreatMusic", "tagExpertCoach", "tagCleanGym", "tagPunctual",
  "tagMotivating", "tagHighEnergy", "tagWellStructured", "tagFunAtmosphere",
] as const;

// Map translated display back to English for DB storage
const TAG_DB_VALUES: Record<string, string> = {
  tagGreatMusic: "Great Music",
  tagExpertCoach: "Expert Coach",
  tagCleanGym: "Clean Gym",
  tagPunctual: "Punctual",
  tagMotivating: "Motivating",
  tagHighEnergy: "High Energy",
  tagWellStructured: "Well Structured",
  tagFunAtmosphere: "Fun Atmosphere",
};

interface ReviewFormProps {
  bookingId: string;
  role: "user" | "partner";
  partnerName?: string;
  sessionTitle?: string;
  existingReview?: { rating: number; review_text: string | null; tags: string[] | null; photos?: string[] | null } | null;
  onSubmitted: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ReviewForm({
  bookingId,
  role,
  partnerName,
  sessionTitle,
  existingReview,
  onSubmitted,
  open,
  onOpenChange,
}: ReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState(existingReview?.review_text || "");
  const [tags, setTags] = useState<string[]>(existingReview?.tags || []);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  if (existingReview) {
    return (
      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4">
        <div className="flex items-center gap-1 mb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < existingReview.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
            />
          ))}
          <span className="ml-1.5 text-xs font-semibold text-foreground">{t("yourReviewLabel")}</span>
        </div>
        {existingReview.review_text && (
          <p className="text-xs text-foreground/70 italic mt-1">"{existingReview.review_text}"</p>
        )}
        {existingReview.tags && existingReview.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {existingReview.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {tag}
              </span>
            ))}
          </div>
        )}
        {existingReview.photos && existingReview.photos.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {existingReview.photos.map((url, i) => (
              <img key={i} src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border/30" />
            ))}
          </div>
        )}
      </div>
    );
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 4) {
      toast({ title: t("maxPhotosAllowed"), variant: "destructive" });
      return;
    }
    const newPhotos = [...photos, ...files].slice(0, 4);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const photo of photos) {
      const ext = photo.name.split(".").pop();
      const path = `${user.id}/${bookingId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("review-photos").upload(path, photo);
      if (error) throw error;
      const { data } = supabase.storage.from("review-photos").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: t("pleaseSelectRating"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos();
      }

      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewer_role: role,
        rating,
        review_text: text || null,
        tags: tags.length > 0 ? tags : null,
        photos: photoUrls.length > 0 ? photoUrls : null,
      });
      if (error) throw error;
      toast({ title: t("reviewSubmittedToast") });
      onOpenChange?.(false);
      onSubmitted();
    } catch (err: any) {
      toast({ title: t("failedToSubmitReview"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (dbValue: string) => {
    setTags((prev) => (prev.includes(dbValue) ? prev.filter((t) => t !== dbValue) : [...prev, dbValue]));
  };

  const activeRating = hoverRating || rating;

  const formContent = (
    <div className="space-y-5">
      {partnerName && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Star className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{t("howWasSessionWith")} {partnerName}?</p>
            {sessionTitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{sessionTitle}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider">{t("yourRatingLabel")}</p>
        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(i + 1)}
              className="transition-transform hover:scale-125 active:scale-95 p-0.5"
            >
              <Star
                className={`h-9 w-9 transition-colors ${
                  i < activeRating ? "fill-primary text-primary" : "text-muted-foreground/25"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && <p className="text-center text-sm font-bold text-primary">{rating}/5</p>}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider">{t("whatStoodOutLabel")}</p>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAG_KEYS.map((key) => {
            const dbVal = TAG_DB_VALUES[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleTag(dbVal)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                  tags.includes(dbVal)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted border border-border/50 text-foreground hover:bg-muted/80"
                }`}
              >
                {t(key as any)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider">{t("shareExperienceLabel")}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("tellOthers")}
          className="w-full rounded-xl bg-muted/50 border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider">{t("addPhotosLabel")}</p>
        <div className="flex gap-2 flex-wrap">
          {photoPreviews.map((src, i) => (
            <div key={i} className="relative group">
              <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover border border-border/50" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < 4 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Camera className="h-5 w-5" />
              <span className="text-[9px] font-semibold uppercase">{t("uploadLabel")}</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? t("submittingReview") : t("submitReviewBtn")}
      </button>
    </div>
  );

  if (typeof open === "boolean" && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-bold text-foreground text-center">{t("writeReviewTitle")}</h2>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="rounded-2xl bg-muted/40 border border-border/40 p-5 space-y-1">
      <h3 className="text-sm font-bold text-foreground mb-3">{t("writeReviewTitle")}</h3>
      {formContent}
    </div>
  );
}
