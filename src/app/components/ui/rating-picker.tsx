/**
 * RatingPicker — 5-tap rating picker, two variants:
 *   - "star": classic 5-star (used by Reviews — counts toward review average)
 *   - "face": 5-face mood (used by Live-class feedback — Angry → Laugh)
 *
 * 44px touch targets per CTA rule, AntD warning-500 fill on star, AntD-token
 * per-rating tint on face. Whole row uses flex justify-between so the 5 taps
 * span the available width on mobile.
 */

import { motion } from "motion/react";
import { Star, Frown, Meh, Smile, Laugh, Angry } from "lucide-react";

export type RatingVariant = "star" | "face";

interface Props {
  value: number;          // 0..5 (0 = no selection)
  onChange: (value: number) => void;
  variant?: RatingVariant;
  size?: number;          // icon size, default 32
  // Optional labels rendered directly under each icon. Required for clean
  // alignment — when omitted, the caller must NOT add a separate label row.
  labels?: readonly [string, string, string, string, string];
}

const FACE_ICONS = [Angry, Frown, Meh, Smile, Laugh];
const FACE_COLORS = [
  "var(--error-500)",       // 1 — angry
  "var(--error-500)",       // 2 — frown
  "var(--warning-500)",     // 3 — meh
  "var(--success-500)",     // 4 — smile
  "var(--success-500)",     // 5 — laugh
];

export function RatingPicker({ value, onChange, variant = "star", size = 32, labels }: Props) {
  return (
    <div
      className="flex items-start justify-between"
      style={{ paddingLeft: 4, paddingRight: 4 }}
      role="radiogroup"
      aria-label={variant === "star" ? "Rating" : "How was it"}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const selected = i <= value;
        const exact = i === value;
        const Icon = variant === "face" ? FACE_ICONS[i - 1] : Star;
        const tint = variant === "face" ? FACE_COLORS[i - 1] : "var(--warning-500)";
        const iconColor = variant === "face"
          ? (exact ? tint : "var(--muted-foreground)")
          : (selected ? tint : "var(--muted-foreground)");
        const showLabel = !!labels;
        // Stacked column = icon button + (optional) label. Each column is
        // 44px wide so both align exactly — no math mismatch between rows.
        return (
          <div key={i} className="flex flex-col items-center" style={{ gap: 6, width: 44 }}>
            <motion.button
              type="button"
              role="radio"
              aria-checked={exact}
              whileTap={{ scale: variant === "face" ? 0.88 : 0.85 }}
              animate={{ scale: exact ? (variant === "face" ? 1.18 : 1.12) : 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 20 }}
              onClick={() => onChange(i)}
              style={{
                width: 44, height: 44, borderRadius: 9999, border: "none",
                backgroundColor: variant === "face" && exact
                  ? `color-mix(in srgb, ${tint} 22%, transparent)`
                  : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", padding: 0,
              }}
            >
              <Icon
                size={size}
                fill={variant === "star" && selected ? "var(--warning-500)" : "none"}
                strokeWidth={variant === "face" && exact ? 2.5 : 1.75}
                style={{ color: iconColor, transition: "color 0.15s ease" }}
              />
            </motion.button>
            {showLabel && (
              <span style={{
                fontSize: "var(--text-2xs)",
                fontWeight: exact ? 700 : 500,
                color: exact ? "var(--foreground)" : "var(--muted-foreground)",
                textAlign: "center",
                transition: "color 0.15s ease",
                whiteSpace: "nowrap",
              }}>
                {labels[i - 1]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Optional labels under a face picker. Caller renders these aligned with picks.
export const FACE_LABELS = ["Poor", "Not great", "OK", "Good", "Great"] as const;
