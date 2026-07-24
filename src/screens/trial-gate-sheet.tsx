/**
 * Trial Gate Sheet — bottom sheet that auto-rises after a free-trial round.
 * Shown at the result screen of any playable game when the user does NOT
 * have an active Games Pass. The result + score stay visible behind a dim
 * scrim; the sheet slides up with the conversion ask.
 *
 * Used by game-quiz-duel.tsx + game-daily-sprint.tsx (and any future playable
 * games that follow the same trial-then-pass model).
 *
 * Colors: strict AntD token palette — primary / success / warning /
 * mark-review (purple). No hex literals.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { Lock, Gamepad2, ShieldCheck, CalendarDays, Sparkles, ChevronRight } from "lucide-react";
import { GAMES_PASS } from "./marketplace-v1";

interface Props {
  open: boolean;
  onClose: () => void;
  gameTitle: string;        // e.g. "Daily Drill" — shown in the headline
  isDesktop?: boolean;
}

export function TrialGateSheet({ open, onClose, gameTitle, isDesktop }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim — fade in, blocks taps outside the sheet */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "color-mix(in srgb, var(--background) 60%, transparent)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          />

          {/* Sheet — clean AntD card surface (no accent-tinted gradient). */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 101,
              backgroundColor: "var(--card)",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "12px 16px 0",
              maxWidth: isDesktop ? 720 : undefined,
              marginLeft: isDesktop ? "auto" : undefined,
              marginRight: isDesktop ? "auto" : undefined,
              display: "flex", flexDirection: "column", gap: 20,
            }}
          >
            {/* Drag handle */}
            <div aria-hidden style={{
              width: 36, height: 4, borderRadius: 9999,
              backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)",
              alignSelf: "center",
            }} />

            {/* Header — large Lock badge with halo + headline + price pill */}
            <div className="flex flex-col items-center" style={{ gap: 10, paddingTop: 4 }}>
              <div style={{
                position: "relative",
                width: 96, height: 96,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Halo */}
                <div aria-hidden style={{
                  position: "absolute", inset: 0,
                  borderRadius: 9999,
                  background: "radial-gradient(circle, color-mix(in srgb, var(--primary-500) 32%, transparent) 0%, transparent 70%)",
                  filter: "blur(8px)",
                }} />
                {/* Icon block */}
                <div style={{
                  position: "relative",
                  width: 72, height: 72, borderRadius: 20,
                  background: `linear-gradient(135deg, var(--primary-500) 0%, color-mix(in srgb, var(--mark-review-500) 60%, var(--primary-500)) 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 12px 36px color-mix(in srgb, var(--primary-500) 50%, transparent), inset 0 1.5px 0 rgba(255,255,255,0.3)",
                }}>
                  <Lock size={28} style={{ color: "var(--white)" }} strokeWidth={2.5} />
                </div>
                {/* Sparkle accent — top-right of the icon */}
                <Sparkles
                  size={16}
                  style={{
                    position: "absolute", top: 4, right: 8,
                    color: "var(--warning-500)",
                    filter: "drop-shadow(0 0 6px var(--warning-500))",
                  }}
                />
              </div>

              <div className="flex flex-col items-center" style={{ gap: 8 }}>
                <h2 style={{
                  fontSize: 24, fontWeight: 800, color: "var(--foreground)",
                  margin: 0, letterSpacing: -0.4, textAlign: "center",
                }}>
                  Free trial complete
                </h2>
                <p style={{
                  fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
                  margin: 0, lineHeight: 1.45, textAlign: "center",
                  maxWidth: 320,
                }}>
                  You've used your free trial of <strong style={{ color: "var(--foreground)" }}>{gameTitle}</strong>. Get the Games Pass to keep playing.
                </p>
              </div>

              {/* Price pill — clear value statement before the CTA */}
              <div className="flex items-center" style={{
                gap: 8, marginTop: 4,
                paddingLeft: 12, paddingRight: 12, height: 28,
                borderRadius: 9999,
                backgroundColor: "color-mix(in srgb, var(--primary-500) 14%, transparent)",
              }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--primary-500)", fontVariantNumeric: "tabular-nums" }}>
                  ₹{GAMES_PASS.price}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: 9999, backgroundColor: "color-mix(in srgb, var(--primary-500) 60%, transparent)" }} />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--primary-500)" }}>
                  {GAMES_PASS.durationLabel}
                </span>
              </div>
            </div>

            {/* Benefits — each row uses a DIFFERENT AntD-token color for visual
                variety + meaningful coding (games=primary, safety=success,
                duration=warning). Not all-green-checks. */}
            <div className="flex flex-col" style={{ gap: 16, paddingTop: 4, paddingBottom: 4 }}>
              <BenefitRow
                Icon={Gamepad2}
                color="var(--primary-500)"
                title="All 7 premium games unlocked"
                body="Math · Memory · Patterns · Brain Battle · Reading · Science · Live"
              />
              <BenefitRow
                Icon={ShieldCheck}
                color="var(--success-500)"
                title="No ads in front of children"
                body="No daily caps · no in-game upsells"
              />
              <BenefitRow
                Icon={CalendarDays}
                color="var(--warning-500)"
                title="Valid for 3 months"
                body="One-time payment · no recurring billing"
              />
            </div>

            {/* CTAs */}
            <div className="flex flex-col" style={{
              gap: 8,
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
            }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/marketplace/games-pass")}
                className="flex items-center justify-center w-full"
                style={{
                  height: 44, borderRadius: 12, gap: 8, border: "none",
                  backgroundColor: "var(--primary-500)", cursor: "pointer",
                  fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)",
                  letterSpacing: 0.2,
                }}
              >
                Get Games Pass · ₹{GAMES_PASS.price}
                <ChevronRight size={16} style={{ color: "var(--white)" }} strokeWidth={2.5} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex items-center justify-center w-full"
                style={{
                  height: 40, borderRadius: 12, border: "none",
                  backgroundColor: "transparent", cursor: "pointer",
                  fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)",
                }}
              >
                Maybe later
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function BenefitRow({ Icon, color, title, body }: {
  Icon: typeof Lock;
  color: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start" style={{ gap: 12 }}>
      {/* Neutral AntD-style container (card-bg-secondary). Color expresses
          itself through the icon only, so the three rows read balanced. */}
      <div className="flex items-center justify-center" style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        backgroundColor: "var(--card-bg-secondary)",
      }}>
        <Icon size={16} style={{ color }} strokeWidth={2.25} />
      </div>
      <div className="flex flex-col" style={{ gap: 2, minWidth: 0, flex: 1, paddingTop: 2 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3 }}>
          {title}
        </span>
        <span style={{
          fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {body}
        </span>
      </div>
    </div>
  );
}
