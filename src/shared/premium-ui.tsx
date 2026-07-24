/**
 * Shared premium UI primitives used across all app screens.
 * All styling uses CSS variables from /src/styles/theme.css.
 * Responsive: adapts to mobile and desktop viewports.
 */
import React from "react";
import { motion, type Variants } from "motion/react";
import { useIsMobile } from "../app/components/ui/use-mobile";

/* ─────────── INLINE NOISE SVG (3% opacity grain texture) ─────────── */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

/* ─────────── GLASS HEADER ─────────── */
export function GlassHeader({ children, transparent = false }: { children: React.ReactNode; transparent?: boolean }) {
  return (
    <div
      className="sticky top-0 z-20 shrink-0"
      style={{
        backdropFilter: transparent ? "none" : "var(--glass-blur)",
        WebkitBackdropFilter: transparent ? "none" : "var(--glass-blur)",
        backgroundColor: transparent ? "transparent" : "var(--glass-bg)",
        transition: "background-color 0.2s ease, backdrop-filter 0.2s ease",
      }}
    >
      {children}
      <div style={{ height: 1, background: transparent ? "transparent" : "var(--header-edge)", transition: "background 0.2s ease" }} />
    </div>
  );
}

/* ─────────── STATUS BAR (mobile only) ─────────── */
export function StatusBar() {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <div className="flex items-center justify-between shrink-0" style={{ height: 44, padding: "12px 20px 0" }}>
      <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>9:41</span>
      <div className="flex items-center" style={{ gap: 6 }}>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="0" y="9" width="3" height="3" rx="0.5" fill="var(--foreground)" /><rect x="4" y="6" width="3" height="6" rx="0.5" fill="var(--foreground)" /><rect x="8" y="3" width="3" height="9" rx="0.5" fill="var(--foreground)" /><rect x="12" y="0" width="3" height="12" rx="0.5" fill="var(--foreground)" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 10.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" fill="var(--foreground)" /><path d="M5.17 8.83a4 4 0 0 1 5.66 0" stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round" /><path d="M2.93 6.59a7 7 0 0 1 10.14 0" stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round" /><path d="M0.69 4.34a10 10 0 0 1 14.62 0" stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0.5" y="0.5" width="22" height="11" rx="2" stroke="var(--foreground)" strokeOpacity="0.5" /><rect x="2" y="2" width="16" height="8" rx="1" fill="var(--foreground)" /><path d="M24 4v4a2 2 0 0 0 0-4z" fill="var(--foreground)" fillOpacity="0.5" /></svg>
      </div>
    </div>
  );
}

/* ─────────── PAGE WRAPPER (noise bg, responsive container) ─────────── */
export function PageWrapper({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="flex flex-col w-full" style={{ paddingBottom: 24, backgroundImage: NOISE_SVG, backgroundRepeat: "repeat", backgroundSize: "256px", ...style }}>
      {children}
    </div>
  );
}

