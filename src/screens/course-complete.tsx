/**
 * Course Complete screen.
 * Opened from a finished "My Learning" item. Shows the completion summary, then
 * after 2s auto-presents the certificate-earned popup (share + saved-to-profile).
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, CheckCircle2, ChevronRight, BadgeCheck, X, Share2 } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import { getCertificate, DUMMY_CERTIFICATES } from "../shared/certificates";
import { CertificateArtifact, ShareSheet, ConfettiBurst, CertificateGenerating } from "./certificate-view";

// TODO(api): GET /api/courses/:courseId/completion — completion summary for this learner
const DUMMY_COMPLETION = {
  lessonsCompleted: 12,
  totalLessons: 12,
  hoursLearned: 9,
};

export function Component() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const certificate = getCertificate(courseId ?? "piano-beginner-solo") ?? DUMMY_CERTIFICATES[0];

  const [showPopup, setShowPopup] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // Popup runs two phases: the certificate is "minted" (generating) then revealed.
  const [phase, setPhase] = useState<"generating" | "done">("generating");
  // Once the popup has been shown (auto or manual) we never auto-reopen it.
  const hasShownRef = useRef(false);

  const openPopup = () => { hasShownRef.current = true; setPhase("generating"); setShowPopup(true); };

  // Auto-present the certificate popup 2s after landing — unless already opened.
  useEffect(() => {
    const t = window.setTimeout(() => { if (!hasShownRef.current) openPopup(); }, 2000);
    return () => window.clearTimeout(t);
  }, []);

  // Escape closes the popup (the share sheet handles its own Escape when open).
  useEffect(() => {
    if (!showPopup) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !showShare) setShowPopup(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPopup, showShare]);

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, padding: "0 8px 0 12px", gap: 4 }}>
          <button onClick={() => navigate("/classes")} aria-label="Back" className="flex items-center justify-center"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={22} style={{ color: "var(--foreground)" }} />
          </button>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>Course Complete</span>
        </div>
      </GlassHeader>

      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center" style={{ padding: "32px 20px 24px", gap: 8 }}>
        {/* Completion mark */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="flex items-center justify-center"
          style={{
            width: 88, height: 88, borderRadius: "var(--radius-full)", marginBottom: 8,
            background: "color-mix(in srgb, var(--success-500) 16%, transparent)",
          }}
        >
          <CheckCircle2 size={48} style={{ color: "var(--success-500)" }} />
        </motion.div>

        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--foreground)", maxWidth: "100%", overflowWrap: "break-word", margin: 0 }}>
          {certificate.courseTitle}
        </h1>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
          {certificate.organization}
        </span>

        {/* Summary stats */}
        <div className="flex items-stretch w-full" style={{ marginTop: 16, gap: 8 }}>
          {[
            { label: "Lessons", value: `${DUMMY_COMPLETION.lessonsCompleted}/${DUMMY_COMPLETION.totalLessons}` },
            { label: "Progress", value: "100%" },
            { label: "Time spent", value: `${DUMMY_COMPLETION.hoursLearned}h` },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center flex-1" style={{
              padding: "12px 8px", borderRadius: 12, gap: 2,
              backgroundColor: "var(--card-bg-secondary)", border: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--foreground)" }}>{s.value}</span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={openPopup}
          className="flex items-center justify-center w-full"
          style={{
            marginTop: 16, height: 44, gap: 8, borderRadius: 12, cursor: "pointer",
            background: "var(--gradient-primary-btn)", border: "none", color: "var(--white)",
            fontSize: "var(--text-sm)", fontWeight: 600,
          }}
        >
          View your certificate
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ─── Certificate earned popup ─── */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            role="dialog" aria-modal="true" aria-labelledby="cc-cert-title"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ backgroundColor: "var(--overlay-strong)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            onClick={() => { if (phase === "done") setShowPopup(false); }}
          >
            {phase === "done" && <ConfettiBurst />}
            <div className="flex items-center justify-end shrink-0" style={{ height: 48, padding: "0 16px" }}>
              {phase === "done" && (
                <button onClick={() => setShowPopup(false)} aria-label="Close" className="flex items-center justify-center"
                  style={{ width: 44, height: 44, marginRight: -12, background: "none", border: "none", cursor: "pointer" }}>
                  <X size={20} style={{ color: "var(--white-alpha-70)" }} />
                </button>
              )}
            </div>

            {phase === "generating" ? (
              <CertificateGenerating certificate={certificate} onDone={() => setPhase("done")} />
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "0 20px" }} onClick={(e) => e.stopPropagation()}>
                <div
                  className="w-full mx-auto my-auto flex flex-col items-center text-center"
                  style={{ maxWidth: 360, gap: 24 }}
                >
                  {/* Title swaps in; the certificate below carries over unchanged
                      from the generating phase (already crisp) so there's no jump. */}
                  <motion.span
                    id="cc-cert-title"
                    initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
                    style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--white)" }}
                  >
                    Congratulations!
                  </motion.span>

                  <div className="w-full">
                    <CertificateArtifact certificate={certificate} />
                  </div>

                  {/* Compact saved-to-profile reassurance */}
                  <motion.div
                    className="flex items-center justify-center" style={{ gap: 6 }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.25 }}
                  >
                    <BadgeCheck size={16} style={{ color: "var(--success-500)", flexShrink: 0 }} />
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--white-alpha-70)" }}>
                      Saved to <strong style={{ color: "var(--white-alpha-90)" }}>Profile › My Certificates</strong>
                    </span>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Pinned action bar — CTAs anchored to the bottom (reveal phase only) */}
            {phase === "done" && (
              <motion.div
                className="shrink-0"
                style={{ padding: "12px 20px calc(20px + env(safe-area-inset-bottom))" }}
                initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full mx-auto flex flex-col" style={{ maxWidth: 360, gap: 8 }}>
                  <button
                    onClick={() => setShowShare(true)}
                    className="flex items-center justify-center w-full"
                    style={{
                      height: 44, gap: 8, borderRadius: 12, cursor: "pointer",
                      background: "var(--gradient-primary-btn)", border: "none", color: "var(--white)",
                      fontSize: "var(--text-sm)", fontWeight: 600,
                    }}
                  >
                    <Share2 size={18} />
                    Share certificate
                  </button>
                  <button
                    onClick={() => navigate("/my-certificates")}
                    className="flex items-center justify-center w-full"
                    style={{
                      height: 44, gap: 8, borderRadius: 12, cursor: "pointer",
                      backgroundColor: "transparent", border: "1px solid var(--white-alpha-25)",
                      color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600,
                    }}
                  >
                    View in My Certificates
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showShare && <ShareSheet certificate={certificate} onClose={() => setShowShare(false)} />}
    </div>
  );
}
