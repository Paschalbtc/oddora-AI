"use client";

import React from "react";
import { OddoraWorkspace } from "@/components/OddoraWorkspace";
import { Activity } from "lucide-react";

export default function AutopsyPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
          <Activity className="w-3.5 h-3.5" />
          <span>12:00 AM SELF-LEARNING MEMORY ENGINE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
          Midnight Autopsy & Memory Bank
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
          Inspect how the machine learning system dissects lost predictions and vectors lessons into 768-dimensional long-term memory.
        </p>
      </div>

      <OddoraWorkspace defaultTab="autopsy" showTelemetryBar={true} />
    </div>
  );
}

