/**
 * Recording Player V2
 * Video player without chapter list — clean watch experience
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBar, GlassHeader } from '../shared/premium-ui';
import { ArrowLeft, Play, Pause, Maximize, Minimize2, AlertCircle, Check } from 'lucide-react';

/* ─────────── Types ─────────── */

interface RecordingData {
  id: string;
  title: string;
  subject: string;
  totalDuration: number; // minutes
  date: string;
}

/* ─────────── Mock Data ─────────── */

// TODO(api): GET /api/recordings/:id
const DUMMY_recordingData: RecordingData = {
  id: 'rec-001',
  title: "Newton's Laws of Motion",
  subject: 'Physics',
  totalDuration: 45,
  date: 'Apr 12, 2026',
};

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/* ─────────── Helpers ─────────── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─────────── Canvas lecture animation ─────────── */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  label?: string,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(angle - 0.4), y2 - 10 * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - 10 * Math.cos(angle + 0.4), y2 - 10 * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(label, (x1 + x2) / 2 + 6, (y1 + y2) / 2 - 4);
  }
}

function drawLectureFrame(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  t: number, total: number,
  now: number,
) {
  const pct = total > 0 ? t / total : 0;
  const slideIdx = Math.min(Math.floor(pct * 5), 4);
  const anim = now / 1000;

  const SLIDES = [
    { bg: ['#0d1117', '#1a1f3a'], accent: '#818cf8', label: 'Introduction',       title: "Newton's 1st Law"  },
    { bg: ['#0d1117', '#1a0d2e'], accent: '#c084fc', label: "Newton's 2nd Law",   title: 'F = m · a'         },
    { bg: ['#0d1117', '#082020'], accent: '#2dd4bf', label: "Newton's 3rd Law",   title: 'Action & Reaction' },
    { bg: ['#0d1117', '#1a0e00'], accent: '#fb923c', label: 'Free Body Diagrams', title: 'Forces on a Block' },
    { bg: ['#0d1117', '#081a08'], accent: '#4ade80', label: 'Practice',           title: 'Solving Problems'  },
  ];
  const s = SLIDES[slideIdx];

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, s.bg[0]);
  bg.addColorStop(1, s.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Dot grid
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let x = 24; x < W; x += 48) for (let y = 24; y < H; y += 48) {
    ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
  }

  // Top-left accent glow
  const glow = ctx.createRadialGradient(W * 0.12, 0, 0, W * 0.12, 0, W * 0.5);
  glow.addColorStop(0, s.accent + '20');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Label pill
  ctx.font = '12px system-ui, sans-serif';
  const pillLabel = `Physics · ${s.label}`;
  const pillW = ctx.measureText(pillLabel).width + 24;
  ctx.fillStyle = s.accent + '28';
  roundRect(ctx, 24, 24, pillW, 26, 6);
  ctx.fill();
  ctx.fillStyle = s.accent;
  ctx.fillText(pillLabel, 36, 41);

  // Main title
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(s.title, 24, 92);

  // Accent underline
  ctx.strokeStyle = s.accent + '70';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 104);
  ctx.lineTo(Math.min(24 + ctx.measureText(s.title).width, W - 24), 104);
  ctx.stroke();

  // ── Slide content ──
  if (slideIdx === 0) {
    ctx.font = '20px serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('An object in motion stays in motion', 24, 148);
    ctx.fillStyle = s.accent;
    ctx.fillText('unless acted upon by an external force.', 24, 176);

    const bx = ((anim * 80) % (W + 60)) - 30;
    const by = H * 0.67;
    for (let i = 3; i >= 0; i--) {
      ctx.beginPath();
      ctx.arc(bx - i * 22, by, 14 - i * 2, 0, Math.PI * 2);
      ctx.fillStyle = s.accent + Math.floor((4 - i) * 16).toString(16).padStart(2, '0');
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(bx, by, 18, 0, Math.PI * 2);
    ctx.fillStyle = s.accent;
    ctx.fill();
    if (bx < W - 60) drawArrow(ctx, bx + 22, by, bx + 58, by, 'rgba(255,255,255,0.7)', 'v');
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, by + 26); ctx.lineTo(W, by + 26); ctx.stroke();
    ctx.setLineDash([]);

  } else if (slideIdx === 1) {
    const eq = 'F = m · a';
    ctx.font = 'bold 64px serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(eq, (W - ctx.measureText(eq).width) / 2, 228);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Force (N)', 40, 250);
    ctx.fillText('mass (kg)', W / 2 - 24, 250);
    ctx.fillText('acceleration (m/s²)', W - 168, 250);

    const bx = W * 0.66 + Math.sin(anim * 0.8) * 20;
    const by = H * 0.76;
    const fl = 50 + Math.sin(anim * 1.4) * 28;
    ctx.fillStyle = s.accent + '40';
    ctx.strokeStyle = s.accent;
    ctx.lineWidth = 2;
    ctx.fillRect(bx - 28, by - 28, 56, 56);
    ctx.strokeRect(bx - 28, by - 28, 56, 56);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText('m', bx - 6, by + 5);
    drawArrow(ctx, bx - 32 - fl, by, bx - 32, by, s.accent, 'F');

  } else if (slideIdx === 2) {
    ctx.font = '19px serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('"Every action has an equal', 24, 148);
    ctx.fillText(' and opposite reaction."', 24, 176);

    const cx = W / 2;
    const cy = H * 0.62;
    const pulse = Math.sin(anim * 2) * 5;

    ctx.beginPath(); ctx.arc(cx - 100, cy, 30 + pulse * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = s.accent + '30'; ctx.fill();
    ctx.strokeStyle = s.accent; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.fillText('A', cx - 108, cy + 6);

    ctx.beginPath(); ctx.arc(cx + 100, cy, 30 + pulse * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#fb923c30'; ctx.fill();
    ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillText('B', cx + 93, cy + 6);

    drawArrow(ctx, cx - 68, cy - 10, cx - 8, cy - 10, s.accent, 'F_AB');
    drawArrow(ctx, cx + 68, cy + 10, cx + 8, cy + 10, '#fb923c', 'F_BA');

    ctx.font = 'bold 17px serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const eq3 = '|F_AB| = |F_BA|,  opposite directions';
    ctx.fillText(eq3, cx - ctx.measureText(eq3).width / 2, H - 28);

  } else if (slideIdx === 3) {
    ctx.font = '17px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('Draw all forces acting on the object:', 24, 148);

    const cx = W * 0.38;
    const cy = H * 0.61;
    const bs = 52;
    ctx.fillStyle = s.accent + '20'; ctx.strokeStyle = s.accent; ctx.lineWidth = 2;
    ctx.fillRect(cx - bs / 2, cy - bs / 2, bs, bs);
    ctx.strokeRect(cx - bs / 2, cy - bs / 2, bs, bs);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.fillText('block', cx - 16, cy + 5);

    drawArrow(ctx, cx, cy + bs / 2 + 4, cx, cy + bs / 2 + 56, s.accent, 'W');
    drawArrow(ctx, cx, cy - bs / 2 - 4, cx, cy - bs / 2 - 56, '#60a5fa', 'N');
    drawArrow(ctx, cx + bs / 2 + 4, cy, cx + bs / 2 + 48 + Math.sin(anim * 1.5) * 10, cy, '#4ade80', 'F');
    drawArrow(ctx, cx - bs / 2 - 4, cy, cx - bs / 2 - 40, cy, '#f87171', 'f');

    const legend: [string, string][] = [
      ['N – Normal force', '#60a5fa'],
      ['W – Weight (mg)', s.accent],
      ['F – Applied force', '#4ade80'],
      ['f – Friction', '#f87171'],
    ];
    legend.forEach(([txt, col], i) => {
      ctx.fillStyle = col; ctx.font = '13px system-ui'; ctx.fillText(txt, W * 0.6, 170 + i * 26);
    });

  } else {
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = s.accent;
    ctx.fillText('PRACTICE PROBLEM', 24, 152);
    ctx.font = '17px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('A 5 kg block is pushed with 20 N.', 24, 182);
    ctx.fillText('Find the acceleration.', 24, 206);
    ctx.font = 'bold 13px system-ui';
    ctx.fillStyle = s.accent;
    ctx.fillText('SOLUTION', 24, 246);
    ctx.font = '17px serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('a = F / m', 24, 272);
    ctx.fillText('a = 20 / 5', 24, 300);
    ctx.font = 'bold 22px serif';
    ctx.fillStyle = s.accent;
    ctx.fillText('\u2234  a = 4 m/s\u00b2', 24, 336);
  }

  // Progress bar
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, H - 3, W, 3);
  ctx.fillStyle = s.accent;
  ctx.fillRect(0, H - 3, W * pct, 3);
}

