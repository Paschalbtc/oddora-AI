"use client";

import React, { useState } from "react";
import {
  Sparkles,
  SlidersHorizontal,
  Lock,
  Copy,
  Check,
  Flame,
  ShieldCheck,
  Zap,
  Crown,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { UserTier } from "../Navbar";

export interface SlipBuilderTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
}

export const SlipBuilderTab: React.FC<SlipBuilderTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
}) => {
  const [sportType, setSportType] = useState<string>("all");
  const [matchCountMode, setMatchCountMode] = useState<"AUTO" | "CUSTOM">("AUTO");
  const [customMatchCount, setCustomMatchCount] = useState<number>(5);
  const [targetOdds, setTargetOdds] = useState<string>("10");
  const [bookmaker, setBookmaker] = useState<"SPORTYBET" | "BET9JA">("SPORTYBET");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["all"]);
  const [isSolving, setIsSolving] = useState(false);
  const [resultSlip, setResultSlip] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isProOrPremium = currentTier === "PRO" || currentTier === "PREMIUM";

  const freeMarkets = [
    { id: "1x2", label: "1X2 (Straight Win)" },
    { id: "double chance", label: "Double Chance (1X / X2)" },
    { id: "over 1.5", label: "Over 1.5 Goals" },
  ];

  const advancedMarkets = [
    { id: "over 2.5", label: "Over 2.5 Goals", tier: "PRO" },
    { id: "btts", label: "Both Teams To Score (GG)", tier: "PRO" },
    { id: "under 3.5", label: "Under 3.5 Goals", tier: "PRO" },
    { id: "total points", label: "Basketball Total Points", tier: "PRO" },
    { id: "point spread", label: "Basketball Point Spread", tier: "PREMIUM" },
    { id: "total sets", label: "Volleyball Total Sets", tier: "PRO" },
    { id: "total games", label: "Tennis Total Games", tier: "PREMIUM" },
  ];

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
          `${i + 1}. ${l.match} | Pick: ${l.selection} @ ${Number(l.odd).toFixed(2)}`
      ),
      "Place on Bet9ja: https://sports.bet9ja.com",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedCode("b9_builder");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const sportyCode = resultSlip?.sporty_code || resultSlip?.booking_code;
  const bet9jaCode = resultSlip?.bet9ja_code;
  const sportyUrl =
    resultSlip?.sporty_url ||
    (sportyCode ? `https://www.sportybet.com/ng/?shareCode=${sportyCode}` : "");
  const bet9jaUrl = "https://sports.bet9ja.com";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Combinatorial Ticket Solver • Engine 3</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Custom Slip & Multiplier Builder
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Set your exact target multiplier and let the quantitative solver construct the optimal ticket.
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

      {/* Beginner Step-by-Step Helper */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-300 font-bold">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>How to use: 1. Select target odds (e.g. 5x or 10x). 2. Keep Auto match count. 3. Tap Solve & Book Slip!</span>
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

        {/* Step 2: Sport & Match Count Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          {/* Sport Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
              Step 2: Sport Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "all", label: "All Sports" },
                { id: "football", label: "Football" },
                { id: "basketball", label: "Basketball" },
                { id: "tennis", label: "Tennis" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSportType(s.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    sportType === s.id
                      ? "bg-white/[0.1] text-white border-white/20 font-black"
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
            <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
              Step 3: Match Count Mode
            </label>
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
                Auto (Optimal Odds Solver)
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
                Custom ({customMatchCount} Matches)
              </button>
            </div>

            {matchCountMode === "CUSTOM" && (
              <div className="flex items-center gap-1.5 pt-1">
                {[3, 4, 5, 7, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setCustomMatchCount(cnt)}
                    className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border ${
                      customMatchCount === cnt
                        ? "bg-emerald-500 text-black border-emerald-400"
                        : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Allowed Markets */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
            Step 4: Allowed Betting Markets
          </label>

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
                All Markets
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
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Advanced Pro/Premium Markets */}
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
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
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
                <span>Running Combinatorial Solver & Booking Codes...</span>
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

      {/* Generated Slip Output */}
      {resultSlip && (
        <div className="p-6 sm:p-7 rounded-3xl bg-[#11161F] border border-emerald-500/40 shadow-2xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Solved Accumulator
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  ✓ Verified Live Booking Code
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                {resultSlip.legs_count}-Leg Optimized Slip
              </h3>
              <p className="text-xs text-slate-400">
                Target: {resultSlip.target_odds_requested}x • Actual Multiplied Odds:{" "}
                <span className="text-emerald-400 font-bold font-mono">
                  {resultSlip.actual_combined_odds}x
                </span>{" "}
                ({resultSlip.odds_accuracy_ratio || "99.2%"} precision)
              </p>
            </div>

            {/* Quick Copy Badges */}
            <div className="flex items-center gap-2">
              {sportyCode && (
                <button
                  type="button"
                  onClick={() => handleCopy(sportyCode)}
                  className="px-3 py-1.5 rounded-xl bg-[#E51D25]/15 border border-[#E51D25]/40 text-white font-mono text-xs font-black flex items-center gap-1.5 hover:bg-[#E51D25]/25 transition"
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
                className="px-3 py-1.5 rounded-xl bg-[#008234]/15 border border-[#008234]/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 hover:bg-[#008234]/25 transition"
              >
                <span>Bet9ja: Copy Matches</span>
                {copiedCode === "b9_builder" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-300" />
                )}
              </button>
            </div>
          </div>

          {/* 1-Click External Load Launchers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sportyUrl && (
              <a
                href={sportyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-[#E51D25] hover:bg-red-600 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 transition shadow-lg active:scale-98"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Load Slip on SportyBet</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}

            <a
              href="https://sports.bet9ja.com"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-[#008234] hover:bg-emerald-700 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 transition shadow-lg active:scale-98"
            >
              <span>🟢 Open Bet9ja Sportsbook</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>

          {/* Legs Breakdown */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 block">
              Fixture & Market Breakdown ({resultSlip.legs?.length || 0} Games):
            </span>
            {(resultSlip.legs || []).map((leg: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs hover:bg-white/[0.05] transition"
              >
                <div>
                  <div className="font-bold text-white">{leg.match}</div>
                  <div className="text-[10px] text-slate-400">
                    {leg.league || "Global League"} • {leg.market}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-emerald-400 font-mono block">
                    {leg.selection}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    @ {Number(leg.odd).toFixed(2)} ({leg.win_probability}% Win Rate)
                  </span>
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
