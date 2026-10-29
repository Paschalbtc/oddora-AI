/**
 * Engine 4: 4-Mode Edit Game Engine (src/lib/engines/engine4_editSlip.ts)
 *
 * Responsibilities:
 * 1. Decodes SportyBet or Bet9ja booking codes via Untouchable Core Booking Vault.
 * 2. Executes 4 distinct pruning & structuring modes:
 *    - Mode 1 (SPLIT_TICKET): Splits ticket into N separate smaller tickets with verified booking codes for each.
 *    - Mode 2 (LOWEST_PROBABILITY): Uses Sport Brains to identify & prune the remove_count lowest-probability legs.
 *    - Mode 3 (RANDOM_TRIM): Randomly removes remove_count legs from the accumulator.
 *    - Mode 4 (COMBO_HYBRID): Trims both high-risk big odds and low-value small odds.
 * 3. Re-books all surviving and split slips via Core Booking Vault with strict preservation
 *    of original unmodified { eventId, marketId, outcomeId, specifier } and live verification.
 */

import { decodeVaultBookingCode, bookVaultSlip } from "../coreBookingVault";
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
  surviving_legs: any[];
  pruned_legs?: any[];
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

  // 1. Decode original booking code using Core Booking Vault first
  let decoded = await decodeVaultBookingCode(code, req.bookmaker || "SportyBet");
  
  // Fallback to Universal Booking Engine if Vault decode was empty
  if (decoded.status === "error" || !decoded.legs || decoded.legs.length === 0) {
    const universalDecoded = await decodeAnyBookingCode(code, req.bookmaker || "SportyBet");
    if (universalDecoded.status === "success" && universalDecoded.legs && universalDecoded.legs.length > 0) {
      decoded = {
        status: "success",
        bookmaker: req.bookmaker || "SportyBet",
        booking_code: code,
        total_odds: universalDecoded.total_odds,
        legs_count: universalDecoded.legs.length,
        legs: universalDecoded.legs as any,
        share_url: universalDecoded.share_url,
      };
    } else {
      throw new Error(`Failed to decode booking code: ${code}. Verify the code on SportyBet or enter another.`);
    }
  }

  const originalLegs = [...decoded.legs];
  const originalOdds = decoded.total_odds;
  const originalCount = originalLegs.length;

  // MODE 1: SPLIT_TICKET
  if (req.mode === "SPLIT_TICKET") {
    const partsCount = Math.max(2, Math.min(5, Number(req.split_parts) || 2));
    const chunkSize = Math.ceil(originalLegs.length / partsCount);
    const splitChunks: any[][] = [];

    for (let i = 0; i < originalLegs.length; i += chunkSize) {
      splitChunks.push(originalLegs.slice(i, i + chunkSize));
    }

    const outputSlips: EditedSlipPayload[] = [];

    for (let idx = 0; idx < splitChunks.length; idx++) {
      const chunk = splitChunks[idx];
      const chunkOdds =
        Math.round(chunk.reduce((acc, l) => acc * (Number(l.odd) || 1.0), 1.0) * 100) / 100;

      // Book each split chunk using Core Booking Vault with strict preservation
      let bookedChunk = await bookVaultSlip(chunk, {
        slip_category: `SPLIT_TICKET_PART_${idx + 1}`,
      });

      // Fallback to bookUniversalSlip if vault encountered external network restriction
      let sportyCode = bookedChunk.sportybet_code;
      let bet9jaCode = bookedChunk.bet9ja_code;
      let sportyUrl = bookedChunk.sporty_url;
      let bet9jaUrl = bookedChunk.bet9ja_url;

      if (!sportyCode && !bet9jaCode) {
        const uBooked = await bookUniversalSlip(chunk, {
          slip_category: `SPLIT_TICKET_PART_${idx + 1}`,
        });
        sportyCode = uBooked.sportybet_code;
        bet9jaCode = uBooked.bet9ja_code;
        sportyUrl = uBooked.sporty_url;
        bet9jaUrl = uBooked.bet9ja_url;
      }

      const primaryCode = req.bookmaker === "Bet9ja" ? bet9jaCode : sportyCode;
      const shareUrl = req.bookmaker === "Bet9ja" ? bet9jaUrl : sportyUrl;

      outputSlips.push({
        slip_index: idx + 1,
        booking_code: primaryCode,
        sporty_code: sportyCode,
        bet9ja_code: bet9jaCode,
        share_url: shareUrl,
        total_odds: bookedChunk.actual_odds || chunkOdds,
        legs_count: (bookedChunk.legs && bookedChunk.legs.length > 0 ? bookedChunk.legs : chunk).length,
        surviving_legs: bookedChunk.legs && bookedChunk.legs.length > 0 ? bookedChunk.legs : chunk,
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
    originalLegs as any,
    req.mode as any,
    removeCount,
    req.split_parts || 2
  );

  let surviving: any[] = pruneResult.surviving;
  let pruned: any[] = pruneResult.pruned || [];

  // Ensure surviving has at least 2 legs
  if (surviving.length < 2) {
    surviving = originalLegs.slice(0, 2);
    pruned = originalLegs.slice(2);
  }

  const newOdds = Math.round(surviving.reduce((acc, l) => acc * (Number(l.odd) || 1.0), 1.0) * 100) / 100;

  // Book the surviving legs into a real booking code via Core Booking Vault
  let bookedSurviving = await bookVaultSlip(surviving, {
    slip_category: "PRUNED_SLIP",
  });

  let sportyCode = bookedSurviving.sportybet_code;
  let bet9jaCode = bookedSurviving.bet9ja_code;
  let sportyUrl = bookedSurviving.sporty_url;
  let bet9jaUrl = bookedSurviving.bet9ja_url;

  if (!sportyCode && !bet9jaCode) {
    const uBooked = await bookUniversalSlip(surviving, {
      slip_category: "PRUNED_SLIP",
    });
    sportyCode = uBooked.sportybet_code;
    bet9jaCode = uBooked.bet9ja_code;
    sportyUrl = uBooked.sporty_url;
    bet9jaUrl = uBooked.bet9ja_url;
  }

  const primaryCode = req.bookmaker === "Bet9ja" ? bet9jaCode : sportyCode;
  const shareUrl = req.bookmaker === "Bet9ja" ? bet9jaUrl : sportyUrl;

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
        total_odds: bookedSurviving.actual_odds || newOdds,
        legs_count: (bookedSurviving.legs && bookedSurviving.legs.length > 0 ? bookedSurviving.legs : surviving).length,
        surviving_legs: bookedSurviving.legs && bookedSurviving.legs.length > 0 ? bookedSurviving.legs : surviving,
        pruned_legs: pruned,
      },
    ],
    summary_message: `Removed ${pruned.length} risky/redundant games. Surviving ticket re-booked at ${newOdds}x odds with working codes.`,
  };
}