/* ─────────── Sub-components ─────────── */

function LoadingSkeleton() {
  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <StatusBar />
      <div className="flex items-center gap-4 px-4 py-3">
        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', backgroundColor: 'var(--muted)' }} />
        <div className="flex flex-col gap-2">
          <div style={{ width: 120, height: 20, borderRadius: 4, backgroundColor: 'var(--muted)' }} />
          <div style={{ width: 180, height: 14, borderRadius: 4, backgroundColor: 'var(--muted)' }} />
        </div>
      </div>
      <div style={{ aspectRatio: '16/9', backgroundColor: 'var(--muted)' }} />
      <div className="px-4 pt-5 flex flex-col gap-3">
        <div style={{ height: 20, width: 160, borderRadius: 4, backgroundColor: 'var(--muted)' }} />
        <div style={{ height: 16, width: 120, borderRadius: 4, backgroundColor: 'var(--muted)' }} />
      </div>
    </div>
  );
}

function ErrorState({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="w-full min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)', fontFamily: 'var(--font-family-inter)' }}>
      <StatusBar />
      <div className="px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="flex items-center justify-center cursor-pointer"
          style={{ width: 44, height: 44, background: 'none', border: 'none', borderRadius: 'var(--radius)' }}
        >
          <ArrowLeft style={{ width: 24, height: 24, color: 'var(--foreground)', strokeWidth: 1.5 }} />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
        <AlertCircle style={{ width: 48, height: 48, color: 'var(--destructive)' }} />
        <div className="flex flex-col items-center gap-2 text-center">
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
            Couldn't load recording
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
            Check your connection and try again
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          className="flex items-center justify-center cursor-pointer"
          style={{
            height: 44, paddingLeft: 24, paddingRight: 24,
            backgroundColor: 'var(--primary)', border: 'none',
            borderRadius: 'var(--radius-button)',
            fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--white)',
          }}
        >
          Try Again
        </motion.button>
      </div>
    </div>
  );
}

