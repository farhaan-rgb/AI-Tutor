/**
 * Next Live Class Card - Compact card for home page
 * Consistent height across all states (Live, Starting Soon, Upcoming)
 */

import { motion, AnimatePresence } from 'motion/react';
import { Clock, Video, X, RefreshCw, Check, Calendar, Radio } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';

interface LiveClass {
  topic: string;
  subject: string;
  subjectColor: string;
  scheduledTime: Date;
  durationMinutes?: number;
}

interface NextLiveClassCardProps {
  classes?: LiveClass[];
}

const defaultClasses: LiveClass[] = [
  {
    topic: "Newton's Second Law",
    subject: "Physics",
    subjectColor: "var(--blue-500)",
    scheduledTime: new Date(Date.now() + 2 * 60 * 1000), // 2 min — live
    durationMinutes: 60,
  },
  {
    topic: "Organic Chemistry Reactions",
    subject: "Chemistry",
    subjectColor: "var(--green-500)",
    scheduledTime: new Date(Date.now() + 18 * 60 * 1000), // 18 min — starting soon
    durationMinutes: 90,
  },
  {
    topic: "Integration Techniques",
    subject: "Mathematics",
    subjectColor: "var(--orange-500)",
    scheduledTime: new Date(Date.now() + 180 * 60 * 1000), // 3 h — upcoming
    durationMinutes: 60,
  },
];

type ClassState = 'live' | 'starting-soon' | 'upcoming';

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
}

function getClassState(scheduledTime: Date): ClassState {
  const diff = scheduledTime.getTime() - Date.now();
  if (diff <= 5 * 60 * 1000 && diff > -30 * 60 * 1000) return 'live';
  if (diff <= 30 * 60 * 1000) return 'starting-soon';
  return 'upcoming';
}

function formatCountdown(scheduledTime: Date): string {
  const diff = scheduledTime.getTime() - Date.now();
  if (diff <= 0) return 'Live Now';
  const totalSecs = Math.floor(diff / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) return `Starts in ${hours}h ${mins}m`;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `Starts in ${mm}:${ss}`;
}

function liveElapsed(scheduledTime: Date): string {
  const diff = Date.now() - scheduledTime.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just started';
  return `Started ${mins} min ago`;
}

// Short countdown for badge display
function badgeCountdown(scheduledTime: Date): string {
  const diff = scheduledTime.getTime() - Date.now();
  if (diff <= 0) return 'Live';
  const totalSecs = Math.floor(diff / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${mm}:${ss}`;
}

// All 30-min slots from 6:00 AM to 10:00 PM
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break;
      const hour12 = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      slots.push(`${hour12}:${m === 0 ? '00' : '30'} ${ampm}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

// TODO(api): GET /api/classes/schedule/booked-slots?date=:date
const DUMMY_BOOKED_SLOTS: Record<number, { time: string; label: string }[]> = {
  0: [{ time: '9:00 AM', label: 'Physics' }, { time: '11:00 AM', label: 'Chemistry' }, { time: '3:30 PM', label: 'Biology' }, { time: '6:00 PM', label: 'English' }],
  1: [{ time: '8:30 AM', label: 'Chemistry' }, { time: '2:00 PM', label: 'Physics' }, { time: '7:00 PM', label: 'Biology' }],
  2: [{ time: '10:00 AM', label: 'English' }, { time: '1:00 PM', label: 'Physics' }, { time: '4:30 PM', label: 'Chemistry' }],
  3: [{ time: '9:30 AM', label: 'Biology' }, { time: '3:00 PM', label: 'Maths' }, { time: '5:30 PM', label: 'Physics' }],
  4: [{ time: '8:00 AM', label: 'Chemistry' }, { time: '11:30 AM', label: 'English' }, { time: '2:30 PM', label: 'Biology' }, { time: '6:30 PM', label: 'Physics' }],
  5: [{ time: '10:30 AM', label: 'Maths' }, { time: '1:30 PM', label: 'Chemistry' }],
  6: [{ time: '9:00 AM', label: 'Physics' }, { time: '4:00 PM', label: 'Biology' }, { time: '7:30 PM', label: 'English' }],
};

function generateRescheduleSlots() {
  const days = [];
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      dayLabel: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    });
  }
  return days;
}

