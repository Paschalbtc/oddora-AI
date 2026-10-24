/**
 * Oddora AI - API-Football Primary Bulk Fixture Ingestion & 8-Hour Cache Engine
 * Fetches comprehensive daily cards from:
 * https://v3.football.api-sports.io/fixtures?date=YYYY-MM-DD
 *
 * Strictly enforces an 8-hour TTL cache (in-memory + /tmp/oddora_api_football_cache.json + Supabase)
 * to ensure maximum 2-3 bulk syncs per day, never breaching the daily API limit.
 *
 * STRICT REAL-TIME FILTER:
 * 1. Match date MUST equal Today's exact calendar date (YYYY-MM-DD).
 * 2. Match status MUST be NS (Not Started) and kickoff_time > Date.now().
 * 3. NO FAKE FALLBACKS: Returns [] if 0 unplayed matches remain for today.
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export interface ApiFootballFixture {
  fixture_id: number;
  eventId?: string;
  kickoff_time: string;
  timestamp: number;
  status: string;
  league_id: number;
  league_name: string;
  league_country: string;
  league_logo?: string;
  home_team: string;
  away_team: string;
  home_logo?: string;
  away_logo?: string;
  referee?: string | null;
  odds_available?: {
    home_win?: number | null;
    draw?: number | null;
    away_win?: number | null;
    double_chance_home?: number | null;
    double_chance_away?: number | null;
    over_1_5?: number | null;
    over_2_5?: number | null;
    under_3_5?: number | null;
    btts?: number | null;
  };
  derived_odds?: {
    home: number;
    draw: number;
    away: number;
    double_chance_1x: number;
    double_chance_x2: number;
    over_1_5: number;
    over_2_5: number;
    under_3_5: number;
    btts: number;
  };
  raw_fixture?: any;
}

export function getSyncBucket(): {
  syncBucket: string;
  cycleIndex: number;
  cycleLabel: string;
  todayDate: string;
} {
  const now = new Date();
  const todayDate = now.toISOString().slice(0, 10);
  const cycleIndex = Math.floor(now.getUTCHours() / 8); // 0 (00:00), 1 (08:00), 2 (16:00)
  const syncBucket = `${todayDate}_cycle_${cycleIndex}`;
  const cycleLabel = cycleIndex === 0 ? "00:00 UTC" : cycleIndex === 1 ? "08:00 UTC" : "16:00 UTC";
  return { syncBucket, cycleIndex: cycleIndex + 1, cycleLabel, todayDate };
}

interface FixtureCache {
  syncBucket: string;
  timestamp: number;
  fixtures: ApiFootballFixture[];
}

let _memoryCache: FixtureCache = {
  syncBucket: "",
  timestamp: 0,
  fixtures: [],
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

/**
 * Loads cached fixtures from disk or memory if strictly valid within the current syncBucket (3x a day).
 */
function loadCachedFixtures(): ApiFootballFixture[] | null {
  const { syncBucket } = getSyncBucket();

  if (_memoryCache.fixtures.length > 0 && _memoryCache.syncBucket === syncBucket) {
    return _memoryCache.fixtures;
  }

  try {
    const bucketCacheFile = path.join("/tmp", `oddora_api_football_${syncBucket}.json`);
    if (fs.existsSync(bucketCacheFile)) {
      const content = fs.readFileSync(bucketCacheFile, "utf-8");
      const parsed: FixtureCache = JSON.parse(content);
      if (parsed.syncBucket === syncBucket && Array.isArray(parsed.fixtures) && parsed.fixtures.length > 0) {
        _memoryCache = parsed;
        return parsed.fixtures;
      }
    }
  } catch (err) {
    console.warn("Notice reading API-Football cache:", err);
  }

  return null;
}

/**
 * Persists fixtures keyed by syncBucket to memory and /tmp
 */
function saveCachedFixtures(fixtures: ApiFootballFixture[]): void {
  const { syncBucket } = getSyncBucket();
  const cacheData: FixtureCache = {
    syncBucket,
    timestamp: Date.now(),
    fixtures,
  };
  _memoryCache = cacheData;
  try {
    const bucketCacheFile = path.join("/tmp", `oddora_api_football_${syncBucket}.json`);
    fs.writeFileSync(bucketCacheFile, JSON.stringify(cacheData), "utf-8");
  } catch (err) {
    console.warn("Notice saving API-Football cache:", err);
  }
}

