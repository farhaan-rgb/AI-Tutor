/**
 * Learning Path V4 Screen
 * Self-contained intro + onboarding flow (no external navigation).
 *
 * View flow: intro → step1-exam → transition-1 → step2-hours → transition-2 → step3-class → transition → building-plan → plan-ready
 *
 * Architecture: Atomic Design — primitives → molecules → view-level components → orchestrator.
 * All UI state lives in the root Component; views receive only what they need via props.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { StatusBar } from '../shared/premium-ui';
import { ttsSpeak, onTtsStart, onTtsEnd } from '../shared/tts';
import {
  ArrowLeft, Check, Sparkles, Rocket, BookOpen, Target, Zap, Brain,
  Atom, Rocket as RocketIcon, Dna, Building2, Briefcase, Beaker,
  Sunrise, Sun, Sunset, Moon, Sprout, Flame, Clock, ChevronRight,
  GraduationCap, BarChart3, Trophy, Users,
} from 'lucide-react';

/* ══════════════════════════════════════
   TYPES & INTERFACES
══════════════════════════════════════ */

/** All screens in the onboarding flow */
type View =
  | 'intro'
  | 'step1-exam'
  | 'transition-1'
  | 'step2-hours'
  | 'transition-2'
  | 'step3-class'
  | 'transition'
  | 'building-plan'
  | 'plan-ready';

/** Shared user-selection state collected across onboarding steps */
interface OnboardingState {
  selectedExams: string[];
  selectedHours: string;
  selectedDays: string[];
  selectedTimes: string[];
}

/** Static data shape for an exam option */
interface ExamOption {
  id: string;
  name: string;
  desc: string;
  Icon: React.ElementType;
  color: string;
  comingSoon?: boolean;
}

/** Static data shape for a study-hours option */
interface StudyOption {
  id: string;
  value: string;
  Icon: React.ElementType;
  desc: string;
  color: string;
}

/** Day pill */
interface DayOption {
  id: string;
  label: string;
}

/** Time-slot card */
interface TimeSlot {
  id: string;
  label: string;
  time: string;
  Icon: React.ElementType;
  color: string;
}

// ── Atom props ──────────────────────────────────────────────────

interface ProgressBarProps {
  progress: number;
  /** Previous value — used to animate from prev → progress */
  prev: number;
}

interface BackButtonProps {
  onClick: () => void;
}

interface SelectionCardProps {
  isSelected: boolean;
  onClick: () => void;
  /** Card body content (icon + label + sub-label) */
  children: React.ReactNode;
}

interface IconOrbProps {
  Icon: React.ElementType;
  isSelected: boolean;
  color: string;
  size?: number;
}

// ── Mascot props ────────────────────────────────────────────────

interface V4MascotProps {
  message: string;
  size?: 'small' | 'medium' | 'large';
}

interface EyelidProps {
  left: string;
  top: string;
  width: string;
  height: string;
  /** blink trigger key — increments on each blink cycle */
  blinkKey: number;
}

// ── Transition / loader props ───────────────────────────────────

interface StepMicroTransitionProps {
  message: string;
  onDone: () => void;
  /** Exam-name chips to show below the mascot */
  chips?: string[];
}

interface TransitionViewProps {
  onDone: () => void;
}

interface BuildingPlanViewProps {
  onDone: () => void;
}

interface PlanReadyViewProps {
  onStart: () => void;
}

// ── View-level props ────────────────────────────────────────────

interface IntroViewProps {
  onStart: () => void;
}

