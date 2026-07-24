/**
 * Lesson Complete Modal - Shows after completing a practice session
 * Displays: accuracy, questions answered, streak status
 */

import { motion } from 'motion/react';
import { CheckCircle, Target, TrendingUp, Flame, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

interface LessonCompleteModalProps {
  lessonTitle: string;
  accuracy: number;
  questionsCorrect: number;
  totalQuestions: number;
  streakDays: number;
  streakMaintained: boolean;
  onContinue: () => void;
  onReviewAnswers?: () => void;
}

export function LessonCompleteModal({
  lessonTitle,
  accuracy,
  questionsCorrect,
  totalQuestions,
  streakDays,
  streakMaintained,
  onContinue,
  onReviewAnswers,
}: LessonCompleteModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay-dark)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', damping: 25 }}
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Checkmark Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', damping: 15 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'var(--success-alpha-15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <CheckCircle size={40} style={{ color: 'var(--success-500)', strokeWidth: 2.5 }} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: 'var(--font-family-inter)',
            fontSize: 28,
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--white)',
            margin: '0 0 4px 0',
            textAlign: 'center',
          }}
        >
          Lesson Complete!
        </motion.h1>

        {/* Lesson Title */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontFamily: 'var(--font-family-inter)',
            fontSize: 'var(--text-sm)',
            color: 'var(--gray-400)',
            margin: '0 0 20px 0',
            textAlign: 'center',
          }}
        >
          {lessonTitle}
        </motion.p>

        {/* Stats */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 16,
        }}>
          {/* Accuracy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'var(--success-alpha-12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Target size={16} style={{ color: 'var(--success-500)', strokeWidth: 2 }} />
              </div>
              <span style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}>
                Accuracy
              </span>
            </div>
            <span style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--white)',
            }}>
              {accuracy}%
            </span>
          </motion.div>

          {/* Questions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'var(--primary-alpha-12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TrendingUp size={16} style={{ color: 'var(--primary)', strokeWidth: 2 }} />
              </div>
              <span style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}>
                Questions
              </span>
            </div>
            <span style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--white)',
            }}>
              {questionsCorrect}/{totalQuestions}
            </span>
          </motion.div>

          {/* Streak */}
          {streakDays > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              style={{
                backgroundColor: 'var(--warning-alpha-10)',
                border: '1px solid var(--warning-alpha-30)',
                borderRadius: 12,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Flame size={16} style={{ color: 'var(--warning-500)', fill: 'var(--warning-500)' }} />
                <span style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--white)',
                }}>
                  {streakDays} Day Streak!
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--warning-500)',
              }}>
                {streakMaintained ? 'Maintained' : 'Started!'}
              </span>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileTap={{ scale: 0.98 }}
            onClick={onContinue}
            style={{
              width: '100%',
              padding: 14,
              background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-700) 100%)',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              boxShadow: 'var(--glow-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--white)',
            }}>
              Continue Learning
            </span>
            <ArrowRight size={16} style={{ color: 'var(--white)', strokeWidth: 2.5 }} />
          </motion.button>

          {onReviewAnswers && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReviewAnswers}
              style={{
                width: '100%',
                padding: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--gray-400)',
              }}>
                Review Answers
              </span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}