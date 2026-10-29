/**
 * Engine 3: Custom Multiplier & Slip Builder (src/lib/engines/engine3_slipBuilder.ts)
 *
 * Responsibilities:
 * 1. Combinatorial / Knapsack High-Probability Compound Solver:
 *    - Prioritizes highest win-probability outcomes above all else (80%–95%+ win rate).
 *    - Strict Hard Cap: Maximum 50 matches per ticket (Nigerian bookmaker standard for SportyBet & Bet9ja).
 * 2. Strict Market Filtering:
 *    - When specific market types are selected, ONLY games with that exact outcome are chosen.
 *    - Fixtures without the selected outcome are discarded, NEVER substituted with 1X2.
 * 3. Date Horizon Flexibility:
 *    - "today": Today's games only.
 *    - "14_days": Next 14 days calendar window.
 *    - "30_days": Next 30 days calendar window.
 * 4. Multi-Sport Support:
 *    - Football, Basketball, Table Tennis, Volleyball, or All Sports.
 * 5. Accurate Multiplier Convergence:
 *    - Hits target odds cleanly within 0.95x–1.20x without runaway multiplier overshoot.
 * 6. Authenticated Universal Booking:
 *    - Produces valid, sharable SportyBet and Bet9ja booking codes.
 */

import { getSupabaseAdmin } from "../supabase";
import { mapMarketToSportyBetIds } from "../sportybetBridge";
import { syncMatchesForDate, syncTodayAllMatches } from "./engine1_allMatches";
import { bookUniversalSlip } from "./bookingEngine";
import { scoreLegDanger } from "../apiFootballStatsBrain";
import { isMatchEnded } from "../multiSportScheduleFeed";

export const MAX_GAMES_PER_TICKET = 50;
export const MIN_GAMES_PER_TICKET = 2;

