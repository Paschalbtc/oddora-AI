/**
 * Ticket Grader Utility (src/lib/ticketGrader.ts)
 *
 * Accurate Multi-Sport Result Parsing & Leg Status Grading:
 * - Football: 1X2, Double Chance, Over/Under, BTTS, Draw No Bet (DNB), Clean Sheet, WEH, Score Clusters, Asian Handicap.
 * - Basketball: Full Match Points (inc. OT), Q1-Q4 Quarters, 1st Half Moneyline, Total Points, Spreads.
 * - Volleyball & Table Tennis: Official set scores (e.g. 3-1, 3-2), Set Winner, Over 3.5 Sets, +1.5/+2.5 Set Handicaps, Total Points.
 * - Status Mapping:
 *     NS / SCHEDULED -> Upcoming
 *     LIVE / IN_PLAY -> Live
 *     FT / FINISHED -> Finished
 *     POSTPONED / CANCELLED -> Void
 * - Leg Grading: WON, LOST, VOID, or PENDING.
 * - Ticket Status: WON only if 100% WON/VOID; LOST immediately if any 1 leg LOST; PENDING while active/upcoming.
 */

import {
  gradeLegOutcome,
  normalizeMatchStatus,
  parseRawSportScore,
  ParsedSportScore,
  LegToGrade as BaseLegToGrade,
  LegGradingResult as BaseLegGradingResult,
} from "./gradeSlipOutcome";

export type MappedMatchStatus = "Upcoming" | "Live" | "Finished" | "Void";

export type LegToGrade = BaseLegToGrade;
export type LegGradingResult = BaseLegGradingResult;

export { gradeLegOutcome, parseRawSportScore, normalizeMatchStatus };
export type { ParsedSportScore };

/**
 * Explicitly maps match statuses into canonical stages:
 * NS / SCHEDULED -> "Upcoming"
 * LIVE / IN_PLAY -> "Live"
 * FT / FINISHED -> "Finished"
 * POSTPONED / CANCELLED -> "Void"
 */
export function mapMatchStatus(status?: string | boolean | null): MappedMatchStatus {
  return normalizeMatchStatus(status);
}

/**
 * Multi-sport leg evaluator
 * Delegates to the unified gradeLegOutcome engine for basketball, volleyball, table tennis & football
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

  return gradeLegOutcome(leg, homeScore, awayScore, matchStatusStr);
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
