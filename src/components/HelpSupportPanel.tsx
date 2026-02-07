import { Mail, MessageCircle, FileText, ChevronRight, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface HelpSupportPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HelpSupportPanel({ open, onOpenChange }: HelpSupportPanelProps) {
  const faqs = [
    {
      q: "How do I book a training session?",
      a: "Browse the Home feed, tap a listing to see details, then tap 'Book Now'. You'll receive a confirmation instantly.",
    },
    {
      q: "Can I cancel a booking?",
      a: "Yes! Go to My Bookings, find the session, and tap 'Manage Booking' to cancel. Cancellations are free up to 24 hours before the session.",
    },
    {
      q: "How do payments work?",
      a: "Currently, payments are handled at the venue. In-app payment with Apple Pay, Google Pay, and cards is coming soon.",
    },
    {
      q: "How do I become a trainer/partner?",
      a: "Sign up and select 'I offer trainings' during registration. Complete your profile and submit for admin approval.",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-2 max-h-[85vh] overflow-y-auto">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        <SheetHeader className="text-left mb-5">
          <SheetTitle className="text-xl font-extrabold text-foreground">Help & Support</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Get help, find answers, or contact us
          </SheetDescription>
        </SheetHeader>

        {/* Contact options */}
        <div className="space-y-2 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Contact Us</h3>

          <a
            href="mailto:support@fitbook.ge"
            className="flex w-full items-center gap-3 rounded-2xl bg-card ios-shadow p-4 transition-all hover:bg-muted/30 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">Email Support</p>
              <p className="text-[11px] text-muted-foreground">support@fitbook.ge</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>

          <button className="flex w-full items-center gap-3 rounded-2xl bg-card ios-shadow p-4 transition-all hover:bg-muted/30 active:scale-[0.98]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <MessageCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">Live Chat</p>
              <p className="text-[11px] text-muted-foreground">Available Mon-Fri 9am-6pm</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-2xl bg-muted/30 overflow-hidden">
                <summary className="flex cursor-pointer items-center gap-3 p-4 text-sm font-semibold text-foreground list-none [&::-webkit-details-marker]:hidden">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1">{faq.q}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4 pt-0">
                  <p className="text-xs leading-relaxed text-muted-foreground pl-7">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-primary/5 p-4 text-center">
          <p className="text-xs font-medium text-foreground/70">FitBook Georgia v1.0</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Made with ❤️ in Tbilisi</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
