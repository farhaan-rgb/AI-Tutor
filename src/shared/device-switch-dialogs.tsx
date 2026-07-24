import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Smartphone, LogIn } from "lucide-react";

/* ─────────── shared building blocks ─────────── */

function Backdrop({ onClick, dismissable }: { onClick?: () => void; dismissable: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={dismissable ? onClick : undefined}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--overlay-heavy)",
        backdropFilter: "blur(4px)",
        zIndex: 9000,
      }}
    />
  );
}

function DialogShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: "fixed",
        inset: 0,
        padding: 16,
        zIndex: 9001,
        pointerEvents: "none",
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: 360,
          backgroundColor: "var(--card)",
          borderRadius: 20,
          border: "0.5px solid var(--border)",
          boxShadow: "var(--elevation-xl)",
          padding: 20,
          fontFamily: "var(--font-family-inter)",
          pointerEvents: "auto",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function TintedIconBubble({
  children,
  tint,
}: {
  children: React.ReactNode;
  tint: "info" | "neutral";
}) {
  const bg =
    tint === "info"
      ? "color-mix(in srgb, var(--primary-500) 14%, transparent)"
      : "color-mix(in srgb, var(--foreground) 8%, transparent)";
  const fg = tint === "info" ? "var(--primary-500)" : "var(--foreground)";
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: bg, color: fg }}
    >
      {children}
    </div>
  );
}

function GhostButton({
  children,
  onClick,
  flex,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  flex?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className={`flex items-center justify-center ${flex ? "flex-1" : ""}`}
      style={{
        height: 44,
        borderRadius: 12,
        backgroundColor: "transparent",
        border: "0.5px solid var(--border)",
        color: "var(--foreground)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-semibold)",
        padding: "0 20px",
        cursor: "pointer",
      }}
    >
      {children}
    </motion.button>
  );
}

function SolidButton({
  children,
  onClick,
  flex,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  flex?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className={`flex items-center justify-center ${flex ? "flex-1" : ""}`}
      style={{
        height: 44,
        borderRadius: 12,
        backgroundColor: "var(--primary-500)",
        border: "none",
        color: "var(--white)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-semibold)",
        padding: "0 20px",
        cursor: "pointer",
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─────────── Dialog 1 — Confirm sign-in on this device ─────────── */

export interface ActiveDevice {
  label: string;   // e.g. "Android phone"
  model?: string;  // e.g. "Vivo V21 · V2153"
}

export interface DeviceSwitchConfirmDialogProps {
  open: boolean;
  device: ActiveDevice;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeviceSwitchConfirmDialog({
  open,
  device,
  onConfirm,
  onCancel,
}: DeviceSwitchConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClick={onCancel} dismissable />
          <DialogShell>
            <div className="flex flex-col" style={{ gap: 16 }}>
              <TintedIconBubble tint="info">
                <Smartphone size={24} strokeWidth={2} />
              </TintedIconBubble>

              <div className="flex flex-col" style={{ gap: 8 }}>
                <h2
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  Log in on this device?
                </h2>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--muted-foreground)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  You're already logged in on the device below. Log out there to continue
                  on this one.
                </p>
              </div>

              <div
                className="flex items-center"
                style={{
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "var(--card-bg-secondary)",
                  border: "0.5px solid var(--border-secondary)",
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: "color-mix(in srgb, var(--foreground) 6%, transparent)",
                    color: "var(--foreground)",
                  }}
                >
                  <Smartphone size={18} strokeWidth={2} />
                </div>
                <div className="flex flex-col min-w-0 flex-1" style={{ gap: 2 }}>
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--foreground)",
                      lineHeight: 1.3,
                    }}
                  >
                    {device.label}
                  </span>
                  {device.model && (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--muted-foreground)",
                        lineHeight: 1.3,
                      }}
                    >
                      {device.model}
                    </span>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{
                    backgroundColor:
                      "color-mix(in srgb, var(--destructive) 22%, transparent)",
                  }}
                  transition={{ duration: 0.12 }}
                  onClick={onConfirm}
                  aria-label="Log out this device"
                  className="flex items-center justify-center shrink-0"
                  style={{
                    height: 36,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "0.5px solid color-mix(in srgb, var(--destructive) 28%, transparent)",
                    backgroundColor:
                      "color-mix(in srgb, var(--destructive) 14%, transparent)",
                    color: "var(--destructive)",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    letterSpacing: 0.2,
                    cursor: "pointer",
                    gap: 8,
                  }}
                >
                  Log out
                </motion.button>
              </div>

              <div className="flex" style={{ marginTop: 4 }}>
                <GhostButton onClick={onCancel} flex>
                  Cancel
                </GhostButton>
              </div>
            </div>
          </DialogShell>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────── Dialog 2 — Session ended on this device ─────────── */

export interface SessionEndedDialogProps {
  open: boolean;
  onSignIn: () => void;
}

export function SessionEndedDialog({ open, onSignIn }: SessionEndedDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop dismissable={false} />
          <DialogShell>
            <div className="flex flex-col" style={{ gap: 16 }}>
              <TintedIconBubble tint="neutral">
                <LogIn size={24} strokeWidth={2} />
              </TintedIconBubble>

              <div className="flex flex-col" style={{ gap: 8 }}>
                <h2
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  Logged out on this device
                </h2>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--muted-foreground)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Your account was logged in on another device. To use Teachmint here, log
                  in again.
                </p>
              </div>

              <SolidButton onClick={onSignIn}>
                <span className="flex items-center" style={{ gap: 8 }}>
                  Log in
                </span>
              </SolidButton>
            </div>
          </DialogShell>
        </>
      )}
    </AnimatePresence>
  );
}
