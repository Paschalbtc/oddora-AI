"use client";

import React, { useState, useEffect } from "react";
import {
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
  ArrowUpRight,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  RefreshCw,
  Plus,
  ClipboardList,
  Clock,
  Layers,
} from "lucide-react";
import { UserTier } from "../Navbar";
import { useBetSlip } from "@/context/BetSlipContext";
import { useAuth } from "@/context/AuthContext";
import { LiveWinningSlipsTicker } from "../LiveWinningSlipsTicker";
import { saveUserTicket } from "@/lib/userTicketTracker";

export interface HomeDailyOddsTabProps {
  currentTier: UserTier;
  onNavigateTab: (tab: any) => void;
  onOpenUpgradeModal: () => void;
}

interface OddsCategoryConfig {
  id: string;
  pillLabel: string;
  tierName: string;
  targetOdds: number;
  matchSlipTypes: string[];
  minOdds: number;
  maxOdds: number;
  badge: string;
  badgeStyle: string;
  description: string;
  tierLock: "FREE" | "PRO" | "PREMIUM";
}

const PRESET_TIERS: OddsCategoryConfig[] = [
  {
    id: "2_odds",
    pillLabel: "2 Odds",
    tierName: "2 Odds (Daily Banker)",
    targetOdds: 2.0,
    matchSlipTypes: ["BANKER_2X"],
    minOdds: 1.8,
    maxOdds: 2.5,
    badge: "DAILY BANKER",
    badgeStyle: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    description: "Highest statistical win-probability ticket. Perfect for consistent daily compounding.",
    tierLock: "FREE",
  },
  {
    id: "3_odds",
    pillLabel: "3 Odds",
    tierName: "3 Odds Daily Ticket",
    targetOdds: 3.0,
    matchSlipTypes: ["DAILY_3X"],
    minOdds: 2.5,
    maxOdds: 3.8,
    badge: "VALUE MULTIPLIER",
    badgeStyle: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    description: "Balanced mathematical model with 3 to 4 high-confidence value selections.",
    tierLock: "PRO",
  },
  {
    id: "5_odds",
    pillLabel: "5 Odds",
    tierName: "5 Odds Daily Ticket",
    targetOdds: 5.0,
    matchSlipTypes: ["DAILY_4X", "DAILY_5X"],
    minOdds: 3.8,
    maxOdds: 7.5,
    badge: "TACTICAL ACCUMULATOR",
    badgeStyle: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
    description: "Curated 4 to 5 match ticket covering favorable double chance & goal markets.",
    tierLock: "PRO",
  },
  {
    id: "20_odds",
    pillLabel: "20 Odds",
    tierName: "20 Odds Daily Ticket",
    targetOdds: 20.0,
    matchSlipTypes: ["DAILY_10X", "DAILY_20X"],
    minOdds: 7.5,
    maxOdds: 35.0,
    badge: "HIGH-YIELD SPREAD",
    badgeStyle: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    description: "Accelerated multiplier engineered across top European & global leagues.",
    tierLock: "PRO",
  },
  {
    id: "50_odds",
    pillLabel: "50 Odds",
    tierName: "50 Odds Daily Ticket",
    targetOdds: 50.0,
    matchSlipTypes: ["DAILY_50X"],
    minOdds: 35.0,
    maxOdds: 75.0,
    badge: "PRO ACCELERATOR",
    badgeStyle: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    description: "High-multiplier accumulator tailored for disciplined weekend and mid-week slips.",
    tierLock: "PRO",
  },
  {
    id: "100_odds",
    pillLabel: "100 Odds",
    tierName: "100 Odds Daily Ticket",
    targetOdds: 100.0,
    matchSlipTypes: ["DAILY_100X"],
    minOdds: 75.0,
    maxOdds: 150.0,
    badge: "CENTURION JACKPOT",
    badgeStyle: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    description: "Centurion jackpot ticket with deep analytical match filtering and odds compounding.",
    tierLock: "PREMIUM",
  },
  {
    id: "200_odds",
    pillLabel: "200 Odds",
    tierName: "200 Odds Daily Ticket",
    targetOdds: 200.0,
    matchSlipTypes: ["DAILY_200X"],
    minOdds: 150.0,
    maxOdds: 999.0,
    badge: "TITAN MULTIPLIER",
    badgeStyle: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/50",
    description: "Top-tier high-odds accumulator for premium VIP punters chasing maximum returns.",
    tierLock: "PREMIUM",
  },
];

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
  const [copiedManualId, setCopiedManualId] = useState<string | null>(null);
  const [expandedSlips, setExpandedSlips] = useState<Record<string, boolean>>({});
  const [manualFallbackOpen, setManualFallbackOpen] = useState<Record<string, boolean>>({});
  const [selectedOddsCategory, setSelectedOddsCategory] = useState<string>("all");

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

  const handleCopyCode = (
    code: string,
    ticketMeta?: {
      tierName?: string;
      targetOdds?: number;
      actualOdds?: number;
      legs?: any[];
    }
  ) => {
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

    // Auto-save user ticket
    if (ticketMeta) {
      saveUserTicket({
        booking_code: code,
        total_odds: ticketMeta.actualOdds || ticketMeta.targetOdds || 2.0,
        target_odds: ticketMeta.targetOdds,
        title: ticketMeta.tierName || "Daily Accumulator Ticket",
        legs: ticketMeta.legs || [],
        source: "DAILY_PRESET",
      });
    }
  };

  const handleCopyManualList = (
    tierName: string,
    targetOdds: number,
    actualOdds: number,
    sportyCode: string,
    legs: any[]
  ) => {
    if (!requireAuth(undefined, "Please create an account or sign in to copy match selections")) {
      return;
    }

    // Auto-save user ticket
    saveUserTicket({
      booking_code: sportyCode || "ODDORA-LIST",
      total_odds: actualOdds || targetOdds || 2.0,
      target_odds: targetOdds,
      title: tierName,
      legs: legs || [],
      source: "MANUAL_PICKS_LIST",
    });

    const lines = [
      `ODDORA AI — ${tierName}`,
      `Target Odds: ${targetOdds}x | Actual Total Odds: ${actualOdds}x`,
      sportyCode ? `SportyBet Booking Code: ${sportyCode}` : "",
      "",
      "CURATED PICKS:",
      ...legs.map((leg, i) => {
        const matchName = leg.match || `${leg.home_team || "Home"} vs ${leg.away_team || "Away"}`;
        const selectionName = leg.selection || leg.market || "Selection";
        const oddVal = Number(leg.odd || 1.5).toFixed(2);
        const leagueName = leg.league || "League";
        const timeVal = leg.kickoffTime ? formatTime(leg.kickoffTime) : "Today";
        return `${i + 1}. ${matchName} — ${selectionName} (@ ${oddVal}) | ${leagueName} (${timeVal})`;
      }),
      "",
      "Generated by Oddora AI — Quantitative Sports Suite (https://oddora.ai)",
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedManualId(tierName);
    setTimeout(() => setCopiedManualId(null), 2500);
  };

  const toggleExpand = (id: string) => {
    setExpandedSlips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleManualFallback = (id: string) => {
    setManualFallbackOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to match a pre-set tier with an API slip
  const findSlipForTier = (tier: OddsCategoryConfig) => {
    // 1. Direct slip_type match
    const byType = slips.find((s) => tier.matchSlipTypes.includes(s.slip_type));
    if (byType) return byType;

    // 2. Target odds exact match
    const byTarget = slips.find((s) => Number(s.target_odds) === tier.targetOdds);
    if (byTarget) return byTarget;

    // 3. Actual odds proximity match
    const byOdds = slips.find(
      (s) => Number(s.actual_odds) >= tier.minOdds && Number(s.actual_odds) <= tier.maxOdds
    );
    if (byOdds) return byOdds;

    return null;
  };

  const visibleTiers =
    selectedOddsCategory === "all"
      ? PRESET_TIERS
      : PRESET_TIERS.filter((t) => t.id === selectedOddsCategory);

  const formatTime = (isoString?: string) => {
    if (!isoString) return "Today";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Today";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* =========================================================================
          BEGINNER QUICK-START ONBOARDING BANNER (Streamlined Hero)
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-emerald-500/15 dark:via-[#11161F] dark:to-[#11161F] border-2 border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              <span>HOW TO PLAY & WIN TODAY</span>
            </div>
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
              Pre-Made Daily Accumulators (2x to 200x)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
              1. Choose an odds category below — our <strong className="text-emerald-600 dark:text-emerald-400">2 Odds Daily Banker</strong> is 100% free daily.
              <br />
              2. Tap <strong className="text-red-600 dark:text-red-400">"Copy SportyBet Code"</strong> to load in seconds, or view the <strong className="text-cyan-600 dark:text-cyan-400">Manual Booking List</strong> to review every match.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={() => onNavigateTab("guide")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-black" />
            <span>Platform Guide</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          VERIFIED PERFORMANCE SNAPSHOT (Compact Tracker Header)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-emerald-500/30 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
              Bankers Win Rate
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                {resultsSummary.bankers_win_rate}%
              </span>
              <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.2 rounded font-mono">
                {resultsSummary.won_slips}/{resultsSummary.total_graded_slips}
              </span>
            </div>
          </div>
          <Flame className="w-5 h-5 text-emerald-500 shrink-0" />
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-cyan-500/30 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase block">
              Free Tips Accuracy
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                {resultsSummary.free_tips_win_rate}%
              </span>
              <span className="text-[9.5px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 px-1.5 py-0.2 rounded font-mono">
                High Floor
              </span>
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-cyan-500 shrink-0" />
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-amber-500/30 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase block">
              Overall Platform Win Rate
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                {resultsSummary.overall_win_rate}%
              </span>
              <span className="text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded font-mono">
                {resultsSummary.won_matches}/{resultsSummary.total_graded_matches} Picks
              </span>
            </div>
          </div>
          <Award className="w-5 h-5 text-amber-500 shrink-0" />
        </div>
      </div>

      {/* Real-Time Live Winning Slips Marquee Ticker */}
      <LiveWinningSlipsTicker />

      {/* =========================================================================
          STICKY HORIZONTAL PILL / TAB SELECTOR (7 Target Odds Categories)
         ========================================================================= */}
      <div className="sticky top-16 z-20 py-2.5 bg-slate-50/95 dark:bg-[#070A0E]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 -mx-3 px-3 sm:-mx-4 sm:px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedOddsCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              selectedOddsCategory === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs font-black"
                : "bg-white dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10"
            }`}
          >
            All 7 Tiers
          </button>

          {PRESET_TIERS.map((tier) => {
            const isSelected = selectedOddsCategory === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedOddsCategory(tier.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500 text-black font-black shadow-xs"
                    : "bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10"
                }`}
              >
                <span>{tier.pillLabel}</span>
                {tier.id === "2_odds" && (
                  <span className="text-[9px] px-1 py-0.2 rounded font-black bg-emerald-700 text-white dark:bg-black/30 dark:text-emerald-300">
                    FREE
                  </span>
                )}
                {tier.tierLock === "PREMIUM" && (
                  <Crown className="w-3 h-3 text-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          PRE-GENERATED READY-MADE ACCUMULATOR FEED (Exact 7 Tiers Only)
         ========================================================================= */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Ready-Made Daily Accumulators
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified daily slips with genuine SportyBet booking codes & manual fallback breakdown.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSlips}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Refresh Slips"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 shadow-xs dark:shadow-lg">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Loading today's pre-made accumulator tiers & SportyBet codes...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {visibleTiers.map((tierConfig) => {
              const matchedSlip = findSlipForTier(tierConfig);
              const isBanker = tierConfig.id === "2_odds";
              const isLocked =
                (tierConfig.tierLock === "PRO" && currentTier === "FREE") ||
                (tierConfig.tierLock === "PREMIUM" && currentTier !== "PREMIUM");

              const legs = matchedSlip?.legs || [];
              const actualOdds = matchedSlip?.actual_odds || tierConfig.targetOdds;
              const targetOdds = matchedSlip?.target_odds || tierConfig.targetOdds;
              const sportyCode = matchedSlip?.sporty_code || (isLocked ? "LOCK-VIP" : "SPORTY-CODE");
              const sportyUrl =
                matchedSlip?.share_url ||
                `https://www.sportybet.com/ng/?shareCode=${sportyCode}`;

              const isExpanded = !!expandedSlips[tierConfig.id];
              const isManualOpen = !!manualFallbackOpen[tierConfig.id];

              return (
                <div
                  key={tierConfig.id}
                  className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#11161F] border transition-all shadow-xs flex flex-col justify-between ${
                    isBanker
                      ? "border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/30"
                      : isLocked
                      ? "border-slate-200 dark:border-white/10"
                      : "border-slate-300 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/25"
                  }`}
                >
                  <div>
                    {/* Header Row: Target Badge + Tier Tag + Lock Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        {/* Target Tier Badge */}
                        <span
                          className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full border ${tierConfig.badgeStyle}`}
                        >
                          {tierConfig.tierName}
                        </span>

                        {isBanker && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>FREE DAILY ACCESS</span>
                          </span>
                        )}

                        {isLocked && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                            <Lock className="w-3.5 h-3.5" />
                            <span>{tierConfig.tierLock} PLAN REQUIRED</span>
                          </span>
                        )}
                      </div>

                      {/* Match Count & Sports Info */}
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                        <span>{legs.length > 0 ? `${legs.length} Matches` : "Curated Selection"}</span>
                      </div>
                    </div>

                    {/* Title, Multiplier & Accumulated Odds Display */}
                    <div className="mt-3.5 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {matchedSlip?.slip_title || tierConfig.tierName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {tierConfig.description}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Target: <strong className="font-mono text-slate-700 dark:text-slate-200">{targetOdds.toFixed(2)}x</strong>
                          </span>
                          <span className="text-slate-300 dark:text-white/20">•</span>
                          <span className="text-slate-700 dark:text-slate-200">
                            Actual Total Odds:{" "}
                            <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-black">
                              {actualOdds.toFixed(2)}x
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Large Odds Display */}
                      <div className="text-right shrink-0">
                        <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {actualOdds.toFixed(2)}x
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Odds</span>
                      </div>
                    </div>

                    {/* Curated Matches List */}
                    <div className="mt-4 space-y-2">
                      {legs.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                          <p className="font-bold">Generating today's matches for {tierConfig.pillLabel}...</p>
                          <p className="text-[11px]">Click Refresh above or check back shortly.</p>
                        </div>
                      ) : (
                        legs.slice(0, isExpanded ? legs.length : 3).map((leg: any, idx: number) => {
                          const legLocked = isLocked && idx > 0;
                          const legId =
                            leg.match_id ||
                            `daily_${tierConfig.id}_${idx}_${(leg.match || "").replace(/\s+/g, "_")}`;
                          const inSlip = isInSlip(legId);
                          const matchTitle =
                            leg.match || `${leg.home_team || "Home"} vs ${leg.away_team || "Away"}`;

                          return (
                            <div
                              key={idx}
                              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-white/15 transition gap-2"
                            >
                              <div className="truncate min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs sm:text-sm">
                                    {legLocked ? "🔒 Locked VIP Match" : matchTitle}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  <span className="truncate">{leg.league || "Premier Division"}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 shrink-0 font-mono">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTime(leg.kickoffTime)}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <div className="text-right">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs block">
                                    {legLocked ? "🔒 VIP" : leg.selection || leg.market || "Win"}
                                  </span>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                    {legLocked ? "VIP" : `@ ${Number(leg.odd || 1.5).toFixed(2)}`}
                                  </div>
                                </div>

                                {!legLocked && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        !requireAuth(
                                          undefined,
                                          "Please create a free account or sign in to add selections to your Bet Slip cart"
                                        )
                                      ) {
                                        return;
                                      }
                                      const teams = matchTitle.split(" vs ");
                                      toggleLeg({
                                        id: legId,
                                        eventId: leg.eventId || legId,
                                        sport: (leg.sport || "FOOTBALL").toUpperCase(),
                                        league: leg.league || "Premier Division",
                                        homeTeam: teams[0] || leg.home_team || "Home",
                                        awayTeam: teams[1] || leg.away_team || "Away",
                                        selection: leg.selection || "Win",
                                        market: leg.market || "Match Winner",
                                        odds: Number(leg.odd) || 1.45,
                                        kickoffTime: leg.kickoffTime,
                                        sportybetSelection: leg.sportybetSelection,
                                      });
                                    }}
                                    title={inSlip ? "Remove from Bet Slip" : "Add to Bet Slip"}
                                    className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 font-bold text-[11px] shrink-0 active:scale-95 cursor-pointer ${
                                      inSlip
                                        ? "bg-emerald-500 text-black font-black shadow-xs ring-1 ring-emerald-500/50"
                                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
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
                        })
                      )}

                      {legs.length > 3 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(tierConfig.id)}
                          className="w-full py-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1 transition rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <span>Show Less</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>+{legs.length - 3} More Matches in Ticket</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions Section: One-Tap SportyBet Copy + Load + Manual Fallback */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/10 space-y-3">
                    {isLocked ? (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-amber-800 dark:text-amber-200 block">
                              {tierConfig.tierLock} VIP Access Required
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                              Unlock all matches & verified SportyBet booking code
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onOpenUpgradeModal}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition active:scale-95 shrink-0 cursor-pointer shadow-sm"
                        >
                          Unlock Ticket
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Verified Booking Code Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/30">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#E51D25] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                              SB
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono uppercase text-red-700 dark:text-red-400 font-bold block">
                                SportyBet Booking Code
                              </span>
                              <span className="font-mono font-black text-slate-900 dark:text-white text-base tracking-wider truncate block">
                                {sportyCode}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* One-Tap Copy SportyBet Code Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyCode(sportyCode, {
                                  tierName: tierConfig.tierName,
                                  targetOdds: tierConfig.targetOdds,
                                  actualOdds: actualOdds,
                                  legs: legs,
                                })
                              }
                              className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 transition flex items-center justify-center gap-1.5 text-xs font-black shadow-xs active:scale-95 cursor-pointer"
                              title="Copy SportyBet Code to Clipboard"
                            >
                              {copiedCode === sportyCode ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    Copied!
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                  <span>Copy Code</span>
                                </>
                              )}
                            </button>

                            {/* One-Click Load in SportyBet */}
                            <a
                              href={sportyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-3.5 rounded-xl bg-[#E51D25] hover:bg-[#c91820] text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95"
                              title="Open ticket directly on SportyBet"
                            >
                              <span>1-Click Load</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Manual Booking Fallback Section */}
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleManualFallback(tierConfig.id)}
                            className="w-full p-2.5 px-3 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                              <span>Manual Booking Fallback List ({legs.length} Matches)</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <span>{isManualOpen ? "Hide Details" : "View & Copy Picks"}</span>
                              {isManualOpen ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </button>

                          {isManualOpen && (
                            <div className="p-3 pt-0 border-t border-slate-200/60 dark:border-white/5 space-y-2 mt-2">
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  Use this plain-text list if you prefer entering selections manually:
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyManualList(
                                      tierConfig.tierName,
                                      targetOdds,
                                      actualOdds,
                                      sportyCode,
                                      legs
                                    )
                                  }
                                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedManualId === tierConfig.tierName ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Copied Matches!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Plain-Text Picks</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar font-mono text-[11px] bg-white dark:bg-black/30 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                                {legs.map((leg: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-start justify-between gap-2 py-0.5 border-b border-slate-100 dark:border-white/5 last:border-none"
                                  >
                                    <span className="truncate">
                                      {idx + 1}. {leg.match || `${leg.home_team} vs ${leg.away_team}`}
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                      {leg.selection || leg.market} (@ {Number(leg.odd || 1.5).toFixed(2)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeDailyOddsTab;