/* ─────────── RESPONSIVE CONTENT CONTAINER ─────────── */
/** Centers content with a max-width on desktop, full-width on mobile */
export function ContentContainer({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`w-full max-w-4xl mx-auto ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

/* ─────────── CARD (Level-1 surface with top highlight) ─────────── */
export function Card({
  children,
  style,
  className,
  featured,
  alert,
  orange,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  featured?: boolean;
  alert?: boolean;
  orange?: boolean;
  onClick?: () => void;
}) {
  let bg: string;
  let border: string;
  let highlight = "var(--card-highlight)";

  if (featured) {
    bg = "var(--gradient-featured)";
    border = "1px solid var(--primary-alpha-20)";
    highlight = "var(--primary-alpha-30)";
  } else if (alert) {
    bg = "var(--warning-950)";
    border = "1px solid var(--warning-alpha-25)";
    highlight = "var(--warning-alpha-15)";
  } else if (orange) {
    bg = "var(--gradient-orange-featured)";
    border = "1px solid var(--orange-900)";
    highlight = "var(--warning-alpha-12)";
  } else {
    bg = "var(--card)";
    border = "1px solid var(--border)";
  }

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`flex flex-col ${onClick ? "w-full text-left" : ""} ${className ?? ""}`}
      style={{
        position: "relative",
        overflow: "hidden",
        background: bg,
        border,
        borderRadius: "var(--radius-card)",
        padding: 20,
        ...style,
      }}
    >
      {/* Top edge highlight */}
      <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: `linear-gradient(90deg, transparent 0%, ${highlight} 50%, transparent 100%)` }} />
      {children}
    </Wrapper>
  );
}

/* ─────────── PRIMARY BUTTON (gradient + glow) ─────────── */
export function PrimaryButton({
  children,
  onClick,
  fullWidth,
  height = 44,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  height?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className={`flex items-center justify-center ${fullWidth ? "w-full" : ""}`}
      style={{
        height,
        borderRadius: "var(--radius-button)",
        background: "var(--gradient-primary-btn)",
        boxShadow: "var(--glow-primary)",
        fontFamily: "var(--font-family-inter)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-semibold)",
        color: "var(--white)",
        padding: "0 24px",
        border: "none",
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─────────── ANIMATED PROGRESS BAR ─────────── */
export function AnimatedProgress({
  percent,
  color,
  height = 6,
  trackColor = "var(--muted)",
  delay = 0,
}: {
  percent: number;
  color: string;
  height?: number;
  trackColor?: string;
  delay?: number;
}) {
  return (
    <div className="overflow-hidden" style={{ height, borderRadius: height / 2, backgroundColor: trackColor }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.6, ease: "easeOut", delay }}
        style={{ height: "100%", borderRadius: height / 2, backgroundColor: color }}
      />
    </div>
  );
}

/* ─────────── ANIMATED PROGRESS RING ─────────── */
export function ProgressRing({
  size,
  percent,
  strokeWidth = 5,
  color,
  children,
}: {
  size: number;
  percent: number;
  strokeWidth?: number;
  color: string;
  children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} />
        <defs>
          <linearGradient id={`ring-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-grad-${size})`}
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeLinecap="round"
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

/* ─────────── STAGGERED CONTAINER ─────────── */
const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function StaggerList({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className={className} style={style}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div variants={staggerChild} className={className} style={style}>
      {children}
    </motion.div>
  );
}

/* ─────────── ICON WITH TINTED BACKGROUND CIRCLE ─────────── */
export function TintedIcon({
  icon: Icon,
  color,
  size = 24,
  bgSize = 36,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { style?: React.CSSProperties }>;
  color: string;
  size?: number;
  bgSize?: number;
}) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: bgSize,
        height: bgSize,
        borderRadius: bgSize / 2,
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      <Icon style={{ width: size, height: size, color, strokeWidth: 1.5 }} />
    </div>
  );
}

/* ─────────── TYPOGRAPHY HELPERS (all use CSS vars) ─────────── */
const baseFont = { fontFamily: "var(--font-family-inter)" } as const;

export const typo = {
  pageTitleStyle: { ...baseFont, fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", lineHeight: "1.4" } as React.CSSProperties,
  sectionTitleStyle: { ...baseFont, fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", lineHeight: "1.5" } as React.CSSProperties,
  cardTitleStyle: { ...baseFont, fontSize: "var(--text-base)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", lineHeight: "1.4" } as React.CSSProperties,
  cardBodyStyle: { ...baseFont, fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)", lineHeight: "1.5" } as React.CSSProperties,
  ctaStyle: { ...baseFont, fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--primary-600)", lineHeight: "1.5" } as React.CSSProperties,
  metaStyle: { ...baseFont, fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)", lineHeight: "1.5" } as React.CSSProperties,
  badgeStyle: { ...baseFont, fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", lineHeight: "1.5" } as React.CSSProperties,
};