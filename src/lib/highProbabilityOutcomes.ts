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
      sportybetMarketId: "10_9",
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
      sportybetMarketId: "10_11",
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
      sportybetMarketId: "10_10",
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
      sportybetMarketId: "1_3",
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
      sportybetMarketId: "11_4",
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
      sportybetMarketId: "11_5",
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
      sportybetMarketId: "16_hcp=1.5_1714",
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
      sportybetMarketId: "139_total=3.5_12",
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
      sportybetMarketId: "139_total=5.5_13",
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
      sportybetMarketId: "31_74",
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
      sportybetMarketId: "32_74",
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
      sportybetMarketId: "47_74",
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
      sportybetMarketId: "45_274",
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
      sportybetMarketId: "16_hcp=-0.5_1714",
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
      sportybetMarketId: "16_hcp=0.5_1714",
      aiStatTrigger: "Solid underdog with resolute defensive structure",
    },
    {
      id: "fb_2nd_half_over_0_5",
      sport: "FOOTBALL",
      outcomeName: "2nd Half Over 0.5 Goals",
      shortCode: "2H O0.5",
      category: "OVER_UNDER",
      tierAccess: "PRO",
      typicalOddRange: [1.25, 1.38],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "70_total=0.5_12",
      aiStatTrigger: "High 2nd half goal rate in >= 85% of matches with late tactical shifts",
    },
    {
      id: "fb_home_or_gg",
      sport: "FOOTBALL",
      outcomeName: "Home Win or Both Teams to Score (1 or GG)",
      shortCode: "1 or GG",
      category: "COMBO_SPECIALS",
      tierAccess: "PRO",
      typicalOddRange: [1.30, 1.45],
      baseWinProbabilityFloor: 80,
      sportybetMarketId: "202_74",
      aiStatTrigger: "Home favourite scoring consistently or open end-to-end clash",
    },
    {
      id: "fb_away_or_gg",
      sport: "FOOTBALL",
      outcomeName: "Away Win or Both Teams to Score (2 or GG)",
      shortCode: "2 or GG",
      category: "COMBO_SPECIALS",
      tierAccess: "PRO",
      typicalOddRange: [1.32, 1.48],
      baseWinProbabilityFloor: 78,
      sportybetMarketId: "202_75",
      aiStatTrigger: "Away powerhouse with high BTTS variance and offensive potency",
    },
    {
      id: "fb_corners_over_6_5",
      sport: "FOOTBALL",
      outcomeName: "Over 6.5 Total Corners",
      shortCode: "Corners O6.5",
      category: "CORNERS",
      tierAccess: "PRO",
      typicalOddRange: [1.22, 1.38],
      baseWinProbabilityFloor: 86,
      sportybetMarketId: "166_total=6.5_12",
      aiStatTrigger: "Combined team corner line reliably clearing 7+ corners",
    },
    {
      id: "fb_corners_over_7_5",
      sport: "FOOTBALL",
      outcomeName: "Over 7.5 Total Corners",
      shortCode: "Corners O7.5",
      category: "CORNERS",
      tierAccess: "PRO",
      typicalOddRange: [1.30, 1.48],
      baseWinProbabilityFloor: 82,
      sportybetMarketId: "166_total=7.5_12",
      aiStatTrigger: "Active wing attack frequency with high shot volume",
    },
    {
      id: "fb_corner_handicap_plus_1_5",
      sport: "FOOTBALL",
      outcomeName: "Corner Handicap (+1.5 Corners)",
      shortCode: "C HCP+1.5",
      category: "CORNERS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.35, 1.55],
      baseWinProbabilityFloor: 79,
      sportybetMarketId: "167_hcp=1.5_1",
      aiStatTrigger: "Corner generator receiving +1.5 buffer cushion",
    },
    {
      id: "fb_alt_goal_spread_1_5",
      sport: "FOOTBALL",
      outcomeName: "Alternative Goal Spread (+1.5 Cushion)",
      shortCode: "Spread +1.5",
      category: "HANDICAP",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.25, 1.45],
      baseWinProbabilityFloor: 84,
      sportybetMarketId: "16_hcp=1.5_1714",
      aiStatTrigger: "Underdog not expected to lose by 2 or more goals",
    },
    {
      id: "fb_sub_goal_yes",
      sport: "FOOTBALL",
      outcomeName: "Goal Scored by Substitution (Yes)",
      shortCode: "Sub Goal",
      category: "SPECIALS",
      tierAccess: "PREMIUM",
      typicalOddRange: [1.45, 1.85],
      baseWinProbabilityFloor: 70,
      sportybetMarketId: "156_74",
      aiStatTrigger: "Deep bench quality facing tired defensive backlines",
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
      sportybetMarketId: "223_hcp=8.5_2",
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
      sportybetMarketId: "225_total=208.5_12",
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
      sportybetMarketId: "225_total=235.5_13",
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
  if (tier === "PRO" || tier === "PREMIUM" || tier === "VIP") {
    if (proCategories.includes(cat)) return true;
  }

  // Premium / VIP Tier unlocks everything
  if (tier === "PREMIUM" || tier === "VIP") return true;

  return false;
}

