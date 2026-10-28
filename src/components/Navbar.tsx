"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  Layers,
  Flame,
  Sparkles,
  SlidersHorizontal,
  Bot,
  ChevronDown,
  BookOpen,
  Trophy,
  Dumbbell,
  HelpCircle,
  Crown,
  Share2,
  RefreshCw,
  User,
  ShieldCheck,
  Zap,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { OddoraLogo } from "./OddoraLogo";

export type WorkspaceTab =
  | "home"
  | "all_matches"
  | "over_25"
  | "slip_builder"
  | "edit_game"
  | "copilot"
  | "leagues"
  | "other_sports"
  | "market_guide"
  | "how_it_works"
  | "pricing"
  | "affiliates";

export type UserTier = "FREE" | "PRO" | "PREMIUM";

export interface NavbarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  currentTier: UserTier;
  onTierChange: (tier: UserTier) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenAccountModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentTier,
  onTierChange,
  onRefresh,
  isRefreshing = false,
  onOpenAccountModal,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const primaryTabs = [
    { id: "home" as WorkspaceTab, label: "Home & Daily Odds", icon: Compass, badge: "DAILY" },
    { id: "all_matches" as WorkspaceTab, label: "All Matches", icon: Layers, badge: "4 SPORTS" },
    { id: "over_25" as WorkspaceTab, label: "Over 2.5 Daily", icon: Flame, badge: "🔥 7 GAMES" },
    { id: "slip_builder" as WorkspaceTab, label: "Slip Builder", icon: Sparkles, badge: "SOLVER" },
    { id: "edit_game" as WorkspaceTab, label: "Edit Game", icon: SlidersHorizontal, badge: "4 MODES" },
    { id: "copilot" as WorkspaceTab, label: "AI Copilot", icon: Bot, badge: "STUDIO" },
  ];

  const dropdownItems = [
    { id: "leagues" as WorkspaceTab, label: "Today's Leagues", icon: Trophy, note: "Fixtures & Times" },
    { id: "other_sports" as WorkspaceTab, label: "Other Sports Hub", icon: Dumbbell, note: "BB / VB / TN" },
    { id: "market_guide" as WorkspaceTab, label: "Market Explanation Guide", icon: BookOpen, note: "Multi-Sport A-Z" },
    { id: "how_it_works" as WorkspaceTab, label: "How It Works", icon: HelpCircle, note: "Engine Guides" },
    { id: "pricing" as WorkspaceTab, label: "Pricing Plans", icon: Crown, note: "Free / Pro / Premium" },
    { id: "affiliates" as WorkspaceTab, label: "Affiliate Hub", icon: Share2, note: "Earn 30% RevShare" },
  ];

  return (
    <>
      {/* =========================================================================
          TOP VERIFIED ENGINE STATUS BANNER
         ========================================================================= */}
      <div className="bg-[#0b0f17] border-b border-white/[0.06] px-3 py-1 text-[11px] font-mono flex items-center justify-between text-slate-400 select-none">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-bold hidden sm:inline">
              Verified Booking Engine Online
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300">
              SportyBet FactsCenter & Bet9ja Live Sync Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 hidden md:inline">
              Real 6-Character Loadable Share Codes
            </span>
            <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              100% VALIDATED
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP & TABLET STICKY TOP NAVBAR
         ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-[#070A0E]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-3 h-16">
          {/* Left Brand Logo */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTabChange("home")}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl"
            >
              <OddoraLogo size="sm" showBadge={true} />
            </button>
          </div>

          {/* Center Navigation: 6 Primary Tabs + Dropdown */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none whitespace-nowrap ${
                    isActive
                      ? "bg-white/[0.1] text-white border border-white/15 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? tab.id === "over_25"
                          ? "text-amber-400"
                          : "text-emerald-400"
                        : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full font-black ${
                        tab.id === "over_25"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/15 text-emerald-400"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Dropdown Menu: Explore & Guides ▾ */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isDropdownOpen || dropdownItems.some((d) => d.id === activeTab)
                    ? "bg-white/[0.1] text-white border border-white/15"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Explore & Guides</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#11161F] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-400 border-b border-white/10 tracking-wider">
                    Extended Intel & Resources
                  </div>
                  {dropdownItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onTabChange(item.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between text-xs font-semibold ${
                          isItemActive
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ItemIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.note}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Side Controls (shrink-0): 3-Tier Switcher + Account + Force Refresh */}
          <div className="shrink-0 flex items-center gap-2">
            {/* Interactive 3-Tier Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-[#11161F] border border-white/10 text-xs shadow-inner">
              {(["FREE", "PRO", "PREMIUM"] as const).map((tier) => {
                const isSelected = currentTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onTierChange(tier)}
                    className={`px-2 py-1 rounded-lg font-bold text-[10.5px] transition-all flex items-center gap-1 ${
                      isSelected
                        ? tier === "PREMIUM"
                          ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md font-black"
                          : tier === "PRO"
                          ? "bg-emerald-500 text-black shadow-md font-black"
                          : "bg-slate-700 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tier === "PREMIUM" && <Crown className="w-3 h-3" />}
                    {tier === "PRO" && <Zap className="w-3 h-3" />}
                    {tier === "FREE" && <ShieldCheck className="w-3 h-3" />}
                    <span>{tier}</span>
                  </button>
                );
              })}
            </div>

            {/* Account / Sign In Trigger */}
            <button
              type="button"
              onClick={onOpenAccountModal || (() => onTabChange("pricing"))}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.05] border border-white/10 text-slate-200 hover:text-white hover:bg-white/[0.08] transition shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentTier === "FREE" ? "Sign In" : "Account"}</span>
            </button>

            {/* Force Refresh Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Sync Live Match & Slips Feed"
                className="p-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white border border-white/10 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
                />
              </button>
            )}

            {/* Mobile Menu Button for Extended Guides */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white border border-white/10 transition"
              title="Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer for Extended Guides */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0e141e] border-b border-white/10 p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono text-slate-400 uppercase">
              <span>Oddora V2 Navigation & Guides</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {dropdownItems.map((item) => {
                const ItemIcon = item.icon;
                const isItemActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-left border flex items-center gap-2 transition text-xs font-bold ${
                      isItemActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/[0.03] text-slate-300 border-white/5 hover:bg-white/[0.06]"
                    }`}
                  >
                    <ItemIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          STICKY MOBILE BOTTOM NAVIGATION BAR (Never Overflows, 6 Core Tap Targets)
         ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#070A0E]/95 backdrop-blur-xl border-t border-white/10 px-1 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all relative ${
            activeTab === "home" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-[10px]">Home</span>
          {activeTab === "home" && (
            <span className="absolute -bottom-1 w-3 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange("all_matches")}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all relative ${
            activeTab === "all_matches" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px]">Matches</span>
          {activeTab === "all_matches" && (
            <span className="absolute -bottom-1 w-3 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange("over_25")}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all relative ${
            activeTab === "over_25" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[10px]">Over 2.5</span>
          {activeTab === "over_25" && (
            <span className="absolute -bottom-1 w-3 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange("slip_builder")}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all relative ${
            activeTab === "slip_builder" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Builder</span>
          {activeTab === "slip_builder" && (
            <span className="absolute -bottom-1 w-3 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange("edit_game")}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all relative ${
            activeTab === "edit_game" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-[10px]">Edit</span>
          {activeTab === "edit_game" && (
            <span className="absolute -bottom-1 w-3 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange("copilot")}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all relative ${
            activeTab === "copilot" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span className="text-[10px]">Copilot</span>
          {activeTab === "copilot" && (
            <span className="absolute -bottom-1 w-3 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>
      </nav>
    </>
  );
};

export default Navbar;
