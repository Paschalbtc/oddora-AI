"use client";

import React from "react";
import { OddoraWorkspace } from "@/components/OddoraWorkspace";

export default function Home() {
  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
      <OddoraWorkspace defaultTab="home" showTelemetryBar={true} />
    </div>
  );
}

