/**
 * My Certificates — the canonical wallet of all credentials the student has earned.
 * Reached from Profile › My Certificates. Tap a row to view the full certificate.
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Award, ChevronRight, Music, GraduationCap, Tent, FileText, Trophy } from "lucide-react";
import type { ComponentType } from "react";
import { GlassHeader, StatusBar, StaggerList, StaggerItem } from "../shared/premium-ui";
import { DUMMY_CERTIFICATES, formatIssuedDate, type Certificate } from "../shared/certificates";
import { useOlympiadState } from "../shared/olympiads";
import { CertificateModal } from "./certificate-view";

export function Component() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Certificate | null>(null);
  const { earnedCertificates } = useOlympiadState();
  // Olympiad certs (earned dynamically) surface first, then course/credential certs.
  const certificates = [...earnedCertificates, ...DUMMY_CERTIFICATES];

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, padding: "0 8px 0 12px", gap: 4 }}>
          <button onClick={() => navigate("/profile")} aria-label="Back" className="flex items-center justify-center"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={22} style={{ color: "var(--foreground)" }} />
          </button>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>My Certificates</span>
        </div>
      </GlassHeader>

      <div className="w-full max-w-2xl mx-auto" style={{ padding: "20px 20px 32px" }}>
        {certificates.length === 0 ? (
          <EmptyState />
        ) : (
          <StaggerList className="flex flex-col" style={{ gap: 12 }}>
            <StaggerItem>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
                {certificates.length} {certificates.length === 1 ? "certificate" : "certificates"} earned
              </span>
            </StaggerItem>
            {certificates.map((cert) => (
              <StaggerItem key={cert.id}>
                <CertificateRow cert={cert} onClick={() => setActive(cert)} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>

      {active && <CertificateModal certificate={active} onClose={() => setActive(null)} />}
    </div>
  );
}

// Per-category brand styling for the code-rendered thumbnail (used when a cert
// has no `thumbImage`). Colour family + glyph mirror the product's course art:
// crash courses green, mock-test/test-series red, olympiad gold, etc.
const CERT_BRAND: Record<Certificate["category"], { accent: string; Icon: ComponentType<{ size?: number | string; style?: React.CSSProperties }> }> = {
  music:         { accent: "var(--purple-500)",  Icon: Music },
  course:        { accent: "var(--success-500)", Icon: GraduationCap },
  camp:          { accent: "var(--primary-500)", Icon: Tent },
  "test-series": { accent: "var(--error-500)",   Icon: FileText },
  olympiad:      { accent: "var(--warning-500)", Icon: Trophy },
};

// Pull a recognisable exam token out of the title (JEE / CAT / NEET …); else
// fall back to the initials of the first two words.
const EXAM_TOKENS = ["JEE", "NEET", "GATE", "UPSC", "SSC", "CLAT", "IBPS", "IELTS", "GRE", "CAT"];
function certLabel(title: string): string {
  const up = title.toUpperCase();
  const tok = EXAM_TOKENS.find((t) => up.includes(t));
  if (tok) return tok;
  const words = title.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).map((w) => w[0]).join("") || "TM").toUpperCase();
}

// Branded diagonal-split thumbnail — a mini course card (two-tone wedge + bold
// exam label + faint category glyph), matching the product's course artwork.
function CertThumb({ cert }: { cert: Certificate }) {
  const { accent, Icon } = CERT_BRAND[cert.category] ?? CERT_BRAND.olympiad;
  const label = certLabel(cert.courseTitle);
  const back = `color-mix(in srgb, ${accent} 26%, var(--black))`;
  return (
    <div aria-hidden style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      background: `linear-gradient(118deg, ${back} 0%, ${back} 46%, ${accent} 46%, ${accent} 100%)`,
    }}>
      <Icon size={28} style={{ position: "absolute", right: -3, bottom: -3, color: "var(--white)", opacity: 0.18 }} />
      <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
        <span style={{
          fontSize: label.length >= 4 ? "var(--text-2xs)" : "var(--text-sm)",
          fontWeight: 800, letterSpacing: 0.2, color: "var(--white)", lineHeight: 1,
        }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function CertificateRow({ cert, onClick }: { cert: Certificate; onClick: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!cert.thumbImage && !imgFailed;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      aria-label={`View certificate: ${cert.courseTitle} from ${cert.organization}`}
      className="flex items-center w-full text-left"
      style={{
        gap: 12, padding: 12, borderRadius: 12, cursor: "pointer",
        backgroundColor: "var(--card-bg-secondary)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-family-inter)",
      }}
    >
      {/* Thumbnail — real course image when present, else a branded course card */}
      <div className="flex items-center justify-center shrink-0" style={{
        width: 48, height: 48, borderRadius: 12, overflow: "hidden", backgroundColor: "var(--card)",
      }}>
        {showImage ? (
          <img
            src={cert.thumbImage}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <CertThumb cert={cert} />
        )}
      </div>

      <div className="flex flex-col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <span className="truncate" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--foreground)" }}>
          {cert.courseTitle}
        </span>
        <span className="truncate" style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
          {cert.organization}
        </span>
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
          Issued {formatIssuedDate(cert.issuedOn)}
        </span>
      </div>

      <ChevronRight size={18} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
    </motion.button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center" style={{ padding: "64px 24px", gap: 8 }}>
      <div className="flex items-center justify-center" style={{
        width: 72, height: 72, borderRadius: "var(--radius-full)", marginBottom: 8,
        backgroundColor: "var(--card-bg-secondary)", border: "1px solid var(--border)",
      }}>
        <Award size={32} style={{ color: "var(--muted-foreground)" }} />
      </div>
      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>No certificates yet</span>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 280 }}>
        Complete a course to earn your first verifiable certificate. It'll show up here.
      </span>
    </div>
  );
}