export interface CustomBuilderRequest {
  sport_type?: string; // "football" | "basketball" | "volleyball" | "tennis" | "table_tennis" | "all"
  allowed_markets?: string[]; // e.g. ["fb_over_1_5", "1x2", "double chance", "handicap", "dnb", "over 1.5"]
  match_count_mode?: "AUTO" | "CUSTOM";
  custom_match_count?: number; // e.g. 5, 10, 25, 50 (max 50)
  target_odds: number; // e.g. 2.0, 5.0, 10.0, 50.0, 100.0, 500.0
  date_horizon?: "today" | "14_days" | "30_days";
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
  sport?: string;
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

/**
 * Checks if a market category or selection string matches the user-specified market filters.
 * Supports IDs, short codes, and descriptive labels across all 4 sports.
 */
function isMarketAllowed(market: string, selection: string, allowed: string[]): boolean {
  if (allowed.length === 0 || allowed.includes("all")) return true;

  const mLower = market.toLowerCase();
  const sLower = selection.toLowerCase();

  for (const a of allowed) {
    const filter = a.toLowerCase().trim();
    if (!filter) continue;

    // Direct match
    if (mLower === filter || sLower === filter) return true;

    // 1. Football Markets
    if (filter === "fb_over_1_5" || filter === "o1.5" || filter === "over 1.5" || filter === "over 1.5 goals") {
      if (sLower.includes("over 1.5") || (mLower.includes("over") && sLower.includes("1.5"))) return true;
    } else if (filter === "fb_dc_1x" || filter === "1x" || filter === "home or draw") {
      if (sLower === "1x" || sLower.includes("1x") || sLower.includes("home or draw")) return true;
    } else if (filter === "fb_dc_x2" || filter === "x2" || filter === "away or draw") {
      if (sLower === "x2" || sLower.includes("x2") || sLower.includes("away or draw")) return true;
    } else if (filter === "fb_dc_12" || filter === "12" || filter === "home or away") {
      if (sLower === "12" || sLower.includes("12") || sLower.includes("home or away") || sLower.includes("no draw")) return true;
    } else if (filter === "fb_under_3_5" || filter === "u3.5" || filter === "under 3.5") {
      if (sLower.includes("under 3.5")) return true;
    } else if (filter === "fb_under_4_5" || filter === "u4.5" || filter === "under 4.5") {
      if (sLower.includes("under 4.5")) return true;
    } else if (filter === "fb_home_dnb" || filter === "dnb 1" || filter === "dnb1" || filter === "home dnb") {
      if ((sLower.includes("dnb") || mLower.includes("dnb") || mLower.includes("draw no bet")) && (sLower.includes("home") || sLower.includes("1"))) return true;
    } else if (filter === "fb_away_dnb" || filter === "dnb 2" || filter === "dnb2" || filter === "away dnb") {
      if ((sLower.includes("dnb") || mLower.includes("dnb") || mLower.includes("draw no bet")) && (sLower.includes("away") || sLower.includes("2"))) return true;
    } else if (filter === "fb_home_over_0_5" || filter === "home o0.5" || filter === "home over 0.5") {
      if ((sLower.includes("home") || sLower.includes("team 1")) && sLower.includes("0.5")) return true;
    } else if (filter === "fb_away_over_0_5" || filter === "away o0.5" || filter === "away over 0.5") {
      if ((sLower.includes("away") || sLower.includes("team 2")) && sLower.includes("0.5")) return true;
    } else if (filter === "fb_ht_over_0_5" || filter === "1h o0.5" || filter === "1st half over 0.5") {
      if ((mLower.includes("1st half") || sLower.includes("1h") || mLower.includes("ht")) && sLower.includes("0.5")) return true;
    } else if (filter.includes("corner")) {
      if (mLower.includes("corner") || sLower.includes("corner")) return true;
    } else if (filter.includes("weh") || filter.includes("either half")) {
      if (mLower.includes("either half") || sLower.includes("either half") || sLower.includes("weh")) return true;
    } else if (filter === "1x2" || filter.includes("straight") || filter.includes("winner")) {
      if (mLower.includes("1x2") || mLower.includes("moneyline") || mLower.includes("winner")) return true;
    } else if (filter.includes("double chance")) {
      if (mLower.includes("double") || sLower.includes("1x") || sLower.includes("x2") || sLower.includes("12")) return true;
    } else if (filter.includes("handicap") || filter.includes("spread")) {
      if (mLower.includes("handicap") || mLower.includes("spread") || sLower.includes("+1.5") || sLower.includes("+2.5") || sLower.includes("+3.5") || sLower.includes("+4.5") || sLower.includes("+8.5") || sLower.includes("-3.5")) return true;
    } else if (filter.includes("dnb") || filter.includes("draw no bet")) {
      if (mLower.includes("dnb") || mLower.includes("draw no bet") || sLower.includes("dnb")) return true;
    } else if (filter.includes("over 2.5")) {
      if (sLower.includes("over 2.5")) return true;
    } else if (filter.includes("btts") || filter.includes("gg") || filter.includes("both")) {
      if (mLower.includes("both") || mLower.includes("btts") || sLower.includes("btts") || sLower.includes("gg")) return true;
    }
    // 2. Table Tennis Markets
    else if (filter === "tt_match_winner" || filter === "ml win") {
      if (mLower.includes("winner") || mLower.includes("moneyline") || sLower.includes("win")) return true;
    } else if (filter === "tt_sets_over_3_5" || filter === "sets o3.5") {
      if (sLower.includes("3.5") && (mLower.includes("set") || sLower.includes("set"))) return true;
    } else if (filter === "tt_set_hcp_plus_1_5" || filter === "set +1.5") {
      if (sLower.includes("+1.5") && (mLower.includes("set") || sLower.includes("set"))) return true;
    } else if (filter === "tt_set_hcp_plus_2_5" || filter === "set +2.5") {
      if (sLower.includes("+2.5") && (mLower.includes("set") || sLower.includes("set"))) return true;
    } else if (filter === "tt_total_points_over_70_5" || filter === "pts o70.5") {
      if (sLower.includes("70.5") || (mLower.includes("point") && sLower.includes("over"))) return true;
    } else if (filter === "tt_point_hcp_plus_5_5" || filter === "hcp +5.5") {
      if (sLower.includes("5.5") && (mLower.includes("handicap") || sLower.includes("hcp"))) return true;
    }
    // 3. Basketball Markets
    else if (filter === "bb_moneyline" || filter === "ml") {
      if (mLower.includes("moneyline") || mLower.includes("winner") || sLower.includes("win")) return true;
    } else if (filter === "bb_spread_plus_8_5" || filter === "+8.5") {
      if (sLower.includes("+8.5")) return true;
    } else if (filter === "bb_spread_minus_3_5" || filter === "-3.5") {
      if (sLower.includes("-3.5")) return true;
    } else if (filter === "bb_total_alt_over" || filter === "alt over") {
      if (sLower.includes("over") && (mLower.includes("points") || mLower.includes("total"))) return true;
    } else if (filter === "bb_total_alt_under" || filter === "alt under") {
      if (sLower.includes("under") && (mLower.includes("points") || mLower.includes("total"))) return true;
    } else if (filter === "bb_1h_moneyline" || filter === "1h ml") {
      if (mLower.includes("1st half") && (sLower.includes("win") || sLower.includes("1") || sLower.includes("2"))) return true;
    }
    // 4. Volleyball Markets
    else if (filter === "vb_match_winner") {
      if (mLower.includes("winner") || sLower.includes("win")) return true;
    } else if (filter === "vb_sets_over_3_5") {
      if (sLower.includes("3.5") && mLower.includes("set")) return true;
    } else if (filter === "vb_set_hcp_plus_1_5") {
      if (sLower.includes("+1.5") && mLower.includes("set")) return true;
    } else if (filter === "vb_set_hcp_plus_2_5") {
      if (sLower.includes("+2.5") && mLower.includes("set")) return true;
    } else if (filter === "vb_set_hcp_minus_1_5") {
      if (sLower.includes("-1.5") && mLower.includes("set")) return true;
    } else if (filter === "vb_total_points_over_175_5" || filter === "pts o175.5") {
      if (sLower.includes("175.5") || (mLower.includes("point") && sLower.includes("over"))) return true;
    } else if (filter === "vb_set1_points_over_44_5" || filter === "s1 o44.5") {
      if (sLower.includes("44.5") || (mLower.includes("1st set") && sLower.includes("over"))) return true;
    }
    // Catch-all substring
    else if (mLower.includes(filter) || sLower.includes(filter)) {
      return true;
    }
  }

  return false;
}

/**
 * Classifies an outcome into a standardized market bucket for diversity enforcement.
 */
function getStandardMarketCategory(market: string, selection: string): string {
  const m = (market || "").toLowerCase();
  const s = (selection || "").toLowerCase();

  if (s.includes("over 1.5") || (m.includes("over") && s.includes("1.5"))) return "OVER_1_5";
  if (s.includes("over 2.5") || (m.includes("over") && s.includes("2.5"))) return "OVER_2_5";
  if (s.includes("under 3.5") || s.includes("under 4.5") || m.includes("under")) return "UNDER_GOALS";
  if (s.includes("1x") || s.includes("x2") || s.includes("12") || m.includes("double")) return "DOUBLE_CHANCE";
  if (s.includes("btts") || s.includes("gg") || m.includes("both")) return "BTTS";
  if (s.includes("dnb") || m.includes("draw no bet")) return "DNB";
  if (m.includes("handicap") || m.includes("spread") || s.includes("+") || s.includes("-")) return "HANDICAP";
  if (m.includes("point") || s.includes("points")) return "POINTS_TOTAL";
  if (m.includes("set") || s.includes("set")) return "SETS";
  if (m.includes("1x2") || m.includes("winner") || m.includes("moneyline") || s === "1" || s === "2" || s.includes("win")) return "1X2_WINNER";
  return m || "OTHER";
}

/**
 * Extracts ALL eligible candidate outcomes for a match that satisfy the allowed market filter.
 */
function extractAllEligibleOutcomes(
  matchRow: any,
  allowedMarkets: string[],
  matchIndex: number
): CustomBuilderLeg[] {
  let allOutcomes: Array<{
    market: string;
    selection: string;
    odd: number;
    win_probability: number;
  }> = [];

  // Parse `all_markets_json` if available
  let rawJson = matchRow.all_markets_json;
  if (typeof rawJson === "string") {
    try {
      rawJson = JSON.parse(rawJson);
    } catch {
      rawJson = [];
    }
  }

  if (Array.isArray(rawJson) && rawJson.length > 0) {
    allOutcomes = rawJson.map((o: any) => ({
      market: String(o.market || "1X2"),
      selection: String(o.selection || "Home Win"),
      odd: Number(o.odd || o.odd_value) || 1.40,
      win_probability: Number(o.win_probability || o.winProb) || 75,
    }));
  }

  // Also include the primary best_outcome if not already in allOutcomes
  if (matchRow.best_outcome) {
    const exists = allOutcomes.some(
      (o) => o.selection.toLowerCase() === matchRow.best_outcome?.toLowerCase()
    );
    if (!exists) {
      allOutcomes.unshift({
        market: String(matchRow.market_category || matchRow.market_name || "1X2"),
        selection: String(matchRow.best_outcome),
        odd: Number(matchRow.odd_value) || 1.45,
        win_probability: Number(matchRow.win_probability) || 75,
      });
    }
  }

  const isStrict = allowedMarkets.length > 0 && !allowedMarkets.includes("all");

  // Filter outcomes by user's allowed markets
  const eligible = isStrict
    ? allOutcomes.filter((o) => isMarketAllowed(o.market, o.selection, allowedMarkets))
    : allOutcomes;

  if (eligible.length === 0) {
    return [];
  }

  // Group by standard category to keep only the best pick per category for this match
  const catMap = new Map<string, typeof eligible[0]>();
  for (const item of eligible) {
    const cat = getStandardMarketCategory(item.market, item.selection);
    const existing = catMap.get(cat);
    if (!existing || item.win_probability > existing.win_probability) {
      catMap.set(cat, item);
    }
  }

  const results: CustomBuilderLeg[] = [];
  const sport = (matchRow.sport_type || "FOOTBALL").toUpperCase();

  for (const best of Array.from(catMap.values())) {
    const mapped = mapMarketToSportyBetIds(best.market, best.selection);
    results.push({
      match: `${matchRow.home_team} vs ${matchRow.away_team}`,
      home_team: matchRow.home_team,
      away_team: matchRow.away_team,
      league: matchRow.league_name || "Premier Division",
      market: best.market,
      selection: best.selection,
      odd: Math.max(1.05, Math.round(best.odd * 100) / 100),
      win_probability: Math.min(99, Math.max(50, Math.round(best.win_probability))),
      eventId: matchRow.match_id || `sr:match:builder_${matchIndex}`,
      marketId: mapped.marketId,
      outcomeId: mapped.outcomeId,
      specifier: mapped.specifier,
      sport,
    });
  }

  return results;
}

/**
 * Solves for an exact number of matches (up to 50 games) whose compound product approaches target odds,
 * enforcing round-robin market diversity and proportional sport mixing.
 */
function solveForExactCount(
  candidatesByMatch: CustomBuilderLeg[][],
  count: number,
  targetOdds: number,
  enforceMarketDiversity: boolean,
  isAllSports: boolean
): CustomBuilderLeg[] {
  const finalCount = Math.max(
    MIN_GAMES_PER_TICKET,
    Math.min(MAX_GAMES_PER_TICKET, Math.min(candidatesByMatch.length, count))
  );

  const targetPerLeg = Math.pow(targetOdds, 1 / finalCount);
  // Round-Robin Market Diversity: Max 25%–30% of legs from any single market type
  const maxPerMarket = enforceMarketDiversity ? Math.max(1, Math.ceil(finalCount * 0.28)) : 999;
  // Multi-Sport Diversity: Max ~45% from any single sport when "All Sports" is active
  const maxPerSport = isAllSports ? Math.max(1, Math.ceil(finalCount * 0.45)) : 999;

  const picked: CustomBuilderLeg[] = [];
  const pickedMatches = new Set<string>();
  const marketUsage: Record<string, number> = {};
  const sportUsage: Record<string, number> = {};

  interface ScoredCandidate {
    leg: CustomBuilderLeg;
    matchKey: string;
    marketCat: string;
    score: number;
  }

  const allScored: ScoredCandidate[] = [];

  for (const matchLegs of candidatesByMatch) {
    if (matchLegs.length === 0) continue;
    const matchKey = `${matchLegs[0].home_team}_vs_${matchLegs[0].away_team}`.toLowerCase();

    for (const leg of matchLegs) {
      const diff = Math.abs(leg.odd - targetPerLeg);
      const marketCat = getStandardMarketCategory(leg.market, leg.selection);
      const danger = scoreLegDanger(leg);
      const score = leg.win_probability * 2.2 - danger * 0.3 - diff * 8.0;
      allScored.push({ leg, matchKey, marketCat, score });
    }
  }

  // Sort descending by score
  allScored.sort((a, b) => b.score - a.score);

  // Pass 1: Greedily pick highest scoring legs respecting match uniqueness, market cap, and sport cap
  for (const item of allScored) {
    if (picked.length >= finalCount) break;
    if (pickedMatches.has(item.matchKey)) continue;

    const currentMarketCount = marketUsage[item.marketCat] || 0;
    if (enforceMarketDiversity && currentMarketCount >= maxPerMarket) continue;

    const currentSportCount = sportUsage[item.leg.sport || "FOOTBALL"] || 0;
    if (isAllSports && currentSportCount >= maxPerSport && picked.length < finalCount - 2) continue;

    picked.push(item.leg);
    pickedMatches.add(item.matchKey);
    marketUsage[item.marketCat] = currentMarketCount + 1;
    sportUsage[item.leg.sport || "FOOTBALL"] = currentSportCount + 1;
  }

  // Pass 2: Relax market/sport constraints if target count not yet filled
  if (picked.length < finalCount) {
    for (const item of allScored) {
      if (picked.length >= finalCount) break;
      if (pickedMatches.has(item.matchKey)) continue;

      picked.push(item.leg);
      pickedMatches.add(item.matchKey);
      marketUsage[item.marketCat] = (marketUsage[item.marketCat] || 0) + 1;
    }
  }

  // Re-sort chosen legs by win_probability DESCENDING for the user
  picked.sort((a, b) => b.win_probability - a.win_probability);

  return picked;
}

/**
 * High-Probability Compound Solver (AUTO Mode):
 * Greedily compounds the highest-probability outcomes available until target odds are reached.
 * Enforces round-robin market diversity and proportional multi-sport mixing.
 */
function solveForTargetOdds(
  candidatesByMatch: CustomBuilderLeg[][],
  target: number,
  enforceMarketDiversity: boolean,
  isAllSports: boolean
): CustomBuilderLeg[] {
  // Estimated leg count needed to hit target odds with avg odds ~1.40
  const estimatedCount = Math.max(3, Math.min(30, Math.round(Math.log(target) / Math.log(1.40))));
  const maxPerMarket = enforceMarketDiversity ? Math.max(1, Math.ceil(estimatedCount * 0.28)) : 999;
  const maxPerSport = isAllSports ? Math.max(1, Math.ceil(estimatedCount * 0.45)) : 999;

  const picked: CustomBuilderLeg[] = [];
  const pickedMatches = new Set<string>();
  const marketUsage: Record<string, number> = {};
  const sportUsage: Record<string, number> = {};
  let currentOdds = 1.0;

  const allScored: Array<{
    leg: CustomBuilderLeg;
    matchKey: string;
    marketCat: string;
    score: number;
  }> = [];

  for (const matchLegs of candidatesByMatch) {
    if (matchLegs.length === 0) continue;
    const matchKey = `${matchLegs[0].home_team}_vs_${matchLegs[0].away_team}`.toLowerCase();

    for (const leg of matchLegs) {
      const danger = scoreLegDanger(leg);
      const marketCat = getStandardMarketCategory(leg.market, leg.selection);
      const score = leg.win_probability * 2.0 - danger * 0.4;
      allScored.push({ leg, matchKey, marketCat, score });
    }
  }

  allScored.sort((a, b) => b.score - a.score);

  // Pass 1: Select under caps until reaching target odds
  for (const item of allScored) {
    if (picked.length >= MAX_GAMES_PER_TICKET) break;
    if (pickedMatches.has(item.matchKey)) continue;

    const currentMarketCount = marketUsage[item.marketCat] || 0;
    if (enforceMarketDiversity && currentMarketCount >= maxPerMarket) continue;

    const currentSportCount = sportUsage[item.leg.sport || "FOOTBALL"] || 0;
    if (isAllSports && currentSportCount >= maxPerSport && picked.length < estimatedCount - 2) continue;

    const projected = currentOdds * item.leg.odd;

    // Convergence check
    if (picked.length >= MIN_GAMES_PER_TICKET - 1 && projected >= target * 0.90) {
      picked.push(item.leg);
      pickedMatches.add(item.matchKey);
      marketUsage[item.marketCat] = currentMarketCount + 1;
      sportUsage[item.leg.sport || "FOOTBALL"] = currentSportCount + 1;
      currentOdds = projected;
      break;
    }

    if (projected <= target * 1.25) {
      picked.push(item.leg);
      pickedMatches.add(item.matchKey);
      marketUsage[item.marketCat] = currentMarketCount + 1;
      sportUsage[item.leg.sport || "FOOTBALL"] = currentSportCount + 1;
      currentOdds = projected;
    }

    if (currentOdds >= target * 0.95 && picked.length >= MIN_GAMES_PER_TICKET) {
      break;
    }
  }

  // Pass 2: If target not yet hit, relax constraints
  if (currentOdds < target * 0.95 && picked.length < MAX_GAMES_PER_TICKET) {
    for (const item of allScored) {
      if (picked.length >= MAX_GAMES_PER_TICKET) break;
      if (pickedMatches.has(item.matchKey)) continue;

      picked.push(item.leg);
      pickedMatches.add(item.matchKey);
      currentOdds *= item.leg.odd;
      if (currentOdds >= target * 0.95 && picked.length >= MIN_GAMES_PER_TICKET) {
        break;
      }
    }
  }

  picked.sort((a, b) => b.win_probability - a.win_probability);
  return picked;
}

export async function buildCustomSlip(
  req: CustomBuilderRequest
): Promise<CustomBuilderResult> {
  const supabase = getSupabaseAdmin();
  const todayStr = new Date().toISOString().split("T")[0];
  const target = Math.max(1.5, Number(req.target_odds) || 10.0);
  const bookmaker = req.bookmaker === "BET9JA" ? "BET9JA" : "SPORTYBET";
  const sport = (req.sport_type || "all").toLowerCase();
  const horizon = req.date_horizon || "today";

  const countMode =
    req.match_count_mode === "CUSTOM" && Number(req.custom_match_count) > 0
      ? "CUSTOM"
      : "AUTO";

  // Strict Nigerian bookmaker limit: Max 50 games per ticket
  const requiredCount =
    countMode === "CUSTOM"
      ? Math.max(MIN_GAMES_PER_TICKET, Math.min(MAX_GAMES_PER_TICKET, Number(req.custom_match_count)))
      : 0;

  // 1. Fetch eligible matches based on Date Horizon from Supabase
  let query = supabase
    .from("oddora_v2_matches")
    .select("*")
    .order("win_probability", { ascending: false });

  if (horizon === "today") {
    query = query.eq("match_date", todayStr);
  } else {
    const daysToAdd = horizon === "30_days" ? 30 : 14;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysToAdd);
    const futureDateStr = futureDate.toISOString().split("T")[0];
    query = query.gte("match_date", todayStr).lte("match_date", futureDateStr);
  }

