/**
 * Game art — per-game inline SVG illustrations rendered inside the GameCard
 * thumbnail + detail-page hero. Each art component takes `accent` (the game's
 * brand color) and fills the parent at 100%×100%. All token-driven; no image
 * assets, no hardcoded brand colors outside the per-call accent argument.
 */

import type { GameArchetype } from "./marketplace-v1";

interface ArtProps {
  accent: string;
}

// 1v1 PvP — two avatars facing off with a lightning bolt between them
function QuizDuelArt({ accent }: ArtProps) {
  return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="qd-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="130" fill="url(#qd-glow)" />
      {/* Left avatar */}
      <circle cx="55" cy="65" r="26" fill={accent} fillOpacity="0.22" stroke={accent} strokeOpacity="0.55" strokeWidth="1.5" />
      <text x="55" y="73" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill={accent}>Y</text>
      {/* Right avatar */}
      <circle cx="145" cy="65" r="26" fill="color-mix(in srgb, var(--white) 8%, transparent)" stroke="color-mix(in srgb, var(--white) 25%, transparent)" strokeWidth="1.5" />
      <text x="145" y="73" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill="color-mix(in srgb, var(--white) 65%, transparent)">A</text>
      {/* Lightning bolt VS */}
      <g transform="translate(100,65)">
        <path
          d="M -4 -16 L 4 -3 L 0 -2 L 5 13 L -3 1 L 1 0 Z"
          fill={accent}
          stroke="color-mix(in srgb, var(--black) 55%, transparent)"
          strokeWidth="1"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
        />
      </g>
    </svg>
  );
}

