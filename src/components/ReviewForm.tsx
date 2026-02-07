import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Star, Send } from "lucide-react";

const REVIEW_TAGS = [
  "Great coaching", "On time", "Motivating", "Professional",
  "Good communication", "Well structured", "Challenging", "Fun atmosphere",
];

interface ReviewFormProps {
  bookingId: string;
  role: "user" | "partner";
  existingReview?: { rating: number; review_text: string | null; tags: string[] | null } | null;
  onSubmitted: () => void;
}

export default function ReviewForm({ bookingId, role, existingReview, onSubmitted }: ReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState(existingReview?.review_text || "");
  const [tags, setTags] = useState<string[]>(existingReview?.tags || []);
  const [submitting, setSubmitting] = useState(false);

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
          <span className="ml-1.5 text-xs font-semibold text-foreground">Your review</span>
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
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewer_role: role,
        rating,
        review_text: text || null,
        tags: tags.length > 0 ? tags : null,
      });
      if (error) throw error;
      toast({ title: "Review submitted! ⭐" });
      onSubmitted();
    } catch (err: any) {
      toast({ title: "Failed to submit review", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <div className="rounded-2xl bg-muted/40 border border-border/40 p-4 space-y-3">
      <p className="text-xs font-bold text-foreground">Rate this session</p>

      {/* Stars */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            onMouseEnter={() => setHoverRating(i + 1)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(i + 1)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`h-7 w-7 ${
                i < (hoverRating || rating)
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-bold text-foreground">{rating}/5</span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {REVIEW_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all active:scale-95 ${
              tags.includes(tag)
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border/40 text-foreground hover:bg-muted/50"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Text */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a review (optional)"
        className="w-full rounded-xl bg-card border border-border/40 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        rows={2}
      />

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" />
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}
