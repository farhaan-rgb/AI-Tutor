import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, BookOpen, ChevronRight, FlaskConical, RefreshCw, X,
  Atom, FlaskRound, Sigma, Leaf,
} from "lucide-react";
import { StatusBar } from "../shared/premium-ui";
import {
  DUMMY_CRASH_COURSE_INFO,
  DUMMY_CRASH_COURSE_PROGRESS,
  DUMMY_CRASH_COURSES_1112,
  DUMMY_CRASH_COURSE_1112_PROGRESS,
  getCrash1112Info,
  CRASH_1112_SKUS,
  type CrashCourse1112Subject,
  type CrashCourse1112SubjectId,
} from "../shared/classroom-catalog";
import { CourseOverflowMenu } from "./course-overflow-menu";
import { setCurrentCourseId } from "../shared/feedback-storage";

const C610 = DUMMY_CRASH_COURSE_INFO;

const SUBJECT_ICONS_610 = {
  maths: BookOpen,
  science: FlaskConical,
} as const;

const SUBJECT_ICONS_1112: Record<CrashCourse1112SubjectId, typeof Atom> = {
  physics:   Atom,
  chemistry: FlaskRound,
  maths:     Sigma,
  biology:   Leaf,
};

// ─── PickerSheet — unified picker for both 6–10 classes and 11–12 SKUs ───────

type PickerMode =
  | { kind: "class-6-10"; currentClass: number }
  | { kind: "sku-1112"; currentSku: string };

interface PickerSheetProps {
  open: boolean;
  mode: PickerMode;
  onPickClass: (cls: number) => void;
  onPickSku: (sku: string) => void;
  onClose: () => void;
}

