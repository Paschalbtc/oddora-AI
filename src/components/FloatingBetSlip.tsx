"use client";

import React, { useState } from "react";
import { useBetSlip } from "@/context/BetSlipContext";
import { useAuth } from "@/context/AuthContext";
import {
  Ticket,
  X,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Zap,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const FloatingBetSlip: React.FC = () => {
  const { requireAuth } = useAuth();
  const {
    legs,
    totalOdds,
    stake,
    setStake,
    potentialWin,
    isOpen,
    setIsOpen,
    toggleOpen,
    removeLeg,
    clearSlip,
    isBooking,
    bookedTicket,
    bookingError,
    bookSlip,
    resetBookingState,
  } = useBetSlip();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedBookmaker, setSelectedBookmaker] = useState<"SportyBet" | "Bet9ja">("SportyBet");

  if (legs.length === 0 && !isOpen) {
    return null;
  }

  const handleCopy = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyBet9jaSelections = () => {
    const lines = [
      `Oddora AI - Custom Bet Slip (${totalOdds}x Total Odds)`,
      ...legs.map(
        (l, i) =>
          `${i + 1}. ${l.homeTeam} vs ${l.awayTeam} | ${l.market}: ${l.selection} @ ${Number(l.odd || 1.45).toFixed(2)}`
      ),
      `Total Odds: ${totalOdds}x`,
      "Place on Bet9ja: https://sports.bet9ja.com",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedCode("b9_matches");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <>
      {/* =========================================================================
          1. FLOATING LAUNCHER PILL (SportyBet-Style Persistent Bet Slip Button)
         ========================================================================= */}
      {!isOpen && legs.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={toggleOpen}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-emerald-300 font-black text-xs transition-all active:scale-95 group"
          >
            <div className="relative">
              <Ticket className="w-5 h-5 text-black" />
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-black text-emerald-400 text-[10px] font-mono font-black border border-emerald-400">
                {legs.length}
              </span>
            </div>

            <div className="text-left">
              <span className="block font-black text-xs uppercase tracking-wider">
                Bet Slip ({legs.length} {legs.length === 1 ? "Game" : "Games"})
              </span>
              <span className="block font-mono text-[11px] text-black/80 font-bold">
                Total Odds: <strong className="text-black font-black">{totalOdds}x</strong>
              </span>
            </div>

            <div className="w-2 h-2 rounded-full bg-black animate-ping ml-1" />
          </button>
        </div>
      )}

      {/* =========================================================================
          2. EXPANDED BET SLIP DRAWER (Slide-over on Right / Bottom-Sheet on Mobile)
         ========================================================================= */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          {/* Backdrop click to close */}
          <div className="flex-1 hidden md:block" onClick={() => setIsOpen(false)} />

          <div className="w-full max-w-md h-full bg-[#0d121c] border-l border-white/10 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-[#111622] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Oddora Bet Slip</h3>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {legs.length} {legs.length === 1 ? "Selection" : "Selections"} Accumulated
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {legs.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSlip}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Clear All Selections"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Legs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {legs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <Ticket className="w-12 h-12 text-slate-600 stroke-1" />
                  <div>
                    <p className="font-bold text-white text-sm">Your Bet Slip is Empty</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Tap the <strong className="text-emerald-400">[+ Add to Slip]</strong> button on any match in All Matches or Daily Odds to accumulate your custom ticket!
                    </p>
                  </div>
                </div>
              ) : (
                legs.map((leg) => (
                  <div
                    key={leg.id}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition flex items-center justify-between gap-3 text-xs group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-xs truncate">
                        {leg.homeTeam} <span className="text-slate-500 font-normal">vs</span> {leg.awayTeam}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-black text-emerald-400 text-xs">
                          {leg.selection}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          • {leg.market}
                        </span>
                      </div>
                      {leg.league && (
                        <div className="text-[9.5px] font-mono text-slate-500 truncate mt-0.5">
                          {leg.league}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-black text-white bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                        @{Number(leg.odd || 1.45).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLeg(leg.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remove game"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Controls, Odds Calculator & 1-Click Booking Bridge */}
            {legs.length > 0 && (
              <div className="p-4 bg-[#111622] border-t border-white/10 space-y-3.5">
                {/* Total Odds & Stake Summary */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono font-semibold">Combined Total Odds</span>
                    <span className="font-mono font-black text-emerald-400 text-base">
                      {totalOdds}x
                    </span>
                  </div>

                  {/* Stake input with quick chips */}
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Stake Amount (₦)</span>
                      <span className="font-mono text-white font-bold">
                        Potential Win: <strong className="text-emerald-400">₦{potentialWin.toLocaleString()}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={stake}
                        onChange={(e) => setStake(Math.max(50, Number(e.target.value) || 0))}
                        className="flex-1 bg-[#070A0E] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                        placeholder="Stake ₦"
                      />
                      {[500, 1000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setStake(amt)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition ${
                            stake === amt
                              ? "bg-emerald-500 text-black border-emerald-400"
                              : "bg-white/[0.04] text-slate-300 border-white/10 hover:text-white"
                          }`}
                        >
                          ₦{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Booking Code Display (When Generated) */}
                {bookedTicket && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>
                          {bookedTicket.bookmaker === "SportyBet"
                            ? "Verified SportyBet Code"
                            : "Bet9ja Slip Selections"}
                        </span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        100% READY
                      </span>
                    </div>

                    {bookedTicket.bookmaker === "SportyBet" ? (
                      <>
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/50 border border-emerald-500/30">
                          <span className="font-mono font-black text-white text-base tracking-widest">
                            {bookedTicket.bookingCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(bookedTicket.bookingCode)}
                            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 transition"
                          >
                            {copiedCode === bookedTicket.bookingCode ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <a
                          href={
                            bookedTicket.shareUrl ||
                            `http://www.sportybet.com/ng/?shareCode=${bookedTicket.bookingCode}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl bg-[#E51D25] hover:bg-[#c91820] text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-md active:scale-98"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>⚡ Load Slip Directly on SportyBet</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/50 border border-emerald-500/30">
                          <div>
                            <span className="text-[10px] text-emerald-300 font-mono block">
                              Bet9ja Coupon Code
                            </span>
                            <span className="font-mono font-black text-white text-base tracking-widest block">
                              {bookedTicket.bookingCode || bookedTicket.bet9jaCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(bookedTicket.bookingCode || bookedTicket.bet9jaCode)}
                            className="px-3 py-1.5 rounded-lg bg-[#008234] hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedCode === (bookedTicket.bookingCode || bookedTicket.bet9jaCode) ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <a
                          href="https://sports.bet9ja.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl bg-[#008234] hover:bg-[#006e2b] text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-md active:scale-98"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>🟢 Open Bet9ja Sportsbook</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </>
                    )}
                  </div>
                )}

                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* 1-Click Dual Bookmaker Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isBooking}
                    onClick={() => {
                      if (!requireAuth(undefined, "Please create a free account or sign in to book your Bet Slip")) return;
                      bookSlip("SportyBet");
                    }}
                    className="py-3 px-3 rounded-xl bg-[#E51D25] hover:bg-[#cf1820] text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-lg active:scale-98 disabled:opacity-50"
                  >
                    {isBooking ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>Book on SportyBet</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBooking}
                    onClick={() => {
                      if (!requireAuth(undefined, "Please create a free account or sign in to book your Bet Slip")) return;
                      bookSlip("Bet9ja");
                    }}
                    className="py-3 px-3 rounded-xl bg-[#008234] hover:bg-[#006f2b] text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-lg active:scale-98 disabled:opacity-50"
                  >
                    {isBooking ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>🟢</span>
                    )}
                    <span>Book on Bet9ja</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingBetSlip;