interface Step1ExamViewProps {
  selectedExams: string[];
  onToggleExam: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface Step2HoursViewProps {
  selectedHours: string;
  onSelectHours: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface Step3ClassViewProps {
  selectedDays: string[];
  selectedTimes: string[];
  onToggleDay: (id: string) => void;
  onToggleTime: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

/* ══════════════════════════════════════
   STATIC DATA
══════════════════════════════════════ */

export const EXAMS: ExamOption[] = [
  { id: 'jee-main',     name: 'JEE Main',    desc: 'Engineering entrance', Icon: Atom,       color: 'var(--physics)',    comingSoon: true  },
  { id: 'cat',          name: 'CAT',          desc: 'MBA entrance',        Icon: Briefcase,  color: 'var(--success-500)', comingSoon: false },
  { id: 'jee-advanced', name: 'JEE Advanced', desc: 'IIT entrance',        Icon: RocketIcon, color: 'var(--primary-500)', comingSoon: true  },
  { id: 'neet',         name: 'NEET',         desc: 'Medical entrance',    Icon: Dna,        color: 'var(--biology)',    comingSoon: true  },
  { id: 'upsc',         name: 'UPSC CSE',     desc: 'Civil services',      Icon: Building2,  color: 'var(--warning-500)', comingSoon: true  },
  { id: 'gate',         name: 'GATE',         desc: 'Engineering postgrad', Icon: Beaker,    color: 'var(--chemistry)',  comingSoon: true  },
];

export const STUDY_OPTIONS: StudyOption[] = [
  { id: '1-2', value: '1-2 hours', Icon: Sprout, desc: 'Getting started',   color: 'var(--success)' },
  { id: '2-4', value: '2-4 hours', Icon: Flame,  desc: 'Building momentum', color: 'var(--warning)' },
  { id: '4-6', value: '4-6 hours', Icon: Rocket, desc: 'Full throttle',     color: 'var(--primary)' },
  { id: '6+',  value: '6+ hours',  Icon: Zap,    desc: 'Maximum effort',    color: 'var(--error)'   },
];

export const DAYS: DayOption[] = [
  { id: 'mon', label: 'M' }, { id: 'tue', label: 'T' }, { id: 'wed', label: 'W' },
  { id: 'thu', label: 'T' }, { id: 'fri', label: 'F' }, { id: 'sat', label: 'S' },
  { id: 'sun', label: 'S' },
];

export const TIME_SLOTS: TimeSlot[] = [
  { id: 'morning',   label: 'Morning',   time: '6-9 AM',  Icon: Sunrise, color: 'var(--warning)' },
  { id: 'afternoon', label: 'Afternoon', time: '2-5 PM',  Icon: Sun,     color: 'var(--warning)' },
  { id: 'evening',   label: 'Evening',   time: '6-9 PM',  Icon: Sunset,  color: 'var(--warning-600)' },
  { id: 'night',     label: 'Night',     time: '9-11 PM', Icon: Moon,    color: 'var(--primary)' },
];

/* ══════════════════════════════════════
   SHARED STYLE HELPERS
══════════════════════════════════════ */

/** Full-screen overlay shell used by all step views */
export const SHELL_STYLE: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  display: 'flex', flexDirection: 'column',
  backgroundColor: 'var(--background)',
  fontFamily: 'var(--font-family-inter)',
  overflow: 'hidden',
};

/** Primary CTA button style — enabled/disabled states */
export function btn(enabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    maxWidth: 800,
    margin: '0 auto',
    display: 'block',
    height: 44,
    borderRadius: 'var(--radius-button)',
    background: enabled ? 'var(--gradient-primary-btn)' : 'var(--muted)',
    border: 'none',
    fontFamily: 'var(--font-family-inter)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-semibold)',
    color: enabled ? 'var(--white)' : 'var(--muted-foreground)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    boxShadow: enabled ? 'var(--glow-primary)' : 'none',
  };
}

/* ══════════════════════════════════════
   PRIMITIVE ATOMS
══════════════════════════════════════ */

/** Status bar shown at the top of every onboarding view */
export function OnboardingTopBar() { return <StatusBar />; }

/** Animated step-progress bar that transitions smoothly between steps */
export function ProgressBar({ progress, prev }: ProgressBarProps) {
  return (
    <div className="shrink-0" style={{ padding: '0 16px 12px' }}>
      <div className="w-full overflow-hidden" style={{ height: 4, backgroundColor: 'var(--muted)', borderRadius: 2 }}>
        <motion.div
          initial={{ width: `${prev}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', background: 'var(--gradient-primary-btn)' }}
        />
      </div>
    </div>
  );
}

/** Back-chevron button — used in the step headers */
export function BackButton({ onClick }: BackButtonProps) {
  return (
    <motion.button
      aria-label="Go back"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center justify-center shrink-0 cursor-pointer"
      style={{
        background: 'none', border: 'none', padding: '4px 0',
      }}
    >
      <ArrowLeft style={{ width: 22, height: 22, color: 'var(--foreground)', strokeWidth: 2 }} />
    </motion.button>
  );
}

/**
 * Tappable card used for exam / study-hours / time-slot selection.
 * Uses a slot pattern (children) to keep content flexible.
 *
 * UX intent: gradient fill + glow on selection gives immediate visual reward.
 */
export function SelectionCard({ isSelected, onClick, children }: SelectionCardProps) {
  return (
    <motion.button
      aria-pressed={isSelected}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative w-full h-full overflow-hidden cursor-pointer"
      style={{
        padding: '12px 10px',
        background: isSelected ? 'var(--gradient-primary-btn)' : 'var(--card)',
        border: isSelected ? '2px solid transparent' : '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', textAlign: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isSelected ? 'var(--glow-primary)' : 'var(--elevation-sm)',
      }}
    >
      {/* Selection shimmer + checkmark — enter only, no exit needed */}
      <AnimatePresence>
        {isSelected && (
          <>
            <motion.div
              key="shimmer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, var(--white-alpha-20) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 1,
              }}
            />
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="absolute flex items-center justify-center"
              style={{
                top: 6, right: 6, width: 20, height: 20,
                borderRadius: '50%', background: 'var(--white)',
                boxShadow: 'var(--elevation-md)', zIndex: 10,
              }}
            >
              <Check style={{ width: 12, height: 12, color: 'var(--primary)', strokeWidth: 3 }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <div className="relative" style={{ zIndex: 2 }}>{children}</div>
    </motion.button>
  );
}

/**
 * Circular icon container used inside SelectionCard.
 * Wiggles on selection to give playful feedback.
 */
export function IconOrb({ Icon, isSelected, color, size = 40 }: IconOrbProps) {
  return (
    <div className="relative flex justify-center items-center" style={{ marginBottom: 8, height: size + 8, zIndex: 2 }}>
      {/* Pulsing ring — only while selected */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            key="ring"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: '2px solid var(--white-alpha-50)', pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>
      <motion.div
        animate={isSelected ? { rotate: [0, -8, 8, -8, 0], scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-center"
        style={{
          width: size, height: size, borderRadius: '50%',
          background: isSelected ? 'var(--white-alpha-25)' : 'var(--muted)',
          boxShadow: isSelected ? 'var(--elevation-md)' : 'var(--elevation-sm)',
        }}
      >
        <Icon style={{ width: size * 0.5, height: size * 0.5, color: isSelected ? 'var(--white)' : color, strokeWidth: 2 }} />
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════
   MASCOT ATOM
   SVG 169×200. objectFit:contain in square: rendered_w = imgSize*0.845, h-pad = 7.75% each side
   Overlay % math: x% = 7.75+(svgX/169)*84.5  |  y% = svgY/200*100
══════════════════════════════════════ */

/**
 * Animating eyelid overlay — triggered by blinkKey change.
 * Uses clipPath inset so the lid sweeps down from the top without any shape deformation.
 * Color matches the dark outer ring of the owl's eye (#111F2A) for a natural closing look.
 */
function Eyelid({ left, top, width, height, blinkKey }: EyelidProps) {
  return (
    <motion.div
      key={blinkKey}
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)', 'inset(0 0 0% 0)', 'inset(0 0 100% 0)'] }}
      transition={{ duration: 0.22, times: [0, 0.35, 0.65, 1], ease: 'easeInOut' }}
      style={{
        position: 'absolute', left, top, width, height,
        background: '#111F2A',
        borderRadius: '0 0 50% 50%',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  );
}

/**
 * Beak overlay — inline SVG that redraws all 7 beak paths in front of the mascot <img>,
 * so the lower jaw can animate (y-drop) independently without the dark-box artifact.
 *
 * preserveAspectRatio="xMidYMid meet" mirrors the img's objectFit:contain behaviour,
 * keeping SVG coordinates perfectly aligned at every size.
 */
function MascotBeakOverlay({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <svg
      viewBox="0 0 169 200"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'visible' }}
    >
      {/* ── Upper beak (static cover — hides static SVG's beak rendering) ── */}
      <path d="M91.7577 72.0277C90.2643 75.7769 88.2437 79.3798 85.6892 82.8366C84.7233 84.133 82.8042 84.2791 81.6668 83.1289C78.6294 80.0852 76.1004 76.819 74.0796 73.3241C73.6157 72.5234 73.4887 71.5702 73.711 70.6933C73.7174 70.6933 73.7174 70.687 73.7174 70.687C73.7873 70.3947 73.9081 70.1088 74.0606 69.8355C75.7255 66.9316 77.7398 64.4024 80.0528 62.2991C81.2475 61.2125 83.0331 61.06 84.3675 61.9687C86.922 63.7161 89.1842 65.9275 91.2557 68.5646C91.4464 68.8061 91.6053 69.0666 91.7259 69.3462C92.0818 70.1849 92.1008 71.1508 91.7577 72.0277Z" fill="#D8BD14" />
      <path d="M91.7577 72.0277C90.2643 75.7768 88.2437 79.3798 85.6892 82.8366C84.7233 84.1329 82.8042 84.279 81.6668 83.1289C78.6294 80.0852 76.1004 76.8189 74.0796 73.324C73.6157 72.5234 73.4887 71.5702 73.711 70.6933C73.7174 70.6933 73.7174 70.687 73.7174 70.687C73.7174 70.687 75.5475 73.3177 82.1752 75.2876C82.8106 75.4782 83.4969 75.421 84.1006 75.1415C89.8705 72.3963 91.5099 69.7338 91.7259 69.3462C92.0818 70.1849 92.1008 71.1508 91.7577 72.0277Z" fill="#D87A16" />
      <path d="M82.9427 76.6712C82.5632 76.6712 82.1823 76.6167 81.8117 76.5064C74.9557 74.4676 72.8856 71.7194 72.6722 71.4128C72.2714 70.8368 72.4131 70.0447 72.9892 69.6437C73.5654 69.243 74.3574 69.3843 74.7585 69.9606C74.7643 69.968 76.5411 72.2873 82.5361 74.0701C82.8686 74.1689 83.2388 74.1406 83.5525 73.9916C89.2029 71.3104 90.6029 68.7463 90.6164 68.7205C90.9242 68.09 91.6801 67.8368 92.3118 68.1448C92.9425 68.4527 93.1999 69.2222 92.8917 69.8531C92.7281 70.1889 91.1039 73.2217 84.6423 76.288C84.1059 76.5423 83.5257 76.6712 82.9427 76.6712Z" fill="#111F2A" />
      <path d="M82.9671 72.7822L82.378 63.9986C82.3573 63.6908 82.0029 63.5307 81.7597 63.7205C80.646 64.5897 78.1595 66.707 76.6377 69.3573C76.3434 69.8698 76.5201 70.5225 77.0261 70.828C78.1603 71.5127 80.2701 72.6539 82.5014 73.1847C82.7503 73.2439 82.9842 73.0375 82.9671 72.7822Z" fill="#F3EA62" />
      <path d="M83.5441 85.1788C82.5017 85.1789 81.5017 84.7682 80.7647 84.0286C77.6665 80.9197 75.0473 77.5333 72.9792 73.9633C72.1279 72.4934 72.1197 70.6705 72.9583 69.2058C74.6801 66.1972 76.7784 63.5569 79.1951 61.3584C80.8436 59.8584 83.2641 59.6776 85.0814 60.9196C87.6662 62.6862 90.0133 64.9304 92.2571 67.7803C93.3033 69.1089 93.5638 70.9154 92.9365 72.4943C91.4133 76.329 89.3181 80.0623 86.7089 83.591C86.0298 84.509 84.9828 85.0838 83.8365 85.1682C83.7386 85.1753 83.6412 85.1788 83.5441 85.1788ZM82.4279 62.6417C81.8844 62.6417 81.3394 62.8436 80.9054 63.2384C78.6856 65.2579 76.7541 67.6904 75.164 70.4683C74.7742 71.1496 74.7796 72.0005 75.1787 72.6891C77.1367 76.0694 79.6217 79.2809 82.5651 82.2342C82.8475 82.5177 83.2404 82.6637 83.6498 82.6331C84.0571 82.6031 84.427 82.4014 84.6651 82.0795C87.1439 78.7274 89.1321 75.1867 90.5743 71.5559C90.8681 70.8163 90.7476 69.9718 90.26 69.3524C88.1785 66.7085 86.0154 64.6365 83.6471 63.0181C83.6471 63.0179 83.6471 63.0179 83.6471 63.0179C83.2778 62.7658 82.8533 62.6417 82.4279 62.6417Z" fill="#111F2A" />

      {/* ── Lower jaw (animated — drops on Y when speaking) ── */}
      <motion.g
        animate={isSpeaking ? { y: [0, 8, 3, 9, 2, 0] } : { y: 0 }}
        transition={
          isSpeaking
            ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2, ease: 'easeOut' }
        }
      >
        <path d="M78.8125 74.1168L83.4212 79.6209L87.3326 73.1951C87.3326 73.1951 85.0644 75.1335 83.1367 75.3757C81.209 75.6179 78.8125 74.1168 78.8125 74.1168Z" fill="#AA6215" />
        <path d="M83.4209 80.6627C83.1138 80.6627 82.8211 80.527 82.6221 80.2897L78.0134 74.7855C77.6846 74.3926 77.6901 73.8189 78.0267 73.4325C78.363 73.0462 78.9302 72.9621 79.3639 73.2332C79.9462 73.5955 81.7399 74.501 83.0064 74.342C84.334 74.1753 86.0905 72.8857 86.6557 72.4029C87.0444 72.0706 87.6181 72.0701 88.0076 72.4015C88.3974 72.7334 88.4884 73.2992 88.2221 73.7365L84.3107 80.1625C84.136 80.4493 83.8341 80.6344 83.4991 80.6597C83.4731 80.6616 83.4466 80.6627 83.4209 80.6627ZM82.0903 76.4089L83.2868 77.8379L84.3035 76.1673C83.9603 76.2808 83.6113 76.3659 83.2662 76.4091C82.8784 76.4579 82.4814 76.452 82.0903 76.4089Z" fill="#111F2A" />
      </motion.g>
    </svg>
  );
}

/**
 * Wing overlay — same technique as MascotBeakOverlay.
 * Left wing rotates around shoulder at ~(80%, 3%) of fill-box.
 * Right wing rotates around shoulder at ~(72%, 3%) of fill-box.
 * Speaking: opposing flutter ±3°. Idle: occasional gentle spread.
 */
function MascotWingOverlay({ isSpeaking }: { isSpeaking: boolean }) {
  const leftCtrl = useAnimation();
  const rightCtrl = useAnimation();

  useEffect(() => {
    if (isSpeaking) {
      leftCtrl.start({ rotate: [-3, 3], transition: { duration: 0.45, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } });
      rightCtrl.start({ rotate: [3, -3], transition: { duration: 0.45, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } });
    } else {
      leftCtrl.start({ rotate: 0, transition: { duration: 0.3, ease: 'easeOut' } });
      rightCtrl.start({ rotate: 0, transition: { duration: 0.3, ease: 'easeOut' } });
    }
  }, [isSpeaking, leftCtrl, rightCtrl]);

  useEffect(() => {
    if (isSpeaking) return;
    let tid: ReturnType<typeof setTimeout>;
    const flutter = async () => {
      await leftCtrl.start({ rotate: -4, transition: { duration: 0.25, ease: 'easeOut' } });
      await Promise.all([
        leftCtrl.start({ rotate: 0, transition: { duration: 0.3, ease: 'easeIn' } }),
        rightCtrl.start({ rotate: 4, transition: { duration: 0.25, ease: 'easeOut' } }),
      ]);
      await rightCtrl.start({ rotate: 0, transition: { duration: 0.3, ease: 'easeIn' } });
      tid = setTimeout(flutter, 5000 + Math.random() * 3000);
    };
    tid = setTimeout(flutter, 2500 + Math.random() * 2000);
    return () => clearTimeout(tid);
  }, [isSpeaking, leftCtrl, rightCtrl]);

  return (
    <svg viewBox="0 0 169 200" preserveAspectRatio="xMidYMid meet" width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
      {/* Left wing — shoulder ~(80%, 3%) of fill-box */}
      <motion.g animate={leftCtrl} style={{ transformBox: 'fill-box', transformOrigin: '80% 3%' }}>
        <path d="M51.87 145.333C51.87 145.333 56.8392 159.382 38.335 169.149C33.0291 171.951 28.5428 172.409 24.9843 171.208C18.1978 168.933 14.7918 160.615 15.548 150.963C15.8974 146.553 17.1937 142.276 19.151 138.311C22.9827 130.559 32.8829 111.788 45.522 97.3947C46.0875 96.7466 46.8374 96.3844 47.6126 96.3017C48.7119 96.1747 49.8557 96.5941 50.5928 97.5472C52.7978 100.388 54.8185 106.736 51.6984 120.824C51.6984 120.824 59.0696 125.621 51.87 145.333Z" fill="#1A70A4" />
        <path d="M51.87 145.333C51.87 145.333 56.8392 159.382 38.3351 169.149C33.0291 171.951 28.5429 172.409 24.9844 171.208C25.2956 171.09 46.9803 162.748 43.5532 147.537C43.4109 146.905 43.4866 146.246 43.7669 145.662C45.2025 142.67 49.2512 132.826 45.246 124.001C44.9241 123.292 44.9049 122.485 45.1877 121.76C46.7797 117.675 51.6266 103.862 47.6125 96.3017C48.7118 96.1747 49.8556 96.5941 50.5928 97.5472C52.7978 100.388 54.8185 106.736 51.6984 120.824C51.6984 120.824 59.0697 125.621 51.87 145.333Z" fill="#185378" />
        <path d="M37.6745 143.454C38.6091 145.048 40.3279 148.801 38.6501 152.693C38.4403 153.18 39.0378 153.609 39.4146 153.237C43.011 149.68 47.3898 143.775 38.1474 142.741C37.758 142.697 37.4764 143.116 37.6745 143.454Z" fill="#185378" />
        <path d="M23.5775 142.533C25.0282 143.678 27.9943 146.549 27.8474 150.785C27.829 151.314 28.5419 151.497 28.7573 151.013C30.8133 146.391 32.7439 139.298 23.7586 141.697C23.3801 141.798 23.27 142.29 23.5775 142.533Z" fill="#185378" />
        <path d="M30.1807 160.007C31.5078 161.294 34.1679 164.449 33.5928 168.649C33.5209 169.174 34.2115 169.428 34.4749 168.968C36.9885 164.579 39.6277 157.717 30.4456 159.194C30.0587 159.256 29.8993 159.735 30.1807 160.007Z" fill="#185378" />
        <path d="M39.153 119.999C40.0877 121.594 41.8064 125.346 40.1286 129.239C39.9189 129.725 40.5163 130.155 40.8931 129.782C44.4895 126.226 48.8683 120.32 39.6259 119.286C39.2365 119.243 38.9549 119.661 39.153 119.999Z" fill="#185378" />
        <path d="M29.1548 129.576C30.5773 130.755 33.4734 133.696 33.2245 137.927C33.1933 138.457 33.9016 138.657 34.1286 138.178C36.2955 133.607 38.3964 126.562 29.356 128.744C28.9751 128.836 28.8532 129.326 29.1548 129.576Z" fill="#185378" />
        <path d="M28.9058 173.112C25.7829 173.112 23.3997 172.136 21.6902 171.011C16.3365 167.489 13.5681 159.958 14.2842 150.866C14.6308 146.466 15.8846 142.052 18.0117 137.749C21.7338 130.218 31.772 111.129 44.5662 96.5577C45.4676 95.5309 46.7609 94.9683 48.1349 95.0073C49.5002 95.0488 50.7629 95.6913 51.5999 96.77C53.9473 99.7958 56.0858 106.341 53.1008 120.368C54.9249 122.225 59.188 128.714 53.2103 145.367C53.5294 146.532 54.2064 149.776 53.283 153.857C52.2471 158.436 48.9155 165.001 38.9281 170.272C34.9841 172.354 31.6577 173.112 28.9058 173.112ZM20.2903 138.875C18.3072 142.887 17.1392 146.989 16.8181 151.065C16.1853 159.098 18.5876 165.928 23.0872 168.888C26.8785 171.382 31.9461 171.083 37.7416 168.024C55.0767 158.875 50.7199 145.884 50.6738 145.754C50.5754 145.475 50.5771 145.171 50.6783 144.894C57.353 126.618 51.0537 121.924 50.9891 121.879C50.5454 121.59 50.3454 121.068 50.46 120.551C53.6231 106.266 51.2736 100.496 49.5916 98.328C49.2213 97.8505 48.6623 97.5662 48.0578 97.5479C47.4474 97.5252 46.8757 97.78 46.4762 98.2349C33.8809 112.58 23.9677 131.434 20.2903 138.875Z" fill="#111F2A" />
      </motion.g>
      {/* Right wing — shoulder ~(72%, 3%) of fill-box */}
      <motion.g animate={rightCtrl} style={{ transformBox: 'fill-box', transformOrigin: '72% 3%' }}>
        <path d="M155.029 97.35C155.029 97.35 168.278 128.855 126.459 154.394C124.559 155.557 122.551 156.707 120.416 157.838C120.416 157.838 119.641 145.161 119.387 136.932C119.132 128.709 113.61 111.959 113.61 111.959C113.61 111.959 140.051 85.7848 153.967 67.878C154.52 67.1727 155.448 66.9121 156.249 67.1981C156.446 67.2617 156.63 67.3633 156.802 67.4905C159.814 69.7908 164.707 76.9649 155.029 97.35Z" fill="#1A70A4" />
        <path d="M155.029 97.3501C155.029 97.3501 168.278 128.855 126.459 154.394C134.472 146.673 143.934 132.306 143.934 132.306C137.086 132.306 134.728 130.134 133.925 128.482C133.481 127.568 133.763 126.469 134.577 125.859C139.303 122.322 148.458 115.664 148.458 115.664C144.98 116.716 142.135 116.867 140.092 116.73C138.403 116.617 137.529 114.658 138.55 113.307L148.865 99.6631C157.914 84.7556 155.562 67.5795 155.562 67.5795C155.562 67.5795 155.823 67.4143 156.249 67.1982C156.446 67.2618 156.63 67.3635 156.802 67.4906C159.813 69.7909 164.706 76.965 155.029 97.3501Z" fill="#185378" />
        <path d="M121.994 155.869C131.742 148.706 141.955 141.827 148.688 131.62C154.988 122.514 158.015 110.658 154.636 99.8921C154.426 99.2393 154.166 98.51 153.883 97.8954C153.715 97.5384 153.728 97.1377 153.882 96.8056C154.711 95.0412 155.498 93.2606 156.214 91.4566C158.575 85.2787 161.563 75.808 157.407 69.9319C157.028 69.4228 156.591 68.9712 156.096 68.5822C155.85 68.3566 155.602 68.3354 155.307 68.4396C155.191 68.4885 155.087 68.5656 155.009 68.663C155.003 68.6682 154.993 68.6793 154.969 68.7097L154.738 69.0022C152.973 71.2564 150.962 73.7408 149.112 75.9468C138.099 88.6617 126.88 101.254 114.263 112.409C113.418 113.119 112.204 111.974 112.953 111.085C118.111 105.097 123.764 99.5922 129.151 93.8342C135.923 86.7067 142.653 79.4876 148.968 71.9596C150.247 70.4669 151.456 68.9262 152.69 67.4025C153.835 65.7104 156.071 65.2205 157.697 66.5532C166.283 73.8171 160.119 89.4816 156.176 97.8944L156.17 96.7932C156.854 98.2931 157.313 99.8488 157.693 101.441C161.857 119.282 151.868 136.073 138.51 147.195C133.705 151.19 128.618 154.899 122.882 157.38C121.949 157.745 121.165 156.551 121.994 155.869Z" fill="#111F2A" />
        <path d="M164.674 115.037C163.71 119.48 160.563 123.149 156.42 125.008C146.965 129.254 141.075 127.877 138.172 126.463C137.496 126.127 137.145 125.447 137.178 124.772C137.198 124.302 137.403 123.834 137.8 123.494C144.869 117.397 153.946 107.986 157.099 104.673C157.827 103.909 158.241 103.468 158.241 103.468C164.794 106.215 165.552 110.971 164.674 115.037Z" fill="#1A70A4" />
        <path d="M154.747 115.64C147.899 121.03 137.54 124.552 137.54 124.552C137.54 124.552 137.397 124.654 137.178 124.772C137.198 124.302 137.402 123.834 137.8 123.495C144.869 117.397 153.945 107.986 157.099 104.673C158.287 104.555 159.006 104.544 159.006 104.544C159.006 104.544 162.332 109.669 154.747 115.64Z" fill="#185378" />
        <path d="M144.777 129.329C141.423 129.329 139.015 128.528 137.522 127.801C136.533 127.32 135.858 126.379 135.715 125.284C135.572 124.182 135.988 123.092 136.828 122.367C145.362 115.004 157.043 102.575 157.16 102.45C157.585 101.997 158.247 101.857 158.82 102.097C164.831 104.619 167.425 109.327 166.125 115.352C165.089 120.156 161.687 124.273 157.027 126.366C152.059 128.597 147.985 129.329 144.777 129.329ZM158.594 105.262C155.878 108.122 146.177 118.229 138.771 124.619C138.659 124.715 138.656 124.837 138.665 124.901C138.678 125.006 138.732 125.082 138.823 125.127C141.278 126.322 146.749 127.72 155.809 123.653C159.61 121.942 162.38 118.608 163.218 114.725C164.156 110.379 162.643 107.274 158.594 105.262Z" fill="#111F2A" />
        <path d="M167.082 98.0556C166.87 102.597 164.377 106.738 160.6 109.261C151.983 115.02 145.947 114.641 142.848 113.73C142.127 113.511 141.667 112.899 141.587 112.228C141.529 111.761 141.653 111.266 141.988 110.865C147.944 103.676 155.329 92.8866 157.888 89.0956C158.479 88.2209 158.814 87.7178 158.814 87.7178C165.733 89.3363 167.271 93.9 167.082 98.0556Z" fill="#1A70A4" />
        <path d="M157.393 100.301C151.537 106.755 141.908 111.951 141.908 111.951C141.908 111.951 141.784 112.075 141.587 112.228C141.529 111.761 141.653 111.266 141.988 110.865C147.944 103.676 155.329 92.8866 157.888 89.0956C159.04 88.7821 159.747 88.6509 159.747 88.6509C159.747 88.6509 163.879 93.1514 157.393 100.301Z" fill="#185378" />
        <path d="M146.659 115.733C144.884 115.733 143.465 115.462 142.43 115.158C141.376 114.848 140.553 114.032 140.231 112.977C139.906 111.914 140.135 110.769 140.842 109.915C148.034 101.235 157.485 87.0365 157.579 86.8941C157.923 86.3768 158.552 86.1276 159.157 86.2693C165.504 87.7568 168.845 91.9674 168.565 98.1254C168.342 103.034 165.673 107.66 161.426 110.498C155.237 114.634 150.23 115.733 146.659 115.733ZM159.461 89.4278C157.258 92.7 149.373 104.279 143.133 111.812C143.039 111.926 143.056 112.046 143.075 112.108C143.106 112.209 143.172 112.276 143.269 112.304C145.889 113.074 151.517 113.543 159.773 108.026C163.238 105.71 165.414 101.959 165.594 97.9903C165.796 93.5485 163.787 90.7388 159.461 89.4278Z" fill="#111F2A" />
      </motion.g>
    </svg>
  );
}

/**
 * Feet overlay — left and right foot groups animate independently.
 * Speaking: alternating foot lifts (-3px y). Idle: occasional single tap.
 */
function MascotFeetOverlay({ isSpeaking }: { isSpeaking: boolean }) {
  const leftCtrl = useAnimation();
  const rightCtrl = useAnimation();

  useEffect(() => {
    if (!isSpeaking) {
      leftCtrl.stop();
      rightCtrl.stop();
      leftCtrl.set({ y: 0 });
      rightCtrl.set({ y: 0 });
      return;
    }
    let active = true;
    const tap = async () => {
      while (active) {
        await leftCtrl.start({ y: -3, transition: { duration: 0.18, ease: 'easeOut' } });
        await leftCtrl.start({ y: 0, transition: { duration: 0.18, ease: 'easeIn' } });
        if (!active) break;
        await rightCtrl.start({ y: -3, transition: { duration: 0.18, ease: 'easeOut' } });
        await rightCtrl.start({ y: 0, transition: { duration: 0.18, ease: 'easeIn' } });
      }
    };
    tap();
    return () => { active = false; };
  }, [isSpeaking, leftCtrl, rightCtrl]);

  useEffect(() => {
    if (isSpeaking) return;
    let tid: ReturnType<typeof setTimeout>;
    const tap = async () => {
      const ctrl = Math.random() > 0.5 ? leftCtrl : rightCtrl;
      await ctrl.start({ y: -2, transition: { duration: 0.15, ease: 'easeOut' } });
      await ctrl.start({ y: 0, transition: { duration: 0.2, ease: 'easeIn' } });
      tid = setTimeout(tap, 4000 + Math.random() * 3000);
    };
    tid = setTimeout(tap, 2000 + Math.random() * 2000);
    return () => clearTimeout(tid);
  }, [isSpeaking, leftCtrl, rightCtrl]);

  return (
    <svg viewBox="0 0 169 200" preserveAspectRatio="xMidYMid meet" width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
      {/* Left foot — paths 1–4 */}
      <motion.g animate={leftCtrl}>
        <path d="M75.0454 190.201C73.1963 191.803 70.3241 191.396 68.1255 190.71C65.9014 190.023 63.5057 190.182 61.4151 191.205C57.2911 193.22 50.6952 196.41 47.3527 197.852C42.2755 200.038 38.4882 197.916 39.1936 194.122C39.1936 194.122 31.3522 194.383 32.5723 187.761C32.7439 186.827 33.1187 186.02 33.6716 185.328C37.0395 181.115 47.0414 181.165 58.6065 183.167C60.4874 183.491 62.4001 183.593 64.2937 183.44C66.0475 183.294 68.3351 183.021 70.8069 182.493C73.1962 181.979 74.9501 182.868 75.8778 184.26C77.0535 186.02 76.9073 188.587 75.0454 190.201Z" fill="#D8BD14" />
        <path d="M75.0454 190.201C73.1963 191.803 70.3241 191.396 68.1255 190.71C65.9014 190.023 63.5057 190.182 61.4151 191.205C57.2911 193.22 50.6952 196.41 47.3527 197.852C42.2755 200.038 38.4882 197.916 39.1936 194.122C39.1936 194.122 31.3522 194.383 32.5723 187.761C32.7439 186.827 33.1187 186.02 33.6716 185.328C33.6716 185.328 32.6549 192.286 41.7609 189.452C41.7609 189.452 38.0752 194.808 43.5591 194.681C49.043 194.554 58.6001 188.467 61.7265 187.869C64.8529 187.272 68.2398 187.227 71.1946 188.085C74.1494 188.937 76.6722 186.382 75.8778 184.26C77.0535 186.02 76.9073 188.587 75.0454 190.201Z" fill="#D87A16" />
        <path d="M37.9462 193.869C38.9618 190.153 42.4679 187.665 46.0038 186.592C48.8815 185.695 51.9785 185.553 54.966 185.731C55.874 185.827 56.7794 185.916 57.6798 186.023C57.9882 186.06 58.2084 186.339 58.1718 186.648C58.1382 186.929 57.9025 187.137 57.6271 187.143C53.9456 187.153 50.1821 187.32 46.7063 188.632C44.669 189.389 42.6471 190.668 41.396 192.47C40.9427 193.092 40.6018 193.779 40.3962 194.51C39.8881 196.042 37.6417 195.453 37.9462 193.869Z" fill="#111F2A" />
        <path d="M43.4848 200C41.9647 200 40.6186 199.589 39.5943 198.77C38.5313 197.92 37.9267 196.707 37.8464 195.322C36.3499 195.154 33.9871 194.61 32.503 192.886C31.3188 191.51 30.9218 189.708 31.3237 187.531C32.5538 180.862 41.8062 178.972 58.8256 181.913C60.6315 182.225 62.4378 182.312 64.194 182.17C66.3723 181.995 68.5077 181.685 70.5408 181.25C74.0734 180.493 76.347 182.262 77.2975 184.17C78.4796 186.543 77.8966 189.419 75.88 191.164C74.0497 192.749 71.237 193.011 67.7483 191.926C65.8116 191.324 63.76 191.474 61.9701 192.348C57.3264 194.618 51.1077 197.618 47.8551 199.018C46.3304 199.674 44.8389 200 43.4848 200ZM39.1888 192.852C39.5597 192.852 39.9145 193.015 40.1564 193.298C40.4059 193.59 40.5116 193.979 40.4413 194.356C40.3054 195.085 40.3232 196.099 41.1814 196.785C42.101 197.519 44.0724 197.879 46.8504 196.683C50.2255 195.23 57.0729 191.913 60.8542 190.065C63.228 188.904 65.9447 188.703 68.5032 189.499C70.3211 190.065 72.788 190.479 74.2164 189.243C75.5454 188.092 75.566 186.395 75.0225 185.303C74.3417 183.937 72.8652 183.351 71.0733 183.735C68.9321 184.194 66.6863 184.52 64.3979 184.704C62.4286 184.862 60.4082 184.766 58.3926 184.418C43.4499 181.835 34.725 183.105 33.8232 187.992C33.5652 189.391 33.7621 190.448 34.4251 191.222C35.6343 192.634 38.247 192.878 39.1536 192.853C39.1651 192.853 39.1771 192.852 39.1888 192.852Z" fill="#111F2A" />
      </motion.g>
      {/* Right foot — paths 5–8 */}
      <motion.g animate={rightCtrl}>
        <path d="M87.3028 190.201C89.152 191.803 92.0242 191.396 94.2228 190.71C96.4468 190.023 98.8424 190.182 100.933 191.205C105.057 193.22 111.653 196.41 114.995 197.852C120.073 200.038 123.86 197.916 123.155 194.122C123.155 194.122 130.996 194.383 129.776 187.761C129.604 186.827 129.229 186.02 128.677 185.328C125.309 181.115 115.307 181.165 103.742 183.167C101.861 183.491 99.9481 183.593 98.0545 183.44C96.3007 183.294 94.0131 183.021 91.5412 182.493C89.152 181.979 87.3981 182.868 86.4703 184.26C85.2948 186.02 85.4409 188.587 87.3028 190.201Z" fill="#D8BD14" />
        <path d="M87.3028 190.201C89.1519 191.803 92.0241 191.396 94.2228 190.71C96.4468 190.023 98.8424 190.182 100.933 191.205C105.057 193.22 111.653 196.41 114.995 197.852C120.073 200.038 123.86 197.916 123.155 194.122C123.155 194.122 130.996 194.383 129.776 187.761C129.604 186.827 129.229 186.02 128.677 185.328C128.677 185.328 129.693 192.286 120.587 189.452C120.587 189.452 124.273 194.808 118.789 194.681C113.305 194.554 103.748 188.467 100.622 187.869C97.4953 187.272 94.1084 187.227 91.1536 188.085C88.1988 188.937 85.6761 186.382 86.4704 184.26C85.2948 186.02 85.4409 188.587 87.3028 190.201Z" fill="#D87A16" />
        <path d="M121.911 194.378C120.94 191.345 117.958 189.368 115.044 188.428C112.605 187.576 109.978 187.303 107.407 187.18C106.528 187.168 105.647 187.166 104.76 187.144C104.437 187.156 104.162 186.894 104.172 186.568C104.179 186.284 104.394 186.055 104.668 186.023C106.932 185.747 109.228 185.537 111.512 185.734C112.596 185.782 113.908 185.999 114.975 186.21C115.317 186.305 116.003 186.494 116.344 186.592C116.817 186.689 117.894 187.183 118.36 187.35C121.077 188.653 123.601 190.864 124.401 193.869C124.704 195.547 122.306 196.034 121.911 194.378Z" fill="#111F2A" />
        <path d="M118.863 200C117.509 200 116.018 199.674 114.493 199.018C111.237 197.616 105.02 194.618 100.379 192.348C98.5883 191.473 96.536 191.324 94.6004 191.926C91.1114 193.011 88.2993 192.748 86.4687 191.164C84.4521 189.419 83.8691 186.543 85.0511 184.17C86.002 182.262 88.278 180.494 91.8075 181.25C93.841 181.685 95.9764 181.995 98.1545 182.17C99.9114 182.312 101.717 182.225 103.523 181.913C120.541 178.972 129.794 180.862 131.025 187.531C131.426 189.708 131.03 191.509 129.846 192.886C128.361 194.61 125.999 195.154 124.502 195.322C124.422 196.706 123.817 197.92 122.754 198.77C121.73 199.589 120.383 200 118.863 200ZM96.9763 189.02C98.5335 189.02 100.075 189.371 101.494 190.065C105.274 191.912 112.119 195.229 115.498 196.683C118.277 197.879 120.248 197.519 121.167 196.785C122.025 196.099 122.043 195.085 121.907 194.356C121.836 193.978 121.941 193.587 122.192 193.295C122.443 193.003 122.816 192.839 123.198 192.853C124.096 192.876 126.715 192.634 127.924 191.222C128.587 190.448 128.784 189.391 128.526 187.992C127.624 183.105 118.896 181.835 103.956 184.418C101.941 184.766 99.9205 184.862 97.9509 184.704C95.6624 184.52 93.4166 184.194 91.2751 183.735C89.4843 183.351 88.0074 183.937 87.3263 185.303C86.7828 186.394 86.8034 188.092 88.1323 189.242C89.5608 190.479 92.0273 190.064 93.8456 189.499C94.8742 189.179 95.9287 189.02 96.9763 189.02Z" fill="#111F2A" />
      </motion.g>
    </svg>
  );
}

/**
 * Animated mascot character with:
 * - 3-layer motion stack: outer personality (bodyControls) + mid excited bounce + inner float
 * - Speaking: smooth mirror sway + inline SVG jaw drop (MascotBeakOverlay)
 * - Idle: wing spread → ear wiggle → leg bounce → pause (float runs continuously in background)
 * - Randomised eye blink (idle only)
 * - Excited bounce whenever `message` changes (new message = new question/step)
 * - Speech synthesis (best available English voice)
 * - Speech bubble slot
 *
 * // TODO: Replace SpeechSynthesis with app TTS service when available.
 */
export function V4Mascot({ message, size = 'medium' }: V4MascotProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [blinkKey, setBlinkKey] = useState(0);
  const bodyControls = useAnimation();
  const bounceControls = useAnimation();
  const imgSize = size === 'small' ? 60 : size === 'large' ? 88 : 72;
  const fontSize = size === 'small' ? 'var(--text-sm)' : size === 'large' ? 'var(--text-base)' : 'var(--text-sm)';

  // ── Eye blink: only during idle (NOT while speaking) ─────────────────────
  useEffect(() => {
    if (isSpeaking) return;
    let tid: ReturnType<typeof setTimeout>;
    const schedule = () => {
      tid = setTimeout(() => { setBlinkKey(k => k + 1); schedule(); }, 3200 + Math.random() * 2000);
    };
    schedule();
    return () => clearTimeout(tid);
  }, [isSpeaking]);

  // ── Sync isSpeaking state with the global TTS module ────────────────────────
  useEffect(() => {
    const off1 = onTtsStart(() => setIsSpeaking(true));
    const off2 = onTtsEnd(() => setIsSpeaking(false));
    return () => { off1(); off2(); };
  }, []);

  // ── Body animation loop: speaking sway vs idle personality sequence ──────────
  // Speaking → smooth mirror sway (built-in Framer repeat, no manual loop)
  // Idle     → wing tilt → ear wiggle → leg bounce → long pause → repeat
  //            Float is handled separately via the inner declarative motion.div.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (isSpeaking) {
        // Smooth continuous sway — framer handles the loop, no while needed
        bodyControls.start({
          rotate: [-1, 1],
          transition: { duration: 0.45, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
        });
      } else {
        // Snap back to neutral before personality loop begins
        await bodyControls.start({ rotate: 0, scaleX: 1, scaleY: 1, transition: { duration: 0.4, ease: 'easeOut' } });
        while (!cancelled) {
          // ① Wing spread — spring tilt + slight widen
          await bodyControls.start({ rotate: 3, scaleX: 1.04, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } });
          if (cancelled) break;
          await bodyControls.start({ rotate: -1, transition: { duration: 0.25, ease: 'easeOut' } });
          if (cancelled) break;
          await bodyControls.start({ rotate: 0, scaleX: 1, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } });
          if (cancelled) break;
          // ② Ear wiggle — quick lateral bounce
          await bodyControls.start({ scaleX: [1, 1.04, 0.97, 1.02, 1], transition: { duration: 0.5, ease: 'easeInOut' } });
          if (cancelled) break;
          // ③ Leg bounce — squish from feet then spring back
          await bodyControls.start({ scaleY: [1, 0.94, 1.05, 0.98, 1], transition: { duration: 0.4, ease: 'easeInOut' } });
          if (cancelled) break;
          // ④ Long pause (2–4 s) so the float feels continuous between personality moves
          await new Promise<void>(r => setTimeout(r, 2000 + Math.random() * 2000));
        }
      }
    };
    run();
    return () => { cancelled = true; bodyControls.stop(); };
  }, [isSpeaking]);

  // ── Excited bounce — fires on each new message without remounting the DOM tree ──
  useEffect(() => {
    bounceControls.start({ y: [0, -8, 0, -4, 0], transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } });
  }, [message]);

  return (
    <div className="flex flex-row items-center gap-2 w-full" style={{ maxWidth: 600 }}>
      {/* Character body */}
      <div className="relative shrink-0" style={{ width: imgSize, height: imgSize }}>
        {/*
          3-layer motion stack (outer → mid → inner):
          - Outer (bodyControls): personality tilt, wing spread, ear/leg moves, speaking sway
          - Mid (bounceControls): one-shot excited bounce each time a new message arrives (no DOM remount)
          - Inner (declarative):  continuous sine-wave float; also holds overlays so they move with float
        */}
        <motion.div
          animate={bodyControls}
          className="w-full h-full"
          style={{ transformOrigin: 'center bottom' }}
        >
          <motion.div
            animate={bounceControls}
            className="w-full h-full"
          >
            {/* Continuous float — amplitude tightens while speaking so sway stays dominant */}
            <motion.div
              className="w-full h-full relative"
              animate={{ y: isSpeaking ? [-2, 2] : [-4, 0] }}
              transition={{ duration: isSpeaking ? 0.8 : 2.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            >
              <img src="/mascot-v4.svg" alt="mascot" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />

              <MascotWingOverlay isSpeaking={isSpeaking} />
              <MascotFeetOverlay isSpeaking={isSpeaking} />
              {/* Beak overlay — inline SVG covers the static beak; lower jaw drops when speaking */}
              <MascotBeakOverlay isSpeaking={isSpeaking} />

              {/* Left eye:  black ring SVG(41,53)→(65,76) → container(28%, 26%) 12%×12% */}
              <Eyelid left="28%" top="26%" width="12%" height="12%" blinkKey={blinkKey} />
              {/* Right eye: black ring SVG(100,49)→(123,72) → container(57%, 24%) 12%×12% */}
              <Eyelid left="57%" top="24%" width="12%" height="12%" blinkKey={blinkKey} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Speech bubble */}
      <div className="relative flex-1" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '12px 16px', boxShadow: 'var(--elevation-sm)' }}>
        {/* Bubble tail — left-pointing triangle */}
        <div style={{ position: 'absolute', top: 12, left: -8, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid var(--border)' }} />
        <div style={{ position: 'absolute', top: 12, left: -6, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '7px solid var(--card)' }} />
        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize, fontWeight: 'var(--font-weight-normal)', color: 'var(--foreground)', lineHeight: 1.5 }}>{message}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BACKGROUND DECORATION ATOMS
   Reused across transition screens.
══════════════════════════════════════ */

/**
 * Two large ambient orbs that drift in the background.
 * UX intent: depth + energy without distracting from foreground content.
 */
function AmbientOrbs() {
  return (
    <>
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, var(--primary-500) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.35, 0.15], x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        style={{ position: 'absolute', bottom: '-15%', left: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, var(--chemistry) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }}
      />
    </>
  );
}

/** Four floating sparkle particles that drift upward and repeat */
function FloatingSparkles() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0, 1, 0], x: [0, (i % 2 === 0 ? 1 : -1) * (40 + i * 25)], y: [0, -150 - i * 30] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
          style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none' }}
        >
          <Sparkles style={{ width: 14 + i * 2, height: 14 + i * 2, color: 'var(--primary)', opacity: 0.5 }} />
        </motion.div>
      ))}
    </>
  );
}

/**
 * Pulsing orb with spinning inner sparkle icon.
 * Used in transition screens as a visual "loading" indicator.
 */
function PulsingOrb() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
      className="flex justify-center"
      style={{ marginBottom: 32 }}
    >
      <div className="relative" style={{ width: 120, height: 120 }}>
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--primary)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--primary)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 180, 360] }}
          transition={{ scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: 3, repeat: Infinity, ease: 'linear' } }}
          className="absolute flex items-center justify-center"
          style={{ inset: 20, borderRadius: '50%', background: 'var(--gradient-primary-btn)', boxShadow: 'var(--glow-primary), inset 0 0 30px var(--white-30)' }}
        >
          <Sparkles style={{ width: 32, height: 32, color: 'var(--white)', strokeWidth: 2.5 }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

/** Three staggered bouncing dots — generic loading indicator */
function BouncingDots() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.25 }}
      className="flex justify-center gap-2"
      style={{ marginBottom: 40 }}
    >
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gradient-primary-btn)', boxShadow: 'var(--glow-primary)' }}
        />
      ))}
    </motion.div>
  );
}

/* ══════════════════════════════════════
   STEP MICRO-TRANSITION
   Shown between step1→step2 and step2→step3.
   Auto-advances after 4 seconds.
══════════════════════════════════════ */

/**
 * Full-screen celebration screen between onboarding steps.
 * Shows mascot, selected-exam chips, pulsing orb, and a shimmer progress bar.
 *
 * // TODO: Replace setTimeout auto-advance with actual content loading if needed.
 */
export function StepMicroTransition({ message, onDone, chips }: StepMicroTransitionProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: 'var(--background)', padding: '32px 16px' }}
    >
      <AmbientOrbs />
      <FloatingSparkles />

      <div className="relative w-full" style={{ maxWidth: 600, textAlign: 'center', zIndex: 1 }}>
        {/* Mascot entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="flex justify-center"
          style={{ marginBottom: 40 }}
        >
          <V4Mascot message={message} size="large" />
        </motion.div>

        {/* Exam name chips — only if provided */}
        <AnimatePresence>
          {chips && chips.length > 0 && (
            <motion.div
              key="chips"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15, duration: 0.3, ease: 'easeOut' }}
              className="flex flex-wrap gap-2 justify-center"
              style={{ marginBottom: 32 }}
            >
              {chips.map((chip, i) => (
                <motion.div
                  key={chip}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.22 + i * 0.07, duration: 0.25, ease: 'easeOut' }}
                  style={{ padding: '8px 16px', background: 'var(--gradient-primary-btn)', borderRadius: 20, fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--white)', boxShadow: 'var(--glow-primary)' }}
                >
                  {chip}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <PulsingOrb />
        <BouncingDots />

        {/* Progress bar — fills over 4 s then auto-advances */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.3, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}
        >
          <div className="w-full overflow-hidden relative" style={{ height: 6, backgroundColor: 'var(--muted)', borderRadius: 3 }}>
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
              style={{ background: 'var(--gradient-shimmer)', pointerEvents: 'none' }}
            />
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3.8, ease: 'linear' }}
              className="h-full relative"
              style={{ background: 'var(--gradient-primary-btn)' }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TRANSITION VIEW
   Shown between step3→building-plan.
   Auto-advances after 3.5 seconds.
══════════════════════════════════════ */

/**
 * "Setting up your live classes" loading screen.
 *
 * // TODO: Replace auto-advance with actual setup API call when backend is ready.
 */
export function TransitionView({ onDone }: TransitionViewProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: 'var(--background)', padding: '32px 16px' }}>
      {/* Static orbs (no sparkle particles on this screen) */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, var(--primary-500) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        style={{ position: 'absolute', bottom: '-15%', left: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, var(--chemistry) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }}
      />

      <div className="relative w-full" style={{ maxWidth: 600, textAlign: 'center', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="flex justify-center"
          style={{ marginBottom: 40 }}
        >
          <V4Mascot message="Setting up your live classes..." size="large" />
        </motion.div>

        <PulsingOrb />
        <BouncingDots />

        {/* Progress bar fills over 3.5 s to match auto-advance timing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.3, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}
        >
          <div className="w-full overflow-hidden" style={{ height: 6, backgroundColor: 'var(--muted)', borderRadius: 3 }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3.5, ease: 'linear' }}
              className="h-full"
              style={{ background: 'var(--gradient-primary-btn)' }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BUILDING PLAN VIEW
   AI-processing animation. Auto-advances after 7 s.
══════════════════════════════════════ */

/**
 * Animated AI plan-generation screen.
 * Shows orbiting icons, checklist items that fly in, and a fill progress bar.
 *
 * // TODO: Drive checklist completion from real API progress events.
 */
export function BuildingPlanView({ onDone }: BuildingPlanViewProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 7000);
    return () => clearTimeout(t);
  }, [onDone]);

  const features = [
    { Icon: BookOpen, text: 'Analyzing syllabus',   delay: 0.5, color: 'var(--primary)' },
    { Icon: Target,   text: 'Setting milestones',    delay: 1.2, color: 'var(--success)' },
    { Icon: Zap,      text: 'Optimizing schedule',   delay: 1.9, color: 'var(--warning)' },
    { Icon: Brain,    text: 'Personalizing content', delay: 2.6, color: 'var(--error)'   },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: 'var(--background)', fontFamily: 'var(--font-family-inter)' }}>
      <OnboardingTopBar />

      {/* Floating particles — decorative only */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: Math.random() * 400, y: 800, scale: 0 }}
          animate={{ y: -100, scale: [0, Math.random() * 0.5 + 0.5, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 3 + Math.random() * 2, delay: Math.random() * 4, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute', width: 4, height: 4, borderRadius: '50%', pointerEvents: 'none',
            backgroundColor: (['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--error)'] as const)[i % 4],
          }}
        />
      ))}

      <div className="flex-1 flex flex-col items-center justify-center relative" style={{ padding: '0 16px 80px', zIndex: 1 }}>
        {/* Central spinning orrery */}
        <div style={{ position: 'relative', marginBottom: 48 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: -18, left: -18, width: 136, height: 136, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--primary)', borderRightColor: 'var(--success)' }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: -10, left: -10, width: 120, height: 120, borderRadius: '50%', border: '2px solid transparent', borderBottomColor: 'var(--warning)', borderLeftColor: 'var(--error)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], boxShadow: ['var(--glow-primary)', 'var(--glow-primary-strong)', 'var(--glow-primary)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center justify-center"
            style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--gradient-primary-btn)' }}
          >
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
              <Sparkles style={{ width: 44, height: 44, color: 'var(--white)', strokeWidth: 2 }} />
            </motion.div>
          </motion.div>

          {/* Orbiting icon satellites */}
          {[BookOpen, Target, Zap, Brain].map((Icon, i) => {
            const angle = (i * 360) / 4;
            const r = 64;
            const x = Math.cos((angle * Math.PI) / 180) * r;
            const y = Math.sin((angle * Math.PI) / 180) * r;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: [x, x * 1.1, x], y: [y, y * 1.1, y] }}
                transition={{ scale: { delay: 0.5 + i * 0.2, duration: 0.4 }, opacity: { delay: 0.5 + i * 0.2, duration: 0.4 }, x: { duration: 2, delay: 1, repeat: Infinity }, y: { duration: 2, delay: 1, repeat: Infinity } }}
                className="absolute flex items-center justify-center"
                style={{
                  top: '50%', left: '50%',
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  width: 34, height: 34, borderRadius: '50%',
                  backgroundColor: 'var(--card)', border: '2px solid var(--border)',
                  boxShadow: 'var(--elevation-sm)',
                }}
              >
                <Icon style={{ width: 16, height: 16, color: 'var(--primary)', strokeWidth: 2 }} />
              </motion.div>
            );
          })}
        </div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', textAlign: 'center', marginBottom: 8 }}>
          Creating Your Study Plan
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', textAlign: 'center', marginBottom: 24 }}>
          AI is personalizing everything for you...
        </motion.p>

        {/* Checklist — items fly in sequentially */}
        {/* TODO: Replace static delays with real progress events from the plan-generation API */}
        <div className="w-full flex flex-col gap-2" style={{ maxWidth: 400 }}>
          {features.map(({ Icon, text, delay, color }) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay, duration: 0.5 }}
              className="flex items-center gap-3"
              style={{ padding: '12px 16px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
                className="flex items-center justify-center shrink-0"
                style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: color }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--white)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>{text}</div>
              {/* Activity dots */}
              <div className="flex gap-1" style={{ marginLeft: 'auto' }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, delay: delay + i * 0.2, repeat: Infinity }}
                    style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: color }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Overall fill bar — 6.5 s to match auto-advance */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ width: '100%', maxWidth: 400, marginTop: 24 }}>
          <div style={{ width: '100%', height: 8, backgroundColor: 'var(--muted)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 6.5, ease: 'easeInOut' }}
              style={{ height: '100%', background: 'var(--gradient-primary-btn)' }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PLAN READY VIEW
   Celebration screen shown after plan is built.
══════════════════════════════════════ */

/**
 * Confetti celebration + stat summary when the plan is ready.
 * Plays a 3-note chime on mount via Web Audio API.
 *
 * // TODO: Replace hardcoded stats (215+, 50+, 100+) with dynamic values from user plan data.
 */
function PlanReadyView({ onStart }: PlanReadyViewProps) {
  // 3-note celebration chime — C5, E5, G5
  useEffect(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const play = (freq: number, start: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + 0.4);
        osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + 0.5);
      };
      const t = setTimeout(() => { play(523.25, 0); play(659.25, 0.15); play(783.99, 0.3); }, 500);
      return () => clearTimeout(t);
    } catch {
      // Web Audio not available — silently skip
    }
  }, []);

  // TODO: Replace hardcoded stats with values from the generated user plan
  const stats = [
    { label: 'Topics', value: '215+', color: 'var(--primary-500)'  },
    { label: 'Tests',  value: '50+',  color: 'var(--success-500)'  },
    { label: 'Videos', value: '100+', color: 'var(--warning-500)'  },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: 'var(--background)', fontFamily: 'var(--font-family-inter)' }}>
      <OnboardingTopBar />

      {/* Confetti burst */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 200, y: 300, scale: 0, rotate: 0 }}
          animate={{ x: Math.random() * 400, y: 800, scale: [0, 1, 0.8], rotate: Math.random() * 360, opacity: [0, 1, 0] }}
          transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute', width: 8, height: 8, pointerEvents: 'none',
            borderRadius: i % 3 === 0 ? '50%' : 0,
            backgroundColor: (['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--error)', 'var(--info)'] as const)[i % 5],
          }}
        />
      ))}

      {/* Glow halo */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 1 }}
        style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'var(--gradient-primary-btn)', filter: 'blur(80px)', pointerEvents: 'none' }}
      />

      <div className="flex-1 flex flex-col items-center justify-center relative w-full" style={{ padding: '40px 16px', maxWidth: 480, margin: '0 auto', zIndex: 1 }}>
        {/* Rocket icon */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
          style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--gradient-primary-btn)', marginBottom: 32, boxShadow: 'var(--glow-primary)' }}
        >
          <Rocket style={{ width: 48, height: 48, color: 'var(--white)', strokeWidth: 2 }} />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em' }}>
          You're all set!
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', textAlign: 'center', marginBottom: 40, lineHeight: 1.5 }}>
          Your personalized study path is ready
        </motion.p>

        {/* Plan stat chips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
          {stats.map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              style={{ padding: '12px 8px', borderRadius: 'var(--radius)', backgroundColor: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center' }}
            >
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Pinned CTA */}
      <div className="relative" style={{ padding: '16px', backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)', zIndex: 1 }}>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          style={btn(true)}
        >
          Start Learning
        </motion.button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   VIEW-LEVEL COMPONENTS
══════════════════════════════════════ */

/**
 * Welcome / landing screen.
 * Shows app icon, headline, 4 feature cards, and a "Start Your Prep" CTA.
 */
function IntroView({ onStart }: IntroViewProps) {
  const cards = [
    { Icon: BookOpen, color: 'var(--primary)',      bg: 'var(--primary-alpha-12)',                                      title: 'Learning Path', desc: 'Chapter-wise syllabus', stat: '215+ topics'  },
    { Icon: Target,   color: 'var(--success)',      bg: 'var(--success-alpha-12)',                                      title: 'Mock Tests',    desc: 'PYQs + full mocks',    stat: '50+ tests'    },
    { Icon: Users,    color: 'var(--warning-600)',  bg: 'color-mix(in srgb, var(--warning-600) 12%, transparent)',      title: 'Live Classes',  desc: 'Expert-led sessions',  stat: '100+ classes' },
    { Icon: Brain,    color: 'var(--biology)',      bg: 'var(--biology-alpha-15)',                                      title: 'AI Tutor',      desc: 'Instant answers',      stat: '24×7 help'    },
  ];

  return (
    <div className="w-full flex flex-col overflow-hidden relative" style={{ height: 'calc(100vh - 64px)', backgroundColor: 'var(--background)', fontFamily: 'var(--font-family-inter)' }}>
      <OnboardingTopBar />

      {/* Ambient top-centre glow */}
      <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 65%)', filter: 'blur(55px)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="relative flex-1 flex flex-col" style={{ zIndex: 1, padding: '0 16px' }}>

        {/* Top breathing spacer — distributes space above hero */}
        <div style={{ flex: 1, maxHeight: 96 }} />

        {/* ── Hero icon ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <div className="relative flex items-center justify-center">
            {/* Breathing ring */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', width: 90, height: 90, borderRadius: 24, border: '1.5px solid color-mix(in srgb, var(--primary) 55%, transparent)', pointerEvents: 'none' }}
            />
            {/* Glow */}
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--primary) 45%, transparent) 0%, transparent 70%)', filter: 'blur(18px)', pointerEvents: 'none' }} />
            {/* Icon tile */}
            <motion.div
              animate={{ scale: [1, 1.03, 1], rotate: [0, 1, -1, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative overflow-hidden flex items-center justify-center"
              style={{ width: 58, height: 58, borderRadius: 17, background: 'var(--gradient-primary-btn)', boxShadow: '0 0 0 1px color-mix(in srgb, var(--primary) 60%, transparent), 0 0 28px color-mix(in srgb, var(--primary) 60%, transparent), 0 8px 24px var(--black-alpha-20)' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, var(--white-alpha-20) 0%, transparent 100%)', borderRadius: '17px 17px 0 0', pointerEvents: 'none' }} />
              <GraduationCap style={{ width: 28, height: 28, color: 'var(--white)', strokeWidth: 1.5, position: 'relative', zIndex: 1 }} />
            </motion.div>
          </div>
        </motion.div>

        <div style={{ height: 8, flexShrink: 0 }} />

        {/* ── Badge + headline + sub-text ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col items-center gap-1"
          style={{ textAlign: 'center' }}
        >
          <div className="inline-flex" style={{ padding: 1, borderRadius: 24, background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%)' }}>
            <div className="flex items-center gap-1" style={{ backgroundColor: 'var(--background)', borderRadius: 24, padding: '4px 12px' }}>
              <Sparkles style={{ width: 12, height: 12, color: 'var(--primary)' }} />
              <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-bold)', letterSpacing: '0.12em', color: 'var(--primary)' }}>NEW FEATURE</span>
            </div>
          </div>
          <div style={{ height: 4 }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              Your exam prep,<br />
              <span style={{ color: 'var(--primary)', fontWeight: 'var(--font-weight-bold)' }}>done right.</span>
            </h1>
            <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', lineHeight: 1.4, margin: 0 }}>
              One app. Every tool to crack your exam.
            </p>
          </div>

          {/* Dynamic exam chips — only live exams shown */}
          <div className="flex flex-wrap gap-2 justify-center" style={{ marginTop: 8 }}>
            {EXAMS.filter(e => !e.comingSoon).map(e => (
              <div key={e.id} className="inline-flex items-center gap-1" style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${e.color}`, backgroundColor: `color-mix(in srgb, ${e.color} 12%, transparent)` }}>
                <e.Icon style={{ width: 12, height: 12, color: e.color, strokeWidth: 2 }} />
                <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: e.color }}>{e.name}</span>
              </div>
            ))}
            {EXAMS.some(e => e.comingSoon) && (
              <div className="inline-flex items-center" style={{ padding: '4px 12px', borderRadius: 999, border: '1px solid var(--border)', backgroundColor: 'var(--white-alpha-4)' }}>
                <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>+{EXAMS.filter(e => e.comingSoon).length} coming soon</span>
              </div>
            )}
          </div>
        </motion.div>

        <div style={{ height: 8, flexShrink: 0 }} />

        {/* ── Feature cards grid ── */}
        {/* TODO: Link card stats to live data from user dashboard once authenticated */}
        <div className="shrink-0" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {cards.map(({ Icon, color, bg, title, desc, stat }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.18 + i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
              style={{ borderRadius: 12, padding: '12px', background: 'var(--secondary)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 8, background: bg, marginBottom: 8 }}>
                <Icon style={{ width: 16, height: 16, color, strokeWidth: 2 }} />
              </div>
              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', lineHeight: 1, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</div>
              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: 1.15, marginBottom: 4, letterSpacing: '-0.02em' }}>{stat}</div>
              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--foreground)', lineHeight: 1.3, opacity: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ flex: 1, maxHeight: 96 }} />
      </div>

      {/* ── Pinned CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="shrink-0"
        style={{ padding: '8px 16px 16px', background: 'linear-gradient(to bottom, transparent, var(--background) 35%)', position: 'sticky', bottom: 0, zIndex: 1 }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 cursor-pointer"
          style={{ height: 44, borderRadius: 'var(--radius-button)', border: 'none', background: 'var(--gradient-primary-btn)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)', boxShadow: 'var(--glow-primary)' }}
        >
          Start Your Prep
        </motion.button>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
          3 quick questions — takes under 1 minute
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Step 1 — Exam selection (multi-select).
 * User picks one or more exams they are preparing for.
 */
function Step1ExamView({ selectedExams, onToggleExam, onBack, onContinue }: Step1ExamViewProps) {
  const canContinue = selectedExams.length > 0;

  const mascotMsg = selectedExams.length === 0
    ? 'Which exam are you preparing for?'
    : selectedExams.length === 1
    ? 'Great choice! Want to add more?'
    : `${selectedExams.length} exams selected! Awesome!`;

  return (
    <div style={{ ...SHELL_STYLE, height: '100%' }}>
      <OnboardingTopBar />

      {/* Step header */}
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '12px 16px 8px' }}>
        <BackButton onClick={onBack} />
        <div className="flex-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>Step 1 of 3</div>
      </div>
      <ProgressBar progress={33} prev={0} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ padding: '0 16px 24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>

          {/* Mascot — appears instantly, message updates reactively */}
          <div className="flex flex-col items-center" style={{ marginBottom: 16, marginTop: 8 }}>
            <V4Mascot message={mascotMsg} size="small" />
          </div>

          {/* Exam grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            {EXAMS.map(({ id, name, desc, Icon, color, comingSoon }, index) => {
              const isSelected = selectedExams.includes(id);
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                  className="relative h-full"
                  style={{ opacity: comingSoon ? 0.35 : 1, filter: comingSoon ? 'grayscale(0.5)' : 'none', pointerEvents: comingSoon ? 'none' : 'auto' }}
                >
                  <SelectionCard isSelected={isSelected} onClick={() => onToggleExam(id)}>
                    <IconOrb Icon={Icon} isSelected={isSelected} color={color} size={36} />
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: isSelected ? 'var(--white)' : 'var(--foreground)', marginBottom: 2, lineHeight: 1.2 }}>{name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: isSelected ? 'var(--white-alpha-90)' : 'var(--muted-foreground)', lineHeight: 1.2 }}>{desc}</div>
                  </SelectionCard>
                  {comingSoon && (
                    <div style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'var(--secondary)', borderRadius: 999, padding: '1px 6px' }}>
                      <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Soon</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pinned CTA — disabled until at least 1 exam selected */}
      <div className="shrink-0" style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
        <motion.button
          whileTap={{ scale: canContinue ? 0.98 : 1 }}
          disabled={!canContinue}
          onClick={onContinue}
          style={btn(canContinue)}
        >
          Continue {canContinue && `(${selectedExams.length} selected)`}
        </motion.button>
      </div>
    </div>
  );
}

/**
 * Step 2 — Daily study hours (single-select).
 * UX intent: 4 cards give clear visual commitment levels.
 */
export function Step2HoursView({ selectedHours, onSelectHours, onBack, onContinue }: Step2HoursViewProps) {
  const canContinue = !!selectedHours;

  return (
    <div style={{ ...SHELL_STYLE, height: '100%' }}>
      <OnboardingTopBar />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: '12px 16px 8px' }}>
        <BackButton onClick={onBack} />
        <div className="flex-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>Step 2 of 3</div>
      </div>
      <ProgressBar progress={66} prev={33} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ padding: '24px 16px 24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center"
            style={{ marginBottom: 32, marginTop: 8 }}
          >
            <V4Mascot message="How much time can you study daily?" size="medium" />
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
            {STUDY_OPTIONS.map(({ id, value, Icon, desc, color }, index) => {
              const isSelected = selectedHours === id;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
                >
                  <SelectionCard isSelected={isSelected} onClick={() => onSelectHours(id)}>
                    <IconOrb Icon={Icon} isSelected={isSelected} color={color} size={56} />
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: isSelected ? 'var(--white)' : 'var(--foreground)', marginBottom: 4 }}>{value}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: isSelected ? 'var(--white-alpha-90)' : 'var(--muted-foreground)' }}>{desc}</div>
                  </SelectionCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="shrink-0" style={{ padding: '16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
        <motion.button
          whileHover={{ scale: canContinue ? 1.02 : 1 }}
          whileTap={{ scale: canContinue ? 0.98 : 1 }}
          disabled={!canContinue}
          onClick={onContinue}
          style={btn(canContinue)}
        >
          Continue
        </motion.button>
      </div>
    </div>
  );
}

