import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";

interface Topic {
  id: string;
  title: string;
  type: "video" | "notes" | "quiz" | "practice";
  locked: boolean;
}

interface Lesson {
  id: string;
  title: string;
  topics: Topic[];
}

interface Subject {
  id: string;
  label: string;
  tabLabel: string;
  fullName: string;
  lessons: Lesson[];
}

// TODO(api): GET /api/courses/:id/curriculum
const DUMMY_CURRICULUM: {
  courseTitle: string;
  price: number;
  originalPrice: number;
  subjects: Subject[];
} = {
  courseTitle: "CAT 2025 Complete Prep",
  price: 2999,
  originalPrice: 5999,
  subjects: [
    {
      id: "qa",
      label: "QA",
      tabLabel: "Quant",
      fullName: "Quantitative Aptitude",
      lessons: [
        {
          id: "qa-l1",
          title: "Arithmetic",
          topics: [
            { id: "qa-t1", title: "Number Systems", type: "video", locked: false },
            { id: "qa-t2", title: "Percentages & Ratios", type: "video", locked: false },
            { id: "qa-t3", title: "Profit, Loss & Discount", type: "video", locked: true },
            { id: "qa-t4", title: "Time, Speed & Distance", type: "video", locked: true },
            { id: "qa-t5", title: "Time & Work", type: "video", locked: true },
            { id: "qa-t6", title: "Practice Problems", type: "practice", locked: true },
          ],
        },
        {
          id: "qa-l2",
          title: "Algebra",
          topics: [
            { id: "qa-t7", title: "Linear Equations", type: "video", locked: true },
            { id: "qa-t8", title: "Quadratic Equations", type: "video", locked: true },
            { id: "qa-t9", title: "Inequalities", type: "video", locked: true },
            { id: "qa-t10", title: "Functions & Graphs", type: "notes", locked: true },
            { id: "qa-t11", title: "Topic Quiz", type: "quiz", locked: true },
          ],
        },
        {
          id: "qa-l3",
          title: "Geometry & Mensuration",
          topics: [
            { id: "qa-t12", title: "Lines, Angles & Triangles", type: "video", locked: true },
            { id: "qa-t13", title: "Circles & Polygons", type: "video", locked: true },
            { id: "qa-t14", title: "Coordinate Geometry", type: "notes", locked: true },
            { id: "qa-t15", title: "Mensuration Formulas", type: "notes", locked: true },
            { id: "qa-t16", title: "Practice Set", type: "practice", locked: true },
          ],
        },
        {
          id: "qa-l4",
          title: "Number Theory & Modern Maths",
          topics: [
            { id: "qa-t17", title: "Divisibility & Remainders", type: "video", locked: true },
            { id: "qa-t18", title: "Permutation & Combination", type: "video", locked: true },
            { id: "qa-t19", title: "Probability", type: "video", locked: true },
            { id: "qa-t20", title: "Set Theory", type: "notes", locked: true },
            { id: "qa-t21", title: "Topic Quiz", type: "quiz", locked: true },
          ],
        },
      ],
    },
    {
      id: "varc",
      label: "VARC",
      tabLabel: "Verbal",
      fullName: "Verbal Ability & RC",
      lessons: [
        {
          id: "varc-l1",
          title: "Reading Comprehension",
          topics: [
            { id: "varc-t1", title: "Introduction to RC", type: "video", locked: false },
            { id: "varc-t2", title: "Passage Types & Strategies", type: "video", locked: false },
            { id: "varc-t3", title: "Inference & Tone Questions", type: "video", locked: true },
            { id: "varc-t4", title: "Main Idea & Summary", type: "notes", locked: true },
            { id: "varc-t5", title: "RC Practice Set 1", type: "practice", locked: true },
          ],
        },
        {
          id: "varc-l2",
          title: "Para Jumbles & Summary",
          topics: [
            { id: "varc-t6", title: "Para Jumbles Strategy", type: "video", locked: true },
            { id: "varc-t7", title: "Odd Sentence Out", type: "video", locked: true },
            { id: "varc-t8", title: "Para Summary Techniques", type: "notes", locked: true },
            { id: "varc-t9", title: "Practice Problems", type: "practice", locked: true },
          ],
        },
        {
          id: "varc-l3",
          title: "Vocabulary & Grammar",
          topics: [
            { id: "varc-t10", title: "Word Usage in Context", type: "video", locked: true },
            { id: "varc-t11", title: "Sentence Correction", type: "video", locked: true },
            { id: "varc-t12", title: "Idioms & Phrases", type: "notes", locked: true },
            { id: "varc-t13", title: "Vocabulary Quiz", type: "quiz", locked: true },
          ],
        },
      ],
    },
    {
      id: "dilr",
      label: "DILR",
      tabLabel: "Data & LR",
      fullName: "Data Interpretation & LR",
      lessons: [
        {
          id: "dilr-l1",
          title: "Data Interpretation",
          topics: [
            { id: "dilr-t1", title: "Tables & Bar Charts", type: "video", locked: false },
            { id: "dilr-t2", title: "Line Graphs & Pie Charts", type: "video", locked: false },
            { id: "dilr-t3", title: "Caselets", type: "video", locked: true },
            { id: "dilr-t4", title: "Data Sufficiency", type: "notes", locked: true },
            { id: "dilr-t5", title: "DI Practice Set", type: "practice", locked: true },
          ],
        },
        {
          id: "dilr-l2",
          title: "Logical Reasoning",
          topics: [
            { id: "dilr-t6", title: "Seating Arrangements", type: "video", locked: true },
            { id: "dilr-t7", title: "Blood Relations", type: "video", locked: true },
            { id: "dilr-t8", title: "Syllogisms", type: "video", locked: true },
            { id: "dilr-t9", title: "Clocks & Calendars", type: "notes", locked: true },
            { id: "dilr-t10", title: "LR Practice Set", type: "practice", locked: true },
          ],
        },
        {
          id: "dilr-l3",
          title: "Advanced Sets",
          topics: [
            { id: "dilr-t11", title: "Complex Arrangements", type: "video", locked: true },
            { id: "dilr-t12", title: "Networks & Routes", type: "video", locked: true },
            { id: "dilr-t13", title: "Games & Tournaments", type: "notes", locked: true },
            { id: "dilr-t14", title: "Mixed Practice", type: "quiz", locked: true },
          ],
        },
      ],
    },
  ],
};


