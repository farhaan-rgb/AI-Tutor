/**
 * AI Tutor prototype — Explain
 * A scoped, conversational walkthrough of one concept, extending floating-ai-tutor.tsx's
 * bubble/avatar language into a full screen rather than a floating panel.
 * Every topic's worked example is grounded in the real NCERT Ch.1 body text
 * (jemh101.pdf) — Theorem 1.1 + Examples 1/2/3/4/5/6/7, all four of section 1.2's
 * worked examples included (1 and 3 previously left out — see project memory) —
 * not generic filler, and each topic shows ITS OWN example rather than always
 * falling back to HCF/LCM.
 */
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Sparkles, Send, Mic, Check } from "lucide-react";
import { StatusBar, typo } from "../shared/premium-ui";

interface TopicContent {
  title: string;
  intro: string;
  // Optional supporting-theorem block, shown before the main example — used
  // only where the book itself proves a lemma first (Theorem 1.2) before
  // using it to prove the topic's actual theorem (Theorem 1.3).
  lemmaTransition?: string;
  lemmaLabel?: string;
  lemmaLines?: string[];
  exampleLabel: string;
  exampleLines: string[];
  followUpPrompt: string;
  followUpStudent: string;
  followUpLabel: string;
  followUpLines: string[];
  closing: string;
  // Which exercise this concept's section leads into — 1.2's concepts point
  // at Exercise 1.1, 1.3's concepts point at Exercise 1.2. Previously this
  // button was hardcoded to "Go to Exercise 1.1" for every topic, which was
  // wrong for the two 1.3 concepts.
  exerciseId: string;
  exerciseLabel: string;
}

