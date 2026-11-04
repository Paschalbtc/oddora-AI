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
import { SPORTYBET_BROWSER_HEADERS } from "@/lib/coreBookingVault";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_FOOTBALL_KEY =
  process.env.API_FOOTBALL_KEY ||
  process.env.NEXT_PUBLIC_API_FOOTBALL_KEY ||
  "78bffc192cbd94efc7163ee4a80b4a35";

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

function norm(s: string = ""): string {
  return s
    .toLowerCase()
    .replace(/\b(fc|cf|afc|sc|ac|club|de|united|city|town|wanderers|athletic|hotspur|saint|st)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

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

    const harvestedScoresByEventId = new Map<string, ParsedSportScore>();
    const harvestedScoresByName = new Map<string, ParsedSportScore>();

    // =========================================================================
    // STEP 1: HARVEST SCORES FROM SPORTYBET FACTS-CENTER (UPCOMING & LIVE)
    // =========================================================================
    const fetchPromises = HARVEST_SPORTS.map(async (target) => {
      const urls = [
        `https://www.sportybet.com/api/ng/factsCenter/pcUpcomingEvents?sportId=${encodeURIComponent(target.sportId)}&pageSize=100`,
        `https://www.sportybet.com/api/ng/factsCenter/liveEvents?sportId=${encodeURIComponent(target.sportId)}`,
        `https://www.sportybet.com/api/ng/factsCenter/wapUpcomingEvents?sportId=${encodeURIComponent(target.sportId)}`,
      ];

      for (const u of urls) {
        try {
          const res = await fetch(u, {
            headers: SPORTYBET_BROWSER_HEADERS,
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

            const hName = norm(ev.homeTeamName || ev.home_team || "");
            const aName = norm(ev.awayTeamName || ev.away_team || "");
            if (hName && aName) {
              harvestedScoresByName.set(`${hName}_vs_${aName}`, parsed);
            }
          }
        } catch {
          // Ignore individual fetch timeouts
        }
      }
    });

    await Promise.allSettled(fetchPromises);

    // =========================================================================
    // STEP 2: QUERY PENDING USER TICKETS TO EXTRACT DATES & SHARE CODES
    // =========================================================================
    const distinctSoccerDates = new Set<string>();
    const pendingShareCodes = new Set<string>();

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    distinctSoccerDates.add(todayStr);
    distinctSoccerDates.add(yesterdayStr);

    let pendingUserTickets: any[] = [];
    try {
      const { data: dbTickets } = await supabase
        .from("user_saved_tickets")
        .select("*")
        .in("status", ["PENDING", "pending", "IN_PLAY", "in_play"])
        .limit(250);

      pendingUserTickets = dbTickets || [];

      for (const t of pendingUserTickets) {
        const code = t.share_code || t.booking_code;
        if (code && typeof code === "string" && code.trim().length >= 4 && !code.includes("SPORTY")) {
          pendingShareCodes.add(code.trim().toUpperCase());
        }

        if (t.created_at) {
          const d = String(t.created_at).split("T")[0];
          if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) distinctSoccerDates.add(d);
        }

        const legs = Array.isArray(t.legs) ? t.legs : Array.isArray(t.legs_json) ? t.legs_json : [];
        for (const l of legs) {
          const timeVal = l.kickoff_time || l.kickoffTime || l.startTime || l.date;
          if (timeVal) {
            const d = String(timeVal).split("T")[0];
            if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) distinctSoccerDates.add(d);
          }
        }
      }
    } catch (err) {
      console.warn("[settle-matches] Notice querying pending user_saved_tickets:", err);
    }

    // =========================================================================
    // STEP 3: API-FOOTBALL 3x DAILY BATCH HARVEST FOR DISTINCT DATES
    // =========================================================================
    const dateList = Array.from(distinctSoccerDates).slice(0, 6);
    for (const d of dateList) {
      try {
        const afRes = await fetch(`https://v3.football.api-sports.io/fixtures?date=${d}`, {
          headers: { "x-apisports-key": API_FOOTBALL_KEY },
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });

        if (afRes.ok) {
          const afJson = await afRes.json();
          const fixtures = Array.isArray(afJson?.response) ? afJson.response : [];
          for (const f of fixtures) {
            const shortStatus = (f.fixture?.status?.short || "").toUpperCase();
            if (shortStatus === "FT" || shortStatus === "AET" || shortStatus === "PEN") {
              const homeGoals = f.goals?.home ?? f.score?.fulltime?.home;
              const awayGoals = f.goals?.away ?? f.score?.fulltime?.away;
              if (homeGoals !== null && awayGoals !== null && !isNaN(Number(homeGoals))) {
                const hScore = Number(homeGoals);
                const aScore = Number(awayGoals);
                const htHome = f.score?.halftime?.home ?? null;
                const htAway = f.score?.halftime?.away ?? null;
                const htPeriods = htHome !== null && htAway !== null ? [`${htHome}:${htAway}`] : [];

                const parsedScore: ParsedSportScore = parseRawSportScore(
                  "FOOTBALL",
                  `${hScore}:${aScore}`,
                  htPeriods,
                  "FT"
                );

                const extId = String(f.fixture?.id || "");
                if (extId) {
                  harvestedScoresByEventId.set(extId, parsedScore);
                  harvestedScoresByEventId.set(`sr:match:${extId}`, parsedScore);
                }

                const hName = norm(f.teams?.home?.name || "");
                const aName = norm(f.teams?.away?.name || "");
                if (hName && aName) {
                  harvestedScoresByName.set(`${hName}_vs_${aName}`, parsedScore);
                }
              }
            }
          }
        }
      } catch (afErr) {
        console.warn(`[settle-matches] API-Football harvest error for date ${d}:`, afErr);
      }
    }

    // =========================================================================
    // STEP 4: SPORTYBET SHARE CODE DIRECT OUTCOME FALLBACK (MULTI-SPORT)
    // =========================================================================
    const codeList = Array.from(pendingShareCodes).slice(0, 20);
    for (const code of codeList) {
      try {
        const sbRes = await fetch(`https://www.sportybet.com/api/ng/orders/share/${code}`, {
          headers: SPORTYBET_BROWSER_HEADERS,
          cache: "no-store",
          signal: AbortSignal.timeout(4500),
        });

        if (sbRes.ok) {
          const sbJson = await sbRes.json();
          if ((sbJson.bizCode === 10000 || sbJson.innerCode === "10000") && Array.isArray(sbJson.data?.outcomes)) {
            for (const o of sbJson.data.outcomes) {
              if (!o || !o.eventId) continue;
              const evId = String(o.eventId).trim();
              const sSport = (o.sport?.category?.name || o.sport?.name || "FOOTBALL").toUpperCase();
              let sportEnum: "FOOTBALL" | "BASKETBALL" | "VOLLEYBALL" | "TABLE_TENNIS" | "TENNIS" = "FOOTBALL";
              if (sSport.includes("BASKET")) sportEnum = "BASKETBALL";
              else if (sSport.includes("VOLLEY")) sportEnum = "VOLLEYBALL";
              else if (sSport.includes("TABLE")) sportEnum = "TABLE_TENNIS";
              else if (sSport.includes("TENNIS")) sportEnum = "TENNIS";

              if (o.setScore || o.gameScore) {
                const parsed = parseRawSportScore(
                  sportEnum,
                  o.setScore,
                  o.gameScore,
                  o.matchStatus || "FT"
                );
                harvestedScoresByEventId.set(evId, parsed);
                const digits = evId.replace(/\D/g, "");
                if (digits) harvestedScoresByEventId.set(digits, parsed);

                const hName = norm(o.homeTeamName || "");
                const aName = norm(o.awayTeamName || "");
                if (hName && aName) {
                  harvestedScoresByName.set(`${hName}_vs_${aName}`, parsed);
                }
              }
            }
          }
        }
      } catch (sbErr) {
        console.warn(`[settle-matches] SportyBet share harvest notice for ${code}:`, sbErr);
      }
    }

    // =========================================================================
    // STEP 5: QUERY UNSETTLED / RECENT MATCHES FROM SUPABASE (oddora_v2_matches)
    // =========================================================================
    let query = supabase.from("oddora_v2_matches").select("*");
    if (!forceAll) {
      const thirtySixHoursAgo = new Date(Date.now() - 36 * 3600000).toISOString();
      query = query.gte("created_at", thirtySixHoursAgo);
    }

    const { data: dbMatches } = await query.limit(500);
    const matches = dbMatches || [];
    let settledMatchesCount = 0;

    for (const m of matches) {
      const rawId = String(m.event_id || m.match_id || "").trim();
      const cleanId = rawId.startsWith("sr:match:")
        ? rawId
        : `sr:match:${rawId.replace(/\D/g, "") || rawId}`;
      const digits = rawId.replace(/\D/g, "");
      const normName = `${norm(m.home_team)}_vs_${norm(m.away_team)}`;

      let matchedScore =
        harvestedScoresByEventId.get(cleanId) ||
        harvestedScoresByEventId.get(rawId) ||
        (digits.length >= 5 ? harvestedScoresByEventId.get(digits) : undefined) ||
        harvestedScoresByName.get(normName);

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
    // STEP 6: SETTLE DAILY READY SLIPS (oddora_v2_daily_slips)
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
          const normName = `${norm(leg.home_team)}_vs_${norm(leg.away_team)}`;

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
              score_badge: `FT: ${graded.home_score ?? 0} - ${graded.away_score ?? 0}`,
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
    // STEP 7: SETTLE USER TICKETS (user_saved_tickets) WITH ACCURATE SCORE BADGES
    // =========================================================================
    let settledTicketsCount = 0;
    try {
      const ticketsToSettle = pendingUserTickets.length > 0
        ? pendingUserTickets
        : (await supabase.from("user_saved_tickets").select("*").in("status", ["PENDING", "pending"]).limit(100)).data || [];

      for (const t of ticketsToSettle) {
        const rawLegs = Array.isArray(t.legs) ? t.legs : Array.isArray(t.legs_json) ? t.legs_json : [];
        if (rawLegs.length === 0) continue;

        const updatedLegs = rawLegs.map((leg: any) => {
          const evId = String(leg.eventId || leg.matchId || "").trim();
          const cleanId = evId.startsWith("sr:match:")
            ? evId
            : `sr:match:${evId.replace(/\D/g, "") || evId}`;
          const normName = `${norm(leg.home_team)}_vs_${norm(leg.away_team)}`;

          const score =
            harvestedScoresByEventId.get(cleanId) ||
            harvestedScoresByEventId.get(evId) ||
            harvestedScoresByName.get(normName);

          if (score) {
            const graded = gradeLegOutcome(leg, score);
            const hScore = graded.home_score ?? 0;
            const aScore = graded.away_score ?? 0;
            return {
              ...leg,
              status: graded.status,
              home_score: graded.home_score,
              away_score: graded.away_score,
              actual_score: score.raw_score_str,
              score_badge: `FT: ${hScore} - ${aScore}`,
              reason: graded.reason,
            };
          }
          return leg;
        });

        const overallStatus = gradeEntireTicket(updatedLegs);
        const finalStatus = overallStatus === "WON" ? "won" : overallStatus === "LOST" ? "lost" : "pending";

        if (finalStatus !== String(t.status).toLowerCase()) {
          await supabase
            .from("user_saved_tickets")
            .update({
              status: finalStatus,
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
    // STEP 8: RECALCULATE WIN-RATES INTO oddora_v2_results_summary
    // =========================================================================
    let summaryData: any = null;
    try {
      summaryData = await calculateAndSaveResultsSummary();
    } catch {}

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      status: "success",
      message: "API-Football & SportyBet multi-sport harvester & settlement complete",
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
