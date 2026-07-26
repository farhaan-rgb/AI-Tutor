# AI Tutor content rulebook — Class 10 NCERT

This is the checklist I audit every chapter against before presenting it as
done, for both `ai-tutor-explain.tsx` (concepts) and `ai-tutor-solve.tsx`
(practice). It exists because Chapter 1 (Real Numbers) needed a long back-
and-forth to get right — the goal is to hit this bar on the first pass for
every chapter after it, not rediscover these rules one correction at a time.

Source of truth for every fact below: the real NCERT PDF for the chapter
(`jemh1XX.pdf` for Maths, `jesc1XX.pdf` for Science — fetched from
`ncert.nic.in/textbook/pdf/`). Never invent a number, a proof step, or a
question under a citation's name.

## 0. Match the format to what the problem actually is

The step-by-step-derivation-with-a-trap format built for Chapter 1 is
correct for *procedural* problems — but not every real question, in Maths or
any other subject, is procedural. Forcing a fact-recall question or an
open-ended analysis question into "show your derivation, here's a wrong
guess to catch" doesn't help the student — it's decoration on a format that
doesn't fit, and grading it as right/wrong misrepresents what's actually
being assessed. The classification below is by **what kind of thinking the
question actually asks for**, not by subject — a single chapter (Maths
included) can mix several of these.

