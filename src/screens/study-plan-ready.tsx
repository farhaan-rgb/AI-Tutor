/**
 * Study Plan Ready
 * Celebration screen shown after onboarding completes → navigates to tour.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Rocket, Calendar, Video, BookOpen } from 'lucide-react';
import { StatusBar } from '../shared/premium-ui';

// TODO(api): GET /api/user/study-plan
const DUMMY_STUDY_PLAN = { exam: 'CAT 2026', durationWeeks: 8, topicCount: 42, liveClassCount: 24 };

// TODO(api): GET /api/user/classrooms
const DUMMY_CLASSROOMS = [
  { id: 'pc1', subject: 'Quantitative Aptitude',    days: 'Mo · We · Fr', lessons: 45 },
  { id: 'pc2', subject: 'Verbal Ability & RC',       days: 'Tu · Th · Sa', lessons: 38 },
  { id: 'pc3', subject: 'Data Interpretation & LR',  days: 'Mo · We · Sa', lessons: 32 },
];

const ACCENT = '#d87a16';

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--purple-500)'];
type ConfettiShape = 'circle' | 'square' | 'ribbon';
const SHAPES: ConfettiShape[] = ['circle', 'square', 'ribbon'];
interface ConfettiParticle { id: number; left: number; delay: number; duration: number; color: string; width: number; height: number; rotate: number; shape: ConfettiShape; }
const CONFETTI: ConfettiParticle[] = Array.from({ length: 40 }, (_, i) => {
  const shape = SHAPES[i % 3];
  const base = [8, 8, 12, 16][i % 4];
  return { id: i, left: (i * 2.6) % 100, delay: (i * 0.05) % 1.4, duration: 1.8 + (i % 5) * 0.2, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], width: shape === 'ribbon' ? base * 2 : base, height: shape === 'ribbon' ? 4 : base, rotate: (i * 53) % 360, shape };
});

// ── Sound ─────────────────────────────────────────────────────────────────────
function playSuccessSound(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.15, t + 0.04); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t); osc.stop(t + 0.6);
    });
  } catch { /* silent */ }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true;
      const t = setTimeout(playSuccessSound, 200);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div
      className="relative flex flex-col"
      style={{ width: '100%', height: '100vh', backgroundColor: 'var(--background)', overflow: 'hidden' }}
    >
      {/* Glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 35% at 50% 30%, var(--primary-alpha-8) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <StatusBar />

      {/* Confetti */}
      {CONFETTI.map((p) => (
        <motion.div key={p.id}
          initial={{ y: -20, opacity: 1, rotate: p.rotate }}
          animate={{ y: '105vh', opacity: [1, 1, 0.4, 0], rotate: p.rotate + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', top: 0, left: `${p.left}%`, width: p.width, height: p.height, borderRadius: p.shape === 'circle' ? 9999 : p.shape === 'square' ? 4 : 0, backgroundColor: p.color, pointerEvents: 'none', zIndex: 0 }}
        />
      ))}

      {/* ── Hero — icon + title ── */}
      <div className="relative flex flex-col items-center" style={{ zIndex: 10, paddingTop: 40, paddingLeft: 24, paddingRight: 24 }}>
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
          className="relative flex items-center justify-center"
          style={{ marginBottom: 16 }}
        >
          <div className="flex items-center justify-center" style={{ width: 68, height: 68, borderRadius: 9999, background: `linear-gradient(145deg, ${ACCENT} 0%, color-mix(in srgb, ${ACCENT} 78%, black) 100%)`, boxShadow: `0 0 0 3px color-mix(in srgb, ${ACCENT} 14%, transparent), 0 6px 18px color-mix(in srgb, ${ACCENT} 22%, transparent)` }}>
            <Rocket style={{ width: 32, height: 32, color: 'var(--white)' }} strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex flex-col items-center"
          style={{ textAlign: 'center', gap: 6, marginBottom: 20 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, borderRadius: 9999, background: `${ACCENT}1f`, border: `1px solid ${ACCENT}3d` }}>
            <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {DUMMY_STUDY_PLAN.exam}
            </span>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Your Study Plan is{' '}
            <span style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, color-mix(in srgb, ${ACCENT} 70%, white) 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Ready!
            </span>
          </div>
        </motion.div>

        {/* ── Stats — compact single row ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex items-center w-full"
          style={{ gap: 8, marginBottom: 32 }}
        >
          {[
            { value: `${DUMMY_STUDY_PLAN.durationWeeks}+`, label: 'Weeks',   icon: Calendar },
            { value: `${DUMMY_STUDY_PLAN.liveClassCount}+`, label: 'Classes', icon: Video    },
            { value: `${DUMMY_STUDY_PLAN.topicCount}+`,    label: 'Topics',  icon: BookOpen },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center" style={{ gap: 4, paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 12, backgroundColor: 'var(--card-bg-secondary)', border: '1px solid var(--border)', flex: 1 }}>
              <div className="flex items-center" style={{ gap: 4 }}>
                <Icon size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} strokeWidth={2.5} />
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>{value}</span>
              </div>
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--muted-foreground)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Divider ── */}
        <div style={{ width: '100%', height: 1, backgroundColor: 'var(--border)', marginBottom: 24, opacity: 0.5 }} />

        {/* ── Classroom rows ── */}
        <div className="flex flex-col w-full" style={{ gap: 8 }}>
          {DUMMY_CLASSROOMS.map((room, index) => {
            const isFirst = index === 0;
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.07 }}
                className="flex items-center"
                style={{ padding: '12px 16px', borderRadius: 12, backgroundColor: isFirst ? `${ACCENT}10` : 'var(--card-bg-secondary)', border: `1px solid ${isFirst ? `${ACCENT}28` : 'transparent'}`, gap: 12 }}
              >
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: isFirst ? ACCENT : 'var(--gray-600)', width: 16, flexShrink: 0 }}>{index + 1}</span>

                <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
                  <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--foreground)' }}>{room.subject}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{room.days} · {room.lessons} lessons</span>
                </div>

                {isFirst && (
                  <div className="flex items-center shrink-0" style={{ gap: 4, paddingLeft: 8, paddingRight: 8, height: 24, borderRadius: 8, backgroundColor: `${ACCENT}20` }}>
                    <Video size={10} style={{ color: ACCENT }} />
                    <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, color: ACCENT, letterSpacing: '0.04em' }}>START</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── CTA — pinned to bottom ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="relative flex w-full mt-auto"
        style={{ zIndex: 10, padding: '16px 24px 44px' }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/live-class?tour=1')}
          className="flex items-center justify-center w-full cursor-pointer"
          style={{ height: 52, borderRadius: 12, border: 'none', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 'var(--text-base)', fontWeight: 700, boxShadow: '0 4px 20px var(--primary-alpha-40)' }}
        >
          Start your first class
        </motion.button>
      </motion.div>
    </div>
  );
}
