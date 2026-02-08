import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MultiLangDescriptionField from "@/components/MultiLangDescriptionField";
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
  Camera,
  Send,
  MapPin,
  Backpack,
  ShoppingBag,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPORTS, DIFFICULTY_LEVELS } from "@/constants/sports";

interface CreateListingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  onCreated: () => void;
}

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
  const [trainingType, setTrainingType] = useState<"one_on_one" | "group">("one_on_one");
  const [location, setLocation] = useState("");

  // Step 2 fields
  const [description, setDescription] = useState("");
  const [descriptionKa, setDescriptionKa] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [priceGel, setPriceGel] = useState("");
  const [maxSpots, setMaxSpots] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Step 3 fields (optional extras)
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [equipmentNotes, setEquipmentNotes] = useState("");
  const [equipmentNotesKa, setEquipmentNotesKa] = useState("");
  const [equipmentNotesRu, setEquipmentNotesRu] = useState("");
  const [rentalInfo, setRentalInfo] = useState("");
  const [rentalInfoKa, setRentalInfoKa] = useState("");
  const [rentalInfoRu, setRentalInfoRu] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");

  const totalSteps = 3;

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setSport("");
    setTrainingType("one_on_one");
    setLocation("");
    setDescription("");
    setDescriptionKa("");
    setDescriptionRu("");
    setPriceGel("");
    setMaxSpots("");
    setScheduledAt("");
    setImageFile(null);
    setImagePreview(null);
    setDifficultyLevel("");
    setEquipmentNotes("");
    setEquipmentNotesKa("");
    setEquipmentNotesRu("");
    setRentalInfo("");
    setRentalInfoKa("");
    setRentalInfoRu("");
    setDurationMinutes("60");
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

  const canContinueStep1 = title.trim() && sport && location.trim();
  const canContinueStep2 = scheduledAt && priceGel && parseFloat(priceGel) > 0;

  const handleSubmit = async () => {
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
      description_ka: descriptionKa.trim() || null,
      sport,
      training_type: trainingType,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: parseInt(durationMinutes) || 60,
      price_gel: parseFloat(priceGel),
      max_spots: parseInt(maxSpots) || 1,
      background_image_url: backgroundImageUrl,
      location: location.trim(),
      difficulty_level: difficultyLevel || null,
      equipment_notes_en: equipmentNotes.trim() || null,
      equipment_notes_ka: equipmentNotesKa.trim() || null,
      rental_info_en: rentalInfo.trim() || null,
      rental_info_ka: rentalInfoKa.trim() || null,
      status: "pending",
    });

    if (error) {
      const msg = error.message.includes("violates")
        ? "Something went wrong. Please check your inputs and try again."
        : error.message;
      toast({ title: "Failed to create listing", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Listing submitted for review! 🎉", description: "Our admin team will review it shortly." });
      onCreated();
      handleClose();
    }
    setLoading(false);
  };

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;

  const stepLabels = ["Basics", "Details & Pricing", "Additional Info"];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-[2rem] p-0 overflow-hidden border-0 [&>button[class*='absolute']]:hidden">
        <div className="flex h-full flex-col bg-background">
          {/* Header */}
          <header className="flex items-center justify-between px-5 pt-5 pb-2">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : handleClose())}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h2 className="text-lg font-bold text-foreground">
              {step === 1 ? "New Training" : step === 2 ? "Training Details" : "Extra Info"}
            </h2>
            <button onClick={handleClose} className="text-sm font-bold text-primary">
              Cancel
            </button>
          </header>

          {/* Step indicator */}
          <div className="px-5 pt-2 pb-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Step {step} of {totalSteps}
              </p>
              <p className="text-xs font-bold text-foreground">{stepLabels[step - 1]}</p>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-1.5 bg-muted" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-32 pt-5">
            {step === 1 && (
              <StepBasics
                title={title} setTitle={setTitle}
                sport={sport} setSport={setSport}
                trainingType={trainingType} setTrainingType={setTrainingType}
                location={location} setLocation={setLocation}
              />
            )}
            {step === 2 && (
              <StepDetails
                imagePreview={imagePreview} onImageChange={handleImageChange}
                description={description} setDescription={setDescription}
                descriptionKa={descriptionKa} setDescriptionKa={setDescriptionKa}
                descriptionRu={descriptionRu} setDescriptionRu={setDescriptionRu}
                priceGel={priceGel} setPriceGel={setPriceGel}
                maxSpots={maxSpots} setMaxSpots={setMaxSpots}
                scheduledAt={scheduledAt} setScheduledAt={setScheduledAt}
                scheduledDate={scheduledDate}
                durationMinutes={durationMinutes} setDurationMinutes={setDurationMinutes}
              />
            )}
            {step === 3 && (
              <StepExtras
                difficultyLevel={difficultyLevel} setDifficultyLevel={setDifficultyLevel}
                equipmentNotes={equipmentNotes} setEquipmentNotes={setEquipmentNotes}
                equipmentNotesKa={equipmentNotesKa} setEquipmentNotesKa={setEquipmentNotesKa}
                equipmentNotesRu={equipmentNotesRu} setEquipmentNotesRu={setEquipmentNotesRu}
                rentalInfo={rentalInfo} setRentalInfo={setRentalInfo}
                rentalInfoKa={rentalInfoKa} setRentalInfoKa={setRentalInfoKa}
                rentalInfoRu={rentalInfoRu} setRentalInfoRu={setRentalInfoRu}
              />
            )}
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl px-5 pb-8 pt-4 border-t border-border/40">
            {step < totalSteps ? (
              <Button
                disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
                onClick={() => {
                  if (step === 2 && scheduledAt && new Date(scheduledAt) <= new Date()) {
                    toast({ title: "Date must be in the future", variant: "destructive" });
                    return;
                  }
                  setStep(step + 1);
                }}
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
                  By submitting, you agree to our <span className="underline">Partner Terms of Service</span>
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
  title, setTitle,
  sport, setSport,
  trainingType, setTrainingType,
  location, setLocation,
}: {
  title: string; setTitle: (v: string) => void;
  sport: string; setSport: (v: string) => void;
  trainingType: "one_on_one" | "group"; setTrainingType: (v: "one_on_one" | "group") => void;
  location: string; setLocation: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Basic Info</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Let's start with the basics of your training session.
        </p>
      </div>

      {/* Training Name */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">Training Name</label>
        <Input
          placeholder="e.g., Morning Yoga Flow"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Activity */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">Activity</label>
        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none">
            <SelectValue placeholder="Select Sport / Activity" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {SPORTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location (required) */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-base font-bold text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Address / Location
          <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="e.g., Vake Park, Tbilisi or Gym Name, Street"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none placeholder:text-muted-foreground/60"
        />
        <p className="mt-1.5 text-[12px] text-muted-foreground">Full address or well-known location name</p>
      </div>

      {/* Session Type */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">Session Type</label>
        <div className="flex rounded-2xl border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setTrainingType("one_on_one")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
              trainingType === "one_on_one" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <User className="h-4 w-4" /> Individual
          </button>
          <button
            type="button"
            onClick={() => setTrainingType("group")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
              trainingType === "group" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Users className="h-4 w-4" /> Group
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Details & Pricing ──────────────────── */

function StepDetails({
  imagePreview, onImageChange,
  description, setDescription,
  descriptionKa, setDescriptionKa,
  descriptionRu, setDescriptionRu,
  priceGel, setPriceGel,
  maxSpots, setMaxSpots,
  scheduledAt, setScheduledAt,
  scheduledDate,
  durationMinutes, setDurationMinutes,
}: {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description: string; setDescription: (v: string) => void;
  descriptionKa: string; setDescriptionKa: (v: string) => void;
  descriptionRu: string; setDescriptionRu: (v: string) => void;
  priceGel: string; setPriceGel: (v: string) => void;
  maxSpots: string; setMaxSpots: (v: string) => void;
  scheduledAt: string; setScheduledAt: (v: string) => void;
  scheduledDate: Date | null;
  durationMinutes: string; setDurationMinutes: (v: string) => void;
}) {
  return (
    <div className="space-y-7">
      {/* Cover Image */}
      <div>
        <label className="mb-1 block text-base font-bold text-foreground">Cover Image</label>
        <p className="mb-3 text-[13px] text-muted-foreground">This image will appear on the listing card.</p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-10 transition-colors hover:border-primary/30">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="h-28 w-full rounded-xl object-cover px-4" />
          ) : (
            <>
              <Camera className="h-8 w-8 text-primary/60" />
              <span className="text-sm font-medium text-muted-foreground">Upload photo</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
        </label>
      </div>

      {/* Description with multi-language */}
      <MultiLangDescriptionField
        label="Description"
        placeholder="Describe what participants should expect..."
        mainValue={description}
        onMainChange={setDescription}
        kaValue={descriptionKa}
        onKaChange={setDescriptionKa}
        ruValue={descriptionRu}
        onRuChange={setDescriptionRu}
        rows={4}
      />

      {/* Price, Spots, Duration */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-2 block text-sm font-bold text-foreground">Price (₾)</label>
          <Input
            type="number" min={0} step={0.5}
            value={priceGel} onChange={(e) => setPriceGel(e.target.value)}
            placeholder="0"
            className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-foreground">Spots</label>
          <Input
            type="number" min={1} max={100}
            value={maxSpots} onChange={(e) => setMaxSpots(e.target.value)}
            placeholder="10"
            className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-foreground">Duration</label>
          <Select value={durationMinutes} onValueChange={setDurationMinutes}>
            <SelectTrigger className="h-14 rounded-2xl border-0 bg-muted/60 px-3 text-[15px] font-medium shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[30, 45, 60, 75, 90, 120].map((m) => (
                <SelectItem key={m} value={String(m)}>{m} min</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">Date & Time</label>
        <Input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
        />
      </div>
    </div>
  );
}

/* ─── Step 3: Additional Info (all optional) ─────── */

function StepExtras({
  difficultyLevel, setDifficultyLevel,
  equipmentNotes, setEquipmentNotes,
  equipmentNotesKa, setEquipmentNotesKa,
  equipmentNotesRu, setEquipmentNotesRu,
  rentalInfo, setRentalInfo,
  rentalInfoKa, setRentalInfoKa,
  rentalInfoRu, setRentalInfoRu,
}: {
  difficultyLevel: string; setDifficultyLevel: (v: string) => void;
  equipmentNotes: string; setEquipmentNotes: (v: string) => void;
  equipmentNotesKa: string; setEquipmentNotesKa: (v: string) => void;
  equipmentNotesRu: string; setEquipmentNotesRu: (v: string) => void;
  rentalInfo: string; setRentalInfo: (v: string) => void;
  rentalInfoKa: string; setRentalInfoKa: (v: string) => void;
  rentalInfoRu: string; setRentalInfoRu: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Extra Details</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          All fields below are optional but help users find the right session.
        </p>
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-base font-bold text-foreground">
          <BarChart3 className="h-4 w-4 text-primary" />
          Difficulty Level
        </label>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setDifficultyLevel(difficultyLevel === level.value ? "" : level.value)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-95",
                difficultyLevel === level.value
                  ? "bg-foreground text-background shadow-lg"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/30"
              )}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* What to Bring - multi-language */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-base font-bold text-foreground">
          <Backpack className="h-4 w-4 text-primary" />
        </label>
        <MultiLangDescriptionField
          label="What to Bring"
          placeholder="e.g., Yoga mat, towel, water bottle..."
          mainValue={equipmentNotes}
          onMainChange={setEquipmentNotes}
          kaValue={equipmentNotesKa}
          onKaChange={setEquipmentNotesKa}
          ruValue={equipmentNotesRu}
          onRuChange={setEquipmentNotesRu}
        />
      </div>

      {/* Rental / Available Equipment - multi-language */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-base font-bold text-foreground">
          <ShoppingBag className="h-4 w-4 text-primary" />
        </label>
        <MultiLangDescriptionField
          label="Equipment Available to Rent / Use"
          placeholder="e.g., Boxing gloves available for 5₾..."
          mainValue={rentalInfo}
          onMainChange={setRentalInfo}
          kaValue={rentalInfoKa}
          onKaChange={setRentalInfoKa}
          ruValue={rentalInfoRu}
          onRuChange={setRentalInfoRu}
        />
      </div>
    </div>
  );
}
