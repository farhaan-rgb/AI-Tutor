/**
 * Olympiad Registration Confirmed — the free-entry success moment. (Paid entry
 * lands on marketplace-order-confirm instead.) Confirms the slot, counts down to
 * the live window, offers a reminder toggle, and routes into the lobby/details.
 *
 * Route: /olympiad/:olympiadId/confirmed
 */

import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { CheckCircle2, BellRing, Bell, CalendarClock } from "lucide-react";
import { getOlympiadById, useOlympiadState } from "../shared/olympiads";
import { ConfettiBurst } from "./certificate-view";
import { CountdownBlocks } from "./olympiad-ui";

export function Component() {
  const navigate = useNavigate();
  const { olympiadId } = useParams<{ olympiadId: string }>();
  const o = olympiadId ? getOlympiadById(olympiadId) : undefined;
  const state = useOlympiadState();
  const ensured = useRef(false);

  // Safety net: guarantee the registration is recorded even on direct deep-link.
  useEffect(() => {
    if (o && !ensured.current && !state.isRegistered(o.id)) {
      ensured.current = true;
      state.register(o.id);
    }
  }, [o, state]);

  if (!o) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "100dvh", backgroundColor: "var(--background)" }}>
        <span style={{ color: "var(--foreground)" }}>Olympiad not found</span>
      </div>
    );
  }

  const notifying = state.isNotifying(o.id);

  return (
    <div className="flex flex-col items-center justify-center text-center" style={{
      minHeight: "100dvh", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)",
      padding: 24, gap: 16,
    }}>
      <ConfettiBurst />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
      >
        <CheckCircle2 size={88} style={{ color: "var(--success-500)" }} />
      </motion.div>

      <div className="flex flex-col" style={{ gap: 8 }}>
        <span style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--foreground)" }}>You're registered!</span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 320 }}>
          Your spot in <b style={{ color: "var(--foreground)" }}>{o.title}</b> is confirmed. The exam goes live for everyone at the same time.
        </span>
      </div>

      {/* Countdown to start */}
      <div className="flex flex-col items-center" style={{
        gap: 12, padding: 20, borderRadius: 16, width: "100%", maxWidth: 360,
        backgroundColor: "var(--card)", border: "0.5px solid var(--border)",
      }}>
        <span className="flex items-center" style={{ gap: 8, fontSize: "var(--text-xs)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
          <CalendarClock size={14} /> Starts in
        </span>
        <CountdownBlocks to={o.startsAt} accent={o.accent} />
      </div>

      {/* Reminder toggle */}
      <button
        type="button"
        onClick={() => state.toggleNotify(o.id)}
        className="flex items-center justify-center"
        style={{
          height: 44, padding: "0 20px", borderRadius: 12, gap: 8, cursor: "pointer",
          fontSize: "var(--text-sm)", fontWeight: 600,
          color: notifying ? "var(--success-500)" : "var(--foreground)",
          backgroundColor: "transparent",
          border: `1px solid ${notifying ? "var(--success-500)" : "var(--white-alpha-25)"}`,
        }}
      >
        {notifying ? <BellRing size={16} /> : <Bell size={16} />}
        {notifying ? "We'll remind you before it starts" : "Remind me before it starts"}
      </button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/olympiad/${o.id}`)}
        className="flex items-center justify-center"
        style={{
          height: 44, padding: "0 24px", borderRadius: 12, border: "none", marginTop: 4,
          fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)",
          backgroundColor: "var(--primary-500)", cursor: "pointer",
        }}
      >
        View event details
      </motion.button>
    </div>
  );
}
