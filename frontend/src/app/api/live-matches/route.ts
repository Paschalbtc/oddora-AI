import { NextRequest, NextResponse } from "next/server";
import {
  syncMultiDayFixtures,
  getApiQuotaState,
  getSyncBucket,
  generate3DailyBankerTickets,
} from "@/lib/apiFootballGatekeeper";
import { LiveMatchPick } from "@/lib/sportybet";
import { persistDailyPicks } from "@/lib/platformHistory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || searchParams.get("horizon") || "today";
    const filter = searchParams.get("filter") || "all";
    const leagueFilter = searchParams.get("league") || "";
    const forceRefresh = searchParams.get("refresh") === "true";

    const syncInfo = getSyncBucket();
    const todayDate = syncInfo.todayDate;
    const nowMs = Date.now();

    // 1. Fetch multi-day fixtures through the strict API-Football Request Gatekeeper
    const allMatches = await syncMultiDayFixtures({ force: forceRefresh });

    // 2. Filter by Day Horizon (Today, Tomorrow, Next 2 Days)
    const tomorrowDate = new Date(nowMs + 24 * 3600 * 1000).toISOString().slice(0, 10);
    const dayAfterTomorrowDate = new Date(nowMs + 48 * 3600 * 1000).toISOString().slice(0, 10);

    let horizonPicks = allMatches.filter((m) => {
      const ko = new Date(m.kickoff_time).getTime();
      const matchDate = m.kickoff_time ? m.kickoff_time.slice(0, 10) : "";

      if (timeframe === "tomorrow") {
        return matchDate === tomorrowDate;
      }
      if (timeframe === "next2days") {
        return matchDate === tomorrowDate || matchDate === dayAfterTomorrowDate;
      }
      // default "today": matches today with kickoff in future or ongoing
      return matchDate === todayDate && (isNaN(ko) || ko > nowMs - 3600000);
    });

    // If horizon filter returned 0, gracefully provide all matches so screen is never blank
    if (horizonPicks.length === 0 && allMatches.length > 0) {
      horizonPicks = allMatches;
    }

    // 3. Filter by League if specified
    if (leagueFilter.trim()) {
      const lf = leagueFilter.toLowerCase();
      const leagueMatches = horizonPicks.filter(
        (p) => p.league_name.toLowerCase().includes(lf) || (p.league_country && p.league_country.toLowerCase().includes(lf))
      );
      if (leagueMatches.length > 0) {
        horizonPicks = leagueMatches;
      }
    }

    // 4. Apply Risk Filter
    let filteredPicks = horizonPicks;
    if (filter === "safe") {
      filteredPicks = horizonPicks.filter((p) => p.odd_value <= 1.65);
    } else if (filter === "value") {
      filteredPicks = horizonPicks.filter((p) => p.odd_value >= 1.85 && p.odd_value <= 3.20);
    } else if (filter === "high_odds") {
      filteredPicks = horizonPicks.filter((p) => p.odd_value > 3.20 || p.risk_category === "HIGH_ODDS");
    }

    if (filteredPicks.length === 0 && horizonPicks.length > 0) {
      filteredPicks = horizonPicks;
    }

    // VIP Gating: first 5 matches of today are free sample; remainder VIP
    filteredPicks.forEach((p, idx) => {
      p.is_vip_only = idx >= 5;
    });

    // 5. Query Gatekeeper Quota State
    const quota = await getApiQuotaState();

    // Persist to local history
    if (filteredPicks.length > 0) {
      persistDailyPicks(todayDate, filteredPicks, syncInfo.syncBucket).catch(() => {});
    }

    // Generate 3 Daily Bankers for the Bankers tab
    const bankerTickets = await generate3DailyBankerTickets(allMatches);

    // Dynamic list of unique leagues from today's fixtures
    const leaguesMap = new Map<string, { name: string; country: string; count: number }>();
    for (const p of allMatches) {
      const key = `${p.league_country} • ${p.league_name}`;
      if (!leaguesMap.has(key)) {
        leaguesMap.set(key, { name: p.league_name, country: p.league_country, count: 1 });
      } else {
        const cur = leaguesMap.get(key)!;
        cur.count++;
      }
    }
    const dynamicLeagues = Array.from(leaguesMap.values());

    return NextResponse.json({
      status: "success",
      engine: "Oddora Gatekeeper & Score-First Poisson Engine",
      timeframe: timeframe,
      filter: filter,
      count: filteredPicks.length,
      active_upcoming_count: allMatches.length,
      sync_bucket: syncInfo.syncBucket,
      sync_cycle: syncInfo.cycleIndex,
      sync_cycle_label: syncInfo.cycleLabel,
      today_date: todayDate,
      daily_api_calls_count: quota.daily_api_calls_count,
      daily_api_quota: `${quota.daily_api_calls_count}/100 Used Today (Cached via Supabase)`,
      is_hard_capped: quota.is_hard_capped,
      banker_tickets: bankerTickets,
      dynamic_leagues: dynamicLeagues,
      picks: filteredPicks,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}
