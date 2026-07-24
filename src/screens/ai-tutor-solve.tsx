/**
 * AI Tutor prototype — Solve / Practice
 *
 * Every topic in Real Numbers (Ch.1) now has a real PRACTICE_SETS entry —
 * "HCF & LCM — two numbers" was the blueprint; the rest (unique-factorisation,
 * hcf-lcm-three, root-p-irrational, composite-proofs, and the two standalone
 * Exercise 1.1/1.2 topics) follow the same shape. Any topic without an entry
 * still falls back to LegacyPractice. The shape, for every topic:
 *   1. Pick which real problem to tackle (toggle between two).
 *   2. See the full question, not a fragment.
 *   3. Choose: have the AI walk through it step by step, or submit your own
 *      answer (photo upload here — this is a subjective/free-response
 *      question, so no MCQ path; that option exists for MCQ-type problems).
 *      Both stay reachable at once — uploading expands inline, it doesn't
 *      navigate away, so switching back to "just ask the AI" needs no undo.
 *   4. AI path → step-by-step guided solve, one step demonstrates catching a
 *      real mistake (matching the book's own likely wrong turn). Real
 *      multi-part questions (Q1's five numbers, Q2/Q3's pairs and triples)
 *      show a (i)/(ii)/... picker on this screen so any sub-part is reachable
 *      directly, each with its own multi-step derivation — not one forced
 *      linear chain across every sub-part.
 *   5. Submitted-answer path → feedback (demo-only: the presenter picks
 *      correct/incorrect to control which path to show live).
 *   6. Wrong answer → routes into the same step-by-step walkthrough.
 *   7. Finishing either path always offers a next step — the other problem
 *      in this topic if it's not done yet, or back to the curriculum if it is.
 * Every problem is real: the same Examples/Theorems already cited in Explain
 * where a topic has them, or real Exercise 1.1/1.2 questions for the two
 * standalone exercise topics — never invented numbers under a real name.
 */
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Camera, Check, X, Sparkles, Upload, AlertTriangle } from "lucide-react";
import { StatusBar, typo } from "../shared/premium-ui";

type StepState = "done" | "active" | "locked";

interface PracticeStep {
  prompt: string;
  answer: string;
  trap?: { wrongGuess: string; hint: string };
}

// A real multi-part question (Q1's five numbers, Q3's three sub-parts) is NOT
// one long linear step sequence — each sub-part is independently selectable,
// with its own multi-step derivation. Forcing (i)-(v) into one chain meant a
// student stuck on (iii) had to click through (i) and (ii) first to reach it.
interface PracticePart {
  label: string;
  steps: PracticeStep[];
}

interface PracticeProblem {
  id: string;
  label: string;
  questionText: string;
  // Single-part problems use `steps` directly. Multi-part real questions use
  // `parts` instead — exactly one of the two is set, never both.
  steps?: PracticeStep[];
  parts?: PracticePart[];
  verifyLine: string;
}

// Practice problems for "HCF & LCM — two numbers" are the SAME Example 2 and
// Example 3 shown in Explain (6,20 and 96,404) — not different numbers. The
// goal is a student can flip to "Example 2" in their physical NCERT book and
// see exactly what's here; introducing different numbers under a real
// example's name would break that direct correspondence.
const HCF_LCM_TWO_PROBLEMS: PracticeProblem[] = [
  {
    id: "example-2",
    label: "Example 2",
    questionText: "Find the LCM and HCF of 6 and 20 by the prime factorisation method.",
    steps: [
      { prompt: "Prime-factorise 6.", answer: "6 = 2 × 3" },
      { prompt: "Prime-factorise 20.", answer: "20 = 2² × 5", trap: { wrongGuess: "4 × 5", hint: "4 isn't prime — keep factorising: 4 = 2 × 2." } },
      { prompt: "HCF = smallest power of every common prime.", answer: "HCF = 2" },
      { prompt: "LCM = greatest power of every prime that appears.", answer: "LCM = 2² × 3 × 5 = 60" },
    ],
    verifyLine: "HCF × LCM = 2 × 60 = 120 = 6 × 20 ✓",
  },
  {
    id: "example-3",
    label: "Example 3",
    questionText: "Find the HCF of 96 and 404 by the prime factorisation method. Hence, find their LCM.",
    steps: [
      { prompt: "Prime-factorise 96.", answer: "96 = 2⁵ × 3" },
      { prompt: "Prime-factorise 404.", answer: "404 = 2² × 101", trap: { wrongGuess: "4 × 101", hint: "4 isn't prime — keep factorising: 4 = 2 × 2." } },
      { prompt: "HCF = smallest power of every common prime.", answer: "HCF = 2² = 4" },
      { prompt: "LCM = product ÷ HCF (the shortcut from Example 2, since these are only two numbers).", answer: "LCM = (96 × 404) ÷ 4 = 9696" },
    ],
    verifyLine: "HCF × LCM = 4 × 9696 = 38784 = 96 × 404 ✓",
  },
];

// "Unique prime factorisation" is kind: "both" — Theorem 1.1 is the explained
// proof; Example 1 is the one re-attemptable worked instance. One problem,
// matching the one real "Example" citation — not a manufactured second option.
const UNIQUE_FACTORISATION_PROBLEMS: PracticeProblem[] = [
  {
    id: "example-1",
    label: "Example 1",
    questionText: "Consider the numbers 4ⁿ, where n is a natural number. Check whether there is any value of n for which 4ⁿ ends with the digit zero.",
    steps: [
      { prompt: "Write 4 in terms of its prime factors.", answer: "4 = 2²" },
      { prompt: "So what primes appear in 4ⁿ?", answer: "4ⁿ = 2²ⁿ — only the prime 2", trap: { wrongGuess: "2ⁿ × 5", hint: "5 isn't a factor of 4 — recheck 4's prime factorisation." } },
      { prompt: "What primes does a number need in its factorisation to end in 0?", answer: "Both 2 and 5 (since 10 = 2 × 5)" },
      { prompt: "Does 4ⁿ contain a factor of 5?", answer: "No — so 4ⁿ can never end in 0" },
    ],
    verifyLine: "4ⁿ = 2²ⁿ never contains the prime 5, so it can never end in the digit 0 ✓",
  },
];

