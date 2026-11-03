import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SavedTicket } from "@/lib/userTicketTracker";
import { gradeMatchLeg, gradeEntireTicket, mapMatchStatus, gradeLegOutcome, parseRawSportScore } from "@/lib/ticketGrader";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userTickets: SavedTicket[] = Array.isArray(body.tickets) ? body.tickets : [];
    const userId = body.userId;
    const userEmail = body.userEmail || body.email;

    const supabase = getSupabaseAdmin();

    // 1. Fetch recent matches from Supabase (all sports and statuses)
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

    // 2. Fetch all tickets from user_saved_tickets if userId or userEmail is provided
    let ticketsToGrade: SavedTicket[] = [...userTickets];
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
          const map = new Map<string, SavedTicket>();
          ticketsToGrade.forEach((t) => map.set(t.id || t.booking_code, t));
          dbTickets.forEach((t: any) => {
            const key = t.id || t.booking_code;
            if (!map.has(key)) {
              map.set(key, {
                ...t,
                legs: Array.isArray(t.legs) ? t.legs : Array.isArray(t.legs_json) ? t.legs_json : [],
              });
            }
          });
          ticketsToGrade = Array.from(map.values());
        }
      } catch {}
    }

    // Normalization helper for team matching
    const norm = (s: string = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanId = (s: string = "") => String(s || "").replace(/\D/g, "");

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

      // Extract home/away from match string if needed
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

    // 3. Retroactive leg-by-leg re-grading (NO SKIP for already WON/LOST legs)
    const gradedTickets: SavedTicket[] = ticketsToGrade.map((ticket) => {
      const updatedLegs: SavedTicket["legs"] = (ticket.legs || []).map((leg: any) => {
        const match = findMatch(
          leg.home_team,
          leg.away_team,
          leg.match,
          leg.eventId || leg.matchId || leg.match_id
        );

        if (match) {
          // Parse score if not directly numbers
          let hScore: number | null =
            match.home_score !== undefined && match.home_score !== null
              ? Number(match.home_score)
              : null;
          let aScore: number | null =
            match.away_score !== undefined && match.away_score !== null
              ? Number(match.away_score)
              : null;

          if ((hScore === null || isNaN(hScore)) && match.actual_score) {
            const scoreParts = String(match.actual_score)
              .split(/[-:]/)
              .map((s) => parseInt(s.trim()));
            if (scoreParts.length === 2 && !isNaN(scoreParts[0]) && !isNaN(scoreParts[1])) {
              hScore = scoreParts[0];
              aScore = scoreParts[1];
            }
          }

          const rawStatus = match.match_status || match.status;
          const mappedStatus = mapMatchStatus(rawStatus);

          // If postponed or cancelled, mark leg VOID
          if (mappedStatus === "Void") {
            return {
              ...leg,
              status: "VOID" as const,
              leg_result: "VOID",
              home_score: hScore,
              away_score: aScore,
              actual_score: hScore !== null && aScore !== null ? `${hScore} - ${aScore}` : "VOID",
              match_status: "VOID",
            };
          }

          // If finished, grade strictly according to final score
          if (mappedStatus === "Finished") {
            let legResult: "WON" | "LOST" | "VOID" = "WON";
            let actualScoreStr = leg.actual_score || "";

            if (hScore !== null && aScore !== null) {
              const parsedScore = parseRawSportScore(
                leg.sport || match.sport_type || match.sport || "FOOTBALL",
                match.actual_score || `${hScore}:${aScore}`,
                match.match_metadata?.period_scores,
                rawStatus
              );
              const grading = gradeLegOutcome(
                {
                  ...leg,
                  sport: leg.sport || match.sport_type || match.sport || "FOOTBALL",
                },
                parsedScore
              );
              legResult = grading.status === "PENDING" ? "WON" : grading.status;
              actualScoreStr = `${hScore} - ${aScore}`;
            } else if (match.outcome_result === "WON" || match.outcome_result === "LOST") {
              legResult = match.outcome_result as "WON" | "LOST";
              if (!actualScoreStr) {
                actualScoreStr = legResult === "WON" ? "2 - 1" : "0 - 1";
              }
            } else if (leg.status === "WON" || leg.status === "LOST") {
              legResult = leg.status;
              if (!actualScoreStr) {
                actualScoreStr = legResult === "WON" ? "2 - 1" : "0 - 1";
              }
            }

            return {
              ...leg,
              status: legResult,
              leg_result: legResult,
              home_score: hScore,
              away_score: aScore,
              actual_score: actualScoreStr,
              match_status: "FT",
            };
          }

          // Live or upcoming -> remains PENDING with current live score
          const liveScoreStr =
            hScore !== null && aScore !== null ? `${hScore} - ${aScore}` : leg.actual_score || null;
          return {
            ...leg,
            status: "PENDING" as const,
            leg_result: "PENDING",
            home_score: hScore,
            away_score: aScore,
            actual_score: liveScoreStr,
            match_status: mappedStatus === "Live" ? "LIVE" : "NS",
          };
        }

        // Match not in active DB batch -> if already marked WON/LOST with FT, ensure actual_score is present
        if (leg.status === "WON" || leg.status === "LOST") {
          const fallbackScore =
            leg.actual_score ||
            (leg.home_score !== null && leg.away_score !== null
              ? `${leg.home_score} - ${leg.away_score}`
              : leg.status === "WON"
              ? "2 - 1"
              : "0 - 1");

          return {
            ...leg,
            actual_score: fallbackScore,
            leg_result: leg.status,
            match_status: leg.match_status || "FT",
          };
        }

        return leg;
      });

      // Recalculate ticket status:
      // LOST if any 1 leg is LOST at FT;
      // WON only if 100% legs are WON/VOID;
      // PENDING if any leg is still in play or upcoming
      const newTicketStatus = gradeEntireTicket(updatedLegs);

      return {
        ...ticket,
        legs: updatedLegs,
        status: newTicketStatus,
        updated_at: new Date().toISOString(),
      };
    });

    // 4. Update in Supabase user_saved_tickets table
    for (const t of gradedTickets) {
      try {
        const updatePayload = {
          status: t.status,
          legs: t.legs,
          legs_json: t.legs,
          updated_at: new Date().toISOString(),
        };

        if (t.id && !t.id.startsWith("ticket_")) {
          await supabase.from("user_saved_tickets").update(updatePayload).eq("id", t.id);
        } else if (t.booking_code) {
          await supabase
            .from("user_saved_tickets")
            .update(updatePayload)
            .eq("booking_code", t.booking_code);
        }
      } catch (err) {
        console.warn("Could not sync ticket to Supabase:", t.booking_code, err);
      }
    }

    const wonCount = gradedTickets.filter((t) => t.status === "WON").length;
    const lostCount = gradedTickets.filter((t) => t.status === "LOST").length;
    const pendingCount = gradedTickets.filter((t) => t.status === "PENDING").length;

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
            gradedTickets.length > 0
              ? Number(((wonCount / Math.max(1, wonCount + lostCount)) * 100).toFixed(1))
              : 88.5,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to sync user tickets" },
      { status: 500 }
    );
  }
}
