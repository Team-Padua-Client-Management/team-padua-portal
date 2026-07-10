"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/playground/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/components/playground/PlaygroundContent.module.css";

// ======================================================
// State Initialization & Hooks
// ======================================================

// ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Gamepad2, Trophy, HelpCircle, RefreshCw, Plus, Trash2, Shield, Users, Award, Star, X, Brain, Play, CheckCircle, AlertCircle, Timer, Flame, RefreshCcw, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";

const TRIVIA_QUESTIONS = [
  { q: "Sun Life Philippines was established in what year?", opts: ["1895", "1898", "1902", "1910"], a: 0, fact: "Sun Life of Canada entered the Philippine market in 1895, making it one of the oldest insurance companies in the country." },
  { q: "What does VUL stand for in Sun Life products?", opts: ["Variable Universal Life", "Verified Underwriting License", "Variable Utility Loan", "Valued Universal Life"], a: 0, fact: "VUL (Variable Universal Life) combines life insurance protection with investment components — a flagship product for advisors." },
  { q: "Sun Life's core tagline is about living a _____ life.", opts: ["Brighter", "Better", "Bigger", "Bolder"], a: 0, fact: "'Live a Brighter Life' is Sun Life's signature promise to clients and advisors alike." },
  { q: "The MRA core values stand for which of these?", opts: ["Most Respected Advisor", "Most Reliable Advisor", "Maximum Revenue Advisor", "Minimum Risk Advisor"], a: 0, fact: "MRA = Most Respected Advisor. The 4 core values: Professional, Caring, Winning, and Inspiring." },
  { q: "Which government body licenses Sun Life advisors in PH?", opts: ["Insurance Commission", "SEC", "BSP", "BIR"], a: 0, fact: "The Insurance Commission (IC) licenses all insurance advisors in the Philippines." }
];

const ROLE_QUESTIONS = [
  { q: "A new recruit is learning the basics, making initial calls, and shadowing senior advisors on client visits.", roles: ["ASA", "BSA", "CSA", "DSA"] as const, a: "ASA", hint: "This describes the entry-level journey — building foundations and learning from experience." },
  { q: "An advisor focuses on group corporate accounts, employee benefits packages, and B2B financial solutions.", roles: ["ASA", "BSA", "CSA", "DSA"] as const, a: "BSA", hint: "Business-focused advisors handle corporate clients and employee benefit programs." },
  { q: "An advisor manages a portfolio of individual clients, conducts annual policy reviews, and handles servicing.", roles: ["ASA", "BSA", "CSA", "DSA"] as const, a: "CSA", hint: "Client-centric advisors specialize in deep, long-term relationships with individual clients." },
  { q: "This person leads a team of advisors, holds weekly huddles, tracks team performance, and recruits new talent.", roles: ["ASA", "BSA", "CSA", "DSA"] as const, a: "DSA", hint: "District-level leadership means managing people, not just policies." }
];

const DEFAULT_WHEEL_ITEMS = [
  { label: "Fun Fact", color: "#F4C542", content: "☀️ Sun Life has been in the Philippines for over 130 years — older than most things around you!" },
  { label: "Challenge", color: "#FFF7D6", content: "🏆 Team Challenge: Everyone share one financial tip they'd give their younger self. Go!" },
  { label: "ASA Spotlight", color: "#FFF9E5", content: "🌱 ASA Role: Associate Sales Advisors are the heart of growth. Every expert was once a beginner!" },
  { label: "Did You Know", color: "#FFFFFF", content: "💡 Did You Know? A ₱1M life insurance policy might cost less than your daily barista coffee per day!" },
  { label: "BSA Spotlight", color: "#FFF7D6", content: "💼 BSA Role: Business Sales Advisors protect entire companies. One BSA can shield hundreds of families!" }
];

const SEGMENT_COLORS = ["#F4C542", "#FFF7D6", "#FFF9E5", "#FFFFFF", "#E5E7EB"];

const MEMORY_PAIRS = [
  { id: "vul", term: "VUL", def: "Variable Universal Life" },
  { id: "mra", term: "MRA", def: "Most Respected Advisor" },
  { id: "ic", term: "IC Exam", def: "Licensing Requirement" },
  { id: "uitf", term: "UITF", def: "Pooled Investment Fund" },
  { id: "term", term: "Term Insurance", def: "Pure Protection Plan" },
  { id: "cpd", term: "CPD", def: "License Renewal Units" }
];

const TYPE_PHRASES = [
  "A brighter life begins with a single step toward financial freedom.",
  "Sun Life advisors help families achieve lifetime financial security.",
  "The best time to start your investment is today, not tomorrow."
];

const SIMULATOR_SCENARIOS = [
  {
    client: "Mrs. Santos (Age 45, Married with 2 kids)",
    situation: "She is worried about her kids' college education and her own retirement. She has some savings in a bank earning 1% interest but is scared of stock market risk.",
    question: "What is the best approach to present a solution to Mrs. Santos?",
    options: [
      {
        text: "Explain a balanced VUL policy, showing how it provides life protection for her family while growing college funds through diversified, professionally managed mutual funds over a 10-year horizon, mitigating short-term risk.",
        score: 25,
        reaction: "Mrs. Santos feels understood! She appreciates that her children are protected while their education fund grows safely."
      },
      {
        text: "Tell her she is losing money to inflation in the bank, and push her to invest 100% of her savings in high-growth equity funds immediately to maximize returns.",
        score: 10,
        reaction: "Mrs. Santos gets defensive and scared of losing everything. She says she needs time to think."
      },
      {
        text: "Suggest she keeps everything in the bank since she hates risk, but sell her a basic term life policy just for protection.",
        score: 15,
        reaction: "Mrs. Santos agrees to the protection, but her long-term worry about college and retirement remains unsolved."
      }
    ]
  },
  {
    client: "Mr. Go (Age 28, Single, Tech Professional)",
    situation: "He earns well, wants to grow his wealth aggressively, and is interested in investment products. However, he doesn't see the point of life insurance because he has no dependents.",
    question: "How do you explain the value of a Sun Life product to Mr. Go?",
    options: [
      {
        text: "Show him how starting an investment-focused VUL early leverages compounding interest at a lower premium, securing his insurability for the future while building an aggressive retirement fund.",
        score: 25,
        reaction: "Mr. Go is intrigued by the math of starting early and likes the idea of building an aggressive fund with locked-in low premiums."
      },
      {
        text: "Argue that everyone will die eventually and he must buy insurance now to cover his future funeral costs so his parents won't suffer.",
        score: 5,
        reaction: "Mr. Go finds this morbid and irrelevant to his current life stage. The meeting ends awkwardly."
      },
      {
        text: "Recommend a pure mutual fund investment through Sun Life Prosperity Funds, skipping insurance entirely since he has no dependents.",
        score: 18,
        reaction: "Mr. Go likes the Prosperity Fund idea, but misses out on the valuable long-term health and insurability benefits of a balanced plan."
      }
    ]
  }
];

