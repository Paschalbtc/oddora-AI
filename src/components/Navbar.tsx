"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  Layers,
  Sparkles,
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
  Flame,
  SlidersHorizontal,
  Grid,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { OddoraLogo } from "./OddoraLogo";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

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
  const {
    user,
    profile: authProfile,
    isAuthenticated,
    openAuthModal,
    requireAuth,
    signOut,
  } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Desktop Primary Navigation Tabs (Over 2.5 is moved into dropdown per user request)
  const desktopPrimaryTabs = [
    { id: "home" as WorkspaceTab, label: "Home", icon: Compass, badge: "DAILY" },
    { id: "all_matches" as WorkspaceTab, label: "All Matches", icon: Layers, badge: "SCHEDULE" },
    { id: "slip_builder" as WorkspaceTab, label: "Slip Builder", icon: Sparkles, badge: "SOLVER" },
    { id: "edit_game" as WorkspaceTab, label: "Edit Game", icon: SlidersHorizontal, badge: "PRUNER" },
    { id: "copilot" as WorkspaceTab, label: "AI Copilot", icon: Bot, badge: "STUDIO" },
  ];

  // Mobile Bottom Bar has exactly 4 Core Tabs
  const mobileCoreTabs = [
    { id: "home" as WorkspaceTab, label: "Home", icon: Compass },
    { id: "all_matches" as WorkspaceTab, label: "Matches", icon: Layers },
    { id: "slip_builder" as WorkspaceTab, label: "Builder", icon: Sparkles },
    { id: "copilot" as WorkspaceTab, label: "Copilot", icon: Bot },
  ];

  // Dropdown / More Menu Items (Includes Over 2.5 and all extended tools)
  const secondaryNavItems = [
    {
      id: "over_25" as WorkspaceTab,
      label: "Over 2.5 Goals Daily",
      icon: Flame,
      desc: "Special 7-Match High xG Ticket",
      tag: "HOT",
      tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "edit_game" as WorkspaceTab,
      label: "Edit Game Engine",
      icon: SlidersHorizontal,
      desc: "Split, Prune & Re-Book Slips",
      tag: "4 MODES",
      tagColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    },
    {
      id: "leagues" as WorkspaceTab,
      label: "Today's Leagues",
      icon: Trophy,
      desc: "EPL, UCL, La Liga, Serie A",
      tag: "FIXTURES",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "other_sports" as WorkspaceTab,
      label: "Other Sports Hub",
      icon: Dumbbell,
      desc: "Basketball, Volleyball & Tennis",
      tag: "3 SPORTS",
      tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    },
    {
      id: "market_guide" as WorkspaceTab,
      label: "Bet Markets Guide",
      icon: BookOpen,
      desc: "Beginner Encyclopedia A-Z",
      tag: "GUIDE",
      tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    },
    {
      id: "how_it_works" as WorkspaceTab,
      label: "How It Works",
      icon: HelpCircle,
      desc: "Step-by-step onboarding tutorial",
      tag: "HELP",
      tagColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    },
    {
      id: "pricing" as WorkspaceTab,
      label: "Pricing & VIP Plans",
      icon: Crown,
      desc: "Free, Pro & Premium VIP tiers",
      tag: "PLANS",
      tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "affiliates" as WorkspaceTab,
      label: "Affiliate Hub",
      icon: Share2,
      desc: "Earn 30% monthly commission",
      tag: "EARN",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
  ];

  const handleSelectNav = (tabId: WorkspaceTab) => {
    if (!isAuthenticated && tabId !== "home") {
      requireAuth(() => {
        onTabChange(tabId);
        setIsDropdownOpen(false);
        setIsMoreDrawerOpen(false);
      }, `Please sign in or create a free account to access ${tabId.replace(/_/g, " ").toUpperCase()}`);
      return;
    }
    onTabChange(tabId);
    setIsDropdownOpen(false);
    setIsMoreDrawerOpen(false);
  };

  const isMoreActive =
    activeTab === "over_25" ||
    activeTab === "leagues" ||
    activeTab === "other_sports" ||
    activeTab === "market_guide" ||
    activeTab === "how_it_works" ||
    activeTab === "pricing" ||
    activeTab === "affiliates";

  return (
    <>
      {/* =========================================================================
          TOP VERIFIED ENGINE STATUS BANNER (Compact & Legible Everywhere)
         ========================================================================= */}
      <div className="bg-[#0b0f17] border-b border-white/[0.06] px-3 py-1.5 text-[11px] font-mono flex items-center justify-between text-slate-400 select-none">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-bold truncate">
              SportyBet & Bet9ja Verified Engine Online
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              100% VALIDATED
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN TOP NAVBAR (Desktop & Mobile Fully Visible Controls)
         ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-[#070A0E]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 h-16">
          {/* Left: Top-Left Hamburger Menu + Brand Logo */}
          <div className="shrink-0 flex items-center gap-2">
            {/* Top-Left Three-Bar (Hamburger) Navigation Menu Button - Visible on Desktop & Mobile */}
            <button
              type="button"
              onClick={() => setIsMoreDrawerOpen(!isMoreDrawerOpen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition active:scale-95 flex items-center justify-center shrink-0 shadow-sm"
              title="Open Navigation Menu & Theme Settings"
              aria-label="Navigation Menu"
            >
              {isMoreDrawerOpen ? (
                <X className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectNav("home")}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl"
            >
              <OddoraLogo size="sm" showBadge={true} />
            </button>
          </div>

          {/* Center: Desktop Navigation Bar (5 Primary + Dropdown) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {desktopPrimaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectNav(tab.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none whitespace-nowrap ${
                    isActive
                      ? "bg-white/[0.1] text-white border border-white/15 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-full font-black bg-emerald-500/15 text-emerald-400">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Desktop Dropdown Menu: More Pages & Guides ▾ */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isDropdownOpen || isMoreActive
                    ? "bg-white/[0.1] text-white border border-white/15"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-cyan-400" />
                <span>More Pages</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-[#11161F] border border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1.5">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 border-b border-white/10 tracking-wider flex items-center justify-between">
                    <span>All Features & Guides</span>
                    <span className="text-emerald-400 font-bold">12 ENGINES</span>
                  </div>

                  {/* Desktop Theme Switcher Toggle */}
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      {theme === "light" ? (
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span>Appearance</span>
                    </span>
                    <div className="flex items-center bg-white dark:bg-black/50 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                          theme === "light"
                            ? "bg-emerald-500 text-white font-black"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <Sun className="w-3 h-3" />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                          theme === "dark"
                            ? "bg-[#11161F] text-emerald-400 font-black border border-emerald-500/30"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <Moon className="w-3 h-3" />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>
                  {secondaryNavItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectNav(item.id)}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between text-xs font-semibold ${
                          isItemActive
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ItemIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="block font-bold text-white text-xs">
                              {item.label}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${item.tagColor}`}
                        >
                          {item.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Side: Profile & Plan Button + Refresh + Mobile Menu (Clean, No Button Hidden) */}
          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2.5">
            {/* Desktop Plan Badge (Hidden on Mobile to prevent button crowding) */}
            <button
              type="button"
              onClick={onOpenAccountModal || (() => handleSelectNav("pricing"))}
              title={`Active Subscription: ${currentTier} Plan (Click to manage under Profile)`}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all border shadow-sm ${
                currentTier === "PREMIUM"
                  ? "bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 border-amber-400/40 text-amber-300 hover:border-amber-400/70"
                  : currentTier === "PRO"
                  ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25"
                  : "bg-white/[0.04] border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white"
              }`}
            >
              {currentTier === "PREMIUM" && (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-black text-xs">PREMIUM VIP</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </>
              )}
              {currentTier === "PRO" && (
                <>
                  <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-black text-xs">PRO VIP</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </>
              )}
              {currentTier === "FREE" && (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Free Plan</span>
                  <span className="text-[9.5px] font-mono font-black text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/25 uppercase ml-1">
                    Upgrade
                  </span>
                </>
              )}
            </button>

            {/* Profile & Plan Trigger / Sign In Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenAccountModal}
                  title="View & Edit Profile, Manage Plan Mode"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white transition shadow-sm active:scale-95"
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                      <span>{authProfile?.avatar || "👑"}</span>
                    </div>
                    {/* Status Dot */}
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#070A0E] ${
                        currentTier === "PREMIUM"
                          ? "bg-amber-400"
                          : currentTier === "PRO"
                          ? "bg-emerald-400"
                          : "bg-slate-400"
                      }`}
                    />
                  </div>
                  <span className="font-black text-xs hidden sm:inline truncate max-w-[80px]">
                    {authProfile?.displayName?.split(" ")[0] || "Profile"}
                  </span>
                  <span className="font-black text-xs sm:hidden">Profile</span>
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  title="Log Out of Oddora AI"
                  className="p-1.5 sm:p-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 transition active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("signup", "Create your free account to unlock full platform features")}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-md transition active:scale-95"
              >
                <User className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span>Sign In</span>
              </button>
            )}

            {/* Force Refresh Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh Live Fixtures & Slips"
                className="p-1.5 sm:p-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white border border-white/10 transition-colors active:scale-95 shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
                />
              </button>
            )}

            {/* Quick 1-Click Theme Toggle Button (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "Dark Mode" : "Light Mode"}`}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition active:scale-95 shrink-0 shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="w-3.5 h-3.5 text-cyan-600" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Mobile Top Menu Button */}
            <button
              type="button"
              onClick={() => setIsMoreDrawerOpen(!isMoreDrawerOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 transition active:scale-95 shrink-0"
              title="Open Navigation Menu"
            >
              {isMoreDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* =========================================================================
            TOP THREE-BAR NAVIGATION DROPDOWN DRAWER (Contains Theme Switcher + All Pages)
            Accessible from Top-Left Hamburger on both Desktop and Mobile!
           ========================================================================= */}
        {isMoreDrawerOpen && (
          <div className="w-full bg-[#0c111a] border-b border-white/15 p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Header & Prominent Theme Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
                  <Grid className="w-4 h-4 text-emerald-400" />
                  <span>All Oddora AI Tools & Navigation</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMoreDrawerOpen(false)}
                  className="sm:hidden text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* HAND-TUNED THEME SWITCHER TOGGLE */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 pl-1">
                  {theme === "light" ? (
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Moon className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                  <span className="hidden sm:inline">Theme:</span>
                </div>

                <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      theme === "light"
                        ? "bg-emerald-500 text-white shadow-md font-black"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>☀️ Light Mode {theme === "light" ? "(Active)" : ""}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      theme === "dark"
                        ? "bg-[#11161F] text-emerald-400 shadow-md border border-emerald-500/30 font-black"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>🌙 Dark Mode {theme === "dark" ? "(Active)" : ""}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMoreDrawerOpen(false)}
                  className="hidden sm:inline-flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title="Close Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Profile & Plan Mode Access Button in Drawer */}
            <button
              type="button"
              onClick={() => {
                setIsMoreDrawerOpen(false);
                if (isAuthenticated) {
                  if (onOpenAccountModal) onOpenAccountModal();
                } else {
                  openAuthModal("signup");
                }
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-amber-500/15 border border-emerald-500/35 flex items-center justify-between text-left transition hover:border-emerald-500/60 shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg font-bold">
                  {isAuthenticated ? (
                    <span>{authProfile?.avatar || "👑"}</span>
                  ) : (
                    <User className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="font-black text-xs text-white flex items-center gap-2">
                    <span>{isAuthenticated ? authProfile?.displayName || "My Profile" : "Sign In / Create Account"}</span>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-full font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {currentTier} PLAN
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {isAuthenticated ? "Edit profile & manage plan mode" : "1-Click Google, X, or Email sign in"}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-emerald-400 -rotate-90" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {secondaryNavItems.map((item) => {
                const ItemIcon = item.icon;
                const isItemActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`p-3 rounded-2xl text-left border flex items-center justify-between transition ${
                      isItemActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md"
                        : "bg-white/[0.03] text-slate-200 border-white/10 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                        <ItemIcon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${item.tagColor}`}
                    >
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          STICKY MOBILE BOTTOM NAVIGATION BAR
          Strictly 4 Clean Bottom Tabs: Home, Matches, Builder, Copilot
          (No "More" tab to prevent clipping on small Samsung/mobile screens)
         ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#070A0E]/98 backdrop-blur-2xl border-t border-white/10 px-2 py-1.5 grid grid-cols-4 items-center justify-around shadow-2xl">
        {mobileCoreTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectNav(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] mt-0.5 font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-4 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;
