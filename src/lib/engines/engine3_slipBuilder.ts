/**
 * Engine 3 Slip Builder - Facade Proxy to Engine 4 (Comprehensive Multi-Sport Builder)
 * (src/lib/engines/engine3_slipBuilder.ts)
 *
 * All execution is routed directly through engine4_slipBuilder.ts, ensuring:
 * 1. Revised Odds Corridors (Bankers Anchor: 1.12-1.35, Sweet-Spot: 1.12-1.55, Aggressive Value: 1.20-1.70 up to 2.05).
 * 2. Multi-Sport Matrix (Football, Basketball, Tennis, Volleyball).
 * 3. User-Controlled Probability Selector (No rigid 70% gate) with Auto-Optimize Odds Corridor fallback.
 * 4. Tier Gating (FREE, PRO, VIP).
 * 5. Strict 10-Minute Pre-Kickoff & Two-Way SportyBet Verification Loop.
 */

export * from "./engine4_slipBuilder";

// Backward-compatibility exports for legacy call-sites
export { generateMultiSportCandidatesForFixture as generateCandidateMarketsForFixture } from "./engine4_slipBuilder";

export function computeSafetyEfficiency(odd: number, winProb: number): number {
  return winProb * 1.5 - Math.abs(Math.log(odd) - 0.28) * 30;
}

export interface SolveAccumulatorParams {
  targetOdds: number;
  mode?: "banker" | "sweet_spot" | "aggressive" | string;
  sports?: string[];
  minProbability?: number;
  userTier?: "FREE" | "PRO" | "PREMIUM" | "VIP";
}