// "HCF & LCM — three numbers" has exactly one real citation — Example 4 —
// so exactly one practice problem, not a second one manufactured to fill a
// slot.
const HCF_LCM_THREE_PROBLEMS: PracticeProblem[] = [
  {
    id: "example-4",
    label: "Example 4",
    questionText: "Find the HCF and LCM of 6, 72 and 120, using the prime factorisation method.",
    steps: [
      { prompt: "Prime-factorise 6.", answer: "6 = 2 × 3" },
      { prompt: "Prime-factorise 72.", answer: "72 = 2³ × 3²", trap: { wrongGuess: "72 = 8 × 9", hint: "8 and 9 aren't prime — keep factorising: 8 = 2³, 9 = 3²." } },
      { prompt: "Prime-factorise 120.", answer: "120 = 2³ × 3 × 5" },
      { prompt: "HCF = smallest power of every common prime.", answer: "HCF = 2¹ × 3¹ = 6" },
      { prompt: "LCM = greatest power of every prime that appears.", answer: "LCM = 2³ × 3² × 5 = 360" },
    ],
    verifyLine: "HCF = 6, LCM = 360 ✓",
  },
];

// "Proving √p is irrational" is kind: "both" — Theorems 1.2/1.3 are the
// explained proof of √2; Example 5 is the one re-attemptable worked instance
// (√3). One problem, matching the one real Example citation.
const ROOT_P_IRRATIONAL_PROBLEMS: PracticeProblem[] = [
  {
    id: "example-5",
    label: "Example 5",
    questionText: "Prove that √3 is irrational.",
    steps: [
      { prompt: "Assume √3 = a/b, in lowest terms.", answer: "a and b share no common factor" },
      { prompt: "Square both sides.", answer: "3b² = a²" },
      { prompt: "What does that tell us about a?", answer: "a² is divisible by 3, so a is divisible by 3 (a = 3c)", trap: { wrongGuess: "a is divisible by 9", hint: "we only know 3 divides a² — that gives 3 divides a, not 9." } },
      { prompt: "Substitute a = 3c and simplify.", answer: "3b² = 9c² → b² = 3c² → b is divisible by 3 too" },
      { prompt: "What's the contradiction?", answer: "a and b are both divisible by 3 — contradicts them sharing no common factor" },
    ],
    verifyLine: "√3 is irrational ✓",
  },
];

// "Proving expressions like 5−√3 are irrational" reuses Examples 6 and 7 —
// the same two citations already in Explain.
const COMPOSITE_PROOFS_PROBLEMS: PracticeProblem[] = [
  {
    id: "example-6",
    label: "Example 6",
    questionText: "Show that 5 − √3 is irrational.",
    steps: [
      { prompt: "Assume 5 − √3 = a/b (rational).", answer: "a, b are integers, b ≠ 0" },
      { prompt: "Rearrange to isolate √3.", answer: "√3 = 5 − a/b" },
      { prompt: "What can we say about the right-hand side?", answer: "5 − a/b is rational (built from integers)", trap: { wrongGuess: "the right side is irrational too", hint: "a/b and 5 are both rational — a rational minus a rational is still rational." } },
      { prompt: "What's the contradiction?", answer: "√3 would be rational — contradicts √3 being irrational" },
    ],
    verifyLine: "5 − √3 is irrational ✓",
  },
  {
    id: "example-7",
    label: "Example 7",
    questionText: "Show that 3√2 is irrational.",
    steps: [
      { prompt: "Assume 3√2 = a/b (rational).", answer: "a, b are integers, b ≠ 0" },
      { prompt: "Rearrange to isolate √2.", answer: "√2 = a / (3b)" },
      { prompt: "What can we say about the right-hand side?", answer: "a/(3b) is rational (built from integers)", trap: { wrongGuess: "3b could make it irrational", hint: "3b is just an integer — a ratio of two integers is always rational." } },
      { prompt: "What's the contradiction?", answer: "√2 would be rational — contradicts √2 being irrational" },
    ],
    verifyLine: "3√2 is irrational ✓",
  },
];

