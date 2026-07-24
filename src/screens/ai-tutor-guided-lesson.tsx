/**
 * AI Tutor prototype — Guided Lesson
 * The default, zero-effort video entry point — closest of the four to what exists today.
 * The difference: tapping "Ask" pauses in place, answers via the real BottomSheet component,
 * then resumes at the exact same second, instead of only being answerable during a scheduled slot.
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Sparkles, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { BottomSheet } from "../shared/bottom-sheet";
import { typo } from "../shared/premium-ui";

export function Component() {
  const navigate = useNavigate();
  const [interrupted, setInterrupted] = useState(false);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "#0d1117", overflow: "hidden" }}>
      <div className="flex items-center justify-between shrink-0" style={{ height: 44, padding: "12px 20px 0" }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: 14, fontWeight: 600, color: "#fff" }}>9:41</span>
      </div>

      <div className="flex items-center gap-3 shrink-0" style={{ padding: "6px 18px 0" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft style={{ width: 20, height: 20, color: "#fff" }} />
        </button>
        <div>
          <p style={{ fontFamily: "var(--font-family-inter)", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
            Real Numbers · Lesson 1
          </p>
          <p style={{ fontFamily: "var(--font-family-inter)", fontSize: 15, fontWeight: 600, color: "#fff", margin: "2px 0 0" }}>
            Fundamental Theorem of Arithmetic
          </p>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 35%, #24304a 0%, #0d1117 72%)" }}>
        <div className="absolute" style={{ top: 20, left: 18, right: 18, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px" }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 3 }}>On screen</span>
          <code style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>HCF × LCM = a × b</code>
        </div>

        <div className="relative" style={{ width: 140, height: 140 }}>
          <div className="absolute" style={{ inset: -8, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.18)" }} />
          <div className="flex items-center justify-center" style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(160deg, #6b8cff 0%, #4a5fd6 60%, #3547ad 100%)" }}>
            <div className="flex flex-col items-center" style={{ gap: 12 }}>
              <div className="flex" style={{ gap: 19 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.92)" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.92)" }} />
              </div>
              <span style={{ width: 29, height: 11, borderRadius: "0 0 18px 18px", background: "rgba(255,255,255,0.75)" }} />
            </div>
          </div>
        </div>

        <p className="absolute text-center" style={{ bottom: 84, left: 18, right: 18, fontSize: 13, color: "#fff", lineHeight: 1.5, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
          …and that&apos;s why the answer comes out to ninety-one.
        </p>

        <button
          onClick={() => setInterrupted(true)}
          className="absolute flex items-center gap-1.5"
          style={{ right: 16, bottom: 96, background: "var(--primary)", border: "none", borderRadius: 20, padding: "9px 15px 9px 12px", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}
        >
          <Sparkles style={{ width: 14, height: 14 }} /> Ask
        </button>
      </div>

      <div className="shrink-0" style={{ padding: "8px 18px 20px" }}>
        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.25)", marginBottom: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "64%", background: "var(--primary)" }} />
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontVariantNumeric: "tabular-nums" }}>12:04</span>
          <div className="flex items-center" style={{ gap: 18 }}>
            <SkipBack style={{ width: 18, height: 18, color: "#fff" }} />
            {interrupted
              ? <Play style={{ width: 20, height: 20, color: "#fff" }} onClick={() => setInterrupted(false)} />
              : <Pause style={{ width: 20, height: 20, color: "#fff" }} />}
            <SkipForward style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.1)", padding: "3px 7px", borderRadius: 10 }}>1×</span>
        </div>
      </div>

      <BottomSheet isOpen={interrupted} onClose={() => setInterrupted(false)} title="What did you want to ask?">
        <div style={{ background: "var(--primary)", color: "var(--white)", borderRadius: 13, borderTopRightRadius: 4, padding: "9px 12px", fontSize: 12.5, marginLeft: "auto", marginBottom: 10, maxWidth: "80%", width: "fit-content" }}>
          wait, why is that negative?
        </div>
        <div style={{ background: "var(--card)", color: "var(--foreground)", borderRadius: 13, borderTopLeftRadius: 4, padding: "9px 12px", fontSize: 12.5, lineHeight: 1.5, maxWidth: "90%", marginBottom: 16 }}>
          Good catch — b = (13 × 182) ÷ 26. 13 divides evenly into 26, so it simplifies to 182 ÷ 2 = 91, always positive here. Want me to re-show that step?
        </div>
        <button
          onClick={() => setInterrupted(false)}
          style={{ width: "100%", fontFamily: "var(--font-family-inter)", fontSize: 13, fontWeight: 700, padding: 11, borderRadius: 22, border: "none", background: "var(--primary)", color: "var(--white)", cursor: "pointer" }}
        >
          Resume lecture
        </button>
      </BottomSheet>
    </div>
  );
}