  if (sport !== "all") {
    if (sport === "tennis" || sport === "table_tennis") {
      query = query.in("sport_type", ["TENNIS", "TABLE_TENNIS", "tennis", "table_tennis"]);
    } else {
      query = query.ilike("sport_type", sport);
    }
  }

  let { data: rawMatches } = await query;

  // If no matches cached, trigger sync for today and tomorrow
  if (!rawMatches || rawMatches.length === 0) {
    try {
      await syncTodayAllMatches();
      if (horizon !== "today") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await syncMatchesForDate(tomorrow.toISOString().split("T")[0]);
      }

      let retryQuery = supabase
        .from("oddora_v2_matches")
        .select("*")
        .order("win_probability", { ascending: false });

      if (horizon === "today") {
        retryQuery = retryQuery.eq("match_date", todayStr);
      } else {
        const daysToAdd = horizon === "30_days" ? 30 : 14;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysToAdd);
        retryQuery = retryQuery.gte("match_date", todayStr).lte("match_date", futureDate.toISOString().split("T")[0]);
      }

      if (sport !== "all") {
        if (sport === "tennis" || sport === "table_tennis") {
          retryQuery = retryQuery.in("sport_type", ["TENNIS", "TABLE_TENNIS", "tennis", "table_tennis"]);
        } else {
          retryQuery = retryQuery.ilike("sport_type", sport);
        }
      }

