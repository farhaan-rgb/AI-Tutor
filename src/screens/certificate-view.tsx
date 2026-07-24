/**
 * Certificate artifact + share row + full-screen modal viewer.
 * Reused by the course-completion popup and the profile "My Certificates" list.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toPng } from "html-to-image";
import { Download, Check, X, MoreHorizontal, Share2, Loader2 } from "lucide-react";
import { type Certificate, formatIssuedDate } from "../shared/certificates";

/* ─────────── CERTIFICATE ARTIFACT (the visual credential) ─────────── */

export type CertVariant = "dark" | "light";

// ── Cert typography + fixed institutional signatory ──
// Serif/script upgrade automatically if the brand fonts get self-hosted; until
// then they fall back to system serif/cursive (still reads as a document).
const CERT_SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const CERT_SCRIPT = "'Great Vibes', 'Snell Roundhand', 'Brush Script MT', cursive";
// Online certs aren't wet-signed — a single authorised signature image is pasted
// into the slot for every cert. Set SIGNATURE_SRC to that asset; until provided,
// the signatory name renders in a script font as a stand-in.
const SIGNATORY = { name: "Dr. Anitha Rao", title: "Head of Academics, Teachmint" };
const SIGNATURE_SRC = ""; // TODO(brand): /signature.png (transparent bg)
// Gold-foil gradient, all from cert tokens (no hardcoded hex).
const FOIL =
  "linear-gradient(135deg, color-mix(in srgb, var(--cert-gold) 62%, var(--black)) 0%, var(--cert-gold-soft) 24%, color-mix(in srgb, var(--cert-gold-soft) 45%, var(--white)) 50%, var(--cert-gold-soft) 76%, color-mix(in srgb, var(--cert-gold) 62%, var(--black)) 100%)";

/**
 * The single canonical certificate — a landscape "premium paper" document shown
 * BOTH in-app (this React artifact) and downloaded (the standalone HTML template
 * in design-handoff/certificate-template.html mirrors it 1:1). Fully fluid: every
 * dimension is in container-query width units (cqw), so it scales from a phone
 * modal up to full A4 with identical proportions. `variant` is accepted for
 * call-site compatibility but the design is unified (light document).
 */
