/**
 * Paywall V2 — Simplified, conversion-optimized plan selection.
 *
 * One bundled plan, user only picks duration.
 * - Emotional hook + social proof at top
 * - Duration selector with anchor pricing on recommended plan
 * - Contextual add-on (e.g., JEE Advanced for JEE Mains users)
 * - Clean CTA with reassurance
 *
 * Route: /paywall-v2?exam=jee|neet|cat|upsc
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  BookOpen,
  BarChart3,
  Video,
  Brain,
  X,
  Target,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

/* ─── Types ──────────────────────────────────────────────────────────────── */

type ExamId = 'jee' | 'neet' | 'cat' | 'upsc';
type DurationId = '3mo' | '6mo' | '12mo';

interface GydMaxStatus {
  status: 'none' | 'trial' | 'active' | 'expiring' | 'expired';
  expiresAt?: Date;
}

/* ─── Data ───────────────────────────────────────────────────────────────── */

const EXAM_META: Record<ExamId, {
  name: string;
  fullName: string;
  year: string;
  subjects: string;
  color: string;
  studentCount: string;
  addOn?: { id: string; name: string; description: string; price: number };
}> = {
  jee: {
    name: 'JEE',
    fullName: 'JEE Mains',
    year: '2026',
    subjects: 'Physics, Chemistry, Maths',
    color: 'var(--physics)',
    studentCount: '2.3L+',
    addOn: { id: 'jee-adv', name: 'JEE Advanced', description: '5yr Advanced PYQs + Advanced-level mocks', price: 499, anchor: 999 },
  },
  neet: {
    name: 'NEET',
    fullName: 'NEET UG',
    year: '2026',
    subjects: 'Physics, Chemistry, Biology',
    color: 'var(--success)',
    studentCount: '1.8L+',
    addOn: { id: 'aiims', name: 'AIIMS Prep', description: 'AIIMS-specific questions + mock tests', price: 299, anchor: 499 },
  },
  cat: {
    name: 'CAT',
    fullName: 'CAT MBA',
    year: '2025',
    subjects: 'Quant, VARC, DILR',
    color: 'var(--warning)',
    studentCount: '85K+',
    addOn: { id: 'other-mba', name: 'Other MBA Exams', description: 'XAT, SNAP, NMAT prep included', price: 299, anchor: 499 },
  },
  upsc: {
    name: 'UPSC',
    fullName: 'UPSC CSE',
    year: 'Prelims',
    subjects: 'GS Papers, CSAT',
    color: 'var(--purple-500)',
    studentCount: '1.2L+',
    addOn: { id: 'upsc-mains', name: 'UPSC Mains', description: 'Mains answer writing + essay prep', price: 799, anchor: 1499 },
  },
};

const DURATIONS: {
  id: DurationId;
  label: string;
  months: number;
  pricing: Record<ExamId, { price: number; anchor: number; discount: string; badge?: string }>;
}[] = [
  {
    id: '3mo',
    label: '3 months',
    months: 3,
    pricing: {
      jee: { price: 499, anchor: 699, discount: '29% OFF' },
      neet: { price: 499, anchor: 699, discount: '29% OFF' },
      cat: { price: 499, anchor: 699, discount: '29% OFF' },
      upsc: { price: 499, anchor: 699, discount: '29% OFF' },
    },
  },
  {
    id: '6mo',
    label: '6 months',
    months: 6,
    pricing: {
      jee: { price: 799, anchor: 1499, discount: '47% OFF', badge: 'POPULAR' },
      neet: { price: 799, anchor: 1499, discount: '47% OFF', badge: 'POPULAR' },
      cat: { price: 799, anchor: 1499, discount: '47% OFF', badge: 'POPULAR' },
      upsc: { price: 799, anchor: 1499, discount: '47% OFF', badge: 'POPULAR' },
    },
  },
  {
    id: '12mo',
    label: '12 months',
    months: 12,
    pricing: {
      jee: { price: 999, anchor: 2499, discount: '60% OFF' },
      neet: { price: 999, anchor: 2499, discount: '60% OFF' },
      cat: { price: 999, anchor: 2499, discount: '60% OFF' },
      upsc: { price: 999, anchor: 2499, discount: '60% OFF' },
    },
  },
];

