import { NextRequest } from "next/server";
import { POST as handler } from "../engines/bookmaker/route";

export async function POST(request: NextRequest) {
  return handler(request);
}

