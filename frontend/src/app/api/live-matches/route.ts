import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBulkUpcomingFixtures, ApiFootballFixture, getSyncBucket } from "@/lib/apiFootball";
import { LiveMatchPick, fetchSportyBetLiveEvents, parseSportyBetEventsToPicks } from "@/lib/sportybet";
import { compileMatchDossier, selectHighestFloorMarket } from "@/lib/analystEngine";
import { persistDailyPicks } from "@/lib/platformHistory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "today";
    const filter = searchParams.get("filter") || "all";
    const forceRefresh = searchParams.get("refresh") === "true";

    const syncInfo = getSyncBucket();
    const todayDate = syncInfo.todayDate;
    const nowMs = Date.now();

    const picks: LiveMatchPick[] = [];
    const seenMatchKeys = new Set<string>();
    let dataSource = "API-Football Live Engine";

    // 1. Primary Data Source: API-Football (Strictly Today's Unplayed Matches)
    try {
      const apiFixtures: ApiFootballFixture[] = await getBulkUpcomingFixtures({
        timeframe: "today",
        forceRefresh,
      });

      if (apiFixtures && apiFixtures.length > 0) {
        for (const fix of apiFixtures) {
          const fixDate = fix.kickoff_time?.split("T")[0];
          const ko = new Date(fix.kickoff_time).getTime();

          // STRICT REAL-TIME FILTER:
          // Match date MUST equal Today's exact calendar date (or within today's upcoming 24h window)
          // and kickoff > Date.now()
          if (fix.status !== "NS" || isNaN(ko) || ko <= nowMs) {
            continue;
          }
          if (fixDate !== todayDate && ko > nowMs + 24 * 3600 * 1000) {
            continue;
          }

          const matchKey = `${fix.home_team.toLowerCase()}_vs_${fix.away_team.toLowerCase()}`;
          if (seenMatchKeys.has(matchKey)) continue;
          seenMatchKeys.add(matchKey);

          // Compile 6-Pillar Match Dossier & 4-Step Senior Analyst Decision
          const dossier = compileMatchDossier(fix);
          const decision = selectHighestFloorMarket(dossier);

          picks.push({
            prediction_id: `apif-${fix.fixture_id}`,
            fixture_id: fix.fixture_id,
            eventId: fix.eventId || `sr:match:${fix.fixture_id}`,
            marketId: decision.marketId,
            outcomeId: decision.outcomeId,
            home_team: dossier.home_team,
            away_team: dossier.away_team,
            home_logo: fix.home_logo,
            away_logo: fix.away_logo,
            league_name: dossier.league_name,
            league_country: dossier.league_country,
            league_logo: fix.league_logo,
            kickoff_time: dossier.kickoff_time,
            formatted_date: dossier.formatted_date,
            formatted_time: dossier.formatted_time,
            selected_market: decision.selected_market,
            selection_label: decision.selection_label,
            odd_value: decision.odd_value,
            confidence_score: decision.confidence_score,
            risk_category: decision.risk_category,
            is_vip_only: false,
            ai_reasoning: decision.why_this_market_over_1x2,
            news_summary: dossier.pillar3_squad.recent_news_summary,
            odds_available: dossier.pillar6_odds_edge.available_odds,
            senior_analyst: {
              game_script: decision.game_script,
              game_script_emoji: decision.game_script_emoji,
              game_script_description: decision.game_script_description,
              why_this_market_over_1x2: decision.why_this_market_over_1x2,
              pillar_scores: decision.pillar_scores,
              red_flags: decision.red_flags,
              risk_trap_alert: decision.risk_trap_alert,
              true_survival_probability: decision.true_survival_probability,
            },
          });
        }
      }
    } catch (apiErr) {
      console.warn("Notice querying API-Football in live-matches:", apiErr);
    }

    // 2. CRITICAL ZERO-DOWNTIME GUARANTEE:
    // If API-Football returned an empty list or fewer than 20 fixtures (due to rate limits, free-plan restrictions, or missing key),
    // automatically merge/fallback to SportyBet's live public football feed (pcUpcomingEvents pageSize=100 & categories).
    if (picks.length < 20) {
      try {
        const sportyEvents = await fetchSportyBetLiveEvents(forceRefresh);
        if (sportyEvents && sportyEvents.length > 0) {
          const sportyPicks = parseSportyBetEventsToPicks(sportyEvents, {
            timeframe: "today",
            filter: "all",
          });

          for (const sp of sportyPicks) {
            const ko = new Date(sp.kickoff_time).getTime();
            const spDate = sp.kickoff_time?.split("T")[0];

            // Strict upcoming filter: kickoff > now
            if (isNaN(ko) || ko <= nowMs) continue;
            if (spDate !== todayDate && ko > nowMs + 24 * 3600 * 1000) continue;

            const matchKey = `${sp.home_team.toLowerCase()}_vs_${sp.away_team.toLowerCase()}`;
            if (seenMatchKeys.has(matchKey)) continue;
            seenMatchKeys.add(matchKey);

            picks.push(sp);
          }

          dataSource = picks.length > 0 && seenMatchKeys.size > 20
            ? "API-Football + SportyBet Real-Time Engine"
            : "SportyBet Live Feed Engine";
        }
      } catch (sportyErr) {
        console.warn("Notice querying SportyBet live feed fallback:", sportyErr);
      }
    }

    // Sort chronologically by kickoff time
    picks.sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

    // VIP gating: First 3 picks FREE, remaining VIP
    picks.forEach((p, idx) => {
      p.is_vip_only = idx >= 3;
    });

    // Persist real analyzed picks into platform history for midnight autopsy
    if (picks.length > 0) {
      persistDailyPicks(todayDate, picks, syncInfo.syncBucket).catch(() => {});
    }

    // Apply Filter: Safe (<=1.65), Value (>=1.85), High Multiplier (>3.20)
    let filteredPicks = picks;
    if (filter === "safe") {
      filteredPicks = picks.filter((p) => p.odd_value <= 1.65);
    } else if (filter === "value") {
      filteredPicks = picks.filter((p) => p.odd_value >= 1.85 && p.odd_value <= 3.20);
    } else if (filter === "high_odds") {
      filteredPicks = picks.filter((p) => p.odd_value > 3.20 || p.risk_category === "HIGH_ODDS");
    }

    // If a specific risk filter returned 0 results because odds distribution was tight,
    // gracefully fall back to all picks so the table is never blank
    if (filteredPicks.length === 0 && picks.length > 0) {
      filteredPicks = picks;
    }

    // Background non-blocking sync to Supabase daily_matches & ai_predictions
    if (filteredPicks.length > 0) {
      (async () => {
        try {
          const matchRecords = filteredPicks.slice(0, 50).map((m) => ({
            fixture_id: m.fixture_id,
            match_date: m.kickoff_time.split("T")[0],
            league_name: m.league_name,
            league_country: m.league_country,
            home_team: m.home_team,
            away_team: m.away_team,
            kickoff_time: m.kickoff_time,
            status: "NS",
            odds_json: m.odds_available,
            news_summary: m.news_summary,
          }));
          await (supabase as any).from("daily_matches").upsert(matchRecords, { onConflict: "fixture_id" });

          const predRecords = filteredPicks.slice(0, 50).map((m) => ({
            fixture_id: m.fixture_id,
            match_date: m.kickoff_time.split("T")[0],
            selected_market: m.selected_market,
            odd_value: m.odd_value,
            confidence_score: m.confidence_score,
            risk_category: m.risk_category,
            is_vip_only: m.is_vip_only,
            ai_reasoning: m.ai_reasoning,
            outcome_status: "PENDING",
          }));
          await (supabase as any).from("ai_predictions").upsert(predRecords, { onConflict: "fixture_id" });
        } catch {
          // Non-blocking
        }
      })();
    }

    return NextResponse.json({
      status: "success",
      engine: "Senior Football Quantitative Analyst (6-Pillar & 4-Step Pipeline)",
      source: dataSource,
      timeframe: timeframe,
      filter: filter,
      count: filteredPicks.length,
      active_upcoming_count: picks.length,
      sync_bucket: syncInfo.syncBucket,
      sync_cycle: syncInfo.cycleIndex,
      sync_cycle_label: syncInfo.cycleLabel,
      today_date: todayDate,
      picks: filteredPicks,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}
