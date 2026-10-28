import { AnalyzedOutcome, getActiveDirectives } from "./types";

export interface BasketballMatchInput {
  home_team: string;
  away_team: string;
  league?: string;
  country?: string;
  kickoff_time?: string;
  home_stats?: {
    avg_points_scored?: number;
    avg_points_conceded?: number;
    home_win_pct?: number;
    pace?: number;
  };
  away_stats?: {
    avg_points_scored?: number;
    avg_points_conceded?: number;
    away_win_pct?: number;
    pace?: number;
  };
  available_odds?: {
    home_win?: number;
    away_win?: number;
    spread_home?: number; // e.g. -4.5
    spread_odd?: number;
    total_points_line?: number; // e.g. 218.5
    over_total_odd?: number;
    under_total_odd?: number;
    q1_home_win?: number;
  };
}

/**
 * Basketball Analytical Brain
 * Evaluates Moneyline, Point Spread, Total Points Over/Under (210.5 - 228.5), and 1st Quarter Winner.
 * Integrates active directives from oddora_v2_ai_directives.
 */
export async function analyzeBasketballMatch(
  match: BasketballMatchInput
): Promise<AnalyzedOutcome> {
  const directives = await getActiveDirectives("basketball");

  const homeScored = match.home_stats?.avg_points_scored ?? 112.5;
  const homeConceded = match.home_stats?.avg_points_conceded ?? 108.0;
  const awayScored = match.away_stats?.avg_points_scored ?? 109.0;
  const awayConceded = match.away_stats?.avg_points_conceded ?? 111.5;

  const expectedTotalPoints = Number(
    ((homeScored + awayConceded + awayScored + homeConceded) / 2).toFixed(1)
  );

  const odds = match.available_odds || {};
  const totalLine = odds.total_points_line || 216.5;

  const candidates: Array<{
    market: string;
    selection: string;
    odd: number;
    baseProb: number;
    reasoning: string;
  }> = [];

  // 1. Moneyline (Home Win)
  const homeWinProb = Math.min(
    88,
    Math.max(55, Math.round(((homeScored - awayScored + 5) * 2.5) + 50))
  );
  candidates.push({
    market: "Moneyline",
    selection: `${match.home_team} to Win`,
    odd: odds.home_win || 1.45,
    baseProb: homeWinProb,
    reasoning: `Home court rating gives ${match.home_team} an offensive efficiency edge (${homeScored} vs ${awayScored} avg points).`,
  });

  // 2. Total Points Over/Under
  if (expectedTotalPoints > totalLine + 3) {
    const overProb = Math.min(85, Math.max(62, Math.round(55 + (expectedTotalPoints - totalLine) * 3)));
    candidates.push({
      market: "Total Points",
      selection: `Over ${totalLine}`,
      odd: odds.over_total_odd || 1.85,
      baseProb: overProb,
      reasoning: `High pace matchup: Projecting ${expectedTotalPoints} total points against market total line of ${totalLine}.`,
    });
  } else {
    const underProb = Math.min(85, Math.max(62, Math.round(55 + (totalLine - expectedTotalPoints) * 3)));
    candidates.push({
      market: "Total Points",
      selection: `Under ${totalLine}`,
      odd: odds.under_total_odd || 1.85,
      baseProb: underProb,
      reasoning: `Defensive containment: Projected total of ${expectedTotalPoints} remains below market line ${totalLine}.`,
    });
  }

  // 3. Point Spread (Handicap)
  const spreadLine = odds.spread_home || -3.5;
  const spreadOdd = odds.spread_odd || 1.88;
  const spreadProb = Math.min(82, Math.max(58, Math.round(52 + (homeScored - awayScored) * 2)));
  candidates.push({
    market: "Point Spread",
    selection: `${match.home_team} (${spreadLine > 0 ? "+" : ""}${spreadLine})`,
    odd: spreadOdd,
    baseProb: spreadProb,
    reasoning: `Point differential modeling supports ${match.home_team} covering the ${spreadLine} spread (${spreadProb}% model confidence).`,
  });

  // 4. 1st Quarter Winner
  const q1Prob = Math.min(80, Math.max(56, Math.round(homeWinProb * 0.92)));
  candidates.push({
    market: "1st Quarter Winner",
    selection: `${match.home_team} 1st Quarter`,
    odd: odds.q1_home_win || 1.62,
    baseProb: q1Prob,
    reasoning: `Aggressive early rotation strategy gives ${match.home_team} early game momentum.`,
  });

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
    sport: "basketball",
    market_name: best.market,
    selection_label: best.selection,
    odd_value: Number(best.odd.toFixed(2)),
    win_probability: best.baseProb,
    confidence_score: Math.min(99, Math.round(best.baseProb * 1.03)),
    internal_ai_reasoning: `[Basketball Brain v2] ${match.home_team} vs ${match.away_team} | Expected Total: ${expectedTotalPoints} | Best Pick: ${best.market} (${best.selection}) @ ${best.odd}. ${best.reasoning}`,
    metadata: {
      expected_total: expectedTotalPoints,
      total_line: totalLine,
      all_outcomes: candidates,
    },
  };
}
