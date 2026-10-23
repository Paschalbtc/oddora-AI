"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  Gift,
  ArrowRight,
  TrendingUp,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/lib/supabase";
import { OddoraWorkspace } from "@/components/OddoraWorkspace";

export default function DashboardPage() {
  const { profile, user, switchPlanDemo } = useAuth();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://oddora.ai");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const planTier = profile?.plan_tier || "FREE";
  const refCode = profile?.referral_code || "ODD-BETA1";
  const refLink = `${origin}/auth?ref=${refCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8 animate-in fade-in duration-300">
      {/* =========================================================================
          MEMBER GREETING & ACCOUNT OVERVIEW
         ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1427] via-[#090d19] to-[#060913] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LOGGED IN • QUANTITATIVE SUITE ACTIVE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              Welcome Back,{" "}
              <span className="bg-gradient-to-r from-[#10B981] to-[#F59E0B] bg-clip-text text-transparent">
                {profile?.full_name || "Beta Member"}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              {profile?.email || (user?.email ?? "Connected via Supabase Auth")} • Instant machine learning predictions & autonomous autopsy tracking.
            </p>
          </div>

          {/* Active Tier Card */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                Your Tier
              </span>
              <span className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                {planTier === "VIP" && <Crown className="w-4 h-4 text-amber-400" />}
                {planTier === "PRO" && <Zap className="w-4 h-4 text-emerald-400" />}
                {planTier === "FREE" && <ShieldCheck className="w-4 h-4 text-slate-400" />}
                <span>{planTier} TIER</span>
              </span>
            </div>

            <Link
              href="/pricing"
              className="ml-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              {planTier === "VIP" ? "Manage" : "Upgrade"}
            </Link>
          </div>
        </div>

        {/* Affiliate Link Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <Gift className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-medium">Your 30% Lifetime Referral Link:</span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {refCode}
            </span>
            <span className="text-[11px] text-slate-400">
              (${ (profile?.affiliate_balance || 0).toFixed(2) } earned • { profile?.total_referrals || 0 } referred)
            </span>
          </div>

          <button
            onClick={copyReferralLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Affiliate Link!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy My Referral Link</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE QUANT WORKSPACE
          - 4 Telemetry Cards + Admin Drawer
          - Daily AI Predictions Feed with VIP Lock Gating
          - 20,000x Multiplier Slip Generator & Copilot
          - 12:00 AM Self-Learning Autopsy Tab
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-emerald-400" />
              <span>Oddora AI Core Workspace</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Explore today's Poisson model predictions, build high-odds slips, or analyze midnight loss autopsies.
            </p>
          </div>
        </div>

        <OddoraWorkspace defaultTab="picks" showTelemetryBar={true} />
      </section>
    </div>
  );
}
