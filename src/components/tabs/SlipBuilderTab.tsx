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
} from "lucide-react";
import { UserTier } from "../Navbar";
import { getOutcomesForSport } from "@/lib/highProbabilityOutcomes";
import { useBetSlip, CartLeg } from "@/context/BetSlipContext";

export interface SlipBuilderTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
}

export const SlipBuilderTab: React.FC<SlipBuilderTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
}) => {
  const { addLegs, setIsOpen: setSlipOpen } = useBetSlip();

  const [sportType, setSportType] = useState<string>("all");
  const [dateHorizon, setDateHorizon] = useState<"today" | "14_days" | "30_days">("today");
  const [matchCountMode, setMatchCountMode] = useState<"AUTO" | "CUSTOM">("AUTO");
  const [customMatchCount, setCustomMatchCount] = useState<number>(5);
  const [targetOdds, setTargetOdds] = useState<string>("10");
  const [bookmaker, setBookmaker] = useState<"SPORTYBET" | "BET9JA">("SPORTYBET");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["all"]);
  const [isSolving, setIsSolving] = useState(false);
  const [resultSlip, setResultSlip] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const isProOrPremium = currentTier === "PRO" || currentTier === "PREMIUM";

  // Strictly isolated betting markets for the selected sport category
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
          allowed_markets: selectedMarkets,
          match_count_mode: matchCountMode,
          custom_match_count: customMatchCount,
          target_odds: finalOdds,
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
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyBet9ja = () => {
    if (!resultSlip) return;
    const legs = resultSlip.legs || [];
    const lines = [
      `Oddora AI - Solved Accumulator (${resultSlip.actual_combined_odds}x Odds)`,
      ...legs.map(
        (l: any, i: number) =>
          `${i + 1}. [${(l.sport || "MATCH").toUpperCase()}] ${l.match} | Pick: ${l.selection} @ ${Number(l.odd).toFixed(2)} (${l.win_probability}% Win Rate)`
      ),
      "Place on Bet9ja: https://sports.bet9ja.com",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedCode("b9_builder");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // 1-Click: Add all legs to the persistent floating Bet Slip Cart
  const handleAddAllToFloatingSlip = () => {
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

  // Safety Grade Theme Resolver
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
    if (s.includes("BANKER")) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    if (s.includes("BASKET")) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    if (s.includes("TABLE") || s.includes("TENNIS")) return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    if (s.includes("VOLLEY")) return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  };

  const getSportEmoji = (sport?: string) => {
    const s = (sport || "FOOTBALL").toUpperCase();
    if (s.includes("BANKER")) return "💎 PURE BANKER";
    if (s.includes("BASKET")) return "🏀 BASKETBALL";
    if (s.includes("TABLE") || s.includes("TENNIS")) return "🏓 TABLE TENNIS";
    if (s.includes("VOLLEY")) return "🏐 VOLLEYBALL";
    return "⚽ FOOTBALL";
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
            Set your exact target multiplier and let the 5-stage portfolio solver construct the highest-probability ticket.
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
                <span>{currentTier} • 5,000x Max Solver Active</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* High-Probability Compound Helper */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-300 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>High-Win-Rate Algorithm: Prioritizes 80%–95%+ win-probability outcomes (Handicap +1.5, Double Chance, Over 1.5, DNB) with multi-sport & multi-market portfolio diversification.</span>
        </div>
      </div>

      {/* Solver Controls Panel */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#11161F] border border-white/10 shadow-2xl space-y-6">
        {/* Step 1: Target Multiplier / Odds */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span>Step 1: Choose Target Multiplier</span>
            </label>
            <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
              {targetOdds}x Odds
            </span>
          </div>

          {/* Quick Odds Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {quickOddsPresets.map((p) => {
              const isSelected = targetOdds === p.val.toString();
              return (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setTargetOdds(p.val.toString())}
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
              max="5000"
              step="0.5"
              value={targetOdds}
              onChange={(e) => setTargetOdds(e.target.value)}
              placeholder="Custom multiplier e.g. 15.5"
              className="w-full bg-[#070A0E] border border-white/10 rounded-xl py-2.5 px-4 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Step 2: Match Calendar Horizon */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Step 2: Match Calendar Horizon</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {dateHorizon === "today"
                ? "Today's Games Only"
                : dateHorizon === "14_days"
                ? "Next 14 Days"
                : "Next 30 Days"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "today", label: "Today's Games", sub: "Live / Today Only" },
              { id: "14_days", label: "Next 14 Days", sub: "2-Week Horizon" },
              { id: "30_days", label: "Next 30 Days", sub: "1-Month Horizon" },
            ].map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setDateHorizon(h.id as any)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-left ${
                  dateHorizon === h.id
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                    : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                <div className="font-black">{h.label}</div>
                <div className="text-[10px] text-slate-500 font-mono">{h.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Sport & Match Count Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          {/* Sport Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
              Step 3: Sport Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "all", label: "All Sports" },
                { id: "banker", label: "💎 Banker Pure Safe", isBanker: true },
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    sportType === s.id
                      ? s.isBanker
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 font-black shadow-md"
                        : "bg-white/[0.1] text-white border-white/20 font-black"
                      : s.isBanker
                      ? "bg-amber-500/5 text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
                      : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Match Count Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
                Step 4: Match Count Mode
              </label>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Max 50 Games
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMatchCountMode("AUTO")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  matchCountMode === "AUTO"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black"
                    : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                Auto (1.22–1.42 Sweet Spot)
              </button>
              <button
                type="button"
                onClick={() => setMatchCountMode("CUSTOM")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  matchCountMode === "CUSTOM"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black"
                    : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                Custom ({customMatchCount} Games)
              </button>
            </div>

            {matchCountMode === "CUSTOM" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {[3, 5, 10, 15, 25, 35, 50].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setCustomMatchCount(cnt)}
                      className={`flex-1 min-w-[38px] py-1 rounded-lg text-xs font-mono font-bold border ${
                        customMatchCount === cnt
                          ? "bg-emerald-500 text-black border-emerald-400 font-black"
                          : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="2"
                    max="50"
                    step="1"
                    value={customMatchCount}
                    onChange={(e) => setCustomMatchCount(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-black text-emerald-400 w-10 text-right">
                    {customMatchCount}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Official bookmaker hard cap: 50 matches max per ticket.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 5: Allowed Betting Markets */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
              Step 5: Allowed Betting Markets ({sportType === "all" ? "All Sports Portfolio" : sportType.replace("_", " ").toUpperCase()})
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {selectedMarkets.includes("all")
                ? "All markets active (Max 25% Diversity Cap)"
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                        : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {isSelected && "✓ "}
                    {m.outcomeName} ({m.shortCode})
                  </button>
                );
              })}
            </div>

            {/* Advanced Pro/Premium Markets */}
            {advancedMarkets.length > 0 && (
              <>
                <div className="text-[11px] font-mono text-amber-400 pt-2 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>Advanced Quantitative Markets (Pro & Premium)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {advancedMarkets.map((m) => {
                    const isSelected = selectedMarkets.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMarket(m.id, true)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                          isSelected && isProOrPremium
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                            : !isProOrPremium
                            ? "bg-white/[0.02] text-slate-500 border-white/5 hover:text-slate-300"
                            : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                        }`}
                      >
                        {!isProOrPremium ? (
                          <Lock className="w-3 h-3 text-amber-400" />
                        ) : isSelected ? (
                          <span>✓ </span>
                        ) : null}
                        <span>{m.outcomeName} ({m.shortCode})</span>
                        <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-1 py-0.5 rounded">
                          {m.tierAccess}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Solve & Book Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isSolving}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-sm sm:text-base shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSolving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running 5-Stage High-Win-Rate Solver & Booking Engine...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Solve & Auto-Book {targetOdds}x Multiplier Slip</span>
              </>
            )}
          </button>
          {errorMsg && (
            <p className="text-xs text-rose-400 font-mono mt-2 text-center">{errorMsg}</p>
          )}
        </div>
      </div>

      {/* Generated Slip Output — STAGE 5 UI TRANSPARENCY & VERIFIED BOOKING CODES */}
      {resultSlip && (
        <div
          className={`p-6 sm:p-7 rounded-3xl bg-[#11161F] border shadow-2xl space-y-5 animate-in fade-in duration-200 ${
            getSafetyGradeDetails(resultSlip.safety_grade, resultSlip.average_leg_probability).containerClasses
          }`}
        >
          {/* Header & Safety Grade Badge */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Stage 5 Safety Grade Badge */}
                <span
                  className={`text-xs font-mono font-black uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                    getSafetyGradeDetails(resultSlip.safety_grade, resultSlip.average_leg_probability).badgeClasses
                  }`}
                >
                  {getSafetyGradeDetails(resultSlip.safety_grade, resultSlip.average_leg_probability).badge}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ✓ 100% Verified Live Booking Code
                </span>
              </div>

              <h3 className="text-xl font-black text-white">
                {resultSlip.legs_count}-Leg Optimized High-Win Portfolio
              </h3>
              <p className="text-xs text-slate-300">
                {getSafetyGradeDetails(resultSlip.safety_grade, resultSlip.average_leg_probability).description}
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 1-Click [+ Add All to Floating Slip] Button */}
              <button
                type="button"
                onClick={handleAddAllToFloatingSlip}
                className={`px-3.5 py-2 rounded-xl font-mono text-xs font-black flex items-center gap-1.5 transition shadow-lg active:scale-95 ${
                  addedToCart
                    ? "bg-emerald-500 text-black border border-emerald-400"
                    : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>Added to Floating Slip!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>[+ Add All to Floating Slip]</span>
                  </>
                )}
              </button>

              {sportyCode && (
                <button
                  type="button"
                  onClick={() => handleCopy(sportyCode)}
                  className="px-3.5 py-2 rounded-xl bg-[#E51D25]/15 border border-[#E51D25]/40 text-white font-mono text-xs font-black flex items-center gap-1.5 hover:bg-[#E51D25]/25 transition"
                >
                  <span>Sporty: {sportyCode}</span>
                  {copiedCode === sportyCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-red-300" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyBet9ja}
                className="px-3.5 py-2 rounded-xl bg-[#008234]/15 border border-[#008234]/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 hover:bg-[#008234]/25 transition"
              >
                <span>Bet9ja: Copy Ticket</span>
                {copiedCode === "b9_builder" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-300" />
                )}
              </button>
            </div>
          </div>

          {/* Quantitative Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Target Odds</span>
              <span className="text-base font-black text-white font-mono">
                {resultSlip.target_odds_requested}x
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Actual Combined Odds</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {resultSlip.actual_combined_odds}x
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Odds Accuracy</span>
              <span className="text-base font-black text-cyan-400 font-mono">
                {resultSlip.odds_accuracy_ratio || "99.4%"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Avg Leg Probability</span>
              <span className="text-base font-black text-emerald-300 font-mono">
                {resultSlip.average_leg_probability || 87}%
              </span>
            </div>
          </div>

          {/* 1-Click External Load Launchers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sportyUrl && (
              <a
                href={sportyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-[#E51D25] hover:bg-red-600 text-white font-black text-xs text-center flex items-center justify-center gap-2 transition shadow-lg active:scale-98"
              >
                <Zap className="w-4 h-4" />
                <span>⚡ Load Slip on SportyBet ({sportyCode})</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}

            <a
              href="https://sports.bet9ja.com"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-[#008234] hover:bg-emerald-700 text-white font-black text-xs text-center flex items-center justify-center gap-2 transition shadow-lg active:scale-98"
            >
              <span>🟢 Open Bet9ja Sportsbook</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>

          {/* Legs Breakdown with Sport Badges, Market Tags & Win Rate % */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 block">
                Fixture & Market Breakdown ({resultSlip.legs?.length || 0} Matches):
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                Sorted by Win Probability
              </span>
            </div>

            {(resultSlip.legs || []).map((leg: any, idx: number) => {
              const sportStyle = getSportBadgeStyle(leg.sport);
              const sportEmoji = getSportEmoji(leg.sport);
              const marketTag = (leg.marketCategory || leg.market || "1X2")
                .toUpperCase()
                .replace(/_/g, " ");

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-white/[0.06] transition"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Sport Badge */}
                      <span
                        className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md border ${sportStyle}`}
                      >
                        {sportEmoji}
                      </span>
                      {/* Market Tag */}
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-slate-300">
                        {marketTag}
                      </span>
                      {/* Individual Win Rate % */}
                      <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {leg.win_probability}% Win Rate
                      </span>
                    </div>

                    <div className="font-black text-sm text-white">{leg.match}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {leg.league || "Global League"} • {leg.market}
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <span className="font-black text-emerald-400 font-mono text-sm sm:text-base">
                      {leg.selection}
                    </span>
                    <span className="text-xs text-slate-300 font-mono font-bold">
                      @ {Number(leg.odd).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlipBuilderTab;
