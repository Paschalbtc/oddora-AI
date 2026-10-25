"use client";

import React from "react";
import { Compass, Sparkles, SlidersHorizontal, ShieldCheck, Activity, Bot, ArrowRight, CheckCircle2 } from "lucide-react";

const ONBOARDING_STEPS = [
  {
    step: "Step 1",
    title: "Browse Daily Match Intelligence & Predicted Scores",
    badge: "All Matches",
    icon: Compass,
    color: "emerald",
    description:
      "Explore today's, tomorrow's, and the next 48-hour fixture catalog grouped cleanly by league. Every match row displays kickoff times, team form dots, Poisson exact predicted scores (e.g., 2 - 1), high-floor tips, and statistical confidence ratings.",
    tip: "Free users get 5 full sample matches today. VIP unlocks all matches across all 3 days.",
  },
  {
    step: "Step 2",
    title: "Grab the 3 Daily Bankers & Algorithm Ready Slips",
    badge: "Bankers & Ready Slips",
    icon: ShieldCheck,
    color: "amber",
    description:
      "Every morning at 00:00 UTC, the AI synthesizes 3 Dedicated Banker Slips (2.00x–3.00x Odds) plus 4 Algorithm Ready Slips (3x-5x, 10x, 20x, 50x). Each ticket is mathematically solved to maximize real-world survival using zero-trap high floor markets.",
    tip: "Copy the booking code directly into SportyBet or Bet9ja with a single tap.",
  },
  {
    step: "Step 3",
    title: "Solve Custom Target Odds with the Slip Builder",
    badge: "Slip Builder",
    icon: Sparkles,
    color: "cyan",
    description:
      "Choose your desired multiplier (from 2x all the way up to 20,000x), select your timeframe (Today, 2 Days, 1 Week), and pick your preferred bet markets (Corners, Double Chance, Over 1.5 Goals, BTTS). The solver builds a harmonized accumulator meeting your exact criteria.",
    tip: "The solver enforces Ticket Harmony: it never stacks more than 30% straight wins on long tickets.",
  },
  {
    step: "Step 4",
    title: "Audit & Prune Existing Bets with Edit Slip AI",
    badge: "Edit Slip",
    icon: SlidersHorizontal,
    color: "purple",
    description:
      "Have a long accumulator from a tipster or WhatsApp group? Paste your SportyBet or Bet9ja booking code into Edit Slip AI. The Senior Analyst scans every leg, identifies draw traps, rotation risks, and fatigue catalysts, removes the bad legs, and issues an audited replacement ticket.",
    tip: "Choose between Conservative, Tactical Value, or Aggressive pruning modes.",
  },
  {
    step: "Step 5",
    title: "Chat with AI Copilot & Track the Midnight Autopsy",
    badge: "Copilot & Autopsy",
    icon: Bot,
    color: "emerald",
    description:
      "Engage the conversational AI Copilot in a full-screen, distraction-free studio for instant tactical queries or booking code audits. At 12:00 AM UTC, the Midnight Autopsy autonomously grades yesterday's slips, conducts failure autopsies on lost legs, and recalibrates the AI's weights for the next morning.",
    tip: "Oddora AI learns continuously from every match result using vector memory.",
  },
];

export const HowItWorksGuide: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c1427] via-[#091224] to-[#040812] border border-white/10 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
          <Compass className="w-3.5 h-3.5" />
          <span>PLATFORM ONBOARDING GUIDE</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">How Oddora AI Works: 5-Step Winning System</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Everything you need to master quantitative sports intelligence, build mathematically protected tickets, and beat bookmakers consistently.
        </p>
      </div>

      {/* 5 Steps Grid */}
      <div className="space-y-4">
        {ONBOARDING_STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="p-5 sm:p-6 rounded-3xl bg-[#0c1427]/85 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 text-emerald-400">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-wider">
                      {s.step}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                      {s.badge}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">{s.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{s.description}</p>
                  <p className="text-[11px] text-amber-300/90 font-mono pt-1">
                    <strong>Pro Tip:</strong> {s.tip}
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => {
                    if (idx === 0) onNavigateTab("all_matches");
                    if (idx === 1) onNavigateTab("bankers");
                    if (idx === 2) onNavigateTab("slip_builder");
                    if (idx === 3) onNavigateTab("edit_slip");
                    if (idx === 4) onNavigateTab("copilot");
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 shrink-0 self-end md:self-center"
                >
                  <span>Open {s.badge}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HowItWorksGuide;

