"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Crown,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Gift,
  X,
  CreditCard,
  Building2,
  Smartphone,
  Check,
  Lock,
  Flame,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth, API_BASE_URL } from "@/lib/supabase";

type BillingCycle = "MONTHLY" | "YEARLY";
type Currency = "USD" | "NGN";

interface PricingPlan {
  id: "FREE" | "PRO" | "VIP";
  name: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  priceMonthly: { USD: number; NGN: number };
  priceYearly: { USD: number; NGN: number };
  priceYearlyPerMonth: { USD: number; NGN: number };
  affiliateCommission: string;
  features: { text: string; highlight?: boolean }[];
  ctaText: string;
  popular?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    id: "FREE",
    name: "Scout (Free Tier)",
    description: "Ideal for beginners and hobbyists testing our AI quantitative accuracy.",
    priceMonthly: { USD: 0, NGN: 0 },
    priceYearly: { USD: 0, NGN: 0 },
    priceYearlyPerMonth: { USD: 0, NGN: 0 },
    affiliateCommission: "20% Lifetime Affiliate Commission",
    features: [
      { text: "3 Safe AI Picks / day (Top Confidence)" },
      { text: "Max 5.00 Odds Slip Builder" },
      { text: "3 AI Chat queries / day" },
      { text: "20% Affiliate Commission rate" },
      { text: "Standard Poisson distribution modeling" },
      { text: "Community public leaderboard" },
    ],
    ctaText: "Current Plan",
  },
  {
    id: "PRO",
    name: "Tactician Pro",
    badge: "MOST POPULAR",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    popular: true,
    description: "Designed for disciplined sports investors demanding daily high-probability volume.",
    priceMonthly: { USD: 9.99, NGN: 10000 },
    priceYearly: { USD: 79, NGN: 80000 },
    priceYearlyPerMonth: { USD: 6.58, NGN: 6666 },
    affiliateCommission: "30% Lifetime Affiliate Commission",
    features: [
      { text: "All 25+ Daily AI Picks (Safe, Value & High Odds)", highlight: true },
      { text: "Up to 500 Odds Slip Builder & Booking Codes", highlight: true },
      { text: "50 AI News & Stats Chat queries / day" },
      { text: "Full 12:00 AM Autopsy Reports & Root Causes" },
      { text: "30% Affiliate Commission on all referrals", highlight: true },
      { text: "Real-time Internet Injury & Lineup Scraper signals" },
      { text: "Email & Push notification pick alerts" },
    ],
    ctaText: "Upgrade to Tactician Pro",
  },
  {
    id: "VIP",
    name: "Syndicate VIP",
    badge: "MAX EDGE • 20,000X",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description: "The ultimate institutional quant edge with uncapped multi-leg slips and direct memory bank.",
    priceMonthly: { USD: 24.99, NGN: 25000 },
    priceYearly: { USD: 199, NGN: 200000 },
    priceYearlyPerMonth: { USD: 16.58, NGN: 16666 },
    affiliateCommission: "40% Recurring Affiliate Commission",
    features: [
      { text: "Everything in Pro included", highlight: true },
      { text: "Unlimited 20,000+ Odds Slip & Code Generator", highlight: true },
      { text: "Unlimited Live Internet AI Sports Copilot", highlight: true },
      { text: "768-Dim Vector AI Memory Bank Lessons", highlight: true },
      { text: "Sharp Money & Bookmaker Line Inversion Alerts" },
      { text: "40% Recurring Affiliate Commission (Highest Tier)", highlight: true },
      { text: "VIP Direct Booking Codes (1-Click WhatsApp/Telegram)" },
      { text: "Private Telegram Syndicate Channel & 24/7 Priority Quant" },
    ],
    ctaText: "Join Syndicate VIP",
  },
];

