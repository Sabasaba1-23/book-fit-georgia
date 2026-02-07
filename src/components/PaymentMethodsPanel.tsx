import { useState } from "react";
import { CreditCard, Smartphone, Plus, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface PaymentMethodsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentMethodsPanel({ open, onOpenChange }: PaymentMethodsPanelProps) {
  // Local state for future payment methods
  const [methods] = useState<{ id: string; type: string; label: string; last4?: string }[]>([]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-2 max-h-[85vh] overflow-y-auto">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        <SheetHeader className="text-left mb-5">
          <SheetTitle className="text-xl font-extrabold text-foreground">Payment Methods</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Manage how you pay for training sessions
          </SheetDescription>
        </SheetHeader>

        {/* Existing methods */}
        {methods.length > 0 ? (
          <div className="space-y-3 mb-5">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{m.label}</p>
                  {m.last4 && (
                    <p className="text-xs text-muted-foreground">•••• {m.last4}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-5 rounded-2xl bg-muted/30 p-6 text-center">
            <CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No payment methods added yet</p>
          </div>
        )}

        {/* Add payment options */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Add Payment Method</h3>

          <button className="flex w-full items-center gap-3 rounded-2xl bg-card ios-shadow p-4 transition-all hover:bg-muted/30 active:scale-[0.98]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-background" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">Apple Pay</p>
              <p className="text-[11px] text-muted-foreground">Coming soon</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">SOON</span>
          </button>

          <button className="flex w-full items-center gap-3 rounded-2xl bg-card ios-shadow p-4 transition-all hover:bg-muted/30 active:scale-[0.98]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4285F4]">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">Google Pay</p>
              <p className="text-[11px] text-muted-foreground">Coming soon</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">SOON</span>
          </button>

          <button className="flex w-full items-center gap-3 rounded-2xl bg-card ios-shadow p-4 transition-all hover:bg-muted/30 active:scale-[0.98]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">Credit / Debit Card</p>
              <p className="text-[11px] text-muted-foreground">Coming soon</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">SOON</span>
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          Payment processing will be available soon. Sessions can currently be paid at the venue.
        </p>
      </SheetContent>
    </Sheet>
  );
}
