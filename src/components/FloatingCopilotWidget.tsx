"use client";

import React, { useState, useEffect } from "react";
import { useBetSlip } from "@/context/BetSlipContext";
import { UserTier } from "./Navbar";
import { CopilotTab } from "./tabs/CopilotTab";
import { Bot, Sparkles, X, MessageSquare } from "lucide-react";

export interface FloatingCopilotWidgetProps {
  currentTier?: UserTier;
  onOpenUpgradeModal?: () => void;
}

export const FloatingCopilotWidget: React.FC<FloatingCopilotWidgetProps> = ({
  currentTier = "FREE",
  onOpenUpgradeModal = () => {},
}) => {
  const { legs, isOpen: isSlipOpen } = useBetSlip();
  const [isOpen, setIsOpen] = useState(false);

  // Lock background scroll when the Copilot pop-up modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-hide completely when the Bet Slip Drawer is opened
  if (isSlipOpen) {
    return null;
  }

  // Dynamic vertical offset: shift up when Compact Bet Slip Bar is visible
  const bottomPosition =
    legs.length > 0 ? "bottom-36 md:bottom-20" : "bottom-24 md:bottom-6";

  return (
    <>
      {/* =========================================================================
          1. FLOATING META-AI RING LAUNCHER BUTTON
         ========================================================================= */}
      {!isOpen && (
        <div
          className={`fixed left-4 ${bottomPosition} z-40 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2`}
        >
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Oddora AI Copilot"
            className="group relative flex items-center justify-center p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_35px_rgba(59,130,246,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Pulsing subtle ambient halo */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-emerald-400 opacity-75 blur-xs group-hover:opacity-100 transition duration-300 animate-pulse" />

            {/* Inner Dark Orb */}
            <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#070A0E] flex items-center justify-center overflow-hidden border border-white/10">
              {/* Shimmer gradient rotation */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-emerald-500/20 rounded-full" />

              {/* Bot & Sparkles Icon */}
              <div className="relative flex items-center justify-center text-white">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] group-hover:scale-110 transition-transform duration-200" />
                <Sparkles className="w-2.5 h-2.5 text-cyan-300 absolute -top-1 -right-1.5 animate-bounce" />
              </div>

              {/* Online Green Indicator Dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#070A0E]" />
            </div>

            {/* Hover Tooltip (Desktop) */}
            <span className="hidden md:group-hover:flex items-center gap-1.5 absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900/95 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-white/10 backdrop-blur-md pointer-events-none animate-in fade-in duration-150">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Ask Oddora AI Copilot</span>
            </span>
          </button>
        </div>
      )}

      {/* =========================================================================
          2. SCREEN-FITTED POP-UP MODAL / BOTTOM SHEET
         ========================================================================= */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-start sm:p-4">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
          />

          {/* Modal Container: Bottom sheet on mobile, anchored modal on desktop */}
          <div className="relative z-10 w-full sm:w-[460px] md:w-[480px] h-[85dvh] sm:h-[650px] max-h-[92dvh] bg-[#11161F] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:ml-4 sm:mb-4 animate-in slide-in-from-bottom-5 duration-200">
            <CopilotTab
              currentTier={currentTier}
              onOpenUpgradeModal={onOpenUpgradeModal}
              isEmbedded={true}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCopilotWidget;

