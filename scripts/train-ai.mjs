#!/usr/bin/env node

/**
 * Oddora AI V2 - Off-Platform CLI AI Trainer
 * Run in your VS Code terminal: `node scripts/train-ai.mjs` or `npm run train`
 * Allows private training, adding heuristic rules, and calibrating market weights
 * directly in Supabase table `public.oddora_v2_ai_directives`.
 */

import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...vals] = trimmed.split("=");
      if (key && vals.length > 0) {
        const val = vals.join("=").replace(/^["']|["']$/g, "");
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val.trim();
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://fdlbnftfylcsjuzqbeuo.supabase.co";

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("\x1b[31m[ERROR] Missing Supabase service/anon key in .env.local!\x1b[0m");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

function clearScreen() {
  console.clear();
  console.log("\x1b[32m========================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m   🧠 ODDORA AI V2 — PRIVATE TERMINAL AI TRAINER       \x1b[0m");
  console.log("\x1b[32m========================================================\x1b[0m");
  console.log(`Connected to: \x1b[33m${supabaseUrl}\x1b[0m\n`);
}

async function listDirectives() {
  clearScreen();
  console.log("\x1b[1m📋 CURRENT ACTIVE AI DIRECTIVES & MARKET WEIGHTS:\x1b[0m\n");

  const { data, error } = await supabase
    .from("oddora_v2_ai_directives")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("\x1b[31mError fetching directives:\x1b[0m", error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No directives found in oddora_v2_ai_directives yet.\n");
    return;
  }

  console.table(
    data.map((d) => ({
      ID: d.id.slice(0, 8) + "...",
      Rule_Name: d.rule_name,
      Sport: d.sport,
      Market: d.market_affected,
      Weight: `${d.weight_adjustment}x`,
      Min_Prob: `${d.min_probability_threshold}%`,
      Active: d.is_active ? "✅ YES" : "❌ NO",
    }))
  );
  console.log();
}

async function addDirective() {
  clearScreen();
  console.log("\x1b[1m➕ ADD NEW AI DIRECTIVE / TRAINING HEURISTIC:\x1b[0m\n");

  const rule_name = await ask("Rule Name (e.g. 'Over 2.5 High xG Boost'): ");
  if (!rule_name.trim()) return;

  const sport = (await ask("Sport (football | basketball | volleyball | tennis | all) [all]: ")) || "all";
  const market_affected = (await ask("Market Affected (e.g. 'Over 2.5', '1X', 'Total Points', 'all') [all]: ")) || "all";
  const weightInput = await ask("Weight Adjustment (e.g. 1.20 to boost by 20%, 0.85 to penalize) [1.15]: ");
  const weight_adjustment = parseFloat(weightInput) || 1.15;
  const minProbInput = await ask("Min Probability Threshold % (e.g. 70.0) [70.0]: ");
  const min_probability_threshold = parseFloat(minProbInput) || 70.0;
  const notes = await ask("Notes / Rationale: ");

  const { data, error } = await supabase
    .from("oddora_v2_ai_directives")
    .insert([
      {
        rule_name,
        sport,
        market_affected,
        weight_adjustment,
        min_probability_threshold,
        is_active: true,
        notes,
      },
    ])
    .select();

  if (error) {
    console.error("\x1b[31mFailed to insert directive:\x1b[0m", error.message);
  } else {
    console.log("\n\x1b[32m✅ Successfully saved directive to oddora_v2_ai_directives!\x1b[0m");
  }
}

async function toggleDirective() {
  await listDirectives();
  const ruleName = await ask("Enter Rule Name or full/partial ID to toggle: ");
  if (!ruleName.trim()) return;

  const { data, error } = await supabase
    .from("oddora_v2_ai_directives")
    .select("*")
    .or(`rule_name.ilike.%${ruleName}%,id.ilike.%${ruleName}%`);

  if (error || !data || data.length === 0) {
    console.log("\x1b[31mNo matching directive found.\x1b[0m");
    return;
  }

  const target = data[0];
  const newStatus = !target.is_active;

  const { error: updateError } = await supabase
    .from("oddora_v2_ai_directives")
    .update({ is_active: newStatus })
    .eq("id", target.id);

  if (updateError) {
    console.error("\x1b[31mUpdate failed:\x1b[0m", updateError.message);
  } else {
    console.log(
      `\x1b[32m✅ Directive '${target.rule_name}' is now ${newStatus ? "ACTIVE" : "INACTIVE"}.\x1b[0m`
    );
  }
}

async function deleteDirective() {
  await listDirectives();
  const targetInput = await ask("Enter Rule Name or full/partial ID to DELETE: ");
  if (!targetInput.trim()) return;

  const confirm = await ask(`Are you sure you want to permanently delete '${targetInput}'? (y/N): `);
  if (confirm.toLowerCase() !== "y") {
    console.log("Cancelled.");
    return;
  }

  const { error } = await supabase
    .from("oddora_v2_ai_directives")
    .delete()
    .or(`rule_name.ilike.%${targetInput}%,id.ilike.%${targetInput}%`);

  if (error) {
    console.error("\x1b[31mDelete failed:\x1b[0m", error.message);
  } else {
    console.log("\x1b[32m✅ Directive deleted.\x1b[0m");
  }
}

async function calibrateWeight() {
  await listDirectives();
  const targetInput = await ask("Enter Rule Name or ID to adjust weight: ");
  if (!targetInput.trim()) return;

  const { data } = await supabase
    .from("oddora_v2_ai_directives")
    .select("*")
    .or(`rule_name.ilike.%${targetInput}%,id.ilike.%${targetInput}%`);

  if (!data || data.length === 0) {
    console.log("\x1b[31mNo directive found.\x1b[0m");
    return;
  }

  const item = data[0];
  const newWeightStr = await ask(`Current weight is ${item.weight_adjustment}x. New weight (e.g. 1.25): `);
  const newWeight = parseFloat(newWeightStr);
  if (isNaN(newWeight)) return;

  await supabase
    .from("oddora_v2_ai_directives")
    .update({ weight_adjustment: newWeight })
    .eq("id", item.id);

  console.log(`\x1b[32m✅ Weight calibrated to ${newWeight}x.\x1b[0m`);
}

async function mainMenu() {
  while (true) {
    clearScreen();
    console.log("\x1b[1mSELECT ACTION:\x1b[0m");
    console.log("  1. 📋 View All AI Directives");
    console.log("  2. ➕ Add New AI Training Directive");
    console.log("  3. ⚡ Calibrate Directive Weight");
    console.log("  4. 🔄 Toggle Directive Active / Inactive");
    console.log("  5. 🗑️  Delete Directive");
    console.log("  6. 🚪 Exit\n");

    const choice = await ask("Enter choice [1-6]: ");
    if (choice === "1") {
      await listDirectives();
      await ask("Press Enter to return to menu...");
    } else if (choice === "2") {
      await addDirective();
      await ask("Press Enter to return to menu...");
    } else if (choice === "3") {
      await calibrateWeight();
      await ask("Press Enter to return to menu...");
    } else if (choice === "4") {
      await toggleDirective();
      await ask("Press Enter to return to menu...");
    } else if (choice === "5") {
      await deleteDirective();
      await ask("Press Enter to return to menu...");
    } else if (choice === "6") {
      console.log("\nExiting Oddora AI V2 Trainer. Keep winning!\n");
      rl.close();
      process.exit(0);
    }
  }
}

mainMenu().catch((err) => {
  console.error("Fatal error:", err);
  rl.close();
  process.exit(1);
});
