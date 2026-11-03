/**
 * Multi-Sport Score Parser & Outcome Grader (src/lib/gradeSlipOutcome.ts)
 *
 * Full-fidelity score extraction and outcome verification across:
 * - Football (sr:sport:1): FT, HT, 2nd Half, WEH, Score Clusters, Asian Handicap, 1X2, DC, O/U, BTTS, DNB.
 * - Basketball (sr:sport:2): Full Match Points (inc. OT), Q1-Q4 Quarters, 1st Half Moneyline, Total Points, Spreads.
 * - Volleyball (sr:sport:23): Set Scores, Over/Under 3.5 Sets, +1.5/+2.5 Set Handicaps, Total Points (O175.5), 1st Set O44.5.
 * - Table Tennis (sr:sport:20): Set Scores, Total Sets, Total Match Points (O72.5 / O74.5), +1.5/+2.5 Handicaps.
 * - Tennis (sr:sport:5): Sets Won, Set Handicaps, Total Sets, Match Winner.
 */

export interface ParsedSportScore {
  sport: string;
  status: "Upcoming" | "Live" | "Finished" | "Void";
  raw_status?: string;

  // Final / Full-Time score or sets
  ft_home_score: number | null;
  ft_away_score: number | null;

  // Football / Basketball Halves
  ht_home_score: number | null;
  ht_away_score: number | null;
  sh_home_score: number | null;
  sh_away_score: number | null;

  // Basketball / Volleyball Quarters & Sets
  period_scores: string[]; // e.g. ["28:22", "24:25"] or ["25:20", "22:25"]

  // Volleyball / Table Tennis Set Specifics
  sets_home: number | null;
  sets_away: number | null;
  total_match_points_home: number | null;
  total_match_points_away: number | null;
  first_set_total_points: number | null;
  first_set_home: number | null;
  first_set_away: number | null;

  raw_score_str: string;
}

export interface LegToGrade {
  match: string;
  home_team?: string;
  away_team?: string;
  market: string;
  selection: string;
  odd?: number;
  odds?: number;
  sport?: string;
  sport_type?: string;
  status?: "PENDING" | "WON" | "LOST" | "VOID";
  specifier?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  eventId?: string;
}

export interface LegGradingResult {
  status: "PENDING" | "WON" | "LOST" | "VOID";
  home_score: number | null;
  away_score: number | null;
  reason?: string;
}

/**
 * Standardizes match statuses into canonical stages
 */
export function normalizeMatchStatus(
  status?: string | boolean | null
): "Upcoming" | "Live" | "Finished" | "Void" {
  if (status === true) return "Finished";
  if (status === false) return "Live";
  if (!status) return "Upcoming";

  const s = String(status).trim().toUpperCase();

  if (
    s === "POSTPONED" ||
    s === "CANCELLED" ||
    s === "CANC" ||
    s === "POSTP" ||
    s === "VOID" ||
    s === "ABANDONED" ||
    s === "SUSPENDED" ||
    s === "INTERRUPTED"
  ) {
    return "Void";
  }

  if (
    s === "FT" ||
    s === "FINISHED" ||
    s === "AET" ||
    s === "AP" ||
    s === "ENDED" ||
    s === "FINAL" ||
    s === "CLOSED"
  ) {
    return "Finished";
  }

  if (
    s === "LIVE" ||
    s === "IN_PLAY" ||
    s === "1H" ||
    s === "2H" ||
    s === "HT" ||
    s === "ET" ||
    s === "P" ||
    s.startsWith("Q") ||
    s.startsWith("SET")
  ) {
    return "Live";
  }

  return "Upcoming";
}

/**
 * Helper to parse a "X:Y" or "X-Y" score string into numbers [home, away]
 */
export function parseScorePair(str?: string | null): [number, number] | null {
  if (!str) return null;
  const parts = String(str)
    .trim()
    .split(/[-:]/)
    .map((p) => parseInt(p.trim(), 10));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return null;
}

