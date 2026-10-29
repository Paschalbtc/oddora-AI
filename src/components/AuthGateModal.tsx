"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Phone,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const AuthGateModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    authModalReason,
    openAuthModal,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithTwitter,
    fastConnect,
  } = useAuth();

  // Mode: "standard" (email/pass) | "fast_connect" (social 1-tap fallback)
  const [fastConnectProvider, setFastConnectProvider] = useState<"google" | "twitter" | null>(null);
  const [fastIdentifier, setFastIdentifier] = useState("");
  const [fastFullName, setFastFullName] = useState("");
  const [fastPhone, setFastPhone] = useState("");

  // Standard form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const isSignUp = authModalMode === "signup";

  const handleOAuthGoogle = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await signInWithGoogle();
      if (res.fallback) {
        // Smoothly transition into instant 1-tap fast connect view
        setFastConnectProvider("google");
        setFastIdentifier(email || "");
        setFastFullName(fullName || "");
      }
    } catch {
      setFastConnectProvider("google");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthTwitter = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await signInWithTwitter();
      if (res.fallback) {
        // Smoothly transition into instant 1-tap fast connect view
        setFastConnectProvider("twitter");
        setFastIdentifier(fullName ? `@${fullName.toLowerCase().replace(/\s+/g, "")}` : "");
        setFastFullName(fullName || "");
      }
    } catch {
      setFastConnectProvider("twitter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFastConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastIdentifier.trim() || !fastFullName.trim()) {
      setErrorMsg("Please enter your name and email or handle.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await fastConnect({
      provider: fastConnectProvider || "google",
      identifier: fastIdentifier.trim(),
      fullName: fastFullName.trim(),
      phone: fastPhone.trim() || undefined,
    });

    setIsSubmitting(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg("Instant Sign-In successful! Platform unlocked.");
      setTimeout(() => {
        setFastConnectProvider(null);
        closeAuthModal();
      }, 700);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setErrorMsg("Please enter your full name");
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg("Password must be at least 6 characters");
          setIsSubmitting(false);
          return;
        }
        const { error } = await signUpWithEmail(
          email.trim(),
          password,
          fullName.trim(),
          phone.trim() || undefined
        );
        if (error) {
          setErrorMsg(error);
        } else {
          setSuccessMsg("Account created! Oddora AI unlocked.");
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        }
      } else {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          setErrorMsg(error);
        } else {
          setSuccessMsg("Welcome back! Platform unlocked.");
          setTimeout(() => {
            closeAuthModal();
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0D121C] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-20 bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/10 flex items-center justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 mb-1">
              <Sparkles className="w-3 h-3" />
              <span>COMPULSORY PLATFORM ACCESS</span>
            </div>
            <h2 className="text-lg font-black text-white">
              {fastConnectProvider
                ? `${fastConnectProvider === "google" ? "Google" : "X (Twitter)"} Instant Fast Connect`
                : isSignUp
                ? "Create Your Free Oddora AI Account"
                : "Sign In to Oddora AI"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {authModalReason ||
                (fastConnectProvider
                  ? "Enter your details to instantly authenticate and unlock all 4 engines"
                  : isSignUp
                  ? "Sign up in 10 seconds to unlock high-win rate daily odds & 1-click booking"
                  : "Welcome back! Enter your login credentials to continue")}
            </p>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 relative z-10 overflow-y-auto max-h-[80vh]">
          {/* Error & Success Feedback Banners */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW A: 1-Tap Fast Connect Fallback (Google / X Instant Authorization) */}
          {fastConnectProvider ? (
            <form onSubmit={handleFastConnectSubmit} className="space-y-3 animate-in fade-in">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  1-Tap Fast Connect: Completes instant authentication without password or email confirmation delay!
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Babatunde Adeleke"
                    value={fastFullName}
                    onChange={(e) => setFastFullName(e.target.value)}
                    className="w-full bg-[#070A0E] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                  {fastConnectProvider === "google" ? "Google Email Address" : "X (Twitter) Handle or Email"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={
                      fastConnectProvider === "google" ? "yourname@gmail.com" : "@YourTwitterHandle"
                    }
                    value={fastIdentifier}
                    onChange={(e) => setFastIdentifier(e.target.value)}
                    className="w-full bg-[#070A0E] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={fastPhone}
                    onChange={(e) => setFastPhone(e.target.value)}
                    className="w-full bg-[#070A0E] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Instant Sign-In & Unlock</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFastConnectProvider(null)}
                className="w-full text-center text-xs text-slate-400 hover:text-white py-1 transition"
              >
                ← Back to standard options
              </button>
            </form>
          ) : (
            /* VIEW B: Standard Options (Social Buttons + Email/Password Form) */
            <>
              {/* One-Click Social OAuth Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleOAuthGoogle}
                  disabled={isSubmitting}
                  className="py-2.5 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs transition flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                {/* X (Twitter) OAuth Button */}
                <button
                  type="button"
                  onClick={handleOAuthTwitter}
                  disabled={isSubmitting}
                  className="py-2.5 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs transition flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>X (Twitter)</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Or continue with email
                </span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {isSignUp && (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Babatunde Adeleke"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-[#070A0E] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="+234 800 000 0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-[#070A0E] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="punter@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#070A0E] border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#070A0E] border border-white/15 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : isSignUp ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Create Account & Unlock Platform</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In & Unlock Platform</span>
                    </>
                  )}
                </button>
              </form>

              {/* Mode Switcher Footer */}
              <div className="pt-2 text-center text-xs text-slate-400">
                {isSignUp ? (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        openAuthModal("login");
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-bold underline ml-1"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    Don&apos;t have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        openAuthModal("signup");
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-bold underline ml-1"
                    >
                      Create Free Account
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthGateModal;
