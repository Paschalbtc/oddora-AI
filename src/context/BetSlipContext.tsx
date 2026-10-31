"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

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

  if (a.homeTeam && a.awayTeam && b.homeTeam && b.awayTeam) {
    const aNorm = `${normalizeTeamName(a.homeTeam)}_vs_${normalizeTeamName(a.awayTeam)}`;
    const bNorm = `${normalizeTeamName(b.homeTeam)}_vs_${normalizeTeamName(b.awayTeam)}`;
    if (aNorm.length > 5 && aNorm === bNorm) return true;
  }
  return false;
}

export const BetSlipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [legs, setLegs] = useState<CartLeg[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState<number>(1000);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedTicket, setBookedTicket] = useState<BookedTicketResponse | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

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
    const targetKey = leg.matchId || leg.eventId || leg.id;
    const normalizedLeg: CartLeg = {
      ...leg,
      matchId: targetKey,
      odd: Number(leg.odd || leg.odds) || 1.45,
    };
    setLegs((prev) => {
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
        const targetKey = leg.matchId || leg.eventId || leg.id;
        const normalizedLeg: CartLeg = {
          ...leg,
          matchId: targetKey,
          odd: Number(leg.odd || leg.odds) || 1.45,
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
      removeLeg(existing.id);
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
      const selectionsPayload = uniqueLegs.map((leg) => ({
        eventId: leg.sportybetSelection?.eventId || leg.matchId || leg.eventId,
        marketId: leg.sportybetSelection?.marketId || undefined,
        outcomeId: leg.sportybetSelection?.outcomeId || undefined,
        specifier: leg.sportybetSelection?.specifier || null,
        home_team: leg.homeTeam,
        away_team: leg.awayTeam,
        league: leg.league || "Global League",
        market: leg.market,
        selection: leg.selection,
        odd: leg.odd,
        sport: leg.sport || "football",
      }));

      const res = await fetch("/api/bookmaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          bookmaker: "SportyBet",
          selections: selectionsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data.message || "Failed to book slip on SportyBet");
      }

      const code = data.sporty_code || data.booking_code;
      const url = data.share_url || data.sporty_url || `http://www.sportybet.com/ng/?shareCode=${code}`;

      const result: BookedTicketResponse = {
        bookmaker: "SportyBet",
        bookingCode: code,
        sportyCode: code,
        shareUrl: url,
        totalOdds: data.actual_odds || totalOdds,
        legsCount: data.legs_count || uniqueLegs.length,
      };

      setBookedTicket(result);
      return result;
    } catch (err: any) {
      const msg = err.message || "Booking failed on SportyBet. Please try again.";
      setBookingError(msg);
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
