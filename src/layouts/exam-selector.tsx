import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check, BookOpen, Calendar, TrendingUp } from "lucide-react";
import { AnimatedProgress } from "../shared/premium-ui";

/* ── Exam data ── */
export interface ExamOption {
  id: string;
  name: string;
  year: number;
  daysLeft: number;
  progress: number;
  subjectColor: string;
}

const defaultExams: ExamOption[] = [
  { id: "jee-main", name: "JEE Main", year: 2027, daysLeft: 142, progress: 38, subjectColor: "var(--physics)" },
  { id: "jee-adv", name: "JEE Advanced", year: 2027, daysLeft: 178, progress: 22, subjectColor: "var(--mathematics)" },
  { id: "neet", name: "NEET", year: 2027, daysLeft: 195, progress: 15, subjectColor: "var(--chemistry)" },
];

interface ExamSelectorProps {
  exams?: ExamOption[];
  selectedId?: string;
  onSelect?: (exam: ExamOption) => void;
}

export function ExamSelector({ exams = defaultExams, selectedId, onSelect }: ExamSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(selectedId ?? exams[0]?.id ?? "");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = exams.find((e) => e.id === activeId) ?? exams[0];

  /* Close desktop dropdown on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* Close on ESC */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (exam: ExamOption) => {
    setActiveId(exam.id);
    onSelect?.(exam);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* ── Trigger button ── */}
      <motion.button
        ref={triggerRef}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        className="flex items-center"
        style={{
          padding: "6px 14px",
          backgroundColor: "var(--muted)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-full)",
          gap: 6,
        }}
      >
        <span style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-medium)",
          color: "var(--foreground)",
        }}>
          {selected ? `${selected.name} ${selected.year}` : "Select Exam"}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown style={{ width: 14, height: 14, color: "var(--muted-foreground)", strokeWidth: 2 }} />
        </motion.div>
      </motion.button>

      {/* ── Desktop: Dropdown popover (hidden on mobile) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="hidden md:flex flex-col"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              zIndex: 100,
              width: 320,
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--elevation-xl)",
              overflow: "hidden",
            }}
          >
            {/* Top highlight edge */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, var(--card-highlight) 50%, transparent 100%)" }} />

            {/* Header */}
            <div className="flex items-center" style={{ padding: "14px 16px 10px", gap: 8 }}>
              <BookOpen style={{ width: 14, height: 14, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
              <span style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--muted-foreground)",
                letterSpacing: "0.04em",
                textTransform: "uppercase" as const,
              }}>Your Exams</span>
            </div>

            {/* Exam list */}
            <div className="flex flex-col" style={{ padding: "0 8px 8px" }}>
              {exams.map((exam) => {
                const isActive = exam.id === activeId;
                return (
                  <motion.button
                    key={exam.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(exam)}
                    className="flex items-center w-full"
                    style={{
                      padding: "12px",
                      gap: 12,
                      borderRadius: "var(--radius)",
                      backgroundColor: isActive ? "var(--primary-alpha-8)" : "transparent",
                      border: isActive ? "1px solid var(--primary-alpha-15)" : "1px solid transparent",
                      textAlign: "left",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    {/* Color accent bar */}
                    <div style={{ width: 3, height: 36, borderRadius: "var(--radius-full)", backgroundColor: exam.subjectColor, flexShrink: 0 }} />

                    {/* Info */}
                    <div className="flex-1 flex flex-col" style={{ minWidth: 0, gap: 6 }}>
                      <div className="flex items-center justify-between">
                        <span style={{
                          fontFamily: "var(--font-family-inter)",
                          fontSize: "var(--text-sm)",
                          fontWeight: "var(--font-weight-semibold)",
                          color: isActive ? "var(--foreground)" : "var(--card-foreground)",
                        }}>
                          {exam.name} {exam.year}
                        </span>
                        {isActive && (
                          <div className="flex items-center justify-center shrink-0" style={{
                            width: 22, height: 22, borderRadius: "var(--radius-full)",
                            background: "var(--gradient-primary-btn)",
                          }}>
                            <Check style={{ width: 13, height: 13, color: "var(--white)", strokeWidth: 2.5 }} />
                          </div>
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center" style={{ gap: 12 }}>
                        <div className="flex items-center" style={{ gap: 4 }}>
                          <Calendar style={{ width: 12, height: 12, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
                          <span style={{
                            fontFamily: "var(--font-family-inter)",
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--font-weight-normal)",
                            color: "var(--muted-foreground)",
                          }}>{exam.daysLeft} days left</span>
                        </div>
                        <div className="flex items-center" style={{ gap: 4 }}>
                          <TrendingUp style={{ width: 12, height: 12, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
                          <span style={{
                            fontFamily: "var(--font-family-inter)",
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--font-weight-normal)",
                            color: "var(--muted-foreground)",
                          }}>{exam.progress}% complete</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginTop: 2 }}>
                        <AnimatedProgress percent={exam.progress} color={exam.subjectColor} height={4} delay={0.1} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Manage exams link */}
            <div style={{ borderTop: "1px solid var(--border)", padding: "10px 16px" }}>
              <span style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--primary-400)",
                cursor: "pointer",
              }}>+ Manage exams</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile: Bottom sheet (hidden on desktop) ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0"
              style={{ zIndex: 90, backgroundColor: "var(--overlay-dark)" }}
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="md:hidden fixed left-0 right-0 bottom-0 flex flex-col"
              style={{
                zIndex: 91,
                maxHeight: "70vh",
                backgroundColor: "var(--card)",
                borderTop: "1px solid var(--border)",
                borderRadius: "var(--radius-card) var(--radius-card) 0 0",
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center" style={{ padding: "10px 0 4px" }}>
                <div style={{
                  width: 36, height: 4,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--border)",
                }} />
              </div>

              {/* Header */}
              <div className="flex items-center" style={{ padding: "8px 20px 12px", gap: 8 }}>
                <BookOpen style={{ width: 16, height: 16, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
                <span style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                }}>Switch Exam</span>
              </div>

              <div style={{ height: 1, backgroundColor: "var(--border)", marginLeft: 20, marginRight: 20 }} />

              {/* Exam list */}
              <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "8px 12px 12px", gap: 4 }}>
                {exams.map((exam) => {
                  const isActive = exam.id === activeId;
                  return (
                    <motion.button
                      key={exam.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(exam)}
                      className="flex items-center w-full"
                      style={{
                        padding: "14px 12px",
                        gap: 12,
                        borderRadius: "var(--radius-card)",
                        backgroundColor: isActive ? "var(--primary-alpha-8)" : "transparent",
                        border: isActive ? "1px solid var(--primary-alpha-15)" : "1px solid transparent",
                        textAlign: "left",
                      }}
                    >
                      {/* Color accent bar */}
                      <div style={{ width: 3, height: 40, borderRadius: "var(--radius-full)", backgroundColor: exam.subjectColor, flexShrink: 0 }} />

                      {/* Info */}
                      <div className="flex-1 flex flex-col" style={{ minWidth: 0, gap: 6 }}>
                        <div className="flex items-center justify-between">
                          <span style={{
                            fontFamily: "var(--font-family-inter)",
                            fontSize: "var(--text-sm)",
                            fontWeight: "var(--font-weight-semibold)",
                            color: isActive ? "var(--gray-50)" : "var(--gray-200)",
                          }}>
                            {exam.name} {exam.year}
                          </span>
                          {isActive && (
                            <div className="flex items-center justify-center shrink-0" style={{
                              width: 22, height: 22, borderRadius: "var(--radius-full)",
                              background: "var(--gradient-primary-btn)",
                            }}>
                              <Check style={{ width: 13, height: 13, color: "var(--white)", strokeWidth: 2.5 }} />
                            </div>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center" style={{ gap: 12 }}>
                          <div className="flex items-center" style={{ gap: 4 }}>
                            <Calendar style={{ width: 12, height: 12, color: "var(--gray-500)", strokeWidth: 1.5 }} />
                            <span style={{
                              fontFamily: "var(--font-family-inter)",
                              fontSize: "var(--text-xs)",
                              fontWeight: "var(--font-weight-normal)",
                              color: "var(--gray-500)",
                            }}>{exam.daysLeft} days left</span>
                          </div>
                          <div className="flex items-center" style={{ gap: 4 }}>
                            <TrendingUp style={{ width: 12, height: 12, color: "var(--gray-500)", strokeWidth: 1.5 }} />
                            <span style={{
                              fontFamily: "var(--font-family-inter)",
                              fontSize: "var(--text-xs)",
                              fontWeight: "var(--font-weight-normal)",
                              color: "var(--gray-500)",
                            }}>{exam.progress}% complete</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginTop: 0 }}>
                          <AnimatedProgress percent={exam.progress} color={exam.subjectColor} height={4} delay={0.1} />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Manage exams link */}
              <div style={{ borderTop: "1px solid var(--border)", padding: "14px 20px" }}>
                <span style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--primary-400)",
                  cursor: "pointer",
                }}>+ Manage exams</span>
              </div>

              {/* Safe area spacer */}
              <div style={{ height: 8 }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}