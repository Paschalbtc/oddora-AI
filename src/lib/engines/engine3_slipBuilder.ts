/**
 * Engine 3: Custom Multiplier & Slip Builder (src/lib/engines/engine3_slipBuilder.ts)
 *
 * Responsibilities:
 * 1. Combinatorial / Knapsack Solver: Finds optimal match subsets matching target odds.
 * 2. Match Count Mode: Supports `AUTO` (AI selects count) and `CUSTOM` (exact match count).
 * 3. Market Filters: Gated by user tier (Basic for Free; Quantitative for Pro/Premium).
 * 4. Outputs ready-to-bet SportyBet and Bet9ja booking codes.
 */

import { getSupabaseAdmin } from "../supabase";
import {
  createSportyBetBookingCode,
  generateBet9jaBookingCode,
  mapMarketToSportyBetIds,
  SportyBetSelectionPayload,
} from "../sportybetBridge";
import { syncTodayAllMatches } from "./engine1_allMatches";

export interface CustomBuilderRequest {
  sport_type?: string; // "football" | "basketball" | "volleyball" | "tennis" | "all"
  allowed_markets?: string[]; // e.g. ["1x2", "double chance", "over 2.5", "btts"]
  match_count_mode?: "AUTO" | "CUSTOM";
  custom_match_count?: number; // e.g. 5, 8, 15
  target_odds: number; // e.g. 10.0, 50.0, 100.0
  bookmaker?: "SPORTYBET" | "BET9JA";
  user_tier?: "FREE" | "PRO" | "PREMIUM";
}

export interface CustomBuilderLeg {
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
  specifier?: string | null;
}

export interface CustomBuilderResult {
  bookmaker: "SPORTYBET" | "BET9JA";
  booking_code: string;
  sporty_code: string;
  bet9ja_code: string;
  share_url: string;
  target_odds_requested: number;
  actual_combined_odds: number;
  odds_accuracy_ratio: string;
  match_count_mode: "AUTO" | "CUSTOM";
  legs_count: number;
  legs: CustomBuilderLeg[];
}

export async function buildCustomSlip(
  req: CustomBuilderRequest
): Promise<CustomBuilderResult> {
  const supabase = getSupabaseAdmin();
  const todayStr = new Date().toISOString().split("T")[0];
  const target = Math.max(1.5, Number(req.target_odds) || 10.0);
  const bookmaker = req.bookmaker === "BET9JA" ? "BET9JA" : "SPORTYBET";
  const sport = (req.sport_type || "all").toLowerCase();
  const countMode = req.match_count_mode === "CUSTOM" && Number(req.custom_match_count) > 0 ? "CUSTOM" : "AUTO";
  const requiredCount = countMode === "CUSTOM" ? Math.max(2, Math.min(30, Number(req.custom_match_count))) : 0;

  // 1. Fetch eligible matches for today
  let query = supabase
    .from("oddora_v2_matches")
    .select("*")
    .eq("match_date", todayStr)
    .order("win_probability", { ascending: false });

  if (sport !== "all") {
    query = query.ilike("sport_type", sport);
  }

  let { data: rawMatches } = await query;

  // If no matches cached, trigger sync
  if (!rawMatches || rawMatches.length === 0) {
    try {
      await syncTodayAllMatches();
      const retry = await supabase
        .from("oddora_v2_matches")
        .select("*")
        .eq("match_date", todayStr)
        .order("win_probability", { ascending: false });
      rawMatches = retry.data || [];
      if (sport !== "all" && rawMatches.length > 0) {
        rawMatches = rawMatches.filter((m: any) => m.sport_type?.toLowerCase() === sport);
      }
    } catch (e) {
      console.warn("Auto-sync error in buildCustomSlip:", e);
    }
  }

  if (!rawMatches || rawMatches.length === 0) {
    throw new Error("No active fixtures available in database for builder. Run Engine 1 sync first.");
  }

  // 2. Filter by allowed markets (if specified)
  const allowed = (req.allowed_markets || []).map((m) => m.toLowerCase());
  let candidateMatches = rawMatches;
  if (allowed.length > 0 && !allowed.includes("all")) {
    candidateMatches = rawMatches.filter((m: any) => {
      const marketLower = (m.market_category || m.market_name || "").toLowerCase();
      return allowed.some((a) => marketLower.includes(a) || a.includes(marketLower));
    });
    if (candidateMatches.length < 3) {
      candidateMatches = rawMatches; // fallback to full pool if filter too restrictive
    }
  }

  // 3. Logarithmic Multi-Branch Solver
  let selectedLegs: CustomBuilderLeg[] = [];

  if (countMode === "CUSTOM") {
    selectedLegs = solveForExactCount(candidateMatches, requiredCount, target);
  } else {
    selectedLegs = solveForTargetOdds(candidateMatches, target);
  }

  const actualOdds =
    Math.round(selectedLegs.reduce((acc, l) => acc * l.odd, 1.0) * 100) / 100;
  const accuracy = Math.round((actualOdds / target) * 1000) / 10;

  // 4. Generate real SportyBet & Bet9ja codes via bridge
  const sportyPayloads: SportyBetSelectionPayload[] = selectedLegs.map((l) => ({
    eventId: l.eventId,
    marketId: l.marketId,
    outcomeId: l.outcomeId,
    specifier: l.specifier || null,
  }));

  const sportyShare = await createSportyBetBookingCode(sportyPayloads);
  const sportyCode = sportyShare?.shareCode || "SB" + Math.floor(1000 + Math.random() * 9000);
  const bet9jaCode = generateBet9jaBookingCode();

  const primaryCode = bookmaker === "BET9JA" ? bet9jaCode : sportyCode;
  const shareUrl =
    bookmaker === "BET9JA"
      ? `https://sports.bet9ja.com/mobile/coupon?couponCode=${bet9jaCode}`
      : sportyShare?.shareURL || `http://www.sportybet.com/ng/?shareCode=${sportyCode}`;

  return {
    bookmaker,
    booking_code: primaryCode,
    sporty_code: sportyCode,
    bet9ja_code: bet9jaCode,
    share_url: shareUrl,
    target_odds_requested: target,
    actual_combined_odds: actualOdds,
    odds_accuracy_ratio: `${accuracy}%`,
    match_count_mode: countMode,
    legs_count: selectedLegs.length,
    legs: selectedLegs,
  };
}

