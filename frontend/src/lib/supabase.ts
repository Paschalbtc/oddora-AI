"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient, SupabaseClient, User, Session } from "@supabase/supabase-js";

// Supabase environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbGJuZnRmeWxjc2p1enFiZXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTc0NjIsImV4cCI6MjEwODE3MzQ2Mn0.svZdujPkzWNdLm-mJ5XEM8S37JP5euHyoZ5YSt7tRz4";
// API Base URL - empty string by default so all requests route to same-origin /api/... serverlessly on Vercel
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== ""
    ? process.env.NEXT_PUBLIC_API_URL
    : "";

// Supabase browser client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  plan_tier: "FREE" | "PRO" | "VIP";
  subscription_cycle?: string;
  daily_chat_used?: number;
  referral_code: string;
  referred_by_code?: string | null;
  affiliate_balance: number;
  total_referrals: number;
  total_commission_earned?: number;
  is_admin?: boolean;
  created_at?: string;
  referrals?: Array<{
    id: string;
    referred_name: string;
    plan_purchased: string;
    commission_earned: number;
    status: string;
    created_at: string;
  }>;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    referredByCode?: string
  ) => Promise<{ error: Error | null; user?: User | null }>;
  signOut: () => Promise<void>;
  switchPlanDemo: (newPlan: "FREE" | "PRO" | "VIP") => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default fallback demo profile for preview before signing in
const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: "guest-demo-user",
  full_name: "Oddora Beta Explorer",
  email: "guest@oddora.ai",
  phone_number: "+1 (555) 019-2834",
  plan_tier: "FREE",
  subscription_cycle: "BETA_TESTER",
  daily_chat_used: 1,
  referral_code: "ODD-BETA1",
  referred_by_code: null,
  affiliate_balance: 0.0,
  total_referrals: 0,
  total_commission_earned: 0.0,
  is_admin: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(DEFAULT_GUEST_PROFILE);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch full profile from backend GET /api/user/{id}
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        return data.profile || data;
      }
    } catch (err) {
      console.warn("Backend /api/user fetch error:", err);
    }
    return null;
  }, []);

  // Sync profile when auth state changes
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const p = await fetchProfile(user.id);
      if (p) {
        setProfile(p);
      }
    } else {
      setProfile((prev) => prev || DEFAULT_GUEST_PROFILE);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then((p) => {
          if (mounted && p) setProfile(p);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen to Supabase auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const p = await fetchProfile(currentUser.id);
        if (p) setProfile(p);
      } else {
        setProfile(DEFAULT_GUEST_PROFILE);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In
  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.user) {
      setUser(data.user);
      const p = await fetchProfile(data.user.id);
      if (p) setProfile(p);
    }
    setIsLoading(false);
    return { error };
  };

  // Sign Up with Referral Code integration
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    referredByCode?: string
  ) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          referred_by_code: referredByCode,
        },
      },
    });

    if (!error && data.user) {
      try {
        const regRes = await fetch(`${API_BASE_URL}/api/auth/register-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: data.user.id,
            full_name: fullName,
            email: email,
            referred_by_code: referredByCode || null,
          }),
        });
        if (regRes.ok) {
          const regJson = await regRes.json();
          setProfile(regJson.profile);
        }
      } catch (regErr) {
        console.error("Backend register-profile error:", regErr);
      }
      setUser(data.user);
    }

    setIsLoading(false);
    return { error, user: data.user };
  };

  // Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(DEFAULT_GUEST_PROFILE);
  };

  // Beta Test Plan Switcher helper
  const switchPlanDemo = async (newPlan: "FREE" | "PRO" | "VIP") => {
    const currentId = user?.id || profile?.id || "guest-demo-user";
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentId,
          plan_tier: newPlan,
          billing_cycle: "BETA_TESTER",
        }),
      });
      if (res.ok) {
        setProfile((prev) => ({
          ...(prev || DEFAULT_GUEST_PROFILE),
          plan_tier: newPlan,
          subscription_cycle: "BETA_TESTER",
        }));
      } else {
        setProfile((prev) => (prev ? { ...prev, plan_tier: newPlan } : null));
      }
    } catch {
      setProfile((prev) => (prev ? { ...prev, plan_tier: newPlan } : null));
    }
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        profile,
        session,
        isLoading,
        refreshProfile,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        switchPlanDemo,
      },
    },
    children
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

