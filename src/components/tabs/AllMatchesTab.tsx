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
  Flame,
  Filter,
  ChevronDown,
  Trophy,
  ExternalLink,
  Copy,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UserTier } from "../Navbar";

export interface AllMatchesTabProps {
  currentTier: UserTier;
  onOpenUpgradeModal: () => void;
  onAddToSlip?: (match: any) => void;
}

export type SportFilter =
  | "football"
  | "basketball"
  | "table_tennis"
  | "volleyball"
  | "tennis";

export const AllMatchesTab: React.FC<AllMatchesTabProps> = ({
  currentTier,
  onOpenUpgradeModal,
  onAddToSlip,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedSport, setSelectedSport] = useState<SportFilter>("football");
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>("ALL");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [selectedSport, currentTier, selectedDate]);

  async function fetchMatches() {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/engines/all-matches?date=${selectedDate}&sport=${selectedSport}&tier=${currentTier}`
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
    { id: "table_tennis", label: "Table Tennis", icon: "🏓" },
    { id: "volleyball", label: "Volleyball", icon: "🏐" },
    { id: "tennis", label: "Tennis", icon: "🎾" },
  ];

  // Available leagues in current matches
  const availableLeagues = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches || []) {
      if (m.league) set.add(m.league);
    }
    return Array.from(set).sort();
  }, [matches]);

  // Group matches by league
  const groupedMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = (matches || []).filter((m) => {
      const matchesSearch =
        !q ||
        m.home_team?.toLowerCase().includes(q) ||
        m.away_team?.toLowerCase().includes(q) ||
        m.league?.toLowerCase().includes(q);

      const matchesLeague =
        selectedLeagueFilter === "ALL" || m.league === selectedLeagueFilter;

      return matchesSearch && matchesLeague;
    });

    const groups: Record<string, any[]> = {};
    for (const match of filtered) {
      const leagueName = match.league || "International / Exhibition";
      if (!groups[leagueName]) groups[leagueName] = [];
      groups[leagueName].push(match);
    }

    return groups;
  }, [matches, searchQuery, selectedLeagueFilter]);

  const handleAdd = (m: any) => {
    const key = m.id || m.external_fixture_id;
    setAddedIds((prev) => ({ ...prev, [key]: true }));
    if (onAddToSlip) onAddToSlip(m);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleCopyPrediction = (m: any) => {
    const key = m.id || m.external_fixture_id;
    const text = `${m.home_team} vs ${m.away_team}: ${m.selection_label || m.best_outcome} @ ${Number(
      m.odd_value || 1.45
    ).toFixed(2)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatKickoff = (kickoffTime?: string) => {
    if (!kickoffTime) return "18:00";
    try {
      const d = new Date(kickoffTime);
      if (isNaN(d.getTime())) return "18:00";
      const hours = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");
      return `${hours}:${mins}`;
    } catch {
      return "18:00";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Intro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Synced 5x Daily • Multi-Sport Live Feed
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Auto-Refreshed Every 4.8h • Kickoff Purge Active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Daily All-Matches Master Schedule
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time fixtures analyzed across Football, Basketball, Table Tennis & Volleyball with win probabilities.
          </p>
        </div>

        {/* Tier status chip */}
        <div className="shrink-0">
          <span className="text-xs font-bold text-slate-300 bg-[#11161F] px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-sm">
            {currentTier === "FREE" ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
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

      {/* Date Navigation & Calendar Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#11161F] border border-white/10 shadow-md">
        {/* Quick Date Buttons: Yesterday / Today / Tomorrow */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(yesterdayStr)}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              selectedDate === yesterdayStr
                ? "bg-white/[0.12] text-white border-white/25 shadow-sm font-black"
                : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Yesterday</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              selectedDate === todayStr
                ? "bg-emerald-500 text-black border-emerald-400 shadow-md font-black"
                : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
            }`}
          >
            <span>★ Today</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              selectedDate === tomorrowStr
                ? "bg-white/[0.12] text-white border-white/25 shadow-sm font-black"
                : "bg-white/[0.03] text-slate-400 border-white/5 hover:text-white"
            }`}
          >
            <span>Tomorrow</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Date Picker & Active Date Label */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline text-slate-400">Date:</span>
            <span className="text-white bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
              {selectedDate}
            </span>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="bg-[#070A0E] text-xs font-mono font-bold text-slate-200 border border-white/10 rounded-xl py-1.5 px-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Sport Selector Pills + League Filter + Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#11161F] border border-white/10 shadow-lg">
        {/* Sport Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {sportsList.map((sport) => {
            const isSelected = selectedSport === sport.id;
            return (
              <button
                key={sport.id}
                type="button"
                onClick={() => {
                  setSelectedSport(sport.id);
                  setSelectedLeagueFilter("ALL");
                }}
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

        {/* Search & League Dropdown */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          {/* League Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedLeagueFilter}
              onChange={(e) => setSelectedLeagueFilter(e.target.value)}
              className="bg-[#070A0E] text-xs font-bold text-slate-300 border border-white/10 rounded-xl py-2 px-3 pr-8 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
            >
              <option value="ALL">All Leagues</option>
              {availableLeagues.map((lg) => (
                <option key={lg} value={lg}>
                  {lg}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teams or leagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070A0E] border border-white/10 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* AfriOdds-Style League Table View */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Ingesting multi-sport fixtures & calculating mathematical outcomes...</span>
        </div>
      ) : Object.keys(groupedMatches).length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#11161F] border border-white/10 text-slate-400 text-xs space-y-2">
          <Layers className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="font-bold text-white">No matches found for current filters</p>
          <p className="text-slate-400">Try switching sports or clearing your search filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([leagueName, leagueMatches]) => (
            <div
              key={leagueName}
              className="rounded-2xl bg-[#11161F] border border-white/10 overflow-hidden shadow-xl"
            >
              {/* League Header Banner */}
              <div className="px-4 py-3 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-white tracking-wide">
                    {leagueName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                    • {leagueMatches[0]?.country || "Global"}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
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
                  const isCopied = copiedId === matchKey;
                  const winProb = m.win_probability || 75;

                  return (
                    <div
                      key={matchKey}
                      className="p-3.5 sm:p-4 hover:bg-white/[0.02] transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Kickoff & Teams */}
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        {/* Kickoff pill */}
                        <div className="shrink-0 text-center bg-[#070A0E] px-2.5 py-1.5 rounded-xl border border-white/10 min-w-[58px]">
                          <span
                            suppressHydrationWarning
                            className="text-[11px] font-mono font-bold text-slate-300 block"
                          >
                            {formatKickoff(m.kickoff_time)}
                          </span>
                          <span
                            className={`text-[9px] font-mono uppercase font-black block ${
                              selectedDate < todayStr
                                ? "text-slate-400"
                                : selectedDate === todayStr
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            {selectedDate < todayStr
                              ? "FT"
                              : selectedDate === todayStr
                              ? "TODAY"
                              : "UPCOMING"}
                          </span>
                        </div>

                        {/* Team names & scores */}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-sm flex items-center gap-2 truncate">
                            <span className="truncate">
                              {m.home_team} <span className="text-slate-500 font-normal">vs</span>{" "}
                              {m.away_team}
                            </span>
                            {m.home_score !== null && m.away_score !== null && (
                              <span className="shrink-0 px-2 py-0.5 rounded-lg bg-white/[0.08] text-white font-mono font-black text-xs border border-white/10">
                                {m.home_score} - {m.away_score}
                              </span>
                            )}
                            {m.outcome_result === "WON" && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ✓ WON
                              </span>
                            )}
                            {m.outcome_result === "LOST" && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                ✗ LOST
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                            <span className="uppercase text-emerald-400 font-mono font-bold">
                              {m.sport || selectedSport}
                            </span>
                            {m.is_over25_candidate && (
                              <span className="text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Flame className="w-2.5 h-2.5" />
                                <span>High xG Over 2.5</span>
                              </span>
                            )}
                            {/* Win Confidence Meter */}
                            {!isLocked && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Confidence:</span>
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-400 rounded-full"
                                    style={{ width: `${winProb}%` }}
                                  />
                                </div>
                                <span className="font-mono text-emerald-400 font-bold">
                                  {winProb}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Outcome, Odds & Action */}
                      <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                        {isLocked ? (
                          <button
                            type="button"
                            onClick={onOpenUpgradeModal}
                            className="w-full md:w-auto px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Unlock Prediction (Pro/Premium)</span>
                          </button>
                        ) : (
                          <>
                            {/* AI Chosen Outcome */}
                            <div className="text-left md:text-right">
                              <span className="font-black text-emerald-400 text-xs sm:text-sm font-mono block">
                                {m.selection_label || m.best_outcome}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                                {m.market_name || "Match Winner"}
                              </span>
                            </div>

                            {/* Odd Value */}
                            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 font-mono font-bold text-white text-xs">
                              {m.odd_value ? `@ ${Number(m.odd_value).toFixed(2)}` : "@ 1.45"}
                            </div>

                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => handleCopyPrediction(m)}
                              title="Copy Match Prediction"
                              className="p-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white border border-white/10 transition"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Quick Add to Slip Button (Fully Visible on Mobile & Desktop) */}
                            <button
                              type="button"
                              onClick={() => handleAdd(m)}
                              title="Add to Slip Builder"
                              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 font-bold text-xs shrink-0 ${
                                isAdded
                                  ? "bg-emerald-500 text-black font-black shadow-md"
                                  : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30"
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added!</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to Slip</span>
                                </>
                              )}
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
