/**
 * AI Tutor prototype — Social Science subject picker
 * Reached by tapping the "Class X Social" card on Discover (marketplace-v1.tsx).
 * Social Science isn't one NCERT course the way Maths/Science are — it's four
 * separate real books (History, Geography, Political Science, Economics), each
 * its own sku/course underneath. This screen is the one extra tap between
 * Discover and picking which of the four to actually open — same card-grid
 * pattern as Discover's own course list, just scoped to these four skus.
 */
import { useNavigate } from "react-router";
import { ArrowLeft, Sparkles, Landmark, Globe, Scale, TrendingUp } from "lucide-react";
import { StatusBar, typo } from "../shared/premium-ui";
import { SOCIAL_SCIENCE_SKUS, DUMMY_CRASH_COURSES_1112, getCrash1112Info } from "../shared/classroom-catalog";

const SUBJECT_ICON: Record<string, typeof Landmark> = {
  "ncert-10-history": Landmark,
  "ncert-10-geography": Globe,
  "ncert-10-political-science": Scale,
  "ncert-10-economics": TrendingUp,
};

export function Component() {
  const navigate = useNavigate();

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
      <StatusBar />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: "10px 20px 12px" }}>
        <button onClick={() => navigate(-1)} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}>
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--foreground)" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ ...typo.metaStyle, marginBottom: 1 }}>Class X · Social Science</p>
          <p style={typo.pageTitleStyle}>Choose a subject</p>
        </div>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />

      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 24px" }}>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", marginBottom: 12 }}>
          Social Science is four separate NCERT books — pick one to start.
        </p>
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          {SOCIAL_SCIENCE_SKUS.map((sku) => {
            const info = getCrash1112Info(sku) ?? DUMMY_CRASH_COURSES_1112[sku];
            const subject = info.subjects[0];
            const accent = subject.accent;
            const Icon = SUBJECT_ICON[sku] ?? Landmark;
            const isEnrolled = localStorage.getItem(`cc_enrolled_${sku}`) === "1";
            return (
              <button
                key={sku}
                onClick={() => navigate(isEnrolled ? "/classes-v1?demo=ai-tutor" : `/ai-tutor/curriculum-preview?demo=ai-tutor&sku=${sku}`)}
                className="flex flex-col text-left min-w-0"
                style={{ borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: "100%", height: 90, background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, #0a0612) 0%, color-mix(in srgb, ${accent} 45%, #0a0612) 100%)` }}
                >
                  <Icon style={{ width: 28, height: 28, color: "rgba(255,255,255,0.85)" }} />
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", display: "block", marginBottom: 2 }}>
                    {subject.title}
                  </span>
                  <span className="truncate" style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", display: "block", marginBottom: 10 }}>
                    Full NCERT Syllabus
                  </span>
                  <div className="flex items-center justify-center gap-1.5" style={{ height: 34, borderRadius: "var(--radius-button)", background: accent, color: "var(--white)" }}>
                    <Sparkles style={{ width: 13, height: 13 }} />
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)" }}>{isEnrolled ? "Continue" : "View"}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
