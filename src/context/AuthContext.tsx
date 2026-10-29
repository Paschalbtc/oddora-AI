"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { UserTier } from "@/components/Navbar";

export interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  avatar: string;
  tier: UserTier;
  phone?: string;
  preferredBookmaker: "SportyBet" | "Bet9ja";
  favoriteSports: string[];
  defaultStake: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
  requireAuth: (callback?: () => void) => boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  email: "guest@oddora.ai",
  displayName: "Oddora Punter",
  avatar: "👑",
  tier: "FREE",
  phone: "+234 800 000 0000",
  preferredBookmaker: "SportyBet",
  favoriteSports: ["FOOTBALL", "BASKETBALL"],
  defaultStake: 1000,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("signup");
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const supabase = getSupabaseClient();

  // Restore local profile if saved
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("oddora_user_profile");
        if (stored) {
          setProfile((prev) => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch {
        // Ignore JSON error
      }
    }
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);

        if (initialSession?.user) {
          const u = initialSession.user;
          const meta = u.user_metadata || {};
          const full = meta.full_name || meta.name || u.email?.split("@")[0] || "Oddora Punter";
          setProfile((prev) => {
            const next = {
              ...prev,
              email: u.email || prev.email,
              displayName: full,
            };
            if (typeof window !== "undefined") {
              localStorage.setItem("oddora_user_profile", JSON.stringify(next));
            }
            return next;
          });
        }
      } catch (e) {
        console.warn("Supabase auth session lookup notice:", e);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        const u = newSession.user;
        const meta = u.user_metadata || {};
        const full = meta.full_name || meta.name || u.email?.split("@")[0] || "Oddora Punter";
        setProfile((prev) => {
          const next = {
            ...prev,
            email: u.email || prev.email,
            displayName: full,
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("oddora_user_profile", JSON.stringify(next));
          }
          return next;
        });

        // Trigger any pending callback after successful login
        if (pendingCallback) {
          pendingCallback();
          setPendingCallback(null);
        }
        setIsAuthModalOpen(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, pendingCallback]);

  const openAuthModal = useCallback((mode: "login" | "signup" = "signup") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingCallback(null);
  }, []);

  const requireAuth = useCallback(
    (callback?: () => void): boolean => {
      if (user) {
        if (callback) callback();
        return true;
      }
      if (callback) setPendingCallback(() => callback);
      openAuthModal("signup");
      return false;
    },
    [user, openAuthModal]
  );

  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Sign in failed" };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Sign up failed" };
    }
  };

  const signInWithGoogle = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: origin,
      },
    });
  };

  const signInWithTwitter = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: origin,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(DEFAULT_PROFILE);
    if (typeof window !== "undefined") {
      localStorage.removeItem("oddora_user_profile");
    }
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== "undefined") {
        localStorage.setItem("oddora_user_profile", JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated: !!user,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        requireAuth,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithTwitter,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
