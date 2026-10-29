"use client";

import React from "react";
import {
  Compass,
  Sparkles,
  SlidersHorizontal,
  Split,
  TrendingDown,
  Shuffle,
  Layers,
  Zap,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Flame,
  Award,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { WorkspaceTab } from "../Navbar";

export interface PlatformGuideViewProps {
  onNavigateTab: (tab: WorkspaceTab) => void;
}

export const PlatformGuideView: React.FC<PlatformGuideViewProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-5xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Oddora AI Master Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          How to Win with Oddora AI
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Welcome to Oddora AI. Our platform uses deep mathematical algorithms, Poisson distribution, head-to-head metrics, and automated SportyBet order generation to help punters build, prune, and book high-probability tickets.
        </p>
      </div>

      {/* Quick Navigation Anchor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="#daily-slips"
          className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-xs text-slate-900 dark:text-white">1. Daily Accumulators</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </a>

        <a
          href="#edit-game"
          className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-bold text-xs text-slate-900 dark:text-white">2. Edit Game Pruner</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </a>

        <a
          href="#booking"
          className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-bold text-xs text-slate-900 dark:text-white">3. SportyBet Booking</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* Section 1: How Daily Accumulators & Bankers Work */}
      <section id="daily-slips" className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          <Flame className="w-4 h-4" />
          <span>Part 1 • Ready-Made Slips</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Daily Ready-Made Odds & Bankers
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Every morning, our backend algorithmic engines ingest live fixtures from SportyBet, score them against 10 years of historical form, and construct mathematically sound ready-made tickets categorized by multiplier:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                2.00x SUPER BANKER
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">2 Matches • ~87% Win Rate</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Designed for serious punters staking daily capital. Combines 2 ultra-safe selections (such as Double Chance 1X or Over 1.5 Goals) where win probabilities exceed 85%.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                3.00x & 5.00x VALUE SLIPS
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">3–4 Matches • Balanced</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Provides higher upside with controlled risk by blending Match Winner 1X2 with high-probability Over 2.5 and BTTS selections.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                10.00x SPREAD ACCUMULATOR
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">6–8 Matches • Mid-High</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Balanced multi-game ticket for weekend action. Best combined with the <strong>Edit Game Pruner</strong> to strip out 1 or 2 high-variance legs before placing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                OVER 2.5 SPECIAL DAILY
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Specialized Goal Engine</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Strictly filters for attacking teams with combined average goal expectancies above 2.80 per game (e.g., Bayern, Man City, Real Madrid).
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigateTab("home")}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs inline-flex items-center gap-1.5 transition shadow-sm"
          >
            <span>View Today's Ready Slips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Section 2: How the Edit Game Pruner Works */}
      <section id="edit-game" className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Part 2 • Engine 4 (Edit Slip)</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Mastering the 4-Mode Edit Game Engine
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Most accumulators fail by just 1 or 2 games. The Edit Game Engine decodes any SportyBet booking code, analyzes every individual leg, and allows you to prune risky legs or split long tickets into smaller winning tickets:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              <Split className="w-4 h-4" />
              <span>Mode 1: Split Ticket</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Splits a long 10-match ticket into 2, 3, or 4 independent mini-tickets. Each ticket is re-booked immediately with its own verified SportyBet booking code.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <TrendingDown className="w-4 h-4" />
              <span>Mode 2: Remove Lowest Probability</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Uses the API-Football Deep Stats Brain to compute the "Danger Score" of each leg and strips away the riskiest legs, leaving behind the safest accumulator core.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <Shuffle className="w-4 h-4" />
              <span>Mode 3: Remove Random Games</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Quickly prunes down ticket size to reduce bet variance while keeping the overall multiplier balanced.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <Layers className="w-4 h-4" />
              <span>Mode 4: Combo Mode (Big + Small Odds)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Simultaneously strips volatile longshots (odds &gt; 2.20) and low-value small odds (odds &lt; 1.15) that add risk with almost zero payout benefit.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigateTab("edit_game")}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs inline-flex items-center gap-1.5 transition shadow-sm"
          >
            <span>Launch Edit Game Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Section 3: 1-Click SportyBet Loading vs Copying Codes */}
      <section id="booking" className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          <Zap className="w-4 h-4" />
          <span>Part 3 • SportyBet Booking Protocol</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          How to Load or Manually Book SportyBet Slips
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Oddora AI is exclusively integrated with SportyBet's official order sharing API. Every ticket generated on our platform has two simple ways to be placed:
        </p>

        <div className="space-y-3 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              1
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Method A: 1-Click "Load Slip on SportyBet"
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                Tap the red <strong>"Load Slip Directly on SportyBet"</strong> button. This opens SportyBet with all matches, markets, and selections already placed in your betslip. Enter your stake and tap "Place Bet".
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              2
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Method B: Copy Booking Code
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                Tap <strong>"Copy"</strong> on any slip card. Open your SportyBet app or website, go to Betslip, tap "Booking Code", paste the code, and tap "Load".
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pro Betting Rules */}
      <div className="p-5 sm:p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4" />
          <span>3 Golden Rules of Long-Term Sports Betting</span>
        </div>
        <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
          <li><strong>Never stake more than 5% of your bankroll on a single ticket.</strong> Consistency beats greed.</li>
          <li><strong>Prioritize 2x and 3x bankers</strong> over 50x spread tickets for regular steady profit.</li>
          <li><strong>Always check starting lineups</strong> 45 minutes before kickoff for unexpected key player injuries.</li>
        </ul>
      </div>
    </div>
  );
};

