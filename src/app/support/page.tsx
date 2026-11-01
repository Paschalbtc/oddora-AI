"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BetSlipProvider } from "@/context/BetSlipContext";
import {
  Mail,
  Headphones,
  Check,
  Copy,
  Send,
  HelpCircle,
  Clock,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

function SupportPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState(user?.email || "");
  const [ticketCategory, setTicketCategory] = useState("Subscription & VIP Billing");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNavigate = (tab: any) => {
    router.push(`/?tab=${tab}`);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail.trim() || !ticketMessage.trim()) return;

    const subject = encodeURIComponent(`[Oddora Support] [${ticketCategory}] ${ticketName || "User Inquiry"}`);
    const body = encodeURIComponent(
      `Name: ${ticketName || "N/A"}\nEmail: ${ticketEmail}\nCategory: ${ticketCategory}\nUser ID: ${user?.id || "N/A"}\n\nMessage:\n${ticketMessage}`
    );
    window.open(`mailto:support@oddora-ai.vercel.app?cc=support@paschalattah.xyz&subject=${subject}&body=${body}`, "_blank");

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setTicketMessage("");
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070A0E] text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar
        activeTab={"home" as any}
        onTabChange={handleNavigate}
        currentTier="FREE"
        onTierChange={() => {}}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold mb-3">
            <Headphones className="w-3.5 h-3.5" />
            <span>24/7 CUSTOMER SUPPORT & HELPDESK</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            How Can We Assist You?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Oddora AI is an independent quantitative sports analytics SaaS. Our team is available 24/7 for subscription assistance, booking code support, and feature questions.
          </p>
        </div>

        {/* Expected Response Time Pill */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shadow-xs mb-6">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
            <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Official Response Time:</span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            ⚡ Under 2 Hours (VIP Subscribers) • 24 Hours Standard
          </span>
        </div>

        {/* Support Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Primary Support Email</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                For subscription inquiries, account management, and bug reports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
                support@oddora-ai.vercel.app
              </span>
              <button
                type="button"
                onClick={() => handleCopyEmail("support@oddora-ai.vercel.app")}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Copy Email"
              >
                {copiedEmail === "support@oddora-ai.vercel.app" ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Executive Desk</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Direct developer and executive contact for partnerships and escalations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
                support@paschalattah.xyz
              </span>
              <button
                type="button"
                onClick={() => handleCopyEmail("support@paschalattah.xyz")}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Copy Email"
              >
                {copiedEmail === "support@paschalattah.xyz" ? (
                  <Check className="w-4 h-4 text-cyan-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* In-Platform Ticket Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-sm mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                Submit an Online Support Ticket
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send your message directly to our dedicated helpdesk team.
              </p>
            </div>
          </div>

          {isSubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
              <Check className="w-5 h-5 shrink-0" />
              <span>Ticket submitted successfully! We will contact you via email shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={ticketEmail}
                    onChange={(e) => setTicketEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Inquiry Category *
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Subscription & VIP Billing">Subscription & VIP Billing</option>
                  <option value="SportyBet Booking Code Issue">SportyBet Booking Code Issue</option>
                  <option value="Prediction Model & Market Question">Prediction Model & Market Question</option>
                  <option value="Bug Report or Technical Support">Bug Report or Technical Support</option>
                  <option value="General Inquiries">General Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Your Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition shadow-md flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Ticket</span>
              </button>
            </form>
          )}
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-cyan-500" />
            <h2 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Platform Policies & Frequently Asked Questions
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 space-y-1.5 shadow-xs">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">
              Can users deposit or withdraw funds directly on Oddora AI?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No. Oddora AI is an independent quantitative sports analytics SaaS platform, NOT a bookmaker. We do not accept bets, hold customer wallets/deposits, or process withdrawals. All generated booking codes are analytical tools for use on licensed bookmakers like SportyBet or Bet9ja.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 space-y-1.5 shadow-xs">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">
              How do I use generated SportyBet booking codes?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Whenever you generate or view an accumulator slip, simply click the <strong>[Copy Code]</strong> button or the red <strong>[Load on SportyBet]</strong> button to populate your bet slip in seconds.
            </p>
          </div>
        </div>
      </main>

      <Footer onNavigateTab={handleNavigate} />
    </div>
  );
}

export default function SupportPage() {
  return (
    <AuthProvider>
      <BetSlipProvider>
        <SupportPageContent />
      </BetSlipProvider>
    </AuthProvider>
  );
}

