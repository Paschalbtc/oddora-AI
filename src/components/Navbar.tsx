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
  Headphones,
  ChevronRight,
  Mail,
  MessageSquare,
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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileAccordionOpen, setIsProfileAccordionOpen] = useState(true);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
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

  // Complete 10 Core Operational Tools & Hubs (Exact order requested)
  const secondaryNavItems = [
    {
      id: "over_25",
      targetTab: "over_25" as WorkspaceTab,
      label: "Over 2.5 Goals Daily Tickets",
      icon: Flame,
      desc: "Special 7-Match High xG Ticket",
      tag: "HOT",
      tagColor: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "auto_25",
      targetTab: "over_25" as WorkspaceTab,
      label: "Automatic Daily Tickets Generation (2.5 Goals)",
      icon: Sparkles,
      desc: "Instant Algorithmic 2.5 Goals Solver",
      tag: "AUTO",
      tagColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "edit_game",
      targetTab: "edit_game" as WorkspaceTab,
      label: "Edit Game Engine",
      icon: SlidersHorizontal,
      desc: "Split, Prune & Re-Book Slips",
      tag: "4 MODES",
      tagColor: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30",
    },
    {
      id: "leagues",
      targetTab: "leagues" as WorkspaceTab,
      label: "Today's League",
      icon: Trophy,
      desc: "EPL, UCL, La Liga, Serie A",
      tag: "FIXTURES",
      tagColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "other_sports",
      targetTab: "other_sports" as WorkspaceTab,
      label: "Other Sports Hub",
      icon: Dumbbell,
      desc: "Basketball, Volleyball & Tennis",
      tag: "3 SPORTS",
      tagColor: "text-purple-500 bg-purple-500/10 border-purple-500/30",
    },
    {
      id: "market_guide",
      targetTab: "market_guide" as WorkspaceTab,
      label: "Bet Market Guide",
      icon: BookOpen,
      desc: "Beginner Encyclopedia A-Z",
      tag: "GUIDE",
      tagColor: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    },
    {
      id: "how_it_works",
      targetTab: "how_it_works" as WorkspaceTab,
      label: "How It Works",
      icon: HelpCircle,
      desc: "Step-by-step onboarding tutorial",
      tag: "HELP",
      tagColor: "text-teal-500 bg-teal-500/10 border-teal-500/30",
    },
    {
      id: "pricing",
      targetTab: "pricing" as WorkspaceTab,
      label: "Pricing & VIP Plan",
      icon: Crown,
      desc: "Free, Pro & Premium VIP tiers",
      tag: "PLANS",
      tagColor: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "affiliates",
      targetTab: "affiliates" as WorkspaceTab,
      label: "Affiliates Hub",
      icon: Share2,
      desc: "Earn 30% monthly commission",
      tag: "EARN",
      tagColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "support",
      targetTab: null,
      label: "Support",
      icon: Headphones,
      desc: "24/7 VIP Help & Technical Support",
      tag: "24/7",
      tagColor: "text-rose-500 bg-rose-500/10 border-rose-500/30",
    },
  ];

  const handleNavClick = (item: (typeof secondaryNavItems)[number]) => {
    if (item.id === "support") {
      setIsSupportModalOpen(true);
      return;
    }
    if (item.targetTab) {
      handleSelectNav(item.targetTab);
    }
  };

  const handleSelectNav = (tabId: WorkspaceTab) => {
    if (!isAuthenticated && tabId !== "home") {
      requireAuth(() => {
        onTabChange(tabId);
        setIsDropdownOpen(false);
        setIsMoreDrawerOpen(false);
        setIsProfileDropdownOpen(false);
      }, `Please sign in or create a free account to access ${tabId.replace(/_/g, " ").toUpperCase()}`);
      return;
    }
    onTabChange(tabId);
    setIsDropdownOpen(false);
    setIsMoreDrawerOpen(false);
    setIsProfileDropdownOpen(false);
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
      <div className="bg-slate-100 dark:bg-[#0b0f17] border-b border-slate-200 dark:border-white/[0.06] px-3 py-1.5 text-[11px] font-mono flex items-center justify-between text-slate-600 dark:text-slate-400 select-none">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold truncate">
              SportyBet & Bet9ja Verified Engine Online
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              100% VALIDATED
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN TOP NAVBAR (Desktop & Mobile Fully Visible Controls)
         ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070A0E]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 h-16">
          {/* Left: Brand Logo Area (Strictly Brand Identity, Clean & Clickable Home Link) */}
          <div className="shrink-0 flex items-center">
            <button
              type="button"
              onClick={() => handleSelectNav("home")}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl"
              title="Oddora AI - Home"
              aria-label="Oddora AI Home"
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
                      ? "bg-slate-100 text-slate-900 dark:bg-white/[0.1] dark:text-white border border-slate-200 dark:border-white/15 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-full font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-emerald-500 dark:bg-emerald-400 rounded-full" />
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
                    ? "bg-slate-100 text-slate-900 dark:bg-white/[0.1] dark:text-white border border-slate-200 dark:border-white/15"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.04]"
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>More Pages</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1.5">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 tracking-wider flex items-center justify-between">
                    <span>All Features & Guides</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">12 ENGINES</span>
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
                    const isItemActive = item.targetTab ? activeTab === item.targetTab : false;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavClick(item)}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between text-xs font-semibold cursor-pointer ${
                          isItemActive
                            ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ItemIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <span className="block font-bold text-slate-900 dark:text-white text-xs">
                              {item.label}
                            </span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400">
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

          {/* Right Side: Profile Dropdown + Mobile Menu (Clean, De-cluttered, No Floating Icons) */}
          <div className="shrink-0 flex items-center gap-2">
            {/* Desktop Plan Badge (Subtle, Hidden on Small Mobile) */}
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
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Free Plan</span>
                  <span className="text-[9.5px] font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/25 uppercase ml-1">
                    Upgrade
                  </span>
                </>
              )}
            </button>

            {/* Profile Dropdown Trigger (Authenticated) OR Sign In Button (Unauthenticated) */}
            {isAuthenticated ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  title="Open Account & Settings Menu"
                  aria-expanded={isProfileDropdownOpen}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer ${
                    isProfileDropdownOpen
                      ? "bg-slate-200 text-slate-900 dark:bg-white/[0.12] dark:text-white border-emerald-500/50"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                  } border`}
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                      <span>{authProfile?.avatar || "👑"}</span>
                    </div>
                    {/* Status Dot */}
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-[#070A0E] ${
                        currentTier === "PREMIUM"
                          ? "bg-amber-400"
                          : currentTier === "PRO"
                          ? "bg-emerald-400"
                          : "bg-slate-400"
                      }`}
                    />
                  </div>
                  <span className="font-black text-xs hidden sm:inline truncate max-w-[85px]">
                    {authProfile?.displayName?.split(" ")[0] || "Profile"}
                  </span>
                  <span className="font-black text-xs sm:hidden">Account</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Structured Profile & Settings Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-80 max-w-[340px] rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/15 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                    {/* 1. User Identity Header */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg font-bold shrink-0">
                        {authProfile?.avatar || "👑"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {authProfile?.displayName || user?.email?.split("@")[0] || "Oddora User"}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full border shrink-0 ${
                              currentTier === "PREMIUM"
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                                : currentTier === "PRO"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                                : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/20"
                            }`}
                          >
                            {currentTier} PLAN
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block font-mono">
                          {authProfile?.email || user?.email || "punter@oddora.ai"}
                        </span>
                      </div>
                    </div>

                    {/* 2. Profile / Account Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onOpenAccountModal) onOpenAccountModal();
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            Profile / Account
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            View & edit personal info, avatar & stake
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 -rotate-90 shrink-0" />
                    </button>

                    {/* 3. Settings / Platform Preferences Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onOpenAccountModal) onOpenAccountModal();
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            Platform Settings
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            Preferred bookmaker & sport markets
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 -rotate-90 shrink-0" />
                    </button>

                    {/* 4. Plan & VIP Membership Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleSelectNav("pricing");
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            VIP & Subscription Plan
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            Current: {currentTier} VIP • Compare all tiers
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 -rotate-90 shrink-0" />
                    </button>

                    {/* 5. Cleanly Embedded Theme Switcher Inside Settings/Profile Section */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        {theme === "light" ? (
                          <Sun className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Moon className="w-4 h-4 text-cyan-400" />
                        )}
                        <span>Theme Mode</span>
                      </span>
                      <div className="flex items-center bg-white dark:bg-black/50 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                            theme === "light"
                              ? "bg-emerald-500 text-white font-black shadow-xs"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Sun className="w-3 h-3" />
                          <span>Light</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                            theme === "dark"
                              ? "bg-[#11161F] text-emerald-400 font-black border border-emerald-500/30 shadow-xs"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Moon className="w-3 h-3" />
                          <span>Dark</span>
                        </button>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-white/10 pt-1" />

                    {/* 6. Logout Securely at Bottom */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition flex items-center gap-2.5 font-bold text-xs cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Log Out of Oddora AI</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("signup", "Create your free account to unlock full platform features")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-md transition active:scale-95 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span>Sign In</span>
              </button>
            )}

            {/* Single Right Menu Dropdown Button (Thumb-Friendly, visible in both Dark & Light modes) */}
            <button
              type="button"
              onClick={() => setIsMoreDrawerOpen(!isMoreDrawerOpen)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 transition active:scale-95 shrink-0 flex items-center justify-center min-w-[42px] min-h-[42px] shadow-sm cursor-pointer"
              title="Open Navigation Menu & Tools"
              aria-label="Navigation Menu"
            >
              {isMoreDrawerOpen ? (
                <X className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800 dark:text-slate-200" />
              )}
            </button>
          </div>
        </div>

        {/* =========================================================================
            RIGHT MENU DROPDOWN / MOBILE SLIDE-OVER SHEET
            Full-screen mobile slide-over sheet with backdrop blur (Zero edge cut-off)
           ========================================================================= */}
        {isMoreDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMoreDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-Over Sheet (Right-Anchored, Full Viewport on Mobile, 420px on Tablet/Desktop) */}
            <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] max-w-full z-50 bg-white dark:bg-[#0c111a] border-l border-slate-200 dark:border-white/15 p-5 space-y-4 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200 text-slate-900 dark:text-white flex flex-col">
              {/* Top Drawer Header with Brand Title & Thumb-Friendly Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Grid className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Oddora AI Navigation
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Quantitative Sports Suite
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMoreDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition active:scale-95 shrink-0 flex items-center justify-center min-w-[40px] min-h-[40px] shadow-sm cursor-pointer"
                  title="Close Navigation Menu"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DATA SYNCHRONIZATION / GAME LOADING ACTION BUTTON */}
              {onRefresh && (
                <button
                  type="button"
                  onClick={() => {
                    onRefresh();
                  }}
                  disabled={isRefreshing}
                  className="w-full p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-between transition cursor-pointer active:scale-[0.99] disabled:opacity-60 shadow-xs shrink-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <RefreshCw
                        className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        {isRefreshing ? "Syncing Fixtures & AI Slips..." : "Sync Fixtures & Live Engines"}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Load latest odds, market lines & verified codes
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                    {isRefreshing ? "SYNCING" : "LIVE"}
                  </span>
                </button>
              )}

              {/* INTERNAL SCROLL CONTAINER (max-h-[80vh] overflow-y-auto to prevent mobile clipping) */}
              <div className="flex-1 overflow-y-auto max-h-[80vh] space-y-4 pr-1 pb-16 no-scrollbar">
                {/* 2. PROFILE & SETTINGS ACCORDION */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] overflow-hidden transition-all shadow-xs shrink-0">
                  {/* Accordion Header Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsProfileAccordionOpen(!isProfileAccordionOpen)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
                    aria-expanded={isProfileAccordionOpen}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-base font-bold shrink-0">
                        {isAuthenticated ? (authProfile?.avatar || "👑") : <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {isAuthenticated ? (authProfile?.displayName || "My Profile") : "Sign In & Settings"}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full border shrink-0 ${
                              currentTier === "PREMIUM"
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                                : currentTier === "PRO"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                                : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/20"
                            }`}
                          >
                            {currentTier} PLAN
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {isAuthenticated ? (authProfile?.email || "Manage personal info & theme") : "1-Click sign in & appearance"}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 dark:text-slate-300 transition-transform duration-200 shrink-0 ${
                        isProfileAccordionOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Accordion Body Content */}
                  {isProfileAccordionOpen && (
                    <div className="p-3.5 pt-0 space-y-3 border-t border-slate-200 dark:border-white/10 mt-1">
                      {/* Manage Personal Information Button */}
                      {isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreDrawerOpen(false);
                            if (onOpenAccountModal) onOpenAccountModal();
                          }}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 transition flex items-center justify-between text-left group cursor-pointer shadow-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                Personal Information & Profile
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                Edit display name, phone, avatar & stake
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreDrawerOpen(false);
                            openAuthModal("signup", "Create your free account to unlock full features");
                          }}
                          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-98 cursor-pointer"
                        >
                          <User className="w-4 h-4 stroke-[3]" />
                          <span>Sign In / Create Free Account</span>
                        </button>
                      )}

                      {/* Appearance: Clean Light Mode / Dark Mode Switch */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-xs">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          {theme === "light" ? (
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Moon className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                          <span>Appearance</span>
                        </span>
                        <div className="flex items-center bg-slate-100 dark:bg-black/50 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-xs">
                          <button
                            type="button"
                            onClick={() => setTheme("light")}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              theme === "light"
                                ? "bg-emerald-500 text-white font-black shadow-xs"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <Sun className="w-3 h-3" />
                            <span>Light</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("dark")}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              theme === "dark"
                                ? "bg-[#11161F] text-emerald-400 font-black border border-emerald-500/30 shadow-xs"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <Moon className="w-3 h-3" />
                            <span>Dark</span>
                          </button>
                        </div>
                      </div>

                      {/* Logout Option if Authenticated */}
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreDrawerOpen(false);
                            signOut();
                          }}
                          className="w-full p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition flex items-center gap-2 font-bold text-xs cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Log Out of Oddora AI</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 1. ALL 10 OPERATIONAL TOOLS & HUBS (Exact Order Requested) */}
                <div className="space-y-2">
                  <div className="px-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      All Operational Tools & Ticket Hubs
                    </span>
                    <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      10 TOOLS
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {secondaryNavItems.map((item) => {
                      const ItemIcon = item.icon;
                      const isItemActive = item.targetTab ? activeTab === item.targetTab : false;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavClick(item)}
                          className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition cursor-pointer ${
                            isItemActive
                              ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 shadow-sm"
                              : "bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 dark:hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-transparent flex items-center justify-center shrink-0 shadow-xs">
                              <ItemIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {item.desc}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ml-2 ${item.tagColor}`}
                          >
                            {item.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated Support Modal Dialog */}
            {isSupportModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
                <div className="w-full max-w-md bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Headphones className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white">
                          Oddora AI Support Desk
                        </h3>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          24/7 VIP Customer & Technical Assistance
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSupportModalOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <a
                      href="mailto:support@oddora.ai"
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between hover:border-emerald-500/40 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">Email Support</span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">support@oddora.ai</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">Send Email →</span>
                    </a>

                    <a
                      href="https://t.me/OddoraAI"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between hover:border-cyan-500/40 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">Telegram VIP Channel</span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">@OddoraAI</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 font-mono">Join Telegram →</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSupportModalOpen(false);
                        setIsMoreDrawerOpen(false);
                        handleSelectNav("copilot");
                      }}
                      className="w-full p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-between text-emerald-700 dark:text-emerald-400 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold block">Live AI Betting Copilot</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Ask algorithmic questions & generate tickets</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold font-mono">Launch →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </header>

      {/* =========================================================================
          STICKY MOBILE BOTTOM NAVIGATION BAR
          Strictly 4 Clean Bottom Tabs: Home, Matches, Builder, Copilot
          (No "More" tab to prevent clipping on small Samsung/mobile screens)
         ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-[#070A0E]/98 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 px-2 py-1.5 grid grid-cols-4 items-center justify-around shadow-lg dark:shadow-2xl">
        {mobileCoreTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectNav(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] mt-0.5 font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-4 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;
