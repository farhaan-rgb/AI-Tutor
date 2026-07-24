/**
 * Mini Daily Goal - Clean card that IS the progress bar
 */

import { motion } from 'motion/react';
import { Target, ChevronRight, CheckCircle2 } from 'lucide-react';

interface MiniDailyGoalProps {
  onClick: () => void;
}

export function MiniDailyGoal({ onClick }: MiniDailyGoalProps) {
  const completedTasks = 2;
  const totalTasks = 3;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
  const isComplete = completedTasks === totalTasks;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: 12,
        borderRadius: 12,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: isComplete ? 'var(--glow-success)' : 'none',
        background: isComplete ? 'var(--success-alpha-8)' : 'var(--card)',
        border: isComplete ? '1px solid var(--success-500)' : '1px solid var(--border)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Progress bar background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${progressPercent}%`,
          borderRadius: 12,
          background: isComplete
            ? 'color-mix(in srgb, var(--success) 20%, transparent)'
            : 'color-mix(in srgb, var(--success) 12%, transparent)',
          transition: 'width 0.4s ease',
        }}
      />

      {/* Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isComplete ? (
            <CheckCircle2 style={{ width: 20, height: 20, color: 'var(--success)', strokeWidth: 2 }} />
          ) : (
            <Target style={{ width: 20, height: 20, color: 'var(--success)', strokeWidth: 2 }} />
          )}
        </div>

        {/* Text - Single Line */}
        <div style={{ 
          flex: 1,
          fontFamily: 'var(--font-family-inter)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--foreground)',
          letterSpacing: '-0.01em',
        }}>
          <span style={{ fontWeight: 'var(--font-weight-bold)' }}>
            {isComplete ? 'Daily goal complete!' : "Today's Goal"}
          </span>
          {!isComplete && (
            <>
              {' '}
              <span style={{ color: 'var(--muted-foreground)' }}>
                ({completedTasks}/{totalTasks} completed)
              </span>
            </>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight style={{
          width: 16,
          height: 16,
          color: 'var(--muted-foreground)',
          strokeWidth: 2,
          flexShrink: 0,
        }} />
      </div>
    </motion.div>
  );
}