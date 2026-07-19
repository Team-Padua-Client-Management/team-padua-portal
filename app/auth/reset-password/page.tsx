'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, ChevronLeft, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";

const getPasswordChecks = (value: string) => [
  { label: "At least 8 characters", valid: value.length >= 8 },
  { label: "One uppercase letter", valid: /[A-Z]/.test(value) },
  { label: "One lowercase letter", valid: /[a-z]/.test(value) },
  { label: "One number", valid: /\d/.test(value) },
  { label: "One special character", valid: /[^A-Za-z0-9]/.test(value) },
];

const getPasswordStrength = (value: string) => {
  const checks = getPasswordChecks(value);
  const score = checks.filter((check) => check.valid).length;

  if (!value) {
    return { score, label: "Start typing", percent: 0, barClass: "bg-slate-200 dark:bg-slate-800", textClass: "text-slate-400" };
  }
  if (score <= 2) {
    return { score, label: "Weak", percent: 25, barClass: "bg-rose-500", textClass: "text-rose-600 dark:text-rose-400" };
  }
  if (score === 3) {
    return { score, label: "Fair", percent: 50, barClass: "bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" };
  }
  if (score === 4) {
    return { score, label: "Good", percent: 75, barClass: "bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" };
  }
  return { score, label: "Strong", percent: 100, barClass: "bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" };
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session status on reset-password load:", !!session);
    };
    checkSession();
  }, []);

  const passwordChecks = getPasswordChecks(password);
  const passwordIsValid = passwordChecks.every((check) => check.valid);
  const passwordStrength = getPasswordStrength(password);
  const shouldShowPasswordHints = password.length > 0;
  const confirmPasswordState = confirmPassword.length > 0
    ? password === confirmPassword
      ? { valid: true, message: "Passwords match" }
      : { valid: false, message: "Passwords do not match" }
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordIsValid) {
      setError("Password does not meet all requirement criteria.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Please ensure both passwords match.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9EC] via-white to-white dark:from-[#0B0C10] dark:via-slate-950 dark:to-slate-950 px-6 relative overflow-hidden">
      
      {/* Decorative Glow Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-[#FFC72C]/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-amber-400/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[32px] shadow-lg p-6 md:p-8 hover:shadow-xl transition-all duration-300 relative z-10">
        
        {/* Top Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/auth/login")}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-full border border-slate-100 dark:border-slate-900"
          >
            <ChevronLeft size={12} className="text-slate-400" />
            Back to Login
          </button>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#A3843B] dark:text-[#FFC72C] bg-[#FFF9EC] dark:bg-slate-950 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles size={8} /> Secure Reset
          </span>
        </div>

        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-[#FFC72C] blur-md opacity-20 rounded-full" />
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={64}
              height={64}
              priority
              className="relative object-contain p-1.5 rounded-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1B1B1B] dark:text-white">RESET PASSWORD</h1>
            <p className="text-[10px] text-zinc-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Setup your new account credentials</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Reset Successful!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your account password has been updated securely. You can now login or continue straight to your user dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-[#FFC72C] hover:bg-[#d8ad2d] text-[#1B1B1B] font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/auth/login")}
                className="flex-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider"
              >
                Go to Login
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            {error && (
              <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/50 rounded-2xl px-4 py-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold flex-1">{error}</p>
              </div>
            )}

            {/* New Password Input */}
            <div className="relative w-full">
              <div className="flex items-center rounded-2xl border bg-slate-50/50 dark:bg-slate-900 px-4 py-3 transition-all border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-[#FFC72C] focus-within:ring-2 focus-within:ring-[#FFC72C]/10 focus-within:bg-white dark:focus-within:bg-slate-950">
                <div className="flex items-center pointer-events-none mr-3">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pt-4 pb-1 bg-transparent outline-none text-xs md:text-sm text-[#1B1B1B] dark:text-white"
                  />
                  <label className={`absolute left-0 transition-all pointer-events-none select-none ${password.length > 0 ? "-top-1 text-[9px] font-bold uppercase tracking-wider text-[#A3843B] dark:text-[#FFC72C]" : "top-2 text-xs md:text-sm text-slate-400"}`}>
                    New Password
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="relative w-full">
              <div className="flex items-center rounded-2xl border bg-slate-50/50 dark:bg-slate-900 px-4 py-3 transition-all border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-[#FFC72C] focus-within:ring-2 focus-within:ring-[#FFC72C]/10 focus-within:bg-white dark:focus-within:bg-slate-950">
                <div className="flex items-center pointer-events-none mr-3">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <div className="relative flex-1">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pt-4 pb-1 bg-transparent outline-none text-xs md:text-sm text-[#1B1B1B] dark:text-white"
                  />
                  <label className={`absolute left-0 transition-all pointer-events-none select-none ${confirmPassword.length > 0 ? "-top-1 text-[9px] font-bold uppercase tracking-wider text-[#A3843B] dark:text-[#FFC72C]" : "top-2 text-xs md:text-sm text-slate-400"}`}>
                    Confirm Password
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Passwords Match Visualizer */}
            {confirmPasswordState && (
              <div className={`flex items-center gap-1.5 text-[10px] font-bold px-1 uppercase tracking-wide ${confirmPasswordState.valid ? "text-emerald-600" : "text-rose-600"}`}>
                <CheckCircle2 size={12} className={confirmPasswordState.valid ? "text-emerald-500" : "text-rose-500"} />
                {confirmPasswordState.message}
              </div>
            )}

            {/* Password strength feedback */}
            {shouldShowPasswordHints && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Password Strength</span>
                  <span className={passwordStrength.textClass}>{passwordStrength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClass}`} style={{ width: `${passwordStrength.percent}%` }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[10px]">
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-1.5 font-semibold text-slate-400">
                      <CheckCircle2 size={12} className={check.valid ? "text-emerald-500" : "text-slate-300 dark:text-slate-700"} />
                      <span className={check.valid ? "text-slate-700 dark:text-slate-200" : ""}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordIsValid || password !== confirmPassword}
              className="w-full bg-[#FFC72C] hover:bg-[#d8ad2d] text-[#1B1B1B] font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? "Saving changes…" : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
