/**
 * Onboarding (CAT) — Flow A
 * Single-exam onboarding (CAT only). No exam selection step.
 *
 * Flow: step2-hours (Step 1 of 2) → transition-2 →
 *       step3-class (Step 2 of 2) → transition → building-plan → /learning-path
 *
 * When more exams go live, route users to /onboarding-default (Flow B) instead.
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Sprout, Flame, Rocket, Zap } from 'lucide-react';

const ONBOARDING_COMPLETE_KEY = 'prepmaster_onboarding_complete';
import { motion, AnimatePresence } from 'motion/react';
import {
  DAYS, TIME_SLOTS,
  SHELL_STYLE, btn,
  OnboardingTopBar, ProgressBar, BackButton, SelectionCard, IconOrb,
  V4Mascot,
  StepMicroTransition, TransitionView, BuildingPlanView,
} from './onboarding-default';

/* ── CAT 3-month study options (min 2-3h/day due to 158h syllabus) ── */

const CAT_STUDY_OPTIONS = [
  { id: '2-3', value: '2-3 hours', Icon: Sprout, desc: 'Steady pace',       color: 'var(--success)', minDays: 5 },
  { id: '3-5', value: '3-5 hours', Icon: Flame,  desc: 'Building momentum', color: 'var(--warning)', minDays: 4 },
  { id: '5-7', value: '5-7 hours', Icon: Rocket, desc: 'Full throttle',     color: 'var(--primary)', minDays: 3 },
  { id: '7+',  value: '7+ hours',  Icon: Zap,    desc: 'Maximum effort',    color: 'var(--error)',   minDays: 2 },
];

const MIN_DAYS_MAP: Record<string, number> = { '2-3': 5, '3-5': 4, '5-7': 3, '7+': 2 };

/* ── Types ───────────────────────────────────────────────────── */

type ViewCAT =
  | 'step2-hours'
  | 'transition-2'
  | 'step3-class'
  | 'transition'
  | 'building-plan';

/* ── Step2HoursViewCAT — "Step 1 of 2" label ─────────────────── */

