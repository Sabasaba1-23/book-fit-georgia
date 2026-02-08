import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatBookingStatus } from "@/hooks/useChatBookingStatus";
import { containsContactInfo, getContactWarning } from "@/lib/contactDetection";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Shield,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface Thread {
  id: string;
  listing_id: string | null;
  created_at: string;
  otherUser?: { display_name: string; avatar_url: string | null };
  lastMessage?: string;
  lastMessageAt?: string;
  listingTitle?: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
}

const PRE_BOOKING_MSG_SOFT_LIMIT = 15;

export default function Messages() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [contactWarningVisible, setContactWarningVisible] = useState(false);
  const [preBookingBannerDismissed, setPreBookingBannerDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { hasConfirmedBooking, loading: bookingLoading } = useChatBookingStatus(
    activeThread?.id || null
  );

  useEffect(() => {
    if (!user) return;
    fetchThreads();
  }, [user]);

  async function fetchThreads() {
    if (!user) return;
    setLoading(true);

    // Get thread IDs where user is participant
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("thread_id")
      .eq("user_id", user.id);

    if (!participations || participations.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }

    const threadIds = participations.map((p) => p.thread_id);

    // Batch all queries in parallel instead of N+1
    const [threadsRes, allParticipantsRes, allMessagesRes] = await Promise.all([
      supabase
        .from("conversation_threads")
        .select("*")
        .in("id", threadIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("conversation_participants")
        .select("thread_id, user_id")
        .in("thread_id", threadIds)
        .neq("user_id", user.id),
      supabase
        .from("messages")
        .select("thread_id, content, sent_at")
        .in("thread_id", threadIds)
        .order("sent_at", { ascending: false }),
    ]);

    if (!threadsRes.data) {
      setLoading(false);
      return;
    }

    // Collect unique other user IDs
    const otherUserIds = new Set(
      (allParticipantsRes.data || []).map((p) => p.user_id)
    );

    // Batch fetch partner and user profiles
    const otherUserIdsArr = Array.from(otherUserIds);
    const [partnerProfilesRes, userProfilesRes] = await Promise.all([
      otherUserIdsArr.length > 0
        ? supabase
            .from("partner_profiles")
            .select("user_id, display_name, logo_url")
            .in("user_id", otherUserIdsArr)
        : { data: [] },
      otherUserIdsArr.length > 0
        ? supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", otherUserIdsArr)
        : { data: [] },
    ]);

    // Build lookup maps
    const partnerMap = new Map(
      (partnerProfilesRes.data || []).map((p) => [p.user_id, p])
    );
    const profileMap = new Map(
      (userProfilesRes.data || []).map((p) => [p.user_id, p])
    );

    // Build participant map: thread_id -> other user_id
    const participantMap = new Map<string, string>();
    for (const p of allParticipantsRes.data || []) {
      participantMap.set(p.thread_id, p.user_id);
    }

    // Build last message map (first occurrence per thread since ordered desc)
    const lastMsgMap = new Map<string, { content: string; sent_at: string }>();
    for (const msg of allMessagesRes.data || []) {
      if (!lastMsgMap.has(msg.thread_id)) {
        lastMsgMap.set(msg.thread_id, { content: msg.content, sent_at: msg.sent_at });
      }
    }

    // Batch fetch listing titles
    const listingIds = threadsRes.data
      .filter((t) => t.listing_id)
      .map((t) => t.listing_id!);
    
    let listingMap = new Map<string, string>();
    if (listingIds.length > 0) {
      const { data: listings } = await supabase
        .from("training_listings")
        .select("id, title_en")
        .in("id", listingIds);
      listingMap = new Map(
        (listings || []).map((l) => [l.id, l.title_en])
      );
    }

    // Assemble enriched threads
    const enriched: Thread[] = threadsRes.data.map((thread) => {
      const otherUserId = participantMap.get(thread.id);
      let otherUser: Thread["otherUser"] = undefined;

      if (otherUserId) {
        const partner = partnerMap.get(otherUserId);
        if (partner) {
          otherUser = { display_name: partner.display_name, avatar_url: partner.logo_url };
        } else {
          const profile = profileMap.get(otherUserId);
          if (profile) {
            otherUser = { display_name: profile.full_name || "User", avatar_url: profile.avatar_url };
          }
        }
      }

      const lastMsg = lastMsgMap.get(thread.id);

      return {
        ...thread,
        otherUser,
        lastMessage: lastMsg?.content,
        lastMessageAt: lastMsg?.sent_at,
        listingTitle: thread.listing_id ? listingMap.get(thread.listing_id) : undefined,
      };
    });

    // Sort by last message time
    enriched.sort((a, b) => {
      const aTime = a.lastMessageAt || a.created_at;
      const bTime = b.lastMessageAt || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setThreads(enriched);
    setLoading(false);
  }

  // Fetch messages for active thread
  useEffect(() => {
    if (!activeThread) return;
    fetchMessages(activeThread.id);
    setPreBookingBannerDismissed(false);
    setContactWarningVisible(false);

    const channel = supabase
      .channel(`messages-${activeThread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${activeThread.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages(threadId: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("sent_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  }

  async function handleSend() {
    if (!newMessage.trim() || !activeThread || !user || sending) return;

    // Check for contact info and show gentle warning (don't block)
    if (!hasConfirmedBooking && containsContactInfo(newMessage)) {
      setContactWarningVisible(true);
      // Still allow sending — just show the warning
    }

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      thread_id: activeThread.id,
      sender_id: user.id,
      content,
    });

    if (error) setNewMessage(content);
    setSending(false);
  }

  function formatMessageTime(dateStr: string) {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday " + format(date, "h:mm a");
    return format(date, "MMM d, h:mm a");
  }

  function formatThreadTime(dateStr: string | undefined) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  }

  // Count messages from current user in this thread (for soft limit)
  const myMessageCount = messages.filter((m) => m.sender_id === user?.id).length;
  const isNearSoftLimit = !hasConfirmedBooking && myMessageCount >= PRE_BOOKING_MSG_SOFT_LIMIT;
  const showPreBookingBanner = !hasConfirmedBooking && !bookingLoading && !preBookingBannerDismissed;

  // ─── Chat View ──────────────────────────────────
  if (activeThread) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <header
          className="flex items-center gap-3 border-b border-border/50 px-4 py-3 bg-background/90 backdrop-blur-xl"
        >
          <button
            onClick={() => { setActiveThread(null); setMessages([]); }}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <Avatar className="h-10 w-10 border border-border/50">
            {activeThread.otherUser?.avatar_url ? (
              <AvatarImage src={activeThread.otherUser.avatar_url} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
              {activeThread.otherUser?.display_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground truncate">
                {activeThread.otherUser?.display_name || "Chat"}
              </p>
              {hasConfirmedBooking && (
                <CheckCircle2 className="h-3.5 w-3.5 fill-primary text-primary-foreground shrink-0" />
              )}
            </div>
            {activeThread.listingTitle && (
              <p className="text-[11px] text-muted-foreground truncate">
                {activeThread.listingTitle}
              </p>
            )}
          </div>
          {hasConfirmedBooking && (
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
              <Shield className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Booked</span>
            </div>
          )}
        </header>

        {/* Pre-booking info banner */}
        {showPreBookingBanner && (
          <div className="flex items-start gap-2.5 border-b border-border/30 bg-muted/40 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground leading-tight">
                Ask questions before you book! 💬
              </p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                For your safety and support, bookings are recommended in-app. In-app bookings include verified trainers, reviews, and payment protection.
              </p>
            </div>
            <button
              onClick={() => setPreBookingBannerDismissed(true)}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Contact info warning tooltip */}
        {contactWarningVisible && !hasConfirmedBooking && (
          <div className="flex items-start gap-2.5 border-b border-primary/20 bg-primary/5 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="flex-1 text-[11px] text-foreground/80 leading-snug">
              {getContactWarning()}
            </p>
            <button
              onClick={() => setContactWarningVisible(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Start the conversation!</p>
              {!hasConfirmedBooking && (
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                  Feel free to ask about the session, schedule, or anything you need before booking.
                </p>
              )}
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-[14px] leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatMessageTime(msg.sent_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Soft limit nudge */}
        {isNearSoftLimit && (
          <div className="flex items-center gap-2 border-t border-border/30 bg-muted/30 px-4 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-snug flex-1">
              Ready to book? In-app bookings unlock full chat, reviews, and verified sessions. 🎯
            </p>
            <button
              onClick={() => navigate("/")}
              className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground transition-all active:scale-95"
            >
              Browse
            </button>
          </div>
        )}

        {/* Post-booking unlocked badge */}
        {hasConfirmedBooking && messages.length > 0 && messages.length <= 1 && (
          <div className="flex items-center justify-center gap-1.5 border-t border-border/20 bg-primary/5 px-4 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold text-primary">
              Full chat unlocked — you're booked! Share any details you need.
            </p>
          </div>
        )}

        <div
          className="border-t border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}
        >
          <div className="flex items-center gap-2">
            <Input
              placeholder={hasConfirmedBooking ? "Type a message..." : "Ask about the session..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="h-12 flex-1 rounded-full border-0 bg-muted/60 px-5 text-sm font-medium shadow-none"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Thread List View ───────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="blob-warm-1 pointer-events-none fixed -right-32 -top-32 h-80 w-80 rounded-full" />

      <header
        className="relative z-40 px-5 pb-2 pt-4"
      >
        <h1 className="text-2xl font-extrabold text-foreground">{t("messages")}</h1>
      </header>

      <main className="relative z-10 px-5 py-3 space-y-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Book a training or ask a question to start chatting</p>
          </div>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 text-left transition-all hover:bg-muted/30 active:scale-[0.98]"
            >
              <Avatar className="h-12 w-12 border border-border/50 shrink-0">
                {thread.otherUser?.avatar_url ? (
                  <AvatarImage src={thread.otherUser.avatar_url} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                  {thread.otherUser?.display_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground truncate">
                    {thread.otherUser?.display_name || "Chat"}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {formatThreadTime(thread.lastMessageAt || thread.created_at)}
                  </span>
                </div>
                {thread.listingTitle && (
                  <p className="text-[11px] text-primary font-medium truncate">
                    {thread.listingTitle}
                  </p>
                )}
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {thread.lastMessage || "No messages yet"}
                </p>
              </div>
            </button>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
