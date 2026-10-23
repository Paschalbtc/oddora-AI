"""
Oddora AI Backend API.
FastAPI application with full CORS middleware and production endpoints:
1. POST /api/auth/register-profile: Auth & Profile Registration with affiliate referral tracking.
2. GET  /api/user/{user_id}: User profile and affiliate network statistics.
3. POST /api/subscription/upgrade: Beta test upgrade & plan switcher with simulated 30% affiliate commission.
4. GET  /api/predictions: Daily picks feed, yesterday's graded autopsies, and overall win-rate stats.
5. POST /api/build-slip: The 20,000-Odds Combinatorial Slip Generator with platform booking codes.
6. POST /api/chat: Interactive AI Sports & Trending News Copilot (auto-builds slips on request or searches live news).
7. POST /api/admin/trigger-morning: Manually triggers the morning ingest & prediction pipeline.
8. POST /api/admin/trigger-midnight: Manually triggers the midnight grading & autopsy pipeline.
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
import json
import logging
import math
import os
from pathlib import Path
import random
import re
import string
import sys
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid

# Ensure project root and backend dir are in sys.path
_backend_dir = Path(__file__).resolve().parent
_project_root = _backend_dir.parent
for _p in [str(_project_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI, HTTPException, Query, Body, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from duckduckgo_search import DDGS
except ImportError:
    try:
        from ddgs import DDGS
    except ImportError:
        DDGS = None

try:
    from backend.config import (
        API_FOOTBALL_KEY,
        groq_client,
        supabase,
        get_embedding,
        APP_MODE,
    )
    from backend.morning_ingest_and_predict import run_morning_pipeline
    from backend.midnight_autopsy import (
        run_midnight_autopsy,
        get_current_model_weights,
        calibrate_model_weights,
    )
    from backend.services.bookmaker_codes import (
        generate_sportybet_code,
        decode_sportybet_code,
        generate_bet9ja_code,
        decode_bet9ja_code,
        fetch_sportybet_live_events,
    )
    from backend.services.news_scraper import (
        scrape_live_sports_news,
        build_time_aware_system_prompt,
        get_current_date_str,
    )
    from backend.services.odds_solver import solve_target_odds
    from backend.services.catalyst_pruner import prune_slip_with_catalyst_intelligence
except ImportError:
    from config import (  # type: ignore
        API_FOOTBALL_KEY,
        groq_client,
        supabase,
        get_embedding,
        APP_MODE,
    )
    from morning_ingest_and_predict import run_morning_pipeline  # type: ignore
    from midnight_autopsy import (  # type: ignore
        run_midnight_autopsy,
        get_current_model_weights,
        calibrate_model_weights,
    )
    from services.bookmaker_codes import (  # type: ignore
        generate_sportybet_code,
        decode_sportybet_code,
        generate_bet9ja_code,
        decode_bet9ja_code,
        fetch_sportybet_live_events,
    )
    from services.news_scraper import (  # type: ignore
        scrape_live_sports_news,
        build_time_aware_system_prompt,
        get_current_date_str,
    )
    from services.odds_solver import solve_target_odds  # type: ignore
    from services.catalyst_pruner import prune_slip_with_catalyst_intelligence  # type: ignore

# Logger setup
logger = logging.getLogger("oddora.app")
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

# ============================================================================
# FASTAPI APP & CORS CONFIGURATION
# ============================================================================

app = FastAPI(
    title="Oddora AI Backend API",
    description="The self-learning quantitative sports intelligence & automated bet slip engine.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_sync_check():
    """
    Zero-waste daily check:
    At startup, checks if today has fixtures in Supabase.
    If 0 fixtures found, runs 1 single API-Football call + prediction cycle.
    Otherwise serves strictly from cached database rows.
    """
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    logger.info("Oddora AI server started. Running zero-waste database check for %s...", today_str)
    if supabase:
        try:
            res = supabase.table("daily_matches").select("fixture_id").eq("match_date", today_str).limit(1).execute()
            if not res.data:
                logger.info("Found 0 matches for %s. Triggering one-time morning ingest...", today_str)
                run_morning_pipeline(target_date=today_str, max_fixtures=25, dry_run=False)
            else:
                logger.info("Found existing fixtures for %s in Supabase. Zero API calls consumed.", today_str)
        except Exception as e:
            logger.warning("Startup database check notice: %s", e)


# ============================================================================
# PYDANTIC DATA MODELS
# ============================================================================

class RegisterProfileRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="UUID from frontend auth; generated if omitted")
    full_name: str = Field(..., description="Full display name of user")
    email: str = Field(..., description="User email address")
    phone_number: Optional[str] = Field("", description="Optional contact phone number")
    referred_by_code: Optional[str] = Field(None, description="Optional referral code of referrer")


class UpgradeSubscriptionRequest(BaseModel):
    user_id: str = Field(..., description="UUID of user upgrading plan")
    plan_tier: str = Field(..., description="'FREE', 'PRO', or 'VIP'")
    billing_cycle: str = Field("BETA_TESTER", description="'MONTHLY', 'YEARLY', or 'BETA_TESTER'")


class BuildSlipRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="UUID of user generating slip")
    target_odds: float = Field(10.0, description="Desired total multiplied odds (e.g., 2.0 to 20000.0+)")
    risk_level: str = Field("BALANCED", description="'SAFE', 'BALANCED', 'HIGH_ODDS', or 'DEGEN'")
    bookmaker: Optional[str] = Field("SportyBet", description="'SportyBet' or 'Bet9ja'")
    duration: Optional[str] = Field("1_day", description="'1_day', '3_days', '7_days', or '30_days'")


class EditSlipRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="UUID of user editing slip")
    bookmaker: Optional[str] = Field("SportyBet", description="'SportyBet' or 'Bet9ja'")
    booking_code: Optional[str] = Field(None, description="Booking code to load (e.g., W39NAR, 4KJ91A)")
    legs: Optional[List[Dict[str, Any]]] = Field(None, description="Custom slip legs if provided directly")
    mode: Optional[str] = Field("REMOVE_X", description="'REMOVE_X', 'TARGET_ODDS', or 'SMART_PRUNE'")
    remove_count: Optional[int] = Field(5, description="Number of low-probability games to cut (3, 5, 10, 20)")
    target_odds: Optional[float] = Field(None, description="Target odds to reduce slip to (e.g., 20, 100, 1000)")


class DecodeCodeRequest(BaseModel):
    bookmaker: str = Field("SportyBet", description="'SportyBet' or 'Bet9ja'")
    code: str = Field(..., description="Booking code to decode (e.g. SportyBet shareCode or Bet9ja coupon)")


class SyncDailyRequest(BaseModel):
    date: Optional[str] = Field(None, description="Target date in YYYY-MM-DD format (default: today)")
    force: bool = Field(False, description="Force re-sync even if matches exist in Supabase")


class ChatRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="UUID of user chatting")
    message: str = Field(..., description="User query or slip generation command")


class TriggerMorningRequest(BaseModel):
    date: Optional[str] = Field(None, description="Target date in YYYY-MM-DD format (default: today)")
    limit: Optional[int] = Field(25, description="Maximum matches to process (default: 25)")


class TriggerMidnightRequest(BaseModel):
    date: Optional[str] = Field(None, description="Target date in YYYY-MM-DD format (default: today or yesterday)")


# ============================================================================
# HELPER UTILITIES
# ============================================================================

def ensure_uuid(val: Optional[str]) -> str:
    """Ensures a valid UUID string format so Supabase uuid columns never reject values."""
    if not val:
        return str(uuid.uuid4())
    try:
        uuid.UUID(str(val))
        return str(val)
    except (ValueError, TypeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(val)))


def generate_unique_referral_code() -> str:
    """Generate a unique referral code matching pattern 'ODD-' + 5 uppercase letters/digits."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=5))
    return f"ODD-{suffix}"