function Step2HoursViewCAT({ selectedHours, onSelectHours, onBack, onContinue }: {
  selectedHours: string;
  onSelectHours: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const canContinue = !!selectedHours;
  const mascotMsg = 'How long can you study every day?';

  return (
    <div style={{ ...SHELL_STYLE, height: '100%' }}>
      <OnboardingTopBar />
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '12px 16px 8px' }}>
        <BackButton onClick={onBack} />
        <div className="flex-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>Step 1 of 2</div>
      </div>
      <ProgressBar progress={50} prev={0} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex justify-center" style={{ marginBottom: 32, marginTop: 8 }}>
            <V4Mascot message={mascotMsg} size="medium" />
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
            {CAT_STUDY_OPTIONS.map(({ id, value, Icon, desc, color }, index) => {
              const isSelected = selectedHours === id;
              return (
                <motion.div key={id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}>
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
      <div className="shrink-0" style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
        <motion.button whileTap={{ scale: canContinue ? 0.98 : 1 }} disabled={!canContinue} onClick={onContinue} style={btn(canContinue)}>
          Continue
        </motion.button>
      </div>
    </div>
  );
}

/* ── Step3ClassViewCAT — "Step 2 of 2" label ─────────────────── */

function Step3ClassViewCAT({ selectedHours, selectedDays, selectedTimes, onToggleDay, onToggleTime, onBack, onContinue }: {
  selectedHours: string;
  selectedDays: string[];
  selectedTimes: string[];
  onToggleDay: (id: string) => void;
  onToggleTime: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const minDays = MIN_DAYS_MAP[selectedHours] ?? 2;
  const canContinue = selectedDays.length >= minDays && selectedTimes.length > 0;
  const mascotMsg = selectedDays.length === 0
    ? 'Which days work best for you?'
    : selectedTimes.length === 0
    ? 'Great! Now pick your study time.'
    : "Perfect! You're all set.";

  return (
    <div style={{ ...SHELL_STYLE, height: '100%' }}>
      <OnboardingTopBar />
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '12px 16px 8px' }}>
        <BackButton onClick={onBack} />
        <div className="flex-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>Step 2 of 2</div>
      </div>
      <ProgressBar progress={100} prev={50} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ padding: '0 16px 24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="flex flex-col items-center" style={{ marginBottom: 32, marginTop: 16 }}>
            <V4Mascot message={mascotMsg} size="medium" />
          </motion.div>

          {/* Day selector */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>1. Study Days</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {DAYS.map(({ id, label }, index) => {
                const isSelected = selectedDays.includes(id);
                // Lock at minimum: can't deselect if it would drop below minDays
                const isLocked = isSelected && selectedDays.length <= minDays;
                return (
                  <motion.button key={id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.15 + index * 0.03 }}
                    whileTap={{ scale: isLocked ? 1 : 0.95 }} onClick={() => !isLocked && onToggleDay(id)}
                    aria-pressed={isSelected}
                    className="flex items-center justify-center"
                    style={{ aspectRatio: '1', minHeight: 44, background: isSelected ? 'var(--gradient-primary-btn)' : 'transparent', border: isSelected ? '2px solid transparent' : '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: isSelected ? 'var(--glow-primary)' : 'none', cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.7 : 1 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: isSelected ? 'var(--white)' : 'var(--foreground)' }}>{label}</span>
                  </motion.button>
                );
              })}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: 8 }}>
              Select at least {minDays} days to complete your 3-month plan on time
            </div>
          </motion.div>

          {/* Time slot selector */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>2. Preferred Time</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {TIME_SLOTS.map(({ id, label, time, Icon, color }, index) => {
                const isSelected = selectedTimes.includes(id);
                return (
                  <motion.div key={id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay: 0.25 + index * 0.05 }}>
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
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
        <motion.button whileTap={{ scale: canContinue ? 0.98 : 1 }} disabled={!canContinue} onClick={onContinue} style={btn(canContinue)}>
          {!selectedDays.length ? 'Select days to continue' : !selectedTimes.length ? 'Select time slots to continue' : 'Continue'}
        </motion.button>
      </div>
    </div>
  );
}

/* ── Root Orchestrator ───────────────────────────────────────── */

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examKey = searchParams.get('exam') ?? 'cat';

  const [view, setView] = useState<ViewCAT>('step2-hours');
  const [selectedHours, setSelectedHours] = useState('');
  const [selectedDays,  setSelectedDays]  = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const toggleDay  = (id: string) => setSelectedDays(prev  => prev.includes(id)  ? prev.filter(d => d !== id)  : [...prev,  id]);
  const toggleTime = (id: string) => setSelectedTimes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const markOnboardingComplete = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(ONBOARDING_COMPLETE_KEY) ?? '[]') as string[];
      if (!stored.includes(examKey)) {
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, JSON.stringify([...stored, examKey]));
      }
    } catch {
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, JSON.stringify([examKey]));
    }
    // Reset FTUE sheet so it always shows after fresh onboarding
    localStorage.removeItem('prepmaster_ftue_shown');
  };

  const transition2Message = (() => {
    const hours = CAT_STUDY_OPTIONS.find(s => s.id === selectedHours);
    return `${hours?.value || 'Study time'} daily — solid! When do you learn best?`;
  })();

  return (
    <AnimatePresence mode="wait">
      {view === 'step2-hours' && (
        <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <Step2HoursViewCAT
            selectedHours={selectedHours}
            onSelectHours={setSelectedHours}
            onBack={() => navigate(-1)}
            onContinue={() => setView('transition-2')}
          />
        </motion.div>
      )}

      {view === 'transition-2' && (
        <motion.div key="transition-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <StepMicroTransition message={transition2Message} onDone={() => setView('step3-class')} />
        </motion.div>
      )}

      {view === 'step3-class' && (
        <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <Step3ClassViewCAT
            selectedHours={selectedHours}
            selectedDays={selectedDays}
            selectedTimes={selectedTimes}
            onToggleDay={toggleDay}
            onToggleTime={toggleTime}
            onBack={() => setView('step2-hours')}
            onContinue={() => setView('transition')}
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
          <BuildingPlanView onDone={() => { markOnboardingComplete(); navigate('/study-plan-ready'); }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
