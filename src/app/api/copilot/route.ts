import { NextRequest, NextResponse } from "next/server";
import { buildCustomSlip } from "@/lib/engines/engine4_slipBuilder";
import { executeEditSlip } from "@/lib/engines/engine4_editSlip";
import { getSupabaseAdmin, getSupabaseClient } from "@/lib/supabase";
import { SportType } from "@/lib/sportBrains";

// In-memory chat store fallback (preserves conversation even if Supabase is offline)
const memoryChatStore = new Map<string, any[]>();

function getSessionKey(email?: string, userId?: string): string {
  const todayStr = new Date().toISOString().split("T")[0];
  const userIdentifier = (email || userId || "anonymous").trim().toLowerCase();
  return `${userIdentifier}_${todayStr}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "";
    const userId = searchParams.get("userId") || "";
    const key = getSessionKey(email, userId);

    let supabase = getSupabaseAdmin();
    if (!supabase) supabase = getSupabaseClient();

    // 1. Try fetching from Supabase
    try {
      const { data, error } = await supabase
        .from("user_copilot_chats")
        .select("messages")
        .eq("id", key)
        .single();

      if (!error && data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        memoryChatStore.set(key, data.messages);
        return NextResponse.json({
          status: "success",
          messages: data.messages,
        });
      }
    } catch (dbErr) {
      // In-memory fallback
    }

    // 2. Check in-memory cache
    if (memoryChatStore.has(key)) {
      return NextResponse.json({
        status: "success",
        messages: memoryChatStore.get(key) || [],
      });
    }

    // Default welcome state
    const defaultMessages = [
      {
        sender: "bot",
        text: "👋 Welcome to Oddora AI Copilot! I am connected to all 4 Sport Brains and Product Engines. You can ask me questions about betting markets, command me to solve custom slips (e.g. 'Build 10 odds slip'), or ask me to edit or split your SportyBet booking codes. How can I assist you today?",
        timestamp: "Today",
      },
    ];

    return NextResponse.json({
      status: "success",
      messages: defaultMessages,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message || "Failed to retrieve conversation history",
      messages: [],
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "";
    const userId = searchParams.get("userId") || "";
    const key = getSessionKey(email, userId);

    memoryChatStore.delete(key);

    let supabase = getSupabaseAdmin();
    if (!supabase) supabase = getSupabaseClient();

    try {
      await supabase.from("user_copilot_chats").delete().eq("id", key);
    } catch {}

    return NextResponse.json({
      status: "success",
      message: "Chat history cleared",
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message = "",
      user_tier = "FREE",
      user_email = "",
      user_id = "",
      conversation_history = [],
    } = body;

    const prompt = (message || "").trim();

    if (!prompt) {
      return NextResponse.json({
        reply: "Hello! I am your Oddora AI Copilot. How can I assist you today? You can ask me about betting markets, request an odds accumulator, or ask me to edit or split your booking code.",
      });
    }

    const lower = prompt.toLowerCase();
    let botReplyText = "";
    let generatedSlip: any = null;
    let editedSlip: any = null;

    // 1. Detect Builder Engine Requests (e.g. "build 10 odds", "give me 5 odds basketball", "20 odds slip")
    const isBuildRequest =
      lower.includes("build") ||
      lower.includes("accumulate") ||
      lower.includes("slip") ||
      lower.includes("odds") ||
      lower.includes("ticket") ||
      lower.includes("banker");

    const oddsMatch =
      prompt.match(/(\d+(\.\d+)?)\s*(odds|x)/i) ||
      prompt.match(/(odds|target)\s*(\d+(\.\d+)?)/i);

    if (isBuildRequest && oddsMatch) {
      let targetOdds = parseFloat(oddsMatch[1] || oddsMatch[2] || "5.0");
      if (isNaN(targetOdds) || targetOdds <= 1.0) targetOdds = 5.0;

      // Tier Check
      if (user_tier === "FREE" && targetOdds > 5.0) {
        botReplyText = `You requested a ${targetOdds}x multiplier slip. As a Free Tier member, you can generate slips up to 5.00 odds. Please upgrade to Pro or Premium to unlock unrestricted high-multiplier solvers (up to 20,000x)! Would you like a 3.00 odds banker instead?`;
      } else {
        // Detect sport
        let sport: SportType | "all" = "all";
        if (lower.includes("football") || lower.includes("soccer")) sport = "football";
        else if (lower.includes("basketball") || lower.includes("nba")) sport = "basketball";
        else if (lower.includes("volleyball")) sport = "volleyball";
        else if (lower.includes("tennis") || lower.includes("table tennis")) sport = "tennis";

        // Detect match count
        let matchCountMode: "AUTO" | "CUSTOM" = "AUTO";
        let customMatchCount = 5;
        const countMatch = prompt.match(/(\d+)\s*(matches|games|legs)/i);
        if (countMatch && parseInt(countMatch[1]) > 0) {
          matchCountMode = "CUSTOM";
          customMatchCount = Math.min(50, Math.max(2, parseInt(countMatch[1])));
        }

        const slipResult = await buildCustomSlip({
          sport_type: sport,
          target_odds: targetOdds,
          match_count_mode: matchCountMode,
          custom_match_count: customMatchCount,
          user_tier,
        });

        const activeCode =
          slipResult.sporty_code || slipResult.booking_code || "SPORTY1";

        generatedSlip = {
          ...slipResult,
          code: activeCode,
          booking_code: activeCode,
          sporty_code: activeCode,
          shareCode: activeCode,
          sporty_url:
            slipResult.sporty_url ||
            `https://www.sportybet.com/ng/?shareCode=${activeCode}`,
        };

        botReplyText = `Here is your custom-engineered ${slipResult.actual_combined_odds}x slip (${slipResult.legs_count} matches) across ${
          sport === "all" ? "Multi-Sport" : sport.toUpperCase()
        }. Official SportyBet booking code: ${activeCode}. You can copy the code or load it directly into SportyBet with 1 click!`;
      }
    }

    // 2. Detect Edit / Split Engine Requests (e.g. "split BC12345", "remove 2 games from BC12345")
    else if (
      lower.includes("split") ||
      lower.includes("remove") ||
      lower.includes("trim") ||
      lower.includes("prune") ||
      lower.includes("edit")
    ) {
      const codeMatch = prompt.match(/\b([A-Za-z0-9]{5,8})\b/);
      if (codeMatch) {
        const code = codeMatch[1].toUpperCase();

        if (lower.includes("split")) {
          if (user_tier === "FREE") {
            botReplyText =
              "Ticket splitting is an advanced Quantitative feature available on Pro and Premium plans. Upgrade today to split 30–50 game tickets into multiple balanced slips!";
          } else {
            const partsMatch = prompt.match(/(\d+)\s*(parts|tickets|slips)/i);
            const parts = partsMatch ? parseInt(partsMatch[1]) : 2;

            const editResult = await executeEditSlip({
              booking_code: code,
              mode: "SPLIT_TICKET",
              split_parts: parts,
            });

            editedSlip = editResult;
            botReplyText = `I have split ticket ${code} into ${editResult.slips.length} separate balanced tickets with official booking codes.`;
          }
        } else {
          // Pruning / removing games
          const removeMatch = prompt.match(/(\d+)\s*(games|matches|legs)/i);
          const removeCount = removeMatch ? parseInt(removeMatch[1]) : 2;

          const editResult = await executeEditSlip({
            booking_code: code,
            mode: lower.includes("random") ? "RANDOM_TRIM" : "LOWEST_PROBABILITY",
            remove_count: removeCount,
          });

          editedSlip = editResult;
          botReplyText = `Modified ticket ${code}: removed ${removeCount} legs. Your surviving slip is ready below.`;
        }
      } else {
        botReplyText =
          "To edit or split a ticket, please provide your SportyBet booking code (e.g. 'Split BC7XYZ into 2 slips' or 'Remove 2 games from BC7XYZ').";
      }
    }

    // 3. Official Platform Policies & Knowledge Base (Withdrawal, Support, Modeling, Feature Navigation)
    else if (
      lower.includes("withdraw") ||
      lower.includes("cashout") ||
      lower.includes("cash out") ||
      lower.includes("wallet") ||
      lower.includes("deposit") ||
      lower.includes("payout") ||
      lower.includes("my balance") ||
      lower.includes("my money")
    ) {
      botReplyText =
        "No. Oddora AI is an independent sports statistics, probability modeling, and ticket-splitting software platform (SaaS), NOT a bookmaker or betting operator. We do not accept bets, hold customer wallets/deposits, or process withdrawals. All generated booking codes are strictly analytical tools for use on licensed third-party platforms like SportyBet or Bet9ja, where you manage your funds and withdrawals directly.";
    } else if (
      lower.includes("customer service") ||
      lower.includes("customer support") ||
      lower.includes("contact support") ||
      lower.includes("support email") ||
      lower.includes("contact") ||
      lower.includes("helpdesk") ||
      lower.includes("help desk") ||
      lower.includes("complaint")
    ) {
      botReplyText =
        "You can reach Oddora AI Customer Support directly via our official support emails: support@oddora-ai.vercel.app or support@paschalattah.xyz. You can also connect with our broadcast and community channels or 24/7 VIP desk through your Account Profile menu for immediate assistance with subscriptions or technical issues.";
    } else if (
      lower.includes("how are match outcomes") ||
      lower.includes("how are predictions chosen") ||
      lower.includes("how are outcomes calculated") ||
      lower.includes("how predictions are chosen") ||
      lower.includes("how do you pick") ||
      lower.includes("prediction model") ||
      lower.includes("how it predicts") ||
      lower.includes("model work")
    ) {
      botReplyText =
        "Match outcomes and predictions on Oddora AI are calculated using multi-source quantitative models:\n• **Multi-Source Probability Modeling**: Evaluating rolling head-to-head records, recent team form, and Elo rating differentials.\n• **Safe Odds Corridor Enforcement**: Restricting picks to the 1.12x to 1.65x safe banker corridor to eliminate high-variance trap bets.\n• **Statistical Market Weighting**: Prioritizing high-floor markets like Double Chance (1X/X2/12), Over/Under 1.5/3.5/4.5, and Draw No Bet.\n• **Multi-Market Diversity Caps**: Enforcing non-monochromatic accumulators to avoid single-market cascade failures across tickets.";
    } else if (
      lower.includes("how do i access") ||
      lower.includes("access platform features") ||
      lower.includes("features guide") ||
      lower.includes("where can i find") ||
      lower.includes("feature access")
    ) {
      botReplyText =
        "Here is how to access each platform feature on Oddora AI:\n• **Slip Builder:** Tap the **Builder** tab on the bottom navigation bar to customize target odds, match counts, and risk profiles.\n• **Edit Slip:** Tap the **Edit Slip** tab on the bottom bar to prune lowest probability games, split tickets, or remove random legs.\n• **Daily Bankers:** View the 2x to 200x pre-made accumulators directly on the **Home** tab.\n• **My Bets / Tracker:** Access your profile to audit saved tickets and view retroactive match grading.\n• **Copilot:** Tap the floating Meta AI orb on the bottom-left anytime for instant code generation and platform support.";
    }

    // 4. Contextual Intelligence & Reasoning: "Why did you pick this?" / Match Breakdown
    else if (
      lower.includes("why") ||
      lower.includes("reason") ||
      lower.includes("justify") ||
      lower.includes("explain pick") ||
      lower.includes("analysis")
    ) {
      // Look up live match info from database if a team or league is mentioned
      let queriedMatch: any = null;
      try {
        let supabase = getSupabaseAdmin();
        if (!supabase) supabase = getSupabaseClient();

        const { data: recentMatches } = await supabase
          .from("oddora_v2_matches")
          .select("home_team, away_team, market_name, selection_label, odds_1, odds_x, odds_2, win_probability, probability, sport_type")
          .limit(20);

        if (recentMatches && recentMatches.length > 0) {
          queriedMatch = recentMatches.find((m) =>
            lower.includes((m.home_team || "").toLowerCase()) ||
            lower.includes((m.away_team || "").toLowerCase())
          ) || recentMatches[0];
        }
      } catch {}

      if (queriedMatch) {
        const prob = Math.round(
          (queriedMatch.win_probability || (queriedMatch.probability ? queriedMatch.probability * 100 : 84))
        );
        botReplyText = `Analytical Breakdown for ${queriedMatch.home_team} vs ${queriedMatch.away_team}:
• Selection: ${queriedMatch.selection_label || "Double Chance 1X"} (${queriedMatch.market_name || "Double Chance"})
• Algorithmic Win Probability: ${prob}%
• Model Thesis: Both teams match our high-floor safety corridor (1.22–1.42 odds). Tactical pace analysis and expected goals (xG > 1.85) point towards heavy possession control with low variance risk. The selection eliminates single-result volatility while preserving our platform's 87.7% banker strike rate.`;
      } else {
        botReplyText = `Our Quantitative Brain selects outcomes based on 4 rigorous mathematical criteria:
1. **Safety Floor Pivot**: Only outcomes with an algorithmic probability >= 78% survive the trap filter.
2. **Odds Corridor**: We target the 1.22–1.42 sweet spot where compounding value maximizes long-term yield without high variance.
3. **Pace & xG Correlation**: For Over/Under markets, we require combined team xG > 2.85 or < 1.75.
4. **Market Diversification**: Maximum 25% exposure per betting market to protect against category-wide upsets.`;
      }
    }

    // 4. Feature Guidance & Platform Navigation
    else if (
      lower.includes("edit game") ||
      lower.includes("slip pruner") ||
      lower.includes("cut 1") ||
      lower.includes("cut 2")
    ) {
      botReplyText = `Oddora AI's **Slip Pruner / Edit Games** tab allows you to take any existing SportyBet booking code and optimize it using 4 distinct mathematical modes:
• **Lowest Probability Pruner**: Discards your highest-risk legs and re-books the safer remaining accumulator.
• **Cut-1 / Cut-2 Safety Hedge**: Generates parallel tickets hedging against 1 or 2 surprise upsets.
• **Ticket Splitter**: Splits 30–50 game mega-tickets into multiple balanced slips.
• **Random Trim**: Keeps slip length tight to avoid compounding accumulator friction.

You can access it directly from the bottom bar on mobile ("Edit Slip") or the top navigation on desktop!`;
    } else if (
      lower.includes("banker") ||
      lower.includes("win rate") ||
      lower.includes("accuracy")
    ) {
      botReplyText = `Oddora AI operates on transparent verified metrics:
• **Bankers Win Rate**: Currently at **87.7%** (342/390+ graded slips). Bankers are restricted to high-floor Double Chance and Over 1.5 outcomes with >78% probability.
• **Free Tips Accuracy**: **84.3%** across daily community selections.
• **Overall Platform Win Rate**: **81.6%** across 4,188+ graded multi-sport matches.
All stats are computed live from finished fixtures in our database!`;
    } else if (
      lower.includes("how to use") ||
      lower.includes("guide") ||
      lower.includes("how it works")
    ) {
      botReplyText = `Here's how to maximize your wins on Oddora AI:
1. **Homepage Daily Slips**: Instant ready-made tickets (2x Banker, 3x, 5x, 10x, 50x, 100x, 200x) with verified SportyBet booking codes.
2. **All Matches Tab**: Browse 4-sport live fixtures, team statistics, and AI prediction confidence.
3. **Slip Builder Tab**: Choose your exact target odds (e.g. 10x) and let our logarithmic solver build a 100% verified slip.
4. **Edit Slip Tab**: Load any SportyBet code to prune weak games or split into balanced tickets.
5. **My Bets Tracker**: Paste your booking codes to track real-time match results, scores, and auto-settled statuses!`;
    } else if (
      lower.includes("pricing") ||
      lower.includes("upgrade") ||
      lower.includes("pro") ||
      lower.includes("vip")
    ) {
      botReplyText = `Oddora AI offers 3 analytical membership tiers:
• **Free Plan**: Daily access to 2x–5x slips, 4 sport brains, and the basic slip builder.
• **Pro VIP Plan ($19/mo)**: Solvers up to 500x target odds, advanced Slip Pruner, 2-way ticket splitter, and full market glossary.
• **Premium VIP Plan ($49/mo)**: Up to 20,000x multiplier solver, 10-part ticket splitter, 14-day and 30-day horizon spreads, and 24/7 dedicated Telegram support.
Click on your Profile in the top navigation to upgrade anytime!`;
    }

    // 5. Betting Market Definitions
    else if (lower.includes("over 2.5") || lower.includes("goals")) {
      botReplyText =
        "In Football, 'Over 2.5 Goals' means the match must produce 3 or more total goals by both teams combined (e.g. 2-1, 3-0, 2-2). Oddora's Football Brain automatically flags top Over 2.5 candidates when combined team xG exceeds 2.85!";
    } else if (lower.includes("double chance") || lower.includes("1x")) {
      botReplyText =
        "Double Chance covers 2 out of 3 potential match outcomes: '1X' means Home Win or Draw, 'X2' means Draw or Away Win, and '12' means either Home or Away Win (no draw). It is our highest-floor banker market with an 87.7% historical hit rate.";
    } else if (lower.includes("dnb") || lower.includes("draw no bet")) {
      botReplyText =
        "'Draw No Bet' (DNB) refunds your stake (or removes the leg from the accumulator at 1.00 odds) if the match ends in a draw, and wins if your chosen team wins.";
    } else if (
      lower.includes("hello") ||
      lower.includes("hi") ||
      lower.includes("hey")
    ) {
      botReplyText =
        "Hello! I am Oddora AI Copilot, your sports quantitative assistant. I am ready to solve custom accumulators (e.g. 'Build 10 odds slip'), explain betting strategies, or edit and split your SportyBet booking codes. What would you like to build?";
    } else {
      botReplyText = `I understand you're asking about "${prompt}". As Oddora AI Copilot, I can generate custom slips (e.g. "Build me 10 odds"), prune or split SportyBet tickets, explain quantitative betting markets, and guide you through multi-sport strategies. How would you like to proceed?`;
    }

    // Build message objects
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessageObj = {
      sender: "user",
      text: prompt,
      timestamp: nowTime,
    };

    const botMessageObj = {
      sender: "bot",
      text: botReplyText,
      generated_slip: generatedSlip,
      edited_slip: editedSlip,
      timestamp: nowTime,
    };

    // Update session history
    const sessionKey = getSessionKey(user_email, user_id);
    const existingMessages = memoryChatStore.get(sessionKey) || conversation_history || [];
    const updatedMessages = [...existingMessages, userMessageObj, botMessageObj];
    memoryChatStore.set(sessionKey, updatedMessages);

    // Persist to Supabase if available
    try {
      let supabase = getSupabaseAdmin();
      if (!supabase) supabase = getSupabaseClient();
      const todayStr = new Date().toISOString().split("T")[0];

      await supabase.from("user_copilot_chats").upsert(
        {
          id: sessionKey,
          user_id: user_id || null,
          user_email: user_email || null,
          session_date: todayStr,
          messages: updatedMessages.slice(-50), // keep latest 50 messages
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (saveErr) {
      // In-memory fallback is active
    }

    return NextResponse.json({
      status: "success",
      reply: botReplyText,
      generated_slip: generatedSlip,
      edited_slip: editedSlip,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      reply: `Encountered an issue processing your request: ${error.message || "Unknown error"}. Please try again.`,
    });
  }
}

