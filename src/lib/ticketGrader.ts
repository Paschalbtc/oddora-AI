/**
 * Ticket Grader Utility (src/lib/ticketGrader.ts)
 *
 * Accurate Multi-Sport Result Parsing & Leg Status Grading:
 * - Football: 1X2, Double Chance, Over/Under, BTTS, Draw No Bet (DNB), Clean Sheet.
 * - Basketball: Official final score (inc. OT) against Moneyline, Spread, Total Points.
 * - Table Tennis & Volleyball: Official set scores (e.g. 3-1, 3-2), Set Winner, Total Sets (O/U 3.5), Set Handicaps.
 * - Status Mapping:
 *     NS / SCHEDULED -> Upcoming
 *     LIVE / IN_PLAY -> Live
 *     FT / FINISHED -> Finished
 *     POSTPONED / CANCELLED -> Void
 * - Leg Grading: WON, LOST, VOID, or PENDING.
 * - Ticket Status: WON only if 100% WON/VOID; LOST immediately if any 1 leg LOST; PENDING while active/upcoming.
 */

export type MappedMatchStatus = "Upcoming" | "Live" | "Finished" | "Void";

export interface LegToGrade {
  match: string;
  home_team?: string;
  away_team?: string;
  market: string;
  selection: string;
  odd: number;
  sport?: string;
  sport_type?: string;
  status?: "PENDING" | "WON" | "LOST" | "VOID";
  home_score?: number | null;
  away_score?: number | null;
  eventId?: string;
}

export interface LegGradingResult {
  status: "PENDING" | "WON" | "LOST" | "VOID";
  home_score: number | null;
  away_score: number | null;
}

/**
 * Explicitly maps match statuses into canonical stages:
 * NS / SCHEDULED -> "Upcoming"
 * LIVE / IN_PLAY -> "Live"
 * FT / FINISHED -> "Finished"
 * POSTPONED / CANCELLED -> "Void"
 */
export function mapMatchStatus(status?: string | null): MappedMatchStatus {
  if (!status) return "Upcoming";
  const s = status.trim().toUpperCase();

  // 1. Void / Postponed / Cancelled
  if (
    s === "POSTPONED" ||
    s === "CANCELLED" ||
    s === "CANC" ||
    s === "POSTP" ||
    s === "VOID" ||
    s === "ABANDONED" ||
    s === "SUSPENDED" ||
    s === "INTERRUPTED"
  ) {
    return "Void";
  }

  // 2. Finished
  if (
    s === "FT" ||
    s === "FINISHED" ||
    s === "AET" ||
    s === "AP" ||
    s === "ENDED" ||
    s === "FINAL"
  ) {
    return "Finished";
  }

  // 3. Live / In Play
  if (
    s === "LIVE" ||
    s === "IN_PLAY" ||
    s === "1H" ||
    s === "2H" ||
    s === "HT" ||
    s === "ET" ||
    s === "P" ||
    s.startsWith("Q") || // Q1, Q2, Q3, Q4
    s.startsWith("SET") // SET1, SET2, SET3, etc.
  ) {
    return "Live";
  }

  // 4. Upcoming / Scheduled
  return "Upcoming";
}

/**
 * Multi-sport leg evaluator
 */
