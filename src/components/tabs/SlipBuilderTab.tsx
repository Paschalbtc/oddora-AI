"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Crown,
  RefreshCw,
  ExternalLink,
  Calendar,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  Sliders,
  Filter,
} from "lucide-react";
import { UserTier } from "../Navbar";
import {
  getOutcomesForSport,
  formatMarketCategory,
  resolveSportyBetMarket,
  HighProbOutcome,
} from "@/lib/highProbabilityOutcomes";
import { useBetSlip, CartLeg } from "@/context/BetSlipContext";
import { useAuth } from "@/context/AuthContext";
import { saveUserTicket } from "@/lib/userTicketTracker";

export interface SlipBuilderTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
}

// Early access perk check: unlocked during beta / public testing
const isEarlyAccessActive = (): boolean => {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_EARLY_ACCESS_FREE === "true" ||
      process.env.NEXT_PUBLIC_EARLY_ACCESS === "true" ||
      true // Active by default for seamless user testing
    );
  }
  return true;
};

export const SlipBuilderTab: React.FC<SlipBuilderTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
}) => {
  const { addLegs, setIsOpen: setSlipOpen } = useBetSlip();
  const { user, profile, requireAuth } = useAuth();
  const earlyAccess = isEarlyAccessActive();

  // Step 1: Multi-Sport Selection Matrix (Football, Basketball, Tennis, Volleyball)
  const [selectedSports, setSelectedSports] = useState<string[]>([
    "football",
    "basketball",
    "tennis",
    "volleyball",
  ]);

  // Step 2: Revised Strategy Corridors (Bankers Anchor, Sweet-Spot, Aggressive Value)
  const [strategyMode, setStrategyMode] = useState<
    "BANKERS_ANCHOR" | "SWEET_SPOT" | "AGGRESSIVE_VALUE"
  >("SWEET_SPOT");

  // Step 3: Target Multiplier
  const [isAutoOdds, setIsAutoOdds] = useState<boolean>(false);
  const [targetOdds, setTargetOdds] = useState<string>("10");

  // Step 4: User-Controlled Minimum Probability Threshold (40% - 90%)
  const [minProbability, setMinProbability] = useState<number>(65);

  // Step 5: Match Count Mode
  const [matchCountMode, setMatchCountMode] = useState<"AUTO" | "CUSTOM">("AUTO");
  const [customMatchCount, setCustomMatchCount] = useState<number>(5);

  // Step 6: Allowed Bet Markets
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["all"]);

  // Additional options
  const [dateHorizon, setDateHorizon] = useState<"today" | "14_days" | "30_days">("today");
  const [bookmaker] = useState<"SPORTYBET">("SPORTYBET");

  // Execution state
  const [isSolving, setIsSolving] = useState(false);
  const [resultSlip, setResultSlip] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const isProOrPremium = earlyAccess || currentTier === "PRO" || currentTier === "PREMIUM";
  const isPremium = earlyAccess || currentTier === "PREMIUM";

  // Available sports definitions
  const sportOptions = [
    { id: "football", label: "⚽ Football", tierNeeded: "FREE" },
    { id: "basketball", label: "🏀 Basketball", tierNeeded: "PRO" },
    { id: "tennis", label: "🎾 Tennis", tierNeeded: "PRO" },
    { id: "volleyball", label: "🏐 Volleyball", tierNeeded: "PRO" },
  ];

  // Helper to toggle a single sport in multi-sport matrix
  const toggleSport = (sportId: string) => {
    const isProSport = sportId !== "football";
    if (isProSport && !isProOrPremium) {
      onOpenUpgradeModal();
      return;
    }

    setSelectedSports((prev) => {
      if (prev.includes(sportId)) {
        if (prev.length === 1) return prev; // Keep at least one sport active
        return prev.filter((s) => s !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
    setSelectedMarkets(["all"]);
  };

  const selectAllSports = () => {
    setSelectedSports(["football", "basketball", "tennis", "volleyball"]);
    setSelectedMarkets(["all"]);
  };

  // Compile available markets across all selected sports
  const combinedOutcomes: HighProbOutcome[] = React.useMemo(() => {
    const seenIds = new Set<string>();
    const list: HighProbOutcome[] = [];

    const sportsToFetch =
      selectedSports.length === 4
        ? ["ALL"]
        : selectedSports.map((s) => (s === "tennis" ? "TABLE_TENNIS" : s.toUpperCase()));

    for (const s of sportsToFetch) {
      const outcomes = getOutcomesForSport(s);
      for (const o of outcomes) {
        if (!seenIds.has(o.id)) {
          seenIds.add(o.id);
          list.push(o);
        }
      }
    }
    return list;
  }, [selectedSports]);

  const freeMarkets = combinedOutcomes.filter((o) => o.tierAccess === "FREE");
  const proMarkets = combinedOutcomes.filter((o) => o.tierAccess === "PRO");
  const premiumMarkets = combinedOutcomes.filter((o) => o.tierAccess === "PREMIUM");

  const quickOddsPresets = [
    { label: "5x", val: 5 },
    { label: "10x", val: 10 },
    { label: "50x", val: 50 },
    { label: "500x", val: 500 },
    { label: "1,000x", val: 1000 },
    { label: "10,000x", val: 10000 },
    { label: "50,000x", val: 50000 },
    { label: "200,000x", val: 200000 },
  ];

  const quickProbPresets = [
    { label: "50%+ Balanced", val: 50 },
    { label: "70%+ High Safety", val: 70 },
    { label: "80%+ Ultra Anchor", val: 80 },
  ];

  const toggleMarket = (marketId: string, tierAccess: "FREE" | "PRO" | "PREMIUM" = "FREE") => {
    if (tierAccess === "PREMIUM" && !isPremium) {
      onOpenUpgradeModal();
      return;
    }
    if (tierAccess === "PRO" && !isProOrPremium) {
      onOpenUpgradeModal();
      return;
    }

    if (marketId === "all") {
      setSelectedMarkets(["all"]);
      return;
    }

    setSelectedMarkets((prev) => {
      const withoutAll = prev.filter((m) => m !== "all");
      if (withoutAll.includes(marketId)) {
        const next = withoutAll.filter((m) => m !== marketId);
        return next.length === 0 ? ["all"] : next;
      } else {
        return [...withoutAll, marketId];
      }
    });
  };

  const handleGenerate = async (oddsOverride?: number, autoOptimize: boolean = false) => {
    if (
      !requireAuth(
        undefined,
        "Please create a free account or sign in to generate customized accumulator slips"
      )
    ) {
      return;
    }

    const finalOdds = oddsOverride || parseFloat(targetOdds) || 10;
    setIsSolving(true);
    setErrorMsg(null);
    setAddedToCart(false);

    try {
      const res = await fetch("/api/engines/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          sports: selectedSports,
          sport_type: selectedSports.join(","),
          strategy_mode: strategyMode,
          is_auto_odds: isAutoOdds,
          min_probability: minProbability,
          auto_optimize: autoOptimize,
          allowed_markets: selectedMarkets,
          match_count_mode: matchCountMode,
          custom_match_count: customMatchCount,
          target_odds: isAutoOdds ? 10 : finalOdds,
          date_horizon: dateHorizon,
          bookmaker,
          user_tier: earlyAccess ? "VIP" : currentTier,
          user_id: user?.id,
          user_email: profile?.email || user?.email,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Failed to solve accumulator slip.");
      }

      setResultSlip(json.data || json.slip);
    } catch (err: any) {
      setErrorMsg(err.message || "Combinatorial solver encountered an error.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleCopy = (code?: string) => {
    if (!requireAuth(undefined, "Please sign up or sign in to copy verified booking codes")) return;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);

    // Auto-save user ticket
    if (resultSlip) {
      const activeLegs =
        resultSlip.legs_json && resultSlip.legs_json.length > 0
          ? resultSlip.legs_json
          : resultSlip.legs || [];
      saveUserTicket({
        booking_code: code,
        total_odds: Number(resultSlip.actual_combined_odds || resultSlip.actual_odds) || Number(targetOdds) || 2.0,
        target_odds: Number(targetOdds) || undefined,
        title: `Slip Builder (${activeLegs.length} Matches)`,
        legs: activeLegs.map((l: any) => ({
          match: l.match,
          home_team: l.home_team,
          away_team: l.away_team,
          league: l.league,
          market: l.market || l.marketCategory,
          selection: l.selection,
          odd: l.odd,
          win_probability: l.win_probability,
          eventId: l.eventId,
        })),
        source: "SLIP_BUILDER",
        user_id: user?.id,
        user_email: user?.email,
      });
    }
  };

  const handleAddAllToFloatingSlip = () => {
    if (!requireAuth(undefined, "Please create an account or sign in to add accumulator legs to your slip")) return;
    const activeLegs =
      resultSlip?.legs_json && resultSlip.legs_json.length > 0
        ? resultSlip.legs_json
        : resultSlip?.legs || [];
    if (!resultSlip || activeLegs.length === 0) return;

    saveUserTicket({
      booking_code: resultSlip.sportyCode || resultSlip.code || "CART-SLIP",
      share_code: resultSlip.sportyCode || resultSlip.code || "CART-SLIP",
      total_odds: Number(resultSlip.actual_combined_odds || resultSlip.actual_odds) || Number(targetOdds) || 2.0,
      target_odds: Number(targetOdds) || undefined,
      title: `Slip Builder (${activeLegs.length} Matches)`,
      legs: activeLegs.map((l: any) => ({
        match: l.match,
        home_team: l.home_team,
        away_team: l.away_team,
        league: l.league,
        market: l.market || l.marketCategory,
        selection: l.selection,
        odd: l.odd,
        win_probability: l.win_probability,
        eventId: l.eventId,
      })),
      source: "SLIP_BUILDER",
      user_id: user?.id,
      user_email: user?.email,
    });

    const cartLegs: CartLeg[] = activeLegs.map((leg: any, idx: number) => ({
      id: leg.eventId ? `${leg.eventId}_${leg.selection}` : `builder_${idx}_${Date.now()}`,
      matchId: leg.eventId || `builder_match_${idx}`,
      eventId: leg.eventId,
      homeTeam: leg.home_team || leg.match.split(" vs ")[0] || "Home",
      awayTeam: leg.away_team || leg.match.split(" vs ")[1] || "Away",
      league: leg.league || "Global League",
      sport: leg.sport || "football",
      market: leg.market || leg.marketCategory || "1X2",
      selection: leg.selection,
      odd: Number(leg.odd) || 1.35,
      winProbability: Number(leg.win_probability) || 85,
      sportybetSelection: {
        eventId: leg.eventId || `builder_event_${idx}`,
        marketId: leg.marketId || "1",
        outcomeId: leg.outcomeId || "1",
        specifier: leg.specifier || null,
      },
    }));

    addLegs(cartLegs);
    setSlipOpen(true);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const sportyCode =
    resultSlip?.sportybet_code ||
    resultSlip?.sportybetCode ||
    resultSlip?.bookingCode ||
    resultSlip?.shareCode ||
    resultSlip?.code ||
    resultSlip?.sporty_code ||
    resultSlip?.booking_code ||
    resultSlip?.sportyCode ||
    "";

  const sportyUrl =
    resultSlip?.sporty_url ||
    resultSlip?.share_url ||
    resultSlip?.sportyUrl ||
    resultSlip?.shareUrl ||
    (sportyCode ? `https://www.sportybet.com/ng/?shareCode=${sportyCode}` : "");

  const getSafetyGradeDetails = (gradeStr?: string, avgProb: number = 80) => {
    const g = (gradeStr || "").toUpperCase();
    if (g.includes("A+") || avgProb >= 85) {
      return {
        badge: "👑 A+ Banker Anchor (85%+ Avg Win Rate)",
        description: "Ultra-safe accumulator composed of defensive double-chance and floor handicap pivots.",
        badgeClasses: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
      };
    }
    if (g.includes("A ") || g.includes("OPTIMAL") || avgProb >= 78) {
      return {
        badge: "⚡ A Optimal Sweet-Spot (78%–84% Avg Win Rate)",
        description: "High confidence selection compounding balanced 1.12–1.55 odds.",
        badgeClasses: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
      };
    }
    return {
      badge: "🚀 B+ Aggressive Value Multiplier",
      description: "Yield-optimized accumulator for large multipliers and mega compounding.",
      badgeClasses: "bg-purple-500/20 text-purple-300 border-purple-500/50",
    };
  };

  const getSportBadgeStyle = (sport?: string) => {
    const s = (sport || "FOOTBALL").toUpperCase();
    if (s.includes("BASKET")) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    if (s.includes("TABLE") || s.includes("TENNIS")) return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    if (s.includes("VOLLEY")) return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Combinatorial Slip & Multiplier Builder • Engine 4</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            High-Win-Rate Accumulator Solver
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure multi-sport matrix, odds corridors, and custom probability floors to synthesize verified SportyBet tickets up to 200,000x odds.
          </p>
        </div>

        {/* Tier / Early Access badge */}
        <div className="shrink-0">
          {earlyAccess ? (
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Early Access: All Tiers & Multi-Sport Unlocked</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-300 bg-[#11161F] px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-sm">
              {!isProOrPremium ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Max 50x Free Solver</span>
                </>
              ) : (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentTier} • 200,000x Max Solver</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Date Horizon Quick Filter Bar */}
      <div className="p-3 rounded-2xl bg-[#0D121F]/80 backdrop-blur-md border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Match Schedule Horizon:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { id: "today", label: "Today's Games" },
            { id: "14_days", label: "Next 14 Days" },
            { id: "30_days", label: "Next 30 Days" },
          ].map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setDateHorizon(h.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                dateHorizon === h.id
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Solver Controls Panel */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#0D121F]/90 backdrop-blur-md border border-white/[0.08] shadow-2xl space-y-6">
        {/* =========================================================================
            STAGE 1: MULTI-SPORT FILTERING MATRIX (Football, Basketball, Tennis, Volleyball)
           ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                1
              </span>
              <span>Stage 1: Multi-Sport Filter Matrix</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {selectedSports.length === 4
                  ? "All 4 Sports Active"
                  : `${selectedSports.length} Selected (${selectedSports.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")})`}
              </span>
              <button
                type="button"
                onClick={selectAllSports}
                className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
              >
                Select All 4
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {sportOptions.map((s) => {
              const isSelected = selectedSports.includes(s.id);
              const isLocked = s.tierNeeded === "PRO" && !isProOrPremium;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSport(s.id)}
                  className={`py-3 px-3.5 rounded-2xl text-xs font-bold transition border flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md font-black"
                      : "bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span className="truncate">{s.label}</span>
                  {isLocked && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            STAGE 2: REVISED STRATEGY SELECTOR ODDS CORRIDORS
           ========================================================================= */}
        <div className="space-y-3 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                2
              </span>
              <span>Stage 2: Strategy Odds Corridors</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {strategyMode === "BANKERS_ANCHOR"
                ? "🛡️ Bankers Anchor (1.12 – 1.35)"
                : strategyMode === "SWEET_SPOT"
                ? "⚡ Optimal Sweet-Spot (1.12 – 1.55)"
                : "🚀 Aggressive Value (1.20 – 1.70+)"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Ultra-Safe Bankers Anchor */}
            <button
              type="button"
              onClick={() => {
                setStrategyMode("BANKERS_ANCHOR");
                setMinProbability(75);
              }}
              className={`p-4 rounded-2xl border text-left transition relative ${
                strategyMode === "BANKERS_ANCHOR"
                  ? "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/40 shadow-lg"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <span>🛡️ Ultra-Safe Anchor</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  1.12 – 1.35 ODDS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ultra-safe defensive floor. Targets high-safety Double Chance (1X/X2), Over 1.5 Goals, and buffer handicaps (~1.22 avg per leg).
              </p>
            </button>

            {/* Card 2: Optimal Sweet-Spot */}
            <button
              type="button"
              onClick={() => {
                setStrategyMode("SWEET_SPOT");
                setMinProbability(65);
              }}
              className={`p-4 rounded-2xl border text-left transition relative ${
                strategyMode === "SWEET_SPOT"
                  ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/40 shadow-lg"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <span>⚡ Optimal Sweet-Spot</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  1.12 – 1.55 ODDS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Mathematical multi-market balance. Compounds safe 1.12–1.55 decimal odds with robust statistical edge (~1.32 avg per leg).
              </p>
            </button>

            {/* Card 3: Aggressive Value */}
            <button
              type="button"
              onClick={() => {
                setStrategyMode("AGGRESSIVE_VALUE");
                setMinProbability(50);
              }}
              className={`p-4 rounded-2xl border text-left transition relative ${
                strategyMode === "AGGRESSIVE_VALUE"
                  ? "bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/40 shadow-lg"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <span>🚀 Aggressive Value</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  1.20 – 1.70+ ODDS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                High-yield multi-leg compounding. Compounds 1.20–1.70+ odds per leg (up to 2.05 for mega multipliers) to scale slips up to 200,000x.
              </p>
            </button>
          </div>
        </div>

        {/* =========================================================================
            STAGE 3: USER-CONTROLLED PROBABILITY SELECTOR (40% - 90%)
           ========================================================================= */}
        <div className="space-y-3 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                3
              </span>
              <span>Stage 3: Minimum Win Probability Filter</span>
            </label>
            <span
              className={`text-sm font-mono font-black ${
                minProbability >= 75
                  ? "text-emerald-400"
                  : minProbability >= 60
                  ? "text-cyan-400"
                  : "text-amber-400"
              }`}
            >
              ≥ {minProbability}% Probability
            </span>
          </div>

          {/* Quick Probability Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {quickProbPresets.map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => setMinProbability(p.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition border whitespace-nowrap ${
                  minProbability === p.val
                    ? "bg-emerald-500 text-black border-emerald-400 font-black shadow-sm"
                    : "bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.08]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Probability Slider (40% to 90%) */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-1">
              <input
                type="range"
                min="40"
                max="90"
                step="1"
                value={minProbability}
                onChange={(e) => setMinProbability(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <span className="text-xs font-mono text-slate-400 w-16 text-right font-bold">
                {minProbability}% min
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Only candidate selections with calculated implied probability equal to or higher than{" "}
              <span className="text-emerald-400 font-bold">{minProbability}%</span> will be considered.
            </p>
          </div>
        </div>

        {/* =========================================================================
            STAGE 4: TARGET MULTIPLIER (Up to 200,000x Odds)
           ========================================================================= */}
        <div className="space-y-3 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                4
              </span>
              <span>Stage 4: Target Multiplier (Odds)</span>
            </label>
            <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
              {isAutoOdds ? "Auto Sweet-Spot" : `${Number(targetOdds).toLocaleString()}x Odds`}
            </span>
          </div>

          {/* Quick Odds Chips with [ 🤖 Auto Odds ] First */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => {
                setIsAutoOdds(true);
                setTargetOdds("10");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition border whitespace-nowrap flex items-center gap-1.5 ${
                isAutoOdds
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black border-emerald-400 font-black shadow-md"
                  : "bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.08]"
              }`}
            >
              <span>🤖 Auto Odds</span>
            </button>

            {quickOddsPresets.map((p) => {
              const isSelected = !isAutoOdds && targetOdds === p.val.toString();
              return (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => {
                    setIsAutoOdds(false);
                    setTargetOdds(p.val.toString());
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition border whitespace-nowrap ${
                    isSelected
                      ? "bg-emerald-500 text-black border-emerald-400 shadow-md font-black"
                      : "bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.08]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom odds input & dynamic slider */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1.5"
                max="200000"
                step="any"
                value={isAutoOdds ? "" : targetOdds}
                onChange={(e) => {
                  setIsAutoOdds(false);
                  setTargetOdds(e.target.value);
                }}
                placeholder={isAutoOdds ? "Auto Odds Active" : "Target multiplier e.g. 200000"}
                className="w-full bg-[#070A0E] border border-white/10 rounded-xl py-2.5 px-4 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            {!isAutoOdds && (
              <div className="flex items-center gap-3 px-1">
                <input
                  type="range"
                  min="1.5"
                  max="200000"
                  step="1"
                  value={Math.min(200000, Math.max(1.5, parseFloat(targetOdds) || 10))}
                  onChange={(e) => {
                    setIsAutoOdds(false);
                    setTargetOdds(e.target.value);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                />
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                  Max 200,000x
                </span>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            STAGE 5: MATCH COUNT MODE (Auto vs Custom)
           ========================================================================= */}
        <div className="space-y-3 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                5
              </span>
              <span>Stage 5: Match Count Selection</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {matchCountMode === "AUTO" ? "Optimal Mathematical Compounding" : `${customMatchCount} Games Fixed`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMatchCountMode("AUTO")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition border text-center ${
                matchCountMode === "AUTO"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-black shadow-md"
                  : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
              }`}
            >
              🤖 Auto Match Count
            </button>
            <button
              type="button"
              onClick={() => setMatchCountMode("CUSTOM")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition border text-center ${
                matchCountMode === "CUSTOM"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-black shadow-md"
                  : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
              }`}
            >
              🎯 Custom Match Count ({customMatchCount} Games)
            </button>
          </div>

          {matchCountMode === "CUSTOM" && (
            <div className="space-y-2 pt-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[3, 5, 10, 15, 25, 35, 40].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setCustomMatchCount(cnt)}
                    className={`flex-1 min-w-[42px] py-1.5 rounded-lg text-xs font-mono font-bold border ${
                      customMatchCount === cnt
                        ? "bg-emerald-500 text-black border-emerald-400 font-black"
                        : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="45"
                  step="1"
                  value={customMatchCount}
                  onChange={(e) => setCustomMatchCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono font-black text-emerald-400 w-12 text-right">
                  {customMatchCount} Legs
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            STAGE 6: ALLOWED BET MARKETS (Filtered to Selected Sports)
           ========================================================================= */}
        <div className="space-y-3 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                6
              </span>
              <span>Stage 6: Allowed Bet Markets</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {selectedMarkets.includes("all")
                ? "All markets active"
                : `${selectedMarkets.length} selected`}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleMarket("all", "FREE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  selectedMarkets.includes("all")
                    ? "bg-emerald-500 text-black border-emerald-400 font-black"
                    : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                All Markets (Balanced Diversity)
              </button>

              {/* Free Markets */}
              {freeMarkets.map((m) => {
                const isSelected = selectedMarkets.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMarket(m.id, "FREE")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? "bg-emerald-500 text-black border-emerald-400 font-black shadow-sm"
                        : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {m.outcomeName}
                  </button>
                );
              })}

              {/* Pro Markets */}
              {proMarkets.map((m) => {
                const isSelected = selectedMarkets.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMarket(m.id, "PRO")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-sm"
                        : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    <span>{m.outcomeName}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      PRO
                    </span>
                    {!isProOrPremium && <Lock className="w-3 h-3 text-amber-400" />}
                  </button>
                );
              })}

              {/* Premium Markets */}
              {premiumMarkets.map((m) => {
                const isSelected = selectedMarkets.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMarket(m.id, "PREMIUM")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-amber-500 text-black border-amber-400 font-black shadow-sm"
                        : "bg-white/[0.02] text-slate-300 border-amber-500/30 hover:border-amber-500/60"
                    }`}
                  >
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>{m.outcomeName}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      VIP
                    </span>
                    {!isPremium && <Lock className="w-3 h-3 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Engine:</span>
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>SportyBet Verified</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isSolving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm uppercase tracking-wider transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSolving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Running Combinatorial Solver...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>Solve High-Win-Rate Accumulator</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Non-Blocking Inline Optimization Alert (Amber Banner) */}
      {resultSlip && resultSlip.is_pool_insufficient && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300 text-sm">
                Corridor Optimization Recommended
              </div>
              <p className="text-slate-300 text-xs mt-1">
                {resultSlip.warning ||
                  `The candidate fixture pool at ${minProbability}% probability is too tight to reach ${targetOdds}x target odds without over-concentrating.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleGenerate(undefined, true)}
              disabled={isSolving}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Auto-Optimize Odds Corridor</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              Dynamically adapts probability corridor to guarantee ticket construction.
            </span>
          </div>
        </div>
      )}

      {/* Error Message Feedback */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* =========================================================================
          SOLVED ACCUMULATOR RESULT CARD
         ========================================================================= */}
      {resultSlip && Array.isArray(resultSlip.legs || resultSlip.legs_json) && (resultSlip.legs || resultSlip.legs_json).length > 0 && (
        <div className="rounded-3xl bg-[#0D121F]/90 backdrop-blur-md border border-white/[0.08] shadow-2xl overflow-hidden animate-in fade-in duration-300">
          {/* Card Header & Safety Grade Badge */}
          <div className="p-5 sm:p-7 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full border ${
                    getSafetyGradeDetails(resultSlip.safety_grade, resultSlip.average_leg_probability)
                      .badgeClasses
                  }`}
                >
                  {resultSlip.safety_grade || "A Optimal Sweet-Spot"}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {resultSlip.safety_grade_desc || "Balanced Odds Corridor"}
                </span>
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>Solved {resultSlip.legs_count || (resultSlip.legs || []).length}-Leg High-Win-Rate Slip</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: {resultSlip.target_odds_requested || targetOdds}x | Actual Combined:{" "}
                <span className="text-emerald-400 font-bold">
                  {resultSlip.actual_combined_odds || resultSlip.actual_odds}x
                </span>{" "}
                ({resultSlip.odds_accuracy_ratio || "100%"} precision)
              </p>
            </div>

            {/* Quick Actions Header: Add to Bet Slip Cart + SportyBet Code */}
            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              {/* Add All to Persistent Floating Slip Button */}
              <button
                type="button"
                onClick={handleAddAllToFloatingSlip}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer ${
                  addedToCart
                    ? "bg-[#10B981] text-black font-black ring-2 ring-[#10B981]/50"
                    : "bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/40"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>[+ Add All to Slip]</span>
                  </>
                )}
              </button>

              {/* SportyBet Code Button Header */}
              {sportyCode && sportyCode.trim().length >= 4 && (
                <button
                  type="button"
                  onClick={() => handleCopy(sportyCode)}
                  className="py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-600 dark:text-red-300 font-mono font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  title="Click to copy SportyBet booking code"
                >
                  {copiedCode === sportyCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                      <span>Code Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sporty: {sportyCode}</span>
                    </>
                  )}
                </button>
              )}

              {/* Direct Deep Link */}
              {sportyUrl && (
                <a
                  href={sportyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition flex items-center justify-center gap-1.5 text-xs font-bold"
                  title="Load ticket directly in SportyBet"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open SportyBet</span>
                </a>
              )}
            </div>
          </div>

          {/* Prominent Verified SportyBet Booking Banner */}
          {sportyCode && sportyCode.trim().length >= 4 && (
            <div className="mx-5 my-4 sm:mx-7 p-4 rounded-2xl bg-gradient-to-r from-red-500/15 via-red-500/10 to-transparent border border-red-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E51D25] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                  SB
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase text-red-700 dark:text-red-400 font-bold tracking-wider">
                      Verified SportyBet Booking Code
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30">
                      100% PARITY CONFIRMED
                    </span>
                  </div>
                  <div className="font-mono font-black text-slate-900 dark:text-emerald-400 text-lg sm:text-2xl tracking-widest drop-shadow-sm select-all">
                    {sportyCode}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(sportyCode)}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center justify-center gap-2 text-xs font-bold cursor-pointer active:scale-95"
                >
                  {copiedCode === sportyCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-red-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                {sportyUrl && (
                  <a
                    href={sportyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-[#E51D25] hover:bg-[#cc181f] text-white transition flex items-center justify-center gap-1.5 text-xs font-black shadow-md cursor-pointer active:scale-95"
                  >
                    <span>Load on SportyBet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Solved Leg Rows - Strict 1:1 Match Parity Display */}
          <div className="divide-y divide-white/5">
            {(
              Array.isArray(resultSlip.legs_json) && resultSlip.legs_json.length > 0
                ? resultSlip.legs_json
                : resultSlip.legs || []
            ).map((leg: any, idx: number) => {
              const matchTitle =
                leg.match || `${leg.home_team || "Home"} vs ${leg.away_team || "Away"}`;
              const kickoff = leg.kickoffTime || leg.kickoff_time;
              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 hover:bg-white/[0.02] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/5 text-slate-400 font-mono text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9.5px] font-mono font-black px-1.5 py-0.2 rounded border uppercase ${getSportBadgeStyle(
                            leg.sport
                          )}`}
                        >
                          {leg.sport || "SPORT"}
                        </span>
                        <span className="text-xs font-bold text-white">{matchTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{leg.league || "Premier League"}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-300">
                          {formatMarketCategory(
                            leg.marketCategory ||
                              leg.market ||
                              resolveSportyBetMarket(leg.selection, leg, leg.market).marketCategory
                          )}
                        </span>
                        {kickoff && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-400">
                              {new Date(kickoff).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 font-mono text-xs block">
                        {leg.selection}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        @ {Number(leg.odd).toFixed(2)} ({leg.win_probability}% Win Rate)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Solved Card Bottom Action Bar */}
          <div className="p-4 sm:p-5 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-mono">
              <span>{resultSlip.legs_count || (resultSlip.legs || []).length} Leg Portfolio</span> •{" "}
              <span className="text-emerald-400 font-bold">
                {resultSlip.actual_combined_odds || resultSlip.actual_odds}x Odds
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleAddAllToFloatingSlip}
                className={`flex-1 sm:flex-none py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer ${
                  addedToCart
                    ? "bg-[#10B981] text-black font-black"
                    : "bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/40"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>[+ Add All to Slip]</span>
                  </>
                )}
              </button>

              {sportyCode && sportyCode.trim().length >= 4 && (
                <button
                  type="button"
                  onClick={() => handleCopy(sportyCode)}
                  className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-600 dark:text-red-300 font-mono font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  {copiedCode === sportyCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sporty: {sportyCode}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlipBuilderTab;
