import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SavedTicket } from "@/lib/userTicketTracker";
import { gradeMatchLeg, gradeEntireTicket, mapMatchStatus } from "@/lib/ticketGrader";

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
          "match_id, event_id, sport_type, sport, home_team, away_team, home_score, away_score, status, outcome_result, actual_score, match_status, leg_result"
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

    const findMatch = (home?: string, away?: string, matchName?: string, eventId?: string) => {
      if (eventId) {
        const cleanEv = String(eventId).trim();
        const found = liveMatches.find((m) => {
          if (m.event_id && String(m.event_id).trim() === cleanEv) return true;
          if (m.match_id && String(m.match_id).trim() === cleanEv) return true;
          return false;
        });
        if (found) return found;
      }

      const hNorm = home ? norm(home) : "";
      const aNorm = away ? norm(away) : "";

      return liveMatches.find((m) => {
        const mH = norm(m.home_team || "");
        const mA = norm(m.away_team || "");
        if (
          hNorm &&
          aNorm &&
          (mH.includes(hNorm) || hNorm.includes(mH)) &&
          (mA.includes(aNorm) || aNorm.includes(mA))
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
              home_score: hScore,
              away_score: aScore,
            };
          }

          // If finished, grade strictly according to final score
          if (mappedStatus === "Finished" && hScore !== null && aScore !== null) {
            const grading = gradeMatchLeg(
              {
                ...leg,
                sport: leg.sport || match.sport_type || match.sport || "FOOTBALL",
              },
              hScore,
              aScore,
              rawStatus
            );
            return {
              ...leg,
              status: grading.status,
              home_score: grading.home_score,
              away_score: grading.away_score,
            };
          }

          // Live or upcoming -> remains PENDING with current live score
          return {
            ...leg,
            status: "PENDING" as const,
            home_score: hScore,
            away_score: aScore,
          };
        }

        // Match not in active DB batch -> keep leg's existing status
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
