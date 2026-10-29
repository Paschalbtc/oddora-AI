import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { isMatchEnded } from "@/lib/multiSportScheduleFeed";

export const dynamic = "force-dynamic";

export interface CachedLeagueItem {
  id: string;
  league_name: string;
  country: string;
  sport: "FOOTBALL" | "BASKETBALL" | "TABLE_TENNIS" | "VOLLEYBALL";
  match_count: number;
  matches: Array<{
    id: string;
    home_team: string;
    away_team: string;
    kickoff_time: string;
    status: string;
  }>;
}

/**
 * Strict Read-Only Leagues Database Endpoint:
 * Groups active leagues directly from Supabase in <150ms without hitting external APIs.
 * Excludes predicted outcomes to preserve schedule browsing integrity.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const todayStr = new Date().toISOString().split("T")[0];
    const sportFilter = searchParams.get("sport");

    const supabase = getSupabaseClient();

    let query = supabase
      .from("oddora_v2_matches")
      .select("match_id, sport_type, league_name, country, home_team, away_team, kickoff_time, status, outcome_result")
      .eq("match_date", todayStr)
      .order("kickoff_time", { ascending: true });

    if (sportFilter && sportFilter !== "all") {
      const s = sportFilter.toUpperCase().trim();
      if (s === "TABLE_TENNIS" || s === "TENNIS") {
        query = query.in("sport_type", ["TABLE_TENNIS", "table_tennis", "TENNIS", "tennis"]);
      } else {
        query = query.ilike("sport_type", s);
      }
    }

    const { data: rawMatches, error } = await query;

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message, total_leagues: 0, leagues: [] },
        { status: 500 }
      );
    }

    // Filter out ended matches in real time
    const activeMatches = (rawMatches || []).filter((m: any) => !isMatchEnded(m));
    const leagueMap = new Map<string, CachedLeagueItem>();

    for (const m of activeMatches) {
      const lName = m.league_name || "Premier Division";
      const sportName = (m.sport_type || "FOOTBALL").toUpperCase() as CachedLeagueItem["sport"];
      const key = `${sportName}_${lName}`;

      if (!leagueMap.has(key)) {
        leagueMap.set(key, {
          id: `league_${key.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          league_name: lName,
          country: m.country || "International",
          sport: sportName,
          match_count: 0,
          matches: [],
        });
      }

      const leagueObj = leagueMap.get(key)!;
      leagueObj.match_count += 1;
      leagueObj.matches.push({
        id: m.match_id,
        home_team: m.home_team,
        away_team: m.away_team,
        kickoff_time: m.kickoff_time,
        status: m.status || "NS",
      });
    }

    const leagues = Array.from(leagueMap.values()).sort((a, b) => b.match_count - a.match_count);

    return NextResponse.json({
      status: "success",
      source: "supabase_prewarmed_cache",
      total_leagues: leagues.length,
      total_matches: activeMatches.length,
      leagues,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to load cached leagues", total_leagues: 0, leagues: [] },
      { status: 500 }
    );
  }
}

