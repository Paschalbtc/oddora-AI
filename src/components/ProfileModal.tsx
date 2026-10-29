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
  Lock,
  Mail,
  Phone,
  Wallet,
  LogOut,
  AlertCircle,
  KeyRound,
  Send,
} from "lucide-react";
import { UserTier, WorkspaceTab } from "./Navbar";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase";

export interface UserProfileData {
  displayName: string;
  email: string;
  phone: string;
  preferredBookmaker: "SportyBet";
  favoriteSports: string[];
  defaultStake: number;
}

export const DEFAULT_USER_PROFILE: UserProfileData = {
  displayName: "Pro Bettor",
  email: "punter@oddora.ai",
  phone: "+234 800 000 0000",
  preferredBookmaker: "SportyBet",
  favoriteSports: ["FOOTBALL", "BASKETBALL"],
  defaultStake: 1000,
};

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: UserTier;
  onTierChange: (tier: UserTier) => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  onProfileSaved?: (profile: UserProfileData) => void;
  initialSubTab?: "profile" | "security" | "plan";
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onTierChange,
  onNavigateTab,
  onProfileSaved,
  initialSubTab = "profile",
}) => {
  const { user, profile: authProfile, updateProfile, signOut, isAuthenticated } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "security" | "plan">(initialSubTab);
  const [profile, setProfile] = useState<UserProfileData>(DEFAULT_USER_PROFILE);
  const [isSaved, setIsSaved] = useState(false);

  // Security & Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab, isOpen]);

  // Sync profile when opened
  useEffect(() => {
    if (authProfile) {
      setProfile((prev) => ({
        ...prev,
        displayName: authProfile.displayName || prev.displayName,
        email: authProfile.email || prev.email,
        phone: authProfile.phone || prev.phone,
        preferredBookmaker: "SportyBet",
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
      preferredBookmaker: "SportyBet",
      favoriteSports: profile.favoriteSports,
      defaultStake: profile.defaultStake,
    });
    setIsSaved(true);
    if (onProfileSaved) onProfileSaved(profile);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    setPasswordMsg(null);
    const targetEmail = profile.email || user?.email;
    if (!targetEmail) {
      setPasswordMsg({ type: "error", text: "No email address found for this account." });
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?type=recovery`,
      });
      if (error) throw error;
      setPasswordMsg({ type: "success", text: `Password reset email sent to ${targetEmail}!` });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Could not send reset link." });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#0e131d] border border-slate-200 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#121824] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{profile.displayName || "My Account"}</span>
                <span
                  className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${
                    currentTier === "PREMIUM"
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                      : currentTier === "PRO"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                      : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/20"
                  }`}
                >
                  {currentTier} PLAN
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[240px]">
                {profile.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Switcher: [Profile Details] vs [Security & Password] vs [VIP Plan] */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-100 dark:bg-black/40 border-b border-slate-200 dark:border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab("profile")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === "profile"
                ? "bg-emerald-500 text-black font-black shadow-sm"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="truncate">Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("security")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === "security"
                ? "bg-cyan-500 text-black font-black shadow-sm"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="truncate">Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("plan")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === "plan"
                ? "bg-amber-500 text-black font-black shadow-sm"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="truncate">VIP Plan</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* =========================================================================
              TAB 1: VIEW & EDIT PROFILE DETAILS (NO AVATAR PICKER)
             ========================================================================= */}
          {activeSubTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Display Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.displayName}
                    onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-[#070A0E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-[#070A0E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              {/* Phone & Default Stake */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / WhatsApp (Alerts)
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-[#070A0E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    placeholder="+234 800 000 0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full bg-slate-50 dark:bg-[#070A0E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Bookmaker Protocol */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Exclusive Bookmaker Engine: SportyBet Nigeria
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  All codes generated on Oddora AI are verified and loadable directly on SportyBet.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaved ? "Profile Saved ✓" : "Save Profile Details"}</span>
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              TAB 2: SECURITY & CHANGE PASSWORD
             ========================================================================= */}
          {activeSubTab === "security" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/25 text-xs text-cyan-800 dark:text-cyan-300">
                Manage your Oddora AI account security. Update your password below or send a secure reset link to your email.
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#070A0E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 shadow-inner"
                    placeholder="Enter at least 6 characters..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#070A0E] border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 shadow-inner"
                    placeholder="Re-type new password..."
                  />
                </div>

                {passwordMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      passwordMsg.type === "success"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {passwordMsg.type === "success" ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{passwordLoading ? "Updating..." : "Update Password"}</span>
                </button>
              </form>

              {/* Forgot Password Link Trigger */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Forgot your current password?
                </span>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={passwordLoading}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Reset Email</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: VIP PLANS & SUBSCRIPTION
             ========================================================================= */}
          {activeSubTab === "plan" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Free Plan Card */}
                <div
                  className={`p-4 rounded-2xl border transition ${
                    currentTier === "FREE"
                      ? "bg-slate-100 dark:bg-white/[0.08] border-slate-400 dark:border-white/30"
                      : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 opacity-70"
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    FREE TIER
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-white">₦0</div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Free daily 2.00x banker + standard match predictions.
                  </p>
                  {currentTier === "FREE" && (
                    <span className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                      ✓ Active Plan
                    </span>
                  )}
                </div>

                {/* PRO VIP Card */}
                <div
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    currentTier === "PRO"
                      ? "bg-emerald-500/15 border-emerald-500 shadow-md"
                      : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-emerald-500/50"
                  }`}
                  onClick={() => onTierChange("PRO")}
                >
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                    PRO VIP
                  </span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">₦5,000</div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    All slips up to 10.00x odds + Slip Builder + Over 2.5 goals.
                  </p>
                  {currentTier === "PRO" ? (
                    <span className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                      ✓ Active Plan
                    </span>
                  ) : (
                    <span className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                      Switch to PRO →
                    </span>
                  )}
                </div>

                {/* PREMIUM VIP Card */}
                <div
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    currentTier === "PREMIUM"
                      ? "bg-amber-500/15 border-amber-500 shadow-md"
                      : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-amber-500/50"
                  }`}
                  onClick={() => onTierChange("PREMIUM")}
                >
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 block mb-1">
                    PREMIUM VIP
                  </span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">₦15,000</div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    50x Mega accumulators + Edit Game Engine + 24/7 VIP desk.
                  </p>
                  {currentTier === "PREMIUM" ? (
                    <span className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 block">
                      ✓ Active Plan
                    </span>
                  ) : (
                    <span className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 block">
                      Switch to VIP →
                    </span>
                  )}
                </div>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab("pricing");
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs transition text-center block cursor-pointer"
                >
                  View Full VIP Pricing & Payment Methods →
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
