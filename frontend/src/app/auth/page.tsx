"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Phone,
  Gift,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { supabase, API_BASE_URL, useAuth } from "@/lib/supabase";
import { OddoraLogo } from "@/components/OddoraLogo";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshProfile } = useAuth();

  // Mode: "signup" or "login"
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";
  const [mode, setMode] = useState<"signup" | "login">(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refCaptured, setRefCaptured] = useState<string | null>(null);

  // Automatic capture of ?ref=CODE from URL
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) {
      const cleanRef = refParam.trim().toUpperCase();
      setReferralCode(cleanRef);
      setRefCaptured(cleanRef);
      setMode("signup"); // Auto switch to signup if referral link clicked
    }
  }, [searchParams]);

  // If user is already logged in, redirect to /dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Handle Sign-Up (Zero-Verification Instant Flow)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage("Please enter your phone number with country code (e.g. +234...).");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Supabase Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone_number: phoneNumber.trim(),
            referred_by_code: referralCode.trim() ? referralCode.trim().toUpperCase() : null,
          },
        },
      });

      if (authError) {
        setErrorMessage(authError.message);
        setIsLoading(false);
        return;
      }

      const newUserId = authData.user?.id;
      if (!newUserId) {
        setErrorMessage("Account creation could not generate a user ID. Please try again.");
        setIsLoading(false);
        return;
      }

      // 2. Immediately call POST /api/auth/register-profile
      try {
        const regRes = await fetch(`${API_BASE_URL}/api/auth/register-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: newUserId,
            full_name: fullName.trim(),
            email: email.trim(),
            phone_number: phoneNumber.trim(),
            referred_by_code: referralCode.trim() ? referralCode.trim().toUpperCase() : null,
          }),
        });

        if (!regRes.ok) {
          const errData = await regRes.json();
          console.warn("Backend profile register notice:", errData);
        }
      } catch (backendErr) {
        console.warn("Backend register-profile network error:", backendErr);
      }

      // 3. Ensure user session is fully active
      if (!authData.session) {
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
      }

      await refreshProfile();
      setSuccessMessage("Account created successfully! Redirecting to your dashboard...");

      // 4. Redirect straight to /dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMessage(error.message || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      if (data.user) {
        await refreshProfile();
        setSuccessMessage("Login successful! Welcome back.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 400);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <OddoraLogo size="lg" />
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1">
            Access quantitative value predictions, 20,000x accumulator slips, and daily self-learning insights.
          </p>
        </div>

        {/* Affiliate Referral Banner */}
        {refCaptured && mode === "signup" && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-amber-500/15 border border-emerald-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Gift className="w-4 h-4 animate-bounce" />
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-emerald-300">Affiliate Referral Activated!</p>
              <p className="text-slate-300 text-[11px]">
                Invited by partner code <span className="font-mono font-bold text-amber-400">[{refCaptured}]</span>.
              </p>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <div className="relative rounded-3xl bg-[#0c1427]/90 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-12 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-2xl bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 select-none ${
                mode === "login"
                  ? "bg-white/[0.08] text-white shadow-md border border-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 select-none ${
                mode === "signup"
                  ? "bg-gradient-to-r from-emerald-500/20 to-amber-500/20 text-emerald-300 shadow-md border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode === "signup" ? handleSignUp : handleLogin} className="space-y-4">
            {/* Sign-Up: Full Name */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@oddora.ai"
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Sign-Up: Phone Number with country code placeholder */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Include your country code e.g. +234, +1, +44</span>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-3 pl-10 pr-11 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign-Up: Referral Code (Optional / Auto-filled) */}
            {mode === "signup" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Referral Code
                  </label>
                  <span className="text-[11px] font-mono text-emerald-400 font-medium">Optional (Get 30% Off)</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Gift className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="ODD-XXXXX"
                    className="w-full bg-[#080d1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-base font-mono uppercase text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Submit Button (Large High-Contrast Emerald) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-base font-black tracking-wide text-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{mode === "signup" ? "Setting Up Your Account..." : "Signing In..."}</span>
                </>
              ) : (
                <>
                  <span>{mode === "signup" ? "Create Free Account" : "Sign In to Oddora AI"}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-slate-400">
            {mode === "signup" ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage(null);
                  }}
                  className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMessage(null);
                  }}
                  className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Create one now
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Instant Access
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Top 3 Safe Picks 100% Free
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}

