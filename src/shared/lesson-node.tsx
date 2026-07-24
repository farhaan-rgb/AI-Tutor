/**
 * Lesson Node - Clean circular nodes with proper states
 * Inspired by Duolingo but with our own style
 */

import { motion } from 'motion/react';
import { Check, Lock, Trophy, Play } from 'lucide-react';
import Star from '@mui/icons-material/Star';

type LessonStatus = 'locked' | 'available' | 'in-progress' | 'completed';

// Minimal shape this node renders. Kept local so this shared component does not
// depend on a screen-level type (the learning-path Lesson is a superset).
interface Lesson {
  title: string;
  color?: string;
  isTest?: boolean;
}

export interface LessonNodeProps {
  lesson: Lesson;
  position: { x: number; y: number };
  isActive: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  onClick: () => void;
  index: number;
  prepScore?: number; // 0-100, undefined if not practiced
}

export function LessonNode({
  lesson,
  position,
  isActive,
  isLocked,
  isCompleted,
  onClick,
  index,
  prepScore,
}: LessonNodeProps) {
  const isInProgress = !isLocked && !isCompleted;
  const isAvailable = !isLocked && !isCompleted && !isInProgress;

  // Size configurations
  const sizeConfig = {
    small: { node: 56, icon: 24, text: 13 },
    medium: { node: 72, icon: 32, text: 14 },
    large: { node: 88, icon: 40, text: 15 },
  };

  const config = sizeConfig['medium'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        marginBottom: 32,
      }}
    >
      {/* Main Node */}
      <motion.button
        whileHover={!isLocked ? { scale: 1.05 } : {}}
        whileTap={!isLocked ? { scale: 0.95 } : {}}
        onClick={!isLocked ? onClick : undefined}
        disabled={isLocked}
        style={{
          position: 'relative',
          width: config.node,
          height: config.node,
          borderRadius: '50%',
          backgroundColor: isCompleted
            ? lesson.color
            : isLocked
            ? 'var(--secondary)'
            : isInProgress
            ? `color-mix(in srgb, ${lesson.color} 20%, var(--card))`
            : lesson.color,
          border: isLocked
            ? '3px solid var(--border)'
            : isCompleted
            ? 'none'
            : `3px solid ${lesson.color}`,
          boxShadow: isCompleted
            ? `0 4px 16px ${lesson.color}40, 0 2px 8px ${lesson.color}30`
            : isAvailable || isInProgress
            ? `0 2px 12px ${lesson.color}25`
            : 'none',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
      >
        {/* Progress ring for in-progress */}
        {isInProgress && (
          <svg
            style={{
              position: 'absolute',
              top: -3,
              left: -3,
              width: config.node + 6,
              height: config.node + 6,
              transform: 'rotate(-90deg)',
            }}
          >
            <circle
              cx={(config.node + 6) / 2}
              cy={(config.node + 6) / 2}
              r={(config.node + 6) / 2 - 2}
              fill="none"
              stroke={lesson.color}
              strokeWidth="4"
              strokeDasharray={`${(prepScore || 0) / 100 * 2 * Math.PI * ((config.node + 6) / 2 - 2)} ${2 * Math.PI * ((config.node + 6) / 2 - 2)}`}
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Icon */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {isLocked && (
            <Lock
              style={{
                width: config.icon * 0.6,
                height: config.icon * 0.6,
                color: 'var(--muted-foreground)',
                strokeWidth: 2,
              }}
            />
          )}
          {isCompleted && (
            <Check
              style={{
                width: config.icon * 0.8,
                height: config.icon * 0.8,
                color: 'var(--white)',
                strokeWidth: 3,
              }}
            />
          )}
          {isAvailable && (
            <Play
              style={{
                width: config.icon * 0.7,
                height: config.icon * 0.7,
                color: 'var(--white)',
                strokeWidth: 2.5,
                fill: 'var(--white)',
              }}
            />
          )}
          {isInProgress && (
            <Play
              style={{
                width: config.icon * 0.7,
                height: config.icon * 0.7,
                color: lesson.color,
                strokeWidth: 2.5,
              }}
            />
          )}
        </div>

        {/* Star badge for tests */}
        {lesson.isTest && !isLocked && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--warning)',
              border: '3px solid var(--background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px var(--warning)40',
            }}
          >
            <Star
              style={{
                width: 12,
                height: 12,
                color: 'var(--white)',
                fill: 'var(--white)',
                strokeWidth: 0,
              }}
            />
          </div>
        )}
      </motion.button>

      {/* Title */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: 140,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-family-inter)',
            fontSize: config.text,
            fontWeight: 600,
            color: isLocked ? 'var(--muted-foreground)' : 'var(--foreground)',
            marginBottom: 4,
            lineHeight: 1.3,
          }}
        >
          {lesson.title}
        </div>

        {/* Status text */}
        {isInProgress && (
          <div
            style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 12,
              fontWeight: 600,
              color: lesson.color,
            }}
          >
            {prepScore}% complete
          </div>
        )}

        {isCompleted && (
          <div
            style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 12,
              fontWeight: 600,
              color: lesson.color,
            }}
          >
            Completed
          </div>
        )}
      </div>
    </motion.div>
  );
}