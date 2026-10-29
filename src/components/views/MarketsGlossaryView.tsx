"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Search,
  CheckCircle2,
  X,
  Layers,
  Flame,
  ShieldCheck,
  Zap,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

export interface MarketItem {
  id: string;
  name: string;
  shortCode: string;
  category: "MAIN" | "GOALS" | "HANDICAP_HALVES";
  sportybetMarketId: string;
  definition: string;
  howItWins: string;
  example: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  typicalOdds: string;
}

export const MARKETS_DATA: MarketItem[] = [
  // 1. MAIN MARKETS
  {
    id: "1x2",
    name: "1X2 (Match Winner / 3-Way)",
    shortCode: "1 / X / 2",
    category: "MAIN",
    sportybetMarketId: "Market ID: 1 (Outcomes: 1=Home, 2=Draw, 3=Away)",
    definition: "Predict which team will win the match at the end of normal time (90 minutes plus injury time), or whether it ends in a draw.",
    howItWins: "If you pick '1' (Home Win), the home team must win. If you pick 'X', the game must end level. If you pick '2' (Away Win), the away team must win.",
    example: "Arsenal vs Chelsea ends 2-1. Selection '1' wins. Selections 'X' and '2' lose.",
    riskLevel: "MEDIUM",
    typicalOdds: "1.35 – 4.50",
  },
  {
    id: "double_chance",
    name: "Double Chance (1X, 12, X2)",
    shortCode: "1X / 12 / X2",
    category: "MAIN",
    sportybetMarketId: "Market ID: 10 (Outcomes: 9=1X, 10=12, 11=X2)",
    definition: "Combines two out of the three possible outcomes into one single selection, giving you double protection on the result.",
    howItWins: "• 1X: Wins if Home wins OR the match is a Draw.\n• X2: Wins if Away wins OR the match is a Draw.\n• 12: Wins if either Home OR Away wins (no draw).",
    example: "Liverpool vs Man City ends 1-1. '1X' and 'X2' both WIN. '12' loses.",
    riskLevel: "LOW",
    typicalOdds: "1.15 – 1.65",
  },
  {
    id: "dnb",
    name: "Draw No Bet (DNB)",
    shortCode: "DNB (1 or 2)",
    category: "MAIN",
    sportybetMarketId: "Market ID: 11 (Outcomes: 1=Home, 2=Away)",
    definition: "Back a team to win, but if the match ends in a draw at full time, your stake is fully refunded (voided at 1.00 odds in an accumulator).",
    howItWins: "Your chosen team must win the match. If the match is drawn, you do not lose your money.",
    example: "You bet Real Madrid (DNB). If Real Madrid wins 1-0, you win. If it ends 2-2, your bet is refunded.",
    riskLevel: "LOW",
    typicalOdds: "1.25 – 2.10",
  },

  // 2. GOALS MARKETS
  {
    id: "over_15_goals",
    name: "Over 1.5 Goals",
    shortCode: "Over 1.5",
    category: "GOALS",
    sportybetMarketId: "Market ID: 18 (specifier: total=1.5, Outcome: 12)",
    definition: "Predict that the total number of goals scored by both teams combined will be 2 or more.",
    howItWins: "The match needs at least 2 goals. Scores like 1-1, 2-0, 0-2, 2-1, 3-0 all win.",
    example: "Bayern Munich vs Dortmund ends 2-0 (2 total goals). The bet WINS. A score of 1-0 or 0-0 loses.",
    riskLevel: "LOW",
    typicalOdds: "1.18 – 1.35",
  },
  {
    id: "over_25_goals",
    name: "Over 2.5 Goals",
    shortCode: "Over 2.5",
    category: "GOALS",
    sportybetMarketId: "Market ID: 18 (specifier: total=2.5, Outcome: 12)",
    definition: "Predict that the total number of goals scored by both teams will be 3 or more.",
    howItWins: "The match needs at least 3 goals. Scores like 2-1, 3-0, 2-2, 3-1, 1-2 all win.",
    example: "Barcelona vs Real Madrid ends 2-1 (3 total goals). The bet WINS. A score of 2-0 loses.",
    riskLevel: "MEDIUM",
    typicalOdds: "1.55 – 2.15",
  },
  {
    id: "under_25_goals",
    name: "Under 2.5 Goals",
    shortCode: "Under 2.5",
    category: "GOALS",
    sportybetMarketId: "Market ID: 18 (specifier: total=2.5, Outcome: 13)",
    definition: "Predict that the total number of goals scored by both teams will be 2 or fewer (0, 1, or 2 goals).",
    howItWins: "The match ends with 0-0, 1-0, 0-1, 1-1, or 2-0. Any score with 3+ goals loses.",
    example: "Juventus vs Roma ends 1-0 (1 goal). The bet WINS. A score of 2-1 (3 goals) loses.",
    riskLevel: "MEDIUM",
    typicalOdds: "1.65 – 2.20",
  },
  {
    id: "btts",
    name: "Both Teams to Score (BTTS / GG)",
    shortCode: "GG (Yes) / NG (No)",
    category: "GOALS",
    sportybetMarketId: "Market ID: 29 (Outcomes: 74=Yes/GG, 76=No/NG)",
    definition: "Predict whether both the Home and Away team will score at least one goal each during the 90 minutes.",
    howItWins: "• GG (Yes): Both teams score (e.g. 1-1, 2-1, 3-2).\n• NG (No): At least one team keeps a clean sheet (e.g. 1-0, 0-0, 0-2).",
    example: "Newcastle vs Aston Villa ends 1-1. 'GG (Yes)' WINS. If Newcastle won 2-0, 'NG (No)' wins.",
    riskLevel: "MEDIUM",
    typicalOdds: "1.60 – 1.95",
  },
  {
    id: "team_total_goals",
    name: "Team Total Goals (Over 0.5 / 1.5 Individual)",
    shortCode: "Team Over X.5",
    category: "GOALS",
    sportybetMarketId: "Market ID: 19 / 20 (Home / Away Individual Totals)",
    definition: "Predict the exact number of goals scored by ONE specific team, regardless of the opponent's score.",
    howItWins: "If you back 'Home Team Over 0.5 Goals', the home team only needs to score at least 1 goal.",
    example: "Arsenal vs PSG: You pick Arsenal Over 0.5 Goals. Arsenal scores 1 goal. Your bet WINS even if PSG wins 2-1.",
    riskLevel: "LOW",
    typicalOdds: "1.12 – 1.45",
  },

  // 3. HANDICAPS & HALVES
  {
    id: "asian_handicap",
    name: "Asian Handicap (+1.5 / -1.5)",
    shortCode: "AH (+1.5 / -1.5)",
    category: "HANDICAP_HALVES",
    sportybetMarketId: "Market ID: 14 / 223 (Handicap with specifier)",
    definition: "A virtual goal advantage or deficit applied to a team before kickoff to eliminate the draw.",
    howItWins: "• +1.5 Handicap: Your team can win, draw, or lose by only 1 goal, and your bet still wins!\n• -1.5 Handicap: Your team must win by 2 or more clear goals.",
    example: "Everton (+1.5) vs Man City. Match ends Everton 0-1 Man City. Adding +1.5 gives Everton 1.5 - 1. Your bet WINS!",
    riskLevel: "LOW",
    typicalOdds: "1.30 – 1.85",
  },
  {
    id: "ht_ft",
    name: "Half-Time / Full-Time (HT/FT)",
    shortCode: "1/1, X/1, 2/2",
    category: "HANDICAP_HALVES",
    sportybetMarketId: "Market ID: 12 (9 Combinations)",
    definition: "Predict both the result at Half-Time (45 mins) AND the final result at Full-Time (90 mins).",
    howItWins: "Both halves must match your pick exactly. For '1/1', Home must lead at HT and win at FT.",
    example: "Score at HT: 1-0. Score at FT: 2-1. Selection '1/1' (Home/Home) WINS. Selection 'X/1' loses.",
    riskLevel: "HIGH",
    typicalOdds: "2.10 – 12.00",
  },
  {
    id: "highest_scoring_half",
    name: "Highest Scoring Half",
    shortCode: "1st / 2nd / Equal",
    category: "HANDICAP_HALVES",
    sportybetMarketId: "Market ID: 31 (1st Half, 2nd Half, Equal)",
    definition: "Predict which of the two 45-minute halves will produce the most total goals.",
    howItWins: "Most football matches produce more goals in the 2nd half due to fatigue and tactical opening.",
    example: "1st half has 0 goals. 2nd half has 2 goals. '2nd Half' WINS.",
    riskLevel: "MEDIUM",
    typicalOdds: "1.90 – 3.20",
  },
];