/* ─────────── Component ─────────── */

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const currentTimeRef = useRef(currentTime);
  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight && window.innerWidth >= 600
  );

  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 600);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const topicTitle = searchParams.get('topic') || DUMMY_recordingData.title;
  const totalSeconds = DUMMY_recordingData.totalDuration * 60;

  // Simulate data load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Simulate playback progression
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= totalSeconds) {
          setIsPlaying(false);
          return prev;
        }
        return prev + playbackSpeed;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalSeconds]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Auto-hide controls after 3s of playing
  useEffect(() => {
    if (isPlaying) {
      resetHideTimer();
    } else {
      setControlsVisible(true);
      clearHideTimer();
    }
    return clearHideTimer;
  }, [isPlaying]);

  // Keep currentTimeRef in sync for canvas rAF loop
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  // Canvas animation loop (runs at 60fps; reads currentTimeRef to stay in sync with scrubbing)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let running = true;
    const loop = () => {
      if (!running) return;
      const ctx = canvas.getContext('2d');
      if (ctx) drawLectureFrame(ctx, canvas.width, canvas.height, currentTimeRef.current, totalSeconds, Date.now());
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [totalSeconds]);

  function clearHideTimer() {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  }

  function resetHideTimer() {
    clearHideTimer();
    setControlsVisible(true);
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      setShowSpeedMenu(false);
    }, 3000);
  }

  const handleVideoTap = () => {
    if (showSpeedMenu) {
      setShowSpeedMenu(false);
      if (isPlaying) resetHideTimer();
      return;
    }
    if (!isPlaying) {
      setIsPlaying(true);
    } else {
      setControlsVisible(true);
      resetHideTimer();
    }
  };

  const toggleSpeedMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showSpeedMenu) {
      clearHideTimer();
      setShowSpeedMenu(true);
    } else {
      setShowSpeedMenu(false);
      if (isPlaying) resetHideTimer();
    }
  };

  const selectSpeed = (speed: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    resetHideTimer();
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen().then(() => {
        screen.orientation?.lock?.('landscape-primary').catch(() => {});
      }).catch(() => {});
    } else {
      screen.orientation?.unlock?.();
      document.exitFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(Math.round(ratio * totalSeconds));
    resetHideTimer();
  };

  const progress = (currentTime / totalSeconds) * 100;

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={() => {}} onBack={() => navigate(-1)} />;

  return (
    <div
      className="w-full flex flex-col"
      style={{ minHeight: '100dvh', backgroundColor: 'var(--background)', fontFamily: 'var(--font-family-inter)' }}
    >
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, padding: '0 16px', gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex items-center justify-center shrink-0 cursor-pointer"
            style={{ width: 44, height: 44, borderRadius: 'var(--radius)', color: 'var(--muted-foreground)', background: 'transparent', border: 'none' }}
          >
            <ArrowLeft style={{ width: 20, height: 20, strokeWidth: 1.5 }} />
          </motion.button>
          <span style={{
            fontFamily: 'var(--font-family-inter)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {topicTitle}
          </span>
        </div>
      </GlassHeader>

      {/* Center area — video + meta vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-0 pb-24">

      {/* Video Player */}
      <div
        ref={videoContainerRef}
        className="relative w-full flex items-center justify-center"
        style={{ aspectRatio: '16/9', backgroundColor: '#000', cursor: 'pointer' }}
        onClick={() => handleVideoTap()}
      >
        {/* Lecture canvas */}
        <canvas
          ref={canvasRef}
          width={720}
          height={405}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />

        {/* Center play/pause — fades out when playing + controls hidden */}
        <motion.div
          animate={{ opacity: isPlaying && !controlsVisible ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
          style={{
            width: 68, height: 68, borderRadius: '50%',
            backgroundColor: 'var(--overlay-heavy)',
            zIndex: 1, pointerEvents: 'none',
          }}
        >
          <motion.div
            key={isPlaying ? 'pause' : 'play'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {isPlaying ? (
              <Pause style={{ width: 30, height: 30, color: 'var(--white)', fill: 'var(--white)' }} />
            ) : (
              <Play style={{ width: 30, height: 30, color: 'var(--white)', fill: 'var(--white)', marginLeft: 3 }} />
            )}
          </motion.div>
        </motion.div>

        {/* Bottom overlay: time + controls + progress */}
        <motion.div
          animate={{ opacity: isPlaying && !controlsVisible && !showSpeedMenu ? 0 : 1 }}
          transition={{ duration: 0.25 }}
          className="absolute bottom-0 left-0 right-0"
          style={{ zIndex: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)', paddingTop: 32 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Time + buttons row */}
          <div className="flex items-center justify-between px-3 pb-2">
            {/* Time */}
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--white)',
              fontVariantNumeric: 'tabular-nums',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 9999,
              padding: '4px 8px',
            }}>
              {formatTime(currentTime)} / {formatTime(totalSeconds)}
            </span>

            {/* Speed + fullscreen */}
            <div className="flex items-center gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9999 }}>
              <button
                aria-label="Playback speed"
                aria-expanded={showSpeedMenu}
                onClick={toggleSpeedMenu}
                className="flex items-center justify-center cursor-pointer"
                style={{ width: 44, height: 36, background: 'none', border: 'none' }}
              >
                <span style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: showSpeedMenu || playbackSpeed !== 1 ? 'var(--primary-400)' : 'var(--white)',
                }}>
                  {playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}
                </span>
              </button>
              <button
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                onClick={toggleFullscreen}
                className="flex items-center justify-center cursor-pointer"
                style={{ width: 36, height: 36, background: 'none', border: 'none' }}
              >
                {isFullscreen
                  ? <Minimize2 style={{ width: 18, height: 18, color: 'var(--white)' }} />
                  : <Maximize style={{ width: 18, height: 18, color: 'var(--white)' }} />}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 4, backgroundColor: 'var(--white-alpha-20)', cursor: 'pointer',
            }}
            onClick={handleProgressClick}
          >
            <motion.div
              style={{ height: '100%', backgroundColor: 'var(--primary)', width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </motion.div>

      </div>


      </div>{/* end center area */}

      {/* Speed Bottom Sheet */}
      <AnimatePresence>
        {showSpeedMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => { setShowSpeedMenu(false); if (isPlaying) resetHideTimer(); }}
            />
            <motion.div
              initial={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
              animate={isLandscape ? { opacity: 1, scale: 1 } : { y: 0 }}
              exit={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
              transition={isLandscape
                ? { duration: 0.18, ease: 'easeOut' }
                : { type: 'spring', damping: 32, stiffness: 320 }
              }
              style={isLandscape ? {
                position: 'fixed',
                top: '50%',
                left: '50%',
                x: '-50%',
                y: '-50%',
                width: 'calc(100% - 32px)',
                maxWidth: 480,
                maxHeight: '85vh',
                overflowY: 'auto',
                zIndex: 201,
                backgroundColor: 'var(--card)',
                borderRadius: 20,
                paddingBottom: 8,
                fontFamily: 'var(--font-family-inter)',
              } : {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 201,
                backgroundColor: 'var(--card)',
                borderRadius: '16px 16px 0 0',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                fontFamily: 'var(--font-family-inter)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center" style={{ padding: '12px 0 8px' }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: 'var(--muted)' }} />
              </div>
              {/* Title */}
              <div style={{ padding: '4px 20px 12px', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                  Playback Speed
                </span>
              </div>
              {/* Options */}
              {PLAYBACK_SPEEDS.map(speed => {
                const isActive = speed === playbackSpeed;
                return (
                  <motion.button
                    key={speed}
                    whileTap={{ scale: 0.98 }}
                    onClick={e => selectSpeed(speed, e)}
                    className="w-full flex items-center justify-between cursor-pointer"
                    style={{
                      padding: '16px 20px',
                      background: isActive ? 'var(--primary-alpha-8)' : 'none',
                      border: 'none',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <span style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                      color: isActive ? 'var(--primary)' : 'var(--foreground)',
                    }}>
                      {speed === 1 ? 'Normal' : `${speed}x`}
                    </span>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="flex items-center justify-center shrink-0"
                        style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--primary)' }}
                      >
                        <Check style={{ width: 14, height: 14, color: 'var(--white)', strokeWidth: 3 }} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5"
        style={{
          paddingTop: 16,
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, var(--background) 60%, transparent)',
          zIndex: 100,
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/learning-path')}
          className="w-full flex items-center justify-center cursor-pointer"
          style={{
            height: 44,
            borderRadius: 'var(--radius-button)',
            backgroundColor: 'var(--primary)',
            border: 'none',
            boxShadow: 'var(--glow-primary)',
          }}
        >
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--white)' }}>
            Watch Next Topic's Recording
          </span>
        </motion.button>
      </div>
    </div>
  );
}
