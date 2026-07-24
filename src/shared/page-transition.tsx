/**
 * Page Transition Wrapper - Smooth page transitions for route changes
 */

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  type?: 'slide' | 'fade' | 'scale';
}

export function PageTransition({ children, type = 'slide' }: PageTransitionProps) {
  const variants = {
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  };

  const selectedVariant = variants[type];

  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Smooth easing
      }}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Bottom Sheet Transition - For modals that slide up from bottom
 */
export function BottomSheetTransition({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--overlay-medium)',
          zIndex: 100,
        }}
      />

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--card)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          zIndex: 101,
        }}
      >
        {/* Drag Handle */}
        <div style={{
          width: 36,
          height: 4,
          backgroundColor: 'var(--border)',
          borderRadius: 999,
          margin: '12px auto',
        }} />
        
        {children}
      </motion.div>
    </>
  );
}

/**
 * Modal Transition - For center modals that fade + scale
 */
export function ModalTransition({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--overlay-medium)',
          zIndex: 100,
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 101,
        }}
      >
        {children}
      </motion.div>
    </>
  );
}