// "Exercise 1.1 — Practice" is the standalone exercise topic — it represents
// the whole exercise, so it gets all 7 real questions, not a sample of 2.
// Multi-part questions (Q1, Q2, Q3) walk through every real sub-part as
// their own steps rather than picking just one and dropping the rest.
const EX_1_1_PROBLEMS: PracticeProblem[] = [
  {
    id: "ex1-1-q1",
    label: "Q1",
    questionText: "Express each number as a product of its prime factors: (i) 140 (ii) 156 (iii) 3825 (iv) 5005 (v) 7429",
    parts: [
      {
        label: "(i)",
        steps: [
          { prompt: "Divide 140 by the smallest prime that fits.", answer: "140 ÷ 2 = 70" },
          { prompt: "Divide 70 by the smallest prime that fits.", answer: "70 ÷ 2 = 35" },
          { prompt: "35 isn't divisible by 2 — factorise it directly.", answer: "35 = 5 × 7" },
          { prompt: "So what's 140 as a product of primes?", answer: "140 = 2² × 5 × 7" },
        ],
      },
      {
        label: "(ii)",
        steps: [
          { prompt: "Divide 156 by the smallest prime that fits.", answer: "156 ÷ 2 = 78" },
          { prompt: "Factorise 78 further.", answer: "78 = 2 × 39" },
          { prompt: "Is 39 prime?", answer: "No — 39 = 3 × 13", trap: { wrongGuess: "39 is already prime, so we can stop here", hint: "39 isn't prime — 39 = 3 × 13, so keep factorising." } },
          { prompt: "So what's 156 as a product of primes?", answer: "156 = 2² × 3 × 13" },
        ],
      },
      {
        label: "(iii)",
        steps: [
          { prompt: "Divide 3825 by the smallest prime that fits.", answer: "3825 ÷ 5 = 765" },
          { prompt: "Divide 765 by the smallest prime that fits.", answer: "765 ÷ 5 = 153" },
          { prompt: "Divide 153 by the smallest prime that fits.", answer: "153 ÷ 3 = 51" },
          { prompt: "Divide 51 by the smallest prime that fits.", answer: "51 ÷ 3 = 17, and 17 is prime" },
          { prompt: "So what's 3825 as a product of primes?", answer: "3825 = 3² × 5² × 17" },
        ],
      },
      {
        label: "(iv)",
        steps: [
          { prompt: "Divide 5005 by the smallest prime that fits.", answer: "5005 ÷ 5 = 1001" },
          { prompt: "Divide 1001 by the next prime that fits.", answer: "1001 ÷ 7 = 143" },
          { prompt: "143 isn't obviously prime — test small primes.", answer: "143 ÷ 11 = 13, and 13 is prime" },
          { prompt: "So what's 5005 as a product of primes?", answer: "5005 = 5 × 7 × 11 × 13" },
        ],
      },
      {
        label: "(v)",
        steps: [
          { prompt: "Divide 7429 by the smallest prime that fits (2, 3, 5, 7, 11, 13 don't divide it — 17 does).", answer: "7429 ÷ 17 = 437" },
          { prompt: "437 isn't obviously prime — test small primes.", answer: "437 ÷ 19 = 23, and 23 is prime" },
          { prompt: "So what's 7429 as a product of primes?", answer: "7429 = 17 × 19 × 23" },
        ],
      },
    ],
    verifyLine: "All five expressed as products of prime factors ✓",
  },
  {
    id: "ex1-1-q2",
    label: "Q2",
    questionText: "Find the LCM and HCF of the following pairs of integers and verify that LCM × HCF = product of the two numbers: (i) 26 and 91 (ii) 510 and 92 (iii) 336 and 54",
    parts: [
      {
        label: "(i)",
        steps: [
          { prompt: "26 and 91 — prime-factorise both.", answer: "26 = 2 × 13, 91 = 7 × 13" },
          { prompt: "Find HCF and LCM.", answer: "HCF = 13, LCM = 182 (13 × 182 = 2366 = 26 × 91 ✓)" },
        ],
      },
      {
        label: "(ii)",
        steps: [
          { prompt: "510 and 92 — prime-factorise both.", answer: "510 = 2 × 3 × 5 × 17, 92 = 2² × 23" },
          { prompt: "Find HCF and LCM.", answer: "HCF = 2, LCM = 23460 (2 × 23460 = 46920 = 510 × 92 ✓)" },
        ],
      },
      {
        label: "(iii)",
        steps: [
          { prompt: "336 and 54 — prime-factorise both.", answer: "336 = 2⁴ × 3 × 7, 54 = 2 × 3³", trap: { wrongGuess: "336 = 2³ × 42", hint: "42 isn't prime — keep factorising: 42 = 2 × 3 × 7, so 336 = 2⁴ × 3 × 7." } },
          { prompt: "Find HCF and LCM.", answer: "HCF = 6, LCM = 3024 (6 × 3024 = 18144 = 336 × 54 ✓)" },
        ],
      },
    ],
    verifyLine: "All three pairs verified: LCM × HCF = product ✓",
  },
  {
    id: "ex1-1-q3",
    label: "Q3",
    questionText: "Find the LCM and HCF of the following integers by applying the prime factorisation method: (i) 12, 15 and 21 (ii) 17, 23 and 29 (iii) 8, 9 and 25",
    parts: [
      {
        label: "(i)",
        steps: [
          { prompt: "12, 15, 21 — prime-factorise each.", answer: "12 = 2² × 3, 15 = 3 × 5, 21 = 3 × 7" },
          { prompt: "Find HCF and LCM.", answer: "HCF = 3, LCM = 420" },
        ],
      },
      {
        label: "(ii)",
        steps: [
          { prompt: "17, 23, 29 — prime-factorise each.", answer: "All three are already prime", trap: { wrongGuess: "17 = 1 × 17", hint: "17 is already prime — no further factorising needed." } },
          { prompt: "Find HCF and LCM.", answer: "HCF = 1 (no common factor), LCM = 17 × 23 × 29 = 11339" },
        ],
      },
      {
        label: "(iii)",
        steps: [
          { prompt: "8, 9, 25 — prime-factorise each.", answer: "8 = 2³, 9 = 3², 25 = 5²" },
          { prompt: "Find HCF and LCM.", answer: "HCF = 1 (no common factor), LCM = 2³ × 3² × 5² = 1800" },
        ],
      },
    ],
    verifyLine: "All three triples solved by prime factorisation ✓",
  },
  {
    id: "ex1-1-q4",
    label: "Q4",
    questionText: "Given that HCF (306, 657) = 9, find LCM (306, 657).",
    steps: [
      { prompt: "What formula links HCF, LCM, and the two numbers?", answer: "LCM × HCF = product of the two numbers" },
      { prompt: "Compute the product 306 × 657.", answer: "306 × 657 = 306×600 + 306×57 = 183600 + 17442 = 201042" },
      { prompt: "Divide by the given HCF to find LCM.", answer: "LCM = 201042 ÷ 9 = 22338" },
    ],
    verifyLine: "LCM (306, 657) = 22338 ✓",
  },
  {
    id: "ex1-1-q5",
    label: "Q5",
    questionText: "Check whether 6ⁿ can end with the digit 0 for any natural number n.",
    steps: [
      { prompt: "Write 6 in terms of its prime factors.", answer: "6 = 2 × 3" },
      { prompt: "So what primes appear in 6ⁿ?", answer: "6ⁿ = 2ⁿ × 3ⁿ — only 2 and 3", trap: { wrongGuess: "2ⁿ × 5ⁿ", hint: "5 isn't a factor of 6 — recheck 6's prime factorisation." } },
      { prompt: "What primes does a number need in its factorisation to end in 0?", answer: "Both 2 and 5 (since 10 = 2 × 5)" },
      { prompt: "Does 6ⁿ contain a factor of 5?", answer: "No — so 6ⁿ can never end in 0" },
    ],
    verifyLine: "6ⁿ = 2ⁿ × 3ⁿ never contains the prime 5, so it can never end in the digit 0 ✓",
  },
  {
    id: "ex1-1-q6",
    label: "Q6",
    questionText: "Explain why 7 × 11 × 13 + 13 and 7 × 6 × 5 × 4 × 3 × 2 × 1 + 5 are composite numbers.",
    steps: [
      { prompt: "Factor out the common term from 7 × 11 × 13 + 13.", answer: "13(7 × 11 + 1) = 13 × 78" },
      { prompt: "Is 13 × 78 composite?", answer: "Yes — it's a product of two integers greater than 1", trap: { wrongGuess: "no, because 13 is prime", hint: "the whole expression just needs to be a product of two factors > 1 — one being prime doesn't matter." } },
      { prompt: "Similarly, factor 7×6×5×4×3×2×1 + 5 (note 5 is one of the multiplicands).", answer: "5 × (7×6×4×3×2×1) + 5 = 5 × (1008 + 1) = 5 × 1009" },
      { prompt: "Is 5 × 1009 composite?", answer: "Yes — same reasoning: a product of two integers greater than 1" },
    ],
    verifyLine: "Both numbers are composite, since each factors into two integers greater than 1 ✓",
  },
  {
    id: "ex1-1-q7",
    label: "Q7",
    questionText: "Sonia takes 18 minutes to drive one round of a circular sports field, while Ravi takes 12 minutes. Suppose they both start at the same point and time, going the same direction — after how many minutes will they meet again at the starting point?",
    steps: [
      { prompt: "What quantity tells us when both have completed whole laps at the same time?", answer: "The LCM of 18 and 12" },
      { prompt: "Prime-factorise 18 and 12.", answer: "18 = 2 × 3², 12 = 2² × 3", trap: { wrongGuess: "18 = 2 × 9", hint: "9 isn't prime — keep going: 9 = 3²." } },
      { prompt: "LCM = greatest power of every prime that appears.", answer: "LCM = 2² × 3² = 36" },
    ],
    verifyLine: "They meet again at the starting point after 36 minutes ✓",
  },
];

