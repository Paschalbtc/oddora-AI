import { AnalyzedOutcome, getActiveDirectives } from "./types";

export interface TennisMatchInput {
  player1: string; // "Home"
  player2: string; // "Away"
  tournament?: string;
  surface?: "Hard" | "Clay" | "Grass" | "Indoor";
  kickoff_time?: string;
  player1_stats?: {
    rank?: number;
    first_serve_win_pct?: number; // e.g. 76.5
    surface_win_pct?: number; // e.g. 72.0
    h2h_wins?: number;
  };
  player2_stats?: {
    rank?: number;
    first_serve_win_pct?: number;
    surface_win_pct?: number;
    h2h_wins?: number;
  };
  available_odds?: {
    player1_win?: number;
    player2_win?: number;
    set_betting_2_0?: number;
    set_betting_2_1?: number;
    over_21_5_games?: number;
    under_21_5_games?: number;
  };
}

/**
 * Tennis Analytical Brain
 * Evaluates Match Winner 1/2, Set Betting (2-0 / 2-1), and Total Games Over/Under 21.5.
 * Integrates active directives from oddora_v2_ai_directives.
 */
export async function analyzeTennisMatch(
  match: TennisMatchInput
): Promise<AnalyzedOutcome> {
  const directives = await getActiveDirectives("tennis");

  const p1Serve = match.player1_stats?.first_serve_win_pct ?? 72.0;
  const p2Serve = match.player2_stats?.first_serve_win_pct ?? 68.0;
  const p1Surface = match.player1_stats?.surface_win_pct ?? 65.0;
  const p2Surface = match.player2_stats?.surface_win_pct ?? 55.0;

  const odds = match.available_odds || {};

  const p1Score = p1Serve * 0.5 + p1Surface * 0.5;
  const p2Score = p2Serve * 0.5 + p2Surface * 0.5;
  const isP1Favorite = p1Score >= p2Score;
  const scoreDiff = Math.abs(p1Score - p2Score);

  const candidates: Array<{
    market: string;
    selection: string;
    odd: number;
    baseProb: number;
    reasoning: string;
  }> = [];

  // 1. Match Winner
  const winnerProb = Math.min(88, Math.max(56, Math.round(52 + scoreDiff * 2.2)));
  const favorite = isP1Favorite ? match.player1 : match.player2;
  const winOdd = isP1Favorite ? odds.player1_win || 1.38 : odds.player2_win || 1.55;

  candidates.push({
    market: "Match Winner",
    selection: `${favorite} to Win`,
    odd: winOdd,
    baseProb: winnerProb,
    reasoning: `Serve rating (${isP1Favorite ? p1Serve : p2Serve}%) and surface mastery favor ${favorite} with ${winnerProb}% model probability.`,
  });

  // 2. Total Games Over/Under 21.5
  // If both players have strong serves (> 72% first serve win), games go deep (tie-breaks, 3 sets)
  if (p1Serve >= 71 && p2Serve >= 71) {
    const overGamesProb = Math.min(82, Math.max(62, Math.round(62 + ((p1Serve + p2Serve) / 2 - 70) * 2)));
    candidates.push({
      market: "Total Games",
      selection: "Over 21.5 Games",
      odd: odds.over_21_5_games || 1.82,
      baseProb: overGamesProb,
      reasoning: `High hold rates: Both players exceed 70% first serve win rate, projecting extended sets and deep games.`,
    });
  } else if (scoreDiff > 10) {
    const underGamesProb = Math.min(80, Math.max(60, Math.round(58 + scoreDiff * 1.5)));
    candidates.push({
      market: "Total Games",
      selection: "Under 21.5 Games",
      odd: odds.under_21_5_games || 1.75,
      baseProb: underGamesProb,
      reasoning: `Lopsided surface differential: Projected straight sets victory with low break chances for underdog.`,
    });
  }

  // 3. Set Betting 2-0
  if (scoreDiff >= 8 && winnerProb >= 72) {
    const setBetProb = Math.min(76, Math.max(58, Math.round(winnerProb * 0.82)));
    candidates.push({
      market: "Set Betting",
      selection: `${favorite} 2-0`,
      odd: odds.set_betting_2_0 || 1.95,
      baseProb: setBetProb,
      reasoning: `High conversion efficiency projects ${favorite} to wrap up the match in straight sets (2-0).`,
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
    sport: "tennis",
    market_name: best.market,
    selection_label: best.selection,
    odd_value: Number(best.odd.toFixed(2)),
    win_probability: best.baseProb,
    confidence_score: Math.min(99, Math.round(best.baseProb * 1.04)),
    internal_ai_reasoning: `[Tennis Brain v2] ${match.player1} vs ${match.player2} | Surface Gap: ${scoreDiff.toFixed(1)} | Selected: ${best.market} (${best.selection}) @ ${best.odd}. ${best.reasoning}`,
    metadata: {
      surface_differential: scoreDiff,
      all_outcomes: candidates,
    },
  };
}

