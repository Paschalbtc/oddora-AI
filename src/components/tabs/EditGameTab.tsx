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
  ClipboardPaste,
  Zap,
  ShieldCheck,
  Target,
} from "lucide-react";
import { UserTier } from "../Navbar";
import { useAuth } from "@/context/AuthContext";

export interface EditGameTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
}

export type EditMode =
  | "SPLIT_TICKET"
  | "LOWEST_PROBABILITY"
  | "RANDOM_TRIM"
  | "COMBO_HYBRID"
  | "TARGET_ODDS";

export const EditGameTab: React.FC<EditGameTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
}) => {
  const { requireAuth } = useAuth();
  const [bookmaker] = useState<"SportyBet">("SportyBet");
  const [bookingCode, setBookingCode] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<EditMode>("TARGET_ODDS");
  const [removeCount, setRemoveCount] = useState<number>(3);
  const [splitParts, setSplitParts] = useState<number>(2);
  const [targetOdds, setTargetOdds] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [modifiedTicket, setModifiedTicket] = useState<any | null>(null);
  const [isOddsFrozen, setIsOddsFrozen] = useState<boolean>(true);
  const [isRefreshingOdds, setIsRefreshingOdds] = useState<boolean>(false);
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
      id: "TARGET_ODDS",
      title: "1. Target Odds Optimizer",
      description: "Prunes risky games to scale your ticket down to an exact target multiplier (e.g. 5x, 10x, 20x).",
      icon: Target,
      color: "text-emerald-400 border-emerald-500/30",
    },
    {
      id: "SPLIT_TICKET",
      title: "2. Split Ticket Mode",
      description: "Splits a long accumulator into multiple balanced tickets with individual valid booking codes.",
      icon: Split,
      color: "text-cyan-400 border-cyan-500/30",
    },
    {
      id: "LOWEST_PROBABILITY",
      title: "3. Remove Lowest Probability",
      description: "Uses the Sport Brains to strip away the riskiest legs, protecting your win probability.",
      icon: TrendingDown,
      color: "text-emerald-400 border-emerald-500/30",
    },
    {
      id: "RANDOM_TRIM",
      title: "4. Remove Random Games",
      description: "Quickly thins out the ticket size randomly while preserving overall odds balance.",
      icon: Shuffle,
      color: "text-amber-400 border-amber-500/30",
    },
    {
      id: "COMBO_HYBRID",
      title: "5. Combo Mode (Big + Small Odds)",
      description: "Simultaneously trims high-variance longshots and low-value small odds.",
      icon: Layers,
      color: "text-purple-400 border-purple-500/30",
    },
  ];

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        let clean = text.trim();
        if (clean.includes("shareCode=")) {
          const match = clean.match(/shareCode=([A-Za-z0-9]+)/i);
          if (match) clean = match[1];
        } else if (clean.includes("/share/")) {
          const match = clean.match(/\/share\/([A-Za-z0-9]+)/i);
          if (match) clean = match[1];
        }
        setBookingCode(clean.replace(/[^A-Za-z0-9]/g, "").toUpperCase());
      }
    } catch {
      // Browser permissions fallback
    }
  };

  const handleExecute = async () => {
    if (!requireAuth(() => handleExecute(), "Please create a free account or sign in to edit and prune tickets")) {
      return;
    }
    if (!bookingCode.trim()) {
      setErrorMsg("Please enter or paste your booking code.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch("/api/edit-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_code: bookingCode.trim(),
          bookmaker,
          mode: selectedMode,
          remove_count: removeCount,
          split_parts: splitParts,
          target_odds: targetOdds,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Failed to process ticket.");
      }

      const slipData = json.data || json;
      // FREEZE THE STATE: Store permanently in local state & prevent any automatic re-fetching
      setModifiedTicket(slipData);
      setResult(slipData);
      setIsOddsFrozen(true);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setErrorMsg("Request timed out. Please check your connection and retry.");
      } else {
        setErrorMsg(err.message || "Failed to edit ticket.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Explicit manual odds refresh handler (only triggered on user click)
  const handleManualRefreshOdds = (slipIdx: number) => {
    if (!modifiedTicket || !modifiedTicket.slips) return;
    setIsRefreshingOdds(true);
    try {
      const targetSlip = modifiedTicket.slips[slipIdx];
      if (targetSlip && Array.isArray(targetSlip.surviving_legs)) {
        const reCalcOdds =
          Math.round(
            targetSlip.surviving_legs.reduce(
              (acc: number, l: any) => acc * (Number(l.odd) || 1.0),
              1.0
            ) * 100
          ) / 100;
        const updated = { ...modifiedTicket };
        updated.slips[slipIdx].total_odds = reCalcOdds;
        setModifiedTicket(updated);
        setResult(updated);
      }
    } finally {
      setTimeout(() => setIsRefreshingOdds(false), 500);
    }
  };

  const handleCopy = (code: string) => {
    if (!requireAuth(() => handleCopy(code), "Please create a free account or sign in to copy verified booking codes")) return;
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
            5-Mode Edit Game Engine & Odds Optimizer
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Scale to target odds, split long accumulators, or strip away risky legs with instant re-booked codes.
          </p>
        </div>

        {/* Bookmaker Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#11161F] border border-white/10 shrink-0">
          <span className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#E51D25] text-white shadow-md flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>SportyBet Verified Engine</span>
          </span>
        </div>
      </div>

      {/* Beginner Explanation */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300 font-medium">
        💡 <strong>How it works:</strong> Paste any SportyBet booking code. Our AI will analyze every match, strip away the riskiest legs, or split a long accumulator into safer mini-slips!
      </div>

      {/* Input & Mode Configuration Panel */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#11161F] border border-white/10 shadow-2xl space-y-6">
        {/* Ticket Code Input Field with Paste helper */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-slate-300">
              Input {bookmaker} Booking Code
            </label>
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste from Clipboard</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={`Enter or paste your ${bookmaker} booking code or link (e.g. YK6NTF or sportybet.com/ng/?shareCode=...)...`}
              value={bookingCode}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes("shareCode=") || val.includes("/share/")) {
                  let clean = val;
                  const m1 = clean.match(/shareCode=([A-Za-z0-9]+)/i);
                  const m2 = clean.match(/\/share\/([A-Za-z0-9]+)/i);
                  if (m1) clean = m1[1];
                  else if (m2) clean = m2[1];
                  setBookingCode(clean.replace(/[^A-Za-z0-9]/g, "").toUpperCase());
                } else {
                  setBookingCode(val.toUpperCase());
                }
              }}
              className="w-full bg-[#070A0E] border border-white/10 rounded-2xl py-3.5 px-4 text-sm font-mono font-bold text-white uppercase placeholder:normal-case placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-3">
          <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
            Select Modification Mode
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {editModes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-4 rounded-2xl border text-left transition ${
                    isSelected
                      ? "bg-white/[0.08] border-emerald-500/60 shadow-lg"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} />
                    <span className="font-bold text-sm text-white">{mode.title}</span>
                  </div>
                  <p className="text-xs text-slate-400">{mode.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Controls based on Mode */}
        <div className="pt-2">
          {selectedMode === "TARGET_ODDS" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
                  Select Target Odds Multiplier:
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Target: {targetOdds}x Multiplier
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[2, 3, 5, 10, 20, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetOdds(num)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                      targetOdds === num
                        ? "bg-emerald-500 text-black border-emerald-400 font-black shadow-md"
                        : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]"
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-xs text-slate-400 font-mono">Custom Target:</span>
                <input
                  type="number"
                  min={1.2}
                  max={10000}
                  step={0.5}
                  value={targetOdds || ""}
                  onChange={(e) => setTargetOdds(Math.max(1.1, parseFloat(e.target.value) || 2))}
                  className="w-28 bg-[#070A0E] border border-white/10 rounded-xl py-1.5 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                  placeholder="e.g. 15.0"
                />
                <span className="text-[11px] text-slate-400 font-mono">
                  Algorithm keeps the safest matches compounding closest to ~{targetOdds}x.
                </span>
              </div>
            </div>
          ) : selectedMode === "SPLIT_TICKET" ? (
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
                Split Into How Many Independent Tickets?
              </label>
              <div className="flex items-center gap-2">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSplitParts(num)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      splitParts === num
                        ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-md"
                        : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]"
                    }`}
                  >
                    {num} Parts
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
                Number of Games to Prune / Remove:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[1, 2, 3, 5, 8, 10].map((num) => (
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
                <span>[🔄 Re-signing & Optimizing Ticket...]</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-4 h-4" />
                <span>Execute Ticket Modification</span>
              </>
            )}
          </button>
          {isProcessing && (
            <div className="p-4 mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-3 animate-in fade-in">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">
                  [🔄 Re-signing & Optimizing Ticket...]
                </span>
                <span className="text-[11px] text-slate-400 font-mono block">
                  Reading cached match probabilities from Oddora DB and generating verified SportyBet booking code.
                </span>
              </div>
            </div>
          )}
          {errorMsg && !isProcessing && (
            <p className="text-xs text-rose-400 font-mono mt-2 text-center">{errorMsg}</p>
          )}
        </div>
      </div>

      {/* Results View */}
      {(modifiedTicket || result) && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-300 font-semibold shadow-md flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{(modifiedTicket || result).summary_message}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
              <span>🔒 Ticket Odds Frozen</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {((modifiedTicket || result).slips || []).map((slip: any, idx: number) => {
              const sportyCode =
                slip.sportybet_code ||
                slip.sportybetCode ||
                slip.bookingCode ||
                slip.shareCode ||
                slip.code ||
                slip.sporty_code ||
                slip.booking_code ||
                slip.sportyCode ||
                "";
              const sportyUrl =
                slip.sporty_url ||
                slip.share_url ||
                slip.sportyUrl ||
                slip.shareUrl ||
                (sportyCode ? `https://www.sportybet.com/ng/?shareCode=${sportyCode}` : "");

              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#11161F] border border-white/10 shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          {(modifiedTicket || result).is_split ? `Ticket Part #${slip.slip_index}` : "Modified Slip"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/25">
                          <ShieldCheck className="w-3 h-3 text-cyan-400" />
                          <span>SportyBet Verified</span>
                        </span>
                        {isOddsFrozen && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>🔒 Odds Locked & Frozen</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {slip.legs_count} Surviving Legs •{" "}
                        <span className="text-emerald-400 font-mono font-bold">
                          {slip.total_odds}x Odds
                        </span>
                      </h4>
                    </div>

                    {/* Action buttons: Manual Refresh Odds + Copy code */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleManualRefreshOdds(idx)}
                        disabled={isRefreshingOdds}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white font-mono font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                        title="Manually recalculate compounded odds"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOdds ? "animate-spin text-emerald-400" : ""}`} />
                        <span>[🔄 Refresh Odds]</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(sportyCode)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/25 transition self-start sm:self-auto shadow-sm active:scale-95"
                      >
                        <span>Code: {sportyCode}</span>
                        {copiedCode === sportyCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-emerald-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Launchers */}
                  <a
                    href={sportyUrl || `https://www.sportybet.com/ng/?shareCode=${sportyCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#E51D25] hover:bg-red-600 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 transition shadow-md active:scale-98"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ Load Slip Directly on SportyBet ({sportyCode})</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>

                  {/* Surviving legs preview */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                      Surviving Safe Legs:
                    </span>
                    {(slip.surviving_legs || []).map((leg: any, lIdx: number) => (
                      <div
                        key={lIdx}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
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
                        Pruned Risky Legs ({slip.pruned_legs.length}):
                      </span>
                      {slip.pruned_legs.map((pl: any, plIdx: number) => (
                        <div
                          key={plIdx}
                          className="p-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-slate-400 text-[11px] flex items-center justify-between line-through"
                        >
                          <span className="truncate max-w-[200px]">{pl.match}</span>
                          <span>{pl.selection} @ {pl.odd}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const EditGameModal = EditGameTab;
export default EditGameTab;
