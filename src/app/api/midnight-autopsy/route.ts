import { NextResponse } from "next/server";
import {
  calculateAndSaveResultsSummary,
  getLatestResultsSummary,
} from "@/lib/engines/resultsCalculator";

export async function GET() {
  try {
    const summary = await getLatestResultsSummary();
    return NextResponse.json({
      status: "success",
      message: "Oddora AI Result Autopsy Engine",
      data: summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Autopsy lookup failed." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const updated = await calculateAndSaveResultsSummary();
    return NextResponse.json({
      status: "success",
      message: "Midnight Result Autopsy executed successfully.",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Autopsy calculation failed." },
      { status: 500 }
    );
  }
}
