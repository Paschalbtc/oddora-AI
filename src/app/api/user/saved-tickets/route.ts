import { NextRequest, NextResponse } from "next/server";
import { GET as ticketsGET, POST as ticketsPOST, DELETE as ticketsDELETE } from "@/app/api/tickets/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return ticketsGET(request);
}

export async function POST(request: NextRequest) {
  return ticketsPOST(request);
}

export async function DELETE(request: NextRequest) {
  return ticketsDELETE(request);
}