// "Exercise 1.2 — Practice" — all 3 real questions, matching the chapter.
const EX_1_2_PROBLEMS: PracticeProblem[] = [
  {
    id: "ex1-2-q1",
    label: "Q1",
    questionText: "Prove that √5 is irrational.",
    steps: [
      { prompt: "Assume √5 = a/b, in lowest terms.", answer: "a and b share no common factor" },
      { prompt: "Square both sides.", answer: "5b² = a²" },
      { prompt: "What does that tell us about a?", answer: "a² is divisible by 5, so a is divisible by 5 (a = 5c)", trap: { wrongGuess: "a is divisible by 25", hint: "we only know 5 divides a² — that gives 5 divides a, not 25." } },
      { prompt: "Substitute a = 5c and simplify.", answer: "5b² = 25c² → b² = 5c² → b is divisible by 5 too" },
      { prompt: "What's the contradiction?", answer: "a and b are both divisible by 5 — contradicts them sharing no common factor" },
    ],
    verifyLine: "√5 is irrational ✓",
  },
  {
    id: "ex1-2-q2",
    label: "Q2",
    questionText: "Prove that 3 + 2√5 is irrational.",
    steps: [
      { prompt: "Assume 3 + 2√5 = a/b (rational).", answer: "a, b are integers, b ≠ 0" },
      { prompt: "Rearrange to isolate √5.", answer: "√5 = (a/b − 3) ÷ 2 = (a − 3b) / (2b)" },
      { prompt: "What can we say about the right-hand side?", answer: "(a − 3b)/(2b) is rational (built from integers)", trap: { wrongGuess: "dividing by 2 makes it irrational", hint: "dividing one integer by another (2b) always gives a rational number." } },
      { prompt: "What's the contradiction?", answer: "√5 would be rational — contradicts √5 being irrational" },
    ],
    verifyLine: "3 + 2√5 is irrational ✓",
  },
  {
    id: "ex1-2-q3",
    label: "Q3",
    questionText: "Prove that the following are irrationals: (i) 1/√2 (ii) 7√5 (iii) 6 + √2",
    parts: [
      {
        label: "(i)",
        steps: [
          { prompt: "Assume 1/√2 = a/b (rational). Rearrange to isolate √2.", answer: "√2 = b/a" },
          { prompt: "What can we say about b/a?", answer: "b/a is rational (integers) — contradicts √2 being irrational", trap: { wrongGuess: "b/a is irrational since a involves √2", hint: "a and b are just integers by assumption — any ratio of integers is rational." } },
        ],
      },
      {
        label: "(ii)",
        steps: [
          { prompt: "Assume 7√5 = a/b (rational). Rearrange to isolate √5.", answer: "√5 = a / (7b)" },
          { prompt: "What can we say about a/(7b)?", answer: "a/(7b) is rational — contradicts √5 being irrational" },
        ],
      },
      {
        label: "(iii)",
        steps: [
          { prompt: "Assume 6 + √2 = a/b (rational). Rearrange to isolate √2.", answer: "√2 = (a − 6b) / b" },
          { prompt: "What can we say about (a − 6b)/b?", answer: "It's rational (built from integers) — contradicts √2 being irrational" },
        ],
      },
    ],
    verifyLine: "All three are irrational — same isolate-and-contradict technique each time ✓",
  },
];

