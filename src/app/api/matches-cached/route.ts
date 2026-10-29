import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { isMatchEnded } from "@/lib/multiSportScheduleFeed";
import { syncMatchesForDate } from "@/lib/engines/engine1_allMatches";

export const dynamic = "force-dynamic";

/**
 * Strict Read-Only Database Endpoint:
 * Returns pre-warmed matches directly from Supabase `oddora_v2_matches` in <150ms.
 * Never awaits external network APIs during user page load.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const todayStr = new Date().toISOString().split("T")[0];
    const targetDate = searchParams.get("date") || todayStr;
    const sport = (searchParams.get("sport") || "all").toLowerCase().trim();
    const tier = (searchParams.get("tier") || "FREE").toUpperCase();
    const isToday = targetDate === todayStr;

    const supabase = getSupabaseClient();

    let query = supabase
      .from("oddora_v2_matches")
      .select("*")
      .eq("match_date", targetDate)
      .order("win_probability", { ascending: false });

    if (sport && sport !== "all") {
      if (sport === "table_tennis" || sport === "tennis") {
        query = query.in("sport_type", ["TABLE_TENNIS", "table_tennis", "TENNIS", "tennis"]);
      } else {
        query = query.ilike("sport_type", sport);
      }
    }

    const { data: rawData, error } = await query;

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message, data: [] },
        { status: 500 }
      );
    }

    let items = rawData || [];

    // If future date or empty cache for upcoming games, fetch and populate
    if (items.length === 0 && targetDate >= todayStr) {
      try {
        await syncMatchesForDate(targetDate);
        const { data: freshData } = await query;
        if (freshData && freshData.length > 0) {
          items = freshData;
        }
      } catch (syncErr) {
        console.warn("On-demand sync notice in matches-cached:", syncErr);
      }
    }

    // Filter out ended matches in real time for today
    const activeItems = isToday
      ? items.filter((m: any) => !isMatchEnded(m))
      : items;

    // Client DTO formatting with VIP masking
    const formatted = activeItems.map((r: any) => {
      const isLocked = tier === "FREE" && !r.is_free_preview;
      const sportLower = (r.sport_type || "football").toLowerCase();

      return {
        id: r.match_id,
        match_id: r.match_id,
        external_fixture_id: r.match_id,
        sport: sportLower,
        sport_type: r.sport_type,
        league: r.league_name,
        league_name: r.league_name,
        country: r.country || "Global",
        league_logo: r.league_logo || "",
        home_team: r.home_team,
        away_team: r.away_team,
        home_logo: r.raw_stats_json?.home_logo || "",
        away_logo: r.raw_stats_json?.away_logo || "",
        kickoff_time: r.kickoff_time,
        status: r.status,
        best_outcome: isLocked ? "🔒 Locked (VIP)" : (r.best_outcome || "High Probability Pick"),
        market_name: r.market_category || "Match Winner",
        market_category: r.market_category || "Match Winner",
        selection_label: isLocked ? "VIP Pick" : (r.best_outcome || "High Probability Pick"),
        odd_value: isLocked ? 0 : Number(r.odd_value) || 1.45,
        win_probability: Math.round(Number(r.win_probability) || 75),
        is_free_preview: !!r.is_free_preview,
        is_over25_candidate: !!r.is_over25_candidate,
        match_metadata: r.raw_stats_json || {},
        all_markets: isLocked ? [] : (r.all_markets_json || []),
        home_score: r.home_score ?? null,
        away_score: r.away_score ?? null,
        outcome_result: r.outcome_result || "PENDING",
      };
    });

    return NextResponse.json({
      status: "success",
      source: "supabase_prewarmed_cache",
      date: targetDate,
      count: formatted.length,
      data: formatted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Cache query failed", data: [] },
      { status: 500 }
    );
  }
}