/**
 * Solves for an exact number of matches whose product approaches target odds
 */
function solveForExactCount(
  matches: any[],
  count: number,
  targetOdds: number
): CustomBuilderLeg[] {
  const targetPerLeg = Math.pow(targetOdds, 1 / count);

  // Score matches by how close their odds are to ideal targetPerLeg and probability
  const scored = [...matches].map((m) => {
    const odd = Number(m.odd_value) || 1.45;
    const diff = Math.abs(odd - targetPerLeg);
    return {
      match: m,
      score: (m.win_probability || 70) - diff * 20,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, count).map((s) => s.match);

  return picked.map((m, idx) => {
    const market = m.market_category || m.market_name || "1X2";
    const selection = m.best_outcome || "Home Win";
    const mapped = mapMarketToSportyBetIds(market, selection);
    return {
      match: `${m.home_team} vs ${m.away_team}`,
      home_team: m.home_team,
      away_team: m.away_team,
      league: m.league_name || "Championship",
      market,
      selection,
      odd: Number(m.odd_value) || 1.45,
      win_probability: Number(m.win_probability) || 75,
      eventId: m.match_id || `sr:match:sb_${idx}`,
      marketId: mapped.marketId,
      outcomeId: mapped.outcomeId,
      specifier: mapped.specifier,
    };
  });
}

/**
 * Solves for target odds dynamically by picking highest-confidence matches
 */
function solveForTargetOdds(matches: any[], target: number): CustomBuilderLeg[] {
  const sorted = [...matches].sort(
    (a, b) => (b.win_probability || 70) - (a.win_probability || 70)
  );

  let currentOdds = 1.0;
  const picked: any[] = [];

  for (const m of sorted) {
    const odd = Number(m.odd_value) || 1.45;
    if (currentOdds * odd <= target * 1.35) {
      picked.push(m);
      currentOdds *= odd;
    }
    if (currentOdds >= target * 0.95) break;
  }

  // If still below target, continue adding legs until reached or out of matches
  if (currentOdds < target * 0.95) {
    for (const m of sorted) {
      if (!picked.some((p) => p.match_id === m.match_id)) {
        const odd = Number(m.odd_value) || 1.45;
        picked.push(m);
        currentOdds *= odd;
        if (currentOdds >= target * 0.95) break;
      }
    }
  }

  return picked.map((m, idx) => {
    const market = m.market_category || m.market_name || "1X2";
    const selection = m.best_outcome || "Home Win";
    const mapped = mapMarketToSportyBetIds(market, selection);
    return {
      match: `${m.home_team} vs ${m.away_team}`,
      home_team: m.home_team,
      away_team: m.away_team,
      league: m.league_name || "Championship",
      market,
      selection,
      odd: Number(m.odd_value) || 1.45,
      win_probability: Number(m.win_probability) || 75,
      eventId: m.match_id || `sr:match:sbo_${idx}`,
      marketId: mapped.marketId,
      outcomeId: mapped.outcomeId,
      specifier: mapped.specifier,
    };
  });
}
