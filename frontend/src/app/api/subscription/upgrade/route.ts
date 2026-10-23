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

const PLAN_PRICES: Record<string, number> = {
  PRO: 30.0,
  VIP: 60.0,
  FREE: 0.0,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, plan_tier = "PRO", billing_cycle = "BETA_TESTER" } = body;

    if (!user_id) {
      return NextResponse.json({ status: "error", message: "User ID required" }, { status: 400 });
    }

    const cleanTier = String(plan_tier).toUpperCase();

    // 1. Fetch current profile
    const { data: userProfile, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (fetchErr || !userProfile) {
      return NextResponse.json({ status: "error", message: "User profile not found" }, { status: 404 });
    }

    // 2. Update user plan
    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({
        plan_tier: cleanTier,
        subscription_cycle: billing_cycle,
      })
      .eq("id", user_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ status: "error", message: updateErr.message }, { status: 500 });
    }

    // 3. 30% Affiliate Commission Simulation
    let referrerInfo: any = null;
    const referredByCode = userProfile.referred_by_code;

    if (referredByCode && cleanTier !== "FREE") {
      const { data: referrer } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("referral_code", referredByCode)
        .single();

      if (referrer) {
        const planPrice = PLAN_PRICES[cleanTier] || 30.0;
        const commissionAwarded = Math.round(planPrice * 0.3 * 100) / 100;
        const newBalance = Math.round((Number(referrer.affiliate_balance || 0) + commissionAwarded) * 100) / 100;

        await supabaseAdmin
          .from("profiles")
          .update({ affiliate_balance: newBalance })
          .eq("id", referrer.id);

        await supabaseAdmin.from("affiliate_referrals").insert({
          referrer_id: referrer.id,
          referred_user_id: user_id,
          referred_name: userProfile.full_name,
          plan_purchased: `${cleanTier} (${billing_cycle})`,
          commission_earned: commissionAwarded,
          status: "PAID",
        });

        referrerInfo = {
          referrer_id: referrer.id,
          referrer_name: referrer.full_name,
          commission_awarded: commissionAwarded,
          new_affiliate_balance: newBalance,
        };
      }
    }

    return NextResponse.json({
      status: "success",
      message: `Successfully upgraded to ${cleanTier} plan`,
      profile: updatedProfile || userProfile,
      affiliate_commission_simulation: referrerInfo,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

