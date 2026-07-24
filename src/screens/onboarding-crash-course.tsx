/**
 * Onboarding (Crash Course) — School crash courses
 * Flow: step1-hours → transition-1 → step2-schedule → transition → building-plan → /crash-course-success?class=X
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Sprout, Flame, Rocket, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DAYS, TIME_SLOTS,
  SHELL_STYLE, btn,
  OnboardingTopBar, ProgressBar, BackButton, SelectionCard, IconOrb,
  V4Mascot,
  StepMicroTransition, TransitionView, BuildingPlanView,
} from './onboarding-default';
import { getCrash1112Info } from '../shared/classroom-catalog';

/* ── Study time options (~20h total content) ── */

const CC_STUDY_OPTIONS = [
  { id: '1-2', value: '1–2 hrs', Icon: Sprout, desc: 'Steady pace',       color: 'var(--success)', minDays: 5 },
  { id: '2-3', value: '2–3 hrs', Icon: Flame,  desc: 'Building momentum', color: 'var(--warning)', minDays: 4 },
  { id: '3-4', value: '3–4 hrs', Icon: Rocket, desc: 'Full throttle',     color: 'var(--primary)', minDays: 3 },
  { id: '4+',  value: '4+ hrs',  Icon: Zap,    desc: 'Maximum effort',    color: 'var(--error)',   minDays: 2 },
];

const MIN_DAYS_MAP: Record<string, number> = { '1-2': 5, '2-3': 4, '3-4': 3, '4+': 2 };

type ViewCC =
  | 'step1-hours'
  | 'transition-1'
  | 'step2-schedule'
  | 'transition'
  | 'building-plan';

/* ── Step 1: Hours per day ── */

