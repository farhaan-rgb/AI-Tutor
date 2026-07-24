/**
 * Daily Goals Bottom Sheet
 * Simple task list: tasks auto-complete when user starts them.
 * Persists via localStorage (keyed by today's date).
 */

import { motion, AnimatePresence } from 'motion/react';
import { X as XIcon, PartyPopper, BookOpen, Zap, Video, RotateCcw, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GoalTask {
  id: string;
  icon: 'learn' | 'practice' | 'live' | 'revise';
  subject: string;
  subjectColor: string;
  title: string;
  route: string;
  duration: string;
}

interface DailyGoalsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Static task definitions ─────────────────────────────────────────────────

const DAILY_TASKS: GoalTask[] = [
  {
    id: 'learn',
    icon: 'learn',
    subject: 'Physics',
    subjectColor: 'var(--physics)',
    title: "Newton's Laws — Concepts",
    route: '/practice/pyq',
    duration: '~15 min',
  },
  {
    id: 'practice',
    icon: 'practice',
    subject: 'Physics',
    subjectColor: 'var(--physics)',
    title: 'Solve 5 PYQs',
    route: '/practice/pyqs',
    duration: '~20 min',
  },
  {
    id: 'live',
    icon: 'live',
    subject: 'Chemistry',
    subjectColor: 'var(--chemistry)',
    title: "Today's Live Class",
    route: '/live-class?join=early',
    duration: '60 min',
  },
  {
    id: 'revise',
    icon: 'revise',
    subject: 'All Subjects',
    subjectColor: 'var(--orange-500)',
    title: "Review Yesterday's Mistakes",
    route: '/practice/mistakes',
    duration: '~10 min',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayKey(): string {
  return `daily_goals_${new Date().toISOString().slice(0, 10)}`;
}

function loadCompletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(todayKey());
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveCompletedIds(ids: Set<string>) {
  try {
    localStorage.setItem(todayKey(), JSON.stringify([...ids]));
  } catch {}
}

function TaskIcon({ type }: { type: GoalTask['icon'] }) {
  const iconStyle = { width: 18, height: 18, strokeWidth: 2 };
  if (type === 'learn') return <BookOpen style={{ ...iconStyle, color: 'var(--physics)' }} />;
  if (type === 'practice') return <Zap style={{ ...iconStyle, color: 'var(--orange-500)' }} />;
  if (type === 'live') return <Video style={{ ...iconStyle, color: 'var(--warning)' }} />;
  return <RotateCcw style={{ ...iconStyle, color: 'var(--purple-500, var(--primary))' }} />;
}

function taskBg(type: GoalTask['icon']): string {
  if (type === 'learn') return 'var(--primary-alpha-12)';
  if (type === 'practice') return 'var(--warning-alpha-12)';
  if (type === 'live') return 'var(--warning-alpha-12)';
  return 'color-mix(in srgb, var(--purple-500) 12%, transparent)';
}

// ─── Confetti particle ────────────────────────────────────────────────────────

function ConfettiParticle({ delay }: { delay: number }) {
  const colors = ['var(--success)', 'var(--primary)', 'var(--warning)', '#f59e0b'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = (Math.random() - 0.5) * 200;
  const randomRotate = Math.random() * 720 - 360;
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: [1, 1, 0], y: [0, -100, -150], x: [0, randomX, randomX * 1.2], rotate: [0, randomRotate, randomRotate * 1.5], scale: [1, 1.2, 0.8] }}
      transition={{ duration: 1.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ position: 'absolute', width: 6, height: 6, backgroundColor: randomColor, borderRadius: Math.random() > 0.5 ? '50%' : '2px', top: '50%', left: '50%' }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DailyGoalsBottomSheet({ isOpen, onClose }: DailyGoalsBottomSheetProps) {
  const navigate = useNavigate();
  // Demo: start with 2/4 completed so developers can see completed card styling.
  // On open, localStorage overrides this (real usage). On a fresh day with no saved state,
  // the demo state persists until the user interacts.
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    const saved = loadCompletedIds();
    return saved.size > 0 ? saved : new Set(['learn', 'practice']);
  });
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reload from localStorage whenever sheet opens (real usage overwrites demo state)
  useEffect(() => {
    if (isOpen) {
      const saved = loadCompletedIds();
      if (saved.size > 0) setCompletedIds(saved);
    }
  }, [isOpen]);

  const completedCount = completedIds.size;
  const totalCount = DAILY_TASKS.length;
  const allDone = completedCount === totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  useEffect(() => {
    if (allDone && completedCount > 0 && isOpen) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1800);
      return () => clearTimeout(t);
    }
  }, [allDone, completedCount, isOpen]);

  const handleStart = (task: GoalTask) => {
    if (completedIds.has(task.id)) {
      onClose();
      setTimeout(() => navigate(task.route), 300);
      return;
    }

    const updated = new Set(completedIds);
    updated.add(task.id);
    setCompletedIds(updated);
    saveCompletedIds(updated);
    setJustCompletedId(task.id);
    setTimeout(() => setJustCompletedId(null), 600);

    onClose();
    setTimeout(() => navigate(task.route), 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 cursor-pointer"
            style={{ backgroundColor: 'var(--overlay-heavy)', zIndex: 999 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 flex flex-col"
            style={{
              maxHeight: '88vh', backgroundColor: 'var(--card)',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
              zIndex: 1000,
            }}
          >
            {/* Header */}
            <div className="shrink-0" style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 18, fontWeight: 700, color: 'var(--foreground)', margin: 0, lineHeight: 1 }}>
                    Today's Goals
                  </h2>
                  <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 12, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
                    {allDone ? 'All done!' : `${completedCount} of ${totalCount} completed`}
                  </p>
                </div>
                <button onClick={onClose} className="flex items-center cursor-pointer" style={{ background: 'transparent', border: 'none', padding: 4 }}>
                  <XIcon style={{ width: 20, height: 20, color: 'var(--muted-foreground)' }} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="overflow-hidden" style={{ height: 5, borderRadius: 3, background: 'var(--border)' }}>
                <motion.div
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'var(--primary)', borderRadius: 3 }}
                />
              </div>
            </div>

            {/* Scrollable task list */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '12px 16px 24px' }}>
              <div className="flex flex-col gap-2">
                {DAILY_TASKS.map((task, index) => {
                  const isDone = completedIds.has(task.id);
                  const isJustCompleted = task.id === justCompletedId;

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: isDone ? 0.65 : 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center gap-3"
                      style={{
                        background: isDone ? 'var(--background)' : 'var(--secondary)',
                        border: `1px solid ${isDone ? 'var(--border)' : 'color-mix(in srgb, var(--border) 60%, transparent)'}`,
                        borderRadius: 14, padding: '12px 14px',
                      }}
                    >
                      {/* Icon orb */}
                      <div className="flex items-center justify-center relative shrink-0" style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: isDone ? 'var(--success-alpha-15, rgba(82,196,26,0.15))' : taskBg(task.icon),
                      }}>
                        {isDone ? (
                          <motion.div
                            initial={isJustCompleted ? { scale: 0 } : { scale: 1 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path d="M4 9L7.5 12.5L14 6" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </motion.div>
                        ) : (
                          <TaskIcon type={task.icon} />
                        )}
                        {isJustCompleted && (
                          <motion.div
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2.4, opacity: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '2px solid var(--success)' }}
                          />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-[6px]" style={{ marginBottom: 2 }}>
                          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 11, fontWeight: 600, color: task.subjectColor }}>
                            {task.subject}
                          </span>
                          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 11, color: 'var(--muted-foreground)' }}>· {task.duration}</span>
                        </div>
                        <p style={{
                          fontFamily: 'var(--font-family-inter)', fontSize: 14, fontWeight: 600,
                          color: isDone ? 'var(--muted-foreground)' : 'var(--foreground)',
                          margin: 0, textDecoration: isDone ? 'line-through' : 'none',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {task.title}
                        </p>
                      </div>

                      {/* CTA */}
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleStart(task)}
                        className="flex items-center gap-1 shrink-0 cursor-pointer"
                        style={{
                          padding: isDone ? '7px 12px' : '8px 14px',
                          background: isDone ? 'transparent' : 'var(--primary)',
                          color: isDone ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                          border: isDone ? '1px solid var(--border)' : 'none',
                          borderRadius: 10,
                          fontFamily: 'var(--font-family-inter)', fontSize: 12, fontWeight: 700,
                          boxShadow: isDone ? 'none' : '0 2px 8px rgba(var(--primary-rgb, 0,0,0),0.25)',
                        }}
                      >
                        {isDone ? 'Review' : 'Start'}
                        <ChevronRight style={{ width: 13, height: 13, strokeWidth: 2.5 }} />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              {/* All-done celebration */}
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden"
                  style={{
                    marginTop: 16, padding: '20px 24px',
                    background: 'linear-gradient(135deg, var(--success-alpha-15, rgba(82,196,26,0.15)) 0%, var(--success-alpha-8, rgba(82,196,26,0.08)) 100%)',
                    border: '2px solid var(--success-alpha-20, rgba(82,196,26,0.2))',
                    borderRadius: 16, textAlign: 'center',
                  }}
                >
                  {showConfetti && (
                    <div className="absolute" style={{ top: '50%', left: '50%' }}>
                      {Array.from({ length: 20 }).map((_, i) => (
                        <ConfettiParticle key={i} delay={i * 0.02} />
                      ))}
                    </div>
                  )}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                    className="inline-flex items-center justify-center"
                    style={{ width: 52, height: 52, background: 'var(--success)', borderRadius: '50%', marginBottom: 12, boxShadow: '0 4px 20px rgba(82,196,26,0.3)' }}
                  >
                    <PartyPopper style={{ width: 26, height: 26, color: '#fff' }} />
                  </motion.div>
                  <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 17, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6 }}>All tasks done!</div>
                  <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 13, color: 'var(--muted-foreground)' }}>You crushed today's plan</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
