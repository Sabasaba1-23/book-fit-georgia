import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Upload, Shield, ArrowRight, CheckCircle2, FileText, Trash2, Search, Star } from "lucide-react";
import { Left } from "@icon-park/react";
import { SPORTS } from "@/constants/sports";

const TRAINER_TYPES = [
  "Personal Trainer",
  "Group Instructor",
  "Sports Coach",
  "Yoga / Pilates Instructor",
  "Martial Arts Coach",
  "Fitness Consultant",
  "Rehabilitation Specialist",
  "Other",
];

// Years of experience is now stored as a plain number string (e.g. "3", "12")

const DOC_TYPES = [
  { value: "id_card", label: "ID Card" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
];

interface DocData {
  id: string;
  document_type: string;
  document_url: string;
  file_name: string | null;
  status: string;
}

interface Props {
  partnerId: string;
  displayName: string;
  existingBio?: string | null;
  onComplete: () => void;
  onClose: () => void;
}

export default function TrainerVerificationFlow({ partnerId, displayName, existingBio, onComplete, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<DocData[]>([]);
  const [specSearch, setSpecSearch] = useState("");

  // Step 1
  const [fullName, setFullName] = useState(displayName || "");
  const [countryCity, setCountryCity] = useState("");
  const [description, setDescription] = useState(existingBio || "");

  // Step 2
  const [trainerType, setTrainerType] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Step 3
  const [selectedDocType, setSelectedDocType] = useState("id_card");

  // Load existing data
  useEffect(() => {
    loadExisting();
    loadDocuments();
  }, [partnerId]);

  async function loadExisting() {
    const { data } = await supabase
      .from("partner_verifications")
      .select("*")
      .eq("partner_id", partnerId)
      .maybeSingle();

    if (data) {
      const d = data as any;
      setFullName(d.full_name || displayName || "");
      setCountryCity(d.country_city || d.address || "");
      setDescription(d.professional_description || existingBio || "");
      setTrainerType(d.trainer_type || "");
      setYearsExp(d.years_experience || "");
      setSpecializations(d.specializations || []);
      if (d.verification_step) setStep(Math.min(d.verification_step, 3));
    }
  }

  async function loadDocuments() {
    const { data } = await supabase
      .from("partner_documents")
      .select("id, document_type, document_url, file_name, status")
      .eq("partner_id", partnerId)
      .order("uploaded_at", { ascending: false });
    if (data) setDocuments(data as DocData[]);
  }

  async function saveProgress(nextStep: number) {
    setSaving(true);
    const payload = {
      partner_id: partnerId,
      full_name: fullName.trim(),
      country_city: countryCity.trim(),
      professional_description: description.trim(),
      trainer_type: trainerType,
      years_experience: yearsExp.trim() || null,
      specializations,
      verification_step: nextStep,
    } as any;

    const { data: existing } = await supabase
      .from("partner_verifications")
      .select("id")
      .eq("partner_id", partnerId)
      .maybeSingle();

    if (existing) {
      await supabase.from("partner_verifications").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("partner_verifications").insert(payload);
    }
    setSaving(false);
  }

  async function handleNext() {
    if (step === 1 && !fullName.trim()) {
      toast({ title: "Please enter your full name", variant: "destructive" });
      return;
    }
    await saveProgress(step + 1);
    setStep(step + 1);
  }

  async function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  async function handleSubmit() {
    setSaving(true);
    const payload = {
      partner_id: partnerId,
      full_name: fullName.trim(),
      country_city: countryCity.trim(),
      professional_description: description.trim(),
      trainer_type: trainerType,
      years_experience: yearsExp.trim() || null,
      specializations,
      verification_step: 3,
      submitted_at: new Date().toISOString(),
    } as any;

    const { data: existing } = await supabase
      .from("partner_verifications")
      .select("id")
      .eq("partner_id", partnerId)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from("partner_verifications").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("partner_verifications").insert(payload));
    }

    if (!error) {
      await supabase
        .from("partner_profiles")
        .update({ verification_status: "pending" })
        .eq("id", partnerId);
      toast({ title: "Verification submitted! 🎉", description: "We'll review your profile within 24-48 hours." });
      onComplete();
    } else {
      toast({ title: "Error submitting", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}_${docType}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("partner-documents").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("partner_documents").insert({
      partner_id: partnerId,
      document_type: docType,
      document_url: path,
      file_name: file.name,
    });

    if (!insertError) {
      toast({ title: "Document uploaded!" });
      loadDocuments();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (certInputRef.current) certInputRef.current.value = "";
  }

  async function handleDeleteDoc(docId: string, docUrl: string) {
    await supabase.storage.from("partner-documents").remove([docUrl]);
    await supabase.from("partner_documents").delete().eq("id", docId);
    toast({ title: "Document removed" });
    loadDocuments();
  }

  const toggleSpecialization = (sport: string) => {
    setSpecializations((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const progressPercent = ((step - 1) / 3) * 100 + (step === 3 ? 33 : 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pb-4 pt-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Step {step} of 3
          </p>
          <button onClick={onClose} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Save & Close
          </button>
        </div>
        <Progress value={progressPercent} className="h-1.5 rounded-full" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">About You</h2>
              <p className="mt-1 text-sm text-muted-foreground">Let's start with the basics — who you are and where you're based.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Full Name <span className="text-destructive">*</span></label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="h-12 rounded-xl border-border bg-card"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Country / City</label>
                <Input
                  value={countryCity}
                  onChange={(e) => setCountryCity(e.target.value)}
                  placeholder="e.g. Tbilisi, Georgia"
                  className="h-12 rounded-xl border-border bg-card"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">About You</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short intro about your training style and background..."
                  rows={4}
                  className="rounded-xl border-border bg-card resize-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">This helps clients understand what makes you unique.</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Your Experience</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tell us about your training background and expertise.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">What type of trainer are you?</label>
                <div className="flex flex-wrap gap-2">
                  {TRAINER_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setTrainerType(type)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-xs font-semibold transition-all",
                        trainerType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">Years of experience</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExp}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setYearsExp(v);
                  }}
                  placeholder="e.g. 5"
                  className="h-12 rounded-xl border-border bg-card"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {yearsExp ? `Will display as "${yearsExp}+ years" on your profile` : "Enter the number of years you've been training"}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">Specializations</label>
                <p className="mb-2 text-[11px] text-muted-foreground">Search and select the sports you specialize in</p>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={specSearch}
                    onChange={(e) => setSpecSearch(e.target.value)}
                    placeholder="Search specializations..."
                    className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                {specializations.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {specializations.map((sport) => (
                      <button
                        key={sport}
                        onClick={() => toggleSpecialization(sport)}
                        className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground"
                      >
                        {sport} ✕
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {SPORTS.filter(s => s !== "Other")
                    .filter(s => s.toLowerCase().includes(specSearch.toLowerCase()))
                    .filter(s => !specializations.includes(s))
                    .map((sport) => (
                      <button
                        key={sport}
                        onClick={() => toggleSpecialization(sport)}
                        className="rounded-full bg-muted/60 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:bg-muted"
                      >
                        {sport}
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Certificate Upload
                  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"><Star className="h-3 w-3" /> Recommended</span>
                </label>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Have a training certification? Upload it to strengthen your profile.
                </p>
                <button
                  onClick={() => certInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload Certificate"}
                </button>
                <input
                  ref={certInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleDocUpload(e, "certificate")}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Identity Confirmation</h2>
              <p className="mt-1 text-sm text-muted-foreground">Upload a government-issued ID to complete your verification.</p>
            </div>

            <div className="rounded-xl bg-primary/5 p-3">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Your document is <span className="font-semibold text-foreground">only visible to our admin team</span> and is never shown publicly. We use it solely to verify your identity.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-foreground">Document Type</label>
              <div className="flex gap-2">
                {DOC_TYPES.map((dt) => (
                  <button
                    key={dt.value}
                    onClick={() => setSelectedDocType(dt.value)}
                    className={cn(
                      "flex-1 rounded-xl py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all",
                      selectedDocType === dt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing documents */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.file_name || doc.document_type}</p>
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        doc.status === "approved" ? "text-emerald-600" :
                        doc.status === "rejected" ? "text-red-500" : "text-amber-600"
                      )}>
                        {doc.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.id, doc.document_url)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {uploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleDocUpload(e, selectedDocType)}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm px-5 pb-6 pt-3">
        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="h-12 flex-1 rounded-xl font-semibold">
              <Left size={16} className="mr-1.5" />
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} disabled={saving} className="h-12 flex-1 rounded-xl font-bold">
              {saving ? "Saving..." : "Continue"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || uploading} className="h-12 flex-1 rounded-xl font-bold">
              {saving ? "Submitting..." : "Submit for Verification"}
              <CheckCircle2 className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
