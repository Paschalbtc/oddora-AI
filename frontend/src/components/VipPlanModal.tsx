"use client";

import React, { useState } from "react";
import { X, Check, Sparkles, Crown, Zap, Copy, CheckCircle2, Shield, Gift, ArrowRight } from "lucide-react";

interface VipPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: "FREE" | "PRO" | "VIP";
  onSelectPlan: (plan: "FREE" | "PRO" | "VIP") => void;
}

export default function VipPlanModal({
  isOpen,
  onClose,
  currentPlan,
  onSelectPlan,
}: VipPlanModalProps) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [refCode, setRefCode] = useState("ODDORA-VIP-8842");

  if (!isOpen) return null;

  const referralUrl = `https://oddora.ai/ref/${refCode}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-[#0B0F17] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5" />
            <span>Oddora VIP Membership & Affiliate Program</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Unlock High-Win-Rate Poisson Intelligence
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Switch plans below to test or unlock all predicted scorelines, 3 daily 2.00x bankers, VIP-only betting markets, and copyable SportyBet/Bet9ja booking codes.
          </p>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* FREE PLAN */}
          <div
            className={`flex flex-col justify-between p-5 rounded-2xl border transition-all ${
              currentPlan === "FREE"
                ? "bg-slate-900/90 border-emerald-500/50 ring-2 ring-emerald-500/20"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                  FREE TIER
                </span>
                {currentPlan === "FREE" && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-white mb-1">$0</div>
              <div className="text-xs text-slate-500 mb-4">Standard public access</div>
              <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Top 5 sample match scorelines today</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>1 Daily Algorithm Ready Slip</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Standard 1X2 & Over/Under 1.5 & 2.5 markets</span>
                </li>
                <li className="flex items-start gap-2 text-slate-500 line-through">
                  <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <span>3 Daily 2.00x Bankers</span>
                </li>
                <li className="flex items-start gap-2 text-slate-500 line-through">
                  <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <span>Corners, Cards, DNB & Asian Handicap</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                onSelectPlan("FREE");
                onClose();
              }}
              disabled={currentPlan === "FREE"}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition ${
                currentPlan === "FREE"
                  ? "bg-slate-800 text-slate-400 cursor-default"
                  : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
            >
              {currentPlan === "FREE" ? "Current Plan" : "Switch to Free"}
            </button>
          </div>

          {/* PRO PLAN */}
          <div
            className={`flex flex-col justify-between p-5 rounded-2xl border transition-all ${
              currentPlan === "PRO"
                ? "bg-slate-900/90 border-cyan-500/50 ring-2 ring-cyan-500/20"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  PRO ANALYST
                </span>
                {currentPlan === "PRO" && (
                  <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-white mb-1">
                $19 <span className="text-xs text-slate-400 font-normal">/ mo</span>
              </div>
              <div className="text-xs text-slate-500 mb-4">Serious punters & traders</div>
              <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>All today's matches & predicted scores</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>All 4 Algorithm Ready Slips (3x - 50x)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>2 Daily Banker Slips (SportyBet codes)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Draw No Bet (DNB) & BTTS markets</span>
                </li>
                <li className="flex items-start gap-2 text-slate-500 line-through">
                  <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <span>Tomorrow & Next 2 Days Fixtures</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                onSelectPlan("PRO");
                onClose();
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition ${
                currentPlan === "PRO"
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30"
              }`}
            >
              {currentPlan === "PRO" ? "Current Active Plan" : "Switch / Upgrade to Pro"}
            </button>
          </div>

          {/* VIP ELITE PLAN */}
          <div
            className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all ${
              currentPlan === "VIP"
                ? "bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/60 ring-2 ring-amber-500/30"
                : "bg-gradient-to-b from-amber-950/20 via-slate-900/60 to-slate-900/40 border-amber-500/30 hover:border-amber-500/50"
            }`}
          >
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black tracking-wider uppercase shadow-md">
              Most Popular
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> VIP ELITE
                </span>
                {currentPlan === "VIP" && (
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-amber-400 mb-1">
                $49 <span className="text-xs text-slate-400 font-normal">/ mo</span>
              </div>
              <div className="text-xs text-amber-300/70 mb-4">Maximum mathematical edge</div>
              <ul className="space-y-2.5 text-xs text-slate-200 mb-6">
                <li className="flex items-start gap-2 font-medium text-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>100% UNLOCKED: Today, Tomorrow & +2 Days</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>All 3 Daily Bankers (2.00x–3.00x Odds)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Dual SportyBet & Bet9ja Booking Codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Corners, Cards, Handicaps & 1st Half Goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Custom Slip Builder up to 20,000x Odds</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Unlimited AI Copilot & Edit Slip Audits</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                onSelectPlan("VIP");
                onClose();
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                currentPlan === "VIP"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-950/50"
              }`}
            >
              <Crown className="w-4 h-4" />
              {currentPlan === "VIP" ? "Current Active Plan (VIP)" : "Activate VIP Access Now"}
            </button>
          </div>
        </div>

        {/* 30% Affiliate Referral Section */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/20 rounded-2xl p-5 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <Gift className="w-4 h-4" />
                <span>30% RECURRING LIFETIME AFFILIATE COMMISSION</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Earn Passive Income by Sharing Oddora AI
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mt-1">
                Share your personalized referral link with your community or betting groups. You receive 30% recurring payout on every monthly VIP renewal made by your referred members.
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
              <div className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-black/60 border border-slate-700 text-xs text-slate-300 font-mono select-all truncate max-w-xs">
                {referralUrl}
              </div>
              <button
                onClick={handleCopyRef}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
              >
                {copiedRef ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
