"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  Activity,
  Users,
  Crown,
  Zap,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Gift,
  Bot,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/lib/supabase";
import { OddoraLogo } from "@/components/OddoraLogo";
import { OddoraWorkspace } from "@/components/OddoraWorkspace";

export default function Home() {
  const { user, profile, switchPlanDemo } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const planTier = profile?.plan_tier || "FREE";

  // Check API health via serverless predictions endpoint
  useEffect(() => {
    fetch("/api/predictions")
      .then((res) => setApiOnline(res.ok))
      .catch(() => setApiOnline(false));
  }, []);

  const handlePlanChange = async (newPlan: "FREE" | "PRO" | "VIP") => {
    setIsSwitching(true);
    await switchPlanDemo(newPlan);
    setIsSwitching(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-10 animate-in fade-in duration-300">
      {/* =========================================================================
          HIGH-CONVERTING HERO SECTION
         ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1427] via-[#090d19] to-[#060913] border border-white/10 p-6 sm:p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>QUANTITATIVE SPORTS INTELLIGENCE ENGINE • BETA v1.0</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Predict The Future.
              <br />
              <span className="bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#F59E0B] bg-clip-text text-transparent">
                Beat The Bookmakers.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed">
              Oddora AI analyzes millions of data points, Poisson expected goals (xG), real-time internet injury updates,
              and 768-dimensional loss autopsy memory to generate mathematically grounded predictions and 20,000x accumulator slips.
            </p>

            {/* Quick Hero Value Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 font-medium">Top 3 Free Daily</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 font-medium">Edit Slip AI Pruner</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-slate-300 font-medium">20,000x Multiplier</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 font-medium">40% Affiliate Cut</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              {!user ? (
                <>
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                  >
                    <span>Start Winning with AI Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 transition-colors"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Explore VIP Pass</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-[#10B981] to-[#059669] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                  >
                    <span>Open Member Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 transition-colors"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Manage Subscription</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User Quick Status & Beta Tester Tier Switcher */}
          <div className="w-full lg:w-auto p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex flex-col gap-4 min-w-[300px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Experience Tier</span>
              {planTier === "VIP" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <Crown className="w-3.5 h-3.5" /> VIP UNLOCKED
                </span>
              ) : planTier === "PRO" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Zap className="w-3.5 h-3.5" /> PRO PASS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5" /> FREE TIER
                </span>
              )}
            </div>

            <div className="text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Referral Code:</span>
                <span className="font-mono font-bold text-emerald-400">{profile?.referral_code || "ODD-BETA1"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Affiliate Commission:</span>
                <span className="font-mono font-bold text-amber-400">${(profile?.affiliate_balance || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                <span className="text-slate-400">FastAPI Backend:</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${apiOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {apiOnline ? "ONLINE (Port 8000)" : "READY"}
                </span>
              </div>
            </div>

            {/* 1-Tap Tier Switcher to Test VIP Lock Gating */}
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold">Switch Plan (Test VIP Gating):</span>
                {isSwitching && <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["FREE", "PRO", "VIP"] as const).map((t) => (
                  <button
                    key={t}
                    disabled={isSwitching}
                    onClick={() => handlePlanChange(t)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      planTier === t
                        ? "bg-emerald-500/25 text-emerald-300 border-emerald-500 shadow-sm"
                        : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE FULL INTERACTIVE WORKSPACE
          - 4 Telemetry Cards + Admin Drawer
          - Daily Predictions Feed with VIP Lock Gating
          - 20,000x Multiplier Slip Generator & Copilot
          - 12:00 AM Self-Learning Autopsy Tab
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-emerald-400" />
              <span>Oddora AI Live Intelligence Workspace</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Interactive feed, combinatorial accumulator slips, and autonomous failure autopsy reports.
            </p>
          </div>
        </div>

        <OddoraWorkspace defaultTab="home" showTelemetryBar={true} />
      </section>
    </div>
  );
}