// Streak — 7-day calendar grid, first 4 days filled, flame at the end
function DailySprintArt({ accent }: ArtProps) {
  return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="ds-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="130" fill="url(#ds-glow)" />
      {/* 7-day streak boxes */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const filled = i < 4;
        const x = 18 + i * 22;
        return (
          <g key={i}>
            <rect
              x={x} y={56}
              width="18" height="18" rx="4"
              fill={filled ? accent : "transparent"}
              stroke={filled ? accent : "color-mix(in srgb, var(--white) 18%, transparent)"}
              strokeWidth="1.5"
              opacity={filled ? 0.85 : 1}
            />
            {filled && (
              <path
                d={`M ${x + 5} 66 L ${x + 8} 69 L ${x + 13} 62`}
                stroke="color-mix(in srgb, var(--black) 60%, transparent)" strokeWidth="2" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
      {/* Flame icon top-right */}
      <g transform="translate(160,32)">
        <path
          d="M 0 -10 C -2 -5, -8 -3, -6 4 C -7 8, -3 12, 0 12 C 3 12, 7 8, 6 4 C 8 -3, 2 -5, 0 -10 Z"
          fill={accent}
          style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
        />
        <path d="M 0 0 C -1 3, -3 5, 0 7 C 3 5, 1 3, 0 0 Z" fill="color-mix(in srgb, var(--white) 60%, transparent)" />
      </g>
      {/* Streak label */}
      <text x="100" y="98" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="11" fill="color-mix(in srgb, var(--white) 70%, transparent)" letterSpacing="0.6">
        DAY 4 OF 7
      </text>
    </svg>
  );
}

// Atom orbit — concept labs
function ConceptLabsArt({ accent }: ArtProps) {
  return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="cl-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="130" fill="url(#cl-glow)" />
      <g transform="translate(100,65)">
        {/* 3 elliptical orbits at different angles */}
        <ellipse cx="0" cy="0" rx="42" ry="16" stroke={accent} strokeOpacity="0.45" strokeWidth="1.2" fill="none" />
        <ellipse cx="0" cy="0" rx="42" ry="16" stroke={accent} strokeOpacity="0.45" strokeWidth="1.2" fill="none" transform="rotate(60)" />
        <ellipse cx="0" cy="0" rx="42" ry="16" stroke={accent} strokeOpacity="0.45" strokeWidth="1.2" fill="none" transform="rotate(-60)" />
        {/* Electrons */}
        <circle cx="42" cy="0" r="3" fill={accent} style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
        <circle cx="-21" cy="36" r="3" fill={accent} style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
        <circle cx="-21" cy="-36" r="3" fill={accent} style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
        {/* Nucleus */}
        <circle cx="0" cy="0" r="8" fill={accent} style={{ filter: `drop-shadow(0 0 10px ${accent})` }} />
        <circle cx="0" cy="0" r="4" fill="color-mix(in srgb, var(--white) 85%, transparent)" />
      </g>
    </svg>
  );
}

// Stopwatch + lightning — brain sprint
function BrainSprintArt({ accent }: ArtProps) {
  return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="bs-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="130" fill="url(#bs-glow)" />
      <g transform="translate(100,68)">
        {/* Stopwatch body */}
        <circle cx="0" cy="0" r="34" stroke={accent} strokeOpacity="0.55" strokeWidth="2" fill="color-mix(in srgb, var(--black) 18%, transparent)" />
        {/* Top stem */}
        <rect x="-6" y="-42" width="12" height="6" rx="2" fill={accent} fillOpacity="0.8" />
        <rect x="-2" y="-47" width="4" height="6" rx="1" fill={accent} />
        {/* Tick marks */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const r1 = 30, r2 = i % 3 === 0 ? 24 : 27;
          const x1 = Math.cos(angle) * r1;
          const y1 = Math.sin(angle) * r1;
          const x2 = Math.cos(angle) * r2;
          const y2 = Math.sin(angle) * r2;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="color-mix(in srgb, var(--white) 35%, transparent)" strokeWidth="1.5" strokeLinecap="round" />;
        })}
        {/* Hand */}
        <line x1="0" y1="0" x2="14" y2="-16" stroke={accent} strokeWidth="2.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
        {/* Center pin */}
        <circle cx="0" cy="0" r="3" fill={accent} />
        {/* Lightning bolt overlay */}
        <path
          d="M 38 -24 L 50 -8 L 44 -6 L 52 8 L 38 -6 L 44 -8 Z"
          fill={accent}
          stroke="color-mix(in srgb, var(--black) 45%, transparent)"
          strokeWidth="1"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
        />
      </g>
    </svg>
  );
}

// Letter tiles — Word Wars
function WordWarsArt({ accent }: ArtProps) {
  const letters = ["W", "O", "R", "D"];
  return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="ww-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.26" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="130" fill="url(#ww-glow)" />
      {/* 4 tiles, slightly fanned */}
      {letters.map((ltr, i) => {
        const cx = 50 + i * 34;
        const rot = (i - 1.5) * 4;
        return (
          <g key={i} transform={`translate(${cx} 65) rotate(${rot})`}>
            <rect x="-16" y="-22" width="32" height="44" rx="6"
              fill={accent} fillOpacity={0.85}
              stroke="color-mix(in srgb, var(--black) 35%, transparent)" strokeWidth="1.2"
              style={{ filter: `drop-shadow(0 4px 8px color-mix(in srgb, var(--black) 45%, transparent))` }}
            />
            <text x="0" y="6" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill="color-mix(in srgb, var(--white) 95%, transparent)">{ltr}</text>
            {/* Tile point value */}
            <text x="11" y="17" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="8" fill="color-mix(in srgb, var(--white) 65%, transparent)">{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Spotlight cone + trophy — Live Quiz Arena
function LiveQuizArenaArt({ accent }: ArtProps) {
  return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="la-glow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
          <stop offset="80%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="la-spot" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="200" height="130" fill="url(#la-glow)" />
      {/* Spotlight cone from top-left */}
      <polygon points="40,0 0,0 0,20 80,130 130,130" fill="url(#la-spot)" opacity="0.6" />
      <polygon points="180,0 200,0 200,30 130,130 100,130" fill="url(#la-spot)" opacity="0.45" />
      {/* Trophy */}
      <g transform="translate(100,68)">
        {/* Trophy bowl */}
        <path
          d="M -18 -16 L 18 -16 L 16 6 C 16 14, 8 18, 0 18 C -8 18, -16 14, -16 6 Z"
          fill={accent}
          stroke="color-mix(in srgb, var(--black) 50%, transparent)" strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 12px ${accent})` }}
        />
        {/* Handles */}
        <path d="M -18 -10 C -26 -10, -28 0, -22 4" stroke={accent} strokeWidth="2.5" fill="none" />
        <path d="M 18 -10 C 26 -10, 28 0, 22 4" stroke={accent} strokeWidth="2.5" fill="none" />
        {/* Base */}
        <rect x="-6" y="18" width="12" height="6" fill={accent} />
        <rect x="-12" y="24" width="24" height="4" rx="2" fill={accent} fillOpacity="0.85" />
        {/* Star on bowl */}
        <text x="0" y="0" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="14" fill="color-mix(in srgb, var(--white) 95%, transparent)">★</text>
      </g>
    </svg>
  );
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
export function GameArt({ archetype, accent }: { archetype: GameArchetype; accent: string }) {
  switch (archetype) {
    case "duel":   return <QuizDuelArt accent={accent} />;
    case "streak": return <DailySprintArt accent={accent} />;
    case "puzzle": return <ConceptLabsArt accent={accent} />;
    case "sprint": return <BrainSprintArt accent={accent} />;
    case "vocab":  return <WordWarsArt accent={accent} />;
    case "live":   return <LiveQuizArenaArt accent={accent} />;
  }
}