type Role = "ASA" | "BSA" | "CSA" | "DSA";
type Tab = "trivia" | "wheel" | "memory" | "typerace" | "roles" | "simulator" | "board" | "xoxo";

interface Player {
  name: string;
  pts: number;
  role: Role;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
}

interface MemoryCard {
  id: string;
  face: string;
  type: "term" | "def";
  index: number;
}

interface WheelItem {
  label: string;
  color: string;
  content: string;
}

const ROLE_COLORS: Record<Role, string> = {
  ASA: "bg-[#FFF7D6] dark:bg-[#2E2818]/60 text-black dark:text-[#F4C542] border border-[#F4C542]/40",
  BSA: "bg-muted text-foreground border-border",
  CSA: "bg-[#FFF7D6]/60 dark:bg-[#2E2818]/30 text-black dark:text-[#F4C542] border border-border/50",
  DSA: "bg-[#FFF7D6]/80 dark:bg-[#2E2818]/80 text-black dark:text-[#F4C542] border border-border"
};

/**
 * Executes operations logic for ProgressBar.
 *
 * @param { value, max }: { value: number; max: number }
 * @returns State operations sequence.
 */
function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className={styles.div_0}>
      <div
        className={styles.table_1}
        style={{ width: `${Math.round((value / max) * 100)}%` }}
      />
    </div>
  );
}

/**
 * Playground
 *
 * Renders the Playground interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for Playground.
 *
 * 
 * @returns State operations sequence.
 */
