/**
 * Recording Player Screen
 * Plays recorded live class with video player and chapter breakdown
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { StatusBar } from '../shared/premium-ui';
import { ArrowLeft, Play, Pause, Clock, Maximize, Minimize2, Zap, Check, AlertCircle } from 'lucide-react';
import { recordClassExit, getCurrentCourseId } from '../shared/feedback-storage';

/* ─────────── Types ─────────── */

interface Chapter {
  id: number;
  title: string;
  timestamp: number; // minutes
  duration: number;  // minutes
}

interface RecordingData {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  totalDuration: number;
  chapters: Chapter[];
}

/* ─────────── Mock Data ─────────── */

// TODO(api): GET /api/recordings/:id
const DUMMY_recordingData: RecordingData = {
  id: 'rec-001',
  title: "Newton's Laws of Motion",
  subject: 'Physics',
  teacher: 'Dr. Sharma',
  totalDuration: 45,
  chapters: [
    { id: 1, title: 'Introduction & Overview',     timestamp: 0,  duration: 5  },
    { id: 2, title: 'First Law - Inertia',         timestamp: 5,  duration: 8  },
    { id: 3, title: 'Second Law - F = ma',         timestamp: 13, duration: 10 },
    { id: 4, title: 'Third Law - Action & Reaction', timestamp: 23, duration: 8 },
    { id: 5, title: 'Real World Examples',         timestamp: 31, duration: 7  },
    { id: 6, title: 'Problem Solving',             timestamp: 38, duration: 5  },
    { id: 7, title: 'Summary & Key Takeaways',     timestamp: 43, duration: 2  },
  ],
};

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/* ─────────── Helpers ─────────── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
      <div className="px-4 py-5 flex flex-col gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 56, borderRadius: 12, backgroundColor: 'var(--muted)' }} />
        ))}
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
  const [isError, setIsError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const topicTitle = searchParams.get('topic') || DUMMY_recordingData.title;
  const totalSeconds = DUMMY_recordingData.totalDuration * 60;

  // Simulate data load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Update active chapter based on current time
  useEffect(() => {
    const chapter = DUMMY_recordingData.chapters.findIndex((ch, idx) => {
      const next = DUMMY_recordingData.chapters[idx + 1];
      return currentTime >= ch.timestamp * 60 && (!next || currentTime < next.timestamp * 60);
    });
    if (chapter !== -1 && chapter !== activeChapter) {
      setActiveChapter(chapter);
    }
  }, [currentTime, activeChapter]);

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

  const handleChapterClick = (chapter: Chapter, index: number) => {
    setCurrentTime(chapter.timestamp * 60);
    setActiveChapter(index);
  };

  const togglePlay = () => setIsPlaying(prev => !prev);

  const cycleSpeed = () => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    setPlaybackSpeed(PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(Math.round(ratio * totalSeconds));
  };

  const progress = (currentTime / totalSeconds) * 100;

  // Centralised exit handler — records the class-exit signal so the
  // course-review auto-rise system can fire on the next learning-path mount.
  const handleExit = () => {
    recordClassExit(getCurrentCourseId());
    navigate(-1);
  };

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={() => setIsError(false)} onBack={handleExit} />;

  return (
    <div
      className="w-full min-h-screen"
      style={{ backgroundColor: 'var(--background)', fontFamily: 'var(--font-family-inter)' }}
    >
      <StatusBar />

      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={handleExit}
          aria-label="Go back"
          className="flex items-center justify-center cursor-pointer shrink-0"
          style={{ width: 44, height: 44, background: 'none', border: 'none', borderRadius: 'var(--radius)' }}
        >
          <ArrowLeft style={{ width: 24, height: 24, color: 'var(--foreground)', strokeWidth: 1.5 }} />
        </button>
        <div>
          <h1 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            margin: 0, lineHeight: 1.2,
          }}>
            Recording
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
            {topicTitle}
          </p>
        </div>
      </div>

      {/* Video Player */}
      <div
        ref={videoContainerRef}
        className="relative w-full flex items-center justify-center"
        style={{ aspectRatio: '16/9', backgroundColor: 'var(--video-background)', cursor: 'pointer' }}
        onClick={togglePlay}
      >
        {/* Placeholder gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, var(--primary-alpha-15) 0%, color-mix(in srgb, var(--primary) 10%, transparent) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Play/Pause indicator — visual only, whole area handles click */}
        <motion.div
          key={isPlaying ? 'pause' : 'play'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center"
          style={{
            width: 68, height: 68, borderRadius: '50%',
            backgroundColor: 'var(--overlay-heavy)',
            zIndex: 1, pointerEvents: 'none',
          }}
        >
          {isPlaying ? (
            <Pause style={{ width: 32, height: 32, color: 'var(--white)', fill: 'var(--white)' }} />
          ) : (
            <Play style={{ width: 32, height: 32, color: 'var(--white)', fill: 'var(--white)', marginLeft: 4 }} />
          )}
        </motion.div>

        {/* Bottom controls — stop propagation so clicks don't toggle play */}
        <div
          className="flex items-center justify-between"
          style={{ position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 2 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            padding: '4px 8px', borderRadius: 8,
            backgroundColor: 'var(--overlay-heavy)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--white)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatTime(currentTime)} / {formatTime(totalSeconds)}
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label={`Playback speed: ${playbackSpeed}x`}
              onClick={cycleSpeed}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 44, height: 44, borderRadius: 8,
                backgroundColor: 'var(--overlay-heavy)', border: 'none',
              }}
            >
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-bold)',
                color: playbackSpeed !== 1 ? 'var(--primary-400)' : 'var(--white)',
              }}>
                {playbackSpeed}x
              </span>
            </button>
            <button
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={toggleFullscreen}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 44, height: 44, borderRadius: 8,
                backgroundColor: 'var(--overlay-heavy)', border: 'none',
              }}
            >
              {isFullscreen
                ? <Minimize2 style={{ width: 18, height: 18, color: 'var(--white)' }} />
                : <Maximize style={{ width: 18, height: 18, color: 'var(--white)' }} />}
            </button>
          </div>
        </div>

        {/* Scrubable progress bar */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 4, backgroundColor: 'var(--white-alpha-20)',
            cursor: 'pointer', zIndex: 3,
          }}
          onClick={e => { e.stopPropagation(); handleProgressClick(e); }}
        >
          <motion.div
            style={{ height: '100%', backgroundColor: 'var(--primary)', width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Chapter List */}
      <div className="px-4 py-5">
        <h2 style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          margin: '0 0 16px',
        }}>
          Chapters
        </h2>

        <div className="flex flex-col gap-2">
          {DUMMY_recordingData.chapters.map((chapter, index) => {
            const isActive = index === activeChapter;
            const isNowPlaying = isActive && isPlaying;
            const isCompleted = index < activeChapter;

            return (
              <motion.button
                key={chapter.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChapterClick(chapter, index)}
                className="w-full flex items-center gap-3 cursor-pointer text-left"
                style={{
                  padding: '12px 16px', borderRadius: 12,
                  border: isActive ? '1px solid var(--primary-alpha-30)' : '1px solid var(--border)',
                  backgroundColor: isActive ? 'var(--primary-alpha-8)' : 'var(--card)',
                  opacity: isCompleted ? 0.6 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: isCompleted
                      ? 'var(--success-alpha-12)'
                      : isActive
                        ? 'var(--primary)'
                        : 'var(--muted)',
                  }}
                >
                  {isNowPlaying ? (
                    <div className="flex items-end gap-0.5" style={{ height: 12 }}>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: ['4px', '12px', '6px', '10px', '4px'] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                          style={{ width: 3, backgroundColor: 'var(--white)', borderRadius: 2 }}
                        />
                      ))}
                    </div>
                  ) : isCompleted ? (
                    <Check style={{ width: 14, height: 14, color: 'var(--success)', strokeWidth: 2.5 }} />
                  ) : (
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: isActive ? 'var(--white)' : 'var(--muted-foreground)',
                    }}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <div style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                    lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {chapter.title}
                  </div>
                </div>

                {/* Timestamp + Duration */}
                <div className="flex items-center gap-2 shrink-0">
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 'var(--font-weight-medium)',
                  }}>
                    {formatTime(chapter.timestamp * 60)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock style={{ width: 12, height: 12, color: 'var(--muted-foreground)' }} />
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--muted-foreground)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {chapter.duration}m
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom spacer */}
      <div style={{ height: 100 }} />

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
          onClick={() => navigate('/practice/pyq')}
          className="w-full flex items-center justify-center gap-2 cursor-pointer"
          style={{
            height: 52,
            borderRadius: 'var(--radius-button)',
            backgroundColor: 'var(--primary)',
            border: 'none',
            boxShadow: 'var(--glow-primary)',
          }}
        >
          <Zap style={{ width: 18, height: 18, color: 'var(--white)' }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--white)' }}>
            Continue to Practice
          </span>
        </motion.button>
      </div>
    </div>
  );
}
