/**
 * High Probability Outcomes Specification (src/lib/highProbabilityOutcomes.ts)
 *
 * Ground-truth catalogue of verified high-probability betting markets across:
 * - FOOTBALL (SOCCER)
 * - TABLE_TENNIS
 * - BASKETBALL
 * - VOLLEYBALL
 *
 * Each market defines its exact SportyBet market/outcome mapping, Bet9ja coupon code,
 * baseline mathematical win-probability floor, odds range, and AI statistical trigger.
 */

export interface HighProbOutcome {
  id: string;
  sport: "FOOTBALL" | "TABLE_TENNIS" | "BASKETBALL" | "VOLLEYBALL";
  outcomeName: string;
  shortCode: string;
  tierAccess: "FREE" | "PRO" | "PREMIUM";
  typicalOddRange: [number, number];
  baseWinProbabilityFloor: number; // Minimum % required to select
  sportybetMarketId: string;
  bet9jaCode: string;
  aiStatTrigger: string;
}

export const HIGH_PROBABILITY_OUTCOMES: Record<string, HighProbOutcome[]> = {
  // ==========================================
  // 1. FOOTBALL (SOCCER) — HIGH PROBABILITY
  // ==========================================
  FOOTBALL: [
    {
      id: "fb_over_1_5",
      sport: "FOOTBALL",
      outcomeName: "Over 1.5 Goals",
      shortCode: "O1.5",
      tierAccess: "FREE",
      typicalOddRange: [1.18, 1.42],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "18_total=1.5_12",
      bet9jaCode: "O1.5",
      aiStatTrigger: "Combined team xG >= 2.40 AND Over 1.5 hit rate in last 10 games >= 80%",
    },
    {
      id: "fb_dc_1x",
      sport: "FOOTBALL",
      outcomeName: "Home or Draw (1X Double Chance)",
      shortCode: "1X",
      tierAccess: "FREE",
      typicalOddRange: [1.16, 1.45],
      baseWinProbabilityFloor: 85,
      sportybetMarketId: "10_1",
      bet9jaCode: "1X",
      aiStatTrigger: "Home unbeaten rate >= 80% AND Home xG > Away xG + 0.35",
    },
    {
      id: "fb_dc_x2",
      sport: "FOOTBALL",
      outcomeName: "Away or Draw (X2 Double Chance)",
      shortCode: "X2",
      tierAccess: "FREE",
      typicalOddRange: [1.20, 1.50],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "10_3",
      bet9jaCode: "X2",
      aiStatTrigger: "Away team top-4 table rank vs bottom-half host AND Away unbeaten last 5 >= 80%",
    },
    {
      id: "fb_dc_12",
      sport: "FOOTBALL",
      outcomeName: "Home or Away Win (12 No Draw)",
      shortCode: "12",
      tierAccess: "FREE",
      typicalOddRange: [1.22, 1.38],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "10_2",
      bet9jaCode: "12",
      aiStatTrigger: "Both teams draw rate < 15% in last 10 matches AND high transition pace",
    },
    {
      id: "fb_under_3_5",
      sport: "FOOTBALL",
      outcomeName: "Under 3.5 Goals",
      shortCode: "U3.5",
      tierAccess: "FREE",
      typicalOddRange: [1.20, 1.45],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "18_total=3.5_13",
      bet9jaCode: "U3.5",
      aiStatTrigger: "Combined team goals average <= 2.50 AND at least one team plays Low-Block defense",
    },
    {
      id: "fb_under_4_5",
      sport: "FOOTBALL",
      outcomeName: "Under 4.5 Goals",
      shortCode: "U4.5",
      tierAccess: "FREE",
      typicalOddRange: [1.08, 1.22],
      baseWinProbabilityFloor: 91,
      sportybetMarketId: "18_total=4.5_13",
      bet9jaCode: "U4.5",
      aiStatTrigger: "Combined team goals average <= 2.90 AND 90%+ historical matches ended with <= 4 goals",
    },
    {
      id: "fb_home_dnb",
      sport: "FOOTBALL",
      outcomeName: "Home Draw No Bet (DNB 1)",
      shortCode: "DNB 1",
      tierAccess: "PRO",
      typicalOddRange: [1.25, 1.55],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "11_4",
      bet9jaCode: "DNB1",
      aiStatTrigger: "Home win prob >= 62% with <= 12% loss rate at home",
    },
    {
      id: "fb_away_dnb",
      sport: "FOOTBALL",
      outcomeName: "Away Draw No Bet (DNB 2)",
      shortCode: "DNB 2",
      tierAccess: "PRO",
      typicalOddRange: [1.30, 1.62],
      baseWinProbabilityFloor: 80,
      sportybetMarketId: "11_5",
      bet9jaCode: "DNB2",
      aiStatTrigger: "Away win prob >= 60% against weak home offense",
    },
    {
      id: "fb_fav_over_0_5",
      sport: "FOOTBALL",
      outcomeName: "Favourite Team Over 0.5 Goals (To Score)",
      shortCode: "Team O0.5",
      tierAccess: "PRO",
      typicalOddRange: [1.12, 1.30],
      baseWinProbabilityFloor: 88,
      sportybetMarketId: "19_total=0.5_12",
      bet9jaCode: "HO0.5",
      aiStatTrigger: "Team scored in >= 90% of last 10 games AND opponent clean sheet rate < 20%",
    },
    {
      id: "fb_handicap_plus_1_5",
      sport: "FOOTBALL",
      outcomeName: "Handicap +1.5 (Underdog Not to Lose by 2+)",
      shortCode: "HCP +1.5",
      tierAccess: "PRO",
      typicalOddRange: [1.22, 1.48],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "16_hcp=1.5_1714",
      bet9jaCode: "2H+1.5",
      aiStatTrigger: "Stubborn defensive side conceding <= 1.1 goals/game vs fatigued favourite",
    },
    {
      id: "fb_over_2_5",
      sport: "FOOTBALL",
      outcomeName: "Over 2.5 Goals",
      shortCode: "O2.5",
      tierAccess: "PRO",
      typicalOddRange: [1.55, 1.95],
      baseWinProbabilityFloor: 75,
      sportybetMarketId: "18_total=2.5_12",
      bet9jaCode: "O2.5",
      aiStatTrigger: "Combined xG >= 3.10 AND both teams Over 2.5 rate >= 70% in last 8 games",
    },
    {
      id: "fb_weh_fav",
      sport: "FOOTBALL",
      outcomeName: "Favourite to Win Either Half (WEH)",
      shortCode: "WEH",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.25, 1.50],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "47_1",
      bet9jaCode: "HWEH",
      aiStatTrigger: "Heavy favourite (xG diff > +1.0) against low-block defense",
    },
    {
      id: "fb_corners_over_7_5",
      sport: "FOOTBALL",
      outcomeName: "Over 7.5 Total Corners",
      shortCode: "Corners O7.5",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.22, 1.42],
      baseWinProbabilityFloor: 85,
      sportybetMarketId: "166_total=7.5_12",
      bet9jaCode: "CRNO7.5",
      aiStatTrigger: "Combined team corner average >= 10.2 per match",
    },
    {
      id: "fb_corners_over_8_5",
      sport: "FOOTBALL",
      outcomeName: "Over 8.5 Total Corners",
      shortCode: "Corners O8.5",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.35, 1.60],
      baseWinProbabilityFloor: 80,
      sportybetMarketId: "166_total=8.5_12",
      bet9jaCode: "CRNO8.5",
      aiStatTrigger: "Combined team corner average >= 11.0 per match with wide wing play",
    },
    {
      id: "fb_ht_over_0_5",
      sport: "FOOTBALL",
      outcomeName: "1st Half Over 0.5 Goals",
      shortCode: "HT O0.5",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.28, 1.48],
      baseWinProbabilityFloor: 81,
      sportybetMarketId: "68_total=0.5_12",
      bet9jaCode: "1HO0.5",
      aiStatTrigger: "Both teams score/concede in 1st Half in >= 80% of last 10 matches",
    },
  ],

  // ==========================================
  // 2. TABLE TENNIS — HIGH PROBABILITY
  // ==========================================
  TABLE_TENNIS: [
    {
      id: "tt_match_winner_fav",
      sport: "TABLE_TENNIS",
      outcomeName: "Match Winner (Heavy Favourite 1 or 2)",
      shortCode: "TT Win",
      tierAccess: "FREE",
      typicalOddRange: [1.20, 1.50],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "186_4",
      bet9jaCode: "TT1",
      aiStatTrigger: "Player A leads H2H >= 70% over last 10 meetings AND Last 5 form >= 4 wins",
    },
    {
      id: "tt_over_3_5_sets",
      sport: "TABLE_TENNIS",
      outcomeName: "Over 3.5 Total Sets (No 3-0 Sweep)",
      shortCode: "Sets O3.5",
      tierAccess: "PRO",
      typicalOddRange: [1.28, 1.48],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "199_total=3.5_12",
      bet9jaCode: "TTO3.5S",
      aiStatTrigger: "Evenly matched players (odds between 1.65 - 2.15 each) where 85%+ of H2H went 4 or 5 sets",
    },
    {
      id: "tt_set_handicap_plus_1_5",
      sport: "TABLE_TENNIS",
      outcomeName: "Player Set Handicap +1.5 Sets (To Win at Least 2 Sets)",
      shortCode: "Set HCP +1.5",
      tierAccess: "PRO",
      typicalOddRange: [1.25, 1.52],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "187_hcp=1.5_1714",
      bet9jaCode: "TTH+1.5S",
      aiStatTrigger: "Consistent server winning >= 2 sets in 9 of last 10 matches",
    },
    {
      id: "tt_set_handicap_plus_2_5",
      sport: "TABLE_TENNIS",
      outcomeName: "Player Set Handicap +2.5 Sets (To Win at Least 1 Set)",
      shortCode: "Set HCP +2.5",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.14, 1.32],
      baseWinProbabilityFloor: 89,
      sportybetMarketId: "187_hcp=2.5_1714",
      bet9jaCode: "TTH+2.5S",
      aiStatTrigger: "Competitor wins at least 1 set in >= 90% of recent H2H clashes",
    },
    {
      id: "tt_total_points_over",
      sport: "TABLE_TENNIS",
      outcomeName: "Total Match Points Over (72.5 / 74.5 Points)",
      shortCode: "Pts O73.5",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.35, 1.65],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "238_total=73.5_12",
      bet9jaCode: "TTPO73.5",
      aiStatTrigger: "Both players average >= 18.8 points per set with frequent 11-9 / deuce sets",
    },
    {
      id: "tt_point_handicap_plus",
      sport: "TABLE_TENNIS",
      outcomeName: "Match Point Handicap (+6.5 / +8.5 Points)",
      shortCode: "Pts HCP +7.5",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.28, 1.55],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "237_hcp=7.5_1714",
      bet9jaCode: "TTPH+7.5",
      aiStatTrigger: "High rally consistency with low blow-out set frequency",
    },
  ],

  // ==========================================
  // 3. BASKETBALL — HIGH PROBABILITY
  // ==========================================
  BASKETBALL: [
    {
      id: "bk_moneyline_fav",
      sport: "BASKETBALL",
      outcomeName: "Moneyline Winner (Including Overtime 1 or 2)",
      shortCode: "ML Win",
      tierAccess: "FREE",
      typicalOddRange: [1.18, 1.50],
      baseWinProbabilityFloor: 85,
      sportybetMarketId: "219_4",
      bet9jaCode: "12_OT",
      aiStatTrigger: "Net Rating advantage >= +5.5 AND Home court or rest advantage",
    },
    {
      id: "bk_alt_spread_plus",
      sport: "BASKETBALL",
      outcomeName: "Safe Alternate Point Spread (+7.5 to +11.5 Points)",
      shortCode: "Spread +8.5",
      tierAccess: "PRO",
      typicalOddRange: [1.22, 1.45],
      baseWinProbabilityFloor: 86,
      sportybetMarketId: "223_hcp=8.5_1714",
      bet9jaCode: "H+8.5",
      aiStatTrigger: "Competitive underdog loses by >= 9 points in < 12% of games this season",
    },
    {
      id: "bk_alt_spread_minus",
      sport: "BASKETBALL",
      outcomeName: "Safe Favourite Spread (-2.5 to -4.5 Points)",
      shortCode: "Spread -3.5",
      tierAccess: "PRO",
      typicalOddRange: [1.28, 1.52],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "223_hcp=-3.5_1714",
      bet9jaCode: "H-3.5",
      aiStatTrigger: "Dominant favourite winning by 6+ points in 80% of recent home games",
    },
    {
      id: "bk_alt_total_over",
      sport: "BASKETBALL",
      outcomeName: "Safe Alternate Total Points Over (Buffered -8 Pts below Line)",
      shortCode: "Alt Total Over",
      tierAccess: "PRO",
      typicalOddRange: [1.24, 1.46],
      baseWinProbabilityFloor: 85,
      sportybetMarketId: "225_12",
      bet9jaCode: "BK_O_ALT",
      aiStatTrigger: "Both teams top-10 in Pace & Offensive Efficiency; combined average exceeds buffered line by +10 pts",
    },
    {
      id: "bk_alt_total_under",
      sport: "BASKETBALL",
      outcomeName: "Safe Alternate Total Points Under (Buffered +8 Pts above Line)",
      shortCode: "Alt Total Under",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.24, 1.46],
      baseWinProbabilityFloor: 85,
      sportybetMarketId: "225_13",
      bet9jaCode: "BK_U_ALT",
      aiStatTrigger: "Slow half-court pace + strong defensive efficiency; combined average is 10+ pts below buffered ceiling",
    },
    {
      id: "bk_1h_winner_fav",
      sport: "BASKETBALL",
      outcomeName: "1st Half Winner / 1st Quarter Winner (Fast-Starting Favourite)",
      shortCode: "1H Win",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.28, 1.55],
      baseWinProbabilityFloor: 81,
      sportybetMarketId: "60_1",
      bet9jaCode: "1H_1",
      aiStatTrigger: "Home favourite leads at halftime in >= 80% of games with starting lineup intact",
    },
  ],

  // ==========================================
  // 4. VOLLEYBALL — HIGH PROBABILITY
  // ==========================================
  VOLLEYBALL: [
    {
      id: "vb_match_winner_fav",
      sport: "VOLLEYBALL",
      outcomeName: "Match Winner (1 or 2 — No Draw Exists)",
      shortCode: "VB Win",
      tierAccess: "FREE",
      typicalOddRange: [1.15, 1.48],
      baseWinProbabilityFloor: 86,
      sportybetMarketId: "186_4",
      bet9jaCode: "VB1",
      aiStatTrigger: "Side-out efficiency & block/attack ratio > +12% over opponent",
    },
    {
      id: "vb_over_3_5_sets",
      sport: "VOLLEYBALL",
      outcomeName: "Over 3.5 Total Sets (Both Teams Win at Least 1 Set)",
      shortCode: "Sets O3.5",
      tierAccess: "PRO",
      typicalOddRange: [1.30, 1.55],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "314_total=3.5_12",
      bet9jaCode: "VBO3.5S",
      aiStatTrigger: "Matched teams (within 4 league places) where 3-0 sweeps happen < 18% of the time",
    },
    {
      id: "vb_set_handicap_plus_1_5",
      sport: "VOLLEYBALL",
      outcomeName: "Set Handicap +1.5 Sets (Team to Win at Least 2 Sets)",
      shortCode: "Set HCP +1.5",
      tierAccess: "PRO",
      typicalOddRange: [1.25, 1.50],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "313_hcp=1.5_1714",
      bet9jaCode: "VBH+1.5S",
      aiStatTrigger: "Slight underdog/favourite with strong home crowd that forces 4th/5th set in 85% of matches",
    },
    {
      id: "vb_set_handicap_plus_2_5",
      sport: "VOLLEYBALL",
      outcomeName: "Set Handicap +2.5 Sets (Team to Win at Least 1 Set)",
      shortCode: "Set HCP +2.5",
      tierAccess: "PRO",
      typicalOddRange: [1.14, 1.32],
      baseWinProbabilityFloor: 90,
      sportybetMarketId: "313_hcp=2.5_1714",
      bet9jaCode: "VBH+2.5S",
      aiStatTrigger: "Team wins at least 1 set in >= 90% of matches over last 15 fixtures",
    },
    {
      id: "vb_set_handicap_minus_1_5",
      sport: "VOLLEYBALL",
      outcomeName: "Favourite Set Handicap -1.5 Sets (To Win 3-0 or 3-1)",
      shortCode: "Set HCP -1.5",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.30, 1.60],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "313_hcp=-1.5_1714",
      bet9jaCode: "VBH-1.5S",
      aiStatTrigger: "Top-3 league powerhouse vs bottom-4 opponent; wins 3-0 or 3-1 in 85%+ of matches",
    },
    {
      id: "vb_total_points_over",
      sport: "VOLLEYBALL",
      outcomeName: "Total Match Points Over (135.5 / 175.5 Points)",
      shortCode: "Pts Over",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.32, 1.58],
      baseWinProbabilityFloor: 83,
      sportybetMarketId: "238_total=175.5_12",
      bet9jaCode: "VBPO175.5",
      aiStatTrigger: "Expected 4+ sets OR sets frequently reaching 25-22 / 25-23",
    },
    {
      id: "vb_1st_set_over_44_5",
      sport: "VOLLEYBALL",
      outcomeName: "1st Set Over 44.5 Points (Score at Least 25-20)",
      shortCode: "S1 O44.5",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.35, 1.58],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "315_total=44.5_12",
      bet9jaCode: "VBS1O44.5",
      aiStatTrigger: "Both teams strong in 1st-set side-out recepción; loser of Set 1 reaches >= 20 points in 85% of games",
    },
  ],
};

/**
 * Returns available outcomes for a given sport category (or all if sport is 'ALL')
 */
export function getOutcomesForSport(sport: string): HighProbOutcome[] {
  const norm = (sport || "").toUpperCase().trim();
  if (norm === "FOOTBALL") return HIGH_PROBABILITY_OUTCOMES.FOOTBALL;
  if (norm === "TABLE_TENNIS" || norm === "TABLE TENNIS" || norm === "TENNIS") return HIGH_PROBABILITY_OUTCOMES.TABLE_TENNIS;
  if (norm === "BASKETBALL") return HIGH_PROBABILITY_OUTCOMES.BASKETBALL;
  if (norm === "VOLLEYBALL") return HIGH_PROBABILITY_OUTCOMES.VOLLEYBALL;

  // If ALL or unknown, combine all
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