const TOPIC_COPY: Record<string, TopicContent> = {
  "unique-factorisation": {
    title: "Unique prime factorisation",
    intro:
      "Every composite number breaks down into primes in exactly one way, ignoring order — that's the Fundamental Theorem of Arithmetic. You already do this with factor trees; this just says the tree always ends the same place no matter how you split it.",
    exampleLabel: "Factor tree · 32760",
    exampleLines: ["32760 = 2 × 2 × 2 × 3 × 3 × 5 × 7 × 13", "<strong>= 2³ × 3² × 5 × 7 × 13</strong>"],
    followUpPrompt: "Here's what that uniqueness actually proves — can 4ⁿ ever end in the digit 0, for any n?",
    followUpStudent: "never thought about it that way — how would you even check that for every n?",
    followUpLabel: "Example 1 · Does 4ⁿ ever end in 0?",
    followUpLines: ["4ⁿ = (2²)ⁿ = 2²ⁿ — its only prime factor is 2", "Ending in 0 needs a factor of 5 in there somewhere", "<strong>No n makes 4ⁿ end in 0</strong>"],
    closing: "That's uniqueness doing real work — if 5 was never in the factorisation to begin with, it's never going to appear, no matter how large n gets.",
    exerciseId: "ex-1-1",
    exerciseLabel: "Exercise 1.1",
  },
  "hcf-lcm-two": {
    title: "HCF & LCM — two numbers",
    intro:
      "Once a number's prime factorisation is fixed, HCF and LCM become mechanical: HCF takes the smallest shared power of each common prime; LCM takes the largest power of every prime that shows up anywhere.",
    exampleLabel: "Worked example · 6, 20",
    exampleLines: ["6 = 2¹ × 3¹", "20 = 2² × 5¹", "<strong>HCF = 2¹ = 2</strong>", "<strong>LCM = 2² × 3¹ × 5¹ = 60</strong>"],
    followUpPrompt: "Want to try it with bigger numbers — HCF of 96 and 404?",
    followUpStudent: "sure — 96 and 404",
    followUpLabel: "Example 3 · 96, 404",
    followUpLines: ["96 = 2⁵ × 3¹", "404 = 2² × 101¹", "<strong>HCF = 2² = 4</strong>", "LCM = (96 × 404) ÷ HCF = <strong>9696</strong>"],
    closing: "Same method regardless of size — and once you have the HCF, LCM = product ÷ HCF saves you factorising twice (only works for exactly two numbers, though).",
    exerciseId: "ex-1-1",
    exerciseLabel: "Exercise 1.1",
  },
  "hcf-lcm-three": {
    title: "HCF & LCM — three numbers",
    intro:
      "For two numbers, HCF × LCM gives you the product — but that shortcut doesn't hold with a third number. Instead: take the smallest power of every prime common to all three, and the largest power of every prime that shows up anywhere.",
    exampleLabel: "Worked example · 6, 72, 120",
    exampleLines: ["6 = 2¹ × 3¹", "72 = 2³ × 3²", "120 = 2³ × 3¹ × 5¹", "<strong>HCF = 2¹ × 3¹ = 6</strong>", "<strong>LCM = 2³ × 3² × 5¹ = 360</strong>"],
    followUpPrompt: "Want to try it with the numbers from Exercise 1.1?",
    followUpStudent: "yes — 12, 15, 21",
    followUpLabel: "12, 15, 21",
    followUpLines: ["12 = 2² × 3¹", "15 = 3¹ × 5¹", "21 = 3¹ × 7¹", "Only <strong>3¹</strong> is common → <strong>HCF = 3</strong>", "Highest powers overall → <strong>LCM = 420</strong>"],
    closing: "That's exactly it. Ready to mark this one down, or want another set of numbers first?",
    exerciseId: "ex-1-1",
    exerciseLabel: "Exercise 1.1",
  },
  "root-p-irrational": {
    title: "Proving √p is irrational",
    intro:
      "Before we can prove √2 is irrational (Theorem 1.3), we need one supporting result — Theorem 1.2: if a prime p divides a², it also divides a. Let's see why that's true first.",
    lemmaLabel: "Theorem 1.2 · If p divides a², then p divides a",
    lemmaLines: [
      "Write a's prime factorisation: a = p₁p₂…pₙ",
      "Then a² = p₁²p₂²…pₙ² — the same primes, just squared",
      "p divides a² → by uniqueness (Theorem 1.1), p must be one of p₁,…,pₙ",
      "<strong>So p divides a</strong>",
    ],
    lemmaTransition: "Now we can use that to prove √2 is irrational.",
    exampleLabel: "Theorem 1.3 · Proof that √2 is irrational",
    exampleLines: [
      "Assume √2 = a/b, with a, b coprime",
      "2b² = a² → 2 divides a² → 2 divides a (Theorem 1.2, above)",
      "So a = 2c → 2b² = 4c² → b² = 2c²",
      "→ 2 divides b too — but a, b were coprime. <strong>Contradiction.</strong>",
    ],
    followUpPrompt: "Example 5 runs the exact same argument for a different prime — want to see it for √3?",
    followUpStudent: "yes — try √3",
    followUpLabel: "Example 5 · Proof that √3 is irrational",
    followUpLines: ["Assume √3 = a/b, coprime", "3b² = a² → 3 divides a² → 3 divides a (Theorem 1.2 again)", "So a = 3c → 3b² = 9c² → b² = 3c² → 3 divides b too", "<strong>Contradiction</strong> — √3 is irrational"],
    closing: "Every prime follows the same pattern. Exercise 1.2 asks you to prove √5 is irrational next — same three steps, your turn to try it.",
    exerciseId: "ex-1-2",
    exerciseLabel: "Exercise 1.2",
  },
  "composite-proofs": {
    title: "Proving expressions like 5−√3 are irrational",
    intro:
      "Proving √p is irrational is only half the picture. When the question asks about 5−√3 or 3√2, you assume the whole expression is rational, isolate the irrational part algebraically, then show that leads to √p being rational — a contradiction.",
    exampleLabel: "Worked example · 5 − √3",
    exampleLines: ["Assume 5 − √3 = a/b (rational)", "Rearranging: √3 = 5 − a/b", "Right side is rational (a, b integers) → √3 rational", "<strong>Contradicts</strong> √3 being irrational"],
    followUpPrompt: "Same trick works for products, not just sums — want to see 3√2?",
    followUpStudent: "yes — 3√2",
    followUpLabel: "Worked example · 3√2",
    followUpLines: ["Assume 3√2 = a/b (rational)", "Rearranging: √2 = a/(3b)", "Right side is rational → √2 rational", "<strong>Contradicts</strong> √2 being irrational"],
    closing: "Isolate the irrational term, show the other side is rational, contradiction. Same three steps every time.",
    exerciseId: "ex-1-2",
    exerciseLabel: "Exercise 1.2",
  },
};