export function gradeMatchLeg(
  leg: LegToGrade,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  rawStatus?: string | boolean
): LegGradingResult {
  const matchStatusStr =
    typeof rawStatus === "boolean"
      ? rawStatus
        ? "FT"
        : "LIVE"
      : rawStatus || "FT";

  const mappedStatus = mapMatchStatus(matchStatusStr);

  // 1. Postponed or Cancelled -> Mark leg VOID
  if (mappedStatus === "Void") {
    return {
      status: "VOID",
      home_score: homeScore ?? null,
      away_score: awayScore ?? null,
    };
  }

  // 2. Upcoming or Live -> Mark leg PENDING
  if (mappedStatus === "Upcoming" || mappedStatus === "Live") {
    return {
      status: "PENDING",
      home_score: homeScore ?? null,
      away_score: awayScore ?? null,
    };
  }

  // If score is missing for finished match, maintain current or pending
  if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) {
    return {
      status: leg.status || "PENDING",
      home_score: null,
      away_score: null,
    };
  }

  const h = Number(homeScore);
  const a = Number(awayScore);
  const sport = (leg.sport || leg.sport_type || "FOOTBALL").toUpperCase().trim();
  const sel = (leg.selection || "").trim().toLowerCase();
  const mkt = (leg.market || "").trim().toLowerCase();

  // --------------------------------------------------------------------------
  // SPORT 1: BASKETBALL
  // --------------------------------------------------------------------------
  if (sport === "BASKETBALL") {
    const totalPoints = h + a;

    // Moneyline / Match Winner
    if (sel === "1" || sel === "home" || sel.includes("home win") || sel === (leg.home_team || "").toLowerCase()) {
      return { status: h > a ? "WON" : "LOST", home_score: h, away_score: a };
    }
    if (sel === "2" || sel === "away" || sel.includes("away win") || sel === (leg.away_team || "").toLowerCase()) {
      return { status: a > h ? "WON" : "LOST", home_score: h, away_score: a };
    }

    // Total Points (Over / Under)
    const pointsMatch = sel.match(/(\d+\.?\d*)/);
    if (sel.includes("over") && pointsMatch) {
      const line = parseFloat(pointsMatch[1]);
      return { status: totalPoints > line ? "WON" : "LOST", home_score: h, away_score: a };
    }
    if (sel.includes("under") && pointsMatch) {
      const line = parseFloat(pointsMatch[1]);
      return { status: totalPoints < line ? "WON" : "LOST", home_score: h, away_score: a };
    }

    // Point Spread / Handicap
    const spreadMatch = sel.match(/([+-]?\d+\.?\d*)/);
    if (spreadMatch && (sel.includes("+") || sel.includes("-"))) {
      const spreadVal = parseFloat(spreadMatch[1]);
      const isHome = sel.includes("home") || sel.includes("1") || sel.includes((leg.home_team || "").toLowerCase());
      if (isHome) {
        return { status: h + spreadVal > a ? "WON" : "LOST", home_score: h, away_score: a };
      } else {
        return { status: a + spreadVal > h ? "WON" : "LOST", home_score: h, away_score: a };
      }
    }

    return { status: h > a ? "WON" : "LOST", home_score: h, away_score: a };
  }

  // --------------------------------------------------------------------------
  // SPORT 2 & 3: TABLE TENNIS & VOLLEYBALL (SET-BASED EVALUATION)
  // --------------------------------------------------------------------------
  if (sport === "TABLE_TENNIS" || sport === "VOLLEYBALL" || sport === "TENNIS") {
    const hSets = h;
    const aSets = a;
    const totalSets = hSets + aSets;

    // Match Winner / Set Winner
    if (sel === "1" || sel === "home" || sel.includes("home win") || sel === (leg.home_team || "").toLowerCase()) {
      return { status: hSets > aSets ? "WON" : "LOST", home_score: h, away_score: a };
    }
    if (sel === "2" || sel === "away" || sel.includes("away win") || sel === (leg.away_team || "").toLowerCase()) {
      return { status: aSets > hSets ? "WON" : "LOST", home_score: h, away_score: a };
    }

    // Total Sets (Over / Under 3.5, 4.5)
    if (sel.includes("over 3.5") || (mkt.includes("3.5") && sel.includes("over"))) {
      return { status: totalSets >= 4 ? "WON" : "LOST", home_score: h, away_score: a };
    }
    if (sel.includes("under 3.5") || (mkt.includes("3.5") && sel.includes("under"))) {
      return { status: totalSets <= 3 ? "WON" : "LOST", home_score: h, away_score: a };
    }
    if (sel.includes("over 4.5") || (mkt.includes("4.5") && sel.includes("over"))) {
      return { status: totalSets >= 5 ? "WON" : "LOST", home_score: h, away_score: a };
    }
    if (sel.includes("under 4.5") || (mkt.includes("4.5") && sel.includes("under"))) {
      return { status: totalSets <= 4 ? "WON" : "LOST", home_score: h, away_score: a };
    }

    // Set Handicap (e.g. -1.5, +1.5)
    const setSpreadMatch = sel.match(/([+-]?\d+\.?\d*)/);
    if (setSpreadMatch && (sel.includes("+") || sel.includes("-"))) {
      const spreadVal = parseFloat(setSpreadMatch[1]);
      const isHome = sel.includes("home") || sel.includes("1") || sel.includes((leg.home_team || "").toLowerCase());
      if (isHome) {
        return { status: hSets + spreadVal > aSets ? "WON" : "LOST", home_score: h, away_score: a };
      } else {
        return { status: aSets + spreadVal > hSets ? "WON" : "LOST", home_score: h, away_score: a };
      }
    }

    return { status: hSets > aSets ? "WON" : "LOST", home_score: h, away_score: a };
  }

  // --------------------------------------------------------------------------
  // SPORT 4: FOOTBALL
  // --------------------------------------------------------------------------
  const totalGoals = h + a;

  // 1. 1X2 / Match Result
  if (
    sel === "1" ||
    sel === "home" ||
    sel.startsWith("home win") ||
    sel === (leg.home_team || "").toLowerCase()
  ) {
    return { status: h > a ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel === "x" || sel === "draw") {
    return { status: h === a ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (
    sel === "2" ||
    sel === "away" ||
    sel.startsWith("away win") ||
    sel === (leg.away_team || "").toLowerCase()
  ) {
    return { status: a > h ? "WON" : "LOST", home_score: h, away_score: a };
  }

  // 2. Double Chance
  if (sel === "1x" || sel === "home or draw" || sel === "1/x") {
    return { status: h >= a ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel === "x2" || sel === "draw or away" || sel === "x/2") {
    return { status: a >= h ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel === "12" || sel === "home or away" || sel === "1/2") {
    return { status: h !== a ? "WON" : "LOST", home_score: h, away_score: a };
  }

  // 3. Over / Under Goals
  if (sel.includes("over 0.5") || (mkt.includes("0.5") && sel.includes("over"))) {
    return { status: totalGoals >= 1 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("under 0.5") || (mkt.includes("0.5") && sel.includes("under"))) {
    return { status: totalGoals === 0 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("over 1.5") || (mkt.includes("1.5") && sel.includes("over"))) {
    return { status: totalGoals >= 2 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("under 1.5") || (mkt.includes("1.5") && sel.includes("under"))) {
    return { status: totalGoals <= 1 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("over 2.5") || (mkt.includes("2.5") && sel.includes("over"))) {
    return { status: totalGoals >= 3 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("under 2.5") || (mkt.includes("2.5") && sel.includes("under"))) {
    return { status: totalGoals <= 2 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("over 3.5") || (mkt.includes("3.5") && sel.includes("over"))) {
    return { status: totalGoals >= 4 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("under 3.5") || (mkt.includes("3.5") && sel.includes("under"))) {
    return { status: totalGoals <= 3 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("over 4.5") || (mkt.includes("4.5") && sel.includes("over"))) {
    return { status: totalGoals >= 5 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("under 4.5") || (mkt.includes("4.5") && sel.includes("under"))) {
    return { status: totalGoals <= 4 ? "WON" : "LOST", home_score: h, away_score: a };
  }

  // 4. Both Teams to Score (BTTS)
  if (sel.includes("btts yes") || sel === "yes" || sel === "gg") {
    return { status: h > 0 && a > 0 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("btts no") || sel === "no" || sel === "ng") {
    return { status: h === 0 || a === 0 ? "WON" : "LOST", home_score: h, away_score: a };
  }

  // 5. Draw No Bet (DNB)
  if (sel.includes("home dnb") || (mkt.includes("dnb") && (sel.includes("home") || sel === "1"))) {
    if (h > a) return { status: "WON", home_score: h, away_score: a };
    if (h === a) return { status: "VOID", home_score: h, away_score: a }; // Push/void on draw
    return { status: "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("away dnb") || (mkt.includes("dnb") && (sel.includes("away") || sel === "2"))) {
    if (a > h) return { status: "WON", home_score: h, away_score: a };
    if (a === h) return { status: "VOID", home_score: h, away_score: a }; // Push/void on draw
    return { status: "LOST", home_score: h, away_score: a };
  }

  // 6. Clean Sheet
  if (sel.includes("home clean sheet") || (mkt.includes("clean sheet") && sel.includes("home"))) {
    return { status: a === 0 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("away clean sheet") || (mkt.includes("clean sheet") && sel.includes("away"))) {
    return { status: h === 0 ? "WON" : "LOST", home_score: h, away_score: a };
  }

  // 7. Team Total Goals
  if (sel.includes("home over 0.5") || sel.includes("home team over 0.5")) {
    return { status: h >= 1 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("away over 0.5") || sel.includes("away team over 0.5")) {
    return { status: a >= 1 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("home over 1.5")) {
    return { status: h >= 2 ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("away over 1.5")) {
    return { status: a >= 2 ? "WON" : "LOST", home_score: h, away_score: a };
  }

  // 8. Asian Handicap / Spread
  if (sel.includes("+1.5") || sel.includes("+1")) {
    const isHome = sel.includes("home") || sel.includes("1");
    const won = isHome ? h + 1.5 > a : a + 1.5 > h;
    return { status: won ? "WON" : "LOST", home_score: h, away_score: a };
  }
  if (sel.includes("-1.5") || sel.includes("-1")) {
    const isHome = sel.includes("home") || sel.includes("1");
    const won = isHome ? h - 1.5 > a : a - 1.5 > h;
    return { status: won ? "WON" : "LOST", home_score: h, away_score: a };
  }

  // Default fallback for finished match
  return { status: h > a ? "WON" : "LOST", home_score: h, away_score: a };
}

/**
 * Ticket Status:
 * - A ticket is only marked WON if 100% of legs are WON (or VOID).
 * - If any single leg is LOST, the ticket immediately updates to LOST.
 * - While games are active or upcoming, keep the ticket strictly PENDING.
 */
export function gradeEntireTicket(
  legs: Array<{ status?: "PENDING" | "WON" | "LOST" | "VOID" }>
): "PENDING" | "WON" | "LOST" {
  if (!legs || legs.length === 0) return "PENDING";

  // 1. If any single leg is LOST, ticket is immediately LOST
  if (legs.some((l) => l.status === "LOST")) {
    return "LOST";
  }

  // 2. While any game is active or upcoming (PENDING), ticket is strictly PENDING
  if (legs.some((l) => l.status === "PENDING" || !l.status)) {
    return "PENDING";
  }

  // 3. Ticket is WON only if 100% of legs are WON or VOID
  if (legs.every((l) => l.status === "WON" || l.status === "VOID")) {
    return "WON";
  }

  return "PENDING";
}
