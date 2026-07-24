/**
 * Brain Battle bot roster + unlock progression.
 *
 * Replaces the previous fake opponent (Math.random() < 0.6) with a named-bot
 * system inspired by chess.com's bot pattern. Each bot is honestly labeled as
 * an AI opponent — no pretending kids are matched against real players.
 *
 * Why this exists:
 *   - The original Brain Battle "Finding opponent..." matching + random CPU was
 *     deceptive and flagged in the catalog audit as not-truly-playable.
 *   - Chess.com solves this by exposing a roster of named bots (Antonio,
 *     Maria, Magnus, etc.) at different skill levels. Kids self-pace.
 *   - Unlock progression (beat Bina → Sara unlocks → Bharat unlocks) gives
 *     a sense of advancement without exposing intimidating accuracy %.
 *
 * Bot tuning:
 *   - accuracy: probability bot answers a question correctly (0..1)
 *   - speedMs: random delay before bot "answers" (simulates thinking time)
 *   - description: kid-friendly skill label (no raw % numbers exposed)
 *   - tier: difficulty band (1=easiest, 4=boss)
 *   - unlockedAfter: bot id that must be beaten to unlock this bot
 */

import { useEffect, useState } from "react";

const EVENT_NAME = "brain-battle-bots-change";

// ─── Bot catalog ─────────────────────────────────────────────────────────────
export interface Bot {
  id: string;
  name: string;
  initial: string;
  accent: string;
  accuracy: number;            // 0..1
  speedMs: { min: number; max: number };
  tier: 1 | 2 | 3 | 4;
  description: string;         // shown on the bot card — natural language, no %
  unlockedAfter?: string;      // id of prerequisite bot
}

export const BOTS: Bot[] = [
  // ─── Tier 1 — Start here ─────────────────────────────────────────────
  {
    id: "bina",
    name: "Bubbly Bina",
    initial: "B",
    accent: "var(--success-400)",
    accuracy: 0.32,
    speedMs: { min: 3500, max: 4500 },
    tier: 1,
    description: "Just learning · easy questions",
  },
  {
    id: "karan",
    name: "Curious Karan",
    initial: "K",
    accent: "var(--cyan-500)",
    accuracy: 0.42,
    speedMs: { min: 2800, max: 3800 },
    tier: 1,
    description: "Getting started · friendly match",
  },
  // ─── Tier 2 — Unlocks after beating any Tier 1 bot ───────────────────
  {
    id: "sara",
    name: "Sharp Sara",
    initial: "S",
    accent: "var(--primary-500)",
    accuracy: 0.60,
    speedMs: { min: 2500, max: 3200 },
    tier: 2,
    description: "Sharp player · steady pace",
    unlockedAfter: "bina",
  },
  {
    id: "quincy",
    name: "Quick Quincy",
    initial: "Q",
    accent: "var(--warning-500)",
    accuracy: 0.65,
    speedMs: { min: 1200, max: 1800 },
    tier: 2,
    description: "Loves speed · answers fast",
    unlockedAfter: "karan",
  },
  // ─── Tier 3 — Unlocks after Tier 2 ───────────────────────────────────
  {
    id: "bharat",
    name: "Brainy Bharat",
    initial: "Bh",
    accent: "var(--mark-review-500)",
    accuracy: 0.80,
    speedMs: { min: 2400, max: 3000 },
    tier: 3,
    description: "Smart cookie · tough questions",
    unlockedAfter: "sara",
  },
  {
    id: "leela",
    name: "Lightning Leela",
    initial: "L",
    accent: "var(--error-500)",
    accuracy: 0.75,
    speedMs: { min: 900, max: 1400 },
    tier: 3,
    description: "Lightning fast · don't blink",
    unlockedAfter: "quincy",
  },
  // ─── Tier 4 — The boss ──────────────────────────────────────────────
  {
    id: "meera",
    name: "Master Meera",
    initial: "M",
    accent: "var(--warning-600)",
    accuracy: 0.95,
    speedMs: { min: 1800, max: 2400 },
    tier: 4,
    description: "Quiz champion · the final boss",
    unlockedAfter: "bharat",
  },
];

export function getBotById(id: string): Bot | undefined {
  return BOTS.find((b) => b.id === id);
}

// Next bot in unlock order. Returns the bot that becomes unlocked when `botId`
// is beaten — used for the "X unlocked!" result-screen copy.
export function getBotUnlockedBy(botId: string): Bot | undefined {
  return BOTS.find((b) => b.unlockedAfter === botId);
}

// ─── Progress state ──────────────────────────────────────────────────────────
interface BotProgress {
  beaten: Set<string>;
}

// Module-level state — resets on full page refresh (intentional, mirrors
// games-pass-state pattern so stakeholders can re-walk the unlock flow).
let CURRENT: BotProgress = { beaten: new Set() };

function writeState(next: BotProgress) {
  CURRENT = next;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export interface UseBotProgressReturn {
  beaten: Set<string>;
  isBotUnlocked: (botId: string) => boolean;
  markBotBeaten: (botId: string) => void;
  reset: () => void;
}

export function useBotProgress(): UseBotProgressReturn {
  const [, force] = useState(0);
  useEffect(() => {
    const handler = () => force((n) => n + 1);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  function isBotUnlocked(botId: string): boolean {
    const bot = getBotById(botId);
    if (!bot) return false;
    if (!bot.unlockedAfter) return true;          // Tier 1 always unlocked
    return CURRENT.beaten.has(bot.unlockedAfter); // unlocks when prerequisite is beaten
  }

  function markBotBeaten(botId: string) {
    if (CURRENT.beaten.has(botId)) return;
    const next: BotProgress = { beaten: new Set(CURRENT.beaten) };
    next.beaten.add(botId);
    writeState(next);
  }

  function reset() {
    writeState({ beaten: new Set() });
  }

  return {
    beaten: CURRENT.beaten,
    isBotUnlocked,
    markBotBeaten,
    reset,
  };
}
