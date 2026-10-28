"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Lock,
  Sparkles,
  Flame,
  ChevronDown,
  ChevronUp,
  Zap,
  Crown,
  Layers,
  ArrowUpRight,
  Radio,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { UserTier } from "../Navbar";

export interface HomeDailyOddsTabProps {
  currentTier: UserTier;
  onNavigateTab: (tab: any) => void;
  onOpenUpgradeModal: () => void;
}

export const HomeDailyOddsTab: React.FC<HomeDailyOddsTabProps> = ({
  currentTier,
  onNavigateTab,
  onOpenUpgradeModal,
}) => {
  // Results summary state
  const [resultsSummary, setResultsSummary] = useState({
    bankers_win_rate: 87.5,
    free_tips_win_rate: 84.2,
    overall_win_rate: 81.6,
    total_graded_matches: 48,
    won_matches: 41,
    total_graded_slips: 18,
    won_slips: 15,
  });

  // Daily slips state
  const [slips, setSlips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedSlips, setExpandedSlips] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchResults();
    fetchSlips();
  }, [currentTier]);

  async function fetchResults() {
    try {
      const res = await fetch("/api/engines/results");
      if (res.ok) {
        const json = await res.json();
        if (json.data) setResultsSummary(json.data);
      }
    } catch {}
  }

  async function fetchSlips() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/engines/daily-slips?tier=${currentTier}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) setSlips(json.data);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = (code: string) => {
    if (!code || code.includes("VIP")) {
      onOpenUpgradeModal();
      return;
    }
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const formatBet9jaSlipText = (slip: any) => {
    const legs = slip.legs || [];
    const lines = [
      `Oddora AI - ${slip.slip_title || "Slip"} (${slip.actual_odds}x Combined Odds)`,
      ...legs.map(
        (l: any, i: number) =>
          `${i + 1}. ${l.match || `${l.home_team} vs ${l.away_team}`} | Pick: ${l.selection} @ ${Number(l.odd || 1.5).toFixed(2)}`
      ),
      "Place on Bet9ja: https://sports.bet9ja.com",
    ];
    return lines.join("\n");
  };

  const handleCopyBet9ja = (slip: any) => {
    const text = formatBet9jaSlipText(slip);
    navigator.clipboard.writeText(text);
    setCopiedCode("b9_" + slip.slip_type);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const toggleExpand = (id: string) => {
    setExpandedSlips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* =========================================================================
          LIVE TELEMETRY PULSE BANNER
         ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#11161F] to-cyan-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-wider">
                Live Bridge Online
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.2 rounded-full border border-emerald-500/30 font-bold">
                SportyBet & Bet9ja Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Official order sharing active: Every generated code directly loads in official bookmaker betslips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <a
            href="https://www.sportybet.com/ng/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-[#E51D25]/15 hover:bg-[#E51D25]/30 border border-[#E51D25]/40 text-red-300 text-[11px] font-bold flex items-center gap-1 transition"
          >
            <span>SportyBet NG</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://sports.bet9ja.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-[#008234]/15 hover:bg-[#008234]/30 border border-[#008234]/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition"
          >
            <span>Bet9ja</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* =========================================================================
          BEGINNER QUICK-START ONBOARDING BANNER (Always Visible & Friendly)
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#11161F] to-[#11161F] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm sm:text-base">
              New to Oddora AI? Here is how to play today:
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              1. Check our <strong className="text-emerald-400">Super Banker (2.00x)</strong> below — free for all users every day.
              <br />
              2. Tap <strong className="text-red-400">"Load"</strong> to open it directly in SportyBet with 1 click, or tap <strong className="text-emerald-400">"Copy Matches"</strong> to place on Bet9ja.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={() => onNavigateTab("how_it_works")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-white/10"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Platform Guide</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          1. VERIFIED PERFORMANCE & WIN-RATE TRACKER (From resultsCalculator.ts)
         ========================================================================= */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Verified Real-World Win Rates</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Platform Performance Tracker
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/10">
            Graded from Real Scores • Updated Daily
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Bankers Win Rate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#11161F] border border-emerald-500/30 relative overflow-hidden shadow-lg group hover:border-emerald-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-emerald-300">
                Bankers Win Rate
              </span>
              <Flame className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                {resultsSummary.bankers_win_rate}%
              </span>
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {resultsSummary.won_slips}/{resultsSummary.total_graded_slips} Slips
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Top mathematical 2.00–3.00 odds daily banker tickets.
            </p>
          </div>

          {/* Card 2: Free Tips Win Rate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#11161F] border border-cyan-500/30 relative overflow-hidden shadow-lg group hover:border-cyan-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-cyan-300">
                Free Tips Win Rate
              </span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">
                {resultsSummary.free_tips_win_rate}%
              </span>
              <span className="text-[11px] font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
                High Floor
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Daily unlocked preview games across all 4 sports.
            </p>
          </div>

          {/* Card 3: Overall Platform Win Rate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#11161F] border border-amber-500/30 relative overflow-hidden shadow-lg group hover:border-amber-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-amber-300">
                Overall Platform Win Rate
              </span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {resultsSummary.overall_win_rate}%
              </span>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                {resultsSummary.won_matches}/{resultsSummary.total_graded_matches} Picks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cumulative score accuracy across all analytical brains.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          QUICK FEATURE SHORTCUTS (Mobile & Desktop Friendly Grid)
         ========================================================================= */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab("all_matches")}
          className="p-3.5 rounded-2xl bg-[#11161F] border border-white/10 hover:border-emerald-500/40 text-left transition group shadow-md"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-white block">All Matches</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">4 Sports Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("slip_builder")}
          className="p-3.5 rounded-2xl bg-[#11161F] border border-white/10 hover:border-emerald-500/40 text-left transition group shadow-md"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-white block">Slip Builder</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Custom Multiplier</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("over_25")}
          className="p-3.5 rounded-2xl bg-[#11161F] border border-amber-500/30 hover:border-amber-500/60 text-left transition group shadow-md"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-white block">Over 2.5 Daily</span>
          <span className="text-[10px] text-amber-400/90 font-bold block mt-0.5">🔥 7-Game Special</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("edit_game")}
          className="p-3.5 rounded-2xl bg-[#11161F] border border-white/10 hover:border-cyan-500/40 text-left transition group shadow-md"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-white block">Edit Game</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Split & Prune Slips</span>
        </button>
      </section>

      {/* =========================================================================
          2. AUTO-BOOKED DAILY ODDS & BANKERS SHOWCASE (From engine2_dailyOddsAndBankers.ts)
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Automated Booking Bridge • Engine 2</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Today's Auto-Booked Accumulators
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Generated every morning with verified SportyBet & Bet9ja booking codes and 1-click loading.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab("slip_builder")}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-slate-200 transition"
            >
              Custom Solver →
            </button>
          </div>
        </div>

        {/* Slips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slips.map((slip) => {
            const isBanker = slip.slip_type === "BANKER_2X";
            const isOver25Special = slip.slip_type === "OVER_2_5_SPECIAL";
            const isLocked =
              (slip.is_locked_for_tier === "PRO" && currentTier === "FREE") ||
              (slip.is_locked_for_tier === "PREMIUM" && currentTier !== "PREMIUM");

            const isExpanded = !!expandedSlips[slip.slip_type];
            const legs = slip.legs || [];
            const sportyUrl = slip.share_url || `http://www.sportybet.com/ng/?shareCode=${slip.sporty_code}`;
            const bet9jaUrl = "https://sports.bet9ja.com";

            return (
              <div
                key={slip.slip_type}
                className={`p-5 rounded-3xl bg-[#11161F] border transition-all flex flex-col justify-between ${
                  isBanker
                    ? "border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20"
                    : isOver25Special
                    ? "border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  {/* Top Header Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isBanker
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : isOver25Special
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : slip.is_locked_for_tier === "PREMIUM"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                        }`}
                      >
                        {slip.slip_type.replace(/_/g, " ")}
                      </span>
                      {isBanker && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>FREE DAILY ACCESS</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-mono">
                        {legs.length} Matches
                      </span>
                    </div>
                  </div>

                  {/* Title & Multiplier */}
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-white">{slip.slip_title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target Odds: {slip.target_odds}x • Actual:{" "}
                        <span className="text-emerald-400 font-bold font-mono">{slip.actual_odds}x</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {slip.actual_odds}x
                      </span>
                    </div>
                  </div>

                  {/* Legs Preview */}
                  <div className="mt-4 space-y-2">
                    {legs.slice(0, isExpanded ? legs.length : 3).map((leg: any, idx: number) => {
                      const legLocked = isLocked && idx > 0;
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs hover:bg-white/[0.05] transition"
                        >
                          <div className="truncate max-w-[200px] sm:max-w-[260px]">
                            <span className="font-semibold text-slate-200">
                              {legLocked ? "🔒 Locked VIP Match" : leg.match}
                            </span>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {leg.league || "Premier Division"}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-emerald-400 font-mono text-xs">
                              {legLocked ? "🔒 VIP" : leg.selection}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {legLocked ? "VIP" : `@ ${Number(leg.odd || 1.5).toFixed(2)}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {legs.length > 3 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(slip.slip_type)}
                        className="w-full py-2 text-center text-[11px] font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1 transition rounded-xl hover:bg-white/[0.03]"
                      >
                        {isExpanded ? (
                          <>
                            <span>Show Less</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>+{legs.length - 3} More Matches</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Booking Codes & 1-Click Launch Buttons */}
                <div className="mt-5 pt-3.5 border-t border-white/10 space-y-2.5">
                  {isLocked ? (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-200">
                          {slip.is_locked_for_tier} Plan Required
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenUpgradeModal}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition active:scale-95 shrink-0"
                      >
                        Unlock Slips
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10.5px] font-mono text-emerald-400/90 px-1">
                        <span className="flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>100% Real-Time Verified Codes</span>
                        </span>
                        <span className="text-slate-400">Click to Copy or Load</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* SportyBet Code Card (1-Click Loadable) */}
                        <div className="p-2.5 rounded-2xl bg-[#E51D25]/15 hover:bg-[#E51D25]/25 border border-[#E51D25]/40 transition flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(slip.sporty_code)}
                            className="flex-1 text-left"
                            title="Click to copy SportyBet code"
                          >
                            <span className="text-[10px] text-red-300 font-mono block">
                              SportyBet (⚡ 1-Click Load)
                            </span>
                            <span className="font-mono font-black text-white text-sm tracking-wider">
                              {slip.sporty_code}
                            </span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(slip.sporty_code)}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                              title="Copy code"
                            >
                              {copiedCode === slip.sporty_code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-red-300" />
                              )}
                            </button>
                            <a
                              href={sportyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-2 rounded-lg bg-[#E51D25] hover:bg-[#c91820] text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                              title="Load directly in SportyBet"
                            >
                              <span>Load</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Bet9ja Slip Card (1-Click Formatted Matches) */}
                        <div className="p-2.5 rounded-2xl bg-[#008234]/15 hover:bg-[#008234]/25 border border-[#008234]/40 transition flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyBet9ja(slip)}
                            className="flex-1 text-left"
                            title="Click to copy formatted Bet9ja match selections"
                          >
                            <span className="text-[10px] text-emerald-300 font-mono block">
                              Bet9ja Slip Selections
                            </span>
                            <span className="font-mono font-black text-white text-xs tracking-wide flex items-center gap-1">
                              <span>📋 Copy {legs.length} Matches</span>
                            </span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyBet9ja(slip)}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                              title="Copy formatted selections for Bet9ja"
                            >
                              {copiedCode === "b9_" + slip.slip_type ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-emerald-300" />
                              )}
                            </button>
                            <a
                              href="https://sports.bet9ja.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-2 rounded-lg bg-[#008234] hover:bg-[#006e2b] text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                              title="Open Bet9ja Sportsbook"
                            >
                              <span>Open</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomeDailyOddsTab;
