// verify_supabase.mjs - Comprehensive Live Supabase Verification Script for Oddora AI
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fdlbnftfylcsjuzqbeuo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🚀 Connecting to Supabase at:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

async function runVerification() {
  const results = {
    matches: false,
    predictions: false,
    lessonsMemory: false,
    vectorSearchRPC: false,
    profiles: false,
    affiliates: false,
    generatedSlips: false,
  };

  try {
    // 1. Verify Daily Matches
    console.log('\n--- 1. Testing daily_matches Table ---');
    const { data: matches, error: mErr } = await supabase
      .from('daily_matches')
      .select('fixture_id, home_team, away_team, league_name, match_date')
      .limit(3);
    if (mErr) {
      console.error('❌ Error fetching daily_matches:', mErr.message);
    } else {
      console.log(`✅ daily_matches OK: Found ${matches.length} sample fixtures.`);
      matches.forEach(m => console.log(`   - [${m.match_date}] ${m.home_team} vs ${m.away_team} (${m.league_name})`));
      results.matches = true;
    }

    // 2. Verify AI Predictions
    console.log('\n--- 2. Testing ai_predictions Table ---');
    const { data: preds, error: pErr } = await supabase
      .from('ai_predictions')
      .select('fixture_id, selected_market, odd_value, confidence_score, risk_category')
      .limit(3);
    if (pErr) {
      console.error('❌ Error fetching ai_predictions:', pErr.message);
    } else {
      console.log(`✅ ai_predictions OK: Found ${preds.length} sample predictions.`);
      preds.forEach(p => console.log(`   - Market: ${p.selected_market} @ ${p.odd_value} | Confidence: ${p.confidence_score}% [${p.risk_category}]`));
      results.predictions = true;
    }

    // 3. Verify AI Lessons Memory
    console.log('\n--- 3. Testing ai_lessons_memory Table ---');
    const { data: lessons, error: lErr } = await supabase
      .from('ai_lessons_memory')
      .select('id, lesson_text, teams_or_league, market_type')
      .limit(2);
    if (lErr) {
      console.error('❌ Error fetching ai_lessons_memory:', lErr.message);
    } else {
      console.log(`✅ ai_lessons_memory OK: Found ${lessons.length} lessons in vector database.`);
      lessons.forEach(l => console.log(`   - [${l.teams_or_league || 'General'}] ${l.lesson_text.substring(0, 70)}...`));
      results.lessonsMemory = true;
    }

    // 4. Test match_ai_lessons Vector Search RPC
    console.log('\n--- 4. Testing match_ai_lessons RPC (pgvector) ---');
    const dummyEmbedding = Array.from({ length: 768 }, () => Math.random() * 0.1);
    const { data: rpcData, error: rpcErr } = await supabase.rpc('match_ai_lessons', {
      query_embedding: dummyEmbedding,
      match_threshold: 0.0,
      match_count: 2
    });
    if (rpcErr) {
      console.error('❌ RPC match_ai_lessons error:', rpcErr.message);
    } else {
      console.log(`✅ pgvector match_ai_lessons RPC OK: Returned ${rpcData.length} nearest neighbors.`);
      results.vectorSearchRPC = true;
    }

    // 5. Verify Profiles Table
    console.log('\n--- 5. Testing profiles Table ---');
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan_tier, referral_code, affiliate_balance')
      .limit(3);
    if (profErr) {
      console.error('❌ Error fetching profiles:', profErr.message);
    } else {
      console.log(`✅ profiles OK: Found ${profiles.length} member profiles.`);
      profiles.forEach(p => console.log(`   - ${p.full_name} (${p.email}) | Tier: ${p.plan_tier} | Ref Code: ${p.referral_code}`));
      results.profiles = true;
    }

    // 6. Verify Affiliate Referrals Table
    console.log('\n--- 6. Testing affiliate_referrals Table ---');
    const { data: referrals, error: refErr } = await supabase
      .from('affiliate_referrals')
      .select('id, referrer_id, referred_name, commission_earned, status')
      .limit(2);
    if (refErr) {
      console.error('❌ Error fetching affiliate_referrals:', refErr.message);
    } else {
      console.log(`✅ affiliate_referrals OK: Found ${referrals.length} logged referrals.`);
      results.affiliates = true;
    }

    // 7. Verify Generated Slips Table
    console.log('\n--- 7. Testing generated_slips Table ---');
    const { data: slips, error: sErr } = await supabase
      .from('generated_slips')
      .select('id, booking_code, actual_combined_odds')
      .limit(3);
    if (sErr) {
      console.error('❌ Error fetching generated_slips:', sErr.message);
    } else {
      console.log(`✅ generated_slips OK: Found ${slips.length} saved slips.`);
      slips.forEach(s => console.log(`   - Code: ${s.booking_code} | Total Odds: ${s.actual_combined_odds}x`));
      results.generatedSlips = true;
    }

    console.log('\n========================================');
    console.log('🎉 SUPABASE VERIFICATION SUMMARY:');
    console.log('========================================');
    for (const [key, passed] of Object.entries(results)) {
      console.log(`  ${passed ? '✅' : '❌'} ${key}`);
    }
    const allPassed = Object.values(results).every(Boolean);
    console.log('========================================');
    if (allPassed) {
      console.log('🟢 100% SUPABASE PRODUCTION READINESS CONFIRMED!');
    } else {
      console.log('⚠️ Some tables or functions require schema attention.');
    }

  } catch (err) {
    console.error('Unexpected error during verification:', err);
  }
}

runVerification();
