import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Users,
  Upload,
  Camera,
  CalendarDays,
  Send,
  Info,
  X,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CreateListingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  onCreated: () => void;
}

const SPORTS = [
  "Yoga",
  "HIIT",
  "Pilates",
  "Tennis",
  "Boxing",
  "Swimming",
  "CrossFit",
  "MMA",
  "Weightlifting",
  "Personal Trainer",
];

export default function CreateListingSheet({
  open,
  onOpenChange,
  partnerId,
  onCreated,
}: CreateListingSheetProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [trainingType, setTrainingType] = useState<"one_on_one" | "group">(
    "one_on_one"
  );

  // Step 2 fields
  const [description, setDescription] = useState("");
  const [priceGel, setPriceGel] = useState("");
  const [maxSpots, setMaxSpots] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setSport("");
    setTrainingType("one_on_one");
    setDescription("");
    setPriceGel("");
    setMaxSpots("");
    setScheduledAt("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const canContinue = title.trim() && sport;

  const handleSubmit = async () => {
    if (!scheduledAt || !priceGel || parseFloat(priceGel) <= 0) {
      toast({
        title: "Please fill in price and date/time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let backgroundImageUrl: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${partnerId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, imageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(path);
        backgroundImageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("training_listings").insert({
      partner_id: partnerId,
      title_en: title.trim(),
      description_en: description.trim() || null,
      sport,
      training_type: trainingType,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: 60,
      price_gel: parseFloat(priceGel),
      max_spots: parseInt(maxSpots) || 1,
      background_image_url: backgroundImageUrl,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Failed to create listing",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Listing submitted for review! 🎉",
        description: "Our admin team will review it shortly.",
      });
      onCreated();
      handleClose();
    }
    setLoading(false);
  };

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="h-[95vh] rounded-t-[2rem] p-0 overflow-hidden border-0"
      >
        <div className="flex h-full flex-col bg-background">
          {/* Header */}
          <header className="flex items-center justify-between px-5 pt-5 pb-2">
            {step === 2 ? (
              <button
                onClick={() => setStep(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            <h2 className="text-lg font-bold text-foreground">
              {step === 1 ? "New Training" : "Training Details"}
            </h2>
            <button
              onClick={handleClose}
              className="text-sm font-bold text-primary"
            >
              Cancel
            </button>
          </header>

          {/* Step indicator */}
          <div className="px-5 pt-2 pb-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
              </p>
              <p className="text-xs font-bold text-foreground">
                {step === 1 ? "Basics" : "Details & Pricing"}
              </p>
            </div>
            <Progress
              value={step === 1 ? 50 : 100}
              className="h-1.5 bg-muted"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-32 pt-5">
            {step === 1 ? (
              <StepBasics
                title={title}
                setTitle={setTitle}
                sport={sport}
                setSport={setSport}
                trainingType={trainingType}
                setTrainingType={setTrainingType}
              />
            ) : (
              <StepDetails
                imagePreview={imagePreview}
                onImageChange={handleImageChange}
                description={description}
                setDescription={setDescription}
                priceGel={priceGel}
                setPriceGel={setPriceGel}
                maxSpots={maxSpots}
                setMaxSpots={setMaxSpots}
                scheduledAt={scheduledAt}
                setScheduledAt={setScheduledAt}
                scheduledDate={scheduledDate}
              />
            )}
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl px-5 pb-8 pt-4 border-t border-border/40">
            {step === 1 ? (
              <Button
                disabled={!canContinue}
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 h-14 text-base font-bold text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary py-4 h-14 text-base font-bold text-primary-foreground shadow-lg"
                >
                  {loading ? "Submitting..." : "Submit for Review"}
                  <Send className="h-4 w-4" />
                </Button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  By submitting, you agree to our{" "}
                  <span className="underline">Partner Terms of Service</span>
                </p>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Step 1: Basics ─────────────────────────────── */

function StepBasics({
  title,
  setTitle,
  sport,
  setSport,
  trainingType,
  setTrainingType,
}: {
  title: string;
  setTitle: (v: string) => void;
  sport: string;
  setSport: (v: string) => void;
  trainingType: "one_on_one" | "group";
  setTrainingType: (v: "one_on_one" | "group") => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Basic Info</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Let's start with the basics of your training session. You can edit
          this later.
        </p>
      </div>

      {/* Training Name */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">
          Training Name
        </label>
        <Input
          placeholder="e.g., Morning Yoga Flow"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Activity */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">
          Activity
        </label>
        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none">
            <SelectValue placeholder="Select Sport" />
          </SelectTrigger>
          <SelectContent>
            {SPORTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Session Type */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">
          Session Type
        </label>
        <div className="flex rounded-2xl border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setTrainingType("one_on_one")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
              trainingType === "one_on_one"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <User className="h-4 w-4" />
            Individual
          </button>
          <button
            type="button"
            onClick={() => setTrainingType("group")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
              trainingType === "group"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            Group
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Details & Pricing ──────────────────── */

function StepDetails({
  imagePreview,
  onImageChange,
  description,
  setDescription,
  priceGel,
  setPriceGel,
  maxSpots,
  setMaxSpots,
  scheduledAt,
  setScheduledAt,
  scheduledDate,
}: {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description: string;
  setDescription: (v: string) => void;
  priceGel: string;
  setPriceGel: (v: string) => void;
  maxSpots: string;
  setMaxSpots: (v: string) => void;
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
  scheduledDate: Date | null;
}) {
  return (
    <div className="space-y-7">
      {/* Cover Image */}
      <div>
        <label className="mb-1 block text-base font-bold text-foreground">
          Cover Image
        </label>
        <p className="mb-3 text-[13px] text-muted-foreground">
          This image will appear on the listing card.
        </p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-10 transition-colors hover:border-primary/30">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview"
              className="h-28 w-full rounded-xl object-cover px-4"
            />
          ) : (
            <>
              <Camera className="h-8 w-8 text-primary/60" />
              <span className="text-sm font-medium text-muted-foreground">
                Upload photo
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onImageChange}
          />
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">
          Description
        </label>
        <Textarea
          placeholder="Describe what participants should expect from this training session..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="rounded-2xl border-0 bg-muted/60 px-4 py-3 text-[15px] font-medium shadow-none resize-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Price & Spots */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-base font-bold text-foreground">
            Price (GEL)
          </label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={priceGel}
            onChange={(e) => setPriceGel(e.target.value)}
            placeholder="0.00"
            className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-base font-bold text-foreground">
            Available Spots
          </label>
          <Input
            type="number"
            min={1}
            max={100}
            value={maxSpots}
            onChange={(e) => setMaxSpots(e.target.value)}
            placeholder="e.g. 10"
            className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
          />
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-base font-bold text-foreground">
            Date & Time
          </label>
        </div>

        <div className="relative">
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
          />
        </div>

        {scheduledDate && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3.5">
            <CalendarDays className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                {format(scheduledDate, "EEEE, MMMM d")}
              </p>
              <p className="text-xs text-primary font-medium">
                {format(scheduledDate, "hh:mm a")}
              </p>
            </div>
            <button
              onClick={() => setScheduledAt("")}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Info notice */}
      <div className="flex gap-3 rounded-2xl bg-primary/5 p-4">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-[13px] leading-relaxed text-foreground/70">
          Listings are reviewed within 24 hours. Ensure your description is
          clear and follows our community guidelines.
        </p>
      </div>
    </div>
  );
}
