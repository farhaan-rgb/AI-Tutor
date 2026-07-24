/**
 * Lesson Complete Screen - Compact celebration screen
 * Shows after completing practice/lesson - no XP, uses checkmark
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Target, TrendingUp, Flame, ArrowRight } from 'lucide-react';

export function Component() {
  const navigate = useNavigate();

  // Mock lesson completion data
  const completionData = {
    lessonTitle: "Newton's Third Law",
    correctAnswers: 8,
    totalQuestions: 10,
    accuracy: 80,
    streakMaintained: true,
    currentStreak: 13,
  };

  const handleContinue = () => {
    navigate('/learning-path');
  };

  const handleReview = () => {
    // No dedicated per-lesson answer-review screen exists yet — return to the
    // learning path rather than dead-ending on an unregistered route.
    navigate('/learning-path');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--overlay-dark)',
        zIndex: 200,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', damping: 25 }}
        className="w-full flex flex-col items-center"
        style={{
          maxWidth: 380,
        }}
      >
        {/* Checkmark Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', damping: 15 }}
          className="flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'var(--success-alpha-15)',
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
          {completionData.lessonTitle}
        </motion.p>

        {/* Stats */}
        <div className="w-full flex flex-col gap-2" style={{ marginBottom: 16 }}>
          {/* Accuracy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <div className="flex items-center gap-[10px]">
              <div className="flex items-center justify-center" style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'var(--success-alpha-12)',
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
              {completionData.accuracy}%
            </span>
          </motion.div>

          {/* Questions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-between"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <div className="flex items-center gap-[10px]">
              <div className="flex items-center justify-center" style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'var(--primary-alpha-12)',
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
              {completionData.correctAnswers}/{completionData.totalQuestions}
            </span>
          </motion.div>

          {/* Streak */}
          {completionData.currentStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-between"
              style={{
                backgroundColor: 'var(--warning-alpha-10)',
                border: '1px solid var(--warning-alpha-30)',
                borderRadius: 12,
                padding: '10px 12px',
              }}
            >
              <div className="flex items-center gap-[10px]">
                <Flame size={16} style={{ color: 'var(--warning-500)', fill: 'var(--warning-500)' }} />
                <span style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--white)',
                }}>
                  {completionData.currentStreak} Day Streak!
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--warning-500)',
              }}>
                {completionData.streakMaintained ? 'Maintained' : 'Started!'}
              </span>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            className="w-full flex items-center justify-center gap-[6px] cursor-pointer"
            style={{
              padding: 14,
              background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-700) 100%)',
              border: 'none',
              borderRadius: 12,
              boxShadow: 'var(--glow-primary)',
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

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReview}
            className="w-full cursor-pointer"
            style={{
              padding: 12,
              background: 'transparent',
              border: 'none',
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
        </div>
      </motion.div>
    </motion.div>
  );
}