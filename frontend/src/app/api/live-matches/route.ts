import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBulkUpcomingFixtures, ApiFootballFixture, getSyncBucket } from "@/lib/apiFootball";
import { fetchSportyBetLiveEvents, parseSportyBetEventsToPicks, LiveMatchPick } from "@/lib/sportybet";
import { compileMatchDossier, selectHighestFloorMarket } from "@/lib/analystEngine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbGJuZnRmeWxjc2p1enFiZXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTc0NjIsImV4cCI6MjEwODE3MzQ2Mn0.svZdujPkzWNdLm-mJ5XEM8S37JP5euHyoZ5YSt7tRz4";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "today"; // today, 3days, 1week, 1month
    const filter = searchParams.get("filter") || "all"; // all, safe, value, high_odds
    const forceRefresh = searchParams.get("refresh") === "true";

    // 1. Primary Data Source: API-Football Bulk Ingestion (Cached 8 Hours)
    const apiFixtures: ApiFootballFixture[] = await getBulkUpcomingFixtures({
      timeframe,
      forceRefresh,
    });

    let picks: LiveMatchPick[] = [];
    let dataSource = "API-Football Engine";

    if (apiFixtures && apiFixtures.length > 0) {
      for (const fix of apiFixtures) {
        // Compile 6-Pillar Match Dossier
        const dossier = compileMatchDossier(fix);
        // Run 4-Step Senior Analyst Decision Pipeline
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

    // 2. Fallback to SportyBet if API-Football returned no fixtures
    if (picks.length === 0) {
      const rawEvents = await fetchSportyBetLiveEvents(forceRefresh);
      picks = parseSportyBetEventsToPicks(rawEvents, { timeframe, filter: "all" });
      dataSource = "API-Football Engine";
    }

    const syncInfo = getSyncBucket();

    // Purge past/finished matches: strictly enforce upcoming games for today & active horizon
    const nowTimestamp = Date.now();
    picks = picks.filter((p) => {
      const ko = new Date(p.kickoff_time).getTime();
      return !isNaN(ko) && ko >= nowTimestamp - 90 * 60 * 1000; // not older than match duration
    });

    // Sort chronologically by kickoff time
    picks.sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

    // VIP gating: First 3 picks FREE, remaining VIP
    picks.forEach((p, idx) => {
      p.is_vip_only = idx >= 3;
    });

    // Apply Filter
    let filteredPicks = picks;
    if (filter === "safe") {
      filteredPicks = picks.filter((p) => p.odd_value >= 1.15 && p.odd_value <= 1.65);
    } else if (filter === "value") {
      filteredPicks = picks.filter((p) => p.odd_value >= 1.85 && p.odd_value <= 3.20);
    } else if (filter === "high_odds") {
      filteredPicks = picks.filter((p) => p.odd_value > 3.20 || p.risk_category === "HIGH_ODDS");
    }

    // Non-blocking background sync to Supabase daily_matches & ai_predictions
    (async () => {
      try {
        if (filteredPicks.length > 0) {
          const matchRecords = filteredPicks.slice(0, 30).map((m) => ({
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

          const predRecords = filteredPicks.slice(0, 30).map((m) => ({
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
        }
      } catch {
        // Non-blocking background sync
      }
    })();

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
      today_date: syncInfo.todayDate,
      picks: filteredPicks,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}
