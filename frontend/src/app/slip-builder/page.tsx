"use client";

import React from "react";
import { OddoraWorkspace } from "@/components/OddoraWorkspace";
import { Sparkles } from "lucide-react";

export default function SlipBuilderPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
          <Sparkles className="w-3.5 h-3.5" />
          <span>COMBINATORIAL MULTIPLIER ACCUMULATOR</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
          20,000x Slip Generator & AI Copilot
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
          Request precision accumulators from 2.0x up to 20,000+ odds with official booking codes, or ask our quant copilot anything.
        </p>
      </div>

      <OddoraWorkspace defaultTab="slip" showTelemetryBar={true} />
    </div>
  );
}

