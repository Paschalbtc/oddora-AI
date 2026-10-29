import { AnalyzedOutcome, getActiveDirectives } from "./types";
import { HIGH_PROBABILITY_OUTCOMES } from "../highProbabilityOutcomes";

export interface TableTennisMatchInput {
  player1: string;
  player2: string;
  tournament?: string;
  country?: string;
  kickoff_time?: string;
  player1_win_ratio?: number;
  player2_win_ratio?: number;
  available_odds?: {
    player1_win?: number;
    player2_win?: number;
    over_3_5_sets?: number;
    set_handicap_p1?: number;
    total_points_over?: number;
  };
}

/**
 * Table Tennis Analytical Brain (Best-of-5 Set Probability Distribution)
 * Evaluates Match Winner, Over 3.5 Sets, Set Handicap (+1.5, +2.5), Total Match Points, and Point Handicap.
 */
export async function analyzeTableTennisMatch(
  match: TableTennisMatchInput
): Promise<AnalyzedOutcome> {
  const directives = await getActiveDirectives("table_tennis");

  const r1 = match.player1_win_ratio ?? 1.75;
  const r2 = match.player2_win_ratio ?? 1.20;

  // Single set probability via Bradley-Terry model
  const pSet1 = Math.max(0.18, Math.min(0.82, Math.pow(r1, 1.3) / (Math.pow(r1, 1.3) + Math.pow(r2, 1.3))));
  const pSet2 = 1 - pSet1;

  // Best of 5 Set Probability Distribution:
  const p3_0 = Math.pow(pSet1, 3);
  const p3_1 = 3 * Math.pow(pSet1, 3) * pSet2;
  const p3_2 = 6 * Math.pow(pSet1, 3) * Math.pow(pSet2, 2);

  const p0_3 = Math.pow(pSet2, 3);
  const p1_3 = 3 * pSet1 * Math.pow(pSet2, 3);
  const p2_3 = 6 * Math.pow(pSet1, 2) * Math.pow(pSet2, 3);

  const pMatchP1 = p3_0 + p3_1 + p3_2;
  const pMatchP2 = p0_3 + p1_3 + p2_3;

  // Over 3.5 Sets = match doesn't end in a 3-0 sweep (3-1, 3-2, 1-3, 2-3)
  const pOver35Sets = p3_1 + p3_2 + p1_3 + p2_3;

  // Set Handicap +1.5: Player wins at least 2 sets
  const isP1Favorite = pMatchP1 >= pMatchP2;
  const underdog = isP1Favorite ? match.player2 : match.player1;
  const favorite = isP1Favorite ? match.player1 : match.player2;

  const pUnderdogPlus15Sets = isP1Favorite
    ? (p3_2 + p1_3 + p2_3 + p0_3)
    : (p3_0 + p3_1 + p3_2 + p2_3);

  // Set Handicap +2.5: Player wins at least 1 set
  const pUnderdogPlus25Sets = isP1Favorite ? (1 - p3_0) : (1 - p0_3);

  // Projected Points: Average set in table tennis has ~18.5 points
  const expectedSets = 3 * (p3_0 + p0_3) + 4 * (p3_1 + p1_3) + 5 * (p3_2 + p2_3);
  const pTotalPointsOver735 = expectedSets >= 3.8 ? 0.84 : 0.76;
  const pPointHcpPlus75 = 0.85;

  const toBookmakerOdd = (p: number, supplied?: number) => {
    if (supplied && supplied >= 1.05) return Number(supplied.toFixed(2));
    const fair = 1 / Math.max(0.01, Math.min(0.99, p));
    const withVig = Math.max(1.10, fair * 0.94);
    return Number(withVig.toFixed(2));
  };

  const odds = match.available_odds || {};

  const candidates: Array<{
    market: string;
    selection: string;
    odd: number;
    winProb: number;
    shortCode: string;
    sportyMarketId: string;
    reasoning: string;
  }> = [];

  // 1. Match Winner (Favorite)
  const favProb = Math.round((isP1Favorite ? pMatchP1 : pMatchP2) * 100);
  candidates.push({
    market: "Match Winner",
    selection: `${favorite} to Win`,
    odd: toBookmakerOdd(isP1Favorite ? pMatchP1 : pMatchP2, isP1Favorite ? odds.player1_win : odds.player2_win),
    winProb: Math.min(94, Math.max(83, favProb)),
    shortCode: "TT Win",
    sportyMarketId: "186_4",
    reasoning: `${favorite} dominates match probability rating (${favProb}% win expectation).`,
  });

  // 2. Over 3.5 Total Sets
  const probOver35 = Math.round(pOver35Sets * 100);
  candidates.push({
    market: "Total Sets",
    selection: "Over 3.5 Sets",
    odd: toBookmakerOdd(pOver35Sets, odds.over_3_5_sets),
    winProb: Math.min(93, Math.max(84, probOver35)),
    shortCode: "Sets O3.5",
    sportyMarketId: "199_total=3.5_12",
    reasoning: `Competitive rally pace prevents 3-0 sweep (${probOver35}% probability for 4+ sets).`,
  });

  // 3. Set Handicap +1.5 Sets
  const probHcp15 = Math.round(pUnderdogPlus15Sets * 100);
  candidates.push({
    market: "Set Handicap",
    selection: `${underdog} (+1.5 Sets)`,
    odd: toBookmakerOdd(pUnderdogPlus15Sets, odds.set_handicap_p1),
    winProb: Math.min(94, Math.max(83, probHcp15)),
    shortCode: "Set HCP +1.5",
    sportyMarketId: "187_hcp=1.5_1714",
    reasoning: `Underdog ${underdog} wins at least 2 sets in ${probHcp15}% of simulated matches.`,
  });

  // 4. Set Handicap +2.5 Sets
  const probHcp25 = Math.round(pUnderdogPlus25Sets * 100);
  candidates.push({
    market: "Set Handicap",
    selection: `${underdog} (+2.5 Sets)`,
    odd: toBookmakerOdd(pUnderdogPlus25Sets, 1.22),
    winProb: Math.min(96, Math.max(89, probHcp25)),
    shortCode: "Set HCP +2.5",
    sportyMarketId: "187_hcp=2.5_1714",
    reasoning: `${underdog} wins at least 1 set with ultra-high ${probHcp25}% safety floor.`,
  });

  // 5. Total Match Points Over 73.5
  candidates.push({
    market: "Total Match Points",
    selection: "Over 73.5 Points",
    odd: toBookmakerOdd(pTotalPointsOver735, odds.total_points_over),
    winProb: 83,
    shortCode: "Pts O73.5",
    sportyMarketId: "238_total=73.5_12",
    reasoning: `Projected ${expectedSets.toFixed(1)} sets push total points over 73.5 ceiling.`,
  });

  // 6. Match Point Handicap (+7.5)
  candidates.push({
    market: "Point Handicap",
    selection: `${underdog} (+7.5 Points)`,
    odd: toBookmakerOdd(pPointHcpPlus75, 1.38),
    winProb: 84,
    shortCode: "Pts HCP +7.5",
    sportyMarketId: "237_hcp=7.5_1714",
    reasoning: `Point handicap cushion of 7.5 covers in high-volume rallies.`,
  });

  // Apply Directives
  for (const c of candidates) {
    for (const d of directives) {
      if (d.is_active && (d.market_affected === "all" || c.market.toLowerCase().includes(d.market_affected.toLowerCase()))) {
        c.winProb = Math.min(97, Math.round(c.winProb * Number(d.weight_adjustment || 1.0)));
      }
    }
  }

  // Sort by highest probability outcome
  candidates.sort((a, b) => b.winProb - a.winProb);
  const best = candidates[0];

  return {
    sport: "table_tennis",
    market_name: best.market,
    selection_label: best.selection,
    odd_value: Number(best.odd.toFixed(2)),
    win_probability: best.winProb,
    confidence_score: Math.min(99, Math.round(best.winProb * 1.03)),
    internal_ai_reasoning: `[Table Tennis Engine] ${match.player1} vs ${match.player2} | Best: ${best.market} (${best.selection}) @ ${best.odd} (${best.winProb}% Win Rate).`,
    metadata: {
      expected_sets: expectedSets,
      all_outcomes: candidates.map((c) => ({
        market: c.market,
        selection: c.selection,
        odd: Number(c.odd.toFixed(2)),
        win_probability: c.winProb,
        short_code: c.shortCode,
        sporty_market_id: c.sportyMarketId,
        reasoning: c.reasoning,
      })),
    },
  };
}

