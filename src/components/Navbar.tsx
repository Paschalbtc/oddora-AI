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
  KeyRound,
  Lock,
  Users,
} from "lucide-react";
import { OddoraLogo } from "./OddoraLogo";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { NotificationCenter } from "./NotificationCenter";

export type WorkspaceTab =
  | "home"
  | "all_matches"
  | "over_25"
  | "slip_builder"
  | "edit_game"
  | "my_bets"
  | "copilot"
  | "leagues"
  | "other_sports"
  | "market_guide"
  | "how_it_works"
  | "pricing"
  | "affiliates"
  | "guide"
  | "markets_glossary";

export type UserTier = "FREE" | "PRO" | "PREMIUM";

export interface NavbarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  currentTier: UserTier;
  onTierChange: (tier: UserTier) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenAccountModal?: (tab?: "profile" | "security" | "plan") => void;
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
  const { user, profile: authProfile, isAuthenticated, openAuthModal, requireAuth, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const menuDrawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (
        isMenuOpen &&
        menuDrawerRef.current &&
        !menuDrawerRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsProfileDropdownOpen(false);
        setIsSupportModalOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // Desktop Primary Navigation Tabs
  const desktopPrimaryTabs = [
    { id: "home" as WorkspaceTab, label: "Home", icon: Compass, badge: "DAILY" },
    { id: "all_matches" as WorkspaceTab, label: "All Matches", icon: Layers, badge: "SCHEDULE" },
    { id: "slip_builder" as WorkspaceTab, label: "Slip Builder", icon: Sparkles, badge: "SOLVER" },
    { id: "edit_game" as WorkspaceTab, label: "Edit Game", icon: SlidersHorizontal, badge: "PRUNER" },
    { id: "copilot" as WorkspaceTab, label: "AI Copilot", icon: Bot, badge: "STUDIO" },
  ];

  // Mobile Bottom Bar: Exactly 4 Clean Core Tabs
  const mobileCoreTabs = [
    { id: "home" as WorkspaceTab, label: "Home", icon: Compass },
    { id: "all_matches" as WorkspaceTab, label: "Matches", icon: Layers },
    { id: "slip_builder" as WorkspaceTab, label: "Builder", icon: Sparkles },
    { id: "copilot" as WorkspaceTab, label: "Copilot", icon: Bot },
  ];

  // 9 Working Navigation Links for the Right 3-Bar Menu (Secondary Platform Features)
  const drawerNavItems: Array<{
    id: string;
    targetTab: WorkspaceTab | null;
    label: string;
    desc: string;
    icon: any;
    tag?: string;
    tagColor?: string;
    isSupport?: boolean;
  }> = [
    {
      id: "my_bets",
      targetTab: "my_bets",
      label: "My Bets Tracker",
      desc: "Live grading, pending slips & win stats",
      icon: Trophy,
      tag: "TRACKER",
      tagColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "edit_game",
      targetTab: "edit_game",
      label: "Edit Games",
      desc: "Slip Pruner / Solver & Splitter",
      icon: SlidersHorizontal,
      tag: "4 MODES",
      tagColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    },
    {
      id: "over_25",
      targetTab: "over_25",
      label: "Over 2.5 Daily",
      desc: "High Goal Expectancy Daily Slips",
      icon: Flame,
      tag: "HOT",
      tagColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "affiliates",
      targetTab: "affiliates",
      label: "Affiliates Hub / Affiliate Page",
      desc: "Earn 25% recurring lifetime commissions",
      icon: Users,
      tag: "EARN",
      tagColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "slip_builder",
      targetTab: "slip_builder",
      label: "Slip Builder",
      desc: "Custom Odds & 14-Day Spread Solver",
      icon: Sparkles,
      tag: "SOLVER",
      tagColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "all_matches",
      targetTab: "all_matches",
      label: "All Matches / Today's Schedule",
      desc: "Live Fixtures, Odds & 4-Sport Schedule",
      icon: Layers,
      tag: "4 SPORTS",
      tagColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30",
    },
    {
      id: "markets_glossary",
      targetTab: "markets_glossary",
      label: "Betting Markets Glossary",
      desc: "Rules for 1X2, DNB, BTTS, Halves & Handicaps",
      icon: HelpCircle,
      tag: "A-Z",
      tagColor: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30",
    },
    {
      id: "guide",
      targetTab: "guide",
      label: "Platform Guide / How It Works",
      desc: "Step-by-Step Onboarding: How to Play & Win",
      icon: BookOpen,
      tag: "NEW",
      tagColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "pricing",
      targetTab: "pricing",
      label: "Pricing & VIP Plans",
      desc: "Compare Free, Pro VIP and Premium VIP Tiers",
      icon: Crown,
      tag: "VIP",
      tagColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "support",
      targetTab: null,
      label: "Support",
      desc: "24/7 VIP Helpdesk, Telegram & Live AI Assistance",
      icon: Headphones,
      tag: "24/7",
      tagColor: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
      isSupport: true,
    },
  ];

  const handleSelectNav = (tabId: WorkspaceTab) => {
    if (!isAuthenticated && tabId !== "home" && tabId !== "guide" && tabId !== "markets_glossary") {
      requireAuth(() => {
        onTabChange(tabId);
        setIsMenuOpen(false);
        setIsProfileDropdownOpen(false);
      }, `Please sign in or create a free account to access ${tabId.replace(/_/g, " ").toUpperCase()}`);
      return;
    }
    onTabChange(tabId);
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const handleDrawerItemClick = (item: (typeof drawerNavItems)[number]) => {
    if (item.isSupport) {
      setIsSupportModalOpen(true);
      return;
    }
    if (item.targetTab) {
      handleSelectNav(item.targetTab);
    }
  };

  return (
    <>
      {/* =========================================================================
          MAIN TOP NAVBAR (AfriOdds-Inspired Layout, De-cluttered, Clean Header)
         ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070A0E]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-3 h-16">
          {/* Left: Brand Identity (Clickable Home Link) */}
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

          {/* Center-Left: Desktop Navigation Tabs (5 Core Tabs - No "More Pages" dropdown) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {desktopPrimaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectNav(tab.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-slate-100 text-slate-900 dark:bg-white/[0.1] dark:text-white border border-slate-200 dark:border-white/15 shadow-xs"
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
          </nav>

          {/* Right Controls: Notifications + Profile Dropdown + 3-Bar Drawer Toggle */}
          <div className="shrink-0 flex items-center gap-2">
            {/* Notification Center */}
            <NotificationCenter onNavigateTab={handleSelectNav} />

            {/* Profile Dropdown Trigger (Authenticated) OR Sign In Button */}
            {isAuthenticated ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  title="Open Account Details & Settings"
                  aria-expanded={isProfileDropdownOpen}
                  className={`inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer min-w-[40px] min-h-[40px] ${
                    isProfileDropdownOpen
                      ? "bg-slate-200 text-slate-900 dark:bg-white/[0.12] dark:text-white border-emerald-500/50"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                  } border`}
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-black text-xs hidden sm:inline truncate max-w-[85px] ml-1.5">
                    {authProfile?.displayName?.split(" ")[0] || "Profile"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hidden sm:inline ml-0.5 transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Structured Overhauled Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-80 max-w-[340px] rounded-2xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/15 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                    {/* 1. User Identity Header (No Avatar Picker) */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                        <User className="w-5 h-5" />
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

                    {/* My Bets Tracker Link */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleSelectNav("my_bets");
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/15 border border-amber-500/30 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            My Bets Tracker
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            Track saved slips & live match grading
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {/* 2. My Profile / Account Details Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onOpenAccountModal) onOpenAccountModal("profile");
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            My Profile / Account Details
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            View & edit display name, phone, default stake
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {/* 3. Security & Change Password Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onOpenAccountModal) onOpenAccountModal("security");
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            Security & Change Password
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            Update password & account recovery
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {/* 4. Theme Toggle Switcher */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        {theme === "light" ? (
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>Appearance</span>
                      </span>
                      <div className="flex items-center bg-white dark:bg-black/50 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-xs">
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

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-white/10 pt-1" />

                    {/* 5. Logout Button */}
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
                className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-md transition active:scale-95 cursor-pointer min-w-[40px] min-h-[40px]"
                title="Sign In or Register"
              >
                <User className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span className="hidden sm:inline ml-1.5">Sign In</span>
              </button>
            )}

            {/* Right 3-Bar (Hamburger) Menu Button */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 transition active:scale-95 shrink-0 flex items-center justify-center min-w-[42px] min-h-[42px] shadow-xs cursor-pointer"
              title="Open Navigation Menu & Tools"
              aria-label="Navigation Menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800 dark:text-slate-200" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          RIGHT 3-BAR NAVIGATION DRAWER (Slide-Over Drawer, Detached from Header)
          Contains the 9 secondary operational tools & hubs with high z-index
         ========================================================================= */}
        {isMenuOpen && (
          <>
            {/* Backdrop Overlay with Backdrop Click Listener */}
            <div
              className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-Over Drawer (Right-Anchored, zero clipping) */}
            <div
              ref={menuDrawerRef}
              className="fixed inset-y-0 right-0 w-full sm:w-[420px] max-w-full z-[100] bg-white dark:bg-[#0c111a] border-l border-slate-200 dark:border-white/15 p-5 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200 text-slate-900 dark:text-white flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
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
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition active:scale-95 shrink-0 flex items-center justify-center min-w-[38px] min-h-[38px] shadow-xs cursor-pointer"
                    title="Close Navigation Menu"
                    aria-label="Close Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Data Sync Button */}
                {onRefresh && (
                  <button
                    type="button"
                    onClick={() => onRefresh()}
                    disabled={isRefreshing}
                    className="w-full p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-between transition cursor-pointer active:scale-[0.99] disabled:opacity-60 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <RefreshCw
                        className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                      <div className="text-left">
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          {isRefreshing ? "Syncing Fixtures & AI Slips..." : "Sync Fixtures & Live Engines"}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Pre-warm SportyBet odds & analytical brains
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {isRefreshing ? "SYNCING" : "LIVE"}
                    </span>
                  </button>
                )}

                {/* 8 Operational Navigation Links */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block px-1 mb-2">
                    Platform Tools & ticket Hubs
                  </span>

                  {drawerNavItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = item.targetTab ? activeTab === item.targetTab : false;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleDrawerItemClick(item)}
                        className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition cursor-pointer ${
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 shadow-xs"
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
                        {item.tag && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ml-2 ${item.tagColor}`}
                          >
                            {item.tag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer: Appearance Switcher */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 shrink-0">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {theme === "light" ? (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>Theme Mode</span>
                  </span>
                  <div className="flex items-center bg-white dark:bg-black/50 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-xs">
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
              </div>
            </div>
          </>
        )}

        {/* Global Search Modal */}
        <GlobalSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onNavigateTab={handleSelectNav}
        />

        {/* Dedicated 24/7 Support Modal */}
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-900 dark:text-white">
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
                    setIsMenuOpen(false);
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

      {/* =========================================================================
          STICKY MOBILE BOTTOM NAVIGATION BAR
          Strictly 4 Clean Bottom Tabs: Home, Matches, Builder, Copilot
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
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
