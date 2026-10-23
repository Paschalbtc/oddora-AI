/**
 * Oddora AI - Platform History & Midnight Autopsy Persistence Flow
 * 
 * Persists daily generated slips and daily analyzed picks to:
 * 1. Server JSON storage (/tmp/oddora_platform_history.json)
 * 2. Supabase Cloud Database (generated_slips & ai_predictions tables)
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

/**
 * Loads the platform history store from /tmp
 */
export function loadPlatformHistory(): PlatformHistoryStore {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read platform history from disk:", err);
  }
  return {};
}

/**
 * Saves the platform history store to /tmp
 */
export function savePlatformHistory(store: PlatformHistoryStore): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write platform history to disk:", err);
  }
}

/**
 * Persists today's generated ready slips into platform history
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

  // Background non-blocking sync to Supabase generated_slips
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
 * Persists today's analyzed match picks into platform history
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

  // Keep top 12 picks for autopsy grading
  existing.top_picks = picks.slice(0, 12).map((p) => ({
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
}

/**
 * Retrieves platform snapshot for a specific date (e.g. yesterday)
 */
export function getPlatformSnapshot(date: string): PlatformDailySnapshot | null {
  const history = loadPlatformHistory();
  if (history[date]) {
    return history[date];
  }
  return null;
}
