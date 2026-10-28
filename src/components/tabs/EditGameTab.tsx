"use client";

import React, { useState } from "react";
import {
  SlidersHorizontal,
  Split,
  TrendingDown,
  Shuffle,
  Layers,
  Copy,
  Check,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { UserTier } from "../Navbar";

export interface EditGameTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
}

export type EditMode =
  | "SPLIT_TICKET"
  | "LOWEST_PROBABILITY"
  | "RANDOM_TRIM"
  | "COMBO_HYBRID";

export const EditGameTab: React.FC<EditGameTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
}) => {
  const [bookmaker, setBookmaker] = useState<"SportyBet" | "Bet9ja">("SportyBet");
  const [bookingCode, setBookingCode] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<EditMode>("LOWEST_PROBABILITY");
  const [removeCount, setRemoveCount] = useState<number>(3);
  const [splitParts, setSplitParts] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const editModes: Array<{
    id: EditMode;
    title: string;
    description: string;
    icon: any;
    color: string;
  }> = [
    {
      id: "SPLIT_TICKET",
      title: "1. Split Ticket Mode",
      description: "Splits a long accumulator (e.g. 30–50 games) into multiple balanced tickets with individual booking codes.",
      icon: Split,
      color: "text-cyan-400 border-cyan-500/30",
    },
    {
      id: "LOWEST_PROBABILITY",
      title: "2. Remove Lowest Probability",
      description: "Uses the Sport Brains to strip away the riskiest legs, protecting your ticket floor.",
      icon: TrendingDown,
      color: "text-emerald-400 border-emerald-500/30",
    },
    {
      id: "RANDOM_TRIM",
      title: "3. Remove Random Games",
      description: "Quickly thins out the ticket size randomly while preserving overall structure.",
      icon: Shuffle,
      color: "text-amber-400 border-amber-500/30",
    },
    {
      id: "COMBO_HYBRID",
      title: "4. Combo Mode (Big + Small Odds)",
      description: "Simultaneously trims high-variance longshots and low-value small odds.",
      icon: Layers,
      color: "text-purple-400 border-purple-500/30",
    },
  ];

  const handleExecute = async () => {
    if (!bookingCode.trim()) {
      setErrorMsg("Please enter or paste your booking code.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/engines/edit-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_code: bookingCode.trim(),
          bookmaker,
          mode: selectedMode,
          remove_count: removeCount,
          split_parts: splitParts,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Failed to process ticket.");
      }

      setResult(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to edit ticket.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ticket Scanner & Pruner • Engine 4</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            4-Mode Edit Game Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Split long tickets, prune low-probability legs, or trim risky bets with instant re-booked codes.
          </p>
        </div>

        {/* Bookmaker Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#11161F] border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setBookmaker("SportyBet")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              bookmaker === "SportyBet"
                ? "bg-[#E51D25] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            SportyBet
          </button>
          <button
            type="button"
            onClick={() => setBookmaker("Bet9ja")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              bookmaker === "Bet9ja"
                ? "bg-[#008234] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Bet9ja
          </button>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#11161F] border border-white/10 shadow-xl space-y-6">
        {/* Step 1: Booking Code Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
            1. Paste {bookmaker} Booking Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`e.g. ${bookmaker === "SportyBet" ? "BC14XYZ" : "B9J88219"}`}
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
              className="flex-1 bg-[#070A0E] border border-white/10 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 tracking-wider"
            />
          </div>
        </div>

        {/* Step 2: 4 Mode Selection */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
            2. Choose Editing Mode
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {editModes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-4 rounded-2xl text-left transition border ${
                    isSelected
                      ? `bg-white/[0.06] ${mode.color} shadow-lg ring-1 ring-white/20`
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm">{mode.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Controls (Split Parts OR Remove Count) */}
        <div className="pt-3 border-t border-white/10">
          {selectedMode === "SPLIT_TICKET" ? (
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
                3. Number of Split Tickets
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((parts) => (
                  <button
                    key={parts}
                    type="button"
                    onClick={() => setSplitParts(parts)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      splitParts === parts
                        ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-md"
                        : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]"
                    }`}
                  >
                    {parts} Tickets
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
                3. Number of Games to Remove
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[2, 3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRemoveCount(num)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      removeCount === num
                        ? "bg-emerald-500 text-black border-emerald-400 font-black shadow-md"
                        : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]"
                    }`}
                  >
                    Remove {num}
                  </button>
                ))}
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-xs text-slate-400 font-mono">Custom:</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={removeCount}
                    onChange={(e) => setRemoveCount(Math.max(1, Number(e.target.value)))}
                    className="w-20 bg-[#070A0E] border border-white/10 rounded-xl py-1 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isProcessing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm sm:text-base shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Decoding, Pruning & Re-Booking...</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-4 h-4" />
                <span>Execute Ticket Modification</span>
              </>
            )}
          </button>
          {errorMsg && (
            <p className="text-xs text-rose-400 font-mono mt-2 text-center">{errorMsg}</p>
          )}
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{result.summary_message}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.slips.map((slip: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#11161F] border border-white/10 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                      {result.is_split ? `Ticket Part #${slip.slip_index}` : "Modified Slip"}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">
                      {slip.legs_count} Surviving Legs •{" "}
                      <span className="text-emerald-400 font-mono">{slip.total_odds}x Odds</span>
                    </h4>
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => handleCopy(slip.booking_code)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/25 transition"
                    >
                      <span>{slip.booking_code}</span>
                      {copiedCode === slip.booking_code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-emerald-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Surviving legs preview */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {(slip.surviving_legs || []).map((leg: any, lIdx: number) => (
                    <div
                      key={lIdx}
                      className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="truncate max-w-[200px]">
                        <span className="font-semibold text-white">{leg.match}</span>
                        <div className="text-[10px] text-slate-400">{leg.market}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-emerald-400">
                          {leg.selection}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          @ {leg.odd}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pruned legs (if any) */}
                {slip.pruned_legs && slip.pruned_legs.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
                      Removed Legs ({slip.pruned_legs.length}):
                    </span>
                    {slip.pruned_legs.map((pl: any, plIdx: number) => (
                      <div
                        key={plIdx}
                        className="p-1.5 rounded-lg bg-rose-500/5 text-slate-400 text-[11px] flex items-center justify-between line-through"
                      >
                        <span>{pl.match}</span>
                        <span>{pl.selection} @ {pl.odd}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditGameTab;

