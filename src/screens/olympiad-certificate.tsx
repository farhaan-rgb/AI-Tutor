/**
 * Olympiad Certificate — the two-track credential. Everyone who attempted gets a
 * participation certificate; the top N ranks get a rank certificate. Reuses the
 * existing CertificateArtifact + ShareSheet (share + PNG download) from the
 * course-certificate system; the artifact is built from the olympiad attempt.
 *
 * Route: /olympiad/:olympiadId/certificate
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { Share2, Medal, Award } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";
import {
  getOlympiadById, useOlympiadState, isRankCertificate, buildOlympiadCertificate,
} from "../shared/olympiads";
import { CertificateArtifact, ShareSheet } from "./certificate-view";
import { OlympiadHeader, olympiadBack } from "./olympiad-ui";

export function Component() {
  const navigate = useNavigate();
  const { olympiadId } = useParams<{ olympiadId: string }>();
  const o = olympiadId ? getOlympiadById(olympiadId) : undefined;
  const state = useOlympiadState();
  const [showShare, setShowShare] = useState(false);

  if (!o) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)" }}>
        <span style={{ color: "var(--foreground)" }}>Olympiad not found</span>
      </div>
    );
  }

  const attempt = state.getAttempt(o.id);

  if (!attempt) {
    return (
      <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
        <GlassHeader><StatusBar /><OlympiadHeader title="Certificate" onBack={() => olympiadBack(navigate, `/olympiad/${o.id}`)} /></GlassHeader>
        <div className="flex flex-col items-center justify-center text-center" style={{ flex: 1, gap: 12, padding: 24 }}>
          <Award size={40} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>No certificate yet</span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 280 }}>
            Certificates are issued to everyone who attempts the Olympiad. You didn't sit this one.
          </span>
        </div>
      </div>
    );
  }

  const ranked = isRankCertificate(o, attempt.rank);
  const certificate = buildOlympiadCertificate(o, attempt);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <OlympiadHeader title="Your certificate" onBack={() => olympiadBack(navigate, `/olympiad/${o.id}`)} />
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ padding: "16px 16px 32px", gap: 16 }}>
        {/* Track banner */}
        <div className="flex items-center" style={{
          gap: 12, padding: 12, borderRadius: 12,
          backgroundColor: `color-mix(in srgb, ${ranked ? "var(--warning-500)" : "var(--primary-500)"} 12%, transparent)`,
          border: `0.5px solid color-mix(in srgb, ${ranked ? "var(--warning-500)" : "var(--primary-500)"} 35%, transparent)`,
        }}>
          {ranked ? <Medal size={18} style={{ color: "var(--warning-500)" }} /> : <Award size={18} style={{ color: "var(--primary-400)" }} />}
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--foreground)" }}>
            {ranked
              ? `Rank certificate · All-India Rank ${attempt.rank.toLocaleString("en-IN")}`
              : "Participation certificate"}
          </span>
        </div>

        {/* Artifact */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <CertificateArtifact certificate={certificate} variant="dark" />
        </motion.div>

        {/* Share / download */}
        <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => setShowShare(true)}
          className="flex items-center justify-center w-full"
          style={{ height: 44, borderRadius: 12, gap: 8, border: "none", cursor: "pointer", backgroundColor: "var(--primary-500)", color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
          <Share2 size={16} /> Share or download
        </motion.button>

        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)", textAlign: "center" }}>
          Credential ID {certificate.credentialId} · verifiable at teachmint.com/verify
        </span>
      </div>

      {showShare && <ShareSheet certificate={certificate} onClose={() => setShowShare(false)} />}
    </div>
  );
}
