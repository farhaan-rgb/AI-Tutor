/**
 * Arena Review — the post-arena learning loop (E7-1). After a run, walk your
 * missed questions with the correct answer + a one-line explanation, grouped
 * weak-area concepts up top. Completing the review grants a one-time XP bonus,
 * turning competition into learning.
 *
 * Route: /arena/review  (·?mode=event for a weekend-event run)
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Check, X, GraduationCap, Sparkles } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { useArenaState, weakConcepts, type ReviewItem } from "../shared/arena";
import { OlympiadHeader, OlympiadTag } from "./olympiad-ui";
import { arenaBack } from "./arena-ui";

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, markReviewed } = useArenaState();
  const isEvent = params.get("mode") === "event";

  const source = isEvent ? state.eventEntry : state.lastResult;
  const review: ReviewItem[] = source?.review ?? [];
  const reviewed = !!source?.reviewed;
  // Review is for learning, not points — you climb levels by clearing questions in
  // a run, never by reviewing. So no XP is promised here (matches the result screen).
  const xpReward = 0;
  const backTo = isEvent ? "/arena/result?mode=event" : "/arena/result";

  useEffect(() => {
    if (!source || review.length === 0) navigate("/arena", { replace: true });
  }, [source, review.length, navigate]);
  if (!source || review.length === 0) return null;

  const misses = review.filter((r) => r.picked !== r.correct);
  const weak = weakConcepts(review);
  const perfect = misses.length === 0;

  function done() {
    if (!reviewed) markReviewed(isEvent ? "event" : "sprint");
    navigate(backTo, { replace: true });
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="Review" onBack={() => arenaBack(navigate, backTo)} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 120px", gap: 16 }}>
        {/* Weak-area summary */}
        {perfect ? (
          <div className="flex items-center" style={{ gap: 12, padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid color-mix(in srgb, var(--success-500) 40%, var(--border))" }}>
            <Sparkles size={20} style={{ color: "var(--success-500)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>Perfect run — nothing missed. Here's the full set anyway.</span>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 10, padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Focus areas</span>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {weak.map((w) => (
                <OlympiadTag key={w.concept} label={w.misses > 1 ? `${w.concept} · ${w.misses}` : w.concept} variant="error" />
              ))}
            </div>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{misses.length} to review — getting these right next time is how you improve.</span>
          </div>
        )}

        {/* Missed questions (then correct ones, collapsed-feel) */}
        {[...misses, ...review.filter((r) => r.picked === r.correct)].map((item, i) => (
          <ReviewCard key={i} item={item} />
        ))}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0" style={{
        backdropFilter: "blur(16px)", backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
        borderTop: "0.5px solid var(--border)", padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
      }}>
        <div className="w-full max-w-2xl mx-auto">
          <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={done}
            className="flex items-center justify-center w-full"
            style={{ height: 44, borderRadius: 12, gap: 8, border: "none", cursor: "pointer", backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
            <GraduationCap size={16} style={{ color: "var(--white)" }} />
            {reviewed ? "Done" : xpReward > 0 ? `Done · +${xpReward} XP` : "Done"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const missed = item.picked !== item.correct;
  return (
    <div className="flex flex-col" style={{ gap: 12, padding: 16, borderRadius: 12, backgroundColor: "var(--card)", border: "0.5px solid var(--border)" }}>
      <div className="flex items-start justify-between" style={{ gap: 12 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)", lineHeight: 1.4 }}>{item.prompt}</span>
        <OlympiadTag label={item.concept} variant="neutral" />
      </div>

      <div className="flex flex-col" style={{ gap: 6 }}>
        {item.options.map((opt, idx) => {
          const isCorrect = idx === item.correct;
          const isPicked = idx === item.picked;
          let bg = "transparent", border = "0.5px solid var(--border)", fg = "var(--muted-foreground)";
          if (isCorrect) { bg = "color-mix(in srgb, var(--success-500) 12%, transparent)"; border = "1px solid var(--success-500)"; fg = "var(--success-500)"; }
          else if (isPicked) { bg = "color-mix(in srgb, var(--error-500) 12%, transparent)"; border = "1px solid var(--error-500)"; fg = "var(--error-500)"; }
          return (
            <div key={idx} className="flex items-center justify-between" style={{ padding: "8px 12px", borderRadius: 8, gap: 8, backgroundColor: bg, border }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: isCorrect || isPicked ? 600 : 500, color: fg }}>{opt}</span>
              {isCorrect && <Check size={15} style={{ color: "var(--success-500)", flexShrink: 0 }} />}
              {isPicked && !isCorrect && <X size={15} style={{ color: "var(--error-500)", flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <div className="flex items-start" style={{ gap: 8, padding: "10px 12px", borderRadius: 8, backgroundColor: "var(--card-bg-secondary)" }}>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: missed ? "var(--warning-500)" : "var(--success-500)", textTransform: "uppercase", letterSpacing: 0.4, flexShrink: 0, marginTop: 2 }}>Why</span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{item.explanation}</span>
      </div>
    </div>
  );
}
