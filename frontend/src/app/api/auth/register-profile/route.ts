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

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let res = "ODD-";
  for (let i = 0; i < 5; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, full_name = "Oddora Member", email, phone_number = "", referred_by_code = null } = body;

    if (!user_id || !email) {
      return NextResponse.json({ status: "error", message: "Missing required fields" }, { status: 400 });
    }

    // Check if profile already exists
    const { data: existing } = await supabaseAdmin.from("profiles").select("*").eq("id", user_id).single();
    if (existing) {
      return NextResponse.json({
        status: "success",
        message: "Profile already exists",
        profile: existing,
      });
    }

    // Generate unique referral code
    let referralCode = generateReferralCode();
    for (let i = 0; i < 5; i++) {
      const { data: chk } = await supabaseAdmin.from("profiles").select("id").eq("referral_code", referralCode).single();
      if (!chk) break;
      referralCode = generateReferralCode();
    }

    let validReferredBy: string | null = null;
    let referrerProfile: any = null;

    if (referred_by_code) {
      const cleanRef = String(referred_by_code).trim().toUpperCase();
      const { data: refUser } = await supabaseAdmin.from("profiles").select("*").eq("referral_code", cleanRef).single();
      if (refUser) {
        referrerProfile = refUser;
        validReferredBy = cleanRef;
      }
    }

    const newProfile = {
      id: user_id,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phone_number.trim(),
      plan_tier: "FREE",
      subscription_cycle: "NONE",
      daily_chat_used: 0,
      referral_code: referralCode,
      referred_by_code: validReferredBy,
      affiliate_balance: 0.0,
      total_referrals: 0,
      is_admin: false,
    };

    const { data: created, error: insertError } = await supabaseAdmin.from("profiles").insert(newProfile).select().single();

    if (insertError) {
      return NextResponse.json({ status: "error", message: insertError.message }, { status: 500 });
    }

    // If referred by someone, record referral and increment total_referrals
    if (referrerProfile && validReferredBy) {
      try {
        await supabaseAdmin.from("affiliate_referrals").insert({
          referrer_id: referrerProfile.id,
          referred_user_id: user_id,
          referred_name: full_name.trim(),
          plan_purchased: "FREE",
          commission_earned: 0.0,
          status: "ACTIVE",
        });

        const newTotal = (referrerProfile.total_referrals || 0) + 1;
        await supabaseAdmin.from("profiles").update({ total_referrals: newTotal }).eq("id", referrerProfile.id);
      } catch (e) {
        console.warn("Affiliate referral link error:", e);
      }
    }

    return NextResponse.json({
      status: "success",
      message: "User profile successfully registered on Supabase",
      profile: created || newProfile,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

