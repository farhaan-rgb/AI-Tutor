/**
 * Olympiad Feedback (P1) — structured post-event CSAT. Star rating + perceived
 * difficulty + what-was-hard chips + free text → a thank-you state. Captures the
 * signal product needs to tune future Olympiads.
 *
 * TODO(api): POST /api/olympiads/:id/feedback { rating, difficulty, tags, note }
 *
 * Route: /olympiad/:olympiadId/feedback
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { Star, CheckCircle2 } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { getOlympiadById } from "../shared/olympiads";
import { OlympiadHeader, olympiadBack } from "./olympiad-ui";

const DIFFICULTY = ["Too easy", "Just right", "Too hard"];
const TAGS = ["Time was tight", "Confusing questions", "UI/UX", "Network issues", "Too lengthy", "Loved it"];

export function Component() {
  const navigate = useNavigate();
  const { olympiadId } = useParams<{ olympiadId: string }>();
  const o = olympiadId ? getOlympiadById(olympiadId) : undefined;

  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!o) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)" }}>
        <span style={{ color: "var(--foreground)" }}>Olympiad not found</span>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)", padding: 24, gap: 16 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
          <CheckCircle2 size={80} style={{ color: "var(--success-500)" }} />
        </motion.div>
        <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)" }}>Thanks for the feedback!</span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 300 }}>
          It directly shapes the next Olympiad. See you on the leaderboard.
        </span>
        <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => navigate(`/olympiad/${o.id}/result`)}
          style={{ height: 44, padding: "0 24px", borderRadius: 12, border: "none", marginTop: 4, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)", backgroundColor: "var(--primary-500)", cursor: "pointer" }}>
          Back to result
        </motion.button>
      </div>
    );
  }

  const canSubmit = rating > 0;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="Feedback" onBack={() => olympiadBack(navigate, `/olympiad/${o.id}/result`)} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 120px", gap: 20 }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
          How was {o.examLabel}?
        </span>

        {/* Stars */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>Overall experience</span>
          <div className="flex" style={{ gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="flex items-center justify-center" style={{ width: 44, height: 44, background: "none", border: "none", cursor: "pointer" }}>
                <Star size={32} style={{ color: n <= rating ? "var(--warning-500)" : "var(--muted-foreground)" }}
                  fill={n <= rating ? "var(--warning-500)" : "none"} />
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>Difficulty</span>
          <div className="flex" style={{ gap: 8 }}>
            {DIFFICULTY.map((d) => {
              const active = difficulty === d;
              return (
                <button key={d} type="button" aria-pressed={active} onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1, height: 40, borderRadius: 12, cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600,
                    color: active ? "var(--white)" : "var(--foreground)",
                    backgroundColor: active ? "var(--primary-500)" : "var(--card-bg-secondary)",
                    border: `0.5px solid ${active ? "var(--primary-500)" : "var(--border)"}`,
                  }}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>What stood out? (optional)</span>
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {TAGS.map((t) => {
              const active = tags.includes(t);
              return (
                <button key={t} type="button" aria-pressed={active}
                  onClick={() => setTags((p) => active ? p.filter((x) => x !== t) : [...p, t])}
                  style={{
                    height: 36, padding: "0 16px", borderRadius: 9999, cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: 600,
                    color: active ? "var(--white)" : "var(--muted-foreground)",
                    backgroundColor: active ? "var(--primary-500)" : "var(--card-bg-secondary)",
                    border: `0.5px solid ${active ? "var(--primary-500)" : "var(--border)"}`,
                  }}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <label className="flex flex-col" style={{ gap: 8 }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-foreground)" }}>Anything else? (optional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Tell us more…"
            style={{
              padding: 12, borderRadius: 12, resize: "none",
              backgroundColor: "var(--card-bg-secondary)", border: "0.5px solid var(--border)",
              color: "var(--foreground)", fontSize: "var(--text-sm)", outline: "none", fontFamily: "var(--font-family-inter)",
            }} />
        </label>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0" style={{
        backdropFilter: "blur(16px)", backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
        borderTop: "0.5px solid var(--border)", padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
      }}>
        <div className="w-full max-w-2xl mx-auto">
          <motion.button type="button" whileTap={canSubmit ? { scale: 0.98 } : undefined}
            onClick={() => canSubmit && setSubmitted(true)} disabled={!canSubmit}
            className="flex items-center justify-center w-full"
            style={{
              height: 44, borderRadius: 12, border: "none", fontSize: "var(--text-sm)", fontWeight: 600,
              cursor: canSubmit ? "pointer" : "default",
              color: canSubmit ? "var(--white)" : "var(--disabled-text)",
              backgroundColor: canSubmit ? "var(--primary-500)" : "var(--disabled-bg)",
            }}>
            Submit feedback
          </motion.button>
        </div>
      </div>
    </div>
  );
}