export default function PlaygroundContent() {
  const [tab, setTab] = useState<Tab>("trivia");
  const [totalScore, setTotalScore] = useState(0);
  const [players, setPlayers] = useState<Player[]>([{ name: "Team Padua", pts: 0, role: "BSA" }]);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbLeaderboard, setDbLeaderboard] = useState<{ name: string; pts: number; role: string }[]>([]);

  // Confetti particles
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const nextParticleId = useRef(0);

  // Load user and scores from Supabase on mount
  useEffect(() => {
    const loadUserAndScores = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          // Fetch the user's total accumulated score
          const { data: scores } = await supabase
            .from('playground_scores')
            .select('total_score')
            .eq('user_id', user.id)
            .order('played_at', { ascending: false })
            .limit(1);
          if (scores && scores.length > 0) {
            const savedScore = scores[0].total_score;
            setTotalScore(savedScore);
            setPlayers(ps => ps.map((p, i) => i === 0 ? { ...p, pts: savedScore } : p));
          }
        }
      } catch (err) {
        console.error('Failed to load playground scores:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserAndScores();
  }, []);

  // Load leaderboard data from Supabase
  const loadLeaderboard = useCallback(async () => {
    try {
      // Get the latest score per user using a subquery approach
      const { data, error } = await supabase
        .from('playground_scores')
        .select('user_id, total_score, played_at')
        .order('played_at', { ascending: false });

      if (error || !data) return;

      // Group by user_id, take the latest entry per user
      const userScores = new Map<string, number>();
      for (const row of data) {
        if (!userScores.has(row.user_id)) {
          userScores.set(row.user_id, row.total_score);
        }
      }

      // Fetch profile names for these users
      const userIds = Array.from(userScores.keys());
      if (userIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', userIds);

      if (!profiles) return;

      const leaderboard = profiles.map(p => ({
        name: p.full_name || 'Unknown Player',
        pts: userScores.get(p.id) || 0,
        role: (p.role || 'BSA') as string,
      })).sort((a, b) => b.pts - a.pts);

      setDbLeaderboard(leaderboard);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  }, []);

  // Load leaderboard when switching to board tab
  useEffect(() => {
    if (tab === 'board') {
      loadLeaderboard();
    }
  }, [tab, loadLeaderboard]);

  // Save score to Supabase
  const saveScoreToDb = useCallback(async (gameType: string, pts: number, newTotal: number) => {
    if (!userId) return;
    try {
      await supabase.from('playground_scores').insert({
        user_id: userId,
        game_type: gameType,
        score: pts,
        total_score: newTotal,
      });
    } catch (err) {
      console.error('Failed to save score:', err);
    }
  }, [userId]);

  /**
 * Executes operations logic for triggerConfetti.
 *
 * 
 * @returns State operations sequence.
 */
  const triggerConfetti = () => {
    const newParticles: ConfettiParticle[] = Array.from({ length: 40 }).map(() => ({
      id: nextParticleId.current++,
      x: 30 + Math.random() * 40, // 30% to 70% width
      y: 20 + Math.random() * 30, // 20% to 50% height
      color: ["#F4C542", "#FFF7D6", "#4ade80", "#60a5fa", "#f472b6"][Math.floor(Math.random() * 5)],
      size: Math.random() * 8 + 4,
      angle: Math.random() * 360,
      speed: Math.random() * 3 + 2
    }));
    setConfetti(newParticles);
    setTimeout(() => setConfetti([]), 2000);
  };

  /**
 * Executes operations logic for showToast.
 *
 * @param msg: string
 * @returns State operations sequence.
 */
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  };

  /**
 * Executes operations logic for addScore.
 *
 * @param pts: number
 * @returns State operations sequence.
 */
  const addScore = (pts: number) => {
    setTotalScore((prev) => {
      const next = prev + pts;
      setPlayers((ps) => ps.map((p, i) => (i === 0 ? { ...p, pts: next } : p)));
      return next;
    });
  };

  /**
 * Executes operations logic for handleScore.
 *
 * @param pts: number
 * @returns State operations sequence.
 */
  const handleScore = (pts: number) => {
    addScore(pts);
    showToast(pts >= 0 ? `+${pts} Points Earned!` : `${pts} Points Risk!`);
    if (pts > 0) {
      triggerConfetti();
    }
    // Determine game type from current tab for database
    const gameType = tab;
    const newTotal = totalScore + pts;
    saveScoreToDb(gameType, pts, newTotal);
  };

  /**
 * Executes operations logic for addPlayer.
 *
 * @param name: string, role: Role
 * @returns State operations sequence.
 */
  const addPlayer = (name: string, role: Role) => {
    setPlayers((ps) => [...ps, { name, pts: 0, role }]);
    showToast(`${name} joined the board!`);
  };

  return (
    <div className={styles.text_2}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
        }
      `}} />

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-[#F4C542] animate-spin" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Loading Playground...</span>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
        }
      `}} />

      {confetti.map((p) => (
        <div
          key={p.id}
          className={styles.div_3}
          style={{
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 0.8,
            animation: 'confettiFall 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
          }}
        />
      ))}

      <div className={styles.card_4}>
        <div>
          <h2 className={styles.text_5}>Workspace Playground</h2>
          <p className={styles.table_6}>Sun Life Intern break-time training games</p>
        </div>
        <div className={styles.text_7}>
          <Star size={12} className={styles.text_8} />
          <span>{totalScore} PTS</span>
        </div>
      </div>

      {toastVisible && (
        <div className={styles.card_9}>
          {toastMsg}
        </div>
      )}

      <div className={styles.container_10}>
        {[
          { id: "trivia", label: "🎯 Trivia Quiz" },
          { id: "wheel", label: "🎡 Spin Wheel" },
          { id: "memory", label: "🃏 Match Terms" },
          { id: "typerace", label: "⌨️ Type Race" },
          { id: "roles", label: "📋 Roles Match" },
          { id: "simulator", label: "🤝 Client Meeting" },
          { id: "xoxo", label: "⭕ X O X O Game" },
          { id: "board", label: "🏆 Score Board" }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`${styles.table_223} ${tab === t.id ? "bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border border-[#F4C542]" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.card_11}>
        {tab === "trivia" && <TriviaGame onScore={handleScore} />}
        {tab === "wheel" && <SpinWheel onScore={handleScore} />}
        {tab === "memory" && <MemoryGame onScore={handleScore} />}
        {tab === "typerace" && <TypeRace gamePhrase={TYPE_PHRASES[0]} onScore={handleScore} />}
        {tab === "roles" && <RolesGame onScore={handleScore} />}
        {tab === "simulator" && <ClientMeetingSimulator onScore={handleScore} />}
        {tab === "xoxo" && <XoxoGame onScore={handleScore} />}
        {tab === "board" && <Leaderboard players={players} dbLeaderboard={dbLeaderboard} onAddPlayer={addPlayer} />}
      </div>
    </div>
  );
}

/**
 * Executes operations logic for TriviaGame.
 *
 * @param { onScore }: { onScore: (n: number
 * @returns State operations sequence.
 */
function TriviaGame({ onScore }: { onScore: (n: number) => void }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const q = TRIVIA_QUESTIONS[index];

  /**
 * Executes operations logic for answer.
 *
 * @param i: number
 * @returns State operations sequence.
 */
  const answer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.a) {
      setScore((s) => s + 1);
      onScore(10);
    }
  };

  /**
 * Executes operations logic for next.
 *
 * 
 * @returns State operations sequence.
 */
  const next = () => {
    setIndex((i) => i + 1);
    setSelected(null);
  };

  /**
 * Executes operations logic for reset.
 *
 * 
 * @returns State operations sequence.
 */
  const reset = () => {
    setIndex(0);
    setScore(0);
    setSelected(null);
  };

  if (index >= TRIVIA_QUESTIONS.length) {
    return (
      <div className={styles.text_12}>
        <div className={styles.text_13}>
          🏆
        </div>
        <div className={styles.div_14}>
          <h3 className={styles.text_15}>Trivia Quiz Completed!</h3>
          <p className={styles.table_16}>
            You scored {score} out of {TRIVIA_QUESTIONS.length} questions
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className={styles.table_17}
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.text_18}>
      <div className={styles.table_19}>
        <span className={styles.container_20}><Brain size={13} className={styles.text_21} /> Question {index + 1} of {TRIVIA_QUESTIONS.length}</span>
        <span className={styles.text_22}>Score: {score}</span>
      </div>

      <ProgressBar value={index} max={TRIVIA_QUESTIONS.length} />

      <div className={styles.div_23}>
        <h3 className={styles.text_24}>{q.q}</h3>
      </div>

      <div className={styles.container_25}>
        {q.opts.map((o, i) => {
          let style = "bg-card border-border text-foreground hover:bg-muted/50 hover:border-[#F4C542] hover:-translate-y-0.5 hover:shadow-xs";
          let icon = null;
          if (selected !== null) {
            if (i === q.a) {
              style = "bg-[#F0FDF4] dark:bg-[#163420]/30 border-[#DCFCE7] dark:border-[#DCFCE7]/20 text-[#166534] dark:text-[#4ade80] shadow-2xs";
              icon = <CheckCircle size={14} className={styles.text_26} />;
            } else if (i === selected) {
              style = "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 shadow-2xs";
              icon = <AlertCircle size={14} className={styles.text_27} />;
            } else {
              style = "bg-card border-border text-muted-foreground opacity-60";
            }
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => answer(i)}
              disabled={selected !== null}
              className={`${styles.table_224} ${style}`}
            >
              <span>{o}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className={styles.card_28}>
          <div className={styles.table_29}>
            {selected === q.a ? (
              <span className={styles.text_30}>
                <CheckCircle size={13} /> Correct Answer!
              </span>
            ) : (
              <span className={styles.text_31}>
                <AlertCircle size={13} /> Incorrect Choice
              </span>
            )}
          </div>
          <p className={styles.text_32}>{q.fact}</p>
        </div>
      )}

      {selected !== null && (
        <button
          type="button"
          onClick={next}
          className={styles.table_33}
        >
          <span>Next Question</span> <Play size={10} className={styles.div_34} />
        </button>
      )}
    </div>
  );
}

/**
 * Executes operations logic for SpinWheel.
 *
 * @param { onScore }: { onScore: (n: number
 * @returns State operations sequence.
 */
function SpinWheel({ onScore }: { onScore: (n: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const spinningRef = useRef(false);
  const [result, setResult] = useState<WheelItem | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [wheelItems, setWheelItems] = useState<WheelItem[]>(DEFAULT_WHEEL_ITEMS);
  const [showEditor, setShowEditor] = useState(false);
  const [editItems, setEditItems] = useState<WheelItem[]>(DEFAULT_WHEEL_ITEMS);
  const [newLabel, setNewLabel] = useState("");
  const [newContent, setNewContent] = useState("");

  const draw = useCallback((angle: number, items: WheelItem[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = 210, cy = 210, r = 190;
    const slices = items.length;
    ctx.clearRect(0, 0, 420, 420);

    items.forEach((item, i) => {
      const start = (angle + (i / slices) * 2 * Math.PI) - Math.PI / 2;
      const end = start + (2 * Math.PI / slices);

      // Draw Slice background
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      // Draw slice lines
      ctx.strokeStyle = "rgba(30, 41, 59, 0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw glowing rim bulbs at the start of each slice
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start);
      ctx.beginPath();
      ctx.arc(r - 5, 0, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#FFFBCC";
      ctx.shadowColor = "#F4C542";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();

      // Draw text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + Math.PI / slices);
      ctx.textAlign = "right";
      ctx.fillStyle = "#1E293B";
      ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
      ctx.fillText(item.label, r - 25, 4);
      ctx.restore();
    });

    // Draw outer golden ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "#F4C542";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Center pivot
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#1E293B";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
    ctx.fillStyle = "#F4C542";
    ctx.fill();
  }, []);

  useEffect(() => { draw(0, wheelItems); }, [draw, wheelItems]);

  /**
 * Executes operations logic for spin.
 *
 * 
 * @returns State operations sequence.
 */
  const spin = () => {
    if (spinningRef.current || wheelItems.length < 2) return;
    spinningRef.current = true;
    setSpinning(true);
    setResult(null);
    const spins = (6 + Math.random() * 6) * 2 * Math.PI;
    const duration = 4000;
    const start = Date.now();
    const startAngle = angleRef.current;
    const currentItems = wheelItems;

    /**
 * Executes operations logic for animate.
 *
 * 
 * @returns State operations sequence.
 */
    function animate() {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease out
      angleRef.current = startAngle + spins * ease;
      draw(angleRef.current, currentItems);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        spinningRef.current = false;
        setSpinning(false);
        const normalized = ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const angle = (2 * Math.PI - normalized + Math.PI / 2) % (2 * Math.PI);
        const idx = Math.floor((angle / (2 * Math.PI)) * currentItems.length) % currentItems.length;
        setResult(currentItems[idx]);
        onScore(15);
      }
    }
    requestAnimationFrame(animate);
  };

  /**
 * Executes operations logic for saveChanges.
 *
 * 
 * @returns State operations sequence.
 */
  const saveChanges = () => {
    setWheelItems(editItems);
    setShowEditor(false);
    setResult(null);
    setTimeout(() => draw(0, editItems), 50);
  };

  return (
    <div className={styles.text_35}>
      <div className={styles.container_36}>
        {/* Spinner Pointer Arrow */}
        <div className={styles.table_37}>
          <div className={styles.table_38} />
        </div>
        <canvas
          ref={canvasRef}
          width={420}
          height={420}
          onClick={spin}
          className={styles.card_39}
        />
      </div>
      <div className={styles.container_40}>
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className={styles.table_41}
        >
          {spinning ? "Spinning..." : "🎡 Spin Big Wheel"}
        </button>
        <button
          type="button"
          onClick={() => { setEditItems([...wheelItems]); setShowEditor(true); }}
          className={styles.card_42}
        >
          Edit Segments
        </button>
      </div>
      {result && (
        <div className={styles.container_43}>
          <div className={styles.card_44}>
            {/* Sparkle background elements */}
            <div className={styles.div_45} />
            <div className={styles.div_46} />

            {/* Animated Celebration Icon */}
            <div className={styles.container_47}>
              <div className={styles.container_48}>
                <span className={styles.text_49}>🎉</span>
              </div>
            </div>

            <div className={styles.div_50}>
              <h3 className={styles.table_51}>Wheel Selection!</h3>
              <p className={styles.table_52}>Congrats on your spin</p>
            </div>

            <div className={styles.text_53}>
              <p className={styles.table_54}>
                {result.label}
              </p>
              <p className={styles.text_55}>
                {result.content}
              </p>
            </div>

            <div className={styles.div_56}>
              <button
                type="button"
                onClick={() => setResult(null)}
                className={styles.table_57}
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditor && (
        <div className={styles.container_58}>
          <div className={styles.card_59}>
            <div className={styles.container_60}>
              <h3 className={styles.text_61}>Configure Wheel Segments</h3>
              <button type="button" onClick={() => setShowEditor(false)}>
                <X size={16} className={styles.text_62} />
              </button>
            </div>
            <div className={styles.div_63}>
              {editItems.map((item, i) => (
                <div key={i} className={styles.container_64}>
                  <div className={styles.div_65} style={{ backgroundColor: item.color }} />
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => setEditItems(editItems.map((val, idx) => idx === i ? { ...val, label: e.target.value } : val))}
                    className={styles.card_66}
                  />
                  <button
                    type="button"
                    onClick={() => setEditItems(editItems.filter((_, idx) => idx !== i))}
                    className={styles.text_67}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.div_68}>
              <p className={styles.table_69}>Add New Segment</p>
              <input
                type="text"
                placeholder="Segment Label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className={styles.card_70}
              />
              <input
                type="text"
                placeholder="Fact / Content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className={styles.card_71}
              />
              <button
                type="button"
                onClick={() => {
                  if (newLabel.trim()) {
                    setEditItems([...editItems, { label: newLabel, color: SEGMENT_COLORS[editItems.length % SEGMENT_COLORS.length], content: newContent || newLabel }]);
                    setNewLabel("");
                    setNewContent("");
                  }
                }}
                className={styles.table_72}
              >
                Add Segment
              </button>
            </div>
            <div className={styles.container_73}>
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className={styles.text_74}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveChanges}
                className={styles.text_75}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Executes operations logic for MemoryGame.
 *
 * @param { onScore }: { onScore: (n: number
 * @returns State operations sequence.
 */
function MemoryGame({ onScore }: { onScore: (n: number) => void }) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  const init = useCallback(() => {
    const deck: MemoryCard[] = [];
    MEMORY_PAIRS.forEach((p, i) => {
      deck.push({ id: p.id, face: p.term, type: "term", index: i * 2 });
      deck.push({ id: p.id, face: p.def, type: "def", index: i * 2 + 1 });
    });
    deck.sort(() => Math.random() - 0.5);
    deck.forEach((c, i) => { c.index = i; });
    setCards(deck);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLocked(false);
    setWon(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  /**
 * Executes operations logic for flip.
 *
 * @param idx: number
 * @returns State operations sequence.
 */
  const flip = (idx: number) => {
    if (locked || flipped.includes(idx) || matched.has(cards[idx].id)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = next;
      if (cards[a].id === cards[b].id && cards[a].type !== cards[b].type) {
        const newMatched = new Set(matched);
        newMatched.add(cards[a].id);
        setMatched(newMatched);
        setFlipped([]);
        setLocked(false);
        onScore(20);
        if (newMatched.size === MEMORY_PAIRS.length) {
          setWon(true);
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 950);
      }
    }
  };

  return (
    <div className={styles.text_76}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .card-3d {
          perspective: 1000px;
        }
        .card-3d-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
        }
        .card-3d-flipped {
          transform: rotateY(180deg);
        }
        .card-3d-front, .card-3d-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.75rem;
          padding: 0.5rem;
        }
        .card-3d-front {
          transform: rotateY(180deg);
        }
      `}} />

      <div className={styles.table_77}>
        <span className={styles.container_78}><Brain size={13} className={styles.text_79} /> Matched: {matched.size}/{MEMORY_PAIRS.length}</span>
        <div className={styles.container_80}>
          <span className={styles.text_81}>Moves: {moves}</span>
          <button type="button" onClick={init} className={styles.table_82}><RefreshCw size={12} /></button>
        </div>
      </div>

      <div className={styles.div_83}>
        <div className={`${styles.card_84} card-3d`}>
          {cards.map((card, i) => {
            const isFlipped = flipped.includes(i);
            const isMatched = matched.has(card.id);
            const show = isFlipped || isMatched;
            return (
              <div key={i} className={styles.input_85} onClick={() => flip(i)}>
                <div className={`${styles.card_225} ${show ? 'card-3d-flipped' : ''} card-3d-inner`}>

                  {/* Back of Card (Hidden) */}
                  <div className={`${styles.card_86} card-3d-back`}>
                    <Star size={20} className={styles.text_87} />
                  </div>

                  {/* Front of Card (Flipped / Text) */}
                  <div className={`${styles.card_226} card-3d-front ${isMatched
                      ? "bg-[#E8F8F0] dark:bg-[#163420]/30 border-emerald-300 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400"
                      : "bg-card border-[#F4C542] text-foreground"
                    }`}>
                    {card.face}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {won && (
        <div className={styles.text_88}>
          <div className={styles.text_89}>🎉</div>
          <div className={styles.div_90}>
            <h4 className={styles.text_91}>Memory Match Completed!</h4>
            <p className={styles.table_92}>Successfully solved in {moves} moves</p>
          </div>
          <button
            type="button"
            onClick={init}
            className={styles.table_93}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Executes operations logic for TypeRace.
 *
 * @param { gamePhrase, onScore }: { gamePhrase: string; onScore: (n: number
 * @returns State operations sequence.
 */
function TypeRace({ gamePhrase, onScore }: { gamePhrase: string; onScore: (n: number) => void }) {
  const [phrase, setPhrase] = useState(gamePhrase);
  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [wpm, setWpm] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const newPhrase = useCallback(() => {
    setPhrase(TYPE_PHRASES[Math.floor(Math.random() * TYPE_PHRASES.length)]);
    setTyped("");
    setStartTime(null);
    setElapsed(0);
    setDone(false);
    setWpm(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    newPhrase();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [newPhrase]);

  /**
 * Executes operations logic for handleInput.
 *
 * @param e: React.ChangeEvent<HTMLTextAreaElement>
 * @returns State operations sequence.
 */
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (done) return;
    const val = e.target.value;
    if (!startTime) {
      const now = Date.now();
      setStartTime(now);
      intervalRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - now) / 100) / 10);
      }, 100);
    }
    setTyped(val);
    if (val === phrase) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const secs = (Date.now() - (startTime || Date.now())) / 1000;
      const words = phrase.split(" ").length;
      const calcWpm = Math.round((words / secs) * 60);
      setWpm(calcWpm);
      setDone(true);
      onScore(Math.max(5, Math.round(100 / secs * 5)));
    }
  };

  const correct = phrase.startsWith(typed) || typed === "";
  const borderColor = done ? "border-emerald-500" : typed.length === 0 ? "border-border" : correct ? "border-emerald-400" : "border-red-400";

  /**
 * Executes operations logic for renderPhraseFeedback.
 *
 * 
 * @returns State operations sequence.
 */
  const renderPhraseFeedback = () => {
    return phrase.split("").map((char, index) => {
      let colorClass = "text-black dark:text-white opacity-65"; // Untyped (highly readable black/white)
      if (index < typed.length) {
        colorClass = typed[index] === char
          ? "text-emerald-600 dark:text-[#4ade80] font-semibold transition-colors opacity-100"
          : "bg-red-500/10 text-red-600 dark:text-red-400 font-semibold underline transition-colors opacity-100";
      } else if (index === typed.length && startTime) {
        colorClass = "bg-amber-300/80 dark:bg-amber-500/30 text-black dark:text-white underline font-semibold opacity-100 animate-pulse";
      }
      return <span key={index} className={colorClass}>{char}</span>;
    });
  };

  // Determine dynamic message
  let statusMessage = "🚥 Waiting for your first keystroke...";
  let statusStyle = "bg-muted text-muted-foreground";

  if (startTime) {
    if (done) {
      statusMessage = "🏆 Complete! Excellent typing speed!";
      statusStyle = "bg-[#E8F8F0] dark:bg-[#163420]/30 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20";
    } else if (correct) {
      statusMessage = "⚡ Typing is correct! Keep racing!";
      statusStyle = "bg-[#FFF7D6] dark:bg-[#2E2818]/60 text-black dark:text-[#F4C542] border border-[#F4C542]/20";
    } else {
      statusMessage = "❌ Typo detected! Backspace and correct it!";
      statusStyle = "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-500/20";
    }
  }

  return (
    <div className={styles.text_94}>
      <div className={styles.table_95}>
        <span className={styles.container_96}><Brain size={13} className={styles.text_97} /> Type Race Arena</span>
        <div className={styles.text_98}>
          <span className={styles.card_99}>
            <Timer size={12} className={styles.text_100} /> {elapsed.toFixed(1)}s
          </span>
          {done && (
            <span className={styles.text_101}>
              <Flame size={12} className={styles.text_102} /> {wpm} WPM
            </span>
          )}
        </div>
      </div>

      {/* Race Track lane */}
      <div className={styles.container_103}>
        <div className={styles.container_104}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={styles.div_105} />
          ))}
        </div>
        <div className={styles.table_106}>
          🏁 Finish
        </div>
        <div
          className={styles.table_107}
          style={{
            left: `calc(${(typed.length / phrase.length) * 82}% + 16px)`,
            transform: 'translateX(-50%)'
          }}
        >
          <span className={styles.text_108}>🏎️</span>
          <span className={styles.table_109}>
            {done ? "Done!" : `${Math.round((typed.length / phrase.length) * 100)}%`}
          </span>
        </div>
      </div>

      {/* Dynamic status pill */}
      <div className={`${styles.table_227} ${statusStyle}`}>
        {statusMessage}
      </div>

      {/* Phrase box (Warm contrastive theme) */}
      <div className={styles.table_110}>
        {renderPhraseFeedback()}
      </div>

      <textarea
        rows={3}
        value={typed}
        onChange={handleInput}
        disabled={done}
        placeholder="Type above phrase exactly. Click here to start typing..."
        className={`${styles.card_228} ${borderColor}`}
      />

      <div className={styles.container_111}>
        <p className={styles.table_112}>
          Timer starts on first keystroke
        </p>
        <button
          type="button"
          onClick={newPhrase}
          className={styles.table_113}
        >
          <RefreshCw size={12} /> New Phrase
        </button>
      </div>
    </div>
  );
}

