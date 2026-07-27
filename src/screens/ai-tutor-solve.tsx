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
 *   5. Submitted-answer path → real feedback: the photo is sent to
 *      ai-tutor-server (/server), which grades it with a vision model.
 *   6. Wrong answer → routes into the same step-by-step walkthrough.
 *   7. Finishing either path always offers a next step — the other problem
 *      in this topic if it's not done yet, or back to the curriculum if it is.
 * Every problem is real: the same Examples/Theorems already cited in Explain
 * where a topic has them, or real Exercise 1.1/1.2 questions for the two
 * standalone exercise topics — never invented numbers under a real name.
 */
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Camera, Check, X, Sparkles, Upload, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, Mic, Square, Type, PenLine } from "lucide-react";
import { motion } from "motion/react";
import { StatusBar, typo } from "../shared/premium-ui";
import { BottomSheet } from "../shared/bottom-sheet";
import { Skeleton } from "../app/components/ui/skeleton";

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

// Visual/perceptual problems (e.g. "how many zeroes does this graph show")
// and fact-recall problems (e.g. "what type of reaction is this") both have
// nothing to *derive* — the answer comes from reading a real figure or
// recalling/classifying a real fact directly. Forcing either into a
// step-by-step reveal would fake a derivation that doesn't exist, so they
// share one shape instead: an optional real figure, a small set of
// direct-answer options per sub-part, and immediate right/wrong feedback
// with a one-line explanation — never a multi-step walkthrough. imageSrc is
// set for visual problems (the real graph) and omitted for fact-recall ones.
interface VisualQuestion {
  label: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// Analytical/argumentative problems (e.g. History's "Discuss" questions —
// "why did nationalist tensions emerge in the Balkans") have no single
// determinate answer — grading it right/wrong would misrepresent what's
// actually being assessed (rule 0's Analytical row). The student writes
// their own answer; an AI tutor judges it against the question's own real
// evaluative criteria and gives qualitative feedback — never a
// correct/incorrect verdict. `groundingNotes` are real facts/argument from
// the chapter that back the AI's grading — sent to the server as grading
// context, never shown to the student as "the answer."
interface Analytical {
  criteria: string[];
  groundingNotes: string;
  // Real cropped figures from the actual PDF (never described-but-unseen) —
  // many History questions literally say "describe this caricature/painting,"
  // which is meaningless without the image on screen. Was missing entirely
  // on the first pass (only `visual` had imageSrc) — real bug, real
  // screenshot: a question asking the student to describe a figure that
  // was never actually shown.
  imageSrc?: string;
  imageAlt?: string;
}

interface PracticeProblem {
  id: string;
  label: string;
  questionText: string;
  // Exactly one of steps/parts/visual/analytical is set per problem, never
  // more than one.
  steps?: PracticeStep[];
  parts?: PracticePart[];
  visual?: { imageSrc?: string; imageAlt?: string; questions: VisualQuestion[] };
  analytical?: Analytical;
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

// Chapter 2 — Polynomials (jemh102.pdf). "Geometrical meaning" (Example 1)
// and Exercise 2.1 are visual/perceptual — reading a zero-count directly off
// a real graph, nothing to derive — so they use `visual`, not `steps`/`parts`.
// Figures are the real Fig. 2.9 / Fig. 2.10 cropped straight from the PDF.
const GEOMETRICAL_MEANING_PROBLEMS: PracticeProblem[] = [
  {
    id: "example-1",
    label: "Example 1",
    questionText: "Look at the six graphs of y = p(x) below. For each, find the number of zeroes of p(x).",
    visual: {
      imageSrc: "/polynomials-fig-2-9.png",
      imageAlt: "Fig. 2.9 — six graphs of y = p(x)",
      questions: [
        { label: "(i)", prompt: "How many zeroes does graph (i) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "1", explanation: "The graph crosses the x-axis at exactly one point." },
        { label: "(ii)", prompt: "How many zeroes does graph (ii) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "2", explanation: "The graph crosses the x-axis at two points." },
        { label: "(iii)", prompt: "How many zeroes does graph (iii) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "3", explanation: "The graph crosses the x-axis at three points." },
        { label: "(iv)", prompt: "How many zeroes does graph (iv) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "1", explanation: "A straight line crosses the x-axis exactly once." },
        { label: "(v)", prompt: "How many zeroes does graph (v) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "1", explanation: "The parabola just touches the x-axis at its vertex — one repeated zero." },
        { label: "(vi)", prompt: "How many zeroes does graph (vi) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "4", explanation: "The graph crosses the x-axis at four points." },
      ],
    },
    verifyLine: "All six read directly off the graph — no algebra needed, just counting crossings ✓",
  },
];

const ZEROES_COEFF_QUADRATIC_PROBLEMS: PracticeProblem[] = [
  {
    id: "example-2",
    label: "Example 2",
    questionText: "Find the zeroes of the quadratic polynomial x² + 7x + 10, and verify the relationship between the zeroes and the coefficients.",
    steps: [
      { prompt: "Factorise x² + 7x + 10 by splitting the middle term.", answer: "x² + 7x + 10 = (x + 2)(x + 5)" },
      { prompt: "So what are the zeroes?", answer: "Zeroes: −2 and −5" },
      { prompt: "Verify: sum of zeroes vs −(coeff of x) ÷ (coeff of x²).", answer: "−2 + (−5) = −7 = −7 ÷ 1 ✓" },
      { prompt: "Verify: product of zeroes vs (constant term) ÷ (coeff of x²).", answer: "(−2)(−5) = 10 = 10 ÷ 1 ✓" },
    ],
    verifyLine: "Zeroes −2, −5 — both relationships confirmed ✓",
  },
  {
    id: "example-3",
    label: "Example 3",
    questionText: "Find the zeroes of the polynomial x² − 3, and verify the relationship between the zeroes and the coefficients.",
    steps: [
      { prompt: "Rewrite x² − 3 using a² − b² = (a − b)(a + b).", answer: "x² − 3 = (x − √3)(x + √3)" },
      { prompt: "So what are the zeroes?", answer: "Zeroes: √3 and −√3", trap: { wrongGuess: "x = √3 only", hint: "x² = 3 has two solutions, not one — don't drop the negative root: x = ±√3." } },
      { prompt: "Verify: sum of zeroes.", answer: "√3 + (−√3) = 0 = −(0) ÷ 1 ✓ (coefficient of x is 0)" },
      { prompt: "Verify: product of zeroes.", answer: "(√3)(−√3) = −3 = −3 ÷ 1 ✓" },
    ],
    verifyLine: "Zeroes √3, −√3 — both relationships confirmed ✓",
  },
  {
    id: "example-4",
    label: "Example 4",
    questionText: "Find a quadratic polynomial, the sum and product of whose zeroes are −3 and 2, respectively.",
    steps: [
      { prompt: "Write the two relationships α+β and αβ give you.", answer: "α + β = −3 = −b/a, αβ = 2 = c/a" },
      { prompt: "Pick a = 1 — what are b and c?", answer: "b = 3, c = 2" },
      { prompt: "So what's the polynomial?", answer: "x² + 3x + 2" },
    ],
    verifyLine: "x² + 3x + 2 has zeroes summing to −3 and multiplying to 2 ✓",
  },
];

const ZEROES_COEFF_CUBIC_PROBLEMS: PracticeProblem[] = [
  {
    id: "example-5",
    label: "Example 5",
    questionText: "Verify that 3, −1, −1⁄3 are the zeroes of the cubic polynomial p(x) = 3x³ − 5x² − 11x − 3, and then verify the relationship between the zeroes and the coefficients.",
    steps: [
      { prompt: "Check p(3) = 0.", answer: "p(3) = 3(27) − 5(9) − 11(3) − 3 = 81 − 45 − 33 − 3 = 0 ✓" },
      { prompt: "Check p(−1) = 0.", answer: "p(−1) = 3(−1) − 5(1) − 11(−1) − 3 = −3 − 5 + 11 − 3 = 0 ✓" },
      { prompt: "Check p(−1⁄3) = 0.", answer: "p(−1⁄3) = 3(−1⁄27) − 5(1⁄9) − 11(−1⁄3) − 3 = −1⁄9 − 5⁄9 + 33⁄9 − 27⁄9 = 0 ✓" },
      { prompt: "Verify α+β+γ = −b/a.", answer: "3 + (−1) + (−1⁄3) = 5⁄3 = −(−5) ÷ 3 ✓" },
      { prompt: "Verify αβ+βγ+γα = c/a.", answer: "3(−1) + (−1)(−1⁄3) + (−1⁄3)(3) = −3 + 1⁄3 − 1 = −11⁄3 = −11⁄3 ✓", trap: { wrongGuess: "−3 + 1⁄3 (stopping after two terms)", hint: "there are three pairs, not two — αβ, βγ, and γα, which wraps back around to multiply the last zero with the first." } },
      { prompt: "Verify αβγ = −d/a.", answer: "3 × (−1) × (−1⁄3) = 1 = −(−3) ÷ 3 ✓" },
    ],
    verifyLine: "All three zeroes verified, and all three coefficient relationships check out ✓",
  },
];

const EX_2_1_PROBLEMS: PracticeProblem[] = [
  {
    id: "ex2-1-q1",
    label: "Q1",
    questionText: "The graphs of y = p(x) are given below, for some polynomials p(x). Find the number of zeroes of p(x) in each case.",
    visual: {
      imageSrc: "/polynomials-fig-2-10.png",
      imageAlt: "Fig. 2.10 — six graphs of y = p(x)",
      questions: [
        { label: "(i)", prompt: "How many zeroes does graph (i) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "0", explanation: "The graph never touches the x-axis." },
        { label: "(ii)", prompt: "How many zeroes does graph (ii) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "1", explanation: "The graph crosses the x-axis at exactly one point." },
        { label: "(iii)", prompt: "How many zeroes does graph (iii) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "3", explanation: "The graph crosses the x-axis at three points." },
        { label: "(iv)", prompt: "How many zeroes does graph (iv) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "2", explanation: "The graph crosses the x-axis at two points." },
        { label: "(v)", prompt: "How many zeroes does graph (v) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "4", explanation: "The graph crosses the x-axis at four points." },
        { label: "(vi)", prompt: "How many zeroes does graph (vi) show?", options: ["0", "1", "2", "3", "4"], correctAnswer: "3", explanation: "The graph crosses the x-axis at three points." },
      ],
    },
    verifyLine: "All six zero-counts confirmed ✓",
  },
];

const EX_2_2_PROBLEMS: PracticeProblem[] = [
  {
    id: "ex2-2-q1",
    label: "Q1",
    questionText: "Find the zeroes of the following quadratic polynomials and verify the relationship between the zeroes and the coefficients: (i) x²−2x−8 (ii) 4s²−4s+1 (iii) 6x²−3−7x (iv) 4u²+8u (v) t²−15 (vi) 3x²−x−4",
    parts: [
      { label: "(i)", steps: [
        { prompt: "Factorise x² − 2x − 8.", answer: "x² − 2x − 8 = (x − 4)(x + 2)" },
        { prompt: "Zeroes and verification?", answer: "Zeroes: 4, −2. Sum = 2 = −(−2)÷1 ✓, Product = −8 = −8÷1 ✓" },
      ] },
      { label: "(ii)", steps: [
        { prompt: "Factorise 4s² − 4s + 1.", answer: "4s² − 4s + 1 = (2s − 1)²" },
        { prompt: "Zeroes and verification?", answer: "Zero: 1⁄2 (repeated). Sum = 1 = −(−4)÷4 ✓, Product = 1⁄4 = 1÷4 ✓" },
      ] },
      { label: "(iii)", steps: [
        { prompt: "Rewrite 6x² − 3 − 7x in standard form, then factorise.", answer: "6x² − 7x − 3 = (3x + 1)(2x − 3)", trap: { wrongGuess: "6x² − 7x − 3 = (6x + 1)(x − 3)", hint: "expand that back out: 6x² − 18x + x − 3 = 6x² − 17x − 3 — wrong middle term. Split −7x as −9x + 2x instead." } },
        { prompt: "Zeroes and verification?", answer: "Zeroes: −1⁄3, 3⁄2. Sum = 7⁄6 = −(−7)÷6 ✓, Product = −1⁄2 = −3÷6 ✓" },
      ] },
      { label: "(iv)", steps: [
        { prompt: "Factorise 4u² + 8u.", answer: "4u² + 8u = 4u(u + 2)" },
        { prompt: "Zeroes and verification?", answer: "Zeroes: 0, −2. Sum = −2 = −8÷4 ✓, Product = 0 = 0÷4 ✓" },
      ] },
      { label: "(v)", steps: [
        { prompt: "Factorise t² − 15.", answer: "t² − 15 = (t − √15)(t + √15)" },
        { prompt: "Zeroes and verification?", answer: "Zeroes: √15, −√15. Sum = 0 = −(0)÷1 ✓, Product = −15 = −15÷1 ✓" },
      ] },
      { label: "(vi)", steps: [
        { prompt: "Factorise 3x² − x − 4.", answer: "3x² − x − 4 = (3x − 4)(x + 1)" },
        { prompt: "Zeroes and verification?", answer: "Zeroes: 4⁄3, −1. Sum = 1⁄3 = −(−1)÷3 ✓, Product = −4⁄3 = −4÷3 ✓" },
      ] },
    ],
    verifyLine: "All six pairs verified: sum and product both match the coefficient relationships ✓",
  },
  {
    id: "ex2-2-q2",
    label: "Q2",
    questionText: "Find a quadratic polynomial each with the given numbers as the sum and product of its zeroes, respectively: (i) 1⁄4, −1 (ii) √2, 1⁄3 (iii) 0, √5 (iv) 1, 1 (v) −1⁄4, 1⁄4 (vi) 4, 1",
    parts: [
      { label: "(i)", steps: [
        { prompt: "Write x² − (sum)x + (product), then clear the fraction.", answer: "x² − (1⁄4)x + (−1) → ×4 → 4x² − x − 4" },
      ] },
      { label: "(ii)", steps: [
        { prompt: "Write x² − (sum)x + (product), then clear the fraction.", answer: "x² − √2x + 1⁄3 → ×3 → 3x² − 3√2x + 1" },
      ] },
      { label: "(iii)", steps: [
        { prompt: "Write x² − (sum)x + (product).", answer: "x² − 0x + √5 = x² + √5" },
      ] },
      { label: "(iv)", steps: [
        { prompt: "Write x² − (sum)x + (product).", answer: "x² − x + 1" },
      ] },
      { label: "(v)", steps: [
        { prompt: "Write x² − (sum)x + (product), then clear the fraction.", answer: "x² − (−1⁄4)x + 1⁄4 = x² + (1⁄4)x + 1⁄4 → ×4 → 4x² + x + 1", trap: { wrongGuess: "4x² − x + 1", hint: "sum = −1⁄4, so −(sum) = +1⁄4 — the double negative flips the middle term's sign, don't drop it." } },
      ] },
      { label: "(vi)", steps: [
        { prompt: "Write x² − (sum)x + (product).", answer: "x² − 4x + 1" },
      ] },
    ],
    verifyLine: "All six quadratics match the given sum and product ✓",
  },
];

// Science — Chapter 1, "Chemical Reactions and Equations" (jesc101.pdf).
// Sample-chapter scope, matching the taxonomy: balancing is procedural (same
// step/parts shape as Maths); classifying a reaction or naming what's
// oxidised/reduced is fact-recall — no derivation exists for "what type is
// this," so these reuse the same direct-answer `visual` shape as Ch.2's
// graph-reading problems, just without an image.
// A concept topic's own Practice is reserved for the SAME worked example
// already shown in its Explain screen (rule 1) — the real inline "QUESTIONS"
// box under section 1.1 is a separate, distinct block in the book (rule 3a)
// and gets its own standalone topic below (SECTION_1_1_QUESTIONS_PROBLEMS),
// not folded in here.
const BALANCING_EQUATIONS_PROBLEMS: PracticeProblem[] = [
  {
    id: "balancing-fe-h2o",
    label: "Worked example",
    questionText: "Balance the chemical equation: Fe + H₂O → Fe₃O₄ + H₂",
    steps: [
      { prompt: "Count atoms of each element on both sides — is it balanced?", answer: "Fe: 1 vs 3, H: 2 vs 2, O: 1 vs 4 — Fe and O don't match" },
      { prompt: "Start with the element that has the most atoms — balance oxygen first.", answer: "4 O atoms on the right (in Fe₃O₄), only 1 on the left (in H₂O) — put 4 in front of H₂O" },
      { prompt: "That changes the H count — rebalance hydrogen.", answer: "4H₂O now has 8 H on the left — put 4 in front of H₂ on the right", trap: { wrongGuess: "put 4 in front of H₂O only, leave H₂ as is", hint: "changing H₂O's coefficient changes how many H atoms are on the left — the right side needs to match too, so H₂ needs a 4 as well." } },
      { prompt: "One element left — balance iron.", answer: "3 Fe atoms on the right (in Fe₃O₄), only 1 on the left — put 3 in front of Fe" },
      { prompt: "Final balanced equation?", answer: "3Fe + 4H₂O → Fe₃O₄ + 4H₂" },
    ],
    verifyLine: "3 Fe, 8 H, 4 O on both sides — balanced ✓",
  },
];

// The real inline "QUESTIONS" box under section 1.1 (jesc101.pdf p.6) — three
// real questions, all three used (rule 3): Q1 is fact-recall (no derivation
// exists for "why clean the ribbon"), Q2/Q3 are procedural.
const SECTION_1_1_QUESTIONS_PROBLEMS: PracticeProblem[] = [
  {
    id: "sec1-1-q1",
    label: "Q1",
    questionText: "Why should a magnesium ribbon be cleaned before burning in air?",
    visual: {
      questions: [
        {
          label: "Q1",
          prompt: "Why should a magnesium ribbon be cleaned before burning in air?",
          options: [
            "To remove the layer of magnesium oxide that would prevent it from burning properly",
            "To remove moisture that could cause the metal to explode",
            "It's just a lab safety precaution — there's no chemical reason",
            "To make the flame burn a different colour",
          ],
          correctAnswer: "To remove the layer of magnesium oxide that would prevent it from burning properly",
          explanation: "Magnesium reacts slowly with atmospheric oxygen even at room temperature, forming a thin coating of magnesium oxide on its surface. That layer is unreactive and stops the metal underneath from burning cleanly — sandpaper removes it so the fresh metal can react properly.",
        },
      ],
    },
    verifyLine: "Cleaning removes the oxide coating so the metal actually burns ✓",
  },
  {
    id: "sec1-1-q2",
    label: "Q2",
    questionText: "Write the balanced equation for the following chemical reactions: (i) Hydrogen + Chlorine → Hydrogen chloride (ii) Barium chloride + Aluminium sulphate → Barium sulphate + Aluminium chloride (iii) Sodium + Water → Sodium hydroxide + Hydrogen",
    parts: [
      { label: "(i)", steps: [
        { prompt: "Write the skeletal equation.", answer: "H₂ + Cl₂ → HCl" },
        { prompt: "Count atoms — what needs balancing?", answer: "2 H and 2 Cl on the left, only 1 each on the right — put 2 in front of HCl" },
        { prompt: "Balanced equation?", answer: "H₂ + Cl₂ → 2HCl" },
      ] },
      { label: "(ii)", steps: [
        { prompt: "Write the skeletal equation.", answer: "BaCl₂ + Al₂(SO₄)₃ → BaSO₄ + AlCl₃" },
        { prompt: "Which compound has the most atoms to track? Start there.", answer: "Al₂(SO₄)₃ has 2 Al and 3 SO₄ groups — put 3 in front of BaSO₄ and 2 in front of AlCl₃", trap: { wrongGuess: "balance Ba first since it's written first", hint: "starting with the compound that has the most atoms (Al₂(SO₄)₃) is easier — Ba and Cl fall into place once that's fixed." } },
        { prompt: "Now balance Ba and Cl to match.", answer: "3 Ba needs 3 BaCl₂ on the left; Cl: 3×2=6 on the left, 2×3=6 on the right ✓" },
        { prompt: "Balanced equation?", answer: "3BaCl₂ + Al₂(SO₄)₃ → 3BaSO₄ + 2AlCl₃" },
      ] },
      { label: "(iii)", steps: [
        { prompt: "Write the skeletal equation.", answer: "Na + H₂O → NaOH + H₂" },
        { prompt: "Count atoms — what needs balancing?", answer: "1 Na, 2 H, 1 O on the left vs 1 Na, 3 H, 1 O on the right — H doesn't match" },
        { prompt: "Balance by doubling Na and H₂O.", answer: "2Na + 2H₂O → 2NaOH + H₂" },
      ] },
    ],
    verifyLine: "All three reactions balanced — atom counts match on both sides ✓",
  },
  {
    id: "sec1-1-q3",
    label: "Q3",
    questionText: "Write a balanced chemical equation with state symbols for the following reactions: (i) Solutions of barium chloride and sodium sulphate in water react to give insoluble barium sulphate and the solution of sodium chloride. (ii) Sodium hydroxide solution reacts with hydrochloric acid solution to produce sodium chloride solution and water.",
    parts: [
      { label: "(i)", steps: [
        { prompt: "Write the skeletal equation with formulae.", answer: "BaCl₂ + Na₂SO₄ → BaSO₄ + NaCl" },
        { prompt: "Count atoms — what needs balancing?", answer: "2 Na and 2 Cl on the left need matching on the right — put 2 in front of NaCl" },
        { prompt: "Add state symbols — which reactants are dissolved, and which product is insoluble?", answer: "BaCl₂(aq) + Na₂SO₄(aq) → BaSO₄(s) + 2NaCl(aq)", trap: { wrongGuess: "BaSO₄(aq)", hint: "the question says barium sulphate is insoluble — an insoluble solid gets (s), not (aq)." } },
      ] },
      { label: "(ii)", steps: [
        { prompt: "Write the skeletal equation with formulae.", answer: "NaOH + HCl → NaCl + H₂O" },
        { prompt: "Count atoms — is it already balanced?", answer: "1 Na, 1 Cl, 2 H, 1 O on both sides — already balanced 1:1:1:1" },
        { prompt: "Add state symbols — both reactants are solutions.", answer: "NaOH(aq) + HCl(aq) → NaCl(aq) + H₂O(l)" },
      ] },
    ],
    verifyLine: "Both equations balanced with the correct state symbols ✓",
  },
];

// A concept topic's own Practice is reserved for the SAME worked example
// already shown in its Explain screen (rule 1) — the real end-of-chapter
// "EXERCISES" section is a separate, distinct block in the book (rule 3a)
// and gets its own standalone topic below (CHAPTER_1_EXERCISES_PROBLEMS),
// not folded in here.
const REACTION_TYPES_REDOX_PROBLEMS: PracticeProblem[] = [
  {
    id: "identify-oxidised-reduced",
    label: "Worked example",
    questionText: "In the reaction CuO(s) + H₂(g) → Cu(s) + H₂O(l), identify which substance is oxidised and which is reduced.",
    visual: {
      questions: [
        { label: "CuO", prompt: "What happens to CuO in this reaction?", options: ["Oxidised", "Reduced"], correctAnswer: "Reduced", explanation: "CuO loses oxygen (becomes Cu) — losing oxygen means it's reduced." },
        { label: "H₂", prompt: "What happens to H₂ in this reaction?", options: ["Oxidised", "Reduced"], correctAnswer: "Oxidised", explanation: "H₂ gains oxygen (becomes H₂O) — gaining oxygen means it's oxidised." },
      ],
    },
    verifyLine: "CuO is reduced, H₂ is oxidised — this is a redox reaction ✓",
  },
];

// Real end-of-chapter "EXERCISES" section (jesc101.pdf pp.14-16) — all 20
// real questions. Q1-3 are the book's own MCQs, cross-checked against the
// official answer key (jesc1an.pdf: 1.(i) 2.(d) 3.(a)). Q4-17 have no answer
// key (NCERT only keys MCQs) — each is derived/verified independently here:
// every equation atom-counted, every reaction type matched to the chapter's
// own definitions. Several deliberately reuse real reactions already shown
// elsewhere in this chapter as their example (Q16, Q17) — per rule 3b, a
// citation being used elsewhere doesn't disqualify it from being the correct,
// real answer to a different question that asks for one.
const CHAPTER_1_EXERCISES_PROBLEMS: PracticeProblem[] = [
  {
    id: "reaction-classification",
    label: "Q1–Q2",
    questionText: "Classify each of the following real reactions.",
    visual: {
      questions: [
        { label: "(i)", prompt: "2PbO(s) + C(s) → 2Pb(s) + CO₂(g). Which statements about this reaction are incorrect? (a) Lead is getting reduced (b) Carbon dioxide is getting oxidised (c) Carbon is getting oxidised (d) Lead oxide is getting reduced", options: ["(a) and (b)", "(a) and (c)", "(a), (b) and (c)", "all four"], correctAnswer: "(a) and (b)", explanation: "PbO loses oxygen, so lead OXIDE is reduced (d is correct) — saying 'lead' itself is reduced (a) misattributes it. Carbon gains oxygen, so CARBON is oxidised (c is correct) — CO₂ is already the oxidised product, it doesn't 'get oxidised' (b is wrong)." },
        { label: "(ii)", prompt: "Fe₂O₃(s) + 2Al(s) → Al₂O₃(s) + 2Fe(s) — what type of reaction is this?", options: ["Combination", "Double displacement", "Decomposition", "Displacement"], correctAnswer: "Displacement", explanation: "Aluminium is more reactive than iron, so it displaces iron from its oxide — this is the classic thermite reaction." },
      ],
    },
    verifyLine: "Both classifications confirmed ✓ (matches official answer key: 1.(i), 2.(d))",
  },
  {
    id: "hcl-iron-filings",
    label: "Q3",
    questionText: "What happens when dilute hydrochloric acid is added to iron fillings? Tick the correct answer.",
    visual: {
      questions: [
        {
          label: "Q3",
          prompt: "What happens when dilute HCl is added to iron filings?",
          options: [
            "Hydrogen gas and iron chloride are produced",
            "Chlorine gas and iron hydroxide are produced",
            "No reaction takes place",
            "Iron salt and water are produced",
          ],
          correctAnswer: "Hydrogen gas and iron chloride are produced",
          explanation: "Fe(s) + 2HCl(aq) → FeCl₂(aq) + H₂(g) — iron, being more reactive than hydrogen, displaces it from the acid, producing iron(II) chloride and hydrogen gas.",
        },
      ],
    },
    verifyLine: "Fe + 2HCl → FeCl₂ + H₂ — matches official answer key: 3.(a) ✓",
  },
  {
    id: "balanced-equation-why",
    label: "Q4",
    questionText: "What is a balanced chemical equation? Why should chemical equations be balanced?",
    parts: [
      { label: "What is it?", steps: [
        { prompt: "What is a balanced chemical equation?", answer: "A chemical equation where the number of atoms of each element is the same on both the reactant side and the product side" },
      ] },
      { label: "Why balance?", steps: [
        { prompt: "Why must a chemical equation be balanced?", answer: "Because of the law of conservation of mass — matter can neither be created nor destroyed in a chemical reaction, so every atom present in the reactants must still be present in the products. An unbalanced equation would imply atoms appeared or vanished, which isn't physically possible." },
      ] },
    ],
    verifyLine: "Equal atom counts on both sides, required by conservation of mass ✓",
  },
  {
    id: "translate-and-balance",
    label: "Q5",
    questionText: "Translate the following statements into chemical equations and then balance them.",
    parts: [
      { label: "(a) Hydrogen + Nitrogen → Ammonia", steps: [
        { prompt: "Write the skeletal equation.", answer: "H₂ + N₂ → NH₃" },
        { prompt: "Count atoms — what needs balancing?", answer: "2 N on the left needs 2 NH₃ on the right, which then needs 6 H — so 3 H₂ on the left" },
        { prompt: "Balanced equation?", answer: "3H₂ + N₂ → 2NH₃" },
      ] },
      { label: "(b) Hydrogen sulphide + air → Water + Sulphur dioxide", steps: [
        { prompt: "Write the skeletal equation.", answer: "H₂S + O₂ → H₂O + SO₂" },
        { prompt: "Count atoms — what needs balancing?", answer: "Balance S first: 2H₂S gives 2 S, needs 2 SO₂. That needs 4 H → 2 H₂O. Total O needed: 2(H₂O)+4(SO₂)=6 O, from 3 O₂", trap: { wrongGuess: "balance oxygen first", hint: "sulphur only appears once per molecule on each side — fixing S first (via H₂S) locks in how much H₂O and SO₂ you need, and O falls out from that." } },
        { prompt: "Balanced equation?", answer: "2H₂S + 3O₂ → 2H₂O + 2SO₂" },
      ] },
      { label: "(c) Barium chloride + Aluminium sulphate → Aluminium chloride + Barium sulphate precipitate", steps: [
        { prompt: "Write the skeletal equation.", answer: "BaCl₂ + Al₂(SO₄)₃ → AlCl₃ + BaSO₄" },
        { prompt: "Which compound has the most atoms to track? Start there.", answer: "Al₂(SO₄)₃ has 2 Al and 3 SO₄ groups — put 3 in front of BaSO₄ and 2 in front of AlCl₃" },
        { prompt: "Now balance Ba and Cl to match.", answer: "3 BaSO₄ needs 3 Ba, so 3 BaCl₂ on the left; that gives 6 Cl, matching 2×3=6 Cl in 2AlCl₃" },
        { prompt: "Balanced equation?", answer: "3BaCl₂ + Al₂(SO₄)₃ → 2AlCl₃ + 3BaSO₄(s)" },
      ] },
      { label: "(d) Potassium + Water → Potassium hydroxide + Hydrogen", steps: [
        { prompt: "Write the skeletal equation.", answer: "K + H₂O → KOH + H₂" },
        { prompt: "Count atoms — what needs balancing?", answer: "1 K, 2 H, 1 O on the left vs 1 K, 3 H, 1 O on the right — H doesn't match" },
        { prompt: "Balance by doubling K and H₂O.", answer: "2K + 2H₂O → 2KOH + H₂" },
      ] },
    ],
    verifyLine: "All four reactions translated and balanced — atom counts match on both sides ✓",
  },
  {
    id: "balance-only-1",
    label: "Q6",
    questionText: "Balance the following chemical equations.",
    parts: [
      { label: "(a) HNO₃ + Ca(OH)₂ → Ca(NO₃)₂ + H₂O", steps: [
        { prompt: "Count atoms — what needs balancing?", answer: "1 H, 1 N, 3 O (HNO₃) vs 1 Ca, 2 O, 2 H (Ca(OH)₂) on the left; N and H don't match the right side yet" },
        { prompt: "Balance by doubling HNO₃ and H₂O.", answer: "2HNO₃ + Ca(OH)₂ → Ca(NO₃)₂ + 2H₂O" },
      ] },
      { label: "(b) NaOH + H₂SO₄ → Na₂SO₄ + H₂O", steps: [
        { prompt: "Count atoms — what needs balancing?", answer: "1 Na on the left, 2 Na needed on the right (Na₂SO₄) — double NaOH, which then needs 2 H₂O" },
        { prompt: "Balanced equation?", answer: "2NaOH + H₂SO₄ → Na₂SO₄ + 2H₂O" },
      ] },
      { label: "(c) NaCl + AgNO₃ → AgCl + NaNO₃", steps: [
        { prompt: "Count atoms — is it already balanced?", answer: "1 Na, 1 Cl, 1 Ag, 1 N, 3 O on both sides — already balanced 1:1:1:1", trap: { wrongGuess: "it needs a coefficient somewhere", hint: "count every atom before assuming a reaction needs balancing — a straight 1-to-1 swap of ions, like this one, is sometimes already balanced as written." } },
      ] },
      { label: "(d) BaCl₂ + H₂SO₄ → BaSO₄ + HCl", steps: [
        { prompt: "Count atoms — what needs balancing?", answer: "2 Cl on the left, only 1 in HCl on the right — double HCl" },
        { prompt: "Balanced equation?", answer: "BaCl₂ + H₂SO₄ → BaSO₄ + 2HCl" },
      ] },
    ],
    verifyLine: "All four equations balanced ✓",
  },
  {
    id: "balance-only-2",
    label: "Q7",
    questionText: "Write the balanced chemical equations for the following reactions.",
    parts: [
      { label: "(a) Calcium hydroxide + Carbon dioxide → Calcium carbonate + Water", steps: [
        { prompt: "Write the equation and check if it's balanced.", answer: "Ca(OH)₂ + CO₂ → CaCO₃ + H₂O — already balanced 1:1:1:1 (1 Ca, 2 O+2 O=4 O total, 2 H, 1 C on each side)" },
      ] },
      { label: "(b) Zinc + Silver nitrate → Zinc nitrate + Silver", steps: [
        { prompt: "Write the skeletal equation.", answer: "Zn + AgNO₃ → Zn(NO₃)₂ + Ag" },
        { prompt: "Count atoms — what needs balancing?", answer: "Zn(NO₃)₂ needs 2 NO₃ groups — double AgNO₃, which then gives 2 Ag" },
        { prompt: "Balanced equation?", answer: "Zn + 2AgNO₃ → Zn(NO₃)₂ + 2Ag" },
      ] },
      { label: "(c) Aluminium + Copper chloride → Aluminium chloride + Copper", steps: [
        { prompt: "Write the skeletal equation.", answer: "Al + CuCl₂ → AlCl₃ + Cu" },
        { prompt: "Count atoms — what needs balancing?", answer: "AlCl₃ needs 3 Cl, CuCl₂ only supplies 2 per unit — take 3 CuCl₂ (6 Cl) and 2 AlCl₃ (6 Cl) so Cl matches" },
        { prompt: "Balanced equation?", answer: "2Al + 3CuCl₂ → 2AlCl₃ + 3Cu" },
      ] },
      { label: "(d) Barium chloride + Potassium sulphate → Barium sulphate + Potassium chloride", steps: [
        { prompt: "Write the skeletal equation.", answer: "BaCl₂ + K₂SO₄ → BaSO₄ + KCl" },
        { prompt: "Count atoms — what needs balancing?", answer: "2 K on the left needs 2 KCl on the right, which then needs 2 Cl — matching BaCl₂'s 2 Cl" },
        { prompt: "Balanced equation?", answer: "BaCl₂ + K₂SO₄ → BaSO₄ + 2KCl" },
      ] },
    ],
    verifyLine: "All four equations written and balanced ✓",
  },
  {
    id: "balance-and-classify",
    label: "Q8",
    questionText: "Write the balanced chemical equation for the following and identify the type of reaction in each case.",
    visual: {
      questions: [
        { label: "(a)", prompt: "Potassium bromide(aq) + Barium iodide(aq) → Potassium iodide(aq) + Barium bromide(s). Balanced equation: 2KBr + BaI₂ → 2KI + BaBr₂. What type of reaction is this?", options: ["Double displacement", "Displacement", "Combination", "Decomposition"], correctAnswer: "Double displacement", explanation: "Potassium and barium ions swap partners — bromide and iodide exchange between the two compounds, and BaBr₂ forms as an insoluble product." },
        { label: "(b)", prompt: "Zinc carbonate(s) → Zinc oxide(s) + Carbon dioxide(g). Already balanced 1:1:1. What type of reaction is this?", options: ["Decomposition", "Combination", "Displacement", "Double displacement"], correctAnswer: "Decomposition", explanation: "A single compound (ZnCO₃) breaks down into two simpler substances (ZnO and CO₂) — the defining feature of a decomposition reaction, same pattern as CaCO₃ → CaO + CO₂." },
        { label: "(c)", prompt: "Hydrogen(g) + Chlorine(g) → Hydrogen chloride(g). Balanced equation: H₂ + Cl₂ → 2HCl. What type of reaction is this?", options: ["Combination", "Decomposition", "Displacement", "Double displacement"], correctAnswer: "Combination", explanation: "Two elements join to form a single new product — the defining feature of a combination reaction." },
        { label: "(d)", prompt: "Magnesium(s) + Hydrochloric acid(aq) → Magnesium chloride(aq) + Hydrogen(g). Balanced equation: Mg + 2HCl → MgCl₂ + H₂. What type of reaction is this?", options: ["Displacement", "Double displacement", "Combination", "Decomposition"], correctAnswer: "Displacement", explanation: "Magnesium, being more reactive than hydrogen, displaces it out of the acid — one element replacing another in a compound." },
      ],
    },
    verifyLine: "All four balanced and classified ✓",
  },
  {
    id: "exo-endo-thermic",
    label: "Q9",
    questionText: "What does one mean by exothermic and endothermic reactions? Give examples.",
    parts: [
      { label: "Exothermic", steps: [
        { prompt: "What is an exothermic reaction?", answer: "A reaction that releases heat along with the products" },
        { prompt: "Give real examples from this chapter.", answer: "CaO(s) + H₂O(l) → Ca(OH)₂(aq) + Heat (Activity 1.4), and burning of natural gas: CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g)" },
      ] },
      { label: "Endothermic", steps: [
        { prompt: "What is an endothermic reaction?", answer: "A reaction in which energy is absorbed, usually as heat, light, or electricity" },
        { prompt: "Give real examples from this chapter.", answer: "Electrolysis of water: 2H₂O(l) --electricity--> 2H₂(g) + O₂(g) (Activity 1.7), and decomposition of silver chloride in sunlight: 2AgCl(s) --sunlight--> 2Ag(s) + Cl₂(g) (Activity 1.8)" },
      ] },
    ],
    verifyLine: "Exothermic releases heat, endothermic absorbs it — both illustrated with real chapter reactions ✓",
  },
  {
    id: "respiration-exothermic",
    label: "Q10",
    questionText: "Why is respiration considered an exothermic reaction? Explain.",
    parts: [
      { label: "Explain", steps: [
        { prompt: "What happens chemically during respiration?", answer: "Glucose from digested food combines with oxygen in the body's cells: C₆H₁₂O₆(aq) + 6O₂(aq) → 6CO₂(aq) + 6H₂O(l) + energy" },
        { prompt: "Why does that make it exothermic?", answer: "The reaction releases energy as one of its products — that's the definition of exothermic. This is the energy the body actually uses to stay alive." },
      ] },
    ],
    verifyLine: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy — energy is released, so respiration is exothermic ✓",
  },
  {
    id: "decomposition-opposite",
    label: "Q11",
    questionText: "Why are decomposition reactions called the opposite of combination reactions? Write equations for these reactions.",
    parts: [
      { label: "Why opposite?", steps: [
        { prompt: "What does a combination reaction do?", answer: "Two or more substances combine to form a single new product: A + B → AB" },
        { prompt: "What does a decomposition reaction do?", answer: "A single substance breaks down into two or more simpler substances: AB → A + B — the exact reverse direction of a combination reaction" },
      ] },
      { label: "Equations", steps: [
        { prompt: "Give a real combination example.", answer: "CaO(s) + H₂O(l) → Ca(OH)₂(aq) + Heat" },
        { prompt: "Give a real decomposition example.", answer: "CaCO₃(s) --heat--> CaO(s) + CO₂(g)" },
      ] },
    ],
    verifyLine: "Combination joins substances; decomposition breaks one apart — literally reverse patterns ✓",
  },
  {
    id: "decomposition-energy-forms",
    label: "Q12",
    questionText: "Write one equation each for decomposition reactions where energy is supplied in the form of heat, light or electricity.",
    visual: {
      questions: [
        { label: "Heat", prompt: "Which real reaction from this chapter is a decomposition driven by heat?", options: ["2FeSO₄(s) --heat--> Fe₂O₃(s) + SO₂(g) + SO₃(g)", "2AgCl(s) --sunlight--> 2Ag(s) + Cl₂(g)", "2H₂O(l) --electricity--> 2H₂(g) + O₂(g)", "CaO(s) + H₂O(l) → Ca(OH)₂(aq)"], correctAnswer: "2FeSO₄(s) --heat--> Fe₂O₃(s) + SO₂(g) + SO₃(g)", explanation: "Heating ferrous sulphate crystals (Activity 1.5) breaks them down into ferric oxide, sulphur dioxide, and sulphur trioxide." },
        { label: "Light", prompt: "Which real reaction from this chapter is a decomposition driven by light?", options: ["2AgCl(s) --sunlight--> 2Ag(s) + Cl₂(g)", "2FeSO₄(s) --heat--> Fe₂O₃(s) + SO₂(g) + SO₃(g)", "2H₂O(l) --electricity--> 2H₂(g) + O₂(g)", "Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s)"], correctAnswer: "2AgCl(s) --sunlight--> 2Ag(s) + Cl₂(g)", explanation: "Silver chloride left in sunlight (Activity 1.8) decomposes into silver and chlorine — the reaction black-and-white photography relies on." },
        { label: "Electricity", prompt: "Which real reaction from this chapter is a decomposition driven by electricity?", options: ["2H₂O(l) --electricity--> 2H₂(g) + O₂(g)", "2AgCl(s) --sunlight--> 2Ag(s) + Cl₂(g)", "2FeSO₄(s) --heat--> Fe₂O₃(s) + SO₂(g) + SO₃(g)", "Zn(s) + CuSO₄(aq) → ZnSO₄(aq) + Cu(s)"], correctAnswer: "2H₂O(l) --electricity--> 2H₂(g) + O₂(g)", explanation: "Passing electricity through water (Activity 1.7) splits it into hydrogen and oxygen gas." },
      ],
    },
    verifyLine: "Heat → FeSO₄ decomposition, Light → AgCl decomposition, Electricity → electrolysis of water ✓",
  },
  {
    id: "displacement-vs-double",
    label: "Q13",
    questionText: "What is the difference between displacement and double displacement reactions? Write equations for these reactions.",
    parts: [
      { label: "Difference", steps: [
        { prompt: "What happens in a displacement reaction?", answer: "One element replaces another element in a compound — only one thing gets swapped out" },
        { prompt: "What happens in a double displacement reaction?", answer: "Two compounds exchange ions with each other — both partners swap at once, usually producing a precipitate" },
      ] },
      { label: "Equations", steps: [
        { prompt: "Give a real displacement example.", answer: "Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s) (Activity 1.9) — iron displaces copper" },
        { prompt: "Give a real double displacement example.", answer: "Na₂SO₄(aq) + BaCl₂(aq) → BaSO₄(s) + 2NaCl(aq) (Activity 1.10) — sodium and barium ions swap partners" },
      ] },
    ],
    verifyLine: "Displacement swaps one element; double displacement swaps ions between two compounds ✓",
  },
  {
    id: "silver-refining",
    label: "Q14",
    questionText: "In the refining of silver, the recovery of silver from silver nitrate solution involved displacement by copper metal. Write down the reaction involved.",
    parts: [
      { label: "Reaction", steps: [
        { prompt: "Write the skeletal equation.", answer: "Cu(s) + AgNO₃(aq) → Cu(NO₃)₂(aq) + Ag(s)" },
        { prompt: "Count atoms — what needs balancing?", answer: "Cu(NO₃)₂ needs 2 NO₃ groups — double AgNO₃, which then gives 2 Ag" },
        { prompt: "Balanced equation?", answer: "Cu(s) + 2AgNO₃(aq) → Cu(NO₃)₂(aq) + 2Ag(s)" },
      ] },
    ],
    verifyLine: "Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag — copper, more reactive than silver, displaces it ✓",
  },
  {
    id: "precipitation-reaction",
    label: "Q15",
    questionText: "What do you mean by a precipitation reaction? Explain by giving examples.",
    parts: [
      { label: "Explain", steps: [
        { prompt: "What is a precipitation reaction?", answer: "A reaction in which an insoluble solid (a precipitate) forms and separates out of the solution — any reaction producing such a solid can be called a precipitation reaction" },
        { prompt: "Give real examples from this chapter.", answer: "Na₂SO₄(aq) + BaCl₂(aq) → BaSO₄(s) + 2NaCl(aq) (Activity 1.10, white precipitate), and Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s) + 2KNO₃(aq) (Activity 1.2, yellow precipitate)" },
      ] },
    ],
    verifyLine: "BaSO₄ and PbI₂ — both real, insoluble precipitates from this chapter's own activities ✓",
  },
  {
    id: "oxidation-reduction-terms",
    label: "Q16",
    questionText: "Explain the following in terms of gain or loss of oxygen with two examples each. (a) Oxidation (b) Reduction",
    parts: [
      { label: "(a) Oxidation", steps: [
        { prompt: "What is oxidation, in terms of oxygen?", answer: "The gain of oxygen by a substance during a reaction" },
        { prompt: "Give two real examples.", answer: "2Cu(s) + O₂(g) --heat--> 2CuO(s) (Activity 1.11 — copper gains oxygen), and 4Na(s) + O₂(g) → 2Na₂O(s) (sodium gains oxygen)" },
      ] },
      { label: "(b) Reduction", steps: [
        { prompt: "What is reduction, in terms of oxygen?", answer: "The loss of oxygen by a substance during a reaction" },
        { prompt: "Give two real examples.", answer: "CuO(s) + H₂(g) --heat--> Cu(s) + H₂O(l) (CuO loses oxygen), and 2PbO(s) + C(s) → 2Pb(s) + CO₂(g) (PbO loses oxygen — same reaction as Q1)" },
      ] },
    ],
    verifyLine: "Oxidation = gains oxygen (Cu, Na examples); Reduction = loses oxygen (CuO, PbO examples) ✓",
  },
  {
    id: "shiny-brown-element",
    label: "Q17",
    questionText: "A shiny brown coloured element 'X' on heating in air becomes black in colour. Name the element 'X' and the black coloured compound formed.",
    visual: {
      questions: [
        {
          label: "Q17",
          prompt: "Which shiny brown element turns black when heated in air, and what's the black compound?",
          options: [
            "X = Copper (Cu); black compound = Copper(II) oxide, CuO",
            "X = Iron (Fe); black compound = Iron(III) oxide, Fe₂O₃",
            "X = Zinc (Zn); black compound = Zinc oxide, ZnO",
            "X = Lead (Pb); black compound = Lead oxide, PbO",
          ],
          correctAnswer: "X = Copper (Cu); black compound = Copper(II) oxide, CuO",
          explanation: "This is Activity 1.11: 2Cu(s) + O₂(g) --heat--> 2CuO(s). Shiny brown copper reacts with atmospheric oxygen on heating and its surface becomes coated with black copper(II) oxide.",
        },
      ],
    },
    verifyLine: "X = Copper; 2Cu + O₂ → 2CuO gives the black coating ✓",
  },
  {
    id: "paint-on-iron",
    label: "Q18",
    questionText: "Why do we apply paint on iron articles?",
    visual: {
      questions: [
        {
          label: "Q18",
          prompt: "Why do we apply paint on iron articles?",
          options: [
            "To prevent rusting — paint keeps out the air and moisture iron needs to corrode",
            "To make the metal stronger",
            "To make the surface conduct electricity better",
            "It's purely decorative, with no chemical reason",
          ],
          correctAnswer: "To prevent rusting — paint keeps out the air and moisture iron needs to corrode",
          explanation: "Rusting needs both oxygen and moisture in contact with the iron surface. A coat of paint seals that surface off from air and water, so the reaction that forms Fe₂O₃·xH₂O can't get started.",
        },
      ],
    },
    verifyLine: "Paint blocks air and moisture from reaching the iron surface ✓",
  },
  {
    id: "nitrogen-flushing",
    label: "Q19",
    questionText: "Oil and fat containing food items are flushed with nitrogen. Why?",
    visual: {
      questions: [
        {
          label: "Q19",
          prompt: "Why are oil- and fat-containing food packets flushed with nitrogen gas?",
          options: [
            "Nitrogen is unreactive, so it keeps oxygen away from the food and prevents rancidity",
            "Nitrogen makes the food taste better",
            "Nitrogen kills bacteria in the packet",
            "Nitrogen keeps the packet inflated for cushioning during transport",
          ],
          correctAnswer: "Nitrogen is unreactive, so it keeps oxygen away from the food and prevents rancidity",
          explanation: "Rancidity is the slow oxidation of fats and oils by atmospheric oxygen. Nitrogen is an unreactive gas — filling the packet with it displaces the oxygen that would otherwise oxidise the food and spoil its smell and taste.",
        },
      ],
    },
    verifyLine: "Nitrogen displaces oxygen, so the fats can't oxidise ✓",
  },
  {
    id: "corrosion-rancidity-terms",
    label: "Q20",
    questionText: "Explain the following terms with one example each. (a) Corrosion (b) Rancidity",
    parts: [
      {
        label: "(a) Corrosion",
        steps: [
          { prompt: "What is corrosion, in one line?", answer: "A metal's surface is attacked by substances around it — moisture, acids, gases in the air — and gets slowly eaten away" },
          { prompt: "Give a real example.", answer: "Rusting of iron: Fe reacts with O₂ in the presence of water to form Fe₂O₃·xH₂O (hydrated iron(III) oxide) — the reddish-brown flaky coating on old iron gates and railings" },
        ],
      },
      {
        label: "(b) Rancidity",
        steps: [
          { prompt: "What is rancidity, in one line?", answer: "Fats and oils in food slowly oxidise when left exposed to air, changing the food's smell and taste" },
          { prompt: "Give a real example.", answer: "Chips or namkeen left in an open packet for a few days start to smell and taste different (\"gone stale\") — that's why packets are flushed with nitrogen and sealed airtight" },
        ],
      },
    ],
    verifyLine: "Corrosion (rusting of iron) and rancidity (oxidised fats/oils), each with a real example ✓",
  },
];

// Section 1.2 (jesc101.pdf pp.8-11) has THREE distinct in-text question
// moments the earlier build missed entirely, found only by doing the rule-3b
// full inventory rather than building section-by-section: (1) a real
// "QUESTIONS" box between 1.2.2 and 1.2.3 (whitewashing substance X + why
// Activity 1.7 collects double the gas in one tube), (2) the "Recall Activity
// 1.2" callback under 1.2.4 (i/ii/iii on the PbI₂ precipitate), (3) the
// "Recall Activity 1.1" callback under 1.2.5 (is Mg oxidised or reduced).
// All three are folded into one topic, same pattern as sec-1-1-questions.
const SECTION_1_2_QUESTIONS_PROBLEMS: PracticeProblem[] = [
  {
    id: "sec1-2-whitewashing",
    label: "Q1",
    questionText: "A solution of a substance 'X' is used for whitewashing. (i) Name the substance 'X' and write its formula. (ii) Write the reaction of the substance named in (i) with water.",
    visual: {
      questions: [
        { label: "(i)", prompt: "What is substance X, used for whitewashing?", options: ["Calcium hydroxide, Ca(OH)₂", "Calcium oxide, CaO", "Calcium carbonate, CaCO₃", "Calcium chloride, CaCl₂"], correctAnswer: "Calcium hydroxide, Ca(OH)₂", explanation: "Slaked lime — calcium hydroxide — dissolved in water gives 'milk of lime,' the solution used for whitewashing." },
        { label: "(ii)", prompt: "What reaction gives the whitewashed wall its shiny finish over a few days?", options: ["Ca(OH)₂ + CO₂ → CaCO₃ + H₂O", "CaO + H₂O → Ca(OH)₂", "CaCO₃ → CaO + CO₂", "Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O"], correctAnswer: "Ca(OH)₂ + CO₂ → CaCO₃ + H₂O", explanation: "Calcium hydroxide slowly reacts with carbon dioxide in the air, forming a thin layer of calcium carbonate — the same compound marble is made of — which gives the shiny finish." },
      ],
    },
    verifyLine: "X is calcium hydroxide; it reacts with CO₂ in air, not with water ✓",
  },
  {
    id: "sec1-2-electrolysis-gas",
    label: "Q2",
    questionText: "Why is the amount of gas collected in one of the test tubes in Activity 1.7 double the amount collected in the other? Name this gas.",
    visual: {
      questions: [
        {
          label: "Q2",
          prompt: "In the electrolysis of water, which gas is collected in double the volume, and why?",
          options: [
            "Hydrogen — water is H₂O, so 2 parts hydrogen form for every 1 part oxygen",
            "Oxygen — it's less soluble in water than hydrogen",
            "Hydrogen — it's lighter and rises faster",
            "Both gases are always collected in equal volumes",
          ],
          correctAnswer: "Hydrogen — water is H₂O, so 2 parts hydrogen form for every 1 part oxygen",
          explanation: "Electrolysis splits water as 2H₂O → 2H₂ + O₂ — twice as many hydrogen molecules form as oxygen molecules, so the hydrogen test tube collects double the volume.",
        },
      ],
    },
    verifyLine: "Hydrogen collects at double the volume of oxygen ✓",
  },
  {
    id: "sec1-2-recall-1-2",
    label: "Recall Activity 1.2",
    questionText: "Recall Activity 1.2, where you mixed solutions of lead(II) nitrate and potassium iodide. (i) What colour precipitate formed, and what compound is it? (ii) Write the balanced chemical equation. (iii) Is this a double displacement reaction?",
    visual: {
      questions: [
        { label: "(i)", prompt: "What colour precipitate formed in Activity 1.2, and what is it?", options: ["Yellow precipitate of lead iodide, PbI₂", "White precipitate of lead sulphate, PbSO₄", "Blue precipitate of copper hydroxide", "No precipitate forms"], correctAnswer: "Yellow precipitate of lead iodide, PbI₂", explanation: "Lead ions and iodide ions combine to form insoluble lead iodide — a bright yellow solid." },
        { label: "(ii)", prompt: "What's the balanced equation for this reaction?", options: ["Pb(NO₃)₂ + 2KI → PbI₂ + 2KNO₃", "Pb(NO₃)₂ + KI → PbI + KNO₃", "PbI₂ + 2KNO₃ → Pb(NO₃)₂ + 2KI", "Pb(NO₃)₂ + 2KI → PbI₂ + KNO₃"], correctAnswer: "Pb(NO₃)₂ + 2KI → PbI₂ + 2KNO₃", explanation: "2KI is needed to balance both the lead and the two nitrate ions — 1 Pb, 2 N, 6 O, 2 K, 2 I on both sides." },
        { label: "(iii)", prompt: "Is this a double displacement reaction?", options: ["Yes — lead and potassium ions exchange partners", "No — it's a combination reaction", "No — it's a decomposition reaction", "No — it's a displacement reaction"], correctAnswer: "Yes — lead and potassium ions exchange partners", explanation: "Just like BaCl₂ + Na₂SO₄, two compounds swap ions to form a new precipitate and a new solution — the definition of double displacement." },
      ],
    },
    verifyLine: "Yellow PbI₂ precipitate, balanced equation confirmed, double displacement ✓",
  },
  {
    id: "sec1-2-recall-1-1",
    label: "Recall Activity 1.1",
    questionText: "Recall Activity 1.1, where a magnesium ribbon burns with a dazzling flame and changes into a white substance, magnesium oxide. Is magnesium being oxidised or reduced in this reaction?",
    visual: {
      questions: [
        { label: "Mg", prompt: "Is magnesium oxidised or reduced when it burns to form magnesium oxide?", options: ["Oxidised", "Reduced"], correctAnswer: "Oxidised", explanation: "Magnesium gains oxygen (Mg → MgO) — gaining oxygen means it's oxidised." },
      ],
    },
    verifyLine: "Magnesium is oxidised ✓",
  },
];

// Real "QUESTIONS" box at the end of section 1.3 (jesc101.pdf p.13) — three
// real questions, verified against the actual PDF text (not memory). Q1
// echoes Activity 1.9's Fe+CuSO₄ colour change (reaction-types-redox's own
// worked example); Q3(ii) reuses the same CuO+H₂ numbers shown there too.
// Both are still built as their own problems here — see CONTENT_RULEBOOK.md
// rule 3b: a shared number doesn't retire a distinct real citation.
const SECTION_1_3_QUESTIONS_PROBLEMS: PracticeProblem[] = [
  {
    id: "sec1-3-q1",
    label: "Q1",
    questionText: "Why does the colour of copper sulphate solution change when an iron nail is dipped in it?",
    visual: {
      questions: [
        {
          label: "Q1",
          prompt: "Why does the colour of copper sulphate solution change when an iron nail is dipped in it?",
          options: [
            "Iron displaces copper — Cu²⁺ (blue) is replaced by Fe²⁺ (pale green) in solution",
            "Iron dissolves and turns the solution rust-coloured",
            "The nail's surface coating reacts with the solution's water",
            "It's a decomposition reaction — copper sulphate breaks down on its own",
          ],
          correctAnswer: "Iron displaces copper — Cu²⁺ (blue) is replaced by Fe²⁺ (pale green) in solution",
          explanation: "This is the same reaction as Activity 1.9: Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s). Iron is more reactive than copper, so it displaces copper out of solution — the blue colour (from Cu²⁺) fades as pale green iron sulphate (Fe²⁺) forms, and copper deposits on the nail.",
        },
      ],
    },
    verifyLine: "Fe displaces Cu — blue CuSO₄ fades as pale green FeSO₄ forms ✓",
  },
  {
    id: "sec1-3-q2",
    label: "Q2",
    questionText: "Give an example of a double displacement reaction other than the one given in Activity 1.10.",
    visual: {
      questions: [
        {
          label: "Q2",
          prompt: "Which of these is a real double displacement reaction from this chapter, other than Activity 1.10 (BaCl₂ + Na₂SO₄ → BaSO₄ + 2NaCl)?",
          options: [
            "Pb(NO₃)₂ + 2KI → PbI₂ + 2KNO₃ (Activity 1.2)",
            "Fe + CuSO₄ → FeSO₄ + Cu (Activity 1.9)",
            "CaO + H₂O → Ca(OH)₂ (Activity 1.4)",
            "2FeSO₄ → Fe₂O₃ + SO₂ + SO₃ (Activity 1.5)",
          ],
          correctAnswer: "Pb(NO₃)₂ + 2KI → PbI₂ + 2KNO₃ (Activity 1.2)",
          explanation: "Lead and potassium swap partners — lead(II) nitrate and potassium iodide exchange ions to give a yellow lead iodide precipitate and potassium nitrate, exactly like Activity 1.10 does with barium and sodium. The other three options are displacement, combination, and decomposition reactions respectively — not double displacement.",
        },
      ],
    },
    verifyLine: "Activity 1.2 (Pb(NO₃)₂ + 2KI → PbI₂ + 2KNO₃) is a real double displacement, distinct from Activity 1.10 ✓",
  },
  {
    id: "sec1-3-q3",
    label: "Q3",
    questionText: "Identify the substances that are oxidised and the substances that are reduced in the following reactions. (i) 4Na(s) + O₂(g) → 2Na₂O(s) (ii) CuO(s) + H₂(g) → Cu(s) + H₂O(l)",
    parts: [
      {
        label: "(i)",
        steps: [
          { prompt: "What happens to sodium in 4Na + O₂ → 2Na₂O?", answer: "Sodium combines with (gains) oxygen to form Na₂O — sodium is oxidised", trap: { wrongGuess: "sodium is reduced", hint: "gaining oxygen is the definition of oxidation, not reduction — sodium had no oxygen before and has some after." } },
        ],
      },
      {
        label: "(ii)",
        steps: [
          { prompt: "What happens to CuO and H₂ in CuO + H₂ → Cu + H₂O?", answer: "CuO loses oxygen (→ Cu) so it's reduced; H₂ gains oxygen (→ H₂O) so it's oxidised — the same reaction shown in this chapter's own worked example" },
        ],
      },
    ],
    verifyLine: "(i) Na is oxidised (ii) CuO is reduced, H₂ is oxidised ✓",
  },
];

// History Ch.1 — "The Rise of Nationalism in Europe" (jess301.pdf, read in
// full: 28 pages). First non-Maths/Science subject — see CONTENT_RULEBOOK.md
// for why this content is `analytical` rather than procedural (History has
// no worked derivations; almost every real question here is "explain/
// discuss/describe/compare," with no single determinate answer).
//
// Rule-3b inventory of every real question-block in this chapter, mapped to
// its section, done BEFORE writing any of these. NOTE: an earlier pass had
// mislabeled the first two of these as "Section 1" — the Fig.1 Activity and
// Source A/Renan Discuss actually sit in the chapter's own unnumbered
// INTRODUCTION (jess301.pdf pp.3-4), before "1 The French Revolution and the
// Idea of the Nation" begins on p.5. Real Section 1 has no in-text question
// of its own (confirmed by re-reading it directly) — it's covered instead by
// Write in Brief Q2/Q5, which are directly about its content.
//  - Introduction (before Section 1): 2 real prompts (Fig.1 Activity, Source A
//    Renan Discuss) — both built below.
//  - Section 2 (Making of Nationalism): 3 real prompts — Source B List
//    Discuss and Fig.6 caricature Discuss are built; the "plot the Vienna
//    Congress changes on a map of Europe" Activity is EXCLUDED — it's a
//    real map-drawing exercise this app has no plotting surface for, not a
//    silently-dropped citation.
//  - Section 3 (Age of Revolutions): 4 real prompts — Grimm/language Discuss,
//    Silesian-weavers Discuss, the weaver's-report Activity (composition-
//    style, still uses the analytical shape — see rule note below), and the
//    Source C women's-rights Discuss. All 4 built.
//  - Section 4 (Germany & Italy): 4 real prompts — Bismarck-caricature and
//    Garibaldi-caricature Activities (analytical), the Fig.14(a)
//    self-identification question (analytical), and the Fig.14(b)
//    map-reading question — which IS visual/perceptual (real determinate
//    answers read off the map's year-coding), so it uses the `visual` shape,
//    not `analytical`, even though it's grouped in the same in-text topic.
//  - Section 5 (Visualising the Nation): 3 real prompts — Box 3/Fig.17
//    Germania-symbolism Activity, Fig.18 fallen-Germania Activity, and the
//    Fig.10/Fig.19 perspective-taking Activity (composition-style). All 3
//    built.
//  - Section 6 (Nationalism and Imperialism): confirmed by direct read — this
//    section has NO in-text Activity/Discuss box of its own. Not an
//    oversight; there's genuinely nothing here to build.
//  - End of chapter: "Write in brief" (5 real questions, Q1 has 5 real
//    sub-parts built as 5 separate problems) and "Discuss" (5 real
//    questions) — both built in full below. The "Project" (find nationalist
//    symbols outside Europe) is EXCLUDED — a real multi-day open research
//    task, not an in-app practice interaction.
//
// A couple of these (the weaver's report, the Frankfurt-parliament
// perspective question) are Language/composition rather than strictly
// Analytical/argumentative per rule 0's table — both still use the
// `analytical` shape here rather than a separate one, since the underlying
// interaction (write freely, get qualitative AI feedback, never right/wrong)
// is identical; only the criteria's emphasis differs (concrete real details
// + adopted voice, vs. argument soundness).
const INTRO_HISTORY_PROBLEMS: PracticeProblem[] = [
  {
    id: "hist-fig1-utopian-vision",
    label: "Activity",
    questionText: "In what way do you think this print (Fig. 1) depicts a utopian vision?",
    analytical: {
      criteria: [
        "Recognises the print imagines 'democratic and social Republics' across all of Europe and America as one unified procession — an idealistic vision, not a real political state of affairs in 1848",
        "Notes the print shows nations that didn't yet exist as united states (e.g. the German peoples marching under a flag expressing only 'liberal hopes... to unify the numerous German-speaking principalities') as if they already were",
        "Connects the allegorical figures (Liberty bearing the torch of Enlightenment and the Charter of the Rights of Man; Christ, saints and angels symbolising fraternity) to an idealised, not literal, vision",
        "Uses the term 'utopian' correctly — a vision so ideal it's unlikely to actually exist",
      ],
      groundingNotes:
        "Fig. 1 (Sorrieu, 1848) shows peoples of Europe and America marching in procession past the statue of Liberty, grouped as distinct nations by flag and costume — including the German peoples, who 'did not yet exist as a united nation' at the time; the flag they carry only expresses 'liberal hopes in 1848 to unify the numerous German-speaking principalities into a nation-state.' Christ, saints and angels gaze from the heavens, symbolising fraternity among nations. 'Utopian' is glossed in the chapter as 'a vision of a society that is so ideal that it is unlikely to actually exist.'",
      imageSrc: "/history/fig1-sorrieu.jpg",
      imageAlt: "Fig. 1 — The Dream of Worldwide Democratic and Social Republics, Frédéric Sorrieu, 1848",
    },
    verifyLine: "A real, verified answer covers the imagined unity, the not-yet-real nations, and the allegorical figures ✓",
  },
  {
    id: "hist-renan-nation",
    label: "Discuss",
    questionText: "Summarise the attributes of a nation, as Renan understands them. Why, in his view, are nations important?",
    analytical: {
      criteria: [
        "Identifies that Renan rejects language, race, religion, or territory as what makes a nation",
        "States Renan's actual definition — a nation is 'the culmination of a long past of endeavours, sacrifice and devotion,' built on common glories, a shared will in the present, and a wish to perform great deeds together",
        "Cites Renan's phrase that a nation's existence is 'a daily plebiscite' — a continuously renewed, chosen solidarity, not something fixed at birth",
        "Explains why Renan says nations matter — their existence is 'a guarantee of liberty,' which would be lost if the world had only one law and one master",
      ],
      groundingNotes:
        "Ernst Renan, 'What is a Nation?' (1882 lecture): criticises the idea that a nation is formed by common language, race, religion, or territory. 'A nation is the culmination of a long past of endeavours, sacrifice and devotion... To have common glories in the past, to have a common will in the present, to have performed great deeds together, to wish to perform still more, these are the essential conditions of being a people... Its existence is a daily plebiscite... A nation never has any real interest in annexing or holding on to a country against its will. The existence of nations is a good thing, a necessity even. Their existence is a guarantee of liberty, which would be lost if the world had only one law and only one master.'",
    },
    verifyLine: "A real, verified answer names Renan's actual criteria (shared past/will/deeds, daily plebiscite) and his liberty argument ✓",
  },
];

const SECTION_2_HISTORY_PROBLEMS: PracticeProblem[] = [
  {
    id: "hist-list-zollverein",
    label: "Discuss",
    questionText: "Describe the political ends that List hopes to achieve through economic measures.",
    analytical: {
      criteria: [
        "Identifies the zollverein (customs union) as the real economic measure being discussed",
        "States List's actual goal — to 'bind the Germans economically into a nation,' not just create commercial convenience",
        "Explains the reasoning: a free, unified internal economic system strengthens national sentiment and interests both internally and externally",
        "Recognises this as a case of economic policy being used deliberately as a nation-building tool, not pursued for economic reasons alone",
      ],
      groundingNotes:
        "Friedrich List, Professor of Economics at Tübingen, wrote in 1834: 'The aim of the zollverein is to bind the Germans economically into a nation. It will strengthen the nation materially as much by protecting its interests externally as by stimulating its internal productivity. It ought to awaken and raise national sentiment through a fusion of individual and provincial interests. The German people have realised that a free economic system is the only means to engender national feeling.' The zollverein (1834) abolished tariff barriers and reduced the number of currencies from over thirty to two among most German states, and a growing railway network further stimulated mobility — economic nationalism reinforcing the wider nationalist sentiment of the time.",
    },
    verifyLine: "A real, verified answer names the zollverein and List's own stated goal — binding Germans into a nation, not just trade ✓",
  },
  {
    id: "hist-caricature-club-of-thinkers",
    label: "Discuss",
    questionText: "What is the caricaturist trying to depict?",
    analytical: {
      criteria: [
        "Identifies the cartoon (Fig. 6, 'The Club of Thinkers,' c.1820) as mocking the suppression of free thought and speech after 1815",
        "Cites the real detail — the plaque reads 'How long will thinking be allowed to us?' and the club's rules include 'muzzles will be distributed to members upon entering'",
        "Connects this to the real historical context — conservative regimes after 1815 imposed censorship laws on newspapers, books, plays and songs to control ideas of liberty and freedom associated with the French Revolution",
      ],
      groundingNotes:
        "Fig. 6, 'The Club of Thinkers,' anonymous caricature c.1820. The plaque reads: 'The most important question of today's meeting: How long will thinking be allowed to us?' The board lists rules including 'Silence is the first commandment of this learned society' and 'To avoid the eventuality whereby a member of this club may succumb to the temptation of speech, muzzles will be distributed to members upon entering.' Surrounding text: conservative regimes set up after 1815 were autocratic, did not tolerate criticism or dissent, and imposed censorship laws to control what was said in newspapers, books, plays and songs, reflecting ideas of liberty and freedom associated with the French Revolution.",
      imageSrc: "/history/fig6-club-of-thinkers.jpg",
      imageAlt: "Fig. 6 — The Club of Thinkers, anonymous caricature, c. 1820",
    },
    verifyLine: "A real, verified answer names the plaque/muzzle detail and connects it to real post-1815 censorship ✓",
  },
];

const SECTION_3_HISTORY_PROBLEMS: PracticeProblem[] = [
  {
    id: "hist-language-national-identity",
    label: "Discuss",
    questionText: "Discuss the importance of language and popular traditions in the creation of national identity.",
    analytical: {
      criteria: [
        "Cites the Grimm Brothers' work (collecting German folktales, publishing a 33-volume German dictionary) as building a shared German cultural/national identity, explicitly against French domination",
        "Cites the Polish case — after Russian occupation, Polish was forced out of schools and Russian imposed everywhere; the clergy then used Polish for Church gatherings and religious instruction as an act of resistance, and priests/bishops were jailed or exiled by Russian authorities for refusing to preach in Russian",
        "Concludes Polish came to be seen as 'a symbol of the struggle against Russian dominance' — i.e. language itself became a nationalist weapon, not just a communication tool",
        "Draws the general point: culture (folklore, language) built and expressed nationalist feeling as much as wars or treaties did",
      ],
      groundingNotes:
        "Box 1: the Grimm brothers (Jacob and Wilhelm) spent six years travelling and collecting German folktales, publishing their first collection in 1812 and later a 33-volume German dictionary; they saw French domination as a threat to German culture and their folklore/language projects as building an authentic German identity. Separately: after Russian occupation of Poland, Polish was forced out of schools and Russian imposed everywhere; following an 1831 armed rebellion (crushed), clergy began using Polish for Church gatherings and religious instruction as resistance — many priests and bishops were jailed or sent to Siberia by Russian authorities for refusing to preach in Russian. 'The use of Polish came to be seen as a symbol of the struggle against Russian dominance.'",
    },
    verifyLine: "A real, verified answer cites both the Grimm Brothers and the Polish-language cases ✓",
  },
  {
    id: "hist-silesian-weavers-cause",
    label: "Discuss",
    questionText: "Describe the cause of the Silesian weavers' uprising. Comment on the viewpoint of the journalist.",
    analytical: {
      criteria: [
        "States the real cause — contractors supplied raw material and orders for finished textiles to weavers, then drastically reduced their payments, amid extreme poverty and desperate need for jobs",
        "Describes the real event of 4 June 1845 — a large crowd of weavers marched to the contractor's mansion demanding higher wages, were treated with scorn, then forced their way in and smashed windows, furniture and porcelain, and plundered the storehouse",
        "Notes the contractor fled and returned 24 hours later with the army; eleven weavers were shot in the exchange that followed",
        "Comments on journalist Wilhelm Wolff's viewpoint — a sympathetic, socially engaged account that documents worker suffering ('the misery of the workers is extreme') in vivid detail, not a neutral or contractor-sympathetic one",
      ],
      groundingNotes:
        "Journalist Wilhelm Wolff described events in a Silesian weaving village (18,000 inhabitants, cotton weaving the main occupation): 'The misery of the workers is extreme. The desperate need for jobs has been taken advantage of by the contractors to reduce the prices of the goods they order... On 4 June at 2 p.m. a large crowd of weavers emerged from their homes and marched in pairs up to the mansion of their contractor demanding higher wages. They were treated with scorn and threats alternately. Following this, a group of them forced their way into the house, smashed its elegant window-panes, furniture, porcelain... another group broke into the storehouse and plundered it of supplies of cloth which they tore to shreds... The contractor fled with his family... He returned 24 hours later having requisitioned the army. In the exchange that followed, eleven weavers were shot.'",
    },
    verifyLine: "A real, verified answer names the pay cuts, the 4 June 1845 events, and Wolff's sympathetic viewpoint ✓",
  },
  {
    id: "hist-weaver-report",
    label: "Activity",
    questionText: "Imagine you are a weaver who saw the events as they unfolded. Write a report on what you saw.",
    analytical: {
      criteria: [
        "Written in first-person, eyewitness voice, as the Activity asks",
        "Incorporates specific real details from the source — contractors cutting piece-rates despite extreme hardship, the 4 June march to the mansion, the crowd being met with scorn, the smashed windows/furniture/porcelain, the plundered storehouse, the contractor's flight, his return with soldiers, and the eleven weavers shot",
        "Conveys the desperation and hardship described in the real account, not a generic or invented scenario",
      ],
      groundingNotes:
        "Same Wilhelm Wolff account as above — this is a composition exercise grounded in that same real event, not a fictional scenario, so a strong 'report' should read as a first-person eyewitness account of those specific real details.",
    },
    verifyLine: "A real, verified answer stays grounded in the real 4 June 1845 events, written in first-person ✓",
  },
  {
    id: "hist-womens-rights-sources",
    label: "Discuss",
    questionText: "Compare the positions on the question of women's rights voiced by the three writers cited above. What do they reveal about liberal ideology?",
    analytical: {
      criteria: [
        "States Carl Welcker's position — men and women have naturally different roles (man = public/protector/provider, woman = home/family), and that granting equality 'would only endanger harmony and destroy the dignity of the family'",
        "States Louise Otto-Peters' position — as a feminist activist, she points out the hypocrisy of men who fight for liberty for themselves but deny the same to women, insisting 'liberty is indivisible'",
        "States the anonymous letter-writer's position — it's 'ridiculous and unreasonable' to deny propertied women the vote, since they perform civic duties and contribute to the state as much as men",
        "Concludes what this reveals about liberal ideology — that it championed universal liberty and equality in principle, yet many liberals (like Welcker) excluded women from it in practice, exposing a real internal contradiction",
      ],
      groundingNotes:
        "Source C: Carl Welcker (liberal politician, Frankfurt Parliament) — 'Nature has created men and women to carry out different functions... Man, the stronger, the bolder and freer... has been designated as protector of the family... Woman, the weaker... requires the protection of man. Her sphere is the home... equality between the sexes would only endanger harmony and destroy the dignity of the family.' Louise Otto-Peters (1819-95, founded a women's political journal) wrote in 1849: 'Let us ask how many men... would be prepared to fight and die for the freedom of the entire human race?... Liberty is indivisible.' An anonymous letter to the same newspaper's editor (25 June 1850) argued it is 'ridiculous and unreasonable to deny women political rights even though they enjoy the right to property... Why this injustice? Is it not a disgrace that even the stupidest cattle-herder possesses the right to vote... whereas highly talented women owning considerable property are excluded from this right, even though they contribute so much to the maintenance of the state?'",
    },
    verifyLine: "A real, verified answer states all three real positions and names the internal contradiction in liberal ideology ✓",
  },
];

const SECTION_4_HISTORY_PROBLEMS: PracticeProblem[] = [
  {
    id: "hist-bismarck-caricature",
    label: "Activity",
    questionText: "Describe the caricature. How does it represent the relationship between Bismarck and the elected deputies of Parliament? What interpretation of democratic processes is the artist trying to convey?",
    analytical: {
      criteria: [
        "Describes the real caricature (Fig. 13, Figaro, Vienna, 1870) — Bismarck shown wielding a whip over cowering figures representing the elected deputies",
        "Interprets this as showing Bismarck (and Prussian state power) dominating over the elected assembly, rather than being accountable to it",
        "Connects this to the real body text — German unification was driven by the monarchy, army and bureaucracy under Bismarck's leadership, not by the earlier liberal parliamentary initiative of 1848 (the Frankfurt assembly), which had been suppressed",
        "Concludes the artist is critiquing how genuine democratic process was subordinated to autocratic/military power in the making of Germany",
      ],
      groundingNotes:
        "Fig. 13: 'Caricature of Otto von Bismarck in the German reichstag (parliament), from Figaro, Vienna, 5 March 1870.' Body text (section 4.1): after 1848, nationalism moved away from democracy and revolution — Prussia's chief minister Otto von Bismarck led the unification 'with the help of the Prussian army and bureaucracy,' via three wars over seven years; 'the nation-building process in Germany had demonstrated the dominance of Prussian state power.' This followed the earlier 1848 Frankfurt Parliament, whose liberal initiative for an elected, constitutional nation was ultimately repressed (the assembly was forced to disband when troops were called in).",
      imageSrc: "/history/fig13-bismarck-caricature.jpg",
      imageAlt: "Fig. 13 — Caricature of Otto von Bismarck in the German reichstag, from Figaro, Vienna, 5 March 1870",
    },
    verifyLine: "A real, verified answer describes the whip/deputies caricature and ties it to Prussian state power overriding the parliamentary initiative ✓",
  },
  {
    id: "hist-garibaldi-caricature",
    label: "Activity",
    questionText: "The artist has portrayed Garibaldi as holding onto the base of the boot, so that the King of Sardinia-Piedmont can enter it from the top. What statement is this caricature making?",
    analytical: {
      criteria: [
        "Recognises 'the boot' as the shape of the Italian peninsula on the map",
        "Identifies that Garibaldi (leading his volunteer 'Red Shirts,' who grew to about 30,000) did the real fighting to win southern Italy and the Kingdom of the Two Sicilies",
        "Notes that King Victor Emmanuel II of Sardinia-Piedmont is shown entering 'the boot' from the top — claiming the crown of the unified nation Garibaldi's forces actually won",
        "Comments on the real tension this reveals — popular revolutionary action (Garibaldi, and earlier Mazzini's Young Italy) built the nation, but the outcome was a monarchy under Piedmont's king, not the republic Mazzini and Garibaldi's movement had originally envisioned",
      ],
      groundingNotes:
        "Fig. 15: 'Garibaldi helping King Victor Emmanuel II of Sardinia-Piedmont to pull on the boot named Italy. English caricature of 1859.' Body text: Giuseppe Garibaldi led armed volunteers ('Red Shirts,' growing to about 30,000) who in 1860 marched into South Italy and the Kingdom of the Two Sicilies and won local peasant support to drive out Spanish rulers; in 1861 Victor Emmanuel II — not Garibaldi, and not a republic — was proclaimed king of united Italy. Mazzini had earlier sought 'a unitary Italian Republic' through Young Italy; Cavour, who led the diplomatic side of unification, 'was neither a revolutionary nor a democrat.'",
      imageSrc: "/history/fig15-garibaldi-caricature.jpg",
      imageAlt: "Fig. 15 — Garibaldi helping King Victor Emmanuel II pull on the boot named Italy, English caricature of 1859",
    },
    verifyLine: "A real, verified answer names Garibaldi's real fighting, the King claiming the throne, and the republic-vs-monarchy tension ✓",
  },
  {
    id: "hist-italy-self-identification",
    label: "Activity",
    questionText: "Look at Fig. 14(a). Do you think that the people living in any of these regions thought of themselves as Italians?",
    analytical: {
      criteria: [
        "Recognises mid-19th-century Italy was politically fragmented — seven separate dynastic states plus Habsburg-ruled regions, with no single Italian nation yet",
        "Notes even the Italian language itself 'had not acquired one common form' and still had many regional and local variations",
        "Cites the real detail that even elite unification leaders, like Cavour, 'spoke French much better than he did Italian'",
        "Cites the striking real anecdote — peasant masses in southern Italy who supported Garibaldi had never even heard the word 'Italia,' and believed 'La Talia' was Victor Emmanuel's wife",
        "Concludes that a shared 'Italian' identity was, at this stage, largely an elite political project rather than a lived reality for most people",
      ],
      groundingNotes:
        "Body text (section 4.2, 'Italy Unified'): 'Italy was divided into seven states, of which only one, Sardinia-Piedmont, was ruled by an Italian princely house... Even the Italian language had not acquired one common form and still had many regional and local variations.' Chief Minister Cavour, who led unification diplomatically, 'spoke much better French than he did Italian.' 'Much of the Italian population, among whom rates of illiteracy were very high, remained blissfully unaware of liberal-nationalist ideology. The peasant masses who had supported Garibaldi in southern Italy had never heard of Italia, and believed that La Talia was Victor Emmanuel's wife!'",
      imageSrc: "/history/fig14a-italy-before.jpg",
      imageAlt: "Fig. 14(a) — Italian states before unification, 1858",
    },
    verifyLine: "A real, verified answer cites the fragmentation, the language variation, Cavour's French, and the 'La Talia' anecdote ✓",
  },
  {
    id: "hist-italy-map-reading",
    label: "Activity",
    questionText: "Examine Fig. 14(b). Which was the first region to become part of unified Italy? Which was the last region to join? In which year did the largest number of states join?",
    visual: {
      imageSrc: "/history/fig14b-italy-after.jpg",
      imageAlt: "Fig. 14(b) — Italy after unification, showing the year each region joined",
      questions: [
        {
          label: "First",
          prompt: "Reading Fig. 14(b)'s year-coded map, which region was the first to join Sardinia-Piedmont's original core?",
          options: [
            "Lombardy and the central Italian states (Parma, Modena, Tuscany), labelled 1858-60",
            "The Kingdom of the Two Sicilies in the south, labelled 1860",
            "Venetia, labelled 1866",
            "Rome and the Papal States, labelled 1870",
          ],
          correctAnswer: "Lombardy and the central Italian states (Parma, Modena, Tuscany), labelled 1858-60",
          explanation: "Sardinia-Piedmont itself was the pre-existing core (labelled 1858, not a 'join'). The map labels the central regions — Lombardy, Parma, Modena, Tuscany — as '1858-60', distinct from the South's own separate '1860' label; Cavour's 1859 war won Lombardy first, so this central group is the earliest real joining event.",
        },
        {
          label: "Last",
          prompt: "Which region joined last, per the map?",
          options: ["Rome and the Papal States, labelled 1870", "Venetia, labelled 1866", "The Kingdom of the Two Sicilies, labelled 1860", "Lombardy, labelled 1858-60"],
          correctAnswer: "Rome and the Papal States, labelled 1870",
          explanation: "The Papal States, where a French garrison was stationed, held out until 1870 — France withdrew its troops (occupied by the war with Prussia) and Rome was finally joined to Italy that year, per Box 2's account of Garibaldi's 1867 attempt and the map's 1870 label.",
        },
        {
          label: "Most joined",
          prompt: "In which year (or year-range label) did the largest number of states join at once?",
          options: ["1858-60", "1860", "1866", "1870"],
          correctAnswer: "1858-60",
          explanation: "The map's '1858-60' label covers multiple distinct regions at once — Lombardy, Parma, Modena and Tuscany — more than any other single label: '1860' (just the Two Sicilies), '1866' (just Venetia), and '1870' (just Rome) each cover one region.",
        },
      ],
    },
    verifyLine: "1858-60 (Lombardy + central states) joined first and in the largest number; Rome joined last, in 1870 ✓",
  },
];

const SECTION_5_HISTORY_PROBLEMS: PracticeProblem[] = [
  {
    id: "hist-germania-symbolism",
    label: "Activity",
    questionText: "With the help of the chart in Box 3, identify the attributes of Veit's Germania and interpret the symbolic meaning of the painting. In an earlier allegorical rendering of 1836, Veit had portrayed the Kaiser's crown at the place where he has now located the broken chain. Explain the significance of this change.",
    analytical: {
      criteria: [
        "Names the real attributes from Box 3 and their real meanings — broken chains (being freed), breastplate with eagle (symbol of the German empire, strength), crown of oak leaves (heroism), sword (readiness to fight), olive branch around the sword (willingness to make peace), the black-red-gold tricolour (flag of the 1848 liberal-nationalists, banned by the Dukes of the German states), rays of the rising sun (beginning of a new era)",
        "Interprets the overall meaning — Germania as a free, empowered nation, ready to defend itself but seeking peace, at the dawn of a new (unified, liberal) era",
        "Explains the crown-to-broken-chain change — a shift from a monarchy-centred symbol (the Kaiser's crown, 1836) to a symbol of the nation's own liberation (broken chains, 1848), reflecting that year's revolutionary, popular-sovereignty aspirations rather than allegiance to a ruling monarch",
      ],
      groundingNotes:
        "Box 3 ('Meanings of the symbols'): Broken chains = being freed; Breastplate with eagle = symbol of the German empire, strength; Crown of oak leaves = heroism; Sword = readiness to fight; Olive branch around the sword = willingness to make peace; Black, red and gold tricolour = flag of the liberal-nationalists in 1848, banned by the Dukes of the German states; Rays of the rising sun = beginning of a new era. Fig. 17 caption: Philip Veit's 1848 Germania painting was prepared to hang from the ceiling of the Frankfurt Church of St Paul when the parliament convened in March 1848. The Activity notes Veit's earlier 1836 rendering placed the Kaiser's crown where the broken chain now sits.",
      imageSrc: "/history/fig17-germania-veit.jpg",
      imageAlt: "Fig. 17 — Germania, Philip Veit, 1848",
    },
    verifyLine: "A real, verified answer names all of Box 3's real attributes and explains the crown→chain shift in symbolism ✓",
  },
  {
    id: "hist-fallen-germania",
    label: "Activity",
    questionText: "Describe what you see in Fig. 17. What historical events could Hübner be referring to in this allegorical vision of the nation?",
    analytical: {
      criteria: [
        "Describes the real image — Julius Hübner's 'The Fallen Germania' (1850): a defeated female allegorical figure lying collapsed on the ground, with a broken sword and shield nearby",
        "Contrasts this with the standing, triumphant Germania Philip Veit painted just two years earlier, in 1848",
        "Connects the change to the real historical event in between — the failure and suppression of the 1848 liberal revolutions (the Frankfurt Parliament was ultimately forced to disband when troops were called in, and conservative forces reasserted control across the German states)",
        "Concludes the allegory tracks the nation's real fortunes — triumphant hope in 1848, defeat by 1850",
      ],
      groundingNotes:
        "Fig. 18 caption: 'The fallen Germania, Julius Hübner, 1850' (the question as printed says 'Fig. 17,' which is Veit's standing 1848 Germania — the two images sit on consecutive pages and the intended contrast is clearly between them). Body text (section 3.3): the 1848 Frankfurt Parliament's liberal-nationalist initiative — an elected assembly that drafted a constitution for a German nation under a constitutional monarchy — collapsed when the offered king (Friedrich Wilhelm IV of Prussia) rejected the crown and joined other monarchs in opposing the assembly; 'in the end troops were called in and the assembly was forced to disband.'",
      imageSrc: "/history/fig18-fallen-germania.jpg",
      imageAlt: "Fig. 18 — The fallen Germania, Julius Hübner, 1850",
    },
    verifyLine: "A real, verified answer describes the fallen Germania and ties it to the real 1848-50 collapse of the Frankfurt Parliament ✓",
  },
  {
    id: "hist-frankfurt-perspective",
    label: "Activity",
    questionText: "Look once more at Fig. 10. Imagine you were a citizen of Frankfurt in March 1848 and were present during the proceedings of the parliament. How would you (a) as a man seated in the hall of deputies, and (b) as a woman observing from the galleries, relate to the banner of Germania hanging from the ceiling?",
    analytical: {
      criteria: [
        "As (a) the male deputy: conveys a sense of direct participation and ownership — Germania represents a nation he himself has a real vote and voice in shaping, since deputies (all men) held the actual political rights being exercised",
        "As (b) the woman in the gallery: grounded in the real fact that women were admitted only as observers, not participants, despite the real political activism described elsewhere in the chapter (forming their own political associations, founding newspapers, demanding rights — Source C)",
        "Names the real contradiction directly — a strong answer notices that Germania, a FEMALE figure, symbolically represents the whole nation, while the actual women present in the room are denied the political rights that nation is busy defining",
      ],
      groundingNotes:
        "Fig. 10 caption: 'The Frankfurt parliament in the Church of St Paul... Notice the women in the upper left gallery.' Body text: when the Frankfurt parliament convened, 'women were admitted only as observers, to stand in the visitors' gallery,' despite large numbers of women having formed their own political associations, founded newspapers, and taken part in political meetings and demonstrations over the years — the same contradiction discussed via Source C's three writers on women's rights.",
      imageSrc: "/history/fig10-frankfurt-parliament.jpg",
      imageAlt: "Fig. 10 — The Frankfurt parliament in the Church of St Paul",
    },
    verifyLine: "A real, verified answer contrasts the deputy's real vote with the observer-only status of women in the gallery ✓",
  },
];

// End-of-chapter "Write in brief" (jess301.pdf p.28) — 5 real questions, Q1
// has 5 real sub-parts, built as 5 separate problems (each independently
// answerable, same pattern as Science's sec-1-1-questions bundling several
// real questions under one topic).
const WRITE_IN_BRIEF_HISTORY_PROBLEMS: PracticeProblem[] = [
  {
    id: "wib-q1a-mazzini",
    label: "Q1(a)",
    questionText: "Write a note on Guiseppe Mazzini.",
    analytical: {
      criteria: [
        "Born in Genoa, 1805; became a member of the secret society the Carbonari as a young man",
        "Sent into exile in 1831 (aged 26) for attempting a revolution in Liguria",
        "Founded two more underground societies — Young Italy (Marseilles) and Young Europe (Berne) — for like-minded young men from Poland, France, Italy and the German states",
        "Believed nations were the natural units of mankind, ordained by God; sought a unitary Italian Republic (not a monarchy) via revolutionary uprisings",
        "His secret-society model and opposition to monarchy made him, in Metternich's words, 'the most dangerous enemy of our social order'",
      ],
      groundingNotes:
        "'One such individual was the Italian revolutionary Giuseppe Mazzini. Born in Genoa in 1805, he became a member of the secret society of the Carbonari. As a young man of 26, he was sent into exile in 1831 for attempting a revolution in Liguria. He subsequently founded two more underground societies, first, Young Italy in Marseilles, and then, Young Europe in Berne... Mazzini believed that God had intended nations to be the natural units of mankind. So Italy could not continue to be a patchwork of small states and kingdoms. It had to be forged into a single unified republic... Mazzini's relentless opposition to monarchy and his vision of democratic republics frightened the conservatives. Metternich described him as 'the most dangerous enemy of our social order.'",
    },
    verifyLine: "A real, verified answer covers Mazzini's exile, Young Italy/Young Europe, and his republican vision ✓",
  },
  {
    id: "wib-q1b-cavour",
    label: "Q1(b)",
    questionText: "Write a note on Count Camillo de Cavour.",
    analytical: {
      criteria: [
        "Chief Minister who led the movement to unify Italy's regions",
        "Was neither a revolutionary nor a democrat, unlike Mazzini",
        "Spoke French much better than he did Italian, like many of the wealthy, educated Italian elite",
        "Engineered a tactful diplomatic alliance with France, through which Sardinia-Piedmont defeated Austrian forces in 1859",
      ],
      groundingNotes:
        "'Chief Minister Cavour who led the movement to unify the regions of Italy was neither a revolutionary nor a democrat. Like many other wealthy and educated members of the Italian elite, he spoke much better French than he did Italian. Through a tactful diplomatic alliance with France engineered by Cavour, Sardinia-Piedmont succeeded in defeating the Austrian forces in 1859.'",
    },
    verifyLine: "A real, verified answer covers Cavour's role, his non-revolutionary character, and the 1859 French alliance ✓",
  },
  {
    id: "wib-q1c-greek-independence",
    label: "Q1(c)",
    questionText: "Write a note on the Greek war of independence.",
    analytical: {
      criteria: [
        "Greece had been part of the Ottoman Empire since the fifteenth century",
        "The growth of revolutionary nationalism in Europe sparked a Greek independence struggle beginning in 1821",
        "Greek nationalists got support from Greeks living in exile, and from West Europeans sympathetic to ancient Greek culture",
        "Poets and artists (e.g. Delacroix's 'Massacre at Chios') mobilised European public opinion; the English poet Lord Byron organised funds and died fighting for the cause in 1824",
        "The Treaty of Constantinople (1832) recognised Greece as an independent nation",
      ],
      groundingNotes:
        "'Greece had been part of the Ottoman Empire since the fifteenth century. The growth of revolutionary nationalism in Europe sparked off a struggle for independence amongst the Greeks which began in 1821. Nationalists in Greece got support from other Greeks living in exile and also from many West Europeans who had sympathies for ancient Greek culture. Poets and artists lauded Greece as the cradle of European civilisation and mobilised public opinion... The English poet Lord Byron organised funds and later went to fight in the war, where he died of fever in 1824. Finally, the Treaty of Constantinople of 1832 recognised Greece as an independent nation.' Fig. 8, 'The Massacre at Chios' by Delacroix, depicted the killing of 20,000 Greeks by Turks to appeal to European sympathy.",
    },
    verifyLine: "A real, verified answer covers the 1821 start, European support/Byron, and the 1832 Treaty of Constantinople ✓",
  },
  {
    id: "wib-q1d-frankfurt-parliament",
    label: "Q1(d)",
    questionText: "Write a note on the Frankfurt parliament.",
    analytical: {
      criteria: [
        "An all-German National Assembly, voted for by political associations of middle-class professionals, businessmen and prosperous artisans",
        "831 elected representatives convened on 18 May 1848 in the Church of St Paul in Frankfurt",
        "Drafted a constitution for a German nation to be headed by a monarch subject to a parliament",
        "Collapsed when the offered king, Friedrich Wilhelm IV of Prussia, rejected the crown and joined other monarchs opposing the assembly; troops were eventually called in and the assembly was forced to disband",
        "Women were admitted only as observers in the gallery, not as participants",
      ],
      groundingNotes:
        "'In the German regions a large number of political associations whose members were middle-class professionals, businessmen and prosperous artisans came together in the city of Frankfurt to vote for an all-German National Assembly. On 18 May 1848, 831 elected representatives marched in a festive procession to take their places in the Frankfurt parliament convened in the Church of St Paul. They drafted a constitution for a German nation to be headed by a monarchy subject to a parliament. When the deputies offered the crown on these terms to Friedrich Wilhelm IV, King of Prussia, he rejected it and joined other monarchs to oppose the elected assembly... In the end troops were called in and the assembly was forced to disband.' Women were 'admitted only as observers, to stand in the visitors' gallery.'",
    },
    verifyLine: "A real, verified answer covers the 1848 convening, the constitution offer, and its collapse ✓",
  },
  {
    id: "wib-q1e-women-nationalist-struggles",
    label: "Q1(e)",
    questionText: "Write a note on the role of women in nationalist struggles.",
    analytical: {
      criteria: [
        "Women participated actively in nationalist and liberal movements — forming their own political associations, founding newspapers, and taking part in political meetings and demonstrations over many years",
        "Despite this, they were largely denied the political rights they fought for — e.g. admitted only as observers, not participants, in the Frankfurt Parliament",
        "Real activists like Louise Otto-Peters founded a women's political journal and directly argued for women's inclusion in the liberty being fought for",
        "This exposed a real contradiction within liberal-nationalist ideology, which championed universal liberty in principle while many liberals (e.g. Carl Welcker) opposed extending it to women in practice",
      ],
      groundingNotes:
        "'The issue of extending political rights to women was a controversial one within the liberal movement, in which large numbers of women had participated actively over the years. Women had formed their own political associations, founded newspapers and taken part in political meetings and demonstrations. Despite this they were denied suffrage rights during the election of the [Frankfurt] Assembly... women were admitted only as observers, to stand in the visitors' gallery.' Source C gives Louise Otto-Peters (feminist activist, founded a women's political journal) directly challenging this exclusion, against Carl Welcker's opposing view that equality 'would only endanger harmony and destroy the dignity of the family.'",
    },
    verifyLine: "A real, verified answer covers women's real activism, their real exclusion, and the contradiction this exposed ✓",
  },
  {
    id: "wib-q2-french-collective-identity",
    label: "Q2",
    questionText: "What steps did the French revolutionaries take to create a sense of collective identity among the French people?",
    analytical: {
      criteria: [
        "Ideas of la patrie (the fatherland) and le citoyen (the citizen) emphasised a united community with equal rights under a constitution",
        "A new French flag, the tricolour, replaced the former royal standard",
        "The Estates General was elected by the body of active citizens and renamed the National Assembly",
        "New hymns were composed, oaths taken, and martyrs commemorated, all in the name of the nation",
        "A centralised administrative system formulated uniform laws for all citizens within French territory",
        "Internal customs duties and dues were abolished, and a uniform system of weights and measures was adopted",
        "Regional dialects were discouraged, and French as spoken and written in Paris became the common language of the nation",
      ],
      groundingNotes:
        "'From the very beginning, the French revolutionaries introduced various measures and practices that could create a sense of collective identity amongst the French people. The ideas of la patrie (the fatherland) and le citoyen (the citizen) emphasised the notion of a united community enjoying equal rights under a constitution. A new French flag, the tricolour, was chosen to replace the former royal standard. The Estates General was elected by the body of active citizens and renamed the National Assembly. New hymns were composed, oaths taken and martyrs commemorated, all in the name of the nation. A centralised administrative system was put in place and it formulated uniform laws for all citizens within its territory. Internal customs duties and dues were abolished and a uniform system of weights and measures was adopted. Regional dialects were discouraged and French, as it was spoken and written in Paris, became the common language of the nation.'",
    },
    verifyLine: "A real, verified answer covers the real symbolic (flag, hymns), administrative (laws, customs), and linguistic steps taken ✓",
  },
  {
    id: "wib-q3-marianne-germania",
    label: "Q3",
    questionText: "Who were Marianne and Germania? What was the importance of the way in which they were portrayed?",
    analytical: {
      criteria: [
        "Both are female allegories personifying a nation — France (Marianne) and Germany (Germania) — a way of giving an abstract idea a concrete, human form, since it's harder to represent a nation the way a ruler can be represented by a portrait or statue",
        "Marianne — her attributes (red cap, tricolour, cockade) were drawn from Liberty and the Republic; her statues were erected in public squares and her image marked on coins and stamps to help the public identify with the national symbol",
        "Germania — wears a crown of oak leaves (the German oak stands for heroism), and carries other symbolic attributes (sword, broken chains, tricolour) as described in Box 3",
        "The importance: these weren't portraits of real women, but symbols meant to be universally recognisable and to build public identification with the idea of the nation itself",
      ],
      groundingNotes:
        "'While it is easy enough to represent a ruler through a portrait or a statue, how does one go about giving a face to a nation? Artists... found a way out by personifying a nation... The female form that was chosen to personify the nation did not stand for any particular woman in real life; rather it sought to give the abstract idea of the nation a concrete form. That is, the female figure became an allegory of the nation.' Marianne: 'a popular Christian name, which underlined the idea of a people's nation... characteristics were drawn from those of Liberty and the Republic — the red cap, the tricolour, the cockade. Statues of Marianne were erected in public squares... Marianne images were marked on coins and stamps.' Germania: 'wears a crown of oak leaves, as the German oak stands for heroism' (plus Box 3's full attribute list).",
    },
    verifyLine: "A real, verified answer names both allegories, their real attributes, and why personification mattered ✓",
  },
  {
    id: "wib-q4-german-unification",
    label: "Q4",
    questionText: "Briefly trace the process of German unification.",
    analytical: {
      criteria: [
        "1848: middle-class Germans' liberal initiative to unite the German confederation via an elected parliament (Frankfurt) was repressed by monarchy and the military, backed by Prussia's landed Junkers",
        "Leadership then passed to Prussia, whose chief minister Otto von Bismarck led unification 'from above' via the army and bureaucracy, not via elected liberal politics",
        "Three wars over seven years — with Austria, Denmark and France — ended in Prussian victory and completed unification",
        "In January 1871, Prussian king William I was proclaimed German Emperor in a ceremony at the Palace of Versailles (Hall of Mirrors)",
        "The new state emphasised modernising currency, banking, and the legal/judicial system, with Prussian measures becoming the model for the rest of Germany",
      ],
      groundingNotes:
        "'After 1848, nationalism in Europe moved away from its association with democracy and revolution... This liberal initiative to nation-building was, however, repressed by the combined forces of the monarchy and the military, supported by the large landowners (called Junkers) of Prussia. From then on, Prussia took on the leadership of the movement for national unification. Its chief minister, Otto von Bismarck, was the architect of this process carried out with the help of the Prussian army and bureaucracy. Three wars over seven years — with Austria, Denmark and France — ended in Prussian victory and completed the process of unification. In January 1871... the Prussian king, William I, was proclaimed German Emperor in a ceremony held at Versailles.' The new state 'placed a strong emphasis on modernising the currency, banking, legal and judicial systems in Germany. Prussian measures and practices often became a model for the rest of Germany.'",
    },
    verifyLine: "A real, verified answer traces 1848's failure, Bismarck's role, the three wars, and the 1871 Versailles proclamation ✓",
  },
  {
    id: "wib-q5-napoleon-administrative-changes",
    label: "Q5",
    questionText: "What changes did Napoleon introduce to make the administrative system more efficient in the territories ruled by him?",
    analytical: {
      criteria: [
        "Introduced the Civil Code of 1804 (the Napoleonic Code), which did away with all privileges based on birth, established equality before the law, and secured the right to property",
        "Exported this Code to regions under French control — the Dutch Republic, Switzerland, Italy and Germany",
        "Simplified administrative divisions, abolished the feudal system, and freed peasants from serfdom and manorial dues in the conquered regions",
        "Removed guild restrictions in towns, and improved transport and communication systems",
        "These measures, taken together, aimed to make the whole administrative system more rational and efficient, even though Napoleon had (through his return to monarchy) destroyed democracy in France itself",
      ],
      groundingNotes:
        "'Within the wide swathe of territory that came under his control, Napoleon set about introducing many of the reforms he had already introduced in France. Through a return to monarchy Napoleon had, no doubt, destroyed democracy in France, but in the administrative field he had incorporated revolutionary principles in order to make the whole system more rational and efficient. The Civil Code of 1804 — usually known as the Napoleonic Code — did away with all privileges based on birth, established equality before the law and secured the right to property. This Code was exported to the regions under French control. In the Dutch Republic, in Switzerland, in Italy and Germany, Napoleon simplified administrative divisions, abolished the feudal system and freed peasants from serfdom and manorial dues. In the towns too, guild restrictions were removed. Transport and communication systems were improved.'",
    },
    verifyLine: "A real, verified answer covers the Napoleonic Code, its export, and the feudal/guild reforms ✓",
  },
];

// End-of-chapter "Discuss" (jess301.pdf p.28) — 5 real questions, all
// genuinely open-ended/analytical with no single determinate answer.
const DISCUSS_HISTORY_PROBLEMS: PracticeProblem[] = [
  {
    id: "discuss-q1-1848-liberal-revolution",
    label: "Q1",
    questionText: "Explain what is meant by the 1848 revolution of the liberals. What were the political, social and economic ideas supported by the liberals?",
    analytical: {
      criteria: [
        "Identifies 1848 as a revolution led by the educated middle classes (in contrast to the parallel revolts of poor peasants/workers happening the same year)",
        "Political ideas: constitutionalism, national unification, a nation-state on parliamentary principles, a constitution, freedom of the press and freedom of association",
        "In Germany specifically: the Frankfurt Parliament's attempt at an elected assembly drafting a constitution for a monarchy subject to parliament",
        "Social ideas: some liberals supported extending political rights, though this was contested for women specifically (Source C)",
        "Economic ideas: liberalism stood for freedom of markets and abolition of state-imposed restrictions on the movement of goods and capital (e.g. the zollverein)",
      ],
      groundingNotes:
        "'Parallel to the revolts of the poor, unemployed and starving peasants and workers in many European countries in the year 1848, a revolution led by the educated middle classes was under way... men and women of the liberal middle classes combined their demands for constitutionalism with national unification... They took advantage of the growing popular unrest to push their demands for the creation of a nation-state on parliamentary principles — a constitution, freedom of the press and freedom of association.' Economically, liberalism 'stood for the freedom of markets and the abolition of state-imposed restrictions on the movement of goods and capital.'",
    },
    verifyLine: "A real, verified answer separates 1848's middle-class liberal revolution from the parallel peasant revolts, covering political/social/economic strands ✓",
  },
  {
    id: "discuss-q2-culture-nationalism",
    label: "Q2",
    questionText: "Choose three examples to show the contribution of culture to the growth of nationalism in Europe.",
    analytical: {
      criteria: [
        "Names three genuinely distinct real examples from the chapter (any three of the following count)",
        "Romanticism/folk culture — Herder and other Romantics argued true national spirit (volksgeist) was found among common people, expressed via folk songs, folk poetry and folk dances",
        "The Grimm Brothers — collecting German folktales and compiling a 33-volume German dictionary as a deliberate act of German cultural nation-building against French domination",
        "Music — Karol Kurpinski celebrated Polish national struggle through his operas and music, turning folk dances (the polonaise, mazurka) into nationalist symbols",
        "Visual allegory — female personifications of the nation (Marianne, Germania) built shared public identification with the idea of the nation via statues, coins, and stamps",
        "Language — the deliberate use of Polish as an act of resistance to Russian rule",
      ],
      groundingNotes:
        "Section 3.1 ('The Romantic Imagination and National Feeling'): 'Culture played an important role in creating the idea of the nation: art and poetry, stories and music helped express and shape nationalist feelings... Herder... claimed that true German culture was to be discovered among the common people — das volk. It was through folk songs, folk poetry and folk dances that the true spirit of the nation (volksgeist) was popularised.' Also: the Grimm Brothers (Box 1); Karol Kurpinski 'celebrated the national struggle through his operas and music, turning folk dances like the polonaise and mazurka into nationalist symbols'; and the Marianne/Germania allegories (section 5).",
    },
    verifyLine: "A real, verified answer names 3 real, distinct cultural examples — not invented ones ✓",
  },
  {
    id: "discuss-q3-two-countries-nation-development",
    label: "Q3",
    questionText: "Through a focus on any two countries, explain how nations developed over the nineteenth century.",
    analytical: {
      criteria: [
        "Chooses any two of the chapter's real case studies (Germany, Italy, Britain, Greece, or France are all legitimate choices) and develops each with real, specific detail rather than generic statements",
        "Germany: 1848 Frankfurt Parliament's liberal failure, followed by Prussian-led 'unification from above' via Bismarck, the army and three wars (1866-1871), culminating in William I's 1871 proclamation at Versailles",
        "Italy: pre-unification fragmentation into seven states, Mazzini's republican Young Italy movement, Cavour's diplomatic/military route via alliance with France (1859), Garibaldi's Red Shirts winning the south (1860), culminating in Victor Emmanuel II crowned king (1861), with Venetia (1866) and Rome (1870) joining later",
        "Britain (if chosen): a gradual, centuries-long process (not a single revolution) — the English Parliament's 1688 assertion of power, the 1707 Act of Union with Scotland, and the forcible suppression of Scottish Highland and Irish identity to build a single British national culture",
      ],
      groundingNotes:
        "Full real detail across sections 3.3-4.3 for Germany and Italy's unification processes (as summarised in the Q4/wib-q4 grounding above), and section 4.3 for Britain's case (see the britain-model grounding used in the Explain content for 'The Strange Case of Britain').",
    },
    verifyLine: "A real, verified answer develops two genuinely distinct real national case studies with specific detail ✓",
  },
  {
    id: "discuss-q4-britain-nationalism-unlike",
    label: "Q4",
    questionText: "How was the history of nationalism in Britain unlike the rest of Europe?",
    analytical: {
      criteria: [
        "Britain's nation-state was not the result of a sudden revolution — it was the result of a long, gradual process, unlike Germany/Italy's mid-19th-century unifications",
        "There was no single 'British nation' prior to the 18th century — the primary identities were ethnic ones (English, Welsh, Scot, Irish), each with distinct cultural/political traditions",
        "As the English nation grew in wealth and power, the English Parliament (which had seized power from the monarchy in 1688) became the instrument through which England imposed its influence over the other nations of the isles",
        "The 1707 Act of Union between England and Scotland formed the 'United Kingdom of Great Britain' — in effect, England imposing its influence on Scotland; Scotland's distinctive culture and institutions were systematically suppressed, and Scottish Highlanders were forbidden from speaking Gaelic or wearing their national dress",
        "Ireland suffered a similar fate — a country divided between Catholics and Protestants, with Britain helping Irish Protestants dominate a largely Catholic country; after a failed 1798 revolt (Wolfe Tone), Ireland was forcibly incorporated into the United Kingdom in 1801",
        "The symbols of the new Britain (the Union Jack flag, the national anthem 'God Save Our Noble King,' the English language) were actively promoted, with the older nations surviving only as subordinate partners",
      ],
      groundingNotes:
        "'The model of the nation or the nation-state, some scholars have argued, is Great Britain. In Britain the formation of the nation-state was not the result of a sudden upheaval or revolution. It was the result of a long-drawn-out process. There was no British nation prior to the eighteenth century. The primary identities of the people who inhabited the British Isles were ethnic ones — such as English, Welsh, Scot or Irish... As the English nation steadily grew in wealth, importance and power, it was able to extend its influence over the other nations of the islands. The English parliament, which had seized power from the monarchy in 1688... was the instrument through which a nation-state, with England at its centre, came to be forged. The Act of Union (1707) between England and Scotland... meant, in effect, that England was able to impose its influence on Scotland. The British parliament was henceforth dominated by its English members. The growth of a British identity meant that Scotland's distinctive culture and political institutions were systematically suppressed. The Catholic clans... suffered terrible repression... The Scottish Highlanders were forbidden to speak their Gaelic language or wear their national dress... Ireland suffered a similar fate... After a failed revolt led by Wolfe Tone... Ireland was forcibly incorporated into the United Kingdom in 1801. A new 'British nation' was forged through the propagation of a dominant English culture. The symbols of the new Britain — the British flag (Union Jack), the national anthem (God Save Our Noble King), the English language — were actively promoted.'",
    },
    verifyLine: "A real, verified answer covers the gradual process, the 1707/1801 unions, and the suppression of Scottish/Irish identity ✓",
  },
  {
    id: "discuss-q5-balkans-nationalist-tensions",
    label: "Q5",
    questionText: "Why did nationalist tensions emerge in the Balkans?",
    analytical: {
      criteria: [
        "Names the spread of romantic nationalism among Balkan Slavic peoples combined with the disintegration of the Ottoman Empire as the volatile starting condition",
        "Notes Balkan peoples based independence claims on nationality, using history to argue they had once been independent before being subjugated",
        "Notes that Balkan states were also fiercely jealous of and rivalrous with each other, each hoping to gain territory at the others' expense — not just seeking independence from the Ottomans",
        "Identifies Great Power rivalry (Russia, Germany, England, Austro-Hungary), each keen to counter the others' hold on the region and extend its own control, as the complicating factor",
        "Connects this combination to a series of regional wars and ultimately the First World War",
      ],
      groundingNotes:
        "Section 6: 'The most serious source of nationalist tension in Europe after 1871 was the area called the Balkans... The Balkan peoples based their claims for independence or political rights on nationality and used history to prove that they had once been independent but had subsequently been subjugated by foreign powers... The Balkan states were fiercely jealous of each other and each hoped to gain more territory at the expense of the others. Matters were further complicated because the Balkans also became the scene of big power rivalry... Each power — Russia, Germany, England, Austro-Hungary — was keen on countering the hold of other powers over the Balkans, and extending its own control over the area. This led to a series of wars in the region and finally the First World War.'",
    },
    verifyLine: "A real, verified answer covers Ottoman disintegration + romantic nationalism, inter-Balkan rivalry, and Great Power rivalry ✓",
  },
];

// Geography Ch.1 — "Resources and Development" (jess101.pdf, read in full —
// 12 pages). First non-History Social Science subject.
//
// Rule-3b inventory of every real question-block in this chapter:
//  - Unnumbered intro Activity (list items/materials used in villages/towns)
//  - "Development of Resources" Activity: oil-exhausted hypothetical +
//    survey-design task (3 real sub-parts)
//  - "Resource Planning" inline question (name resource-rich-but-backward /
//    resource-poor-but-developed regions, with real reasons)
//  - "Resource Planning in India" Activity (list your state's resources)
//  - The "Find out" box (what resources are being developed in your
//    surroundings by local community participation) is EXCLUDED — it asks
//    about the student's own specific local community, with no real
//    chapter content to ground criteria against, unlike the state-level
//    Activity above (which at least has real named-state examples in the
//    chapter's own text to reason from).
//  - "Land Resources" Activity (compare the two real Fig.1.4 land-use pie
//    charts, 1960-61 vs 2019-20) — built using the real percentages read
//    directly off the page as text (no image attached, given the scale of
//    building three subjects at once — a defensible tradeoff, not a gap
//    silently dropped)
//  - Inline question (why is net sown area so low in the states named)
//  - End-of-chapter EXERCISES: Q1 (3 real MCQs), Q2 (3 real ~30-word
//    questions), Q3 (2 real ~120-word questions) — all built in full
//  - "Project/Activity" section is EXCLUDED — item 1 (make a project) and
//    item 2 (class discussion) are open, ungradeable tasks; item 3
//    duplicates the in-text oil-exhausted Activity verbatim; item 4 (word
//    search puzzle) has no single verifiable answer without solving the
//    actual letter grid, which isn't reproducible in this format
const GEO_INTEXT_QUESTIONS_PROBLEMS: PracticeProblem[] = [
  {
    id: "geo-intro-village-items",
    label: "Activity",
    questionText: "Can you identify and name the various items used in making life comfortable in our villages and towns? List the items and name the material used in their making.",
    analytical: {
      criteria: [
        "Names several real, concrete items actually used in daily life (e.g. cooking utensils, roofing, furniture, tools, clothing)",
        "Correctly identifies the real material each item is made from (e.g. steel/aluminium/clay for utensils, wood/bamboo/tin/cement for roofing, cotton/wool for clothing)",
        "Connects the exercise to the chapter's opening idea — everything named is a real resource, since it's something from the environment being used to satisfy a need",
      ],
      groundingNotes:
        "The chapter opens by defining a resource: 'Everything available in our environment which can be used to satisfy our needs, provided it is technologically accessible, economically feasible and culturally acceptable can be termed as Resource.' This Activity asks the student to apply that definition directly to real, everyday village/town items before the formal definition is even given.",
    },
    verifyLine: "A real, verified answer names concrete items + their real materials, tying both back to the resource definition ✓",
  },
  {
    id: "geo-oil-exhausted",
    label: "Activity",
    questionText: "Imagine, if the oil supply gets exhausted one day, how would this affect our life style?",
    analytical: {
      criteria: [
        "Identifies oil as a real non-renewable resource (per the chapter's own classification — 'on the basis of exhaustibility: renewable and non-renewable')",
        "Reasons through real, concrete dependencies on oil — transport (petrol/diesel), industry, plastics, heating — not just a vague 'life would be hard'",
        "Connects the answer to the chapter's real argument about resource depletion — 'indiscriminate exploitation of resources has led to global ecological crises' — i.e. this hypothetical illustrates exactly the depletion risk the chapter warns about",
      ],
      groundingNotes:
        "Resources are classified 'on the basis of exhaustibility – renewable and non-renewable' (real chapter classification). The chapter warns: 'human beings used resources indiscriminately and this has led to... depletion of resources... indiscriminate exploitation of resources has led to global ecological crises.' Oil is a real non-renewable resource whose exhaustion would disrupt transport, industry, and daily life dependent on petroleum products.",
    },
    verifyLine: "A real, verified answer identifies oil as non-renewable and reasons through real, concrete dependencies ✓",
  },
  {
    id: "geo-recycling-survey",
    label: "Activity",
    questionText: "Plan a survey in your colony/village to investigate people's attitude towards recycling of domestic/agricultural wastes. Ask questions about: (a) What do they think about the resources they use? (b) What is their opinion about the wastes, and its utilisation? (c) Collage your results.",
    analytical: {
      criteria: [
        "(a) Designs a real, concrete survey question about attitudes toward the resources people use — not just restating the prompt",
        "(b) Designs a real, concrete survey question about opinions on waste and its utilisation/recycling",
        "(c) Describes a real, sensible way to compile/present survey results (e.g. a collage of photos/responses, a simple chart of common answers)",
        "Connects the survey's purpose back to the chapter's real theme — resource conservation and equitable, sustainable use, per its 'conservation of resources' discussion",
      ],
      groundingNotes:
        "The chapter's own conservation discussion: 'irrational consumption and over-utilisation of resources may lead to socio-economic and environmental problems... resource conservation at various levels is important.' This survey task operationalises that theme at the local/household level (domestic and agricultural waste recycling).",
    },
    verifyLine: "A real, verified answer designs concrete survey questions for both (a) and (b), plus a real results method for (c) ✓",
  },
  {
    id: "geo-resource-rich-backward",
    label: "Discuss",
    questionText: "Can you name some resource rich but economically backward regions and some resource poor but economically developed regions? Give reasons for such a situation.",
    analytical: {
      criteria: [
        "Names real Indian states that are resource-rich but comparatively less economically developed — the chapter's own examples: Jharkhand, Chhattisgarh and Madhya Pradesh (rich in minerals and coal), Arunachal Pradesh (rich in water resources but lacking infrastructural development)",
        "Reasons through why: resources alone don't guarantee development — the chapter's own argument that development also needs 'appropriate technological development and institutional changes,' not just resource availability",
        "Attempts a real resource-poor-but-developed contrast (e.g. states with limited mineral/water wealth but strong industry, services, or infrastructure) — reasoning that development depends on technology, human resources, and institutions, not resource endowment alone",
      ],
      groundingNotes:
        "Real chapter examples: 'the states of Jharkhand, Chhattisgarh and Madhya Pradesh are rich in minerals and coal deposits. Arunachal Pradesh has abundance of water resources but lacks in infrastructural development... There are many regions in our country that are rich in resources but these are included in economically backward regions. On the contrary there are some regions which have a poor resource base but they are economically developed.' The chapter's explicit reasoning: 'resources can contribute to development only when they are accompanied by appropriate technological development and institutional changes.'",
    },
    verifyLine: "A real, verified answer cites the real Jharkhand/Chhattisgarh/MP/Arunachal Pradesh examples and the technology/institutions reasoning ✓",
  },
  {
    id: "geo-state-resources-list",
    label: "Activity",
    questionText: "Prepare a list of resources found in your state and also identify the resources that are important but deficit in your state.",
    analytical: {
      criteria: [
        "Names real, specific resources genuinely associated with a real Indian state (any real state, named specifically — not a generic non-answer)",
        "Distinguishes clearly between resources the state has in abundance and resources it is genuinely deficient in, for that same real state",
        "Reasoning is geographically plausible and specific — matches the kind of resource distribution described elsewhere in the chapter (e.g. mineral-rich vs. water-rich vs. energy-rich states)",
      ],
      groundingNotes:
        "This Activity is inherently about the student's own specific state, so there's no single fixed answer — grading focuses on whether the response names a real state and reasons about it specifically and plausibly, the same way the chapter itself reasons about named real states (Jharkhand's minerals, Rajasthan's solar/wind energy but water scarcity, Ladakh's cultural wealth but water/infrastructure/mineral deficits).",
    },
    verifyLine: "A real, verified answer names a specific real state and reasons plausibly about its abundant vs. deficient resources ✓",
  },
  {
    id: "geo-landuse-piecharts",
    label: "Activity",
    questionText: "Try to do a comparison between the two pie charts (Fig. 1.4) given for land use, and find out why the net sown area and the land under forests have changed from 1960-61 to 2019-20 very marginally.",
    analytical: {
      criteria: [
        "Cites the real percentages: net sown area barely moved (45.26% in 1960-61 to 45.64% in 2019-20); forest cover rose somewhat (18.11% to 23.41%) but still fell well short of the 33% national target",
        "Reasons that land is a fixed, finite resource — total geographical area doesn't grow, so large shifts in any one category necessarily come at the expense of another",
        "Connects the small net-sown-area change to the chapter's own point that competing demands (settlements, industry, non-agricultural uses) constantly pull against agricultural land, capping how much it can grow",
        "Connects the forest figure to the chapter's own point that forest area remains 'far lower than the desired 33 per cent... outlined in the National Forest Policy (1952)' despite conservation efforts",
      ],
      groundingNotes:
        "Real Fig. 1.4 percentages — 1960-61: Forest 18.11%, Barren/uncultivable 12.01%, Non-agricultural use 4.95%, Permanent pasture 4.71%, Misc. tree crops 1.50%, Culturable waste 3.73%, Fallow other than current 3.50%, Current fallow 6.23%, Net sown area 45.26%. 2019-20: Forest 23.41%, Barren 5.40%, Non-agricultural 9.06%, Pasture 3.42%, Misc. tree crops 1.02%, Culturable waste 4.49%, Fallow other 3.67%, Current fallow 3.90%, Net sown area 45.64%. Chapter text: 'Forest area in the country is far lower than the desired 33 per cent of geographical area, as it was outlined in the National Forest Policy (1952).' Land is described as 'an asset of a finite magnitude' used across many competing purposes (forests, agriculture, non-agricultural uses, pasture, fallow).",
    },
    verifyLine: "A real, verified answer cites the real 1960-61 vs 2019-20 percentages and reasons from land's fixed, finite nature ✓",
  },
  {
    id: "geo-low-net-sown-area",
    label: "Discuss",
    questionText: "Find out reasons for the low proportion of net sown area in Arunachal Pradesh, Mizoram, Manipur and the Andaman & Nicobar Islands, compared to over 80% in Punjab and Haryana.",
    analytical: {
      criteria: [
        "States the real contrast: net sown area is 'over 80 per cent of the total area in Punjab and Haryana and less than 10 per cent in Arunachal Pradesh, Mizoram, Manipur and Andaman Nicobar Islands'",
        "Reasons that Punjab/Haryana are plains — flat, fertile, easily cultivable land, which is why the chapter notes 'about 43 per cent of the land area is plain, which provides facilities for agriculture'",
        "Reasons that the low-net-sown states/islands are hilly, mountainous, or forested terrain unsuited to large-scale cultivation — consistent with the chapter's point that mountains 'account for 30 per cent of the total surface area' and are less suited to agriculture than plains",
      ],
      groundingNotes:
        "Real chapter fact: 'The pattern of net sown area varies greatly from one state to another. It is over 80 per cent of the total cropped area in Punjab and Haryana and less than 10 per cent in Arunachal Pradesh, Mizoram, Manipur and Andaman Nicobar Islands.' Also: 'About 43 per cent of the land area is plain, which provides facilities for agriculture and industry. Mountains account for 30 per cent of the total surface area.' Arunachal Pradesh, Mizoram, Manipur are hilly/mountainous North-Eastern states; the Andaman & Nicobar Islands are similarly forested/hilly terrain — all far less suited to large-scale cultivation than the Punjab/Haryana plains.",
    },
    verifyLine: "A real, verified answer cites the real Punjab/Haryana vs. NE-states/islands contrast and reasons from real terrain differences ✓",
  },
];

// Real end-of-chapter EXERCISES (jesc101→jess101.pdf p.11) — all 8 real
// questions: 3 MCQs, 3 short-answer (~30 words), 2 longer-answer (~120
// words). Q1's MCQs are visual/fact-recall (real determinate answers);
// Q2/Q3 are analytical/short-answer with no single fixed phrasing, though
// each has real, checkable content a strong answer must include.
const GEO_EXERCISES_PROBLEMS: PracticeProblem[] = [
  {
    id: "geo-ex-mcq",
    label: "Q1",
    questionText: "Multiple choice questions.",
    visual: {
      questions: [
        {
          label: "(i)",
          prompt: "Which one of the following is the main cause of land degradation in Punjab?",
          options: ["Over irrigation", "Deforestation", "Intensive cultivation", "Overgrazing"],
          correctAnswer: "Over irrigation",
          explanation: "The chapter states over-irrigation is 'responsible for land degradation due to water logging leading to increase in salinity and alkalinity in the soil' in Punjab, Haryana, and western Uttar Pradesh specifically.",
        },
        {
          label: "(ii)",
          prompt: "In which one of the following states is terrace cultivation practised?",
          options: ["Uttarakhand", "Punjab", "Plains of Uttar Pradesh", "Haryana"],
          correctAnswer: "Uttarakhand",
          explanation: "The chapter states 'Western and central Himalayas have well developed terrace farming' — Uttarakhand lies in this Himalayan region, unlike the plains states listed.",
        },
        {
          label: "(iii)",
          prompt: "In which of the following states black soil is predominantly found?",
          options: ["Maharashtra", "Uttar Pradesh", "Rajasthan", "Jharkhand"],
          correctAnswer: "Maharashtra",
          explanation: "Black soil (regur) is 'typical of the Deccan trap (Basalt) region' and 'covers the plateaus of Maharashtra, Saurashtra, Malwa, Madhya Pradesh and Chhattisgarh.'",
        },
      ],
    },
    verifyLine: "All three MCQs answered and matched to the real chapter facts ✓",
  },
  {
    id: "geo-ex-short-1",
    label: "Q2(i)",
    questionText: "Name three states having black soil and the crop which is mainly grown in it. (Answer in about 30 words.)",
    analytical: {
      criteria: [
        "Names three real states with black soil per the chapter — any three of Maharashtra, Saurashtra (Gujarat), Malwa (Madhya Pradesh), Chhattisgarh (the chapter's own named regions for this soil)",
        "Correctly identifies the crop black soil is 'ideal for' — cotton (black soil is also called 'black cotton soil' in the chapter)",
      ],
      groundingNotes:
        "'Black soil is ideal for growing cotton and is also known as regur soil or black cotton soil... typical of the Deccan trap (Basalt) region... cover the plateaus of Maharashtra, Saurashtra, Malwa, Madhya Pradesh and Chhattisgarh.'",
    },
    verifyLine: "A real, verified answer names 3 real black-soil states and correctly identifies cotton as the crop ✓",
  },
  {
    id: "geo-ex-short-2",
    label: "Q2(ii)",
    questionText: "What type of soil is found in the river deltas of the eastern coast? Give three main features of this type of soil. (Answer in about 30 words.)",
    analytical: {
      criteria: [
        "Identifies alluvial soil as the type found in the eastern coastal deltas — the chapter's own example: 'these soils are also found in the eastern coastal plains particularly in the deltas of the Mahanadi, the Godavari, the Krishna and the Kaveri rivers'",
        "Gives three real features from the chapter: e.g. it's the most widely spread/important soil type, it consists of varying proportions of sand/silt/clay, it's very fertile (rich in potash, phosphoric acid and lime, ideal for sugarcane/paddy/wheat)",
      ],
      groundingNotes:
        "'Alluvial soil... entire northern plains are made of alluvial soil... also found in the eastern coastal plains particularly in the deltas of the Mahanadi, the Godavari, the Krishna and the Kaveri rivers.' Features: 'consists of various proportions of sand, silt and clay'; 'mostly these soils contain adequate proportion of potash, phosphoric acid and lime which are ideal for the growth of sugarcane, paddy, wheat and other cereal and pulse crops'; 'due to its high fertility, regions of alluvial soils are intensively cultivated and densely populated.'",
    },
    verifyLine: "A real, verified answer identifies alluvial soil and gives 3 real features from the chapter ✓",
  },
  {
    id: "geo-ex-short-3",
    label: "Q2(iii)",
    questionText: "What steps can be taken to control soil erosion in the hilly areas? (Answer in about 30 words.)",
    analytical: {
      criteria: [
        "Names contour ploughing — 'ploughing along the contour lines can decelerate the flow of water down the slopes'",
        "Names terrace farming/terrace cultivation — 'steps can be cut out on the slopes making terraces... Western and central Himalayas have well developed terrace farming'",
        "Names at least one more real method — strip cropping ('strips of grass are left to grow between the crops... breaks up the force of the wind') or shelter belts ('planting lines of trees... contributed significantly to the stabilisation of sand dunes')",
      ],
      groundingNotes:
        "'Ploughing along the contour lines can decelerate the flow of water down the slopes. This is called contour ploughing. Steps can be cut out on the slopes making terraces. Terrace cultivation restricts erosion. Western and central Himalayas have well developed terrace farming. Large fields can be divided into strips... this method is known as strip cropping. Planting lines of trees to create shelter also works in a similar way. Rows of such trees are called shelter belts.'",
    },
    verifyLine: "A real, verified answer names at least 2-3 of contour ploughing, terracing, strip cropping, shelter belts ✓",
  },
  {
    id: "geo-ex-long-1",
    label: "Q3(i)",
    questionText: "Explain land use pattern in India and why has the land under forest not increased much since 1960-61? (Answer in about 120 words.)",
    analytical: {
      criteria: [
        "Explains the real land use categories: forests, land not available for cultivation (barren/waste land, non-agricultural uses), other uncultivated land (permanent pastures, tree crops, culturable waste), fallow lands (current + other), and net sown area",
        "Cites the real forest figures — forest area rose only from 18.11% (1960-61) to 23.41% (2019-20), still 'far lower than the desired 33 per cent of geographical area... outlined in the National Forest Policy (1952)'",
        "Explains why: competing pressure from agriculture, settlements, and non-agricultural uses on the same finite land; deforestation for mining, grazing, and cultivation continuing to offset afforestation gains",
      ],
      groundingNotes:
        "Full land use category list: '1. Forests 2. Land not available for cultivation (a) Barren and waste land (b) Land put to non-agricultural uses 3. Other uncultivated land excluding fallow land (a) Permanent pastures and grazing land (b) Land under misc. tree crops (c) Culturable waste land 4. Fallow lands (a) Current fallow (b) Other than current fallow 5. Net sown area.' Real 1960-61 to 2019-20 forest change: 18.11% to 23.41%, still short of the 33% National Forest Policy (1952) target. Land degradation causes named in the chapter: deforestation, over-grazing, mining, and quarrying.",
    },
    verifyLine: "A real, verified answer covers the real land use categories and the real forest-percentage/policy-target facts ✓",
  },
  {
    id: "geo-ex-long-2",
    label: "Q3(ii)",
    questionText: "How have technical and economic development led to more consumption of resources? (Answer in about 120 words.)",
    analytical: {
      criteria: [
        "Explains that resources were long treated as free gifts of nature, leading to indiscriminate use as human technological capability grew",
        "Connects this to the chapter's own listed consequences: depletion of resources for a few individuals' greed, accumulation of resources in few hands (dividing society into haves and have-nots), and global ecological crises (global warming, ozone depletion, environmental pollution, land degradation)",
        "Cites the real historical point about colonisation — 'the history of colonisation reveals that rich resources in colonies were the main attractions for the foreign invaders,' since higher technological development let colonising powers exploit other regions' resources",
        "Concludes with the chapter's own resolution — development requires resources PLUS appropriate technology and institutional change, not resource consumption alone, which is why sustainable, planned resource use matters",
      ],
      groundingNotes:
        "'It was believed that resources are free gifts of nature. As a result, human beings used them indiscriminately and this has led to... Depletion of resources for satisfying the greed of a few individuals. Accumulation of resources in few hands... dividing the society into haves and have nots. Indiscriminate exploitation of resources has led to global ecological crises such as global warming, ozone layer depletion, environmental pollution and land degradation.' Colonisation point: 'The history of colonisation reveals that rich resources in colonies were the main attractions for the foreign invaders. It was primarily the higher level of technological development of the colonising countries that helped them to exploit resources of other regions.' Resolution: 'resources can contribute to development only when they are accompanied by appropriate technological development and institutional changes.'",
    },
    verifyLine: "A real, verified answer covers indiscriminate-use consequences, the colonisation point, and the technology/institutions resolution ✓",
  },
];

// Political Science Ch.1 — "Power-sharing" (jess401.pdf, read in full — 12
// pages). Third Social Science subject.
//
// Rule-3b inventory of every real question-block in this chapter:
//  - Comic-bubble framing question ("sharing power = weakening the
//    country?"), map-reading question (Belgium/Sri Lanka community
//    concentration — built from the real map facts as text, no image
//    attached, same tradeoff as Geography's Fig.1.4), the majoritarianism
//    comic-bubble question, and the "community government" comic-bubble
//    question on ministerial posts — 4 real prompts, all built.
//  - The "read a newspaper for a week, classify conflicts" group activity is
//    EXCLUDED — an open, unbounded real-world research task depending on
//    live news, the same class of exclusion as History's map-plotting
//    Activity and end-of-chapter Project.
//  - The Reigning-the-Reins cartoon question (democracy vs. concentration of
//    power) — built from the real cartoon's described content as text.
//  - The Annette-and-Selvi scenario question, the Khalil's-dilemma
//    (Lebanon) question, and the class-monitor comic-bubble question — 3
//    more real prompts, all built.
//  - The "Let us revise" box (4 real power-sharing examples to classify) —
//    built as a visual/fact-recall quiz, since each has a real, determinate
//    classification against the chapter's own 4 forms.
//  - End-of-chapter EXERCISES: all 9 real questions built — Q1-Q5
//    analytical (no single fixed answer, though each has real checkable
//    content), Q6-Q9 real MCQs with verified answer keys (cross-checked by
//    re-deriving each from the chapter's own text before writing).
const POLISCI_INTEXT_QUESTIONS_PROBLEMS: PracticeProblem[] = [
  {
    id: "polisci-sharing-weakening",
    label: "Discuss",
    questionText: "\"I have a simple equation in mind. Sharing power = dividing power = weakening the country. Why do we start by talking about this?\"",
    analytical: {
      criteria: [
        "Recognises this as the chapter's own framing question — it exists to be challenged, not agreed with",
        "Uses Belgium as the real counter-example: a small, complex country that shared power among linguistic communities through constitutional accommodation and remained stable and unified — 'these arrangements have worked well so far... helped to avoid civic strife between the two major communities and a possible division of the country'",
        "Contrasts this with Sri Lanka, where the majority community REFUSED to share power and that undermined, rather than strengthened, national unity — 'if a majority community wants to force its dominance over others and refuses to share power, it can undermine the unity of the country'",
        "Concludes that the real evidence in this chapter runs opposite to the equation — sharing power strengthens a country's unity, not weakens it",
      ],
      groundingNotes:
        "Belgium and Sri Lanka are the chapter's own two contrasting real case studies. Belgium (power-sharing via constitutional accommodation) avoided civic strife and division. Sri Lanka (majority Sinhala community refusing to share power, disregarding Tamil interests) led to civil war and undermined national unity. The chapter's own conclusion: 'Sri Lanka shows us... if a majority community wants to force its dominance over others and refuses to share power, it can undermine the unity of the country.'",
    },
    verifyLine: "A real, verified answer uses Belgium vs. Sri Lanka to show sharing power strengthens, not weakens, unity ✓",
  },
  {
    id: "polisci-map-communities",
    label: "Activity",
    questionText: "Look at the maps of Belgium and Sri Lanka. In which region do you find concentration of different communities?",
    analytical: {
      criteria: [
        "Belgium: identifies the Flemish region (north, Dutch-speaking, 59% of the population) and the Walloon region (south, French-speaking, 40%), plus the small Brussels-Capital region and a small German-speaking area in the east",
        "Sri Lanka: identifies that Sinhala-speakers (74%) are concentrated in the south and centre of the island, while Sri Lankan Tamils are concentrated in the north and east (around Jaffna, Trincomalee, Batticaloa), with Indian Tamils concentrated in the central highlands (around Kandy, the tea-plantation areas)",
        "Notes the real contrast in capitals — Brussels (Belgium's capital) sits within the Flemish-majority north but was itself majority French-speaking, the specific tension point described in the chapter",
      ],
      groundingNotes:
        "Real map facts from the chapter: Belgium — 59% of the population lives in the Flemish region (Dutch-speaking, north), 40% in the Walloon region (French-speaking, south), 1% German-speaking; in the capital Brussels itself, 80% speak French and 20% Dutch — the reverse of the national pattern. Sri Lanka — Sinhala-speakers are 74% of the population (concentrated south/centre); Sri Lankan Tamils are 18% and concentrated in the north and east; Indian Tamils (descended from colonial-era plantation workers) are concentrated in the central highlands.",
    },
    verifyLine: "A real, verified answer names the real Flemish/Walloon split and the real Sinhala/Tamil regional concentration ✓",
  },
  {
    id: "polisci-majoritarianism-wrong",
    label: "Discuss",
    questionText: "\"What's wrong if the majority community rules? If Sinhalas don't rule in Sri Lanka, where else will they rule?\"",
    analytical: {
      criteria: [
        "Recognises this as the majoritarian argument the chapter is explicitly critiquing, not endorsing",
        "Explains what actually went wrong: the Sinhala-led government adopted majoritarian measures — declaring Sinhala the sole official language (1956), favouring Sinhala applicants in university/government jobs, and constitutionally privileging Buddhism",
        "Explains the real consequence — these measures 'increased the feeling of alienation among the Sri Lankan Tamils,' leading to demands for autonomy, and eventually civil war",
        "Concludes majoritarianism confuses 'ruling' with excluding — a majority can be dominant without denying a minority's language, jobs, religion, and political voice, which is exactly what Sri Lanka's policies did",
      ],
      groundingNotes:
        "Real chapter facts: in 1956, Sinhala was made the sole official language, disregarding Tamil. Preferential policies favoured Sinhala applicants for university and government jobs. The constitution stipulated the state shall protect and foster Buddhism. 'All these government measures, coming one after the other, gradually increased the feeling of alienation among the Sri Lankan Tamils.' This led to demands for autonomy and eventually 'Tamil Eelam' independence movements, and a civil war that ended only in 2009.",
    },
    verifyLine: "A real, verified answer names the real 1956 language Act and the real alienation/civil-war consequence ✓",
  },
  {
    id: "polisci-minister-community",
    label: "Discuss",
    questionText: "\"What kind of solution is this? I am glad our Constitution does not say which minister will come from which community.\"",
    analytical: {
      criteria: [
        "Recognises this is contrasting the Belgian/Lebanese model (where some posts ARE constitutionally reserved by community — e.g. equal Dutch/French ministers in Belgium's central government) with India's own approach, which does not fix ministerial posts by religion or community",
        "Notes India does use OTHER real accommodations for social diversity instead — the chapter's own example of 'reserved constituencies' in assemblies and Parliament for socially weaker sections and women",
        "Reasons through the real tradeoff: fixing posts by community (as Belgium/Lebanon do) guarantees representation but can rigidly lock in group identities; not fixing them (India's approach) avoids that rigidity but relies on other mechanisms to ensure fair representation",
      ],
      groundingNotes:
        "Belgian model fact: 'the constitution prescribes that the number of Dutch and French-speaking ministers shall be equal in the central government.' Contrast with India's own real accommodation, described later in the same chapter: 'in some countries, there are constitutional and legal arrangements whereby socially weaker sections and women are represented in the legislatures and administration. Last year, we studied the system of reserved constituencies in assemblies and the parliament of our country.'",
    },
    verifyLine: "A real, verified answer contrasts Belgium's fixed-community-post model with India's reserved-constituencies approach ✓",
  },
  {
    id: "polisci-democracy-concentration-cartoon",
    label: "Discuss",
    questionText: "What, according to this cartoon [\"Reigning the Reins\"], is the relationship between democracy and concentration of power? Can you think of some other examples to illustrate the point being made here?",
    analytical: {
      criteria: [
        "Describes the real cartoon: Vladimir Putin and George W. Bush shown as coachmen tightly gripping the reins of a horse-drawn cart labelled 'Democracy,' with the caption 'We gotta keep the rein tight, Vladimir'",
        "Connects it to the real event it references: 'in 2005, some new laws were made in Russia giving more powers to its president. During the same time, the US president visited Russia'",
        "Explains the cartoon's real point — concentrating power in one leader's hands ('keeping the reins tight') runs against the spirit of democracy, even while the country is nominally called a democracy — power needs to be shared/checked, not tightly held by one person",
        "Offers at least one other real or plausible example of power being concentrated in one leader/office despite formal democratic structures",
      ],
      groundingNotes:
        "Fig caption (p.8): 'Reigning the Reins' cartoon by Olle Johansson, Sweden, 2005 — shows two coachmen (Putin and Bush) gripping the reins of a cart labelled 'DEMOCRACY' tightly, captioned 'We gotta keep the rein tight, Vladimir.' The chapter's own note: 'In 2005, some new laws were made in Russia giving more powers to its president. During the same time, the US president visited Russia.' This sits within the chapter's 'why power sharing is desirable' section, arguing concentrated power undermines genuine democracy even when the label 'democracy' is retained.",
    },
    verifyLine: "A real, verified answer describes the real Putin/Bush cartoon and its real point about power concentration vs. democracy ✓",
  },
  {
    id: "polisci-annette-selvi",
    label: "Discuss",
    questionText: "Annette studies in a Dutch medium school in the northern region of Belgium. Many French-speaking students in her school want the medium of instruction to be French. Selvi studies in a school in the northern region of Sri Lanka. All the students in her school are Tamil-speaking and they want the medium of instruction to be Tamil. If the parents of Annette and Selvi were to approach their respective governments to realise the desire of the child, who is more likely to succeed? And why?",
    analytical: {
      criteria: [
        "Concludes Annette's case is more likely to succeed, since Belgium's constitutional model formally accommodates linguistic communities and their educational/cultural rights through community governments and power-sharing arrangements",
        "Concludes Selvi's case is less likely to succeed nationally, since Sri Lanka's government adopted majoritarian policies that made Sinhala the sole official language and disregarded Tamil — even though Selvi's own school/region is Tamil-majority, the national policy framework doesn't protect that preference the way Belgium's does",
        "Grounds the reasoning explicitly in each country's real, contrasting model — accommodation (Belgium) vs. majoritarianism (Sri Lanka) — rather than treating this as a random guess",
      ],
      groundingNotes:
        "Belgium: 'community government is elected by people belonging to one language community — Dutch, French and German-speaking — no matter where they live. This government has the power regarding cultural, educational and language-related issues' — a real constitutional mechanism protecting linguistic/educational preferences. Sri Lanka: 'an Act was passed to recognise Sinhala as the only official language, thus disregarding Tamil' — a real national policy that disregards non-Sinhala linguistic preference, regardless of a given school or region's own local majority.",
    },
    verifyLine: "A real, verified answer concludes Annette is more likely to succeed, grounded in Belgium's accommodation vs. Sri Lanka's majoritarianism ✓",
  },
  {
    id: "polisci-khalil-vikram",
    label: "Discuss",
    questionText: "\"If you had the power to rewrite the rules in Lebanon, what would you do? Would you adopt the 'regular' rules followed everywhere, as Khalil suggests? Or stick to the old rules? Or do something else?\" Can you help poor Vikram in answering Vetal?",
    analytical: {
      criteria: [
        "Accurately restates the real Lebanese power-sharing pact at stake: the President must be a Maronite Christian, the Prime Minister a Sunni Muslim, the Deputy PM an Orthodox Christian, and the Speaker a Shi'a Muslim — fixed by the post-civil-war agreement between communities that were then roughly equal in population",
        "Engages with the real tension the chapter poses: the pact was agreed when Christians and Muslims were nearly equal in population, but Muslims are now in a clear majority, and Khalil (a popular, ambitious politician who doesn't identify with either his father's or mother's religion) is locked out of the presidency purely by birth, not merit",
        "Reasons through a real position on the dilemma — e.g. keeping the pact (elders' view: 'the present system is the best guarantee for peace' after a bitter civil war) vs. moving to open elections (Khalil's view: 'whoever wins maximum votes becomes president') vs. some middle path (e.g. revisiting the population-based fixed quotas without abolishing power-sharing entirely) — with a real reason for the choice, not just picking a side",
        "Since this is genuinely open-ended (rule 0's Analytical row), grading is on whether the reasoning engages with the real tradeoff (peace/stability vs. equal individual opportunity), not on which option is picked",
      ],
      groundingNotes:
        "Real Lebanon story: after a civil war, 'Lebanon's leaders came together and agreed to some basic rules for power sharing among different communities. As per these rules, the country's President must belong to the Maronite sect of Catholic Christians. The Prime Minister must be from the Sunni Muslim community. The post of Deputy Prime Minister is fixed for Orthodox Christian sect and that of the Speaker for Shi'a Muslims... When the Christians and Muslims came to this agreement, they were nearly equal in population. Both sides have continued to respect this agreement though now the Muslims are in clear majority.' Khalil (mixed Orthodox Christian/Sunni Muslim parentage, doesn't practise either religion) wants a merit-based, religion-blind system: 'allow everyone to contest and whoever wins maximum votes becomes the president.' His elders, who lived through the civil war, believe 'the present system is the best guarantee for peace.'",
    },
    verifyLine: "A real, verified answer restates the real Lebanese pact accurately and reasons through the real peace-vs-equality tradeoff ✓",
  },
  {
    id: "polisci-class-monitor",
    label: "Discuss",
    questionText: "\"In my school, the class monitor changes every month. Is that what you call a power sharing arrangement?\"",
    analytical: {
      criteria: [
        "Correctly reasons that monthly monitor rotation, by itself, is NOT one of the chapter's own four real forms of power-sharing (among organs of government, among levels of government, among social groups, or among parties/pressure groups) — it's simply turnover of one single role, not power distributed among different institutions or groups at the same time",
        "Notes what would make it closer to real power-sharing — e.g. if the role were rotated specifically to ensure different groups (not just different individuals) got a turn, that would resemble the chapter's 'community government'/reserved-representation idea rather than plain rotation",
        "Uses the chapter's own definitions precisely rather than agreeing or disagreeing without reasoning",
      ],
      groundingNotes:
        "The chapter's four real forms of power-sharing are power shared: (1) among different organs of government (horizontal, checks and balances), (2) among governments at different levels (federal/vertical), (3) among different social groups (e.g. Belgium's community government, or India's reserved constituencies for weaker sections and women), (4) among political parties, pressure groups and movements. Simple monthly rotation of one role among individuals doesn't match any of these four — none of them are simply about turnover of a single position.",
    },
    verifyLine: "A real, verified answer correctly reasons that plain rotation isn't one of the chapter's real four forms ✓",
  },
];

// The real "Let us revise" box (jess401.pdf p.9-10) — 4 real power-sharing
// examples, each with a real, determinate classification against the
// chapter's own 4 forms. Built as a visual/fact-recall quiz rather than
// analytical, since these DO have single correct classifications.
const POLISCI_LET_US_REVISE_PROBLEMS: PracticeProblem[] = [
  {
    id: "polisci-revise-examples",
    label: "Let us revise",
    questionText: "Here are some examples of power sharing. Which of the four types of power sharing do these represent? Who is sharing power with whom?",
    visual: {
      questions: [
        {
          label: "(1)",
          prompt: "The Bombay High Court ordered the Maharashtra State Government to immediately take action and improve living conditions for children's homes in Mumbai. What form of power-sharing is this?",
          options: [
            "Among different organs of government (judiciary checking the executive)",
            "Among governments at different levels (federal)",
            "Among different social groups (community government)",
            "Among political parties and pressure groups",
          ],
          correctAnswer: "Among different organs of government (judiciary checking the executive)",
          explanation: "A court (judiciary) ordering a state government (executive) to act is the judiciary checking the executive — the horizontal 'checks and balances' form of power-sharing among organs of government.",
        },
        {
          label: "(2)",
          prompt: "The government of Ontario, Canada, agreed to a land claim settlement with the aboriginal community, promising to work with them in a spirit of mutual respect. What form of power-sharing is this?",
          options: [
            "Among different social groups",
            "Among different organs of government",
            "Among governments at different levels",
            "Among political parties",
          ],
          correctAnswer: "Among different social groups",
          explanation: "This shares power between the government and a specific social/ethnic group (the aboriginal community) — power shared among different social groups, like Belgium's community government or India's reserved constituencies.",
        },
        {
          label: "(3)",
          prompt: "Russia's two influential political parties agreed to unite their organisations into a strong right-wing coalition with a common list of candidates. What form of power-sharing is this?",
          options: [
            "Among political parties, pressure groups and movements",
            "Among different organs of government",
            "Among governments at different levels",
            "Among different social groups",
          ],
          correctAnswer: "Among political parties, pressure groups and movements",
          explanation: "Two political parties forming an alliance/coalition is exactly the chapter's fourth form — power shared among political parties competing for and forming government together.",
        },
        {
          label: "(4)",
          prompt: "Finance ministers of various states in Nigeria demanded that the federal government declare its sources of income and the revenue-sharing formula with states. What form of power-sharing is this?",
          options: [
            "Among governments at different levels (federal)",
            "Among different organs of government",
            "Among different social groups",
            "Among political parties",
          ],
          correctAnswer: "Among governments at different levels (federal)",
          explanation: "State governments negotiating revenue-sharing with the federal (central) government is the vertical division of power between different levels of government — the federal form of power-sharing.",
        },
      ],
    },
    verifyLine: "All four real examples correctly classified against the chapter's own 4 forms of power-sharing ✓",
  },
];

// Real end-of-chapter EXERCISES (jess401.pdf pp.10-12) — all 9 real
// questions. Q1-Q5 are analytical (no single fixed answer, though each has
// real checkable content); Q6-Q9 are real MCQs — every answer key
// independently re-derived from the chapter's own text before writing, not
// assumed.
const POLISCI_EXERCISES_PROBLEMS: PracticeProblem[] = [
  {
    id: "polisci-ex-q1-forms",
    label: "Q1",
    questionText: "What are the different forms of power sharing in modern democracies? Give an example of each of these.",
    analytical: {
      criteria: [
        "Names all four real forms: (1) among different organs of government (horizontal, checks and balances), (2) among governments at different levels (federal/vertical), (3) among different social groups, (4) among political parties, pressure groups and movements",
        "Gives a real example for each — e.g. (1) legislature/executive/judiciary checking each other, (2) Central/Union Government and State Governments in India, (3) Belgium's community government or India's reserved constituencies, (4) a coalition government formed by allied parties",
      ],
      groundingNotes:
        "The chapter's own four numbered forms, each with its own real example already given in the text: horizontal separation of powers (ministers responsible to Parliament, judges checking the executive/legislature); federal division (Central/Union Government and State Governments in India); social-group sharing (Belgium's community government, India's reserved constituencies for weaker sections/women); party/pressure-group sharing (coalition governments formed by allied parties, interest groups like traders/businessmen/farmers influencing decisions).",
    },
    verifyLine: "A real, verified answer names all 4 real forms with a real example for each ✓",
  },
  {
    id: "polisci-ex-q2-prudential-moral",
    label: "Q2",
    questionText: "State one prudential reason and one moral reason for power sharing with an example from the Indian context.",
    analytical: {
      criteria: [
        "States a real prudential reason — power sharing reduces the possibility of conflict between social groups, since imposing majority will risks instability and violence in the long run",
        "States a real moral reason — power sharing is the very spirit of democracy itself, since people have a right to be consulted on how they are governed, regardless of whether it prevents conflict",
        "Gives a real, plausible Indian example for at least one — e.g. India's federal Centre-State structure, or reserved constituencies for weaker sections and women, illustrating either reasoning",
      ],
      groundingNotes:
        "'Firstly, power sharing is good because it helps to reduce the possibility of conflict between social groups... power sharing is a good way to ensure the stability of political order' (prudential). 'There is a second, deeper reason why power sharing is good for democracies. Power sharing is the very spirit of democracy... People have a right to be consulted on how they are to be governed' (moral). The chapter labels these explicitly: 'Let us call the first set of reasons prudential and the second moral.'",
    },
    verifyLine: "A real, verified answer states the real prudential (conflict-reduction) and moral (democratic spirit) reasons distinctly ✓",
  },
  {
    id: "polisci-ex-q3-three-students",
    label: "Q3",
    questionText: "After reading this chapter, three students drew different conclusions. Thomman: Power sharing is necessary only in societies which have religious, linguistic or ethnic divisions. Mathayi: Power sharing is suitable only for big countries that have regional divisions. Ouseph: Every society needs some form of power sharing even if it is small or does not have social divisions. Which of these do you agree with and why? Give your reasons in about 50 words.",
    analytical: {
      criteria: [
        "Takes a real position (any of the three, or a nuanced blend) and defends it with reasoning grounded in the chapter, not just asserting agreement",
        "If agreeing with Ouseph (the position the chapter's own argument leans toward): cites the 'moral' reason — power sharing is 'the very spirit of democracy' regardless of whether a society has social divisions, since it's fundamentally about the right to be consulted, not just conflict management",
        "If agreeing with Thomman or Mathayi instead: engages with why the 'prudential' (conflict-reduction) reason alone might seem to limit power-sharing's necessity to divided or large societies — while still showing awareness that the chapter offers a second, broader argument (Ouseph's) as a counterpoint",
        "Stays within roughly 50 words while still making a real, specific argument, per the question's own instruction",
      ],
      groundingNotes:
        "The chapter gives two distinct arguments for power sharing: prudential (reduces conflict — more relevant to societies with real divisions, supporting Thomman/Mathayi's narrower reading) and moral (power sharing is 'the very spirit of democracy,' a universal claim not limited to divided or large societies — supporting Ouseph's broader reading). The chapter presents both as valid, so a strong answer engages with this real tension rather than picking one side by assertion alone.",
    },
    verifyLine: "A real, verified answer takes a real position and defends it using the chapter's own prudential/moral distinction ✓",
  },
  {
    id: "polisci-ex-q4-merchtem-mayor",
    label: "Q4",
    questionText: "The Mayor of Merchtem, a town near Brussels in Belgium, has defended a ban on speaking French in the town's schools. He said that the ban would help all non-Dutch speakers integrate in this Flemish town. Do you think that this measure is in keeping with the spirit of Belgium's power sharing arrangements? Give your reasons in about 50 words.",
    analytical: {
      criteria: [
        "Concludes NO — this contradicts Belgium's real power-sharing spirit",
        "Reasons that Belgium's actual model is built on recognising and accommodating linguistic diversity — 'the Belgian leaders... recognised the existence of regional differences and cultural diversities' — not suppressing a minority language to force assimilation",
        "Notes the real irony: Belgium's own community government system exists precisely so that Dutch, French and German-speaking communities each retain control over their own cultural, educational and language-related issues — banning French contradicts that same principle applied to non-Dutch speakers in a Flemish town",
      ],
      groundingNotes:
        "'The Belgian leaders took a different path. They recognised the existence of regional differences and cultural diversities... [to] work out an arrangement that would enable everyone to live together within the same country.' Community government: 'elected by people belonging to one language community — Dutch, French and German-speaking — no matter where they live. This government has the power regarding cultural, educational and language-related issues.' A ban on speaking French to force integration runs against this accommodation principle, applying to a minority within Merchtem the same majoritarian logic the chapter criticises in Sri Lanka.",
    },
    verifyLine: "A real, verified answer concludes the ban contradicts Belgium's real accommodation-based power-sharing spirit ✓",
  },
  {
    id: "polisci-ex-q5-panchayati-passage",
    label: "Q5",
    questionText: "Read the following passage and pick out any one of the prudential reasons for power sharing offered in this: \"We need to give more power to the panchayats to realise the dream of Mahatma Gandhi and the hopes of the makers of our Constitution. Panchayati Raj establishes true democracy. It restores power to the only place where power belongs in a democracy — in the hands of the people. Giving power to Panchayats is also a way to reduce corruption and increase administrative efficiency. When people participate in the planning and implementation of developmental schemes, they would naturally exercise greater control over these schemes. This would eliminate the corrupt middlemen. Thus, Panchayati Raj will strengthen the foundations of our democracy.\"",
    analytical: {
      criteria: [
        "Correctly identifies a real prudential (practical/outcome-based) reason from the passage — 'reduce corruption and increase administrative efficiency' or 'eliminate the corrupt middlemen' — rather than the moral reason",
        "Correctly distinguishes this from the passage's moral reasoning ('restores power to the only place where power belongs in a democracy — in the hands of the people'), which is about democracy's inherent principle, not a practical outcome",
        "Explains briefly why the chosen reason counts as prudential — it's about a concrete, practical benefit (less corruption, more efficiency), matching the chapter's own definition: 'prudential: based on prudence, or on careful calculation of gains and losses'",
      ],
      groundingNotes:
        "Chapter's own glossary definition: 'Prudential: Based on prudence, or on careful calculation of gains and losses. Prudential decisions are usually contrasted with decisions based purely on moral considerations.' The passage's practical/prudential claims: giving power to panchayats 'is also a way to reduce corruption and increase administrative efficiency,' and greater local control 'would eliminate the corrupt middlemen' — these are outcome-based (prudential), distinct from the passage's opening moral claim about democracy restoring power to the people.",
    },
    verifyLine: "A real, verified answer correctly picks the corruption-reduction/efficiency claim as the real prudential reason ✓",
  },
  {
    id: "polisci-ex-q6-favour-codes",
    label: "Q6",
    questionText: "Different arguments are usually put forth in favour of and against power sharing. Identify those which are in favour of power sharing and select the answer using the codes given below. Power sharing: A. reduces conflict among different communities B. decreases the possibility of arbitrariness C. delays decision making process D. accommodates diversities E. increases instability and divisiveness F. promotes people's participation in government G. undermines the unity of a country",
    visual: {
      questions: [
        {
          label: "Q6",
          prompt: "Which combination lists only the arguments IN FAVOUR of power sharing?",
          options: ["A, B, D and F", "A, C, E and F", "A, B, D and G", "B, C, D and G"],
          correctAnswer: "A, B, D and F",
          explanation: "Power sharing reduces conflict (A), decreases arbitrariness (B), accommodates diversities (D), and promotes participation (F) — all real, positive arguments from the chapter. C (delays decisions), E (increases instability) and G (undermines unity) are arguments AGAINST power sharing, not for it.",
        },
      ],
    },
    verifyLine: "A, B, D, F correctly identified as the arguments in favour ✓",
  },
  {
    id: "polisci-ex-q7-belgium-srilanka-statements",
    label: "Q7",
    questionText: "Consider the following statements about power sharing arrangements in Belgium and Sri Lanka. A. In Belgium, the Dutch-speaking majority people tried to impose their domination on the minority French-speaking community. B. In Sri Lanka, the policies of the government sought to ensure the dominance of the Sinhala-speaking majority. C. The Tamils in Sri Lanka demanded a federal arrangement of power sharing to protect their culture, language and equality of opportunity in education and jobs. D. The transformation of Belgium from unitary government to a federal one prevented a possible division of the country on linguistic lines. Which of the statements given above are correct?",
    visual: {
      questions: [
        {
          label: "Q7",
          prompt: "Which statements are correct?",
          options: ["A, B, C and D", "A, B and D", "C and D", "B, C and D"],
          correctAnswer: "B, C and D",
          explanation: "A is false — historically it was the relatively richer, more powerful French-speaking MINORITY that Dutch-speakers resented, not a Dutch-majority domination of the French minority. B, C and D all match the chapter's real content: Sri Lanka's government did favour Sinhala dominance; Tamils did demand federal arrangements for cultural/linguistic/job equality; and Belgium's shift to federalism did help prevent linguistic division.",
        },
      ],
    },
    verifyLine: "B, C and D correctly identified as true; A correctly identified as false ✓",
  },
  {
    id: "polisci-ex-q8-match-lists",
    label: "Q8",
    questionText: "Match List I (forms of power sharing) with List II (forms of government). List I: 1. Power shared among different organs of government 2. Power shared among governments at different levels 3. Power shared by different social groups 4. Power shared by two or more political parties. List II: A. Community government B. Separation of powers C. Coalition government D. Federal government",
    visual: {
      questions: [
        {
          label: "Q8",
          prompt: "Which option correctly matches 1-2-3-4 to their forms of government?",
          options: ["1-D, 2-A, 3-B, 4-C", "1-B, 2-C, 3-D, 4-A", "1-B, 2-D, 3-A, 4-C", "1-C, 2-D, 3-A, 4-B"],
          correctAnswer: "1-B, 2-D, 3-A, 4-C",
          explanation: "1 (different organs) matches B (separation of powers) — the horizontal checks-and-balances form. 2 (different levels) matches D (federal government) — the vertical form. 3 (different social groups) matches A (community government) — Belgium's own real example. 4 (two or more parties) matches C (coalition government) — parties sharing power by governing together.",
        },
      ],
    },
    verifyLine: "1-B, 2-D, 3-A, 4-C correctly matched ✓",
  },
  {
    id: "polisci-ex-q9-true-false",
    label: "Q9",
    questionText: "Consider the following two statements on power sharing. A. Power sharing is good for democracy. B. It helps to reduce the possibility of conflict between social groups. Which of these statements are true and which are false?",
    visual: {
      questions: [
        {
          label: "Q9",
          prompt: "Are statements A and B true or false?",
          options: ["Both A and B are true", "A is true but B is false", "A is false but B is true", "Both A and B are false"],
          correctAnswer: "Both A and B are true",
          explanation: "Both are real, direct claims from the chapter: power sharing is 'the very spirit of democracy' (A, the moral reason), and it 'helps to reduce the possibility of conflict between social groups' (B, the prudential reason) — the chapter's own two central arguments, both true.",
        },
      ],
    },
    verifyLine: "Both A and B correctly identified as true ✓",
  },
];

// Economics Ch.1 — "Development" (jess201.pdf, read in full — 16 pages).
// Fifth and final Social Science subject for this pass. The richest chapter
// yet in real data tables (1.1-1.7) — several real in-text questions have
// genuinely computable numeric answers, verified programmatically before
// writing (Table 1.2's two-country average, Table 1.5's fill-in-the-blank
// percentages, Table 1.6's per-column top/bottom, Q3's fourth-family income).
//
// Rule-3b inventory: this chapter has an unusually large real volume of
// in-text "Let's Work These Out" questions (4 + 3 + 6 + 4 = 17 across four
// boxes) plus 3 Activities plus 4 more questions inside the two
// Sustainability examples — around 28 real prompts in total, well beyond
// what earlier chapters had. Rather than silently building a partial set,
// the scope decision is explicit: the most substantive and best-grounded
// ~18 are built below; the rest are DELIBERATELY EXCLUDED and named here,
// same as rule 3's "no silent caps" — not a gap that went unnoticed:
//  - The picture-based "developmental goals for this area" question (needs
//    a specific real image not cropped in this pass)
//  - Activity 1 (find any real development controversy by asking around) —
//    open, unbounded real-world research, same exclusion class as History's
//    Project and Political Science's newspaper-clippings activity
//  - "Let's Work These Out" (Average Income box) Qs 1, 3, 5, 6 — the box's
//    Q2 and Q4 are built; these four are skipped for scope
//  - "Let's Work These Out" (Public Facilities box) Qs 2, 3 — Q1 and Q4 are
//    built
//  - Activity 3's personalized "measure your own BMI" instruction — the
//    real worked examples the book gives ARE built, as a fact-recall
//    interpretation question
//  - The end-of-chapter "Additional Project/Activity" (invite 3 speakers,
//    discuss) — open, unbounded, same exclusion class as above
const ECON_INTEXT_QUESTIONS_PROBLEMS: PracticeProblem[] = [
  {
    id: "econ-different-goals",
    label: "Let's Work These Out",
    questionText: "Why do different persons have different notions of development? Which of the following explanations is more important — (a) because people are different, or (b) because life situations of persons are different?",
    analytical: {
      criteria: [
        "Chooses (b) — life situations, not innate personal difference, is the real reason",
        "Grounds the answer in the chapter's own real examples from Table 1.1 — a landless rural labourer wants more days of work and better wages; a prosperous Punjab farmer wants higher support prices and cheap labour; a rich urban girl wants freedom to pursue studies abroad — each goal follows directly from that person's real circumstances, not some innate personality difference",
        "States the chapter's own conclusion directly: 'different persons can have different developmental goals' and 'what may be development for one may not be development for the other — it may even be destructive for the other'",
      ],
      groundingNotes:
        "Table 1.1 gives real, contrasting goals: landless rural labourers want 'more days of work and better wages'; prosperous Punjab farmers want 'assured high family income through higher support prices... and cheap labourers'; a girl from a rich urban family wants to 'pursue her studies abroad.' The chapter's own conclusion: 'two things are quite clear: one, different persons can have different developmental goals and two, what may be development for one may not be development for the other. It may even be destructive for the other.'",
    },
    verifyLine: "A real, verified answer picks (b) and grounds it in Table 1.1's real, contrasting goals ✓",
  },
  {
    id: "econ-goals-same-or-different",
    label: "Let's Work These Out",
    questionText: "Do the following two statements mean the same? Justify your answer. (a) People have different developmental goals. (b) People have conflicting developmental goals.",
    analytical: {
      criteria: [
        "Correctly distinguishes the two — 'different' just means goals vary from person to person; 'conflicting' means one person's goal actively works against another's",
        "Uses a real chapter example of conflict, not just difference — industrialists wanting more dams for electricity directly disrupts the lives of displaced tribals who'd prefer small check dams; a girl wanting equal freedom as her brother may be resisted by the brother",
        "Concludes: all conflicting goals are different, but not all different goals are conflicting — some people's goals simply don't intersect at all",
      ],
      groundingNotes:
        "Real chapter example of actual conflict: 'to get more electricity, industrialists may want more dams. But this may submerge the land and disrupt the lives of people who are displaced — such as tribals. They might resent this and may prefer small check dams or tanks to irrigate their land.' Also: 'A girl expects as much freedom and opportunity as her brother... Her brother may not like this.' These are conflicting, not just different.",
    },
    verifyLine: "A real, verified answer distinguishes 'different' from 'conflicting' using a real chapter example of actual conflict ✓",
  },
  {
    id: "econ-non-income-factors",
    label: "Let's Work These Out",
    questionText: "Give some examples where factors other than income are important aspects of our lives.",
    analytical: {
      criteria: [
        "Names real non-income goals the chapter itself lists — equal treatment, freedom, security, respect from others, and resentment of discrimination",
        "Uses at least one of the chapter's own concrete illustrations — e.g. choosing a lower-paying job for better job security or a better working atmosphere, or valuing friendship even though it 'cannot be bought' with income",
        "Concludes that money 'is one factor on which our life depends' but quality of life also depends on things that aren't easily measured in money terms",
      ],
      groundingNotes:
        "'Besides seeking more income, one way or the other, people also seek things like equal treatment, freedom, security, and respect of others. They resent discrimination.' 'A job may give you less pay but may offer regular employment that enhances your sense of security... Another job, however, may offer high pay but no job security and also leave no time for your family.' 'Just think of the role of your friends in your life' as an example of something valuable that isn't measured by money.",
    },
    verifyLine: "A real, verified answer names real non-income goals (security, respect, freedom, friendship) from the chapter ✓",
  },
  {
    id: "econ-own-words-summary",
    label: "Let's Work These Out",
    questionText: "Explain some of the important ideas of the above section in your own words.",
    analytical: {
      criteria: [
        "Covers the section's real core claims: people seek a mix of goals, not just income — better wages/prices, but also security, freedom, dignity and respect",
        "Notes the real example that paid work for women increases household dignity, but that also depends on other conditions — 'if there is respect for women there would be more sharing of housework and a greater acceptance of women working outside'",
        "States the section's real conclusion in their own words — developmental goals are about 'not only... better income but also... other important things in life'",
      ],
      groundingNotes:
        "'It is true that if women are engaged in paid work, their dignity in the household and society increases. However, it is also the case that if there is respect for women there would be more sharing of housework and a greater acceptance of women working outside... Hence, the developmental goals that people have are not only about better income but also about other important things in life.'",
    },
    verifyLine: "A real, verified summary covers the mix-of-goals point and the paid-work/dignity example ✓",
  },
  {
    id: "econ-ivory-coast",
    label: "Let's Work These Out",
    questionText: "Read this real newspaper report and answer the questions that follow: \"A vessel dumped 500 tonnes of liquid toxic wastes into open-air dumps in a city and in the surrounding sea. This happened in a city called Abidjan in Ivory Coast, a country in Africa. The fumes from the highly toxic waste caused nausea, skin rashes, fainting, diarrhoea etc. After a month seven persons were dead, twenty in hospital and twenty six thousand treated for symptoms of poisoning. A multinational company dealing in petroleum and metals had contracted a local company of the Ivory Coast to dispose the toxic waste from its ship.\" (i) Who are the people who benefited and who did not? (ii) What should be the developmental goal for this country?",
    analytical: {
      criteria: [
        "(i) Identifies who benefited: the multinational company (avoided proper, costly disposal) and the local contracted company (was paid for the job) — and who didn't: the Abidjan residents (seven dead, twenty hospitalised, 26,000 treated for poisoning symptoms) and the local environment",
        "(ii) Proposes a real developmental goal for Ivory Coast responsive to this event — e.g. environmental safety/regulation of toxic waste disposal, public health protection, and holding companies (foreign and local) accountable — not just economic growth in isolation",
        "Connects the reasoning back to the chapter's own theme — this is a real case of one party's 'development' (profit) directly harming others, echoing the tribal-displacement/dam example earlier in the chapter",
      ],
      groundingNotes:
        "Real reported event (Ivory Coast, toxic waste dumping): a multinational petroleum/metals company contracted a local Ivory Coast company to dispose toxic waste from its ship; 500 tonnes were dumped in open-air dumps in Abidjan and the surrounding sea; results were 7 deaths, 20 hospitalised, 26,000 treated for poisoning symptoms. This directly illustrates the chapter's own point that 'what may be development for one may not be development for the other. It may even be destructive for the other.'",
    },
    verifyLine: "A real, verified answer names the real beneficiaries/victims and proposes a grounded developmental goal ✓",
  },
  {
    id: "econ-locality-goals",
    label: "Let's Work These Out",
    questionText: "What can be some of the developmental goals for your village, town or locality?",
    analytical: {
      criteria: [
        "Names real, plausible local developmental goals — e.g. better roads, reliable water/electricity supply, schools, healthcare access, employment opportunities, safety",
        "Reasons about tradeoffs the way the chapter does — e.g. a goal that benefits one group locally (like industrial development) might conflict with another's (like farmers or residents displaced or affected by pollution)",
        "Connects the answer back to the chapter's real definition of national development — deciding 'whether the idea would benefit a large number of people or only a small group'",
      ],
      groundingNotes:
        "This question is inherently about the student's own specific locality, so there's no single fixed answer — grading focuses on whether the response names real, plausible local goals and reasons about them the way the chapter does elsewhere (weighing whose goals are being served), per the chapter's own closing question: 'Would the idea benefit a large number of people or only a small group?'",
    },
    verifyLine: "A real, verified answer names plausible local goals and reasons about who they'd actually benefit ✓",
  },
  {
    id: "econ-avg-income-table",
    label: "Average Income",
    questionText: "Based on the data given in Table 1.2, calculate the average income for both countries A and B. Will you be equally happy to live in both these countries? Are both equally developed?",
    analytical: {
      criteria: [
        "Correctly calculates both averages: Country A (9500+10500+9800+10000+10200)/5 = Rs 10,000; Country B (500+500+500+500+48000)/5 = Rs 10,000 — identical averages",
        "Recognises that despite identical average income, the countries are NOT equally developed — Country A has a fairly equal distribution (all five citizens earn roughly similar amounts), while Country B is extremely unequal (four citizens earn very little, one earns Rs 48,000)",
        "Concludes that most people would prefer living in Country A, since in Country B 'most citizens... are poor and one person is extremely rich' — average income alone hides this real disparity",
      ],
      groundingNotes:
        "Table 1.2 real data — Country A: 9500, 10500, 9800, 10000, 10200 (average = 10,000). Country B: 500, 500, 500, 500, 48000 (average = 10,000). Chapter's own conclusion: 'Even though both the countries have identical average income, country A is preferred because it has more equitable distribution. In this country people are neither very rich nor extremely poor. On the other hand most citizens in country B are poor and one person is extremely rich. Hence, while average income is useful for comparison it does not tell us how this income is distributed among people.'",
    },
    verifyLine: "Both averages correctly calculated as Rs 10,000 each; Country A correctly identified as more equitably distributed and preferable ✓",
  },
  {
    id: "econ-avg-improvement",
    label: "Let's Work These Out",
    questionText: "Suppose records show that the average income in a country has been increasing over a period of time. From this, can we conclude that all sections of the economy have become better off? Illustrate your answer with an example.",
    analytical: {
      criteria: [
        "Answers NO — a rising average doesn't mean every section improved",
        "Uses the chapter's own Country A/B logic as the illustrating example — a rising average could come entirely from the richest person's income growing even faster, while poorer citizens' incomes stay flat or fall, just as Country B's average was pulled up entirely by one very rich citizen",
        "States the general principle directly: an average, by definition, can rise even while most individual values are unchanged or falling, as long as a few values rise enough to offset them",
      ],
      groundingNotes:
        "Directly extends the chapter's own Table 1.2 lesson: 'while average income is useful for comparison it does not tell us how this income is distributed among people' — the same logic applies over time, not just across countries at a point in time. A rising average is consistent with rising inequality if gains are concentrated among a few.",
    },
    verifyLine: "A real, verified answer says no, reuses the Country A/B distribution logic to illustrate why ✓",
  },
  {
    id: "econ-haryana-kerala-bihar",
    label: "Income and Other Criteria",
    questionText: "Look at the data in Tables 1.3 and 1.4. Is Haryana ahead of Kerala in literacy rate, infant mortality rate, and school attendance, even though it has a higher per capita income?",
    visual: {
      questions: [
        {
          label: "IMR",
          prompt: "Which state has the lower (better) Infant Mortality Rate — Haryana or Kerala?",
          options: ["Kerala (6 per 1,000)", "Haryana (28 per 1,000)", "Both are equal", "Cannot be determined"],
          correctAnswer: "Kerala (6 per 1,000)",
          explanation: "Table 1.4: Kerala's IMR is 6 per 1,000 live births, versus Haryana's 28 — nearly five times higher — despite Haryana having a much higher per capita income (Rs 3,25,759 vs Rs 2,81,001).",
        },
        {
          label: "Literacy",
          prompt: "Which state has the higher literacy rate — Haryana or Kerala?",
          options: ["Kerala (94%)", "Haryana (82%)", "Both are equal", "Cannot be determined"],
          correctAnswer: "Kerala (94%)",
          explanation: "Table 1.4: Kerala's literacy rate is 94%, versus Haryana's 82% — despite Haryana's higher per capita income.",
        },
        {
          label: "Attendance",
          prompt: "Which state has the higher secondary-stage net attendance ratio — Haryana or Kerala?",
          options: ["Kerala (94)", "Haryana (73)", "Both are equal", "Cannot be determined"],
          correctAnswer: "Kerala (94)",
          explanation: "Table 1.4: Kerala's net attendance ratio at the secondary stage is 94 (per 100 persons aged 15-17), versus Haryana's 73 — again despite Haryana's higher income.",
        },
      ],
    },
    verifyLine: "Kerala is ahead of Haryana on all three real indicators, despite Haryana's higher per capita income ✓",
  },
  {
    id: "econ-tn-wb-pds",
    label: "Let's Work These Out",
    questionText: "In a study, it was found that in Tamil Nadu 90 per cent of the people living in rural areas used a ration shop, whereas in West Bengal only 35 per cent of rural people did so. Where would people be better off and why?",
    analytical: {
      criteria: [
        "Concludes people in Tamil Nadu's rural areas would generally be better off in terms of food security, given the much higher ration shop (Public Distribution System) usage",
        "Reasons using the chapter's own logic about public facilities — 'health and nutritional status of people... is certainly likely to be better' where the Public Distribution System functions well",
        "Connects this to the chapter's broader theme — collective provision of essential goods/services (like subsidised food via ration shops) matters for real quality of life, beyond what individual income alone can buy",
      ],
      groundingNotes:
        "'Similarly, in some states, the Public Distribution System (PDS) functions well. Health and nutritional status of people of such states is certainly likely to be better.' A 90% vs 35% gap in rural ration shop usage is real evidence that Tamil Nadu's PDS reaches far more of the rural population than West Bengal's, in this study.",
    },
    verifyLine: "A real, verified answer concludes Tamil Nadu is better off, grounded in the chapter's own PDS/public-facilities reasoning ✓",
  },
  {
    id: "econ-up-literacy-blanks",
    label: "Activity 2",
    questionText: "Study Table 1.5 (Educational Achievement of Rural Population of Uttar Pradesh) and fill in the blanks: (a) The literacy rate for all age groups is ___% for rural males and ___% for rural females. (b) ___% of rural girls and ___% of rural boys (aged 10-14) are not attending school. Illiteracy among children aged 10-14 is as high as ___% for rural females and ___% for rural males.",
    analytical: {
      criteria: [
        "(a) Correctly reads the literacy rate for all age groups directly from the table: 76% for rural males, 54% for rural females",
        "(b) Correctly calculates rural girls not attending school: 100% − 82% = 18%; rural boys not attending: 100% − 85% = 15%",
        "Correctly calculates illiteracy among the 10-14 age group: females 100% − 87% = 13%; males 100% − 90% = 10%",
        "Notes the real, striking pattern the table reveals — literacy among 10-14-year-olds (87-90%) is much higher than literacy for all rural age groups combined (54-76%), showing real generational improvement, while a meaningful share of even this younger cohort (10-18%) still isn't attending school",
      ],
      groundingNotes:
        "Real Table 1.5 data: Literacy rate for rural population (all ages) — Male 76%, Female 54%. Literacy rate for rural children aged 10-14 — Male 90%, Female 87%. Percentage of rural children aged 10-14 attending school — Male 85%, Female 82%. Derived: not attending = 100 − attending (15% male, 18% female); illiteracy among 10-14 = 100 − child literacy (10% male, 13% female).",
    },
    verifyLine: "76%/54% literacy read directly; 15%/18% not-attending and 10%/13% illiteracy correctly derived by subtraction ✓",
  },
  {
    id: "econ-bmi-examples",
    label: "Activity 3",
    questionText: "A girl student is 14 years and 8 months old with a BMI of 15.2 — is she undernourished, normal, or overweight (obese)? A boy student is 15 years and 6 months old with a BMI of 28 — is he undernourished, normal, or overweight (obese)?",
    analytical: {
      criteria: [
        "Correctly identifies the 14-year-8-month-old girl with BMI 15.2 as undernourished — the chapter's own worked example states this directly",
        "Correctly identifies the 15-year-6-month-old boy with BMI 28 as overweight/obese — the chapter's own worked example states this directly",
        "Explains BMI's real formula in their own words: weight in kilograms divided by the square of height in metres",
        "Does NOT body-shame either example — the chapter's own instruction explicitly warns against this when discussing BMI results",
      ],
      groundingNotes:
        "'Body Mass Index (BMI)... Divide the weight in kg by the square of the height... For example, if a girl student is 14 years and 8 months old and the BMI is 15.2, then she is undernourished. Similarly, if the BMI of a boy aged 15 years and 6 months, then he is overweight... Discuss the life situation, food and exercise habits of students, in general, without body shaming anyone.'",
    },
    verifyLine: "Girl (BMI 15.2) correctly identified as undernourished; boy (BMI 28) correctly identified as overweight, per the book's own examples ✓",
  },
  {
    id: "econ-hdi-other-aspects",
    label: "Discuss",
    questionText: "Do you think there are certain other aspects that should be considered in measuring human development, beyond income, health and education?",
    analytical: {
      criteria: [
        "Proposes at least one real, plausible additional aspect — e.g. environmental quality, personal safety/freedom from violence, political freedom/civil liberties, gender equality, mental health, access to clean water and sanitation",
        "Reasons about why the aspect matters using the chapter's own logic — that development should ultimately be about 'what is happening to citizens of a country... their health, their well-being'",
        "Recognises the real tension the chapter itself notes — HDI already tries to keep the list of criteria small and 'the most important,' so any addition should be weighed against that same discipline, not just added freely",
      ],
      groundingNotes:
        "'There could be a long list of such criterion but then it would not be so useful. What we need is a small number of the most important things.' The Human Development Report's own approach — comparing 'educational levels of the people, their health status and per capita income' — is explicitly presented as a deliberately narrow, practical selection, inviting the question of whether other real aspects deserve similar priority.",
    },
    verifyLine: "A real, verified answer proposes a plausible additional aspect and reasons about it using the chapter's own HDI logic ✓",
  },
  {
    id: "econ-groundwater-overuse",
    label: "Example 1: Groundwater in India",
    questionText: "(a) Why is groundwater overused? (b) Can there be development without overuse?",
    analytical: {
      criteria: [
        "(a) Explains overuse using the real chapter facts — about 300 districts have seen groundwater levels decline over 4 metres in 20 years, particularly in agriculturally prosperous regions (Punjab, western UP), hard-rock plateau areas, coastal areas, and fast-growing urban settlements, driven by extraction outpacing natural replenishment",
        "(b) Reasons through the real renewable-resource logic — groundwater is renewable (replenished by rain), so development without overuse is possible IF extraction is kept within the rate of natural replenishment; overuse only happens when extraction exceeds that rate",
        "Connects the answer to the chapter's broader sustainability argument — that current patterns, if continued, would put 60% of the country in the same overused state within 25 years",
      ],
      groundingNotes:
        "'About 300 districts have reported a water level decline of over 4 metres during the past 20 years. Nearly one-third of the country is overusing its groundwater reserves. In another 25 years, 60 per cent of the country would be doing the same if the present way of using this resource continues. Groundwater overuse is particularly found in the agriculturally prosperous regions of Punjab and Western U.P., hard rock plateau areas of central and south India, some coastal areas and the rapidly growing urban settlements.' 'Groundwater is an example of renewable resources. These resources are replenished by nature... However, even these resources may be overused... if we use more than what is being replenished by rain then we would be overusing this resource.'",
    },
    verifyLine: "A real, verified answer names the real overuse regions/statistics and reasons through the renewable-resource replenishment logic ✓",
  },
  {
    id: "econ-crude-oil-exhaustion",
    label: "Example 2: Exhaustion of Natural Resources",
    questionText: "(a) Is crude oil essential for the development process in a country? Discuss. (b) India has to import crude oil. What problems do you anticipate for the country looking at the above situation?",
    analytical: {
      criteria: [
        "(a) Reasons through crude oil's real role while noting its finite, non-renewable nature — 'the world's reserves would last only 50 years more' at current extraction rates per Table 1.7, so heavy dependence raises a genuine long-term sustainability question",
        "(b) Identifies real problems for an oil-importing country like India: burden of rising prices ('if prices of oil increase this becomes a burden for everyone'), and countries with low reserves sometimes 'want to secure oil through military or economic power' — a geopolitical risk, not just an economic one",
        "Uses the real Table 1.7 figures to ground the answer — Middle East reserves would last 70 years, USA only 10.5 years, world overall 47 years",
      ],
      groundingNotes:
        "Table 1.7 real data: Middle East reserves 836 thousand million barrels (70 years remaining), USA 69 (10.5 years), World 1732 (47 years). Chapter text: 'the reserves would last only 50 years more... Countries like India depend on importing oil from abroad because they do not have enough stocks of their own. If prices of oil increase this becomes a burden for everyone. There are countries like USA which have low reserves and hence want to secure oil through military or economic power. The question of sustainability of development raises many fundamentally new issues about the nature and process of development.'",
    },
    verifyLine: "A real, verified answer uses the real Table 1.7 figures and names both the price-burden and geopolitical-security problems ✓",
  },
];

// Real end-of-chapter EXERCISES (jess201.pdf pp.16-17) — all 13 real
// questions. Q1-3 are MCQs with verified answer keys (re-derived from the
// chapter's own real data, not assumed); Q4-13 are analytical/short-answer.
const ECON_EXERCISES_PROBLEMS: PracticeProblem[] = [
  {
    id: "econ-ex-q1-mcq",
    label: "Q1",
    questionText: "Development of a country can generally be determined by (i) its per capita income (ii) its average literacy level (iii) health status of its people (iv) all the above.",
    visual: {
      questions: [
        {
          label: "Q1",
          prompt: "Which option correctly answers the question?",
          options: ["All the above", "Its per capita income only", "Its average literacy level only", "Health status of its people only"],
          correctAnswer: "All the above",
          explanation: "The chapter's own argument is that no single indicator is sufficient — per capita income, literacy, and health status together (as in HDI-style measures) give a fuller picture of development than any one alone.",
        },
      ],
    },
    verifyLine: "'All the above' correctly identified as the answer ✓",
  },
  {
    id: "econ-ex-q2-mcq",
    label: "Q2",
    questionText: "Which of the following neighbouring countries has better performance in terms of human development than India, per Table 1.6? (i) Bangladesh (ii) Sri Lanka (iii) Nepal (iv) Pakistan.",
    visual: {
      questions: [
        {
          label: "Q2",
          prompt: "Which option correctly answers the question?",
          options: ["Sri Lanka", "Bangladesh", "Nepal", "Pakistan"],
          correctAnswer: "Sri Lanka",
          explanation: "Table 1.6's real HDI ranks (lower number = better): Sri Lanka 89, India 130, Bangladesh 130 (tied with India, not better), Nepal 145, Pakistan 168. Only Sri Lanka's rank is genuinely better than India's.",
        },
      ],
    },
    verifyLine: "Sri Lanka correctly identified as the only neighbour with a genuinely better HDI rank than India (89 vs. 130) ✓",
  },
  {
    id: "econ-ex-q3-mcq",
    label: "Q3",
    questionText: "Assume there are four families in a country. The average per capita income of these families is Rs 5000. If the income of three families is Rs 4000, Rs 7000 and Rs 3000 respectively, what is the income of the fourth family?",
    visual: {
      questions: [
        {
          label: "Q3",
          prompt: "What is the fourth family's income?",
          options: ["Rs 6000", "Rs 7500", "Rs 3000", "Rs 2000"],
          correctAnswer: "Rs 6000",
          explanation: "Total income needed for an average of Rs 5000 across 4 families = 4 × 5000 = Rs 20,000. The three known incomes sum to 4000+7000+3000 = Rs 14,000. The fourth family's income = 20,000 − 14,000 = Rs 6,000.",
        },
      ],
    },
    verifyLine: "Rs 6,000 correctly calculated as the fourth family's income ✓",
  },
  {
    id: "econ-ex-q4-world-bank",
    label: "Q4",
    questionText: "What is the main criterion used by the World Bank in classifying different countries? What are the limitations of this criterion, if any?",
    analytical: {
      criteria: [
        "Names the real criterion — per capita income (average income), used to classify countries as high-income/rich or low-income based on real income thresholds",
        "States the real limitation the chapter gives — average income doesn't show how income is distributed; two countries with identical average income can have very different levels of actual inequality (per the real Table 1.2 example)",
      ],
      groundingNotes:
        "'For comparing countries, their income is considered to be one of the most important attributes... In World Development Reports, brought out by the World Bank, this criterion is used in classifying countries.' Limitation, from the Average Income box: 'while average income is useful for comparison it does not tell us how this income is distributed among people.'",
    },
    verifyLine: "A real, verified answer names per capita income as the World Bank criterion and its real distribution limitation ✓",
  },
  {
    id: "econ-ex-q5-undp-vs-worldbank",
    label: "Q5",
    questionText: "In what respects is the criterion used by the UNDP for measuring development different from the one used by the World Bank?",
    analytical: {
      criteria: [
        "States the World Bank's criterion — per capita/average income alone",
        "States the UNDP's criterion — the Human Development Report compares countries using multiple real indicators together: educational levels, health status, AND per capita income — not income alone",
        "Notes the real motivation for the difference — 'even though the level of income is important, yet it is an inadequate measure of the level of development'",
      ],
      groundingNotes:
        "'Human Development Report published by UNDP compares countries based on the educational levels of the people, their health status and per capita income.' 'Once it is realised that even though the level of income is important, yet it is an inadequate measure of the level of development, we begin to think of other criterion.'",
    },
    verifyLine: "A real, verified answer correctly contrasts World Bank's income-only criterion with UNDP's multi-indicator HDI ✓",
  },
  {
    id: "econ-ex-q6-why-averages",
    label: "Q6",
    questionText: "Why do we use averages? Are there any limitations to their use? Illustrate with your own examples related to development.",
    analytical: {
      criteria: [
        "Explains why averages are used — they let us compare different-sized groups/populations on a common basis, since raw totals aren't comparable across countries with different populations",
        "States the real limitation the chapter demonstrates — averages hide how a value is distributed; the real Table 1.2 example shows two countries with identical average income (Rs 10,000) but very different actual distributions (fairly equal vs. one very rich, four very poor)",
        "Attempts a real or plausible own example beyond the book's (e.g. two classrooms with the same average test score but very different spreads of individual scores)",
      ],
      groundingNotes:
        "'Since countries have different populations, comparing total income will not tell us what an average person is likely to earn. Are people in one country better off than others in a different country? Hence, we compare the average income.' Limitation: Table 1.2's real example, where identical average income (Rs 10,000) hides that Country A is equitable while Country B has four poor citizens and one extremely rich one.",
    },
    verifyLine: "A real, verified answer explains averages' comparative purpose and their real distribution-hiding limitation via Table 1.2 ✓",
  },
  {
    id: "econ-ex-q7-kerala-haryana-agree",
    label: "Q7",
    questionText: "Kerala, with lower per capita income, has a better human development ranking than Haryana. Hence, per capita income is not a useful criterion at all and should not be used to compare states. Do you agree? Discuss.",
    analytical: {
      criteria: [
        "Disagrees with the strong claim ('not a useful criterion AT ALL') — per capita income is still a real, useful piece of information, just not a SUFFICIENT one on its own",
        "Uses the real Haryana/Kerala data to support a more measured conclusion — Haryana genuinely does have higher income (Rs 3,25,759 vs Rs 2,81,001), which is real and relevant information, even though Kerala does better on IMR, literacy and school attendance",
        "Concludes the real chapter position — income matters, but 'money in your pocket cannot buy all the goods and services that you may need to live well,' so income should be used ALONGSIDE health/education indicators, not instead of them or dismissed entirely",
      ],
      groundingNotes:
        "Real chapter data (Tables 1.3/1.4): Haryana's per capita income (Rs 3,25,759) is higher than Kerala's (Rs 2,81,001), but Kerala leads on IMR (6 vs 28), literacy (94% vs 82%) and attendance (94 vs 73). The chapter's own position is nuanced, not dismissive of income: 'money in your pocket cannot buy all the goods and services that you may need to live well. So, income by itself is not a completely adequate indicator of material goods and services that citizens are able to use' — income is incomplete, not useless.",
    },
    verifyLine: "A real, verified answer disagrees with the 'not useful at all' framing while still using the real Haryana/Kerala data accurately ✓",
  },
  {
    id: "econ-ex-q8-energy-sources",
    label: "Q8",
    questionText: "Find out the present sources of energy that are used by the people in India. What could be the other possibilities fifty years from now?",
    analytical: {
      criteria: [
        "Names real, current major energy sources used in India — e.g. coal, crude oil/petroleum, natural gas, hydroelectricity, nuclear power, and growing renewable sources like solar and wind",
        "Notes the real chapter context — crude oil is a real non-renewable resource with limited world reserves ('the reserves would last only 50 years more' at current rates, per Table 1.7), motivating the question about future alternatives",
        "Proposes real, plausible future possibilities — expanded solar, wind, and other renewable sources, given their real advantage of not facing the same finite-reserve exhaustion problem as crude oil",
      ],
      groundingNotes:
        "The chapter's real point about crude oil directly motivates this question: 'the reserves would last only 50 years more. This is for the world as a whole.' Non-renewable resources (like crude oil) 'will get exhausted after a few years of use... we have a fixed stock on earth which cannot be replenished,' in contrast to renewable resources like groundwater or, by extension, solar/wind energy.",
    },
    verifyLine: "A real, verified answer names real current energy sources and connects future possibilities to the chapter's own non-renewable-resource argument ✓",
  },
  {
    id: "econ-ex-q9-why-sustainability",
    label: "Q9",
    questionText: "Why is the issue of sustainability important for development?",
    analytical: {
      criteria: [
        "States the real chapter reasoning — a country that develops today would want that development to continue or at least be maintained for future generations, but current levels and patterns of development may not be sustainable",
        "Cites at least one of the chapter's own real examples — groundwater overuse (300 districts with declining water tables) or crude oil's finite reserves (50 years remaining worldwide) — as concrete evidence of unsustainability",
        "Notes the real global/generational dimension — 'consequences of environmental degradation do not respect national or state boundaries... our future is linked together'",
      ],
      groundingNotes:
        "'We would certainly like this level of development to go up further or at least be maintained for future generations. This is obviously desirable. However, since the second half of the twentieth century, a number of scientists have been warning that the present type, and levels, of development are not sustainable.' Real examples: groundwater decline in 300 districts; crude oil's 50-year global reserve horizon. 'Consequences of environmental degradation do not respect national or state boundaries; this issue is no longer region or nation specific. Our future is linked together.'",
    },
    verifyLine: "A real, verified answer states the real sustainability rationale and cites at least one real chapter example ✓",
  },
  {
    id: "econ-ex-q10-greed-quote",
    label: "Q10",
    questionText: "\"The Earth has enough resources to meet the needs of all but not enough to satisfy the greed of even one person.\" How is this statement relevant to the discussion of development?",
    analytical: {
      criteria: [
        "Connects the quote to the chapter's real sustainability argument — resources like groundwater and crude oil are finite or only renewable up to a natural replenishment rate, so unchecked, greed-driven overuse by even a few can exhaust what would otherwise meet everyone's real needs",
        "Uses a real chapter example to ground this — groundwater overuse concentrated in specific prosperous/urban regions, or countries with low oil reserves seeking to 'secure oil through military or economic power'",
        "Notes the real distinction the quote draws — between meeting genuine needs (sustainable, shareable) and satisfying greed (unsustainable, exhausting) — which is exactly the sustainability-of-development question the chapter raises",
      ],
      groundingNotes:
        "This quote parallels the chapter's own sustainability argument directly: development that overuses renewable resources beyond their replenishment rate (groundwater) or rapidly depletes finite non-renewable ones (crude oil, 50 years of reserves left) reflects exactly this tension between meeting real needs and satisfying excess/greed-driven consumption.",
    },
    verifyLine: "A real, verified answer connects the quote to the chapter's real groundwater/crude-oil sustainability examples ✓",
  },
  {
    id: "econ-ex-q11-environmental-degradation",
    label: "Q11",
    questionText: "List a few examples of environmental degradation that you may have observed around you.",
    analytical: {
      criteria: [
        "Names real, plausible, locally observable examples of environmental degradation — e.g. groundwater depletion, air/water pollution, deforestation, waste dumping, declining green cover",
        "Where possible, connects an example to a real mechanism named in the chapter — e.g. groundwater overuse for agriculture/urban use, similar to the real 300-districts statistic",
        "Is specific and concrete rather than vague — names an actual type of degradation, not just 'pollution' in the abstract",
      ],
      groundingNotes:
        "This question is inherently about the student's own observed surroundings, so there's no single fixed answer — grading focuses on real specificity and plausibility, informed by the chapter's own real examples (groundwater decline, industrial toxic waste as in the Ivory Coast case, crude oil dependency's environmental costs).",
    },
    verifyLine: "A real, verified answer names specific, plausible, locally observable degradation examples ✓",
  },
  {
    id: "econ-ex-q12-table16-topbottom",
    label: "Q12",
    questionText: "For each of the items given in Table 1.6, find out which country is at the top and which is at the bottom.",
    analytical: {
      criteria: [
        "GNI per capita: top = Sri Lanka (12,616), bottom = Nepal (4,726)",
        "Life expectancy at birth: top = Sri Lanka (77.5), bottom = Myanmar (66.9)",
        "Mean years of schooling: top = Sri Lanka (10.8), bottom = Pakistan (4.3)",
        "HDI rank: best (lowest rank number) = Sri Lanka (89), worst (highest rank number) = Pakistan (168)",
      ],
      groundingNotes:
        "Real Table 1.6 data (2023/2025): Sri Lanka 12,616 GNI / 77.5 life exp. / 10.8 yrs schooling / rank 89. India 9,047 / 72 / 6.9 / 130. Myanmar 4,919 / 66.9 / 6.4 / 150. Pakistan 5,501 / 67.6 / 4.3 / 168. Nepal 4,726 / 70.4 / 4.5 / 145. Bangladesh 8,498 / 74.7 / 6.8 / 130. Independently re-sorted column by column to verify: Sri Lanka tops every single column; the bottom differs per column (Nepal for GNI, Myanmar for life expectancy, Pakistan for schooling and HDI rank).",
    },
    verifyLine: "Top/bottom correctly identified per column by independently re-sorting the real Table 1.6 data — Sri Lanka tops all four; bottom varies by column ✓",
  },
  {
    id: "econ-ex-q13-bmi-table",
    label: "Q13",
    questionText: "The following table shows the proportion of adults (aged 15-49 years) whose BMI is below normal (BMI <18.5 kg/m²) in India, for the year 2019-21: Kerala (Male 8.5%, Female 10%), Karnataka (Male 17%, Female 21%), Madhya Pradesh (Male 28%, Female 28%), All States (Male 20%, Female 23%). (i) Compare the nutritional level of people in Kerala and Madhya Pradesh. (ii) Can you guess why around one-fifth of people in the country are undernourished even though it is argued that there is enough food in the country? Describe in your own words.",
    analytical: {
      criteria: [
        "(i) Correctly compares the real figures — Kerala has much lower rates of below-normal BMI (8.5% male, 10% female) than Madhya Pradesh (28% male, 28% female), meaning Kerala's population is real better nourished than Madhya Pradesh's, and also better than the all-India average (20%/23%)",
        "(ii) Reasons through the real chapter logic on why aggregate food availability doesn't guarantee individual nutrition — echoes the average-income lesson: enough food existing NATIONALLY doesn't mean it's accessible or affordable to everyone individually, since distribution, poverty, and access (not just total production) determine who actually gets fed",
        "Connects part (ii) back to the chapter's own broader theme — the same distributional-inequality logic already seen in Table 1.2 (average income hiding disparity) and public facilities (money alone doesn't guarantee access) applies to food and nutrition too",
      ],
      groundingNotes:
        "Real table data: Kerala's below-normal BMI rates (8.5% male, 10% female) are far lower than Madhya Pradesh's (28% male, 28% female) and below the All-States average (20% male, 23% female) — meaning Kerala's population has much better nutritional status. This mirrors the chapter's repeated real argument that aggregate/average measures (whether income, or in this case, national food availability) can mask serious unequal distribution — the same logic as Table 1.2's two-country income example and the Haryana/Kerala health-vs-income contrast.",
    },
    verifyLine: "A real, verified answer correctly compares Kerala vs. MP's real BMI figures and reasons through the distribution/access argument ✓",
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
  "zeroes-geometrical-meaning": GEOMETRICAL_MEANING_PROBLEMS,
  "zeroes-coeff-quadratic": ZEROES_COEFF_QUADRATIC_PROBLEMS,
  "zeroes-coeff-cubic": ZEROES_COEFF_CUBIC_PROBLEMS,
  "ex-2-1": EX_2_1_PROBLEMS,
  "ex-2-2": EX_2_2_PROBLEMS,
  "balancing-chemical-equations": BALANCING_EQUATIONS_PROBLEMS,
  "sec-1-1-questions": SECTION_1_1_QUESTIONS_PROBLEMS,
  "reaction-types-redox": REACTION_TYPES_REDOX_PROBLEMS,
  "sec-1-2-questions": SECTION_1_2_QUESTIONS_PROBLEMS,
  "sec-1-3-questions": SECTION_1_3_QUESTIONS_PROBLEMS,
  "ch1-sci-exercises": CHAPTER_1_EXERCISES_PROBLEMS,
  "hist-intro-questions": INTRO_HISTORY_PROBLEMS,
  "hist-sec2-questions": SECTION_2_HISTORY_PROBLEMS,
  "hist-sec3-questions": SECTION_3_HISTORY_PROBLEMS,
  "hist-sec4-questions": SECTION_4_HISTORY_PROBLEMS,
  "hist-sec5-questions": SECTION_5_HISTORY_PROBLEMS,
  "hist-write-in-brief": WRITE_IN_BRIEF_HISTORY_PROBLEMS,
  "hist-discuss": DISCUSS_HISTORY_PROBLEMS,
  "geo-intext-questions": GEO_INTEXT_QUESTIONS_PROBLEMS,
  "geo-exercises": GEO_EXERCISES_PROBLEMS,
  "polisci-intext-questions": POLISCI_INTEXT_QUESTIONS_PROBLEMS,
  "polisci-let-us-revise": POLISCI_LET_US_REVISE_PROBLEMS,
  "polisci-exercises": POLISCI_EXERCISES_PROBLEMS,
  "econ-intext-questions": ECON_INTEXT_QUESTIONS_PROBLEMS,
  "econ-exercises": ECON_EXERCISES_PROBLEMS,
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

// Local ai-tutor-server (see /server) — grades an uploaded answer photo with
// a real vision model instead of the old presenter-picks-the-result demo.
const API_BASE = "http://localhost:8787";

// What the grading model is told counts as "correct" — the real final
// answer(s), not the whole derivation, so the model judges the student's
// result rather than re-deriving the problem itself.
function correctAnswerSummary(problem: PracticeProblem): string {
  if (problem.parts) {
    const perPart = problem.parts.map((part) => `${part.label} ${part.steps[part.steps.length - 1].answer}`).join("; ");
    return `${perPart}. ${problem.verifyLine}`;
  }
  const steps = problem.steps!;
  return `${steps[steps.length - 1].answer}. ${problem.verifyLine}`;
}

// Shared by both the "select" screen and the visual/MCQ screen — previously
// each rendered its own copy of this wrapping pill grid, which was fine up to
// ~5 problems but for a 19-problem topic (all 20 Chapter Exercises) pushed
// the actual question below the fold across 5 rows of pills. Past 5
// problems, switch to a fixed-height prev/next bar with a sheet for jumping
// directly to one; at 5 or fewer, the original wrap is already compact.
function ProblemIndex({ problems, problemIdx, isProblemDone, onSelect }: {
  problems: PracticeProblem[];
  problemIdx: number;
  isProblemDone: (p: PracticeProblem) => boolean;
  onSelect: (i: number) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  // A single-problem topic has nothing to "choose" between.
  if (problems.length <= 1) return null;

  const pillStyle = (active: boolean, done: boolean) => ({
    gap: 4, height: 36, padding: "0 14px", borderRadius: 10, cursor: "pointer" as const,
    border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
    background: done ? "var(--success-d2)" : active ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--card)",
    color: active ? "var(--primary)" : done ? "var(--success)" : "var(--foreground)",
    fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
  });

  if (problems.length > 5) {
    const current = problems[problemIdx];
    const prevIdx = problemIdx > 0 ? problemIdx - 1 : null;
    const nextIdx = problemIdx < problems.length - 1 ? problemIdx + 1 : null;
    return (
      <>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => prevIdx !== null && onSelect(prevIdx)}
            disabled={prevIdx === null}
            className="flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", cursor: prevIdx === null ? "default" : "pointer", opacity: prevIdx === null ? 0.4 : 1 }}
          >
            <ChevronLeft style={{ width: 18, height: 18, color: "var(--foreground)" }} />
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 flex items-center justify-center"
            style={{ gap: 6, height: 40, borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer" }}
          >
            {isProblemDone(current) && <Check style={{ width: 13, height: 13, color: "var(--success)" }} strokeWidth={3} />}
            {/* Just the real label (e.g. "Q20") — no separate array-position
                counter alongside it. A problem's label and its position in
                the array don't line up (Q1-Q2 share one array entry), so
                "Q20 · 19 of 19" showed two numbers that looked like they
                should match and didn't — confusing, and misaligned besides.
                The sheet this opens already shows position visually. */}
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)" }}>{current.label}</span>
            <ChevronDown style={{ width: 15, height: 15, color: "var(--muted-foreground)" }} />
          </button>
          <button
            onClick={() => nextIdx !== null && onSelect(nextIdx)}
            disabled={nextIdx === null}
            className="flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", cursor: nextIdx === null ? "default" : "pointer", opacity: nextIdx === null ? 0.4 : 1 }}
          >
            <ChevronRight style={{ width: 18, height: 18, color: "var(--foreground)" }} />
          </button>
        </div>
        <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Choose a question">
          <div className="flex flex-wrap" style={{ gap: 8, padding: 16 }}>
            {problems.map((p, i) => (
              <button key={p.id} onClick={() => { onSelect(i); setSheetOpen(false); }} className="flex items-center" style={pillStyle(i === problemIdx, isProblemDone(p))}>
                {isProblemDone(p) && <Check style={{ width: 12, height: 12 }} strokeWidth={3} />}
                {p.label}
              </button>
            ))}
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <>
      <p style={{ ...typo.metaStyle, marginBottom: 8 }}>Choose a problem</p>
      <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 16 }}>
        {problems.map((p, i) => (
          <button key={p.id} onClick={() => onSelect(i)} className="flex items-center" style={pillStyle(i === problemIdx, isProblemDone(p))}>
            {isProblemDone(p) && <Check style={{ width: 12, height: 12 }} strokeWidth={3} />}
            {p.label}
          </button>
        ))}
      </div>
    </>
  );
}

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
  const [gradeFeedback, setGradeFeedback] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  // Visual/perceptual problems reuse partIdx/completedParts (same "which
  // sub-part, which are done" shape as the derivation parts) but track the
  // currently-selected option separately, since there's no step reveal here.
  const [visualAnswer, setVisualAnswer] = useState<string | null>(null);
  // Analytical/open-response problems: the student's draft, the AI's
  // qualitative feedback once graded, and a separate error state (reusing
  // gradeError would conflate this with the photo-grading path).
  const [analyticalAnswer, setAnalyticalAnswer] = useState("");
  const [analyticalFeedback, setAnalyticalFeedback] = useState<string | null>(null);
  const [analyticalSubmitting, setAnalyticalSubmitting] = useState(false);
  const [analyticalError, setAnalyticalError] = useState<string | null>(null);
  // "Ask AI for a model answer" and "write your own answer" are separate
  // stages, not inline-expanding toggles — the first version stacked the
  // chooser, the (long) model answer, AND the write-your-own form all in
  // one scroll, which pushed the actual answer input off-screen entirely.
  // Choosing either option now switches the view, with a back button to
  // return to "choose" — same shape as a lightweight wizard, not an
  // accordion.
  const [analyticalStage, setAnalyticalStage] = useState<"choose" | "model" | "answer">("choose");
  const [modelAnswer, setModelAnswer] = useState<{ framing: string; answer: string } | null>(null);
  const [modelAnswerLoading, setModelAnswerLoading] = useState(false);
  const [modelAnswerError, setModelAnswerError] = useState<string | null>(null);
  // Three ways to actually give the answer — typing was the only option
  // before. Record and Upload both end up producing text (a transcript, or
  // a photo graded directly), submitted through the same grade-text call.
  const [answerInputMode, setAnswerInputMode] = useState<"text" | "record" | "upload">("text");
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [analyticalPhotoDataUrl, setAnalyticalPhotoDataUrl] = useState<string | null>(null);
  const analyticalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const problem = problems[problemIdx];
  // Multi-part real questions (Q1's five numbers, Q2/Q3's three pairs/triples)
  // walk through whichever sub-part is selected, independently of the others
  // — not one forced linear chain across all sub-parts.
  const activeSteps: PracticeStep[] = problem.parts ? problem.parts[partIdx].steps : (problem.steps ?? []);

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
    setGradeFeedback(null);
    setGradeError(null);
    setVisualAnswer(null);
    setAnalyticalAnswer("");
    setAnalyticalFeedback(null);
    setAnalyticalError(null);
    setAnalyticalStage("choose");
    setModelAnswer(null);
    setModelAnswerError(null);
    setAnswerInputMode("text");
    setRecordingState("idle");
    setRecordingError(null);
    setAnalyticalPhotoDataUrl(null);
  }

  // Visual problems: jump to any sub-question at any time (same "always
  // reachable" rule as selectPart), resetting the shown answer/feedback.
  function selectVisualQuestion(i: number) {
    setPartIdx(i);
    setVisualAnswer(null);
  }

  // Sends the student's answer — typed, transcribed from audio, or a photo
  // of handwritten work — to ai-tutor-server for real qualitative grading
  // (GPT-4o-mini) against this problem's own real evaluative criteria.
  // Completion is marked on a genuine attempt, not on "correctness" —
  // analytical questions have no fixed correct answer (rule 0), so there's
  // nothing to gate completion on besides having actually submitted one.
  async function submitAnalytical() {
    if (!problem.analytical) return;
    if (!analyticalAnswer.trim() && !analyticalPhotoDataUrl) return;
    setAnalyticalSubmitting(true);
    setAnalyticalError(null);
    try {
      const res = await fetch(`${API_BASE}/api/grade-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: problem.questionText,
          studentAnswer: analyticalPhotoDataUrl ? undefined : analyticalAnswer,
          imageDataUrl: analyticalPhotoDataUrl ?? undefined,
          criteria: problem.analytical.criteria,
          groundingNotes: problem.analytical.groundingNotes,
        }),
      });
      if (!res.ok) throw new Error(`Grading request failed (${res.status})`);
      const data = await res.json();
      setAnalyticalFeedback(data.feedback || null);
      if (data.transcribedAnswer) setAnalyticalAnswer(data.transcribedAnswer);
      markProblemComplete(problem);
    } catch {
      setAnalyticalError("Couldn't reach the grading service — make sure ai-tutor-server is running (npm run dev in /server).");
    } finally {
      setAnalyticalSubmitting(false);
    }
  }

  // Model answer: a short framing of what a strong answer needs to cover,
  // then the actual substantive answer — the main focus, per the real ask
  // ("major focus would be an actual answer for the question"). Fetched
  // once per problem and cached in state, not re-fetched on every re-open.
  async function fetchModelAnswer() {
    if (!problem.analytical) return;
    setAnalyticalStage("model");
    if (modelAnswer) return;
    setModelAnswerLoading(true);
    setModelAnswerError(null);
    try {
      const res = await fetch(`${API_BASE}/api/model-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: problem.questionText,
          criteria: problem.analytical.criteria,
          groundingNotes: problem.analytical.groundingNotes,
        }),
      });
      if (!res.ok) throw new Error(`Model-answer request failed (${res.status})`);
      const data = await res.json();
      setModelAnswer({ framing: data.framing ?? "", answer: data.answer ?? "" });
    } catch {
      setModelAnswerError("Couldn't reach the AI tutor — make sure ai-tutor-server is running (npm run dev in /server).");
    } finally {
      setModelAnswerLoading(false);
    }
  }

  // Voice input: record via the browser's mic, then transcribe through
  // ai-tutor-server (Whisper) into the same textarea a typed answer would
  // fill — the grading path downstream never knows the difference.
  async function startRecording() {
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordingState("transcribing");
        try {
          const audioDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const res = await fetch(`${API_BASE}/api/transcribe-audio`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioDataUrl }),
          });
          if (!res.ok) throw new Error(`Transcription request failed (${res.status})`);
          const data = await res.json();
          setAnalyticalAnswer((prev) => (prev.trim() ? `${prev.trim()} ${data.transcript ?? ""}` : (data.transcript ?? "")));
          setAnswerInputMode("text");
        } catch {
          setRecordingError("Couldn't transcribe that recording — make sure ai-tutor-server is running, or try typing instead.");
        } finally {
          setRecordingState("idle");
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingState("recording");
    } catch {
      setRecordingError("Couldn't access the microphone — check your browser's permission for this site.");
    }
  }
  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function handleAnalyticalFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAnalyticalPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function answerVisualQuestion(option: string) {
    if (!problem.visual) return;
    setVisualAnswer(option);
    if (option === problem.visual.questions[partIdx].correctAnswer) {
      const updated = [...completedParts];
      updated[partIdx] = true;
      setCompletedParts(updated);
      if (updated.filter(Boolean).length === problem.visual.questions.length) {
        markProblemComplete(problem);
        setExplainFinished(true);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  // Sends the uploaded photo to ai-tutor-server for real grading (GPT-4o-mini
  // vision) — replaces the old "presenter picks Mark Correct/Incorrect" demo.
  async function submitForGrading() {
    if (!photoDataUrl) return;
    setMode("pending");
    setGradeError(null);
    try {
      const res = await fetch(`${API_BASE}/api/grade-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: photoDataUrl,
          questionText: problem.questionText,
          correctAnswer: correctAnswerSummary(problem),
        }),
      });
      if (!res.ok) throw new Error(`Grading request failed (${res.status})`);
      const data = await res.json();
      setGradeFeedback(data.feedback || null);
      setMode(data.correct ? "correct" : "incorrect");
    } catch {
      setGradeError("Couldn't reach the grading service — make sure ai-tutor-server is running (npm run dev in /server).");
    }
  }

  function startExplain() {
    // partIdx is intentionally NOT reset here — the student may have already
    // picked a sub-part on the select screen, and jumping into explain mode
    // should honor that instead of always restarting at (i). completedParts
    // is only (re)initialized if it doesn't already match this problem's
    // part count, so progress survives re-entering explain mode.
    if (problem.parts && completedParts.length !== problem.parts.length) {
      setCompletedParts(problem.parts.map(() => false));
    }
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

  // Analytical/open-response problems bypass the select/explain/upload mode
  // machinery too — there's no step-by-step derivation and no fixed correct
  // answer to grade a photo against, just a real question, a place to write
  // a real answer, and qualitative AI feedback once submitted.
  if (problem.analytical) {
    const criteria = problem.analytical.criteria;
    const hasDraftAnswer = !!analyticalAnswer.trim() || !!analyticalPhotoDataUrl;
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
        <StatusBar />
        {header}
        <div style={{ height: 1, background: "var(--border)" }} />

        <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 24px" }}>
          <ProblemIndex problems={problems} problemIdx={problemIdx} isProblemDone={isProblemDone} onSelect={selectProblem} />

          <div style={{ background: "var(--card)", borderRadius: "var(--radius-card)", padding: "12px 15px", marginBottom: 14 }}>
            <span style={{ ...typo.badgeStyle, textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: 5 }}>{problem.label}</span>
            <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", marginBottom: problem.analytical.imageSrc ? 10 : 0 }}>{problem.questionText}</p>
            {problem.analytical.imageSrc && (
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                <img src={problem.analytical.imageSrc} alt={problem.analytical.imageAlt} style={{ width: "100%", display: "block" }} />
              </div>
            )}
          </div>

          {/* Three distinct stages, not an accordion — the first version
              stacked the chooser, the (often long) model answer, AND the
              write-your-own form all in one scroll, which pushed the actual
              answer input off-screen entirely once a model answer loaded.
              Each stage now gets the full screen to itself, with a back
              button returning to "choose". */}
          {!analyticalFeedback && analyticalStage === "choose" && (
            <div className="flex flex-col" style={{ gap: 10, marginBottom: 14 }}>
              <button
                onClick={fetchModelAnswer}
                className="flex items-center gap-3"
                style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", textAlign: "left" }}
              >
                <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--warning-950)" }}>
                  <Sparkles style={{ width: 18, height: 18, color: "var(--warning)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)" }}>Ask AI tutor for a sample answer</p>
                  <p style={typo.metaStyle}>See a real answer, then try your own</p>
                </div>
              </button>

              <button
                onClick={() => setAnalyticalStage("answer")}
                className="flex items-center gap-3"
                style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", textAlign: "left" }}
              >
                <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary-950)" }}>
                  <PenLine style={{ width: 18, height: 18, color: "var(--primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)" }}>Write your own answer</p>
                  <p style={typo.metaStyle}>Type, record, or upload a photo</p>
                </div>
              </button>
            </div>
          )}

          {!analyticalFeedback && analyticalStage === "model" && (
            <div className="flex flex-col" style={{ gap: 12, marginBottom: 14 }}>
              <button
                onClick={() => setAnalyticalStage("choose")}
                className="flex items-center gap-1.5"
                style={{ background: "none", border: "none", cursor: "pointer", alignSelf: "flex-start", padding: 0 }}
              >
                <ArrowLeft style={{ width: 15, height: 15, color: "var(--muted-foreground)" }} />
                <span style={{ ...typo.metaStyle }}>Back</span>
              </button>

              <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
                {/* A real answer takes a few real seconds to generate — a
                    static "Writing a model answer…" line just sat there
                    with nothing to look at, and "model answer" itself
                    reads as exam-board jargon rather than something a
                    student would say. Replaced with a plain "AI tutor is
                    thinking" line plus a pulsing sparkle and skeleton
                    lines standing in for the answer being written, reusing
                    the same Skeleton component used elsewhere in the app —
                    not a bespoke spinner. */}
                {modelAnswerLoading && (
                  <div className="flex flex-col" style={{ gap: 10 }}>
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                        className="flex items-center justify-center shrink-0"
                      >
                        <Sparkles style={{ width: 15, height: 15, color: "var(--warning)" }} />
                      </motion.div>
                      <p style={typo.metaStyle}>Your AI tutor is thinking…</p>
                    </div>
                    <Skeleton style={{ height: 13, width: "92%" }} />
                    <Skeleton style={{ height: 13, width: "78%" }} />
                    <Skeleton style={{ height: 13, width: "86%" }} />
                    <Skeleton style={{ height: 13, width: "60%" }} />
                  </div>
                )}
                {modelAnswerError && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle style={{ width: 15, height: 15, color: "var(--error)", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ ...typo.cardBodyStyle, color: "var(--error)" }}>{modelAnswerError}</p>
                  </div>
                )}
                {modelAnswer && (
                  <>
                    <p style={{ ...typo.metaStyle, marginBottom: 8 }}>{modelAnswer.framing}</p>
                    <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>{modelAnswer.answer}</p>
                  </>
                )}
              </div>

              <button
                onClick={() => setAnalyticalStage("answer")}
                className="flex items-center justify-center"
                style={{ height: 44, borderRadius: 12, border: "1px solid var(--primary)", background: "color-mix(in srgb, var(--primary) 12%, var(--card))", cursor: "pointer" }}
              >
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--primary)" }}>Write your own answer now →</span>
              </button>
            </div>
          )}

          {!analyticalFeedback && analyticalStage === "answer" && (
            <div className="flex flex-col" style={{ gap: 12, marginBottom: 14 }}>
              <button
                onClick={() => setAnalyticalStage("choose")}
                className="flex items-center gap-1.5"
                style={{ background: "none", border: "none", cursor: "pointer", alignSelf: "flex-start", padding: 0 }}
              >
                <ArrowLeft style={{ width: 15, height: 15, color: "var(--muted-foreground)" }} />
                <span style={{ ...typo.metaStyle }}>Back</span>
              </button>

              <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
                {/* Input-method tabs — text/record/upload all end up producing
                    the same thing (a string of answer text, or a photo graded
                    directly), submitted through the one grading call. */}
                <div className="flex" style={{ gap: 6, marginBottom: 12 }}>
                  {([
                    { key: "text" as const, label: "Type", icon: Type },
                    { key: "record" as const, label: "Record", icon: Mic },
                    { key: "upload" as const, label: "Upload", icon: Camera },
                  ]).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setAnswerInputMode(key)}
                      className="flex-1 flex items-center justify-center"
                      style={{
                        gap: 6, height: 36, borderRadius: 9, cursor: "pointer",
                        border: answerInputMode === key ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                        background: answerInputMode === key ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--background)",
                        color: answerInputMode === key ? "var(--primary)" : "var(--foreground)",
                      }}
                    >
                      <Icon style={{ width: 14, height: 14 }} />
                      <span style={{ fontFamily: "var(--font-family-inter)", fontSize: 12, fontWeight: 700 }}>{label}</span>
                    </button>
                  ))}
                </div>

                {answerInputMode === "text" && (
                  <textarea
                    value={analyticalAnswer}
                    onChange={(e) => setAnalyticalAnswer(e.target.value)}
                    disabled={analyticalSubmitting}
                    placeholder="Write your answer here..."
                    style={{
                      width: "100%", minHeight: 140, borderRadius: 12, padding: "12px 14px", resize: "vertical",
                      border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)",
                      fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", lineHeight: 1.5,
                    }}
                  />
                )}

                {answerInputMode === "record" && (
                  <div className="flex flex-col items-center" style={{ gap: 10, padding: "20px 0" }}>
                    {recordingState === "idle" && (
                      <button
                        onClick={startRecording}
                        className="flex items-center justify-center"
                        style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary)", border: "none", cursor: "pointer" }}
                      >
                        <Mic style={{ width: 22, height: 22, color: "var(--white)" }} />
                      </button>
                    )}
                    {recordingState === "recording" && (
                      <button
                        onClick={stopRecording}
                        className="flex items-center justify-center"
                        style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--error)", border: "none", cursor: "pointer" }}
                      >
                        <Square style={{ width: 20, height: 20, color: "var(--white)" }} fill="var(--white)" />
                      </button>
                    )}
                    {recordingState === "transcribing" && (
                      <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--muted-foreground)" }}>
                        <Mic style={{ width: 22, height: 22, color: "var(--white)" }} />
                      </div>
                    )}
                    <p style={typo.metaStyle}>
                      {recordingState === "idle" && (analyticalAnswer.trim() ? "Tap to add more" : "Tap to start recording")}
                      {recordingState === "recording" && "Recording — tap to stop"}
                      {recordingState === "transcribing" && "Transcribing…"}
                    </p>
                    {recordingError && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle style={{ width: 15, height: 15, color: "var(--error)", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ ...typo.cardBodyStyle, color: "var(--error)" }}>{recordingError}</p>
                      </div>
                    )}
                    {analyticalAnswer.trim() && recordingState === "idle" && (
                      <div style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "var(--background)", border: "1px solid var(--border)" }}>
                        <p style={{ ...typo.metaStyle, marginBottom: 4 }}>Transcript so far</p>
                        <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>{analyticalAnswer}</p>
                      </div>
                    )}
                  </div>
                )}

                {answerInputMode === "upload" && (
                  <div className="flex flex-col items-center" style={{ gap: 10, padding: analyticalPhotoDataUrl ? 0 : "20px 0" }}>
                    {analyticalPhotoDataUrl ? (
                      <div style={{ width: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <img src={analyticalPhotoDataUrl} alt="Uploaded answer" style={{ width: "100%", display: "block" }} />
                      </div>
                    ) : (
                      <>
                        <Camera style={{ width: 28, height: 28, color: "var(--muted-foreground)" }} />
                        <p style={typo.metaStyle}>Upload a photo of your handwritten answer</p>
                      </>
                    )}
                    <input ref={analyticalFileInputRef} type="file" accept="image/*" capture="environment" onChange={handleAnalyticalFileChange} style={{ display: "none" }} />
                    <button
                      onClick={() => analyticalFileInputRef.current?.click()}
                      style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--background)", cursor: "pointer", fontFamily: "var(--font-family-inter)", fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}
                    >
                      {analyticalPhotoDataUrl ? "Retake photo" : "Take / choose photo"}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={submitAnalytical}
                disabled={!hasDraftAnswer || analyticalSubmitting}
                className="flex items-center justify-center"
                style={{
                  width: "100%", height: 44, borderRadius: 12, border: "none",
                  background: !hasDraftAnswer || analyticalSubmitting ? "var(--muted-foreground)" : "var(--primary)",
                  cursor: !hasDraftAnswer || analyticalSubmitting ? "default" : "pointer",
                }}
              >
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>
                  {analyticalSubmitting ? "Getting feedback…" : "Submit for feedback"}
                </span>
              </button>
            </div>
          )}

          {analyticalError && (
            <div className="flex items-start gap-2" style={{ padding: "10px 12px", borderRadius: 10, background: "var(--error-d2)", marginBottom: 12 }}>
              <AlertTriangle style={{ width: 15, height: 15, color: "var(--error)", flexShrink: 0, marginTop: 1 }} />
              <p style={{ ...typo.cardBodyStyle, color: "var(--error)" }}>{analyticalError}</p>
            </div>
          )}

          {/* Never a right/wrong badge — qualitative feedback only, per
              rule 0's Analytical row. Feedback itself now names the specific
              real content that's missing (not just "elaborate more") —
              criteria are still shown alongside as a self-check checklist,
              not a pre-loaded answer key. */}
          {analyticalFeedback && (
            <div className="flex flex-col" style={{ gap: 12 }}>
              <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--primary)", background: "color-mix(in srgb, var(--primary) 10%, var(--card))" }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                  <Sparkles style={{ width: 14, height: 14, color: "var(--primary)" }} />
                  <span style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)", color: "var(--primary)" }}>AI tutor feedback</span>
                </div>
                <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>{analyticalFeedback}</p>
              </div>

              <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
                <p style={{ ...typo.metaStyle, marginBottom: 8 }}>What a strong answer covers</p>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  {criteria.map((c) => (
                    <div key={c} className="flex items-start gap-2">
                      <div className="shrink-0" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--muted-foreground)", marginTop: 7 }} />
                      <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>{c}</p>
                    </div>
                  ))}
                </div>
              </div>

              <NextStepsCta />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Visual/perceptual problems bypass the select/explain/pending mode
  // machinery entirely — there's no derivation to walk through or photo to
  // grade, just the real figure and a direct answer with immediate feedback.
  // `mode` never changes away from "select" for these, so the shared
  // explainFinished check further down (gated behind mode==="explain") would
  // never be reached — handle completion here instead, duplicating that same
  // generic completion screen.
  if (problem.visual) {
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

    const questions = problem.visual.questions;
    const currentQuestion = questions[partIdx];
    const hasAnswered = visualAnswer !== null;
    const isCorrect = hasAnswered && visualAnswer === currentQuestion.correctAnswer;

    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
        <StatusBar />
        {header}
        <div style={{ height: 1, background: "var(--border)" }} />

        <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 24px" }}>
          {/* Visual problems bypass "select" mode entirely, so this topic's
              own multi-problem picker (e.g. Q1 vs Q2) has to live here too —
              otherwise a topic with >1 visual problem would have no way to
              switch between them. */}
          <ProblemIndex problems={problems} problemIdx={problemIdx} isProblemDone={isProblemDone} onSelect={selectProblem} />

          <div style={{ background: "var(--card)", borderRadius: "var(--radius-card)", padding: "12px 15px", marginBottom: 14 }}>
            <span style={{ ...typo.badgeStyle, textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: 5 }}>{problem.label}</span>
            <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>{problem.questionText}</p>
          </div>

          {problem.visual.imageSrc && (
            <div style={{ borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--border)", marginBottom: 16 }}>
              <img src={problem.visual.imageSrc} alt={problem.visual.imageAlt} style={{ width: "100%", display: "block" }} />
            </div>
          )}

          {/* Sub-question picker — any graph/fact reachable any time, checkmark
              once answered correctly. Hidden with exactly one sub-question:
              there's nothing to pick between, and the question card above
              already states it in full. */}
          {questions.length > 1 && (
            <div className="flex flex-wrap items-center" style={{ gap: 6, marginBottom: 16 }}>
              {questions.map((q, i) => {
                const done = completedParts[i];
                const active = i === partIdx;
                return (
                  <button
                    key={q.label}
                    onClick={() => selectVisualQuestion(i)}
                    className="flex items-center"
                    style={{
                      gap: 4, height: 32, padding: "0 12px", borderRadius: 8, cursor: "pointer",
                      border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: done ? "var(--success-d2)" : active ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--card)",
                      color: active ? "var(--primary)" : done ? "var(--success)" : "var(--foreground)",
                      fontFamily: "var(--font-family-inter)", fontSize: 13, fontWeight: 700,
                    }}
                  >
                    {done && <Check style={{ width: 11, height: 11 }} strokeWidth={3} />}
                    {q.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Only shown with more than one sub-question — with exactly one,
              this restates the same question already shown in the card
              above (see CONTENT_RULEBOOK.md on avoiding redundant screen
              copy). */}
          {questions.length > 1 && (
            <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", marginBottom: 10 }}>{currentQuestion.prompt}</p>
          )}

          {/* Full-width rows, not fixed-size tiles — option text ranges from
              a single digit (graph zero-counts) to a full sentence (fact-
              recall answers), and a fixed square only ever fit the former. */}
          <div className="flex flex-col" style={{ gap: 8, marginBottom: 14 }}>
            {currentQuestion.options.map((opt) => {
              const isSelected = visualAnswer === opt;
              const isThisCorrect = opt === currentQuestion.correctAnswer;
              let bg = "var(--card)", border = "1px solid var(--border)", color = "var(--foreground)";
              if (hasAnswered && isSelected && isThisCorrect) { bg = "var(--success-d2)"; border = "1px solid var(--success)"; color = "var(--success)"; }
              else if (hasAnswered && isSelected && !isThisCorrect) { bg = "var(--error-d2)"; border = "1px solid var(--error)"; color = "var(--error)"; }
              return (
                <button
                  key={opt}
                  onClick={() => answerVisualQuestion(opt)}
                  className="text-left"
                  style={{ padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: bg, border, color, fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", lineHeight: 1.4 }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${isCorrect ? "var(--success)" : "var(--error)"}`, background: isCorrect ? "var(--success-d2)" : "var(--error-d2)" }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                {isCorrect ? <Check style={{ width: 14, height: 14, color: "var(--success)" }} strokeWidth={3} /> : <X style={{ width: 14, height: 14, color: "var(--error)" }} />}
                <span style={{ ...typo.cardTitleStyle, fontSize: "var(--text-sm)", color: isCorrect ? "var(--success)" : "var(--error)" }}>
                  {isCorrect ? "Correct" : `Not quite — it's ${currentQuestion.correctAnswer}`}
                </span>
              </div>
              <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === "select") {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "var(--background)", overflow: "hidden" }}>
        <StatusBar />
        {header}
        <div style={{ height: 1, background: "var(--border)" }} />

        <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 24px" }}>
          {/* A single-problem topic has nothing to "choose" between — the
              selector only makes sense once there's an actual choice. Past 5
              problems this switches from a wrapping pill grid to a compact
              prev/next bar + sheet — see ProblemIndex. */}
          <ProblemIndex problems={problems} problemIdx={problemIdx} isProblemDone={isProblemDone} onSelect={selectProblem} />

          {/* A multi-part real question's sub-parts are their own selectable
              questions too — shown as soon as the problem is chosen, not
              hidden until "Ask AI tutor" is tapped. Selecting one here just
              sets which sub-part Ask AI tutor / the question card focuses on. */}
          {/* Question comes before the sub-part picker — you read what's
              being asked before choosing which sub-part to work on, not
              the other way around. */}
          <div style={{ background: "var(--card)", borderRadius: "var(--radius-card)", padding: "14px 15px", marginBottom: 20 }}>
            <span style={{ ...typo.badgeStyle, textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              Question
            </span>
            <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", lineHeight: 1.6 }}>{problem.questionText}</p>
          </div>

          {problem.parts && problem.parts.length > 1 && (
            <>
              <p style={{ ...typo.metaStyle, marginBottom: 8 }}>Choose a sub-part</p>
              <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 16 }}>
                {problem.parts.map((part, i) => {
                  const done = completedParts[i];
                  const active = i === partIdx;
                  return (
                    <button
                      key={part.label}
                      onClick={() => selectPart(i)}
                      className="flex items-center"
                      style={{
                        gap: 4, height: 36, padding: "0 14px", borderRadius: 10, cursor: "pointer",
                        border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                        background: done ? "var(--success-d2)" : active ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--card)",
                        color: active ? "var(--primary)" : done ? "var(--success)" : "var(--foreground)",
                        fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
                      }}
                    >
                      {done && <Check style={{ width: 12, height: 12 }} strokeWidth={3} />}
                      {part.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

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
                      onClick={submitForGrading}
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
                  <span style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>
                    {gradeError ? "Couldn't check your answer" : `Checking your answer for ${problem.label}…`}
                  </span>
                </div>
              </div>
              {gradeError && (
                <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--error)", background: "var(--error-d2)" }}>
                  <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", marginBottom: 10 }}>{gradeError}</p>
                  <div className="flex gap-2">
                    <button onClick={submitForGrading} style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "var(--primary)", color: "var(--white)", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", cursor: "pointer" }}>
                      Try again
                    </button>
                    <button onClick={startExplain} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", cursor: "pointer" }}>
                      See step-by-step instead
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === "correct" && (
            <>
              <div className="flex flex-col items-center" style={{ padding: "32px 16px", gap: 12, textAlign: "center" }}>
                <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success)" }}>
                  <Check style={{ width: 26, height: 26, color: "var(--white)" }} strokeWidth={2.5} />
                </div>
                <p style={typo.cardTitleStyle}>Nice work — that's right</p>
                <p style={{ ...typo.cardBodyStyle, maxWidth: 260 }}>{gradeFeedback || problem.verifyLine}</p>
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
                <p style={{ ...typo.cardBodyStyle, maxWidth: 280 }}>{gradeFeedback || `Let's walk through ${problem.label} together.`}</p>
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
          is reachable at any time; a checkmark marks the ones already done.
          Hidden with exactly one part — a single-part problem (e.g. Q14,
          just "Reaction") has nothing to choose between. */}
      {problem.parts && problem.parts.length > 1 && (
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
  "zeroes-geometrical-meaning": "Geometrical meaning of zeroes",
  "zeroes-coeff-quadratic": "Zeroes & coefficients — quadratic",
  "zeroes-coeff-cubic": "Zeroes & coefficients — cubic",
  "ex-2-1": "Exercise 2.1",
  "ex-2-2": "Exercise 2.2",
  "balancing-chemical-equations": "Writing & balancing equations",
  "sec-1-1-questions": "In-text Questions — 1.1",
  "reaction-types-redox": "Types of reactions, oxidation & reduction",
  "sec-1-2-questions": "In-text Questions — 1.2",
  "sec-1-3-questions": "In-text Questions — 1.3",
  "ch1-sci-exercises": "Chapter Exercises",
  "hist-intro-questions": "In-text Questions — Introduction",
  "hist-sec2-questions": "In-text Questions — Section 2",
  "hist-sec3-questions": "In-text Questions — Section 3",
  "hist-sec4-questions": "In-text Questions — Section 4",
  "hist-sec5-questions": "In-text Questions — Section 5",
  "hist-write-in-brief": "Write in Brief",
  "hist-discuss": "Discuss",
  "geo-intext-questions": "In-text Questions",
  "geo-exercises": "Chapter Exercises",
  "polisci-intext-questions": "In-text Questions",
  "polisci-let-us-revise": "Let Us Revise",
  "polisci-exercises": "Chapter Exercises",
  "econ-intext-questions": "In-text Questions",
  "econ-exercises": "Chapter Exercises",
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