def generate_booking_code(target_odds: float) -> str:
    """Generate an official platform booking code (e.g. ODD-20K-8X2A, ODD-50X-3B9K)."""
    if target_odds >= 10000:
        tier_label = f"{int(round(target_odds / 1000))}K"
    elif target_odds >= 1000:
        tier_label = f"{round(target_odds / 1000, 1)}K"
    else:
        tier_label = f"{int(round(target_odds))}X"

    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=4))
    return f"ODD-{tier_label}-{suffix}"


GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
]


def query_groq_copilot(system_prompt: str, user_prompt: str) -> str:
    """Query Groq LLM with fallback support."""
    if not groq_client:
        return (
            "Oddora AI Copilot is operating in offline mode. "
            "Our quantitative sports models continue to evaluate upcoming fixtures for maximum value."
        )

    for m in GROQ_MODELS:
        try:
            res = groq_client.chat.completions.create(
                model=m,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.4,
            )
            return res.choices[0].message.content or ""
        except Exception as e:
            if "model_not_found" in str(e) or "does not exist" in str(e):
                continue
            logger.warning("Groq copilot model %s error: %s", m, e)

    return "Our quantitative engine is analyzing market flows. Please check back shortly for updated insights."


# ============================================================================
# 1. AUTH & PROFILE REGISTRATION (POST /api/auth/register-profile)
# ============================================================================

