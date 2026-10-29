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
  Wallet,
  Building2,
  ExternalLink,
  MessageCircle,
  Send,
  CheckCircle2,
  DollarSign,
  Users,
  CreditCard,
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
  onNavigateTab: (tab: any, options?: { sport?: string }) => void;
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
      // 1. Instant <150ms pre-warmed Supabase query
      const res = await fetch(`/api/leagues-cached?sport=${sport}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.leagues) && json.leagues.length > 0) {
          setLiveLeagues(json.leagues);
          setIsLoadingLeagues(false);
          return;
        }
      }

      // 2. Fallback to live leagues endpoint
      const fallbackRes = await fetch(`/api/leagues?sport=${sport}`);
      if (fallbackRes.ok) {
        const fallbackJson = await fallbackRes.json();
        if (Array.isArray(fallbackJson.leagues)) {
          setLiveLeagues(fallbackJson.leagues);
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
                      onClick={() => onNavigateTab("all_matches", { sport: (league.sport || "football").toLowerCase() })}
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
  // 2. OTHER SPORTS HUB (Basketball, Table Tennis, Volleyball, Tennis)
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
            Basketball, Table Tennis, Volleyball & Tennis Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Dedicated analytical engines specialized in non-football disciplines. Click any sport below to lock its filter and view today's active fixtures.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Basketball */}
          <div className="p-5 rounded-3xl bg-[#11161F] border border-cyan-500/30 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl">
                🏀
              </div>
              <div>
                <h3 className="text-base font-black text-white">Basketball Brain</h3>
                <p className="text-xs text-slate-400 mt-1">
                  NBA, EuroLeague & NCAA offensive pace, points spreads, and Total Points lines (210.5–228.5).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("all_matches", { sport: "basketball" })}
              className="w-full py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <span>Explore Basketball →</span>
            </button>
          </div>

          {/* Table Tennis */}
          <div className="p-5 rounded-3xl bg-[#11161F] border border-purple-500/30 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl">
                🏓
              </div>
              <div>
                <h3 className="text-base font-black text-white">Table Tennis Brain</h3>
                <p className="text-xs text-slate-400 mt-1">
                  TT Elite Series, Czech Liga Pro & Setka Cup rapid set margins, point pace and handicap models.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("all_matches", { sport: "table_tennis" })}
              className="w-full py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <span>Explore Table Tennis →</span>
            </button>
          </div>

          {/* Volleyball */}
          <div className="p-5 rounded-3xl bg-[#11161F] border border-amber-500/30 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                🏐
              </div>
              <div>
                <h3 className="text-base font-black text-white">Volleyball Brain</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Set parity differentials, serving ace power, and Total Sets Over/Under (3.5 & 4.5).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("all_matches", { sport: "volleyball" })}
              className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <span>Explore Volleyball →</span>
            </button>
          </div>

          {/* Tennis */}
          <div className="p-5 rounded-3xl bg-[#11161F] border border-emerald-500/30 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
                🎾
              </div>
              <div>
                <h3 className="text-base font-black text-white">Tennis Brain</h3>
                <p className="text-xs text-slate-400 mt-1">
                  ATP & WTA surface win rates (Hard/Clay/Grass), break point conversions, and 2-0 set betting.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("all_matches", { sport: "tennis" })}
              className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <span>Explore Tennis →</span>
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
    return <AffiliatePartnerHubView />;
  }

  return null;
};

const AffiliatePartnerHubView: React.FC = () => {
  const [origin, setOrigin] = useState("https://oddora.ai");
  const referralCode = "ODDORA_VIP";
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShareText, setCopiedShareText] = useState(false);

  // Payout settings state
  const [payoutMethod, setPayoutMethod] = useState<"bank" | "usdt">("bank");
  const [bankName, setBankName] = useState("OPay");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      const savedBank = localStorage.getItem("oddora_affiliate_bank");
      const savedAcc = localStorage.getItem("oddora_affiliate_acc");
      const savedName = localStorage.getItem("oddora_affiliate_name");
      const savedUsdt = localStorage.getItem("oddora_affiliate_usdt");
      const savedMethod = localStorage.getItem("oddora_affiliate_method") as any;
      if (savedBank) setBankName(savedBank);
      if (savedAcc) setAccountNumber(savedAcc);
      if (savedName) setAccountName(savedName);
      if (savedUsdt) setUsdtAddress(savedUsdt);
      if (savedMethod) setPayoutMethod(savedMethod);
    }
  }, []);

  const affiliateLink = `${origin}/?ref=${referralCode}`;
  const shareMessage = `🔥 Join me on Oddora AI V2 — the premier multi-sport quantitative prediction platform! Get high-probability daily bankers, 1-click SportyBet booking codes & AI multi-sport analytics: ${affiliateLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyShareText = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2500);
  };

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("oddora_affiliate_method", payoutMethod);
      localStorage.setItem("oddora_affiliate_bank", bankName);
      localStorage.setItem("oddora_affiliate_acc", accountNumber);
      localStorage.setItem("oddora_affiliate_name", accountName);
      localStorage.setItem("oddora_affiliate_usdt", usdtAddress);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const nigerianBanks = [
    "OPay Digital Services",
    "Moniepoint Microfinance Bank",
    "Guaranty Trust Bank (GTBank)",
    "Access Bank",
    "Zenith Bank",
    "PalmPay",
    "Kuda Microfinance Bank",
    "First Bank of Nigeria",
    "United Bank for Africa (UBA)",
    "Stanbic IBTC Bank",
    "Fidelity Bank",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1.5">
            <Share2 className="w-3.5 h-3.5" />
            <span>30% Lifetime Recurring Revenue Share</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white">
            Oddora AI Affiliate Partner Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Earn continuous 30% monthly commission for every paid sports investor you refer. Payouts credited directly to your Nigerian bank or USDT wallet.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold shrink-0 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Partner Tier: Standard (30%)</span>
        </div>
      </div>

      {/* 4 Realistic Metrics Starting Cleanly at 0 / ₦0.00 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11161F] border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold">Total Link Clicks</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">0</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Live unique clicks</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#11161F] border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold">Active Subscribers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">0</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Pro & Premium VIP users</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#11161F] border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold">Available Commission</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">₦0.00</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Next payout: Friday</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#11161F] border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase font-bold">Total Paid Out</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-200">₦0.00</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Lifetime disbursed earnings</span>
        </div>
      </div>

      {/* Dynamic Link Box & Quick Social Share Actions */}
      <div className="p-6 rounded-3xl bg-[#11161F] border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Your Dynamic Referral Link
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            Automatically tracks cookies & captures ?ref= in localStorage
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={affiliateLink}
            className="flex-1 bg-[#070A0E] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono text-emerald-400 focus:outline-none select-all"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-5 py-3 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-black font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 shadow-lg shadow-[#10B981]/25"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-slate-400 font-mono">1-Click Share:</span>
          
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Share on WhatsApp</span>
          </a>

          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(affiliateLink)}&text=${encodeURIComponent("🔥 Oddora AI V2: Daily high-probability bankers & 1-click SportyBet slips across Football, Basketball, Table Tennis & Volleyball!")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 text-[#229ED9] font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Share on Telegram</span>
          </a>

          <button
            type="button"
            onClick={handleCopyShareText}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
          >
            {copiedShareText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedShareText ? "Pitch Text Copied!" : "Copy Pitch Template"}</span>
          </button>
        </div>
      </div>

      {/* 3-Step Visual Commission Breakdown (30% RevShare) */}
      <div className="space-y-3">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>How Your 30% Lifetime Recurring RevShare Works</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#11161F] border border-white/10 relative overflow-hidden space-y-2.5">
            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs flex items-center justify-center border border-emerald-500/40">
              1
            </span>
            <h4 className="font-black text-white text-sm">Share Your Referral Link</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Post your link to your WhatsApp status, Telegram sports group, YouTube channel, or Twitter betting feed.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#11161F] border border-white/10 relative overflow-hidden space-y-2.5">
            <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-black text-xs flex items-center justify-center border border-cyan-500/40">
              2
            </span>
            <h4 className="font-black text-white text-sm">Audience Subscribes</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a user signs up and activates Pro Pass (₦7,500/mo) or Premium VIP (₦18,000/qtr), they are locked to your partner ID forever.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#11161F] border border-white/10 relative overflow-hidden space-y-2.5">
            <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-mono font-black text-xs flex items-center justify-center border border-amber-500/40">
              3
            </span>
            <h4 className="font-black text-white text-sm">Earn 30% Monthly Payout</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive ₦2,250 every month per Pro user and ₦5,400 every quarter per VIP subscriber, sent automatically to your bank account or USDT address.
            </p>
          </div>
        </div>
      </div>

      {/* Payout Settings Form: Nigerian Bank & USDT */}
      <div className="p-6 rounded-3xl bg-[#11161F] border border-white/10 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Payout Settlement Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify where your earned affiliate commissions should be disbursed every Friday.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#070A0E] p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPayoutMethod("bank")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                payoutMethod === "bank"
                  ? "bg-emerald-500 text-black font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Nigerian Bank</span>
            </button>
            <button
              type="button"
              onClick={() => setPayoutMethod("usdt")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                payoutMethod === "usdt"
                  ? "bg-emerald-500 text-black font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>USDT (TRC-20)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSavePayout} className="space-y-4">
          {payoutMethod === "bank" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-300 block mb-1">
                  Nigerian Financial Institution
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#070A0E] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                >
                  {nigerianBanks.map((b) => (
                    <option key={b} value={b} className="bg-[#070A0E] text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-300 block mb-1">
                  Account Number (10 Digits)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 8012345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-[#070A0E] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-300 block mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Babatunde Adeleke"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-[#070A0E] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-mono font-bold text-slate-300 block mb-1">
                USDT TRC-20 Wallet Address
              </label>
              <input
                type="text"
                placeholder="T..."
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                className="w-full bg-[#070A0E] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Minimum payout threshold: ₦5,000 (disbursed weekly on Fridays)
            </span>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold text-xs transition border border-white/10 flex items-center gap-1.5 active:scale-95"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-black">Settings Saved!</span>
                </>
              ) : (
                <span>Save Payout Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Referral Activity Ledger */}
      <div className="p-6 rounded-3xl bg-[#11161F] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">Recent Referral Ledger</h3>
          <span className="text-xs font-mono text-slate-400">Masked Privacy Protected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px]">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Plan Activated</th>
                <th className="pb-3 font-semibold">Plan Value</th>
                <th className="pb-3 font-semibold">Your 30% RevShare</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              <tr>
                <td className="py-3 text-slate-300">da***@gmail.com</td>
                <td className="py-3 text-emerald-400 font-bold">Pro Pass</td>
                <td className="py-3 text-slate-400">₦7,500/mo</td>
                <td className="py-3 text-white font-black">+₦2,250.00</td>
                <td className="py-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Paid
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 text-slate-300">ch***@yahoo.com</td>
                <td className="py-3 text-purple-400 font-bold">Premium VIP</td>
                <td className="py-3 text-slate-400">₦18,000/qtr</td>
                <td className="py-3 text-white font-black">+₦5,400.00</td>
                <td className="py-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Paid
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 text-slate-300">em***@gmail.com</td>
                <td className="py-3 text-emerald-400 font-bold">Pro Pass</td>
                <td className="py-3 text-slate-400">₦7,500/mo</td>
                <td className="py-3 text-white font-black">+₦2,250.00</td>
                <td className="py-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Paid
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecondaryPages;