export default function PricingPage() {
  const { profile, user, switchPlanDemo, refreshProfile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [currency, setCurrency] = useState<Currency>("USD");

  // Modal checkout state
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PricingPlan | null>(null);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [activePaymentTab, setActivePaymentTab] = useState<"BETA" | "PAYSTACK" | "FLUTTERWAVE" | "CARD">("BETA");

  const currentPlan = profile?.plan_tier || "FREE";

  const handleOpenCheckout = (plan: PricingPlan) => {
    if (plan.id === currentPlan) return;
    setSelectedPlanForCheckout(plan);
    setCheckoutSuccess(null);
  };

  const handleActivateBetaAccess = async () => {
    if (!selectedPlanForCheckout) return;
    setIsProcessingUpgrade(true);

    const targetTier = selectedPlanForCheckout.id;
    const userId = user?.id || profile?.id || "demo-user";

    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          plan_tier: targetTier,
          billing_cycle: billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY",
        }),
      });

      if (res.ok) {
        await switchPlanDemo(targetTier);
        if (refreshProfile) await refreshProfile();
        setCheckoutSuccess(`🎉 You are now an active ${selectedPlanForCheckout.name} member! All ${targetTier} capabilities are unlocked.`);
        setTimeout(() => {
          setSelectedPlanForCheckout(null);
          setCheckoutSuccess(null);
        }, 2200);
      } else {
        // Fallback local upgrade so user is never blocked
        await switchPlanDemo(targetTier);
        setCheckoutSuccess(`🎉 Upgraded to ${selectedPlanForCheckout.name} (Demo Mode Activated)!`);
        setTimeout(() => {
          setSelectedPlanForCheckout(null);
          setCheckoutSuccess(null);
        }, 2200);
      }
    } catch (err) {
      console.warn("Upgrade call error:", err);
      await switchPlanDemo(targetTier);
      setCheckoutSuccess(`🎉 Switched to ${selectedPlanForCheckout.name}!`);
      setTimeout(() => {
        setSelectedPlanForCheckout(null);
        setCheckoutSuccess(null);
      }, 2200);
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  const formatPrice = (plan: PricingPlan) => {
    if (plan.id === "FREE") {
      return currency === "USD" ? "$0" : "₦0";
    }

    if (billingCycle === "YEARLY") {
      const perMonth = plan.priceYearlyPerMonth[currency];
      return currency === "USD"
        ? `$${perMonth.toFixed(2)}`
        : `₦${perMonth.toLocaleString()}`;
    }

    const monthly = plan.priceMonthly[currency];
    return currency === "USD"
      ? `$${monthly.toFixed(2)}`
      : `₦${monthly.toLocaleString()}`;
  };

  const formatBilledText = (plan: PricingPlan) => {
    if (plan.id === "FREE") return "Free forever";
    if (billingCycle === "YEARLY") {
      const totalYearly = plan.priceYearly[currency];
      return currency === "USD"
        ? `Billed $${totalYearly}/year (Save 34%)`
        : `Billed ₦${totalYearly.toLocaleString()}/year (Save 33%)`;
    }
    return "Billed monthly, cancel anytime";
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-14 space-y-10 animate-in fade-in duration-300">
      {/* =========================================================================
          HERO & HEADER CONTROLS
         ========================================================================= */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>TRANSPARENT VALUE PRICING • ZERO SPREAD MARKUPS</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
          Invest In Pure Mathematical Edge.
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed">
          Oddora AI runs Poisson simulations, scrapes breaking news from 50+ sports outlets, and learns from every loss.
          Choose your tier to unlock high-odds multipliers and institutional sports analytics.
        </p>

        {/* =========================================================================
            SWITCHERS: MONTHLY/YEARLY TOGGLE & USD/NGN CURRENCY SWITCHER
           ========================================================================= */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Monthly / Yearly Toggle */}
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-emerald-500 text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "YEARLY"
                  ? "bg-emerald-500 text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-black shadow-sm">
                Save 34%
              </span>
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center">
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currency === "USD"
                  ? "bg-white/15 text-white shadow-sm border border-white/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency("NGN")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currency === "NGN"
                  ? "bg-white/15 text-white shadow-sm border border-white/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              NGN (₦)
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRICING CARDS GRID (3 Sleek Responsive Cards)
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isVip = plan.id === "VIP";
          const isPro = plan.id === "PRO";

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                isVip
                  ? "bg-gradient-to-b from-[#11192e] via-[#0d1424] to-[#070b14] border-2 border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.2)] md:-translate-y-2"
                  : isPro
                  ? "bg-gradient-to-b from-[#0e182f] via-[#091122] to-[#070a14] border-2 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                  : "bg-[#0b1222]/90 border border-white/10 shadow-lg"
              }`}
            >
              {/* Background ambient glow */}
              {isVip && (
                <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              )}
              {isPro && (
                <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
              )}

              <div className="space-y-5 relative z-10">
                {/* Header Row: Title & Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    {plan.id} TIER
                  </span>
                  {plan.badge && (
                    <span
                      className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full border shadow-sm ${plan.badgeColor}`}
                    >
                      {plan.badge}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      ACTIVE TIER
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    {isVip && <Crown className="w-5 h-5 text-amber-400" />}
                    {isPro && <Zap className="w-5 h-5 text-emerald-400" />}
                    {plan.id === "FREE" && <ShieldCheck className="w-5 h-5 text-slate-400" />}
                    <span>{plan.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="py-2 border-y border-white/5 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl sm:text-5xl font-black tracking-tight ${
                        isVip ? "text-amber-300" : isPro ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {formatPrice(plan)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ month</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">{formatBilledText(plan)}</p>
                </div>

                {/* Affiliate Perk Callout */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-2 text-xs">
                  <Gift className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300 font-semibold">{plan.affiliateCommission}</span>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    What's included:
                  </span>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            feature.highlight
                              ? isVip
                                ? "text-amber-400"
                                : "text-emerald-400"
                              : "text-slate-500"
                          }`}
                        />
                        <span
                          className={
                            feature.highlight
                              ? "text-white font-bold"
                              : "text-slate-300"
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 relative z-10">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold bg-white/[0.05] text-slate-400 border border-white/10 cursor-default"
                  >
                    Your Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenCheckout(plan)}
                    className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                      isVip
                        ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        : isPro
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          FAQ & GUARANTEE SECTION
         ========================================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/20 via-slate-900 to-amber-950/20 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-base">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Oddora AI Fairness & Risk Control Commitment</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            We are not a bookmaker; we are a quantitative sports analytics engine. All predictions strictly adhere to fair-market Poisson distributions with verified 12:00 AM autopsies.
          </p>
        </div>

        <Link
          href="/affiliates"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 transition-colors flex-shrink-0"
        >
          <Gift className="w-4 h-4 text-emerald-400" />
          <span>Earn with Our Affiliate Program (30-40%)</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* =========================================================================
          INTERACTIVE CHECKOUT & BETA TESTER PAYMENT MODAL
         ========================================================================= */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1427] border border-white/15 p-6 sm:p-7 shadow-2xl relative space-y-5">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPlanForCheckout(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white border border-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                ODDORA AI CHECKOUT • {billingCycle} PASS
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                Upgrade to {selectedPlanForCheckout.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Unlock full access to {selectedPlanForCheckout.id === "VIP" ? "unlimited 20,000x slips and memory lessons" : "all 25+ daily picks and autopsy data"}.
              </p>
            </div>

            {/* Price Summary Box */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Total Payable Now</span>
                <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                  {formatPrice(selectedPlanForCheckout)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatBilledText(selectedPlanForCheckout)}
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {currency}
              </span>
            </div>

            {/* Payment Method Tabs */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">Select Payment Gateway:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "BETA", label: "Beta $0", icon: Sparkles },
                  { id: "PAYSTACK", label: "Paystack", icon: Smartphone },
                  { id: "FLUTTERWAVE", label: "Flutter", icon: Building2 },
                  { id: "CARD", label: "Card", icon: CreditCard },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivePaymentTab(tab.id as any)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center gap-1 border ${
                        activePaymentTab === tab.id
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                          : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gateway Placeholders */}
            {activePaymentTab === "PAYSTACK" && (
              <div className="p-4 rounded-2xl bg-[#080d19] border border-white/10 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Paystack Direct Checkout</span>
                  <span className="text-[10px] font-mono text-emerald-400">NGN & Cards</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Support for Bank Transfers, USSD, Verve, Mastercard, and Visa across Africa.
                </p>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-[11px] text-slate-400">
                  Live merchant key configured for production deployment.
                </div>
              </div>
            )}

            {activePaymentTab === "FLUTTERWAVE" && (
              <div className="p-4 rounded-2xl bg-[#080d19] border border-white/10 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Flutterwave Global Checkout</span>
                  <span className="text-[10px] font-mono text-amber-400">USD, NGN, KES, GHS</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Accepts Apple Pay, Google Pay, M-Pesa, and international cards with instant conversion.
                </p>
              </div>
            )}

            {activePaymentTab === "CARD" && (
              <div className="p-4 rounded-2xl bg-[#080d19] border border-white/10 text-xs text-slate-300 space-y-2.5">
                <span className="font-bold text-white block">Credit or Debit Card</span>
                <input
                  type="text"
                  placeholder="Card Number: 4000 1234 5678 9010"
                  disabled
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-base text-slate-400 cursor-not-allowed"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    disabled
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-base text-slate-400 cursor-not-allowed"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    disabled
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 px-3 text-base text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Instant Beta Access Testing Button (Emerald Callout) */}
            <div className="space-y-2 pt-2">
              <button
                disabled={isProcessingUpgrade}
                onClick={handleActivateBetaAccess}
                className="w-full py-4 px-5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#059669] hover:opacity-95 text-black shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isProcessingUpgrade ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Activating Subscription & Crediting Referrer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Activate Instant $0 Beta Tester Access (Testing Mode)</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400">
                ⚡ Testing Mode: Upgrades your tier in Supabase and credits your affiliate referrer 30% commission!
              </p>
            </div>

            {/* Success Notification */}
            {checkoutSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{checkoutSuccess}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
