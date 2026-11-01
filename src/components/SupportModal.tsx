"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  MessageSquare,
  Headphones,
  Check,
  Copy,
  Send,
  HelpCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState(user?.email || "");
  const [ticketCategory, setTicketCategory] = useState("Subscription & VIP Billing");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail.trim() || !ticketMessage.trim()) return;

    // Trigger formatted mailto
    const subject = encodeURIComponent(`[Oddora Support] [${ticketCategory}] ${ticketName || "User Inquiry"}`);
    const body = encodeURIComponent(
      `Name: ${ticketName || "N/A"}\nEmail: ${ticketEmail}\nCategory: ${ticketCategory}\nUser ID: ${user?.id || "N/A"}\n\nMessage:\n${ticketMessage}`
    );
    window.open(`mailto:support@oddora-ai.vercel.app?cc=support@paschalattah.xyz&subject=${subject}&body=${body}`, "_blank");

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setTicketMessage("");
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg">Oddora AI Support Desk</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  24/7 ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Helpdesk, VIP Billing & Technical Assistance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expected Response Time Pill */}
        <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Response Time:</span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            &lt; 2h (VIP Priority) • 24h Standard
          </span>
        </div>

        {/* Direct Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold">Primary Support Email</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                support@oddora-ai.vercel.app
              </span>
              <button
                type="button"
                onClick={() => handleCopyEmail("support@oddora-ai.vercel.app")}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                title="Copy Email"
              >
                {copiedEmail === "support@oddora-ai.vercel.app" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-bold">Executive Direct Desk</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                support@paschalattah.xyz
              </span>
              <button
                type="button"
                onClick={() => handleCopyEmail("support@paschalattah.xyz")}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                title="Copy Email"
              >
                {copiedEmail === "support@paschalattah.xyz" ? (
                  <Check className="w-3.5 h-3.5 text-cyan-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Support Ticket Submission Form */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 mb-5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-emerald-500" />
            <span>Send Direct Support Ticket</span>
          </h4>

          {isSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Ticket submitted successfully! We will contact you via email shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={ticketEmail}
                    onChange={(e) => setTicketEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Issue Category *
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Subscription & VIP Billing">Subscription & VIP Billing</option>
                  <option value="SportyBet Booking Code Issue">SportyBet Booking Code Issue</option>
                  <option value="Model / Predictions Question">Model / Predictions Question</option>
                  <option value="Bug Report or Technical Support">Bug Report or Technical Support</option>
                  <option value="General Inquiries">General Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Your Message / Inquiry *
                </label>
                <textarea
                  required
                  rows={3}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Support Ticket</span>
              </button>
            </form>
          )}
        </div>

        {/* Clear Platform FAQs */}
        <div className="space-y-2 text-xs">
          <h4 className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
            <span>Essential Platform FAQs</span>
          </h4>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1">
            <strong className="text-slate-900 dark:text-white font-bold block">
              Is Oddora AI a bookmaker or betting operator?
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              No. Oddora AI is an independent quantitative sports analytics and probability modeling SaaS. We do not accept bets, hold customer wallets, or process withdrawals. Booking codes generated are strictly analytical tools for use on licensed platforms like SportyBet.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1">
            <strong className="text-slate-900 dark:text-white font-bold block">
              How do I load generated booking codes?
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Simply tap the green <strong>[Copy]</strong> button next to any code, open SportyBet, tap "Load Code", paste, and your accumulator ticket will populate instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;

