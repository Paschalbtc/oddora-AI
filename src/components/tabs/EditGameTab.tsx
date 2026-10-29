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
      description: "Splits a long accumulator into multiple balanced tickets with individual valid booking codes.",
      icon: Split,
      color: "text-cyan-400 border-cyan-500/30",
    },
    {
      id: "LOWEST_PROBABILITY",
      title: "2. Remove Lowest Probability",
      description: "Uses the Sport Brains to strip away the riskiest legs, protecting your win probability.",
      icon: TrendingDown,
      color: "text-emerald-400 border-emerald-500/30",
    },
    {
      id: "RANDOM_TRIM",
      title: "3. Remove Random Games",
      description: "Quickly thins out the ticket size randomly while preserving overall odds balance.",
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

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setBookingCode(text.trim());
      }
    } catch {
      // Browser permissions fallback
    }
  };

  const handleCopyBet9jaMatches = (slip: any) => {
    const legs = slip.surviving_legs || slip.legs || [];
    const lines = [
      `Oddora AI - Edited Ticket (${slip.total_odds}x Total Odds)`,
      ...legs.map(
        (l: any, i: number) =>
          `${i + 1}. ${l.match} | Pick: ${l.selection} @ ${Number(l.odd || 1.45).toFixed(2)}`
      ),
      `Total Odds: ${slip.total_odds}x`,
      "Place on Bet9ja: https://sports.bet9ja.com",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedCode("b9_" + (slip.slip_index || "edited"));
    setTimeout(() => setCopiedCode(null), 2500);
  };

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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              bookmaker === "SportyBet"
                ? "bg-[#E51D25] text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            SportyBet
          </button>
          <button
            type="button"
            onClick={() => setBookmaker("Bet9ja")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              bookmaker === "Bet9ja"
                ? "bg-[#008234] text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Bet9ja
          </button>
        </div>
      </div>

      {/* Beginner Explanation */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300 font-medium">
        💡 <strong>How it works:</strong> Paste any booking code from SportyBet or Bet9ja. Our AI will analyze every match, strip away the riskiest legs, or split a long accumulator into safer mini-slips!
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
              placeholder={`Enter or paste your ${bookmaker} booking code (e.g. YK6NTF or B9-XXXX)...`}
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
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
          {selectedMode === "SPLIT_TICKET" ? (
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
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-semibold shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{result.summary_message}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(result.slips || []).map((slip: any, idx: number) => {
              const sportyCode = slip.sporty_code || slip.booking_code;
              const bet9jaCode = slip.bet9ja_code;
              const sportyUrl =
                slip.sporty_url ||
                (sportyCode ? `https://www.sportybet.com/ng/?shareCode=${sportyCode}` : "");
              const bet9jaUrl = "https://sports.bet9ja.com";

              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#11161F] border border-white/10 shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        {result.is_split ? `Ticket Part #${slip.slip_index}` : "Modified Slip"}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {slip.legs_count} Surviving Legs •{" "}
                        <span className="text-emerald-400 font-mono font-bold">
                          {slip.total_odds}x Odds
                        </span>
                      </h4>
                    </div>

                    {/* Copy button */}
                    {bookmaker === "SportyBet" ? (
                      <button
                        type="button"
                        onClick={() => handleCopy(slip.booking_code)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/25 transition self-start sm:self-auto"
                      >
                        <span>Code: {slip.booking_code}</span>
                        {copiedCode === slip.booking_code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-emerald-300" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCopyBet9jaMatches(slip)}
                        className="px-3 py-1.5 rounded-xl bg-[#008234]/20 border border-[#008234]/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-[#008234]/30 transition self-start sm:self-auto"
                      >
                        <span>📋 Copy {slip.legs_count} Matches</span>
                        {copiedCode === "b9_" + (slip.slip_index || "edited") ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-emerald-300" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* 1-Click Launchers */}
                  <div className="grid grid-cols-2 gap-2">
                    {bookmaker === "SportyBet" ? (
                      <a
                        href={sportyUrl || `http://www.sportybet.com/ng/?shareCode=${slip.booking_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-2 py-2 px-3 rounded-xl bg-[#E51D25] hover:bg-red-600 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 transition shadow-md active:scale-98"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>⚡ Load Slip Directly on SportyBet</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopyBet9jaMatches(slip)}
                          className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center flex items-center justify-center gap-1 transition shadow-md border border-white/10"
                        >
                          <span>📋 Copy Ticket</span>
                        </button>
                        <a
                          href="https://sports.bet9ja.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-[#008234] hover:bg-emerald-700 text-white font-black text-xs text-center flex items-center justify-center gap-1 transition shadow-md active:scale-98"
                        >
                          <span>🟢 Open Bet9ja</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </>
                    )}
                  </div>

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

export default EditGameTab;
