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
      data: summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to load win rate summary." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const updated = await calculateAndSaveResultsSummary();
    return NextResponse.json({
      status: "success",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to calculate results summary." },
      { status: 500 }
    );
  }
}
