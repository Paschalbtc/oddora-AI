import { NextRequest } from "next/server";
import { GET as handler, POST as postHandler } from "../engines/daily-slips/route";

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return postHandler();
}