/**
 * Step 3 — Live class day + time preference (multi-select for both).
 * Mascot message updates reactively as selections are made.
 */
export function Step3ClassView({ selectedDays, selectedTimes, onToggleDay, onToggleTime, onBack, onContinue }: Step3ClassViewProps) {
  const canContinue = selectedDays.length > 0 && selectedTimes.length > 0;

  const mascotMsg = selectedDays.length === 0
    ? 'When do you prefer live classes?'
    : selectedTimes.length === 0
    ? 'Great! Now pick your preferred time slots!'
    : `Perfect! ${selectedDays.length} days, ${selectedTimes.length} time slots!`;

  return (
    <div style={{ ...SHELL_STYLE, height: '100%' }}>
      <OnboardingTopBar />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: '12px 16px 8px' }}>
        <BackButton onClick={onBack} />
        <div className="flex-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>Step 3 of 3</div>
      </div>
      <ProgressBar progress={100} prev={66} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ padding: '0 16px 24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
            style={{ marginBottom: 32, marginTop: 16 }}
          >
            <V4Mascot message={mascotMsg} size="medium" />
          </motion.div>

          {/* ── Day selector ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginBottom: 32 }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              1. Study Days
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {DAYS.map(({ id, label }, index) => {
                const isSelected = selectedDays.includes(id);
                return (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 + index * 0.03 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onToggleDay(id)}
                    aria-pressed={isSelected}
                    className="flex items-center justify-center cursor-pointer"
                    style={{
                      aspectRatio: '1',
                      minHeight: 44,
                      background: isSelected ? 'var(--gradient-primary-btn)' : 'transparent',
                      border: isSelected ? '2px solid transparent' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? 'var(--glow-primary)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: isSelected ? 'var(--white)' : 'var(--foreground)' }}>
                      {label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: 8 }}>
              Select at least 2 days for best learning consistency
            </div>
          </motion.div>

          {/* ── Time slot selector ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              2. Preferred Time
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {TIME_SLOTS.map(({ id, label, time, Icon, color }, index) => {
                const isSelected = selectedTimes.includes(id);
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.25 + index * 0.05 }}
                  >
                    <SelectionCard isSelected={isSelected} onClick={() => onToggleTime(id)}>
                      <IconOrb Icon={Icon} isSelected={isSelected} color={color} size={48} />
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: isSelected ? 'var(--white)' : 'var(--foreground)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: isSelected ? 'var(--white-alpha-90)' : 'var(--muted-foreground)' }}>{time}</div>
                    </SelectionCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="shrink-0" style={{ padding: '16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
        <motion.button
          whileHover={{ scale: canContinue ? 1.02 : 1 }}
          whileTap={{ scale: canContinue ? 0.98 : 1 }}
          disabled={!canContinue}
          onClick={onContinue}
          style={btn(canContinue)}
        >
          {!selectedDays.length ? 'Select days to continue' : !selectedTimes.length ? 'Select time slots to continue' : 'Continue'}
        </motion.button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   ROOT ORCHESTRATOR
   Owns all onboarding state.
   Delegates rendering to view sub-components.
   Uses AnimatePresence for smooth view transitions.
══════════════════════════════════════ */

export function Component() {
  const navigate = useNavigate();

  // ── View routing ─────────────────────────────────────────────
  const [view, setView] = useState<View>('intro');

  // ── Onboarding state — collected across 3 steps ──────────────
  const [selectedExams, setSelectedExams] = useState<OnboardingState['selectedExams']>([]);
  const [selectedHours, setSelectedHours] = useState<OnboardingState['selectedHours']>('');
  const [selectedDays,  setSelectedDays]  = useState<OnboardingState['selectedDays']>([]);
  const [selectedTimes, setSelectedTimes] = useState<OnboardingState['selectedTimes']>([]);

  // ── Mutation helpers ──────────────────────────────────────────
  const toggleExam = (id: string) => {
    const next = selectedExams.includes(id)
      ? selectedExams.filter(e => e !== id)
      : [...selectedExams, id];
    setSelectedExams(next);
    const nextMsg = next.length === 0
      ? 'Which exam are you preparing for?'
      : next.length === 1
      ? 'Great choice! Want to add more?'
      : `${next.length} exams selected! Awesome!`;
    ttsSpeak(nextMsg);
  };

  const toggleDay = (id: string) => {
    const next = selectedDays.includes(id)
      ? selectedDays.filter(d => d !== id)
      : [...selectedDays, id];
    setSelectedDays(next);
    const nextMsg = next.length === 0
      ? 'When do you prefer live classes?'
      : selectedTimes.length === 0
      ? 'Great! Now pick your preferred time slots!'
      : `Perfect! ${next.length} days, ${selectedTimes.length} time slots!`;
    ttsSpeak(nextMsg);
  };

  const toggleTime = (id: string) => {
    const next = selectedTimes.includes(id)
      ? selectedTimes.filter(t => t !== id)
      : [...selectedTimes, id];
    setSelectedTimes(next);
    const nextMsg = selectedDays.length === 0
      ? 'When do you prefer live classes?'
      : next.length === 0
      ? 'Great! Now pick your preferred time slots!'
      : `Perfect! ${selectedDays.length} days, ${next.length} time slots!`;
    ttsSpeak(nextMsg);
  };

  // ── Derive transition messages ────────────────────────────────
  const transition1Message = (() => {
    const names = selectedExams.map(id => EXAMS.find(e => e.id === id)?.name).filter(Boolean);
    const headline = names.length === 1 ? `${names[0]} — let's go!` : `${names.length} exams — ambitious!`;
    return { message: `${headline} Let's set your pace.`, chips: names as string[] };
  })();

  const transition2Message = (() => {
    const hours = STUDY_OPTIONS.find(s => s.id === selectedHours);
    return `${hours?.value || 'Study time'} daily — solid! When do you learn best?`;
  })();

  // ── View rendering — AnimatePresence enables smooth enter/exit ─
  return (
    <AnimatePresence mode="wait">
      {view === 'intro' && (
        <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <IntroView onStart={() => { ttsSpeak('Which exam are you preparing for?'); setView('step1-exam'); }} />
        </motion.div>
      )}

      {view === 'step1-exam' && (
        <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <Step1ExamView
            selectedExams={selectedExams}
            onToggleExam={toggleExam}
            onBack={() => setView('intro')}
            onContinue={() => { ttsSpeak(transition1Message.message); setView('transition-1'); }}
          />
        </motion.div>
      )}

      {view === 'transition-1' && (
        <motion.div key="transition-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <StepMicroTransition
            message={transition1Message.message}
            chips={transition1Message.chips}
            onDone={() => { ttsSpeak('How much time can you study daily?'); setView('step2-hours'); }}
          />
        </motion.div>
      )}

      {view === 'step2-hours' && (
        <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <Step2HoursView
            selectedHours={selectedHours}
            onSelectHours={setSelectedHours}
            onBack={() => setView('step1-exam')}
            onContinue={() => { ttsSpeak(transition2Message); setView('transition-2'); }}
          />
        </motion.div>
      )}

      {view === 'transition-2' && (
        <motion.div key="transition-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <StepMicroTransition
            message={transition2Message}
            onDone={() => { ttsSpeak('When do you prefer live classes?'); setView('step3-class'); }}
          />
        </motion.div>
      )}

      {view === 'step3-class' && (
        <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <Step3ClassView
            selectedDays={selectedDays}
            selectedTimes={selectedTimes}
            onToggleDay={toggleDay}
            onToggleTime={toggleTime}
            onBack={() => setView('step2-hours')}
            onContinue={() => { ttsSpeak('Setting up your live classes...'); setView('transition'); }}
          />
        </motion.div>
      )}

      {view === 'transition' && (
        <motion.div key="transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <TransitionView onDone={() => setView('building-plan')} />
        </motion.div>
      )}

      {view === 'building-plan' && (
        <motion.div key="building-plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <BuildingPlanView onDone={() => navigate('/classes')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
