"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Dumbbell,
  BookOpen,
  HelpCircle,
  Crown,
  Share2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
  Copy,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { UserTier } from "../Navbar";

export interface SecondaryPagesProps {
  viewId:
    | "leagues"
    | "other_sports"
    | "market_guide"
    | "how_it_works"
    | "pricing"
    | "affiliates";
  currentTier: UserTier;
  onNavigateTab: (tab: any) => void;
  onSelectTier: (tier: UserTier) => void;
}

export const SecondaryPages: React.FC<SecondaryPagesProps> = ({
  viewId,
  currentTier,
  onNavigateTab,
  onSelectTier,
}) => {
  // Live Leagues State for viewId === "leagues"
  const [liveLeagues, setLiveLeagues] = useState<any[]>([]);
  const [leagueSport, setLeagueSport] = useState<string>("all");
  const [isLoadingLeagues, setIsLoadingLeagues] = useState<boolean>(true);
  const [expandedLeagues, setExpandedLeagues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (viewId === "leagues") {
      fetchLeagues(leagueSport);
    }
  }, [viewId, leagueSport]);

  async function fetchLeagues(sport: string) {
    setIsLoadingLeagues(true);
    try {
      const res = await fetch(`/api/leagues?sport=${sport}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.leagues)) {
          setLiveLeagues(json.leagues);
        }
      }
    } catch (e) {
      console.warn("Failed to load today leagues:", e);
    } finally {
      setIsLoadingLeagues(false);
    }
  }

  const toggleLeagueExpand = (id: string) => {
    setExpandedLeagues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatLeagueTime = (iso?: string) => {
    if (!iso) return "18:00";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "18:00";
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } catch {
      return "18:00";
    }
  };

  // =========================================================================
  // 1. TODAY'S LEAGUES VIEW (Fixtures WITHOUT Outcomes -> Routes to All Matches)
  // =========================================================================
  if (viewId === "leagues") {
    const displayLeagues = liveLeagues;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Synced 5x Daily • Multi-Sport Live Feed
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {displayLeagues.length} Active Competitions Today
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Today's Scheduled Leagues & Fixtures
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Browse full schedules and kickoff times. Click any league to inspect calculated AI probabilities in All Matches.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("all_matches")}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20"
          >
            <span>View All AI Outcomes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sport Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "All Sports", icon: "🌐" },
            { id: "football", label: "Football", icon: "⚽" },
            { id: "basketball", label: "Basketball", icon: "🏀" },
            { id: "table_tennis", label: "Table Tennis", icon: "🏓" },
            { id: "volleyball", label: "Volleyball", icon: "🏐" },
          ].map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => setLeagueSport(sp.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border whitespace-nowrap ${
                leagueSport === sp.id
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
              }`}
            >
              <span>{sp.icon}</span>
              <span>{sp.label}</span>
            </button>
          ))}
        </div>

        {/* Leagues Grid */}
        {isLoadingLeagues ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">
            Loading today's live league fixtures across all 4 sports...
          </div>
        ) : displayLeagues.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#11161F] border border-white/10 text-slate-400 text-xs space-y-2">
            <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="font-bold text-white">No active matches remaining for this sport today</p>
            <p className="text-slate-400">All games for this category have concluded. Check All Matches or try another sport filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayLeagues.map((league) => {
              const isExpanded = !!expandedLeagues[league.id || league.league_name];
              const matches = league.matches || [];
              const sportTag = (league.sport || "FOOTBALL").toUpperCase();

              return (
                <div
                  key={league.id || league.league_name}
                  className="p-5 rounded-2xl bg-[#11161F] border border-white/10 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-white text-base">{league.league_name}</h3>
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-white/5 text-slate-300 border border-white/10">
                          {sportTag === "TABLE_TENNIS" ? "🏓 Table Tennis" : sportTag === "BASKETBALL" ? "🏀 Basketball" : sportTag === "VOLLEYBALL" ? "🏐 Volleyball" : "⚽ Football"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-slate-400">{league.country}</span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          • {matches.length} {matches.length === 1 ? "Match" : "Matches"} Scheduled
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab("all_matches")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Match list WITHOUT outcomes (Preserving Pure Schedule Integrity) */}
                  <div className="space-y-2">
                    {matches.slice(0, isExpanded ? matches.length : 3).map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs hover:bg-white/[0.05] transition"
                      >
                        <div className="font-semibold text-white truncate max-w-[220px] sm:max-w-[280px]">
                          {m.home_team || m.home} <span className="text-slate-500 font-normal">vs</span> {m.away_team || m.away}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-slate-400 shrink-0">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatLeagueTime(m.kickoff_time || m.time)}</span>
                        </div>
                      </div>
                    ))}

                    {matches.length > 3 && (
                      <button
                        type="button"
                        onClick={() => toggleLeagueExpand(league.id || league.league_name)}
                        className="w-full py-1.5 text-center text-[11px] font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1 transition rounded-lg hover:bg-white/[0.03]"
                      >
                        {isExpanded ? (
                          <>
                            <span>Show Less</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <span>+{matches.length - 3} More Scheduled Matches</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. OTHER SPORTS HUB (Basketball, Volleyball, Tennis)
  // =========================================================================
  if (viewId === "other_sports") {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Multi-Sport Intelligence Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Basketball, Volleyball & Tennis Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Dedicated analytical engines specialized in non-football disciplines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Basketball */}
          <div className="p-6 rounded-3xl bg-[#11161F] border border-cyan-500/30 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl">
              🏀
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Basketball Brain</h3>
              <p className="text-xs text-slate-400 mt-1">
                Analyzes NBA & EuroLeague offensive pace, points spreads, and Total Points lines (210.5–228.5).
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("all_matches")}
              className="w-full py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold text-xs transition"
            >
              Explore Basketball Matches →
            </button>
          </div>

          {/* Volleyball */}
          <div className="p-6 rounded-3xl bg-[#11161F] border border-amber-500/30 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
              🏐
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Volleyball Brain</h3>
              <p className="text-xs text-slate-400 mt-1">
                Models set parity differentials, serving ace rates, and Total Sets Over/Under (3.5 & 4.5).
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("all_matches")}
              className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs transition"
            >
              Explore Volleyball Matches →
            </button>
          </div>

          {/* Tennis */}
          <div className="p-6 rounded-3xl bg-[#11161F] border border-emerald-500/30 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
              🎾
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Tennis Brain</h3>
              <p className="text-xs text-slate-400 mt-1">
                Evaluates surface win percentages (Hard/Clay/Grass), hold efficiency, and 2-0 / 2-1 set betting.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("all_matches")}
              className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs transition"
            >
              Explore Tennis Matches →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. MARKET EXPLANATION GUIDE VIEW
  // =========================================================================
  if (viewId === "market_guide") {
    const marketEntries = [
      {
        sport: "⚽ Football",
        markets: [
          { name: "1X2 (Match Winner)", exp: "1 = Home Win, X = Draw, 2 = Away Win. The classic straight result market." },
          { name: "Double Chance (1X / X2 / 12)", exp: "1X = Home or Draw, X2 = Draw or Away, 12 = Either team wins. Covers 2 of 3 outcomes for maximum safety." },
          { name: "Over 1.5 Goals", exp: "Match must have 2 or more total goals by both teams combined (e.g. 1-1, 2-0, 3-1)." },
          { name: "Over 2.5 Goals", exp: "Match must produce 3 or more total goals (e.g. 2-1, 3-0, 2-2). Flagged when combined xG > 2.85." },
          { name: "Both Teams To Score (BTTS / GG)", exp: "Both teams must score at least 1 goal (e.g. 1-1, 2-1, 3-2)." },
          { name: "Under 3.5 Goals", exp: "Total goals in the match must not exceed 3 (0-0, 1-0, 1-1, 2-0, 2-1, 3-0 are winning scores)." },
        ],
      },
      {
        sport: "🏀 Basketball",
        markets: [
          { name: "Moneyline (1/2)", exp: "Straight match winner including overtime. No draws." },
          { name: "Point Spread (Handicap)", exp: "Favorite must win by more than the spread (e.g. -4.5 pts), or underdog must lose by fewer or win." },
          { name: "Total Points Over/Under", exp: "Combined points scored by both teams (e.g. Over 218.5 means 219 or more points)." },
          { name: "1st Quarter Winner", exp: "Which team will lead after the first 12 minutes of play." },
        ],
      },
      {
        sport: "🏐 Volleyball",
        markets: [
          { name: "Match Winner (1/2)", exp: "Which team wins the match (first to win 3 sets)." },
          { name: "Total Sets (Over/Under 3.5)", exp: "Over 3.5 means the match requires at least 4 sets (e.g. 3-1 or 3-2). Under 3.5 means a 3-0 straight sweep." },
          { name: "Set 1 Winner", exp: "Winner of the opening set (first to 25 pts with 2-pt advantage)." },
        ],
      },
      {
        sport: "🎾 Tennis",
        markets: [
          { name: "Match Winner", exp: "Which player advances to the next round." },
          { name: "Set Betting (2-0 / 2-1)", exp: "Exact set scoreline in best-of-3 format." },
          { name: "Total Games Over/Under 21.5", exp: "Combined games played across all sets (e.g. 6-4, 7-6 = 23 games = Over)." },
        ],
      },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Encyclopedia of Outcomes</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Bet Market Explanation Guide
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Clear definitions of all betting markets calculated by our 4 analytical brains.
          </p>
        </div>

        <div className="space-y-6">
          {marketEntries.map((section) => (
            <div
              key={section.sport}
              className="p-5 sm:p-6 rounded-3xl bg-[#11161F] border border-white/10 shadow-lg space-y-4"
            >
              <h3 className="text-base font-black text-white border-b border-white/10 pb-2.5">
                {section.sport}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.markets.map((m) => (
                  <div
                    key={m.name}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1"
                  >
                    <div className="font-bold text-emerald-400 text-xs">{m.name}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{m.exp}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. HOW IT WORKS VIEW
  // =========================================================================
  if (viewId === "how_it_works") {
    const steps = [
      {
        num: "01",
        title: "Morning Schedule Pull (12:00 AM Daily)",
        desc: "Engine 1 pulls the day's fixtures across Football, Basketball, Volleyball, and Tennis once daily, caching them to preserve the strict 100/day API quota.",
      },
      {
        num: "02",
        title: "4 Sport-Specific Analytical Brains",
        desc: "Each sport is evaluated by its dedicated quantitative model (xG, pace, set ratios, hold rates) reading active directives from our Supabase tables.",
      },
      {
        num: "03",
        title: "Automated Booking Bridge",
        desc: "Engine 2 compiles daily tickets (Banker 2x up to Mega 200x plus Over 2.5 Goals) and books official SportyBet & Bet9ja codes via direct API bridge.",
      },
      {
        num: "04",
        title: "Custom Builder & 4-Mode Editor",
        desc: "Engine 3 solves custom target odds and match counts, while Engine 4 allows splitting long tickets or stripping out low-probability legs.",
      },
      {
        num: "05",
        title: "Verified Results Calculator",
        desc: "Grades finished fixtures against real-world scores, updating genuine Bankers and Free Tips win-rates daily on our results bar.",
      },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Platform Onboarding</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            How Oddora AI V2 Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A transparent walkthrough of our quantitative sports intelligence architecture.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="p-5 rounded-2xl bg-[#11161F] border border-white/10 flex items-start gap-4 shadow-md"
            >
              <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-black text-sm flex items-center justify-center shrink-0">
                {s.num}
              </span>
              <div>
                <h3 className="font-bold text-white text-base">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. 3-TIER PRICING PLANS VIEW (Free, Pro, Premium + 1-Click Tester)
  // =========================================================================
  if (viewId === "pricing") {
    const plans: Array<{
      id: UserTier;
      name: string;
      price: string;
      period: string;
      desc: string;
      features: string[];
      highlight?: boolean;
    }> = [
      {
        id: "FREE",
        name: "Free Tier",
        price: "₦0",
        period: "Free Forever",
        desc: "Essential access to daily banker tips and basic match predictions.",
        features: [
          "2.00 Odds Daily Banker (Fully Unlocked)",
          "3 Free Match Outcomes Per Sport Daily",
          "Standard Bet Markets (1X2, DC, Over 1.5)",
          "Slip Builder up to 5.00 Odds",
          "Access to AI Copilot (Standard Mode)",
        ],
      },
      {
        id: "PRO",
        name: "Pro Pass",
        price: "₦7,500",
        period: "per month",
        desc: "Unrestricted access to all multi-sport matches and advanced daily slips.",
        features: [
          "Unlock 100% of All Match Outcomes (4 Sports)",
          "Daily 3x, 4x, 10x, and 50x Auto-Booked Accumulators",
          "Daily Over 2.5 Goals Special Ticket (7 High xG Games)",
          "4-Mode Edit Game Engine & Ticket Splitting",
          "All Quantitative Bet Markets (BTTS, Over 2.5, Points O/U)",
          "Custom Multiplier Solver up to 100x",
        ],
        highlight: true,
      },
      {
        id: "PREMIUM",
        name: "Premium VIP",
        price: "₦18,000",
        period: "per quarter",
        desc: "Full VIP suite for serious sports investors and high-multiplier accumulators.",
        features: [
          "All Pro Features Included",
          "Daily 100x & 200x Mega Jackpot Slips",
          "Custom Multiplier Solver up to 20,000x",
          "Priority Ticket Splitting (Up to 5 Tickets)",
          "Full AI Copilot Quantitative Studio Access",
          "Dedicated VIP Support & Real-Time Alerts",
        ],
      },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            <Crown className="w-3.5 h-3.5" />
            <span>Oddora Subscriptions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Choose Your Analytical Tier
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Switch plans below to instantly test and experience tier capabilities across all views.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {plans.map((p) => {
            const isCurrent = currentTier === p.id;
            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl bg-[#11161F] border flex flex-col justify-between transition-all ${
                  p.highlight
                    ? "border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/30"
                    : "border-white/10"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-black text-white text-lg">{p.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white font-mono">{p.price}</span>
                    <span className="text-xs text-slate-400">/{p.period}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">{p.desc}</p>

                  <div className="mt-6 space-y-2.5">
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => onSelectTier(p.id)}
                    className={`w-full py-3 rounded-xl font-black text-xs transition active:scale-95 ${
                      isCurrent
                        ? "bg-white/[0.08] text-white border border-white/20 cursor-default"
                        : p.highlight
                        ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {isCurrent ? "✓ Currently Active" : `Activate ${p.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. AFFILIATE HUB VIEW (30% Recurring Commission)
  // =========================================================================
  if (viewId === "affiliates") {
    const affiliateLink = "https://oddora.ai/?ref=VIP_PREDICTOR";

    return (
      <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Share2 className="w-3.5 h-3.5" />
            <span>30% Recurring Partner Program</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Oddora AI Affiliate Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Earn 30% lifetime monthly recurring revenue for every paid subscriber you introduce to Oddora AI.
          </p>
        </div>

        {/* Link Box */}
        <div className="p-6 rounded-3xl bg-[#11161F] border border-white/10 space-y-4 shadow-xl">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
            Your Unique Referral Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={affiliateLink}
              className="flex-1 bg-[#070A0E] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono text-emerald-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(affiliateLink)}
              className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        {/* Commission Calculator Matrix */}
        <div className="p-6 rounded-3xl bg-[#11161F] border border-white/10 space-y-4">
          <h3 className="text-base font-black text-white">Projected Monthly Earnings (30% RevShare)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="text-xs text-slate-400 font-mono block">10 Active Pro Users</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">₦22,500/mo</span>
              <span className="text-[10px] text-slate-500">₦270,000 / year</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="text-xs text-slate-400 font-mono block">50 Active Pro Users</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">₦112,500/mo</span>
              <span className="text-[10px] text-slate-500">₦1,350,000 / year</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="text-xs text-slate-400 font-mono block">100 Active Pro Users</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">₦225,000/mo</span>
              <span className="text-[10px] text-slate-500">₦2,700,000 / year</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SecondaryPages;