| Kind | What it asks the student to do | What "understanding" means here | Explain treatment | Practice treatment |
|---|---|---|---|---|
| **Procedural** | Execute a defined sequence of operations to a determinate answer (factorise, solve for x, balance an equation, compute a numeric value) | Correctly execute each operation, without skipping the ones you'd get wrong | Narrative walkthrough of the method | Step-by-step derivation, sub-part picker for multi-part questions, ≤1 genuine trap where a real execution slip is likely (rules 4–7 below) |
| **Applied / word problem** | Translate a real-world scenario into the right procedure, *then* execute it | Correctly identifying which operation/setup applies — usually the actual hard part, not the arithmetic after | Same as procedural, but the *first* step is always "what does this scenario tell us to compute," with its own trap slot if a wrong setup is genuinely likely (e.g. picking HCF where LCM applies) | Same as procedural |
| **Visual / perceptual** | Read a fact directly off a diagram, graph, or figure — no computation, no derivation (e.g. "how many zeroes does this graph show") | Correctly reading the visual, not deriving anything | Show the real figure, explain what to look for in it | Show the real figure + a direct question (count/identify/match); feedback is immediate right/wrong with a one-line "here's what to look for," not a multi-step reveal |
| **Fact / recall** | Recall or state a definition, classification, date, or named fact with no derivation path | Correctly retrieving and distinguishing the fact from similar-sounding ones | Plain explanation of the fact/definition in context | Short-answer or a small set of options; feedback names the correct fact and — if wrong — the specific confusable fact the student likely mixed it up with (the "trap" here is a genuine mix-up between two real facts, not an arithmetic slip) |
| **Analytical / argumentative** | Construct or evaluate a reasoned argument with no single determinate answer (discuss, analyze, evaluate, "what is the theme of...") | Whether the reasoning is sound and complete, not whether it matches one fixed string | Explain the question's real evaluative criteria (what a strong answer actually covers) | Open-response: student writes their answer, AI tutor gives qualitative feedback on completeness/soundness against those real criteria — never reduced to correct/incorrect |
| **Language / composition** | Produce or correct language itself (grammar correction, vocabulary use, short creative writing) | Whether the specific rule was applied correctly (grammar — has a right answer) or whether the writing achieves its own goal (composition — doesn't) | Explain the rule or technique with real examples | Grammar: same as procedural, trap = a genuine common mistake with that rule. Composition: open-response with structured feedback (clarity, structure, correctness), not right/wrong |

**Classification rule:** look at what the *real* textbook question is actually
asking before writing anything — don't default to procedural because it's
the format already built. Chapter 2 (Polynomials) is a concrete example
already in front of us: Exercise 2.1 shows six graphs and asks "how many
zeroes" — that's **visual**, not procedural, even though it's in a Maths
exercise sitting right next to Exercise 2.2, which *is* procedural (factor,
find zeroes, verify the sum/product relationship). Same chapter, two
different real question-types, two different Practice treatments.

**Engineering note:** only the *procedural* and *applied* rows are built
today (`ai-tutor-solve.tsx`'s step/parts model). Visual, fact-recall, and
analytical treatments need their own `PracticeProblem` shape and their own
render path — not a bent version of the existing step sequence. Build the
new shape when the first real instance of that kind shows up (Chapter 2's
Exercise 2.1 is the first), rather than pre-building all of them speculatively.

**Never size a choice/option button to a fixed box.** Visual and fact-recall
questions share one quiz UI (rule 0's table), and its option text ranges
from a single digit (a graph's zero-count) to a full sentence (a fact-
recall answer). A fixed-size tile fits the former and overlaps into
unreadable garbage for the latter — real bug, real screenshot. Option
buttons are always full-width rows sized to their own content, never a
fixed square/tile, because there is no way to predict in advance how long
a real answer option will be.

## 1. Content must be real, not invented

- Every Explain concept and every Practice problem traces back to an actual
  Theorem/Example/Exercise-question in the chapter's real PDF.
- Practice reuses the **same numbers already used in Explain**, wherever a
  topic cites specific Examples — never fresh substitute numbers under the
  same label. The point is a student can flip to that exact page in their
  physical textbook and see what's on screen.
- Independently verify every computed answer (long division, factorization,
  algebra) by hand before writing it down. Chapter 1 had one Q4 arithmetic
  error caught only by a full manual re-derivation of all 17 problems —
  assume errors happen and check for them, don't assume the first pass is
  correct.

## 2. Topic categorization: Explain vs Practice vs Both

A topic (line item on Chapter Home) gets:
- **Explain only** — if its citation is a Theorem/concept with no re-
  attemptable worked example of its own.
- **Practice only** — if it's built entirely from solved Examples or is a
  standalone Exercise. A solved example is a *problem*, not a *concept* —
  even though it appears inside a textbook's explanatory section.
- **Both** — if the topic combines a genuine standalone concept (something
  worth explaining on its own, not just re-deriving a solved example) with a
  practicable Example. Not every chapter numbers its core ideas as a formal
  "Theorem" the way Chapter 1 did (Ch.2's "a polynomial of degree n has at
  most n zeroes" is stated as an unnumbered Remark, and the zero↔coefficient
  relationships are derived in prose with no theorem number at all) — cite
  whatever the book actually calls it (Theorem / Remark / nothing at all),
  never invent a number that doesn't exist. The test is "is there a real
  concept here beyond the example," not "does it have an official number."

## 3. Problem count = however many real citations the topic has

Never default to a fixed number (e.g. "always 2 problems"). One citation →
one problem. A standalone Exercise topic → every real question in that
exercise, not a sample. Don't manufacture a second problem to "fill a slot,"
and don't drop a real one to hit a round number.

## 3a. Every distinct question block gets its own line item

A book delineates its own question sets visually and structurally — a boxed
"EXERCISE 2.1", an inline "QUESTIONS" box mid-section, an end-of-chapter
"EXERCISES" block. Whatever the label, if the book presents it as a separate
block of questions (not the worked example inside the running explanatory
text), it becomes its **own standalone Practice-only topic** — never folded
into a concept topic's own Practice set.

A concept topic's own Practice is reserved for the *same worked example(s)
already shown in its Explain screen* (rule 1's reuse principle) — nothing
else. This was gotten wrong for Science Ch.1: the real inline "QUESTIONS"
box under section 1.1 (three real questions — why clean a magnesium ribbon,
balance three reactions, balance two more with state symbols) got partially
merged into the "balancing chemical equations" concept topic (only one of
its three questions used) instead of becoming its own topic, the way
Chapter 1 Maths's "Exercise 1.1" is separate from "Unique prime
factorisation." Likewise the real end-of-chapter "EXERCISES" section is a
distinct block from the section 1.2 concept topic it got folded into.

Self-check when building a chapter: for every inline "QUESTIONS"/"EXERCISE"
block in the source, does it have its own topic — and does that topic use
every real question in the block (rule 3), not a subset?

## 4. Steps must show real derivation, not skip to the answer

A step is one operation (one division, one factor pulled out, one line of
algebra) — not "here's the question, here's the final answer" with nothing
in between. For factorization specifically: show the actual long-division
chain (140 ÷ 2 = 70, 70 ÷ 2 = 35, 35 = 5 × 7), not a single jump to
`140 = 2² × 5 × 7`.

## 5. Multi-part real questions stay independent

If a real question has (i)/(ii)/(iii)... sub-parts, each is its own
selectable mini-walkthrough with its own step sequence — never force-
linearized into one chain a student has to click through in order to reach
a later part.

## 5a. Sub-parts are selectable the moment the problem is chosen, not hidden behind a mode

The sub-part picker must appear as soon as a multi-part problem is on
screen — not only after committing to "Ask AI tutor to solve it." A student
should be able to see and jump to (ii) or (iii) before deciding how they
want to solve it, the same way the top-level "choose a problem" picker
(Q1 vs Q2) is visible immediately, not gated behind a mode. This was
missed in an earlier build: the sub-part picker only rendered inside the
step-by-step screen, so a multi-part question's own select screen showed
the parts folded into one combined question with no way to jump to a
specific one — exactly the problem rule 5 already existed to prevent, just
one screen too late.

## 6. A trap only earns its place if it's the single most likely mistake

Before adding a `trap: { wrongGuess, hint }` to a step, apply this test:
**stop a student cold at this exact line, with only what they know so far
(not where the proof is heading) — what's the #1 wrong answer they'd
actually give trying to compute the next line?** That's usually one of:

- stopping factorization one step early (calling a composite number prime —
  e.g. thinking `78 = 2 × 39` is fully factored)
- an exponent-rule slip (`4ⁿ = 2ⁿ` instead of `4ⁿ = 2²ⁿ`, or adding
  exponents instead of multiplying)
- over-generalizing a partial divisibility result (`3 | a²` therefore
  `9 | a`, instead of correctly concluding `3 | a`)
- assuming a number is prime/composite without checking

It is **not** a sophisticated logical leap the student would only make by
reasoning backward from the proof's conclusion — that's a rationalization
for wanting a trap on that step, not a genuine prediction. If in doubt, ask
"would I bet money this is the #1 wrong answer, or did I construct a story
that makes it sound plausible?"

Not every step needs a trap. One genuine trap per problem (or per sub-part)
at the point a real mistake is likely beats a trap forced onto every line.

## 7. The wrong answer must actually follow from the mistake

If the hint says "you forgot to keep factorising," the crossed-out
`wrongGuess` must be the number you'd *actually* get by forgetting that —
not an arbitrary different wrong-looking number (e.g. a random wrong
multiplication result with no conceptual link to any real misconception).

## 8. No redundant information on screen

Before adding new copy, check what's already visible elsewhere on the same
screen. Don't repeat a citation in two places (a header badge already
showing "Example 2" doesn't need "(Example 2)" repeated in the question
text). Don't state information a UI element already conveys. When marking
something complete, preserve the citation text — "Explained · Theorem 1.1,
Example 1" not "Explained" (losing the citation).

## 9. Check sibling strings as a set

Words repeated across a screen, capitalization, and punctuation should be
consistent as a set, not verified one string at a time. ("Explained" and
"practiced" must match case; if one topic's meta text says "Practiced," a
sibling topic's shouldn't say "practised" or "Done.")

## 10. The full Practice blueprint, every topic

1. Choose which problem to tackle (if there's more than one — hide the
   picker entirely for single-problem topics).
2. See the full question, not a fragment.
3. Choose: AI tutor walks through it step by step, or upload a photo of your
   own answer (or tap an option, for MCQ-type problems — not used yet here).
   Both stay reachable at once; uploading expands inline rather than
   navigating away.
4. AI path → step-by-step guided solve with real derivation (rule 4) and at
   most one genuine trap where it's actually likely (rule 6).
5. Uploaded-answer path → real feedback (this build calls `ai-tutor-server`'s
   `/api/grade-photo`, a real vision-model grading call — not a demo toggle).
6. Wrong answer → routes into the same step-by-step walkthrough.
7. Finishing either path offers a real next step: the next unfinished
   problem in this topic, or back to the curriculum if this was the last one.
8. Completion state persists per problem (not just per topic), and the
   picker for multi-problem topics shows a checkmark on completed ones —
   don't track state invisibly.

## 11. Trace real navigation before calling a screen "done"

Component imports aren't the only way a screen becomes load-bearing —
`navigate("/some-route")` string calls matter just as much, including ones
built from template literals. Before assuming something is dead/unreachable
in this build, grep for both. (This is how `onboarding-crash-course.tsx`
was almost wrongly deleted during the slim-extraction pass — it's only
reached via a `navigate()` call, not an import.)

## 12. Self-audit before presenting a chapter as done

Once a chapter's Explain + Practice is built, do one full pass:
- Every citation real and correctly categorized (rule 2)?
- Every problem count matches the real citation count (rule 3)?
- Every step shows real derivation, no answer-skipping (rule 4)?
- Every multi-part question has independent sub-parts (rule 5)?
- Every trap passes the "#1 likely mistake" test, not a rationalized one
  (rule 6), and its wrong answer actually follows from the mistake (rule 7)?
- Every computed number independently re-verified by hand (rule 1)?
- No redundant copy, consistent sibling strings (rules 8–9)?

Report what was checked, not just what was built — the audit is part of the
deliverable, the same way it was for Chapter 1's 17-problem arithmetic pass.
