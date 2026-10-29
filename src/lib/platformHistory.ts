/**
 * Oddora AI - Platform History & Autopsy Persistence (src/lib/platformHistory.ts)
 *
 * Persists daily generated slips and daily analyzed picks to:
 * 1. Global in-memory cache
 * 2. Supabase Cloud Database (`oddora_v2_daily_slips` & `oddora_v2_matches`)
 *
 * Enables Result Autopsy to grade real platform history against verified final scores.
 */

import { getSupabaseAdmin, getSupabaseClient } from "./supabase";

export interface PlatformDailySnapshot {
  date: string;
  sync_bucket?: string;
  generated_at: string;
  ready_slips: any[];
  top_picks: any[];
}

export type PlatformHistoryStore = Record<string, PlatformDailySnapshot>;

let _memoryPlatformHistory: PlatformHistoryStore = {};

/**
 * Loads the platform history store from memory
 */
export function loadPlatformHistory(): PlatformHistoryStore {
  return _memoryPlatformHistory;
}

/**
 * Saves platform history store to memory
 */
export function savePlatformHistory(store: PlatformHistoryStore): void {
  _memoryPlatformHistory = { ..._memoryPlatformHistory, ...store };
}

/**
 * Persists daily ready slips into memory and Supabase
 */
export async function persistDailyReadySlips(
  date: string,
  bookmaker: string,
  slips: any[],
  syncBucket?: string
): Promise<void> {
  if (!_memoryPlatformHistory[date]) {
    _memoryPlatformHistory[date] = {
      date,
      sync_bucket: syncBucket,
      generated_at: new Date().toISOString(),
      ready_slips: [],
      top_picks: [],
    };
  }
  _memoryPlatformHistory[date].ready_slips = slips;

  try {
    const supabase = getSupabaseAdmin();
    for (const s of slips) {
      await supabase.from("oddora_v2_daily_slips").upsert(
        {
          slip_date: date,
          slip_category: s.title || s.badge || s.category || "DAILY_SLIP",
          required_tier: s.tier || s.required_tier || "FREE",
          total_odds: Number(s.target_odds || s.total_odds || s.actual_odds || 2.0),
          match_count: s.slip?.legs?.length || s.legs?.length || 3,
          sportybet_code: s.slip?.sportybet_code || s.sporty_code || s.sportybet_code || "ODDORA",
          bet9ja_code: null,
          legs_json: s.slip?.legs || s.legs || [],
          slip_result: "PENDING",
        },
        { onConflict: "id" }
      );
    }
  } catch (err) {
    console.warn("persistDailyReadySlips supabase warning:", err);
  }
}

/**
 * Persists daily picks into memory
 */
export async function persistDailyPicks(
  date: string,
  picks: any[],
  syncBucket?: string
): Promise<void> {
  if (!_memoryPlatformHistory[date]) {
    _memoryPlatformHistory[date] = {
      date,
      sync_bucket: syncBucket,
      generated_at: new Date().toISOString(),
      ready_slips: [],
      top_picks: [],
    };
  }
  _memoryPlatformHistory[date].top_picks = picks;
}

/**
 * Retrieves snapshot from memory
 */
export function getPlatformSnapshot(date: string): PlatformDailySnapshot | null {
  return _memoryPlatformHistory[date] || null;
}

/**
 * Retrieves platform snapshot, fetching from Supabase if not in memory
 */
export async function getPlatformSnapshotWithSupabase(
  date: string
): Promise<PlatformDailySnapshot | null> {
  if (_memoryPlatformHistory[date]) {
    return _memoryPlatformHistory[date];
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: slips } = await supabase
      .from("oddora_v2_daily_slips")
      .select("*")
      .eq("slip_date", date);

    const { data: matches } = await supabase
      .from("oddora_v2_matches")
      .select("*")
      .eq("match_date", date);

    const snapshot: PlatformDailySnapshot = {
      date,
      generated_at: new Date().toISOString(),
      ready_slips: (slips || []).map((s: any) => ({
        id: s.id,
        tier: s.required_tier,
        target_odds: Number(s.total_odds),
        slip: {
          sportybet_code: s.sportybet_code,
          bet9ja_code: null,
          actual_odds: Number(s.total_odds),
          legs: s.legs_json || [],
        },
      })),
      top_picks: (matches || []).map((m: any) => ({
        fixture_id: m.match_id,
        home_team: m.home_team,
        away_team: m.away_team,
        league_name: m.league_name,
        selected_market: m.best_outcome,
        odd_value: Number(m.odd_value),
        win_probability: Number(m.win_probability),
      })),
    };

    _memoryPlatformHistory[date] = snapshot;
    return snapshot;
  } catch (err) {
    console.warn("getPlatformSnapshotWithSupabase warning:", err);
    return null;
  }
}

