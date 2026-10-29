"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Crown,
  ShieldCheck,
  Zap,
  X,
  Check,
  Save,
  CreditCard,
  Settings,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  Wallet,
  Trophy,
  LogOut,
  LogIn,
} from "lucide-react";
import { UserTier, WorkspaceTab } from "./Navbar";
import { useAuth } from "@/context/AuthContext";

export interface UserProfileData {
  displayName: string;
  email: string;
  phone: string;
  avatar: string;
  preferredBookmaker: "SportyBet";
  favoriteSports: string[];
  defaultStake: number;
}

export const DEFAULT_USER_PROFILE: UserProfileData = {
  displayName: "Pro Bettor",
  email: "punter@oddora.ai",
  phone: "+234 800 000 0000",
  avatar: "👑",
  preferredBookmaker: "SportyBet",
  favoriteSports: ["FOOTBALL", "BASKETBALL"],
  defaultStake: 1000,
};

const AVATAR_OPTIONS = ["👑", "⚡", "🦁", "🦅", "🎯", "💎", "🔥", "🚀"];

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: UserTier;
  onTierChange: (tier: UserTier) => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  onProfileSaved?: (profile: UserProfileData) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onTierChange,
  onNavigateTab,
  onProfileSaved,
}) => {
  const { user, profile: authProfile, updateProfile, signOut, openAuthModal, isAuthenticated } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "plan">("profile");
  const [profile, setProfile] = useState<UserProfileData>(DEFAULT_USER_PROFILE);
  const [isSaved, setIsSaved] = useState(false);

  // Sync profile when opened
  useEffect(() => {
    if (authProfile) {
      setProfile((prev) => ({
        ...prev,
        displayName: authProfile.displayName || prev.displayName,
        email: authProfile.email || prev.email,
        phone: authProfile.phone || prev.phone,
        avatar: authProfile.avatar || prev.avatar,
        preferredBookmaker: authProfile.preferredBookmaker || prev.preferredBookmaker,
        favoriteSports: authProfile.favoriteSports || prev.favoriteSports,
        defaultStake: authProfile.defaultStake || prev.defaultStake,
      }));
    }
  }, [authProfile, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: profile.displayName,
      email: profile.email,
      phone: profile.phone,
      avatar: profile.avatar,
      preferredBookmaker: profile.preferredBookmaker,
      favoriteSports: profile.favoriteSports,
      defaultStake: profile.defaultStake,
    });
    setIsSaved(true);
    if (onProfileSaved) onProfileSaved(profile);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const toggleFavoriteSport = (sport: string) => {
    setProfile((prev) => {
      const exists = prev.favoriteSports.includes(sport);
      const next = exists
        ? prev.favoriteSports.filter((s) => s !== sport)
        : [...prev.favoriteSports, sport];
      return { ...prev, favoriteSports: next.length > 0 ? next : [sport] };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0e131d] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Sub-tabs */}
        <div className="p-4 sm:p-5 bg-[#121824] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl shadow-inner">
              {profile.avatar || "👑"}
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>{profile.displayName || "My Account"}</span>
                <span
                  className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${
                    currentTier === "PREMIUM"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : currentTier === "PRO"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-white/10 text-slate-300 border-white/20"
                  }`}
                >
                  {currentTier} PLAN
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">{profile.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Switcher: [Edit Profile] vs [Plan Mode & Subscription] */}
        <div className="grid grid-cols-2 p-1.5 bg-black/40 border-b border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab("profile")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
              activeSubTab === "profile"
                ? "bg-emerald-500 text-black font-black shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("plan")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
              activeSubTab === "plan"
                ? "bg-amber-500 text-black font-black shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Plan Mode & VIP</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* =========================================================================
              TAB 1: VIEW & EDIT PROFILE
             ========================================================================= */}
          {activeSubTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Choose Avatar Emoji
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, avatar: emoji }))}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition border ${
                        profile.avatar === emoji
                          ? "bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30 scale-105"
                          : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.displayName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, displayName: e.target.value }))
                    }
                    className="w-full bg-[#070A0E] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#070A0E] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              {/* Phone & Default Stake */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Phone / WhatsApp (Alerts)
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-[#070A0E] border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    placeholder="+234 800 000 0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Default Stake (₦)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={profile.defaultStake}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        defaultStake: Math.max(50, Number(e.target.value) || 100),
                      }))
                    }
                    className="w-full bg-[#070A0E] border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Preferred Bookmaker Toggle */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Preferred Bookmaker (Default 1-Click Booking)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    className="py-2.5 px-3 rounded-xl border text-xs font-black bg-[#E51D25] text-white border-red-500 shadow-md flex items-center justify-between"
                  >
                    <span>SportyBet Nigeria (Exclusive Verified Engine)</span>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Favorite Sports Multi-Select */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Favorite Sports (Customizes Feed Feeds)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "FOOTBALL", label: "Football ⚽" },
                    { id: "BASKETBALL", label: "Basketball 🏀" },
                    { id: "TABLE_TENNIS", label: "Table Tennis 🏓" },
                    { id: "VOLLEYBALL", label: "Volleyball 🏐" },
                  ].map((s) => {
                    const isSelected = profile.favoriteSports.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleFavoriteSport(s.id)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-white/[0.03] text-slate-400 border-white/10 hover:text-white"
                        }`}
                      >
                        <span>{s.label}</span>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Save Button */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Profile Changes Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>

                {/* Account Sign In / Sign Out Action */}
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-98"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out ({authProfile.email})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openAuthModal("signup");
                    }}
                    className="w-full py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs transition flex items-center justify-center gap-2 active:scale-98"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sign In or Register with Google / X</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* =========================================================================
              TAB 2: PLAN MODE & VIP TIERS
             ========================================================================= */}
          {activeSubTab === "plan" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Current Active Tier
                  </span>
                  <div className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                    {currentTier === "PREMIUM" && <Crown className="w-5 h-5 text-amber-400" />}
                    {currentTier === "PRO" && <Zap className="w-5 h-5 text-emerald-400" />}
                    {currentTier === "FREE" && <ShieldCheck className="w-5 h-5 text-slate-400" />}
                    <span>{currentTier} PLAN</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    STATUS: ACTIVE
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                Switch plan mode instantly to unlock high multiplier presets, Over 2.5 goals
                arsenal, and custom slip builder capabilities:
              </div>

              {/* Tier Cards */}
              <div className="space-y-2.5">
                {[
                  {
                    id: "FREE" as UserTier,
                    name: "Free Tier",
                    price: "₦0 / Free Forever",
                    desc: "Daily 2.00 Banker + 3 Free match previews per sport.",
                    badge: "STANDARD",
                    color: "border-white/10 hover:border-white/20",
                  },
                  {
                    id: "PRO" as UserTier,
                    name: "Pro VIP Pass",
                    price: "₦5,000 / month",
                    desc: "100% Matches Unlocked + 50x Slips + Over 2.5 Daily Ticket + Multi-market Builder.",
                    badge: "POPULAR",
                    color: "border-emerald-500/40 bg-emerald-500/[0.04]",
                  },
                  {
                    id: "PREMIUM" as UserTier,
                    name: "Premium VIP Pass",
                    price: "₦10,000 / month",
                    desc: "100x & 200x Slips + 50-game Slip Builder + 4-Mode Ticket Splitting + VIP Support.",
                    badge: "VIP UNLIMITED",
                    color: "border-amber-500/40 bg-amber-500/[0.04]",
                  },
                ].map((tier) => {
                  const isActive = currentTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isActive
                          ? "bg-white/[0.08] border-emerald-400 shadow-md ring-1 ring-emerald-400/40"
                          : tier.color
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{tier.name}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            • {tier.price}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{tier.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onTierChange(tier.id);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition ${
                          isActive
                            ? "bg-emerald-500 text-black font-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {isActive ? "Active Plan" : "Switch Plan"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* View Full Pricing Link */}
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab("pricing");
                    onClose();
                  }}
                  className="w-full py-2 text-center text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center justify-center gap-1 transition"
                >
                  <span>View Complete Pricing & VIP Comparison Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
