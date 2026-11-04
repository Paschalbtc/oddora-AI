"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Users,
  Eye,
  Ticket,
  Flame,
  RefreshCw,
  ArrowLeft,
  Search,
  ShieldCheck,
  Activity,
  Clock,
  Sparkles,
  Database,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import { OddoraLogo } from "@/components/OddoraLogo";

const ADMIN_EMAIL = "tech.paschalbtc@gmail.com";

interface AdminMetrics {
  totalVisitorsAllTime: number;
  visitorsToday24h: number;
  totalRegisteredUsers: number;
  newSignupsToday24h: number;
  totalSavedTickets: number;
  activeMatchesInPool: number;
}

interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastSignInAt: string | null;
  savedSlipsCount: number;
  isFounder: boolean;
  role: string;
}

function FounderAdminContent() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [usersList, setUsersList] = useState<AdminUserRow[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Strict Email-Only Access Control
  const activeEmail = (user?.email || profile?.email || "").toLowerCase().trim();
  const isAuthorizedFounder = isAuthenticated && activeEmail === ADMIN_EMAIL;

  useEffect(() => {
    // Only redirect once authentication status is resolved
    if (!isAuthLoading) {
      if (!isAuthenticated || activeEmail !== ADMIN_EMAIL) {
        // Strictly boot unauthorized users out to homepage immediately
        router.replace("/");
      }
    }
  }, [isAuthLoading, isAuthenticated, activeEmail, router]);

  // 2. Fetch Live Admin Stats
  const fetchStats = useCallback(async () => {
    if (!isAuthorizedFounder) return;
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const storedUser = localStorage.getItem("oddora_auth_user");
      let token = "";
      try {
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          token = parsed?.access_token || "";
        }
      } catch {}

      const res = await fetch("/api/admin-stats", {
        method: "GET",
        headers: {
          "x-admin-email": activeEmail,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 403) {
          router.replace("/");
          return;
        }
        throw new Error(`Admin stats request failed with status: ${res.status}`);
      }

      const data = await res.json();
      if (data.status === "success") {
        const rawMetrics = data.metrics || {};
        setMetrics({
          totalVisitorsAllTime: rawMetrics.totalVisitorsAllTime ?? 0,
          visitorsToday24h: rawMetrics.visitorsToday24h ?? 0,
          totalRegisteredUsers: data.totalUsers ?? rawMetrics.totalRegisteredUsers ?? 0,
          newSignupsToday24h: data.newUsersToday ?? rawMetrics.newSignupsToday24h ?? 0,
          totalSavedTickets: data.totalSlips ?? rawMetrics.totalSavedTickets ?? 0,
          activeMatchesInPool: data.activeMatches ?? rawMetrics.activeMatchesInPool ?? 0,
        });
        setUsersList(data.recentUsers || []);
        setLastUpdated(data.lastUpdated || new Date().toISOString());
      } else {
        setErrorMessage(data.message || "Failed to load admin stats");
      }
    } catch (err: any) {
      console.error("Admin stats fetch error:", err);
      setErrorMessage(err.message || "Network error loading stats");
    } finally {
      setIsLoadingStats(false);
      setIsRefreshing(false);
    }
  }, [isAuthorizedFounder, activeEmail, router]);

  useEffect(() => {
    if (isAuthorizedFounder) {
      fetchStats();
    }
  }, [isAuthorizedFounder, fetchStats]);

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList;
    const q = searchQuery.toLowerCase().trim();
    return usersList.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [usersList, searchQuery]);

  // If auth is still resolving or user is unauthorized, render locked splash
  if (isAuthLoading || !isAuthorizedFounder) {
    return (
      <div className="min-h-screen bg-[#070A0E] text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 animate-pulse">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100 font-mono tracking-tight">
          Verifying Founder Authorization...
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
          Strict access control locked to <span className="text-amber-400 font-mono">{ADMIN_EMAIL}</span>.
        </p>
      </div>
    );
  }

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        formatted: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        relative: getRelativeTime(d),
      };
    } catch {
      return { formatted: iso, relative: "" };
    }
  };

  function getRelativeTime(d: Date) {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="min-h-screen bg-[#070A0E] text-slate-100 flex flex-col antialiased">
      {/* Top Founder Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0A0E14]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
            title="Return to Oddora AI Homepage"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Oddora AI</span>
          </button>

          <div className="h-5 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-4 h-4 text-black font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black font-mono tracking-tight text-white">
                  FOUNDER ADMIN
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block font-mono">
                {ADMIN_EMAIL}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStats}
            disabled={isRefreshing}
            className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-2 text-xs font-bold active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh Live Metrics & User Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Live Stats</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
        {/* Welcome Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0C121D] via-[#0E1726] to-[#0A1018] border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-32 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  CONFIDENTIAL FOUNDER PORTAL
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Auto-syncing Supabase Cloud
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Platform Intelligence & Traffic Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real-time metrics, active user registrations, visitors, and accumulator volume for Oddora AI.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0 bg-black/40 border border-white/10 px-3.5 py-2.5 rounded-2xl">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Last Synchronized</div>
                <div className="text-xs font-mono font-bold text-slate-200">
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Synchronizing..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={fetchStats}
              className="underline font-bold hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Core KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Website Visitors */}
          <div className="p-5 rounded-2xl bg-[#0C111A] border border-white/10 hover:border-emerald-500/30 transition shadow-lg relative group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Total Visitors
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {isLoadingStats ? "..." : (metrics?.totalVisitorsAllTime ?? 0).toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono font-bold text-[10px]">
                +{(metrics?.visitorsToday24h ?? 0).toLocaleString()} Today (24h)
              </span>
              <span className="text-[11px] text-slate-500">Unique Sessions</span>
            </div>
          </div>

          {/* Card 2: Registered Users */}
          <div className="p-5 rounded-2xl bg-[#0C111A] border border-white/10 hover:border-emerald-500/30 transition shadow-lg relative group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Registered Users
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {isLoadingStats ? "..." : (metrics?.totalRegisteredUsers ?? 0).toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                +{(metrics?.newSignupsToday24h ?? 0).toLocaleString()} New Today
              </span>
              <span className="text-[11px] text-slate-500">Supabase Auth</span>
            </div>
          </div>

          {/* Card 3: Saved & Booked Tickets */}
          <div className="p-5 rounded-2xl bg-[#0C111A] border border-white/10 hover:border-emerald-500/30 transition shadow-lg relative group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Saved / Booked Slips
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {isLoadingStats ? "..." : (metrics?.totalSavedTickets ?? 0).toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                LIVE TICKET VAULT
              </span>
              <span className="text-[11px] text-slate-500">Tracked Bets</span>
            </div>
          </div>

          {/* Card 4: Active Matches in Pool */}
          <div className="p-5 rounded-2xl bg-[#0C111A] border border-white/10 hover:border-emerald-500/30 transition shadow-lg relative group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Active Match Pool
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {isLoadingStats ? "..." : (metrics?.activeMatchesInPool ?? 0).toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px]">
                4-SPORT SYNC
              </span>
              <span className="text-[11px] text-slate-500">Live Fixtures</span>
            </div>
          </div>
        </div>

        {/* Registered Users Directory Section */}
        <div className="rounded-3xl bg-[#0C111A] border border-white/10 overflow-hidden shadow-2xl">
          {/* Table Header & Controls */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>Registered Users Directory</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[11px] font-mono">
                  {usersList.length} Accounts
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Latest registered accounts on Oddora AI, signup timestamps, and tracked ticket volume.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111722] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080D14] text-slate-400 border-b border-white/10 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">#</th>
                  <th className="py-3 px-4 sm:px-6">User / Email</th>
                  <th className="py-3 px-4 sm:px-6">Role</th>
                  <th className="py-3 px-4 sm:px-6">Registered Date</th>
                  <th className="py-3 px-4 sm:px-6">Last Active</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Saved Slips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoadingStats ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                      Loading Supabase Users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                      {searchQuery
                        ? `No users found matching "${searchQuery}"`
                        : "No registered users in directory."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const regDate = formatTimestamp(u.createdAt);
                    const lastActive = u.lastSignInAt ? formatTimestamp(u.lastSignInAt) : null;

                    return (
                      <tr
                        key={u.id || idx}
                        className={`hover:bg-white/[0.02] transition ${
                          u.isFounder ? "bg-amber-500/[0.04]" : ""
                        }`}
                      >
                        <td className="py-3 px-4 sm:px-6 font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 sm:px-6">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                u.isFounder
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {u.isFounder ? (
                                <Crown className="w-3.5 h-3.5" />
                              ) : (
                                u.displayName.charAt(0).toUpperCase() || "P"
                              )}
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                                <span>{u.email}</span>
                                {u.isFounder && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {u.displayName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 sm:px-6">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border ${
                              u.isFounder
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 sm:px-6">
                          <div className="text-slate-200 font-mono text-[11px]">
                            {regDate.formatted}
                          </div>
                          <div className="text-[10px] text-slate-500">{regDate.relative}</div>
                        </td>
                        <td className="py-3 px-4 sm:px-6">
                          {lastActive ? (
                            <div>
                              <div className="text-slate-300 font-mono text-[11px]">
                                {lastActive.formatted}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {lastActive.relative}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-mono text-[10px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                              u.savedSlipsCount > 0
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-white/5 text-slate-400 border border-white/5"
                            }`}
                          >
                            {u.savedSlipsCount} {u.savedSlipsCount === 1 ? "slip" : "slips"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FounderAdminPage() {
  return (
    <AuthProvider>
      <FounderAdminContent />
    </AuthProvider>
  );
}