@app.post("/api/auth/register-profile", status_code=status.HTTP_201_CREATED)
def register_profile(payload: RegisterProfileRequest) -> Dict[str, Any]:
    """
    Registers or initializes a user profile in Supabase public.profiles:
    - Auto-generates unique referral code (e.g. ODD-XXXXX).
    - If referred_by_code is valid, links referral in public.affiliate_referrals
      and increments referrer's total_referrals count.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database client is unavailable.")

    user_id = ensure_uuid(payload.user_id)
    full_name = payload.full_name.strip()
    email = payload.email.strip().lower()
    phone_number = (payload.phone_number or "").strip()
    referred_code_input = (payload.referred_by_code or "").strip().upper()

    # Check if profile already exists
    res_existing = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if res_existing.data:
        existing = res_existing.data[0]
        logger.info("Profile already exists for user_id %s; returning existing record.", user_id)
        return {
            "status": "success",
            "message": "User profile already registered.",
            "profile": existing,
        }

    # Generate unique referral code
    new_referral_code = generate_unique_referral_code()
    # Ensure uniqueness in profiles table
    for _ in range(5):
        chk = supabase.table("profiles").select("id").eq("referral_code", new_referral_code).execute()
        if not chk.data:
            break
        new_referral_code = generate_unique_referral_code()

    valid_referred_by_code = None
    referrer_profile = None

    if referred_code_input:
        ref_lookup = supabase.table("profiles").select("*").eq("referral_code", referred_code_input).execute()
        if ref_lookup.data:
            referrer_profile = ref_lookup.data[0]
            valid_referred_by_code = referred_code_input
            logger.info("Valid referrer found: %s (%s)", referrer_profile.get("full_name"), valid_referred_by_code)

    # Ensure user exists in auth.users to satisfy profiles_id_fkey constraint
    try:
        supabase.auth.admin.get_user_by_id(user_id)
    except Exception:
        try:
            supabase.auth.admin.create_user({
                "id": user_id,
                "email": email,
                "email_confirm": True,
            })
            logger.info("Auto-created auth.users record for %s (%s)", user_id, email)
        except Exception as e_auth:
            logger.warning("Auth record creation notice: %s", e_auth)

    profile_record = {
        "id": user_id,
        "full_name": full_name,
        "email": email,
        "phone_number": phone_number,
        "plan_tier": "FREE",
        "subscription_cycle": "NONE",
        "daily_chat_used": 0,
        "referral_code": new_referral_code,
        "referred_by_code": valid_referred_by_code,
        "affiliate_balance": 0.0,
        "total_referrals": 0,
        "is_admin": False,
    }

    try:
        res_create = supabase.table("profiles").insert(profile_record).execute()
        created_profile = res_create.data[0] if res_create.data else profile_record
    except Exception as e:
        logger.error("Error creating profile in database: %s", e)
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {e}")

    # If referred by a valid code, record in affiliate_referrals and increment referrer's count
    if referrer_profile and valid_referred_by_code:
        try:
            affiliate_log = {
                "referrer_id": referrer_profile["id"],
                "referred_user_id": user_id,
                "referred_name": full_name,
                "plan_purchased": "FREE",
                "commission_earned": 0.0,
                "status": "ACTIVE",
            }
            supabase.table("affiliate_referrals").insert(affiliate_log).execute()

            # Increment referrer's total_referrals count
            new_total = (referrer_profile.get("total_referrals") or 0) + 1
            supabase.table("profiles").update({"total_referrals": new_total}).eq("id", referrer_profile["id"]).execute()
            logger.info("Incremented total_referrals for referrer %s to %d", referrer_profile["id"], new_total)
        except Exception as e:
            logger.error("Failed to log affiliate referral: %s", e)

    return {
        "status": "success",
        "message": "User profile successfully registered with Oddora AI.",
        "profile": created_profile,
    }


# ============================================================================
# 2. GET USER PROFILE & AFFILIATE STATS (GET /api/user/{user_id})
# ============================================================================

@app.get("/api/user/{user_id}")
def get_user_profile(user_id: str) -> Dict[str, Any]:
    """
    Returns the user's profile, plan_tier, referral code, affiliate balance,
    total referrals count, and the list of referred users from affiliate_referrals.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database client is unavailable.")

    clean_id = ensure_uuid(user_id)
    res_prof = supabase.table("profiles").select("*").eq("id", clean_id).execute()

    if not res_prof.data:
        raise HTTPException(status_code=404, detail="User profile not found.")

    profile = res_prof.data[0]

    # Fetch referred users list
    res_refs = (
        supabase.table("affiliate_referrals")
        .select("*")
        .eq("referrer_id", clean_id)
        .order("created_at", desc=True)
        .execute()
    )
    referral_list = res_refs.data or []

    # Calculate active network stats
    total_commission_earned = sum(float(r.get("commission_earned", 0.0)) for r in referral_list)

    return {
        "status": "success",
        "user_id": profile["id"],
        "profile": profile,
        "plan_tier": profile.get("plan_tier", "FREE"),
        "subscription_cycle": profile.get("subscription_cycle", "NONE"),
        "referral_code": profile.get("referral_code"),
        "referral_link": f"https://oddora.ai/register?ref={profile.get('referral_code')}",
        "affiliate_balance": float(profile.get("affiliate_balance", 0.0)),
        "total_referrals": profile.get("total_referrals", 0),
        "total_commission_earned": round(total_commission_earned, 2),
        "referrals": referral_list,
    }


# ============================================================================
# 3. BETA TEST UPGRADE / PLAN SWITCHER (POST /api/subscription/upgrade)
# ============================================================================

SIMULATED_PLAN_PRICES = {
    ("PRO", "MONTHLY"): 29.00,
    ("PRO", "YEARLY"): 290.00,
    ("PRO", "BETA_TESTER"): 30.00,
    ("VIP", "MONTHLY"): 59.00,
    ("VIP", "YEARLY"): 590.00,
    ("VIP", "BETA_TESTER"): 60.00,
    ("FREE", "MONTHLY"): 0.00,
    ("FREE", "YEARLY"): 0.00,
    ("FREE", "BETA_TESTER"): 0.00,
}


