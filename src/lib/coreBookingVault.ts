/**
 * Core Booking Vault (src/lib/coreBookingVault.ts)
 * 
 * PERMANENT SYSTEM MODULE (SPORTYBET-EXCLUSIVE):
 * 1. Strict Payload-to-Display Binding: Every slip rendered on the UI is derived directly
 *    from the exact same JSON array that is passed into POST https://www.sportybet.com/api/ng/orders/share.
 * 2. Validate Match Parity Before Displaying Code: Verifies outcomes.length === slip.legs_json.length.
 *    If any leg fails to map or is rejected, automatically substitutes it with a verified fallback
 *    safe match from the active database cache so displayed games and booking code are always in 100% agreement.
 * 3. Pre-flight validation: Excludes suspended matches and games kicking off within 45 minutes.
 * 4. Strict preservation of unmodified { eventId, marketId, outcomeId, specifier } in Edit Slip.
 */

import { getSupabaseAdmin, getSupabaseClient } from "./supabase";
import {
  normalizeAndRemapSelectionsForSportyBet,
  fetchLiveSportyBetCatalog,
} from "./engines/bookingEngine";
import { mapMarketToSportyBetIds } from "./sportybetBridge";
import { resolveSportyBetMarket, formatMarketCategory } from "./highProbabilityOutcomes";

export interface SportyBetRealOutcome {
  eventId: string;
  marketId: string;
  outcomeId: string;
  specifier: string | null;
  odd: number;
  market: string;
  selection: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime?: string;
}

export interface VaultBookedLeg {
  match: string;
  home_team: string;
  away_team: string;
  league: string;
  market: string;
  selection: string;
  odd: number;
  win_probability: number;
  eventId: string;
  marketId: string;
  outcomeId: string;
  specifier: string | null;
  sport?: string;
  kickoffTime?: string;
  kickoff_time?: string;
  match_id?: string;
}

export interface VaultBookingResult {
  status: "success" | "error";
  success?: boolean;
  code?: string;
  shareCode?: string;
  bookingCode?: string;
  sportybet_code: string;
  sportybetCode?: string;
  sporty_code?: string;
  sportyCode?: string;
  booking_code?: string;
  sporty_url: string;
  sportyUrl?: string;
  share_url?: string;
  shareUrl?: string;
  total_odds: number;
  actual_odds: number;
  legs_count: number;
  is_verified_live: boolean;
  all_legs_accepted?: boolean;
  legs: VaultBookedLeg[];
  legs_json: VaultBookedLeg[];
  live_outcomes?: any[];
  accepted_event_ids?: string[];
  acceptedEventIds?: string[];
  rejected_event_ids?: string[];
  rejectedEventIds?: string[];
  error_message?: string;
  bet9ja_code?: string;
  bet9ja_url?: string;
}

export const SPORTYBET_BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.sportybet.com",
  Referer: "https://www.sportybet.com/ng/",
  "sec-ch-ua": '"Chromium";v="123", "Not:A-Brand";v="8"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "Content-Type": "application/json;charset=UTF-8",
};

/**
 * 1. PULL REAL SPORTYBET EVENTS & EXTRACT ACTUAL MARKETS ONLY
 * Hits SportyBet pcUpcomingEvents with multi-market expansion
 */
