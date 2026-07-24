/**
 * Daily Goals Screen - Today's study plan with actionable tasks
 */

import { useNavigate } from 'react-router';
import { ArrowLeft, Sparkles, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

interface Task {
  id: string;
  subject: string;
  subjectColor: string;
  topic: string;
  actionType: string;
  actionColor: string;
  duration: string;
  completed: boolean;
}

// Confetti particle component
function ConfettiParticle({ delay }: { delay: number }) {
  const colors = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#00BCD4'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = (Math.random() - 0.5) * 300;
  const randomRotate = Math.random() * 720 - 360;

  return (
    <motion.div
      initial={{
        opacity: 1,
        y: 0,
        x: 0,
        rotate: 0,
        scale: 1,
      }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -150, -200],
        x: [0, randomX, randomX * 1.2],
        rotate: [0, randomRotate, randomRotate * 1.5],
        scale: [1, 1.2, 0.8],
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{
        position: 'absolute',
        width: 8,
        height: 8,
        backgroundColor: randomColor,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        top: '50%',
        left: '50%',
      }}
    />
  );
}

export function Component() {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      subject: 'Physics',
      subjectColor: 'var(--subject-physics)',
      topic: 'Wave Optics — Interference',
      actionType: 'Learn',
      actionColor: 'var(--action-learn)',
      duration: '~20 min',
      completed: false,
    },
    {
      id: '2',
      subject: 'Chemistry',
      subjectColor: 'var(--subject-chemistry)',
      topic: 'Thermodynamics — Revision',
      actionType: 'Revise',
      actionColor: 'var(--action-revise)',
      duration: '~10 min',
      completed: false,
    },
    {
      id: '3',
      subject: 'Chemistry',
      subjectColor: 'var(--subject-chemistry)',
      topic: 'Organic Chemistry PYQs',
      actionType: 'Practice',
      actionColor: 'var(--action-practice)',
      duration: '~25 min',
      completed: false,
    },
    {
      id: '4',
      subject: 'All Subjects',
      subjectColor: 'var(--muted-foreground)',
      topic: 'Weekly JEE Mock #5',
      actionType: 'Mock Test',
      actionColor: 'var(--action-test)',
      duration: '~3 hrs',
      completed: false,
    },
  ]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;

  // Find the next pending task
  const nextPendingTaskId = tasks.find(t => !t.completed)?.id;

  useEffect(() => {
    if (allCompleted && completedCount > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [allCompleted, completedCount]);

  const handleToggle = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      setJustCompleted(id);
      setTimeout(() => setJustCompleted(null), 600);
    }

    setTasks(tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  return (
    <div
      className="w-full min-h-screen"
      style={{
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 p-4"
        style={{
          zIndex: 50,
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          className="flex items-center gap-3"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center cursor-pointer p-2"
            style={{
              background: 'transparent',
              border: 'none',
            }}
          >
            <ArrowLeft style={{ width: 24, height: 24, color: 'var(--foreground)', strokeWidth: 2 }} />
          </motion.button>

          <h1
            className="flex-1"
            style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--foreground)',
            }}
          >
            Today's Plan
          </h1>

          {/* Simple counter */}
          <div style={{
            fontFamily: 'var(--font-family-inter)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--muted-foreground)',
          }}>
            {completedCount}/{totalCount}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="px-4 py-6"
        style={{
          maxWidth: 680,
          margin: '0 auto',
        }}
      >
        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 24,
            padding: 20,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Circular Progress */}
            <div
              className="relative shrink-0"
              style={{ width: 64, height: 64 }}
            >
              {/* Background circle */}
              <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 28 * (1 - progressPercent / 100)
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
              {/* Percentage text */}
              <div
                className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
                style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: allCompleted ? 'var(--success)' : 'var(--foreground)',
                }}
              >
                {Math.round(progressPercent)}%
              </div>
            </div>

            {/* Text */}
            <div className="flex-1">
              <div style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--foreground)',
                marginBottom: 4,
              }}>
                {allCompleted ? 'All done!' : `Today's Plan — ${Math.round(progressPercent)}% done`}
              </div>
              <div style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 13,
                color: 'var(--muted-foreground)',
              }}>
                {allCompleted
                  ? (
                    <div className="flex items-center gap-1">
                      <PartyPopper style={{ width: 14, height: 14 }} />
                      <span>You completed all tasks today</span>
                    </div>
                  )
                  : `${completedCount} of ${totalCount} tasks completed`}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tasks List */}
        <div
          className="p-5"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div className="flex flex-col gap-4">
            {(tasks || []).map((task, index) => {
              const isNextPending = task.id === nextPendingTaskId;
              const isJustCompleted = task.id === justCompleted;

              return (
              <motion.button
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: task.completed ? 0.5 : 1,
                  y: 0,
                  scale: isNextPending && !task.completed ? 1 : 1,
                }}
                transition={{ delay: index * 0.08 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleToggle(task.id)}
                className="w-full cursor-pointer text-left"
                style={{
                  padding: isNextPending && !task.completed ? '12px' : 0,
                  background: isNextPending && !task.completed
                    ? 'var(--info-gradient-subtle)'
                    : 'transparent',
                  border: isNextPending && !task.completed ? '2px solid var(--info-alpha-30)' : 'none',
                  borderRadius: isNextPending && !task.completed ? 'var(--radius-card)' : 0,
                  transition: 'all 0.3s ease',
                  marginBottom: isNextPending && !task.completed ? 8 : 0,
                }}
              >
                <div
                  className="flex items-start gap-3"
                  style={{
                    paddingBottom: index < tasks.length - 1 ? 16 : 0,
                    borderBottom: index < tasks.length - 1 && (!isNextPending || task.completed) ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {/* Checkbox with animation */}
                  <motion.div
                    animate={isJustCompleted ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, 10, -10, 0],
                    } : {}}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex items-center justify-center shrink-0 relative"
                    style={{
                      width: 24,
                      height: 24,
                      marginTop: 4,
                      borderRadius: 'var(--radius)',
                      border: task.completed ? 'none' : '2px solid var(--border)',
                      background: task.completed ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)' : 'transparent',
                      boxShadow: task.completed
                        ? 'var(--glow-success-sm)'
                        : 'none',
                    }}
                  >
                    <AnimatePresence>
                      {task.completed && (
                        <motion.svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'backOut' }}
                        >
                          <path
                            d="M3 7L6 10L11 4"
                            stroke="var(--white)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </motion.svg>
                      )}
                    </AnimatePresence>

                    {/* Pulse ring for just completed */}
                    {isJustCompleted && (
                      <motion.div
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute w-full h-full"
                        style={{
                          borderRadius: 'var(--radius)',
                          border: '2px solid #4CAF50',
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Subject */}
                    <div style={{
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: task.subjectColor,
                      marginBottom: 4,
                    }}>
                      {task.subject || ''}
                    </div>

                    {/* Topic */}
                    <div style={{
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 16,
                      fontWeight: isNextPending && !task.completed ? 700 : 600,
                      color: 'var(--foreground)',
                      marginBottom: 8,
                      opacity: task.completed ? 0.5 : 1,
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}>
                      {task.topic || ''}
                    </div>

                    {/* Action & Duration */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Action Badge */}
                      <div style={{
                        padding: '4px 12px',
                        backgroundColor: task.actionColor,
                        borderRadius: 'var(--radius-full)',
                        opacity: task.completed ? 0.6 : 1,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-family-inter)',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--white)',
                        }}>
                          {task.actionType || ''}
                        </span>
                      </div>

                      {/* Duration */}
                      <span style={{
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--muted-foreground)',
                      }}>
                        {task.duration || ''}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
            })}
          </div>
        </div>

        {/* Completion message */}
        {completedCount === totalCount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden"
            style={{
              marginTop: 20,
              padding: 32,
              background: 'var(--success-gradient-subtle)',
              border: '2px solid var(--success-alpha-40)',
              borderRadius: 'var(--radius-card)',
              textAlign: 'center',
            }}
          >
            {/* Confetti burst */}
            {showConfetti && (
              <div className="absolute" style={{ top: '50%', left: '50%' }}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <ConfettiParticle key={i} delay={i * 0.02} />
                ))}
              </div>
            )}

            {/* Sparkles icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: 'backOut' }}
              className="inline-flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                borderRadius: '50%',
                marginBottom: 16,
                boxShadow: 'var(--glow-success-md)',
              }}
            >
              <Sparkles style={{ width: 28, height: 28, color: 'var(--white)' }} />
            </motion.div>

            {/* Main message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--foreground)',
                marginBottom: 8,
              }}
            >
              All tasks completed!
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 14,
                color: 'var(--muted-foreground)',
                marginBottom: 20,
              }}
            >
              You're making great progress!
            </motion.div>

            {/* XP Badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4, ease: 'backOut' }}
              className="inline-flex items-center gap-2"
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'var(--glow-warning-md)',
              }}
            >
              <Sparkles style={{ width: 18, height: 18, color: 'var(--white)' }} />
              <span style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--white)',
                textShadow: 'var(--text-shadow-sm)',
              }}>
                +250 XP Earned
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
