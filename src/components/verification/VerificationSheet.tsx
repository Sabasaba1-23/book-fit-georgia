import { Sheet, SheetContent } from "@/components/ui/sheet";
import TrainerVerificationFlow from "./TrainerVerificationFlow";
import GymVerificationFlow from "./GymVerificationFlow";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerType: "individual" | "gym";
  displayName: string;
  existingBio?: string | null;
  onComplete: () => void;
}

export default function VerificationSheet({
  open,
  onOpenChange,
  partnerId,
  partnerType,
  displayName,
  existingBio,
  onComplete,
}: Props) {
  const handleClose = () => onOpenChange(false);
  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 [&>button[class*='absolute']]:hidden">
        {partnerType === "individual" ? (
          <TrainerVerificationFlow
            partnerId={partnerId}
            displayName={displayName}
            existingBio={existingBio}
            onComplete={handleComplete}
            onClose={handleClose}
          />
        ) : (
          <GymVerificationFlow
            partnerId={partnerId}
            displayName={displayName}
            onComplete={handleComplete}
            onClose={handleClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
