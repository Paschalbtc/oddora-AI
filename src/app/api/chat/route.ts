import { NextRequest, NextResponse } from "next/server";
import { GET as copilotGet, POST as copilotPost, DELETE as copilotDelete } from "../copilot/route";

export async function GET(request: NextRequest) {
  return copilotGet(request);
}

export async function POST(request: NextRequest) {
  return copilotPost(request);
}

export async function DELETE(request: NextRequest) {
  return copilotDelete(request);
}