@app.post("/api/subscription/upgrade")
def upgrade_subscription(payload: UpgradeSubscriptionRequest) -> Dict[str, Any]:
    """
    Beta Test Upgrade / Plan Switcher:
    - Accepts user_id, plan_tier ('FREE', 'PRO', 'VIP'), and billing_cycle.
    - Updates the user's plan_tier in profiles.
    - If referred_by_code exists on profile, automatically credits the referrer's
      affiliate_balance with a 30% commission simulation to test end-to-end money flows!
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database client is unavailable.")

    user_id = ensure_uuid(payload.user_id)
    plan_tier = payload.plan_tier.upper().strip()
    billing_cycle = payload.billing_cycle.upper().strip()

    if plan_tier not in ["FREE", "PRO", "VIP"]:
        raise HTTPException(status_code=400, detail="plan_tier must be 'FREE', 'PRO', or 'VIP'.")

    # Fetch existing profile
    res_user = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not res_user.data:
        raise HTTPException(status_code=404, detail="User profile not found.")

    user_profile = res_user.data[0]

    # Update user's plan_tier and subscription_cycle
    update_res = (
        supabase.table("profiles")
        .update({"plan_tier": plan_tier, "subscription_cycle": billing_cycle})
        .eq("id", user_id)
        .execute()
    )
    updated_user = update_res.data[0] if update_res.data else user_profile

    # Affiliate Commission Flow (30% Commission)
    commission_awarded = 0.0
    referrer_info = None
    referred_by_code = user_profile.get("referred_by_code")

    if referred_by_code and plan_tier != "FREE":
        res_ref = supabase.table("profiles").select("*").eq("referral_code", referred_by_code).execute()
        if res_ref.data:
            referrer = res_ref.data[0]
            plan_price = SIMULATED_PLAN_PRICES.get((plan_tier, billing_cycle), 30.00)
            commission_awarded = round(plan_price * 0.30, 2)  # 30% commission

            new_aff_balance = round(float(referrer.get("affiliate_balance", 0.0)) + commission_awarded, 2)

            # Credit referrer's affiliate balance
            supabase.table("profiles").update({"affiliate_balance": new_aff_balance}).eq("id", referrer["id"]).execute()

            # Update or log in affiliate_referrals
            res_aff_row = (
                supabase.table("affiliate_referrals")
                .select("*")
                .eq("referrer_id", referrer["id"])
                .eq("referred_user_id", user_id)
                .execute()
            )

            if res_aff_row.data:
                aff_row = res_aff_row.data[0]
                new_comm_total = round(float(aff_row.get("commission_earned", 0.0)) + commission_awarded, 2)
                supabase.table("affiliate_referrals").update({
                    "plan_purchased": plan_tier,
                    "commission_earned": new_comm_total,
                }).eq("id", aff_row["id"]).execute()
            else:
                supabase.table("affiliate_referrals").insert({
                    "referrer_id": referrer["id"],
                    "referred_user_id": user_id,
                    "referred_name": user_profile.get("full_name", "Referred User"),
                    "plan_purchased": plan_tier,
                    "commission_earned": commission_awarded,
                    "status": "ACTIVE",
                }).execute()

            referrer_info = {
                "referrer_id": referrer["id"],
                "referrer_name": referrer.get("full_name"),
                "commission_rate": "30%",
                "commission_awarded": commission_awarded,
                "new_affiliate_balance": new_aff_balance,
            }
            logger.info("Credited 30% commission ($%s) to referrer %s", commission_awarded, referrer["id"])

    return {
        "status": "success",
        "message": f"Successfully updated subscription to {plan_tier} ({billing_cycle}).",
        "profile": updated_user,
        "affiliate_commission_simulation": referrer_info,
    }


# ============================================================================
# 4. DAILY PICKS & AUTOPSY FEED (GET /api/predictions)
# ============================================================================

@app.get("/api/predictions")
def get_predictions_feed(date: Optional[str] = Query(None, description="YYYY-MM-DD date filter")) -> Dict[str, Any]:
    """
    Returns:
    - Today's & Tomorrow's matches and AI predictions (strictly next 24-48 hours, sorted chronologically).
    - Yesterday's graded predictions (with scores, outcome, and failure autopsy notes).
    - Platform summary stats: total graded, win rate %, and total memory lessons learned.
    - Live calibrated factor weights from the midnight self-learning engine.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database client is unavailable.")

    now_utc = datetime.now(timezone.utc)
    today_str = now_utc.strftime("%Y-%m-%d")
    tomorrow_str = (now_utc + timedelta(days=1)).strftime("%Y-%m-%d")

    if date:
        target_dates = [date]
        target_date = date
    else:
        # Strictly today and tomorrow only (next 24 to 48 hours)
        target_dates = [today_str, tomorrow_str]
        target_date = today_str

    yesterday_date = (
        datetime.strptime(target_date, "%Y-%m-%d") - timedelta(days=1)
    ).strftime("%Y-%m-%d")

    # 1. Fetch Today & Tomorrow Matches strictly within next 24-48 hours
    res_matches = (
        supabase.table("daily_matches")
        .select("*")
        .in_("match_date", target_dates)
        .order("kickoff_time", desc=False)
        .execute()
    )
    raw_matches = res_matches.data or []

    # Strict chronological and 48-hour window filter (no 2-month future matches)
    valid_matches = []
    for m in raw_matches:
        kt = m.get("kickoff_time")
        if not kt:
            valid_matches.append(m)
            continue
        try:
            clean_kt = str(kt).replace("Z", "+00:00")
            kt_dt = datetime.fromisoformat(clean_kt)
            if kt_dt.tzinfo is None:
                kt_dt = kt_dt.replace(tzinfo=timezone.utc)
            delta = kt_dt - now_utc
            # Discard matches more than 48 hours ahead or over 24h expired
            if timedelta(hours=-24) <= delta <= timedelta(hours=48):
                valid_matches.append(m)
        except Exception:
            valid_matches.append(m)

    valid_matches.sort(key=lambda x: str(x.get("kickoff_time") or ""))
    matches_map = {m["fixture_id"]: m for m in valid_matches}
    valid_fixture_ids = set(matches_map.keys())

    res_preds = (
        supabase.table("ai_predictions")
        .select("*")
        .in_("match_date", target_dates)
        .order("confidence_score", desc=True)
        .execute()
    )
    today_predictions_raw = [
        p for p in (res_preds.data or []) if p.get("fixture_id") in valid_fixture_ids
    ]

    today_picks = []
    for pred in today_predictions_raw:
        m = matches_map.get(pred["fixture_id"], {})
        today_picks.append({
            "prediction_id": pred["id"],
            "fixture_id": pred["fixture_id"],
            "home_team": m.get("home_team", "Home Team"),
            "away_team": m.get("away_team", "Away Team"),
            "home_logo": m.get("home_logo", ""),
            "away_logo": m.get("away_logo", ""),
            "league_name": m.get("league_name", ""),
            "league_logo": m.get("league_logo", ""),
            "kickoff_time": m.get("kickoff_time", ""),
            "selected_market": pred["selected_market"],
            "odd_value": float(pred["odd_value"]),
            "confidence_score": float(pred["confidence_score"]),
            "risk_category": pred["risk_category"],
            "is_vip_only": bool(pred["is_vip_only"]),
            "ai_reasoning": pred["ai_reasoning"],
            "outcome_status": pred.get("outcome_status", "PENDING"),
            "odds_available": m.get("odds_json", {}),
            "news_summary": m.get("news_summary", ""),
        })

    # Sort today picks chronologically by kickoff time
    today_picks.sort(key=lambda x: str(x.get("kickoff_time") or ""))

    # 2. Fetch Yesterday's Graded Matches and Failure Autopsies
    res_y_matches = (
        supabase.table("daily_matches")
        .select("*")
        .eq("match_date", yesterday_date)
        .execute()
    )
    y_matches_map = {m["fixture_id"]: m for m in (res_y_matches.data or [])}

    res_y_preds = (
        supabase.table("ai_predictions")
        .select("*")
        .eq("match_date", yesterday_date)
        .execute()
    )
    yesterday_graded_raw = res_y_preds.data or []

    yesterday_autopsies = []
    for pred in yesterday_graded_raw:
        m = y_matches_map.get(pred["fixture_id"], {})
        yesterday_autopsies.append({
            "prediction_id": pred["id"],
            "fixture_id": pred["fixture_id"],
            "home_team": m.get("home_team", "Home Team"),
            "away_team": m.get("away_team", "Away Team"),
            "league_name": m.get("league_name", ""),
            "final_score": f"{m.get('home_goals', 0)} - {m.get('away_goals', 0)}",
            "selected_market": pred["selected_market"],
            "odd_value": float(pred["odd_value"]),
            "outcome_status": pred.get("outcome_status", "PENDING"),
            "failure_autopsy": pred.get("failure_autopsy"),
            "ai_reasoning": pred.get("ai_reasoning"),
        })

    # 3. Summary Statistics across all recorded predictions
    res_stats = supabase.table("ai_predictions").select("outcome_status").neq("outcome_status", "PENDING").execute()
    graded_all = res_stats.data or []
    total_graded = len(graded_all)
    won_graded = sum(1 for p in graded_all if p.get("outcome_status") == "WON")
    win_rate = round((won_graded / total_graded * 100.0), 1) if total_graded > 0 else 0.0

    # Total lessons in self-learning memory
    res_lessons = supabase.table("ai_lessons_memory").select("id", count="exact").execute()
    total_lessons = res_lessons.count if hasattr(res_lessons, "count") and res_lessons.count is not None else len(res_lessons.data or [])

    return {
        "status": "success",
        "date": target_date,
        "summary_stats": {
            "total_graded_predictions": total_graded,
            "won_predictions": won_graded,
            "win_rate_percentage": win_rate,
            "total_self_learning_lessons": total_lessons,
        },
        "today_picks_count": len(today_picks),
        "today_picks": today_picks,
        "yesterday_autopsies_count": len(yesterday_autopsies),
        "yesterday_autopsies": yesterday_autopsies,
        "ai_model_weights": get_current_model_weights(),
    }


