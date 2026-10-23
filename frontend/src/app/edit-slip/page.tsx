"use client";

import React from "react";
import { OddoraWorkspace } from "@/components/OddoraWorkspace";

export default function EditSlipPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <OddoraWorkspace defaultTab="edit_slip" showTelemetryBar={true} />
    </div>
  );
}

