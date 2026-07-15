'use client';

import React, { useState, useTransition, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2, X, Users, User, Shield, Phone, ChevronDown, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";
import { SignIn, SignUp } from "../action/auth";

const SAVED_EMAIL_KEY = "tp_saved_email";
const SAVED_GOOGLE_KEY = "tp_saved_google";

type AuthFormProps = {
  action: (formData: FormData) => Promise<{ error: string } | void>;
};

type SavedGoogle = { name: string; email: string; avatar: string } | null;

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
    return { score, label: "Start typing", percent: 0, barClass: "bg-slate-200", textClass: "text-slate-400" };
  }
  if (score <= 2) {
    return { score, label: "Weak", percent: 25, barClass: "bg-rose-500", textClass: "text-rose-600" };
  }
  if (score === 3) {
    return { score, label: "Fair", percent: 50, barClass: "bg-orange-500", textClass: "text-orange-600" };
  }
  if (score === 4) {
    return { score, label: "Good", percent: 75, barClass: "bg-amber-500", textClass: "text-amber-600" };
  }
  return { score, label: "Strong", percent: 100, barClass: "bg-emerald-500", textClass: "text-emerald-600" };
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.2 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z" />
    <path fill="#FBBC05" d="M10.6 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.1.7-4.6l-7.9-6.1A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.1-6z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.2-8.3 2.2-6.2 0-11.5-4.2-13.4-9.8l-8.1 6C6.6 42.6 14.6 48 24 48z" />
  </svg>
);

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin text-slate-800 dark:text-slate-900" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

type FloatingLabelInputProps = {
  id: string;
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
};