# ============================================================================
# 5. THE 20,000-ODDS COMBINATORIAL SLIP GENERATOR (POST /api/build-slip)
# ============================================================================

def build_combinatorial_slip(
    user_id: Optional[str],
    target_odds: float,
    risk_level: str = "BALANCED",
    bookmaker: str = "SportyBet",
    duration: str = "1_day",
) -> Dict[str, Any]:
    """
    Logarithmic Combinatorial Slip Solver:
    Solves for exact target odds within ±3% to ±8% across customizable time horizons:
    - 1_day: Today only
    - 3_days: 3-Day Weekend / Midweek
    - 7_days: 1 Week Rollover
    - 30_days: 1 Month Long-Term Accumulator
    Generates authentic SportyBet or Bet9ja booking codes.
    """
    return solve_target_odds(
        user_id=user_id,
        target_odds=target_odds,
        risk_level=risk_level,
        bookmaker=bookmaker,
        duration=duration,
    )


@app.post("/api/build-slip")
def build_slip_endpoint(payload: BuildSlipRequest) -> Dict[str, Any]:
    """
    The 20,000-Odds Combinatorial Slip Generator:
    Takes target_odds, risk_level, and time duration, running the logarithmic combinatorial solver.
    Returns authentic bookmaker booking code and slip legs with exact odds accuracy.
    """
    target = max(1.5, float(payload.target_odds))
    slip_data = build_combinatorial_slip(
        user_id=payload.user_id,
        target_odds=target,
        risk_level=payload.risk_level.upper(),
        bookmaker=payload.bookmaker or "SportyBet",
        duration=payload.duration or "1_day",
    )
    return {
        "status": "success",
        "message": f"Successfully generated {slip_data.get('bookmaker', 'SportyBet')} booking slip {slip_data['booking_code']} with {slip_data['actual_combined_odds']} combined odds ({slip_data.get('odds_accuracy_ratio', '100%')} accuracy).",
        "slip": slip_data,
    }