function Bubble({ from, children }: { from: "tutor" | "student"; children: React.ReactNode }) {
  const isTutor = from === "tutor";
  return (
    <div className="flex items-start" style={{ gap: 8, alignSelf: isTutor ? "flex-start" : "flex-end", flexDirection: isTutor ? "row" : "row-reverse", maxWidth: "88%" }}>
      {isTutor && (
        <div className="flex items-center justify-center shrink-0" style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)" }}>
          <Sparkles style={{ width: 13, height: 13, color: "var(--white)" }} />
        </div>
      )}
      <div
        style={{
          borderRadius: 14, padding: "10px 13px", fontSize: "var(--text-sm)", lineHeight: 1.5, fontFamily: "var(--font-family-inter)",
          background: isTutor ? "var(--card)" : "var(--primary)",
          color: isTutor ? "var(--foreground)" : "var(--white)",
          borderTopLeftRadius: isTutor ? 4 : 14,
          borderTopRightRadius: isTutor ? 14 : 4,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function WorkedExample({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div style={{ alignSelf: "flex-start", maxWidth: "94%", marginLeft: 34, background: "var(--success-d2)", borderLeft: "3px solid var(--success)", borderRadius: "0 10px 10px 0", padding: "11px 14px" }}>
      <span style={{ ...typo.badgeStyle, textTransform: "uppercase", color: "var(--success)", opacity: 0.85, display: "block", marginBottom: 6 }}>{label}</span>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: "var(--text-xs)", color: "var(--foreground)", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: l }} />
      ))}
    </div>
  );
}

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const topicKey = params.get("topic") ?? "hcf-lcm-three";
  const topic = TOPIC_COPY[topicKey] ?? TOPIC_COPY["hcf-lcm-three"];
  // Demo-only completion flag (not a real feature) — lets whoever's driving the
  // walkthrough simulate "this topic has been explained", so Chapter Home can
  // show it as completed. Persisted so it survives navigating back.
  const [understood, setUnderstood] = useState(() => localStorage.getItem(`ai_tutor_demo_explain_${topicKey}`) === "1");
  const [input, setInput] = useState("");

  function markUnderstood() {
    setUnderstood(true);
    localStorage.setItem(`ai_tutor_demo_explain_${topicKey}`, "1");
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
      <StatusBar />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: "10px 20px 12px" }}>
        <button onClick={() => navigate(-1)} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}>
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--foreground)" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ ...typo.metaStyle, color: "var(--primary)", fontWeight: "var(--font-weight-semibold)", marginBottom: 1 }}>Real Numbers · jumped here</p>
          <p style={typo.pageTitleStyle}>{topic.title}</p>
        </div>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />

      <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "16px 18px", gap: 14 }}>
        <Bubble from="tutor">{topic.intro}</Bubble>

        {topic.lemmaLines && (
          <>
            <WorkedExample label={topic.lemmaLabel!} lines={topic.lemmaLines} />
            <Bubble from="tutor">{topic.lemmaTransition}</Bubble>
          </>
        )}

        <WorkedExample label={topic.exampleLabel} lines={topic.exampleLines} />

        <Bubble from="tutor">{topic.followUpPrompt}</Bubble>
        <Bubble from="student">{topic.followUpStudent}</Bubble>

        <WorkedExample label={topic.followUpLabel} lines={topic.followUpLines} />

        <Bubble from="tutor">{topic.closing}</Bubble>

        <div className="flex gap-2 flex-wrap" style={{ marginLeft: 34 }}>
          <button
            onClick={markUnderstood}
            className="flex items-center gap-1.5"
            style={{ ...typo.badgeStyle, padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", background: understood ? "var(--success)" : "var(--success)", color: "var(--white)" }}
          >
            {understood && <Check style={{ width: 13, height: 13 }} />}
            {understood ? "Marked as understood" : "Mark as understood"}
          </button>
          <button onClick={() => navigate(`/ai-tutor/solve?topic=${topic.exerciseId}`)} style={{ ...typo.badgeStyle, padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", background: "var(--primary)", color: "var(--white)" }}>
            Go to {topic.exerciseLabel}
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center shrink-0" style={{ padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
        <div className="flex-1 flex items-center gap-2" style={{ backgroundColor: "var(--input-background)", border: "1px solid var(--border)", borderRadius: 22, padding: "9px 14px" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--foreground)" }}
          />
          <Mic style={{ width: 16, height: 16, color: "var(--muted-foreground)" }} />
        </div>
        <button
          className="flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", border: "none", flexShrink: 0 }}
        >
          <Send style={{ width: 15, height: 15, color: "var(--white)" }} />
        </button>
      </div>
    </div>
  );
}
