import { NextRequest } from "next/server";
import { POST as handler } from "../engines/edit-slip/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  return handler(request);
}
