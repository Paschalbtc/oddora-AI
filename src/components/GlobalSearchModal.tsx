"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Layers,
  Clock,
  Plus,
  Check,
  Trophy,
  ExternalLink,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useBetSlip } from "@/context/BetSlipContext";

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any, options?: { sport?: string }) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { isInSlip, toggleLeg } = useBetSlip();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchMatches();
    } else {
      setQuery("");
    }
  }, [isOpen]);

  async function fetchMatches() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/matches-cached?sport=football");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.matches)) {
          setMatches(json.matches);
        }
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  const cleanQ = query.trim().toLowerCase();
  const filtered = cleanQ
    ? matches.filter((m) => {
        const home = (m.home_team || "").toLowerCase();
        const away = (m.away_team || "").toLowerCase();
        const league = (m.league_name || "").toLowerCase();
        return (
          home.includes(cleanQ) ||
          away.includes(cleanQ) ||
          league.includes(cleanQ) ||
          `${home} vs ${away}`.includes(cleanQ)
        );
      })
    : matches.slice(0, 10);

  const handleSelectMatch = (match: any) => {
    onNavigateTab("all_matches");
    onClose();
  };

  const formatTime = (iso?: string) => {
    if (!iso) return "18:00";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "18:00";
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } catch {
      return "18:00";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0E131D] border border-slate-200 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 bg-slate-50 dark:bg-[#121824] border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams, leagues, matches (e.g. Arsenal, Chelsea, Premier League)..."
            className="flex-1 bg-transparent border-none text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
          >
            Esc
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 pb-1">
            <span>{cleanQ ? `Matching Fixtures (${filtered.length})` : "Featured Live Fixtures"}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">SportyBet Odds</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Scanning live matches...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>No matches found for "{query}". Try searching for another team or league.</span>
            </div>
          ) : (
            filtered.map((m: any, idx: number) => {
              const inSlip = isInSlip(m.match_id);
              const sportySelection = m.sportybet_selection || {
                selection: "Home Win",
                market: "1X2",
                odd: 1.55,
              };

              return (
                <div
                  key={m.match_id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div
                    onClick={() => handleSelectMatch(m)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {m.league_name || "League"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(m.scheduled_time || m.kickoff_time)}</span>
                      </span>
                    </div>

                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{m.home_team}</span>
                      <span className="text-slate-400 font-normal">vs</span>
                      <span>{m.away_team}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                        {sportySelection.selection}
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                        @ {sportySelection.odd || "1.50"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleLeg({
                          id: m.match_id || `${m.home_team}_${m.away_team}`,
                          matchId: m.match_id,
                          homeTeam: m.home_team,
                          awayTeam: m.away_team,
                          league: m.league_name,
                          market: sportySelection.market,
                          selection: sportySelection.selection,
                          odd: Number(sportySelection.odd) || 1.5,
                          odds: Number(sportySelection.odd) || 1.5,
                          winProbability: 85,
                          eventId: sportySelection.eventId || m.match_id,
                          sportybetSelection: {
                            eventId: sportySelection.eventId || m.match_id,
                            marketId: sportySelection.marketId || "1",
                            outcomeId: sportySelection.outcomeId || "1",
                            specifier: sportySelection.specifier || null,
                          },
                        })
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        inSlip
                          ? "bg-emerald-500 text-black font-black"
                          : "bg-slate-200 dark:bg-white/10 hover:bg-emerald-500 hover:text-black text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {inSlip ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>In Slip</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-100 dark:bg-[#121824] border-t border-slate-200 dark:border-white/10 px-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>Press ESC or click outside to close</span>
          <button
            type="button"
            onClick={() => {
              onNavigateTab("all_matches");
              onClose();
            }}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
          >
            <span>View All Matches Schedule</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
