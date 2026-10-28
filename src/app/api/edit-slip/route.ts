import { NextRequest } from "next/server";
import { POST as handler } from "../engines/edit-slip/route";

export async function POST(request: NextRequest) {
  return handler(request);
}