export function CertificateArtifact({ certificate, recipientSlot }: { certificate: Certificate; variant?: CertVariant; recipientSlot?: React.ReactNode }) {
  const c = certificate;
  const headline = c.category === "olympiad" ? "Certificate of Achievement" : "Certificate of Completion";
  const verifyUrl = `teachmint.com/verify/${c.credentialId}`;
  const srLabel = `${headline}: ${c.courseTitle}, awarded to ${c.recipientName} by ${c.organization}. Issued ${formatIssuedDate(c.issuedOn)}. Credential ID ${c.credentialId}. Verified by Teachmint.`;

  const labelStyle = { fontSize: "0.78cqw", fontWeight: 700, letterSpacing: "0.12cqw", textTransform: "uppercase" as const, color: "var(--cert-ink-muted)", fontFamily: "var(--font-family-inter)" };
  const valueStyle = { fontSize: "1.02cqw", fontWeight: 600, color: "var(--cert-ink)", fontFamily: "var(--font-family-inter)" };

  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
      <div
        role="img"
        aria-label={srLabel}
        className="relative"
        style={{
          width: "100%", aspectRatio: "297 / 210", overflow: "hidden", borderRadius: "1.2cqw",
          background: "radial-gradient(120% 90% at 50% 0%, var(--white) 0%, var(--cert-paper) 48%, var(--cert-paper-edge) 100%)",
          boxShadow: "0 1.2cqw 4cqw color-mix(in srgb, var(--black) 22%, transparent)",
          fontFamily: CERT_SERIF,
        }}
      >
        {/* faint centre watermark — light Teachmint brand mark */}
        <svg aria-hidden viewBox="0 0 24 24" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "64cqw", height: "64cqw" }}>
          <path opacity={0.03} fill="#1C8CD1" fillRule="evenodd" clipRule="evenodd" d="M18.6008 0.412274C18.6008 0.351645 18.5766 0.278891 18.5523 0.218263C18.5281 0.157634 18.4796 0.109131 18.4189 0.0727542C18.3583 0.0363771 18.2977 0.0121257 18.2371 0.0121257C18.1764 0.0121257 18.1037 0.0121257 18.0431 0.0363771L12.4167 2.43727C12.344 2.47364 12.2833 2.52215 12.2348 2.58278C12.1863 2.6434 12.1621 2.72828 12.1621 2.80104V3.66196C12.1621 3.66196 12.1742 3.77109 12.1985 3.8196C12.2227 3.8681 12.2591 3.90448 12.3076 3.94085C12.4046 4.00148 12.5137 4.01361 12.6229 3.96511L18.3098 1.53996C18.3947 1.50359 18.4796 1.44296 18.5281 1.35808C18.5766 1.2732 18.613 1.17619 18.613 1.07919V0.412274H18.6008ZM11.1314 2.44939L5.48082 0.0363771C5.48082 0.0363771 5.37169 0 5.32319 0C5.25043 0 5.16555 0.0242514 5.10492 0.0727542C5.04429 0.109131 4.99579 0.157634 4.97154 0.218263C4.93516 0.278891 4.92304 0.33952 4.92304 0.412274V1.06706C4.92304 1.17619 4.95941 1.2732 5.00792 1.3702C5.05642 1.46721 5.15343 1.52784 5.25043 1.57634L10.9374 4.00148C11.0344 4.03786 11.1435 4.02573 11.2284 3.97723C11.2769 3.95298 11.3012 3.90448 11.3254 3.8681C11.3497 3.83172 11.3618 3.77109 11.3618 3.72259V2.84954C11.3618 2.76466 11.3375 2.69191 11.289 2.63128C11.2405 2.57065 11.1799 2.51002 11.1071 2.48577L11.1314 2.44939ZM12.4167 4.95941C12.344 4.98367 12.2833 5.04429 12.2348 5.10492C12.1863 5.16555 12.1742 5.25043 12.1742 5.32319V6.28112C12.1742 6.28112 12.1742 6.35387 12.1985 6.37812C12.2106 6.40237 12.2348 6.43875 12.2712 6.45088C12.2955 6.47513 12.3318 6.48725 12.3682 6.48725C12.4046 6.48725 12.441 6.48725 12.4652 6.48725L18.613 3.85597L19.0252 3.68621L19.4254 3.51646L20.6743 2.9708C20.7713 2.93442 20.8562 2.86167 20.9047 2.77679C20.9532 2.69191 20.9896 2.58278 20.9896 2.48577V1.92799C20.9896 1.86736 20.9775 1.7946 20.9411 1.73398C20.9047 1.67335 20.8683 1.62484 20.8077 1.58847C20.7471 1.53996 20.6743 1.51571 20.5894 1.51571C20.5288 1.51571 20.4803 1.52784 20.4318 1.55209L19.4133 1.98862L19.0131 2.15838L18.613 2.32814L12.4167 4.98367V4.95941ZM11.1314 4.95941L4.92304 2.30388L4.52289 2.13412L4.12274 1.96436L3.09206 1.52784C3.09206 1.52784 2.98292 1.49146 2.93442 1.49146C2.88592 1.49146 2.82529 1.49146 2.77679 1.51571C2.72828 1.53996 2.67978 1.56422 2.6434 1.60059C2.60703 1.63697 2.57065 1.68547 2.55852 1.73398C2.53427 1.78248 2.52215 1.83098 2.52215 1.89161V2.52215C2.52215 2.69191 2.61915 2.84954 2.78891 2.9223L4.11061 3.48008L4.51076 3.64984L4.92304 3.8196L11.0465 6.43875C11.0465 6.43875 11.1193 6.463 11.1678 6.463C11.2163 6.463 11.2405 6.45088 11.2769 6.42662C11.3133 6.40237 11.3375 6.37812 11.3618 6.34174C11.386 6.30537 11.3982 6.26899 11.3982 6.23261V5.33531C11.3982 5.25043 11.3739 5.17768 11.3375 5.11705C11.289 5.05642 11.2284 4.99579 11.1556 4.97154L11.1314 4.95941ZM23.4875 3.24969C23.4875 3.17694 23.4754 3.11631 23.439 3.05568C23.4026 2.99505 23.3662 2.94655 23.3056 2.91017C23.245 2.86167 23.1722 2.83742 23.0873 2.83742C23.0267 2.83742 22.9782 2.84954 22.9297 2.87379L21.8141 3.3467L21.414 3.51646L21.0138 3.68621L19.4375 4.35313L19.0374 4.52289L18.6251 4.69265L12.441 7.33605C12.3682 7.3603 12.3076 7.42093 12.2591 7.48156C12.2106 7.54219 12.1863 7.62707 12.1863 7.69982V11.6649C12.1863 11.6649 12.1863 11.6407 12.1863 11.6286V17.5338C12.1863 17.5338 12.1863 17.5944 12.1863 17.6308V23.5602C12.1863 23.633 12.1985 23.6936 12.2348 23.7543C12.2712 23.8149 12.3197 23.8634 12.3803 23.8998C12.441 23.9361 12.5016 23.9604 12.5744 23.9604C12.6471 23.9604 12.7077 23.9604 12.7684 23.924L23.342 18.5645C23.4754 18.4917 23.5602 18.3583 23.5602 18.2007L23.4754 3.20119L23.4875 3.24969ZM11.1314 7.37243L4.91091 4.7169L4.51076 4.54714L4.09849 4.37738L2.52215 3.69834L2.122 3.52858L1.72185 3.35882L0.606285 2.88592C0.606285 2.88592 0.497154 2.84954 0.448651 2.84954C0.375897 2.84954 0.291017 2.87379 0.230388 2.9223C0.16976 2.95867 0.133383 3.00718 0.0970057 3.0678C0.0606285 3.12843 0.0485028 3.18906 0.0485028 3.26182L0 18.2492C0 18.3219 0.0242514 18.3947 0.0606285 18.4553C0.0970057 18.516 0.157634 18.5766 0.218263 18.6008L10.7919 23.9604C10.8525 23.9846 10.9253 24.0089 10.9859 23.9968C11.0586 23.9968 11.1193 23.9725 11.1799 23.9361C11.2405 23.8998 11.289 23.8513 11.3254 23.7906C11.3618 23.73 11.3739 23.6573 11.3739 23.5966V7.7362C11.3739 7.65132 11.3497 7.57857 11.3012 7.51794C11.2527 7.45731 11.192 7.39668 11.1193 7.37243H11.1314Z" />
          <path fill="var(--cert-paper)" fillRule="evenodd" clipRule="evenodd" d="M9.31104 17.764C9.23828 17.8003 9.16553 17.8246 9.09278 17.8246C9.02002 17.8246 8.93514 17.8003 8.87451 17.764C8.81388 17.7276 8.75326 17.667 8.71688 17.6063C8.6805 17.5457 8.65625 17.4608 8.65625 17.3881V9.50635C8.65625 9.4336 8.6805 9.34872 8.71688 9.28809C8.75326 9.22746 8.81388 9.16683 8.87451 9.13045C8.94727 9.09408 9.02002 9.06982 9.09278 9.06982C9.16553 9.06982 9.25041 9.09408 9.31104 9.13045L12.7305 11.0948L16.1499 13.0592C16.2227 13.0956 16.2712 13.1562 16.3076 13.2168C16.3439 13.2774 16.3682 13.3623 16.3682 13.4351C16.3682 13.5078 16.3439 13.5927 16.3076 13.6533C16.2712 13.714 16.2106 13.7746 16.1499 13.811L12.7426 15.7875L9.32316 17.764H9.31104Z" />
        </svg>

        {/* gold foil frame — foil ring with the paper panel filling the interior */}
        <div aria-hidden style={{ position: "absolute", inset: "3cqw", padding: "0.72cqw", borderRadius: "0.5cqw", background: FOIL }}>
          <div style={{
            width: "100%", height: "100%", borderRadius: "0.2cqw",
            border: "0.12cqw solid color-mix(in srgb, var(--cert-gold) 55%, transparent)",
            background: "radial-gradient(120% 90% at 50% 0%, var(--white) 0%, var(--cert-paper) 55%, var(--cert-paper-edge) 100%)",
          }} />
        </div>
        {/* corner flourishes */}
        {([["tl", { top: "4.4cqw", left: "4.4cqw", borderRight: 0, borderBottom: 0 }],
           ["tr", { top: "4.4cqw", right: "4.4cqw", borderLeft: 0, borderBottom: 0 }],
           ["bl", { bottom: "4.4cqw", left: "4.4cqw", borderRight: 0, borderTop: 0 }],
           ["br", { bottom: "4.4cqw", right: "4.4cqw", borderLeft: 0, borderTop: 0 }]] as const).map(([k, pos]) => (
          <span key={k} aria-hidden style={{ position: "absolute", width: "5cqw", height: "5cqw", border: "0.16cqw solid var(--cert-gold)", opacity: 0.7, ...pos }} />
        ))}

        {/* content */}
        <div className="absolute flex flex-col items-center text-center" aria-hidden style={{ inset: "3cqw", padding: "5cqw 8.5cqw 4.4cqw" }}>
          {/* Teachmint logo — official lockup, top-left. (Brand hex is the allowed exception to the CSS-var rule, same as other logo marks.) */}
          <svg viewBox="0 0 130 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Teachmint"
            style={{ position: "absolute", top: "3cqw", left: "5cqw", height: "2.8cqw", width: "auto" }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M18.6008 0.412274C18.6008 0.351645 18.5766 0.278891 18.5523 0.218263C18.5281 0.157634 18.4796 0.109131 18.4189 0.0727542C18.3583 0.0363771 18.2977 0.0121257 18.2371 0.0121257C18.1764 0.0121257 18.1037 0.0121257 18.0431 0.0363771L12.4167 2.43727C12.344 2.47364 12.2833 2.52215 12.2348 2.58278C12.1863 2.6434 12.1621 2.72828 12.1621 2.80104V3.66196C12.1621 3.66196 12.1742 3.77109 12.1985 3.8196C12.2227 3.8681 12.2591 3.90448 12.3076 3.94085C12.4046 4.00148 12.5137 4.01361 12.6229 3.96511L18.3098 1.53996C18.3947 1.50359 18.4796 1.44296 18.5281 1.35808C18.5766 1.2732 18.613 1.17619 18.613 1.07919V0.412274H18.6008ZM11.1314 2.44939L5.48082 0.0363771C5.48082 0.0363771 5.37169 0 5.32319 0C5.25043 0 5.16555 0.0242514 5.10492 0.0727542C5.04429 0.109131 4.99579 0.157634 4.97154 0.218263C4.93516 0.278891 4.92304 0.33952 4.92304 0.412274V1.06706C4.92304 1.17619 4.95941 1.2732 5.00792 1.3702C5.05642 1.46721 5.15343 1.52784 5.25043 1.57634L10.9374 4.00148C11.0344 4.03786 11.1435 4.02573 11.2284 3.97723C11.2769 3.95298 11.3012 3.90448 11.3254 3.8681C11.3497 3.83172 11.3618 3.77109 11.3618 3.72259V2.84954C11.3618 2.76466 11.3375 2.69191 11.289 2.63128C11.2405 2.57065 11.1799 2.51002 11.1071 2.48577L11.1314 2.44939ZM12.4167 4.95941C12.344 4.98367 12.2833 5.04429 12.2348 5.10492C12.1863 5.16555 12.1742 5.25043 12.1742 5.32319V6.28112C12.1742 6.28112 12.1742 6.35387 12.1985 6.37812C12.2106 6.40237 12.2348 6.43875 12.2712 6.45088C12.2955 6.47513 12.3318 6.48725 12.3682 6.48725C12.4046 6.48725 12.441 6.48725 12.4652 6.48725L18.613 3.85597L19.0252 3.68621L19.4254 3.51646L20.6743 2.9708C20.7713 2.93442 20.8562 2.86167 20.9047 2.77679C20.9532 2.69191 20.9896 2.58278 20.9896 2.48577V1.92799C20.9896 1.86736 20.9775 1.7946 20.9411 1.73398C20.9047 1.67335 20.8683 1.62484 20.8077 1.58847C20.7471 1.53996 20.6743 1.51571 20.5894 1.51571C20.5288 1.51571 20.4803 1.52784 20.4318 1.55209L19.4133 1.98862L19.0131 2.15838L18.613 2.32814L12.4167 4.98367V4.95941ZM11.1314 4.95941L4.92304 2.30388L4.52289 2.13412L4.12274 1.96436L3.09206 1.52784C3.09206 1.52784 2.98292 1.49146 2.93442 1.49146C2.88592 1.49146 2.82529 1.49146 2.77679 1.51571C2.72828 1.53996 2.67978 1.56422 2.6434 1.60059C2.60703 1.63697 2.57065 1.68547 2.55852 1.73398C2.53427 1.78248 2.52215 1.83098 2.52215 1.89161V2.52215C2.52215 2.69191 2.61915 2.84954 2.78891 2.9223L4.11061 3.48008L4.51076 3.64984L4.92304 3.8196L11.0465 6.43875C11.0465 6.43875 11.1193 6.463 11.1678 6.463C11.2163 6.463 11.2405 6.45088 11.2769 6.42662C11.3133 6.40237 11.3375 6.37812 11.3618 6.34174C11.386 6.30537 11.3982 6.26899 11.3982 6.23261V5.33531C11.3982 5.25043 11.3739 5.17768 11.3375 5.11705C11.289 5.05642 11.2284 4.99579 11.1556 4.97154L11.1314 4.95941ZM23.4875 3.24969C23.4875 3.17694 23.4754 3.11631 23.439 3.05568C23.4026 2.99505 23.3662 2.94655 23.3056 2.91017C23.245 2.86167 23.1722 2.83742 23.0873 2.83742C23.0267 2.83742 22.9782 2.84954 22.9297 2.87379L21.8141 3.3467L21.414 3.51646L21.0138 3.68621L19.4375 4.35313L19.0374 4.52289L18.6251 4.69265L12.441 7.33605C12.3682 7.3603 12.3076 7.42093 12.2591 7.48156C12.2106 7.54219 12.1863 7.62707 12.1863 7.69982V11.6649C12.1863 11.6649 12.1863 11.6407 12.1863 11.6286V17.5338C12.1863 17.5338 12.1863 17.5944 12.1863 17.6308V23.5602C12.1863 23.633 12.1985 23.6936 12.2348 23.7543C12.2712 23.8149 12.3197 23.8634 12.3803 23.8998C12.441 23.9361 12.5016 23.9604 12.5744 23.9604C12.6471 23.9604 12.7077 23.9604 12.7684 23.924L23.342 18.5645C23.4754 18.4917 23.5602 18.3583 23.5602 18.2007L23.4754 3.20119L23.4875 3.24969ZM11.1314 7.37243L4.91091 4.7169L4.51076 4.54714L4.09849 4.37738L2.52215 3.69834L2.122 3.52858L1.72185 3.35882L0.606285 2.88592C0.606285 2.88592 0.497154 2.84954 0.448651 2.84954C0.375897 2.84954 0.291017 2.87379 0.230388 2.9223C0.16976 2.95867 0.133383 3.00718 0.0970057 3.0678C0.0606285 3.12843 0.0485028 3.18906 0.0485028 3.26182L0 18.2492C0 18.3219 0.0242514 18.3947 0.0606285 18.4553C0.0970057 18.516 0.157634 18.5766 0.218263 18.6008L10.7919 23.9604C10.8525 23.9846 10.9253 24.0089 10.9859 23.9968C11.0586 23.9968 11.1193 23.9725 11.1799 23.9361C11.2405 23.8998 11.289 23.8513 11.3254 23.7906C11.3618 23.73 11.3739 23.6573 11.3739 23.5966V7.7362C11.3739 7.65132 11.3497 7.57857 11.3012 7.51794C11.2527 7.45731 11.192 7.39668 11.1193 7.37243H11.1314Z" fill="#1C8CD1" />
            <path fillRule="evenodd" clipRule="evenodd" d="M9.31104 17.764C9.23828 17.8003 9.16553 17.8246 9.09278 17.8246C9.02002 17.8246 8.93514 17.8003 8.87451 17.764C8.81388 17.7276 8.75326 17.667 8.71688 17.6063C8.6805 17.5457 8.65625 17.4608 8.65625 17.3881V9.50635C8.65625 9.4336 8.6805 9.34872 8.71688 9.28809C8.75326 9.22746 8.81388 9.16683 8.87451 9.13045C8.94727 9.09408 9.02002 9.06982 9.09278 9.06982C9.16553 9.06982 9.25041 9.09408 9.31104 9.13045L12.7305 11.0948L16.1499 13.0592C16.2227 13.0956 16.2712 13.1562 16.3076 13.2168C16.3439 13.2774 16.3682 13.3623 16.3682 13.4351C16.3682 13.5078 16.3439 13.5927 16.3076 13.6533C16.2712 13.714 16.2106 13.7746 16.1499 13.811L12.7426 15.7875L9.32316 17.764H9.31104Z" fill="white" />
            <path d="M42.3401 5.83742H37.599V19.1514H34.6767V5.83742H29.9355V3.43653H42.328V5.83742H42.3401ZM48.5485 12.2883C48.5485 11.9366 48.5 11.6093 48.3909 11.3061C48.2939 10.9908 48.1484 10.7241 47.9543 10.4937C47.7603 10.2633 47.5057 10.0814 47.2026 9.94803C46.9115 9.81465 46.5599 9.74189 46.1597 9.74189C45.3837 9.74189 44.7774 9.96016 44.3288 10.4088C43.8922 10.8453 43.6012 11.4759 43.48 12.2883H48.5485ZM43.4315 13.9131C43.48 14.483 43.577 14.9802 43.7346 15.4046C43.8922 15.8169 44.0984 16.1564 44.3651 16.4353C44.6198 16.702 44.935 16.9082 45.2867 17.0416C45.6505 17.175 46.0506 17.2356 46.4871 17.2356C46.9237 17.2356 47.2996 17.1871 47.6027 17.0779C47.918 16.9809 48.1969 16.8597 48.4273 16.7384C48.6698 16.6172 48.8759 16.508 49.0457 16.3989C49.2275 16.3019 49.3973 16.2413 49.5671 16.2413C49.7975 16.2413 49.9551 16.3262 50.0642 16.4959L50.8403 17.4781C50.5492 17.8297 50.2097 18.1208 49.846 18.3633C49.4822 18.5937 49.0942 18.7877 48.6819 18.9332C48.2817 19.0666 47.8695 19.1636 47.4572 19.2242C47.0449 19.2848 46.6448 19.3091 46.2567 19.3091C45.4807 19.3091 44.7653 19.1878 44.0984 18.9332C43.4315 18.6664 42.8494 18.2905 42.3644 17.7934C41.8672 17.2841 41.4792 16.6657 41.2003 15.926C40.9214 15.1742 40.7759 14.3133 40.7759 13.3432C40.7759 12.5793 40.8972 11.8639 41.1397 11.197C41.3822 10.5179 41.7339 9.9359 42.1946 9.45088C42.6554 8.95372 43.2253 8.55357 43.8801 8.26256C44.547 7.97154 45.2988 7.82603 46.1234 7.82603C46.8267 7.82603 47.4693 7.93516 48.0635 8.16555C48.6576 8.39594 49.1669 8.72333 49.5913 9.15986C50.0157 9.58426 50.3552 10.1178 50.5856 10.7483C50.8281 11.3667 50.9494 12.0822 50.9494 12.8946C50.9494 13.2947 50.9009 13.5736 50.816 13.7191C50.7311 13.8525 50.5614 13.9253 50.3189 13.9253H43.4193L43.4315 13.9131ZM58.8675 14.386C58.0914 14.4224 57.4367 14.4952 56.9152 14.5922C56.3817 14.6892 55.9573 14.8104 55.642 14.9559C55.3268 15.1015 55.0964 15.2833 54.963 15.4895C54.8296 15.6835 54.7569 15.9139 54.7569 16.1564C54.7569 16.6293 54.8903 16.9688 55.1691 17.1628C55.448 17.369 55.8118 17.466 56.2726 17.466C56.8182 17.466 57.3033 17.369 57.6913 17.175C58.0914 16.9688 58.4916 16.6657 58.8796 16.2655V14.386H58.8675ZM52.7197 9.54788C54.0051 8.37169 55.545 7.78965 57.3518 7.78965C58.0066 7.78965 58.5886 7.89879 59.0979 8.11705C59.6072 8.32319 60.0437 8.62633 60.4074 9.00223C60.7591 9.37812 61.0259 9.82677 61.2077 10.3603C61.4018 10.8938 61.4866 11.4637 61.4866 12.0943V19.1393H60.2741C60.0194 19.1393 59.8254 19.1029 59.692 19.0302C59.5586 18.9453 59.4495 18.7998 59.3646 18.5573L59.1221 17.757C58.8432 18.0116 58.5643 18.2299 58.2976 18.436C58.0308 18.63 57.7519 18.7877 57.4609 18.9089C57.1699 19.0302 56.8546 19.1393 56.5272 19.1999C56.1998 19.2727 55.8361 19.3091 55.4359 19.3091C54.963 19.3091 54.5265 19.2484 54.1263 19.1272C53.7262 18.9938 53.3867 18.7998 53.0956 18.5573C52.8046 18.3148 52.5864 17.9874 52.4166 17.6115C52.2468 17.2356 52.1741 16.7991 52.1741 16.3019C52.1741 16.023 52.2226 15.7441 52.3196 15.4652C52.4166 15.1863 52.5621 14.9196 52.7804 14.6649C52.9986 14.4103 53.2775 14.1678 53.6171 13.9495C53.9566 13.7313 54.3688 13.5251 54.866 13.3675C55.3632 13.1977 55.9452 13.0643 56.6 12.9673C57.2548 12.8582 58.0066 12.7976 58.8554 12.7733V12.1185C58.8554 11.3667 58.6977 10.8211 58.3825 10.4694C58.0672 10.1057 57.6064 9.92378 57.0001 9.92378C56.5636 9.92378 56.1998 9.97228 55.9088 10.0814C55.6299 10.1784 55.3753 10.2997 55.157 10.4331L54.5629 10.7726C54.3931 10.8696 54.1991 10.9302 53.9808 10.9302C53.7868 10.9302 53.6292 10.8817 53.5079 10.7847C53.3745 10.6877 53.2775 10.5664 53.1927 10.4331L52.7197 9.57213V9.54788ZM71.9996 10.3482C71.9147 10.4452 71.842 10.5301 71.7571 10.5907C71.6844 10.6513 71.5752 10.6756 71.4297 10.6756C71.2842 10.6756 71.1629 10.6392 71.0296 10.5543L70.5567 10.2754C70.3748 10.1663 70.1565 10.0693 69.9019 9.99653C69.6594 9.91165 69.3441 9.86315 68.9803 9.86315C68.5074 9.86315 68.0951 9.94803 67.7435 10.1299C67.3919 10.2997 67.0887 10.5422 66.8583 10.8575C66.6279 11.1727 66.4582 11.5608 66.3369 12.0215C66.2157 12.4702 66.1672 12.9795 66.1672 13.5494C66.1672 14.1193 66.2278 14.6771 66.349 15.1378C66.4824 15.5986 66.6643 15.9866 66.9068 16.314C67.1493 16.6293 67.4404 16.8597 67.7799 17.0294C68.1194 17.1871 68.5074 17.272 68.9318 17.272C69.3562 17.272 69.7079 17.2235 69.9625 17.1143C70.2293 17.0052 70.4597 16.8839 70.6415 16.7627C70.7992 16.6535 70.9568 16.5323 71.1144 16.411C71.2478 16.3019 71.4055 16.2534 71.5752 16.2534C71.7935 16.2534 71.9511 16.3383 72.0602 16.508L72.8363 17.4902C72.5453 17.8419 72.2179 18.1329 71.8662 18.3754C71.5146 18.6058 71.1508 18.7998 70.7749 18.9453C70.399 19.0787 70.011 19.1878 69.623 19.2363C69.235 19.297 68.8348 19.3212 68.4468 19.3212C67.7556 19.3212 67.113 19.1999 66.5067 18.9453C65.9004 18.6785 65.3669 18.3026 64.9061 17.8176C64.4453 17.3326 64.0815 16.7263 63.8148 16.0109C63.548 15.2955 63.4267 14.483 63.4267 13.5615C63.4267 12.7369 63.548 11.9851 63.7784 11.294C64.0209 10.5907 64.3604 9.98441 64.8212 9.47513C65.282 8.96585 65.8398 8.55357 66.5188 8.27468C67.1978 7.99579 67.9618 7.83816 68.8469 7.83816C69.7321 7.83816 70.4112 7.97154 71.0296 8.23831C71.6601 8.50507 72.23 8.89309 72.7272 9.39025L72.0239 10.3724L71.9996 10.3482ZM77.1773 9.18411C77.6138 8.78396 78.0867 8.44444 78.6081 8.1898C79.1295 7.93516 79.7358 7.81391 80.4391 7.81391C81.0454 7.81391 81.5911 7.92304 82.064 8.12917C82.5369 8.33531 82.9249 8.62633 83.2402 9.00223C83.5554 9.366 83.7979 9.81465 83.9556 10.3361C84.1253 10.8453 84.2102 11.4152 84.2102 12.0458V19.1393H81.5304V12.0458C81.5304 11.3667 81.3728 10.8453 81.0575 10.4694C80.7423 10.0935 80.2694 9.89953 79.6388 9.89953C79.178 9.89953 78.7415 10.0087 78.3292 10.2148C77.917 10.4209 77.5411 10.712 77.1773 11.0757V19.1393H74.4975V3H77.1773V9.19624V9.18411ZM86.7566 19.1393V7.99579H88.3936C88.7452 7.99579 88.9635 8.15343 89.0726 8.48082L89.2424 9.30537C89.4364 9.09923 89.6304 8.89309 89.8487 8.71121C90.0669 8.52932 90.2973 8.37169 90.5277 8.23831C90.7702 8.10492 91.037 8.00792 91.3159 7.93516C91.5948 7.85028 91.91 7.81391 92.2374 7.81391C92.9407 7.81391 93.5106 8.00792 93.9593 8.38381C94.42 8.75971 94.7596 9.26899 94.9778 9.89953C95.1476 9.53576 95.3659 9.22049 95.6326 8.95372C95.8994 8.68696 96.1783 8.46869 96.4936 8.29893C96.8088 8.12917 97.1362 8.00792 97.4879 7.93516C97.8395 7.85028 98.1911 7.81391 98.5549 7.81391C99.1733 7.81391 99.719 7.91091 100.192 8.0928C100.665 8.27468 101.077 8.55357 101.392 8.91735C101.708 9.28112 101.962 9.71764 102.132 10.239C102.302 10.7605 102.399 11.3546 102.399 12.0337V19.1272H99.719V12.0337C99.719 11.3182 99.5613 10.7968 99.2461 10.4331C98.9308 10.0693 98.4822 9.8874 97.8759 9.8874C97.597 9.8874 97.3423 9.93591 97.0998 10.0329C96.8694 10.1299 96.6512 10.2633 96.4814 10.4452C96.3117 10.6149 96.1662 10.8453 96.0692 11.1121C95.9721 11.3789 95.9115 11.682 95.9115 12.0337V19.1272H93.2196V12.0337C93.2196 11.2819 93.062 10.7483 92.7588 10.4088C92.4678 10.0693 92.0192 9.89953 91.4493 9.89953C91.0612 9.89953 90.6975 9.99653 90.3579 10.1905C90.0306 10.3846 89.7153 10.6392 89.4243 10.9787V19.1393H86.7445H86.7566ZM107.746 7.99579V19.1393H105.054V7.99579H107.746ZM108.11 4.7461C108.11 4.97649 108.061 5.19475 107.964 5.40089C107.867 5.60703 107.746 5.77679 107.589 5.93442C107.431 6.09206 107.261 6.21331 107.043 6.29819C106.837 6.38307 106.606 6.43158 106.364 6.43158C106.121 6.43158 105.915 6.38307 105.697 6.29819C105.491 6.20119 105.321 6.07993 105.163 5.93442C105.006 5.77679 104.885 5.5949 104.8 5.40089C104.715 5.19475 104.666 4.97649 104.666 4.7461C104.666 4.51571 104.715 4.28533 104.8 4.06706C104.897 3.86093 105.018 3.67904 105.163 3.52141C105.321 3.36377 105.503 3.24251 105.697 3.15763C105.903 3.06063 106.133 3.01213 106.364 3.01213C106.606 3.01213 106.825 3.06063 107.043 3.15763C107.249 3.24251 107.431 3.36377 107.589 3.52141C107.746 3.67904 107.88 3.8488 107.964 4.06706C108.049 4.28533 108.11 4.50359 108.11 4.7461ZM112.985 9.366C113.203 9.13561 113.445 8.92947 113.688 8.74759C113.942 8.55357 114.209 8.38381 114.476 8.26256C114.755 8.12917 115.058 8.02004 115.373 7.94729C115.689 7.86241 116.04 7.82603 116.416 7.82603C117.022 7.82603 117.568 7.93516 118.029 8.1413C118.502 8.34744 118.89 8.63845 119.205 9.01435C119.52 9.37812 119.763 9.82677 119.92 10.3482C120.09 10.8575 120.175 11.4274 120.175 12.0579V19.1514H117.495V12.0579C117.495 11.3789 117.338 10.8575 117.022 10.4816C116.707 10.1057 116.234 9.91165 115.604 9.91165C115.143 9.91165 114.706 10.0208 114.294 10.2269C113.882 10.4331 113.506 10.7241 113.142 11.0878V19.1514H110.462V7.99579H112.099C112.451 7.99579 112.681 8.15343 112.791 8.48082L112.972 9.366H112.985ZM126.311 19.3212C125.341 19.3212 124.589 19.0544 124.067 18.5088C123.558 17.9631 123.291 17.1992 123.291 16.2413V10.0208H122.152C122.006 10.0208 121.885 9.97228 121.788 9.87528C121.691 9.77827 121.63 9.64489 121.63 9.45088V8.38381L123.425 8.0928L123.995 5.04924C124.031 4.90374 124.104 4.7946 124.201 4.70972C124.298 4.62484 124.431 4.58847 124.589 4.58847H125.983V8.0928H128.954V10.0087H125.983V16.0473C125.983 16.3989 126.068 16.6657 126.238 16.8597C126.408 17.0537 126.65 17.1507 126.941 17.1507C127.111 17.1507 127.244 17.1386 127.353 17.1022C127.475 17.0537 127.572 17.0173 127.644 16.9688C127.729 16.9203 127.802 16.8839 127.875 16.8476C127.936 16.7991 128.008 16.7869 128.069 16.7869C128.154 16.7869 128.214 16.8112 128.263 16.8476C128.311 16.8839 128.372 16.9446 128.421 17.0173L129.221 18.3269C128.833 18.6543 128.384 18.8968 127.875 19.0666C127.366 19.2363 126.844 19.3212 126.299 19.3212H126.311Z" fill="#0A0A0A" />
          </svg>

          {/* seal — GENERAL decorative mark, identical on every certificate (static).
              TODO(brand): can be replaced with an official seal image asset. */}
          <svg viewBox="0 0 100 100" style={{ width: "6.4cqw", height: "6.4cqw", marginTop: "1cqw" }}>
            <g fill="var(--cert-gold)"><circle cx="50" cy="46" r="30" /><path d="M50 8 L56 20 L44 20 Z" /></g>
            <circle cx="50" cy="46" r="24" fill="none" stroke="var(--cert-gold-soft)" strokeWidth="1.5" />
            <circle cx="50" cy="42" r="9" fill="none" stroke="var(--white)" strokeWidth="3" />
            <path d="M45 50 L42 62 L50 57 L58 62 L55 50" fill="var(--white)" />
            <path d="M40 70 L40 90 L50 82 L60 90 L60 70 Z" fill="var(--cert-gold-soft)" />
          </svg>

          <span style={{ marginTop: "1.4cqw", fontFamily: "var(--font-family-inter)", fontSize: "0.85cqw", fontWeight: 700, letterSpacing: "0.28cqw", textTransform: "uppercase", color: "var(--cert-gold)" }}>
            Verified Credential
          </span>
          <span style={{ marginTop: "1cqw", fontWeight: 700, fontSize: "2.7cqw", letterSpacing: "0.5cqw", textTransform: "uppercase", color: "var(--cert-ink)", lineHeight: 1 }}>
            {headline}
          </span>
          <div style={{ width: "5cqw", height: "0.22cqw", margin: "1.4cqw 0 1.8cqw", background: FOIL }} />

          <span style={{ fontStyle: "italic", fontSize: "1.5cqw", color: "var(--cert-ink-muted)" }}>This is to certify that</span>
          {/* recipientSlot lets the generating sequence swap in a placeholder /
              animate the name in; everywhere else it renders the real name. */}
          <span style={{ margin: "0.6cqw 0 0.5cqw", fontWeight: 700, fontSize: "4.6cqw", lineHeight: 1.05, color: "var(--cert-ink)" }}>{recipientSlot ?? c.recipientName}</span>
          <div style={{ width: "52%", height: "0.1cqw", background: "linear-gradient(90deg,transparent,var(--cert-gold),transparent)", marginBottom: "1.8cqw" }} />

          <span style={{ fontStyle: "italic", fontSize: "1.5cqw", color: "var(--cert-ink-muted)" }}>
            {c.category === "olympiad" ? "is recognised for outstanding performance in" : "has successfully completed"}
          </span>
          <span style={{ marginTop: "0.5cqw", fontWeight: 600, fontSize: "2.5cqw", lineHeight: 1.15, color: "var(--primary-700)" }}>{c.courseTitle}</span>
          <span style={{ marginTop: "0.5cqw", fontFamily: "var(--font-family-inter)", fontWeight: 600, fontSize: "1.05cqw", letterSpacing: "0.06cqw", textTransform: "uppercase", color: "var(--cert-gold)" }}>{c.organization}</span>
          {c.detail && (
            <span style={{ marginTop: "1.4cqw", fontFamily: "var(--font-family-inter)", fontSize: "1cqw", color: "var(--cert-ink-muted)", maxWidth: "52cqw", lineHeight: 1.55 }}>{c.detail}</span>
          )}

          {/* footer */}
          <div className="flex w-full items-end justify-between" style={{ marginTop: "auto" }}>
            {/* issued + credential id */}
            <div className="flex flex-col items-start" style={{ flex: 1, gap: "0.3cqw", minWidth: 0 }}>
              <span style={labelStyle}>Issued</span>
              <span style={valueStyle}>{formatIssuedDate(c.issuedOn)}</span>
              <span style={{ ...labelStyle, marginTop: "1.2cqw" }}>Credential ID</span>
              <span style={valueStyle}>{c.credentialId}</span>
            </div>

            {/* verify QR */}
            <div className="flex flex-col items-center" style={{ flex: 1, gap: "0.6cqw" }}>
              <svg viewBox="0 0 64 64" style={{ width: "5.6cqw", height: "5.6cqw", borderRadius: "0.4cqw", border: "0.1cqw solid color-mix(in srgb, var(--cert-gold) 40%, transparent)", background: "var(--white)", padding: "0.3cqw" }}>
                <g fill="var(--cert-ink)">
                  <rect x="6" y="6" width="16" height="16" /><rect x="9" y="9" width="10" height="10" fill="var(--white)" /><rect x="12" y="12" width="4" height="4" />
                  <rect x="42" y="6" width="16" height="16" /><rect x="45" y="9" width="10" height="10" fill="var(--white)" /><rect x="48" y="12" width="4" height="4" />
                  <rect x="6" y="42" width="16" height="16" /><rect x="9" y="45" width="10" height="10" fill="var(--white)" /><rect x="12" y="48" width="4" height="4" />
                  <rect x="28" y="6" width="4" height="4" /><rect x="34" y="12" width="4" height="4" /><rect x="42" y="28" width="4" height="4" /><rect x="50" y="28" width="4" height="4" /><rect x="34" y="34" width="4" height="4" /><rect x="28" y="42" width="4" height="4" /><rect x="42" y="48" width="4" height="4" /><rect x="50" y="50" width="4" height="4" />
                </g>
              </svg>
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "0.72cqw", color: "var(--cert-ink-muted)", lineHeight: 1.4, textAlign: "center" }}>
                Scan to verify<br /><span style={{ color: "var(--primary-700)", fontWeight: 600 }}>{verifyUrl}</span>
              </span>
            </div>

            {/* authorised signatory */}
            <div className="flex flex-col items-end" style={{ flex: 1, minWidth: 0 }}>
              {SIGNATURE_SRC
                ? <img src={SIGNATURE_SRC} alt="" style={{ height: "4.4cqw", objectFit: "contain" }} />
                : <span style={{ fontFamily: CERT_SCRIPT, fontSize: "3.4cqw", color: "var(--cert-ink)", lineHeight: 1 }}>{SIGNATORY.name.replace(/^Dr\.\s*/, "")}</span>}
              <div style={{ width: "18cqw", height: "0.1cqw", background: "var(--cert-ink-muted)", margin: "0.8cqw 0 0.6cqw" }} />
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "1cqw", fontWeight: 700, color: "var(--cert-ink)" }}>{SIGNATORY.name}</span>
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "0.85cqw", color: "var(--cert-ink-muted)" }}>{SIGNATORY.title}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── BRAND MARKS (third-party assets — brand hex is the one allowed
   exception to the no-hardcoded-color rule, same as existing logo marks) ─────────── */

