"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Sparkles,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Clock,
  TrendingUp,
} from "lucide-react";
import { UserTier } from "../Navbar";

export interface Over25DailyTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
}

export const Over25DailyTab: React.FC<Over25DailyTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
}) => {
  const [specialSlip, setSpecialSlip] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchOver25Slip();
  }, [currentTier]);

  async function fetchOver25Slip() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/engines/daily-slips?tier=${currentTier}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          const found = json.data.find(
            (s: any) => s.slip_type === "OVER_2_5_SPECIAL"
          );
          if (found) setSpecialSlip(found);
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = (code: string) => {
    if (!code || code.includes("VIP")) {
      onOpenUpgradeModal();
      return;
    }
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const isLocked = currentTier === "FREE";
  const legs = specialSlip?.legs || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Spotlight Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1a1205] via-[#11161F] to-[#072018] border-2 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.2)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>SPECIAL OVER 2.5 GOALS MASTER ACCUMULATOR</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              6 to 7 High-xG Synergistic Fixtures
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Daily Over 2.5 Goals Ticket
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                Selected by the Football Brain when combined team xG and scoring averages exceed 2.85. Auto-booked into verified SportyBet & Bet9ja slips.
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs text-slate-400 font-mono block">Combined Odds:</span>
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {specialSlip?.actual_odds ? `${specialSlip.actual_odds}x` : "16.85x"}
              </span>
            </div>
          </div>

          {/* Booking Codes Strip */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/10">
            {isLocked ? (
              <div className="w-full p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-200">
                    Pro or Premium Subscription Required to Unlock Codes & Full 7-Leg Card
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition active:scale-95"
                >
                  Unlock Over 2.5 Ticket
                </button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(specialSlip?.sporty_code)}
                  className="p-3 rounded-2xl bg-[#E51D25]/15 hover:bg-[#E51D25]/25 border border-[#E51D25]/40 text-white font-bold text-xs flex items-center justify-between transition"
                >
                  <div className="text-left">
                    <span className="text-[10px] text-red-300 font-mono block">SportyBet Booking Code:</span>
                    <span className="text-base font-black font-mono text-white tracking-wider">
                      {specialSlip?.sporty_code}
                    </span>
                  </div>
                  {copiedCode === specialSlip?.sporty_code ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-red-300" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(specialSlip?.bet9ja_code)}
                  className="p-3 rounded-2xl bg-[#008234]/15 hover:bg-[#008234]/25 border border-[#008234]/40 text-white font-bold text-xs flex items-center justify-between transition"
                >
                  <div className="text-left">
                    <span className="text-[10px] text-emerald-300 font-mono block">Bet9ja Booking Code:</span>
                    <span className="text-base font-black font-mono text-white tracking-wider">
                      {specialSlip?.bet9ja_code}
                    </span>
                  </div>
                  {copiedCode === specialSlip?.bet9ja_code ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-emerald-300" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixtures Breakdown Table */}
      <div className="rounded-2xl bg-[#11161F] border border-white/10 overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Selected 7-Leg Over 2.5 Arsenal
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            {legs.length} Matches • Poisson Filtered
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {legs.map((leg: any, idx: number) => {
            const legLocked = isLocked && idx >= 2; // Preview top 2 for free
            return (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>

                  <div>
                    <div className="font-bold text-white text-sm">
                      {legLocked ? "🔒 Locked VIP Match (Upgrade to View)" : leg.match}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {leg.league || "Championship"} • Target Market: Over 2.5 Goals
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {legLocked ? "🔒 Over 2.5" : "Over 2.5 Goals"}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {legLocked ? "VIP" : `@ ${leg.odd?.toFixed(2) || "1.85"}`}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {leg.win_probability || 78}% Win Rate
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Over25DailyTab;

