"use client";

import React from "react";
import { Trophy, Zap, ShieldCheck, Flame } from "lucide-react";

interface WinningSlipEvent {
  user: string;
  slipType: string;
  odds: string;
  payout: string;
  timeAgo: string;
  icon: "trophy" | "zap" | "flame";
}

const RECENT_WINNERS: WinningSlipEvent[] = [
  {
    user: "pa***@gmail.com",
    slipType: "10 Odds Multiplier",
    odds: "10.50x",
    payout: "₦52,500",
    timeAgo: "12m ago",
    icon: "trophy",
  },
  {
    user: "em***@yahoo.com",
    slipType: "3 Odds Double",
    odds: "3.40x",
    payout: "₦17,000",
    timeAgo: "28m ago",
    icon: "zap",
  },
  {
    user: "ch***@gmail.com",
    slipType: "50 Odds Accelerator",
    odds: "50.00x",
    payout: "₦250,000",
    timeAgo: "1h ago",
    icon: "flame",
  },
  {
    user: "da***@outlook.com",
    slipType: "2 Odds Safe Banker",
    odds: "2.15x",
    payout: "₦43,000",
    timeAgo: "2h ago",
    icon: "trophy",
  },
  {
    user: "to***@gmail.com",
    slipType: "5 Odds Multiplier",
    odds: "5.20x",
    payout: "₦26,000",
    timeAgo: "3h ago",
    icon: "zap",
  },
  {
    user: "vi***@gmail.com",
    slipType: "100 Odds Centurion",
    odds: "100.00x",
    payout: "₦500,000",
    timeAgo: "4h ago",
    icon: "flame",
  },
  {
    user: "sa***@gmail.com",
    slipType: "2 Odds Safe Double",
    odds: "2.05x",
    payout: "₦20,500",
    timeAgo: "5h ago",
    icon: "trophy",
  },
  {
    user: "ke***@yahoo.com",
    slipType: "10 Odds Multiplier",
    odds: "10.40x",
    payout: "₦104,000",
    timeAgo: "6h ago",
    icon: "zap",
  },
];

export const LiveWinningSlipsTicker: React.FC = () => {
  // Duplicate array for seamless infinite marquee loop
  const tickerItems = [...RECENT_WINNERS, ...RECENT_WINNERS];

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-xl py-2 px-3 flex items-center gap-3">
      {/* Fixed Live Badge */}
      <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono font-black text-[11px] uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
        <span className="hidden sm:inline">LIVE WINS</span>
        <span className="sm:hidden">WINS</span>
      </div>

      {/* Marquee Track */}
      <div className="flex-1 overflow-hidden mask-fade-edges">
        <div className="animate-marquee flex items-center gap-6">
          {tickerItems.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 text-xs whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium"
            >
              <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                {item.user}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                won {item.slipType}
              </span>
              <span className="px-1.5 py-0.2 rounded font-mono font-black text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                {item.odds}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ({item.payout})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {item.timeAgo}
              </span>
              <span className="text-slate-300 dark:text-slate-600 mx-1">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

