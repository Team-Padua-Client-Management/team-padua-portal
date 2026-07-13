"use client";

/**
 * AuthForm.tsx
 *
 * Main component module in features path: app/auth/AuthForm.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/auth/AuthForm.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import { useState, useTransition, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2, X, Users, User } from "lucide-react";
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
    return { score, label: "Start typing", percent: 0, barClass: "bg-slate-300", textClass: "text-slate-500" };
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

// ─── Google SVG Icon ──────────────────────────────────────────────────────────

/**
 * Executes operations logic for GoogleIcon.
 *
 * 
 * @returns State operations sequence.
 */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.2 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z" />
    <path fill="#FBBC05" d="M10.6 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.1.7-4.6l-7.9-6.1A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.1-6z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.2-8.3 2.2-6.2 0-11.5-4.2-13.4-9.8l-8.1 6C6.6 42.6 14.6 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);


// ─── Spinner ──────────────────────────────────────────────────────────────────

/**
 * Executes operations logic for Spinner.
 *
 * 
 * @returns State operations sequence.
 */
const Spinner = () => (
  <svg className={styles.div_0} viewBox="0 0 24 24" fill="none">
    <circle className={styles.div_1} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className={styles.div_2} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);


// ─── Checkmark ────────────────────────────────────────────────────────────────

/**
 * Executes operations logic for Checkmark.
 *
 * 
 * @returns State operations sequence.
 */
const Checkmark = () => (
  <svg className={styles.text_3} fill="currentColor" viewBox="0 0 12 12">
    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);


// ─── Floating Label Input ─────────────────────────────────────────────────────

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
};

/**
 * Executes operations logic for FloatingLabelInput.
 *
 * @param { id, label, name, type = "text", value, onChange, icon: Icon, rightSlot, autoComplete }: FloatingLabelInputProps
 * @returns State operations sequence.
 */
function FloatingLabelInput({ id, label, name, type = "text", value, onChange, icon: Icon, rightSlot, autoComplete }: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div className={styles.div_4}>
      <div className={`${styles.table_68} ${
        focused
          ? "border-amber-400 shadow-sm shadow-amber-100"
          : "border-slate-200 hover:border-slate-300"
      }`}>
        <div className={styles.container_5}>
          <Icon className={`${styles.table_69} ${focused ? "text-amber-500" : "text-slate-400"}`} />
        </div>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className={styles.table_6}
          placeholder={label}
        />
        <label
          htmlFor={id}
          className={`${styles.table_70} ${
            active ? "top-1.5 text-[10px] text-amber-500" : "top-3.5 text-sm text-slate-400"
          }`}
        >
          {label}
        </label>
        {rightSlot && <div className={styles.container_7}>{rightSlot}</div>}
      </div>
    </div>
  );
}


// ─── Error Toast ──────────────────────────────────────────────────────────────

/**
 * Executes operations logic for ErrorToast.
 *
 * @param { message, onClose }: { message: string; onClose: (
 * @returns State operations sequence.
 */
function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={styles.container_8}>
      <AlertCircle className={styles.text_9} />
      <p className={styles.text_10}>{message}</p>
      <button onClick={onClose} className={styles.table_11}>
        <X className={styles.div_12} />
      </button>
    </div>
  );
}


// ─── Forgot Password Modal ────────────────────────────────────────────────────