/**
 * Executes operations logic for RolesGame.
 *
 * @param { onScore }: { onScore: (n: number
 * @returns State operations sequence.
 */
function RolesGame({ onScore }: { onScore: (n: number) => void }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const q = ROLE_QUESTIONS[index];

  const roleMetadata: { [key: string]: { label: string; desc: string; emoji: string; color: string } } = {
    ASA: { label: "Associate Advisor (ASA)", desc: "Junior shadow visits & recruitment", emoji: "🌱", color: "border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10" },
    BSA: { label: "Business Advisor (BSA)", desc: "Corporate portfolios & B2B plans", emoji: "💼", color: "border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/10" },
    CSA: { label: "Client Partner (CSA)", desc: "Private family insurance accounts", emoji: "🤝", color: "border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/10" },
    DSA: { label: "District Leader (DSA)", desc: "Team recruiting & agency management", emoji: "🏆", color: "border-purple-200 dark:border-purple-900/30 text-purple-800 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/10" },
  };

  /**
 * Executes operations logic for answer.
 *
 * @param r: string
 * @returns State operations sequence.
 */
  const answer = (r: string) => {
    if (selected) return;
    setSelected(r);
    if (r === q.a) {
      setScore((s) => s + 1);
      onScore(15);
    }
  };

  /**
 * Executes operations logic for next.
 *
 * 
 * @returns State operations sequence.
 */
  const next = () => {
    setIndex((i) => i + 1);
    setSelected(null);
  };

  /**
 * Executes operations logic for reset.
 *
 * 
 * @returns State operations sequence.
 */
  const reset = () => {
    setIndex(0);
    setScore(0);
    setSelected(null);
  };

  if (index >= ROLE_QUESTIONS.length) {
    return (
      <div className={styles.text_114}>
        <div className={styles.text_115}>
          🎖️
        </div>
        <div className={styles.div_116}>
          <h3 className={styles.text_117}>Roles Quiz Completed!</h3>
          <p className={styles.table_118}>
            You scored {score}/{ROLE_QUESTIONS.length} correct roles
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className={styles.table_119}
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.text_120}>
      <div className={styles.table_121}>
        <span className={styles.container_122}><Brain size={13} className={styles.text_123} /> Roles Identification</span>
        <span className={styles.text_124}>Score: {score}</span>
      </div>

      <ProgressBar value={index} max={ROLE_QUESTIONS.length} />

      <div className={styles.text_125}>
        "{q.q}"
      </div>

      <p className={styles.table_126}>
        Select the target advisor role below:
      </p>

      <div className={styles.container_127}>
        {q.roles.map((r) => {
          const meta = roleMetadata[r];
          let style = "bg-card border-border hover:bg-muted/50 hover:border-[#F4C542] hover:-translate-y-0.5 hover:shadow-xs";
          let actionFeedback = null;
          if (selected) {
            if (r === q.a) {
              style = "bg-[#F0FDF4] dark:bg-[#163420]/30 border-emerald-300 dark:border-emerald-900/30 text-emerald-800 dark:text-[#4ade80]";
              actionFeedback = <CheckCircle size={14} className={styles.text_128} />;
            } else if (r === selected) {
              style = "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400";
              actionFeedback = <AlertCircle size={14} className={styles.text_129} />;
            } else {
              style = "bg-card border-border text-muted-foreground opacity-60";
            }
          }
          return (
            <button
              key={r}
              type="button"
              onClick={() => answer(r)}
              disabled={!!selected}
              className={`${styles.table_229} ${style}`}
            >
              <span className={styles.text_130}>{meta.emoji}</span>
              <div className={styles.container_131}>
                <span className={styles.text_132}>{meta.label}</span>
                <span className={styles.table_133}>{meta.desc}</span>
              </div>
              {actionFeedback && <div className={styles.div_134}>{actionFeedback}</div>}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className={styles.card_135}>
          <div className={styles.table_136}>
            {selected === q.a ? (
              <span className={styles.text_137}>
                <CheckCircle size={13} /> Correct Role identified! +15 PTS
              </span>
            ) : (
              <span className={styles.text_138}>
                <AlertCircle size={13} /> Incorrect Role
              </span>
            )}
          </div>
          <p className={styles.text_139}>{q.hint}</p>
        </div>
      )}

      {selected && (
        <button
          type="button"
          onClick={next}
          className={styles.table_140}
        >
          <span>Next Scenario</span> <Play size={10} className={styles.div_141} />
        </button>
      )}
    </div>
  );
}

/**
 * Executes operations logic for ClientMeetingSimulator.
 *
 * @param { onScore }: { onScore: (n: number
 * @returns State operations sequence.
 */
function ClientMeetingSimulator({ onScore }: { onScore: (n: number) => void }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  const current = SIMULATOR_SCENARIOS[index];

  /**
 * Executes operations logic for handleSelect.
 *
 * @param idx: number, optScore: number
 * @returns State operations sequence.
 */
  const handleSelect = (idx: number, optScore: number) => {
    setSelectedOpt(idx);
    setScore((s) => s + optScore);
    onScore(optScore);
  };

  /**
 * Executes operations logic for next.
 *
 * 
 * @returns State operations sequence.
 */
  const next = () => {
    setIndex((i) => i + 1);
    setSelectedOpt(null);
  };

  /**
 * Executes operations logic for reset.
 *
 * 
 * @returns State operations sequence.
 */
  const reset = () => {
    setIndex(0);
    setScore(0);
    setSelectedOpt(null);
  };

  if (index >= SIMULATOR_SCENARIOS.length) {
    return (
      <div className={styles.text_142}>
        <div className={styles.text_143}>
          🤝
        </div>
        <div className={styles.div_144}>
          <h3 className={styles.text_145}>Meeting Simulator Completed!</h3>
          <p className={styles.table_146}>
            You earned a total of {score} points from the consultations.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className={styles.table_147}
        >
          Restart Simulation
        </button>
      </div>
    );
  }

  // Generate initials
  const initials = current.client
    .split(" ")
    .filter(n => n !== "Mrs." && n !== "Mr.")
    .map(n => n.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={styles.text_148}>
      <div className={styles.table_149}>
        <span className={styles.container_150}><Brain size={13} className={styles.text_151} /> Client Consultation</span>
        <span className={styles.text_152}>Simulator Score: {score}</span>
      </div>

      <ProgressBar value={index} max={SIMULATOR_SCENARIOS.length} />

      {/* Client Profile Card */}
      <div className={styles.container_153}>
        <div className={styles.text_154}>
          {initials || "👤"}
        </div>
        <div className={styles.div_155}>
          <span className={styles.table_156}>Prospect Profile</span>
          <span className={styles.text_157}>{current.client}</span>
        </div>
      </div>

      <div className={styles.div_158}>
        <h4 className={styles.table_159}>Background Case:</h4>
        <div className={styles.text_160}>
          {current.situation}
        </div>
      </div>

      <div className={styles.div_161}>
        <h4 className={styles.table_162}>{current.question}</h4>

        <div className={styles.container_163}>
          {current.options.map((opt, idx) => {
            let style = "bg-card border-border hover:bg-muted/50 hover:border-[#F4C542] text-foreground hover:-translate-y-0.5 hover:shadow-xs";
            let icon = null;
            if (selectedOpt !== null) {
              if (idx === selectedOpt) {
                style = opt.score >= 20
                  ? "bg-[#F0FDF4] dark:bg-[#163420]/30 border-emerald-300 dark:border-emerald-900/30 text-emerald-800 dark:text-[#4ade80] shadow-2xs"
                  : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 shadow-2xs";
                icon = opt.score >= 20
                  ? <CheckCircle size={14} className={styles.text_164} />
                  : <AlertCircle size={14} className={styles.text_165} />;
              } else {
                style = "bg-card border-border text-muted-foreground opacity-60";
              }
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx, opt.score)}
                disabled={selectedOpt !== null}
                className={`${styles.table_230} ${style}`}
              >
                <span className={styles.text_166}>#{idx + 1}</span>
                <span className={styles.container_167}>{opt.text}</span>
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {selectedOpt !== null && (
        <div className={styles.card_168}>
          <div className={styles.text_169}>🗣️</div>
          <div className={styles.container_170}>
            <p className={styles.table_171}>
              Client Reaction (+{current.options[selectedOpt].score} PTS):
            </p>
            <p className={styles.text_172}>
              "{current.options[selectedOpt].reaction}"
            </p>
          </div>
        </div>
      )}

      {selectedOpt !== null && (
        <button
          type="button"
          onClick={next}
          className={styles.table_173}
        >
          <span>{index === SIMULATOR_SCENARIOS.length - 1 ? "Finish Simulation" : "Next Client"}</span>
          <Play size={10} className={styles.div_174} />
        </button>
      )}
    </div>
  );
}

/**
 * Executes operations logic for Leaderboard.
 *
 * @param { players, onAddPlayer }: { players: Player[]; onAddPlayer: (name: string, role: Role
 * @returns State operations sequence.
 */
interface LeaderboardProps {
  players: Player[];
  dbLeaderboard: {
    name: string;
    pts: number;
    role: string;
  }[];
  onAddPlayer: (name: string, role: Role) => void;
}

function Leaderboard({
  players,
  dbLeaderboard,
  onAddPlayer,
}: LeaderboardProps) {
  const combinedPlayers: Player[] = [
    ...players,
    ...dbLeaderboard.map((player) => ({
      name: player.name,
      pts: player.pts,
      role: (player.role as Role) || "BSA",
    })),
  ];

  // Remove duplicate names (keep highest score)
  const uniquePlayers = Array.from(
    combinedPlayers.reduce((map, player) => {
      const existing = map.get(player.name);

      if (!existing || player.pts > existing.pts) {
        map.set(player.name, player);
      }

      return map;
    }, new Map<string, Player>()).values()
  );

  const sorted = uniquePlayers.sort((a, b) => b.pts - a.pts);

  const medals = ["🥇", "🥈", "🥉"];

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("ASA");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim()) return;

    onAddPlayer(newName.trim(), newRole);

    setNewName("");
    setNewRole("ASA");
    setIsAdding(false);
  };

  return (
    <div className={styles.text_175}>
      <div className={styles.container_176}>
        <h3 className={styles.table_177}>
          <Trophy size={13} className={styles.text_178} />
          {" "}
          Active Players Leaderboard
        </h3>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={styles.table_179}
          >
            <Plus size={12} />
            {" "}
            Add Player
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className={styles.div_180}>
          <div className={styles.container_181}>
            <span className={styles.table_182}>
              New Player Details
            </span>

            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={styles.text_183}
            >
              &times;
            </button>
          </div>

          <div className={styles.container_184}>
            <div className={styles.div_185}>
              <label className={styles.text_186}>
                Player Name
              </label>

              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter nickname..."
                className={styles.card_187}
                required
              />
            </div>

            <div className={styles.div_188}>
              <label className={styles.text_189}>
                Select Advisor Role
              </label>

              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                className={styles.card_190}
              >
                <option value="ASA">Associate Advisor (ASA)</option>
                <option value="BSA">Business Advisor (BSA)</option>
                <option value="CSA">Client Partner (CSA)</option>
                <option value="DSA">District Leader (DSA)</option>
              </select>
            </div>
          </div>

          <div className={styles.container_191}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={styles.table_192}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.table_193}
            >
              Submit Player
            </button>
          </div>
        </form>
      )}

      <div className={styles.div_194}>
        {sorted.map((p, i) => {
          const isTop3 = i < 3;

          const cardHighlight = isTop3
            ? "border-[#F4C542]/30 dark:border-[#F4C542]/20 bg-gradient-to-r from-[#FFF9E5]/30 to-card dark:from-[#2E2818]/10"
            : "border-border bg-card";

          return (
            <div
              key={`${p.name}-${i}`}
              className={`${styles.table_231} ${cardHighlight}`}
            >
              <div className={styles.text_195}>
                {medals[i] || i + 1}
              </div>

              <div className={styles.container_196}>
                <p className={styles.table_197}>
                  {p.name}
                </p>

                <span
                  className={`${styles.table_232} ${ROLE_COLORS[p.role] ?? ROLE_COLORS.BSA
                    }`}
                >
                  {p.role}
                </span>
              </div>

              <span className={styles.table_198}>
                {p.pts} PTS
              </span>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">
            No players found.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Executes operations logic for XoxoGame.
 *
 * @param { onScore }: { onScore: (n: number
 * @returns State operations sequence.
 */
function XoxoGame({ onScore }: { onScore: (n: number) => void }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<string | null>(null); // "X", "O", "Draw"
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkWinner = (tempBoard: (string | null)[]) => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (tempBoard[a] && tempBoard[a] === tempBoard[b] && tempBoard[a] === tempBoard[c]) {
        return { winner: tempBoard[a], line: combo };
      }
    }
    if (tempBoard.every((cell) => cell !== null)) {
      return { winner: "Draw", line: null };
    }
    return null;
  };

  /**
 * Executes operations logic for handleCellClick.
 *
 * @param index: number
 * @returns State operations sequence.
 */
  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === "X" || result.winner === "O") {
        onScore(20);
      }
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  /**
 * Executes operations logic for resetGame.
 *
 * 
 * @returns State operations sequence.
 */
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className={styles.text_199}>
      <div className={styles.table_200}>
        <span className={styles.container_201}><Brain size={13} className={styles.text_202} /> X O X O Game (2-Player)</span>
        <button
          type="button"
          onClick={resetGame}
          className={styles.table_203}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className={styles.div_204}>
        <div className={styles.container_205}>
          {board.map((cell, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            let borderStyle = "border-border bg-card hover:border-[#F4C542]/50";
            if (isWinningCell) {
              borderStyle = "border-emerald-400 bg-[#E8F8F0] dark:bg-[#163420]/30 shadow-xs";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCellClick(idx)}
                disabled={!!cell || !!winner}
                className={`${styles.input_233} ${borderStyle}`}
              >
                {cell === "X" && (
                  <span className={styles.text_206}>❌</span>
                )}
                {cell === "O" && (
                  <span className={styles.text_207}>⭕</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.text_208}>
        {winner ? (
          <div className={styles.div_209}>
            {winner === "X" && (
              <div className={styles.div_210}>
                <span className={styles.text_211}>🎉</span>
                <p className={styles.table_212}>Player 1 (X) Wins! +20 Points</p>
              </div>
            )}
            {winner === "O" && (
              <div className={styles.div_213}>
                <span className={styles.text_214}>🎉</span>
                <p className={styles.table_215}>Player 2 (O) Wins! +20 Points</p>
              </div>
            )}
            {winner === "Draw" && (
              <div className={styles.div_216}>
                <span className={styles.text_217}>🤝</span>
                <p className={styles.table_218}>It's a Draw!</p>
              </div>
            )}
            <button
              type="button"
              onClick={resetGame}
              className={styles.table_219}
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className={styles.card_220}>
            {currentPlayer === "X" ? (
              <span className={styles.text_221}>
                ❌ Turn: Player 1 (X)
              </span>
            ) : (
              <span className={styles.text_222}>
                ⭕ Turn: Player 2 (O)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
