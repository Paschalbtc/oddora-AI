import { NextRequest } from "next/server";
import { GET as syncGET, POST as syncPOST } from "@/app/api/tickets/sync/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  return syncGET(req);
}

export async function POST(req: NextRequest) {
  return syncPOST(req);
}