# ============================================================================
# 5B. DEDICATED EDIT SLIP AI & CATALYST RESEARCH PRUNER (POST /api/edit-slip-ai)
# ============================================================================

@app.post("/api/edit-slip-ai")
def edit_slip_ai_endpoint(payload: EditSlipRequest) -> Dict[str, Any]:
    """
    Dedicated Edit Slip AI with Catalyst Research Pruning:
    1. Evaluates all games using live injuries, H2H bogey traps, form/xG differential, and tactical fatigue.
    2. Ranks by AI Survival Probability (%).
    3. Prunes via REMOVE_X, TARGET_ODDS, or SMART_PRUNE.
    4. Outputs Removed vs Kept Audit Cards and new SportyBet/Bet9ja booking codes.
    """
    try:
        res = prune_slip_with_catalyst_intelligence(
            booking_code=payload.booking_code,
            legs=payload.legs,
            bookmaker=payload.bookmaker or "SportyBet",
            mode=payload.mode or "REMOVE_X",
            remove_count=payload.remove_count or 5,
            target_odds=payload.target_odds,
        )
        return res
    except Exception as e:
        logger.error("Error in edit_slip_ai_endpoint: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 5C. DAILY AI READY-MADE SLIPS (GET /api/daily-ready-slips)
# ============================================================================

@app.get("/api/daily-ready-slips")
def get_daily_ready_slips(bookmaker: Optional[str] = "SportyBet") -> Dict[str, Any]:
    """
    Returns 4 Daily Ready-Made AI Slips across tier categories:
    1. Banker Ticket: 3-5x Odds (Free Tier)
    2. Builder Ticket: 10x Odds (Pro/VIP Tier)
    3. Sharp Ticket: 20x Odds (Pro/VIP Tier)
    4. High-Roller Ticket: 50x+ Odds (VIP Tier)
    """
    bm = bookmaker or "SportyBet"

    banker = solve_target_odds(target_odds=3.5, risk_level="SAFE", bookmaker=bm, duration="1_day")
    builder = solve_target_odds(target_odds=10.0, risk_level="BALANCED", bookmaker=bm, duration="1_day")
    sharp = solve_target_odds(target_odds=20.0, risk_level="HIGH_ODDS", bookmaker=bm, duration="3_days")
    high_roller = solve_target_odds(target_odds=50.0, risk_level="HIGH_ODDS", bookmaker=bm, duration="7_days")

    return {
        "status": "success",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "bookmaker": bm,
        "slips": [
            {
                "id": "banker-daily",
                "tier": "FREE",
                "title": "Banker Slip",
                "subtitle": "High-probability conservative accumulator (Zero-Risk Anchor)",
                "target_odds": 3.5,
                "is_vip_only": False,
                "badge": "FREE UNLOCKED",
                "badge_color": "emerald",
                "slip": banker,
            },
            {
                "id": "builder-daily",
                "tier": "PRO",
                "title": "Builder Accumulator",
                "subtitle": "Strategic 10-Odds foundation with positive expected goals (xG)",
                "target_odds": 10.0,
                "is_vip_only": True,
                "badge": "PRO PASS",
                "badge_color": "cyan",
                "slip": builder,
            },
            {
                "id": "sharp-daily",
                "tier": "PRO",
                "title": "Sharp Value Ticket",
                "subtitle": "Poisson distribution high-value edge across weekend/midweek fixtures",
                "target_odds": 20.0,
                "is_vip_only": True,
                "badge": "PRO & VIP",
                "badge_color": "purple",
                "slip": sharp,
            },
            {
                "id": "high-roller-daily",
                "tier": "VIP",
                "title": "High-Roller Syndicate Slip",
                "subtitle": "Maximized combinatorial yield: 50x to 100x multi-market accumulator",
                "target_odds": 50.0,
                "is_vip_only": True,
                "badge": "VIP SYNDICATE ONLY",
                "badge_color": "amber",
                "slip": high_roller,
            },
        ],
    }


# ============================================================================
# 5D. AUTOPSY DYNAMIC FACTOR WEIGHTS (GET /api/autopsy-weights)
# ============================================================================

@app.get("/api/autopsy-weights")
def get_autopsy_weights_endpoint() -> Dict[str, Any]:
    """
    Returns live dynamic model factor weights and calibration log from the self-learning engine.
    """
    return get_current_model_weights()


# ============================================================================
# 6. INTERACTIVE AI SPORTS & TRENDING NEWS COPILOT (POST /api/chat)
# ============================================================================

SLIP_REQUEST_REGEX = re.compile(
    r"(?:build|give|generate|create|make|get|need)\s+(?:me\s+)?(?:a\s+)?(?:[\w\s]*?)?(\d+[\d,.]*)\s*(?:odds|odd|accumulator|slip|acca)"
    r"|(?:give|build|generate|create)\s+(?:me\s+)?(?:a\s+)?(?:bet\s+)?(?:slip|accumulator|acca)"
    r"|(\d+[\d,.]*)\s*(?:odds|odd)",
    re.IGNORECASE,
)


@app.post("/api/chat")
def chat_copilot(payload: ChatRequest) -> Dict[str, Any]:
    """
    Interactive AI Sports & Trending News Copilot:
    - If user asks for odds or a bet slip (e.g., 'Give me 20,000 odds', 'Build 50 odds for today'),
      automatically invokes the slip builder and returns conversational analysis + structured slip.
    - If user asks about live sports news, injuries, or match analysis, runs live DuckDuckGo News search
      + database query and uses Groq (llama-3.3-70b-versatile) with real-time internet context.
    """
    user_msg = payload.message.strip()
    user_id = ensure_uuid(payload.user_id) if payload.user_id else None

    # Track chat usage in profiles if user_id provided
    if user_id and supabase:
        try:
            res_u = supabase.table("profiles").select("daily_chat_used").eq("id", user_id).execute()
            if res_u.data:
                used = (res_u.data[0].get("daily_chat_used") or 0) + 1
                supabase.table("profiles").update({"daily_chat_used": used}).eq("id", user_id).execute()
        except Exception:
            pass

    # 1. Check for Bet Slip Request Intent
    match = SLIP_REQUEST_REGEX.search(user_msg)
    is_slip_intent = bool(
        match or any(w in user_msg.lower() for w in ["bet slip", "betslip", "accumulator", "acca", "odds slip"])
    )

    if is_slip_intent:
        target_odds = 20.0  # default
        if match:
            num_str = match.group(1) or match.group(2)
            if num_str:
                clean_num = num_str.replace(",", "")
                try:
                    target_odds = float(clean_num)
                except ValueError:
                    target_odds = 20.0

        chosen_bookmaker = "Bet9ja" if "bet9ja" in user_msg.lower() else "SportyBet"

        # Check for duration context in message
        duration_mode = "1_day"
        msg_l = user_msg.lower()
        if any(w in msg_l for w in ["3 day", "3-day", "weekend", "midweek"]):
            duration_mode = "3_days"
        elif any(w in msg_l for w in ["week", "7 day", "7-day", "rollover"]):
            duration_mode = "7_days"
        elif any(w in msg_l for w in ["month", "30 day", "30-day", "long term", "long-term"]):
            duration_mode = "30_days"

        # Run the combinatorial slip generator
        slip = build_combinatorial_slip(
            user_id=user_id,
            target_odds=target_odds,
            risk_level="BALANCED" if target_odds < 100 else "HIGH_ODDS",
            bookmaker=chosen_bookmaker,
            duration=duration_mode,
        )

        conversational_response = (
            f"🎯 Here is your official **{slip.get('bookmaker', 'SportyBet')} {target_odds:,.0f}-Odds Accumulator Slip**!\n\n"
            f"📋 **Booking Code:** `{slip['booking_code']}`\n"
            f"⚡ **Combined Odds:** **{slip['actual_combined_odds']:,.2f}**\n"
            f"🔢 **Total Legs:** {slip['legs_count']} matches\n"
            f"🔗 **Direct Bookmaker Link:** [Open Ticket on {slip.get('bookmaker', 'SportyBet')}]({slip.get('share_url', '#')})\n\n"
            f"**Key Cornerstones:**\n"
        )
        for idx, leg in enumerate(slip["legs"][:4], 1):
            conversational_response += f"{idx}. **{leg['match']}** — *{leg['market']}* (@{leg['odd']:.2f}) [Confidence: {leg['confidence_score']}%]\n"

        if slip["legs_count"] > 4:
            conversational_response += f"\n*... plus {slip['legs_count'] - 4} additional mathematical multiplier legs in the attached slip.*"

        return {
            "status": "success",
            "type": "SLIP_GENERATED",
            "response": conversational_response,
            "slip_data": slip,
        }

    # 2. General Sports, News, Transfers, Injuries Intent
    # Scrape real-time, time-filtered live news + RSS feeds
    news_result = scrape_live_sports_news(user_msg, max_articles=5)
    news_context = news_result.get("formatted_context", "") if isinstance(news_result, dict) else str(news_result)

    # Query internal self-learning lessons or matches
    internal_intelligence = ""
    if supabase:
        try:
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            res_matches = supabase.table("daily_matches").select("home_team, away_team, league_name, odds_json").eq("match_date", today_str).limit(6).execute()
            if res_matches.data:
                sample_fixtures = [f"{m['home_team']} vs {m['away_team']} ({m['league_name']})" for m in res_matches.data]
                internal_intelligence = f"Active fixtures in Oddora AI for {today_str}: {', '.join(sample_fixtures)}."
        except Exception:
            pass

    system_prompt = build_time_aware_system_prompt()

    user_prompt = f"""
USER INQUIRY:
{user_msg}

REAL-TIME TIME-FILTERED WEB & RSS NEWS CONTEXT:
{news_context}

ODDORA AI DATABASE CONTEXT:
{internal_intelligence}

Answer the user directly with factual clarity, exact player/injury updates, and tactical insight based ONLY on current context.
"""

    copilot_answer = query_groq_copilot(system_prompt, user_prompt)

    return {
        "status": "success",
        "type": "CHAT_RESPONSE",
        "response": copilot_answer,
        "slip_data": None,
    }


# ============================================================================
# 7. BOOKMAKER CODE DECODER & ZERO-WASTE DAILY SYNC
# ============================================================================

@app.post("/api/decode-code")
def decode_code_endpoint(payload: DecodeCodeRequest) -> Dict[str, Any]:
    """
    Decodes an authentic SportyBet or Bet9ja booking code.
    Fetches real matches, markets, selections, and odds.
    """
    bookmaker = (payload.bookmaker or "SportyBet").strip()
    code = payload.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="Booking code is required.")

    if "bet9ja" in bookmaker.lower():
        result = decode_bet9ja_code(code)
    else:
        result = decode_sportybet_code(code)

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message", "Invalid booking code."))

    return {
        "status": "success",
        "bookmaker": result.get("bookmaker", bookmaker),
        "booking_code": result.get("booking_code", code),
        "share_url": result.get("share_url"),
        "actual_combined_odds": result.get("actual_combined_odds", 1.0),
        "legs_count": result.get("legs_count", len(result.get("legs", []))),
        "legs": result.get("legs", []),
    }


