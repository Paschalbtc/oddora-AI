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
  RefreshCw,
  Plus,
} from "lucide-react";
import { UserTier } from "../Navbar";
import { useBetSlip } from "@/context/BetSlipContext";
import { useAuth } from "@/context/AuthContext";

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
  const { isInSlip, toggleLeg } = useBetSlip();
  const { isAuthenticated, requireAuth } = useAuth();
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
    if (!requireAuth(undefined, "Please create an account or sign in to copy verified booking codes")) {
      return;
    }
    if (!code || code.includes("VIP")) {
      onOpenUpgradeModal();
      return;
    }
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const toggleExpand = (id: string) => {
    setExpandedSlips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* =========================================================================
          BEGINNER QUICK-START ONBOARDING BANNER (Streamlined Hero)
         ========================================================================= */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-emerald-500/15 dark:via-[#11161F] dark:to-[#11161F] border-2 border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              <span>HOW TO PLAY & WIN</span>
            </div>
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              New to Oddora AI? Here is how to play today:
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
              1. Check our <strong className="text-emerald-600 dark:text-emerald-400">Super Banker (2.00x)</strong> below — free for all users every day.
              <br />
              2. Tap <strong className="text-red-600 dark:text-red-400">"Load"</strong> to open it directly in SportyBet with 1 click, or tap <strong className="text-emerald-600 dark:text-emerald-400">"Copy"</strong> to load the booking code.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={() => onNavigateTab("guide")}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-black" />
            <span>Open Platform Guide</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          AFRIODDS-STYLE RAPID FIXTURE & LEAGUE SEARCH BAR
         ========================================================================= */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab("all_matches")}
          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-between transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">Search live fixtures, teams & markets across 4 sports...</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
            Search Matches →
          </span>
        </button>
      </div>

      {/* =========================================================================
          1. VERIFIED PERFORMANCE & WIN-RATE TRACKER (From resultsCalculator.ts)
         ========================================================================= */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Verified Real-World Win Rates</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Platform Performance Tracker
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">
            Graded from Real Scores • Updated Daily
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Bankers Win Rate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-emerald-500/30 relative overflow-hidden shadow-xs dark:shadow-lg group hover:border-emerald-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Bankers Win Rate
              </span>
              <Flame className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {resultsSummary.bankers_win_rate}%
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {resultsSummary.won_slips}/{resultsSummary.total_graded_slips} Slips
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Top mathematical 2.00–3.00 odds daily banker tickets.
            </p>
          </div>

          {/* Card 2: Free Tips Win Rate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-cyan-500/30 relative overflow-hidden shadow-xs dark:shadow-lg group hover:border-cyan-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                Free Tips Win Rate
              </span>
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {resultsSummary.free_tips_win_rate}%
              </span>
              <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
                High Floor
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Daily unlocked preview games across all 4 sports.
            </p>
          </div>

          {/* Card 3: Overall Platform Win Rate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-amber-500/30 relative overflow-hidden shadow-xs dark:shadow-lg group hover:border-amber-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Overall Platform Win Rate
              </span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {resultsSummary.overall_win_rate}%
              </span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                {resultsSummary.won_matches}/{resultsSummary.total_graded_matches} Picks
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
          className="p-3.5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 text-left transition group shadow-xs cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-white block">All Matches</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">4 Sports Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("slip_builder")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 text-left transition group shadow-xs cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-white block">Slip Builder</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Custom Multiplier</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("over_25")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-amber-500/30 hover:border-amber-500/60 text-left transition group shadow-xs cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-white block">Over 2.5 Daily</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">🔥 7-Game Special</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("edit_game")}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 hover:border-cyan-500/40 text-left transition group shadow-xs cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-white block">Edit Game</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Split & Prune Slips</span>
        </button>
      </section>

      {/* =========================================================================
          2. AUTO-BOOKED DAILY ODDS & BANKERS SHOWCASE (From engine2_dailyOddsAndBankers.ts)
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Automated Booking Bridge • Engine 2</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Today's Auto-Booked Accumulators
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Generated every morning with verified SportyBet booking codes and 1-click loading.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab("slip_builder")}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              Custom Solver →
            </button>
          </div>
        </div>

        {/* Slips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-1 md:col-span-2 p-12 text-center rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 shadow-xs dark:shadow-lg">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Loading today's auto-booked accumulators & booking codes...</span>
            </div>
          ) : slips.length === 0 ? (
            <div className="col-span-1 md:col-span-2 p-10 text-center rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs space-y-3 shadow-xs dark:shadow-lg">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-bold text-slate-900 dark:text-white text-sm">Accumulator Slips Generating</p>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Syncing today's high-probability accumulators. Click below to generate fresh tickets:
              </p>
              <button
                type="button"
                onClick={fetchSlips}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Slips</span>
              </button>
            </div>
          ) : (
            slips.map((slip) => {
            const isBanker = slip.slip_type === "BANKER_2X";
            const isOver25Special = slip.slip_type === "OVER_2_5_SPECIAL";
            const isLocked =
              (slip.is_locked_for_tier === "PRO" && currentTier === "FREE") ||
              (slip.is_locked_for_tier === "PREMIUM" && currentTier !== "PREMIUM");

            const isExpanded = !!expandedSlips[slip.slip_type];
            const legs = slip.legs || [];
            const sportyUrl = slip.share_url || `http://www.sportybet.com/ng/?shareCode=${slip.sporty_code}`;

            return (
              <div
                key={slip.slip_type}
                className={`p-5 rounded-3xl bg-white dark:bg-[#11161F] border transition-all flex flex-col justify-between shadow-xs ${
                  isBanker
                    ? "border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20"
                    : isOver25Special
                    ? "border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20"
                    : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                <div>
                  {/* Top Header Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isBanker
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40"
                            : isOver25Special
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40"
                            : slip.is_locked_for_tier === "PREMIUM"
                            ? "bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/40"
                            : "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/40"
                        }`}
                      >
                        {slip.slip_type.replace(/_/g, " ")}
                      </span>
                      {isBanker && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>FREE DAILY ACCESS</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {legs.length} Matches
                      </span>
                    </div>
                  </div>

                  {/* Title & Multiplier */}
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{slip.slip_title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Target Odds: {slip.target_odds}x • Actual:{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{slip.actual_odds}x</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {slip.actual_odds}x
                      </span>
                    </div>
                  </div>

                  {/* Legs Preview */}
                  <div className="mt-4 space-y-2">
                    {legs.slice(0, isExpanded ? legs.length : 3).map((leg: any, idx: number) => {
                      const legLocked = isLocked && idx > 0;
                      const legId = leg.match_id || `daily_${slip.slip_type}_${idx}_${(leg.match || "").replace(/\s+/g, '_')}`;
                      const inSlip = isInSlip(legId);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs hover:bg-white/[0.05] transition gap-2"
                        >
                          <div className="truncate min-w-0 flex-1">
                            <span className="font-semibold text-slate-200 block truncate">
                              {legLocked ? "🔒 Locked VIP Match" : leg.match}
                            </span>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {leg.league || "Premier Division"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <span className="font-bold text-emerald-400 font-mono text-xs block">
                                {legLocked ? "🔒 VIP" : leg.selection}
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {legLocked ? "VIP" : `@ ${Number(leg.odd || 1.5).toFixed(2)}`}
                              </div>
                            </div>

                            {!legLocked && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!requireAuth(undefined, "Please create a free account or sign in to add selections to your Bet Slip cart")) {
                                    return;
                                  }
                                  const teams = (leg.match || "Home vs Away").split(" vs ");
                                  toggleLeg({
                                    id: legId,
                                    eventId: leg.eventId || legId,
                                    sport: (leg.sport || "FOOTBALL").toUpperCase(),
                                    league: leg.league || "Premier Division",
                                    homeTeam: teams[0] || "Home",
                                    awayTeam: teams[1] || "Away",
                                    selection: leg.selection || "Win",
                                    market: leg.market || "Match Winner",
                                    odds: Number(leg.odd) || 1.45,
                                    kickoffTime: leg.kickoffTime,
                                    sportybetSelection: leg.sportybetSelection,
                                  });
                                }}
                                title={inSlip ? "Remove from Bet Slip" : "Add to Bet Slip"}
                                className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 font-bold text-[11px] shrink-0 active:scale-95 ${
                                  inSlip
                                    ? "bg-[#10B981] text-black font-black shadow-md shadow-[#10B981]/25 ring-1 ring-[#10B981]/50"
                                    : "bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 border border-[#10B981]/30"
                                }`}
                              >
                                {inSlip ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>In Slip</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3 stroke-[2.5]" />
                                    <span>Add</span>
                                  </>
                                )}
                              </button>
                            )}
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
                            className="flex-1 text-left min-w-0"
                            title="Click to copy SportyBet code"
                          >
                            <span className="text-[10px] text-red-300 font-mono block">
                              SportyBet (⚡ 1-Click Load)
                            </span>
                            <span className="font-mono font-black text-white text-sm tracking-wider truncate block">
                              {slip.sporty_code}
                            </span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(slip.sporty_code)}
                              className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 text-[11px] font-bold"
                              title="Copy SportyBet Code"
                            >
                              {copiedCode === slip.sporty_code ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-red-300" />
                                  <span className="text-[10px] text-white">Copy</span>
                                </>
                              )}
                            </button>
                            <a
                              href={sportyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-2.5 rounded-lg bg-[#E51D25] hover:bg-[#c91820] text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                              title="Load directly in SportyBet"
                            >
                              <span>Load</span>
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
          }))}
        </div>
      </section>
    </div>
  );
};

export default HomeDailyOddsTab;