export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // When the student arrives here from inside their enrolled course (the
  // learning-path overflow-menu → "About this course" path), they shouldn't
  // see the price + Enroll Now bar — they already bought it.
  const isEnrolled = searchParams.get("enrolled") === "1";
  const C = DUMMY_CURRICULUM;

  const [activeSubjectId, setActiveSubjectId] = useState(C.subjects[0].id);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    new Set([C.subjects[0].lessons[0].id])
  );

  const activeSubject = C.subjects.find((s) => s.id === activeSubjectId)!;

  function selectSubject(id: string) {
    const s = C.subjects.find((sub) => sub.id === id)!;
    setActiveSubjectId(id);
    setExpandedLessons(new Set([s.lessons[0].id]));
  }

  function toggleLesson(id: string) {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalTopics = activeSubject.lessons.reduce((acc, l) => acc + l.topics.length, 0);

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", backgroundColor: "var(--background)", overflow: "hidden" }}
    >
      {/* Header */}
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ paddingLeft: 8, paddingRight: 16, paddingTop: 4, paddingBottom: 12, gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex items-center justify-center"
            style={{
              width: 44, height: 44, borderRadius: 9999,
              backgroundColor: "transparent", border: "none", cursor: "pointer", flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} style={{ color: "var(--foreground)" }} />
          </motion.button>
          <span
            className="truncate"
            style={{
              fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
              color: "var(--foreground)", flex: 1,
            }}
          >
            {C.courseTitle}
          </span>
        </div>
      </GlassHeader>

      {/* Subject tabs — underline style */}
      <div
        className="flex shrink-0"
        style={{
          overflowX: "auto", scrollbarWidth: "none",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        {C.subjects.map((s) => {
          const isActive = s.id === activeSubjectId;
          return (
            <motion.button
              key={s.id}
              whileTap={{ opacity: 0.7 }}
              onClick={() => selectSubject(s.id)}
              className="flex items-center justify-center relative shrink-0"
              style={{
                paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
                  color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  whiteSpace: "nowrap",
                }}
              >
                {s.tabLabel}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    height: 2, borderRadius: "2px 2px 0 0",
                    backgroundColor: "var(--primary)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 36 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Lessons list */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 16 }}>
        {/* Subject heading + topic count — scrolls with content */}
        <div
          className="flex items-baseline"
          style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 12, gap: 8 }}
        >
          <span
            style={{
              fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)",
              color: "var(--foreground)",
            }}
          >
            {activeSubject.fullName}
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
            {totalTopics} topics
          </span>
        </div>
        {activeSubject.lessons.map((lesson, i) => {
          const isExpanded = expandedLessons.has(lesson.id);
          return (
            <div
              key={lesson.id}
              className="flex flex-col"
              style={{
                borderTop: i === 0 ? "0.5px solid var(--border)" : "none",
                borderBottom: "0.5px solid var(--border)",
              }}
            >
              {/* Lesson header */}
              <motion.div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                whileTap={{ opacity: 0.8 }}
                onClick={() => toggleLesson(lesson.id)}
                onKeyDown={(e) => e.key === "Enter" && toggleLesson(lesson.id)}
                className="flex items-center justify-between"
                style={{
                  paddingLeft: 16, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                  backgroundColor: "var(--card)",
                  cursor: "pointer",
                  gap: 12,
                }}
              >
                <div className="flex flex-col flex-1" style={{ gap: 2, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "var(--text-2xs)", color: "var(--muted-foreground)",
                      textTransform: "uppercase", letterSpacing: 1,
                    }}
                  >
                    Lesson {i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
                      color: "var(--foreground)",
                    }}
                  >
                    {lesson.title}
                  </span>
                </div>
                <div className="flex items-center shrink-0" style={{ gap: 8 }}>
                  {!isExpanded && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                      {lesson.topics.length} topics
                    </span>
                  )}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} style={{ color: "var(--muted-foreground)" }} />
                  </motion.div>
                </div>
              </motion.div>

              {/* Topics */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden", backgroundColor: "var(--card)", paddingTop: 12 }}
                  >
                    <div
                      style={{
                        marginLeft: 16, marginRight: 16, marginBottom: 12,
                        borderRadius: 8,
                        border: "0.5px solid var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      {lesson.topics.map((topic, ti) => (
                        <motion.div
                          key={topic.id}
                          whileTap={!topic.locked ? { opacity: 0.7 } : {}}
                          onClick={() => !topic.locked && navigate("/recording-v2")}
                          className="flex items-center"
                          style={{
                            paddingLeft: 12, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                            gap: 10,
                            borderBottom: ti < lesson.topics.length - 1 ? "0.5px solid var(--border)" : "none",
                            cursor: topic.locked ? "default" : "pointer",
                            backgroundColor: "var(--background)",
                          }}
                        >
                          {/* Topic number */}
                          <div
                            className="flex items-center justify-center shrink-0"
                            style={{
                              width: 24, height: 24, borderRadius: 9999,
                              backgroundColor: "var(--card)",
                              border: "0.5px solid var(--border)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "var(--text-2xs)",
                                fontWeight: "var(--font-weight-semibold)",
                                color: "var(--muted-foreground)",
                              }}
                            >
                              {ti + 1}
                            </span>
                          </div>

                          {/* Topic name */}
                          <span
                            className="flex-1"
                            style={{
                              fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-medium)",
                              color: "var(--foreground)",
                            }}
                          >
                            {topic.title}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Sticky bottom bar — hidden for already-enrolled students who
          opened this from inside their course (no re-purchase CTA). */}
      {!isEnrolled && (
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 12,
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))" as unknown as number,
          backgroundColor: "var(--card)",
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <div className="flex flex-col" style={{ gap: 4 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span
              style={{
                fontSize: "var(--text-xl)", fontWeight: "var(--font-weight-bold)",
                color: "var(--foreground)",
              }}
            >
              &#x20B9;{C.price.toLocaleString("en-IN")}
            </span>
            <div
              className="flex items-center justify-center"
              style={{
                paddingLeft: 8, paddingRight: 8, height: 24, borderRadius: 6,
                backgroundColor: "var(--warning-alpha-15)",
                border: "1px solid var(--warning-alpha-30)",
              }}
            >
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--warning-600)" }}>
                {Math.round((1 - C.price / C.originalPrice) * 100)}% off
              </span>
            </div>
          </div>
          <span
            style={{
              fontSize: "var(--text-xs)", color: "var(--muted-foreground)",
              textDecoration: "line-through",
            }}
          >
            &#x20B9;{C.originalPrice.toLocaleString("en-IN")}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center"
          style={{
            height: 40,
            width: 140,
            borderRadius: 12,
            backgroundColor: "var(--primary)",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)",
              color: "var(--primary-foreground)",
            }}
          >
            Enroll Now
          </span>
        </motion.button>
      </div>
      )}
    </div>
  );
}
