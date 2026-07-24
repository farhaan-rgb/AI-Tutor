import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Check, BookOpen, FlaskConical, Atom, FlaskRound, Sigma, Leaf } from "lucide-react";
import {
  DUMMY_CRASH_COURSE_INFO,
  getCrash1112Info,
  type CrashCourse1112SubjectId,
} from "../shared/classroom-catalog";

const C610 = DUMMY_CRASH_COURSE_INFO;

const SUBJ_ICON_1112: Record<CrashCourse1112SubjectId, typeof Atom> = {
  physics:   Atom,
  chemistry: FlaskRound,
  maths:     Sigma,
  biology:   Leaf,
};

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Branch on URL params: `?sku=` (11–12) takes precedence over `?class=` (6–10 legacy).
  const skuParam = searchParams.get("sku");
  const info1112 = getCrash1112Info(skuParam);
  const is1112 = !!info1112;

  const cls = is1112
    ? info1112!.classLevel
    : parseInt(searchParams.get("class") ?? "8", 10);

  const accent = is1112 ? info1112!.accentColor : C610.accentColor;
  const classroomCount = is1112 ? info1112!.subjects.length : C610.subjects.length;
  const continueQuery = is1112 ? `sku=${info1112!.sku}` : `class=${cls}`;

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", backgroundColor: "var(--background)", overflow: "hidden" }}
    >
      {/* Centered content */}
      <div
        className="flex flex-col items-center"
        style={{ flex: 1, overflowY: "auto", padding: "48px 24px 24px", justifyContent: "center", gap: 32 }}
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.1 }}
          className="flex items-center justify-center"
          style={{
            width: 80, height: 80, borderRadius: 9999, flexShrink: 0,
            backgroundColor: `${accent}1a`,
            border: `2px solid ${accent}`,
          }}
        >
          <Check size={36} style={{ color: accent }} />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col items-center"
          style={{ gap: 8, textAlign: "center" }}
        >
          <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)" }}>
            You're all set!
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            {classroomCount} classrooms have been created for{" "}
            {is1112 ? `Class ${cls} ${info1112!.streamLabel}` : `Class ${cls}`}
          </span>
        </motion.div>

        {/* Classroom cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="flex flex-col"
          style={{ gap: 12, width: "100%" }}
        >
          {is1112
            ? info1112!.subjects.map((sub) => {
                const Icon = SUBJ_ICON_1112[sub.id];
                return (
                  <div
                    key={sub.id}
                    className="flex items-center"
                    style={{
                      gap: 16, padding: 16, borderRadius: 12,
                      backgroundColor: "var(--card)",
                      border: "0.5px solid var(--border)",
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${sub.accent}14` }}
                    >
                      <Icon size={20} style={{ color: sub.accent }} />
                    </div>
                    <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                        {sub.title}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                        Class {cls} · {sub.chapters} chapters
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        paddingLeft: 8, paddingRight: 8, height: 24, borderRadius: 6,
                        backgroundColor: `${accent}14`,
                      }}
                    >
                      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: accent, letterSpacing: "0.04em" }}>
                        READY
                      </span>
                    </div>
                  </div>
                );
              })
            : C610.subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center"
                  style={{
                    gap: 16, padding: 16, borderRadius: 12,
                    backgroundColor: "var(--card)",
                    border: "0.5px solid var(--border)",
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${sub.accent}14` }}
                  >
                    {sub.id === "maths"
                      ? <BookOpen size={20} style={{ color: sub.accent }} />
                      : <FlaskConical size={20} style={{ color: sub.accent }} />
                    }
                  </div>
                  <div className="flex flex-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                      {sub.title}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                      Class {cls} · {sub.chapters} chapters
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      paddingLeft: 8, paddingRight: 8, height: 24, borderRadius: 6,
                      backgroundColor: `${accent}14`,
                    }}
                  >
                    <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: accent, letterSpacing: "0.04em" }}>
                      READY
                    </span>
                  </div>
                </div>
              ))}
        </motion.div>
      </div>

      {/* Bottom buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col shrink-0"
        style={{
          padding: "0 24px",
          paddingBottom: "calc(32px + env(safe-area-inset-bottom))" as unknown as number,
          gap: 12,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(
            skuParam === "ncert-10-maths" ? "/ai-tutor/chapter-home" : `/crash-course-hub?${continueQuery}`,
            { replace: true }
          )}
          className="flex items-center justify-center"
          style={{
            width: "100%", height: 52, borderRadius: 14,
            backgroundColor: "var(--primary)", border: "none",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--primary-foreground)" }}>
            Start Learning
          </span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/", { replace: true })}
          className="flex items-center justify-center"
          style={{
            width: "100%", height: 44, borderRadius: 12,
            backgroundColor: "transparent", border: "none",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}>
            Close
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}
