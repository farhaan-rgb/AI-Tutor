/**
 * Marketplace Shared — utilities and components shared across marketplace screens
 */

import React from "react";
import {
  BookOpen, GraduationCap, ClipboardList, PenLine,
  Lightbulb, FlaskConical, LayoutGrid, Trophy, Music2, Monitor,
} from "lucide-react";
import { useTheme } from "../app/contexts/theme-context";

// ─── Category image fallback map ──────────────────────────────────────────────
export const CATEGORY_FALLBACK: Record<string, {
  bg: string;
  bgLight: string;
  color: string;
  colorLight: string;
  Icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
}> = {
  books:          { bg: "linear-gradient(135deg, #3a2a1a 0%, #231808 100%)", bgLight: "linear-gradient(135deg, #ffc880 0%, #ffaa50 100%)", color: "#ffa84a", colorLight: "#7a3800", Icon: BookOpen },
  courses:        { bg: "linear-gradient(135deg, #1a3a5c 0%, #0f2340 100%)", bgLight: "linear-gradient(135deg, #aaccff 0%, #80aaff 100%)", color: "#4a9eff", colorLight: "#003a99", Icon: GraduationCap },
  "mock-tests":   { bg: "linear-gradient(135deg, #3a1a4a 0%, #250f30 100%)", bgLight: "linear-gradient(135deg, #d4aaff 0%, #bc80ff 100%)", color: "#bf6fff", colorLight: "#5a009a", Icon: ClipboardList },
  stationery:     { bg: "linear-gradient(135deg, #1a2a3a 0%, #0f1a25 100%)", bgLight: "linear-gradient(135deg, #88ddff 0%, #55ccff 100%)", color: "#4ad4ff", colorLight: "#005a80", Icon: PenLine },
  "skill-courses":{ bg: "linear-gradient(135deg, #3a3a1a 0%, #252508 100%)", bgLight: "linear-gradient(135deg, #ffe880 0%, #ffd840 100%)", color: "#ffd94a", colorLight: "#7a6000", Icon: Lightbulb },
  "lab-kits":     { bg: "linear-gradient(135deg, #3a1a1a 0%, #250f0f 100%)", bgLight: "linear-gradient(135deg, #ffaaaa 0%, #ff8080 100%)", color: "#ff6b6b", colorLight: "#880000", Icon: FlaskConical },
  olympiad:       { bg: "linear-gradient(135deg, #3a2800 0%, #201500 100%)", bgLight: "linear-gradient(135deg, #ffcc70 0%, #ffaa30 100%)", color: "#ffb830", colorLight: "#704800", Icon: Trophy },
  apps:           { bg: "linear-gradient(135deg, #1a3a3a 0%, #0f2323 100%)", bgLight: "linear-gradient(135deg, #80ffee 0%, #44ffd8 100%)", color: "#4affdd", colorLight: "#006050", Icon: LayoutGrid },
  "live-class":   { bg: "linear-gradient(135deg, #1a3a5c 0%, #0f2340 100%)", bgLight: "linear-gradient(135deg, #aaccff 0%, #80aaff 100%)", color: "#4a9eff", colorLight: "#003a99", Icon: GraduationCap },
  music:          { bg: "linear-gradient(135deg, #3a1a2e 0%, #230f1c 100%)", bgLight: "linear-gradient(135deg, #ffaadd 0%, #ff77cc 100%)", color: "#f06ac0", colorLight: "#8b0060", Icon: Music2 },
  devices:        { bg: "linear-gradient(135deg, #3a2810 0%, #1f1505 100%)", bgLight: "linear-gradient(135deg, #ffd9a8 0%, #ffb866 100%)", color: "#ffa940", colorLight: "#7a3d00", Icon: Monitor },
};

export const DIGITAL_ABBR: Record<string, string> = {
  courses: "CRS",
  "mock-tests": "MCK",
  "skill-courses": "SKL",
  olympiad: "OLY",
  "live-class": "LIVE",
};

// ─── Product image fallback component ─────────────────────────────────────────
export function ProductImageFallback({ categoryId, iconSize = 32 }: { categoryId: string; iconSize?: number }) {
  const { theme } = useTheme();
  const fb = CATEGORY_FALLBACK[categoryId] ?? CATEGORY_FALLBACK["books"];
  const { Icon } = fb;
  const abbr = DIGITAL_ABBR[categoryId];
  const bg = theme === "dark" ? fb.bg : fb.bgLight;
  const color = theme === "dark" ? fb.color : fb.colorLight;

  if (abbr) {
    return (
      <div style={{ width: "100%", height: "100%", background: bg, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 10px)",
        }} />
        <div style={{ position: "absolute", top: -16, right: -16, width: 72, height: 72, borderRadius: 9999, backgroundColor: "rgba(0,0,0,0.06)" }} />
        <div style={{ position: "absolute", bottom: -12, left: -12, width: 48, height: 48, borderRadius: 9999, backgroundColor: "rgba(0,0,0,0.04)" }} />
        <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
          <span style={{ fontSize: Math.round(iconSize * 1.375), fontWeight: 800, color, opacity: 0.2, letterSpacing: -1, lineHeight: 1 }}>
            {abbr}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", background: bg, position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 10px)",
      }} />
      <div style={{ position: "absolute", top: -16, right: -16, width: 72, height: 72, borderRadius: 9999, backgroundColor: "rgba(0,0,0,0.06)" }} />
      <div style={{ position: "absolute", bottom: -12, left: -12, width: 48, height: 48, borderRadius: 9999, backgroundColor: "rgba(0,0,0,0.04)" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 58%, ${color}30 0%, transparent 65%)`,
      }} />
      <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
        <Icon size={iconSize} style={{ color, opacity: 0.9 }} />
      </div>
    </div>
  );
}

// ─── Shared utilities ──────────────────────────────────────────────────────────
export function discountPct(price: number, originalPrice: number): number {
  if (!originalPrice || originalPrice === 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function formatCount(n: number): string {
  return n > 999 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
