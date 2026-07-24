import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Clock, Check, Users, X, CheckCircle2 } from "lucide-react";

// TODO(api): hardcoded — class runs May 19–25, 2026
const CAMP_START = new Date("2026-05-19T00:00:00");

const TRACK_GRADE: Record<string, string> = {
  explorer: "Grade 6–8",
  creator: "Grade 9–12",
};

const TRACK_ACCENT: Record<string, string> = {
  explorer: "#13a8a8",
  creator: "#cb2b83",
};

const SESSION_TIMES = [
  { time: "9:00 AM", label: "Morning session" },
  { time: "10:00 AM", label: "Mid-morning session" },
  { time: "11:00 AM", label: "Late morning session" },
];

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawTrack = searchParams.get("track") ?? "explorer";
  const track = rawTrack === "creator" ? "creator" : "explorer";
  const grade = TRACK_GRADE[track];
  const accentColor = TRACK_ACCENT[track];

  const [daysLeft, setDaysLeft] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSessionSheet, setShowSessionSheet] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    setHasStarted(now >= CAMP_START.getTime());
    setDaysLeft(Math.max(0, Math.ceil((CAMP_START.getTime() - now) / (1000 * 60 * 60 * 24))));
  }, [track]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSessionSheet(true), 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", backgroundColor: "var(--background)", overflow: "hidden" }}
    >
      {/* Content — centered vertically in flex-1 */}
      <div
        className="flex flex-col items-center"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "48px 24px 24px",
          gap: 24,
          justifyContent: "center",
        }}
      >
        {/* Success circle — always green */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.1 }}
          className="flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: 9999,
            backgroundColor: "var(--success-alpha-15)",
            border: "2px solid var(--success)",
            flexShrink: 0,
          }}
        >
          <Check size={36} style={{ color: "var(--success)" }} />
        </motion.div>

        {/* Heading + track badge + subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
          style={{ gap: 10 }}
        >
          <span
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--foreground)",
              textAlign: "center",
            }}
          >
            You're all set!
          </span>
          <div
            className="flex items-center justify-center"
            style={{
              paddingLeft: 12,
              paddingRight: 12,
              height: 28,
              borderRadius: 8,
              backgroundColor: `${accentColor}18`,
              border: `1.5px solid ${accentColor}50`,
            }}
          >
            <span
              style={{
                fontSize: "var(--text-2xs)",
                fontWeight: "var(--font-weight-semibold)",
                color: accentColor,
                letterSpacing: 1,
              }}
            >
              {track.toUpperCase()} TRACK
            </span>
          </div>
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--muted-foreground)",
              textAlign: "center",
            }}
          >
            AI Foundations Summer Camp
          </span>
        </motion.div>

        {/* Start date card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col w-full"
          style={{
            borderRadius: 16,
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border)",
            padding: "20px 20px 16px",
            gap: 16,
          }}
        >
          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            {!hasStarted && daysLeft > 0 ? (
              <>
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", letterSpacing: 2 }}>
                  STARTS IN
                </span>
                <div className="flex items-baseline" style={{ gap: 6 }}>
                  <span style={{ fontSize: 48, fontWeight: "var(--font-weight-bold)", color: accentColor, lineHeight: 1 }}>
                    {daysLeft}
                  </span>
                  <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: accentColor }}>
                    {daysLeft === 1 ? "day" : "days"}
                  </span>
                </div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  19 May – 25 May 2026
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", letterSpacing: 2 }}>
                  YOUR CLASS STARTS ON
                </span>
                <span style={{ fontSize: 36, fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", lineHeight: 1.1 }}>
                  19 May 2026
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                  Ends 25 May 2026
                </span>
              </>
            )}
          </div>

          {/* 3 stats row */}
          <div
            className="flex items-center justify-center"
            style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}
          >
            <div className="flex flex-col items-center flex-1" style={{ gap: 4 }}>
              <CalendarDays size={16} style={{ color: "var(--muted-foreground)" }} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                5 Days
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Duration</span>
            </div>
            <div style={{ width: 1, height: 40, backgroundColor: "var(--border)" }} />
            <div className="flex flex-col items-center flex-1" style={{ gap: 4 }}>
              <Clock size={16} style={{ color: "var(--muted-foreground)" }} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                10 Hours
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Content</span>
            </div>
            <div style={{ width: 1, height: 40, backgroundColor: "var(--border)" }} />
            <div className="flex flex-col items-center flex-1" style={{ gap: 4 }}>
              <Users size={16} style={{ color: "var(--muted-foreground)" }} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                {grade}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>Track</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* CTA — pinned to bottom */}
      <div style={{ padding: "16px 24px 40px", flexShrink: 0 }}>
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/classes?camp_purchased=${track}`, { replace: true })}
          className="flex items-center justify-center w-full"
          style={{
            height: 52,
            borderRadius: 12,
            border: "none",
            backgroundColor: "var(--primary-600)",
            color: "var(--white)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--font-weight-semibold)",
            cursor: "pointer",
          }}
        >
          Got it
        </motion.button>
      </div>

      {/* ── Session time picker sheet ──────────────────────────────── */}
      <AnimatePresence>
        {showSessionSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSessionSheet(false)}
              style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 200 }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                backgroundColor: "var(--card)", borderRadius: "20px 20px 0 0",
                zIndex: 201,
                padding: "20px 20px 40px",
                display: "flex", flexDirection: "column", gap: 20,
              }}
            >
              {/* Drag handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "var(--border)", margin: "0 auto" }} />

              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col" style={{ gap: 4 }}>
                  <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>
                    Which session do you want to join?
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                    19 – 23 May 2026 · Daily
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowSessionSheet(false)}
                  aria-label="Close"
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: "var(--secondary)", border: "none", cursor: "pointer" }}
                >
                  <X size={16} style={{ color: "var(--muted-foreground)" }} />
                </motion.button>
              </div>

              {/* Session slots */}
              <div className="flex flex-col" style={{ gap: 8 }}>
                {SESSION_TIMES.map(({ time, label }) => {
                  const isSel = selectedSession === time;
                  return (
                    <motion.button
                      key={time}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSession(time)}
                      className="flex items-center w-full"
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: isSel ? `color-mix(in srgb, ${accentColor} 10%, transparent)` : "var(--secondary)",
                        border: isSel ? `1.5px solid ${accentColor}` : "1.5px solid var(--border)",
                        cursor: "pointer",
                        gap: 12,
                        transition: "all 0.15s ease",
                        textAlign: "left",
                      }}
                    >
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: isSel ? `color-mix(in srgb, ${accentColor} 18%, transparent)` : "var(--card)" }}
                      >
                        <Clock size={18} style={{ color: isSel ? accentColor : "var(--muted-foreground)" }} />
                      </div>
                      <div className="flex flex-col" style={{ gap: 2, flex: 1 }}>
                        <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: isSel ? accentColor : "var(--foreground)" }}>
                          {time}
                        </span>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                          {label}
                        </span>
                      </div>
                      {isSel && (
                        <CheckCircle2 size={20} style={{ color: accentColor, flexShrink: 0 }} />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Confirm CTA */}
              <motion.button
                whileTap={{ scale: selectedSession ? 0.97 : 1 }}
                onClick={() => {
                  if (!selectedSession) return;
                  setShowSessionSheet(false);
                }}
                className="flex items-center justify-center w-full"
                style={{
                  height: 52, borderRadius: 12, border: "none",
                  backgroundColor: selectedSession ? "var(--primary-600)" : "var(--secondary)",
                  color: selectedSession ? "var(--white)" : "var(--muted-foreground)",
                  fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)",
                  cursor: selectedSession ? "pointer" : "default",
                  opacity: selectedSession ? 1 : 0.6,
                  transition: "all 0.2s ease",
                }}
              >
                Confirm Session
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
