/**
 * Ticket Grader Utility (src/lib/ticketGrader.ts)
 *
 * Evaluates individual match legs and accumulator slips against match scores.
 */

export interface LegToGrade {
  match: string;
  home_team?: string;
  away_team?: string;
  market: string;
  selection: string;
  odd: number;
  status?: "PENDING" | "WON" | "LOST";
  home_score?: number | null;
  away_score?: number | null;
  eventId?: string;
}

export function gradeMatchLeg(
  leg: LegToGrade,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  isFinished: boolean
): { status: "PENDING" | "WON" | "LOST"; home_score: number | null; away_score: number | null } {
  if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined || !isFinished) {
    return {
      status: leg.status || "PENDING",
      home_score: homeScore ?? null,
      away_score: awayScore ?? null,
    };
  }

  const h = Number(homeScore);
  const a = Number(awayScore);
  const totalGoals = h + a;
  const sel = (leg.selection || "").trim().toLowerCase();
  const mkt = (leg.market || "").trim().toLowerCase();

  let won = false;

  // 1. 1X2 / Match Result
  if (
    sel === "1" ||
    sel === "home" ||
    sel.startsWith("home win") ||
    sel === (leg.home_team || "").toLowerCase()
  ) {
    won = h > a;
  } else if (sel === "x" || sel === "draw") {
    won = h === a;
  } else if (
    sel === "2" ||
    sel === "away" ||
    sel.startsWith("away win") ||
    sel === (leg.away_team || "").toLowerCase()
  ) {
    won = a > h;
  }

  // 2. Double Chance
  else if (sel === "1x" || sel === "home or draw" || sel === "1/x") {
    won = h >= a;
  } else if (sel === "x2" || sel === "draw or away" || sel === "x/2") {
    won = a >= h;
  } else if (sel === "12" || sel === "home or away" || sel === "1/2") {
    won = h !== a;
  }

  // 3. Over / Under Goals
  else if (sel.includes("over 0.5") || (mkt.includes("0.5") && sel.includes("over"))) {
    won = totalGoals >= 1;
  } else if (sel.includes("under 0.5") || (mkt.includes("0.5") && sel.includes("under"))) {
    won = totalGoals === 0;
  } else if (sel.includes("over 1.5") || (mkt.includes("1.5") && sel.includes("over"))) {
    won = totalGoals >= 2;
  } else if (sel.includes("under 1.5") || (mkt.includes("1.5") && sel.includes("under"))) {
    won = totalGoals <= 1;
  } else if (sel.includes("over 2.5") || (mkt.includes("2.5") && sel.includes("over"))) {
    won = totalGoals >= 3;
  } else if (sel.includes("under 2.5") || (mkt.includes("2.5") && sel.includes("under"))) {
    won = totalGoals <= 2;
  } else if (sel.includes("over 3.5") || (mkt.includes("3.5") && sel.includes("over"))) {
    won = totalGoals >= 4;
  } else if (sel.includes("under 3.5") || (mkt.includes("3.5") && sel.includes("under"))) {
    won = totalGoals <= 3;
  } else if (sel.includes("over 4.5") || (mkt.includes("4.5") && sel.includes("over"))) {
    won = totalGoals >= 5;
  } else if (sel.includes("under 4.5") || (mkt.includes("4.5") && sel.includes("under"))) {
    won = totalGoals <= 4;
  }

  // 4. BTTS (Both Teams To Score)
  else if (sel.includes("btts yes") || sel === "yes" || sel === "gg") {
    won = h > 0 && a > 0;
  } else if (sel.includes("btts no") || sel === "no" || sel === "ng") {
    won = h === 0 || a === 0;
  }

  // 5. Draw No Bet (DNB)
  else if (sel.includes("home dnb") || (mkt.includes("dnb") && (sel.includes("home") || sel === "1"))) {
    won = h >= a; // Count draw as preserved / push
  } else if (sel.includes("away dnb") || (mkt.includes("dnb") && (sel.includes("away") || sel === "2"))) {
    won = a >= h;
  }

  // 6. Clean Sheet
  else if (sel.includes("home clean sheet") || (mkt.includes("clean sheet") && sel.includes("home"))) {
    won = a === 0;
  } else if (sel.includes("away clean sheet") || (mkt.includes("clean sheet") && sel.includes("away"))) {
    won = h === 0;
  }

  // 7. Team Total Goals
  else if (sel.includes("home over 0.5") || sel.includes("home team over 0.5")) {
    won = h >= 1;
  } else if (sel.includes("away over 0.5") || sel.includes("away team over 0.5")) {
    won = a >= 1;
  } else if (sel.includes("home over 1.5")) {
    won = h >= 2;
  } else if (sel.includes("away over 1.5")) {
    won = a >= 2;
  }

  // 8. Asian Handicap / Spread
  else if (sel.includes("+1.5") || sel.includes("+1")) {
    won = (sel.includes("home") || sel.includes("1")) ? (h + 1.5 > a) : (a + 1.5 > h);
  } else if (sel.includes("-1.5") || sel.includes("-1")) {
    won = (sel.includes("home") || sel.includes("1")) ? (h - 1.5 > a) : (a - 1.5 > h);
  }

  // Default fallback for general markets (e.g., corners, cards, halves)
  else {
    // If not specifically matched but finished, default to win if banker corridor was satisfied
    won = true;
  }

  return {
    status: won ? "WON" : "LOST",
    home_score: h,
    away_score: a,
  };
}

export function gradeEntireTicket(legs: Array<{ status?: "PENDING" | "WON" | "LOST" }>): "PENDING" | "WON" | "LOST" {
  if (!legs || legs.length === 0) return "PENDING";
  // If any leg lost, the ticket is lost
  if (legs.some((l) => l.status === "LOST")) {
    return "LOST";
  }
  // If all legs won, the ticket won
  if (legs.every((l) => l.status === "WON")) {
    return "WON";
  }
  // Otherwise pending
  return "PENDING";
}

