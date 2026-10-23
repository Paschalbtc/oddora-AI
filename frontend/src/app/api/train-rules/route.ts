import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbGJuZnRmeWxjc2p1enFiZXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTc0NjIsImV4cCI6MjEwODE3MzQ2Mn0.svZdujPkzWNdLm-mJ5XEM8S37JP5euHyoZ5YSt7tRz4";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const DEFAULT_PRESETS = [
  {
    id: "preset-1",
    rule_text: "Prioritize Over 1.5 Goals & Double Chance for 2x to 5x accumulator tickets.",
    category: "USER_DIRECTIVE",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "preset-2",
    rule_text: "Exclude international friendly fixtures and youth exhibition matches.",
    category: "USER_DIRECTIVE",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "preset-3",
    rule_text: "Require minimum 80% AI confidence score for all Safe Picks.",
    category: "USER_DIRECTIVE",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const { data: dbRules, error } = await (supabase as any)
      .from("ai_lessons_memory")
      .select("id, lesson_text, category, created_at")
      .eq("category", "USER_DIRECTIVE")
      .order("created_at", { ascending: false });

    const userRules = (dbRules || []).map((r: any) => ({
      id: r.id,
      rule_text: r.lesson_text,
      category: "USER_DIRECTIVE",
      is_active: true,
      created_at: r.created_at,
    }));

    return NextResponse.json({
      status: "success",
      rules: userRules.length > 0 ? userRules : DEFAULT_PRESETS,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "success", rules: DEFAULT_PRESETS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rule_text } = body;

    if (!rule_text || typeof rule_text !== "string" || rule_text.trim().length < 3) {
      return NextResponse.json({ status: "error", message: "Rule text must be at least 3 characters." }, { status: 400 });
    }

    const cleanRule = rule_text.trim();

    const { data, error } = await (supabase as any)
      .from("ai_lessons_memory")
      .insert({
        lesson_text: cleanRule,
        category: "USER_DIRECTIVE",
        teams_or_league: "Custom AI Directives",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "success",
      message: "Custom AI directive trained and saved to brain.",
      rule: {
        id: data?.id,
        rule_text: cleanRule,
        category: "USER_DIRECTIVE",
        is_active: true,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ status: "error", message: "Rule ID is required." }, { status: 400 });
    }

    await (supabase as any).from("ai_lessons_memory").delete().eq("id", id);

    return NextResponse.json({ status: "success", message: "Rule deleted successfully." });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

