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

interface PracticeProblem {
  id: string;
  label: string;
  questionText: string;
  // Exactly one of steps/parts/visual is set per problem, never more than one.
  steps?: PracticeStep[];
  parts?: PracticePart[];
  visual?: { imageSrc?: string; imageAlt?: string; questions: VisualQuestion[] };
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
  }

  // Visual problems: jump to any sub-question at any time (same "always
  // reachable" rule as selectPart), resetting the shown answer/feedback.
  function selectVisualQuestion(i: number) {
    setPartIdx(i);
    setVisualAnswer(null);
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
          {problems.length > 1 && (
            <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 14 }}>
              {problems.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => selectProblem(i)}
                  style={{
                    height: 36, padding: "0 14px", borderRadius: 10, cursor: "pointer",
                    border: i === problemIdx ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    background: isProblemDone(p) ? "var(--success-d2)" : i === problemIdx ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--card)",
                    color: i === problemIdx ? "var(--primary)" : isProblemDone(p) ? "var(--success)" : "var(--foreground)",
                    fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ background: "var(--card)", borderRadius: "var(--radius-card)", padding: "12px 15px", marginBottom: 14 }}>
            <span style={{ ...typo.badgeStyle, textTransform: "uppercase", color: "var(--muted-foreground)", display: "block", marginBottom: 5 }}>{problem.label}</span>
            <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)" }}>{problem.questionText}</p>
          </div>

          {problem.visual.imageSrc && (
            <div style={{ borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--border)", marginBottom: 16 }}>
              <img src={problem.visual.imageSrc} alt={problem.visual.imageAlt} style={{ width: "100%", display: "block" }} />
            </div>
          )}

          {/* Sub-question picker — any graph/fact reachable any time, checkmark once answered correctly */}
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

          <p style={{ ...typo.cardBodyStyle, color: "var(--foreground)", marginBottom: 10 }}>{currentQuestion.prompt}</p>

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
              selector only makes sense once there's an actual choice. Pills
              size to their own content and wrap, rather than stretching to
              fill a row, since some topics have 7 of these, not 2. */}
          {problems.length > 1 && (
            <>
              <p style={{ ...typo.metaStyle, marginBottom: 8 }}>Choose a problem</p>
              <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 16 }}>
                {problems.map((p, i) => {
                  const done = isProblemDone(p);
                  const active = i === problemIdx;
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectProblem(i)}
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
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* A multi-part real question's sub-parts are their own selectable
              questions too — shown as soon as the problem is chosen, not
              hidden until "Ask AI tutor" is tapped. Selecting one here just
              sets which sub-part Ask AI tutor / the question card focuses on. */}
          {problem.parts && (
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
