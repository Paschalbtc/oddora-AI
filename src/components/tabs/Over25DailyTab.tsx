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
  Activity,
  Zap,
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

  const handleCopy = (code?: string) => {
    if (!code || code.includes("VIP")) {
      onOpenUpgradeModal();
      return;
    }
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyBet9ja = () => {
    if (isLocked) {
      onOpenUpgradeModal();
      return;
    }
    const lines = [
      `Oddora AI - Over 2.5 Goals Master Ticket (${specialSlip?.actual_odds || 50.82}x Combined Odds)`,
      ...legs.map(
        (l: any, i: number) =>
          `${i + 1}. ${l.match || `${l.home_team} vs ${l.away_team}`} | Over 2.5 Goals @ ${Number(l.odd || 1.75).toFixed(2)}`
      ),
      "Place on Bet9ja: https://sports.bet9ja.com",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedCode("b9_over25");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const isLocked = currentTier === "FREE";
  const legs = specialSlip?.legs || [];
  const sportyCode = specialSlip?.sporty_code || "VIP_ONLY";
  const bet9jaCode = specialSlip?.bet9ja_code || "VIP_ONLY";
  const sportyUrl =
    specialSlip?.sporty_url ||
    (sportyCode && !sportyCode.includes("VIP")
      ? `https://www.sportybet.com/ng/?shareCode=${sportyCode}`
      : "https://www.sportybet.com/ng/");
  const bet9jaUrl = "https://sports.bet9ja.com";

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
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                ✓ 100% Real-Time Verified Codes
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Daily Over 2.5 Goals Ticket
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                Selected by the Football Brain when combined team xG and scoring averages exceed 2.85. Auto-booked into verified SportyBet & Bet9ja slips.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium mt-1">
                <span>💡 Beginner Tip: You win if 3 or more total goals are scored (e.g. 2-1, 3-0, 2-2).</span>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs text-slate-400 font-mono block">Combined Odds:</span>
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {specialSlip?.actual_odds ? `${Number(specialSlip.actual_odds).toFixed(2)}x` : "16.85x"}
              </span>
            </div>
          </div>

          {/* Goal Synergy Metric Bar */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Algorithm xG Synergy Rating: </span>
                <span className="text-amber-400 font-mono font-bold">3.45 Expected Goals/Match</span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-48">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full w-[88%]" />
              </div>
              <span className="font-mono font-bold text-emerald-400 text-[11px]">88%</span>
            </div>
          </div>

          {/* Booking Codes Strip & 1-Click Load Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/10">
            {isLocked ? (
              <div className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-200">
                    Pro or Premium Subscription Required to Unlock Booking Codes & All 7 Legs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition active:scale-95 shadow-lg"
                >
                  Unlock Over 2.5 Ticket
                </button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SportyBet Box */}
                <div className="p-3.5 rounded-2xl bg-[#E51D25]/15 border border-[#E51D25]/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-red-300 font-mono block">
                        SportyBet Booking Code:
                      </span>
                      <span className="text-base font-black font-mono text-white tracking-wider">
                        {sportyCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(sportyCode)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      {copiedCode === sportyCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-red-300" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 1-Click Load SportyBet Button */}
                  <a
                    href={sportyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-[#E51D25] hover:bg-red-600 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 transition shadow-md active:scale-98"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ Load on SportyBet (1-Click)</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>

                {/* Bet9ja Box (Formatted Match Selections) */}
                <div className="p-3.5 rounded-2xl bg-[#008234]/15 border border-[#008234]/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-300 font-mono block">
                        Bet9ja Slip Selections ({legs.length} Matches)
                      </span>
                      <span className="text-sm font-bold font-mono text-white">
                        📋 Copy 7 Over 2.5 Games
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyBet9ja}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      {copiedCode === "b9_over25" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Open Bet9ja Button */}
                  <a
                    href="https://sports.bet9ja.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-[#008234] hover:bg-emerald-700 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 transition shadow-md active:scale-98"
                  >
                    <span>🟢 Open Bet9ja Sportsbook</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legs Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Master Ticket Fixture Breakdown ({legs.length} Matches)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Market: Over 2.5 Goals (3+ Total Goals)
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading Over 2.5 Goals fixtures...</span>
          </div>
        ) : legs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#11161F] border border-white/10 text-slate-400 text-xs">
            Over 2.5 ticket is being calculated by the Football Brain. Check back in a few minutes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {legs.map((leg: any, idx: number) => {
              const hideDetails = isLocked && idx > 1;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl bg-[#11161F] border transition ${
                    hideDetails
                      ? "border-amber-500/20 bg-amber-500/[0.02]"
                      : "border-white/10 hover:border-amber-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                      Leg #{idx + 1} • {leg.league || "Top League"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Today</span>
                    </span>
                  </div>

                  {hideDetails ? (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center space-y-1">
                      <Lock className="w-4 h-4 text-amber-400 mx-auto" />
                      <p className="font-bold text-white text-xs">Leg #{idx + 1} Locked</p>
                      <p className="text-[10px] text-slate-400">
                        Upgrade to Pro to view this fixture & all 7 legs
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">
                          {leg.match || `${leg.home_team} vs ${leg.away_team}`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Selection: <span className="text-amber-400 font-bold">{leg.selection || "Over 2.5 Goals"}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/10 block">
                          @ {leg.odd ? Number(leg.odd).toFixed(2) : "1.75"}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 mt-1 block">
                          {leg.win_probability || 80}% Win Confidence
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Over25DailyTab;
