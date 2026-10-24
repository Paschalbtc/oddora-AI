import { NextRequest, NextResponse } from "next/server";
import { executeEditSlipLogic } from "@/app/api/edit-slip-ai/route";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await executeEditSlipLogic(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

