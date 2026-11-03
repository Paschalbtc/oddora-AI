import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  parseRawSportScore,
  gradeLegOutcome,
  normalizeMatchStatus,
  ParsedSportScore,
} from "@/lib/gradeSlipOutcome";
import { gradeEntireTicket } from "@/lib/ticketGrader";
import { calculateAndSaveResultsSummary } from "@/lib/engines/resultsCalculator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.sportybet.com/",
};

interface SportyHarvesterTarget {
  sportId: string;
  sportName: "FOOTBALL" | "BASKETBALL" | "VOLLEYBALL" | "TABLE_TENNIS" | "TENNIS";
}

const HARVEST_SPORTS: SportyHarvesterTarget[] = [
  { sportId: "sr:sport:1", sportName: "FOOTBALL" },
  { sportId: "sr:sport:2", sportName: "BASKETBALL" },
  { sportId: "sr:sport:20", sportName: "TABLE_TENNIS" },
  { sportId: "sr:sport:23", sportName: "VOLLEYBALL" },
  { sportId: "sr:sport:5", sportName: "TENNIS" },
];

export async function GET(request: NextRequest) {
  return handleSettle(request);
}

export async function POST(request: NextRequest) {
  return handleSettle(request);
}

async function handleSettle(request: NextRequest) {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  try {
    const { searchParams } = new URL(request.url);
    const forceAll = searchParams.get("force") === "true";

    // =========================================================================
    // STEP 1: HARVEST SCORES FROM SPORTYBET ACROSS ALL 5 SPORTS
    // =========================================================================
    const harvestedScoresByEventId = new Map<string, ParsedSportScore>();
    const harvestedScoresByName = new Map<string, ParsedSportScore>();

    const fetchPromises = HARVEST_SPORTS.map(async (target) => {
      const urls = [
        `https://www.sportybet.com/api/ng/factsCenter/pcUpcomingEvents?sportId=${encodeURIComponent(target.sportId)}&pageSize=100`,
        `https://www.sportybet.com/api/ng/factsCenter/liveEvents?sportId=${encodeURIComponent(target.sportId)}`,
        `https://www.sportybet.com/api/ng/factsCenter/wapUpcomingEvents?sportId=${encodeURIComponent(target.sportId)}`,
      ];

      for (const u of urls) {
        try {
          const res = await fetch(u, {
            headers: BROWSER_HEADERS,
            cache: "no-store",
            signal: AbortSignal.timeout(6000),
          });
          if (!res.ok) continue;
          const json = await res.json();

          let events: any[] = [];
          if (Array.isArray(json?.data)) {
            events = json.data;
          } else if (Array.isArray(json?.data?.tournaments)) {
            for (const tour of json.data.tournaments) {
              if (Array.isArray(tour?.events)) events.push(...tour.events);
            }
          }

          for (const ev of events) {
            if (!ev || !ev.eventId) continue;
            const rawId = String(ev.eventId).trim();
            const cleanId = rawId.startsWith("sr:match:")
              ? rawId
              : `sr:match:${rawId.replace(/\D/g, "") || rawId}`;

            const rawStatus = ev.matchStatus || ev.status || (ev.setScore ? "FT" : "SCHEDULED");
            const parsed = parseRawSportScore(
              target.sportName,
              ev.setScore,
              ev.gameScore,
              rawStatus
            );

            harvestedScoresByEventId.set(cleanId, parsed);
            if (rawId) harvestedScoresByEventId.set(rawId, parsed);
            const digits = rawId.replace(/\D/g, "");
            if (digits.length >= 5) harvestedScoresByEventId.set(digits, parsed);

            // Also index by normalized home_vs_away name
            const hName = ev.homeTeamName || ev.home_team || "";
            const aName = ev.awayTeamName || ev.away_team || "";
            if (hName && aName) {
              const nameKey = `${hName.toLowerCase().replace(/[^a-z0-9]/g, "")}_vs_${aName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
              harvestedScoresByName.set(nameKey, parsed);
            }
          }
        } catch {
          // Ignore individual fetch timeouts
        }
      }
    });

    await Promise.allSettled(fetchPromises);

    // =========================================================================
    // STEP 2: QUERY UNSETTLED / RECENT MATCHES FROM SUPABASE
    // =========================================================================
    let query = supabase.from("oddora_v2_matches").select("*");
    if (!forceAll) {
      // Look for matches that are not yet finished or were scheduled in last 36 hours
      const thirtySixHoursAgo = new Date(Date.now() - 36 * 3600000).toISOString();
      query = query.gte("created_at", thirtySixHoursAgo);
    }

    const { data: dbMatches, error: matchErr } = await query.limit(500);
    const matches = dbMatches || [];

    let settledMatchesCount = 0;

    for (const m of matches) {
      const rawId = String(m.event_id || m.match_id || "").trim();
      const cleanId = rawId.startsWith("sr:match:")
        ? rawId
        : `sr:match:${rawId.replace(/\D/g, "") || rawId}`;
      const digits = rawId.replace(/\D/g, "");

      const normName = `${(m.home_team || "").toLowerCase().replace(/[^a-z0-9]/g, "")}_vs_${(m.away_team || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;

      // Check harvested scores
      let matchedScore =
        harvestedScoresByEventId.get(cleanId) ||
        harvestedScoresByEventId.get(rawId) ||
        (digits.length >= 5 ? harvestedScoresByEventId.get(digits) : undefined) ||
        harvestedScoresByName.get(normName);

      // If no live score harvested, check if the record already has scores stored
      if (!matchedScore) {
        if (m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined) {
          const rawStatus = m.match_status || m.status || "FT";
          matchedScore = parseRawSportScore(
            m.sport || m.sport_type || "FOOTBALL",
            `${m.home_score}:${m.away_score}`,
            m.match_metadata?.period_scores,
            rawStatus
          );
        }
      }

      if (matchedScore) {
        // Grade leg outcome using multi-sport rules
        const graded = gradeLegOutcome(
          {
            match: `${m.home_team || "Home"} vs ${m.away_team || "Away"}`,
            home_team: m.home_team,
            away_team: m.away_team,
            market: m.market_name || "1X2",
            selection: m.best_outcome || m.selection_label || "1",
            sport: m.sport || m.sport_type || matchedScore.sport,
          },
          matchedScore
        );

        const isFinished = matchedScore.status === "Finished" || normalizeMatchStatus(m.status) === "Finished";
        const finalStatus = matchedScore.status === "Void" ? "VOID" : isFinished ? "FT" : matchedScore.raw_status || "LIVE";

        const updatePayload: Record<string, any> = {
          status: finalStatus,
          match_status: matchedScore.raw_status || finalStatus,
          outcome_result: graded.status,
          updated_at: new Date().toISOString(),
        };

        if (matchedScore.ft_home_score !== null && matchedScore.ft_away_score !== null) {
          updatePayload.home_score = matchedScore.ft_home_score;
          updatePayload.away_score = matchedScore.ft_away_score;
          updatePayload.actual_score = matchedScore.raw_score_str;
        }

        // Preserve and enrich multi-sport metadata
        const existingMeta = typeof m.match_metadata === "object" && m.match_metadata ? m.match_metadata : {};
        updatePayload.match_metadata = {
          ...existingMeta,
          period_scores: matchedScore.period_scores,
          ht_home_score: matchedScore.ht_home_score,
          ht_away_score: matchedScore.ht_away_score,
          sh_home_score: matchedScore.sh_home_score,
          sh_away_score: matchedScore.sh_away_score,
          sets_home: matchedScore.sets_home,
          sets_away: matchedScore.sets_away,
          total_match_points_home: matchedScore.total_match_points_home,
          total_match_points_away: matchedScore.total_match_points_away,
          first_set_total_points: matchedScore.first_set_total_points,
          grading_reason: graded.reason,
        };

        try {
          await supabase.from("oddora_v2_matches").update(updatePayload).eq("id", m.id);
          settledMatchesCount++;
        } catch {}
      }
    }

    // =========================================================================
    // STEP 3: SETTLE DAILY READY SLIPS (oddora_v2_daily_slips)
    // =========================================================================
    let settledSlipsCount = 0;
    try {
      const { data: dbSlips } = await supabase
        .from("oddora_v2_daily_slips")
        .select("*")
        .limit(100);

      const slips = dbSlips || [];

      for (const slip of slips) {
        const rawLegs = Array.isArray(slip.legs_json) && slip.legs_json.length > 0
          ? slip.legs_json
          : Array.isArray(slip.legs)
          ? slip.legs
          : [];

        if (rawLegs.length === 0) continue;

        let hasPending = false;
        let hasLost = false;

        const gradedLegs = rawLegs.map((leg: any) => {
          const evId = String(leg.eventId || leg.matchId || "").trim();
          const cleanId = evId.startsWith("sr:match:")
            ? evId
            : `sr:match:${evId.replace(/\D/g, "") || evId}`;
          const normName = `${(leg.home_team || "").toLowerCase().replace(/[^a-z0-9]/g, "")}_vs_${(leg.away_team || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;

          const score =
            harvestedScoresByEventId.get(cleanId) ||
            harvestedScoresByEventId.get(evId) ||
            harvestedScoresByName.get(normName);

          if (score) {
            const graded = gradeLegOutcome(leg, score);
            if (graded.status === "LOST") hasLost = true;
            if (graded.status === "PENDING") hasPending = true;
            return {
              ...leg,
              status: graded.status,
              home_score: graded.home_score,
              away_score: graded.away_score,
              actual_score: score.raw_score_str,
              reason: graded.reason,
            };
          }

          if (leg.status === "LOST") hasLost = true;
          else if (leg.status === "PENDING" || !leg.status) hasPending = true;
          return leg;
        });

        let newSlipResult: "WON" | "LOST" | "PENDING" = "PENDING";
        if (hasLost) {
          newSlipResult = "LOST";
        } else if (!hasPending && gradedLegs.length > 0) {
          newSlipResult = "WON";
        }

        if (newSlipResult !== slip.slip_result) {
          await supabase
            .from("oddora_v2_daily_slips")
            .update({
              slip_result: newSlipResult,
              legs_json: gradedLegs,
            })
            .eq("id", slip.id);
          settledSlipsCount++;
        }
      }
    } catch (slipErr) {
      console.warn("Notice: daily slips settlement:", slipErr);
    }

    // =========================================================================
    // STEP 4: SETTLE USER TICKETS (user_saved_tickets)
    // =========================================================================
    let settledTicketsCount = 0;
    try {
      const { data: dbTickets } = await supabase
        .from("user_saved_tickets")
        .select("*")
        .eq("status", "PENDING")
        .limit(100);

      const tickets = dbTickets || [];

      for (const t of tickets) {
        const rawLegs = Array.isArray(t.legs) ? t.legs : [];
        if (rawLegs.length === 0) continue;

        const updatedLegs = rawLegs.map((leg: any) => {
          const evId = String(leg.eventId || leg.matchId || "").trim();
          const cleanId = evId.startsWith("sr:match:")
            ? evId
            : `sr:match:${evId.replace(/\D/g, "") || evId}`;
          const normName = `${(leg.home_team || "").toLowerCase().replace(/[^a-z0-9]/g, "")}_vs_${(leg.away_team || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;

          const score =
            harvestedScoresByEventId.get(cleanId) ||
            harvestedScoresByEventId.get(evId) ||
            harvestedScoresByName.get(normName);

          if (score) {
            const graded = gradeLegOutcome(leg, score);
            return {
              ...leg,
              status: graded.status,
              home_score: graded.home_score,
              away_score: graded.away_score,
              actual_score: score.raw_score_str,
              reason: graded.reason,
            };
          }
          return leg;
        });

        const overallStatus = gradeEntireTicket(updatedLegs);
        if (overallStatus !== t.status) {
          await supabase
            .from("user_saved_tickets")
            .update({
              status: overallStatus,
              legs: updatedLegs,
              updated_at: new Date().toISOString(),
            })
            .eq("id", t.id);
          settledTicketsCount++;
        }
      }
    } catch (ticketErr) {
      console.warn("Notice: user_saved_tickets settlement:", ticketErr);
    }

    // =========================================================================
    // STEP 5: RECALCULATE WIN-RATES INTO oddora_v2_results_summary
    // =========================================================================
    let summaryData: any = null;
    try {
      summaryData = await calculateAndSaveResultsSummary();
    } catch {}

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      status: "success",
      message: "Multi-sport score harvesting & outcome grading complete",
      durationMs,
      harvestedEvents: harvestedScoresByEventId.size,
      settledMatches: settledMatchesCount,
      settledSlips: settledSlipsCount,
      settledUserTickets: settledTicketsCount,
      summary: summaryData,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to settle multi-sport matches.",
      },
      { status: 500 }
    );
  }
}
