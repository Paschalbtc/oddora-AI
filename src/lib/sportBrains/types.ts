import { getSupabaseAdmin } from "../supabase";

export type SportType = "football" | "basketball" | "volleyball" | "tennis";

export interface AnalyzedOutcome {
  sport: SportType;
  market_name: string;
  selection_label: string;
  odd_value: number;
  win_probability: number; // Percentage e.g. 84.5
  confidence_score: number; // 0 - 100
  is_over25_candidate?: boolean;
  internal_ai_reasoning: string;
  metadata?: Record<string, any>;
}

export interface AIDirective {
  id?: string;
  directive_type?: string;
  rule_name: string;
  sport: string;
  market_affected: string;
  weight_adjustment: number;
  min_probability_threshold?: number;
  condition_criteria?: Record<string, any>;
  is_active: boolean;
  notes?: string;
}

// In-memory cache for directives to avoid querying Supabase on every single leg analysis
let _cachedDirectives: { timestamp: number; data: AIDirective[] } = {
  timestamp: 0,
  data: [],
};

export async function getActiveDirectives(sport?: SportType): Promise<AIDirective[]> {
  const now = Date.now();
  if (now - _cachedDirectives.timestamp < 60000 && _cachedDirectives.data.length > 0) {
    if (!sport) return _cachedDirectives.data;
    return _cachedDirectives.data.filter(
      (d) => d.sport === "all" || d.sport === sport
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("oddora_v2_ai_directives")
      .select("*")
      .eq("is_active", true);

    if (error || !data) {
      return _cachedDirectives.data || [];
    }

    _cachedDirectives = {
      timestamp: now,
      data: data as AIDirective[],
    };

    if (!sport) return _cachedDirectives.data;
    return _cachedDirectives.data.filter(
      (d) => d.sport === "all" || d.sport === sport
    );
  } catch {
    return _cachedDirectives.data || [];
  }
}
