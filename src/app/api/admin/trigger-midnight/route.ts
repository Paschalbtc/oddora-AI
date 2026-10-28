import { NextRequest, NextResponse } from "next/server";
import { POST as handler } from "../../midnight-autopsy/route";

export async function GET(request: NextRequest) {
  return handler();
}

export async function POST(request: NextRequest) {
  return handler();
}
