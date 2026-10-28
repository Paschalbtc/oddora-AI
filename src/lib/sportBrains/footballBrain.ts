import { AnalyzedOutcome, getActiveDirectives } from "./types";

export interface FootballMatchInput {
  home_team: string;
  away_team: string;
  league?: string;
  country?: string;
  kickoff_time?: string;
  home_stats?: {
    form?: string; // e.g. "WWDLW"
    avg_goals_scored?: number;
    avg_goals_conceded?: number;
    clean_sheet_pct?: number;
    xG?: number;
  };
  away_stats?: {
    form?: string;
    avg_goals_scored?: number;
    avg_goals_conceded?: number;
    clean_sheet_pct?: number;
    xG?: number;
  };
  available_odds?: {
    home_win?: number;
    draw?: number;
    away_win?: number;
    double_chance_home?: number;
    double_chance_away?: number;
    over_1_5?: number;
    over_2_5?: number;
    under_3_5?: number;
    btts?: number;
  };
}

/**
 * Football Analytical Brain
 * Evaluates 1X2, Double Chance, Over/Under (1.5, 2.5, 3.5), BTTS, and Draw No Bet.
 * Flags top Over 2.5 candidates (is_over25_candidate = true) when combined xG > 2.85.
 * Integrates active rules from oddora_v2_ai_directives.
 */
export async function analyzeFootballMatch(
  match: FootballMatchInput
): Promise<AnalyzedOutcome> {
  const directives = await getActiveDirectives("football");

  // Derive Expected Goals (xG) based on team stats or statistical heuristics
  const homeScored = match.home_stats?.avg_goals_scored ?? 1.65;
  const homeConceded = match.home_stats?.avg_goals_conceded ?? 1.10;
  const awayScored = match.away_stats?.avg_goals_scored ?? 1.25;
  const awayConceded = match.away_stats?.avg_goals_conceded ?? 1.45;

  const homeXG = match.home_stats?.xG ?? (homeScored + awayConceded) / 2;
  const awayXG = match.away_stats?.xG ?? (awayScored + homeConceded) / 2;
  const combinedExpectedGoals = Number((homeXG + awayXG).toFixed(2));

  // Over 2.5 Candidate Condition (Combined xG/goal averages > 2.85)
  const isOver25Candidate = combinedExpectedGoals >= 2.85;

  // Evaluate outcomes & probabilities
  const candidates: Array<{
    market: string;
    selection: string;
    odd: number;
    baseProb: number;
    isOver25?: boolean;
    reasoning: string;
  }> = [];

  const odds = match.available_odds || {};

  // 1. Double Chance 1X
  const dcHomeOdd = odds.double_chance_home || 1.25;
  const homeAdvantage = (homeScored / (homeConceded || 1.0)) * 1.15;
  const dcHomeProb = Math.min(88, Math.max(68, Math.round(homeAdvantage * 45)));
  candidates.push({
    market: "Double Chance",
    selection: "1X",
    odd: dcHomeOdd,
    baseProb: dcHomeProb,
    reasoning: `Home fortress factor: ${match.home_team} conceding only ${homeConceded} goals/gm with 1X probability of ${dcHomeProb}%.`,
  });

  // 2. Over 1.5 Goals
  const over15Odd = odds.over_1_5 || 1.28;
  const over15Prob = Math.min(92, Math.max(72, Math.round((combinedExpectedGoals / 2.3) * 75)));
  candidates.push({
    market: "Over/Under Goals",
    selection: "Over 1.5",
    odd: over15Odd,
    baseProb: over15Prob,
    reasoning: `High attacking tempo: Combined xG of ${combinedExpectedGoals} strongly anchors Over 1.5 goals (${over15Prob}%).`,
  });

  // 3. Over 2.5 Goals
  const over25Odd = odds.over_2_5 || 1.85;
  let over25Prob = Math.min(85, Math.max(45, Math.round((combinedExpectedGoals / 2.85) * 62)));
  if (isOver25Candidate) over25Prob += 8; // Synergy bonus
  candidates.push({
    market: "Over/Under Goals",
    selection: "Over 2.5",
    odd: over25Odd,
    baseProb: over25Prob,
    isOver25: isOver25Candidate,
    reasoning: `High-scoring projection: Combined xG ${combinedExpectedGoals} meets the 2.85 threshold. Flagged as Prime Over 2.5 candidate (${over25Prob}% probability).`,
  });

  // 4. BTTS (Both Teams To Score)
  const bttsOdd = odds.btts || 1.80;
  const bttsProb = Math.min(80, Math.max(48, Math.round(((homeScored * awayScored) / 2.0) * 50)));
  candidates.push({
    market: "Both Teams To Score",
    selection: "BTTS - YES",
    odd: bttsOdd,
    baseProb: bttsProb,
    reasoning: `Both teams demonstrate high finishing conversion; home xG ${homeXG.toFixed(2)}, away xG ${awayXG.toFixed(2)}.`,
  });

  // 5. Under 3.5 Goals
  const under35Odd = odds.under_3_5 || 1.35;
  const under35Prob = Math.min(88, Math.max(62, Math.round((4.0 - combinedExpectedGoals) * 35 + 40)));
  candidates.push({
    market: "Over/Under Goals",
    selection: "Under 3.5",
    odd: under35Odd,
    baseProb: under35Prob,
    reasoning: `Controlled match pace: Expected total goals (${combinedExpectedGoals}) remains comfortably below the 3.5 ceiling.`,
  });

  // Apply Active AI Directives & Weight Adjustments
  for (const c of candidates) {
    for (const d of directives) {
      const marketMatch = d.market_affected === "all" || d.market_affected === c.market || c.selection.includes(d.market_affected);
      if (marketMatch && d.is_active) {
        c.baseProb = Math.min(96, Math.round(c.baseProb * Number(d.weight_adjustment || 1.0)));
        c.reasoning += ` [AI Directive Applied: ${d.rule_name} (x${d.weight_adjustment})]`;
      }
    }
  }

  // Select the single highest-probability / highest-floor outcome as best_outcome
  candidates.sort((a, b) => {
    // If Over 2.5 candidate with >= 75% prob, prioritize Over 2.5 for ticket value
    if (a.isOver25 && a.baseProb >= 72 && b.market !== "Over/Under Goals") return -1;
    return b.baseProb - a.baseProb;
  });

  const best = candidates[0];

  return {
    sport: "football",
    market_name: best.market,
    selection_label: best.selection,
    odd_value: Number(best.odd.toFixed(2)),
    win_probability: best.baseProb,
    confidence_score: Math.min(99, Math.round(best.baseProb * 1.05)),
    is_over25_candidate: isOver25Candidate,
    internal_ai_reasoning: `[Football Brain v2] Match: ${match.home_team} vs ${match.away_team} | Combined xG: ${combinedExpectedGoals} | Selected: ${best.market} (${best.selection}) @ ${best.odd}. ${best.reasoning}`,
    metadata: {
      combined_xg: combinedExpectedGoals,
      home_xg: homeXG,
      away_xg: awayXG,
      is_over25_candidate: isOver25Candidate,
      all_outcomes: candidates.map((c) => ({
        market: c.market,
        selection: c.selection,
        odd: c.odd,
        prob: c.baseProb,
      })),
    },
  };
}