/**
 * Executes operations logic for ForgotPasswordModal.
 *
 * @param { onClose }: { onClose: (
 * @returns State operations sequence.
 */
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
 * Executes operations logic for handleReset.
 *
 * 
 * @returns State operations sequence.
 */
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
    <div className={styles.container_13}>
      <div className={styles.div_14} onClick={onClose} />
      <div className={styles.div_15}>
        <button onClick={onClose} className={styles.table_16}>
          <X className={styles.text_17} />
        </button>

        {sent ? (
          <div className={styles.text_18}>
            <div className={styles.container_19}>
              <CheckCircle2 className={styles.text_20} />
            </div>
            <h2 className={styles.text_21}>Check your inbox</h2>
            <p className={styles.text_22}>Reset link sent to</p>
            <p className={styles.text_23}>{email}</p>
            <button onClick={onClose} className={styles.table_24}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className={styles.container_25}>
              <Lock className={styles.text_26} />
            </div>
            <h2 className={styles.text_27}>Reset your password</h2>
            <p className={styles.text_28}>We'll send a reset link to your email address.</p>

            {error && (
              <div className={styles.container_29}>
                <AlertCircle className={styles.text_30} />
                <p className={styles.text_31}>{error}</p>
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
              className={styles.table_32}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}


// ─── Checkbox ─────────────────────────────────────────────────────────────────

/**
 * Executes operations logic for Checkbox.
 *
 * @param { checked, onChange }: { checked: boolean; onChange: (
 * @returns State operations sequence.
 */
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      className={`${styles.table_71} ${
        checked ? "bg-amber-400 border-amber-400" : "border-slate-300 hover:border-amber-300"
      }`}
    >
      {checked && <Checkmark />}
    </div>
  );
}


// ─── Divider ─────────────────────────────────────────────────────────────────

/**
 * Executes operations logic for Divider.
 *
 * 
 * @returns State operations sequence.
 */
function Divider() {
  return (
    <div className={styles.container_33}>
      <div className={styles.container_34} />
      <span className={styles.text_35}>or</span>
      <div className={styles.container_36} />
    </div>
  );
}


// ─── Saved Google Account ─────────────────────────────────────────────────────

type SavedGoogleAccountProps = {
  account: NonNullable<SavedGoogle>;
  loading: boolean;
  onSignIn: () => void;
  onClear: (e: React.MouseEvent) => void;
  onSwitchAccount: () => void;
};

/**
 * Executes operations logic for SavedGoogleAccount.
 *
 * @param { account, loading, onSignIn, onClear, onSwitchAccount }: SavedGoogleAccountProps
 * @returns State operations sequence.
 */
function SavedGoogleAccount({ account, loading, onSignIn, onClear, onSwitchAccount }: SavedGoogleAccountProps) {
  return (
    <div className={styles.div_37}>
      <button
        type="button"
        onClick={onSignIn}
        disabled={loading}
        className={styles.table_38}
      >
        {account.avatar ? (
          <img src={account.avatar} alt={account.name} className={styles.div_39} />
        ) : (
          <div className={styles.text_40}>
            {account.name?.[0] || "G"}
          </div>
        )}
        <div className={styles.text_41}>
          <p className={styles.table_42}>{account.name}</p>
          <p className={styles.table_43}>{account.email}</p>
        </div>
        {loading ? <Spinner /> : <GoogleIcon />}
      </button>

      <div className={styles.container_44}>
        <p className={styles.text_45}>Not you?</p>
        <div className={styles.container_46}>
          <button type="button" onClick={onClear} className={styles.table_47}>
            Remove account
          </button>
          <button type="button" onClick={onSwitchAccount} disabled={loading} className={styles.table_48}>
            Use different account
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Auth Form ────────────────────────────────────────────────────────────────

/**
 * AuthForm
 *
 * Renders the AuthForm interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AuthForm.
 *
 * @param { action }: AuthFormProps
 * @returns State operations sequence.
 */
export const AuthForm = ({ action }: AuthFormProps) => {
  const [isPending, startTransition] = useTransition();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  /**
 * Executes operations logic for handleSubmit.
 *
 * @param e: React.FormEvent<HTMLFormElement>
 * @returns State operations sequence.
 */
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

  /**
 * Executes operations logic for signInWithGoogle.
 *
 * 
 * @returns State operations sequence.
 */
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

  /**
 * Executes operations logic for clearSavedGoogle.
 *
 * @param e: React.MouseEvent
 * @returns State operations sequence.
 */
const clearSavedGoogle = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(SAVED_GOOGLE_KEY);
    setSavedGoogle(null);
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
              <Mail className="h-7 w-7 text-amber-600" />
            </div>
            <h2 className="text-center text-xl font-bold text-slate-900">Check your email</h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              We sent a confirmation email to <span className="font-semibold text-slate-800">{confirmationEmail || email}</span>.
              Please open your inbox and confirm your account to finish signing up.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowConfirmationModal(false);
                setIsLogin(true);
                setError(null);
              }}
              className="mt-6 w-full rounded-full bg-amber-400 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-amber-500"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.div_49}>
        {error && <ErrorToast message={error} onClose={() => setError(null)} />}

        {!isLogin && (
          <FloatingLabelInput
            id="name" label="Full name" name="name"
            type="text" value={name} onChange={setName}
            icon={User} autoComplete="name"
          />
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
            <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.table_56}>
              {showPassword ? <EyeOff className={styles.div_57} /> : <Eye className={styles.div_58} />}
            </button>
          }
        />

        {!isLogin && (
          <div className={`mt-2 space-y-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-3 transition-all duration-300 ${shouldShowPasswordHints ? "max-h-80 opacity-100" : "max-h-0 border-transparent bg-transparent p-0 opacity-0"}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Password strength</p>
              <span className={`text-[11px] font-semibold ${passwordStrength.textClass}`}>{passwordStrength.label}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full transition-all duration-200 ${passwordStrength.barClass}`} style={{ width: `${passwordStrength.percent}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">Use 8–20 characters with uppercase, lowercase, number, and special character.</p>
            <div className="space-y-1.5">
              {passwordChecks.map((check) => (
                <div key={check.label} className="flex items-center gap-2 text-[11px]">
                  {check.valid ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className={check.valid ? "text-emerald-600" : "text-slate-600"}>{check.label}</span>
                </div>
              ))}
            </div>
            {passwordFeedback && (
              <p className="text-[11px] font-medium text-rose-600">{passwordFeedback}</p>
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
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={styles.table_56}>
                {showConfirmPassword ? <EyeOff className={styles.div_57} /> : <Eye className={styles.div_58} />}
              </button>
            }
          />
        )}

        {!isLogin && confirmPasswordState && (
          <div className={`flex items-center gap-2 text-[11px] ${confirmPasswordState.valid ? "text-emerald-600" : "text-rose-600"}`}>
            {confirmPasswordState.valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            <span>{confirmPasswordState.message}</span>
          </div>
        )}

        {isLogin && (
          <div className={styles.container_59}>
            <label className={styles.container_60}>
              <Checkbox checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
              <span className={styles.input_61}>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className={styles.table_62}
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className={styles.table_63}
        >
          {isPending ? (
            <span className={styles.container_64}>
              <Spinner />
              {isLogin ? "Signing in…" : "Signing up…"}
            </span>
          ) : isLogin ? "Sign in" : "Sign up"}
        </button>

        <div className={styles.text_65}>
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
            className={styles.table_66}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <Divider />

        {savedGoogle ? (
          <SavedGoogleAccount
            account={savedGoogle}
            loading={googleLoading}
            onSignIn={signInWithGoogle}
            onClear={clearSavedGoogle}
            onSwitchAccount={signInWithGoogle}
          />
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className={styles.table_67}
          >
            {googleLoading ? <Spinner /> : <GoogleIcon />}
            {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
          </button>
        )}
      </form>
    </>
  );
};

export default AuthForm;