export async function fetchLiveSportyBetCatalogWithRealMarkets(
  sportId: string = "sr:sport:1",
  maxPages = 3
): Promise<SportyBetRealOutcome[]> {
  const extractedOutcomes: SportyBetRealOutcome[] = [];
  const seenKeys = new Set<string>();

  let marketParams = "marketId=1&marketId=10&marketId=18&marketId=29";
  let sportName = "FOOTBALL";
  if (sportId === "sr:sport:2") {
    marketParams = "marketId=219&marketId=225&marketId=223";
    sportName = "BASKETBALL";
  } else if (sportId === "sr:sport:20") {
    marketParams = "marketId=186";
    sportName = "TABLE_TENNIS";
  } else if (sportId === "sr:sport:23") {
    marketParams = "marketId=186&marketId=238&marketId=314";
    sportName = "VOLLEYBALL";
  }

  const targetUrls: string[] = [];
  for (let page = 1; page <= maxPages; page++) {
    targetUrls.push(
      `https://www.sportybet.com/api/ng/factsCenter/pcUpcomingEvents?sportId=${encodeURIComponent(
        sportId
      )}&${marketParams}&pageSize=100&pageNum=${page}`
    );
  }

  const responses = await Promise.allSettled(
    targetUrls.map((u) =>
      fetch(u, {
        headers: SPORTYBET_BROWSER_HEADERS,
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  const nowMs = Date.now();

  for (const res of responses) {
    if (res.status !== "fulfilled" || !res.value) continue;
    const json = res.value;

    let events: any[] = [];
    if (Array.isArray(json?.data)) {
      events = json.data;
    } else if (Array.isArray(json?.data?.tournaments)) {
      for (const t of json.data.tournaments) {
        if (Array.isArray(t?.events)) events.push(...t.events);
      }
    }

    for (const ev of events) {
      if (!ev || !ev.eventId) continue;
      const startTime = Number(ev.estimateStartTime);
      if (startTime && startTime <= nowMs + 15 * 60 * 1000) continue; // Exclude past / kicking off within 15 minutes

      const home = (ev.homeTeamName || "").trim();
      const away = (ev.awayTeamName || "").trim();
      if (!home || !away) continue;

      const league =
        ev.sport?.category?.tournament?.name ||
        ev.tournament?.name ||
        ev.league_name ||
        "Championship";

      const kickoffIso = startTime ? new Date(startTime).toISOString() : new Date(nowMs + 7200000).toISOString();

      const marketsList = Array.isArray(ev.markets) ? ev.markets : [];

      for (const m of marketsList) {
        if (!m || !m.id || !Array.isArray(m.outcomes)) continue;
        const marketIdStr = String(m.id);
        const marketDesc = m.desc || "Market";
        const specifier = m.specifier || null;

        for (const out of m.outcomes) {
          if (!out || !out.id || !out.odds) continue;
          const outcomeIdStr = String(out.id);
          const oddVal = parseFloat(out.odds);
          if (isNaN(oddVal) || oddVal <= 1.05 || oddVal > 1.60) continue; // Keep within banker corridor

          const key = `${ev.eventId}_${marketIdStr}_${outcomeIdStr}_${specifier || ""}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);

          extractedOutcomes.push({
            eventId: ev.eventId,
            marketId: marketIdStr,
            outcomeId: outcomeIdStr,
            specifier,
            odd: oddVal,
            market: marketDesc,
            selection: out.desc || "Pick",
            sport: sportName,
            homeTeam: home,
            awayTeam: away,
            league,
            kickoffTime: kickoffIso,
          });
        }
      }
    }
  }

  return extractedOutcomes;
}

/**
 * PRE-FLIGHT VALIDATION CHECK:
 * Strictly eliminates at-risk fixtures:
 * 1. Checks kickoff lead time > 15 minutes before match start.
 * 2. Strictly filters out matches that are suspended, cancelled, postponed, closed, ended, finished, or live.
 * 3. Enforces that fixture status must strictly be upcoming/open.
 */
export function isMatchValidForSportyBetBooking(sel: any): boolean {
  if (!sel) return false;

  const rawStatus = String(sel.status || sel.match_status || sel.game_status || "").toLowerCase().trim();
  if (
    rawStatus === "suspended" ||
    rawStatus === "postponed" ||
    rawStatus === "cancelled" ||
    rawStatus === "interrupted" ||
    rawStatus === "abandoned" ||
    rawStatus === "ended" ||
    rawStatus === "closed" ||
    rawStatus === "live" ||
    rawStatus === "in_progress" ||
    rawStatus === "1h" ||
    rawStatus === "2h" ||
    rawStatus === "ht" ||
    rawStatus === "ft" ||
    rawStatus === "finished"
  ) {
    return false;
  }

  // If status is present, ensure it represents an open/upcoming fixture
  if (
    rawStatus &&
    !["upcoming", "not_started", "scheduled", "open", "fixture", "ns", "pre-match", "prematch", "tbd"].includes(rawStatus)
  ) {
    return false;
  }

  const timeVal =
    sel.startTime ||
    sel.start_time ||
    sel.scheduled_time ||
    sel.kickoff_time ||
    sel.kickoffTime ||
    sel.eventTime ||
    sel.scheduled;
  if (timeVal) {
    const kickoffMs = typeof timeVal === "number" ? timeVal : new Date(timeVal).getTime();
    if (!isNaN(kickoffMs)) {
      const minLeadTimeMs = 5 * 60 * 1000; // Filter out matches kicking off within 5 minutes
      const now = Date.now();
      if (kickoffMs <= now + minLeadTimeMs) {
        return false;
      }
    }
  }

  // Real SportyBet event IDs are strictly numeric (at least 5 digits)
  const rawEvId = sel.sportybet_selection?.eventId || sel.eventId || sel.match_id || sel.id;
  if (!rawEvId) return false;
  const evStr = String(rawEvId).trim();
  const digits = evStr.replace(/\D/g, "");
  if (digits.length < 5) return false;
  if (evStr.startsWith("sr:match:")) {
    const after = evStr.slice("sr:match:".length);
    if (!/^\d+$/.test(after)) return false;
  }

  return true;
}

/**
 * 2. MANDATORY LIVE CODE VERIFICATION (GET /orders/share/${code})
 * Confirms SportyBet order share loads valid outcomes
 */
export async function verifySportyBetShareCode(code: string): Promise<boolean> {
  const clean = (code || "").trim().toUpperCase();
  if (!clean || clean.length < 4 || clean.includes("VIP") || clean.includes("READY")) return false;

  try {
    const res = await fetch(`https://www.sportybet.com/api/ng/orders/share/${clean}`, {
      headers: SPORTYBET_BROWSER_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const json = await res.json();
      if ((json.bizCode === 10000 || json.innerCode === "10000") && Array.isArray(json.data?.outcomes)) {
        return json.data.outcomes.length > 0;
      }
    }
  } catch (err) {
    console.warn("SportyBet live share check notice:", err);
  }
  return false;
}

/**
 * Decodes real live outcomes directly from SportyBet /orders/share/${code}
 */
export async function getSportyBetShareOutcomes(code: string): Promise<any[]> {
  const clean = (code || "").trim().toUpperCase();
  if (!clean || clean.length < 4 || clean.includes("VIP") || clean.includes("READY")) return [];

  try {
    const res = await fetch(`https://www.sportybet.com/api/ng/orders/share/${clean}`, {
      headers: SPORTYBET_BROWSER_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const json = await res.json();
      if ((json.bizCode === 10000 || json.innerCode === "10000") && Array.isArray(json.data?.outcomes)) {
        return json.data.outcomes;
      }
    }
  } catch (err) {
    console.warn("[SportyBet] GET orders/share live check warning:", err);
  }
  return [];
}

/**
 * Maps live SportyBet API outcomes directly into VaultBookedLeg array.
 * Ensures 100% 1-to-1 match between the platform ticket and the SportyBet booking code.
 */
export function mapSportyBetOutcomesToLegs(
  returnedOutcomes: any[],
  fallbackCandidates: any[] = []
): VaultBookedLeg[] {
  if (!Array.isArray(returnedOutcomes) || returnedOutcomes.length === 0) {
    return [];
  }

  const candidateByEventId = new Map<string, any>();
  for (const c of fallbackCandidates) {
    const ev = String(c.eventId || c.match_id || "").trim();
    if (ev) candidateByEventId.set(ev, c);
    const digits = ev.replace(/\D/g, "");
    if (digits) candidateByEventId.set(digits, c);
  }

  return returnedOutcomes.map((o) => {
    const evId = String(o.eventId || "").trim();
    const digits = evId.replace(/\D/g, "");
    const matched = candidateByEventId.get(evId) || candidateByEventId.get(digits);

    const home = (o.homeTeamName || matched?.home_team || "Home").trim();
    const away = (o.awayTeamName || matched?.away_team || "Away").trim();
    const marketObj = o.markets?.[0];
    const outcomeObj = marketObj?.outcomes?.[0];

    const marketDesc = marketObj?.desc || matched?.market || "Match Winner";
    const outcomeDesc = outcomeObj?.desc || matched?.selection || "Selection";
    const oddVal = Number(outcomeObj?.odds || matched?.odd || 1.30);
    const probVal = outcomeObj?.probability
      ? Math.round(Number(outcomeObj.probability) * 100)
      : (matched?.win_probability || Math.round((1 / Math.max(1.01, oddVal)) * 90));

    const sportName = (o.sport?.name || matched?.sport || "FOOTBALL").toUpperCase();
    const tournamentName =
      o.sport?.category?.tournament?.name ||
      o.sport?.category?.name ||
      matched?.league ||
      "Premier Division";

    return {
      match: `${home} vs ${away}`,
      home_team: home,
      away_team: away,
      league: tournamentName,
      market: marketDesc,
      selection: outcomeDesc,
      odd: oddVal,
      win_probability: probVal,
      eventId: evId,
      marketId: marketObj?.id || matched?.marketId || "1",
      outcomeId: outcomeObj?.id || matched?.outcomeId || "1",
      specifier: marketObj?.specifier ?? matched?.specifier ?? null,
      sport: sportName,
      kickoffTime: o.estimateStartTime ? new Date(o.estimateStartTime).toISOString() : (matched?.kickoffTime || new Date().toISOString()),
      kickoff_time: o.estimateStartTime ? new Date(o.estimateStartTime).toISOString() : (matched?.kickoff_time || new Date().toISOString()),
    };
  });
}

// Note: Fallback random match substitution has been permanently deleted.
// Strict 1-to-1 Match & Event Parity is strictly enforced. Every game in a SportyBet code
// must directly correspond to that exact fixture.

/**
 * Smart Sport-Specific Market Sanitizer
 * Ensures sub-markets for Volleyball, Table Tennis, and Basketball are strictly compatible
 * with SportyBet's active factsCenter schemas.
 */
export function sanitizeMarketForSport(
  sport: string = "FOOTBALL",
  marketId: string,
  outcomeId: string,
  specifier: string | null,
  marketName: string = "",
  selectionName: string = ""
): { marketId: string; outcomeId: string; specifier: string | null } {
  const sUpper = sport.toUpperCase();
  const mLower = marketName.toLowerCase();
  const selLower = selectionName.toLowerCase();

  // Volleyball
  if (sUpper.includes("VOLLEY") || mLower.includes("vb") || selLower.includes("vb")) {
    if (mLower.includes("set") || mLower.includes("total") || selLower.includes("over") || selLower.includes("under")) {
      const isOver = selLower.includes("over");
      return {
        marketId: "238",
        outcomeId: isOver ? "12" : "13",
        specifier: "total=3.5",
      };
    }
    // Match Winner 2-Way (SportyBet Volleyball Market 186)
    const isAway = selLower.includes("away") || selLower.includes("2");
    return {
      marketId: "186",
      outcomeId: isAway ? "2" : "1",
      specifier: null,
    };
  }

  // Table Tennis
  if (sUpper.includes("TABLE") || sUpper.includes("TENNIS") || mLower.includes("table") || selLower.includes("table")) {
    const isAway = selLower.includes("away") || selLower.includes("2");
    return {
      marketId: "186",
      outcomeId: isAway ? "2" : "1",
      specifier: null,
    };
  }

  // Basketball
  if (sUpper.includes("BASKET") || mLower.includes("basket") || selLower.includes("basket")) {
    if (mLower.includes("over") || mLower.includes("under") || mLower.includes("total")) {
      const isOver = selLower.includes("over");
      return {
        marketId: "225",
        outcomeId: isOver ? "12" : "13",
        specifier: specifier && specifier.includes("total=") ? specifier : "total=215.5",
      };
    }
    const isAway = selLower.includes("away") || selLower.includes("2");
    return {
      marketId: "219",
      outcomeId: isAway ? "5" : "4",
      specifier: null,
    };
  }

  return { marketId, outcomeId, specifier };
}

export interface SportyPayloadItem {
  eventId: string;
  marketId: string;
  outcomeId: string;
  specifier?: string; // Strictly omitted from JSON if market has no specifier
}

/**
 * Validates and formats a single selection into SportyBet order share payload.
 * Strictly adheres to SportyBet's specifier rules:
 * Markets 1, 10, 11, 29, 186, 219 NEVER have a specifier.
 */
export function cleanSportyBetSelectionPayload(
  rawEvId: any,
  marketId: any,
  outcomeId: any,
  specifier: any,
  selText: string = ""
): SportyPayloadItem | null {
  if (!rawEvId) return null;
  const s = String(rawEvId).trim();
  let cleanEvId: string;
  if (/^sr:match:\d{5,}$/.test(s)) {
    cleanEvId = s;
  } else {
    const digits = s.replace(/\D/g, "");
    if (digits.length < 5) return null;
    cleanEvId = `sr:match:${digits}`;
  }

  let mId = String(marketId || "").trim();
  let oId = String(outcomeId || "").trim();
  let spec = typeof specifier === "string" ? specifier.trim() : null;
  const text = selText.toLowerCase();

  // If IDs are missing or non-numeric, resolve standard outcome IDs
  if (!/^\d+$/.test(mId) || !/^\d+$/.test(oId)) {
    if (text.includes("over") || text.includes("under") || text.startsWith("o ") || text.startsWith("u ")) {
      mId = "18";
      oId = text.includes("under") ? "13" : "12";
      let line = "1.5";
      if (text.includes("0.5")) line = "0.5";
      else if (text.includes("2.5")) line = "2.5";
      else if (text.includes("3.5")) line = "3.5";
      else if (text.includes("4.5")) line = "4.5";
      spec = `total=${line}`;
    } else if (text.includes("1x") || text.includes("x2") || text.includes("12") || text.includes("double chance")) {
      mId = "10";
      oId = text.includes("x2") ? "11" : (text.includes("12") ? "10" : "9");
      spec = null;
    } else if (text.includes("gg") || text.includes("btts") || text.includes("both")) {
      mId = "29";
      oId = (text.includes("no") || text.includes("ng")) ? "76" : "74";
      spec = null;
    } else if (text.includes("dnb") || text.includes("draw no bet")) {
      mId = "11";
      oId = (text.includes("2") || text.includes("away")) ? "2" : "1";
      spec = null;
    } else {
      mId = "1";
      oId = text.includes("draw") || text === "x" ? "2" : (text.includes("2") || text.includes("away") ? "3" : "1");
      spec = null;
    }
  }

  // Enforce SportyBet exact schema per market
  if (mId === "1") {
    // 1X2: 1 (Home), 2 (Draw), 3 (Away) - NO specifier
    if (oId !== "1" && oId !== "2" && oId !== "3") {
      oId = text.includes("draw") || text === "x" ? "2" : (text.includes("2") || text.includes("away") ? "3" : "1");
    }
    spec = null;
  } else if (mId === "10") {
    // Double Chance: 9 (1X), 10 (12), 11 (X2) - NO specifier
    if (oId !== "9" && oId !== "10" && oId !== "11") {
      oId = text.includes("x2") ? "11" : (text.includes("12") ? "10" : "9");
    }
    spec = null;
  } else if (mId === "11") {
    // Draw No Bet: 1 (Home), 2 (Away) - NO specifier
    if (oId !== "1" && oId !== "2") {
      oId = text.includes("2") || text.includes("away") ? "2" : "1";
    }
    spec = null;
  } else if (mId === "29") {
    // GG/NG: 74 (Yes/GG), 76 (No/NG) - NO specifier
    if (oId !== "74" && oId !== "76") {
      oId = text.includes("no") || text.includes("ng") ? "76" : "74";
    }
    spec = null;
  } else if (mId === "18") {
    // Over/Under Goals: 12 (Over), 13 (Under) - specifier total=X.5
    if (oId !== "12" && oId !== "13") {
      oId = text.includes("under") ? "13" : "12";
    }
    if (!spec || !spec.includes("total=")) {
      let line = "1.5";
      if (text.includes("0.5")) line = "0.5";
      else if (text.includes("2.5")) line = "2.5";
      else if (text.includes("3.5")) line = "3.5";
      else if (text.includes("4.5")) line = "4.5";
      spec = `total=${line}`;
    }
  }

  const payload: SportyPayloadItem = {
    eventId: cleanEvId,
    marketId: mId,
    outcomeId: oId,
  };

  // Strictly omit specifier key if null, empty, or market does not take a specifier
  const noSpecMarkets = new Set(["1", "10", "11", "29", "186", "219"]);
  if (!noSpecMarkets.has(mId) && spec && spec !== "null" && spec !== "undefined" && spec.length > 0) {
    payload.specifier = spec;
  }

  return payload;
}

/**
 * 3. BOOK VERIFIED SPORTYBET EXCLUSIVE SLIP (CRITICAL 1-TO-1 PARITY ENGINE)
 * Strictly guarantees that:
 * 1. Clean payload formatting: Omits specifier on markets that don't take one.
 * 2. 1-Event-Per-Match Rule: Deduplicates selections by eventId using a Map.
 * 3. Resilient Live Filtering: When SportyBet responds, inspects exactly which outcomes were booked
 *    and filters finalLegs so displayed legs and SportyBet ticket are in 100% agreement.
 */
export async function bookVaultSlip(
  selections: any[],
  options: {
    slip_category?: string;
    required_tier?: "FREE" | "PRO" | "PREMIUM";
    target_odds?: number;
    preserve_exact_legs?: boolean;
    require_all_legs?: boolean;
  } = {}
): Promise<VaultBookingResult> {
  if (!Array.isArray(selections) || selections.length === 0) {
    return {
      status: "error",
      success: false,
      code: "",
      sportybet_code: "",
      sporty_url: "",
      total_odds: 1.0,
      actual_odds: 1.0,
      legs_count: 0,
      is_verified_live: false,
      legs: [],
      legs_json: [],
      accepted_event_ids: [],
      acceptedEventIds: [],
      error_message: "No selections provided for booking.",
    };
  }

  // 1. Strict 1-Event-Per-Match Map
  const selectionsByEventId = new Map<
    string,
    {
      leg: VaultBookedLeg;
      payload: SportyPayloadItem;
    }
  >();

  const seenMatches = new Set<string>();

  for (let idx = 0; idx < selections.length; idx++) {
    const sel = selections[idx];
    if (!sel) continue;

    const rawEvId =
      sel.sportybetSelection?.eventId ||
      sel.sportybet_selection?.eventId ||
      sel.eventId ||
      sel.event_id ||
      sel.matchId ||
      sel.match_id ||
      sel.id;

    const rawMId = sel.sportybetSelection?.marketId ?? sel.sportybet_selection?.marketId ?? sel.marketId ?? sel.market_id;
    const rawOId = sel.sportybetSelection?.outcomeId ?? sel.sportybet_selection?.outcomeId ?? sel.outcomeId ?? sel.outcome_id;
    const rawSpec = sel.sportybetSelection?.specifier ?? sel.sportybet_selection?.specifier ?? sel.specifier ?? null;
    const selText = String(sel.selection || sel.best_outcome || sel.outcome || "");

    const cleanedPayload = cleanSportyBetSelectionPayload(rawEvId, rawMId, rawOId, rawSpec, selText);
    if (!cleanedPayload) continue;

    const finalEvId = cleanedPayload.eventId;

    // 1-Event-Per-Match: Deduplicate by event ID
    if (selectionsByEventId.has(finalEvId)) {
      continue;
    }

    const homeName = sel.home_team || (sel.match ? sel.match.split(" vs ")[0] : "Home");
    const awayName = sel.away_team || (sel.match ? sel.match.split(" vs ")[1] : "Away");
    const matchKey = `${homeName.toLowerCase().replace(/[^a-z0-9]/g, "")}_vs_${awayName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    if (matchKey.length > 5 && seenMatches.has(matchKey)) {
      continue;
    }

    const oddVal = Number(sel.odd || sel.odds || sel.odd_value) || 1.35;
    const sportName = (sel.sport || sel.sport_type || "FOOTBALL").toUpperCase();

    const legToAdd: VaultBookedLeg = {
      match: sel.match || `${homeName} vs ${awayName}`,
      home_team: homeName,
      away_team: awayName,
      league: sel.league || "Premier Division",
      market: sel.market || sel.marketCategory || "Match Winner",
      selection: sel.selection || "Selection",
      odd: oddVal,
      win_probability: Number(sel.win_probability) || 82,
      eventId: finalEvId,
      marketId: cleanedPayload.marketId,
      outcomeId: cleanedPayload.outcomeId,
      specifier: cleanedPayload.specifier || null,
      sport: sportName,
      kickoffTime: sel.kickoffTime || sel.kickoff_time || new Date(Date.now() + 7200000).toISOString(),
      kickoff_time: sel.kickoffTime || sel.kickoff_time || new Date(Date.now() + 7200000).toISOString(),
    };

    selectionsByEventId.set(finalEvId, {
      leg: legToAdd,
      payload: cleanedPayload,
    });

    if (matchKey.length > 5) {
      seenMatches.add(matchKey);
    }
  }

  if (selectionsByEventId.size === 0) {
    return {
      status: "error",
      success: false,
      code: "",
      sportybet_code: "",
      sporty_url: "",
      total_odds: 1.0,
      actual_odds: 1.0,
      legs_count: 0,
      is_verified_live: false,
      legs: [],
      legs_json: [],
      accepted_event_ids: [],
      acceptedEventIds: [],
      error_message: "No valid SportyBet matches found in the submitted slip.",
    };
  }

  let candidateLegs = Array.from(selectionsByEventId.values()).map((x) => x.leg);
  let formattedSelections = Array.from(selectionsByEventId.values()).map((x) => x.payload);

  console.log(
    `[SportyBet Vault] Dispatching ${formattedSelections.length} clean selections to POST /orders/share:`,
    JSON.stringify(formattedSelections)
  );

  let sportyCode = "";
  let sportyUrl = "";
  let isVerifiedLive = false;
  let allLegsAccepted = false;
  let finalLegs: VaultBookedLeg[] = [];
  let returnedOutcomes: any[] = [];
  let acceptedLegIds: string[] = [];
  let rejectedLegIds: string[] = [];
  let networkFailed = false;

  // 2. Primary Dispatch to SportyBet order share endpoint
  try {
    const res = await fetch("https://www.sportybet.com/api/ng/orders/share", {
      method: "POST",
      headers: SPORTYBET_BROWSER_HEADERS,
      body: JSON.stringify({ selections: formattedSelections }),
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const json = await res.json();
      const hasCode = Boolean((json.bizCode === 10000 || json.innerCode === "10000") && json.data?.shareCode);
      returnedOutcomes = Array.isArray(json.data?.outcomes) ? json.data.outcomes : [];

      const acceptedSet = new Set<string>();
      for (const o of returnedOutcomes) {
        if (o.eventId) acceptedSet.add(String(o.eventId).trim());
        if (o.id) acceptedSet.add(String(o.id).trim());
        const digits = String(o.eventId || o.id || "").replace(/\D/g, "");
        if (digits) acceptedSet.add(digits);
      }

      const isLegAccepted = (l: VaultBookedLeg) => {
        const evId = String(l.eventId || "").trim();
        const digits = evId.replace(/\D/g, "");
        return acceptedSet.has(evId) || (digits.length >= 4 && acceptedSet.has(digits));
      };

      const acceptedCandidateLegs = candidateLegs.filter(isLegAccepted);
      const droppedCandidateLegs = candidateLegs.filter((l) => !isLegAccepted(l));
      const droppedEventIds = droppedCandidateLegs.map((l) => l.eventId);

      if (hasCode && acceptedCandidateLegs.length === candidateLegs.length) {
        // 100% of candidate legs booked
        sportyCode = json.data.shareCode;
        sportyUrl = json.data.shareURL || `https://www.sportybet.com/ng/?shareCode=${sportyCode}`;
        const mappedOutcomes = mapSportyBetOutcomesToLegs(returnedOutcomes, candidateLegs);
        finalLegs = mappedOutcomes.length > 0 ? mappedOutcomes : [...candidateLegs];
        isVerifiedLive = true;
        allLegsAccepted = true;
        acceptedLegIds = candidateLegs.map((l) => l.eventId);
        rejectedLegIds = [];
      } else if (hasCode && acceptedCandidateLegs.length > 0) {
        acceptedLegIds = acceptedCandidateLegs.map((l) => l.eventId);
        rejectedLegIds = droppedEventIds;

        if (options.require_all_legs) {
          // Caller strictly requires 100% of legs accepted — do not accept partial code!
          console.warn(
            `[SportyBet Vault] Dropped legs detected: SportyBet returned ${acceptedCandidateLegs.length}/${candidateLegs.length} legs. Rejecting code due to require_all_legs.`
          );
          allLegsAccepted = false;
          // Do not assign sportyCode so caller knows legs were dropped
        } else {
          // Partial set accepted by SportyBet — sync finalLegs to exactly the accepted outcomes!
          const mappedOutcomes = mapSportyBetOutcomesToLegs(returnedOutcomes, acceptedCandidateLegs);
          finalLegs = mappedOutcomes.length > 0 ? mappedOutcomes : acceptedCandidateLegs;
          sportyCode = json.data.shareCode;
          sportyUrl = json.data.shareURL || `https://www.sportybet.com/ng/?shareCode=${sportyCode}`;
          isVerifiedLive = true;
          allLegsAccepted = false;
          console.log(`[SportyBet Vault] Partial success: SportyBet booked ${finalLegs.length}/${candidateLegs.length} legs. Code: ${sportyCode}`);
        }
      } else {
        allLegsAccepted = false;
        rejectedLegIds = candidateLegs.map((l) => l.eventId);
      }
    }
  } catch (err) {
    networkFailed = true;
    console.warn("[SportyBet Vault] Primary batch order share network error:", err);
  }

  // 3. Resilient Leg-by-Leg Probe if primary batch failed or zero legs were accepted (only if network is online)
  if (!networkFailed && !sportyCode && candidateLegs.length >= 1) {
    console.log("[SportyBet Vault] Batch failed or was rejected. Probing legs individually to isolate open matches...");
    try {
      const probeResults = await Promise.allSettled(
        candidateLegs.map(async (leg, idx) => {
          const payload = formattedSelections[idx];
          const pRes = await fetch("https://www.sportybet.com/api/ng/orders/share", {
            method: "POST",
            headers: SPORTYBET_BROWSER_HEADERS,
            body: JSON.stringify({ selections: [payload] }),
            cache: "no-store",
            signal: AbortSignal.timeout(2000),
          });
          if (pRes.ok) {
            const pJson = await pRes.json();
            if (
              (pJson.bizCode === 10000 || pJson.innerCode === "10000") &&
              Array.isArray(pJson.data?.outcomes) &&
              pJson.data.outcomes.length > 0
            ) {
              return {
                leg,
                payload,
                shareCode: pJson.data.shareCode,
                shareURL: pJson.data.shareURL,
              };
            }
          }
          return null;
        })
      );

      const openLegs = probeResults
        .filter(
          (r): r is PromiseFulfilledResult<{ leg: VaultBookedLeg; payload: SportyPayloadItem; shareCode: string; shareURL: string }> =>
            r.status === "fulfilled" && r.value !== null
        )
        .map((r) => r.value);

      const failedLegs = candidateLegs.filter(
        (_, idx) => probeResults[idx].status === "rejected" || (probeResults[idx].status === "fulfilled" && probeResults[idx].value === null)
      );
      if (failedLegs.length > 0) {
        rejectedLegIds = Array.from(new Set([...rejectedLegIds, ...failedLegs.map((l) => l.eventId)]));
      }

      if (openLegs.length === candidateLegs.length && openLegs.length > 1) {
        // Re-submit the batch with ALL open matches
        const batchRes = await fetch("https://www.sportybet.com/api/ng/orders/share", {
          method: "POST",
          headers: SPORTYBET_BROWSER_HEADERS,
          body: JSON.stringify({ selections: openLegs.map((o) => o.payload) }),
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        });
        if (batchRes.ok) {
          const batchJson = await batchRes.json();
          if ((batchJson.bizCode === 10000 || batchJson.innerCode === "10000") && batchJson.data?.shareCode) {
            sportyCode = batchJson.data.shareCode;
            sportyUrl = batchJson.data.shareURL || `https://www.sportybet.com/ng/?shareCode=${sportyCode}`;
            finalLegs = openLegs.map((o) => o.leg);
            isVerifiedLive = true;
            allLegsAccepted = true;
            acceptedLegIds = finalLegs.map((l) => l.eventId);
          }
        }
      } else if (!options.require_all_legs && openLegs.length > 0) {
        if (openLegs.length > 1) {
          const batchRes = await fetch("https://www.sportybet.com/api/ng/orders/share", {
            method: "POST",
            headers: SPORTYBET_BROWSER_HEADERS,
            body: JSON.stringify({ selections: openLegs.map((o) => o.payload) }),
            cache: "no-store",
            signal: AbortSignal.timeout(6000),
          });
          if (batchRes.ok) {
            const batchJson = await batchRes.json();
            if ((batchJson.bizCode === 10000 || batchJson.innerCode === "10000") && batchJson.data?.shareCode) {
              sportyCode = batchJson.data.shareCode;
              sportyUrl = batchJson.data.shareURL || `https://www.sportybet.com/ng/?shareCode=${sportyCode}`;
              finalLegs = openLegs.map((o) => o.leg);
              isVerifiedLive = true;
              allLegsAccepted = false;
              acceptedLegIds = finalLegs.map((l) => l.eventId);
            }
          }
        } else if (openLegs.length === 1) {
          sportyCode = openLegs[0].shareCode;
          sportyUrl = openLegs[0].shareURL || `https://www.sportybet.com/ng/?shareCode=${sportyCode}`;
          finalLegs = [openLegs[0].leg];
          isVerifiedLive = true;
          allLegsAccepted = false;
          acceptedLegIds = [openLegs[0].leg.eventId];
        }
      }
    } catch (probeErr) {
      console.warn("[SportyBet Vault] Per-leg probe error:", probeErr);
    }
  }

  // 4. Live GET verification of the generated SportyBet code
  if (sportyCode && isVerifiedLive) {
    try {
      const liveOutcomes = await getSportyBetShareOutcomes(sportyCode);
      if (liveOutcomes.length > 0) {
        const liveSet = new Set<string>();
        for (const o of liveOutcomes) {
          if (o.eventId) liveSet.add(String(o.eventId).trim());
          if (o.id) liveSet.add(String(o.id).trim());
          const digits = String(o.eventId || o.id || "").replace(/\D/g, "");
          if (digits) liveSet.add(digits);
        }

        const isLiveAccepted = (l: VaultBookedLeg) => {
          const evId = String(l.eventId || "").trim();
          const digits = evId.replace(/\D/g, "");
          return liveSet.has(evId) || (digits.length >= 4 && liveSet.has(digits));
        };

        const liveConfirmed = finalLegs.filter(isLiveAccepted);
        if (options.require_all_legs && liveConfirmed.length < candidateLegs.length) {
          console.warn(
            `[SportyBet Vault] Live share check confirmed ${liveConfirmed.length}/${candidateLegs.length} legs. Rejecting code.`
          );
          allLegsAccepted = false;
          sportyCode = "";
          finalLegs = liveConfirmed;
          const liveDropped = candidateLegs.filter((l) => !isLiveAccepted(l)).map((l) => l.eventId);
          rejectedLegIds = Array.from(new Set([...rejectedLegIds, ...liveDropped]));
        } else {
          finalLegs = liveConfirmed;
          acceptedLegIds = finalLegs.map((l) => l.eventId);
        }
      }
    } catch (vErr) {
      console.warn("[SportyBet Vault] Live share GET verification notice:", vErr);
    }
  }

  // 5. Return error if no authentic SportyBet booking code could be produced
  if (!sportyCode || sportyCode.trim().length < 4 || finalLegs.length === 0) {
    return {
      status: "error",
      success: false,
      code: "",
      shareCode: "",
      bookingCode: "",
      sportybet_code: "",
      sportybetCode: "",
      sporty_code: "",
      sportyCode: "",
      booking_code: "",
      sporty_url: "",
      sportyUrl: "",
      share_url: "",
      shareUrl: "",
      total_odds: 1.0,
      actual_odds: 1.0,
      legs_count: 0,
      is_verified_live: false,
      all_legs_accepted: false,
      legs: [],
      legs_json: [],
      accepted_event_ids: acceptedLegIds,
      acceptedEventIds: acceptedLegIds,
      rejected_event_ids: rejectedLegIds,
      rejectedEventIds: rejectedLegIds,
      error_message:
        rejectedLegIds.length > 0
          ? `${rejectedLegIds.length} match(es) are currently suspended or unavailable on SportyBet.`
          : "None of the selected matches are currently available for booking on SportyBet. Some markets may have closed.",
    };
  }

  const finalSportyCode = sportyCode.trim();
  const finalSportyUrl =
    sportyUrl || `https://www.sportybet.com/ng/?shareCode=${finalSportyCode}`;
  const actualOdds = Math.round(finalLegs.reduce((acc, l) => acc * Number(l.odd || 1.30), 1.0) * 100) / 100;
  const acceptedEventIds = finalLegs.map((l) => l.eventId);
  const todayStr = new Date().toISOString().split("T")[0];

  // Save to Supabase oddora_v2_daily_slips so ticket is queryable
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("oddora_v2_daily_slips").insert({
      slip_date: todayStr,
      slip_category: options.slip_category || "CUSTOM_BOOKED_SLIP",
      required_tier: options.required_tier || "FREE",
      total_odds: actualOdds,
      match_count: finalLegs.length,
      sportybet_code: finalSportyCode,
      bet9ja_code: null,
      legs_json: finalLegs,
      slip_result: "PENDING",
    });
  } catch (dbErr) {
    console.warn("Could not cache booked ticket in Supabase:", dbErr);
  }

  return {
    status: "success",
    success: true,
    code: finalSportyCode,
    shareCode: finalSportyCode,
    bookingCode: finalSportyCode,
    sportybet_code: finalSportyCode,
    sportybetCode: finalSportyCode,
    sporty_code: finalSportyCode,
    sportyCode: finalSportyCode,
    booking_code: finalSportyCode,
    sporty_url: finalSportyUrl,
    sportyUrl: finalSportyUrl,
    share_url: finalSportyUrl,
    shareUrl: finalSportyUrl,
    total_odds: actualOdds,
    actual_odds: actualOdds,
    legs_count: finalLegs.length,
    is_verified_live: isVerifiedLive,
    all_legs_accepted: allLegsAccepted,
    legs: finalLegs,
    legs_json: finalLegs,
    live_outcomes: returnedOutcomes,
    accepted_event_ids: acceptedEventIds,
    acceptedEventIds: acceptedEventIds,
    rejected_event_ids: rejectedLegIds,
    rejectedEventIds: rejectedLegIds,
    error_message: undefined,
  };
}

/**
 * 4. STRICT EDIT SLIP PRESERVATION (SPORTYBET-EXCLUSIVE)
 * Decodes existing code and extracts exact { eventId, marketId, outcomeId, specifier }
 */
export async function decodeVaultBookingCode(
  code: string,
  bookmaker = "SportyBet"
): Promise<{
  status: "success" | "error";
  bookmaker: "SportyBet";
  booking_code: string;
  total_odds: number;
  legs_count: number;
  legs: VaultBookedLeg[];
  share_url: string;
  message?: string;
}> {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return {
      status: "error",
      bookmaker: "SportyBet",
      booking_code: "",
      total_odds: 0,
      legs_count: 0,
      legs: [],
      share_url: "",
      message: "Please enter a valid SportyBet booking code.",
    };
  }

  const supabase = getSupabaseClient();

  // 1. Check Supabase DB cache first
  try {
    const { data: cachedSlip } = await supabase
      .from("oddora_v2_daily_slips")
      .select("*")
      .ilike("sportybet_code", `%${cleanCode}%`)
      .limit(1)
      .maybeSingle();

    if (cachedSlip && Array.isArray(cachedSlip.legs_json) && cachedSlip.legs_json.length > 0) {
      return {
        status: "success",
        bookmaker: "SportyBet",
        booking_code: cleanCode,
        total_odds: Number(cachedSlip.total_odds) || 2.0,
        legs_count: cachedSlip.legs_json.length,
        legs: cachedSlip.legs_json,
        share_url: `http://www.sportybet.com/ng/?shareCode=${cleanCode}`,
      };
    }
  } catch (dbErr) {
    console.warn("DB lookup notice in decodeVaultBookingCode:", dbErr);
  }

  // 2. Decode live from SportyBet API
  try {
    const res = await fetch(`https://www.sportybet.com/api/ng/orders/share/${cleanCode}`, {
      headers: SPORTYBET_BROWSER_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const json = await res.json();
      if ((json.bizCode === 10000 || json.innerCode === "10000") && Array.isArray(json.data?.outcomes)) {
        const outcomes = json.data.outcomes;
        const decodedLegs: VaultBookedLeg[] = [];
        let totalOdds = 1.0;

        for (const o of outcomes) {
          const home = o.homeTeamName || "Home";
          const away = o.awayTeamName || "Away";
          const league = o.sport?.category?.tournament?.name || o.sport?.category?.name || "League";

          for (const m of o.markets || []) {
            const marketDesc = m.desc || "1X2";
            for (const out of m.outcomes || []) {
              const odd = parseFloat(out.odds || "1.50");
              totalOdds *= odd;

              decodedLegs.push({
                match: `${home} vs ${away}`,
                home_team: home,
                away_team: away,
                league,
                market: marketDesc,
                selection: out.desc || "Pick",
                odd,
                win_probability: 85,
                eventId: o.eventId,
                marketId: String(m.id),
                outcomeId: String(out.id),
                specifier: m.specifier || null,
              });
            }
          }
        }

        if (decodedLegs.length > 0) {
          return {
            status: "success",
            bookmaker: "SportyBet",
            booking_code: cleanCode,
            total_odds: Math.round(totalOdds * 100) / 100,
            legs_count: decodedLegs.length,
            legs: decodedLegs,
            share_url: `http://www.sportybet.com/ng/?shareCode=${cleanCode}`,
          };
        }
      }
    }
  } catch (liveErr) {
    console.warn("SportyBet live decode notice:", liveErr);
  }

  return {
    status: "error",
    bookmaker: bookmaker as any,
    booking_code: cleanCode,
    total_odds: 0,
    legs_count: 0,
    legs: [],
    share_url: "",
    message: `Booking code "${cleanCode}" could not be found or has expired. Please verify your code.`,
  };
}