const FEATURES = [
  { text: '10 years PYQs with solutions' },
  { text: 'AI-powered weak topic detection' },
  { text: 'Full mock tests with analysis' },
  { text: 'Live classes & recordings' },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatPrice(price: number): string {
  return price.toLocaleString('en-IN');
}

function getPerDay(price: number, months: number): number {
  return Math.round(price / (months * 30));
}

/* ─── Confetti ───────────────────────────────────────────────────────────── */

const CONFETTI = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 45 + Math.random() * 55;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist - 20,
    size: 4 + Math.random() * 5,
    color: ['var(--success)', 'var(--warning)', 'var(--physics)', 'var(--purple-400)'][i % 4],
    delay: Math.random() * 0.28,
  };
});

/* ─── Success Screen ─────────────────────────────────────────────────────── */

function SuccessScreen({ examId, duration, addOnIncluded }: { examId: ExamId; duration: DurationId; addOnIncluded: boolean }) {
  const navigate = useNavigate();
  const exam = EXAM_META[examId];
  const dur = DURATIONS.find(d => d.id === duration)!;
  const price = dur.pricing[examId].price + (addOnIncluded && exam.addOn ? exam.addOn.price : 0);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{
        backgroundColor: 'var(--background)',
        fontFamily: 'var(--font-family-inter)',
      }}
    >
      {/* Checkmark + confetti */}
      <div className="relative" style={{ marginBottom: 28 }}>
        <div className="absolute" style={{ top: '50%', left: '50%', pointerEvents: 'none' }}>
          {CONFETTI.map((p, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{ x: p.x, y: p.y, opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
              transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: p.color,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
          className="flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--success-alpha-12)',
            border: '3px solid var(--success)',
          }}
        >
          <Check style={{ width: 36, height: 36, color: 'var(--success)', strokeWidth: 2.5 }} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        style={{ textAlign: 'center', width: '100%', maxWidth: 320 }}
      >
        <h2 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--foreground)',
          margin: '0 0 8px',
          lineHeight: 1.3,
        }}>
          {exam.name} Prep Unlocked!
        </h2>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--muted-foreground)',
          margin: '0 0 4px',
          lineHeight: 1.5,
        }}>
          {dur.label} of complete {exam.name} preparation
          {addOnIncluded && exam.addOn && ` + ${exam.addOn.name}`}
        </p>
        <div style={{
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--success)',
          marginTop: 16,
          marginBottom: 28,
        }}>
          {formatPrice(price)} paid
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/learning-path')}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 'var(--radius-card)',
            background: exam.color,
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--white)',
            fontFamily: 'var(--font-family-inter)',
            boxShadow: `0 4px 24px color-mix(in srgb, ${exam.color} 35%, transparent)`,
          }}
        >
          Start Learning
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const examParam = searchParams.get('exam') as ExamId | null;
  const [examId] = useState<ExamId>(examParam && EXAM_META[examParam] ? examParam : 'jee');
  const [selectedDuration, setSelectedDuration] = useState<DurationId>('6mo');
  const [addOnSelected, setAddOnSelected] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'processing' | 'success'>('idle');

  // Simulated GYD Max status (in real app, fetch from backend/localStorage)
  const [gydMaxStatus] = useState<GydMaxStatus>({ status: 'none' });

  const exam = EXAM_META[examId];
  const duration = DURATIONS.find(d => d.id === selectedDuration)!;
  const pricing = duration.pricing[examId];
  const basePrice = pricing.price;
  const addOnPrice = addOnSelected && exam.addOn ? exam.addOn.price : 0;
  const totalPrice = basePrice + addOnPrice;
  const perDay = getPerDay(totalPrice, duration.months);

  // GYD Max discount (if already active)
  const gydMaxDiscount = gydMaxStatus.status === 'active' ? 500 : 0;
  const finalPrice = totalPrice - gydMaxDiscount;

  const handlePay = () => {
    setPhase('processing');
    setTimeout(() => setPhase('success'), 900);
  };

  if (phase === 'success') {
    return <SuccessScreen examId={examId} duration={selectedDuration} addOnIncluded={addOnSelected} />;
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--background)',
        fontFamily: 'var(--font-family-inter)',
      }}
    >
      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        {/* Header with gradient */}
        <div className="relative">
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, color-mix(in srgb, ${exam.color} 15%, var(--background)) 0%, var(--background) 100%)`,
              height: 280,
            }}
          />

          {/* Nav bar */}
          <div
            className="relative flex items-center justify-end pt-4 px-4"
            style={{ zIndex: 10 }}
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 40,
                height: 40,
                background: 'transparent',
                border: 'none',
              }}
            >
              <X style={{ width: 24, height: 24, color: 'var(--white-alpha-80)' }} />
            </button>
          </div>

          {/* Hero content */}
          <div style={{ position: 'relative', zIndex: 10, padding: '8px 20px 28px', textAlign: 'center' }}>
            {/* Title */}
            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--foreground)',
              margin: '0 0 8px',
              lineHeight: 1.2,
            }}>
              Crack {exam.name} {exam.year}
            </h1>

            {/* Value prop */}
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--muted-foreground)',
              letterSpacing: 0.3,
            }}>
              10yr PYQs • Live Classes • Mock Tests
            </div>
          </div>
        </div>

        {/* Duration selector */}
        <div style={{ padding: '16px 20px 20px' }}>
          <div
            className="relative flex gap-1"
            style={{
              padding: 4,
              background: 'var(--card)',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            {/* Badge positioned above middle card */}
            <div style={{
              position: 'absolute',
              top: -9,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '3px 10px',
              background: 'var(--purple-400)',
              borderRadius: 99,
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--white)',
              whiteSpace: 'nowrap',
              letterSpacing: 0.4,
              zIndex: 1,
              boxShadow: '0 2px 8px var(--purple-alpha-30)',
            }}>
              POPULAR
            </div>

            {DURATIONS.map((dur) => {
              const isSelected = selectedDuration === dur.id;
              const p = dur.pricing[examId];

              return (
                <motion.button
                  key={dur.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedDuration(dur.id)}
                  className="flex-1 min-w-0 overflow-hidden"
                  style={{
                    padding: '12px 4px',
                    background: isSelected ? exam.color : 'transparent',
                    border: isSelected ? `2px solid ${exam.color}` : '2px solid transparent',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Duration label */}
                  <div style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: isSelected ? 'var(--white)' : 'var(--muted-foreground)',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    whiteSpace: 'nowrap',
                  }}>
                    {dur.label}
                  </div>

                  {/* Price row: current + slashed */}
                  <div
                    className="flex items-center justify-center gap-[3px]"
                    style={{ marginBottom: 4 }}
                  >
                    <span style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: isSelected ? 'var(--white)' : 'var(--foreground)',
                    }}>
                      ₹{formatPrice(p.price)}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isSelected ? 'var(--white-alpha-50)' : 'var(--muted-foreground)',
                      textDecoration: 'line-through',
                    }}>
                      ₹{formatPrice(p.anchor)}
                    </span>
                  </div>

                </motion.button>
              );
            })}
          </div>

          {/* Per day price */}
          <div style={{
            textAlign: 'center',
            marginTop: 12,
            paddingTop: 4,
            fontSize: 'var(--text-sm)',
            color: 'var(--muted-foreground)',
            position: 'relative',
            zIndex: 1,
          }}>
            Just <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>₹{perDay}/day</span>
          </div>
        </div>

        {/* Features */}
        <div style={{ padding: '16px 20px 16px' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1" style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, var(--white-alpha-15) 100%)' }} />
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--purple-400)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              What you unlock
            </span>
            <div className="flex-1" style={{ height: 1, background: 'linear-gradient(90deg, var(--white-alpha-15) 0%, transparent 100%)' }} />
          </div>
          <div style={{
            background: 'var(--card)',
            borderRadius: 12,
          }}>
            {FEATURES.map((feat, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-3 py-[14px] px-4">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--purple-alpha-12)',
                    }}
                  >
                    <Check style={{ width: 14, height: 14, color: 'var(--purple-500)', strokeWidth: 2.5 }} />
                  </div>
                  <span style={{
                    fontSize: 14,
                    color: 'var(--muted-foreground)',
                    fontWeight: 500,
                  }}>
                    {feat.text}
                  </span>
                </div>
                {idx < FEATURES.length - 1 && (
                  <div style={{ paddingLeft: 56 }}>
                    <div style={{ height: 1, background: 'var(--white-alpha-8)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add-on (if available) */}
        {exam.addOn && (
          <div style={{ padding: '0 20px 32px' }}>
            {/* Bundle offer label */}
            <div className="flex items-center gap-2 mt-2 mb-2">
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--warning)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                Bundle & Save 50%
              </div>
              <div style={{
                fontSize: 11,
                color: 'var(--muted-foreground)',
              }}>
                Only with this purchase
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setAddOnSelected(!addOnSelected)}
              className="w-full flex items-center gap-3 cursor-pointer text-left"
              style={{
                padding: '14px 16px',
                background: addOnSelected
                  ? `color-mix(in srgb, ${exam.color} 8%, var(--card))`
                  : 'var(--card)',
                borderRadius: 12,
                border: addOnSelected
                  ? `2px solid ${exam.color}`
                  : '1px solid var(--border)',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              {/* Radio button */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: addOnSelected ? `2px solid ${exam.color}` : '2px solid var(--border)',
                  transition: 'border-color 0.2s',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: addOnSelected ? 1 : 0,
                    opacity: addOnSelected ? 1 : 0,
                  }}
                  transition={{ duration: 0.15 }}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: exam.color,
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  marginBottom: 2,
                }}>
                  Add {exam.addOn.name}
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: 'var(--muted-foreground)',
                  lineHeight: 1.3,
                }}>
                  {exam.addOn.description}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-[6px] shrink-0">
                <span style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: 'var(--muted-foreground)',
                  textDecoration: 'line-through',
                }}>
                  ₹{formatPrice(exam.addOn.anchor)}
                </span>
                <span style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--success)',
                }}>
                  ₹{formatPrice(exam.addOn.price)}
                </span>
              </div>
            </motion.button>
          </div>
        )}

        {/* GYD Max status (if active) */}
        {gydMaxStatus.status === 'active' && (
          <div style={{ padding: '0 20px 24px' }}>
            <div
              className="flex items-center gap-[10px]"
              style={{
                padding: '12px 16px',
                background: 'var(--success-alpha-12)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--success-alpha-15)',
              }}
            >
              <Check style={{ width: 16, height: 16, color: 'var(--success)' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: 600 }}>
                GYD Max active — {formatPrice(gydMaxDiscount)} off applied
              </span>
            </div>
          </div>
        )}

        {/* Bottom padding for CTA */}
        <div style={{ height: 140 }} />
      </div>

      {/* Fixed CTA */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background: 'var(--card)',
          borderTop: '1px solid var(--border)',
          padding: '16px 20px 34px',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handlePay}
          disabled={phase === 'processing'}
          style={{
            width: '100%',
            height: 44,
            borderRadius: 12,
            background: phase === 'processing' ? 'var(--muted)' : exam.color,
            border: 'none',
            cursor: phase === 'processing' ? 'default' : 'pointer',
            fontFamily: 'var(--font-family-inter)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--white)',
            transition: 'background 0.2s',
          }}
        >
          {phase === 'processing' ? 'Processing...' : `Start Full ${exam.name} Prep · ₹${formatPrice(finalPrice)}`}
        </motion.button>

        {/* Reassurance */}
        <div style={{
          textAlign: 'center',
          marginTop: 8,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--muted-foreground)',
        }}>
          One-time payment · Secure checkout
        </div>
      </div>
    </div>
  );
}
