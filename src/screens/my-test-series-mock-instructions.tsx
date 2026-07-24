/**
 * My Test Series — Mock Instructions (pre-test screen)
 * Route: /my-test-series/:packId/mock/:mockId/instructions
 *
 * Mirrors the pre-test screen on the real NTA portal: pattern + mechanics +
 * declaration + Start. Designed to be familiar to students who've used the
 * actual exam interface.
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Hash,
  Target,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { GlassHeader, StatusBar, typo } from "../shared/premium-ui";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { getPackById, getAttemptById, getMarkingScheme, type ExamType } from "../shared/test-series-progress";

interface InstructionItem {
  heading: string;
  body: string;
}

// Exam-specific instructions — each portal has its own marking rules + section
// behaviour. Copy lifted/adapted from the real portal's General Instructions.
const INSTRUCTIONS_BY_EXAM: Record<ExamType, InstructionItem[]> = {
  nta: [
    { heading: "Server-synced timer.", body: "The countdown at the top of the screen is set on the server. Tab switches and browser refreshes do not pause it." },
    { heading: "Marking scheme.", body: "+4 for every correct response. −1 for every incorrect MCQ. Numerical (NAT) questions carry no negative marking." },
    { heading: "Section navigation.", body: "You may switch between sections freely throughout the test. The question palette on the side tracks status of every question." },
    { heading: "Status colours.", body: "" },
    { heading: "Final submission.", body: "Submit is irreversible. Once submitted, no responses can be modified. The test will auto-submit when time expires." },
  ],
  cat: [
    { heading: "Sectional time limits.", body: "Each section has its own 40-minute timer. You cannot return to a section once its time expires or you advance manually." },
    { heading: "Marking scheme.", body: "+3 for every correct response. −1 for every incorrect response in MCQ. TITA (type-in) questions carry no negative marking." },
    { heading: "On-screen calculator.", body: "A basic calculator is available throughout the test. Personal calculators are not permitted." },
    { heading: "Status colours.", body: "" },
    { heading: "Final submission.", body: "Submit is irreversible. The test auto-submits when the total duration expires." },
  ],
  upsc: [
    { heading: "OMR-style paper.", body: "All questions are multiple choice (MCQ). Mark exactly one option per question." },
    { heading: "Marking scheme.", body: "+2 for every correct response. −0.66 (one-third penalty) for every incorrect response. Unanswered questions carry no penalty." },
    { heading: "Single section.", body: "No section locks. Navigate freely between questions in any order." },
    { heading: "Status colours.", body: "" },
    { heading: "Final submission.", body: "Submit is irreversible. The test auto-submits when the duration expires." },
  ],
  clat: [
    { heading: "Passage-based grouping.", body: "Questions are grouped under reading passages. Read the passage carefully before attempting the questions below it." },
    { heading: "Marking scheme.", body: "+1 for every correct response. −0.25 for every incorrect response. Unanswered questions carry no penalty." },
    { heading: "Section navigation.", body: "You may switch between sections freely. The palette tracks question status across all sections." },
    { heading: "Status colours.", body: "" },
    { heading: "Final submission.", body: "Submit is irreversible. The test auto-submits at the end of the duration." },
  ],
  ssc: [
    { heading: "Sectional with free navigation.", body: "Questions are grouped by section but you may move between them freely. No section locks." },
    { heading: "Marking scheme.", body: "+2 for every correct response. −0.5 for every incorrect response. Unanswered questions carry no penalty." },
    { heading: "Section navigation.", body: "Switch sections via the section tabs at the top. Palette tracks progress across all sections." },
    { heading: "Status colours.", body: "" },
    { heading: "Final submission.", body: "Submit is irreversible. The test auto-submits when the duration expires." },
  ],
  ibps: [
    { heading: "Section-wise time limits.", body: "Each section has its own time allocation. Once the section time expires, the test moves to the next section automatically." },
    { heading: "Marking scheme.", body: "+1 for every correct response. −0.25 for every incorrect response in MCQ. Unanswered questions carry no penalty." },
    { heading: "Section navigation.", body: "Cannot return to a previous section once its time expires or you advance manually." },
    { heading: "Status colours.", body: "" },
    { heading: "Final submission.", body: "Submit is irreversible. The test auto-submits at the end of the final section." },
  ],
};

const PALETTE_LEGEND = [
  { label: "Answered",    color: "var(--success-500)" },
  { label: "Marked",      color: "var(--warning-500)" },
  { label: "Both",        color: "var(--mark-review-500)" },
  { label: "Not visited", color: "var(--muted-foreground)" },
];

const EXAM_PATTERN_LABEL: Record<ExamType, string> = {
  nta:  "NTA pattern",
  cat:  "IIM CAT pattern",
  upsc: "UPSC Prelims pattern",
  clat: "CLAT consortium pattern",
  ssc:  "SSC CGL pattern",
  ibps: "IBPS / SBI pattern",
};

export function Component() {
  const navigate = useNavigate();
  const params = useParams<{ packId: string; mockId: string }>();
  const [agreed, setAgreed] = useState(false);
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  const pack = params.packId ? getPackById(params.packId) : undefined;
  const mock = pack && params.mockId ? getAttemptById(pack, params.mockId) : undefined;

  if (!pack || !mock) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", backgroundColor: "var(--background)", padding: 24, gap: 12 }}>
        <span style={{ fontSize: "var(--text-base)", color: "var(--foreground)", fontWeight: 600 }}>Mock not found</span>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--primary-300)", cursor: "pointer" }}>Back</button>
      </div>
    );
  }

  const accent = pack.examAccent;
  // Use the actual exam's marking scheme — JEE 4·90=360, NEET 4·180=720, CAT 3·66=198, UPSC 2·100=200, etc.
  const marking = getMarkingScheme(pack.examType);
  const totalMarks = pack.maxScore ?? Math.round(mock.questionCount * marking.correct);
  const instructions = INSTRUCTIONS_BY_EXAM[pack.examType] ?? INSTRUCTIONS_BY_EXAM.nta;
  const patternLabel = EXAM_PATTERN_LABEL[pack.examType] ?? "Standard pattern";

  // ─── DESKTOP — real exam portal layout ────────────────────────────────────
  if (isDesktop) {
    return (
      <DesktopInstructions
        pack={pack}
        mock={mock}
        accent={accent}
        totalMarks={totalMarks}
        instructions={instructions}
        patternLabel={patternLabel}
        agreed={agreed}
        onToggleAgreed={() => setAgreed((v) => !v)}
        onStart={() => navigate(`/my-test-series/${pack.packId}/mock/${mock.id}/take`)}
        onBack={() => navigate(-1)}
      />
    );
  }

  // ─── MOBILE — existing responsive design ──────────────────────────────────
  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ minHeight: 56, paddingLeft: 4, paddingRight: 16, paddingTop: 8, paddingBottom: 8, gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <ArrowLeft size={20} style={{ color: "var(--foreground)" }} />
          </motion.button>
          <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--foreground)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.25,
            }}>
              Instructions
            </span>
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-xs)",
              color: "var(--muted-foreground)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}>
              {pack.examLabel} · Mock {mock.number} of {pack.totalMocks}
            </span>
          </div>
        </div>
      </GlassHeader>

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: "20px 16px 120px" }}>
        {/* Official mock badge — exam-specific seal */}
        <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
          <ShieldCheck size={12} style={{ color: accent }} />
          <span style={{
            fontSize: "var(--text-2xs)",
            fontWeight: 700,
            color: accent,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Official Mock · {patternLabel}
          </span>
        </div>

        {/* Mock identity */}
        <div className="flex flex-col" style={{ gap: 4, marginBottom: 20 }}>
          <span style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--foreground)",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            {mock.title}
          </span>
          <span style={{ ...typo.metaStyle }}>
            {pack.sections.join(" · ")}
          </span>
        </div>

        {/* ── At a glance — flat 2×2 stat tiles, document-style ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 24,
            borderRadius: 12,
            backgroundColor: "var(--card)",
            border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
            overflow: "hidden",
          }}
        >
          <StatCell Icon={Clock}         label="Duration"  value={`${mock.durationMinutes}`} unit="min"           accent={accent} divider="right-bottom" />
          <StatCell Icon={Hash}          label="Questions" value={`${mock.questionCount}`}    unit="total"         accent={accent} divider="bottom" />
          <StatCell Icon={Target}        label="Max marks" value={`${totalMarks}`}            unit="pts"           accent={accent} divider="right" />
          <StatCell Icon={AlertTriangle} label="Penalty"   value={getPenaltyValue(pack.examType)} unit={getPenaltyUnit(pack.examType)} accent={accent} negative />
        </div>

        {/* ── General Instructions — document-style numbered list ── */}
        <SectionLabel>General Instructions</SectionLabel>
        <div
          className="flex flex-col"
          style={{
            gap: 0,
            padding: "4px 16px",
            marginBottom: 16,
            borderRadius: 12,
            backgroundColor: "var(--card)",
            border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
          }}
        >
          {instructions.map((inst, i) => (
            <div
              key={i}
              className="flex items-start"
              style={{
                gap: 12,
                padding: "12px 0",
                borderBottom: i < instructions.length - 1
                  ? "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)"
                  : "none",
              }}
            >
              <span style={{
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                lineHeight: 1.55,
                minWidth: 16,
                flexShrink: 0,
                fontVariantNumeric: "tabular-nums",
              }}>
                {i + 1}.
              </span>
              <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <span style={{
                  fontSize: "var(--text-sm)",
                  lineHeight: 1.55,
                  color: "var(--foreground)",
                }}>
                  <span style={{ fontWeight: 600 }}>{inst.heading}</span>
                  {inst.body && <span style={{ color: "var(--muted-foreground)" }}> {inst.body}</span>}
                </span>
                {/* Inline palette legend on the "Status colours" row */}
                {inst.heading.toLowerCase().includes("status colours") && (
                  <div className="flex" style={{ flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                    {PALETTE_LEGEND.map((p) => (
                      <div key={p.label} className="flex items-center" style={{ gap: 4 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: 9999,
                          backgroundColor: p.color,
                        }} />
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                          {p.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Section list — AntD-style "default" tags. Matches the ScoreTag /
            NEXT pill visual language: radius 4 (not pill), 1px border, neutral
            tonal bg, muted number prefix + foreground section name. */}
        <div
          className="flex"
          style={{
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          {pack.sections.map((s, i) => (
            <div
              key={s}
              className="inline-flex items-center"
              style={{
                gap: 6,
                paddingLeft: 8, paddingRight: 8, height: 24,
                borderRadius: 4,
                backgroundColor: "var(--card)",
                border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
              }}
            >
              <span style={{
                fontSize: "var(--text-2xs)",
                fontWeight: 500,
                color: "var(--muted-foreground)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--foreground)",
                letterSpacing: 0,
                lineHeight: 1,
              }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Declaration — formal block, mirrors real portal phrasing */}
        <SectionLabel>Declaration</SectionLabel>
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => setAgreed((v) => !v)}
          className="flex items-start w-full"
          style={{
            gap: 12, padding: 12, borderRadius: 12,
            backgroundColor: agreed
              ? `color-mix(in srgb, ${accent} 12%, var(--card))`
              : "var(--card)",
            border: agreed
              ? `0.5px solid color-mix(in srgb, ${accent} 50%, transparent)`
              : "0.5px solid color-mix(in srgb, var(--border) 70%, transparent)",
            boxShadow: agreed
              ? `inset 0 0.5px 0 rgba(255,255,255,0.04), 0 4px 14px color-mix(in srgb, ${accent} 18%, transparent)`
              : "none",
            cursor: "pointer",
            textAlign: "left",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
          }}
        >
          <motion.div
            className="flex items-center justify-center"
            animate={{
              backgroundColor: agreed ? accent : "transparent",
              borderColor: agreed ? accent : `color-mix(in srgb, ${accent} 55%, var(--muted-foreground))`,
            }}
            transition={{ duration: 0.15 }}
            style={{
              width: 20, height: 20, borderRadius: 4,
              borderWidth: "2px",
              borderStyle: "solid",
              flexShrink: 0, marginTop: 1,
            }}
          >
            {agreed && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                style={{ display: "flex" }}
              >
                <Check size={14} style={{ color: "var(--white)", strokeWidth: 3 }} />
              </motion.div>
            )}
          </motion.div>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5 }}>
            I have read and understood all instructions. I confirm I am ready to begin the test under these conditions.
          </span>
        </motion.button>
      </div>

      {/* Sticky Start CTA — frosted glass footer, visible disabled state */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
          backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
          padding: "12px 16px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        {!agreed && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
            style={{ gap: 4, marginBottom: 8 }}
          >
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: 0.2 }}>
              Tick the confirmation above to start
            </span>
          </motion.div>
        )}
        <motion.button
          whileTap={agreed ? { scale: 0.98 } : undefined}
          disabled={!agreed}
          onClick={() => navigate(`/my-test-series/${pack.packId}/mock/${mock.id}/take`)}
          className="flex items-center justify-center w-full"
          style={{
            height: 44, borderRadius: 12, border: "none", gap: 8,
            cursor: agreed ? "pointer" : "not-allowed",
            // Disabled uses the project's standard --disabled-bg / --disabled-text
            // tokens (same pattern as live-class continue button, floating AI tutor send, etc).
            backgroundColor: agreed ? accent : "var(--disabled-bg)",
            transition: "background-color 0.25s ease",
          }}
        >
          <span style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: agreed ? "var(--white)" : "var(--disabled-text)",
            letterSpacing: 0,
          }}>
            Start Mock Test
          </span>
        </motion.button>
      </div>
    </div>
  );
}

function getPenaltyValue(examType: ExamType): string {
  switch (examType) {
    case "nta":  return "−1";
    case "cat":  return "−1";
    case "upsc": return "−⅓";
    case "clat": return "−¼";
    case "ssc":  return "−½";
    case "ibps": return "−¼";
    default:     return "−1";
  }
}

function getPenaltyUnit(examType: ExamType): string {
  switch (examType) {
    case "nta":  return "per MCQ";
    case "cat":  return "per MCQ";
    case "upsc": return "per mark";
    case "clat": return "per mark";
    case "ssc":  return "per mark";
    case "ibps": return "per mark";
    default:     return "per MCQ";
  }
}

function StatCell({
  Icon,
  label,
  value,
  unit,
  negative,
  divider,
}: {
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  unit: string;
  accent?: string;
  negative?: boolean;
  divider?: "right" | "bottom" | "right-bottom";
}) {
  const borderColor = "color-mix(in srgb, var(--border) 50%, transparent)";
  // Penalty (negative) tints only the icon, not the value. The −1 is an
  // informational fact, not a warning — duplicating red on both icon + number
  // overstates the threat.
  const iconColor = negative ? "var(--error-500)" : "var(--muted-foreground)";
  return (
    <div
      className="flex flex-col"
      style={{
        gap: 8,
        padding: "16px 16px",
        borderRight: divider?.includes("right") ? `0.5px solid ${borderColor}` : undefined,
        borderBottom: divider?.includes("bottom") ? `0.5px solid ${borderColor}` : undefined,
      }}
    >
      <div className="flex items-center" style={{ gap: 8 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 20, height: 20, borderRadius: 4,
            backgroundColor: negative
              ? "color-mix(in srgb, var(--error-500) 14%, transparent)"
              : "color-mix(in srgb, var(--foreground) 6%, transparent)",
            border: negative
              ? "0.5px solid color-mix(in srgb, var(--error-500) 30%, transparent)"
              : "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
            flexShrink: 0,
          }}
        >
          <Icon size={12} style={{ color: iconColor, strokeWidth: 2 }} />
        </div>
        <span style={{
          fontSize: "var(--text-2xs)",
          fontWeight: 600,
          color: "var(--muted-foreground)",
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline" style={{ gap: 4, minWidth: 0 }}>
        <span style={{
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          color: "var(--foreground)",
          lineHeight: 1,
          letterSpacing: "-0.005em",
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}>
          {value}
        </span>
        <span style={{
          fontSize: "var(--text-2xs)",
          fontWeight: 500,
          color: "var(--muted-foreground)",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        color: "var(--muted-foreground)",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        display: "block",
        marginBottom: 8,
        paddingLeft: 4,
      }}
    >
      {children}
    </span>
  );
}

// ─── Desktop variant — NTA-style two-column exam portal ──────────────────────
function DesktopInstructions({
  pack,
  mock,
  accent,
  totalMarks,
  instructions,
  patternLabel,
  agreed,
  onToggleAgreed,
  onStart,
  onBack,
}: {
  pack: NonNullable<ReturnType<typeof getPackById>>;
  mock: NonNullable<ReturnType<typeof getPackById>>["mocks"][number];
  accent: string;
  totalMarks: number;
  instructions: InstructionItem[];
  patternLabel: string;
  agreed: boolean;
  onToggleAgreed: () => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Portal top bar — sticky, exam-portal feel */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "color-mix(in srgb, var(--background) 82%, transparent)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "12px 32px",
            gap: 24,
          }}
        >
          <div className="flex items-center" style={{ gap: 12 }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onBack}
              aria-label="Back"
              style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} style={{ color: "var(--foreground)" }} />
            </motion.button>
            <div className="flex items-center" style={{ gap: 8 }}>
              <ShieldCheck size={14} style={{ color: accent }} />
              <span style={{
                fontSize: "var(--text-2xs)",
                fontWeight: 600,
                color: accent,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}>
                Official Mock
              </span>
              <span style={{ width: 1, height: 12, backgroundColor: "var(--border)" }} />
              <span style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--foreground)",
              }}>
                {pack.title} · Mock {mock.number} of {pack.totalMocks}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body — 2-column grid */}
      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          padding: "32px 32px 64px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 1fr)",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* LEFT — instructions content */}
        <div>
          {/* Mock title block */}
          <div className="flex flex-col" style={{ gap: 4, marginBottom: 24 }}>
            <span style={{
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}>
              {mock.title}
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", fontWeight: 500 }}>
              {pack.examLabel} · {pack.sections.join(" · ")}
            </span>
          </div>

          {/* At a glance — single row 4-up */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 0,
              marginBottom: 32,
              borderRadius: 12,
              backgroundColor: "var(--card)",
              border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
              overflow: "hidden",
            }}
          >
            <StatCell Icon={Clock}         label="Duration"  value={`${mock.durationMinutes}`} unit="min"     accent={accent} divider="right" />
            <StatCell Icon={Hash}          label="Questions" value={`${mock.questionCount}`}    unit="total"   accent={accent} divider="right" />
            <StatCell Icon={Target}        label="Max marks" value={`${totalMarks}`}            unit="pts"     accent={accent} divider="right" />
            <StatCell Icon={AlertTriangle} label="Penalty"   value={getPenaltyValue(pack.examType)} unit={getPenaltyUnit(pack.examType)} accent={accent} negative />
          </div>

          {/* General Instructions */}
          <SectionLabel>General Instructions</SectionLabel>
          <div
            className="flex flex-col"
            style={{
              gap: 0,
              padding: "4px 20px",
              marginBottom: 24,
              borderRadius: 12,
              backgroundColor: "var(--card)",
              border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
            }}
          >
            {instructions.map((inst, i) => (
              <div
                key={i}
                className="flex items-start"
                style={{
                  gap: 12,
                  padding: "16px 0",
                  borderBottom: i < instructions.length - 1
                    ? "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)"
                    : "none",
                }}
              >
                <span style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--muted-foreground)",
                  lineHeight: 1.55,
                  minWidth: 18,
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {i + 1}.
                </span>
                <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <span style={{ fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--foreground)" }}>
                    <span style={{ fontWeight: 600 }}>{inst.heading}</span>
                    {inst.body && <span style={{ color: "var(--muted-foreground)" }}> {inst.body}</span>}
                  </span>
                  {inst.heading.toLowerCase().includes("status colours") && (
                    <div className="flex" style={{ flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                      {PALETTE_LEGEND.map((p) => (
                        <div key={p.label} className="flex items-center" style={{ gap: 4 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: 9999,
                            backgroundColor: p.color,
                          }} />
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                            {p.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Section list — AntD-style default tags */}
          <SectionLabel>Sections</SectionLabel>
          <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
            {pack.sections.map((s, i) => (
              <div
                key={s}
                className="inline-flex items-center"
                style={{
                  gap: 8,
                  paddingLeft: 12, paddingRight: 12, height: 28,
                  borderRadius: 4,
                  backgroundColor: "var(--card)",
                  border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
                }}
              >
                <span style={{
                  fontSize: "var(--text-2xs)",
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--foreground)",
                  lineHeight: 1,
                }}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — sticky declaration + start panel */}
        <div style={{ position: "sticky", top: 96 }}>
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              backgroundColor: "var(--card)",
              border: "0.5px solid color-mix(in srgb, var(--border) 60%, transparent)",
            }}
          >
            <SectionLabel>Declaration</SectionLabel>

            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={onToggleAgreed}
              className="flex items-start w-full"
              style={{
                gap: 12, padding: 14, borderRadius: 10,
                marginBottom: 20,
                backgroundColor: agreed
                  ? `color-mix(in srgb, ${accent} 14%, transparent)`
                  : "transparent",
                border: agreed
                  ? `0.5px solid color-mix(in srgb, ${accent} 50%, transparent)`
                  : "0.5px solid color-mix(in srgb, var(--border) 70%, transparent)",
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
              }}
            >
              <motion.div
                className="flex items-center justify-center"
                animate={{
                  backgroundColor: agreed ? accent : "transparent",
                  borderColor: agreed ? accent : `color-mix(in srgb, ${accent} 55%, var(--muted-foreground))`,
                }}
                transition={{ duration: 0.15 }}
                style={{
                  width: 20, height: 20, borderRadius: 4,
                  borderWidth: "2px",
                  borderStyle: "solid",
                  flexShrink: 0, marginTop: 2,
                }}
              >
                {agreed && (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                    style={{ display: "flex" }}
                  >
                    <Check size={14} style={{ color: "var(--white)", strokeWidth: 3 }} />
                  </motion.div>
                )}
              </motion.div>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--foreground)", lineHeight: 1.5 }}>
                I have read and understood all instructions. I confirm I am ready to begin the test under these conditions.
              </span>
            </motion.button>

            {/* Start button */}
            <motion.button
              whileTap={agreed ? { scale: 0.98 } : undefined}
              disabled={!agreed}
              onClick={onStart}
              className="flex items-center justify-center w-full"
              style={{
                height: 44, borderRadius: 12, border: "none", gap: 8,
                cursor: agreed ? "pointer" : "not-allowed",
                backgroundColor: agreed ? accent : "var(--disabled-bg)",
                boxShadow: agreed
                  ? `0 2px 8px color-mix(in srgb, ${accent} 20%, transparent)`
                  : "none",
                transition: "background-color 0.25s ease, box-shadow 0.25s ease",
              }}
            >
              <span style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: agreed ? "var(--white)" : "var(--disabled-text)",
                letterSpacing: 0,
              }}>
                Start Mock Test
              </span>
            </motion.button>

            {!agreed && (
              <div className="flex items-center justify-center" style={{ marginTop: 12 }}>
                <span style={{
                  fontSize: "var(--text-2xs)",
                  color: "var(--muted-foreground)",
                  fontWeight: 600,
                  letterSpacing: 0.2,
                }}>
                  Tick the declaration above to begin
                </span>
              </div>
            )}

            {/* Small "what happens next" hint */}
            <div
              style={{
                marginTop: 20, paddingTop: 16,
                borderTop: "0.5px solid color-mix(in srgb, var(--border) 50%, transparent)",
              }}
            >
              <span style={{
                fontSize: "var(--text-2xs)",
                color: "var(--muted-foreground)",
                fontWeight: 600,
                lineHeight: 1.5,
                display: "block",
              }}>
                Once you click <span style={{ color: "var(--foreground)", fontWeight: 700 }}>Start Mock Test</span>, the {mock.durationMinutes}-minute timer begins and cannot be paused.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