function PickerSheet({ open, mode, onPickClass, onPickSku, onClose }: PickerSheetProps) {
  const isClassMode = mode.kind === "class-6-10";
  const [localClass, setLocalClass] = useState<number>(isClassMode ? mode.currentClass : 8);
  const [localSku, setLocalSku] = useState<string>(!isClassMode ? mode.currentSku : "");

  useEffect(() => {
    if (open) {
      if (isClassMode) setLocalClass(mode.currentClass);
      else setLocalSku(mode.currentSku);
    }
  }, [open, mode, isClassMode]);

  const accent = !isClassMode
    ? (getCrash1112Info(localSku)?.accentColor ?? "var(--primary)")
    : "var(--primary)";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
            style={{ backgroundColor: "var(--overlay-heavy)", zIndex: 300 }}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0"
            style={{ backgroundColor: "var(--card)", borderRadius: "20px 20px 0 0", zIndex: 301, boxShadow: "0 -8px 40px rgba(0,0,0,0.6)" }}
          >
            <div style={{ padding: "20px 20px 32px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
                    {isClassMode ? "Change Class" : "Change Course"}
                  </h3>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", marginTop: 2 }}>
                    Your progress is saved per {isClassMode ? "class" : "course"}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  aria-label="Close"
                  className="flex items-center justify-center"
                  style={{ width: 32, height: 32, border: "none", cursor: "pointer", background: "transparent" }}
                >
                  <X size={20} style={{ color: "var(--muted-foreground)" }} />
                </motion.button>
              </div>

              {/* 6-10 picker: 3-col grid of class numbers */}
              {isClassMode && (
                <>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                    {C610.classes.map((cls) => {
                      const active = localClass === cls;
                      const isCurrent = cls === mode.currentClass;
                      return (
                        <motion.button
                          key={cls}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setLocalClass(cls)}
                          style={{
                            height: 64,
                            borderRadius: 12,
                            border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                            backgroundColor: active ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "var(--secondary)",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            position: "relative",
                          }}
                        >
                          {isCurrent && (
                            <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: 9999, backgroundColor: C610.accentColor }} />
                          )}
                          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: active ? "var(--primary)" : "var(--muted-foreground)", letterSpacing: "0.04em" }}>CLASS</span>
                          <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: active ? "var(--primary)" : "var(--foreground)", lineHeight: 1 }}>{cls}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onPickClass(localClass)}
                    style={{
                      width: "100%", height: 44, borderRadius: 12, border: "none", cursor: "pointer",
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                      fontSize: "var(--text-base)", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    Switch to Class {localClass}
                  </motion.button>
                </>
              )}

              {/* 11-12 picker: list of 4 SKUs as cards */}
              {!isClassMode && (
                <>
                  <div className="flex flex-col" style={{ gap: 8, marginBottom: 20 }}>
                    {CRASH_1112_SKUS.map((sku) => {
                      const info = DUMMY_CRASH_COURSES_1112[sku];
                      const active = localSku === sku;
                      const isCurrent = sku === mode.currentSku;
                      return (
                        <motion.button
                          key={sku}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setLocalSku(sku)}
                          className="flex items-center"
                          style={{
                            gap: 12, padding: 12,
                            borderRadius: 12,
                            border: active
                              ? `1.5px solid ${info.accentColor}`
                              : "1px solid var(--border)",
                            backgroundColor: active
                              ? `color-mix(in srgb, ${info.accentColor} 10%, transparent)`
                              : "var(--secondary)",
                            cursor: "pointer",
                            position: "relative",
                            textAlign: "left",
                            fontFamily: "inherit",
                          }}
                        >
                          <div
                            className="flex items-center justify-center shrink-0"
                            style={{
                              width: 44, height: 44, borderRadius: 10,
                              backgroundColor: `${info.accentColor}14`,
                              border: `0.5px solid ${info.accentColor}33`,
                            }}
                          >
                            <span style={{ fontSize: "var(--text-base)", fontWeight: 900, color: info.accentColor, letterSpacing: -0.5 }}>
                              {info.classLevel}
                            </span>
                          </div>
                          <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center" style={{ gap: 6 }}>
                              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
                                Class {info.classLevel} {info.streamLabel}
                              </span>
                              {isCurrent && (
                                <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: info.accentColor, letterSpacing: 0.4 }}>
                                  · CURRENT
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", marginTop: 2 }}>
                              {info.subjects.map((s) => s.shortLabel).join(" · ")} · {info.examTarget}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onPickSku(localSku)}
                    disabled={!localSku}
                    style={{
                      width: "100%", height: 44, borderRadius: 12, border: "none",
                      cursor: localSku ? "pointer" : "not-allowed",
                      backgroundColor: localSku ? accent : "var(--disabled-bg)",
                      color: localSku ? "#fff" : "var(--disabled-text)",
                      fontSize: "var(--text-base)", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "inherit",
                    }}
                  >
                    {localSku
                      ? `Switch to Class ${getCrash1112Info(localSku)?.classLevel} ${getCrash1112Info(localSku)?.streamLabel}`
                      : "Select a course"}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── SubjectCard 6–10 ─────────────────────────────────────────────────────────

interface SubjectCard610Props {
  subject: typeof C610.subjects[number];
  chaptersCompleted: number;
  totalChapters: number;
  onPress: () => void;
}

function SubjectCard610({ subject, chaptersCompleted, totalChapters, onPress }: SubjectCard610Props) {
  const Icon = SUBJECT_ICONS_610[subject.id];
  const pct = totalChapters > 0 ? chaptersCompleted / totalChapters : 0;
  const hasStarted = chaptersCompleted > 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      className="flex items-stretch overflow-hidden"
      style={{ borderRadius: 12, backgroundColor: "var(--card)", cursor: "pointer", border: "0.5px solid var(--border)" }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 64, background: C610.gradientBg, position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 10px)" }} />
        <Icon size={28} style={{ color: C610.accentColor, opacity: 0.85, position: "relative" }} />
      </div>

      <div className="flex flex-col" style={{ flex: 1, padding: "12px 12px 12px 16px", gap: 6, minWidth: 0 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
            {subject.title}
          </span>
          <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
        </div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          {subject.chapters} chapters · {subject.topics} topics
        </span>
        <div className="flex items-center" style={{ gap: 8 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 9999, backgroundColor: `${C610.accentColor}18`, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 9999, backgroundColor: C610.accentColor }}
            />
          </div>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: hasStarted ? C610.accentColor : "var(--muted-foreground)", flexShrink: 0 }}>
            {hasStarted ? `${chaptersCompleted}/${totalChapters}` : "Start"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SubjectCard 11-12 ────────────────────────────────────────────────────────

interface SubjectCard1112Props {
  subject: CrashCourse1112Subject;
  chaptersCompleted: number;
  totalChapters: number;
  onPress: () => void;
}

function SubjectCard1112({ subject, chaptersCompleted, totalChapters, onPress }: SubjectCard1112Props) {
  const Icon = SUBJECT_ICONS_1112[subject.id];
  const pct = totalChapters > 0 ? chaptersCompleted / totalChapters : 0;
  const hasStarted = chaptersCompleted > 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      className="flex items-stretch overflow-hidden"
      style={{ borderRadius: 12, backgroundColor: "var(--card)", cursor: "pointer", border: "0.5px solid var(--border)" }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 64, background: subject.gradientBg, position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 10px)" }} />
        <Icon size={28} style={{ color: subject.accent, opacity: 0.9, position: "relative" }} />
      </div>

      <div className="flex flex-col" style={{ flex: 1, padding: "12px 12px 12px 16px", gap: 6, minWidth: 0 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
            {subject.title}
          </span>
          <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
        </div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          {subject.chapters} chapters · {subject.topics} topics
        </span>
        <div className="flex items-center" style={{ gap: 8 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 9999, backgroundColor: `${subject.accent}18`, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 9999, backgroundColor: subject.accent }}
            />
          </div>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: hasStarted ? subject.accent : "var(--muted-foreground)", flexShrink: 0 }}>
            {hasStarted ? `${chaptersCompleted}/${totalChapters}` : "Start"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Branch on URL params.
  const skuParam = searchParams.get("sku");
  const info1112 = getCrash1112Info(skuParam);
  const is1112 = !!info1112;

  const classParam = searchParams.get("class");
  const currentClass = classParam ? parseInt(classParam, 10) : null;

  // Stash current courseId so player screens (recording / live-class) can
  // attribute their class-exit signal to this crash course.
  useEffect(() => {
    if (is1112) setCurrentCourseId(info1112!.sku);
    else if (currentClass) setCurrentCourseId(`crash-${currentClass}`);
  }, [is1112, info1112, currentClass]);

  // Fallback to /crash-course-detail if neither param resolves to a valid course.
  useEffect(() => {
    if (!is1112 && (!currentClass || !C610.classes.includes(currentClass as typeof C610.classes[number]))) {
      navigate("/crash-course-detail", { replace: true });
    }
  }, [is1112, currentClass, navigate]);

  if (!is1112 && (!currentClass || !C610.classes.includes(currentClass as typeof C610.classes[number]))) {
    return null;
  }

  // Per-mode derived values
  const accent = is1112 ? info1112!.accentColor : C610.accentColor;
  const accentSoft = `${accent}18`;
  const headerTitle = "Crash Courses";
  const headerSubtitle = is1112
    ? `Class ${info1112!.classLevel} · ${info1112!.streamLabel} · ${info1112!.subjects.map((s) => s.shortLabel).join(" · ")}`
    : `Class ${currentClass} · Maths & Science`;

  // Progress data
  const progress1112 = is1112
    ? (DUMMY_CRASH_COURSE_1112_PROGRESS[info1112!.sku] ?? {})
    : null;
  const progress610 = !is1112 && currentClass
    ? (DUMMY_CRASH_COURSE_PROGRESS[currentClass] ?? {
        maths: { chaptersCompleted: 0, totalChapters: 12 },
        science: { chaptersCompleted: 0, totalChapters: 10 },
      })
    : null;

  function handleClassChange(cls: number) {
    setPickerOpen(false);
    localStorage.setItem("cc_selected_class", String(cls));
    setSearchParams({ class: String(cls) });
  }

  function handleSkuChange(sku: string) {
    setPickerOpen(false);
    localStorage.setItem("cc_selected_sku", sku);
    setSearchParams({ sku });
  }

  const courseId = is1112 ? info1112!.sku : `crash-${currentClass}`;
  const courseTitle = is1112
    ? info1112!.title
    : `Class ${currentClass} Summer Crash Course`;

  return (
    <div style={{ height: "100dvh", backgroundColor: "var(--background)", display: "flex", flexDirection: "column", fontFamily: "var(--font-family-inter)" }}>
      <StatusBar />

      {/* ── Header ── */}
      <div className="flex items-center" style={{ height: 56, padding: "0 16px", gap: 12, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center justify-center shrink-0"
          style={{ width: 44, height: 44, margin: -8, borderRadius: 8, border: "none", backgroundColor: "transparent", cursor: "pointer" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--foreground)", strokeWidth: 2 }} />
        </motion.button>

        <div className="flex-1" style={{ minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {headerTitle}
          </div>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {headerSubtitle}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setPickerOpen(true)}
          className="flex items-center"
          aria-label={is1112 ? "Change course" : "Change class"}
          style={{
            gap: 6, height: 32, paddingLeft: 12, paddingRight: 12, borderRadius: 8,
            backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={12} style={{ color: accent }} />
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: accent }}>
            {is1112 ? "Change Course" : "Change Class"}
          </span>
        </motion.button>

        <CourseOverflowMenu
          courseId={courseId}
          courseTitle={courseTitle}
          productKind="crash-course"
          aboutHref="/crash-course-detail"
        />
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "20px 16px", paddingBottom: 40 }}>

        {/* Subject cards */}
        <div className="flex flex-col" style={{ gap: 12 }}>
          {is1112 && info1112!.subjects.map((subj) => {
            const subjProgress = progress1112![subj.id] ?? { chaptersCompleted: 0, totalChapters: subj.chapters };
            return (
              <SubjectCard1112
                key={subj.id}
                subject={subj}
                chaptersCompleted={subjProgress.chaptersCompleted}
                totalChapters={subjProgress.totalChapters}
                onPress={() => {
                  if (currentClass || is1112) {
                    localStorage.setItem(`cc_progress_${is1112 ? info1112!.sku : currentClass}`, "1");
                  }
                  navigate(`/learning-path?subject=${subj.id}&sku=${info1112!.sku}`);
                }}
              />
            );
          })}

          {!is1112 && C610.subjects.map((subj) => {
            const subjProgress = progress610![subj.id];
            return (
              <SubjectCard610
                key={subj.id}
                subject={subj}
                chaptersCompleted={subjProgress.chaptersCompleted}
                totalChapters={subjProgress.totalChapters}
                onPress={() => {
                  if (currentClass) {
                    localStorage.setItem(`cc_progress_${currentClass}`, "1");
                  }
                  navigate(`/learning-path?subject=${subj.id}&class=${currentClass}`);
                }}
              />
            );
          })}
        </div>

        {/* Overall progress card */}
        {(() => {
          const subjects = is1112 ? info1112!.subjects : C610.subjects;
          const totalDone = subjects.reduce((acc, s) => {
            const p = is1112
              ? progress1112![s.id as CrashCourse1112SubjectId]
              : progress610![s.id as keyof typeof progress610];
            return acc + (p?.chaptersCompleted ?? 0);
          }, 0);
          const totalAll = subjects.reduce((acc, s) => {
            const p = is1112
              ? progress1112![s.id as CrashCourse1112SubjectId]
              : progress610![s.id as keyof typeof progress610];
            return acc + (p?.totalChapters ?? s.chapters);
          }, 0);
          const overallPct = totalAll > 0 ? totalDone / totalAll : 0;
          return (
            <div style={{ marginTop: 12, borderRadius: 16, backgroundColor: "var(--card)", border: "1px solid var(--border)", padding: 16 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>Overall Progress</span>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: accent }}>{Math.round(overallPct * 100)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 9999, backgroundColor: accentSoft, overflow: "hidden", marginBottom: 8 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPct * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  style={{ height: "100%", borderRadius: 9999, backgroundColor: accent }}
                />
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                {totalDone} of {totalAll} chapters complete across {subjects.length} subject{subjects.length === 1 ? "" : "s"}
              </div>
            </div>
          );
        })()}

      </div>

      <PickerSheet
        open={pickerOpen}
        mode={is1112
          ? { kind: "sku-1112", currentSku: info1112!.sku }
          : { kind: "class-6-10", currentClass: currentClass! }}
        onPickClass={handleClassChange}
        onPickSku={handleSkuChange}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