function Step1HoursView({ selectedHours, onSelectHours, onBack, onContinue }: {
  selectedHours: string;
  onSelectHours: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const canContinue = !!selectedHours;

  return (
    <div style={{ ...SHELL_STYLE, height: '100%' }}>
      <OnboardingTopBar />
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '12px 16px 8px' }}>
        <BackButton onClick={onBack} />
        <div className="flex-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
          Step 1 of 2
        </div>
      </div>
      <ProgressBar progress={50} prev={0} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex justify-center" style={{ marginBottom: 32, marginTop: 8 }}
          >
            <V4Mascot message="How long can you study each day?" size="medium" />
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
            {CC_STUDY_OPTIONS.map(({ id, value, Icon, desc, color }, index) => {
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
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: isSelected ? 'var(--white)' : 'var(--foreground)', marginBottom: 4 }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: isSelected ? 'var(--white-alpha-90)' : 'var(--muted-foreground)' }}>
                      {desc}
                    </div>
                  </SelectionCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="shrink-0" style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
        <motion.button
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

/* ── Step 2: Days + time slot ── */

function Step2ScheduleView({ selectedHours, selectedDays, selectedTimes, onToggleDay, onToggleTime, onBack, onContinue }: {
  selectedHours: string;
  selectedDays: string[];
  selectedTimes: string[];
  onToggleDay: (id: string) => void;
  onToggleTime: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const minDays = MIN_DAYS_MAP[selectedHours] ?? 3;
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
        <div className="flex-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
          Step 2 of 2
        </div>
      </div>
      <ProgressBar progress={100} prev={50} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div style={{ padding: '0 16px 24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="flex flex-col items-center" style={{ marginBottom: 32, marginTop: 16 }}
          >
            <V4Mascot message={mascotMsg} size="medium" />
          </motion.div>

          {/* Day selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ marginBottom: 32 }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              1. Study Days
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {DAYS.map(({ id, label }, index) => {
                const isSelected = selectedDays.includes(id);
                const isLocked = isSelected && selectedDays.length <= minDays;
                return (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 + index * 0.03 }}
                    whileTap={{ scale: isLocked ? 1 : 0.95 }}
                    onClick={() => !isLocked && onToggleDay(id)}
                    aria-pressed={isSelected}
                    className="flex items-center justify-center"
                    style={{
                      aspectRatio: '1', minHeight: 44,
                      background: isSelected ? 'var(--gradient-primary-btn)' : 'transparent',
                      border: isSelected ? '2px solid transparent' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: isSelected ? 'var(--glow-primary)' : 'none',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.7 : 1,
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
              Select at least {minDays} days to complete your crash course on time
            </div>
          </motion.div>

          {/* Time slot selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              2. Preferred Time
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {TIME_SLOTS.map(({ id, label, time, Icon, color }, index) => {
                const isSelected = selectedTimes.includes(id);
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.25 + index * 0.05 }}
                  >
                    <SelectionCard isSelected={isSelected} onClick={() => onToggleTime(id)}>
                      <IconOrb Icon={Icon} isSelected={isSelected} color={color} size={48} />
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: isSelected ? 'var(--white)' : 'var(--foreground)', marginBottom: 2 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: isSelected ? 'var(--white-alpha-90)' : 'var(--muted-foreground)' }}>
                        {time}
                      </div>
                    </SelectionCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
        <motion.button
          whileTap={{ scale: canContinue ? 0.98 : 1 }}
          disabled={!canContinue}
          onClick={onContinue}
          style={btn(canContinue)}
        >
          {!selectedDays.length
            ? 'Select days to continue'
            : !selectedTimes.length
            ? 'Select time slots to continue'
            : 'Continue'}
        </motion.button>
      </div>
    </div>
  );
}

/* ── Root Orchestrator ── */

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Branch on URL params: `?sku=` (11–12) takes precedence over `?class=` (6–10 legacy).
  const skuParam = searchParams.get('sku');
  const info1112 = getCrash1112Info(skuParam);
  const is1112 = !!info1112;
  const cls = is1112
    ? info1112!.classLevel
    : parseInt(searchParams.get('class') ?? '8', 10);

  const [view, setView] = useState<ViewCC>('step1-hours');
  const [selectedHours, setSelectedHours] = useState('');
  const [selectedDays, setSelectedDays]   = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const toggleDay  = (id: string) => setSelectedDays(prev  => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  const toggleTime = (id: string) => setSelectedTimes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const transition1Message = (() => {
    const opt = CC_STUDY_OPTIONS.find(s => s.id === selectedHours);
    return `${opt?.value ?? 'Study time'} daily — solid! Which days work for you?`;
  })();

  const handleDone = () => {
    const enrollmentKey = is1112 ? info1112!.sku : String(cls);
    const continueQuery = is1112 ? `sku=${info1112!.sku}` : `class=${cls}`;
    if (is1112) {
      localStorage.setItem('cc_selected_sku', info1112!.sku);
    } else {
      localStorage.setItem('cc_selected_class', String(cls));
    }
    localStorage.setItem(`cc_setup_complete_${enrollmentKey}`, '1');
    localStorage.removeItem('prepmaster_ftue_shown');
    navigate(`/crash-course-success?${continueQuery}`, { replace: true });
  };

  return (
    <AnimatePresence mode="wait">
      {view === 'step1-hours' && (
        <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <Step1HoursView
            selectedHours={selectedHours}
            onSelectHours={setSelectedHours}
            onBack={() => navigate(-1)}
            onContinue={() => setView('transition-1')}
          />
        </motion.div>
      )}

      {view === 'transition-1' && (
        <motion.div key="transition-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <StepMicroTransition message={transition1Message} onDone={() => setView('step2-schedule')} />
        </motion.div>
      )}

      {view === 'step2-schedule' && (
        <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <Step2ScheduleView
            selectedHours={selectedHours}
            selectedDays={selectedDays}
            selectedTimes={selectedTimes}
            onToggleDay={toggleDay}
            onToggleTime={toggleTime}
            onBack={() => setView('step1-hours')}
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
          <BuildingPlanView onDone={handleDone} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