export const MarketsGlossaryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "MAIN" | "GOALS" | "HANDICAP_HALVES">("ALL");

  const cleanQ = searchQuery.trim().toLowerCase();

  const filtered = MARKETS_DATA.filter((m) => {
    const matchesCat = selectedCategory === "ALL" || m.category === selectedCategory;
    const matchesQuery =
      !cleanQ ||
      m.name.toLowerCase().includes(cleanQ) ||
      m.shortCode.toLowerCase().includes(cleanQ) ||
      m.definition.toLowerCase().includes(cleanQ) ||
      m.howItWins.toLowerCase().includes(cleanQ);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Oddora AI Betting Encyclopedia</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Betting Markets Glossary & Rules
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Never be confused by your betslip again. Explore plain-English explanations, winning scenarios, and official SportyBet market codes for every betting option on Oddora AI.
        </p>

        {/* Live Search Input */}
        <div className="pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by market name or abbreviation (e.g. 1X2, DNB, BTTS, Handicap, Over 2.5)..."
              className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-[#070A0E] border border-slate-200 dark:border-white/15 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 no-scrollbar">
          {[
            { id: "ALL", label: "All Markets", count: MARKETS_DATA.length },
            { id: "MAIN", label: "1. Main Markets (1X2, DC, DNB)", count: 3 },
            { id: "GOALS", label: "2. Goals Markets (Over/Under, BTTS)", count: 5 },
            { id: "HANDICAP_HALVES", label: "3. Handicaps & Halves", count: 3 },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                selectedCategory === cat.id
                  ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
              }`}
            >
              <span>{cat.label}</span>
              <span className="ml-1.5 opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Directory of Market Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 text-slate-500 font-mono text-xs">
            No betting markets found matching "{searchQuery}". Try searching for "Over 2.5", "1X2", or "BTTS".
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-md space-y-3.5 hover:border-cyan-500/40 transition"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    {item.shortCode}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      item.riskLevel === "LOW"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : item.riskLevel === "MEDIUM"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                    }`}
                  >
                    Risk: {item.riskLevel}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                    Odds: {item.typicalOdds}
                  </span>
                </div>
              </div>

              {/* Definition */}
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Plain-English Definition:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {item.definition}
                </p>
              </div>

              {/* How It Wins & Concrete Example */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/5 border border-emerald-500/20 text-xs">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase block mb-1">
                    ✓ How This Selection Wins:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {item.howItWins}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-500/5 border border-cyan-500/20 text-xs">
                  <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-400 uppercase block mb-1">
                    💡 Concrete Real-World Example:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.example}
                  </p>
                </div>
              </div>

              {/* SportyBet Mapping metadata */}
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 flex items-center gap-1.5">
                <span className="font-bold text-slate-600 dark:text-slate-300">SportyBet API Mapping:</span>
                <span>{item.sportybetMarketId}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

