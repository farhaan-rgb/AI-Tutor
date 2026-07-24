/**
 * Sticky Section Header - Updates as you scroll - More prominent
 */

import { motion, AnimatePresence } from 'motion/react';
import { BookOpen } from 'lucide-react';

interface StickySectionHeaderProps {
  unitNumber: number;
  title: string;
  totalTopics: number;
  onJumpClick: () => void;
}

export function StickySectionHeader({
  unitNumber,
  title,
  totalTopics,
  onJumpClick,
}: StickySectionHeaderProps) {
  return (
    <AnimatePresence mode="wait">
    <motion.div
      key={`${unitNumber}-${title}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
      style={{
        marginBottom: 16,
      }}
    >
      <div
        className="relative flex items-center gap-3"
        style={{
          background: 'color-mix(in srgb, var(--primary) 8%, var(--card))',
          border: '1px solid color-mix(in srgb, var(--primary) 20%, var(--border))',
          borderRadius: 'var(--radius-card)',
          padding: '12px 16px',
        }}
      >
        {/* Content */}
        <div className="flex-1 flex items-center gap-3 min-w-0 overflow-hidden">
          {/* Left: Unit number + Title & Topics */}
          <div className="flex-1 flex items-center gap-3 min-w-0 overflow-hidden">
            {/* Unit number - creative hexagon badge */}
            <div
              className="relative shrink-0"
              style={{
                width: 36,
                height: 36,
              }}
            >
              {/* Hexagon background with gradient */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute top-0 left-0"
              >
                <defs>
                  <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.7 }} />
                  </linearGradient>
                </defs>
                {/* Hexagon path */}
                <path
                  d="M18 2L31 10V26L18 34L5 26V10L18 2Z"
                  fill="url(#hexGradient)"
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                />
              </svg>
              
              {/* Number overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--white)',
                  textShadow: 'var(--text-shadow-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {unitNumber}
              </div>
            </div>

            {/* Title + Topics Count */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <h2
                style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  letterSpacing: '-0.01em',
                  marginBottom: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </h2>
              <div className="flex items-center gap-2 overflow-hidden" style={{ flexWrap: 'nowrap' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {totalTopics} topics
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical divider */}
        <div
          className="shrink-0"
          style={{
            width: 1,
            height: 48,
            background: 'var(--border)',
          }}
        />

        {/* Right icon button - no background, just clickable */}
        <button
          className="flex items-center justify-center cursor-pointer shrink-0"
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius)',
            background: 'transparent',
            border: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--secondary)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onClick={onJumpClick}
        >
          <BookOpen style={{ width: 22, height: 22, color: 'var(--primary)', strokeWidth: 2 }} />
        </button>
      </div>
    </motion.div>
    </AnimatePresence>
  );
}