/**
 * Sport-Aware Score Harvester Parser
 * Extracts and computes deep scores from SportyBet `setScore` and `gameScore` arrays
 */
export function parseRawSportScore(
  sportInput: string = "FOOTBALL",
  setScore?: string | null,
  gameScore?: any,
  rawStatus?: string | null
): ParsedSportScore {
  const sport = (sportInput || "FOOTBALL").toUpperCase().trim();
  const canonicalStatus = normalizeMatchStatus(rawStatus);

  let periodArr: string[] = [];
  if (Array.isArray(gameScore)) {
    periodArr = gameScore.filter((g) => typeof g === "string" && g.includes(":"));
  } else if (typeof gameScore === "string") {
    try {
      const parsed = JSON.parse(gameScore);
      if (Array.isArray(parsed)) {
        periodArr = parsed.filter((g) => typeof g === "string" && g.includes(":"));
      }
    } catch {
      if (gameScore.includes(":")) periodArr = [gameScore];
    }
  }

  const setPair = parseScorePair(setScore);

  const result: ParsedSportScore = {
    sport,
    status: canonicalStatus,
    raw_status: rawStatus || undefined,
    ft_home_score: setPair ? setPair[0] : null,
    ft_away_score: setPair ? setPair[1] : null,
    ht_home_score: null,
    ht_away_score: null,
    sh_home_score: null,
    sh_away_score: null,
    period_scores: periodArr,
    sets_home: null,
    sets_away: null,
    total_match_points_home: null,
    total_match_points_away: null,
    first_set_total_points: null,
    first_set_home: null,
    first_set_away: null,
    raw_score_str: setScore || (periodArr.length > 0 ? periodArr.join(", ") : ""),
  };

  // 1. FOOTBALL (sr:sport:1)
  if (sport === "FOOTBALL" || sport === "SR:SPORT:1" || sport === "SOCCER") {
    if (periodArr.length > 0) {
      const htPair = parseScorePair(periodArr[0]);
      if (htPair) {
        result.ht_home_score = htPair[0];
        result.ht_away_score = htPair[1];

        if (result.ft_home_score !== null && result.ft_away_score !== null) {
          result.sh_home_score = Math.max(0, result.ft_home_score - result.ht_home_score);
          result.sh_away_score = Math.max(0, result.ft_away_score - result.ht_away_score);
        }
      }
    }
    return result;
  }

  // 2. BASKETBALL (sr:sport:2)
  if (sport === "BASKETBALL" || sport === "SR:SPORT:2") {
    // ft_home_score / ft_away_score = Full match points (inc. OT) from setScore
    // ht_home_score = Q1_home + Q2_home; ht_away_score = Q1_away + Q2_away
    if (periodArr.length >= 2) {
      const q1 = parseScorePair(periodArr[0]);
      const q2 = parseScorePair(periodArr[1]);
      if (q1 && q2) {
        result.ht_home_score = q1[0] + q2[0];
        result.ht_away_score = q1[1] + q2[1];
      }
    } else if (periodArr.length === 1) {
      const h1 = parseScorePair(periodArr[0]);
      if (h1) {
        result.ht_home_score = h1[0];
        result.ht_away_score = h1[1];
      }
    }
    return result;
  }

  // 3. VOLLEYBALL (sr:sport:23), TABLE TENNIS (sr:sport:20), TENNIS (sr:sport:5)
  if (
    sport === "VOLLEYBALL" ||
    sport === "SR:SPORT:23" ||
    sport === "TABLE_TENNIS" ||
    sport === "TABLE TENNIS" ||
    sport === "SR:SPORT:20" ||
    sport === "TENNIS" ||
    sport === "SR:SPORT:5"
  ) {
    // sets_home / sets_away = parsed from setScore (Sets won, e.g. "3:1")
    if (setPair) {
      result.sets_home = setPair[0];
      result.sets_away = setPair[1];
    }

    // Calculate sum of points across all sets in gameScore
    let sumHomePoints = 0;
    let sumAwayPoints = 0;
    let hasPoints = false;

    periodArr.forEach((pStr, idx) => {
      const pPair = parseScorePair(pStr);
      if (pPair) {
        hasPoints = true;
        sumHomePoints += pPair[0];
        sumAwayPoints += pPair[1];

        if (idx === 0) {
          result.first_set_home = pPair[0];
          result.first_set_away = pPair[1];
          result.first_set_total_points = pPair[0] + pPair[1];
        }
      }
    });

    if (hasPoints) {
      result.total_match_points_home = sumHomePoints;
      result.total_match_points_away = sumAwayPoints;
    }

    return result;
  }

  return result;
}