export function NextLiveClassCard({ classes = defaultClasses }: NextLiveClassCardProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [, setTick] = useState(0);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetView, setSheetView] = useState<'detail' | 'reschedule' | 'confirmed'>('detail');
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const currentClass = classes[currentIndex];
  const state = getClassState(currentClass.scheduledTime);
  const isLive = state === 'live';
  const isStartingSoon = state === 'starting-soon';

  // Color palettes — only the brand accent is hardcoded; card surfaces are
  // derived via color-mix over var(--card) so they tint correctly on both
  // light and dark backgrounds.
  const GREEN_ACCENT = '#49aa19';
  const ORANGE_ACCENT = '#d87a16';
  const GREEN = {
    cardBg: `linear-gradient(158deg, color-mix(in srgb, ${GREEN_ACCENT} 14%, var(--card)) 0%, color-mix(in srgb, ${GREEN_ACCENT} 8%, var(--card)) 100%)`,
    accent: GREEN_ACCENT,
    joinBg: GREEN_ACCENT,
    liveBadgeBg: `color-mix(in srgb, ${GREEN_ACCENT} 15%, transparent)`,
    liveBadgeBorder: `color-mix(in srgb, ${GREEN_ACCENT} 40%, transparent)`,
  };
  const ORANGE = {
    cardBg: `linear-gradient(158deg, color-mix(in srgb, ${ORANGE_ACCENT} 14%, var(--card)) 0%, color-mix(in srgb, ${ORANGE_ACCENT} 8%, var(--card)) 100%)`,
    accent: ORANGE_ACCENT,
  };

  // State badge label: countdown for all non-live states
  const stateLabel = isLive ? 'Live' : badgeCountdown(currentClass.scheduledTime);
  const stateColor = isLive ? GREEN.accent : isStartingSoon ? ORANGE.accent : 'var(--muted-foreground)';

  // 1s tick for starting-soon, 60s for live/upcoming
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), isStartingSoon ? 1000 : 60000);
    return () => clearInterval(interval);
  }, [isStartingSoon, isLive, currentIndex]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (classes.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % classes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [classes.length]);

  // Reset sheet state on close
  const closeSheet = () => {
    setShowSheet(false);
    setTimeout(() => {
      setSheetView('detail');
      setSelectedDay(0);
      setSelectedSlot(null);
    }, 350);
  };

  const handleDragEnd = (_e: unknown, { offset, velocity }: { offset: { x: number }; velocity: { x: number } }) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -10000) { setDirection(1); setCurrentIndex(prev => (prev + 1) % classes.length); }
    else if (swipe > 10000) { setDirection(-1); setCurrentIndex(prev => (prev - 1 + classes.length) % classes.length); }
  };

  const getJoinParam = (cls: LiveClass) => {
    const diff = cls.scheduledTime.getTime() - Date.now();
    if (diff > 5 * 60 * 1000) return 'early';
    if (diff > -30 * 60 * 1000) return 'live';
    return 'late';
  };

  const rescheduleDays = generateRescheduleSlots();

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 280 : -280, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 280 : -280, opacity: 0 }),
  };

  return (
    <div className="relative overflow-hidden" style={{ height: 108 }}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'spring', stiffness: 320, damping: 32 }, opacity: { duration: 0.12 } }}
          drag={classes.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.985 }}
          className="absolute inset-0 flex items-stretch overflow-hidden cursor-pointer"
          style={{ background: isLive ? GREEN.cardBg : ORANGE.cardBg, borderRadius: 12, boxShadow: isLive ? `0 0 20px color-mix(in srgb, ${GREEN_ACCENT} 25%, transparent)` : 'var(--shadow-sm)' }}
        >
          {/* Content */}
          <div className="flex flex-col flex-1" style={{ padding: '12px 16px' }}>
            {/* Row 1: topic + badge */}
            <div className="flex items-center" style={{ gap: 8, marginBottom: 2 }}>
              <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', flex: 1, minWidth: 0 }}>
                {currentClass.topic}
              </span>
              {isLive ? (
                <div className="flex items-center shrink-0" style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 9999, backgroundColor: GREEN.liveBadgeBg, border: `1px solid ${GREEN.liveBadgeBorder}`, gap: 4 }}>
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: GREEN.accent }}
                  />
                  <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: GREEN.accent, letterSpacing: 0.5 }}>LIVE</span>
                </div>
              ) : isStartingSoon ? (
                <div className="flex items-center shrink-0" style={{ paddingLeft: 8, paddingRight: 8, height: 20, borderRadius: 9999, backgroundColor: `color-mix(in srgb, ${ORANGE_ACCENT} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${ORANGE_ACCENT} 40%, transparent)`, gap: 4 }}>
                  <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: ORANGE.accent, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3 }}>
                    {stateLabel}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Row 2: time */}
            <div className="flex items-center" style={{ gap: 4, marginBottom: 12 }}>
              {isLive ? (
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: GREEN.accent }}>
                  {liveElapsed(currentClass.scheduledTime)}
                </span>
              ) : (
                <>
                  <Clock size={12} style={{ color: ORANGE.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: ORANGE.accent }}>{fmtTime(currentClass.scheduledTime)}</span>
                </>
              )}
            </div>

            {/* Row 3: CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                if (isLive) {
                  navigate(`/live-class?join=${getJoinParam(currentClass)}`);
                } else {
                  setShowSheet(true);
                }
              }}
              className="w-full flex items-center justify-center cursor-pointer"
              style={{
                height: 32, borderRadius: 8,
                backgroundColor: isLive ? GREEN.joinBg : 'transparent',
                border: isLive ? 'none' : `1px solid ${ORANGE.accent}`,
                color: isLive ? 'var(--white)' : ORANGE.accent,
                fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer', gap: 6,
              }}
            >
              {isLive && <Radio size={14} style={{ color: 'var(--white)' }} />}
              {isLive ? 'Join Live' : 'View Details'}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Detail / Reschedule Bottom Sheet */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0"
              style={{ backgroundColor: 'var(--overlay-heavy)', zIndex: 200 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 overflow-hidden"
              style={{ backgroundColor: 'var(--card)', borderRadius: '20px 20px 0 0', zIndex: 201, boxShadow: '0 -8px 40px var(--shadow-overlay)' }}
            >
              <AnimatePresence mode="wait">
                {sheetView === 'detail' && (
                  <motion.div
                    key="detail"
                    initial={{ x: 0 }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                    style={{ padding: '20px 20px 36px' }}
                  >
                    <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--border)', margin: '0 auto 20px' }} />

                    {/* Sheet header */}
                    <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-1" style={{
                          backgroundColor: isLive ? GREEN.liveBadgeBg : isStartingSoon ? 'rgba(216,122,22,0.15)' : 'var(--muted)',
                          border: `1px solid ${isLive ? GREEN.liveBadgeBorder : isStartingSoon ? 'rgba(216,122,22,0.4)' : 'var(--border)'}`,
                          borderRadius: 999, padding: '4px 8px', marginBottom: 8,
                        }}>
                          {(isLive || isStartingSoon) ? (
                            <motion.div
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: isLive ? 1.4 : 1.0, repeat: Infinity, ease: 'easeInOut' }}
                              style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: stateColor }}
                            />
                          ) : (
                            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: stateColor }} />
                          )}
                          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: stateColor, textTransform: isLive ? 'uppercase' : 'none', letterSpacing: '0.4px', fontVariantNumeric: 'tabular-nums' }}>
                            {isStartingSoon ? `Starts in ${stateLabel}` : stateLabel}
                          </span>
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: 0 }}>
                          {currentClass.topic}
                        </h2>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={closeSheet}
                        className="flex items-center justify-center cursor-pointer shrink-0"
                        style={{ background: 'var(--secondary)', border: 'none', borderRadius: 999, width: 32, height: 32, marginLeft: 12 }}
                      >
                        <X style={{ width: 16, height: 16, color: 'var(--muted-foreground)', strokeWidth: 2.5 }} />
                      </motion.button>
                    </div>

                    {/* Date + Time grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div style={{ padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', marginBottom: 4 }}>DATE</div>
                        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{fmtDate(currentClass.scheduledTime)}</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', marginBottom: 4 }}>TIME</div>
                        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{fmtTime(currentClass.scheduledTime)}</div>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-3" style={{ padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
                      <Clock style={{ width: 16, height: 16, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', marginBottom: 2 }}>DURATION</div>
                        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{currentClass.durationMinutes ?? 60} minutes</div>
                      </div>
                    </div>

                    {/* Join Live Class button (live or starting-soon) */}
                    {(isLive || isStartingSoon) && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { closeSheet(); navigate(`/live-class?join=${getJoinParam(currentClass)}`); }}
                        className="w-full flex items-center justify-center gap-2 cursor-pointer"
                        style={{
                          padding: '14px 16px', backgroundColor: isLive ? GREEN.joinBg : ORANGE.accent,
                          color: 'var(--white)', border: 'none', borderRadius: 12,
                          fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)',
                          boxShadow: 'none', marginBottom: 10,
                        }}
                      >
                        <Video style={{ width: 20, height: 20, strokeWidth: 2 }} />
                        {isLive ? 'Join Live Class' : 'Join Early'}
                        {isStartingSoon && (
                          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
                            · {badgeCountdown(currentClass.scheduledTime)}
                          </span>
                        )}
                      </motion.button>
                    )}

                    {/* Reschedule button */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSheetView('reschedule')}
                      className="w-full flex items-center justify-center gap-2 cursor-pointer"
                      style={{
                        padding: '12px 16px', backgroundColor: 'transparent',
                        color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12,
                        fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)',
                      }}
                    >
                      <RefreshCw style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                      Reschedule Class
                    </motion.button>
                  </motion.div>
                )}

                {sheetView === 'reschedule' && (
                  <motion.div
                    key="reschedule"
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                    style={{ padding: '20px 20px 36px' }}
                  >
                    <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--border)', margin: '0 auto 20px' }} />

                    {/* Reschedule header */}
                    <div className="flex items-center" style={{ marginBottom: 20 }}>
                      <div className="flex-1">
                        <h2 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: 0 }}>Reschedule Class</h2>
                        <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', margin: 0 }}>{currentClass.topic}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={closeSheet}
                        className="flex items-center justify-center cursor-pointer"
                        style={{ background: 'none', border: 'none', padding: 4, marginRight: -4 }}
                      >
                        <X style={{ width: 20, height: 20, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
                      </motion.button>
                    </div>

                    {/* Day selector */}
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Select Day</p>
                      <div className="flex gap-2 overflow-x-auto" style={{ paddingBottom: 4, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
                        {rescheduleDays.map((day, idx) => {
                          const isSelected = selectedDay === idx;
                          return (
                            <motion.button
                              key={idx}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { setSelectedDay(idx); setSelectedSlot(null); }}
                              className="shrink-0 cursor-pointer"
                              style={{
                                padding: '8px 12px', borderRadius: 8,
                                background: isSelected ? 'var(--primary)' : 'var(--secondary)',
                                border: isSelected ? 'none' : '1px solid var(--border)',
                                textAlign: 'center', minWidth: 56,
                              }}
                            >
                              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: isSelected ? 'var(--primary-foreground)' : 'var(--muted-foreground)', marginBottom: 2, textTransform: 'uppercase' }}>{day.dayLabel}</div>
                              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: isSelected ? 'var(--primary-foreground)' : 'var(--foreground)' }}>{day.dateLabel}</div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Select Time</p>
                      <div style={{ position: 'relative' }}>
                        <div className="slot-scroll" style={{ maxHeight: 196, borderRadius: 12, border: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                          {TIME_SLOTS.map((slot, i) => {
                            const bookedEntry = (DUMMY_BOOKED_SLOTS[selectedDay] ?? []).find(b => b.time === slot);
                            const isBooked = !!bookedEntry;
                            const isSelected = selectedSlot === slot;
                            const isLast = i === TIME_SLOTS.length - 1;
                            return (
                              <motion.button
                                key={slot}
                                whileTap={!isBooked ? { scale: 0.98 } : {}}
                                onClick={() => { if (!isBooked) setSelectedSlot(slot); }}
                                disabled={isBooked}
                                className="w-full flex items-center justify-between"
                                style={{
                                  padding: '0 16px', height: 44,
                                  cursor: isBooked ? 'not-allowed' : 'pointer',
                                  background: isSelected ? 'var(--primary-alpha-15)' : 'transparent',
                                  border: 'none',
                                  borderBottom: isLast ? 'none' : '1px solid color-mix(in srgb, var(--border) 40%, transparent)',
                                  opacity: isBooked ? 0.45 : 1,
                                }}
                              >
                                <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)', color: isSelected ? 'var(--primary)' : 'var(--foreground)' }}>
                                  {slot}
                                </span>
                                {isBooked && (
                                  <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                                    Scheduled
                                  </span>
                                )}
                                {isSelected && (
                                  <Check size={14} style={{ color: 'var(--primary)', strokeWidth: 2.5, flexShrink: 0 }} />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                        <div style={{ position: 'absolute', bottom: 1, left: 1, right: 1, height: 48, borderRadius: '0 0 12px 12px', background: 'linear-gradient(to bottom, transparent, var(--secondary))', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* Confirm button */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (selectedSlot) setSheetView('confirmed');
                      }}
                      className="w-full flex items-center justify-center gap-2"
                      style={{
                        padding: '14px 16px',
                        backgroundColor: selectedSlot ? 'var(--primary)' : 'var(--secondary)',
                        color: selectedSlot ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                        border: 'none', borderRadius: 12, cursor: selectedSlot ? 'pointer' : 'default',
                        fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)',
                        boxShadow: selectedSlot ? 'var(--glow-primary)' : 'none',
                        opacity: selectedSlot ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Calendar style={{ width: 16, height: 16, strokeWidth: 2 }} />
                      Confirm Reschedule
                    </motion.button>
                  </motion.div>
                )}

                {sheetView === 'confirmed' && (
                  <motion.div
                    key="confirmed"
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="flex flex-col items-center"
                    style={{ padding: '40px 20px 48px', textAlign: 'center' }}
                  >
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                      className="flex items-center justify-center"
                      style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success)', marginBottom: 16, boxShadow: '0 0 24px color-mix(in srgb, var(--success) 35%, transparent)' }}
                    >
                      <Check style={{ width: 32, height: 32, color: 'var(--success-foreground)', strokeWidth: 3 }} />
                    </motion.div>
                    <h2 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: '0 0 8px' }}>Class Rescheduled!</h2>
                    <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: '0 0 6px' }}>
                      {currentClass.topic}
                    </p>
                    <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: '0 0 32px' }}>
                      {rescheduleDays[selectedDay]?.dateLabel} · {selectedSlot}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={closeSheet}
                      style={{
                        padding: '13px 40px', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)',
                        border: 'none', borderRadius: 12, cursor: 'pointer',
                        fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)',
                        boxShadow: 'var(--glow-primary)',
                      }}
                    >
                      Done
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