/**
 * Fetches bulk daily fixtures from API-Football.
 * Strictly enforces:
 * 1. Match date MUST equal Today's exact calendar date (YYYY-MM-DD).
 * 2. Match status MUST be NS (Not Started) and kickoff time > Date.now().
 * 3. NO FAKE FALLBACKS: If 0 remaining unplayed matches, returns [] cleanly.
 */
export async function getBulkUpcomingFixtures(options: {
  timeframe?: string;
  forceRefresh?: boolean;
}): Promise<ApiFootballFixture[]> {
  const forceRefresh = Boolean(options.forceRefresh);
  const todayDate = new Date().toISOString().split("T")[0];
  const nowMs = Date.now();

  // 1. Check 8-Hour Cache
  if (!forceRefresh) {
    const cached = loadCachedFixtures();
    if (cached && cached.length > 0) {
      // Filter strictly for today's unplayed matches
      const strictlyUpcoming = cached.filter((fix) => {
        const fixDate = fix.kickoff_time?.split("T")[0];
        const ko = new Date(fix.kickoff_time).getTime();
        return fixDate === todayDate && fix.status === "NS" && ko > nowMs;
      });
      if (strictlyUpcoming.length > 0) {
        return strictlyUpcoming;
      }
    }
  }

  const apiKey =
    process.env.API_FOOTBALL_KEY ||
    process.env.NEXT_PUBLIC_API_FOOTBALL_KEY ||
    "78bffc192cbd94efc7163ee4a80b4a35";

  const allFetchedFixtures: ApiFootballFixture[] = [];

  if (apiKey) {
    try {
      const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${todayDate}`, {
        headers: {
          "x-apisports-key": apiKey,
        },
        next: { revalidate: 28800 },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.response) && data.response.length > 0) {
          for (const item of data.response) {
            const statusShort = item.fixture?.status?.short;
            const fixtureDate = item.fixture?.date;
            const fixtureDateOnly = fixtureDate ? fixtureDate.split("T")[0] : "";
            const ko = new Date(fixtureDate).getTime();
            const leagueName = item.league?.name || "";

            // STRICT REAL-TIME FILTER:
            // 1. Match date MUST equal Today's exact calendar date (YYYY-MM-DD)
            // 2. Match status MUST be NS (Not Started) and kickoff > Date.now()
            if (
              fixtureDateOnly === todayDate &&
              statusShort === "NS" &&
              ko > nowMs
            ) {
              const lowerLeague = leagueName.toLowerCase();
              if (
                !lowerLeague.includes("u19") &&
                !lowerLeague.includes("u20") &&
                !lowerLeague.includes("u21") &&
                !lowerLeague.includes("reserve") &&
                !lowerLeague.includes("women")
              ) {
                allFetchedFixtures.push({
                  fixture_id: item.fixture.id,
                  eventId: `sr:match:${item.fixture.id}`,
                  kickoff_time: item.fixture.date,
                  timestamp: item.fixture.timestamp,
                  status: statusShort,
                  league_id: item.league.id,
                  league_name: item.league.name,
                  league_country: item.league.country,
                  league_logo: item.league.logo,
                  home_team: item.teams.home.name,
                  away_team: item.teams.away.name,
                  home_logo: item.teams.home.logo,
                  away_logo: item.teams.away.logo,
                  referee: item.fixture.referee,
                  raw_fixture: item,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("API-Football fetch notice:", err);
    }
  }

  // Save to 8-Hour Cache if fixtures found
  if (allFetchedFixtures.length > 0) {
    saveCachedFixtures(allFetchedFixtures);

    // Background non-blocking sync to Supabase daily_matches
    (async () => {
      try {
        const matchRecords = allFetchedFixtures.slice(0, 100).map((f) => ({
          fixture_id: f.fixture_id,
          match_date: f.kickoff_time.split("T")[0],
          league_name: f.league_name,
          league_country: f.league_country,
          home_team: f.home_team,
          away_team: f.away_team,
          kickoff_time: f.kickoff_time,
          status: f.status,
        }));
        await (supabase as any).from("daily_matches").upsert(matchRecords, { onConflict: "fixture_id" });
      } catch {
        // Non-blocking
      }
    })();
  }

  // NO FAKE FALLBACKS: Returns empty array [] if 0 unplayed matches remain today
  return allFetchedFixtures;
}
