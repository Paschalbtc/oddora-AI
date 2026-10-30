/**
 * High Probability Outcomes Specification (src/lib/highProbabilityOutcomes.ts)
 *
 * Ground-truth catalogue of verified high-probability betting markets across:
 * - FOOTBALL (SOCCER)
 * - TABLE_TENNIS
 * - BASKETBALL
 * - VOLLEYBALL
 *
 * Tier-Based Market Unlocking:
 * - FREE: 1X2, Double Chance (1X, X2, 12), Over 1.5 Goals
 * - PRO: + Over 2.5 Goals, BTTS (Both Teams To Score), Draw No Bet (DNB), Under 3.5 Goals, Team O0.5, Handicap +1.5
 * - PREMIUM: + Corners (O/U 8.5/9.5), Cards (O/U 3.5), Team Clean Sheet, 1st Half Goals (HT O0.5/U1.5),
 *             Win Either Half (WEH), Exact Correct Score Clusters, Asian Handicaps
 */

export interface HighProbOutcome {
  id: string;
  sport: "FOOTBALL" | "TABLE_TENNIS" | "BASKETBALL" | "VOLLEYBALL";
  outcomeName: string;
  shortCode: string;
  category: string;
  tierAccess: "FREE" | "PRO" | "PREMIUM";
  typicalOddRange: [number, number];
  baseWinProbabilityFloor: number; // Minimum % required to select
  sportybetMarketId: string;
  aiStatTrigger: string;
}