const PRACTICE_SETS: Record<string, PracticeProblem[]> = {
  "unique-factorisation": UNIQUE_FACTORISATION_PROBLEMS,
  "hcf-lcm-two": HCF_LCM_TWO_PROBLEMS,
  "hcf-lcm-three": HCF_LCM_THREE_PROBLEMS,
  "root-p-irrational": ROOT_P_IRRATIONAL_PROBLEMS,
  "composite-proofs": COMPOSITE_PROOFS_PROBLEMS,
  "ex-1-1": EX_1_1_PROBLEMS,
  "ex-1-2": EX_1_2_PROBLEMS,
};

function StepCircle({ state, index }: { state: StepState; index: number }) {
  const bg = state === "done" ? "var(--success)" : state === "active" ? "var(--primary)" : "var(--muted)";
  const color = state === "locked" ? "var(--muted-foreground)" : "var(--white)";
  return (
    <div className="flex items-center justify-center shrink-0" style={{ width: 22, height: 22, borderRadius: "50%", background: bg }}>
      {state === "done" ? <Check style={{ width: 12, height: 12, color }} strokeWidth={3} /> : <span style={{ fontSize: 11, fontWeight: 700, color }}>{index}</span>}
    </div>
  );
}

// "upload" is deliberately not its own mode — it expands inline within
// "select" instead of navigating away, so "Ask AI tutor to solve it" stays
// reachable the whole time you're deciding whether to upload. It only stops
// being reachable once you actually submit (mode moves to "pending"), which
// is correct: at that point you've committed to the upload path.
type Mode = "select" | "explain" | "pending" | "correct" | "incorrect";

