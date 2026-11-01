import { NextRequest, NextResponse } from "next/server";
import { POST as handler } from "../engines/bookmaker/route";
import { decodeAnyBookingCode } from "@/lib/engines/bookingEngine";
import { SPORTYBET_BROWSER_HEADERS } from "@/lib/coreBookingVault";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const res = await handler(request);
    // Ensure CORS headers on response
    Object.entries(CORS_HEADERS).forEach(([key, val]) => {
      res.headers.set(key, val);
    });
    return res;
  } catch (err: any) {
    console.error("[/api/bookmaker] Top-level handler error:", err);
    return NextResponse.json(
      {
        status: "error",
        success: false,
        message: err?.message || "Failed to book slip on SportyBet. Please retry.",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const proxyPath = searchParams.get("proxy");

  // Server-Side Proxy: Safely proxies SportyBet external endpoints without client CORS issues
  if (proxyPath) {
    try {
      const cleanPath = proxyPath.startsWith("/") ? proxyPath.slice(1) : proxyPath;
      const targetUrl = `https://www.sportybet.com/api/ng/${cleanPath}`;
      const proxyRes = await fetch(targetUrl, {
        headers: SPORTYBET_BROWSER_HEADERS,
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });

      if (proxyRes.ok) {
        const json = await proxyRes.json();
        return NextResponse.json(json, { status: 200, headers: CORS_HEADERS });
      }
    } catch (proxyErr) {
      console.warn("[/api/bookmaker] Proxy fetch error:", proxyErr);
    }
  }

  // Booking Code Decode
  if (code) {
    const cleanCode = code.trim().toUpperCase();
    const decoded = await decodeAnyBookingCode(cleanCode, "SportyBet");
    return NextResponse.json(decoded, { status: 200, headers: CORS_HEADERS });
  }

  return NextResponse.json(
    { status: "ok", service: "SportyBet Booking Vault Proxy", timestamp: Date.now() },
    { status: 200, headers: CORS_HEADERS }
  );
}

