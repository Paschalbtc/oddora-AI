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
import { CheckCircle2, X, Crown, ShieldCheck, Zap } from "lucide-react";
import { BetSlipProvider } from "@/context/BetSlipContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FloatingBetSlip } from "./FloatingBetSlip";
import { ProfileModal } from "./ProfileModal";
import { AuthModal } from "./AuthModal";

const OddoraWorkspaceInner: React.FC = () => {
  const searchParams = useSearchParams();
  const urlTab = searchParams?.get("tab") as WorkspaceTab | null;
  const urlSport = searchParams?.get("sport");
  const { user, profile, isAuthenticated, openAuthModal } = useAuth();

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

  const handleTabChange = (newTab: WorkspaceTab, options?: { sport?: string }) => {
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
    <div className="min-h-screen bg-[#070A0E] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
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
        <div className="min-h-screen bg-[#070A0E] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
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

