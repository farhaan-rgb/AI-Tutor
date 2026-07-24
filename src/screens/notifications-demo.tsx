/**
 * Notifications Demo Screen
 * Showcases In-App toasts, Push notification mockups, and WhatsApp chat mockups
 * for 6 notification events — for stakeholder demos.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Smartphone, MessageCircle, Play, ChevronLeft, Check, Volume2, Video, Radio, BookOpen, PartyPopper, Zap, Target } from 'lucide-react';
import { GlassHeader, StatusBar } from '../shared/premium-ui';
import { useNavigate } from 'react-router';
import { useTheme } from '../app/contexts/theme-context';

// ─── Types ───────────────────────────────────────────────────────────────────

type Channel = 'inapp' | 'push' | 'whatsapp';

interface NotificationEvent {
  id: string;
  trigger: string;
  triggerDetail: string;
  channels: Channel[];
  inApp: InAppPayload;
  push: PushPayload;
  whatsapp: WhatsAppPayload;
}

interface InAppPayload {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  cta?: string;
  accentColor: string;
  // Live class card variant
  topic?: string;
  subject?: string;
  liveStatus?: string;
  // Goal progress variant
  goalProgress?: { done: number; total: number; goalName: string };
}

interface PushPayload {
  app: string;
  title: string;
  body: string;
  time: string;
  // Live Activity fields
  isLive?: boolean;
  countdown?: string;        // "mm:ss" initial value
  liveStep?: 0 | 1 | 2 | 3; // Scheduled | Starting | Live | Ended
  topic?: string;
  subject?: string;
}

interface WhatsAppPayload {
  messages: WhatsAppMessage[];
}

interface WhatsAppMessage {
  text: string;
  delay: number; // ms delay after previous
  hasCta?: boolean;
  ctaLabel?: string;
}

// ─── Event Data ───────────────────────────────────────────────────────────────

const EVENTS: NotificationEvent[] = [
  {
    id: 'live-30min',
    trigger: 'Live Class',
    triggerDetail: '30 min before',
    channels: ['push', 'whatsapp'],
    inApp: {
      icon: Video,
      iconColor: 'var(--warning)',
      iconBg: 'color-mix(in srgb, var(--warning) 15%, transparent)',
      title: 'Live class starts in 30 min',
      body: 'Electrostatics with Ankit Sir — Don\'t miss it!',
      cta: 'Set Reminder',
      accentColor: 'var(--warning)',
    },
    push: {
      app: 'Teachmint',
      title: 'Class starts in 30 min',
      body: 'Newton\'s Second Law · Physics',
      time: 'now',
      isLive: true,
      countdown: '29:45',
      liveStep: 1,
      topic: "Newton's Second Law",
      subject: 'Physics',
    },
    whatsapp: {
      messages: [
        { text: '⏰ *Class Reminder*\n\nHi Arjun! Your live class starts in *30 minutes.*\n\n📚 *Newton\'s Second Law*\n📌 Subject: Physics\n🕐 5:00 PM today\n\nBe on time — the teacher starts sharp! 👍\n👉 *Join Class*', delay: 0, hasCta: true, ctaLabel: 'Join Class' },
      ],
    },
  },
  {
    id: 'live-now',
    trigger: 'Live Class',
    triggerDetail: 'Class going live',
    channels: ['inapp', 'push', 'whatsapp'],
    inApp: {
      icon: Video,
      iconColor: 'var(--warning)',
      iconBg: 'color-mix(in srgb, var(--warning) 15%, transparent)',
      title: 'Class is LIVE now!',
      body: 'Newton\'s Second Law · Physics is live. Join now!',
      cta: 'Join Now',
      accentColor: 'var(--warning)',
      topic: "Newton's Second Law",
      subject: 'Physics',
      liveStatus: 'Just started',
    },
    push: {
      app: 'Teachmint',
      title: 'Class is LIVE now!',
      body: 'Newton\'s Second Law · Physics just started.',
      time: 'now',
      isLive: true,
      liveStep: 2,
      topic: "Newton's Second Law",
      subject: 'Physics',
    },
    whatsapp: {
      messages: [
        { text: '🔴 *Class is Live!*\n\nHi Arjun, your *Newton\'s Second Law* class has just started.\n\nDon\'t miss it — join now and make the most of it! ⚡\n👉 *Join Now*', delay: 0, hasCta: true, ctaLabel: 'Join Now' },
      ],
    },
  },
  {
    id: 'goal-complete',
    trigger: 'Daily Goal',
    triggerDetail: 'Goal completed',
    channels: ['inapp'],
    inApp: {
      icon: PartyPopper,
      iconColor: 'var(--success)',
      iconBg: 'color-mix(in srgb, var(--success) 15%, transparent)',
      title: 'Goal complete!',
      body: 'Newton\'s Laws — finished',
      accentColor: 'var(--success)',
      goalProgress: { done: 2, total: 4, goalName: "Newton's Laws" },
    },
    push: {
      app: 'Teachmint',
      title: 'All daily goals done!',
      body: 'You crushed today\'s plan. See your progress summary.',
      time: 'now',
    },
    whatsapp: {
      messages: [
        { text: '🎉 *Well done, Arjun!*\n\nYou\'ve completed *all 4 goals* for today!\n\n✅ Newton\'s Laws — Done\n✅ 5 PYQs — Done\n✅ Live Class — Attended\n✅ Mistakes review — Done\n\nGreat consistency. Keep it up tomorrow too! 💪', delay: 0 },
      ],
    },
  },
  {
    id: 'goal-reminder',
    trigger: 'Daily Goal',
    triggerDetail: 'Reminder to complete',
    channels: ['push'],
    inApp: {
      icon: BookOpen,
      iconColor: 'var(--primary)',
      iconBg: 'color-mix(in srgb, var(--primary) 15%, transparent)',
      title: 'Complete your daily goals',
      body: '2 goals still pending for today. Finish strong!',
      cta: 'Open Goals',
      accentColor: 'var(--primary)',
    },
    push: {
      app: 'Teachmint',
      title: '2 goals still pending',
      body: 'You\'re so close! Complete today\'s goals before midnight.',
      time: 'now',
    },
    whatsapp: {
      messages: [],
    },
  },
  {
    id: 'weak-topic',
    trigger: 'Weak Topic',
    triggerDetail: 'Low performance detected',
    channels: ['push', 'whatsapp'],
    inApp: {
      icon: Zap,
      iconColor: 'var(--warning)',
      iconBg: 'color-mix(in srgb, var(--warning) 15%, transparent)',
      title: 'Boost your weak spot',
      body: 'You scored 28% on Thermodynamics. 10 min can fix it!',
      cta: 'Practice Now',
      accentColor: 'var(--warning)',
    },
    push: {
      app: 'Teachmint',
      title: 'Thermodynamics needs work',
      body: 'Only 28% accuracy. Quick revision in 10 min — go!',
      time: '2 min ago',
    },
    whatsapp: {
      messages: [
        { text: '📉 *Weak Topic Alert*\n\nHi Arjun, your recent attempts show *Thermodynamics* needs more attention.\n\n⚠️ Accuracy: 28%\n📌 High-weightage topic in JEE\n\nA focused 10-min revision now can make a real difference. 🎯\n👉 *Revise Now*', delay: 0, hasCta: true, ctaLabel: 'Revise Now' },
      ],
    },
  },
  {
    id: 'exam-countdown',
    trigger: 'Exam Countdown',
    triggerDetail: '30 days to exam',
    channels: ['push', 'whatsapp'],
    inApp: {
      icon: Target,
      iconColor: 'var(--error)',
      iconBg: 'color-mix(in srgb, var(--error) 12%, transparent)',
      title: '30 days to JEE Mains!',
      body: 'You\'ve covered 67% of syllabus. Push harder now.',
      cta: 'View Study Plan',
      accentColor: 'var(--error)',
    },
    push: {
      app: 'Teachmint',
      title: 'JEE Mains in 30 days',
      body: '67% syllabus done. Check what\'s left and prioritize.',
      time: '5 min ago',
    },
    whatsapp: {
      messages: [
        { text: '📅 *30 Days to JEE Mains*\n\nHi Arjun, here\'s a quick look at where you stand:\n\n✅ Physics — 78%\n⚠️ Chemistry — 61%\n❌ Maths — 54%\n\nOverall: *67% syllabus covered*\n\nMaths needs the most attention right now. Stay consistent and you\'ll be ready! 💪\n👉 *View Study Plan*', delay: 0, hasCta: true, ctaLabel: 'View Study Plan' },
      ],
    },
  },
];

// ─── Channel Tab ──────────────────────────────────────────────────────────────

const CHANNELS: { id: Channel; label: string; icon: React.ReactNode }[] = [
  { id: 'inapp', label: 'In-App', icon: <Bell style={{ width: 14, height: 14 }} /> },
  { id: 'push', label: 'Push', icon: <Smartphone style={{ width: 14, height: 14 }} /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle style={{ width: 14, height: 14 }} /> },
];

// ─── In-App Toast ─────────────────────────────────────────────────────────────

function InAppToast({ payload, onDismiss }: { payload: InAppPayload; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);
  const [ctaDone, setCtaDone] = useState(false);
  const DURATION = 5000;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        onDismiss();
      }
    }, 50);
    return () => clearInterval(intervalRef.current!);
  }, [onDismiss]);

  const handleCta = () => {
    setCtaDone(true);
    clearInterval(intervalRef.current!);
    setTimeout(onDismiss, 1400);
  };

  const isLiveCard = !!payload.topic;

  return (
    <motion.div
      initial={{ y: -120, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -120, opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      style={{
        position: 'fixed', top: 12, left: 12, right: 12, zIndex: 9999,
        backgroundColor: isLiveCard
          ? `color-mix(in srgb, ${payload.accentColor} 10%, var(--card))`
          : 'var(--card)',
        border: `1px solid color-mix(in srgb, ${payload.accentColor} 30%, var(--border))`,
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}
    >
      {/* Progress bar at top */}
      <div style={{ height: 3, backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
        <motion.div
          style={{ height: '100%', backgroundColor: payload.accentColor, width: `${progress}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>

      {isLiveCard ? (
        /* ── Live Class Card Layout ── */
        <div style={{ padding: '14px 14px 14px' }}>
          {/* Top row: topic name + LIVE badge + dismiss */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div style={{
              fontFamily: 'var(--font-family-inter)', fontSize: 15,
              fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)',
              lineHeight: 1.3, flex: 1, minWidth: 0,
            }}>
              {payload.topic}
            </div>
            <div className="flex items-center gap-[6px] shrink-0">
              {/* LIVE pill */}
              <div className="flex items-center gap-1" style={{
                border: `1.5px solid ${payload.accentColor}`,
                borderRadius: 20, padding: '2px 8px',
                fontFamily: 'var(--font-family-inter)', fontSize: 11,
                fontWeight: 'var(--font-weight-semibold)',
                color: payload.accentColor,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: payload.accentColor }} />
                LIVE
              </div>
              <button onClick={onDismiss} className="flex cursor-pointer" style={{ background: 'none', border: 'none', padding: 2, color: 'var(--muted-foreground)' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>

          {/* Subject · Status */}
          <div className="flex items-center gap-[6px] mb-3" style={{
            fontFamily: 'var(--font-family-inter)', fontSize: 12,
            color: 'var(--muted-foreground)',
          }}>
            <span>{payload.subject}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span style={{ color: payload.accentColor, fontWeight: 'var(--font-weight-medium)' }}>{payload.liveStatus}</span>
          </div>

          {/* Full-width CTA button */}
          {payload.cta && (
            <motion.button
              onClick={handleCta}
              animate={ctaDone ? { scale: [1, 1.04, 1] } : {}}
              transition={{ duration: 0.25 }}
              className="w-full flex items-center justify-center gap-[7px] cursor-pointer"
              style={{
                background: ctaDone ? 'var(--success)' : payload.accentColor,
                color: '#fff', border: 'none', borderRadius: 10,
                fontFamily: 'var(--font-family-inter)', fontSize: 13,
                fontWeight: 'var(--font-weight-bold)',
                padding: '10px 14px',
                transition: 'background 0.2s ease',
              }}
            >
              {ctaDone
                ? <><Check style={{ width: 14, height: 14, strokeWidth: 3 }} /> Joined!</>
                : <><Video style={{ width: 14, height: 14, strokeWidth: 2.5 }} /> {payload.cta}</>
              }
            </motion.button>
          )}
        </div>
      ) : (
        /* ── Default Toast Layout ── */
        <div className="flex gap-3 items-start" style={{ padding: '14px 14px 16px' }}>
          {/* Icon */}
          <div className="flex items-center justify-center shrink-0" style={{
            width: 42, height: 42, borderRadius: 12,
            backgroundColor: payload.iconBg,
          }}>
            <payload.icon style={{ width: 20, height: 20, color: payload.iconColor, strokeWidth: 2 }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div style={{
              fontFamily: 'var(--font-family-inter)', fontSize: 14,
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              marginBottom: 2, lineHeight: 1.3,
            }}>
              {payload.title}
            </div>
            <div style={{
              fontFamily: 'var(--font-family-inter)', fontSize: 12,
              color: 'var(--muted-foreground)', lineHeight: 1.4,
            }}>
              {payload.body}
            </div>

            {/* Goal progress bar */}
            {payload.goalProgress && (() => {
              const { done, total } = payload.goalProgress;
              const pct = Math.round((done / total) * 100);
              return (
                <div style={{ marginTop: 8 }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 11, color: 'var(--muted-foreground)' }}>
                      Today's goals
                    </span>
                    <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 11, fontWeight: 'var(--font-weight-semibold)', color: payload.accentColor }}>
                      {done} of {total}
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, backgroundColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}>
                    <motion.div
                      initial={{ width: `${Math.round(((done - 1) / total) * 100)}%` }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: 99, backgroundColor: payload.accentColor }}
                    />
                  </div>
                </div>
              );
            })()}

            {payload.cta && (
              <div className="mt-[10px]">
                <motion.button
                  onClick={handleCta}
                  animate={ctaDone ? { scale: [1, 1.06, 1] } : {}}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-[5px] cursor-pointer"
                  style={{
                    background: ctaDone ? 'var(--success)' : payload.accentColor,
                    color: '#fff',
                    border: 'none', borderRadius: 8,
                    fontFamily: 'var(--font-family-inter)', fontSize: 12,
                    fontWeight: 'var(--font-weight-bold)',
                    padding: '6px 14px',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {ctaDone && <Check style={{ width: 13, height: 13, strokeWidth: 3 }} />}
                  {ctaDone ? 'Done!' : payload.cta}
                </motion.button>
              </div>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="flex items-center shrink-0 cursor-pointer"
            style={{
              background: 'none', border: 'none',
              padding: 2, color: 'var(--muted-foreground)',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Push Preview Modal ───────────────────────────────────────────────────────

function PushPreviewModal({ payload, onClose }: { payload: PushPayload; onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notifVisible, setNotifVisible] = useState(false);
  const [countdownSecs, setCountdownSecs] = useState(() => {
    if (payload.countdown) {
      const [m, s] = payload.countdown.split(':').map(Number);
      return m * 60 + s;
    }
    return 0;
  });

  useEffect(() => {
    const t = setTimeout(() => setNotifVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!payload.isLive || payload.liveStep !== 1) return;
    const timer = setInterval(() => {
      setCountdownSecs(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const countdownDisplay = `${Math.floor(countdownSecs / 60).toString().padStart(2, '0')}:${(countdownSecs % 60).toString().padStart(2, '0')}`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 2000,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      {/* iPhone mockup */}
      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative overflow-hidden shrink-0"
        style={{
          width: 320, height: 620,
          borderRadius: 50,
          border: '10px solid #111',
          boxShadow: '0 0 0 1.5px #2a2a2a, 0 40px 100px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Wallpaper */}
        <div className="absolute inset-0" style={{
          background: isDark
            ? 'linear-gradient(160deg, #08001a 0%, #0b0d2e 25%, #0a1a3a 50%, #05101e 75%, #010208 100%)'
            : 'linear-gradient(160deg, #dce8ff 0%, #ede8ff 35%, #fde8f8 65%, #fef0e8 100%)',
        }} />
        {/* Colour blobs */}
        <div className="absolute inset-0 overflow-hidden">
          {isDark ? (<>
            <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(90,30,255,0.55) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,255,0.35) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 180, left: -20, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,0,255,0.25) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: 80, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,100,220,0.3) 0%, transparent 60%)' }} />
            {[{top:'22%',left:'18%',s:3,o:0.5},{top:'35%',left:'72%',s:2,o:0.4},{top:'55%',left:'28%',s:2.5,o:0.35},{top:'18%',left:'55%',s:2,o:0.45},{top:'70%',left:'62%',s:3,o:0.3}].map((b,i)=>(
              <div key={i} style={{ position:'absolute', top:b.top, left:b.left, width:b.s, height:b.s, borderRadius:'50%', backgroundColor:`rgba(255,255,255,${b.o})` }} />
            ))}
          </>) : (<>
            <div style={{ position: 'absolute', top: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,100,255,0.18) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', top: 80, right: -50, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(80,180,255,0.15) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: 100, left: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,100,200,0.12) 0%, transparent 60%)' }} />
          </>)}
        </div>

        {/* Dynamic Island */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          {payload.isLive ? (
            <motion.div
              initial={{ width: 100 }}
              animate={{ width: 160 }}
              transition={{ delay: 0.7, type: 'spring', damping: 20, stiffness: 220 }}
              className="flex items-center justify-between overflow-hidden"
              style={{
                height: 32, backgroundColor: '#000', borderRadius: 20,
                padding: '0 10px',
              }}
            >
              <div className="flex items-center justify-center shrink-0" style={{
                width: 20, height: 20, borderRadius: 6,
                background: 'transparent',
              }}>
                <img src="/logo.png" style={{ width: 13, height: 13, objectFit: 'contain' }} />
              </div>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-family-inter)', letterSpacing: -0.3 }}>
                {payload.liveStep === 2 ? '● LIVE' : countdownDisplay}
              </span>
            </motion.div>
          ) : (
            <div style={{ width: 100, height: 32, backgroundColor: '#000', borderRadius: 20 }} />
          )}
        </div>

        {/* Status bar */}
        <div className="relative flex justify-between items-center" style={{ zIndex: 5, padding: '16px 28px 0' }}>
          <span style={{ color: isDark ? '#fff' : '#000', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-family-inter)', letterSpacing: -0.3 }}>9:41</span>
          <div className="flex items-center gap-[6px]">
            {/* Signal */}
            {[3, 5, 8, 11].map((h, i) => (
              <div key={i} style={{ width: 3, height: h, backgroundColor: isDark ? (i < 3 ? '#fff' : 'rgba(255,255,255,0.3)') : (i < 3 ? '#000' : 'rgba(0,0,0,0.25)'), borderRadius: 1 }} />
            ))}
            {/* WiFi icon */}
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none" style={{ marginLeft: 1 }}>
              <path d="M7 8.5a1.2 1.2 0 1 1 0 2.4A1.2 1.2 0 0 1 7 8.5z" fill={isDark ? 'white' : 'black'}/>
              <path d="M3.8 6.2A4.5 4.5 0 0 1 7 5a4.5 4.5 0 0 1 3.2 1.2" stroke={isDark ? 'white' : 'black'} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
              <path d="M1.2 3.5A8 8 0 0 1 7 1.5a8 8 0 0 1 5.8 2" stroke={isDark ? 'white' : 'black'} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
            </svg>
            {/* Battery */}
            <div style={{ width: 24, height: 12, border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}`, borderRadius: 3.5, position: 'relative', marginLeft: 1 }}>
              <div style={{ position: 'absolute', right: -4, top: 2.5, width: 2.5, height: 7, backgroundColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', borderRadius: 1 }} />
              <div style={{ position: 'absolute', left: 1.5, top: 1.5, bottom: 1.5, width: '75%', borderRadius: 1.5, backgroundColor: '#34c759' }} />
            </div>
          </div>
        </div>

        {/* Lock + time */}
        <div className="relative text-center" style={{ zIndex: 5, marginTop: 22 }}>
          <div style={{ color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.45)', fontSize: 12.5, fontFamily: 'var(--font-family-inter)', marginBottom: 4, letterSpacing: 0.4 }}>
            {dateStr}
          </div>
          <div className="flex items-start justify-center gap-[2px]">
            <div style={{ color: isDark ? '#fff' : '#000', fontSize: 72, fontWeight: 200, fontFamily: 'var(--font-family-inter)', lineHeight: 1, letterSpacing: -4 }}>
              {timeStr.replace(' AM', '').replace(' PM', '')}
            </div>
            <div style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)', fontSize: 14, fontFamily: 'var(--font-family-inter)', fontWeight: 500, marginTop: 12, letterSpacing: 0.5 }}>
              {timeStr.includes('AM') ? 'AM' : 'PM'}
            </div>
          </div>
        </div>

        {/* Notification / Live Activity card */}
        <AnimatePresence>
          {notifVisible && (
            <motion.div
              initial={{ y: -120, opacity: 0, scale: 0.88 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              style={{ position: 'relative', zIndex: 5, margin: '14px 10px 0' }}
            >
              {payload.isLive ? (
                /* ── Live Activity Card — iOS glassmorphism ── */
                <div className="relative overflow-hidden" style={{
                  backgroundColor: isDark ? 'rgba(10,10,16,0.86)' : 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(52px) saturate(220%)',
                  WebkitBackdropFilter: 'blur(52px) saturate(220%)',
                  borderRadius: 20,
                  border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid var(--black-alpha-8)',
                  boxShadow: isDark
                    ? '0 24px 60px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 0.5px rgba(255,255,255,0.04)'
                    : '0 12px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.95)',
                }}>
                  {/* Premium gradient sheen — top highlight only in dark */}
                  {isDark && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
                  )}
                  {/* Header */}
                  <div className="relative flex items-center gap-[10px]" style={{ zIndex: 2, padding: '12px 14px 0' }}>
                    <div className="shrink-0 flex items-center justify-center">
                      <img src="/logo.png" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    </div>
                    <span style={{ flex: 1, color: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600, letterSpacing: 0.6, fontFamily: 'var(--font-family-inter)', textTransform: 'uppercase' }}>
                      {payload.app}
                    </span>
                    <span style={{ color: 'color-mix(in srgb, var(--muted-foreground) 50%, transparent)', fontSize: 11, fontFamily: 'var(--font-family-inter)' }}>
                      {payload.time}
                    </span>
                  </div>

                  {/* Topic + Subject */}
                  <div style={{ padding: '8px 14px 0' }}>
                    <div style={{ color: 'var(--foreground)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-family-inter)', lineHeight: 1.2, letterSpacing: -0.2 }}>
                      {payload.topic}
                    </div>
                    <div style={{ color: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'var(--font-family-inter)', marginTop: 2 }}>
                      {payload.subject}
                    </div>
                  </div>

                  {/* Hero: big countdown or LIVE */}
                  <div style={{ padding: '12px 14px 14px', textAlign: 'center' }}>
                    {payload.liveStep === 2 ? (
                      <motion.div
                        animate={{ opacity: [1, 0.55, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="flex items-center justify-center gap-[10px]"
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--error)', boxShadow: '0 0 10px color-mix(in srgb, var(--error) 80%, transparent)' }} />
                        <span style={{ color: 'var(--foreground)', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-family-inter)', letterSpacing: 0.5 }}>
                          LIVE NOW
                        </span>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center gap-[1px]">
                        <span style={{ color: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-family-inter)', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Starts in
                        </span>
                        <span style={{ color: 'var(--foreground)', fontSize: 40, fontWeight: 700, fontFamily: 'var(--font-family-inter)', lineHeight: 1, letterSpacing: -2.5 }}>
                          {countdownDisplay}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                /* ── Standard Notification Card ── */
                <div>
                  <div style={{ position: 'absolute', inset: -12, borderRadius: 34, background: `radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--primary) 20%, transparent) 0%, transparent 65%)`, filter: 'blur(8px)', zIndex: -1 }} />
                  <div className="overflow-hidden" style={{
                    backgroundColor: isDark ? 'rgba(10,10,16,0.86)' : 'rgba(255,255,255,0.78)',
                    backdropFilter: 'blur(52px) saturate(220%)',
                    WebkitBackdropFilter: 'blur(52px) saturate(220%)',
                    borderRadius: 20,
                    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid var(--black-alpha-8)',
                    boxShadow: isDark
                      ? '0 16px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)'
                      : '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.95)',
                  }}>
                    <div className="flex items-center gap-[10px]" style={{ padding: '12px 14px 8px' }}>
                      <div className="shrink-0 flex items-center justify-center">
                        <img src="/logo.png" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                      </div>
                      <span style={{ flex: 1, color: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-family-inter)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{payload.app}</span>
                      <span style={{ color: 'color-mix(in srgb, var(--muted-foreground) 55%, transparent)', fontSize: 11, fontFamily: 'var(--font-family-inter)' }}>{payload.time}</span>
                    </div>
                    <div style={{ padding: '7px 14px 12px' }}>
                      <div style={{ color: 'var(--foreground)', fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-family-inter)', lineHeight: 1.3, marginBottom: 5, letterSpacing: -0.15 }}>
                        {payload.title}
                      </div>
                      <div style={{ color: 'var(--muted-foreground)', fontSize: 12.5, fontFamily: 'var(--font-family-inter)', lineHeight: 1.5 }}>
                        {payload.body}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Home indicator */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 110, height: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)', borderRadius: 2 }} />

        {/* iOS lock screen pills — camera + flashlight */}
        <div className="absolute flex justify-between" style={{ bottom: 36, left: 0, right: 0, padding: '0 28px' }}>
          {/* Flashlight */}
          <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)', backdropFilter: 'blur(20px)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M8 2h8l-1 7h-6L8 2z" fill={isDark ? 'white' : '#333'} opacity="0.9"/>
              <path d="M9 9l-3 13h12L15 9H9z" fill={isDark ? 'white' : '#333'} opacity="0.9"/>
              <circle cx="12" cy="16" r="2" fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}/>
            </svg>
          </div>
          {/* Camera */}
          <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)', backdropFilter: 'blur(20px)' }}>
            <svg width="20" height="18" viewBox="0 0 24 22" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="3" stroke={isDark ? 'white' : '#333'} strokeWidth="1.8" fill="none" opacity="0.9"/>
              <circle cx="12" cy="13" r="4" stroke={isDark ? 'white' : '#333'} strokeWidth="1.8" fill="none" opacity="0.9"/>
              <path d="M8 6l1.5-3h5L16 6" stroke={isDark ? 'white' : '#333'} strokeWidth="1.8" strokeLinejoin="round" fill="none" opacity="0.9"/>
              <circle cx="18.5" cy="9.5" r="1" fill={isDark ? 'white' : '#333'} opacity="0.6"/>
            </svg>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Android Push Modal ───────────────────────────────────────────────────────

function AndroidPushModal({ payload, onClose }: { payload: PushPayload; onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notifVisible, setNotifVisible] = useState(false);
  const [countdownSecs, setCountdownSecs] = useState(() => {
    if (payload.countdown) {
      const [m, s] = payload.countdown.split(':').map(Number);
      return m * 60 + s;
    }
    return 0;
  });

  useEffect(() => {
    const t = setTimeout(() => setNotifVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!payload.isLive || payload.liveStep !== 1) return;
    const timer = setInterval(() => setCountdownSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const countdownDisplay = `${Math.floor(countdownSecs / 60).toString().padStart(2, '0')}:${(countdownSecs % 60).toString().padStart(2, '0')}`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 2000,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      {/* Android phone frame */}
      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative overflow-hidden shrink-0"
        style={{
          width: 320, height: 620,
          borderRadius: 38,
          border: '9px solid #0e0e0e',
          boxShadow: '0 0 0 1px #2a2a2a, 0 40px 100px rgba(0,0,0,0.8)',
        }}
      >
        {/* Android wallpaper — Material You style */}
        <div className="absolute inset-0" style={{
          background: isDark
            ? 'linear-gradient(180deg, #1a0533 0%, #0d1a3a 40%, #051228 70%, #020a18 100%)'
            : 'linear-gradient(180deg, #e8f0ff 0%, #f0e8ff 40%, #fce8ff 70%, #fef4e8 100%)',
        }} />
        {/* Material You color blobs */}
        <div className="absolute inset-0 overflow-hidden">
          {isDark ? (<>
            <div style={{ position: 'absolute', top: -60, right: -40, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(103,80,164,0.5) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', top: 120, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(32,125,230,0.3) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', bottom: 100, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,60,220,0.2) 0%, transparent 65%)' }} />
          </>) : (<>
            <div style={{ position: 'absolute', top: -60, right: -40, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(103,80,164,0.15) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', top: 120, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(32,125,230,0.12) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', bottom: 100, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,60,180,0.1) 0%, transparent 65%)' }} />
          </>)}
        </div>

        {/* Punch-hole camera */}
        <div style={{
          position: 'absolute', top: 13, left: '50%', transform: 'translateX(-50%)',
          width: 12, height: 12, borderRadius: '50%', backgroundColor: '#000',
          zIndex: 10,
          boxShadow: '0 0 0 1.5px rgba(255,255,255,0.06)',
        }} />

        {/* Android status bar */}
        <div className="relative flex justify-between items-center" style={{ zIndex: 5, padding: '10px 22px 0' }}>
          <span style={{ color: isDark ? '#fff' : '#000', fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-family-inter)', letterSpacing: -0.2 }}>9:41</span>
          <div className="flex items-center gap-[5px]">
            {/* Signal bars */}
            {[3, 5, 7, 10].map((h, i) => (
              <div key={i} style={{ width: 3, height: h, backgroundColor: isDark ? (i < 3 ? '#fff' : 'rgba(255,255,255,0.28)') : (i < 3 ? '#000' : 'rgba(0,0,0,0.22)'), borderRadius: 1 }} />
            ))}
            {/* WiFi */}
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none" style={{ marginLeft: 2 }}>
              <path d="M7 8.5a1.2 1.2 0 1 1 0 2.4A1.2 1.2 0 0 1 7 8.5z" fill={isDark ? 'white' : 'black'}/>
              <path d="M3.8 6.2A4.5 4.5 0 0 1 7 5a4.5 4.5 0 0 1 3.2 1.2" stroke={isDark ? 'white' : 'black'} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
              <path d="M1.2 3.5A8 8 0 0 1 7 1.5a8 8 0 0 1 5.8 2" stroke={isDark ? 'white' : 'black'} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
            </svg>
            {/* Battery */}
            <div style={{ width: 22, height: 11, border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.38)'}`, borderRadius: 3, position: 'relative', marginLeft: 2 }}>
              <div style={{ position: 'absolute', right: -3.5, top: 2, width: 2, height: 7, backgroundColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.38)', borderRadius: 1 }} />
              <div style={{ position: 'absolute', left: 1.5, top: 1.5, bottom: 1.5, width: '72%', borderRadius: 1.5, backgroundColor: '#4ade80' }} />
            </div>
          </div>
        </div>

        {/* Android lock screen clock — Material You large time */}
        <div className="relative text-center" style={{ zIndex: 5, marginTop: 30 }}>
          <div style={{ color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.42)', fontSize: 12, fontFamily: 'var(--font-family-inter)', letterSpacing: 0.6, marginBottom: 6 }}>
            {dateStr}
          </div>
          {/* Material You clock: very thin weight, large */}
          <div style={{ color: isDark ? '#fff' : '#000', fontSize: 68, fontWeight: 100, fontFamily: 'var(--font-family-inter)', lineHeight: 1, letterSpacing: -2 }}>
            {timeStr.replace(' AM', '').replace(' PM', '')}
          </div>
          <div style={{ color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.42)', fontSize: 12, fontFamily: 'var(--font-family-inter)', letterSpacing: 1, marginTop: 4 }}>
            {timeStr.includes('AM') ? 'AM' : 'PM'}
          </div>
        </div>

        {/* Android notification card */}
        <AnimatePresence>
          {notifVisible && (
            <motion.div
              initial={{ y: -100, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              style={{ position: 'relative', zIndex: 5, margin: '18px 10px 0' }}
            >
              <div className="overflow-hidden" style={{
                backgroundColor: isDark ? 'rgba(10,10,16,0.86)' : 'rgba(255,255,255,0.78)',
                backdropFilter: 'blur(52px) saturate(220%)',
                WebkitBackdropFilter: 'blur(52px) saturate(220%)',
                borderRadius: 20,
                border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid var(--black-alpha-8)',
                boxShadow: isDark
                  ? '0 12px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)'
                  : '0 6px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
                padding: '12px 14px 10px',
              }}>
                {/* Header: icon + app name + time */}
                <div className="flex items-center gap-2 mb-[10px]">
                  <img src="/logo.png" style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-family-inter)', letterSpacing: 0.3 }}>
                    {payload.app}
                  </span>
                  <span style={{ color: 'color-mix(in srgb, var(--muted-foreground) 55%, transparent)', fontSize: 11, fontFamily: 'var(--font-family-inter)' }}>
                    {payload.time}
                  </span>
                </div>

                {/* Content */}
                {payload.isLive ? (
                  <div>
                    <div style={{ color: 'var(--foreground)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-family-inter)', lineHeight: 1.3, letterSpacing: -0.1 }}>
                      {payload.topic}
                    </div>
                    <div style={{ color: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'var(--font-family-inter)', marginTop: 2, marginBottom: 10 }}>
                      {payload.subject} · {payload.liveStep === 2
                        ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ color: 'var(--error)' }}>Live now</motion.span>
                        : <span>Starts in {countdownDisplay}</span>
                      }
                    </div>
                    {/* Action button — Android style: left-aligned, primary action only (swipe to dismiss) */}
                    <div style={{ marginTop: 2 }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 12, fontFamily: 'var(--font-family-inter)', fontWeight: 600, padding: 0 }}>
                        {payload.liveStep === 2 ? 'Join Now' : 'Join Early'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: 'var(--foreground)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-family-inter)', lineHeight: 1.3, marginBottom: 4, letterSpacing: -0.1 }}>
                      {payload.title}
                    </div>
                    <div style={{ color: 'var(--muted-foreground)', fontSize: 12.5, fontFamily: 'var(--font-family-inter)', lineHeight: 1.5 }}>
                      {payload.body}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Android nav bar gesture hint */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 120, height: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)', borderRadius: 2 }} />
      </motion.div>
    </motion.div>
  );
}

// ─── WhatsApp Modal ───────────────────────────────────────────────────────────

function WhatsAppModal({ payload, onClose }: { payload: WhatsAppPayload; onClose: () => void }) {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [showTyping, setShowTyping] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleMessages(0);
    setShowTyping(true);

    const timers: ReturnType<typeof setTimeout>[] = [];

    payload.messages.forEach((msg, idx) => {
      const totalDelay = payload.messages.slice(0, idx).reduce((sum, m) => sum + m.delay, 0) + (idx === 0 ? 800 : 600);
      timers.push(setTimeout(() => {
        setVisibleMessages(idx + 1);
        if (idx < payload.messages.length - 1) setShowTyping(true);
        else setShowTyping(false);
      }, totalDelay + payload.messages[idx].delay));
    });

    return () => timers.forEach(clearTimeout);
  }, [payload]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 2000,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="flex flex-col overflow-hidden shrink-0"
        style={{
          width: 320, height: 580,
          borderRadius: 44,
          border: '8px solid #1a1a1a',
          boxShadow: '0 0 0 2px #333, 0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* WA Header */}
        <div style={{
          backgroundColor: '#075E54',
          padding: '36px 14px 12px 14px',
          flexShrink: 0,
        }}>
          {/* Notch */}
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 120, height: 28, backgroundColor: '#1a1a1a', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }} />

          <div className="flex items-center gap-[10px]">
            <ChevronLeft style={{ width: 20, height: 20, color: '#fff', flexShrink: 0 }} />
            {/* Avatar — Teachmint */}
            <div className="flex items-center justify-center shrink-0" style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'transparent',
            }}>
              <img src="/logo.png" style={{ width: 24, height: 24, objectFit: 'contain', padding: 2 }} />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-family-inter)', lineHeight: 1 }}>Teachmint</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'var(--font-family-inter)', marginTop: 2 }}>Official Notifications</div>
            </div>
            <Volume2 style={{ width: 18, height: 18, color: '#fff', flexShrink: 0 }} />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-[6px]" style={{
          background: '#ECE5DD',
          padding: '12px 10px',
        }}>
          {/* Date stamp */}
          <div className="text-center mb-1">
            <span style={{
              backgroundColor: 'rgba(255,255,255,0.8)',
              padding: '3px 10px', borderRadius: 8,
              fontSize: 11, color: '#666',
              fontFamily: 'var(--font-family-inter)',
            }}>
              Today
            </span>
          </div>

          {payload.messages.slice(0, visibleMessages).map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="self-start max-w-[86%]"
            >
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '0 12px 12px 12px',
                padding: '8px 10px 6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-family-inter)', fontSize: 13,
                  color: '#111', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                }}
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                  }}
                />
                {msg.hasCta && (
                  <div style={{ marginTop: 8, borderTop: '1px solid #e5e5e5', paddingTop: 6 }}>
                    <button style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#128C7E', fontFamily: 'var(--font-family-inter)',
                      fontSize: 13, fontWeight: 700, padding: 0,
                    }}>
                      {msg.ctaLabel} →
                    </button>
                  </div>
                )}
                <div className="flex justify-end items-center gap-[3px] mt-[2px]">
                  <span style={{ color: '#999', fontSize: 10, fontFamily: 'var(--font-family-inter)' }}>{timeStr}</span>
                  <Check style={{ width: 12, height: 12, color: '#4FC3F7', strokeWidth: 2.5 }} />
                  <Check style={{ width: 12, height: 12, color: '#4FC3F7', strokeWidth: 2.5, marginLeft: -8 }} />
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {showTyping && visibleMessages < payload.messages.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="self-start"
            >
              <div className="flex items-center gap-1" style={{
                backgroundColor: '#fff',
                borderRadius: '0 12px 12px 12px',
                padding: '10px 14px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}>
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, delay, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#999' }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 shrink-0" style={{
          backgroundColor: '#F0F0F0',
          padding: '8px 10px',
        }}>
          <div className="flex-1" style={{
            backgroundColor: '#fff', borderRadius: 20,
            padding: '8px 14px',
            fontFamily: 'var(--font-family-inter)', fontSize: 13,
            color: '#999',
          }}>
            Type a message
          </div>
          <div className="flex items-center justify-center shrink-0" style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: '#128C7E',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  channel,
  onPreview,
}: {
  event: NotificationEvent;
  channel: Channel;
  onPreview: (event: NotificationEvent) => void;
}) {
  const channelColors: Record<Channel, string> = {
    inapp: 'var(--primary)',
    push: 'color-mix(in srgb, var(--purple-500, #7c3aed) 100%, transparent)',
    whatsapp: '#128C7E',
  };

  return (
    <div className="flex items-center gap-3" style={{
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '12px 14px',
    }}>
      {/* Icon */}
      <div className="flex items-center justify-center shrink-0" style={{
        width: 40, height: 40, borderRadius: 11,
        backgroundColor: event.inApp.iconBg,
      }}>
        <event.inApp.icon style={{ width: 18, height: 18, color: event.inApp.iconColor, strokeWidth: 2 }} />
      </div>

      {/* Trigger row */}
      <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
        <span style={{
          fontFamily: 'var(--font-family-inter)', fontSize: 12,
          fontWeight: 'var(--font-weight-semibold)',
          color: channelColors[channel],
          backgroundColor: `color-mix(in srgb, ${channelColors[channel]} 12%, transparent)`,
          padding: '3px 8px', borderRadius: 6,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {event.trigger}
        </span>
        <span style={{
          fontFamily: 'var(--font-family-inter)', fontSize: 12,
          color: 'var(--muted-foreground)',
        }}>
          {event.triggerDetail}
        </span>
      </div>

      {/* Preview button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onPreview(event)}
        className="shrink-0 flex items-center gap-[5px] self-center cursor-pointer"
        style={{
          padding: '7px 14px',
          background: channelColors[channel],
          color: '#fff',
          border: 'none', borderRadius: 10,
          fontFamily: 'var(--font-family-inter)', fontSize: 12,
          fontWeight: 'var(--font-weight-bold)',
        }}
      >
        <Play style={{ width: 11, height: 11, fill: '#fff', strokeWidth: 0 }} />
        Preview
      </motion.button>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel>('inapp');
  const [pushPlatform, setPushPlatform] = useState<'ios' | 'android'>('ios');
  const [activeToast, setActiveToast] = useState<InAppPayload | null>(null);
  const [activePush, setActivePush] = useState<PushPayload | null>(null);
  const [activeWhatsApp, setActiveWhatsApp] = useState<WhatsAppPayload | null>(null);

  const handlePreview = (event: NotificationEvent) => {
    if (channel === 'inapp') {
      setActiveToast(null);
      setTimeout(() => setActiveToast(event.inApp), 50);
    } else if (channel === 'push') {
      setActivePush(event.push);
    } else {
      setActiveWhatsApp(event.whatsapp);
    }
  };

  const channelColor: Record<Channel, string> = {
    inapp: 'var(--primary)',
    push: 'color-mix(in srgb, var(--purple-500, #7c3aed) 100%, transparent)',
    whatsapp: '#128C7E',
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center gap-3" style={{ padding: '12px 16px' }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', padding: 4 }}
          >
            <ChevronLeft style={{ width: 22, height: 22, strokeWidth: 2 }} />
          </button>
          <div className="flex-1">
            <div style={{
              fontFamily: 'var(--font-family-inter)', fontSize: 16,
              fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)',
            }}>
              Notification Flows
            </div>
          </div>
        </div>
      </GlassHeader>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Channel Tabs */}
        <div style={{ padding: '16px 16px 0' }}>
          <div className="flex" style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: 3,
          }}>
            {CHANNELS.map(ch => {
              const isActive = channel === ch.id;
              return (
                <motion.button
                  key={ch.id}
                  onClick={() => setChannel(ch.id)}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 flex items-center justify-center gap-[6px] cursor-pointer"
                  style={{
                    padding: '9px 8px',
                    background: isActive ? channelColor[ch.id] : 'transparent',
                    border: 'none', borderRadius: 9,
                    transition: 'background 0.2s ease',
                    color: isActive ? '#fff' : 'var(--muted-foreground)',
                  }}
                >
                  {ch.icon}
                  <span style={{
                    fontFamily: 'var(--font-family-inter)', fontSize: 13,
                    fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                  }}>
                    {ch.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* iOS / Android platform toggle — Push tab only */}
        {channel === 'push' && (
          <div className="flex gap-[6px]" style={{ padding: '10px 16px 0' }}>
            {(['ios', 'android'] as const).map(p => (
              <motion.button
                key={p}
                whileTap={{ scale: 0.94 }}
                onClick={() => setPushPlatform(p)}
                className="flex items-center gap-[6px] cursor-pointer"
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: `1.5px solid ${pushPlatform === p ? 'rgba(120,80,255,0.7)' : 'var(--border)'}`,
                  background: pushPlatform === p ? 'rgba(120,80,255,0.15)' : 'transparent',
                  color: pushPlatform === p ? 'rgba(180,150,255,1)' : 'var(--muted-foreground)',
                  fontFamily: 'var(--font-family-inter)', fontSize: 12.5,
                  fontWeight: pushPlatform === p ? 700 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                {p === 'ios' ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341c-.301.83-.619 1.39-1.068 1.917-.693.803-1.387 1.201-2.24 1.201-.611 0-1.201-.18-1.812-.519-.617-.34-1.17-.519-1.67-.519-.527 0-1.092.18-1.694.53-.61.35-1.1.53-1.49.53-.788 0-1.54-.43-2.25-1.283C4.58 16.14 4 14.66 4 13.12c0-1.58.55-2.86 1.65-3.86 1.09-1 2.32-1.5 3.7-1.5.61 0 1.258.18 1.947.54.69.35 1.14.54 1.363.54.2 0 .67-.2 1.41-.58.76-.38 1.43-.57 2.04-.55 1.587.07 2.773.73 3.566 1.99-1.416.84-2.12 2.03-2.12 3.57.01 1.19.45 2.18 1.33 2.97l.63.6zM14.4 2.4c0 .93-.34 1.8-1.02 2.6-.82.96-1.81 1.51-2.88 1.42-.01-.11-.02-.23-.02-.35 0-.9.38-1.86 1.07-2.64.34-.4.78-.73 1.32-.99.54-.27 1.04-.41 1.52-.43.01.13.01.26.01.39z"/></svg>
                )}
                {p === 'ios' ? 'iOS' : 'Android'}
              </motion.button>
            ))}
          </div>
        )}

        {/* Event cards */}
        <div className="flex flex-col gap-[10px]" style={{ padding: '12px 16px' }}>
          {EVENTS.filter(e => e.channels.includes(channel)).map(event => (
            <EventCard key={event.id} event={event} channel={channel} onPreview={handlePreview} />
          ))}
        </div>
      </div>

      {/* In-App Toast */}
      <AnimatePresence>
        {activeToast && (
          <InAppToast key={activeToast.title} payload={activeToast} onDismiss={() => setActiveToast(null)} />
        )}
      </AnimatePresence>

      {/* Push Modal */}
      <AnimatePresence>
        {activePush && pushPlatform === 'ios' && (
          <PushPreviewModal key="ios" payload={activePush} onClose={() => setActivePush(null)} />
        )}
        {activePush && pushPlatform === 'android' && (
          <AndroidPushModal key="android" payload={activePush} onClose={() => setActivePush(null)} />
        )}
      </AnimatePresence>

      {/* WhatsApp Modal */}
      <AnimatePresence>
        {activeWhatsApp && (
          <WhatsAppModal payload={activeWhatsApp} onClose={() => setActiveWhatsApp(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
