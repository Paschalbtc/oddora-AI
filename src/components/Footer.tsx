"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Zap,
  Flame,
  Layers,
  Sparkles,
  SlidersHorizontal,
  BookOpen,
  HelpCircle,
  Headphones,
  ExternalLink,
  ChevronRight,
  X,
  Mail,
  MessageSquare,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { OddoraLogo } from "./OddoraLogo";
import { WorkspaceTab } from "./Navbar";

export interface FooterProps {
  onNavigateTab: (tab: WorkspaceTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  const [activeLegalModal, setActiveLegalModal] = useState<"privacy" | "terms" | "disclaimer" | null>(null);

  return (
    <>
      <footer className="w-full bg-slate-100 dark:bg-[#070A0E] border-t border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {/* Column 1: Brand Identity & Mission Statement */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <OddoraLogo size="sm" showBadge={true} />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Oddora AI is an advanced sports prediction platform combining machine learning, Poisson distribution models, and head-to-head catalyst analytics. We curate daily high-probability tickets and provide instant 1-click booking codes exclusively for SportyBet.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SportyBet Verified Engine</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">
                  <span>18+ Responsible Gaming</span>
                </span>
              </div>
            </div>

            {/* Column 2: Core Features */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
                Core Features & Engines
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("home")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-emerald-500" />
                    <span>Daily Odds & Super Bankers</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("slip_builder")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-emerald-500" />
                    <span>Combinatorial Slip Builder</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("edit_game")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-emerald-500" />
                    <span>4-Mode Edit Game Engine</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("over_25")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-emerald-500" />
                    <span>Over 2.5 Goals Daily Special</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("all_matches")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-emerald-500" />
                    <span>All Matches • 4 Sports Schedule</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources & Help */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
                Resources & Guides
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("guide")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-cyan-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">Platform Guide (How to Play)</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("markets_glossary")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <Layers className="w-3 h-3 text-cyan-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">Betting Markets Glossary</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("pricing")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>VIP Plans & Pricing</span>
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:support@oddora.ai"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left"
                  >
                    <Headphones className="w-3 h-3 text-rose-500" />
                    <span>24/7 VIP Customer Support</span>
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("affiliates")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span>Affiliates Partner Program</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Compliance */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 dark:text-white">
                Legal & Responsible Gaming
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal("privacy")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal("terms")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3 text-slate-400" />
                    <span>Terms of Service</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal("disclaimer")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span>Platform Disclaimer</span>
                  </button>
                </li>
              </ul>

              {/* 18+ Notice Box */}
              <div className="p-3 rounded-2xl bg-slate-200/60 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 space-y-1">
                <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-mono font-black">
                    18+
                  </span>
                  <span>Bet Responsibly</span>
                </span>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                  Sports betting involves financial risk. Oddora AI provides quantitative predictions for educational and entertainment purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Attribution */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <div>
              <span>© {new Date().getFullYear()} Oddora AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>All 4 Analytical Engines Operational</span>
              </span>
              <span>SportyBet Partner Verified</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-black text-base">
                {activeLegalModal === "privacy" && "Privacy Policy"}
                {activeLegalModal === "terms" && "Terms of Service"}
                {activeLegalModal === "disclaimer" && "Platform Disclaimer"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              {activeLegalModal === "privacy" && (
                <>
                  <p>Oddora AI respects your privacy. We collect minimal personal information (such as your email and display name) strictly for account authentication, ticket synchronization, and subscription management.</p>
                  <p>We do not sell, rent, or trade your personal data to third-party marketing companies. All authentication tokens and passwords are encrypted using industry-standard AES-256 protocols via Supabase Auth.</p>
                </>
              )}
              {activeLegalModal === "terms" && (
                <>
                  <p>By accessing or creating an account on Oddora AI, you agree to comply with our Terms of Service. Users must be at least 18 years old or the age of legal majority in their jurisdiction.</p>
                  <p>Oddora AI provides algorithmic sports data models and automated SportyBet code generation. Predictions do not guarantee financial returns. You are solely responsible for any stakes placed on external bookmaker sites.</p>
                </>
              )}
              {activeLegalModal === "disclaimer" && (
                <>
                  <p>Sports betting involves risk of capital loss. Past statistical win rates generated by Oddora AI's models do not guarantee future match outcomes.</p>
                  <p>Oddora AI is not an unlicensed bookmaker or gambling operator. We do not accept bets or handle fiat currency deposits. All booking codes are generated strictly via SportyBet's official order sharing protocol.</p>
                </>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