/**
 * Strict sport detector from match metadata
 */
export function detectFixtureSport(match: any): "FOOTBALL" | "BASKETBALL" | "TABLE_TENNIS" | "VOLLEYBALL" {
  const s = String(match?.sport_type || match?.sport || match?.sportId || "").toLowerCase();
  const league = String(match?.league_name || match?.league || "").toLowerCase();

  if (s.includes("sr:sport:23") || s.includes("volley") || league.includes("volleyball")) return "VOLLEYBALL";
  if (s.includes("sr:sport:20") || s.includes("table") || s.includes("ping") || league.includes("table tennis")) return "TABLE_TENNIS";
  if (s.includes("sr:sport:2") || s.includes("basket") || s.includes("nba") || league.includes("nba") || league.includes("basketball")) return "BASKETBALL";
  return "FOOTBALL";
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

/**
 * Unified Market Category Classifier
 * Enforces strict precedence: specific high-value markets (Corners, Cards, Clean Sheet, 1st Half Goals,
 * WEH, Correct Score, Asian Handicap, BTTS, DNB, Team Over, Handicap, Over/Under) are ALWAYS checked
 * before Double Chance or 1X2 so default match metadata can NEVER erroneously override true selections!
 */
export function classifyMarketCategory(market: string = "", selection: string = "", sport: string = "FOOTBALL"): string {
  const m = (market || "").toLowerCase();
  const s = (selection || "").toLowerCase();
  const sp = (sport || "").toUpperCase();

  // Multi-Sport classification
  if (sp === "BASKETBALL" || m.includes("basketball") || s.includes("nba")) {
    if (m.includes("spread") || s.includes("spread") || s.includes("+") || (s.includes("-") && !s.includes("under"))) return "BK_SPREAD";
    if (m.includes("point") || m.includes("total") || s.includes("pts") || s.includes("over") || s.includes("under")) return "BK_TOTALS";
    if (m.includes("half") || m.includes("quarter") || s.includes("1h")) return "BK_HALF";
    return "BK_MONEYLINE";
  }

  if (sp === "TABLE_TENNIS" || sp === "TABLE TENNIS" || m.includes("table tennis")) {
    if (m.includes("handicap") || s.includes("hcp") || s.includes("set hcp")) return "TT_HANDICAP";
    if (m.includes("set") || s.includes("set")) return "TT_SETS";
    if (m.includes("point") || s.includes("pts") || s.includes("point")) return "TT_POINTS";
    return "TT_WINNER";
  }

  if (sp === "VOLLEYBALL" || m.includes("volleyball")) {
    if (m.includes("handicap") || s.includes("hcp") || s.includes("set hcp")) return "VB_HANDICAP";
    if (m.includes("set") || s.includes("set")) return "VB_SETS";
    if (m.includes("point") || s.includes("pts") || s.includes("point")) return "VB_POINTS";
    return "VB_WINNER";
  }

  // Football Precedence: Check specific markets FIRST!
  if (s.includes("corner") || m.includes("corner")) return "CORNERS";
  if (s.includes("card") || m.includes("card") || s.includes("booking") || m.includes("booking")) return "CARDS";
  if (s.includes("clean sheet") || m.includes("clean sheet")) return "CLEAN_SHEET";
  if (s.includes("correct score") || s.includes("cs ") || m.includes("correct score")) return "CORRECT_SCORE";
  if (s.includes("asian") || s.includes("ah ") || m.includes("asian")) return "ASIAN_HANDICAP";
  if (s.includes("weh") || s.includes("either half") || m.includes("either half") || m.includes("win either half")) return "WIN_EITHER_HALF";
  if (s.includes("1st half") || s.includes("ht ") || s.includes("halftime") || m.includes("1st half") || m.includes("first half") || m.includes("half time")) return "FIRST_HALF_GOALS";
  if (s.includes("team over") || s.includes("to score") || m.includes("team goals") || m.includes("team total")) return "TEAM_GOALS";
  if (s.includes("dnb") || s.includes("draw no bet") || m.includes("draw no bet") || m.includes("dnb")) return "DRAW_NO_BET";
  if (s.includes("btts") || s.includes("gg") || s.includes("ng") || s.includes("both teams to score") || m.includes("both teams to score") || m.includes("btts")) return "BTTS";
  if (s.includes("handicap") || s.includes("hcp") || m.includes("handicap")) return "HANDICAP";
  if (
    s.includes("over") ||
    s.includes("under") ||
    s.includes("o1.5") ||
    s.includes("u3.5") ||
    s.includes("o2.5") ||
    s.includes("u2.5") ||
    s.includes("u4.5") ||
    s.includes("o0.5") ||
    s.includes("o3.5") ||
    m.includes("over/under") ||
    m.includes("total goals")
  ) {
    return "OVER_UNDER";
  }
  if (s.includes("1x") || s.includes("x2") || s.includes("12") || (m.includes("double") && !s.includes("win") && !s.includes("over") && !s.includes("under"))) {
    return "DOUBLE_CHANCE";
  }
  if (s.includes("win") || s === "1" || s === "2" || s === "x" || s.includes("(1)") || s.includes("(2)") || m.includes("1x2") || m.includes("match winner")) {
    return "1X2";
  }
  if (m.includes("double")) return "DOUBLE_CHANCE";
  return "1X2";
}

/**
 * Standardizes raw category bucket names into high-contrast uppercase UI labels
 */
export function formatMarketCategory(rawCategory: string = ""): string {
  const c = (rawCategory || "").toUpperCase().trim().replace(/[\s\-_]+/g, "_");
  if (c === "OVER_UNDER" || c === "OVER/UNDER" || c.includes("TOTAL_GOAL")) return "OVER/UNDER";
  if (c === "DOUBLE_CHANCE" || c === "DC") return "DOUBLE CHANCE";
  if (c === "1X2" || c === "MATCH_WINNER" || c === "MONEYLINE") return "1X2";
  if (c === "BTTS" || c === "GG/NG" || c === "GG_NG" || c === "BOTH_TEAMS_TO_SCORE") return "GG/NG";
  if (c === "DRAW_NO_BET" || c === "DNB") return "DRAW NO BET";
  if (c === "TEAM_GOALS" || c === "TEAM_OVER") return "TEAM GOALS";
  if (c === "HANDICAP") return "HANDICAP";
  if (c === "CORNERS" || c === "CORNER") return "CORNERS";
  if (c === "CARDS" || c === "CARD" || c === "BOOKINGS" || c.includes("BOOKINGS")) return "BOOKINGS / CARDS";
  if (c === "CLEAN_SHEET") return "CLEAN SHEET";
  if (c === "FIRST_HALF_GOALS" || c === "1ST_HALF_GOALS" || c === "HT_GOALS") return "1ST HALF GOALS";
  if (c === "WIN_EITHER_HALF" || c === "WEH") return "WIN EITHER HALF";
  if (c === "CORRECT_SCORE" || c === "CS") return "CORRECT SCORE";
  if (c === "ASIAN_HANDICAP" || c === "AH") return "ASIAN HANDICAP";
  if (c.startsWith("BK_") || c === "BASKETBALL") return "BASKETBALL";
  if (c.startsWith("TT_") || c === "TABLE_TENNIS" || c === "TABLE TENNIS") return "TABLE TENNIS";
  if (c.startsWith("VB_") || c === "VOLLEYBALL") return "VOLLEYBALL";
  return rawCategory ? rawCategory.replace(/_/g, " ").toUpperCase() : "MATCH WINNER";
}

export interface ResolvedSportyBetMarket {
  marketCategory: string; // e.g. "OVER/UNDER", "DOUBLE CHANCE", "1X2", "GG/NG", "DRAW NO BET", "TEAM GOALS", "HANDICAP", "CORNERS", "BOOKINGS / CARDS", "CLEAN SHEET", "1ST HALF GOALS", "WIN EITHER HALF", "CORRECT SCORE", "ASIAN HANDICAP", "BASKETBALL", "TABLE TENNIS", "VOLLEYBALL"
  marketName: string;
  selectionName: string;
  sportybetSelection: {
    eventId: string;
    marketId: string;
    outcomeId: string;
    specifier: string | null;
  };
  odd?: number;
}

/**
 * Universal Resolver across all 26 Markets & Multi-Sport Categories.
 * Unifies the UI category subtitle with exact Sportradar / SportyBet IDs.
 */
export function resolveSportyBetMarket(
  outcomeLabel: string = "",
  match: any = {},
  fallbackMarket: string = ""
): ResolvedSportyBetMarket {
  const rawEvId =
    match?.sportybet_selection?.eventId ||
    match?.sportybetSelection?.eventId ||
    match?.eventId ||
    match?.event_id ||
    match?.matchId ||
    match?.match_id ||
    match?.id ||
    "";
  let cleanEvId = String(rawEvId).trim();
  if (cleanEvId && !cleanEvId.startsWith("sr:match:")) {
    const digits = cleanEvId.replace(/\D/g, "");
    cleanEvId = digits.length >= 4 ? `sr:match:${digits}` : `sr:match:${cleanEvId}`;
  }

  const sport = (match?.sport_type || match?.sport || "FOOTBALL").toUpperCase();
  const rawCat = classifyMarketCategory(fallbackMarket || match?.market || match?.market_name || "", outcomeLabel, sport);
  const formattedCat = formatMarketCategory(rawCat);

  // 1. Inspect match.all_markets_json if present (real open markets on SportyBet)
  let allMarkets: any[] = [];
  if (Array.isArray(match?.all_markets_json)) {
    allMarkets = match.all_markets_json;
  } else if (typeof match?.all_markets_json === "string") {
    try {
      allMarkets = JSON.parse(match.all_markets_json);
    } catch {}
  }

  const sLower = (outcomeLabel || "").toLowerCase();

  if (allMarkets.length > 0) {
    let matchedItem = allMarkets.find((m) => {
      if (!m || !m.marketId || !m.outcomeId) return false;
      const mSel = String(m.selection || m.outcomeName || "").toLowerCase();
      return mSel === sLower || (sLower.length > 2 && mSel.includes(sLower)) || (sLower.length > 2 && sLower.includes(mSel));
    });

    if (!matchedItem) {
      if (rawCat === "DOUBLE_CHANCE") {
        const is1X = sLower.includes("1x");
        const isX2 = sLower.includes("x2");
        const is12 = sLower.includes("12");
        matchedItem = allMarkets.find((m) => {
          if (String(m.marketId) !== "10") return false;
          const oId = String(m.outcomeId);
          if (is1X && oId === "9") return true;
          if (is12 && oId === "10") return true;
          if (isX2 && oId === "11") return true;
          return false;
        });
      } else if (rawCat === "OVER_UNDER") {
        const isUnder = sLower.includes("under");
        const targetOId = isUnder ? "13" : "12";
        let line = "1.5";
        if (sLower.includes("0.5")) line = "0.5";
        else if (sLower.includes("2.5")) line = "2.5";
        else if (sLower.includes("3.5")) line = "3.5";
        else if (sLower.includes("4.5")) line = "4.5";
        matchedItem = allMarkets.find((m) => {
          if (String(m.marketId) !== "18") return false;
          if (String(m.outcomeId) !== targetOId) return false;
          return !m.specifier || m.specifier.includes(line);
        });
      } else if (rawCat === "BTTS") {
        const isNo = sLower.includes("no") || sLower.includes("ng");
        const targetOId = isNo ? "76" : "74";
        matchedItem = allMarkets.find((m) => String(m.marketId) === "29" && String(m.outcomeId) === targetOId);
      } else if (rawCat === "DRAW_NO_BET") {
        const isAway = sLower.includes("2") || sLower.includes("away");
        matchedItem = allMarkets.find((m) => {
          if (String(m.marketId) !== "11") return false;
          const oId = String(m.outcomeId);
          return isAway ? (oId === "5" || oId === "2") : (oId === "4" || oId === "1");
        });
      } else if (rawCat === "1X2") {
        const isHome = sLower.includes("1") || sLower.includes("home");
        const isAway = sLower.includes("2") || sLower.includes("away");
        const targetOId = isAway ? "3" : isHome ? "1" : "2";
        matchedItem = allMarkets.find((m) => String(m.marketId) === "1" && String(m.outcomeId) === targetOId);
      } else if (rawCat === "CORNERS") {
        matchedItem = allMarkets.find((m) => String(m.marketId) === "166");
      } else if (rawCat === "CARDS") {
        matchedItem = allMarkets.find((m) => String(m.marketId) === "139" || String(m.marketId) === "240");
      } else if (rawCat === "FIRST_HALF_GOALS") {
        matchedItem = allMarkets.find((m) => String(m.marketId) === "68");
      } else if (rawCat === "CLEAN_SHEET") {
        const isAway = sLower.includes("2") || sLower.includes("away");
        matchedItem = allMarkets.find((m) => String(m.marketId) === (isAway ? "32" : "31"));
      } else if (rawCat === "WIN_EITHER_HALF") {
        const isAway = sLower.includes("2") || sLower.includes("away");
        matchedItem = allMarkets.find((m) => String(m.marketId) === (isAway ? "48" : "47"));
      }
    }

    if (matchedItem && matchedItem.marketId && matchedItem.outcomeId) {
      const rawOdd = Number(matchedItem.odd || matchedItem.odd_value || match?.odd_value);
      return {
        marketCategory: formattedCat,
        marketName: matchedItem.market || matchedItem.marketName || formattedCat,
        selectionName: matchedItem.selection || matchedItem.outcomeName || outcomeLabel,
        sportybetSelection: {
          eventId: cleanEvId || matchedItem.eventId || "",
          marketId: String(matchedItem.marketId),
          outcomeId: String(matchedItem.outcomeId),
          specifier: matchedItem.specifier || null,
        },
        odd: !isNaN(rawOdd) && rawOdd > 1.0 ? rawOdd : undefined,
      };
    }
  }

  // 2. Deterministic Sportradar / SportyBet Market Resolver across all 26 Markets + Multi-Sport
  let resolvedMId = "10";
  let resolvedOId = "9";
  let resolvedSpec: string | null = null;
  let resolvedMDesc = "Double Chance";
  let resolvedSelDesc = "1X (Home or Draw)";

  if (sport === "BASKETBALL" || rawCat.startsWith("BK_")) {
    if (sLower.includes("spread") || sLower.includes("+") || (sLower.includes("-") && !sLower.includes("under"))) {
      const isAway = sLower.includes("away") || sLower.includes("2");
      let hcp = "8.5";
      if (sLower.includes("10.5")) hcp = "10.5";
      else if (sLower.includes("6.5")) hcp = "6.5";
      resolvedMId = "223";
      resolvedOId = isAway ? "2" : "1";
      resolvedSpec = `hcp=${hcp}`;
      resolvedMDesc = "Point Spread";
      resolvedSelDesc = `Spread +${hcp}`;
    } else if (sLower.includes("total") || sLower.includes("pts") || sLower.includes("over") || sLower.includes("under")) {
      const isUnder = sLower.includes("under");
      let total = isUnder ? "235.5" : "208.5";
      resolvedMId = "225";
      resolvedOId = isUnder ? "13" : "12";
      resolvedSpec = `total=${total}`;
      resolvedMDesc = "Total Points";
      resolvedSelDesc = `${isUnder ? "Under" : "Over"} ${total} Points`;
    } else {
      const isAway = sLower.includes("away") || sLower.includes("2");
      resolvedMId = "219";
      resolvedOId = isAway ? "2" : "1";
      resolvedSpec = null;
      resolvedMDesc = "Moneyline";
      resolvedSelDesc = isAway ? `${match?.away_team || "Away"} Win` : `${match?.home_team || "Home"} Win`;
    }
  } else if (sport === "TABLE_TENNIS" || rawCat.startsWith("TT_")) {
    if (sLower.includes("set") || sLower.includes("hcp")) {
      let hcp = sLower.includes("2.5") ? "2.5" : "1.5";
      resolvedMId = "187";
      resolvedOId = "1714";
      resolvedSpec = `hcp=${hcp}`;
      resolvedMDesc = "Set Handicap";
      resolvedSelDesc = `Set Handicap +${hcp}`;
    } else if (sLower.includes("point") || sLower.includes("pts")) {
      resolvedMId = "201";
      resolvedOId = "12";
      resolvedSpec = "total=73.5";
      resolvedMDesc = "Total Points";
      resolvedSelDesc = "Over 73.5 Points";
    } else {
      const isAway = sLower.includes("away") || sLower.includes("2");
      resolvedMId = "186";
      resolvedOId = isAway ? "5" : "4";
      resolvedSpec = null;
      resolvedMDesc = "Match Winner";
      resolvedSelDesc = isAway ? `${match?.away_team || "Player 2"} Win` : `${match?.home_team || "Player 1"} Win`;
    }
  } else if (sport === "VOLLEYBALL" || rawCat.startsWith("VB_")) {
    if (sLower.includes("set") || sLower.includes("hcp")) {
      resolvedMId = "313";
      resolvedOId = "1714";
      resolvedSpec = "hcp=2.5";
      resolvedMDesc = "Set Handicap";
      resolvedSelDesc = "Set Handicap +2.5";
    } else if (sLower.includes("point") || sLower.includes("pts")) {
      const isS1 = sLower.includes("s1") || sLower.includes("1st");
      resolvedMId = isS1 ? "315" : "238";
      resolvedOId = "12";
      resolvedSpec = isS1 ? "total=44.5" : "total=175.5";
      resolvedMDesc = "Total Points";
      resolvedSelDesc = isS1 ? "1st Set Over 44.5" : "Over 175.5 Points";
    } else {
      const isAway = sLower.includes("away") || sLower.includes("2");
      resolvedMId = "186";
      resolvedOId = isAway ? "5" : "4";
      resolvedSpec = null;
      resolvedMDesc = "Match Winner";
      resolvedSelDesc = isAway ? `${match?.away_team || "Away"} Win` : `${match?.home_team || "Home"} Win`;
    }
  } else {
    // FOOTBALL 26 MARKETS
    switch (rawCat) {
      case "DOUBLE_CHANCE": {
        resolvedMId = "10";
        resolvedSpec = null;
        resolvedMDesc = "Double Chance";
        if (sLower.includes("x2")) {
          resolvedOId = "11";
          resolvedSelDesc = "X2 (Draw or Away)";
        } else if (sLower.includes("12")) {
          resolvedOId = "10";
          resolvedSelDesc = "12 (Home or Away)";
        } else {
          resolvedOId = "9";
          resolvedSelDesc = "1X (Home or Draw)";
        }
        break;
      }
      case "1X2": {
        resolvedMId = "1";
        resolvedSpec = null;
        resolvedMDesc = "1X2";
        if (sLower.includes("draw") || sLower === "x") {
          resolvedOId = "2";
          resolvedSelDesc = "Draw (X)";
        } else if (sLower.includes("away") || sLower.includes("2")) {
          resolvedOId = "3";
          resolvedSelDesc = `${match?.away_team || "Away"} Win`;
        } else {
          resolvedOId = "1";
          resolvedSelDesc = `${match?.home_team || "Home"} Win`;
        }
        break;
      }
      case "OVER_UNDER": {
        const isUnder = sLower.includes("under") || sLower.startsWith("u");
        let line = "1.5";
        if (sLower.includes("0.5")) line = "0.5";
        else if (sLower.includes("2.5")) line = "2.5";
        else if (sLower.includes("3.5")) line = "3.5";
        else if (sLower.includes("4.5")) line = "4.5";
        resolvedMId = "18";
        resolvedOId = isUnder ? "13" : "12";
        resolvedSpec = `total=${line}`;
        resolvedMDesc = "Over/Under Goals";
        resolvedSelDesc = `${isUnder ? "Under" : "Over"} ${line} Goals`;
        break;
      }
      case "BTTS": {
        const isNo = sLower.includes("no") || sLower.includes("ng");
        resolvedMId = "29";
        resolvedOId = isNo ? "76" : "74";
        resolvedSpec = null;
        resolvedMDesc = "Both Teams To Score";
        resolvedSelDesc = isNo ? "NG (Both Teams Score: No)" : "GG (Both Teams Score: Yes)";
        break;
      }
      case "DRAW_NO_BET": {
        const isAway = sLower.includes("2") || sLower.includes("away");
        resolvedMId = "11";
        resolvedOId = isAway ? "5" : "4";
        resolvedSpec = null;
        resolvedMDesc = "Draw No Bet";
        resolvedSelDesc = isAway ? "DNB 2 (Away Win No Bet)" : "DNB 1 (Home Win No Bet)";
        break;
      }
      case "TEAM_GOALS": {
        const isAway = sLower.includes("away") || sLower.includes("2");
        resolvedMId = isAway ? "20" : "19";
        resolvedOId = "12";
        resolvedSpec = "total=0.5";
        resolvedMDesc = isAway ? "Away Team Over 0.5" : "Home Team Over 0.5";
        resolvedSelDesc = isAway ? `${match?.away_team || "Away"} Over 0.5 Goals` : `${match?.home_team || "Home"} Over 0.5 Goals`;
        break;
      }
      case "HANDICAP": {
        resolvedMId = "16";
        resolvedOId = "1714";
        resolvedSpec = "hcp=1.5";
        resolvedMDesc = "Handicap";
        resolvedSelDesc = "Handicap +1.5";
        break;
      }
      case "CORNERS": {
        let line = sLower.includes("9.5") ? "9.5" : sLower.includes("10.5") ? "10.5" : "8.5";
        const isUnder = sLower.includes("under");
        resolvedMId = "166";
        resolvedOId = isUnder ? "13" : "12";
        resolvedSpec = `total=${line}`;
        resolvedMDesc = "Corner Over/Under";
        resolvedSelDesc = `${isUnder ? "Under" : "Over"} ${line} Corners`;
        break;
      }
      case "CARDS": {
        let line = sLower.includes("5.5") ? "5.5" : sLower.includes("4.5") ? "4.5" : "3.5";
        const isUnder = sLower.includes("under") || sLower.includes("u5.5");
        resolvedMId = "139";
        resolvedOId = isUnder ? "13" : "12";
        resolvedSpec = `total=${line}`;
        resolvedMDesc = "Total Cards";
        resolvedSelDesc = `${isUnder ? "Under" : "Over"} ${line} Cards`;
        break;
      }
      case "CLEAN_SHEET": {
        const isAway = sLower.includes("away") || sLower.includes("2");
        resolvedMId = isAway ? "32" : "31";
        resolvedOId = "74";
        resolvedSpec = null;
        resolvedMDesc = isAway ? "Away Clean Sheet" : "Home Clean Sheet";
        resolvedSelDesc = isAway ? `${match?.away_team || "Away"} Clean Sheet - Yes` : `${match?.home_team || "Home"} Clean Sheet - Yes`;
        break;
      }
      case "FIRST_HALF_GOALS": {
        const isUnder = sLower.includes("under") || sLower.includes("u1.5");
        const line = isUnder ? "1.5" : "0.5";
        resolvedMId = "68";
        resolvedOId = isUnder ? "13" : "12";
        resolvedSpec = `total=${line}`;
        resolvedMDesc = "1st Half Goals";
        resolvedSelDesc = `1st Half ${isUnder ? "Under 1.5" : "Over 0.5"}`;
        break;
      }
      case "WIN_EITHER_HALF": {
        const isAway = sLower.includes("away") || sLower.includes("2");
        resolvedMId = isAway ? "48" : "47";
        resolvedOId = "74";
        resolvedSpec = null;
        resolvedMDesc = "Win Either Half";
        resolvedSelDesc = isAway ? `${match?.away_team || "Away"} to Win Either Half` : `${match?.home_team || "Home"} to Win Either Half`;
        break;
      }
      case "CORRECT_SCORE": {
        let outcomeId = "274";
        let score = "1-0";
        if (sLower.includes("2-0")) {
          outcomeId = "276";
          score = "2-0";
        } else if (sLower.includes("2-1")) {
          outcomeId = "278";
          score = "2-1";
        }
        resolvedMId = "45";
        resolvedOId = outcomeId;
        resolvedSpec = null;
        resolvedMDesc = "Correct Score";
        resolvedSelDesc = `Correct Score ${score}`;
        break;
      }
      case "ASIAN_HANDICAP": {
        const isMinus = sLower.includes("-") || sLower.includes("minus");
        resolvedMId = "16";
        resolvedOId = "1714";
        resolvedSpec = isMinus ? "hcp=-0.5" : "hcp=0.5";
        resolvedMDesc = "Asian Handicap";
        resolvedSelDesc = `Asian Handicap ${isMinus ? "-0.5" : "+0.5"}`;
        break;
      }
      default: {
        resolvedMId = "10";
        resolvedOId = "9";
        resolvedSpec = null;
        resolvedMDesc = "Double Chance";
        resolvedSelDesc = "1X (Home or Draw)";
        break;
      }
    }
  }

  const rawOdd = Number(match?.odd || match?.odd_value || match?.odds);

  return {
    marketCategory: formattedCat,
    marketName: resolvedMDesc,
    selectionName: outcomeLabel || resolvedSelDesc,
    sportybetSelection: {
      eventId: cleanEvId,
      marketId: resolvedMId,
      outcomeId: resolvedOId,
      specifier: resolvedSpec,
    },
    odd: !isNaN(rawOdd) && rawOdd > 1.0 ? rawOdd : undefined,
  };
}