export const HIGH_PROBABILITY_OUTCOMES: Record<string, HighProbOutcome[]> = {
  // ==========================================
  // 1. FOOTBALL (SOCCER) — 20+ MARKET PORTFOLIO
  // ==========================================
  FOOTBALL: [
    // --- FREE TIER MARKETS ---
    {
      id: "fb_dc_1x",
      sport: "FOOTBALL",
      outcomeName: "Home or Draw (1X Double Chance)",
      shortCode: "1X",
      category: "DOUBLE_CHANCE",
      tierAccess: "FREE",
      typicalOddRange: [1.16, 1.42],
      baseWinProbabilityFloor: 85,
      sportybetMarketId: "10_1",
      aiStatTrigger: "Home unbeaten rate >= 80% AND Home xG > Away xG + 0.35",
    },
    {
      id: "fb_dc_x2",
      sport: "FOOTBALL",
      outcomeName: "Away or Draw (X2 Double Chance)",
      shortCode: "X2",
      category: "DOUBLE_CHANCE",
      tierAccess: "FREE",
      typicalOddRange: [1.18, 1.45],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "10_3",
      aiStatTrigger: "Away team top-4 table rank vs bottom-half host AND Away unbeaten last 5 >= 80%",
    },
    {
      id: "fb_dc_12",
      sport: "FOOTBALL",
      outcomeName: "Home or Away Win (12 No Draw)",
      shortCode: "12",
      category: "DOUBLE_CHANCE",
      tierAccess: "FREE",
      typicalOddRange: [1.20, 1.38],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "10_2",
      aiStatTrigger: "Both teams draw rate < 15% in last 10 matches AND high transition pace",
    },
    {
      id: "fb_over_1_5",
      sport: "FOOTBALL",
      outcomeName: "Over 1.5 Goals",
      shortCode: "O1.5",
      category: "OVER_UNDER",
      tierAccess: "FREE",
      typicalOddRange: [1.18, 1.42],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "18_total=1.5_12",
      aiStatTrigger: "Combined team xG >= 2.40 AND Over 1.5 hit rate in last 10 games >= 80%",
    },
    {
      id: "fb_1x2_home",
      sport: "FOOTBALL",
      outcomeName: "Home Win (1X2)",
      shortCode: "1",
      category: "1X2",
      tierAccess: "FREE",
      typicalOddRange: [1.25, 1.60],
      baseWinProbabilityFloor: 76,
      sportybetMarketId: "1_1",
      aiStatTrigger: "Home win probability >= 75% based on rolling 10-match Elo differential",
    },
    {
      id: "fb_1x2_away",
      sport: "FOOTBALL",
      outcomeName: "Away Win (1X2)",
      shortCode: "2",
      category: "1X2",
      tierAccess: "FREE",
      typicalOddRange: [1.28, 1.60],
      baseWinProbabilityFloor: 75,
      sportybetMarketId: "1_2",
      aiStatTrigger: "Away powerhouse traveling to relegation candidate with clean sheet index > 60%",
    },

    // --- PRO TIER MARKETS ---
    {
      id: "fb_over_2_5",
      sport: "FOOTBALL",
      outcomeName: "Over 2.5 Goals",
      shortCode: "O2.5",
      category: "OVER_UNDER",
      tierAccess: "PRO",
      typicalOddRange: [1.50, 1.95],
      baseWinProbabilityFloor: 75,
      sportybetMarketId: "18_total=2.5_12",
      aiStatTrigger: "Combined xG >= 3.10 AND both teams Over 2.5 rate >= 70% in last 8 games",
    },
    {
      id: "fb_under_3_5",
      sport: "FOOTBALL",
      outcomeName: "Under 3.5 Goals",
      shortCode: "U3.5",
      category: "OVER_UNDER",
      tierAccess: "PRO",
      typicalOddRange: [1.20, 1.45],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "18_total=3.5_13",
      aiStatTrigger: "Combined team goals average <= 2.50 AND at least one team plays low-block defense",
    },
    {
      id: "fb_btts_yes",
      sport: "FOOTBALL",
      outcomeName: "Both Teams To Score - Yes (GG)",
      shortCode: "BTTS Yes",
      category: "BTTS",
      tierAccess: "PRO",
      typicalOddRange: [1.55, 1.88],
      baseWinProbabilityFloor: 76,
      sportybetMarketId: "29_74",
      aiStatTrigger: "Both teams scored in >= 75% of last 10 games with leaky defensive records",
    },
    {
      id: "fb_btts_no",
      sport: "FOOTBALL",
      outcomeName: "Both Teams To Score - No (NG)",
      shortCode: "BTTS No",
      category: "BTTS",
      tierAccess: "PRO",
      typicalOddRange: [1.55, 1.85],
      baseWinProbabilityFloor: 75,
      sportybetMarketId: "29_76",
      aiStatTrigger: "Dominant clean sheet side facing lowest attacking xG team in division",
    },
    {
      id: "fb_home_dnb",
      sport: "FOOTBALL",
      outcomeName: "Home Draw No Bet (DNB 1)",
      shortCode: "DNB 1",
      category: "DRAW_NO_BET",
      tierAccess: "PRO",
      typicalOddRange: [1.22, 1.55],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "11_1",
      aiStatTrigger: "Home win prob >= 65% with <= 12% home defeat rate",
    },
    {
      id: "fb_away_dnb",
      sport: "FOOTBALL",
      outcomeName: "Away Draw No Bet (DNB 2)",
      shortCode: "DNB 2",
      category: "DRAW_NO_BET",
      tierAccess: "PRO",
      typicalOddRange: [1.25, 1.58],
      baseWinProbabilityFloor: 80,
      sportybetMarketId: "11_2",
      aiStatTrigger: "Away win prob >= 62% against weak home defense",
    },
    {
      id: "fb_fav_over_0_5",
      sport: "FOOTBALL",
      outcomeName: "Favourite Team Over 0.5 Goals (To Score)",
      shortCode: "Team O0.5",
      category: "TEAM_GOALS",
      tierAccess: "PRO",
      typicalOddRange: [1.12, 1.30],
      baseWinProbabilityFloor: 88,
      sportybetMarketId: "19_total=0.5_12",
      aiStatTrigger: "Team scored in >= 90% of last 10 games AND opponent clean sheet rate < 20%",
    },
    {
      id: "fb_handicap_plus_1_5",
      sport: "FOOTBALL",
      outcomeName: "Handicap +1.5 (Not to Lose by 2+)",
      shortCode: "HCP +1.5",
      category: "HANDICAP",
      tierAccess: "PRO",
      typicalOddRange: [1.20, 1.48],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "16_hcp=1.5_3",
      aiStatTrigger: "Stubborn defensive side conceding <= 1.1 goals/game vs fatigued favourite",
    },

    // --- PREMIUM / VIP ELITE MARKETS ---
    {
      id: "fb_corners_over_8_5",
      sport: "FOOTBALL",
      outcomeName: "Over 8.5 Total Corners",
      shortCode: "Corners O8.5",
      category: "CORNERS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.32, 1.60],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "166_total=8.5_12",
      aiStatTrigger: "Combined team corner average >= 11.2 per match with wide wing crossing play",
    },
    {
      id: "fb_corners_over_9_5",
      sport: "FOOTBALL",
      outcomeName: "Over 9.5 Total Corners",
      shortCode: "Corners O9.5",
      category: "CORNERS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.50, 1.85],
      baseWinProbabilityFloor: 78,
      sportybetMarketId: "166_total=9.5_12",
      aiStatTrigger: "High-tempo Premier / Bundesliga match with > 28 total shots per game",
    },
    {
      id: "fb_cards_over_3_5",
      sport: "FOOTBALL",
      outcomeName: "Over 3.5 Total Bookings / Cards",
      shortCode: "Cards O3.5",
      category: "CARDS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.35, 1.68],
      baseWinProbabilityFloor: 80,
      sportybetMarketId: "240_total=3.5_12",
      aiStatTrigger: "High-friction derby match officiated by strict referee (averages >= 4.6 yellow cards/match)",
    },
    {
      id: "fb_cards_under_5_5",
      sport: "FOOTBALL",
      outcomeName: "Under 5.5 Total Cards",
      shortCode: "Cards U5.5",
      category: "CARDS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.25, 1.50],
      baseWinProbabilityFloor: 85,
      sportybetMarketId: "240_total=5.5_13",
      aiStatTrigger: "Disciplined sides with low foul counts under lenient official",
    },
    {
      id: "fb_clean_sheet_home",
      sport: "FOOTBALL",
      outcomeName: "Home Team Clean Sheet - Yes",
      shortCode: "Clean Sheet 1",
      category: "CLEAN_SHEET",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.60, 2.10],
      baseWinProbabilityFloor: 74,
      sportybetMarketId: "77_1",
      aiStatTrigger: "Host conceded <= 0.6 goals/match at home against impotent away frontline",
    },
    {
      id: "fb_clean_sheet_away",
      sport: "FOOTBALL",
      outcomeName: "Away Team Clean Sheet - Yes",
      shortCode: "Clean Sheet 2",
      category: "CLEAN_SHEET",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.70, 2.25],
      baseWinProbabilityFloor: 72,
      sportybetMarketId: "78_1",
      aiStatTrigger: "Elite defensive side traveling away with lowest expected goals conceded index",
    },
    {
      id: "fb_ht_over_0_5",
      sport: "FOOTBALL",
      outcomeName: "1st Half Over 0.5 Goals",
      shortCode: "HT O0.5",
      category: "FIRST_HALF_GOALS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.28, 1.48],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "68_total=0.5_12",
      aiStatTrigger: "Both teams score/concede in 1st half in >= 80% of last 10 matches",
    },
    {
      id: "fb_ht_under_1_5",
      sport: "FOOTBALL",
      outcomeName: "1st Half Under 1.5 Goals",
      shortCode: "HT U1.5",
      category: "FIRST_HALF_GOALS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.25, 1.48],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "68_total=1.5_13",
      aiStatTrigger: "Cautious first half game plans with 0-0 or 1-0 halftime frequency > 85%",
    },
    {
      id: "fb_weh_fav",
      sport: "FOOTBALL",
      outcomeName: "Favourite to Win Either Half (WEH)",
      shortCode: "WEH",
      category: "WIN_EITHER_HALF",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.22, 1.48],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "47_1",
      aiStatTrigger: "Heavy favourite (xG diff > +1.0) against low-block defense",
    },
    {
      id: "fb_correct_score_cluster",
      sport: "FOOTBALL",
      outcomeName: "Exact Correct Score Cluster (1-0 / 2-0 / 2-1)",
      shortCode: "CS 2-0/1-0",
      category: "CORRECT_SCORE",
      tierAccess: "PREMIUM",
      typicalOddRange: [2.10, 3.50],
      baseWinProbabilityFloor: 68,
      sportybetMarketId: "45_1",
      aiStatTrigger: "Algorithmic Poisson distribution clustering tightly around 1-0 and 2-0 home win",
    },
    {
      id: "fb_asian_hcp_minus_0_5",
      sport: "FOOTBALL",
      outcomeName: "Asian Handicap -0.5 (Direct Win)",
      shortCode: "AH -0.5",
      category: "ASIAN_HANDICAP",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.38, 1.70],
      baseWinProbabilityFloor: 78,
      sportybetMarketId: "281_hcp=-0.5_1",
      aiStatTrigger: "Dominant side expected to secure full 3 points without handicap draw risk",
    },
    {
      id: "fb_asian_hcp_plus_0_5",
      sport: "FOOTBALL",
      outcomeName: "Asian Handicap +0.5 (Win or Draw)",
      shortCode: "AH +0.5",
      category: "ASIAN_HANDICAP",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.20, 1.45],
      baseWinProbabilityFloor: 85,
      sportybetMarketId: "281_hcp=0.5_2",
      aiStatTrigger: "Solid underdog with resolute defensive structure",
    },
  ],

  // ==========================================
  // 2. TABLE TENNIS — HIGH PROBABILITY
  // ==========================================
  TABLE_TENNIS: [
    {
      id: "tt_match_winner_fav",
      sport: "TABLE_TENNIS",
      outcomeName: "Match Winner (Heavy Favourite)",
      shortCode: "TT Win",
      category: "TT_WINNER",
      tierAccess: "FREE",
      typicalOddRange: [1.20, 1.48],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "186_4",
      aiStatTrigger: "Player A leads H2H >= 70% over last 10 meetings AND Last 5 form >= 4 wins",
    },
    {
      id: "tt_over_3_5_sets",
      sport: "TABLE_TENNIS",
      outcomeName: "Over 3.5 Total Sets (No 3-0 Sweep)",
      shortCode: "Sets O3.5",
      category: "TT_SETS",
      tierAccess: "PRO",
      typicalOddRange: [1.25, 1.48],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "199_total=3.5_12",
      aiStatTrigger: "Evenly matched players (odds between 1.65 - 2.15 each) where 85%+ of H2H went 4 or 5 sets",
    },
    {
      id: "tt_set_handicap_plus_1_5",
      sport: "TABLE_TENNIS",
      outcomeName: "Set Handicap +1.5 Sets (Wins 2+ Sets)",
      shortCode: "Set HCP +1.5",
      category: "TT_HANDICAP",
      tierAccess: "PRO",
      typicalOddRange: [1.22, 1.50],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "187_hcp=1.5_1714",
      aiStatTrigger: "Consistent server winning >= 2 sets in 9 of last 10 matches",
    },
    {
      id: "tt_set_handicap_plus_2_5",
      sport: "TABLE_TENNIS",
      outcomeName: "Set Handicap +2.5 Sets (Wins 1+ Set)",
      shortCode: "Set HCP +2.5",
      category: "TT_HANDICAP",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.14, 1.30],
      baseWinProbabilityFloor: 89,
      sportybetMarketId: "187_hcp=2.5_1714",
      aiStatTrigger: "Competitor wins at least 1 set in >= 90% of recent H2H clashes",
    },
    {
      id: "tt_total_points_over",
      sport: "TABLE_TENNIS",
      outcomeName: "Total Match Points Over (72.5 / 74.5 Points)",
      shortCode: "Pts O73.5",
      category: "TT_POINTS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.32, 1.55],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "201_total=73.5_12",
      aiStatTrigger: "Long rally games with deuce frequency > 25%",
    },
  ],

  // ==========================================
  // 3. BASKETBALL — HIGH PROBABILITY
  // ==========================================
  BASKETBALL: [
    {
      id: "bk_moneyline_fav",
      sport: "BASKETBALL",
      outcomeName: "Moneyline Winner (Inc. OT)",
      shortCode: "ML Win",
      category: "BK_MONEYLINE",
      tierAccess: "FREE",
      typicalOddRange: [1.20, 1.50],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "219_1",
      aiStatTrigger: "Top offensive rating squad vs bottom-3 defense with 10+ point win margin history",
    },
    {
      id: "bk_alt_spread_away",
      sport: "BASKETBALL",
      outcomeName: "Safe Alternate Spread (+8.5 / +10.5)",
      shortCode: "Spread +8.5",
      category: "BK_SPREAD",
      tierAccess: "PRO",
      typicalOddRange: [1.22, 1.45],
      baseWinProbabilityFloor: 88,
      sportybetMarketId: "16_hcp=8.5_3",
      aiStatTrigger: "Underdog covers +8.5 spread in 9 of last 10 games with disciplined transition pace",
    },
    {
      id: "bk_alt_total_over",
      sport: "BASKETBALL",
      outcomeName: "Buffered Total Points Over (e.g. O208.5)",
      shortCode: "Pts O208.5",
      category: "BK_TOTALS",
      tierAccess: "PRO",
      typicalOddRange: [1.25, 1.45],
      baseWinProbabilityFloor: 86,
      sportybetMarketId: "18_total=208.5_12",
      aiStatTrigger: "Combined team pace index > 102 possessions/game and 3PT rate > 38%",
    },
    {
      id: "bk_alt_total_under",
      sport: "BASKETBALL",
      outcomeName: "Buffered Total Points Under (e.g. U235.5)",
      shortCode: "Pts U235.5",
      category: "BK_TOTALS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.25, 1.45],
      baseWinProbabilityFloor: 87,
      sportybetMarketId: "18_total=235.5_13",
      aiStatTrigger: "Slow-paced halfcourt offenses with top-5 defensive ratings",
    },
    {
      id: "bk_1st_half_winner",
      sport: "BASKETBALL",
      outcomeName: "1st Half Moneyline Winner",
      shortCode: "1H Winner",
      category: "BK_HALF",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.30, 1.55],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "60_1",
      aiStatTrigger: "Fast-starting team leading at halftime in >= 80% of home games",
    },
  ],

  // ==========================================
  // 4. VOLLEYBALL — HIGH PROBABILITY
  // ==========================================
  VOLLEYBALL: [
    {
      id: "vb_match_winner_fav",
      sport: "VOLLEYBALL",
      outcomeName: "Match Winner (Heavy Favourite)",
      shortCode: "VB Win",
      category: "VB_WINNER",
      tierAccess: "FREE",
      typicalOddRange: [1.20, 1.45],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "186_4",
      aiStatTrigger: "Heavy favorite leading H2H and possessing top block/kill efficiency",
    },
    {
      id: "vb_set_handicap_plus_2_5",
      sport: "VOLLEYBALL",
      outcomeName: "Set Handicap +2.5 Sets (Wins 1+ Set)",
      shortCode: "Set HCP +2.5",
      category: "VB_SETS",
      tierAccess: "PRO",
      typicalOddRange: [1.14, 1.30],
      baseWinProbabilityFloor: 89,
      sportybetMarketId: "313_hcp=2.5_1714",
      aiStatTrigger: "Team wins at least 1 set in >= 90% of matches over last 15 fixtures",
    },
    {
      id: "vb_total_points_over",
      sport: "VOLLEYBALL",
      outcomeName: "Total Match Points Over (175.5 Points)",
      shortCode: "Pts Over",
      category: "VB_POINTS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.32, 1.58],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "238_total=175.5_12",
      aiStatTrigger: "Expected 4+ sets OR sets frequently reaching 25-22 / 25-23",
    },
    {
      id: "vb_1st_set_over_44_5",
      sport: "VOLLEYBALL",
      outcomeName: "1st Set Over 44.5 Points (Score at least 25-20)",
      shortCode: "S1 O44.5",
      category: "VB_POINTS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.32, 1.58],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "315_total=44.5_12",
      aiStatTrigger: "Both teams strong in 1st-set side-out; set 1 loser reaches >= 20 pts in 85% of matches",
    },
  ],
};

