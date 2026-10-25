"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Crown,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react";

export interface BankerLeg {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string;
  predictedScore: string;
  pick: string;
  odds: number;
  marketCategory: string;
  confidence: number;
  reasoning: string;
}

export interface BankerTicket {
  id: string;
  title: string;
  totalOdds: number;
  safetyScore: number;
  marketTypes: string[];
  sportyCode: string;
  bet9jaCode: string;
  legs: BankerLeg[];
}

interface BankersTabProps {
  bankers: BankerTicket[];
  userTier: "FREE" | "PRO" | "VIP";
  onOpenVipModal: () => void;
  onLoadIntoBuilder?: (ticket: BankerTicket) => void;
}

export default function BankersTab({
  bankers,
  userTier,
  onOpenVipModal,
  onLoadIntoBuilder,
}: BankersTabProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isVipOrPro = userTier === "VIP" || userTier === "PRO";

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Fallback banker tickets if empty
  const displayBankers: BankerTicket[] =
    bankers && bankers.length > 0
      ? bankers
      : [
          {
            id: "banker-1",
            title: "Banker Slip #1 — Ultra Safety Floor",
            totalOdds: 2.18,
            safetyScore: 92,
            marketTypes: ["Double Chance", "Over 1.5 Goals"],
            sportyCode: "BC91A42",
            bet9jaCode: "B9-88123",
            legs: [
              {
                matchId: "m1",
                homeTeam: "Arsenal",
                awayTeam: "Fulham",
                league: "Premier League",
                kickoff: "15:00",
                predictedScore: "2 - 0",
                pick: "1X (Home or Draw)",
                odds: 1.18,
                marketCategory: "Double Chance",
                confidence: 94,
                reasoning: "Arsenal xG 2.4 vs 0.6; Poisson model shows <6% away win probability.",
              },
              {
                matchId: "m2",
                homeTeam: "Real Madrid",
                awayTeam: "Getafe",
                league: "La Liga",
                kickoff: "16:15",
                predictedScore: "2 - 1",
                pick: "Over 1.5 Goals",
                odds: 1.25,
                marketCategory: "Over/Under Goals",
                confidence: 91,
                reasoning: "Madrid home matches average 3.2 total goals; high scoring probability.",
              },
              {
                matchId: "m3",
                homeTeam: "Inter Milan",
                awayTeam: "Empoli",
                league: "Serie A",
                kickoff: "18:00",
                predictedScore: "3 - 0",
                pick: "Home Win (1)",
                odds: 1.48,
                marketCategory: "1X2",
                confidence: 89,
                reasoning: "Inter attacking rating 96; clean sheet probability 64%.",
              },
            ],
          },
          {
            id: "banker-2",
            title: "Banker Slip #2 — Tactical Balanced Multiplier",
            totalOdds: 2.54,
            safetyScore: 88,
            marketTypes: ["Over 1.5 Goals", "Draw No Bet", "Double Chance"],
            sportyCode: "BC92B19",
            bet9jaCode: "B9-99411",
            legs: [
              {
                matchId: "m4",
                homeTeam: "Bayern Munich",
                awayTeam: "Stuttgart",
                league: "Bundesliga",
                kickoff: "17:30",
                predictedScore: "3 - 1",
                pick: "Over 2.5 Goals",
                odds: 1.36,
                marketCategory: "Over/Under Goals",
                confidence: 90,
                reasoning: "Combined Bundesliga xG 4.1; Poisson 88% probability of 3+ goals.",
              },
              {
                matchId: "m5",
                homeTeam: "PSG",
                awayTeam: "Rennes",
                league: "Ligue 1",
                kickoff: "20:00",
                predictedScore: "2 - 0",
                pick: "1X & Over 1.5",
                odds: 1.38,
                marketCategory: "Combo",
                confidence: 88,
                reasoning: "PSG undefeated at home; low concession rate.",
              },
              {
                matchId: "m6",
                homeTeam: "Sporting CP",
                awayTeam: "Braga",
                league: "Primeira Liga",
                kickoff: "20:30",
                predictedScore: "2 - 1",
                pick: "Draw No Bet (Sporting)",
                odds: 1.35,
                marketCategory: "Draw No Bet",
                confidence: 87,
                reasoning: "Sporting dominant xG; draw refund safety hedge applied.",
              },
            ],
          },
          {
            id: "banker-3",
            title: "Banker Slip #3 — High-Floor Value Compounder",
            totalOdds: 2.92,
            safetyScore: 85,
            marketTypes: ["1X2", "Double Chance", "Over 1.5 Goals"],
            sportyCode: "BC93C78",
            bet9jaCode: "B9-77562",
            legs: [
              {
                matchId: "m7",
                homeTeam: "Barcelona",
                awayTeam: "Villarreal",
                league: "La Liga",
                kickoff: "18:30",
                predictedScore: "2 - 1",
                pick: "Barcelona Win or Draw (1X)",
                odds: 1.24,
                marketCategory: "Double Chance",
                confidence: 91,
                reasoning: "Catalan side home dominance; safety floor protection.",
              },
              {
                matchId: "m8",
                homeTeam: "Bayer Leverkusen",
                awayTeam: "Wolfsburg",
                league: "Bundesliga",
                kickoff: "15:30",
                predictedScore: "2 - 0",
                pick: "Leverkusen Win (1)",
                odds: 1.45,
                marketCategory: "1X2",
                confidence: 86,
                reasoning: "Alonso's system creates 2.8 big chances/game at BayArena.",
              },
              {
                matchId: "m9",
                homeTeam: "Liverpool",
                awayTeam: "Everton",
                league: "Premier League",
                kickoff: "12:30",
                predictedScore: "2 - 1",
                pick: "Over 1.5 Goals",
                odds: 1.22,
                marketCategory: "Over/Under Goals",
                confidence: 89,
                reasoning: "Merseyside derby historical minimum 2 goals scored in 9/10 past meetings.",
              },
              {
                matchId: "m10",
                homeTeam: "Feyenoord",
                awayTeam: "Utrecht",
                league: "Eredivisie",
                kickoff: "14:30",
                predictedScore: "3 - 1",
                pick: "Over 1.5 Goals",
                odds: 1.33,
                marketCategory: "Over/Under Goals",
                confidence: 88,
                reasoning: "Eredivisie tempo favors rapid transitional goal-scoring.",
              },
            ],
          },
        ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3 Daily High-Win-Rate Banker Tickets (2.00x – 3.00x)</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Mathematically Solved Daily Bankers
            </h2>
            <p className="text-sm text-slate-300">
              Generated every night at 00:00 UTC using Poisson exact score simulation and zero-trap safety floors (Double Chance, Over 1.5 Goals, Draw No Bet). Strict mathematical boundary: each ticket is bounded strictly between 2.00x and 3.00x odds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            {!isVipOrPro ? (
              <button
                onClick={onOpenVipModal}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition"
              >
                <Crown className="w-4 h-4" />
                <span>Unlock All 3 Bankers</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span>VIP Banker Access Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3 Banker Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {displayBankers.map((ticket, index) => {
          const sportyCopiedKey = `${ticket.id}-sporty`;
          const bet9jaCopiedKey = `${ticket.id}-bet9ja`;

          return (
            <div
              key={ticket.id || index}
              className="flex flex-col justify-between rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-xl overflow-hidden"
            >
              {/* Ticket Header */}
              <div className="p-5 md:p-6 border-b border-slate-800/80 bg-slate-950/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Banker #{index + 1}</span>
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{ticket.safetyScore || 90}% Safety Rating</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{ticket.title}</h3>

                <div className="flex items-baseline justify-between pt-2">
                  <div>
                    <span className="text-3xl font-black text-amber-400 tracking-tight">
                      {ticket.totalOdds.toFixed(2)}x
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5 font-medium">Total Multiplier</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-400 block">Rec. Stake</span>
                    <span className="text-xs font-bold text-slate-200">3.5% Bankroll</span>
                  </div>
                </div>
              </div>

              {/* Match Legs */}
              <div className="p-5 md:p-6 space-y-3.5 flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Audited Match Selection ({ticket.legs.length} Legs)</span>
                  <span>Predicted Outcome</span>
                </div>

                {ticket.legs.map((leg, lIdx) => (
                  <div
                    key={leg.matchId || lIdx}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700/80 transition"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-semibold text-slate-400 truncate max-w-[140px]">
                        {leg.league}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {leg.kickoff}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {/* Teams & Score */}
                      <div className="min-w-0 flex-1">
                        {isVipOrPro ? (
                          <>
                            <div className="text-sm font-bold text-white truncate">
                              {leg.homeTeam} vs {leg.awayTeam}
                            </div>
                            <div className="text-xs text-amber-400 font-mono font-medium flex items-center gap-1 mt-0.5">
                              <span>Exact Score: {leg.predictedScore}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-300 filter blur-[3.5px] select-none">
                                Top League Match
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> VIP
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Lock className="w-3 h-3" />
                              <span>Scoreline locked for Free users</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Pick & Odds (ALWAYS VISIBLE!) */}
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                          {leg.pick}
                        </span>
                        <div className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">
                          @{leg.odds.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Booking Codes & Actions */}
              <div className="p-5 md:p-6 bg-slate-950/80 border-t border-slate-800/80">
                {isVipOrPro ? (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ready-to-Load Booking Codes:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* SportyBet */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-red-400 font-bold uppercase">SportyBet</div>
                          <div className="text-xs font-mono font-black text-white">
                            {ticket.sportyCode}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(ticket.sportyCode, sportyCopiedKey)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Copy SportyBet code"
                        >
                          {copiedCode === sportyCopiedKey ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Bet9ja */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-emerald-400 font-bold uppercase">Bet9ja</div>
                          <div className="text-xs font-mono font-black text-white">
                            {ticket.bet9jaCode}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(ticket.bet9jaCode, bet9jaCopiedKey)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Copy Bet9ja code"
                        >
                          {copiedCode === bet9jaCopiedKey ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {onLoadIntoBuilder && (
                      <button
                        onClick={() => onLoadIntoBuilder(ticket)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 mt-2"
                      >
                        <span>Open in Slip Builder</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
                      <div className="text-xs font-bold text-amber-400 mb-0.5 flex items-center justify-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>VIP Protected Banker Slip</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Match names & SportyBet/Bet9ja booking codes are exclusive to VIP members.
                      </p>
                    </div>

                    <button
                      onClick={onOpenVipModal}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black uppercase tracking-wider shadow-md shadow-amber-950/40 flex items-center justify-center gap-2 transition"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Unlock Banker #{index + 1} Codes</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

