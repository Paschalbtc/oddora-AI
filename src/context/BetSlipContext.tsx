"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { resolveSportyBetMarket } from "@/lib/highProbabilityOutcomes";
import { saveUserTicket } from "@/lib/userTicketTracker";
import { useAuth } from "./AuthContext";

export interface CartLeg {
  id: string; // unique identifier: matchId or matchId_market_selection
  matchId?: string;
  eventId?: string;
  homeTeam: string;
  awayTeam: string;
  league?: string;
  country?: string;
  sport?: string;
  market: string;
  marketCategory?: string;
  selection: string;
  odd?: number;
  odds?: number;
  winProbability?: number;
  kickoffTime?: string;
  sportybetSelection?: {
    eventId: string;
    marketId: string;
    outcomeId: string;
    specifier?: string | null;
  };
}

export interface BookedTicketResponse {
  bookmaker: "SportyBet";
  bookingCode: string;
  sportyCode?: string;
  shareUrl?: string;
  totalOdds: number;
  legsCount: number;
}

interface BetSlipContextType {
  legs: CartLeg[];
  totalOdds: number;
  stake: number;
  setStake: (stake: number) => void;
  potentialWin: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  addLeg: (leg: CartLeg) => void;
  addLegs: (legs: CartLeg[]) => void;
  removeLeg: (id: string) => void;
  toggleLeg: (leg: CartLeg) => void;
  isInSlip: (matchId: string, selection?: string) => boolean;
  clearSlip: () => void;
  isBooking: boolean;
  bookedTicket: BookedTicketResponse | null;
  bookingError: string | null;
  bookSlip: (bookmaker?: "SportyBet") => Promise<BookedTicketResponse | null>;
  resetBookingState: () => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

const STORAGE_KEY = "oddora_betslip_cart_v2";

function normalizeTeamName(t: string = ""): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isDuplicateLeg(a: CartLeg, b: CartLeg): boolean {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  if (a.matchId && b.matchId && a.matchId === b.matchId) return true;
  if (a.eventId && b.eventId && a.eventId === b.eventId) return true;
  if (a.sportybetSelection?.eventId && b.sportybetSelection?.eventId && a.sportybetSelection.eventId === b.sportybetSelection.eventId) return true;
  if (a.eventId && b.sportybetSelection?.eventId && a.eventId === b.sportybetSelection.eventId) return true;
  if (a.sportybetSelection?.eventId && b.eventId && a.sportybetSelection.eventId === b.eventId) return true;
  if (a.matchId && b.eventId && a.matchId === b.eventId) return true;
  if (a.eventId && b.matchId && a.eventId === b.matchId) return true;

  // Compare event ID numeric digits (e.g. sr:match:12345 vs 12345)
  const aDigits = String(a.eventId || a.matchId || a.id || "").replace(/\D/g, "");
  const bDigits = String(b.eventId || b.matchId || b.id || "").replace(/\D/g, "");
  if (aDigits && bDigits && aDigits.length >= 5 && aDigits === bDigits) return true;

  if (a.homeTeam && a.awayTeam && b.homeTeam && b.awayTeam) {
    const aNorm = `${normalizeTeamName(a.homeTeam)}_vs_${normalizeTeamName(a.awayTeam)}`;
    const bNorm = `${normalizeTeamName(b.homeTeam)}_vs_${normalizeTeamName(b.awayTeam)}`;
    if (aNorm.length > 5 && aNorm === bNorm) return true;
  }
  return false;
}

export const BetSlipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let authUser: any = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch {}

