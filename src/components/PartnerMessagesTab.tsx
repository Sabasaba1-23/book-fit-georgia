import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { format, isToday, isYesterday } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";

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

interface PartnerMessagesTabProps {
  partnerUserId: string;
}

export default function PartnerMessagesTab({ partnerUserId }: PartnerMessagesTabProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchThreads();
  }, [user]);

  async function fetchThreads() {
    if (!user) return;
    setLoading(true);

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

    const [threadsRes, allParticipantsRes, allMessagesRes] = await Promise.all([
      supabase.from("conversation_threads").select("*").in("id", threadIds).order("created_at", { ascending: false }),
      supabase.from("conversation_participants").select("thread_id, user_id").in("thread_id", threadIds).neq("user_id", user.id),
      supabase.from("messages").select("thread_id, content, sent_at").in("thread_id", threadIds).order("sent_at", { ascending: false }),
    ]);

    if (!threadsRes.data) { setLoading(false); return; }

    const otherUserIds = [...new Set((allParticipantsRes.data || []).map((p) => p.user_id))];

    const { data: userProfiles } = otherUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", otherUserIds)
      : { data: [] };

    const profileMap = new Map((userProfiles || []).map((p) => [p.user_id, p]));
    const participantMap = new Map<string, string>();
    for (const p of allParticipantsRes.data || []) participantMap.set(p.thread_id, p.user_id);

    const lastMsgMap = new Map<string, { content: string; sent_at: string }>();
    for (const msg of allMessagesRes.data || []) {
      if (!lastMsgMap.has(msg.thread_id)) lastMsgMap.set(msg.thread_id, msg);
    }

    const listingIds = threadsRes.data.filter((t) => t.listing_id).map((t) => t.listing_id!);
    let listingMap = new Map<string, string>();
    if (listingIds.length > 0) {
      const { data: listings } = await supabase.from("training_listings").select("id, title_en").in("id", listingIds);
      listingMap = new Map((listings || []).map((l) => [l.id, l.title_en]));
    }

    const enriched: Thread[] = threadsRes.data.map((thread) => {
      const otherUserId = participantMap.get(thread.id);
      let otherUser: Thread["otherUser"];
      if (otherUserId) {
        const profile = profileMap.get(otherUserId);
        if (profile) otherUser = { display_name: profile.full_name || t("msgClient"), avatar_url: profile.avatar_url };
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

    enriched.sort((a, b) => {
      const aT = a.lastMessageAt || a.created_at;
      const bT = b.lastMessageAt || b.created_at;
      return new Date(bT).getTime() - new Date(aT).getTime();
    });

    setThreads(enriched);
    setLoading(false);
  }

  useEffect(() => {
    if (!activeThread) return;
    fetchMessages(activeThread.id);
    const channel = supabase
      .channel(`partner-messages-${activeThread.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${activeThread.id}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages(threadId: string) {
    const { data } = await supabase.from("messages").select("*").eq("thread_id", threadId).order("sent_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  }

  async function handleSend() {
    if (!newMessage.trim() || !activeThread || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // Optimistic update
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      thread_id: activeThread.id,
      sender_id: user.id,
      content,
      sent_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase.from("messages").insert({ thread_id: activeThread.id, sender_id: user.id, content }).select("*").single();
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMessage(content);
    } else if (data) {
      setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? (data as Message) : m)));
    }
    setSending(false);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return t("msgYesterday") + " " + format(d, "h:mm a");
    return format(d, "MMM d, h:mm a");
  }

  function formatThreadTime(dateStr: string | undefined) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d");
  }

  // ─── Chat View ──────────────────────────────────
  if (activeThread) {
    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          <BackButton onClick={() => { setActiveThread(null); setMessages([]); }} />
          <Avatar className="h-10 w-10 border border-border/50">
            {activeThread.otherUser?.avatar_url ? <AvatarImage src={activeThread.otherUser.avatar_url} /> : null}
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
              {activeThread.otherUser?.display_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{activeThread.otherUser?.display_name || "Client"}</p>
            {activeThread.listingTitle && <p className="text-[11px] text-muted-foreground truncate">{activeThread.listingTitle}</p>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Start the conversation!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                  <p className="text-[14px] leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatTime(msg.sent_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border/50 px-4 py-3">
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

  // ─── Thread List ────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Clients will message you after booking</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => setActiveThread(thread)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 text-left transition-all hover:bg-muted/30 active:scale-[0.98]"
        >
          <Avatar className="h-12 w-12 border border-border/50 shrink-0">
            {thread.otherUser?.avatar_url ? <AvatarImage src={thread.otherUser.avatar_url} /> : null}
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
              {thread.otherUser?.display_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground truncate">{thread.otherUser?.display_name || "Client"}</p>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatThreadTime(thread.lastMessageAt || thread.created_at)}</span>
            </div>
            {thread.listingTitle && <p className="text-[11px] text-primary font-medium truncate">{thread.listingTitle}</p>}
            <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.lastMessage || "No messages yet"}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
