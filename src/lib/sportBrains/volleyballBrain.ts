import { AnalyzedOutcome, getActiveDirectives } from "./types";

export interface VolleyballMatchInput {
  home_team: string;
  away_team: string;
  league?: string;
  country?: string;
  kickoff_time?: string;
  home_stats?: {
    set_win_ratio?: number; // e.g. 2.1
    serve_ace_ratio?: number;
    home_win_pct?: number;
  };
  away_stats?: {
    set_win_ratio?: number;
    serve_ace_ratio?: number;
    away_win_pct?: number;
  };
  available_odds?: {
    home_win?: number;
    away_win?: number;
    over_3_5_sets?: number;
    under_3_5_sets?: number;
    over_4_5_sets?: number;
    set1_home_win?: number;
    set_handicap_home?: number; // e.g. -1.5 sets
    set_handicap_odd?: number;
  };
}

/**
 * Volleyball Analytical Brain
 * Evaluates Match Winner 1/2, Total Sets Over/Under (3.5 & 4.5), Set 1 Winner, and Set/Point Handicap.
 * Integrates active directives from oddora_v2_ai_directives.
 */
export async function analyzeVolleyballMatch(
  match: VolleyballMatchInput
): Promise<AnalyzedOutcome> {
  const directives = await getActiveDirectives("volleyball");

  const homeRatio = match.home_stats?.set_win_ratio ?? 1.8;
  const awayRatio = match.away_stats?.set_win_ratio ?? 1.2;
  const odds = match.available_odds || {};

  const candidates: Array<{
    market: string;
    selection: string;
    odd: number;
    baseProb: number;
    reasoning: string;
  }> = [];

  // 1. Match Winner (Home)
  const isHomeFavorite = homeRatio > awayRatio;
  const winnerProb = Math.min(
    89,
    Math.max(55, Math.round(52 + (homeRatio - awayRatio) * 22))
  );

  candidates.push({
    market: "Match Winner",
    selection: isHomeFavorite ? `${match.home_team} to Win` : `${match.away_team} to Win`,
    odd: isHomeFavorite ? odds.home_win || 1.35 : odds.away_win || 1.65,
    baseProb: winnerProb,
    reasoning: `Set win differential favors ${isHomeFavorite ? match.home_team : match.away_team} with ${winnerProb}% win expectancy.`,
  });

  // 2. Total Sets Over/Under 3.5
  // If evenly matched, high probability of going to at least 4 sets (Over 3.5 Sets)
  const parityGap = Math.abs(homeRatio - awayRatio);
  if (parityGap < 0.6) {
    const over35Prob = Math.min(84, Math.max(65, Math.round(78 - parityGap * 15)));
    candidates.push({
      market: "Total Sets",
      selection: "Over 3.5 Sets",
      odd: odds.over_3_5_sets || 1.45,
      baseProb: over35Prob,
      reasoning: `Competitive parity (gap ${parityGap.toFixed(2)}): High probability of both teams securing at least one set.`,
    });
  } else {
    // Dominant team often sweeps 3-0 (Under 3.5 Sets)
    const under35Prob = Math.min(82, Math.max(60, Math.round(60 + parityGap * 15)));
    candidates.push({
      market: "Total Sets",
      selection: "Under 3.5 Sets",
      odd: odds.under_3_5_sets || 1.80,
      baseProb: under35Prob,
      reasoning: `Mismatch dynamic: Dominant favorite projected to close the match in straight sets (3-0 sweep).`,
    });
  }

  // 3. Set 1 Winner
  const set1Prob = Math.min(82, Math.max(58, Math.round(winnerProb * 0.94)));
  candidates.push({
    market: "Set 1 Winner",
    selection: isHomeFavorite ? `${match.home_team} Set 1` : `${match.away_team} Set 1`,
    odd: odds.set1_home_win || 1.42,
    baseProb: set1Prob,
    reasoning: `Opening rotation and serving ace rate favors ${isHomeFavorite ? match.home_team : match.away_team}.`,
  });

  // 4. Set Handicap (-1.5 Sets)
  if (isHomeFavorite && parityGap >= 0.5) {
    const handicapProb = Math.min(80, Math.max(62, Math.round(62 + parityGap * 12)));
    candidates.push({
      market: "Set Handicap",
      selection: `${match.home_team} (-1.5 Sets)`,
      odd: odds.set_handicap_odd || 1.65,
      baseProb: handicapProb,
      reasoning: `Dominant set-differential trend supports covering the -1.5 sets spread.`,
    });
  }

  // Apply Directives
  for (const c of candidates) {
    for (const d of directives) {
      if ((d.market_affected === "all" || d.market_affected === c.market) && d.is_active) {
        c.baseProb = Math.min(95, Math.round(c.baseProb * Number(d.weight_adjustment || 1.0)));
        c.reasoning += ` [AI Directive: ${d.rule_name}]`;
      }
    }
  }

  candidates.sort((a, b) => b.baseProb - a.baseProb);
  const best = candidates[0];

  return {
    sport: "volleyball",
    market_name: best.market,
    selection_label: best.selection,
    odd_value: Number(best.odd.toFixed(2)),
    win_probability: best.baseProb,
    confidence_score: Math.min(99, Math.round(best.baseProb * 1.04)),
    internal_ai_reasoning: `[Volleyball Brain v2] ${match.home_team} vs ${match.away_team} | Set Ratio Gap: ${parityGap.toFixed(2)} | Chosen: ${best.market} (${best.selection}) @ ${best.odd}. ${best.reasoning}`,
    metadata: {
      parity_gap: parityGap,
      all_outcomes: candidates,
    },
  };
}
