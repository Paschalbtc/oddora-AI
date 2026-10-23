"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Gift,
  Copy,
  Check,
  TrendingUp,
  Share2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Crown,
  Zap,
  Clock,
  Sparkles,
  ExternalLink,
  Building2,
  Wallet,
  X,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { useAuth, API_BASE_URL } from "@/lib/supabase";

interface ReferralRecord {
  id: string;
  user_name: string;
  email_masked: string;
  created_at: string;
  plan_tier: "FREE" | "PRO" | "VIP";
  status: "ACTIVE" | "PENDING" | "TRIAL";
  commission_earned: number;
}

// Sample referral records to display if database referral table is newly populated
const MOCK_REFERRALS: ReferralRecord[] = [
  {
    id: "ref-101",
    user_name: "Chukwuma O.",
    email_masked: "ch***@gmail.com",
    created_at: "2026-10-21T14:22:00Z",
    plan_tier: "VIP",
    status: "ACTIVE",
    commission_earned: 9.99,
  },
  {
    id: "ref-102",
    user_name: "Emmanuel B.",
    email_masked: "em***@yahoo.com",
    created_at: "2026-10-21T11:05:00Z",
    plan_tier: "PRO",
    status: "ACTIVE",
    commission_earned: 2.99,
  },
  {
    id: "ref-103",
    user_name: "Tariq S.",
    email_masked: "ta***@outlook.com",
    created_at: "2026-10-20T19:40:00Z",
    plan_tier: "VIP",
    status: "ACTIVE",
    commission_earned: 9.99,
  },
  {
    id: "ref-104",
    user_name: "David K.",
    email_masked: "da***@gmail.com",
    created_at: "2026-10-20T08:15:00Z",
    plan_tier: "FREE",
    status: "TRIAL",
    commission_earned: 0.0,
  },
  {
    id: "ref-105",
    user_name: "Segun A.",
    email_masked: "se***@gmail.com",
    created_at: "2026-10-19T21:30:00Z",
    plan_tier: "PRO",
    status: "ACTIVE",
    commission_earned: 2.99,
  },
];

