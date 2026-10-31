/**
 * User Ticket Tracker (src/lib/userTicketTracker.ts)
 *
 * Captures, saves, and syncs user tickets across:
 * - Ready-made homepage accumulator copy events
 * - Custom Slip Builder copy & booking events
 * - Bet Slip cart generation & leg additions
 */

import { addUserNotification } from "./userNotifications";

export interface SavedTicket {
  id: string;
  user_id?: string;
  user_email?: string;
  booking_code: string;
  total_odds: number;
  target_odds?: number;
  tier?: string;
  title: string;
  legs: Array<{
    match: string;
    home_team?: string;
    away_team?: string;
    league?: string;
    market: string;
    selection: string;
    odd: number;
    win_probability?: number;
    sport?: string;
    sport_type?: string;
    status?: "PENDING" | "WON" | "LOST" | "VOID";
    home_score?: number | null;
    away_score?: number | null;
    eventId?: string;
  }>;
  status: "PENDING" | "WON" | "LOST" | "VOID";
  source?: string;
  created_at: string;
  updated_at?: string;
  payout?: number;
}

const LOCAL_STORAGE_KEY = "oddora_user_saved_tickets";

export async function saveUserTicket(ticket: {
  booking_code: string;
  total_odds: number;
  target_odds?: number;
  tier?: string;
  title?: string;
  legs: any[];
  source?: string;
  user_id?: string;
  user_email?: string;
}): Promise<SavedTicket> {
  // Ensure every saved betslip is strictly tied to auth.users.id AND user_email
  let resolvedUserId = ticket.user_id;
  let resolvedUserEmail = ticket.user_email;

  if (typeof window !== "undefined" && (!resolvedUserId || !resolvedUserEmail)) {
    try {
      const rawUser = localStorage.getItem("oddora_auth_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (!resolvedUserId) resolvedUserId = u.id;
        if (!resolvedUserEmail) resolvedUserEmail = u.email;
      }
      if (!resolvedUserEmail) {
        const rawProf = localStorage.getItem("oddora_user_profile");
        if (rawProf) {
          const p = JSON.parse(rawProf);
          if (p.email && p.email !== "guest@oddora.ai") resolvedUserEmail = p.email;
        }
      }
    } catch {}
  }

  const newTicket: SavedTicket = {
    id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: resolvedUserId,
    user_email: resolvedUserEmail,
    booking_code: ticket.booking_code || "SPORTY-CODE",
    total_odds: Number(ticket.total_odds) || 2.0,
    target_odds: ticket.target_odds ? Number(ticket.target_odds) : undefined,
    tier: ticket.tier || "FREE",
    title: ticket.title || "Oddora Accumulator Ticket",
    legs: (ticket.legs || []).map((l) => ({
      match: l.match || `${l.home_team || "Home"} vs ${l.away_team || "Away"}`,
      home_team: l.home_team || l.match?.split(" vs ")[0] || "Home",
      away_team: l.away_team || l.match?.split(" vs ")[1] || "Away",
      league: l.league || "Premier Division",
      market: l.market || "Market",
      selection: l.selection || "Selection",
      odd: Number(l.odd || 1.35),
      win_probability: Number(l.win_probability || 80),
      sport: l.sport || l.sport_type || "FOOTBALL",
      status: l.status || "PENDING",
      eventId: l.eventId || l.match_id,
    })),
    status: "PENDING",
    source: ticket.source || "ODDORA_PLATFORM",
    created_at: new Date().toISOString(),
  };

  // 1. Save to localStorage immediately for offline-first reliability
  if (typeof window !== "undefined") {
    try {
      const existingRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existing: SavedTicket[] = existingRaw ? JSON.parse(existingRaw) : [];
      // Prevent exact duplicates with same booking_code within 1 hour
      const isDuplicate = existing.some(
        (t) =>
          t.booking_code === newTicket.booking_code &&
          Date.now() - new Date(t.created_at).getTime() < 3600000
      );
      if (!isDuplicate) {
        existing.unshift(newTicket);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing.slice(0, 100)));
        addUserNotification({
          title: "📋 Ticket Saved to Tracker",
          message: `Saved "${newTicket.title}" (${newTicket.total_odds}x) with code ${newTicket.booking_code}. Tracking live in My Bets.`,
          type: "TICKET_SAVED",
          targetTab: "my_bets",
          metadata: { ticketId: newTicket.id, bookingCode: newTicket.booking_code },
        });
      }
      window.dispatchEvent(new CustomEvent("oddora:ticket-saved", { detail: newTicket }));
    } catch (lsErr) {
      console.warn("Could not save ticket to localStorage:", lsErr);
    }
  }

  // 2. Sync to Backend API
  try {
    fetch("/api/user/saved-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTicket),
    }).catch(() => {});
  } catch {}

  return newTicket;
}

export function getLocalSavedTickets(): SavedTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function updateLocalTicketStatus(ticketId: string, status: "WON" | "LOST" | "PENDING"): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalSavedTickets();
    const target = existing.find((t) => t.id === ticketId);
    const updated = existing.map((t) => (t.id === ticketId ? { ...t, status } : t));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("oddora:ticket-updated", { detail: { id: ticketId, status } }));

    if (target && target.status !== status) {
      if (status === "WON") {
        addUserNotification({
          title: "🎉 Ticket Won!",
          message: `Your ticket (${target.booking_code}) won with ${target.total_odds}x odds!`,
          type: "WON",
          targetTab: "my_bets",
          metadata: { ticketId, bookingCode: target.booking_code },
        });
      } else if (status === "LOST") {
        addUserNotification({
          title: "❌ Ticket Settled (Lost)",
          message: `Your ticket (${target.booking_code}) has settled. View match leg audit in My Bets.`,
          type: "LOST",
          targetTab: "my_bets",
          metadata: { ticketId, bookingCode: target.booking_code },
        });
      }
    }
  } catch {}
}

