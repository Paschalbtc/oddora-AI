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
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Award,
} from "lucide-react";
import { UserTier } from "../Navbar";
import { getOutcomesForSport } from "@/lib/highProbabilityOutcomes";
import { useBetSlip, CartLeg } from "@/context/BetSlipContext";
import { useAuth } from "@/context/AuthContext";

export interface SlipBuilderTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
}

export const SlipBuilderTab: React.FC<SlipBuilderTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
}) => {
  const { addLegs, setIsOpen: setSlipOpen } = useBetSlip();
  const { isAuthenticated, requireAuth } = useAuth();

  // Step 1: Sport Category (Strictly sports only, NO banker here)
  const [sportType, setSportType] = useState<string>("all");

  // Step 2: Builder Strategy Mode (Pure Safe Banker vs Auto Sweet-Spot)
  const [strategyMode, setStrategyMode] = useState<"PURE_BANKER" | "SWEET_SPOT">("PURE_BANKER");

  // Step 3: Target Multiplier
  const [isAutoOdds, setIsAutoOdds] = useState<boolean>(false);
  const [targetOdds, setTargetOdds] = useState<string>("10");

  // Step 4: Match Count Mode
  const [matchCountMode, setMatchCountMode] = useState<"AUTO" | "CUSTOM">("AUTO");
  const [customMatchCount, setCustomMatchCount] = useState<number>(5);

  // Step 5: Allowed Bet Markets
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["all"]);

  // Additional options
  const [dateHorizon, setDateHorizon] = useState<"today" | "14_days" | "30_days">("today");
  const [bookmaker, setBookmaker] = useState<"SPORTYBET" | "BET9JA">("SPORTYBET");

  // Execution state
  const [isSolving, setIsSolving] = useState(false);
  const [resultSlip, setResultSlip] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const isProOrPremium = currentTier === "PRO" || currentTier === "PREMIUM";

  // Isolated betting markets for the selected sport category
  const currentSportOutcomes = getOutcomesForSport(sportType);
  const freeMarkets = currentSportOutcomes.filter((o) => o.tierAccess === "FREE");
  const advancedMarkets = currentSportOutcomes.filter(
    (o) => o.tierAccess === "PRO" || o.tierAccess === "PREMIUM"
  );

  const quickOddsPresets = [
    { label: "2x", val: 2 },
    { label: "3x", val: 3 },
    { label: "5x", val: 5 },
    { label: "10x", val: 10 },
    { label: "20x", val: 20 },
    { label: "50x", val: 50 },
    { label: "100x", val: 100 },
    { label: "500x", val: 500 },
    { label: "5,000x", val: 5000 },
    { label: "20,000x", val: 20000 },
  ];

  const toggleMarket = (marketId: string, isAdvanced: boolean) => {
    if (isAdvanced && !isProOrPremium) {
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

  const handleGenerate = async (oddsOverride?: number) => {
    if (!requireAuth(undefined, "Please create a free account or sign in to generate customized accumulator slips")) {
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
        body: JSON.stringify({
          sport_type: sportType,
          strategy_mode: strategyMode,
          is_auto_odds: isAutoOdds,
          allowed_markets: selectedMarkets,
          match_count_mode: matchCountMode,
          custom_match_count: customMatchCount,
          target_odds: isAutoOdds ? 10 : finalOdds,
          date_horizon: dateHorizon,
          bookmaker,
          user_tier: currentTier,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Failed to solve accumulator slip.");
      }

      setResultSlip(json.data);
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
  };

  const handleCopyBet9ja = () => {
    if (!requireAuth(undefined, "Please sign up or sign in to copy Bet9ja coupon codes")) return;
    if (!resultSlip) return;
    const raw = resultSlip.bet9ja_code || resultSlip.bet9jaCode || "B9BUILDER";
    const clean = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    navigator.clipboard.writeText(clean);
    setCopiedCode("b9_builder");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleAddAllToFloatingSlip = () => {
    if (!requireAuth(undefined, "Please create an account or sign in to add accumulator legs to your slip")) return;
    if (!resultSlip || !resultSlip.legs || resultSlip.legs.length === 0) return;

    const cartLegs: CartLeg[] = resultSlip.legs.map((leg: any, idx: number) => ({
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

  const sportyCode = resultSlip?.sporty_code || resultSlip?.booking_code;
  const bet9jaCode = resultSlip?.bet9ja_code;
  const sportyUrl =
    resultSlip?.sporty_url ||
    (sportyCode ? `https://www.sportybet.com/ng/?shareCode=${sportyCode}` : "");
  const bet9jaUrl = "https://sports.bet9ja.com";

  const getSafetyGradeDetails = (gradeStr?: string, avgProb: number = 85) => {
    const g = (gradeStr || "").toUpperCase();
    if (g.includes("A+") || avgProb >= 88) {
      return {
        badge: "👑 A+ Banker Floor (88%+ Avg Win Rate)",
        description:
          "Ultra-safe accumulator composed of defensive double-chance and floor handicap pivots.",
        badgeClasses: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
        containerClasses: "border-emerald-500/40 bg-emerald-950/10",
      };
    }
    if (g.includes("A ") || g === "A HIGH VALUE" || avgProb >= 82) {
      return {
        badge: "🛡️ A High Value (82%–88% Avg Win Rate)",
        description: "High-value portfolio with robust statistical support.",
        badgeClasses: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
        containerClasses: "border-cyan-500/40 bg-cyan-950/10",
      };
    }
    return {
      badge: "⚖️ B+ Balanced Accumulator (76%–82% Avg Win Rate)",
      description: "Balanced multiplier ticket optimized for yield.",
      badgeClasses: "bg-amber-500/20 text-amber-300 border-amber-500/50",
      containerClasses: "border-amber-500/40 bg-amber-950/10",
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
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>5-Stage High-Win-Rate Portfolio Engine • Engine 3</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Custom Slip & Multiplier Builder
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure your 5-stage portfolio parameters to solve the highest-probability ticket with exact target odds.
          </p>
        </div>

        {/* Tier chip */}
        <div className="shrink-0">
          <span className="text-xs font-bold text-slate-300 bg-[#11161F] px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-sm">
            {!isProOrPremium ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Max 15x Free Solver Active</span>
              </>
            ) : (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentTier} • 20,000x Max Solver Active</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Date Horizon Quick Filter Bar */}
      <div className="p-3 rounded-2xl bg-[#0D121C] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
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

      {/* 5-Step Solver Controls Panel */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#11161F] border border-white/10 shadow-2xl space-y-6">
        {/* =========================================================================
            STEP 1: SELECT SPORT CATEGORY (Sports only, NO Banker here)
           ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                1
              </span>
              <span>Step 1: Select Sport Category</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400 capitalize">
              {sportType === "all" ? "All 4 Sports Portfolio" : sportType.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: "all", label: "🌐 All Sports" },
              { id: "football", label: "⚽ Football" },
              { id: "basketball", label: "🏀 Basketball" },
              { id: "table_tennis", label: "🏓 Table Tennis" },
              { id: "volleyball", label: "🏐 Volleyball" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSportType(s.id);
                  setSelectedMarkets(["all"]);
                }}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition border ${
                  sportType === s.id
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-black shadow-md"
                    : "bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            STEP 2 (NEW): SELECT BUILDER STRATEGY MODE (Strictly 2 Options)
           ========================================================================= */}
        <div className="space-y-3 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                2
              </span>
              <span>Step 2: Select Builder Strategy Mode</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {strategyMode === "PURE_BANKER" ? "🛡️ Pure Safe Banker Active" : "⚡ Sweet-Spot Active"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Card 1: Pure Safe Banker */}
            <button
              type="button"
              onClick={() => setStrategyMode("PURE_BANKER")}
              className={`p-4 rounded-2xl border text-left transition relative ${
                strategyMode === "PURE_BANKER"
                  ? "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/40 shadow-lg"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <span>🛡️ Pure Safe Banker</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ≥ 85% PROB FLOOR
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Highest-probability defensive floor. Stacks safe Double Chance, Over 1.5, DNB, Set Handicap and Buffer Spread legs to hit your exact target multiplier.
              </p>
            </button>

            {/* Card 2: Auto Sweet-Spot */}
            <button
              type="button"
              onClick={() => setStrategyMode("SWEET_SPOT")}
              className={`p-4 rounded-2xl border text-left transition relative ${
                strategyMode === "SWEET_SPOT"
                  ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/40 shadow-lg"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <span>⚡ Auto Sweet-Spot (1.18 – 1.40 Odds)</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  BALANCED DIVERSITY
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Mathematical multi-market diversity. Compounds optimal 1.18–1.40 odds per leg to achieve balanced multi-outcome portfolios with top mathematical yield.
              </p>
            </button>
          </div>
        </div>

        {/* =========================================================================
            STEP 3: CHOOSE TARGET MULTIPLIER (Auto Odds first, presets 2x-20,000x, custom)
           ========================================================================= */}
        <div className="space-y-3 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                3
              </span>
              <span>Step 3: Choose Target Multiplier</span>
            </label>
            <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
              {isAutoOdds ? "Auto Sweet-Spot" : `${targetOdds}x Odds`}
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

          {/* Custom odds input */}
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1.5"
              max="20000"
              step="0.5"
              value={isAutoOdds ? "" : targetOdds}
              onChange={(e) => {
                setIsAutoOdds(false);
                setTargetOdds(e.target.value);
              }}
              placeholder={isAutoOdds ? "Auto Odds Active (e.g. 10x - 25x)" : "Custom multiplier e.g. 5000"}
              className="w-full bg-[#070A0E] border border-white/10 rounded-xl py-2.5 px-4 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* =========================================================================
            STEP 4: MATCH COUNT MODE (Auto Match Count vs Custom Match Count)
           ========================================================================= */}
        <div className="space-y-3 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                4
              </span>
              <span>Step 4: Match Count</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {matchCountMode === "AUTO" ? "Optimal Algorithm Legs" : `${customMatchCount} Games Fixed`}
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
                {[3, 5, 10, 15, 25, 35, 50].map((cnt) => (
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
                  max="50"
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
            STEP 5: ALLOWED BET MARKETS (Balanced Multi-Outcome Diversity)
           ========================================================================= */}
        <div className="space-y-3 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-black">
                5
              </span>
              <span>Step 5: Allowed Bet Markets</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {selectedMarkets.includes("all")
                ? "All markets active (Balanced Diversity Cap)"
                : `${selectedMarkets.length} selected`}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleMarket("all", false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  selectedMarkets.includes("all")
                    ? "bg-emerald-500 text-black border-emerald-400 font-black"
                    : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                All Markets (Balanced Diversity)
              </button>

              {freeMarkets.map((m) => {
                const isSelected = selectedMarkets.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMarket(m.id, false)}
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

              {advancedMarkets.map((m) => {
                const isSelected = selectedMarkets.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMarket(m.id, true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-sm"
                        : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    <span>{m.outcomeName}</span>
                    {!isProOrPremium && <Lock className="w-3 h-3 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Primary Bookmaker:</span>
            <div className="flex items-center gap-1 bg-[#070A0E] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setBookmaker("SPORTYBET")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  bookmaker === "SPORTYBET"
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                SportyBet
              </button>
              <button
                type="button"
                onClick={() => setBookmaker("BET9JA")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  bookmaker === "BET9JA"
                    ? "bg-green-500/20 text-green-400 border border-green-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Bet9ja
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isSolving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm uppercase tracking-wider transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSolving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Running 5-Stage Solver...</span>
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
      {resultSlip && (
        <div className="rounded-3xl bg-[#11161F] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in duration-300">
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
                  {resultSlip.safety_grade || "A High Value"}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {resultSlip.safety_grade_desc || "Optimized Multiplier"}
                </span>
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>Solved {resultSlip.legs_count}-Leg High-Win-Rate Slip</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: {resultSlip.target_odds_requested}x | Actual Combined:{" "}
                <span className="text-emerald-400 font-bold">{resultSlip.actual_combined_odds}x</span>{" "}
                ({resultSlip.odds_accuracy_ratio} precision)
              </p>
            </div>

            {/* Quick Actions: Add to Bet Slip Cart + Booking Codes */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {/* Add All to Persistent Floating Slip Button */}
              <button
                type="button"
                onClick={handleAddAllToFloatingSlip}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  addedToCart
                    ? "bg-[#10B981] text-black font-black"
                    : "bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/40"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>[+ Add All to Slip]</span>
                  </>
                )}
              </button>

              {/* SportyBet Code Button */}
              {sportyCode && (
                <button
                  type="button"
                  onClick={() => handleCopy(sportyCode)}
                  className="py-2 px-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-mono font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                >
                  {copiedCode === sportyCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sporty: {sportyCode}</span>
                    </>
                  )}
                </button>
              )}

              {/* Bet9ja Code Button */}
              {bet9jaCode && (
                <button
                  type="button"
                  onClick={handleCopyBet9ja}
                  className="py-2 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                >
                  {copiedCode === "b9_builder" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Bet9ja: {bet9jaCode}</span>
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
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition"
                  title="Load directly on SportyBet"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Solved Leg Rows */}
          <div className="divide-y divide-white/5">
            {resultSlip.legs?.map((leg: any, idx: number) => (
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
                      <span className="text-xs font-bold text-white">{leg.match}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{leg.league || "Premier League"}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-300">{leg.market}</span>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlipBuilderTab;
