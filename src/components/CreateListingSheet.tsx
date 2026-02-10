import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BackButton from "@/components/BackButton";
import MultiLangDescriptionField from "@/components/MultiLangDescriptionField";
import ActivitySearchSelect from "@/components/listing/ActivitySearchSelect";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
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
  User,
  Users,
  Camera,
  Send,
  MapPin,
  Backpack,
  ShoppingBag,
  BarChart3,
  Building2,
  Home,
  Car,
  Package,
  Zap,
  Instagram,
  Facebook,
  Target,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPORTS, DIFFICULTY_LEVELS } from "@/constants/sports";

interface CreateListingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  onCreated: () => void;
}

type ServiceType = "single" | "package";
type LocationType = "gym" | "home" | "mobile";

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
  const [serviceType, setServiceType] = useState<ServiceType>("single");

  // Location fields
  const [locationType, setLocationType] = useState<LocationType>("gym");
  const [location, setLocation] = useState("");
  const [gymName, setGymName] = useState("");
  const [gymInstagram, setGymInstagram] = useState("");
  const [gymFacebook, setGymFacebook] = useState("");

  // Step 2 fields
  const [description, setDescription] = useState("");
  const [descriptionKa, setDescriptionKa] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [priceGel, setPriceGel] = useState("");
  const [maxSpots, setMaxSpots] = useState("");
  const [scheduledDate, setScheduledDateStr] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  // Package fields
  const [sessionsCount, setSessionsCount] = useState("8");
  const [totalPriceGel, setTotalPriceGel] = useState("");

  // Step 3 fields (optional extras)
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [equipmentNotes, setEquipmentNotes] = useState("");
  const [equipmentNotesKa, setEquipmentNotesKa] = useState("");
  const [equipmentNotesRu, setEquipmentNotesRu] = useState("");
  const [rentalInfo, setRentalInfo] = useState("");
  const [rentalInfoKa, setRentalInfoKa] = useState("");
  const [rentalInfoRu, setRentalInfoRu] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [recurring, setRecurring] = useState<"none" | "weekly" | "biweekly" | "monthly">("none");
  const [venueFee, setVenueFee] = useState("");

  const totalSteps = 3;

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setSport("");
    setTrainingType("one_on_one");
    setServiceType("single");
    setLocationType("gym");
    setLocation("");
    setGymName("");
    setGymInstagram("");
    setGymFacebook("");
    setDescription("");
    setDescriptionKa("");
    setDescriptionRu("");
    setPriceGel("");
    setMaxSpots("");
    setScheduledDateStr("");
    setScheduledTime("");
    setImageFile(null);
    setImagePreview(null);
    setAdditionalImages([]);
    setAdditionalPreviews([]);
    setSessionsCount("8");
    setTotalPriceGel("");
    setDifficultyLevel("");
    setEquipmentNotes("");
    setEquipmentNotesKa("");
    setEquipmentNotesRu("");
    setRentalInfo("");
    setRentalInfoKa("");
    setRentalInfoRu("");
    setDurationMinutes("60");
    setSelectedGoals([]);
    setRecurring("none");
    setVenueFee("");
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

  const scheduledAt = scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}` : "";
  const canContinueStep1 = title.trim() && sport && location.trim();
  const canContinueStep2 = serviceType === "package"
    ? (totalPriceGel && parseFloat(totalPriceGel) > 0)
    : (scheduledAt && priceGel && parseFloat(priceGel) > 0);

  const handleSubmit = async () => {
    setLoading(true);
    let backgroundImageUrl: string | null = null;

    if (imageFile) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userId = currentUser?.id;
      if (userId) {
        const ext = imageFile.name.split(".").pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(path, imageFile);

        if (uploadError) {
          console.error("Listing image upload failed:", uploadError);
          toast({ title: "Cover image upload failed", description: uploadError.message, variant: "destructive" });
        } else {
          const { data: urlData } = supabase.storage
            .from("listing-images")
            .getPublicUrl(path);
          backgroundImageUrl = urlData.publicUrl;
        }
      }
    }

    const commonFields = {
      partner_id: partnerId,
      title_en: title.trim(),
      description_en: description.trim() || null,
      description_ka: descriptionKa.trim() || null,
      sport,
      training_type: trainingType,
      duration_minutes: parseInt(durationMinutes) || 60,
      max_spots: parseInt(maxSpots) || 1,
      background_image_url: backgroundImageUrl,
      location: location.trim(),
      location_type: locationType,
      gym_name: locationType === "gym" ? (gymName.trim() || null) : null,
      gym_instagram: locationType === "gym" ? (gymInstagram.trim() || null) : null,
      gym_facebook: locationType === "gym" ? (gymFacebook.trim() || null) : null,
      difficulty_level: difficultyLevel || null,
      equipment_notes_en: equipmentNotes.trim() || null,
      equipment_notes_ka: equipmentNotesKa.trim() || null,
      rental_info_en: rentalInfo.trim() || null,
      rental_info_ka: rentalInfoKa.trim() || null,
      goals: selectedGoals.length > 0 ? selectedGoals : null,
      venue_fee_gel: venueFee ? parseFloat(venueFee) : null,
      status: "pending" as const,
    };

    let error: any;

    if (serviceType === "package") {
      const sessions = parseInt(sessionsCount) || 8;
      const total = parseFloat(totalPriceGel) || 0;
      const perSession = sessions > 0 ? Math.round((total / sessions) * 100) / 100 : 0;

      // training_packages doesn't have equipment_notes or rental_info columns
      const { equipment_notes_en, equipment_notes_ka, rental_info_en, rental_info_ka, ...packageFields } = commonFields;

      const { error: pkgError } = await supabase.from("training_packages").insert({
        ...packageFields,
        sessions_count: sessions,
        total_price_gel: total,
        price_per_session_gel: perSession,
      });
      error = pkgError;
    } else {
      const { error: listingError } = await supabase.from("training_listings").insert({
        ...commonFields,
        scheduled_at: new Date(scheduledAt).toISOString(),
        price_gel: parseFloat(priceGel),
      });
      error = listingError;
    }

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

  const stepLabels = ["Basics", "Details & Pricing", "Additional Info"];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-[2rem] p-0 overflow-hidden border-0 [&>button[class*='absolute']]:hidden">
        <div className="flex h-full flex-col bg-background">
          {/* Header */}
          <header className="flex items-center justify-between px-5 pt-5 pb-2">
            <BackButton onClick={() => (step > 1 ? setStep(step - 1) : handleClose())} />
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
                serviceType={serviceType} setServiceType={setServiceType}
                locationType={locationType} setLocationType={setLocationType}
                location={location} setLocation={setLocation}
                gymName={gymName} setGymName={setGymName}
                gymInstagram={gymInstagram} setGymInstagram={setGymInstagram}
                gymFacebook={gymFacebook} setGymFacebook={setGymFacebook}
              />
            )}
            {step === 2 && (
              <StepDetails
                serviceType={serviceType}
                imagePreview={imagePreview} onImageChange={handleImageChange}
                description={description} setDescription={setDescription}
                descriptionKa={descriptionKa} setDescriptionKa={setDescriptionKa}
                descriptionRu={descriptionRu} setDescriptionRu={setDescriptionRu}
                priceGel={priceGel} setPriceGel={setPriceGel}
                maxSpots={maxSpots} setMaxSpots={setMaxSpots}
                scheduledDate={scheduledDate} setScheduledDate={setScheduledDateStr}
                scheduledTime={scheduledTime} setScheduledTime={setScheduledTime}
                durationMinutes={durationMinutes} setDurationMinutes={setDurationMinutes}
                sessionsCount={sessionsCount} setSessionsCount={setSessionsCount}
                totalPriceGel={totalPriceGel} setTotalPriceGel={setTotalPriceGel}
                additionalImages={additionalImages} setAdditionalImages={setAdditionalImages}
                additionalPreviews={additionalPreviews} setAdditionalPreviews={setAdditionalPreviews}
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
                selectedGoals={selectedGoals} setSelectedGoals={setSelectedGoals}
                recurring={recurring} setRecurring={setRecurring}
              />
            )}
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl px-5 pb-8 pt-4 border-t border-border/40">
            {step < totalSteps ? (
              <Button
                disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
                onClick={() => {
                  if (step === 2 && serviceType === "single" && scheduledAt && new Date(scheduledAt) <= new Date()) {
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
  serviceType, setServiceType,
  locationType, setLocationType,
  location, setLocation,
  gymName, setGymName,
  gymInstagram, setGymInstagram,
  gymFacebook, setGymFacebook,
}: {
  title: string; setTitle: (v: string) => void;
  sport: string; setSport: (v: string) => void;
  trainingType: "one_on_one" | "group"; setTrainingType: (v: "one_on_one" | "group") => void;
  serviceType: ServiceType; setServiceType: (v: ServiceType) => void;
  locationType: LocationType; setLocationType: (v: LocationType) => void;
  location: string; setLocation: (v: string) => void;
  gymName: string; setGymName: (v: string) => void;
  gymInstagram: string; setGymInstagram: (v: string) => void;
  gymFacebook: string; setGymFacebook: (v: string) => void;
}) {
  return (
    <div className="space-y-7">
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
        <ActivitySearchSelect value={sport} onChange={setSport} />
      </div>

      {/* Service Type */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">Service Type</label>
        <div className="flex rounded-2xl border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setServiceType("single")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
              serviceType === "single" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Zap className="h-4 w-4" /> Single Session
          </button>
          <button
            type="button"
            onClick={() => setServiceType("package")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
              serviceType === "package" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Package className="h-4 w-4" /> Package
          </button>
        </div>
        {serviceType === "package" && (
          <p className="mt-2 text-[12px] text-muted-foreground">
            Bundle multiple sessions at a discounted rate (e.g., 8 or 12 sessions).
          </p>
        )}
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

      {/* Location Type */}
      <div>
        <label className="mb-2 block text-base font-bold text-foreground">Location Type</label>
        <div className="flex gap-2">
          {([
            { key: "gym" as const, icon: <Building2 className="h-4 w-4" />, label: "Gym" },
            { key: "home" as const, icon: <Home className="h-4 w-4" />, label: "Home" },
            { key: "mobile" as const, icon: <Car className="h-4 w-4" />, label: "I Come to You" },
          ]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setLocationType(opt.key)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-2xl border py-3.5 text-xs font-semibold transition-all active:scale-95",
                locationType === opt.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Address / Location */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-base font-bold text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {locationType === "mobile" ? "Service Area" : "Address / Location"}
          <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder={
            locationType === "gym" ? "e.g., Vake, Tbilisi" :
            locationType === "home" ? "e.g., Your home address" :
            "e.g., Tbilisi area, Vake & Saburtalo"
          }
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Gym-specific fields */}
      {locationType === "gym" && (
        <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <p className="text-sm font-bold text-foreground">Gym Details</p>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Gym / Company Name</label>
            <Input
              placeholder="e.g., FitLife Gym"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              className="h-12 rounded-xl border-0 bg-background px-4 text-[14px] font-medium shadow-none placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Instagram className="h-3.5 w-3.5" /> Instagram
              </label>
              <Input
                placeholder="@gymhandle"
                value={gymInstagram}
                onChange={(e) => setGymInstagram(e.target.value)}
                className="h-11 rounded-xl border-0 bg-background px-3 text-[13px] font-medium shadow-none placeholder:text-muted-foreground/60"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Facebook className="h-3.5 w-3.5" /> Facebook
              </label>
              <Input
                placeholder="facebook.com/gym"
                value={gymFacebook}
                onChange={(e) => setGymFacebook(e.target.value)}
                className="h-11 rounded-xl border-0 bg-background px-3 text-[13px] font-medium shadow-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">Optional – helps users discover the venue</p>
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: Details & Pricing ──────────────────── */

function StepDetails({
  serviceType,
  imagePreview, onImageChange,
  description, setDescription,
  descriptionKa, setDescriptionKa,
  descriptionRu, setDescriptionRu,
  priceGel, setPriceGel,
  maxSpots, setMaxSpots,
  scheduledDate, setScheduledDate,
  scheduledTime, setScheduledTime,
  durationMinutes, setDurationMinutes,
  sessionsCount, setSessionsCount,
  totalPriceGel, setTotalPriceGel,
  additionalImages, setAdditionalImages,
  additionalPreviews, setAdditionalPreviews,
}: {
  serviceType: ServiceType;
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description: string; setDescription: (v: string) => void;
  descriptionKa: string; setDescriptionKa: (v: string) => void;
  descriptionRu: string; setDescriptionRu: (v: string) => void;
  priceGel: string; setPriceGel: (v: string) => void;
  maxSpots: string; setMaxSpots: (v: string) => void;
  scheduledDate: string; setScheduledDate: (v: string) => void;
  scheduledTime: string; setScheduledTime: (v: string) => void;
  durationMinutes: string; setDurationMinutes: (v: string) => void;
  sessionsCount: string; setSessionsCount: (v: string) => void;
  totalPriceGel: string; setTotalPriceGel: (v: string) => void;
  additionalImages: File[]; setAdditionalImages: (v: File[]) => void;
  additionalPreviews: string[]; setAdditionalPreviews: (v: string[]) => void;
}) {
  const sessions = parseInt(sessionsCount) || 0;
  const total = parseFloat(totalPriceGel) || 0;
  const perSession = sessions > 0 ? (total / sessions).toFixed(2) : "0.00";

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

      {serviceType === "package" ? (
        <>
          {/* Package pricing */}
          <div>
            <label className="mb-2 block text-base font-bold text-foreground">Package Sessions</label>
            <div className="flex flex-wrap gap-2">
              {["4", "8", "12", "16", "20"].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSessionsCount(n)}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95",
                    sessionsCount === n
                      ? "bg-foreground text-background shadow-lg"
                      : "border border-border bg-card text-muted-foreground"
                  )}
                >
                  {n} sessions
                </button>
              ))}
            </div>
            <Input
              type="number" min={1} max={100}
              value={sessionsCount}
              onChange={(e) => setSessionsCount(e.target.value)}
              placeholder="Custom number"
              className="mt-3 h-12 rounded-xl border-0 bg-muted/60 px-4 text-[14px] font-medium shadow-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-foreground">Total Price (₾)</label>
              <Input
                type="number" min={0} step={0.5}
                value={totalPriceGel} onChange={(e) => setTotalPriceGel(e.target.value)}
                placeholder="0"
                className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-foreground">Per Session</label>
              <div className="flex h-14 items-center rounded-2xl bg-muted/40 px-4">
                <span className="text-[15px] font-bold text-primary">{perSession} ₾</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="mb-2 block text-sm font-bold text-foreground">Duration / session</label>
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
        </>
      ) : (
        <>
          {/* Single session pricing */}
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

          {/* Date */}
          <div>
            <label className="mb-2 block text-base font-bold text-foreground">Date</label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="mb-2 block text-base font-bold text-foreground">Time</label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium shadow-none"
            />
          </div>
        </>
      )}

      {/* Additional Photos */}
      <div>
        <label className="mb-1 block text-base font-bold text-foreground">Additional Photos / Videos</label>
        <p className="mb-3 text-[13px] text-muted-foreground">Add more media to showcase your training (optional).</p>
        <div className="flex gap-2 flex-wrap">
          {additionalPreviews.map((src, i) => (
            <div key={i} className="relative group">
              <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover border border-border/50" />
              <button
                type="button"
                onClick={() => {
                  setAdditionalImages(additionalImages.filter((_, idx) => idx !== i));
                  setAdditionalPreviews(additionalPreviews.filter((_, idx) => idx !== i));
                }}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {additionalImages.length < 6 && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              <Camera className="h-5 w-5" />
              <span className="text-[9px] font-semibold uppercase">Add</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const newFiles = [...additionalImages, ...files].slice(0, 6);
                  setAdditionalImages(newFiles);
                  setAdditionalPreviews(newFiles.map((f) => URL.createObjectURL(f)));
                }}
              />
            </label>
          )}
        </div>
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
  selectedGoals, setSelectedGoals,
  recurring, setRecurring,
}: {
  difficultyLevel: string; setDifficultyLevel: (v: string) => void;
  equipmentNotes: string; setEquipmentNotes: (v: string) => void;
  equipmentNotesKa: string; setEquipmentNotesKa: (v: string) => void;
  equipmentNotesRu: string; setEquipmentNotesRu: (v: string) => void;
  rentalInfo: string; setRentalInfo: (v: string) => void;
  rentalInfoKa: string; setRentalInfoKa: (v: string) => void;
  rentalInfoRu: string; setRentalInfoRu: (v: string) => void;
  selectedGoals: string[]; setSelectedGoals: (v: string[]) => void;
  recurring: string; setRecurring: (v: "none" | "weekly" | "biweekly" | "monthly") => void;
}) {
  const GOALS_OPTIONS = ["Muscle Gain", "Weight Loss", "Speed & Performance", "General Health", "Mobility / Recovery"];
  const RECURRING_OPTIONS = [
    { key: "none" as const, label: "One-time" },
    { key: "weekly" as const, label: "Weekly" },
    { key: "biweekly" as const, label: "Bi-weekly" },
    { key: "monthly" as const, label: "Monthly" },
  ];

  const toggleGoal = (g: string) => {
    setSelectedGoals(
      selectedGoals.includes(g) ? selectedGoals.filter((x) => x !== g) : [...selectedGoals, g]
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Extra Details</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          All fields below are optional but help users find the right session.
        </p>
      </div>

      {/* Goals */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-base font-bold text-foreground">
          <Target className="h-4 w-4 text-primary" />
          Training Goals
        </label>
        <div className="flex flex-wrap gap-2">
          {GOALS_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGoal(g)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-95",
                selectedGoals.includes(g)
                  ? "bg-foreground text-background shadow-lg"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/30"
              )}
            >
              {g}
            </button>
          ))}
        </div>
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

      {/* Recurring */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-base font-bold text-foreground">
          <RefreshCw className="h-4 w-4 text-primary" />
          Recurring Schedule
        </label>
        <div className="flex flex-wrap gap-2">
          {RECURRING_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRecurring(opt.key)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-95",
                recurring === opt.key
                  ? "bg-foreground text-background shadow-lg"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/30"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Recurring listings automatically repeat at the same day and time.
        </p>
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