/**
 * Checks if a specific market category is allowed for a user tier
 */
export function isMarketAllowedForTier(
  category: string,
  userTier: "FREE" | "PRO" | "PREMIUM" = "FREE"
): boolean {
  const cat = category.toUpperCase().trim();
  const tier = (userTier || "FREE").toUpperCase();

  // Free Tier Markets
  const freeCategories = ["DOUBLE_CHANCE", "1X2", "OVER_UNDER", "BK_MONEYLINE", "TT_WINNER", "VB_WINNER"];
  if (freeCategories.includes(cat)) return true;

  // Pro Tier Markets
  const proCategories = [
    ...freeCategories,
    "BTTS",
    "DRAW_NO_BET",
    "TEAM_GOALS",
    "HANDICAP",
    "BK_SPREAD",
    "BK_TOTALS",
    "TT_SETS",
    "TT_HANDICAP",
    "VB_SETS",
  ];
  if (tier === "PRO" || tier === "PREMIUM") {
    if (proCategories.includes(cat)) return true;
  }

  // Premium Tier unlocks everything
  if (tier === "PREMIUM") return true;

  return false;
}

/**
 * Returns available outcomes for a given sport category (or all if sport is 'ALL')
 */
export function getOutcomesForSport(sport: string): HighProbOutcome[] {
  const norm = (sport || "").toUpperCase().trim();
  if (norm === "BANKER") {
    return [
      ...HIGH_PROBABILITY_OUTCOMES.FOOTBALL.filter(
        (o) => o.shortCode === "1X" || o.shortCode === "X2" || o.shortCode === "O1.5" || o.shortCode === "U3.5" || o.shortCode === "DNB 1" || o.shortCode.includes("+1.5")
      ),
      ...HIGH_PROBABILITY_OUTCOMES.BASKETBALL.filter((o) => o.shortCode.includes("+8.5") || o.shortCode.includes("O208.5")),
      ...HIGH_PROBABILITY_OUTCOMES.TABLE_TENNIS.filter((o) => o.shortCode.includes("+1.5") || o.shortCode.includes("+2.5")),
      ...HIGH_PROBABILITY_OUTCOMES.VOLLEYBALL.filter((o) => o.shortCode.includes("+2.5")),
    ];
  }
  if (norm === "FOOTBALL") return HIGH_PROBABILITY_OUTCOMES.FOOTBALL;
  if (norm === "TABLE_TENNIS" || norm === "TABLE TENNIS" || norm === "TENNIS") return HIGH_PROBABILITY_OUTCOMES.TABLE_TENNIS;
  if (norm === "BASKETBALL") return HIGH_PROBABILITY_OUTCOMES.BASKETBALL;
  if (norm === "VOLLEYBALL") return HIGH_PROBABILITY_OUTCOMES.VOLLEYBALL;

  return [
    ...HIGH_PROBABILITY_OUTCOMES.FOOTBALL,
    ...HIGH_PROBABILITY_OUTCOMES.BASKETBALL,
    ...HIGH_PROBABILITY_OUTCOMES.TABLE_TENNIS,
    ...HIGH_PROBABILITY_OUTCOMES.VOLLEYBALL,
  ];
}

/**
 * Maps a SportyBet market string ID (e.g. "18_total=1.5_12") to decomposed marketId, outcomeId, specifier
 */
export function parseSportyMarketString(str: string): {
  marketId: string;
  outcomeId: string;
  specifier: string | null;
} {
  const parts = str.split("_");
  if (parts.length === 2) {
    return { marketId: parts[0], outcomeId: parts[1], specifier: null };
  }
  if (parts.length >= 3) {
    return { marketId: parts[0], specifier: parts[1], outcomeId: parts[2] };
  }
  return { marketId: "1", outcomeId: "1", specifier: null };
}
