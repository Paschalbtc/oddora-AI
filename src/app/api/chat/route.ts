import { NextRequest, NextResponse } from "next/server";
import { buildCustomSlip } from "@/lib/engines/engine3_slipBuilder";
import { executeEditSlip } from "@/lib/engines/engine4_editSlip";
import { SportType } from "@/lib/sportBrains";

export async function POST(request: NextRequest) {
  try {
    const { message, user_tier = "FREE" } = await request.json();
    const prompt = (message || "").trim();

    if (!prompt) {
      return NextResponse.json({
        reply: "Hello! I am your Oddora AI Copilot. How can I assist you today? You can ask me about betting markets, request an odds accumulator, or ask me to edit or split your booking code.",
      });
    }

    const lower = prompt.toLowerCase();

    // 1. Detect Builder Engine Requests (e.g. "build 10 odds", "give me 5 odds basketball", "20 odds slip")
    const isBuildRequest =
      lower.includes("build") ||
      lower.includes("accumulate") ||
      lower.includes("slip") ||
      lower.includes("odds") ||
      lower.includes("ticket") ||
      lower.includes("banker");

    const oddsMatch = prompt.match(/(\d+(\.\d+)?)\s*(odds|x)/i) || prompt.match(/(odds|target)\s*(\d+(\.\d+)?)/i);

    if (isBuildRequest && oddsMatch) {
      let targetOdds = parseFloat(oddsMatch[1] || oddsMatch[2] || "5.0");
      if (isNaN(targetOdds) || targetOdds <= 1.0) targetOdds = 5.0;

      // Tier Check
      if (user_tier === "FREE" && targetOdds > 5.0) {
        return NextResponse.json({
          reply: `You requested a ${targetOdds}x multiplier slip. As a Free Tier member, you can generate slips up to 5.00 odds. Please upgrade to Pro or Premium to unlock unrestricted high-multiplier solvers (up to 20,000x)! Would you like a 3.00 odds banker instead?`,
        });
      }

      // Detect sport
      let sport: SportType | "all" = "all";
      if (lower.includes("football") || lower.includes("soccer")) sport = "football";
      else if (lower.includes("basketball") || lower.includes("nba")) sport = "basketball";
      else if (lower.includes("volleyball")) sport = "volleyball";
      else if (lower.includes("tennis")) sport = "tennis";

      // Detect match count
      let matchCountMode: "AUTO" | "CUSTOM" = "AUTO";
      let customMatchCount = 5;
      const countMatch = prompt.match(/(\d+)\s*(matches|games|legs)/i);
      if (countMatch && parseInt(countMatch[1]) > 0) {
        matchCountMode = "CUSTOM";
        customMatchCount = parseInt(countMatch[1]);
      }

      const slipResult = await buildCustomSlip({
        sport_type: sport,
        target_odds: targetOdds,
        match_count_mode: matchCountMode,
        custom_match_count: customMatchCount,
        user_tier,
      });

      return NextResponse.json({
        reply: `Here is your custom-engineered ${slipResult.actual_combined_odds}x slip (${slipResult.legs_count} matches) across ${sport === "all" ? "Multi-Sport" : sport.toUpperCase()}. Official SportyBet and Bet9ja booking codes have been generated below!`,
        generated_slip: slipResult,
      });
    }

    // 2. Detect Edit / Split Engine Requests (e.g. "split BC12345", "remove 2 games from BC12345")
    const isEditRequest =
      lower.includes("split") ||
      lower.includes("remove") ||
      lower.includes("trim") ||
      lower.includes("prune") ||
      lower.includes("edit");

    const codeMatch = prompt.match(/\b([A-Za-z0-9]{5,8})\b/);

    if (isEditRequest && codeMatch) {
      const code = codeMatch[1].toUpperCase();

      if (lower.includes("split")) {
        if (user_tier === "FREE") {
          return NextResponse.json({
            reply: "Ticket splitting is an advanced Quantitative feature available on Pro and Premium plans. Upgrade today to split 30–50 game tickets into multiple balanced slips!",
          });
        }

        const partsMatch = prompt.match(/(\d+)\s*(parts|tickets|slips)/i);
        const parts = partsMatch ? parseInt(partsMatch[1]) : 2;

        const editResult = await executeEditSlip({
          booking_code: code,
          mode: "SPLIT_TICKET",
          split_parts: parts,
        });

        return NextResponse.json({
          reply: `I have split ticket ${code} into ${editResult.slips.length} separate balanced tickets with official booking codes.`,
          edited_slip: editResult,
        });
      } else {
        // Pruning / removing games
        const removeMatch = prompt.match(/(\d+)\s*(games|matches|legs)/i);
        const removeCount = removeMatch ? parseInt(removeMatch[1]) : 2;

        const editResult = await executeEditSlip({
          booking_code: code,
          mode: lower.includes("random") ? "RANDOM_TRIM" : "LOWEST_PROBABILITY",
          remove_count: removeCount,
        });

        return NextResponse.json({
          reply: `Modified ticket ${code}: removed ${removeCount} legs. Your surviving slip is ready below.`,
          edited_slip: editResult,
        });
      }
    }

    // 3. Conversational & Explanatory Intent
    if (
      lower.includes("hello") ||
      lower.includes("hi") ||
      lower.includes("how are you") ||
      lower.includes("hey")
    ) {
      return NextResponse.json({
        reply: "Hello! I am Oddora AI Copilot, your sports quantitative assistant. I am ready to analyze games, solve accumulator tickets, explain betting markets, or modify booking codes for you. What would you like to explore?",
      });
    }

    if (lower.includes("over 2.5") || lower.includes("goals")) {
      return NextResponse.json({
        reply: "In Football, 'Over 2.5 Goals' means the match must produce 3 or more total goals by both teams combined (e.g. 2-1, 3-0, 2-2). Oddora's Football Brain automatically flags top Over 2.5 candidates when combined team xG exceeds 2.85!",
      });
    }

    if (lower.includes("double chance") || lower.includes("1x")) {
      return NextResponse.json({
        reply: "Double Chance covers 2 out of 3 potential match outcomes: '1X' means Home Win or Draw, 'X2' means Draw or Away Win, and '12' means either Home or Away Win (no draw). It is our highest-floor banker market.",
      });
    }

    if (lower.includes("basketball") || lower.includes("points")) {
      return NextResponse.json({
        reply: "In Basketball, our Brain analyzes Moneyline (match winner), Point Spread Handicaps, and Total Points Over/Under (typically 210.5–228.5 lines) based on team offensive pace and defensive ratings.",
      });
    }

    // Default intelligent assistance
    return NextResponse.json({
      reply: `I understand you're asking about "${prompt}". As Oddora AI Copilot, I can build custom slips (e.g. "Build me 10 odds"), modify or split SportyBet/Bet9ja tickets, and guide you through multi-sport betting analytics. How can I assist you right now?`,
    });
  } catch (error: any) {
    return NextResponse.json({
      reply: `Encountered an issue processing your request: ${error.message || "Unknown error"}. Please try again.`,
    });
  }
}

