/**
 * Engine 4: 4-Mode Edit Game Engine (src/lib/engines/engine4_editSlip.ts)
 *
 * Responsibilities:
 * 1. Decodes SportyBet or Bet9ja booking codes (via live SportyBet API or persistent Supabase registry).
 * 2. Executes 4 distinct pruning & structuring modes:
 *    - Mode 1 (SPLIT_TICKET): Splits ticket into N separate smaller tickets with verified booking codes for each.
 *    - Mode 2 (LOWEST_PROBABILITY): Uses Sport Brains to identify & prune the remove_count lowest-probability legs.
 *    - Mode 3 (RANDOM_TRIM): Randomly removes remove_count legs from the accumulator.
 *    - Mode 4 (COMBO_HYBRID): Trims both high-risk big odds and low-value small odds.
 * 3. Re-books all surviving and split slips with verified SportyBet & Bet9ja booking codes.
 */

import { decodeAnyBookingCode, bookUniversalSlip, BookedLeg } from "./bookingEngine";
import { pruneLegsByStatisticalRisk } from "../apiFootballStatsBrain";

export type EditSlipMode =
  | "SPLIT_TICKET"
  | "LOWEST_PROBABILITY"
  | "RANDOM_TRIM"
  | "COMBO_HYBRID";

export interface EditSlipRequest {
  booking_code: string;
  bookmaker?: "SportyBet" | "Bet9ja";
  mode: EditSlipMode;
  remove_count?: number; // For Modes 2, 3, 4 (e.g. 2, 3, 5, 10)
  split_parts?: number; // For Mode 1 (e.g. 2, 3, 4, 5)
}

export interface EditedSlipPayload {
  slip_index?: number;
  booking_code: string;
  sporty_code: string;
  bet9ja_code: string;
  share_url: string;
  total_odds: number;
  legs_count: number;
  surviving_legs: BookedLeg[];
  pruned_legs?: BookedLeg[];
}

export interface EditSlipResponse {
  original_code: string;
  original_legs_count: number;
  original_total_odds: number;
  mode: EditSlipMode;
  is_split: boolean;
  slips: EditedSlipPayload[];
  summary_message: string;
}

export async function executeEditSlip(
  req: EditSlipRequest
): Promise<EditSlipResponse> {
  const code = (req.booking_code || "").trim();
  if (!code) {
    throw new Error("Missing booking_code parameter.");
  }

  // 1. Decode original booking code using Universal Booking Engine
  const decoded = await decodeAnyBookingCode(code, req.bookmaker || "SportyBet");
  if (decoded.status === "error" || !decoded.legs || decoded.legs.length === 0) {
    throw new Error(decoded.message || `Failed to decode booking code: ${code}`);
  }

  const originalLegs = [...decoded.legs];
  const originalOdds = decoded.total_odds;
  const originalCount = originalLegs.length;

  // MODE 1: SPLIT_TICKET
  if (req.mode === "SPLIT_TICKET") {
    const partsCount = Math.max(2, Math.min(5, Number(req.split_parts) || 2));
    const chunkSize = Math.ceil(originalLegs.length / partsCount);
    const splitChunks: BookedLeg[][] = [];

    for (let i = 0; i < originalLegs.length; i += chunkSize) {
      splitChunks.push(originalLegs.slice(i, i + chunkSize));
    }

    const outputSlips: EditedSlipPayload[] = [];

    for (let idx = 0; idx < splitChunks.length; idx++) {
      const chunk = splitChunks[idx];
      const chunkOdds =
        Math.round(chunk.reduce((acc, l) => acc * l.odd, 1.0) * 100) / 100;

      // Book each split chunk with a real verified booking code
      const bookedChunk = await bookUniversalSlip(chunk, {
        slip_category: `SPLIT_TICKET_PART_${idx + 1}`,
      });

      const sportyCode = bookedChunk.sportybet_code;
      const bet9jaCode = bookedChunk.bet9ja_code;
      const primaryCode = req.bookmaker === "Bet9ja" ? bet9jaCode : sportyCode;
      const shareUrl = req.bookmaker === "Bet9ja" ? bookedChunk.bet9ja_url : bookedChunk.sporty_url;

      outputSlips.push({
        slip_index: idx + 1,
        booking_code: primaryCode,
        sporty_code: sportyCode,
        bet9ja_code: bet9jaCode,
        share_url: shareUrl,
        total_odds: chunkOdds,
        legs_count: chunk.length,
        surviving_legs: chunk,
      });
    }

    return {
      original_code: code,
      original_legs_count: originalCount,
      original_total_odds: originalOdds,
      mode: "SPLIT_TICKET",
      is_split: true,
      slips: outputSlips,
      summary_message: `Successfully split ${originalCount} matches into ${outputSlips.length} balanced tickets with verified booking codes.`,
    };
  }

  // MODES 2, 3, 4: PRUNING (Using API-Football Statistical Risk Brain)
  const maxRemovable = Math.max(1, originalLegs.length - 2); // Keep at least 2 legs
  const removeCount = Math.min(maxRemovable, Math.max(1, Number(req.remove_count) || 2));

  const pruneResult = pruneLegsByStatisticalRisk(
    originalLegs,
    req.mode as any,
    removeCount,
    req.split_parts || 2
  );

  let surviving: BookedLeg[] = pruneResult.surviving as BookedLeg[];
  let pruned: BookedLeg[] = (pruneResult.pruned || []) as BookedLeg[];

  // Ensure surviving has at least 2 legs
  if (surviving.length < 2) {
    surviving = originalLegs.slice(0, 2);
    pruned = originalLegs.slice(2);
  }

  const newOdds = Math.round(surviving.reduce((acc, l) => acc * l.odd, 1.0) * 100) / 100;

  // Book the surviving legs into a real booking code
  const bookedSurviving = await bookUniversalSlip(surviving, {
    slip_category: "PRUNED_SLIP",
  });

  const sportyCode = bookedSurviving.sportybet_code;
  const bet9jaCode = bookedSurviving.bet9ja_code;
  const primaryCode = req.bookmaker === "Bet9ja" ? bet9jaCode : sportyCode;
  const shareUrl = req.bookmaker === "Bet9ja" ? bookedSurviving.bet9ja_url : bookedSurviving.sporty_url;

  return {
    original_code: code,
    original_legs_count: originalCount,
    original_total_odds: originalOdds,
    mode: req.mode,
    is_split: false,
    slips: [
      {
        booking_code: primaryCode,
        sporty_code: sportyCode,
        bet9ja_code: bet9jaCode,
        share_url: shareUrl,
        total_odds: newOdds,
        legs_count: surviving.length,
        surviving_legs: surviving,
        pruned_legs: pruned,
      },
    ],
    summary_message: `Removed ${pruned.length} risky/redundant games. Surviving ticket re-booked at ${newOdds}x odds with working codes.`,
  };
}
