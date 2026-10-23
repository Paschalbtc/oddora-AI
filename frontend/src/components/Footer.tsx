"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  Activity,
  Crown,
  Users,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Flame,
  Zap,
  SlidersHorizontal,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { OddoraLogo } from "./OddoraLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#060913] border-t border-white/[0.08] text-slate-400 text-sm overflow-x-hidden">
      {/* Top Gradient Accent */}
      <div className="w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500 opacity-70" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand & Autonomous Telemetry */}
          <div className="space-y-4">
            <OddoraLogo size="md" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Autonomous Sports Intelligence & Combinatorial Betslip Engine. Synthesizing live injury telemetry, Poisson distribution models, and algorithmic multiplier solvers.
            </p>

            {/* Live Telemetry Status Pill */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  AI Systems Operational
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Llama-3.3-70B • Gemini Flash • DDGS Live Scraper
              </p>
              <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Self-Learning:</span>
                <span className="text-amber-400 font-mono font-bold">Epoch #42 • 1,420+ Lessons</span>
              </div>
            </div>

            {/* 18+ Responsible Gaming Notice */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[11px]">
              <span className="font-bold text-xs bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30">
                18+
              </span>
              <p className="leading-tight text-slate-400">
                Please gamble responsibly. Oddora AI is a quantitative sports analytics intelligence platform. 18+ only.
              </p>
            </div>
          </div>

          {/* Column 2: Core AI Tools */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Core AI Engines
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/slip-builder"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  20,000-Odds Slip Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/edit-slip"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  Edit Slip AI (Catalyst Pruner)
                </Link>
              </li>
              <li>
                <Link
                  href="/autopsy"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Midnight Autopsy & Memory
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Daily AI Picks Feed (24-48h)
                </Link>
              </li>
              <li>
                <span className="text-slate-400 flex items-center gap-1.5 cursor-default">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Live Team News & Injury Scraper
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Supported Bookmakers */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Bookmaker Engines
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center justify-between text-slate-300">
                <span>SportyBet Fast Booking Engine</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  REAL CODES
                </span>
              </li>
              <li className="flex items-center justify-between text-slate-300">
                <span>Bet9ja Coupon Code Converter</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  ACTIVE
                </span>
              </li>
              <li className="text-slate-400">1xBet & 22Bet Multiplier Exporter</li>
              <li className="text-slate-400">Logarithmic Combinatorial Solver</li>
              <li className="text-slate-400">Poisson High-Yield Distribution</li>
              <li className="text-slate-400">Kelly Criterion Risk Allocation</li>
            </ul>
          </div>

          {/* Column 4: Monetization & Partners */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-400" />
              Syndicate & Partners
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/affiliates"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Affiliate Partner Hub
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    40% COMM
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  VIP Syndicate Pass (Instant Beta)
                </Link>
              </li>
              <li>
                <a
                  href="https://t.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  Telegram Sharp Money Alerts
                </a>
              </li>
              <li>
                <span className="text-slate-400 flex items-center gap-1.5 cursor-default">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Responsible Gaming Protocols
                </span>
              </li>
              <li>
                <span className="text-slate-400 flex items-center gap-1.5 cursor-default">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                  Terms of Service & Beta Disclaimer
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Oddora AI Inc. All rights reserved. Built for quantitative sports strategists.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Server Time: {new Date().toUTCString().slice(17, 25)} UTC</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">ODDORA-CORE v2.4</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