@app.post("/api/sync-daily-fixtures")
def sync_daily_fixtures(payload: SyncDailyRequest = Body(default_factory=SyncDailyRequest)) -> Dict[str, Any]:
    """
    Zero-waste daily fixture sync:
    Checks if fixtures for target date are already cached in Supabase.
    If cached and force=False, returns cached notification (0 API calls used).
    Otherwise triggers run_morning_pipeline (1 API-Football call).
    """
    target_date = payload.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if supabase and not payload.force:
        res = supabase.table("daily_matches").select("fixture_id").eq("match_date", target_date).limit(1).execute()
        if res.data:
            return {
                "status": "cached",
                "message": f"Fixtures for {target_date} are already cached in database. Zero API calls consumed.",
                "date": target_date,
            }

    try:
        results = run_morning_pipeline(target_date=target_date, max_fixtures=25, dry_run=False)
        return {
            "status": "success",
            "message": f"Successfully ingested and predicted {len(results)} matches for {target_date}.",
            "date": target_date,
            "count": len(results),
        }
    except Exception as e:
        logger.error("Failed to sync daily fixtures: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 7. MANUAL TRIGGER ENDPOINTS FOR TESTING
# ============================================================================

@app.post("/api/admin/trigger-morning")
def trigger_morning_pipeline(payload: TriggerMorningRequest = Body(default_factory=TriggerMorningRequest)) -> Dict[str, Any]:
    """
    Allows the admin tester to trigger the morning ingest & prediction pipeline
    directly from a button on the frontend dashboard.
    """
    logger.info("Admin manually triggered morning ingest pipeline.")
    target_date = payload.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    limit = min(payload.limit or 25, 25)

    try:
        results = run_morning_pipeline(target_date=target_date, max_fixtures=limit, dry_run=False)
        return {
            "status": "success",
            "message": "Morning ingest and prediction pipeline completed successfully.",
            "date": target_date,
            "matches_processed": len(results),
            "predictions_count": len(results),
        }
    except Exception as e:
        logger.error("Error executing triggered morning pipeline: %s", e)
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {e}")


@app.post("/api/admin/trigger-midnight")
def trigger_midnight_pipeline(payload: TriggerMidnightRequest = Body(default_factory=TriggerMidnightRequest)) -> Dict[str, Any]:
    """
    Allows the admin tester to trigger the midnight grading & autopsy pipeline
    directly from a button on the frontend dashboard.
    """
    logger.info("Admin manually triggered midnight autopsy pipeline.")
    target_date = payload.date
    if not target_date:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if supabase:
            res = supabase.table("ai_predictions").select("id").eq("match_date", today_str).limit(1).execute()
            target_date = today_str if res.data else (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            target_date = today_str

    try:
        summary = run_midnight_autopsy(target_date=target_date)
        return {
            "status": "success",
            "message": "Midnight autopsy completed successfully.",
            "date": target_date,
            "summary": summary,
        }
    except Exception as e:
        logger.error("Error executing triggered midnight autopsy: %s", e)
        raise HTTPException(status_code=500, detail=f"Autopsy execution error: {e}")


# ============================================================================
# ROOT HEALTH CHECK ENDPOINT
# ============================================================================

@app.get("/")
def health_check() -> Dict[str, Any]:
    """Service health and operational status."""
    return {
        "service": "Oddora AI Backend API",
        "status": "online",
        "app_mode": APP_MODE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "endpoints": [
            "POST /api/auth/register-profile",
            "GET  /api/user/{user_id}",
            "POST /api/subscription/upgrade",
            "GET  /api/predictions",
            "POST /api/build-slip",
            "POST /api/decode-code",
            "POST /api/sync-daily-fixtures",
            "POST /api/chat",
            "POST /api/admin/trigger-morning",
            "POST /api/admin/trigger-midnight",
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
