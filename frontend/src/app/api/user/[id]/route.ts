import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ status: "error", message: "User ID required" }, { status: 400 });
    }

    // 1. Fetch user profile
    const { data: profile, error: profError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profError || !profile) {
      return NextResponse.json({ status: "error", message: "Profile not found" }, { status: 404 });
    }

    // 2. Fetch referrals
    const { data: referrals } = await supabaseAdmin
      .from("affiliate_referrals")
      .select("*")
      .eq("referrer_id", id)
      .order("created_at", { ascending: false });

    const referralList = referrals || [];
    const totalCommission = referralList.reduce((acc, r) => acc + Number(r.commission_earned || 0), 0);

    return NextResponse.json({
      status: "success",
      user_id: profile.id,
      profile: profile,
      plan_tier: profile.plan_tier || "FREE",
      subscription_cycle: profile.subscription_cycle || "NONE",
      referral_code: profile.referral_code,
      referral_link: `https://oddora.ai/auth?ref=${profile.referral_code}`,
      affiliate_balance: Number(profile.affiliate_balance || 0),
      total_referrals: Number(profile.total_referrals || 0),
      total_commission_earned: Math.round(totalCommission * 100) / 100,
      referrals: referralList,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

