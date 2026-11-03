/**
 * User Ticket Tracker (src/lib/userTicketTracker.ts)
 *
 * Captures, saves, and syncs user tickets across:
 * - Ready-made homepage accumulator copy events
 * - Custom Slip Builder copy & booking events
 * - Bet Slip cart generation & leg additions
 * - Cloud synchronization across multiple devices via Supabase Auth
 */

import { addUserNotification } from "./userNotifications";

export interface SavedTicket {
  id: string;
  user_id?: string;
  user_email?: string;
  booking_code: string;
  share_code?: string;
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
    actual_score?: string;
    match_status?: string;
    leg_result?: "WON" | "LOST" | "PENDING" | "VOID";
    eventId?: string;
  }>;
  status: "PENDING" | "WON" | "LOST" | "VOID";
  source?: string;
  created_at: string;
  updated_at?: string;
  payout?: number;
}

const LOCAL_STORAGE_KEY = "oddora_user_saved_tickets";

/**
 * Resolves current logged-in user credentials from local memory
 */
export function getActiveUserCredentials(): { userId?: string; userEmail?: string } {
  if (typeof window === "undefined") return {};
  try {
    const rawUser = localStorage.getItem("oddora_auth_user");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u?.id || u?.email) {
        return {
          userId: u.id,
          userEmail: u.email ? String(u.email).toLowerCase().trim() : undefined,
        };
      }
    }
    const rawProf = localStorage.getItem("oddora_user_profile");
    if (rawProf) {
      const p = JSON.parse(rawProf);
      if (p?.email && p.email !== "guest@oddora.ai") {
        return {
          userId: p.id,
          userEmail: String(p.email).toLowerCase().trim(),
        };
      }
    }
  } catch {}
  return {};
}

/**
 * Saves a ticket locally and syncs to Supabase cloud account
 */
export async function saveUserTicket(ticket: {
  booking_code: string;
  share_code?: string;
  total_odds: number;
  target_odds?: number;
  tier?: string;
  title?: string;
  legs: any[];
  source?: string;
  user_id?: string;
  user_email?: string;
  status?: "PENDING" | "WON" | "LOST" | "VOID";
}): Promise<SavedTicket> {
  const activeCreds = getActiveUserCredentials();
  const resolvedUserId = ticket.user_id || activeCreds.userId;
  const resolvedUserEmail = ticket.user_email
    ? ticket.user_email.toLowerCase().trim()
    : activeCreds.userEmail;

  const code = ticket.booking_code || ticket.share_code || "SPORTY-CODE";

  const newTicket: SavedTicket = {
    id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: resolvedUserId,
    user_email: resolvedUserEmail,
    booking_code: code,
    share_code: code,
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
      odd: Number(l.odd || l.odds) || 1.35,
      win_probability: Number(l.win_probability || 80),
      sport: l.sport || l.sport_type || "FOOTBALL",
      status: l.status || "PENDING",
      eventId: l.eventId || l.match_id,
    })),
    status: ticket.status || "PENDING",
    source: ticket.source || "ODDORA_PLATFORM",
    created_at: new Date().toISOString(),
  };

  // 1. Save to localStorage immediately for offline-first responsiveness
  if (typeof window !== "undefined") {
    try {
      const existingRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existing: SavedTicket[] = existingRaw ? JSON.parse(existingRaw) : [];
      // Deduplicate recent identical booking codes
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

  // 2. Sync directly to Cloud /api/tickets (Persisting to Supabase user_saved_tickets & auth user_metadata)
  try {
    fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTicket),
    }).catch(() => {});
  } catch {}

  return newTicket;
}

/**
 * Reads tickets stored in client localStorage
 */
export function getLocalSavedTickets(): SavedTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Updates a ticket status locally and broadcasts change
 */
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

/**
 * Mandatory cross-device cloud sync:
 * 1. Takes any guest slips built before logging in on this device
 * 2. Links them to the user's Supabase account (user_id and user_email)
 * 3. Fetches all tickets from Supabase for this user
 * 4. Merges everything without duplicates and updates localStorage
 */
export async function syncGuestTicketsToUserAccount(
  userId: string,
  userEmail: string
): Promise<SavedTicket[]> {
  if (!userId && !userEmail) return getLocalSavedTickets();
  const cleanEmail = (userEmail || "").toLowerCase().trim();

  const localTickets = getLocalSavedTickets();
  const guestTicketsToSync = localTickets.filter(
    (t) => !t.user_id || !t.user_email || t.user_email === "guest@oddora.ai"
  );

  // If there are guest tickets on this device, assign user credentials and push to cloud
  if (guestTicketsToSync.length > 0) {
    const updatedGuestTickets = guestTicketsToSync.map((t) => ({
      ...t,
      user_id: userId,
      user_email: cleanEmail,
    }));

    try {
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickets: updatedGuestTickets,
          userId,
          userEmail: cleanEmail,
        }),
      });
    } catch (err) {
      console.warn("Guest tickets sync notice:", err);
    }
  }

  // Fetch full cloud tickets from Supabase
  try {
    const params = new URLSearchParams();
    if (userId) params.set("user_id", userId);
    if (cleanEmail) params.set("email", cleanEmail);

    const res = await fetch(`/api/tickets?${params.toString()}`, { cache: "no-store" });
    const json = await res.json();

    if (json.status === "success" && Array.isArray(json.data)) {
      const cloudTickets: SavedTicket[] = json.data;

      // Merge cloud and local tickets deduplicated by id or booking code
      const map = new Map<string, SavedTicket>();
      [...cloudTickets, ...localTickets].forEach((t) => {
        const key = t.id || t.booking_code;
        if (!map.has(key)) {
          map.set(key, {
            ...t,
            user_id: t.user_id || userId,
            user_email: t.user_email || cleanEmail,
          });
        }
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent("oddora:ticket-saved", { detail: merged }));
      }
      return merged;
    }
  } catch (fetchErr) {
    console.warn("Cloud tickets fetch error:", fetchErr);
  }

  return localTickets;
}
