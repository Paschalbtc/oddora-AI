"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar, WorkspaceTab, UserTier } from "./Navbar";
import { HomeDailyOddsTab } from "./tabs/HomeDailyOddsTab";
import { AllMatchesTab } from "./tabs/AllMatchesTab";
import { Over25DailyTab } from "./tabs/Over25DailyTab";
import { SlipBuilderTab } from "./tabs/SlipBuilderTab";
import { EditGameTab } from "./tabs/EditGameTab";
import { CopilotTab } from "./tabs/CopilotTab";
import { SecondaryPages } from "./tabs/SecondaryPages";
import { CheckCircle2, X, Crown, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { BetSlipProvider } from "@/context/BetSlipContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FloatingBetSlip } from "./FloatingBetSlip";
import { ProfileModal } from "./ProfileModal";
import { AuthModal } from "./AuthModal";

const OddoraWorkspaceInner: React.FC = () => {
  const searchParams = useSearchParams();
  const urlTab = searchParams?.get("tab") as WorkspaceTab | null;
  const urlSport = searchParams?.get("sport");
  const { user, profile, isAuthenticated, openAuthModal, requireAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("home");
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>(urlSport || "football");
  const [currentTier, setCurrentTier] = useState<UserTier>("FREE");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Sync tier with profile tier if set
  useEffect(() => {
    if (profile?.tier) {
      setCurrentTier(profile.tier);
    }
  }, [profile?.tier]);

  // Capture referral code on visit
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        localStorage.setItem("oddora_referral_code", ref);
      }
    }
  }, []);

  // Sync with URL query parameter on mount
  useEffect(() => {
    if (urlSport) {
      setSelectedSportFilter(urlSport);
    }
    if (urlTab) {
      const validTabs: WorkspaceTab[] = [
        "home",
        "all_matches",
        "over_25",
        "slip_builder",
        "edit_game",
        "copilot",
        "leagues",
        "other_sports",
        "market_guide",
        "how_it_works",
        "pricing",
        "affiliates",
      ];
      if (validTabs.includes(urlTab)) {
        setActiveTab(urlTab);
      }
    }
  }, [urlTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const proceedTabChange = (newTab: WorkspaceTab, options?: { sport?: string }) => {
    setActiveTab(newTab);
    if (options?.sport) {
      setSelectedSportFilter(options.sport.toLowerCase());
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newTab === "home") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", newTab);
      }
      if (options?.sport) {
        url.searchParams.set("sport", options.sport.toLowerCase());
      } else if (newTab !== "all_matches") {
        url.searchParams.delete("sport");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleTabChange = (newTab: WorkspaceTab, options?: { sport?: string }) => {
    if (!isAuthenticated && newTab !== "home") {
      requireAuth(() => {
        proceedTabChange(newTab, options);
      }, `Please sign up or log in to access ${newTab.replace(/_/g, " ").toUpperCase()} and premium analytical engines.`);
      return;
    }
    proceedTabChange(newTab, options);
  };

  const handleTierChange = (newTier: UserTier) => {
    setCurrentTier(newTier);
    showToast(`Active Subscription: Switched to ${newTier} Plan`);
  };

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    showToast("Syncing latest live fixtures and daily slips...");
    try {
      await fetch("/api/engines/all-matches", { method: "POST" });
      await fetch("/api/engines/daily-slips", { method: "POST" });
      await fetch("/api/engines/results", { method: "POST" });
      showToast("Sync complete: All 4 engines updated.");
    } catch {
      showToast("Sync completed with cached data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#F8FAFC] dark:bg-[#070A0E] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black transition-colors duration-150">
      {/* Top Navbar & Mobile Bottom Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentTier={currentTier}
        onTierChange={handleTierChange}
        onRefresh={handleGlobalRefresh}
        isRefreshing={isRefreshing}
        onOpenAccountModal={() => setIsUpgradeModalOpen(true)}
      />

      {/* Main Content Workspace Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 py-5 pb-24 md:pb-12">
        {/* Compulsory Sign-Up Banner for Unauthenticated Visitors */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-[#0D121C] dark:to-teal-950/40 border-2 border-[#00C896] dark:border-emerald-500/40 shadow-sm dark:shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                  <span>FREE SIGN-UP REQUIRED</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Create Your Free Account to Unlock All Predictions & 1-Click Booking
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Instant access to verified SportyBet & Bet9ja codes, Slip Builder solver, and daily high-win rate odds.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => openAuthModal("signup", "Create your free account to unlock all features")}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Create Free Account / Sign In</span>
              </button>
            </div>
          </div>
        )}
        {activeTab === "home" && (
          <HomeDailyOddsTab
            currentTier={currentTier}
            onNavigateTab={handleTabChange}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}

        {activeTab === "all_matches" && (
          <AllMatchesTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            initialSport={selectedSportFilter as any}
            onAddToSlip={() => {
              showToast("Match added to Bet Slip!");
            }}
          />
        )}

        {activeTab === "over_25" && (
          <Over25DailyTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}

        {activeTab === "slip_builder" && (
          <SlipBuilderTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}

        {activeTab === "edit_game" && (
          <EditGameTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}

        {activeTab === "copilot" && (
          <CopilotTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}

        {/* Secondary Dropdown Pages */}
        {(activeTab === "leagues" ||
          activeTab === "other_sports" ||
          activeTab === "market_guide" ||
          activeTab === "how_it_works" ||
          activeTab === "pricing" ||
          activeTab === "affiliates") && (
          <SecondaryPages
            viewId={activeTab}
            currentTier={currentTier}
            onNavigateTab={handleTabChange}
            onSelectTier={handleTierChange}
          />
        )}
      </main>

      {/* Profile & Plan Mode Modal (View & Edit Profile, Switch Plan Mode) */}
      <ProfileModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentTier={currentTier}
        onTierChange={handleTierChange}
        onNavigateTab={handleTabChange}
        onProfileSaved={(profile) => {
          showToast(`Profile updated for ${profile.displayName}! Preferred: ${profile.preferredBookmaker}`);
        }}
      />

      {/* Global Auth Modal (Login / Sign Up / Google / X) */}
      <AuthModal />

      {/* Interactive Global Floating Bet Slip */}
      <FloatingBetSlip />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500 text-black font-black text-xs shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const OddoraWorkspace: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070A0E] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono text-xs">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading Oddora AI V2 Platform...</span>
          </div>
        </div>
      }
    >
      <AuthProvider>
        <BetSlipProvider>
          <OddoraWorkspaceInner />
        </BetSlipProvider>
      </AuthProvider>
    </Suspense>
  );
};

export default OddoraWorkspace;

