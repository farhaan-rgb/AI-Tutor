/**
 * Games Pass state — single-SKU pass tracked in module-level memory so the
 * demo resets to "not purchased" on every full page refresh. Stakeholders
 * can re-walk the buy flow repeatedly without dev-tool resets.
 *
 * One pass unlocks all 6 games + future games + live events for the duration
 * (3 months at launch). Pricing lives in marketplace-v1.tsx GAMES_PASS const.
 *
 * State propagates across components via a `games-pass-change` window event
 * (since module variables don't auto-trigger re-renders).
 */

import { useState, useEffect } from "react";

const EVENT_NAME = "games-pass-change";

export interface GamesPassState {
  active: boolean;
  purchasedAt: number | null;   // epoch ms
  expiresAt: number | null;     // epoch ms — pass auto-expires when reached
  // Per-game round counter — drives the trial gate so it fires AFTER the
  // promised number of free rounds, not after every result screen.
  playsByGame: Record<string, number>;
}

const DEFAULT_STATE: GamesPassState = {
  active: false,
  purchasedAt: null,
  expiresAt: null,
  playsByGame: {},
};

// Module-level state — survives navigation, resets on full page refresh.
let CURRENT: GamesPassState = DEFAULT_STATE;

function readState(): GamesPassState {
  if (CURRENT.expiresAt && CURRENT.expiresAt < Date.now()) return DEFAULT_STATE;
  return CURRENT;
}

function writeState(state: GamesPassState) {
  CURRENT = state;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export interface UseGamesPassReturn extends GamesPassState {
  daysLeft: number;
  formattedExpiry: string | null;   // "21 Aug 2026"
  formattedPurchasedAt: string | null;
  activate: (months?: number) => void;
  reset: () => void;
  // Increment the round counter for a game once per played round.
  trackPlay: (gameId: string) => void;
  // Convenience getter — current play count for a game (0 if never played).
  playsFor: (gameId: string) => number;
  // True when user has consumed >= trialLevels rounds and has no active pass.
  trialExhausted: (gameId: string, trialLevels: number) => boolean;
}

export function useGamesPass(): UseGamesPassReturn {
  const [state, setState] = useState<GamesPassState>(readState);

  useEffect(() => {
    const handler = () => setState(readState());
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const daysLeft = state.expiresAt
    ? Math.max(0, Math.ceil((state.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const fmt = (n: number) =>
    new Date(n).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return {
    ...state,
    daysLeft,
    formattedExpiry:      state.expiresAt    ? fmt(state.expiresAt)    : null,
    formattedPurchasedAt: state.purchasedAt  ? fmt(state.purchasedAt)  : null,
    activate: (months: number = 3) => {
      const now = Date.now();
      writeState({
        ...CURRENT,
        active: true,
        purchasedAt: now,
        expiresAt: now + months * 30 * 24 * 60 * 60 * 1000,
      });
    },
    reset: () => writeState(DEFAULT_STATE),
    trackPlay: (gameId: string) => {
      writeState({
        ...CURRENT,
        playsByGame: {
          ...CURRENT.playsByGame,
          [gameId]: (CURRENT.playsByGame[gameId] ?? 0) + 1,
        },
      });
    },
    playsFor: (gameId: string) => state.playsByGame[gameId] ?? 0,
    trialExhausted: (gameId: string, trialLevels: number) =>
      !state.active && (state.playsByGame[gameId] ?? 0) >= trialLevels,
  };
}
