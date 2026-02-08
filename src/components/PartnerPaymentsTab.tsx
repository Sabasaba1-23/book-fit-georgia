import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Banknote, CreditCard, History, Save, CheckCircle2 } from "lucide-react";

interface PayoutRecord {
  id: string;
  bank_name: string | null;
  account_holder: string | null;
  iban: string | null;
}

export default function PartnerPaymentsTab({ partnerId }: { partnerId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [iban, setIban] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("partner_payouts")
        .select("*")
        .eq("partner_id", partnerId)
        .maybeSingle();
      if (data) {
        setBankName(data.bank_name || "");
        setAccountHolder(data.account_holder || "");
        setIban(data.iban || "");
        setExistingId(data.id);
      }
      setLoading(false);
    }
    load();
  }, [partnerId]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      partner_id: partnerId,
      bank_name: bankName.trim() || null,
      account_holder: accountHolder.trim() || null,
      iban: iban.trim() || null,
    };

    let error: any;
    if (existingId) {
      const res = await supabase.from("partner_payouts").update(payload).eq("id", existingId);
      error = res.error;
    } else {
      const res = await supabase.from("partner_payouts").insert(payload).select().single();
      error = res.error;
      if (res.data) setExistingId(res.data.id);
    }

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bank details saved ✓" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Account Details */}
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Bank Account</h3>
            <p className="text-[12px] text-muted-foreground">Receive payouts to your bank</p>
          </div>
          {existingId && (
            <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank Name</label>
            <Input
              placeholder="e.g., Bank of Georgia"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="h-12 rounded-xl border-0 bg-muted/60 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Holder Name</label>
            <Input
              placeholder="Full name on account"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className="h-12 rounded-xl border-0 bg-muted/60 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">IBAN / Account Number</label>
            <Input
              placeholder="GE00TB0000000000000000"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              className="h-12 rounded-xl border-0 bg-muted/60 text-sm font-mono"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl bg-primary text-sm font-bold"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : existingId ? "Update Details" : "Save Details"}
          </Button>
        </div>
      </div>

      {/* Card for Payouts — Coming Soon */}
      <div className="rounded-2xl border border-border/50 bg-card p-5 opacity-60">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Card Payouts</h3>
            <p className="text-[12px] text-muted-foreground">Receive payouts to your card</p>
          </div>
          <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            Coming Soon
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Card-based payouts via Stripe Connect will be available soon.
        </p>
      </div>

      {/* Payout History */}
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Payout History</h3>
            <p className="text-[12px] text-muted-foreground">Track your earnings</p>
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 py-8 text-center">
          <p className="text-sm text-muted-foreground">No payouts yet</p>
          <p className="text-[12px] text-muted-foreground/60 mt-1">Your payout history will appear here</p>
        </div>
      </div>
    </div>
  );
}
