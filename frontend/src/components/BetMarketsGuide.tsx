"use client";

import React, { useState } from "react";
import { BookOpen, Search, Sparkles, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";

interface MarketCard {
  name: string;
  category: "Main" | "Goals" | "Special & VIP";
  sportyCode: string;
  bet9jaCode: string;
  plainMeaning: string;
  example: string;
  aiHeuristic: string;
}

const MARKETS_DICTIONARY: MarketCard[] = [
  {
    name: "1X2 (Match Result)",
    category: "Main",
    sportyCode: "1 / X / 2",
    bet9jaCode: "1 / X / 2",
    plainMeaning: "Predict whether Home wins (1), match ends in Draw (X), or Away wins (2) at the end of 90 minutes.",
    example: "Final score 2 - 1 wins for 1; 1 - 1 wins for X; 0 - 2 wins for 2.",
    aiHeuristic: "Strict Poisson Rule: Only selected when BOTH primary and secondary Poisson scores favor the winner AND win probability exceeds 72%.",
  },
  {
    name: "Double Chance (1X, X2, 12)",
    category: "Main",
    sportyCode: "1X / 12 / X2",
    bet9jaCode: "1X / 12 / X2",
    plainMeaning: "Covers 2 out of 3 possible match outcomes. 1X = Home or Draw; X2 = Draw or Away; 12 = Either team wins (no draw).",
    example: "If host wins 1 - 0 or draws 1 - 1, 1X wins completely.",
    aiHeuristic: "Oddora's #1 Zero-Trap safety floor. Automatically replaces risky Straight Wins whenever draw probability is 26% or higher.",
  },
  {
    name: "Draw No Bet (DNB)",
    category: "Main",
    sportyCode: "DNB 1 / DNB 2",
    bet9jaCode: "DNB1 / DNB2",
    plainMeaning: "Back a team to win. If the match ends in a draw, your stake is 100% refunded (odds become 1.00 on accumulators).",
    example: "Arsenal DNB: Wins on 2-0; refunds your money on 1-1; loses only on defeat.",
    aiHeuristic: "Deployed on competitive away favorites where domestic variance is high but losing is unlikely.",
  },
  {
    name: "Over / Under 1.5 Goals",
    category: "Goals",
    sportyCode: "Over 1.5 / Under 1.5",
    bet9jaCode: "O1.5 / U1.5",
    plainMeaning: "Predict whether the total combined goals scored by both teams will be 2 or more (Over) or 1 or fewer (Under).",
    example: "Scores 1 - 1, 2 - 0, or 0 - 2 (2+ total goals) win Over 1.5.",
    aiHeuristic: "The single highest-survival market in European football. Selected when combined expected goals (lambdaHome + lambdaAway) > 2.30.",
  },
  {
    name: "Over / Under 2.5 Goals",
    category: "Goals",
    sportyCode: "Over 2.5 / Under 2.5",
    bet9jaCode: "O2.5 / U2.5",
    plainMeaning: "Requires 3 or more total goals for Over 2.5 (e.g. 2-1, 3-0, 2-2), or 2 or fewer goals for Under 2.5.",
    example: "A 2 - 1 scoreline contains 3 goals, winning Over 2.5.",
    aiHeuristic: "Selected when game scripts reveal 'Dominant Home Siege' or 'High-Tempo Transition' with weak transition defenses.",
  },
  {
    name: "Both Teams To Score (BTTS / GG & NG)",
    category: "Goals",
    sportyCode: "GG (Yes) / NG (No)",
    bet9jaCode: "GG / NG",
    plainMeaning: "GG requires BOTH teams to score at least 1 goal. NG requires at least one team to keep a clean sheet (0 goals).",
    example: "Score 1 - 1 wins GG. Score 2 - 0 wins NG.",
    aiHeuristic: "Selected when Poisson simulation shows away expected goals > 1.05 and home clean-sheet probability < 28%.",
  },
  {
    name: "Corners (Over/Under 8.5 & 9.5 Corners)",
    category: "Special & VIP",
    sportyCode: "Market 166 (Total Corners)",
    bet9jaCode: "CORNERS O8.5",
    plainMeaning: "Predict the total number of corner kicks taken by both clubs combined during regulation play.",
    example: "10 total match corners wins Over 8.5 and Over 9.5.",
    aiHeuristic: "VIP Anchor Market: Unaffected by random finishing variance. High wing-cross volume teams generate predictable set-piece floors.",
  },
  {
    name: "Cards / Bookings (Over/Under 3.5 Cards)",
    category: "Special & VIP",
    sportyCode: "Total Booking Points",
    bet9jaCode: "CARDS O3.5",
    plainMeaning: "Predict the total number of yellow and red cards issued by the referee in 90 minutes (Yellow = 1, Red = 2).",
    example: "4 yellow cards issued wins Over 3.5 Cards.",
    aiHeuristic: "Catalyst Alert: Senior Analyst triggers Over Cards in fierce local derbies with strict match referees.",
  },
  {
    name: "European & Asian Handicaps (+1.5, -1)",
    category: "Special & VIP",
    sportyCode: "Handicap (+1.5 / -1)",
    bet9jaCode: "1(+1.5) / 2(-1)",
    plainMeaning: "Applies a virtual head-start or deficit to a team's final score before deciding the winner.",
    example: "Host +1.5 Handicap: Even if host loses 0 - 1, the handicap score is 1.5 - 1 (a win!).",
    aiHeuristic: "High-floor VIP defense: Provides an impenetrable cushion for resilient underdogs against heavy favorites.",
  },
  {
    name: "1st Half Goals (Over 0.5 HT)",
    category: "Special & VIP",
    sportyCode: "1st Half Over 0.5",
    bet9jaCode: "HT O0.5",
    plainMeaning: "At least 1 goal must be scored by either team during the first 45 minutes + stoppage time.",
    example: "Score 1 - 0 at halftime wins Over 0.5 HT.",
    aiHeuristic: "Targeted in high-pressing leagues (Bundesliga, Premier League) where fast starts are tactically prioritized.",
  },
  {
    name: "Win Either Half (WEH)",
    category: "Special & VIP",
    sportyCode: "Win Either Half",
    bet9jaCode: "1WEH / 2WEH",
    plainMeaning: "The backed team must win either the 1st half scoreline OR the 2nd half scoreline independently.",
    example: "Host wins 1st half 1-0. Even if 2nd half ends 0-1 (final 1-1), host won the first half, so WEH wins!",
    aiHeuristic: "Protects against 90-minute defensive collapse when a team dominates in specific tactical game phases.",
  },
];

export const BetMarketsGuide: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filtered = MARKETS_DICTIONARY.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.plainMeaning.toLowerCase().includes(search.toLowerCase()) ||
      m.sportyCode.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c1427] via-[#091224] to-[#040812] border border-white/10 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              <BookOpen className="w-3.5 h-3.5" />
              <span>OFFICIAL BETTING ENCYCLOPEDIA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Bet Markets Guide & Plain-English Dictionary</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Learn exactly how SportyBet and Bet9ja markets work, what scorelines win, and how the Senior AI Analyst selects high-floor anchors.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search market (e.g. DNB, Corners)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10 overflow-x-auto no-scrollbar">
          {["ALL", "Main", "Goals", "Special & VIP"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              {cat === "ALL" ? "All Markets (11)" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dictionary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.name}
            className="p-5 rounded-3xl bg-[#0c1427]/85 border border-white/10 hover:border-cyan-500/40 transition-all shadow-md space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {item.category}
                </span>
                <h3 className="text-base font-black text-white mt-1.5">{item.name}</h3>
              </div>

              <div className="text-right text-[11px] font-mono">
                <div className="text-slate-400">Sporty: <strong className="text-white">{item.sportyCode}</strong></div>
                <div className="text-slate-400">Bet9ja: <strong className="text-emerald-400">{item.bet9jaCode}</strong></div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {item.plainMeaning}
            </p>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Winning Example:</span>
              </div>
              <p className="text-slate-400 text-[11px] pl-5">{item.example}</p>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                🧠 Senior AI Analyst Heuristic:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">{item.aiHeuristic}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BetMarketsGuide;

