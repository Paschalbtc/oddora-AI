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
} from "lucide-react";
import { UserTier } from "../Navbar";

export interface CopilotTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
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
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "👋 Welcome to Oddora AI Copilot! I am connected to all 4 Sport Brains and Product Engines. You can ask me questions about betting markets, command me to solve custom slips (e.g. 'Build 10 odds slip'), or ask me to edit or split your SportyBet/Bet9ja booking codes. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickPrompts = [
    "Build me 5 odds slip with 4 matches",
    "Explain Over 2.5 Goals market",
    "Give me 10 odds Football slip",
    "How does ticket splitting work?",
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, user_tier: currentTier }),
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
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[520px] max-w-4xl mx-auto rounded-3xl bg-[#11161F] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in duration-200">
      {/* Copilot Header */}
      <div className="px-5 py-4 bg-[#070A0E] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-base">Oddora AI Copilot</h3>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                ONLINE • V2 ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-Engine conversational intelligence & automated ticket solver.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-400 bg-white/[0.05] px-3 py-1 rounded-full border border-white/10">
            Tier: <span className="text-emerald-400">{currentTier}</span>
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-slate-700 text-white"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-emerald-600 text-black font-semibold rounded-tr-none shadow-md"
                      : "bg-[#070A0E] text-slate-200 border border-white/10 rounded-tl-none shadow-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Embedded Generated Slip Card inside Chat */}
                {msg.generated_slip && (
                  <div className="p-4 rounded-2xl bg-[#070A0E] border border-emerald-500/40 space-y-3 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <span className="text-[10px] font-mono font-black text-emerald-400 uppercase">
                        {msg.generated_slip.legs_count} Matches • {msg.generated_slip.actual_combined_odds}x Odds
                      </span>
                      <div className="flex gap-2">
                        {msg.generated_slip.sporty_code && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.generated_slip.sporty_code)}
                            className="px-2.5 py-1 rounded-lg bg-[#E51D25]/20 text-white font-mono text-[11px] font-bold flex items-center gap-1 hover:bg-[#E51D25]/30 transition"
                          >
                            <span>Sporty: {msg.generated_slip.sporty_code}</span>
                            {copiedCode === msg.generated_slip.sporty_code ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                        {msg.generated_slip.bet9ja_code && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.generated_slip.bet9ja_code)}
                            className="px-2.5 py-1 rounded-lg bg-[#008234]/20 text-white font-mono text-[11px] font-bold flex items-center gap-1 hover:bg-[#008234]/30 transition"
                          >
                            <span>Bet9ja: {msg.generated_slip.bet9ja_code}</span>
                            {copiedCode === msg.generated_slip.bet9ja_code ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 1-Click Launchers */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {msg.generated_slip.sporty_code && (
                        <a
                          href={
                            msg.generated_slip.sporty_url ||
                            `https://www.sportybet.com/ng/?shareCode=${msg.generated_slip.sporty_code}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2.5 rounded-lg bg-[#E51D25] hover:bg-red-600 text-white font-bold text-[11px] text-center flex items-center justify-center gap-1 transition"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Load SportyBet</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {msg.generated_slip.bet9ja_code && (
                        <a
                          href={
                            msg.generated_slip.bet9ja_url ||
                            `https://sports.bet9ja.com/mobile/coupon?couponCode=${msg.generated_slip.bet9ja_code}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2.5 rounded-lg bg-[#008234] hover:bg-emerald-700 text-white font-bold text-[11px] text-center flex items-center justify-center gap-1 transition"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Load Bet9ja</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto pt-1">
                      {(msg.generated_slip.legs || []).map((leg: any, i: number) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-white/[0.03] flex items-center justify-between text-[11px]"
                        >
                          <span className="truncate max-w-[200px] text-white font-semibold">
                            {leg.match}
                          </span>
                          <span className="text-emerald-400 font-mono font-bold">
                            {leg.selection} @ {leg.odd}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embedded Edited Slip Card inside Chat */}
                {msg.edited_slip && (
                  <div className="p-4 rounded-2xl bg-[#070A0E] border border-cyan-500/40 space-y-3 shadow-lg">
                    <span className="text-[10px] font-mono font-black text-cyan-400 uppercase">
                      Ticket Modified • {msg.edited_slip.mode}
                    </span>
                    {(msg.edited_slip.slips || []).map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">
                            Part #{idx + 1}: {s.legs_count} Legs
                          </span>
                          <div className="text-[10px] text-slate-400">{s.total_odds}x Odds</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(s.booking_code)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs flex items-center gap-1 hover:bg-cyan-500/30 transition"
                          >
                            <span>{s.booking_code}</span>
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-[10px] font-mono text-slate-500 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#070A0E] border border-white/10 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Analyzing models & consulting sport brains...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-[#070A0E]/60 border-t border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
          Suggestions:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="text-[11px] font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded-lg border border-white/10 transition whitespace-nowrap shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 bg-[#070A0E] border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type your betting command or question e.g. 'Build 10 odds slip'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-[#11161F] border border-white/10 rounded-2xl py-3 px-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-30 transition shadow-lg shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CopilotTab;
