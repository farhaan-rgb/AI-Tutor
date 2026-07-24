/**
 * ShareSheet — the share sheet for the referral flow.
 *
 * Three states:
 *   1. Intent confirm (only when triggered post-feedback / from auto-rise)
 *   2. Message preview + channel picker (always shown for manual entries)
 *   3. Success ("We'll let you know when they join")
 *
 * Built on the FeedbackSheet shell — matches existing bottom-sheet chrome.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Send, Copy as CopyIcon, MoreHorizontal, Gift, Sparkles, X as XIcon } from "lucide-react";
import { FeedbackSheet } from "../app/components/ui/feedback-sheet";
import {
  buildShareMessage,
  SHEET_HEADLINES,
  SHEET_SUBTITLES,
  type ProductKind,
  type TriggerSource,
} from "../shared/referral-copy";
import {
  useReferrals,
  startGlobalCooldown,
  startPostShareSuppression,
} from "../shared/referral-storage";

interface Props {
  open: boolean;
  onClose: () => void;
  trigger: TriggerSource;
  productKind: ProductKind;
  productName?: string;
  isDesktop?: boolean;
  referrerCode?: string;
}

export function ShareSheet({
  open,
  onClose,
  trigger,
  productKind,
  productName,
  isDesktop,
  referrerCode = "AAKASH123",
}: Props) {
  const referrals = useReferrals();

  // Auto-rise triggers start at state 1 (intent confirm); manual entries skip
  // straight to state 2 (compose).
  const startInIntent = trigger !== "manual" && trigger !== "profile";

  type Phase = "intent" | "compose" | "success";
  const [phase, setPhase] = useState<Phase>(startInIntent ? "intent" : "compose");

  // Reset phase when reopened so the sheet doesn't remember a stale success state.
  useEffect(() => {
    if (open) setPhase(startInIntent ? "intent" : "compose");
  }, [open, startInIntent]);

  // Track whether the user has touched the message — so prop-driven re-derives
  // don't overwrite their edits.
  const [dirty, setDirty] = useState(false);

  const [message, setMessage] = useState(() =>
    buildShareMessage({
      kind: productKind,
      productName,
      code: referrerCode,
    }),
  );

  // Re-derive the pre-fill if the inputs change AND user hasn't touched it.
  useEffect(() => {
    if (dirty) return;
    setMessage(
      buildShareMessage({
        kind: productKind,
        productName,
        code: referrerCode,
      }),
    );
  }, [productKind, productName, referrerCode, dirty]);

  // Reset dirty + message when the sheet reopens.
  useEffect(() => {
    if (!open) {
      setDirty(false);
    }
  }, [open]);

  const [copied, setCopied] = useState(false);

  // Track the success-state auto-close timer so unmount / re-open doesn't
  // leave it dangling (parent could navigate away and the late fire would
  // call a stale onClose).
  const closeTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  function handleProceedToCompose() {
    setPhase("compose");
  }

  function handleMaybeLater() {
    // Short cooldown — they considered, declined this moment, but might want
    // to come back. NOT longer than the 14-day post-success cooldown.
    startGlobalCooldown(3);
    onClose();
  }

  // Channel handler. "system" gracefully falls back to copy when the Web Share
  // API isn't available — never silently no-ops.
  function handleChannel(channel: "whatsapp" | "telegram" | "copy" | "system") {
    if (channel === "copy") {
      navigator.clipboard?.writeText(message).catch(() => {});
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
      return;
    }
    if (channel === "whatsapp") {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (channel === "telegram") {
      const url = `https://t.me/share/url?url=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (channel === "system") {
      if (typeof navigator.share === "function") {
        navigator.share({ text: message }).catch(() => {});
      } else {
        // Fallback — copy instead of silently doing nothing.
        navigator.clipboard?.writeText(message).catch(() => {});
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
        return;
      }
    }
    finalize();
  }

  function finalize() {
    // TODO(api): POST /api/referrals — { channel, ts, referrerCode }
    // Channel-based label (no fake "Friend" name) so the dashboard reads
    // honestly until real attribution lands.
    referrals.recordShare("Pending invite");
    startGlobalCooldown(14);
    startPostShareSuppression(90);
    setPhase("success");
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 1800);
  }

  return (
    <FeedbackSheet open={open} onClose={onClose} isDesktop={isDesktop}>
      <AnimatePresence mode="wait">

        {phase === "intent" && (
          <motion.div
            key="intent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col"
            style={{ gap: 16, paddingTop: 8 }}
          >
            <div className="flex flex-col items-center" style={{ gap: 12, padding: "8px 8px 4px" }}>
              <div
                aria-hidden
                className="flex items-center justify-center"
                style={{
                  width: 56, height: 56, borderRadius: 9999,
                  backgroundColor: "color-mix(in srgb, var(--primary-500) 14%, transparent)",
                }}
              >
                <Gift size={24} style={{ color: "var(--primary-500)" }} strokeWidth={2} />
              </div>
              <h2 style={{
                fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--foreground)",
                margin: 0, letterSpacing: -0.3, textAlign: "center",
              }}>
                {SHEET_HEADLINES[trigger]}
              </h2>
              <p style={{
                fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
                margin: 0, textAlign: "center", maxWidth: 320, lineHeight: 1.5,
              }}>
                {SHEET_SUBTITLES[trigger]}
              </p>
            </div>

            {/* Reward card — dark surface with subtle primary tint, matching
                the Refer & Earn hero. Restrained on dark mode (not CTA-like). */}
            <div
              style={{
                borderRadius: 12,
                padding: 16,
                backgroundColor: "var(--card-bg-secondary)",
                border: "1px solid color-mix(in srgb, var(--primary-500) 22%, transparent)",
                marginTop: 4,
              }}
            >
              <div className="flex flex-col" style={{ gap: 6 }}>
                <div className="flex items-center" style={{ gap: 6 }}>
                  <Sparkles size={12} style={{ color: "var(--primary-500)" }} />
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--primary-500)" }}>
                    You earn when they buy
                  </span>
                </div>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>
                  {referrals.currentReward.label}
                </span>
                <span style={{ fontSize: "var(--text-xs)", lineHeight: 1.5, color: "var(--muted-foreground)" }}>
                  Friend gets ₹300 OFF their first course. Once they purchase, your reward unlocks.
                </span>
              </div>
            </div>

            <div className="flex flex-col" style={{ gap: 8, paddingTop: 4 }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleProceedToCompose}
                className="flex items-center justify-center w-full"
                style={{
                  height: 44, borderRadius: 12, border: "none",
                  backgroundColor: "var(--primary-500)",
                  color: "var(--white)",
                  fontSize: "var(--text-sm)", fontWeight: 600,
                  cursor: "pointer", letterSpacing: 0.2,
                  gap: 8,
                }}
              >
                <Send size={16} />
                Invite a friend
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleMaybeLater}
                className="flex items-center justify-center w-full"
                style={{
                  height: 36, borderRadius: 12, border: "none",
                  backgroundColor: "transparent",
                  color: "var(--muted-foreground)",
                  fontSize: "var(--text-sm)", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Maybe later
              </motion.button>
            </div>
          </motion.div>
        )}

        {phase === "compose" && (
          <motion.div
            key="compose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col"
            style={{ gap: 16 }}
          >
            {/* Header — title left + X close right (product bottom-sheet language) */}
            <div className="flex items-center justify-between" style={{ gap: 8, padding: "0 0 4px" }}>
              <h2 style={{
                fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)",
                margin: 0, letterSpacing: -0.2,
              }}>
                Share
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 32, height: 32, borderRadius: 9999,
                  backgroundColor: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", padding: 0,
                  color: "var(--muted-foreground)",
                  marginRight: -4,
                }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <div aria-hidden style={{
              height: 0.5,
              backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
            }} />

            {/* Reward earning sub-text — simple line below the header. */}
            <span style={{
              fontSize: "var(--text-xs)",
              color: "var(--muted-foreground)",
              lineHeight: 1.55,
            }}>
              Friend gets ₹300 OFF · You earn <strong style={{ color: "var(--foreground)" }}>{referrals.currentReward.label}</strong> when they buy
            </span>

            {/* Editable message — eyebrow + textarea pair. The eyebrow names
                the field so it doesn't read as a form input. */}
            <div className="flex flex-col" style={{ gap: 6 }}>
              <span style={{
                fontSize: "var(--text-2xs)", fontWeight: 700,
                color: "var(--muted-foreground)",
                letterSpacing: 0.8, textTransform: "uppercase",
              }}>
                Message · tap to edit
              </span>
              <textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); setDirty(true); }}
                rows={6}
                aria-label="Share message — edit before sending"
                style={{
                  padding: 12, borderRadius: 12, border: "none",
                  backgroundColor: "var(--card-bg-secondary)",
                  color: "var(--foreground)",
                  fontSize: "var(--text-sm)",
                  fontFamily: "inherit",
                  lineHeight: 1.55,
                  outline: "none",
                  resize: "none",
                }}
              />
            </div>

            {/* Channel tile row — compact horizontal tiles matching the product's
                native share sheet (square brand-colour tiles + label below). */}
            <div className="flex" style={{ gap: 12, justifyContent: "space-between" }}>
              <ChannelTile
                icon={<WhatsAppIcon size={24} color="var(--white)" />}
                label="WhatsApp"
                bg="#25D366"
                onClick={() => handleChannel("whatsapp")}
              />
              <ChannelTile
                icon={<TelegramIcon size={24} color="var(--white)" />}
                label="Telegram"
                bg="#229ED9"
                onClick={() => handleChannel("telegram")}
              />
              <ChannelTile
                icon={<CopyIcon size={22} style={{ color: copied ? "var(--success-500)" : "var(--foreground)" }} />}
                label={copied ? "Copied" : "Copy"}
                bg="var(--card-bg-secondary)"
                onClick={() => handleChannel("copy")}
                active={copied}
              />
              <ChannelTile
                icon={<MoreHorizontal size={22} style={{ color: "var(--foreground)" }} />}
                label="More"
                bg="var(--card-bg-secondary)"
                onClick={() => handleChannel("system")}
              />
            </div>

          </motion.div>
        )}

        {phase === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="flex flex-col items-center justify-center"
            style={{ gap: 12, padding: "32px 16px 24px" }}
          >
            <div
              aria-hidden
              className="flex items-center justify-center"
              style={{
                width: 64, height: 64, borderRadius: 9999,
                backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
              }}
            >
              <Check size={32} style={{ color: "var(--success-500)" }} strokeWidth={3} />
            </div>
            <h2 style={{
              fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--foreground)",
              margin: 0, letterSpacing: -0.2, textAlign: "center",
            }}>
              Sent
            </h2>
            <p style={{
              fontSize: "var(--text-sm)", color: "var(--muted-foreground)",
              margin: 0, textAlign: "center", maxWidth: 280, lineHeight: 1.5,
            }}>
              We'll let you know when they join.
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </FeedbackSheet>
  );
}

interface ChannelTileProps {
  icon: React.ReactNode;
  label: string;
  bg: string;
  onClick: () => void;
  active?: boolean;
}

// Square brand-tile in the product's native-share-sheet pattern: 56×56
// colored tile centered above its label. The tile is the brand identity;
// the label is a single-line caption below.
function ChannelTile({ icon, label, bg, onClick, active }: ChannelTileProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="flex flex-col items-center"
      style={{
        flex: 1,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        gap: 8,
      }}
    >
      <span
        aria-hidden
        className="flex items-center justify-center"
        style={{
          width: 56, height: 56, borderRadius: 16,
          backgroundColor: bg,
          transition: "background-color 0.18s ease",
        }}
      >
        {icon}
      </span>
      <span style={{
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        color: active ? "var(--success-500)" : "var(--foreground)",
      }}>
        {label}
      </span>
    </motion.button>
  );
}

// ─── Brand icons (third-party logos — colour passed by caller) ───────────────

function WhatsAppIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color ?? "currentColor"} aria-hidden>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.297-.497.099-.198.05-.372-.025-.521-.074-.149-.668-1.612-.916-2.207-.241-.579-.486-.5-.668-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

function TelegramIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color ?? "currentColor"} aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}