/**
 * Normalizes team strings for substring / token matching
 */
function normalizeTeam(str: string = ""): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Determines whether the user backed the Home team/player or the Away team/player
 */
function isHomeSelection(selection: string, leg: LegToGrade): boolean {
  const sel = selection.toLowerCase().trim();
  const hTeam = normalizeTeam(leg.home_team || "");
  const aTeam = normalizeTeam(leg.away_team || "");

  if (sel === "1" || sel.startsWith("1 -") || sel.startsWith("home") || sel.includes("(1)")) return true;
  if (sel === "2" || sel.startsWith("2 -") || sel.startsWith("away") || sel.includes("(2)")) return false;

  const selNorm = normalizeTeam(sel);
  if (hTeam && selNorm.includes(hTeam)) return true;
  if (aTeam && selNorm.includes(aTeam)) return false;

  return true; // Default fallback to home if ambiguous
}

/**
 * Extracts a numeric handicap or spread value from string (e.g. "+8.5" -> 8.5, "-4.5" -> -4.5)
 */
function extractSpreadValue(str: string): number | null {
  const match = str.match(/([+-]?\d+\.?\d*)/);
  if (match) {
    const v = parseFloat(match[1]);
    if (!isNaN(v)) return v;
  }
  return null;
}

/**
 * Extracts a numeric threshold/line (e.g. "208.5", "44.5", "175.5") from selection, market or specifier
 */
function extractThresholdLine(sel: string, mkt: string, specifier?: string | null): number | null {
  if (specifier) {
    const specMatch = specifier.match(/total=([0-9.]+)/i);
    if (specMatch) {
      const v = parseFloat(specMatch[1]);
      if (!isNaN(v)) return v;
    }
  }

  // 1. Look for number immediately following over/under or o/u, e.g. "Over 44.5", "O208.5", "Under 235.5"
  const overUnderMatch = sel.match(/(?:over|under|o|u)\s*([0-9]+\.?[0-9]*)/i);
  if (overUnderMatch) {
    const v = parseFloat(overUnderMatch[1]);
    if (!isNaN(v)) return v;
  }

  // 2. Look in market for over/under number
  const mktOverUnderMatch = mkt.match(/(?:over|under|o|u)\s*([0-9]+\.?[0-9]*)/i);
  if (mktOverUnderMatch) {
    const v = parseFloat(mktOverUnderMatch[1]);
    if (!isNaN(v)) return v;
  }

  // 3. Fallback: match any decimal number (e.g. "44.5", "208.5") in selection or market
  const decimalMatch = (sel + " " + mkt).match(/([0-9]+\.[0-9]+)/);
  if (decimalMatch) {
    const v = parseFloat(decimalMatch[1]);
    if (!isNaN(v)) return v;
  }

  return null;
}

/**
 * Core Multi-Sport Outcome Grader
 * Evaluates a single leg against parsed match scores across all supported sports & VIP markets
 */
