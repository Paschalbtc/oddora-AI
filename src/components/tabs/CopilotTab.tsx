"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  HelpCircle,
  ExternalLink,
  Zap,
  Trash2,
  X,
} from "lucide-react";
import { UserTier } from "../Navbar";
import { useAuth } from "@/context/AuthContext";

export interface CopilotTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
  isEmbedded?: boolean;
  onClose?: () => void;
}

interface Message {
  sender: "user" | "bot";
  text: string;
  generated_slip?: any;
  edited_slip?: any;
  timestamp: string;
}

export const CopilotTab: React.FC<CopilotTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
  isEmbedded = false,
  onClose,
}) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "👋 Welcome to Oddora AI Copilot! I am connected to all 4 Sport Brains and Product Engines. You can ask me questions about betting markets, command me to solve custom slips (e.g. 'Build 10 odds slip'), or ask me to edit or split your SportyBet booking codes. How can I assist you today?",
      timestamp: "Today",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load today's chat history on mount
  useEffect(() => {
    let isMounted = true;
    async function loadChatHistory() {
      try {
        setIsLoadingHistory(true);
        const emailParam = user?.email ? encodeURIComponent(user.email) : "";
        const idParam = user?.id ? encodeURIComponent(user.id) : "";
        const res = await fetch(`/api/copilot?email=${emailParam}&userId=${idParam}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        // Fallback to initial message
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }
    loadChatHistory();
    return () => {
      isMounted = false;
    };
  }, [user?.email, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickPrompts = [
    "Build me 5 odds slip with 4 matches",
    "Explain Over 2.5 Goals market",
    "Give me 10 odds Football slip",
    "Why did you pick this?",
    "How do I edit my booking code?",
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    setInput("");
    const userMsg: Message = {
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          user_tier: currentTier,
          user_email: user?.email || "",
          user_id: user?.id || "",
          conversation_history: messages,
        }),
      });

      const json = await res.json();
      const botMsg: Message = {
        sender: "bot",
        text: json.reply || "I have processed your request.",
        generated_slip: json.generated_slip,
        edited_slip: json.edited_slip,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Connection error. Please try asking again.",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    try {
      const emailParam = user?.email ? encodeURIComponent(user.email) : "";
      const idParam = user?.id ? encodeURIComponent(user.id) : "";
      await fetch(`/api/copilot?email=${emailParam}&userId=${idParam}`, { method: "DELETE" });
    } catch {}
    setMessages([
      {
        sender: "bot",
        text: "Conversation cleared. How can I assist you with your picks today?",
        timestamp: "Now",
      },
    ]);
  };

  const handleCopy = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div
      className={`flex flex-col w-full bg-[#11161F] overflow-hidden ${
        isEmbedded ? "h-full" : "h-[calc(100dvh-4rem)] pb-14 md:pb-0"
      } animate-in fade-in duration-200`}
    >
      {/* Copilot Header */}
      <div className="px-4 sm:px-5 py-3 bg-[#070A0E] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-sm sm:text-base truncate">
                Oddora AI Copilot
              </h3>
              <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              Multi-Engine conversational intelligence & ticket solver
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClearChat}
            title="Clear Chat History"
            className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/[0.05] px-2 sm:px-3 py-1 rounded-full border border-white/10">
            Tier: <span className="text-emerald-400">{currentTier}</span>
          </span>
          {isEmbedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 sm:space-y-4">
        {isLoadingHistory && (
          <div className="text-center py-2 text-slate-500 text-xs font-mono">
            Loading today's session...
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.sender === "user";
          const activeCode =
            msg.generated_slip?.sporty_code ||
            msg.generated_slip?.booking_code ||
            msg.generated_slip?.code ||
            msg.generated_slip?.shareCode;

          return (
            <div
              key={idx}
              className={`flex gap-2.5 sm:gap-3 max-w-[94%] sm:max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-slate-700 text-white"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2 min-w-0 max-w-full">
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-emerald-600 text-black font-semibold rounded-tr-none shadow-md"
                      : "bg-[#070A0E] text-slate-200 border border-white/10 rounded-tl-none shadow-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>

                {/* Embedded Generated Slip Card inside Chat */}
                {msg.generated_slip && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-[#070A0E] border border-emerald-500/40 space-y-3 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <span className="text-[10px] font-mono font-black text-emerald-400 uppercase">
                        {msg.generated_slip.legs_count || (msg.generated_slip.legs || []).length} Matches •{" "}
                        {msg.generated_slip.actual_combined_odds || msg.generated_slip.totalOdds || "5.00"}x Odds
                      </span>
                      {activeCode && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                            {activeCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeCode)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-[11px] font-black flex items-center gap-1 transition cursor-pointer"
                          >
                            <span>{copiedCode === activeCode ? "Copied" : "Copy"}</span>
                            {copiedCode === activeCode ? (
                              <Check className="w-3 h-3 text-black" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 1-Click SportyBet Launcher */}
                    {activeCode && (
                      <div>
                        <a
                          href={
                            msg.generated_slip.sporty_url ||
                            `https://www.sportybet.com/ng/?shareCode=${activeCode}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-[#E51D25] hover:bg-red-600 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 transition shadow-md"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Load on SportyBet ({activeCode})</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    <div className="space-y-1 max-h-44 overflow-y-auto pt-1">
                      {(msg.generated_slip.legs || []).map((leg: any, i: number) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-white/[0.03] flex items-center justify-between text-[11px]"
                        >
                          <span className="truncate max-w-[180px] sm:max-w-[240px] text-white font-semibold">
                            {leg.match}
                          </span>
                          <span className="text-emerald-400 font-mono font-bold shrink-0 ml-2">
                            {leg.selection} @ {leg.odd}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embedded Edited Slip Card inside Chat */}
                {msg.edited_slip && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-[#070A0E] border border-cyan-500/40 space-y-2.5 shadow-lg">
                    <span className="text-[10px] font-mono font-black text-cyan-400 uppercase">
                      Ticket Modified • {msg.edited_slip.mode}
                    </span>
                    {(msg.edited_slip.slips || []).map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white block">
                            Part #{idx + 1}: {s.legs_count} Legs
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {s.total_odds}x Odds
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(s.booking_code)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs flex items-center gap-1 hover:bg-cyan-500/30 transition cursor-pointer"
                          >
                            <span>{s.booking_code}</span>
                            {copiedCode === s.booking_code ? (
                              <Check className="w-3 h-3 text-cyan-300" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-[9.5px] font-mono text-slate-500 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2.5 sm:gap-3 max-w-[85%] mr-auto">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070A0E] border border-white/10 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Analyzing models & consulting sport brains...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 sm:px-4 py-2 bg-[#070A0E]/80 border-t border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
          Try:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="text-[11px] font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded-lg border border-white/10 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-2.5 sm:p-3 bg-[#070A0E] border-t border-white/10 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type e.g. 'Build 10 odds slip' or 'Why this pick?'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-[#11161F] border border-white/10 rounded-2xl py-2.5 sm:py-3 px-3.5 sm:px-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black disabled:opacity-30 transition shadow-lg shrink-0 active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CopilotTab;
