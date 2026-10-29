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
  bookmaker: "SportyBet" | "Bet9ja";
  bookingCode: string;
  sportyCode?: string;
  bet9jaCode?: string;
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
  removeLeg: (id: string) => void;
  toggleLeg: (leg: CartLeg) => void;
  isInSlip: (matchId: string, selection?: string) => boolean;
  clearSlip: () => void;
  isBooking: boolean;
  bookedTicket: BookedTicketResponse | null;
  bookingError: string | null;
  bookSlip: (bookmaker: "SportyBet" | "Bet9ja") => Promise<BookedTicketResponse | null>;
  resetBookingState: () => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

const STORAGE_KEY = "oddora_betslip_cart_v2";

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
          setLegs(parsed);
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
      const filtered = prev.filter(
        (l) => (l.matchId || l.eventId || l.id) !== targetKey
      );
      return [...filtered, normalizedLeg];
    });
    setBookedTicket(null);
    setBookingError(null);
  };

  const removeLeg = (id: string) => {
    setLegs((prev) =>
      prev.filter(
        (l) => l.id !== id && l.matchId !== id && l.eventId !== id
      )
    );
    setBookedTicket(null);
    setBookingError(null);
  };

  const toggleLeg = (leg: CartLeg) => {
    const targetKey = leg.matchId || leg.eventId || leg.id;
    const existing = legs.find(
      (l) =>
        (l.matchId || l.eventId || l.id) === targetKey &&
        (!leg.selection || l.selection === leg.selection)
    );
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
        ((l.matchId || l.eventId || l.id) === matchId || l.id === matchId) &&
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

  // Instant booking bridge integration with SportyBet & Bet9ja
  const bookSlip = async (bookmaker: "SportyBet" | "Bet9ja"): Promise<BookedTicketResponse | null> => {
    if (legs.length === 0) {
      setBookingError("Please add at least 1 match to book your slip.");
      return null;
    }

    setIsBooking(true);
    setBookingError(null);
    setBookedTicket(null);

    try {
      // Format selections for /api/bookmaker
      const selectionsPayload = legs.map((leg) => ({
        eventId: leg.sportybetSelection?.eventId || leg.matchId,
        marketId: leg.sportybetSelection?.marketId || "1",
        outcomeId: leg.sportybetSelection?.outcomeId || "1",
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
          bookmaker,
          selections: selectionsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data.message || `Failed to book slip on ${bookmaker}`);
      }

      const isBet9ja = bookmaker === "Bet9ja";
      const code = isBet9ja ? (data.bet9ja_code || data.booking_code) : (data.sporty_code || data.booking_code);
      const url = isBet9ja
        ? (data.bet9ja_url || "https://sports.bet9ja.com")
        : (data.share_url || data.sporty_url || `http://www.sportybet.com/ng/?shareCode=${code}`);

      const result: BookedTicketResponse = {
        bookmaker,
        bookingCode: code,
        sportyCode: data.sporty_code || code,
        bet9jaCode: data.bet9ja_code || code,
        shareUrl: url,
        totalOdds: data.actual_odds || totalOdds,
        legsCount: data.legs_count || legs.length,
      };

      setBookedTicket(result);
      return result;
    } catch (err: any) {
      const msg = err.message || `Booking failed on ${bookmaker}. Please try again.`;
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