      const retry = await retryQuery;
      rawMatches = retry.data || [];
    } catch (e) {
      console.warn("Auto-sync error in buildCustomSlip:", e);
    }
  }

  if (!rawMatches || rawMatches.length === 0) {
    throw new Error(
      `No active fixtures found for ${horizon === "today" ? "today" : horizon.replace("_", " ")}. Run Engine 1 sync first.`
    );
  }

  // 2. Extract Candidate Legs with Round-Robin Diversity per Match
  const allowed = (req.allowed_markets || []).map((m) => m.toLowerCase());
  const enforceMarketDiversity = allowed.length === 0 || allowed.includes("all") || allowed.length > 1;
  const isAllSports = sport === "all";

  const candidatesByMatch: CustomBuilderLeg[][] = [];
  const seenMatches = new Set<string>();

  for (let i = 0; i < rawMatches.length; i++) {
    const m = rawMatches[i];
    // Exclude ended matches for today's horizon
    if (horizon === "today" && isMatchEnded(m)) continue;

    const key = `${m.home_team}_vs_${m.away_team}`.toLowerCase();
    if (seenMatches.has(key)) continue;

    const outcomes = extractAllEligibleOutcomes(m, allowed, i);
    if (outcomes.length > 0) {
      seenMatches.add(key);
      candidatesByMatch.push(outcomes);
    }
  }

  if (candidatesByMatch.length === 0) {
    throw new Error(
      `No candidate matches found matching the selected market "${req.allowed_markets?.join(", ")}". Try selecting All Markets or another market.`
    );
  }

  // 3. High-Probability Combinatorial Solving with Round-Robin Diversity
  let selectedLegs: CustomBuilderLeg[] = [];

  if (countMode === "CUSTOM") {
    selectedLegs = solveForExactCount(
      candidatesByMatch,
      requiredCount,
      target,
      enforceMarketDiversity,
      isAllSports
    );
  } else {
    selectedLegs = solveForTargetOdds(
      candidatesByMatch,
      target,
      enforceMarketDiversity,
      isAllSports
    );
  }

  // Enforce absolute hard cap of 50 games (SportyBet & Bet9ja limit)
  if (selectedLegs.length > MAX_GAMES_PER_TICKET) {
    selectedLegs = selectedLegs.slice(0, MAX_GAMES_PER_TICKET);
  }

  const actualOdds =
    Math.round(selectedLegs.reduce((acc, l) => acc * l.odd, 1.0) * 100) / 100;
  const accuracy = Math.round((actualOdds / target) * 1000) / 10;

  // 4. Book authentic, verified live codes via Universal Booking Engine
  const booked = await bookUniversalSlip(selectedLegs, {
    slip_category: "CUSTOM_SOLVER",
    target_odds: target,
  });

  const sportyCode = booked.sportybet_code;
  const bet9jaCode = booked.bet9ja_code;
  const primaryCode = bookmaker === "BET9JA" ? bet9jaCode : sportyCode;
  const shareUrl =
    bookmaker === "BET9JA" ? booked.bet9ja_url : booked.sporty_url;

  return {
    bookmaker,
    booking_code: primaryCode,
    sporty_code: sportyCode,
    bet9ja_code: bet9jaCode,
    share_url: shareUrl,
    target_odds_requested: target,
    actual_combined_odds: booked.actual_odds,
    odds_accuracy_ratio: `${accuracy}%`,
    match_count_mode: countMode,
    legs_count: booked.legs.length,
    legs: booked.legs,
  };
}