  const [legs, setLegs] = useState<CartLeg[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState<number>(1000);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedTicket, setBookedTicket] = useState<BookedTicketResponse | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Cross-Device Draft Hydration: If local cart is empty, hydrate from Supabase cloud
  const hasHydratedFromCloud = useRef(false);
  useEffect(() => {
    if (authUser?.id && !hasHydratedFromCloud.current) {
      hasHydratedFromCloud.current = true;
      fetch(`/api/tickets?user_id=${authUser.id}&email=${encodeURIComponent(authUser.email || "")}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "success" && Array.isArray(data.draftSlip) && data.draftSlip.length > 0) {
            setLegs((prev) => {
              if (prev.length === 0) {
                return data.draftSlip;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }
  }, [authUser?.id, authUser?.email]);

  // Cross-Device Draft Sync: Debounce-save draft slip to Supabase cloud whenever legs change
  useEffect(() => {
    if (!authUser?.id) return;
    const timer = setTimeout(() => {
      fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_draft",
          userId: authUser.id,
          legs,
        }),
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [legs, authUser?.id]);

  // Restore cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Deduplicate restored legs
          const uniqueRestored: CartLeg[] = [];
          for (const item of parsed) {
            if (!uniqueRestored.some((existing) => isDuplicateLeg(existing, item))) {
              uniqueRestored.push(item);
            }
          }
          setLegs(uniqueRestored);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legs));
    } catch {
      // Ignore localStorage errors
    }
  }, [legs]);

  // Dynamically compute accumulated total odds
  const totalOdds = useMemo(() => {
    if (legs.length === 0) return 1.0;
    const multiplied = legs.reduce(
      (acc, leg) => acc * (Number(leg.odd || leg.odds) || 1.0),
      1.0
    );
    return Math.round(multiplied * 100) / 100;
  }, [legs]);

  const potentialWin = useMemo(() => {
    return Math.round(stake * totalOdds);
  }, [stake, totalOdds]);

  const addLeg = (leg: CartLeg) => {
    const rawEvId = leg.sportybetSelection?.eventId || leg.eventId || leg.matchId || leg.id;
    const cleanEvId = String(rawEvId || "").trim();

    // Enforce exact SportyBet IDs resolution on manual additions
    let sportySel = leg.sportybetSelection;
    if (!sportySel?.marketId || !sportySel?.outcomeId) {
      const resolved = resolveSportyBetMarket(leg.selection, leg, leg.market);
      sportySel = {
        eventId: cleanEvId,
        marketId: resolved.sportybetSelection.marketId,
        outcomeId: resolved.sportybetSelection.outcomeId,
        specifier: resolved.sportybetSelection.specifier || null,
      };
    }

    const targetKey = cleanEvId || leg.matchId || leg.id;
    const normalizedLeg: CartLeg = {
      ...leg,
      id: targetKey,
      matchId: targetKey,
      eventId: cleanEvId || leg.eventId,
      odd: Number(leg.odd || leg.odds) || 1.45,
      sportybetSelection: sportySel,
    };

    setLegs((prev) => {
      // 1-leg-per-match: Deduplicate and replace any existing leg on the exact same match
      const filtered = prev.filter((l) => !isDuplicateLeg(l, normalizedLeg));
      return [...filtered, normalizedLeg];
    });
    setBookedTicket(null);
    setBookingError(null);
  };

  const addLegs = (newLegs: CartLeg[]) => {
    setLegs((prev) => {
      let current = [...prev];
      for (const leg of newLegs) {
        const rawEvId = leg.sportybetSelection?.eventId || leg.eventId || leg.matchId || leg.id;
        const cleanEvId = String(rawEvId || "").trim();

        let sportySel = leg.sportybetSelection;
        if (!sportySel?.marketId || !sportySel?.outcomeId) {
          const resolved = resolveSportyBetMarket(leg.selection, leg, leg.market);
          sportySel = {
            eventId: cleanEvId,
            marketId: resolved.sportybetSelection.marketId,
            outcomeId: resolved.sportybetSelection.outcomeId,
            specifier: resolved.sportybetSelection.specifier || null,
          };
        }

        const targetKey = cleanEvId || leg.matchId || leg.id;
        const normalizedLeg: CartLeg = {
          ...leg,
          id: targetKey,
          matchId: targetKey,
          eventId: cleanEvId || leg.eventId,
          odd: Number(leg.odd || leg.odds) || 1.45,
          sportybetSelection: sportySel,
        };
        current = current.filter((l) => !isDuplicateLeg(l, normalizedLeg));
        current.push(normalizedLeg);
      }
      return current;
    });
    setBookedTicket(null);
    setBookingError(null);
  };

  const removeLeg = (id: string) => {
    setLegs((prev) =>
      prev.filter(
        (l) => l.id !== id && l.matchId !== id && l.eventId !== id && l.sportybetSelection?.eventId !== id
      )
    );
    setBookedTicket(null);
    setBookingError(null);
  };

  const toggleLeg = (leg: CartLeg) => {
    const existing = legs.find((l) => isDuplicateLeg(l, leg));
    if (existing) {
      if (existing.selection === leg.selection) {
        // Same outcome tapped again: toggle off
        removeLeg(existing.id);
      } else {
        // Conflicting outcome tapped on the same match: update choice (enforcing 1 leg per match)
        addLeg(leg);
      }
    } else {
      addLeg(leg);
    }
  };

  const isInSlip = (matchId: string, selection?: string): boolean => {
    if (!matchId) return false;
    return legs.some(
      (l) =>
        ((l.matchId || l.eventId || l.id) === matchId || l.id === matchId || l.sportybetSelection?.eventId === matchId) &&
        (!selection || l.selection === selection)
    );
  };

  const clearSlip = () => {
    setLegs([]);
    setBookedTicket(null);
    setBookingError(null);
  };

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const resetBookingState = () => {
    setBookedTicket(null);
    setBookingError(null);
  };

  // Instant booking bridge integration strictly with SportyBet
  const bookSlip = async (bookmaker: "SportyBet" = "SportyBet"): Promise<BookedTicketResponse | null> => {
    if (legs.length === 0) {
      setBookingError("Please add at least 1 match to book your slip.");
      return null;
    }

    setIsBooking(true);
    setBookingError(null);
    setBookedTicket(null);

    try {
      // Deduplicate selections before sending to /api/bookmaker
      const seenEvents = new Set<string>();
      const seenMatches = new Set<string>();
      const uniqueLegs: CartLeg[] = [];

      for (const leg of legs) {
        const cleanEvId = String(leg.sportybetSelection?.eventId || leg.eventId || leg.matchId || leg.id || "").trim();
        const matchKey = `${normalizeTeamName(leg.homeTeam)}_vs_${normalizeTeamName(leg.awayTeam)}`;

        if (cleanEvId && seenEvents.has(cleanEvId)) continue;
        if (matchKey && matchKey.length > 5 && seenMatches.has(matchKey)) continue;

        if (cleanEvId) seenEvents.add(cleanEvId);
        if (matchKey && matchKey.length > 5) seenMatches.add(matchKey);
        uniqueLegs.push(leg);
      }

      if (uniqueLegs.length === 0) {
        setBookingError("Please add at least 1 valid unique match to book your slip.");
        return null;
      }

      // Format selections for /api/bookmaker
      const selectionsPayload = uniqueLegs.map((leg) => {
        const rawEvId = leg.sportybetSelection?.eventId || leg.eventId || leg.matchId || leg.id;
        const cleanEvId = rawEvId
          ? String(rawEvId).startsWith("sr:match:")
            ? String(rawEvId)
            : `sr:match:${String(rawEvId).replace(/\D/g, "") || rawEvId}`
          : undefined;

        // Resolve exact SportyBet market IDs using unified 26-market resolver
        const resolved = resolveSportyBetMarket(leg.selection, leg, leg.market);
        const marketId = leg.sportybetSelection?.marketId || resolved.sportybetSelection.marketId;
        const outcomeId = leg.sportybetSelection?.outcomeId || resolved.sportybetSelection.outcomeId;
        let specifier = leg.sportybetSelection?.specifier ?? resolved.sportybetSelection.specifier ?? null;

        const selLower = String(leg.selection || "").toLowerCase();
        if (marketId === "18" || selLower.includes("over") || selLower.includes("under")) {
          let line = "1.5";
          if (selLower.includes("0.5")) line = "0.5";
          else if (selLower.includes("2.5")) line = "2.5";
          else if (selLower.includes("3.5")) line = "3.5";
          else if (selLower.includes("4.5")) line = "4.5";
          else if (specifier && specifier.includes("total=")) {
            const m = specifier.match(/total=([0-9.]+)/);
            if (m) line = m[1];
          }
          specifier = `total=${line}`;
        }

        return {
          eventId: cleanEvId,
          marketId,
          outcomeId,
          specifier,
          home_team: leg.homeTeam,
          away_team: leg.awayTeam,
          league: leg.league || "Global League",
          market: resolved.marketCategory || leg.market,
          selection: leg.selection,
          odd: Number(leg.odd || leg.odds) || 1.45,
          sport: leg.sport || "football",
        };
      });

      const res = await fetch("/api/bookmaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action: "generate",
          bookmaker: "SportyBet",
          selections: selectionsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error" || data.success === false) {
        throw new Error(data.message || "Failed to book slip on SportyBet");
      }

      const rawCode =
        data?.sportybet_code ||
        data?.sportybetCode ||
        data?.bookingCode ||
        data?.shareCode ||
        data?.code ||
        data?.sporty_code ||
        data?.booking_code ||
        data?.sportyCode ||
        "";
      const code = typeof rawCode === "string" ? rawCode.trim() : "";

      if (!code || code.length < 4) {
        throw new Error("SportyBet returned no booking code. Please try again.");
      }

      // Sync legs in BetSlipContext without dropping user selections
      if (Array.isArray(data.legs) && data.legs.length > 0) {
        setLegs((prev) => {
          if (data.legs.length >= prev.length) {
            return data.legs.map((l: any, i: number) => ({
              id: prev[i]?.id || l.eventId || `leg_${i}`,
              matchId: l.match_id || prev[i]?.matchId,
              eventId: l.eventId || prev[i]?.eventId,
              homeTeam: l.home_team || prev[i]?.homeTeam || "Home",
              awayTeam: l.away_team || prev[i]?.awayTeam || "Away",
              league: l.league || prev[i]?.league,
              sport: l.sport || prev[i]?.sport,
              market: l.market || prev[i]?.market,
              marketCategory: l.marketCategory || prev[i]?.marketCategory,
              selection: l.selection || prev[i]?.selection,
              odd: Number(l.odd) || prev[i]?.odd || 1.35,
              odds: Number(l.odd) || prev[i]?.odds || 1.35,
              winProbability: Number(l.win_probability) || prev[i]?.winProbability || 80,
              sportybetSelection: {
                eventId: l.eventId,
                marketId: l.marketId,
                outcomeId: l.outcomeId,
                specifier: l.specifier || null,
              },
            }));
          }
          return prev;
        });
      }

      const url =
        data?.share_url ||
        data?.sporty_url ||
        data?.shareUrl ||
        data?.sportyUrl ||
        `https://www.sportybet.com/ng/?shareCode=${code}`;

      const result: BookedTicketResponse = {
        bookmaker: "SportyBet",
        bookingCode: code,
        sportyCode: code,
        shareUrl: url,
        totalOdds: data.actual_odds || totalOdds,
        legsCount: data.legs_count || uniqueLegs.length,
      };

      // Auto-save user ticket to Supabase cloud and local tracker
      try {
        saveUserTicket({
          booking_code: code,
          share_code: code,
          total_odds: result.totalOdds,
          title: `Custom Bet Slip (${uniqueLegs.length} Matches)`,
          legs: uniqueLegs.map((l) => ({
            match: `${l.homeTeam} vs ${l.awayTeam}`,
            home_team: l.homeTeam,
            away_team: l.awayTeam,
            league: l.league,
            market: l.market,
            selection: l.selection,
            odd: Number(l.odd || l.odds) || 1.35,
            win_probability: Number(l.winProbability) || 80,
            eventId: l.eventId || l.matchId,
          })),
          source: "FLOATING_SLIP",
          user_id: authUser?.id,
          user_email: authUser?.email,
        });
      } catch (saveErr) {
        console.warn("BetSlip booking auto-save notice:", saveErr);
      }

      setBookedTicket(result);
      return result;
    } catch (err: any) {
      console.error("BetSlipContext booking error:", err);
      const msg = err?.message || "Failed to book slip on SportyBet. Some selections may be closed or suspended.";
      setBookingError(msg);
      setBookedTicket(null);
      return null;
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <BetSlipContext.Provider
      value={{
        legs,
        totalOdds,
        stake,
        setStake,
        potentialWin,
        isOpen,
        setIsOpen,
        toggleOpen,
        addLeg,
        addLegs,
        removeLeg,
        toggleLeg,
        isInSlip,
        clearSlip,
        isBooking,
        bookedTicket,
        bookingError,
        bookSlip,
        resetBookingState,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  );
};

export const useBetSlip = (): BetSlipContextType => {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error("useBetSlip must be used within a BetSlipProvider");
  }
  return context;
};
