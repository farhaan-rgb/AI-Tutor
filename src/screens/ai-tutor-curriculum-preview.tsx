/**
 * AI Tutor prototype — Curriculum preview (pre-enrollment)
 * Reached from crash-course-detail.tsx's "Curriculum" button before the student
 * has enrolled. Shows the real 14-chapter NCERT syllabus with Chapter 1 open for
 * a full free preview; Chapters 2-14 stay locked until enrollment. Deliberately
 * has no progress data (Concepts explained / Problems solved) — nothing has been
 * attempted yet, so showing fabricated percentages here would misrepresent state.
 */
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Lock, Sparkles, ChevronRight, Info, Clock, ListChecks } from "lucide-react";
import { StatusBar, typo } from "../shared/premium-ui";
import { DUMMY_CRASH_COURSES_1112, getCrash1112Info } from "../shared/classroom-catalog";
import { FloatingAITutor } from "../shared/floating-ai-tutor";

const DEFAULT_SKU = "ncert-10-maths";
const CRASH_PRICE = 999;
const CRASH_ORIGINAL_PRICE = 1999;

// The student is already curious enough to have tapped through from
// Discover/the home banner — this is the highest-intent moment before
// Enroll Now, so unlike the one-line card hooks (marketplace-v1.tsx,
// classes-v1.tsx), it's safe to spell out the real value props explicitly
// as short outcome statements rather than a single teaser line. Icon +
// text pairs are used here so it also holds up as three quick visual scans
// on the mobile screen, not just a paragraph. Kept to 3 — every value prop
// from the same underlying pitch (real problem-solving, real availability,
// real complete coverage), not a longer feature list.
const VALUE_PROPS = [
  { icon: Sparkles, text: "Solves every problem step by step — and tells you exactly what to fix if you get stuck" },
  { icon: Clock, text: "Available anytime — no waiting for tuition hours to ask a question" },
  { icon: ListChecks, text: "Every real question from the book, so nothing in it can surprise you on exam day" },
];

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sku = params.get("sku") ?? DEFAULT_SKU;
  const course = getCrash1112Info(sku) ?? DUMMY_CRASH_COURSES_1112[DEFAULT_SKU];
  const subject = course.subjects[0];
  const chapters = subject.chapterList;
  const discountPct = Math.round((1 - CRASH_PRICE / CRASH_ORIGINAL_PRICE) * 100);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
      <StatusBar />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: "10px 20px 12px" }}>
        <button onClick={() => navigate(-1)} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}>
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--foreground)" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ ...typo.metaStyle, marginBottom: 1 }}>Class 10 · {subject.title}</p>
          <p style={typo.pageTitleStyle}>Curriculum</p>
        </div>
        <button
          onClick={() => navigate(`/crash-course-detail?sku=${sku}&demo=ai-tutor`)}
          className="flex items-center justify-center shrink-0"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}
          aria-label="Course details"
        >
          <Info style={{ width: 18, height: 18, color: "var(--foreground)" }} />
        </button>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />

      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 24px" }}>
        <div
          className="flex items-center gap-2"
          style={{ padding: "10px 14px", borderRadius: 10, background: "var(--primary-950, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)", marginBottom: 16 }}
        >
          <Sparkles style={{ width: 15, height: 15, color: "var(--primary)", flexShrink: 0 }} />
          <span style={{ ...typo.metaStyle, color: "var(--foreground)" }}>
            Chapter 1 is free to explore in full. Enroll to unlock Chapters 2–{chapters.length}.
          </span>
        </div>

        <div className="flex flex-col" style={{ gap: 10, marginBottom: 18 }}>
          {VALUE_PROPS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start" style={{ gap: 10 }}>
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 26, height: 26, borderRadius: 8, marginTop: 1, background: "color-mix(in srgb, var(--primary) 14%, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}
              >
                <Icon style={{ width: 13, height: 13, color: "var(--primary)" }} />
              </div>
              <span style={{ ...typo.cardBodyStyle, fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col" style={{ gap: 8 }}>
          {chapters.map((title, i) => {
            const isFree = i === 0;
            return (
              <button
                key={title}
                onClick={() => navigate(`/ai-tutor/chapter-home?chapter=${i}&preview=1&sku=${sku}`)}
                className="flex items-center w-full text-left"
                style={{
                  gap: 12, padding: "14px 14px", borderRadius: 12,
                  background: isFree ? "var(--card)" : "var(--card-bg-secondary)",
                  border: isFree ? "1px solid var(--primary)" : "1px solid var(--border)",
                  opacity: isFree ? 1 : 0.7,
                  cursor: "pointer",
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 28, height: 28, borderRadius: 10,
                    background: isFree ? "var(--primary)" : "color-mix(in srgb, var(--primary) 14%, var(--card))",
                    border: isFree ? "none" : "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
                  }}
                >
                  {isFree
                    ? <span style={{ fontSize: 12, fontWeight: 700, color: "var(--white)" }}>1</span>
                    : <Lock style={{ width: 12, height: 12, color: "var(--primary)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)", color: isFree ? "var(--foreground)" : "var(--muted-foreground)" }}>
                    {title}
                  </p>
                  {isFree && (
                    <div
                      className="flex items-center justify-center"
                      style={{ marginTop: 4, height: 18, padding: "0 8px", borderRadius: 6, background: "color-mix(in srgb, var(--primary) 16%, transparent)", width: "fit-content" }}
                    >
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary)", letterSpacing: 0.4 }}>FREE</span>
                    </div>
                  )}
                </div>
                <ChevronRight style={{ width: 16, height: 16, color: "var(--muted-foreground)", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex items-center justify-between shrink-0"
        style={{
          padding: "12px 16px calc(20px + env(safe-area-inset-bottom)) 16px",
          backgroundColor: "var(--card)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="flex flex-col" style={{ gap: 2 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
              &#x20B9;{CRASH_PRICE.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center justify-center" style={{ paddingLeft: 8, paddingRight: 8, height: 22, borderRadius: 6, backgroundColor: "var(--warning-alpha-15)", border: "1px solid var(--warning-alpha-30)" }}>
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--warning-600)" }}>{discountPct}% off</span>
            </div>
          </div>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textDecoration: "line-through" }}>
            &#x20B9;{CRASH_ORIGINAL_PRICE.toLocaleString("en-IN")}
          </span>
        </div>
        <button
          onClick={() => navigate(`/crash-course-enrolled?sku=${sku}`)}
          className="flex items-center justify-center"
          style={{ height: 40, width: 140, borderRadius: 12, background: "var(--primary)", border: "none", cursor: "pointer" }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>Enroll Now</span>
        </button>
      </div>

      {/* A student browsing this subject's chapter list might actually need
          a different chapter (or a different subject entirely) — same
          unified assistant as AppLayout (no chapterContext, so navigation-
          only here), not a scoped-down variant, since jumping across
          subjects from here is still useful, not confusing. */}
      <FloatingAITutor />
    </div>
  );
}
