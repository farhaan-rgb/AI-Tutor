/**
 * AI Tutor — prototype hub
 * Landing screen linking the four new AI-tutor concept screens.
 * Not a production screen — a demo index for the crash-course AI-tutor vision work.
 */
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, CheckCircle2, Sparkles, ListChecks, Video } from "lucide-react";
import { StatusBar, Card, StaggerList, StaggerItem, typo } from "../shared/premium-ui";

const FEATURES = [
  {
    path: "/ai-tutor/chapter-home",
    icon: CheckCircle2,
    color: "var(--success)",
    title: "Chapter Home",
    desc: "Real per-topic progress — mastered, in progress, not started — instead of just free / locked.",
  },
  {
    path: "/ai-tutor/explain",
    icon: Sparkles,
    color: "var(--primary)",
    title: "Explain",
    desc: "A scoped, conversational walkthrough of one concept — not a chapter-wide video from minute zero.",
  },
  {
    path: "/ai-tutor/solve",
    icon: ListChecks,
    color: "var(--warning)",
    title: "Solve",
    desc: "Step-by-step problem solving with real checking — catches a specific mistake, not a generic \"wrong.\"",
  },
  {
    path: "/ai-tutor/guided-lesson",
    icon: Video,
    color: "var(--biology)",
    title: "Guided Lesson",
    desc: "The default video walkthrough — now interruptible with a live doubt, mid-lecture.",
  },
];

export function Component() {
  const navigate = useNavigate();

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
      <StatusBar />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: "12px 20px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--foreground)" }} />
        </button>
        <div>
          <p style={typo.pageTitleStyle}>AI Tutor — What&apos;s New</p>
          <p style={typo.metaStyle}>Four prototype screens · Real Numbers, Class 10 Maths</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: "4px 20px 32px" }}>
        <StaggerList className="flex flex-col" style={{ gap: 12 }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={f.path}>
                <Card onClick={() => navigate(f.path)}>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `color-mix(in srgb, ${f.color} 15%, transparent)` }}
                    >
                      <Icon style={{ width: 22, height: 22, color: f.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={typo.cardTitleStyle}>{f.title}</p>
                      <p style={{ ...typo.cardBodyStyle, marginTop: 2 }}>{f.desc}</p>
                    </div>
                    <ChevronRight style={{ width: 18, height: 18, color: "var(--muted-foreground)", flexShrink: 0 }} />
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerList>

        <p style={{ ...typo.metaStyle, marginTop: 20, lineHeight: 1.6 }}>
          These are prototype-only concepts, grounded in an audit of the actual Chiron crash-course
          content and real usage from the live doubt-chat — not shipped features. See the vision
          memo for the full case.
        </p>
      </div>
    </div>
  );
}
