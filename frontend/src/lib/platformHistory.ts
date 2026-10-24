/**
 * Oddora AI - Platform History & Midnight Autopsy Persistence Flow
 * 
 * Persists daily generated slips and daily analyzed picks to:
 * 1. Global in-memory cache (zero disk loss across serverless invocations)
 * 2. Supabase Cloud Database (generated_slips & ai_predictions tables)
 * 3. Server JSON storage (/tmp/oddora_platform_history.json)
 * 
 * Enables Midnight Autopsy to grade real platform history against API-Football final scores.
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const HISTORY_FILE = path.join("/tmp", "oddora_platform_history.json");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export interface PlatformDailySnapshot {
  date: string; // "YYYY-MM-DD"
  sync_bucket?: string;
  generated_at: string;
  ready_slips: any[];
  top_picks: any[];
}

export type PlatformHistoryStore = Record<string, PlatformDailySnapshot>;

// In-memory persistent history store (guarantees survival during container reuse)
let _memoryPlatformHistory: PlatformHistoryStore = {};

/**
 * Loads the platform history store from in-memory cache and /tmp
 */
export function loadPlatformHistory(): PlatformHistoryStore {
  // 1. Check in-memory store
  if (Object.keys(_memoryPlatformHistory).length > 0) {
    return _memoryPlatformHistory;
  }

  // 2. Check disk /tmp
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        _memoryPlatformHistory = { ..._memoryPlatformHistory, ...parsed };
        return _memoryPlatformHistory;
      }
    }
  } catch (err) {
    console.warn("Could not read platform history from disk:", err);
  }

  return _memoryPlatformHistory;
}

/**
 * Saves the platform history store to in-memory cache and /tmp
 */
export function savePlatformHistory(store: PlatformHistoryStore): void {
  _memoryPlatformHistory = { ..._memoryPlatformHistory, ...store };
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(_memoryPlatformHistory, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write platform history to disk:", err);
  }
}

/**
 * Persists today's generated ready slips into platform history & Supabase
 */
export async function persistDailyReadySlips(
  date: string,
  slips: any[],
  syncBucket?: string
): Promise<void> {
  if (!date || !Array.isArray(slips) || slips.length === 0) return;

  const history = loadPlatformHistory();
  const existing = history[date] || {
    date,
    sync_bucket: syncBucket,
    generated_at: new Date().toISOString(),
    ready_slips: [],
    top_picks: [],
  };

  existing.ready_slips = slips;
  existing.sync_bucket = syncBucket || existing.sync_bucket;
  existing.generated_at = new Date().toISOString();
  history[date] = existing;

  savePlatformHistory(history);

  // Background sync to Supabase generated_slips
  try {
    const slipRecords = slips.map((s) => ({
      ticket_id: s.id,
      ticket_title: s.title,
      target_odds: s.target_odds || s.slip?.totalOdds || 0,
      actual_odds: s.slip?.totalOdds || s.target_odds || 0,
      booking_code: s.slip?.booking_code || s.booking_code || "",
      bookmaker: s.slip?.bookmaker || "SportyBet",
      legs_json: s.slip?.legs || [],
      match_date: date,
      status: "PENDING",
    }));

    await (supabase as any)
      .from("generated_slips")
      .upsert(slipRecords, { onConflict: "ticket_id" });
  } catch {
    // Non-blocking
  }
}

/**
 * Persists today's analyzed match picks into platform history & Supabase
 */
export async function persistDailyPicks(
  date: string,
  picks: any[],
  syncBucket?: string
): Promise<void> {
  if (!date || !Array.isArray(picks) || picks.length === 0) return;

  const history = loadPlatformHistory();
  const existing = history[date] || {
    date,
    sync_bucket: syncBucket,
    generated_at: new Date().toISOString(),
    ready_slips: [],
    top_picks: [],
  };

  // Keep top 16 picks for autopsy grading
  existing.top_picks = picks.slice(0, 16).map((p) => ({
    fixture_id: p.fixture_id,
    home_team: p.home_team,
    away_team: p.away_team,
    league_name: p.league_name,
    selected_market: p.selected_market,
    odd_value: p.odd_value,
    confidence_score: p.confidence_score,
    risk_category: p.risk_category,
    kickoff_time: p.kickoff_time,
  }));

  existing.sync_bucket = syncBucket || existing.sync_bucket;
  history[date] = existing;

  savePlatformHistory(history);

  // Background non-blocking sync to Supabase daily_matches & ai_predictions
  try {
    const predRecords = existing.top_picks.map((p) => ({
      fixture_id: p.fixture_id,
      match_date: date,
      selected_market: p.selected_market,
      odd_value: p.odd_value,
      confidence_score: p.confidence_score,
      risk_category: p.risk_category,
      outcome_status: "PENDING",
    }));
    await (supabase as any)
      .from("ai_predictions")
      .upsert(predRecords, { onConflict: "fixture_id" });
  } catch {
    // Non-blocking
  }
}

/**
 * Synchronous snapshot getter from memory/disk
 */
export function getPlatformSnapshot(date: string): PlatformDailySnapshot | null {
  const history = loadPlatformHistory();
  if (history[date]) {
    return history[date];
  }
  return null;
}

/**
 * Asynchronous snapshot getter that falls back to Supabase if local memory/disk was cleared
 */
export async function getPlatformSnapshotWithSupabase(date: string): Promise<PlatformDailySnapshot | null> {
  const local = getPlatformSnapshot(date);
  if (local && ((local.ready_slips && local.ready_slips.length > 0) || (local.top_picks && local.top_picks.length > 0))) {
    return local;
  }

  // Fallback to Supabase Cloud
  try {
    const [slipsRes, predsRes] = await Promise.all([
      (supabase as any).from("generated_slips").select("*").eq("match_date", date).limit(10),
      (supabase as any).from("ai_predictions").select("*").eq("match_date", date).limit(20),
    ]);

    const dbSlips = slipsRes?.data || [];
    const dbPreds = predsRes?.data || [];

    if (dbSlips.length > 0 || dbPreds.length > 0) {
      const restored: PlatformDailySnapshot = {
        date,
        generated_at: new Date().toISOString(),
        ready_slips: dbSlips.map((s: any) => ({
          id: s.ticket_id,
          tier: s.ticket_id?.includes("banker") ? "FREE" : "VIP",
          title: s.ticket_title,
          target_odds: s.target_odds,
          slip: {
            totalOdds: s.actual_odds,
            booking_code: s.booking_code,
            bookmaker: s.bookmaker || "SportyBet",
            legs: s.legs_json || [],
          },
        })),
        top_picks: dbPreds.map((p: any) => ({
          fixture_id: p.fixture_id,
          selected_market: p.selected_market,
          odd_value: p.odd_value,
          confidence_score: p.confidence_score,
          risk_category: p.risk_category,
        })),
      };

      const history = loadPlatformHistory();
      history[date] = restored;
      savePlatformHistory(history);
      return restored;
    }
  } catch (err) {
    console.warn("Notice querying Supabase for historical snapshot:", err);
  }

  return local;
}
