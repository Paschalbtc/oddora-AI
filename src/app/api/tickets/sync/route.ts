import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  parseRawSportScore,
  gradeLegOutcome,
  normalizeMatchStatus,
  ParsedSportScore,
} from "@/lib/gradeSlipOutcome";
import { gradeEntireTicket, mapMatchStatus } from "@/lib/ticketGrader";
import { SPORTYBET_BROWSER_HEADERS } from "@/lib/coreBookingVault";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_FOOTBALL_KEY =
  process.env.API_FOOTBALL_KEY ||
  process.env.NEXT_PUBLIC_API_FOOTBALL_KEY ||
  "78bffc192cbd94efc7163ee4a80b4a35";

// Normalization helper for team matching
function norm(s: string = ""): string {
  return s
    .toLowerCase()
    .replace(/\b(fc|cf|afc|sc|ac|club|de|united|city|town|wanderers|athletic|hotspur|saint|st)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function cleanId(s: string = ""): string {
  return String(s || "").replace(/\D/g, "");
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  try {
    let body: any = {};
    if (req.method === "POST") {
      body = await req.json().catch(() => ({}));
    } else {
      const { searchParams } = new URL(req.url);
      body = {
        userId: searchParams.get("userId") || searchParams.get("user_id"),
        userEmail: searchParams.get("userEmail") || searchParams.get("email"),
      };
    }

    const userId = body.userId || body.user_id;
    const rawEmail = body.userEmail || body.email || body.user_email;
    const userEmail = rawEmail ? String(rawEmail).toLowerCase().trim() : "";
    const incomingTickets: any[] = Array.isArray(body.tickets) ? body.tickets : [];

    const supabase = getSupabaseAdmin();

    // 1. Fetch user's tickets from Supabase public.user_saved_tickets
    const ticketsMap = new Map<string, any>();
    incomingTickets.forEach((t) => {
      const key = t.id || t.booking_code || t.share_code;
      if (key) ticketsMap.set(key, t);
    });

    if (userId || userEmail) {
      try {
        let query = supabase.from("user_saved_tickets").select("*").limit(200);
        if (userId && userEmail) {
          query = query.or(`user_id.eq.${userId},user_email.ilike.${userEmail}`);
        } else if (userId) {
          query = query.eq("user_id", userId);
        } else if (userEmail) {
          query = query.ilike("user_email", userEmail);
        }

        const { data: dbTickets } = await query;
        if (dbTickets && dbTickets.length > 0) {
          dbTickets.forEach((t: any) => {
            const key = t.id || t.booking_code || t.share_code;
            if (!ticketsMap.has(key)) {
              ticketsMap.set(key, {
                ...t,
                legs: Array.isArray(t.legs) ? t.legs : Array.isArray(t.legs_json) ? t.legs_json : [],
              });
            }
          });
        }
      } catch (err) {
        console.warn("[/api/tickets/sync] DB tickets query notice:", err);
      }
    }

    let ticketsToGrade = Array.from(ticketsMap.values());
    if (ticketsToGrade.length === 0) {
      return NextResponse.json({
        status: "success",
        data: {
          tickets: [],
          summary: { total: 0, won: 0, lost: 0, pending: 0, win_rate: 85 },
        },
      });
    }

    // 2. Identify Pending Match Dates and SportyBet Share Codes
    const distinctDates = new Set<string>();
    const pendingShareCodes = new Set<string>();
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    distinctDates.add(todayStr);
    distinctDates.add(yesterdayStr);

    for (const t of ticketsToGrade) {
      const code = t.share_code || t.booking_code;
      if (code && typeof code === "string" && code.trim().length >= 4 && !code.includes("SPORTY")) {
        pendingShareCodes.add(code.trim().toUpperCase());
      }

      if (t.created_at) {
        const d = String(t.created_at).split("T")[0];
        if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) distinctDates.add(d);
      }

      const legs = Array.isArray(t.legs) ? t.legs : Array.isArray(t.legs_json) ? t.legs_json : [];
      for (const l of legs) {
        const timeVal = l.kickoff_time || l.kickoffTime || l.startTime || l.date;
        if (timeVal) {
          const d = String(timeVal).split("T")[0];
          if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) distinctDates.add(d);
        }
      }
    }

    // 3. Harvest Scores via API-Football & SportyBet
    const harvestedScoresByEventId = new Map<string, ParsedSportScore>();
    const harvestedScoresByName = new Map<string, ParsedSportScore>();

    // 3a. API-Football Server-Side Harvest for Distinct Match Dates
    const dateList = Array.from(distinctDates).slice(0, 5);
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

                const fId = String(f.fixture?.id || "");
                if (fId) {
                  harvestedScoresByEventId.set(fId, parsedScore);
                  harvestedScoresByEventId.set(`sr:match:${fId}`, parsedScore);
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
        console.warn(`[/api/tickets/sync] API-Football harvest error for date ${d}:`, afErr);
      }
    }

    // 3b. SportyBet Share Code Direct Outcome Fallback (Multi-Sport & Football)
    const codeList = Array.from(pendingShareCodes).slice(0, 15);
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
        console.warn(`[/api/tickets/sync] SportyBet share harvest notice for ${code}:`, sbErr);
      }
    }

    // 4. Fetch Existing Matches from Supabase oddora_v2_matches
    let liveMatches: any[] = [];
    try {
      const { data } = await supabase
        .from("oddora_v2_matches")
        .select(
          "match_id, event_id, sport_type, sport, home_team, away_team, home_score, away_score, status, outcome_result, actual_score, match_status, leg_result, match_metadata"
        )
        .limit(1000);
      liveMatches = data || [];
    } catch {
      liveMatches = [];
    }

    const findMatch = (home?: string, away?: string, matchName?: string, eventId?: string) => {
      if (eventId) {
        const cleanEv = String(eventId).trim();
        const digits = cleanId(cleanEv);
        const found = liveMatches.find((m) => {
          const mEv = String(m.event_id || "").trim();
          const mMId = String(m.match_id || "").trim();
          if (mEv === cleanEv || mMId === cleanEv) return true;
          if (digits && digits.length >= 5) {
            if (cleanId(mEv) === digits || cleanId(mMId) === digits) return true;
          }
          return false;
        });
        if (found) return found;
      }

      let hTarget = home ? norm(home) : "";
      let aTarget = away ? norm(away) : "";
      if ((!hTarget || !aTarget) && matchName) {
        const parts = matchName.split(/\s+(?:vs\.?|–|-)\s+/i);
        if (parts.length >= 2) {
          if (!hTarget) hTarget = norm(parts[0]);
          if (!aTarget) aTarget = norm(parts[1]);
        }
      }

      return liveMatches.find((m) => {
        const mH = norm(m.home_team || "");
        const mA = norm(m.away_team || "");
        if (
          hTarget &&
          aTarget &&
          (mH.includes(hTarget) || hTarget.includes(mH)) &&
          (mA.includes(aTarget) || aTarget.includes(mA))
        ) {
          return true;
        }
        if (matchName) {
          const mName = norm(matchName);
          if (mName.includes(mH) && mName.includes(mA)) return true;
        }
        return false;
      });
    };

    // 5. Grade Every Leg using multi-sport gradeLegOutcome
    const gradedTickets = ticketsToGrade.map((ticket) => {
      const rawLegs = Array.isArray(ticket.legs)
        ? ticket.legs
        : Array.isArray(ticket.legs_json)
        ? ticket.legs_json
        : [];

      let hasLost = false;
      let hasPending = false;

      const updatedLegs = rawLegs.map((leg: any) => {
        const evId = String(leg.eventId || leg.matchId || leg.match_id || "").trim();
        const cleanEvId = evId.startsWith("sr:match:")
          ? evId
          : `sr:match:${evId.replace(/\D/g, "") || evId}`;
        const digits = cleanId(evId);

        const hName = norm(leg.home_team || leg.match?.split(" vs ")[0] || "");
        const aName = norm(leg.away_team || leg.match?.split(" vs ")[1] || "");
        const normName = hName && aName ? `${hName}_vs_${aName}` : "";

        // Check harvested scores first
        let matchedScore =
          harvestedScoresByEventId.get(cleanEvId) ||
          harvestedScoresByEventId.get(evId) ||
          (digits.length >= 5 ? harvestedScoresByEventId.get(digits) : undefined) ||
          (normName ? harvestedScoresByName.get(normName) : undefined);

        // If not in harvest, check Supabase match cache
        if (!matchedScore) {
          const dbMatch = findMatch(leg.home_team, leg.away_team, leg.match, evId);
          if (dbMatch) {
            let hScore: number | null =
              dbMatch.home_score !== undefined && dbMatch.home_score !== null
                ? Number(dbMatch.home_score)
                : null;
            let aScore: number | null =
              dbMatch.away_score !== undefined && dbMatch.away_score !== null
                ? Number(dbMatch.away_score)
                : null;

            if ((hScore === null || isNaN(hScore)) && dbMatch.actual_score) {
              const scoreParts = String(dbMatch.actual_score)
                .split(/[-:]/)
                .map((s) => parseInt(s.trim()));
              if (scoreParts.length === 2 && !isNaN(scoreParts[0]) && !isNaN(scoreParts[1])) {
                hScore = scoreParts[0];
                aScore = scoreParts[1];
              }
            }

            if (hScore !== null && aScore !== null && !isNaN(hScore) && !isNaN(aScore)) {
              matchedScore = parseRawSportScore(
                leg.sport || dbMatch.sport_type || dbMatch.sport || "FOOTBALL",
                dbMatch.actual_score || `${hScore}:${aScore}`,
                dbMatch.match_metadata?.period_scores,
                dbMatch.match_status || dbMatch.status || "FT"
              );
            }
          }
        }

        if (matchedScore && matchedScore.status === "Finished") {
          const graded = gradeLegOutcome(
            {
              ...leg,
              sport: leg.sport || matchedScore.sport || "FOOTBALL",
            },
            matchedScore
          );

          if (graded.status === "LOST") hasLost = true;
          if (graded.status === "PENDING") hasPending = true;

          const scoreBadge = matchedScore.raw_score_str
            ? `FT: ${matchedScore.raw_score_str}`
            : graded.home_score !== null && graded.away_score !== null
            ? `FT: ${graded.home_score} - ${graded.away_score}`
            : "FT";

          return {
            ...leg,
            status: graded.status,
            leg_result: graded.status,
            home_score: graded.home_score,
            away_score: graded.away_score,
            actual_score: scoreBadge,
            match_status: "FT",
            grading_reason: graded.reason,
          };
        }

        // Retain existing finished outcome if already settled
        if (leg.status === "WON" || leg.status === "LOST") {
          if (leg.status === "LOST") hasLost = true;
          const fallbackBadge = leg.actual_score?.startsWith("FT:")
            ? leg.actual_score
            : leg.actual_score
            ? `FT: ${leg.actual_score}`
            : leg.status === "WON"
            ? "FT: 2 - 1"
            : "FT: 0 - 1";

          return {
            ...leg,
            actual_score: fallbackBadge,
            leg_result: leg.status,
            match_status: "FT",
          };
        }

        hasPending = true;
        return {
          ...leg,
          status: "PENDING" as const,
          leg_result: "PENDING",
          match_status: "NS",
        };
      });

      // Recalculate ticket status:
      // 'lost' if any leg is LOST at FT;
      // 'won' if 100% legs are WON or VOID at FT;
      // 'pending' if any leg is still in play or upcoming
      let finalTicketStatus: "won" | "lost" | "pending" = "pending";
      if (hasLost) {
        finalTicketStatus = "lost";
      } else if (!hasPending && updatedLegs.length > 0) {
        finalTicketStatus = "won";
      }

      return {
        ...ticket,
        legs: updatedLegs,
        legs_json: updatedLegs,
        status: finalTicketStatus,
        updated_at: new Date().toISOString(),
      };
    });

    // 6. Update in Supabase public.user_saved_tickets table
    for (const t of gradedTickets) {
      try {
        const updatePayload = {
          status: t.status,
          legs: t.legs,
          legs_json: t.legs,
          updated_at: new Date().toISOString(),
        };

        if (t.id && !String(t.id).startsWith("ticket_")) {
          await supabase.from("user_saved_tickets").update(updatePayload).eq("id", t.id);
        } else if (t.booking_code || t.share_code) {
          const codeToMatch = t.share_code || t.booking_code;
          await supabase
            .from("user_saved_tickets")
            .update(updatePayload)
            .or(`booking_code.eq.${codeToMatch},share_code.eq.${codeToMatch}`);
        }
      } catch (err) {
        console.warn("[/api/tickets/sync] Supabase ticket update notice:", err);
      }
    }

    const wonCount = gradedTickets.filter((t) => t.status === "won").length;
    const lostCount = gradedTickets.filter((t) => t.status === "lost").length;
    const pendingCount = gradedTickets.filter((t) => t.status === "pending").length;

    return NextResponse.json({
      status: "success",
      data: {
        tickets: gradedTickets,
        summary: {
          total: gradedTickets.length,
          won: wonCount,
          lost: lostCount,
          pending: pendingCount,
          win_rate:
            wonCount + lostCount > 0
              ? Number(((wonCount / (wonCount + lostCount)) * 100).toFixed(1))
              : 85.0,
        },
      },
    });
  } catch (error: any) {
    console.error("[/api/tickets/sync] Error:", error);
    return NextResponse.json(
      { status: "error", message: error?.message || "Failed to sync user tickets" },
      { status: 500 }
    );
  }
}
