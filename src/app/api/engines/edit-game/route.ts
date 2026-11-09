import { NextRequest } from "next/server";
import { POST as handler } from "../edit-slip/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return handler(request);
}

