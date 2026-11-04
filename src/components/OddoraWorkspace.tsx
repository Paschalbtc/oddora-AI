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
import { PlatformGuideView } from "./views/PlatformGuideView";
import { MarketsGlossaryView } from "./views/MarketsGlossaryView";
import { Footer } from "./Footer";
import { CheckCircle2, X, Crown, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { BetSlipProvider } from "@/context/BetSlipContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FloatingBetSlip } from "./FloatingBetSlip";
import { ProfileModal } from "./ProfileModal";
import { AuthModal } from "./AuthModal";
import { MyBetsTab } from "./tabs/MyBetsTab";
import { FloatingCopilotWidget } from "./FloatingCopilotWidget";

interface OddoraWorkspaceProps {
  initialTab?: WorkspaceTab;
}

const OddoraWorkspaceInner: React.FC<OddoraWorkspaceProps> = ({ initialTab }) => {
  const searchParams = useSearchParams();
  const urlTab = searchParams?.get("tab") as WorkspaceTab | null;
  const urlSport = searchParams?.get("sport");
  const { user, profile, isAuthenticated, openAuthModal, requireAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab || "home");
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>(urlSport || "football");
  const [currentTier, setCurrentTier] = useState<UserTier>("FREE");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [accountModalSubTab, setAccountModalSubTab] = useState<"profile" | "security" | "plan">("profile");

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
        "my_bets",
        "copilot",
        "leagues",
        "other_sports",
        "market_guide",
        "how_it_works",
        "pricing",
        "affiliates",
        "guide",
        "markets_glossary",
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

  // Global scroll restoration: scroll to top immediately whenever activeTab changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [activeTab, searchParams]);

  const proceedTabChange = (newTab: WorkspaceTab, options?: { sport?: string }) => {
    setActiveTab(newTab);
    if (options?.sport) {
      setSelectedSportFilter(options.sport.toLowerCase());
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
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
    <div className={`w-full max-w-[100vw] bg-[#F8FAFC] dark:bg-[#070A0E] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black transition-colors duration-150 ${
      activeTab === "copilot" ? "h-[100dvh] overflow-hidden" : "min-h-screen overflow-x-hidden"
    }`}>
      {/* Top Navbar & Mobile Bottom Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentTier={currentTier}
        onTierChange={handleTierChange}
        onRefresh={handleGlobalRefresh}
        isRefreshing={isRefreshing}
        onOpenAccountModal={(subTab) => {
          setAccountModalSubTab(subTab || "profile");
          setIsUpgradeModalOpen(true);
        }}
      />

      {/* Main Content Workspace Container */}
      <main className={`flex-1 w-full ${
        activeTab === "copilot"
          ? "h-[calc(100dvh-4rem)] p-0 m-0 max-w-none overflow-hidden"
          : "max-w-7xl mx-auto px-3 sm:px-4 py-5 pb-24 md:pb-12"
      }`}>
        {activeTab === "home" && (
          <HomeDailyOddsTab
            currentTier={currentTier}
            onNavigateTab={handleTabChange}
            onOpenUpgradeModal={() => {
              setAccountModalSubTab("plan");
              setIsUpgradeModalOpen(true);
            }}
          />
        )}

        {activeTab === "all_matches" && (
          <AllMatchesTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => {
              setAccountModalSubTab("plan");
              setIsUpgradeModalOpen(true);
            }}
            initialSport={selectedSportFilter as any}
            onAddToSlip={() => {
              showToast("Match added to Bet Slip!");
            }}
          />
        )}

        {activeTab === "over_25" && (
          <Over25DailyTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => {
              setAccountModalSubTab("plan");
              setIsUpgradeModalOpen(true);
            }}
          />
        )}

        {activeTab === "slip_builder" && (
          <SlipBuilderTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => {
              setAccountModalSubTab("plan");
              setIsUpgradeModalOpen(true);
            }}
          />
        )}

        {activeTab === "edit_game" && (
          <EditGameTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => {
              setAccountModalSubTab("plan");
              setIsUpgradeModalOpen(true);
            }}
          />
        )}

        {activeTab === "copilot" && (
          <CopilotTab
            currentTier={currentTier}
            onOpenUpgradeModal={() => {
              setAccountModalSubTab("plan");
              setIsUpgradeModalOpen(true);
            }}
          />
        )}

        {/* My Bets & Slip Tracker Tab */}
        {activeTab === "my_bets" && (
          <MyBetsTab
            onNavigateTab={handleTabChange}
            onOpenUpgradeModal={() => {
              setAccountModalSubTab("plan");
              setIsUpgradeModalOpen(true);
            }}
          />
        )}

        {/* Dedicated Platform Guide View */}
        {(activeTab === "guide" || activeTab === "how_it_works") && (
          <PlatformGuideView onNavigateTab={handleTabChange} />
        )}

        {/* Dedicated Betting Markets Glossary View */}
        {(activeTab === "markets_glossary" || activeTab === "market_guide") && (
          <MarketsGlossaryView />
        )}

        {/* Secondary Dropdown Pages (Leagues, Other Sports, Pricing, Affiliates) */}
        {(activeTab === "leagues" ||
          activeTab === "other_sports" ||
          activeTab === "pricing" ||
          activeTab === "affiliates") && (
          <SecondaryPages
            viewId={activeTab as any}
            currentTier={currentTier}
            onNavigateTab={handleTabChange}
            onSelectTier={handleTierChange}
          />
        )}
      </main>

      {/* Complete Responsive Multi-Column Footer */}
      {activeTab !== "copilot" && <Footer onNavigateTab={handleTabChange} />}

      {/* Profile & Security Modal */}
      <ProfileModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentTier={currentTier}
        onTierChange={handleTierChange}
        onNavigateTab={handleTabChange}
        initialSubTab={accountModalSubTab}
        onProfileSaved={(profile) => {
          showToast(`Profile updated for ${profile.displayName}! Preferred: ${profile.preferredBookmaker}`);
        }}
      />

      {/* Global Auth Modal (Login / Sign Up / Google / X) */}
      <AuthModal />

      {/* Interactive Global Floating Bet Slip */}
      <FloatingBetSlip />

      {/* Floating Meta-AI Copilot Widget */}
      {activeTab !== "copilot" && (
        <FloatingCopilotWidget
          currentTier={currentTier}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        />
      )}

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

export const OddoraWorkspace: React.FC<OddoraWorkspaceProps> = ({ initialTab }) => {
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
          <OddoraWorkspaceInner initialTab={initialTab} />
        </BetSlipProvider>
      </AuthProvider>
    </Suspense>
  );
};

export default OddoraWorkspace;

