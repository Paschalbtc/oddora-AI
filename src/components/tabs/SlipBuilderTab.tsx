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

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

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
            Define your exact target odds, choose match count, and toggle preferred bet markets.
          </p>
        </div>

        {/* Bookmaker Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#11161F] border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setBookmaker("SPORTYBET")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              bookmaker === "SPORTYBET"
                ? "bg-[#E51D25] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            SportyBet
          </button>
          <button
            type="button"
            onClick={() => setBookmaker("BET9JA")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              bookmaker === "BET9JA"
                ? "bg-[#008234] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Bet9ja
          </button>
        </div>
      </div>

      {/* Main Builder Configuration Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11161F] border border-white/10 shadow-xl space-y-6">
        {/* Step 1: Sport Selection */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
            1. Select Sport Discipline
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: "all", label: "All Sports Mix", icon: "🌐" },
              { id: "football", label: "Football", icon: "⚽" },
              { id: "basketball", label: "Basketball", icon: "🏀" },
              { id: "volleyball", label: "Volleyball", icon: "🏐" },
              { id: "tennis", label: "Tennis", icon: "🎾" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSportType(s.id)}
                className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  sportType === s.id
                    ? "bg-emerald-500 text-black font-black shadow-md"
                    : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Number of Matches Selector (Auto vs Custom) */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
              2. Number of Matches Mode
            </label>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {matchCountMode === "AUTO"
                ? "AI Optimal Count"
                : `Exact ${customMatchCount} Matches`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMatchCountMode("AUTO")}
              className={`p-3 rounded-2xl text-xs font-bold transition text-left border ${
                matchCountMode === "AUTO"
                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                  : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <div className="font-black text-white text-sm">🤖 Automatic Match Count</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                AI dynamically selects the most mathematically sound number of fixtures.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMatchCountMode("CUSTOM")}
              className={`p-3 rounded-2xl text-xs font-bold transition text-left border ${
                matchCountMode === "CUSTOM"
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                  : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <div className="font-black text-white text-sm">🎯 Custom Match Count</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enter or slide the exact number of matches you want in your slip.
              </p>
            </button>
          </div>

          {matchCountMode === "CUSTOM" && (
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Exact Match Count:</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {customMatchCount} Matches
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                value={customMatchCount}
                onChange={(e) => setCustomMatchCount(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>2 Matches</span>
                <span>8 Matches</span>
                <span>15 Matches</span>
                <span>25 Matches</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Target Odds & Quick Presets */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
            3. Target Multiplier Odds
          </label>

          <div className="flex flex-wrap gap-2">
            {quickOddsPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setTargetOdds(String(p.val));
                  handleGenerate(p.val);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  targetOdds === String(p.val)
                    ? "bg-amber-500 text-black border-amber-400 font-black"
                    : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm pt-1">
            <span className="text-xs text-slate-400 font-mono">Custom Target:</span>
            <input
              type="number"
              min="1.5"
              step="0.5"
              value={targetOdds}
              onChange={(e) => setTargetOdds(e.target.value)}
              placeholder="e.g. 15.5"
              className="w-32 bg-[#070A0E] border border-white/10 rounded-xl py-1 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Step 4: Allowed Bet Markets Filter */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
              4. Allowed Bet Markets Filter
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {selectedMarkets.includes("all") ? "All AI Markets" : `${selectedMarkets.length} Selected`}
            </span>
          </div>

          <div className="space-y-2">
            {/* Standard Free Markets */}
            <div className="text-[11px] font-mono text-slate-400">Standard Markets (Free)</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleMarket("all", false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  selectedMarkets.includes("all")
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                    : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                {selectedMarkets.includes("all") && "✓ "}All Markets Allowed
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
        <div className="p-6 rounded-3xl bg-[#11161F] border border-emerald-500/40 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                Solved Accumulator
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                {resultSlip.legs_count}-Leg {resultSlip.bookmaker} Ticket
              </h3>
              <p className="text-xs text-slate-400">
                Target: {resultSlip.target_odds_requested}x • Actual Multiplied Odds:{" "}
                <span className="text-emerald-400 font-bold">{resultSlip.actual_combined_odds}x</span>{" "}
                ({resultSlip.odds_accuracy_ratio} precision)
              </p>
            </div>

            {/* Copyable Code Badges */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(resultSlip.sporty_code)}
                className="px-3.5 py-2 rounded-xl bg-[#E51D25]/15 border border-[#E51D25]/40 text-white font-mono text-xs font-black flex items-center gap-1.5 hover:bg-[#E51D25]/25 transition"
              >
                <span>Sporty: {resultSlip.sporty_code}</span>
                {copiedCode === resultSlip.sporty_code ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-red-300" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(resultSlip.bet9ja_code)}
                className="px-3.5 py-2 rounded-xl bg-[#008234]/15 border border-[#008234]/40 text-white font-mono text-xs font-black flex items-center gap-1.5 hover:bg-[#008234]/25 transition"
              >
                <span>Bet9ja: {resultSlip.bet9ja_code}</span>
                {copiedCode === resultSlip.bet9ja_code ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-300" />
                )}
              </button>
            </div>
          </div>

          {/* Legs Breakdown */}
          <div className="space-y-2">
            {(resultSlip.legs || []).map((leg: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{leg.match}</div>
                  <div className="text-[10px] text-slate-400">{leg.league}</div>
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

