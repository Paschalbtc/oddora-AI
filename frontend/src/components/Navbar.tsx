"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Layers,
  Sparkles,
  Activity,
  Users,
  Crown,
  User as UserIcon,
  LogIn,
  LogOut,
  X,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Gift,
  SlidersHorizontal,
  ChevronDown,
  Bot,
} from "lucide-react";
import { OddoraLogo } from "./OddoraLogo";
import { useAuth } from "../lib/supabase";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_LINKS: NavItem[] = [
  { name: "AI Dashboard", href: "/", icon: Layers },
  { name: "Edit Slip AI", href: "/edit-slip", icon: SlidersHorizontal, badge: "NEW" },
  { name: "20,000x Slip AI", href: "/slip-builder", icon: Sparkles, badge: "HOT" },
  { name: "Midnight Autopsy", href: "/autopsy", icon: Activity },
  { name: "Pricing & VIP", href: "/pricing", icon: Crown },
  { name: "Affiliate Hub", href: "/affiliates", icon: Users, badge: "40%" },
];

const NavbarContent: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab");
  const isCopilotActive = pathname === "/" && currentTab === "copilot";

  const { user, profile, signOut, switchPlanDemo } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSwitchingPlan, setIsSwitchingPlan] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const planTier = profile?.plan_tier || "FREE";

  const handlePlanSwitch = async (newPlan: "FREE" | "PRO" | "VIP") => {
    setIsSwitchingPlan(true);
    await switchPlanDemo(newPlan);
    setIsSwitchingPlan(false);
  };

  // Plan Badge Render Helper
  const renderPlanBadge = (isMobile = false) => {
    switch (planTier) {
      case "VIP":
        return (
          <span
            onClick={() => setIsAuthModalOpen(true)}
            className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_14px_rgba(245,158,11,0.3)] transition-all hover:scale-105"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>VIP MEMBER</span>
          </span>
        );
      case "PRO":
        return (
          <span
            onClick={() => setIsAuthModalOpen(true)}
            className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all hover:scale-105"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>PRO PASS</span>
          </span>
        );
      default:
        return (
          <span
            onClick={() => setIsAuthModalOpen(true)}
            className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-emerald-500/40 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>FREE TIER</span>
          </span>
        );
    }
  };

  return (
    <>
      {/* =========================================================================
          1. TOP NAVIGATION BAR (Consolidated Desktop Header + Mobile Header)
         ========================================================================= */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#090d16]/90 border-b border-white/[0.08] transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4 h-16">
          {/* Left (shrink-0): Compact Oddora AI Logo + Title */}
          <div className="shrink-0 flex items-center">
            <OddoraLogo size="sm" showBadge={false} />
          </div>

          {/* Center Navigation (Consolidated & Compact: 4 Primary Tabs + More Dropdown) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 min-w-0">
            {/* 1. Predictions */}
            <Link
              href="/"
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 shrink-0 ${
                pathname === "/" && !isCopilotActive
                  ? "text-white bg-white/[0.08] border border-white/10 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Layers
                className={`w-3.5 h-3.5 ${
                  pathname === "/" && !isCopilotActive ? "text-emerald-400" : "text-slate-400"
                }`}
              />
              <span>Predictions</span>
              {pathname === "/" && !isCopilotActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full" />
              )}
            </Link>

            {/* 2. Slip Studio (Odds Generator & Edit Slip AI) */}
            <Link
              href="/slip-builder"
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 shrink-0 ${
                pathname === "/slip-builder" || pathname === "/edit-slip"
                  ? "text-white bg-white/[0.08] border border-white/10 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  pathname === "/slip-builder" || pathname === "/edit-slip"
                    ? "text-amber-400"
                    : "text-slate-400"
                }`}
              />
              <span>Slip Studio</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded-full font-black bg-amber-500/20 text-amber-400">
                20,000x
              </span>
              {(pathname === "/slip-builder" || pathname === "/edit-slip") && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full" />
              )}
            </Link>

            {/* 3. AI Copilot */}
            <Link
              href="/?tab=copilot"
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 shrink-0 ${
                isCopilotActive
                  ? "text-white bg-white/[0.08] border border-white/10 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Bot
                className={`w-3.5 h-3.5 ${isCopilotActive ? "text-[#00C896]" : "text-slate-400"}`}
              />
              <span>AI Copilot</span>
              {isCopilotActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-[#00C896] to-cyan-400 rounded-full" />
              )}
            </Link>

            {/* 4. Midnight Autopsy */}
            <Link
              href="/autopsy"
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 shrink-0 ${
                pathname === "/autopsy"
                  ? "text-white bg-white/[0.08] border border-white/10 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Activity
                className={`w-3.5 h-3.5 ${pathname === "/autopsy" ? "text-cyan-400" : "text-slate-400"}`}
              />
              <span>Midnight Autopsy</span>
              {pathname === "/autopsy" && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full" />
              )}
            </Link>

            {/* 5. More ▾ Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 ${
                  pathname === "/pricing" || pathname === "/affiliates"
                    ? "text-white bg-white/[0.08] border border-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMoreMenuOpen ? "rotate-180 text-emerald-400" : "text-slate-400"
                  }`}
                />
                {(pathname === "/pricing" || pathname === "/affiliates") && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full" />
                )}
              </button>

              {isMoreMenuOpen && (
                <div
                  className="absolute left-0 mt-2 w-52 rounded-2xl bg-[#0e1424] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setIsMoreMenuOpen(false)}
                >
                  <Link
                    href="/pricing"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Pricing & VIP Plans</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                      VIP
                    </span>
                  </Link>

                  <Link
                    href="/affiliates"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-bold text-slate-300 hover:text-white transition-colors mt-1"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Affiliate 30% Hub</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                      30%
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right (shrink-0 flex items-center gap-2): Plan Tier Badge + Sign In / Sign Up / Account Button */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {renderPlanBadge(false)}

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 transition-all duration-200 hover:border-emerald-500/40"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user ? profile?.full_name?.split(" ")[0] || "Account" : "Account"}</span>
            </button>

            {user ? (
              <button
                onClick={() => signOut()}
                title="Sign out of your account"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 transition-all duration-200 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                href="/auth"
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs xl:text-sm font-bold text-black bg-gradient-to-r from-[#10B981] to-[#34D399] hover:from-[#34D399] hover:to-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all duration-200 active:scale-95 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign Up / Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Header Right (Phone Top Bar) */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {renderPlanBadge(true)}

            <button
              onClick={() => setIsAuthModalOpen(true)}
              aria-label="Account Settings"
              className="p-1.5 rounded-xl bg-white/[0.06] text-slate-300 hover:text-white border border-white/10 shrink-0"
            >
              <UserIcon className="w-4 h-4 text-emerald-400" />
            </button>

            {user ? (
              <button
                onClick={() => signOut()}
                aria-label="Sign Out"
                title="Sign Out"
                className="p-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/25 shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/auth"
                aria-label="Sign In"
                className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0"
              >
                <LogIn className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. MOBILE-FIRST BOTTOM NAVIGATION BAR (Screens < 768px)
          Fixed iOS/Android thumb-friendly navigation bar with 5 big tap targets.
         ========================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#090d16]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-4px_25px_rgba(0,0,0,0.5)]"
      >
        <div className="grid grid-cols-5 h-full max-w-md mx-auto px-1">
          {/* Tab 1: Picks (Dashboard) */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center relative py-1 focus:outline-none select-none ${
              pathname === "/" ? "text-[#10B981]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Layers className="w-5 h-5 transition-transform active:scale-90" />
              {pathname === "/" && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              )}
            </div>
            <span className="text-[11px] font-semibold tracking-tight mt-1">Picks</span>
            {pathname === "/" && (
              <span className="w-5 h-1 bg-[#10B981] rounded-full absolute bottom-1" />
            )}
          </Link>

          {/* Tab 2: Edit Slip AI */}
          <Link
            href="/edit-slip"
            className={`flex flex-col items-center justify-center relative py-1 focus:outline-none select-none ${
              pathname === "/edit-slip" ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <SlidersHorizontal className="w-5 h-5 transition-transform active:scale-90 text-emerald-400" />
              <span className="absolute -top-1 -right-2 text-[8px] font-mono px-1 rounded-full font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                AI
              </span>
            </div>
            <span className="text-[11px] font-semibold tracking-tight mt-1">Edit Slip</span>
            {pathname === "/edit-slip" && (
              <span className="w-5 h-1 bg-emerald-400 rounded-full absolute bottom-1" />
            )}
          </Link>

          {/* Tab 3: 20,000x Slip AI */}
          <Link
            href="/slip-builder"
            className={`flex flex-col items-center justify-center relative py-1 focus:outline-none select-none ${
              pathname === "/slip-builder" ? "text-[#F59E0B]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 transition-transform active:scale-90 text-[#F59E0B]" />
              <span className="absolute -top-1 -right-2 text-[8px] font-mono px-1 rounded-full font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                20K
              </span>
            </div>
            <span className="text-[11px] font-semibold tracking-tight mt-1">Slip 20K</span>
            {pathname === "/slip-builder" && (
              <span className="w-5 h-1 bg-[#F59E0B] rounded-full absolute bottom-1" />
            )}
          </Link>

          {/* Tab 4: Autopsy */}
          <Link
            href="/autopsy"
            className={`flex flex-col items-center justify-center relative py-1 focus:outline-none select-none ${
              pathname === "/autopsy" ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[11px] font-semibold tracking-tight mt-1">Autopsy</span>
            {pathname === "/autopsy" && (
              <span className="w-5 h-1 bg-cyan-400 rounded-full absolute bottom-1" />
            )}
          </Link>

          {/* Tab 5: Account / Pricing */}
          <Link
            href="/pricing"
            className={`flex flex-col items-center justify-center relative py-1 focus:outline-none select-none ${
              pathname === "/pricing" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Crown className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[11px] font-semibold tracking-tight mt-1">VIP Pass</span>
            {pathname === "/pricing" && (
              <span className="w-5 h-1 bg-amber-400 rounded-full absolute bottom-1" />
            )}
          </Link>
        </div>
      </nav>

      {/* =========================================================================
          3. USER PROFILE, VIP PLAN SWITCHER & AUTH MODAL
         ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0e1424] border border-white/10 rounded-2xl shadow-2xl p-6 text-white overflow-hidden">
            {/* Header Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500 blur-sm" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <OddoraLogo size="sm" showBadge={false} />
                <span className="text-sm font-bold text-slate-300">Account & Plan Switcher</span>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Information */}
            <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{profile?.full_name || "Beta Explorer"}</h3>
                  <p className="text-xs text-slate-400">{profile?.email || "guest@oddora.ai"}</p>
                </div>
                {renderPlanBadge()}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Referral Code:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {profile?.referral_code || "ODD-BETA1"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Affiliate Commission Balance:</span>
                <span className="font-mono font-bold text-amber-400">
                  ${(profile?.affiliate_balance || 0).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Interactive Beta Plan Switcher */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                ⚡ Instant Beta Plan Switcher (Test VIP Access)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["FREE", "PRO", "VIP"] as const).map((tier) => {
                  const isCurrent = planTier === tier;
                  return (
                    <button
                      key={tier}
                      disabled={isSwitchingPlan}
                      onClick={() => handlePlanSwitch(tier)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 border flex flex-col items-center justify-center gap-1 ${
                        isCurrent
                          ? tier === "VIP"
                            ? "bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                            : tier === "PRO"
                            ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                            : "bg-slate-700/50 text-white border-slate-500"
                          : "bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {tier === "VIP" && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        {tier === "PRO" && <Zap className="w-3.5 h-3.5 text-emerald-400" />}
                        {tier}
                      </span>
                      {isCurrent ? (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Switch</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                *Switching instantly triggers the backend affiliate 30% commission flow simulation and unlocks Pro/VIP gated picks.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-white/10">
              <Link
                href="/affiliates"
                onClick={() => setIsAuthModalOpen(false)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/10 transition-colors"
              >
                <Gift className="w-3.5 h-3.5 text-emerald-400" />
                <span>Affiliate Hub</span>
              </Link>

              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setIsAuthModalOpen(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 border border-red-500/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/pricing"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-xs font-bold text-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <span>Upgrade VIP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Navbar: React.FC = () => {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#060913]/90 backdrop-blur-xl h-16" />
      }
    >
      <NavbarContent />
    </Suspense>
  );
};

export default Navbar;

