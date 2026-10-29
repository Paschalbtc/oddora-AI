"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MarketsGlossaryView } from "@/components/views/MarketsGlossaryView";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { BetSlipProvider } from "@/context/BetSlipContext";

export default function MarketsGlossaryPage() {
  const router = useRouter();

  const handleNavigate = (tab: any) => {
    router.push(`/?tab=${tab}`);
  };

  return (
    <AuthProvider>
      <BetSlipProvider>
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070A0E] text-slate-900 dark:text-slate-100 flex flex-col">
          <Navbar
            activeTab={"markets_glossary" as any}
            onTabChange={handleNavigate}
            currentTier="FREE"
            onTierChange={() => {}}
          />
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 py-8 pb-20">
            <MarketsGlossaryView />
          </main>
          <Footer onNavigateTab={handleNavigate} />
        </div>
      </BetSlipProvider>
    </AuthProvider>
  );
}

