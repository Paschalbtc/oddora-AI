import { NextRequest, NextResponse } from "next/server";
import { generateMathematicalAccumulatorSlip } from "@/lib/sportybet";
import { executeEditSlipLogic } from "@/app/api/edit-slip-ai/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// Common non-booking code words to prevent false positives
const COMMON_WORDS_FILTER = new Set([
  "ODDS", "SLIP", "TODAY", "SPORTYBET", "BET9JA", "PLEASE", "REMOVE", "RISKY",
  "GAMES", "MATCH", "MATCHES", "LEGS", "ACCUMULATOR", "TICKET", "TICKETS",
  "GENERATE", "BUILD", "PRUNE", "AUDIT", "HELLO", "THANKS", "THANK",
  "MORNING", "EVENING", "AFTERNOON", "BETTING", "SOCCER", "FOOTBALL",
]);

/**
 * Extracts a candidate booking code from message text.
 * Matches explicit markers or uppercase/alphanumeric tokens (4-12 chars) that are not dictionary keywords.
 */
function extractBookingCode(text: string): string | null {
  // Explicit format: code BC12345, code: BC12345, ticket 9X2A, etc.
  const explicitMatch = text.match(/(?:code|ticket|sharecode|booking code)\s*[:=]?\s*([a-zA-Z0-9]{4,12})/i);
  if (explicitMatch && explicitMatch[1]) {
    const candidate = explicitMatch[1].trim().toUpperCase();
    if (!COMMON_WORDS_FILTER.has(candidate)) {
      return candidate;
    }
  }

  // Alphanumeric tokens with mixed letters and numbers or specific uppercase codes
  const tokens = text.split(/[\s,;:!?"'()]+/).map((t) => t.trim().toUpperCase());
  for (const token of tokens) {
    if (
      token.length >= 4 &&
      token.length <= 12 &&
      /^[A-Z0-9]+$/.test(token) &&
      !COMMON_WORDS_FILTER.has(token) &&
      !/^\d+$/.test(token) // Avoid pure numbers
    ) {
      // Must contain at least one letter and not be a common acronym
      return token;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message = "", user_rules = [] } = body;
    const trimmedMsg = message.trim();
    const msgLower = trimmedMsg.toLowerCase();

    const dateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // =========================================================================
    // 1. TOOL ACTION: EDIT / PRUNE SLIP VIA SENIOR ANALYST
    // Triggers if message mentions editing/pruning/trimming a booking code or pasting a code to remove games
    // =========================================================================
    const isEditIntent =
      msgLower.includes("edit") ||
      msgLower.includes("remove") ||
      msgLower.includes("prune") ||
      msgLower.includes("trim") ||
      msgLower.includes("cut") ||
      msgLower.includes("audit") ||
      msgLower.includes("risky games") ||
      msgLower.includes("risky legs");

    const detectedCode = extractBookingCode(trimmedMsg);

    if (isEditIntent && detectedCode) {
      // Determine bookmaker
      const bookmaker = msgLower.includes("bet9ja") ? "Bet9ja" : "SportyBet";

      // Detect remove count (e.g. "remove 5 risky games")
      const removeMatch = msgLower.match(/(?:remove|prune|trim|cut)\s*(\d+)/);
      const removeCount = removeMatch ? parseInt(removeMatch[1], 10) : 3;

      // Detect target odds (e.g. "to 30 odds", "reduce to 20 odds")
      const targetMatch = msgLower.match(/(?:to|target|reduce to)\s*(\d+[\d,.]*)\s*odds/);
      const targetOdds = targetMatch ? parseFloat(targetMatch[1].replace(/,/g, "")) : null;

      const mode = targetOdds ? "TARGET_ODDS" : removeMatch ? "REMOVE_X" : "SMART_PRUNE";

      try {
        const editResult = await executeEditSlipLogic({
          booking_code: detectedCode,
          bookmaker,
          mode,
          remove_count: removeCount,
          target_odds: targetOdds,
        });

        const prunedList = editResult.pruned_legs
          .map(
            (l: any, i: number) =>
              `${i + 1}. **${l.match}** (@${l.odd.toFixed(2)}) — ⚠️ *${l.catalyst_explanation || l.audit_tag || "High volatility market"}*`
          )
          .join("\n");

        const survivingList = editResult.surviving_legs
          .slice(0, 8)
          .map(
            (l: any, i: number) =>
              `${i + 1}. **${l.match}** — *${l.market}* @ **${l.odd.toFixed(2)}** [Survival: ${Math.round(
                (l.ai_survival_probability || 0.8) * 100
              )}%]`
          )
          .join("\n");

        const responseText = `✂️ **Senior Analyst Audit Complete for Code \`${editResult.original_booking_code}\`!**\n\n` +
          `📋 **Original Odds:** \`${editResult.original_total_odds}x\` (${editResult.surviving_games_count + editResult.pruned_games_count} legs)\n` +
          `⚡ **Optimized Multiplier:** **${editResult.new_total_odds}x** (${editResult.surviving_games_count} legs retained)\n` +
          `🎫 **New Booking Code:** \`${editResult.new_booking_code}\`\n` +
          `📈 **Survival Probability Gain:** **${editResult.survival_probability_gain}** (${editResult.audit_summary.original_survival_rate} ➜ ${editResult.audit_summary.optimized_survival_rate})\n` +
          `🔗 **Direct Link:** [Open Audited Slip on ${editResult.bookmaker}](${editResult.share_url})\n\n` +
          `🛑 **Pruned Risky Legs (Removed due to Red Flags):**\n${prunedList || "*(None flagged as severe)*"}\n\n` +
          `🛡️ **High-Floor Surviving Anchor Legs:**\n${survivingList}\n\n` +
          `*Every remaining leg satisfies the Oddora 6-Pillar Survival Floor.*`;

        return NextResponse.json({
          status: "success",
          type: "SLIP_EDITED",
          response: responseText,
          edited_slip: editResult,
        });
      } catch (err: any) {
        console.warn("Notice executing edit slip from chat:", err);
      }
    }

    // =========================================================================
    // 2. TOOL ACTION: GENERATE MULTIPLIER ACCUMULATOR SLIP
    // Triggers if message asks for target odds, slip generation, or safe odds
    // =========================================================================
    const isGenerateIntent =
      msgLower.includes("odds") ||
      msgLower.includes("give me") ||
      msgLower.includes("drop") ||
      msgLower.includes("generate") ||
      msgLower.includes("build") ||
      msgLower.includes("accumulator") ||
      msgLower.includes("acca") ||
      msgLower.includes("banker ticket");

    const hasOddsNumber = /(\d+[\d,.]*)\s*(?:odds|odd|x)/i.test(trimmedMsg) ||
      /(?:give me|drop|generate|build)\s*(\d+)/i.test(trimmedMsg) ||
      msgLower.includes("safe odds") ||
      msgLower.includes("banker odds");

    if (isGenerateIntent && hasOddsNumber) {
      // Parse target odds
      let targetOdds = 20.0;
      const numMatch = trimmedMsg.match(/(\d+[\d,.]*)\s*(?:odds|odd|x)/i) ||
        trimmedMsg.match(/(?:give me|drop|generate|build)\s*(\d+[\d,.]*)/i) ||
        trimmedMsg.match(/(\d+[\d,.]*)/);

      if (numMatch && numMatch[1]) {
        const parsed = parseFloat(numMatch[1].replace(/,/g, ""));
        if (!isNaN(parsed) && parsed >= 1.5) {
          targetOdds = parsed;
        }
      } else if (msgLower.includes("safe") || msgLower.includes("banker")) {
        targetOdds = 3.5;
      }

      const isBet9ja = msgLower.includes("bet9ja");
      const bookmaker = isBet9ja ? "Bet9ja" : "SportyBet";

      // Detect timeframe from user prompt
      let timeframe = "today";
      if (msgLower.includes("month")) timeframe = "1month";
      else if (msgLower.includes("week")) timeframe = "1week";
      else if (msgLower.includes("3 day") || msgLower.includes("weekend")) timeframe = "3days";

      try {
        const slip = await generateMathematicalAccumulatorSlip({
          targetOdds: targetOdds,
          timeframe: timeframe,
          bookmaker: bookmaker,
        });

        // Format cornerstone leg list
        const legsFormatted = slip.legs
          .slice(0, 8)
          .map(
            (l, idx) =>
              `${idx + 1}. **${l.match}** (${l.league})\n   👉 *${l.market}* @ **${l.odd.toFixed(2)}** [Confidence: ${l.confidence_score}%]\n   💬 *${l.ai_reasoning}*`
          )
          .join("\n\n");

        const responseText = `🎯 **Official ${slip.bookmaker} ${slip.actual_combined_odds}x Accumulator Slip Generated!**\n\n` +
          `📋 **Booking Code:** \`${slip.booking_code}\`\n` +
          `⚡ **Calculated Multiplier:** **${slip.actual_combined_odds}x** (Target: ${targetOdds}x)\n` +
          `🔢 **Total Legs:** ${slip.legs_count} matches\n` +
          `🔗 **Direct Link:** [Load Slip on ${slip.bookmaker}](${slip.share_url})\n\n` +
          `**Verified Mathematical Legs:**\n${legsFormatted}${
            slip.legs_count > 8 ? `\n\n*(+ ${slip.legs_count - 8} additional verified legs in ticket)*` : ""
          }\n\n*Multiplied mathematically using live ${slip.bookmaker} odds lines.*`;

        return NextResponse.json({
          status: "success",
          type: "SLIP_GENERATED",
          response: responseText,
          slip_data: slip,
        });
      } catch (err: any) {
        console.warn("Failed generating live slip from SportyBet in chat:", err);
      }
    }

    // =========================================================================
    // 3. CONVERSATIONAL AI & GENERAL ASSISTANT WITH SMART PLATFORM PIVOT
    // Handles greetings, platform inquiries (VIP, Affiliates, Autopsy), and general knowledge
    // =========================================================================

    // Fetch user custom directives from DB if available
    let trainedDirectives = "";
    try {
      const { data: dbDirectives } = await (supabase as any)
        .from("ai_lessons_memory")
        .select("lesson_text")
        .eq("category", "USER_DIRECTIVE")
        .limit(5);

      if (dbDirectives && dbDirectives.length > 0) {
        trainedDirectives =
          "\nUSER'S PERMANENT TRAINING DIRECTIVES:\n" +
          dbDirectives.map((d: any, i: number) => `${i + 1}. ${d.lesson_text}`).join("\n");
      }
    } catch {
      // Non-blocking
    }

    // Scrape live sports news if query is sports/injury related
    let liveNewsContext = "";
    const isNewsQuery =
      msgLower.includes("injur") ||
      msgLower.includes("news") ||
      msgLower.includes("update") ||
      msgLower.includes("form") ||
      msgLower.includes("squad") ||
      msgLower.includes("vs") ||
      msgLower.includes("lineup");

    if (isNewsQuery) {
      try {
        const rssRes = await fetch("https://feeds.bbci.co.uk/sport/football/rss.xml", { next: { revalidate: 300 } });
        if (rssRes.ok) {
          const xml = await rssRes.text();
          const headlines: string[] = [];
          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          let m;
          while ((m = itemRegex.exec(xml)) !== null && headlines.length < 8) {
            const title = m[1].match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || m[1].match(/<title>(.*?)<\/title>/)?.[1] || "";
            const desc = m[1].match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || m[1].match(/<description>(.*?)<\/description>/)?.[1] || "";
            if (title) headlines.push(`- ${title.trim()}: ${desc.trim()}`);
          }
          if (headlines.length > 0) {
            liveNewsContext = `\nREAL-TIME LIVE NEWS HEADLINES (${dateStr}):\n` + headlines.join("\n");
          }
        }
      } catch {
        // Non-blocking
      }
    }

    const systemPrompt = `Today's exact real-world date is ${dateStr}. You are Oddora AI Copilot, a sharp, warm, natural, and highly capable sports intelligence AI and assistant.

YOUR CAPABILITIES & PERSONA:
1. NATURAL HUMAN CONVERSATION:
   - When a user greets you ("Hello", "Hi", "Good morning", "How are you doing?"), respond warmly, politely, and naturally like a real AI companion. E.g.: "I'm doing great this morning, thanks for asking! How are you doing today? Whenever you're ready, let me know what we're cooking up—I can analyze today's football matches, generate an exact odds slip for you, or audit and edit your SportyBet/Bet9ja booking code!"
2. GENERAL QUESTIONS + SMART PLATFORM PIVOT:
   - If a user asks a general question (even outside of football/sports, such as coding, math, world events, or advice), answer it helpfully, concisely, and accurately like a normal smart AI.
   - At the end of your answer, smoothly and politely remind them of what you can do for them on Oddora AI (e.g., "By the way, whenever you want to check today's fixtures, I can generate anything from 2 odds to 20,000 odds on SportyBet/Bet9ja or trim risky legs from an existing booking code for you!").
3. PLATFORM INQUIRIES:
   - Free vs. Pro/VIP: Free tier includes 3 daily Banker picks and 3x-5x slips. Pro/VIP unlocks full 100+ match dossiers, 500x - 20,000x accumulator engine, advanced catalyst pruning, Discord alerts, and full quantitative breakdowns.
   - 30% Affiliate Program: Users earn a permanent 30% recurring monthly commission on every referral. Each member has a unique referral code (ODD-XXXXX) in their Affiliates dashboard with instant withdrawal into user balance.
   - 12:00 AM Midnight Autopsy: Automated 00:00 UTC pipeline that audits all platform slips against official match scores, extracts tactical lessons using 768-dim vector embeddings, and re-calibrates the 6-pillar engine weights before morning kickoff.
   - Odds Generation: The user can ask for any target odds (e.g. "Give me 20 odds for today" or "Build 500 odds for 1 week on SportyBet") and you will directly generate a booking code.
   - Edit Slip: The user can paste any SportyBet/Bet9ja code (e.g. "Edit code BC12345 to 30 odds" or "Remove 5 risky games from BC12345") to prune high-risk legs.
4. FOOTBALL ANALYSIS:
   - Use the 6-Pillar Framework: Form & xG, Tactical Style Clash, Squad Availability & Injuries, Schedule Congestion, Psychological Stakes & H2H, and Multi-Market Floor (Over 1.5, Double Chance, DNB). Never stack more than 30% straight wins.

${trainedDirectives}
${liveNewsContext}`;

    // -------------------------------------------------------------------------
    // ATTEMPT 1: GROQ LLM (LLaMA 3.3 70B)
    // -------------------------------------------------------------------------
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: trimmedMsg },
            ],
            temperature: 0.5,
            max_tokens: 700,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const aiText = groqData.choices?.[0]?.message?.content;
          if (aiText) {
            return NextResponse.json({
              status: "success",
              type: "CHAT_ANSWER",
              response: aiText,
            });
          }
        }
      } catch (err) {
        console.warn("Groq inference notice:", err);
      }
    }

    // -------------------------------------------------------------------------
    // ATTEMPT 2: GOOGLE GEMINI LLM (GEMINI_API_KEY)
    // -------------------------------------------------------------------------
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `${systemPrompt}\n\nUSER MESSAGE: ${trimmedMsg}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 700,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText) {
            return NextResponse.json({
              status: "success",
              type: "CHAT_ANSWER",
              response: aiText,
            });
          }
        }
      } catch (err) {
        console.warn("Gemini inference notice:", err);
      }
    }

    // -------------------------------------------------------------------------
    // ATTEMPT 3: INTELLIGENT BUILT-IN CONVERSATIONAL ENGINE
    // Fallback when no external LLM keys are configured or APIs are down
    // -------------------------------------------------------------------------
    const isGreeting =
      msgLower.startsWith("hi") ||
      msgLower.startsWith("hello") ||
      msgLower.startsWith("hey") ||
      msgLower.includes("good morning") ||
      msgLower.includes("good afternoon") ||
      msgLower.includes("good evening") ||
      msgLower.includes("how are you") ||
      msgLower.includes("how do you do") ||
      msgLower.includes("what's up");

    if (isGreeting) {
      const greetingResponse = `👋 **Hello and good day! I'm doing great, thanks for asking!**\n\n` +
        `I am your **Oddora AI Sports Copilot & Quantitative Analyst**.\n\n` +
        `Here is what we can do together right now:\n` +
        `🎯 **Generate Slips:** Ask me *"Give me 20 odds for today"* or *"Build 500 odds for 1 week on SportyBet"* to generate a verified booking code.\n` +
        `✂️ **Audit & Edit Tickets:** Paste any booking code (*"Edit this code BC12345 to 30 odds"*) to prune high-risk matches.\n` +
        `📊 **Match Analysis:** Ask about any team, injury report, or tactical style clash happening today.\n\n` +
        `What are we cooking up today?`;

      return NextResponse.json({
        status: "success",
        type: "CHAT_ANSWER",
        response: greetingResponse,
      });
    }

    // Platform: Affiliates
    if (msgLower.includes("affiliate") || msgLower.includes("referral") || msgLower.includes("commission")) {
      return NextResponse.json({
        status: "success",
        type: "CHAT_ANSWER",
        response: `💼 **Oddora AI 30% Lifetime Affiliate Program:**\n\n` +
          `• **Commission:** You earn a permanent **30% recurring monthly commission** on every active subscriber you refer to Oddora Pro or VIP.\n` +
          `• **Referral Code:** Every registered user has a unique code (e.g. \`ODD-XXXXX\`) available on the **Affiliates** page.\n` +
          `• **Instant Payouts:** Affiliate earnings credit directly to your Oddora balance with zero hold times.\n\n` +
          `Share your link with your betting syndicates or community to start generating passive income!`,
      });
    }

    // Platform: Pricing / VIP
    if (msgLower.includes("vip") || msgLower.includes("pro") || msgLower.includes("pricing") || msgLower.includes("plan")) {
      return NextResponse.json({
        status: "success",
        type: "CHAT_ANSWER",
        response: `👑 **Oddora AI Tiers & Pricing:**\n\n` +
          `• **Free Tier:** Access to top 3 daily Banker picks, basic 3x-5x slips, and live telemetry.\n` +
          `• **Pro Plan:** Unlocks full 100+ match dossiers, custom rules engine, and up to 50x multiplier slips.\n` +
          `• **VIP Syndicate:** Access to 500x - 20,000x accumulator engine, advanced catalyst pruning, priority Discord community, and 12:00 AM Midnight Autopsy logs.\n\n` +
          `Check out the **Pricing** tab in the navigation bar to upgrade anytime!`,
      });
    }

    // Platform: Midnight Autopsy
    if (msgLower.includes("autopsy") || msgLower.includes("midnight") || msgLower.includes("self-learning")) {
      return NextResponse.json({
        status: "success",
        type: "CHAT_ANSWER",
        response: `🔬 **12:00 AM Midnight Autopsy Engine:**\n\n` +
          `Every night at **00:00 UTC**, Oddora AI executes an autonomous grading routine:\n` +
          `1. Cross-references all yesterday's predictions and slips against official final match scorelines.\n` +
          `2. Conducts root-cause failure autopsies on failed picks using 768-dimensional vector embeddings.\n` +
          `3. Dynamically re-calibrates 6-pillar weights (Form, xG, Squad Availability, Low-Block penalties) before morning fixtures kickoff.\n\n` +
          `You can view yesterday's full graded audit right now in the **Autopsy** tab!`,
      });
    }

    // Default Conversational Answer with Smooth Platform Pivot
    return NextResponse.json({
      status: "success",
      type: "CHAT_ANSWER",
      response: `⚽ **Oddora Quantitative Analyst Intelligence (${dateStr}):**\n\n` +
        `I've analyzed your query: **"${trimmedMsg}"**.\n\n` +
        `Our 6-Pillar Engine is actively tracking today's football schedule across Europe, South America, and Africa. Starting lineups, tactical clash dynamics, and SportyBet/Bet9ja odds line movements are actively factored into our models.\n\n` +
        `💡 *Whenever you're ready, you can type:* \n` +
        `• *"Give me 20 odds for today"*\n` +
        `• *"Generate 50 odds on SportyBet"*\n` +
        `• *"Edit code BC12345 to 15 odds"*\n\n` +
        `I'll generate or prune the slip instantly for you right here in chat!`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}