function RichPractice({ topicKey, topicTitle, problems }: { topicKey: string; topicTitle: string; problems: PracticeProblem[] }) {
  const navigate = useNavigate();
  const [problemIdx, setProblemIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("select");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [partIdx, setPartIdx] = useState(0);
  const [completedParts, setCompletedParts] = useState<boolean[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [explainFinished, setExplainFinished] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const problem = problems[problemIdx];
  // Multi-part real questions (Q1's five numbers, Q2/Q3's three pairs/triples)
  // walk through whichever sub-part is selected, independently of the others
  // — not one forced linear chain across all sub-parts.
  const activeSteps: PracticeStep[] = problem.parts ? problem.parts[partIdx].steps : problem.steps!;

  // Completion is tracked per PROBLEM, not just per topic — completing
  // Example 2 alone shouldn't silently mark "HCF & LCM — two numbers" as
  // fully practiced while Example 3 has never been touched. The topic-level
  // flag Chapter Home reads only gets set once every problem here is done.
  function isProblemDone(p: PracticeProblem) {
    return localStorage.getItem(`ai_tutor_demo_practice_${topicKey}_${p.id}`) === "1";
  }
  function markProblemComplete(p: PracticeProblem) {
    localStorage.setItem(`ai_tutor_demo_practice_${topicKey}_${p.id}`, "1");
    if (problems.every(isProblemDone)) {
      localStorage.setItem(`ai_tutor_demo_practice_${topicKey}`, "1");
    }
  }
  const allProblemsDone = problems.every(isProblemDone);
  const nextIncompleteProblem = problems.find((p, i) => i !== problemIdx && !isProblemDone(p));

  function selectProblem(i: number) {
    setProblemIdx(i);
    setMode("select");
    setUploadOpen(false);
    setPartIdx(0);
    setCompletedParts([]);
    setStepIdx(0);
    setRevealed(false);
    setExplainFinished(false);
    setPhotoDataUrl(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function startExplain() {
    setPartIdx(0);
    setCompletedParts(problem.parts ? problem.parts.map(() => false) : []);
    setStepIdx(0);
    setRevealed(false);
    setExplainFinished(false);
    setMode("explain");
  }

  // Jumping to a different sub-part is always allowed, whether or not it's
  // already been completed — matches the top-of-screen (i)/(ii)/(iii) picker
  // rather than gating parts behind finishing the previous one.
  function selectPart(i: number) {
    setPartIdx(i);
    setStepIdx(0);
    setRevealed(false);
  }

  // Shown after finishing a problem (either path) — the actual "what's next"
  // progression that was missing before: jump straight to the other problem,
  // or head back to the curriculum once everything here is done.
  function NextStepsCta() {
    return nextIncompleteProblem ? (
      <button
        onClick={() => selectProblem(problems.indexOf(nextIncompleteProblem))}
        className="flex items-center justify-center"
        style={{ height: 44, borderRadius: 12, background: "var(--primary)", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>Next: {nextIncompleteProblem.label} →</span>
      </button>
    ) : (
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center"
        style={{ height: 44, borderRadius: 12, background: "var(--success)", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>Back to Curriculum</span>
      </button>
    );
  }

  // Which other sub-parts (besides the current one) are still unfinished —
  // used both to label the last step's button ("Continue to (iii)" vs.
  // "Finish") and to decide where continueStep() goes next.
  const remainingPartIdxs = problem.parts
    ? problem.parts.map((_, i) => i).filter((i) => i !== partIdx && !completedParts[i])
    : [];

  function continueStep() {
    if (stepIdx < activeSteps.length - 1) {
      setStepIdx(stepIdx + 1);
      setRevealed(false);
      return;
    }
    if (problem.parts) {
      const updated = [...completedParts];
      updated[partIdx] = true;
      setCompletedParts(updated);
      const nextPartIdx = updated.findIndex((done) => !done);
      if (nextPartIdx !== -1) {
        setPartIdx(nextPartIdx);
        setStepIdx(0);
        setRevealed(false);
        return;
      }
    }
    markProblemComplete(problem);
    setExplainFinished(true);
  }

  const header = (
    <div className="flex items-center gap-3 shrink-0" style={{ padding: "10px 20px 12px" }}>
      <button onClick={() => navigate(-1)} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}>
        <ArrowLeft style={{ width: 18, height: 18, color: "var(--foreground)" }} />
      </button>
      <div className="flex-1 min-w-0">
        <p style={typo.pageTitleStyle}>{topicTitle}</p>
      </div>
    </div>
  );

  if (mode === "select") {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
        <StatusBar />
        {header}
        <div style={{ height: 1, background: "var(--border)" }} />

        <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 24px" }}>
          {/* A single-problem topic has nothing to "choose" between — the
              selector only makes sense once there's an actual choice. Pills
              size to their own content and wrap, rather than stretching to
              fill a row, since some topics have 7 of these, not 2. */}
          {problems.length > 1 && (
            <>
              <p style={{ ...typo.metaStyle, marginBottom: 8 }}>Choose a problem</p>
              <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 16 }}>
                {problems.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => selectProblem(i)}
                    style={{
                      height: 36, padding: "0 14px", borderRadius: 10, cursor: "pointer",
                      border: i === problemIdx ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: i === problemIdx ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--card)",
                      color: i === problemIdx ? "var(--primary)" : "var(--foreground)",
                      fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ background: "var(--card)", borderRadius: "var(--radius-card)", padding: "14px 15px", marginBottom: 20 }}>
            <span style={{ ...typo.badgeStyle, textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              Question
            </span>
            <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", lineHeight: 1.6 }}>{problem.questionText}</p>
          </div>

          {/* Both paths stay visible and tappable at all times — uploading
              expands inline below rather than navigating away, so switching
              your mind back to "just ask the AI" never requires leaving the
              screen. Only submitting actually commits you past this point. */}
          <div className="flex flex-col" style={{ gap: 10 }}>
            <button
              onClick={startExplain}
              className="flex items-center gap-3"
              style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", textAlign: "left" }}
            >
              <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--warning-950)" }}>
                <Sparkles style={{ width: 18, height: 18, color: "var(--warning)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)" }}>Ask AI tutor to solve it</p>
                <p style={typo.metaStyle}>Step-by-step, at your pace</p>
              </div>
            </button>

            <button
              onClick={() => setUploadOpen(!uploadOpen)}
              className="flex items-center gap-3"
              style={{ padding: "14px 16px", borderRadius: 12, border: uploadOpen ? "1.5px solid var(--primary)" : "1px solid var(--border)", background: "var(--card)", cursor: "pointer", textAlign: "left" }}
            >
              <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary-950)" }}>
                <Camera style={{ width: 18, height: 18, color: "var(--primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)" }}>Upload your answer</p>
                <p style={typo.metaStyle}>Solved it already? Get it checked</p>
              </div>
            </button>

            {uploadOpen && (
              <div className="flex flex-col" style={{ gap: 12, padding: "4px 4px 0 4px" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                {!photoDataUrl ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center"
                    style={{ height: 140, borderRadius: 12, border: "1.5px dashed var(--border)", background: "var(--card)", cursor: "pointer", gap: 8 }}
                  >
                    <Upload style={{ width: 22, height: 22, color: "var(--muted-foreground)" }} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>Tap to upload a photo of your working</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ padding: 0, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", cursor: "pointer", background: "none", height: 180 }}
                    >
                      <img src={photoDataUrl} alt="Your uploaded working" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                    <span style={{ ...typo.metaStyle, textAlign: "center" }}>Tap the photo to choose a different one</span>
                    <button
                      onClick={() => setMode("pending")}
                      className="flex items-center justify-center"
                      style={{ height: 44, borderRadius: 12, background: "var(--primary)", border: "none", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>Submit for feedback</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "pending" || mode === "correct" || mode === "incorrect") {
    if (mode === "correct" && !isProblemDone(problem)) markProblemComplete(problem);
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
        <StatusBar />
        {header}
        <div style={{ height: 1, background: "var(--border)" }} />
        <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "16px 20px 24px", gap: 14 }}>
          {mode === "pending" && (
            <>
              <div className="flex items-center gap-3" style={{ padding: "14px 16px", borderRadius: 12, background: "var(--card)" }}>
                {photoDataUrl && (
                  <img src={photoDataUrl} alt="Your uploaded working" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                )}
                <div className="flex items-center gap-2">
                  <Sparkles style={{ width: 18, height: 18, color: "var(--primary)", flexShrink: 0 }} />
                  <span style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>Checking your answer for {problem.label}…</span>
                </div>
              </div>
              <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 12, border: "1px dashed var(--border)" }}>
                <p style={{ ...typo.metaStyle, marginBottom: 10 }}>Demo controls — simulate the result:</p>
                <div className="flex gap-2">
                  <button onClick={() => setMode("correct")} style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "var(--success)", color: "var(--white)", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", cursor: "pointer" }}>
                    Mark Correct
                  </button>
                  <button onClick={() => setMode("incorrect")} style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "var(--error)", color: "var(--white)", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", cursor: "pointer" }}>
                    Mark Incorrect
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === "correct" && (
            <>
              <div className="flex flex-col items-center" style={{ padding: "32px 16px", gap: 12, textAlign: "center" }}>
                <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success)" }}>
                  <Check style={{ width: 26, height: 26, color: "var(--white)" }} strokeWidth={2.5} />
                </div>
                <p style={typo.cardTitleStyle}>Nice work — that's right</p>
                <p style={{ ...typo.cardBodyStyle, maxWidth: 260 }}>{problem.verifyLine} Marked as complete.</p>
              </div>
              <NextStepsCta />
            </>
          )}

          {mode === "incorrect" && (
            <div className="flex flex-col" style={{ gap: 14 }}>
              <div className="flex flex-col items-center" style={{ padding: "24px 16px 8px", gap: 12, textAlign: "center" }}>
                <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--error)" }}>
                  <AlertTriangle style={{ width: 26, height: 26, color: "var(--white)" }} />
                </div>
                <p style={typo.cardTitleStyle}>Not quite there yet</p>
                <p style={{ ...typo.cardBodyStyle, maxWidth: 280 }}>Something's off in {problem.label} — let's walk through it together.</p>
              </div>
              <button
                onClick={startExplain}
                className="flex items-center justify-center"
                style={{ height: 44, borderRadius: 12, background: "var(--primary)", border: "none", cursor: "pointer" }}
              >
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>See step-by-step</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Shown once the last step is finished — the missing "what's next" the
  // step list itself used to just sit at with a "Finish" button that did
  // nothing further.
  if (explainFinished) {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
        <StatusBar />
        {header}
        <div style={{ height: 1, background: "var(--border)" }} />
        <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "16px 20px 24px", gap: 14 }}>
          <div className="flex flex-col items-center" style={{ padding: "32px 16px", gap: 12, textAlign: "center" }}>
            <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success)" }}>
              <Check style={{ width: 26, height: 26, color: "var(--white)" }} strokeWidth={2.5} />
            </div>
            <p style={typo.cardTitleStyle}>You've completed {problem.label}</p>
            <p style={{ ...typo.cardBodyStyle, maxWidth: 280 }}>{problem.verifyLine}</p>
          </div>
          <NextStepsCta />
        </div>
      </div>
    );
  }

  // mode === "explain" — step-by-step guided walkthrough for the selected problem.
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
      <StatusBar />
      {header}
      <div style={{ height: 1, background: "var(--border)" }} />

      {/* Multi-part questions get a sub-part picker here, on the walkthrough
          screen — not on the "select" screen, where the top-level pills
          already choose between whole problems (Q1 vs Q2 vs ...). Any part
          is reachable at any time; a checkmark marks the ones already done. */}
      {problem.parts && (
        <div className="flex flex-wrap items-center shrink-0" style={{ gap: 6, padding: "10px 20px 0" }}>
          {problem.parts.map((part, i) => {
            const done = completedParts[i];
            const active = i === partIdx;
            return (
              <button
                key={part.label}
                onClick={() => selectPart(i)}
                className="flex items-center"
                style={{
                  gap: 4, height: 28, padding: "0 11px", borderRadius: 8, cursor: "pointer",
                  border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                  background: done ? "var(--success-d2)" : active ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--card)",
                  color: active ? "var(--primary)" : done ? "var(--success)" : "var(--foreground)",
                  fontFamily: "var(--font-family-inter)", fontSize: 12, fontWeight: 700,
                }}
              >
                {done && <Check style={{ width: 10, height: 10 }} strokeWidth={3} />}
                {part.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1.5 shrink-0" style={{ padding: "10px 20px 2px" }}>
        {activeSteps.map((_, i) => {
          const s: StepState = i < stepIdx ? "done" : i === stepIdx ? "active" : "locked";
          return <div key={i} style={{ width: s === "active" ? 8 : 6, height: s === "active" ? 8 : 6, borderRadius: "50%", background: s === "done" ? "var(--success)" : s === "active" ? "var(--primary)" : "var(--border)" }} />;
        })}
        <span style={{ ...typo.metaStyle, marginLeft: 6, fontWeight: "var(--font-weight-semibold)" }}>Step {stepIdx + 1} of {activeSteps.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: "12px 20px 24px" }}>
        <div style={{ background: "var(--card)", borderRadius: "var(--radius-card)", padding: "12px 15px", marginBottom: 16 }}>
          <span style={{ ...typo.badgeStyle, textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: 5 }}>
            {problem.parts ? `${problem.label} ${problem.parts[partIdx].label}` : problem.label}
          </span>
          <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>{problem.questionText}</p>
        </div>

        {activeSteps.map((step, i) => {
          if (i < stepIdx) {
            return (
              <div key={i} style={{ background: "var(--success-d2)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10 }}>
                <StepCircle state="done" index={i + 1} />
                <div className="flex-1 min-w-0">
                  <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", opacity: 0.85 }}>{step.prompt}</p>
                  <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)", marginTop: 2 }}>{step.answer}</p>
                </div>
              </div>
            );
          }
          if (i === stepIdx) {
            const isLastStep = i === activeSteps.length - 1;
            const nextPartLabel = isLastStep && problem.parts && remainingPartIdxs.length > 0
              ? problem.parts[remainingPartIdxs[0]].label
              : null;
            return (
              <div key={i} style={{ background: "var(--card)", border: "1.5px solid var(--primary)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10 }}>
                <StepCircle state="active" index={i + 1} />
                <div className="flex-1 min-w-0">
                  <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", marginBottom: 7 }}>{step.prompt}</p>
                  {!revealed && step.trap && (
                    <>
                      <div className="flex items-center gap-2" style={{ marginBottom: 7 }}>
                        <X style={{ width: 13, height: 13, color: "var(--error)" }} />
                        <span style={{ fontSize: 12, color: "var(--error)", textDecoration: "line-through" }}>{step.trap.wrongGuess}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--error-100)", background: "var(--error-d2)", borderRadius: 8, padding: "7px 10px", marginBottom: 9, lineHeight: 1.5 }}>
                        {step.trap.hint}
                      </div>
                    </>
                  )}
                  {revealed && (
                    <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)", color: "var(--success)", marginBottom: 9 }}>{step.answer}</p>
                  )}
                  <button
                    onClick={() => (revealed ? continueStep() : setRevealed(true))}
                    style={{ fontFamily: "var(--font-family-inter)", fontSize: 12, fontWeight: 700, padding: "8px 13px", borderRadius: 8, border: "none", background: "var(--primary)", color: "var(--white)", cursor: "pointer" }}
                  >
                    {revealed ? (nextPartLabel ? `Continue to ${nextPartLabel} →` : isLastStep ? "Finish" : "Continue") : step.trap ? "Show correct answer" : "Reveal this step"}
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{ background: "var(--secondary)", opacity: 0.55, borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10 }}>
              <StepCircle state="locked" index={i + 1} />
              <p style={{ ...typo.cardBodyStyle }}>{step.prompt}</p>
            </div>
          );
        })}

        {stepIdx === activeSteps.length - 1 && revealed && remainingPartIdxs.length === 0 && (
          <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--success)", background: "var(--success-d2)" }}>
            <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>{problem.verifyLine}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LegacyPractice({ topicKey }: { topicKey: string }) {
  const navigate = useNavigate();
  const [step2Value, setStep2Value] = useState("3 × 5");
  const [step2Checked] = useState(true);
  const [completed, setCompleted] = useState(() => localStorage.getItem(`ai_tutor_demo_practice_${topicKey}`) === "1");

  function markComplete() {
    setCompleted(true);
    localStorage.setItem(`ai_tutor_demo_practice_${topicKey}`, "1");
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
      <StatusBar />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: "10px 20px 12px" }}>
        <button onClick={() => navigate(-1)} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "var(--radius-button)", background: "var(--card)", border: "1px solid var(--border)" }}>
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--foreground)" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ ...typo.metaStyle, marginBottom: 1 }}>NCERT · Exercise 1.1</p>
          <p style={typo.pageTitleStyle}>Question 3 (i)</p>
        </div>
        <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, background: "var(--card)" }}>
          <Camera style={{ width: 15, height: 15, color: "var(--muted-foreground)" }} />
        </div>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />

      <div className="flex items-center gap-1.5 shrink-0" style={{ padding: "10px 20px 2px" }}>
        {["done", "active", "locked", "locked"].map((s, i) => (
          <div key={i} style={{ width: i === 1 ? 8 : 6, height: i === 1 ? 8 : 6, borderRadius: "50%", background: s === "done" ? "var(--success)" : s === "active" ? "var(--primary)" : "var(--border)" }} />
        ))}
        <span style={{ ...typo.metaStyle, marginLeft: 6, fontWeight: "var(--font-weight-semibold)" }}>Step 2 of 4</span>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: "12px 20px 24px" }}>
        <div style={{ background: "var(--card)", borderRadius: "var(--radius-card)", padding: "12px 15px", marginBottom: 16 }}>
          <span style={{ ...typo.badgeStyle, textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: 5 }}>
            Find the LCM and HCF, prime factorisation method
          </span>
          <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>
            Find the LCM and HCF of <strong>12, 15 and 21</strong> by applying the prime factorisation method.
          </p>
        </div>

        {/* Step 1 — done */}
        <div style={{ background: "var(--success-d2)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10 }}>
          <StepCircle state="done" index={1} />
          <div className="flex-1 min-w-0">
            <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", opacity: 0.85 }}>Prime-factorise 12.</p>
            <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)", marginTop: 2 }}>2² × 3</p>
          </div>
        </div>

        {/* Step 2 — active, shows the caught mistake */}
        <div style={{ background: "var(--card)", border: "1.5px solid var(--primary)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10 }}>
          <StepCircle state="active" index={2} />
          <div className="flex-1 min-w-0">
            <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", marginBottom: 7 }}>Now prime-factorise 15.</p>
            <div className="flex items-center gap-2" style={{ marginBottom: 7 }}>
              <X style={{ width: 13, height: 13, color: "var(--error)" }} />
              <span style={{ fontSize: 12, color: "var(--error)", textDecoration: "line-through" }}>3 × 4</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--error-100)", background: "var(--error-d2)", borderRadius: 8, padding: "7px 10px", marginBottom: 9, lineHeight: 1.5 }}>
              Almost — 4 isn&apos;t prime. What two primes multiply to give 15?
            </div>
            <div className="flex gap-2 items-center">
              <input
                value={step2Value}
                onChange={(e) => setStep2Value(e.target.value)}
                style={{ flex: 1, fontFamily: "var(--font-family-inter)", fontSize: 13, fontWeight: 600, padding: "8px 11px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--input-background)", color: "var(--foreground)" }}
              />
              <button style={{ fontFamily: "var(--font-family-inter)", fontSize: 12, fontWeight: 700, padding: "8px 13px", borderRadius: 8, border: "none", background: "var(--primary)", color: "var(--white)", cursor: "pointer" }}>
                {step2Checked ? "Checked" : "Check"}
              </button>
            </div>
          </div>
        </div>

        {/* Steps 3-4 — locked */}
        {["Prime-factorise 21.", "Use all three to find HCF and LCM."].map((prompt, i) => (
          <div key={i} style={{ background: "var(--secondary)", opacity: 0.55, borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10 }}>
            <StepCircle state="locked" index={i + 3} />
            <p style={{ ...typo.cardBodyStyle }}>{prompt}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center shrink-0" style={{ padding: "8px 20px 20px", gap: 10 }}>
        <span style={typo.metaStyle}>Type your answer for the current step above</span>
        <button
          onClick={markComplete}
          className="flex items-center gap-1.5"
          style={{ ...typo.badgeStyle, padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", background: "var(--success)", color: "var(--white)" }}
        >
          {completed && <Check style={{ width: 13, height: 13 }} />}
          {completed ? "Marked as complete" : "Mark as complete"}
        </button>
      </div>
    </div>
  );
}

const TOPIC_TITLES: Record<string, string> = {
  "unique-factorisation": "Unique prime factorisation",
  "hcf-lcm-two": "HCF & LCM — two numbers",
  "hcf-lcm-three": "HCF & LCM — three numbers",
  "root-p-irrational": "Proving √p is irrational",
  "composite-proofs": "Proving expressions like 5−√3 are irrational",
  "ex-1-1": "Exercise 1.1",
  "ex-1-2": "Exercise 1.2",
};

export function Component() {
  const [params] = useSearchParams();
  const topicKey = params.get("topic") ?? "hcf-lcm-three";
  const problems = PRACTICE_SETS[topicKey];

  if (problems) {
    return <RichPractice topicKey={topicKey} topicTitle={TOPIC_TITLES[topicKey] ?? "Practice"} problems={problems} />;
  }
  return <LegacyPractice topicKey={topicKey} />;
}
