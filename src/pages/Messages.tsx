import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Send,
  MessageCircle,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface Thread {
  id: string;
  listing_id: string | null;
  created_at: string;
  // joined data
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads
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

    // Get threads
    const { data: threadsData } = await supabase
      .from("conversation_threads")
      .select("*")
      .in("id", threadIds)
      .order("created_at", { ascending: false });

    if (!threadsData) {
      setLoading(false);
      return;
    }

    // Enrich threads with other participant info and last message
    const enriched: Thread[] = [];

    for (const thread of threadsData) {
      // Get other participants
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("thread_id", thread.id)
        .neq("user_id", user.id);

      let otherUser: Thread["otherUser"] = undefined;

      if (participants && participants.length > 0) {
        // Try partner_profiles first (trainer/gym name)
        const { data: partnerProfile } = await supabase
          .from("partner_profiles")
          .select("display_name, logo_url")
          .eq("user_id", participants[0].user_id)
          .maybeSingle();

        if (partnerProfile) {
          otherUser = {
            display_name: partnerProfile.display_name,
            avatar_url: partnerProfile.logo_url,
          };
        } else {
          // Fall back to profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", participants[0].user_id)
            .maybeSingle();

          if (profile) {
            otherUser = {
              display_name: profile.full_name || "User",
              avatar_url: profile.avatar_url,
            };
          }
        }
      }

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, sent_at")
        .eq("thread_id", thread.id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get listing title if exists
      let listingTitle: string | undefined;
      if (thread.listing_id) {
        const { data: listing } = await supabase
          .from("training_listings")
          .select("title_en")
          .eq("id", thread.listing_id)
          .maybeSingle();
        listingTitle = listing?.title_en || undefined;
      }

      enriched.push({
        ...thread,
        otherUser,
        lastMessage: lastMsg?.content,
        lastMessageAt: lastMsg?.sent_at,
        listingTitle,
      });
    }

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

    // Real-time subscription
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

  // Scroll to bottom on new messages
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
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      thread_id: activeThread.id,
      sender_id: user.id,
      content,
    });

    if (error) {
      setNewMessage(content); // restore on error
    }
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

  // ─── Chat View ──────────────────────────────────
  if (activeThread) {
    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Chat Header */}
        <header className="flex items-center gap-3 border-b border-border/50 px-4 py-3 bg-background/90 backdrop-blur-xl">
          <button
            onClick={() => {
              setActiveThread(null);
              setMessages([]);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
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
            <p className="text-sm font-bold text-foreground truncate">
              {activeThread.otherUser?.display_name || "Chat"}
            </p>
            {activeThread.listingTitle && (
              <p className="text-[11px] text-muted-foreground truncate">
                {activeThread.listingTitle}
              </p>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Start the conversation!
              </p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-[14px] leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {formatMessageTime(msg.sent_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3 pb-8">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
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

      <header className="relative z-40 px-5 pt-6 pb-2">
        <h1 className="text-2xl font-extrabold text-foreground">
          {t("messages")}
        </h1>
      </header>

      <main className="relative z-10 px-5 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No messages yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Book a training to chat with your trainer
            </p>
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
