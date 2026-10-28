"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Search,
  Lock,
  Plus,
  Check,
  Clock,
  ShieldCheck,
  TrendingUp,
  Flame,
  Filter,
} from "lucide-react";
import { UserTier } from "../Navbar";

export interface AllMatchesTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
  onAddToSlip?: (match: any) => void;
}

export type SportFilter = "football" | "basketball" | "volleyball" | "tennis";

export const AllMatchesTab: React.FC<AllMatchesTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
  onAddToSlip,
}) => {
  const [selectedSport, setSelectedSport] = useState<SportFilter>("football");
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMatches();
  }, [selectedSport, currentTier]);

  async function fetchMatches() {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/engines/all-matches?sport=${selectedSport}&tier=${currentTier}`
      );
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) setMatches(json.data);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  const sportsList: Array<{ id: SportFilter; label: string; icon: string }> = [
    { id: "football", label: "Football", icon: "⚽" },
    { id: "basketball", label: "Basketball", icon: "🏀" },
    { id: "volleyball", label: "Volleyball", icon: "🏐" },
    { id: "tennis", label: "Tennis", icon: "🎾" },
  ];

  // Group matches by league
  const groupedMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = (matches || []).filter((m) => {
      if (!q) return true;
      return (
        m.home_team?.toLowerCase().includes(q) ||
        m.away_team?.toLowerCase().includes(q) ||
        m.league?.toLowerCase().includes(q)
      );
    });

    const groups: Record<string, any[]> = {};
    for (const match of filtered) {
      const leagueName = match.league || "International / Exhibition";
      if (!groups[leagueName]) groups[leagueName] = [];
      groups[leagueName].push(match);
    }

    return groups;
  }, [matches, searchQuery]);

  const handleAdd = (m: any) => {
    setAddedIds((prev) => ({ ...prev, [m.id || m.external_fixture_id]: true }));
    if (onAddToSlip) onAddToSlip(m);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [m.id || m.external_fixture_id]: false }));
    }, 2000);
  };

  const formatKickoff = (kickoffTime?: string) => {
    if (!kickoffTime) return "Today";
    try {
      const d = new Date(kickoffTime);
      if (isNaN(d.getTime())) return "Today";
      const hours = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");
      return `${hours}:${mins}`;
    } catch {
      return "Today";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Intro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Sport Outcome Board • Engine 1</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Daily All-Matches Master Schedule
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Cached once daily from multi-sport feeds to strictly conserve API quotas.
          </p>
        </div>

        {/* Tier status chip */}
        <div className="shrink-0">
          <span className="text-xs font-bold text-slate-300 bg-[#11161F] px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
            {currentTier === "FREE" ? (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                <span>3 Free Previews Active</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentTier} • All Outcomes Unlocked</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Sport Selector Pills + Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#11161F] border border-white/10">
        {/* Sport Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {sportsList.map((sport) => {
            const isSelected = selectedSport === sport.id;
            return (
              <button
                key={sport.id}
                type="button"
                onClick={() => setSelectedSport(sport.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? "bg-emerald-500 text-black shadow-md font-black"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span>{sport.icon}</span>
                <span>{sport.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams or leagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070A0E] border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* AfriOdds-Style League Table View */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Ingesting multi-sport fixtures & calculating mathematical outcomes...</span>
        </div>
      ) : Object.keys(groupedMatches).length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#11161F] border border-white/10 text-slate-400 text-xs">
          No matches found for {selectedSport.toUpperCase()}. Click Refresh or check back shortly.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([leagueName, leagueMatches]) => (
            <div
              key={leagueName}
              className="rounded-2xl bg-[#11161F] border border-white/10 overflow-hidden shadow-md"
            >
              {/* League Header Banner */}
              <div className="px-4 py-2.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{leagueName}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {leagueMatches[0]?.country || "Global"}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {leagueMatches.length} Matches
                </span>
              </div>

              {/* Match Rows */}
              <div className="divide-y divide-white/5">
                {leagueMatches.map((m, idx) => {
                  const isLocked =
                    currentTier === "FREE" &&
                    (m.best_outcome.includes("Locked") || !m.is_free_preview);

                  const matchKey = m.id || m.external_fixture_id || `m_${idx}`;
                  const isAdded = !!addedIds[matchKey];

                  return (
                    <div
                      key={matchKey}
                      className="p-3 sm:p-4 hover:bg-white/[0.02] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Kickoff & Teams */}
                      <div className="flex items-center gap-3">
                        <span
                          suppressHydrationWarning
                          className="text-[11px] font-mono text-slate-400 w-12 shrink-0 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatKickoff(m.kickoff_time)}</span>
                        </span>

                        <div>
                          <div className="font-bold text-white text-sm">
                            {m.home_team} <span className="text-slate-500 font-normal">vs</span>{" "}
                            {m.away_team}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <span className="uppercase text-emerald-400/80 font-mono">
                              {m.sport}
                            </span>
                            {m.is_over25_candidate && (
                              <span className="text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.2 rounded">
                                🔥 Over 2.5 Candidate
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Outcome, Odds, Win Rate & Add to Slip */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {isLocked ? (
                          <button
                            type="button"
                            onClick={onOpenUpgradeModal}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Subscribe to Pro/Premium</span>
                          </button>
                        ) : (
                          <>
                            {/* AI Chosen Outcome */}
                            <div className="text-right">
                              <span className="font-black text-emerald-400 text-xs sm:text-sm font-mono block">
                                {m.selection_label || m.best_outcome}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {m.market_name}
                              </span>
                            </div>

                            {/* Odd Value */}
                            <div className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono font-bold text-white text-xs">
                              {m.odd_value ? `@ ${Number(m.odd_value).toFixed(2)}` : "1.45"}
                            </div>

                            {/* Win Rate Badge */}
                            <span className="text-[10.5px] font-mono font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {m.win_probability}% Win Rate
                            </span>

                            {/* Quick Add to Slip Button */}
                            <button
                              type="button"
                              onClick={() => handleAdd(m)}
                              title="Add to Custom Slip"
                              className={`p-1.5 rounded-xl transition ${
                                isAdded
                                  ? "bg-emerald-500 text-black"
                                  : "bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllMatchesTab;