export function gradeLegOutcome(
  leg: LegToGrade,
  scoreInput?: ParsedSportScore | number | null,
  awayScoreFallback?: number | null,
  statusFallback?: string | null
): LegGradingResult {
  // 1. Resolve ParsedSportScore
  let score: ParsedSportScore;

  if (scoreInput && typeof scoreInput === "object" && "sport" in scoreInput) {
    score = scoreInput as ParsedSportScore;
  } else {
    // Constructed from numeric home / away scores
    const h = typeof scoreInput === "number" ? scoreInput : leg.home_score ?? null;
    const a = typeof awayScoreFallback === "number" ? awayScoreFallback : leg.away_score ?? null;
    const rawSt = statusFallback || (h !== null && a !== null ? "FT" : "SCHEDULED");
    const setScoreStr = h !== null && a !== null ? `${h}:${a}` : null;
    score = parseRawSportScore(
      leg.sport || leg.sport_type || "FOOTBALL",
      setScoreStr,
      null,
      rawSt
    );
  }

  // 2. Status Guardrails
  if (score.status === "Void") {
    return { status: "VOID", home_score: score.ft_home_score, away_score: score.ft_away_score, reason: "Match postponed or cancelled" };
  }

  if (score.status === "Upcoming" || score.status === "Live") {
    return { status: "PENDING", home_score: score.ft_home_score, away_score: score.ft_away_score, reason: "Match active or scheduled" };
  }

  // If score is missing on finished match, maintain pending
  if (score.ft_home_score === null || score.ft_away_score === null) {
    return { status: leg.status || "PENDING", home_score: null, away_score: null, reason: "Score pending verification" };
  }

  const h = score.ft_home_score;
  const a = score.ft_away_score;
  const sport = (score.sport || leg.sport || leg.sport_type || "FOOTBALL").toUpperCase().trim();
  const sel = (leg.selection || "").toLowerCase().trim();
  const mkt = (leg.market || "").toLowerCase().trim();
  const isHome = isHomeSelection(sel, leg);

  // ==========================================================================
  // SECTION A: BASKETBALL MARKETS (sr:sport:2)
  // ==========================================================================
  if (sport === "BASKETBALL" || sport === "SR:SPORT:2") {
    const totalPoints = h + a;

    // 1. 1st Half Moneyline Winner
    if (mkt.includes("1st half") || sel.includes("1st half") || mkt.includes("first half")) {
      const qHome = score.ht_home_score;
      const qAway = score.ht_away_score;
      if (qHome !== null && qAway !== null) {
        if (isHome) {
          return { status: qHome > qAway ? "WON" : "LOST", home_score: h, away_score: a, reason: `1st Half Points: ${qHome}-${qAway}` };
        } else {
          return { status: qAway > qHome ? "WON" : "LOST", home_score: h, away_score: a, reason: `1st Half Points: ${qHome}-${qAway}` };
        }
      }
    }

    // 2. Buffered Total Points Over / Under (e.g. O208.5, U235.5)
    if (sel.includes("over") || sel.includes("under") || mkt.includes("total") || mkt.includes("points")) {
      const line = extractThresholdLine(sel, mkt, leg.specifier);
      if (line !== null) {
        const isOver = sel.includes("over") || sel.startsWith("o");
        const won = isOver ? totalPoints > line : totalPoints < line;
        return {
          status: won ? "WON" : "LOST",
          home_score: h,
          away_score: a,
          reason: `Total Points: ${totalPoints} vs Line: ${line}`,
        };
      }
    }

    // 3. Alternate Spread (+8.5 / +10.5 / -4.5)
    if (sel.includes("+") || sel.includes("-") || mkt.includes("spread") || mkt.includes("handicap")) {
      const spread = extractSpreadValue(sel);
      if (spread !== null) {
        const backedScore = isHome ? h : a;
        const oppScore = isHome ? a : h;
        const won = backedScore + spread > oppScore;
        return {
          status: won ? "WON" : "LOST",
          home_score: h,
          away_score: a,
          reason: `Spread: ${backedScore} + (${spread}) vs ${oppScore}`,
        };
      }
    }

    // 4. Moneyline Winner (Inc. OT) / Match Winner (Heavy Favourite)
    if (isHome) {
      return { status: h > a ? "WON" : "LOST", home_score: h, away_score: a, reason: `Final Match Points: ${h}-${a}` };
    } else {
      return { status: a > h ? "WON" : "LOST", home_score: h, away_score: a, reason: `Final Match Points: ${h}-${a}` };
    }
  }

  // ==========================================================================
  // SECTION B: VOLLEYBALL & TABLE TENNIS MARKETS
  // ==========================================================================
  if (
    sport === "VOLLEYBALL" ||
    sport === "SR:SPORT:23" ||
    sport === "TABLE_TENNIS" ||
    sport === "TABLE TENNIS" ||
    sport === "SR:SPORT:20" ||
    sport === "TENNIS" ||
    sport === "SR:SPORT:5"
  ) {
    const sHome = score.sets_home ?? h;
    const sAway = score.sets_away ?? a;
    const totalSets = sHome + sAway;

    // 1. 1st Set Over 44.5 Points (e.g. score at least 25-20)
    if (mkt.includes("1st set") || sel.includes("1st set") || mkt.includes("first set")) {
      const set1Points = score.first_set_total_points;
      if (set1Points !== null) {
        const line = extractThresholdLine(sel, mkt, leg.specifier) || 44.5;
        const isOver = sel.includes("over") || sel.startsWith("o");
        const won = isOver ? set1Points > line : set1Points < line;
        return {
          status: won ? "WON" : "LOST",
          home_score: sHome,
          away_score: sAway,
          reason: `1st Set Total Points: ${set1Points} vs Line: ${line}`,
        };
      }
    }

    // 2. Total Match Points Over (72.5 / 74.5 TT, 175.5 Volleyball)
    if (
      (mkt.includes("total points") || sel.includes("points") || mkt.includes("points")) &&
      !mkt.includes("set")
    ) {
      const matchPoints =
        score.total_match_points_home !== null && score.total_match_points_away !== null
          ? score.total_match_points_home + score.total_match_points_away
          : null;

      if (matchPoints !== null) {
        const defaultLine = sport.includes("TABLE") ? 74.5 : 175.5;
        const line = extractThresholdLine(sel, mkt, leg.specifier) || defaultLine;
        const isOver = sel.includes("over") || sel.startsWith("o");
        const won = isOver ? matchPoints > line : matchPoints < line;
        return {
          status: won ? "WON" : "LOST",
          home_score: sHome,
          away_score: sAway,
          reason: `Match Total Points: ${matchPoints} vs Line: ${line}`,
        };
      }
    }

    // 3. Over 3.5 Total Sets (No 3-0 Sweep) / Under 3.5 Sets
    if (sel.includes("3.5") || mkt.includes("3.5") || sel.includes("over 3.5") || sel.includes("under 3.5")) {
      const isOver = sel.includes("over") || sel.startsWith("o");
      // Over 3.5 means 4+ sets played (3-1, 1-3, 3-2, 2-3). 3-0 or 0-3 is 3 sets (lost).
      const won = isOver ? totalSets >= 4 : totalSets <= 3;
      return {
        status: won ? "WON" : "LOST",
        home_score: sHome,
        away_score: sAway,
        reason: `Total Sets: ${totalSets} (Set Score: ${sHome}-${sAway})`,
      };
    }

    // 4. Over 4.5 Total Sets / Under 4.5 Sets (5-set deciders)
    if (sel.includes("4.5") || mkt.includes("4.5")) {
      const isOver = sel.includes("over") || sel.startsWith("o");
      const won = isOver ? totalSets >= 5 : totalSets <= 4;
      return {
        status: won ? "WON" : "LOST",
        home_score: sHome,
        away_score: sAway,
        reason: `Total Sets: ${totalSets}`,
      };
    }

    // 5. Set Handicap +1.5 Sets (Wins 2+ Sets) & +2.5 Sets (Wins 1+ Set)
    if (sel.includes("+1.5") || sel.includes("+ 1.5") || mkt.includes("+1.5")) {
      const backedSets = isHome ? sHome : sAway;
      const oppSets = isHome ? sAway : sHome;
      // Wins at least 2 sets in best-of-5: backed + 1.5 > opp
      const won = backedSets + 1.5 > oppSets;
      return {
        status: won ? "WON" : "LOST",
        home_score: sHome,
        away_score: sAway,
        reason: `Set Handicap +1.5: ${backedSets} + 1.5 vs ${oppSets}`,
      };
    }

    if (sel.includes("+2.5") || sel.includes("+ 2.5") || mkt.includes("+2.5")) {
      const backedSets = isHome ? sHome : sAway;
      const oppSets = isHome ? sAway : sHome;
      // Wins at least 1 set: backed + 2.5 > opp
      const won = backedSets + 2.5 > oppSets;
      return {
        status: won ? "WON" : "LOST",
        home_score: sHome,
        away_score: sAway,
        reason: `Set Handicap +2.5: ${backedSets} + 2.5 vs ${oppSets}`,
      };
    }

    // 6. Match Winner (Heavy Favourite)
    if (isHome) {
      return { status: sHome > sAway ? "WON" : "LOST", home_score: sHome, away_score: sAway, reason: `Final Sets: ${sHome}-${sAway}` };
    } else {
      return { status: sAway > sHome ? "WON" : "LOST", home_score: sHome, away_score: sAway, reason: `Final Sets: ${sHome}-${sAway}` };
    }
  }

  // ==========================================================================
  // SECTION C: FOOTBALL & VIP MARKETS (sr:sport:1)
  // ==========================================================================
  const totalGoals = h + a;

  // 1. Favourite to Win Either Half (WEH)
  if (
    mkt.includes("win either half") ||
    mkt.includes("weh") ||
    sel.includes("win either half") ||
    sel.includes("weh")
  ) {
    const htH = score.ht_home_score ?? 0;
    const htA = score.ht_away_score ?? 0;
    const shH = score.sh_home_score !== null ? score.sh_home_score : Math.max(0, h - htH);
    const shA = score.sh_away_score !== null ? score.sh_away_score : Math.max(0, a - htA);

    const homeWonEither = htH > htA || shH > shA;
    const awayWonEither = htA > htH || shA > shH;

    const won = isHome ? homeWonEither : awayWonEither;
    return {
      status: won ? "WON" : "LOST",
      home_score: h,
      away_score: a,
      reason: `WEH: 1H (${htH}-${htA}) | 2H (${shH}-${shA})`,
    };
  }

  // 2. Exact Correct Score Cluster (1-0 / 2-0 / 2-1)
  if (
    mkt.includes("cluster") ||
    mkt.includes("correct score") ||
    sel.includes("1-0 / 2-0 / 2-1") ||
    sel.includes("1:0") ||
    sel.includes("2:0") ||
    sel.includes("2:1")
  ) {
    const scoreStr = `${h}-${a}`;
    const reverseStr = `${a}-${h}`;

    // Common VIP cluster: 1-0, 2-0, 2-1 for favourite
    if (sel.includes("1-0 / 2-0 / 2-1") || sel.includes("1-0, 2-0, 2-1")) {
      const matchFav = isHome
        ? ["1-0", "2-0", "2-1"].includes(scoreStr)
        : ["1-0", "2-0", "2-1"].includes(reverseStr);
      return {
        status: matchFav ? "WON" : "LOST",
        home_score: h,
        away_score: a,
        reason: `Score Cluster Target: 1-0/2-0/2-1 | Actual: ${scoreStr}`,
      };
    }

    // Direct score check
    const pairsInSel = sel.match(/\d+[-:]\d+/g) || [];
    if (pairsInSel.length > 0) {
      const matchesAny = pairsInSel.some((p) => {
        const pair = parseScorePair(p);
        return pair && pair[0] === h && pair[1] === a;
      });
      return {
        status: matchesAny ? "WON" : "LOST",
        home_score: h,
        away_score: a,
        reason: `Exact Cluster: Actual ${scoreStr}`,
      };
    }
  }

  // 3. Asian Handicap -0.5 / +0.5
  if (sel.includes("-0.5") || mkt.includes("-0.5")) {
    const backedScore = isHome ? h : a;
    const oppScore = isHome ? a : h;
    const won = backedScore > oppScore;
    return {
      status: won ? "WON" : "LOST",
      home_score: h,
      away_score: a,
      reason: `Asian Handicap -0.5: ${backedScore} vs ${oppScore}`,
    };
  }

  if (sel.includes("+0.5") || mkt.includes("+0.5")) {
    const backedScore = isHome ? h : a;
    const oppScore = isHome ? a : h;
    const won = backedScore >= oppScore; // Win or Draw
    return {
      status: won ? "WON" : "LOST",
      home_score: h,
      away_score: a,
      reason: `Asian Handicap +0.5: ${backedScore} vs ${oppScore}`,
    };
  }

  // 4. Double Chance (1X, X2, 12)
  if (sel === "1x" || sel === "home or draw" || sel === "1/x") {
    return { status: h >= a ? "WON" : "LOST", home_score: h, away_score: a, reason: `1X Final: ${h}-${a}` };
  }
  if (sel === "x2" || sel === "draw or away" || sel === "x/2") {
    return { status: a >= h ? "WON" : "LOST", home_score: h, away_score: a, reason: `X2 Final: ${h}-${a}` };
  }
  if (sel === "12" || sel === "home or away" || sel === "1/2") {
    return { status: h !== a ? "WON" : "LOST", home_score: h, away_score: a, reason: `12 Final: ${h}-${a}` };
  }

  // 5. Draw No Bet (DNB)
  if (sel.includes("dnb") || mkt.includes("dnb")) {
    if (h === a) {
      return { status: "VOID", home_score: h, away_score: a, reason: "DNB Draw Push" };
    }
    const won = isHome ? h > a : a > h;
    return { status: won ? "WON" : "LOST", home_score: h, away_score: a, reason: `DNB Final: ${h}-${a}` };
  }

  // 6. Both Teams To Score (BTTS / GG / NG)
  if (sel.includes("btts yes") || sel === "yes" || sel === "gg") {
    return { status: h > 0 && a > 0 ? "WON" : "LOST", home_score: h, away_score: a, reason: `BTTS: ${h}-${a}` };
  }
  if (sel.includes("btts no") || sel === "no" || sel === "ng") {
    return { status: h === 0 || a === 0 ? "WON" : "LOST", home_score: h, away_score: a, reason: `BTTS: ${h}-${a}` };
  }

  // 7. Clean Sheet
  if (mkt.includes("clean sheet") || sel.includes("clean sheet")) {
    const oppScore = isHome ? a : h;
    const won = oppScore === 0;
    return { status: won ? "WON" : "LOST", home_score: h, away_score: a, reason: `Clean Sheet Opp Goals: ${oppScore}` };
  }

  // 8. Over / Under Goals (0.5 to 4.5)
  if (sel.includes("over") || sel.includes("under") || mkt.includes("over") || mkt.includes("under")) {
    const line = extractThresholdLine(sel, mkt, leg.specifier);
    if (line !== null) {
      const isOver = sel.includes("over") || sel.startsWith("o");
      const won = isOver ? totalGoals > line : totalGoals < line;
      return {
        status: won ? "WON" : "LOST",
        home_score: h,
        away_score: a,
        reason: `Total Goals: ${totalGoals} vs Line: ${line}`,
      };
    }
  }

  // 9. Standard 1X2 / Match Result
  if (sel === "x" || sel === "draw") {
    return { status: h === a ? "WON" : "LOST", home_score: h, away_score: a, reason: `Draw Final: ${h}-${a}` };
  }
  if (isHome) {
    return { status: h > a ? "WON" : "LOST", home_score: h, away_score: a, reason: `1X2 Home Win: ${h}-${a}` };
  } else {
    return { status: a > h ? "WON" : "LOST", home_score: h, away_score: a, reason: `1X2 Away Win: ${h}-${a}` };
  }
}