function WhatsAppMark() {
  return (
    <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#25D366" }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.13c-.24.68-1.42 1.31-1.95 1.36-.5.05-1.13.07-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36l.55.01c.18.01.41-.07.64.49.24.57.81 1.99.88 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.42.29.14.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.64-.14.26.09 1.66.78 1.95.93.29.14.48.21.55.33.07.12.07.69-.17 1.37z" /></svg>
    </div>
  );
}

function InstagramMark() {
  return (
    <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(45deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)" }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none" />
      </svg>
    </div>
  );
}

function TelegramMark() {
  return (
    <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#229ED9" }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden><path d="M21.94 4.6l-3.32 15.66c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.16L18.4 6.1c.41-.36-.09-.56-.63-.2L7.18 12.7l-4.99-1.56c-1.08-.34-1.1-1.08.23-1.6l19.5-7.52c.9-.34 1.69.21 1.4 1.58z" /></svg>
    </div>
  );
}

function NeutralTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "var(--card-bg-secondary)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

/* ─────────── CERT IMAGE CAPTURE (light print PNG via html-to-image) ─────────── */
// Shared by the Share sheet (Save Image / Instagram) and the viewer's Download.
// TODO(api): swap for GET /api/certificates/:id/pdf once a server-side PDF exists.
function useCertCapture(certificate: Certificate) {
  const ref = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${certificate.courseTitle.replace(/\s+/g, "-").toLowerCase()}-certificate.png`;
      link.href = dataUrl;
      link.click();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch { /* capture failed — surface nothing rather than a false success */ }
  };
  const Offscreen = (
    <div aria-hidden style={{ position: "fixed", left: -9999, top: 0, width: 720, pointerEvents: "none" }}>
      <div ref={ref} style={{ width: 720, padding: 32, backgroundColor: "var(--cert-paper)" }}>
        <CertificateArtifact certificate={certificate} variant="light" />
      </div>
    </div>
  );
  return { save, saved, Offscreen };
}

/* ─────────── SHARE SHEET (matches the product's share bottom-sheet) ─────────── */

export function ShareSheet({ certificate, onClose }: { certificate: Certificate; onClose: () => void }) {
  const { save: saveImage, saved, Offscreen } = useCertCapture(certificate);
  const verifyUrl = `https://teachmint.com/verify/${certificate.credentialId}`;
  const shareText = `I earned the "${certificate.courseTitle}" certificate from ${certificate.organization} on Teachmint!`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleTarget = async (key: string) => {
    if (key === "save") return saveImage();
    if (key === "more") {
      if (typeof navigator !== "undefined" && (navigator as Navigator).share) {
        try { await (navigator as Navigator).share({ title: certificate.courseTitle, text: shareText, url: verifyUrl }); } catch { /* dismissed */ }
      }
      return;
    }
    if (key === "whatsapp") { window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${verifyUrl}`)}`, "_blank"); return; }
    if (key === "telegram") { window.open(`https://t.me/share/url?url=${encodeURIComponent(verifyUrl)}&text=${encodeURIComponent(shareText)}`, "_blank"); return; }
    if (key === "instagram") { return saveImage(); } // Instagram has no web share intent — save the image to post
  };

  const targets = [
    { key: "whatsapp", label: "WhatsApp", mark: <WhatsAppMark /> },
    { key: "instagram", label: "Instagram", mark: <InstagramMark /> },
    { key: "telegram", label: "Telegram", mark: <TelegramMark /> },
    { key: "save", label: saved ? "Saved" : "Save Image", mark: <NeutralTile>{saved ? <Check size={26} style={{ color: "var(--success-500)" }} /> : <Download size={26} style={{ color: "var(--foreground)" }} />}</NeutralTile> },
    { key: "more", label: "More", mark: <NeutralTile><MoreHorizontal size={26} style={{ color: "var(--foreground)" }} /></NeutralTile> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex flex-col justify-end"
        role="dialog" aria-modal="true" aria-labelledby="share-sheet-title"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        style={{ backgroundColor: "var(--overlay-strong)" }}
        onClick={onClose}
      >
        {/* Offscreen light render captured for sharing/saving */}
        {Offscreen}

        <motion.div
          className="w-full"
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          style={{ backgroundColor: "var(--card)", borderTopLeftRadius: 20, borderTopRightRadius: 20, fontFamily: "var(--font-family-inter)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center" style={{ paddingTop: 12 }}>
            <div style={{ width: 36, height: 4, borderRadius: "var(--radius-full)", backgroundColor: "color-mix(in srgb, var(--foreground) 18%, transparent)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between" style={{ padding: "8px 16px 12px" }}>
            <span id="share-sheet-title" style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>Share</span>
            <button onClick={onClose} aria-label="Close" className="flex items-center justify-center"
              style={{ width: 44, height: 44, marginRight: -12, background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} style={{ color: "var(--muted-foreground)" }} />
            </button>
          </div>

          <div style={{ height: "0.5px", backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)" }} />

          {/* Targets grid */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", rowGap: 20, padding: "20px 24px 8px", justifyItems: "center" }}>
            {targets.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTarget(t.key)}
                aria-label={t.key === "save" ? "Save certificate image" : `Share via ${t.label}`}
                className="flex flex-col items-center"
                style={{ gap: 8, background: "none", border: "none", cursor: "pointer" }}
              >
                {t.mark}
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Home-bar safe area */}
          <div style={{ height: 24 }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────── CONFETTI BURST (one-shot celebration) ─────────── */

const CONFETTI_COLORS = ["var(--warning-500)", "var(--primary-500)", "var(--success-500)", "var(--purple-500)", "var(--orange-400)"];

export function ConfettiBurst({ count = 28 }: { count?: number }) {
  const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return null;
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const dist = 120 + (i % 5) * 36;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist + 80, // bias downward
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i % 6) * 0.02,
      rotate: (i % 2 ? 1 : -1) * (180 + (i % 4) * 90),
      w: i % 3 === 0 ? 4 : 8,
      h: i % 3 === 0 ? 12 : 8,
    };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden flex items-start justify-center">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.6 }}
          transition={{ duration: 1, delay: p.delay, ease: "easeOut" }}
          style={{ position: "absolute", top: 100, width: p.w, height: p.h, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

/* ─────────── CERTIFICATE GENERATING (pre-reveal "developing" sequence) ─────────── */
// Shown briefly before the Congratulations reveal: the credential is "minted" —
// the artifact develops from blurred to crisp while build-steps tick off. Calls
// onDone once the sequence completes (or immediately-ish under reduced motion).

const GEN_STEP_MS = 640;
const GEN_TAIL_MS = 520; // small beat after the last check before the reveal

export function CertificateGenerating({ certificate, onDone }: { certificate: Certificate; onDone: () => void }) {
  const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // Recipient name is called out explicitly so it's already on the (now-legible)
  // certificate before the Congratulations reveal — no sudden name "pop".
  const steps = [
    "Verifying course completion",
    "Generating credential ID",
    "Adding your details",
    "Finalising your certificate",
  ];
  const [step, setStep] = useState(0); // index of the step currently running
  const totalMs = GEN_STEP_MS * steps.length;

  useEffect(() => {
    if (prefersReduced) {
      const t = window.setTimeout(onDone, 480);
      return () => window.clearTimeout(t);
    }
    const timers = steps.map((_, i) =>
      i === 0 ? 0 : window.setTimeout(() => setStep(i), GEN_STEP_MS * i),
    ).filter(Boolean) as number[];
    timers.push(window.setTimeout(onDone, totalMs + GEN_TAIL_MS));
    return () => timers.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The name slot stays a generic placeholder until the "Personalising" step
  // (index 2), then the real name animates in — so the same sequence works for
  // every student and the name is never a sudden jump at the reveal.
  const nameRevealed = prefersReduced || step >= 2;
  const recipientSlot = nameRevealed ? (
    <motion.span
      initial={{ opacity: 0, y: "0.5cqw", filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ display: "inline-block" }}
    >
      {certificate.recipientName}
    </motion.span>
  ) : (
    <motion.span
      aria-hidden
      animate={{ opacity: [0.35, 0.62, 0.35] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      style={{ display: "inline-block", verticalAlign: "middle", width: "34cqw", height: "3.4cqw", borderRadius: "1cqw", background: "color-mix(in srgb, var(--cert-ink-muted) 32%, transparent)" }}
    />
  );

  return (
    <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "0 20px" }}>
      <div className="w-full mx-auto my-auto flex flex-col items-center text-center" style={{ maxWidth: 360, gap: 24 }}>
        <motion.span
          initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
          style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--white)" }}
        >
          Creating your certificate
        </motion.span>

        {/* Developing artifact — blur clears + a gold scan line sweeps while it mints */}
        <div className="relative w-full" style={{ borderRadius: 12, overflow: "hidden" }}>
          <motion.div
            initial={{ filter: "blur(14px)", opacity: 0.4 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            transition={{ duration: (prefersReduced ? 0.3 : totalMs * 0.82) / 1000, ease: "easeInOut" }}
          >
            <CertificateArtifact certificate={certificate} recipientSlot={recipientSlot} />
          </motion.div>

          {!prefersReduced && (
            <motion.div
              aria-hidden className="pointer-events-none absolute inset-x-0"
              initial={{ top: "-12%", opacity: 0 }}
              animate={{ top: "108%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              style={{
                height: 56,
                background: "linear-gradient(180deg, transparent, color-mix(in srgb, var(--cert-gold) 55%, transparent), transparent)",
              }}
            />
          )}
        </div>

        {/* Build-step checklist */}
        <div className="w-full flex flex-col" style={{ gap: 12 }}>
          {steps.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <motion.div
                key={label}
                className="flex items-center"
                style={{ gap: 12, opacity: done || active ? 1 : 0.4 }}
                animate={{ opacity: done || active ? 1 : 0.4 }}
                transition={{ duration: 0.2 }}
              >
                <span className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24 }}>
                  {done ? (
                    <motion.span
                      className="flex items-center justify-center"
                      initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 18 }}
                      style={{ width: 24, height: 24, borderRadius: "var(--radius-full)", background: "color-mix(in srgb, var(--success-500) 22%, transparent)" }}
                    >
                      <Check size={14} strokeWidth={3} style={{ color: "var(--success-500)" }} />
                    </motion.span>
                  ) : active ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} className="flex">
                      <Loader2 size={20} style={{ color: "var(--white-alpha-90)" }} />
                    </motion.span>
                  ) : (
                    <span style={{ width: 16, height: 16, borderRadius: "var(--radius-full)", border: "1.5px solid var(--white-alpha-25)" }} />
                  )}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: done || active ? 600 : 500, color: done || active ? "var(--white)" : "var(--white-alpha-70)" }}>
                  {label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full" style={{ height: 4, borderRadius: "var(--radius-full)", background: "color-mix(in srgb, var(--white) 14%, transparent)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: "0%" }} animate={{ width: "100%" }}
            transition={{ duration: (totalMs + GEN_TAIL_MS) / 1000, ease: "easeInOut" }}
            style={{ height: "100%", background: FOIL }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────── FULL-SCREEN MODAL VIEWER (used by My Certificates list) ─────────── */

export function CertificateModal({ certificate, onClose }: { certificate: Certificate; onClose: () => void }) {
  const [showShare, setShowShare] = useState(false);
  const { save: download, saved, Offscreen } = useCertCapture(certificate);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { showShare ? setShowShare(false) : onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, showShare]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        role="dialog" aria-modal="true" aria-labelledby="cert-modal-title"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ backgroundColor: "var(--overlay-strong)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        {Offscreen}
        <div className="flex items-center justify-between shrink-0" style={{ height: 56, padding: "0 20px" }}>
          <span id="cert-modal-title" style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--white)" }}>
            Your Certificate
          </span>
          <button onClick={onClose} aria-label="Close" className="flex items-center justify-center"
            style={{ width: 44, height: 44, marginRight: -12, background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} style={{ color: "var(--white-alpha-70)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "0 20px 24px" }} onClick={(e) => e.stopPropagation()}>
          <div className="w-full mx-auto my-auto flex flex-col" style={{ maxWidth: 380, gap: 16, paddingTop: 8 }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }}>
              <CertificateArtifact certificate={certificate} />
            </motion.div>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center justify-center w-full"
              style={{
                height: 44, gap: 8, borderRadius: 12, cursor: "pointer",
                background: "var(--gradient-primary-btn)", border: "none", color: "var(--white)",
                fontSize: "var(--text-sm)", fontWeight: 600, fontFamily: "var(--font-family-inter)",
              }}
            >
              <Share2 size={18} />
              Share certificate
            </button>
            <button
              onClick={download}
              aria-live="polite"
              className="flex items-center justify-center w-full"
              style={{
                height: 44, gap: 8, borderRadius: 12, cursor: "pointer",
                backgroundColor: "transparent", border: "1px solid var(--white-alpha-25)",
                color: "var(--white)", fontSize: "var(--text-sm)", fontWeight: 600, fontFamily: "var(--font-family-inter)",
              }}
            >
              {saved ? <Check size={18} style={{ color: "var(--success-500)" }} /> : <Download size={18} />}
              {saved ? "Downloaded" : "Download"}
            </button>
          </div>
        </div>
      </motion.div>

      {showShare && <ShareSheet certificate={certificate} onClose={() => setShowShare(false)} />}
    </AnimatePresence>
  );
}
