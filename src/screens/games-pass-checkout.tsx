/**
 * Games Pass Checkout — single SKU pass purchase screen.
 * Route: /marketplace/games-pass
 *
 * Two states in one component:
 *   - "buy"     — pass benefits + price summary + Confirm purchase
 *   - "success" — pass active confirmation + Go to my games
 *
 * Real payment integration is future work; this screen simulates by calling
 * useGamesPass().activate(3) on Confirm.
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { X, Check, Gamepad2, Layers, Sparkles, Calendar, ShieldCheck } from "lucide-react";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { StatusBar } from "../shared/premium-ui";
import { GAMES_PASS } from "./marketplace-v1";
import { useGamesPass } from "../shared/games-pass-state";

type Phase = "buy" | "success";

const PASS_ACCENT = "var(--primary-500)";

export function Component() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const pass = useGamesPass();
  const [phase, setPhase] = useState<Phase>(pass.active ? "success" : "buy");

  // Computed: expiry date if user confirmed during this session, or already-active expiry
  const expiryLabel = useMemo(() => {
    if (pass.formattedExpiry) return pass.formattedExpiry;
    const projected = new Date(Date.now() + GAMES_PASS.durationMonths * 30 * 24 * 60 * 60 * 1000);
    return projected.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }, [pass.formattedExpiry]);

  function confirmPurchase() {
    pass.activate(GAMES_PASS.durationMonths);
    setPhase("success");
  }

  const containerStyle: React.CSSProperties = {
    fontFamily: "var(--font-family-inter)",
    backgroundColor: "var(--background)",
    minHeight: "100dvh",
    maxWidth: isDesktop ? 720 : undefined,
    marginLeft: isDesktop ? "auto" : undefined,
    marginRight: isDesktop ? "auto" : undefined,
    display: "flex", flexDirection: "column",
  };

  // ─── SUCCESS ─────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div style={{
        ...containerStyle,
        background: "linear-gradient(180deg, color-mix(in srgb, var(--success-500) 14%, var(--background)) 0%, var(--background) 50%)",
      }}>
        <StatusBar />
        <FloatingCloseButton onClick={() => navigate("/marketplace-v1")} isDesktop={isDesktop} />

        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: 24, gap: 24 }}>
          {/* Success badge — green circle with checkmark + sparkle burst */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            style={{
              position: "relative",
              width: 96, height: 96, borderRadius: 9999,
              background: `radial-gradient(circle, color-mix(in srgb, var(--success-500) 30%, var(--background)) 0%, var(--background) 80%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px color-mix(in srgb, var(--success-500) 40%, transparent)",
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 9999,
              backgroundColor: "var(--success-500)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={28} style={{ color: "var(--white)" }} strokeWidth={3} />
            </div>
          </motion.div>

          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: -0.5 }}>
              Games Pass active
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
              Valid till {expiryLabel}
            </span>
          </div>

          {/* Receipt card */}
          <div style={{
            width: "100%", maxWidth: 360,
            padding: 16, borderRadius: 16,
            backgroundColor: "var(--card)",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <ReceiptRow label={GAMES_PASS.label} value={`₹${GAMES_PASS.price}`} bold />
            <ReceiptRow label="Duration" value={GAMES_PASS.durationLabel} />
            <ReceiptRow label="Valid till" value={expiryLabel} />
            <div style={{ height: 1, backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)" }} />
            <ReceiptRow label="Total paid" value={`₹${GAMES_PASS.price}`} bold accent="var(--success-500)" />
          </div>

          {/* Primary + secondary CTAs */}
          <div className="flex flex-col w-full" style={{ gap: 8, maxWidth: 360 }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/marketplace-v1")}
              className="flex items-center justify-center"
              style={{
                width: "100%", height: 44, borderRadius: 12, border: "none",
                backgroundColor: PASS_ACCENT, cursor: "pointer",
                fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)",
                gap: 8,
              }}
            >
              <Gamepad2 size={16} style={{ color: "var(--white)" }} />
              Browse games
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/marketplace-v1")}
              className="flex items-center justify-center"
              style={{
                width: "100%", height: 44, borderRadius: 12,
                backgroundColor: "transparent", cursor: "pointer", border: "none",
                fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--muted-foreground)",
              }}
            >
              Browse marketplace
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ─── BUY ─────────────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <FloatingCloseButton onClick={() => navigate(-1)} isDesktop={isDesktop} />

      <div className="flex-1 min-h-0" style={{ overflowY: "auto", paddingBottom: 96 }}>
        {/* Hero — accent gradient + Gamepad icon block with glow halo.
            StatusBar lives INSIDE the gradient (full width — must NOT be
            inside a centered flex column or its justify-between collapses
            and the time/icons bunch up). Inner content is centered below it. */}
        <div style={{
          position: "relative",
          paddingBottom: 28,
          background: `linear-gradient(180deg, color-mix(in srgb, ${PASS_ACCENT} 26%, var(--background)) 0%, color-mix(in srgb, ${PASS_ACCENT} 10%, var(--background)) 50%, var(--background) 100%)`,
        }}>
          <StatusBar />

          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          }}>

          {/* Icon block + halo + sparkle accent */}
          <div style={{
            position: "relative",
            width: 120, height: 120,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: 4,
          }}>
            <div aria-hidden style={{
              position: "absolute", inset: 0,
              borderRadius: 9999,
              background: `radial-gradient(circle, color-mix(in srgb, ${PASS_ACCENT} 38%, transparent) 0%, transparent 70%)`,
              filter: "blur(10px)",
            }} />
            <div style={{
              position: "relative",
              width: 88, height: 88, borderRadius: 24,
              background: `linear-gradient(135deg, ${PASS_ACCENT} 0%, color-mix(in srgb, var(--mark-review-500) 60%, ${PASS_ACCENT}) 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 16px 40px color-mix(in srgb, ${PASS_ACCENT} 55%, transparent), inset 0 2px 0 color-mix(in srgb, var(--white) 32%, transparent)`,
            }}>
              <Gamepad2 size={40} style={{ color: "var(--white)" }} strokeWidth={2.25} />
            </div>
            <Sparkles
              size={18}
              style={{
                position: "absolute", top: 8, right: 12,
                color: "var(--warning-500)",
                filter: "drop-shadow(0 0 6px var(--warning-500))",
              }}
            />
          </div>

          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: -0.6, lineHeight: 1.1 }}>
              {GAMES_PASS.label}
            </h1>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center" }}>
              Unlocks 7 premium games · {GAMES_PASS.durationLabel}
            </span>
          </div>

          {/* Price pill — clear value statement above the fold */}
          <div className="flex items-center" style={{
            gap: 8,
            paddingLeft: 14, paddingRight: 14, height: 36,
            borderRadius: 9999,
            backgroundColor: `color-mix(in srgb, ${PASS_ACCENT} 16%, transparent)`,
            border: `1px solid color-mix(in srgb, ${PASS_ACCENT} 30%, transparent)`,
          }}>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: PASS_ACCENT, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              ₹{GAMES_PASS.price}
            </span>
            <span style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: `color-mix(in srgb, ${PASS_ACCENT} 50%, transparent)` }} />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: PASS_ACCENT, letterSpacing: 0.3 }}>
              {GAMES_PASS.durationLabel.toUpperCase()}
            </span>
          </div>
          </div>
        </div>

        {/* What's included — 4 benefit rows with VARIED AntD-token icon colors
            (primary / success / mark-review / warning) for visual variety. */}
        <div style={{ padding: "28px 16px 4px" }}>
          <SectionTitle>What's included</SectionTitle>
          <div className="flex flex-col" style={{ gap: 16, paddingTop: 4, paddingBottom: 4 }}>
            <Benefit
              Icon={Gamepad2}
              color="var(--primary-500)"
              title="All 7 premium games unlocked"
              body="Math · Memory · Patterns · Brain Battle · Reading · Science · Sunday Showdown"
            />
            <Benefit
              Icon={Layers}
              color="var(--success-500)"
              title="Every level, no limits"
              body="Play any level any time · no daily caps · no in-game upsells"
            />
            <Benefit
              Icon={Sparkles}
              color="var(--mark-review-500)"
              title="Future games included"
              body="New games we add during your 3 months are free"
            />
            <Benefit
              Icon={Calendar}
              color="var(--warning-500)"
              title="Live events included"
              body="Sunday Showdown weekly · no extra entry fee"
            />
          </div>
        </div>

        {/* Order summary */}
        <div style={{ padding: "24px 16px 0" }}>
          <SectionTitle>Order summary</SectionTitle>
          <div style={{
            padding: 16, borderRadius: 16,
            backgroundColor: `color-mix(in srgb, ${PASS_ACCENT} 8%, var(--card))`,
            border: `1px solid color-mix(in srgb, ${PASS_ACCENT} 16%, transparent)`,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <ReceiptRow label={GAMES_PASS.label} value={`₹${GAMES_PASS.price}`} bold />
            <ReceiptRow label="Duration" value={GAMES_PASS.durationLabel} />
            <ReceiptRow label="Valid till" value={expiryLabel} />
            <div style={{ height: 1, backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)" }} />
            <ReceiptRow label="Total" value={`₹${GAMES_PASS.price}`} bold large accent={PASS_ACCENT} />
          </div>
        </div>

        {/* Trust strip — small line under the pricing card */}
        <div className="flex items-center justify-center" style={{ padding: "16px 16px 0", gap: 8 }}>
          <ShieldCheck size={12} style={{ color: "var(--success-500)" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
            Secure · One-time payment · No recurring billing
          </span>
        </div>
      </div>

      {/* Sticky Confirm CTA — position:fixed so it pins to viewport on scroll,
          with desktop max-width respected so on web it sits at the bottom of
          the centered 720px container. */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        maxWidth: isDesktop ? 720 : undefined,
        marginLeft: isDesktop ? "auto" : undefined,
        marginRight: isDesktop ? "auto" : undefined,
      }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={confirmPurchase}
          className="flex items-center justify-center w-full"
          style={{
            height: 44, borderRadius: 12, gap: 8, border: "none",
            cursor: "pointer",
            backgroundColor: PASS_ACCENT,
            transition: "background-color 0.2s ease",
          }}
        >
          <Check size={16} style={{ color: "var(--white)" }} strokeWidth={3} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)", letterSpacing: 0.2 }}>
            Confirm purchase · ₹{GAMES_PASS.price}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function FloatingCloseButton({ onClick, isDesktop }: { onClick: () => void; isDesktop: boolean }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      pointerEvents: "none",
      maxWidth: isDesktop ? 720 : undefined,
      marginLeft: isDesktop ? "auto" : undefined,
      marginRight: isDesktop ? "auto" : undefined,
    }}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        aria-label="Close"
        style={{
          position: "absolute", top: 52, right: 12,
          pointerEvents: "auto",
          width: 32, height: 32, borderRadius: 9999,
          backgroundColor: "color-mix(in srgb, var(--black) 55%, transparent)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", border: "none",
        }}
      >
        <X size={16} style={{ color: "var(--foreground)" }} />
      </motion.button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "var(--text-2xs)", fontWeight: 600,
      color: "var(--muted-foreground)", letterSpacing: 0.8,
      textTransform: "uppercase",
      margin: "0 0 10px",
    }}>
      {children}
    </p>
  );
}

function Benefit({ Icon, color, title, body }: { Icon: typeof Check; color: string; title: string; body: string }) {
  return (
    <div className="flex items-start" style={{ gap: 12 }}>
      {/* Neutral AntD container (card-bg-secondary). Color is in the icon
          only — keeps the 4 rows visually balanced. */}
      <div className="flex items-center justify-center" style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        backgroundColor: "var(--card-bg-secondary)",
      }}>
        <Icon size={18} style={{ color }} strokeWidth={2.25} />
      </div>
      <div className="flex flex-col" style={{ gap: 3, minWidth: 0, flex: 1, paddingTop: 2 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3 }}>
          {title}
        </span>
        <span style={{
          fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.45,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {body}
        </span>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, bold, large, accent }: { label: string; value: string; bold?: boolean; large?: boolean; accent?: string }) {
  return (
    <div className="flex items-center justify-between" style={{ gap: 12 }}>
      <span style={{
        fontSize: large ? "var(--text-base)" : "var(--text-sm)",
        fontWeight: bold ? 700 : 500,
        color: "var(--muted-foreground)",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: large ? "var(--text-lg)" : "var(--text-sm)",
        fontWeight: bold ? 800 : 600,
        color: accent ?? "var(--foreground)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </span>
    </div>
  );
}