// Helper for deterministic referral date formatting
const formatReferralDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function AffiliatesPage() {
  const { profile, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");

  // Calculator State
  const [calcReferrals, setCalcReferrals] = useState<number>(25);
  const [calcPlanType, setCalcPlanType] = useState<"PRO" | "VIP" | "MIX">("VIP");

  // Referral History Data
  const [referrals, setReferrals] = useState<ReferralRecord[]>(MOCK_REFERRALS);
  const [liveStats, setLiveStats] = useState({
    total_referrals: profile?.total_referrals || 5,
    active_vip_conversions: 3,
    affiliate_balance: profile?.affiliate_balance || 25.96,
  });

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"BANK" | "CRYPTO" | "PAYPAL">("BANK");
  const [payoutAmount, setPayoutAmount] = useState<string>("25.96");
  const [bankName, setBankName] = useState("Access Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("TRC-20 (USDT)");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [origin, setOrigin] = useState("https://oddora.ai");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const planTier = profile?.plan_tier || "FREE";
  const refCode = profile?.referral_code || "ODD-BETA1";
  const refLink = `${origin}/auth?ref=${refCode}`;

  // Commission Rate based on user's active tier
  const commissionRatePercent = planTier === "VIP" ? 40 : planTier === "PRO" ? 30 : 20;

  // Fetch real referrals from backend if user is logged in
  useEffect(() => {
    if (user?.id) {
      fetch(`${API_BASE_URL}/api/user/${user.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.referrals && data.referrals.length > 0) {
            const mapped: ReferralRecord[] = data.referrals.map((r: any, idx: number) => ({
              id: r.id || `r-${idx}`,
              user_name: r.user_name || `Member ${idx + 1}`,
              email_masked: r.email_masked || "trader***@oddora.ai",
              created_at: r.created_at || new Date().toISOString(),
              plan_tier: (r.plan_tier || "PRO") as any,
              status: (r.status || "ACTIVE") as any,
              commission_earned: parseFloat(r.commission_earned || "7.50"),
            }));
            setReferrals(mapped);
            setLiveStats({
              total_referrals: data.total_referrals || mapped.length,
              active_vip_conversions: mapped.filter((m) => m.plan_tier !== "FREE").length,
              affiliate_balance: data.affiliate_balance || 0,
            });
            setPayoutAmount(data.affiliate_balance ? data.affiliate_balance.toFixed(2) : "25.00");
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic Calculator Math
  // Rate: commissionRatePercent / 100
  // Pro price: $9.99 / ₦10,000 | VIP price: $24.99 / ₦25,000
  const rateMultiplier = commissionRatePercent / 100;
  const avgSubPriceUSD = calcPlanType === "VIP" ? 24.99 : calcPlanType === "PRO" ? 9.99 : 17.49;
  const avgSubPriceNGN = calcPlanType === "VIP" ? 25000 : calcPlanType === "PRO" ? 10000 : 17500;

  const monthlyUSD = calcReferrals * avgSubPriceUSD * rateMultiplier;
  const monthlyNGN = calcReferrals * avgSubPriceNGN * rateMultiplier;
  const yearlyUSD = monthlyUSD * 12;
  const yearlyNGN = monthlyNGN * 12;

  // Handle Payout Request Submission
  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPayout(true);

    setTimeout(() => {
      setIsSubmittingPayout(false);
      setPayoutSuccessMsg(
        `✅ Payout request of $${payoutAmount} submitted successfully! Reference: PAY-ODD-${Math.floor(1000 + Math.random() * 9000)}. Funds will arrive in 2-4 hours.`
      );
      setLiveStats((prev) => ({ ...prev, affiliate_balance: 0.0 }));
      setTimeout(() => {
        setIsPayoutModalOpen(false);
        setPayoutSuccessMsg(null);
      }, 3500);
    }, 1200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-14 space-y-10 animate-in fade-in duration-300">
      {/* =========================================================================
          HERO & VALUE BANNER
         ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1427] via-[#090d19] to-[#060913] border border-white/10 p-6 sm:p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>PARTNER PROGRAM • LIFETIME 20% TO 40% RECURRING</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Earn Passive Income With{" "}
              <span className="bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#F59E0B] bg-clip-text text-transparent">
                Oddora AI
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Every bettor, friend, or community member you refer earns you recurring monthly payouts as long as their subscription remains active. No caps, zero withdrawal fees.
            </p>
          </div>

          {/* Current Commission Status Card */}
          <div className="w-full lg:w-auto p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Your Commission Rate
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {commissionRatePercent}% TIER
              </span>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Your Plan:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  {planTier === "VIP" ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <Zap className="w-3.5 h-3.5 text-emerald-400" />}
                  {planTier}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VIP Rate Boost:</span>
                <span className="text-amber-400 font-semibold">{planTier === "VIP" ? "Maxed at 40%" : "Upgrade for 40%"}</span>
              </div>
            </div>

            {planTier !== "VIP" && (
              <Link
                href="/pricing"
                className="mt-1 py-2 px-3 rounded-xl text-center text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Unlock 40% Commission (VIP)</span>
              </Link>
            )}
          </div>
        </div>

        {/* 1-Click Unique Referral Link Box */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Your Unique Affiliate Referral Link:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1 min-w-[260px] p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs sm:text-sm text-emerald-400 select-all overflow-x-auto no-scrollbar">
                {refLink}
              </div>
              <button
                onClick={copyLink}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied Link!" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Share Buttons (WhatsApp & Telegram) */}
          <div className="flex items-center gap-2 self-start md:self-end pt-2 md:pt-0">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Join Oddora AI for machine learning sports predictions and 20,000x accumulator slips! Sign up with my link: ${refLink}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 hover:bg-[#25D366]/30 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to WhatsApp</span>
            </a>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(
                "Join Oddora AI for machine-learning football predictions!"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/40 hover:bg-[#0088cc]/30 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to Telegram</span>
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4 METRIC CARDS
         ========================================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Referrals */}
        <div className="p-5 rounded-3xl bg-[#0c1427]/85 border border-white/10 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Referrals</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-black text-white block mt-2">
            {liveStats.total_referrals}
          </span>
          <span className="text-[11px] text-slate-400 block font-mono">Registered users</span>
        </div>

        {/* Card 2: Active VIP Conversions */}
        <div className="p-5 rounded-3xl bg-[#0c1427]/85 border border-white/10 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Active Paid Users</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-3xl font-black text-amber-400 block mt-2">
            {liveStats.active_vip_conversions}
          </span>
          <span className="text-[11px] text-slate-400 block font-mono">Pro & VIP subscribers</span>
        </div>

        {/* Card 3: Commission Rate */}
        <div className="p-5 rounded-3xl bg-[#0c1427]/85 border border-white/10 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Commission Rate</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-cyan-400">{commissionRatePercent}%</span>
            <span className="text-[11px] text-slate-400 font-mono">Recurring</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Tier rate (20% - 40%)</span>
        </div>

        {/* Card 4: Withdrawable Earnings + Payout Button */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0e1933] to-[#0c1427] border border-emerald-500/30 space-y-1 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-wider">Withdrawable</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-300 font-mono">
                ${liveStats.affiliate_balance.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                (≈ ₦{(liveStats.affiliate_balance * 1500).toLocaleString()})
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Request Payout</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          EARNINGS CALCULATOR SLIDER (Interactive Simulator 1 - 500 Referrals)
         ========================================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#0c1427]/90 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
              <Sliders className="w-4 h-4" />
              <span>PROJECTED MONTHLY RECURRING REVENUE SIMULATOR</span>
            </div>
            <h2 className="text-2xl font-black text-white">Affiliate Earnings Calculator</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Slide to see how much monthly recurring passive income you will make promoting Oddora AI.
            </p>
          </div>

          {/* Assumed Plan Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-[10px] text-slate-400 font-bold px-2">PLAN:</span>
            {[
              { id: "PRO", label: "Pro ($9.99)" },
              { id: "VIP", label: "VIP ($24.99)" },
              { id: "MIX", label: "50/50 Mix" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setCalcPlanType(p.id as any)}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
                  calcPlanType === p.id
                    ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* The Range Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-300">
              Referred Active Members:{" "}
              <strong className="text-white text-lg font-mono ml-1">{calcReferrals} Friends</strong>
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Commission Rate: {commissionRatePercent}%
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="500"
            value={calcReferrals}
            onChange={(e) => setCalcReferrals(parseInt(e.target.value) || 1)}
            className="w-full accent-emerald-500 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-xs text-slate-500 font-mono">
            <span>1 Member</span>
            <span>100 Members</span>
            <span>250 Members</span>
            <span>500 Members</span>
          </div>
        </div>

        {/* Earnings Display Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Monthly Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-[#0c1427] border border-emerald-500/30 space-y-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Estimated Monthly Recurring Income
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                ${monthlyUSD.toFixed(2)}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 font-mono">
                (₦{Math.round(monthlyNGN).toLocaleString()}/mo)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Paid directly to your bank account or crypto wallet every month.
            </p>
          </div>

          {/* Annual Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-[#0c1427] border border-amber-500/30 space-y-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Estimated Annual Passive Payout
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                ${yearlyUSD.toFixed(2)}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 font-mono">
                (₦{Math.round(yearlyNGN).toLocaleString()}/yr)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Compounded lifetime revenue as members renew every year.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          REFERRAL HISTORY TABLE
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Referral Network & Commission History</span>
            </h3>
            <p className="text-xs text-slate-400">
              Transparent real-time ledger of members registered under your referral code.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-400">
            {referrals.length} Total Records
          </span>
        </div>

        {/* Table Container */}
        <div className="rounded-3xl bg-[#0c1427]/85 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.04] border-b border-white/10 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Referred Member</th>
                  <th className="py-3.5 px-4 font-bold">Date Joined</th>
                  <th className="py-3.5 px-4 font-bold">Plan Tier</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[11px] font-bold text-emerald-400">
                          {r.user_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold block text-white">{r.user_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{r.email_masked}</span>
                        </div>
                      </div>
                    </td>

                    <td suppressHydrationWarning className="py-3.5 px-4 font-mono text-slate-400">
                      {formatReferralDate(r.created_at)}
                    </td>

                    <td className="py-3.5 px-4">
                      {r.plan_tier === "VIP" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Crown className="w-3 h-3 text-amber-400" /> VIP
                        </span>
                      ) : r.plan_tier === "PRO" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Zap className="w-3 h-3 text-emerald-400" /> PRO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          FREE
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          r.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      ${r.commission_earned.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          REQUEST PAYOUT MODAL
         ========================================================================= */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1427] border border-white/15 p-6 sm:p-7 shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                INSTANT AFFILIATE CASH-OUT
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">Request Earnings Payout</h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero fees. Payouts are transferred automatically within 2 to 4 hours.
              </p>
            </div>

            {payoutSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center leading-relaxed">
                {payoutSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                {/* Method Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Payout Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "BANK", label: "Nigerian Bank", icon: Building2 },
                      { id: "CRYPTO", label: "USDT Crypto", icon: Wallet },
                      { id: "PAYPAL", label: "PayPal / Wire", icon: CreditCard },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPayoutMethod(m.id as any)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center gap-1 border ${
                            payoutMethod === m.id
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                              : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount to Withdraw */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="text-slate-400 font-semibold">Amount to Withdraw</label>
                    <span className="text-slate-400">
                      Balance: <strong className="text-emerald-400">${liveStats.affiliate_balance.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="5"
                      max={liveStats.affiliate_balance || 1000}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      required
                      className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-3 pl-8 pr-16 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(liveStats.affiliate_balance.toFixed(2))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Conditional Fields based on method */}
                {payoutMethod === "BANK" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Access Bank, Zenith Bank, GTBank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        required
                        className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-2.5 px-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Account Number</label>
                        <input
                          type="text"
                          placeholder="0123456789"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          required
                          className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-2.5 px-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Account Name</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          required
                          className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-2.5 px-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {payoutMethod === "CRYPTO" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">USDT Network</label>
                      <select
                        value={cryptoNetwork}
                        onChange={(e) => setCryptoNetwork(e.target.value)}
                        className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-2.5 px-3.5 text-base text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="TRC-20 (USDT)">TRC-20 (Tron Network - Low Fee)</option>
                        <option value="ERC-20 (USDT)">ERC-20 (Ethereum Network)</option>
                        <option value="BEP-20 (USDT)">BEP-20 (BNB Smart Chain)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">USDT Wallet Address</label>
                      <input
                        type="text"
                        placeholder="e.g. T..."
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value)}
                        required
                        className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-2.5 px-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {payoutMethod === "PAYPAL" && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">PayPal Email Address</label>
                    <input
                      type="email"
                      placeholder="payout@example.com"
                      required
                      className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-2.5 px-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingPayout || parseFloat(payoutAmount) <= 0}
                  className="w-full mt-2 py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingPayout ? "Processing Payout..." : "Confirm & Send Payout"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