function FloatingLabelInput({ id, label, name, type = "text", value, onChange, icon: Icon, rightSlot, autoComplete, required = true }: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div className="relative w-full">
      <div className={`flex items-center rounded-2xl border bg-slate-50/50 dark:bg-slate-900 px-4 py-3 transition-all ${
        focused
          ? "border-[#FFC72C] ring-2 ring-[#FFC72C]/10 bg-white dark:bg-slate-950"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}>
        <div className="flex items-center pointer-events-none mr-3">
          <Icon size={16} className={focused ? "text-[#A3843B] dark:text-[#FFC72C]" : "text-slate-400"} />
        </div>
        <div className="relative flex-1">
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            autoComplete={autoComplete}
            required={required}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pt-4 pb-1 bg-transparent outline-none text-xs md:text-sm text-[#1B1B1B] dark:text-white placeholder-transparent"
            placeholder={label}
          />
          <label
            htmlFor={id}
            className={`absolute left-0 transition-all pointer-events-none select-none ${
              active 
                ? "-top-1 text-[9px] font-bold uppercase tracking-wider text-[#A3843B] dark:text-[#FFC72C]" 
                : "top-2 text-xs md:text-sm text-slate-400"
            }`}
          >
            {label}
          </label>
        </div>
        {rightSlot && <div className="ml-2 flex items-center">{rightSlot}</div>}
      </div>
    </div>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) { setError("Enter your email address."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
      <div className="relative bg-white dark:bg-slate-900 rounded-[28px] shadow-xl w-full max-w-md p-8 border border-slate-100 dark:border-slate-800 space-y-6">
        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
        </button>

        {sent ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Check your inbox</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Reset link sent to <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span></p>
            <button onClick={onClose} className="w-full bg-[#FFC72C] hover:bg-[#d8ad2d] text-slate-950 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Reset your password</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">We'll send a password recovery link to your email address.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
              </div>
            )}

            <FloatingLabelInput
              id="reset-email" label="Email address" name="reset-email"
              type="email" value={email} onChange={setEmail}
              icon={Mail} autoComplete="email"
            />

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-[#FFC72C] hover:bg-[#d8ad2d] text-[#1B1B1B] font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export const AuthForm = ({ action }: AuthFormProps) => {
  const [isPending, startTransition] = useTransition();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Financial Advisor");
  const [phone, setPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [savedGoogle, setSavedGoogle] = useState<SavedGoogle>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    if (savedEmail) { setEmail(savedEmail); setRememberMe(true); }
    const savedG = localStorage.getItem(SAVED_GOOGLE_KEY);
    if (savedG) { try { setSavedGoogle(JSON.parse(savedG)); } catch {} }
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

  const canSubmit = email.length > 0 && password.length > 0 && (isLogin
    ? true
    : name.trim().length > 0 && passwordIsValid && confirmPassword.length > 0 && confirmPasswordState?.valid);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPasswordFeedback(null);

    if (!isLogin) {
      if (!passwordIsValid) {
        setPasswordFeedback("Password must meet all requirements.");
        return;
      }
      if (!confirmPassword || password !== confirmPassword) {
        setPasswordFeedback("Please confirm your password correctly.");
        return;
      }
    }

    rememberMe
      ? localStorage.setItem(SAVED_EMAIL_KEY, email)
      : localStorage.removeItem(SAVED_EMAIL_KEY);

    const formData = new FormData(e.currentTarget);
    formData.append("role", role); // explicitly add select dropdown state

    startTransition(async () => {
      const activeAction = isLogin ? SignIn : SignUp;
      const result = await activeAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }

      if (!isLogin) {
        setConfirmationEmail((result as { email?: string } | undefined)?.email || email);
        setShowConfirmationModal(true);
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setPasswordFeedback(null);
      }
    });
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (err) { setError(err.message); setGoogleLoading(false); return; }

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const u = session.user;
        localStorage.setItem(SAVED_GOOGLE_KEY, JSON.stringify({
          name: u.user_metadata?.full_name || u.user_metadata?.name || "",
          email: u.email || "",
          avatar: u.user_metadata?.avatar_url || "",
        }));
      }
    });
  };

  const clearSavedGoogle = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(SAVED_GOOGLE_KEY);
    setSavedGoogle(null);
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 shadow-2xl space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950">
              <Mail className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-center text-xl font-bold text-slate-950 dark:text-white">Check your email</h2>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We sent a confirmation link to <span className="font-semibold text-[#1B1B1B] dark:text-white">{confirmationEmail || email}</span>.
              Please check your inbox and verify your email to access the portal.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowConfirmationModal(false);
                setIsLogin(true);
                setError(null);
              }}
              className="w-full rounded-xl bg-[#FFC72C] hover:bg-[#d8ad2d] px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-950"
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/50 rounded-2xl px-4 py-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold flex-1">{error}</p>
          </div>
        )}

        {/* SIGN UP EXTENDED FORM FIELDS */}
        {!isLogin && (
          <div className="space-y-4">
            <FloatingLabelInput
              id="name" label="Full name" name="name"
              type="text" value={name} onChange={setName}
              icon={User} autoComplete="name"
            />

            <div className="relative w-full">
              <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-4 py-3 transition-all focus-within:border-[#FFC72C] focus-within:ring-2 focus-within:ring-[#FFC72C]/10 focus-within:bg-white dark:focus-within:bg-slate-950 relative">
                <div className="flex items-center pointer-events-none mr-3">
                  <Shield size={16} className="text-slate-400" />
                </div>
                <div className="relative flex-1">
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pt-4 pb-1 bg-transparent outline-none text-xs md:text-sm text-[#1B1B1B] dark:text-white appearance-none cursor-pointer pr-8"
                  >
                    <option value="Financial Advisor" className="dark:bg-slate-900">Financial Advisor</option>
                    <option value="Advisor Support Associate" className="dark:bg-slate-900">Advisor Support Associate</option>
                    <option value="Unit Manager" className="dark:bg-slate-900">Unit Manager</option>
                    <option value="Branch Manager" className="dark:bg-slate-900">Branch Manager</option>
                    <option value="Business Development Lead" className="dark:bg-slate-900">Business Development Lead</option>
                  </select>
                  <label htmlFor="role" className="absolute left-0 -top-1 text-[9px] font-bold uppercase tracking-wider text-[#A3843B] dark:text-[#FFC72C]">
                    Advisor Role
                  </label>
                </div>
                <div className="absolute right-4 pointer-events-none flex items-center">
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
              </div>
            </div>

            <FloatingLabelInput
              id="phone" label="Mobile number" name="phone"
              type="tel" value={phone} onChange={setPhone}
              icon={Phone} autoComplete="tel" required={false}
            />
          </div>
        )}

        <FloatingLabelInput
          id="email" label="Email address" name="email"
          type="email" value={email} onChange={setEmail}
          icon={Mail} autoComplete="email"
        />

        <FloatingLabelInput
          id="password" label="Password" name="password"
          type={showPassword ? "text" : "password"} value={password}
          onChange={(value) => {
            setPassword(value);
            if (passwordFeedback) setPasswordFeedback(null);
          }} icon={Lock} autoComplete={isLogin ? "current-password" : "new-password"}
          rightSlot={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              {showPassword ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-400" />}
            </button>
          }
        />

        {!isLogin && (
          <div className={`mt-2 space-y-3 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 p-3 transition-all duration-300 ${shouldShowPasswordHints ? "max-h-80 opacity-100" : "max-h-0 border-transparent bg-transparent p-0 opacity-0"}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Strength</p>
              <span className={`text-[10px] font-bold uppercase ${passwordStrength.textClass}`}>{passwordStrength.label}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950">
              <div className={`h-full rounded-full transition-all duration-200 ${passwordStrength.barClass}`} style={{ width: `${passwordStrength.percent}%` }} />
            </div>
            <div className="space-y-1.5 mt-2">
              {passwordChecks.map((check) => (
                <div key={check.label} className="flex items-center gap-2 text-[10px]">
                  {check.valid ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-700" />
                  )}
                  <span className={check.valid ? "text-emerald-600 font-semibold" : "text-slate-400"}>{check.label}</span>
                </div>
              ))}
            </div>
            {passwordFeedback && (
              <p className="text-[10px] font-bold text-rose-500">{passwordFeedback}</p>
            )}
          </div>
        )}

        {!isLogin && (
          <FloatingLabelInput
            id="confirmPassword" label="Confirm password" name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              if (passwordFeedback) setPasswordFeedback(null);
            }} icon={Lock} autoComplete="new-password"
            rightSlot={
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                {showConfirmPassword ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-400" />}
              </button>
            }
          />
        )}

        {!isLogin && confirmPasswordState && (
          <div className={`flex items-center gap-2 text-[10px] ${confirmPasswordState.valid ? "text-emerald-600" : "text-rose-500"}`}>
            {confirmPasswordState.valid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            <span className="font-semibold">{confirmPasswordState.message}</span>
          </div>
        )}

        {isLogin && (
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="w-4 h-4 rounded border-slate-300 text-[#FFC72C] focus:ring-[#FFC72C] cursor-pointer"
              />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-[#A3843B] dark:text-[#FFC72C] hover:underline font-bold"
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="w-full bg-[#FFC72C] hover:bg-[#d8ad2d] disabled:opacity-50 text-slate-950 font-extrabold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-400/10 hover:shadow-lg"
        >
          {isPending ? (
            <>
              <Spinner />
              {isLogin ? "Signing in…" : "Registering…"}
            </>
          ) : isLogin ? "Sign In" : "Register Account"}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setPassword("");
              setConfirmPassword("");
              setShowPassword(false);
              setShowConfirmPassword(false);
              setPasswordFeedback(null);
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-100 dark:border-slate-900" />
          <span className="px-3 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">or</span>
          <div className="flex-1 border-t border-slate-100 dark:border-slate-900" />
        </div>

        {savedGoogle ? (
          <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={googleLoading}
              className="flex items-center gap-3 text-left flex-1"
            >
              {savedGoogle.avatar ? (
                <img src={savedGoogle.avatar} alt={savedGoogle.name} className="w-9 h-9 rounded-full border border-slate-200" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#FFF9EC] text-[#A3843B] flex items-center justify-center font-bold text-xs">
                  {savedGoogle.name?.[0]}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-[#1B1B1B] dark:text-white">{savedGoogle.name}</p>
                <p className="text-[10px] text-zinc-400">{savedGoogle.email}</p>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearSavedGoogle} className="text-xs text-rose-500 font-bold hover:underline">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 hover:bg-[#FFF9EC]/20 dark:hover:bg-slate-900 rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <GoogleIcon />
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </button>
        )}
      </form>
    </>
  );
};

export default AuthForm;
