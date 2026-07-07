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
  const [role, setRole] = useState("ASA");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [savedGoogle, setSavedGoogle] = useState<SavedGoogle>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    if (savedEmail) { setEmail(savedEmail); setRememberMe(true); }
    const savedG = localStorage.getItem(SAVED_GOOGLE_KEY);
    if (savedG) { try { setSavedGoogle(JSON.parse(savedG)); } catch {} }
  }, []);

  const canSubmit = email.length > 0 && password.length > 0 && (isLogin ? true : name.trim().length > 0);

  /**
 * Executes operations logic for handleSubmit.
 *
 * @param formData: FormData
 * @returns State operations sequence.
 */
const handleSubmit = async (formData: FormData) => {
    setError(null);
    rememberMe
      ? localStorage.setItem(SAVED_EMAIL_KEY, email)
      : localStorage.removeItem(SAVED_EMAIL_KEY);
    startTransition(async () => {
      const activeAction = isLogin ? SignIn : SignUp;
      const result = await activeAction(formData);
      if (result?.error) setError(result.error);
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

      <form action={handleSubmit} className={styles.div_49}>
        {error && <ErrorToast message={error} onClose={() => setError(null)} />}

        {!isLogin && (
          <FloatingLabelInput
            id="name" label="Full name" name="name"
            type="text" value={name} onChange={setName}
            icon={User} autoComplete="name"
          />
        )}

        {!isLogin && (
          <div className={styles.div_50}>
            <div className={styles.container_51}>
              <div className={styles.container_52}>
                <Users className={styles.text_53} />
              </div>
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={styles.table_54}
              >
                <option value="ASA">Advisor Support Associate (ASA)</option>
                <option value="BSA">Business Support Associate (BSA)</option>
                <option value="CRA">Client Relations Associate (CRA)</option>
                <option value="DCA">Design Content Associate (DCA)</option>
              </select>
              <div className={styles.text_55}>
                ▼
              </div>
            </div>
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
          onChange={setPassword} icon={Lock} autoComplete="current-password"
          rightSlot={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.table_56}>
              {showPassword ? <EyeOff className={styles.div_57} /> : <Eye className={styles.div_58} />}
            </button>
          }
        />

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
