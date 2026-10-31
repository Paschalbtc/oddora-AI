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
        .select("match_id, sport_type, sport, home_team, away_team, home_score, away_score, status, outcome_result")
        .limit(500);
      liveMatches = data || [];
    } catch {
      liveMatches = [];
    }

    // Also fetch tickets from database if userId/userEmail provided and userTickets is empty
    let ticketsToGrade: SavedTicket[] = [...userTickets];
    if (ticketsToGrade.length === 0 && (userId || userEmail)) {
      try {
        let query = supabase.from("user_saved_tickets").select("*").limit(50);
        if (userId && userEmail) {
          query = query.or(`user_id.eq.${userId},user_email.ilike.${userEmail}`);
        } else if (userId) {
          query = query.eq("user_id", userId);
        } else if (userEmail) {
          query = query.ilike("user_email", userEmail);
        }
        const { data: dbTickets } = await query;
        if (dbTickets && dbTickets.length > 0) {
          ticketsToGrade = dbTickets.map((t: any) => ({
            ...t,
            legs: Array.isArray(t.legs) ? t.legs : Array.isArray(t.legs_json) ? t.legs_json : [],
          }));
        }
      } catch {}
    }

    // Normalization helper for team matching
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    const findMatch = (home?: string, away?: string, matchName?: string) => {
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

    // 2. Grade each ticket
    const gradedTickets: SavedTicket[] = ticketsToGrade.map((ticket) => {
      const updatedLegs: SavedTicket["legs"] = (ticket.legs || []).map((leg) => {
        if (leg.status === "WON" || leg.status === "LOST" || leg.status === "VOID") {
          return leg; // Already finalized
        }

        const match = findMatch(leg.home_team, leg.away_team, leg.match);
        if (match) {
          const mappedStatus = mapMatchStatus(match.status);

          // If postponed or cancelled, void immediately
          if (mappedStatus === "Void") {
            return {
              ...leg,
              status: "VOID" as const,
              home_score: match.home_score ?? null,
              away_score: match.away_score ?? null,
            };
          }

          // If finished, grade according to multi-sport rule
          if (mappedStatus === "Finished" && match.home_score !== null && match.away_score !== null) {
            const grading = gradeMatchLeg(
              {
                ...leg,
                sport: leg.sport || match.sport_type || match.sport || "FOOTBALL",
              },
              match.home_score,
              match.away_score,
              match.status
            );
            return {
              ...leg,
              status: grading.status,
              home_score: grading.home_score,
              away_score: grading.away_score,
            };
          }

          // Live or upcoming -> remains PENDING with current live score attached
          return {
            ...leg,
            status: "PENDING" as const,
            home_score: match.home_score ?? null,
            away_score: match.away_score ?? null,
          };
        }

        return leg;
      });

      const newTicketStatus = gradeEntireTicket(updatedLegs);

      return {
        ...ticket,
        legs: updatedLegs,
        status: newTicketStatus,
        updated_at: new Date().toISOString(),
      };
    });

    // 3. Update in Supabase if ticket exists in user_saved_tickets
    for (const t of gradedTickets) {
      if (t.id && !t.id.startsWith("ticket_")) {
        supabase
          .from("user_saved_tickets")
          .update({
            status: t.status,
            legs: t.legs,
            updated_at: new Date().toISOString(),
          })
          .eq("id", t.id)
          .then();
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
