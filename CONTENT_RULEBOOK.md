# AI Tutor content rulebook — Class 10 NCERT

This is the checklist I audit every chapter against before presenting it as
done, for both `ai-tutor-explain.tsx` (concepts) and `ai-tutor-solve.tsx`
(practice). It exists because Chapter 1 (Real Numbers) needed a long back-
and-forth to get right — the goal is to hit this bar on the first pass for
every chapter after it, not rediscover these rules one correction at a time.

Source of truth for every fact below: the real NCERT PDF for the chapter
(`jemh1XX.pdf` for Maths, `jesc1XX.pdf` for Science, `jess1XX.pdf` for
Geography/`jess2XX.pdf` for Economics/`jess3XX.pdf` for History/`jess4XX.pdf`
for Political Science — Class 10 Social Science is four separate books, not
one — all fetched from `ncert.nic.in/textbook/pdf/`). Never invent a number,
a proof step, or a question under a citation's name.

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

**Engineering note:** procedural, applied, visual, and fact-recall are built
(`ai-tutor-solve.tsx`'s step/parts model for the first two, the shared
visual/fact-recall quiz shape for the other two). Analytical/argumentative
is also now built (History Ch.1 was the first subject where it was actually
needed at scale) — see the "Analytical/open-response format" section below.
Only Language/composition remains unbuilt as its own shape; the two
composition-flavoured History questions built so far (writing an eyewitness
report, describing a perspective) reused the analytical shape rather than
waiting for a dedicated one, since the interaction (write freely, get
qualitative feedback, never right/wrong) is identical — only the grading
criteria's emphasis differs. Build a genuinely new shape only once a real
question shows up that the analytical shape can't actually represent.

**Never size a choice/option button to a fixed box.** Visual and fact-recall
questions share one quiz UI (rule 0's table), and its option text ranges
from a single digit (a graph's zero-count) to a full sentence (a fact-
recall answer). A fixed-size tile fits the former and overlaps into
unreadable garbage for the latter — real bug, real screenshot. Option
buttons are always full-width rows sized to their own content, never a
fixed square/tile, because there is no way to predict in advance how long
a real answer option will be.

**A single-sub-question visual problem doesn't get a second copy of its own
question.** The visual/fact-recall shape has two text slots — the problem's
own `questionText` (shown in the top card) and each sub-question's own
`prompt` (shown above its options). With multiple real sub-questions (e.g.
Q1's (i)/(ii)/(iii)), those two slots carry genuinely different text — a
shared framing plus each part's specific ask — and both belong on screen.
With exactly one sub-question, writing a `prompt` that just restates
`questionText` in slightly different words puts the same question on screen
twice — real bug, real screenshot (Science Ch.1 Q3, "What happens when
dilute hydrochloric acid..." shown once as the card, once as the prompt,
one sentence apart). The lone sub-question picker chip that comes with it
is equally pointless — there's nothing to pick between with only one
option. Fixed by hiding both the repeated prompt and the picker whenever a
visual problem has exactly one sub-question; the top card alone already
states it in full.

**No picker for a single choice, full stop — check every "does this problem
have parts" render, not just the one you happened to be looking at.** The
`parts` shape (multi-step derivations) has the exact same failure as
`visual` above, and it was missed on the first pass specifically because
the visual case was fixed in isolation instead of as an instance of a
general rule. Q14 (silver refining) has exactly one real part — "Reaction"
— and still showed a "Choose a sub-part" picker with one lonely chip,
because the check was `problem.parts && (...)` instead of `problem.parts &&
problem.parts.length > 1 && (...)`. There were two separate render sites
for this same picker (select screen, walkthrough screen) — both needed the
fix, not just the one in view. **The general rule, for any picker in this
file: gate on "more than one real option," not on "the field exists."** A
field being present doesn't mean there's a choice to make — check the
count.

**A problem-index doesn't get to grow with the problem count.** The
"choose a problem" selector (topic → which of N real problems) is
UI chrome, not content — its job is to get the student to the actual
question, not to compete with it for screen space. A wrapping pill grid is
fine for a handful of problems, but a chapter's full 20-question exercise
set wrapped it across 5 rows, pushing the real question below the fold —
real bug, real screenshot. Once a topic has enough real problems that the
selector would take that much space, it needs a fixed-height design (e.g.
prev/next + a sheet for jumping directly), not a version of the same grid
that just keeps growing. This is a general property of any selector built
from "however many real problems/questions this topic has" — check it
whenever a topic's problem count is large (an in-text QUESTIONS box with
2-3 real questions won't hit this; a full end-of-chapter EXERCISES section
covering all real questions will).

## 0a. The analytical/open-response format (History Ch.1, first use)

Built for History Ch.1, "The Rise of Nationalism in Europe" — the first
chapter where a real majority of the content is Analytical/argumentative
rather than procedural, per rule 0's table. Every "Discuss," "Write in
brief," and most in-text "Activity" questions in this chapter have no
single determinate answer, so grading them right/wrong would misrepresent
what's actually being assessed.

**Shape:** `analytical: { criteria: string[]; groundingNotes: string;
imageSrc?: string; imageAlt?: string }` on `PracticeProblem`. `criteria` are
the real things a strong answer should cover — drawn from what the chapter
itself actually says, never invented generically ("discusses the topic
well" is not a real criterion; "cites Renan's 'daily plebiscite' phrase"
is). `groundingNotes` are the real facts/quotes backing those criteria, sent
to the grading model as context — never shown to the student before they
answer, since that would hand them the answer instead of letting them
attempt it. `imageSrc` is a real cropped figure from the actual PDF — many
History questions literally say "describe this caricature/painting," which
is meaningless without the image on screen (missing entirely on the first
pass — only `visual` had an image field; real bug, real screenshot, since
a huge fraction of this chapter's Activities are "look at Fig. N and...").

**Interaction:** both "ask the AI tutor for a model answer" and "write your
own answer" stay visible and tappable at once, same pattern as procedural's
"Ask AI to solve it"/"Upload your answer" — an earlier build skipped
straight to a blank textarea with no model-answer option at all, which was
a real gap, not a deliberate simplification. The model answer
(`/api/model-answer`) is a short framing of what the answer needs to cover
plus the actual substantive answer — the answer itself is the main focus,
the framing is a small supporting part, not the other way around. Writing
your own answer supports three input methods that all funnel into the same
grading call: typing, recording (mic → `/api/transcribe-audio` → fills the
same textarea), or uploading a photo of handwritten work (sent directly as
`imageDataUrl` to `/api/grade-text`, which reads it in the same model call
rather than needing separate OCR). Feedback from `/api/grade-text` names
the *specific* real content that's missing when something is — the actual
fact or quote from `groundingNotes`, not a vague "add more detail" — while
still never reducing to a correct/incorrect verdict, per the system
prompt's explicit instruction to the grading model. Completion marks on a
genuine attempt (a real answer was submitted and graded), not on
"correctness" — there's nothing to gate that on. The real criteria are
revealed *alongside* the feedback, after submission, as a self-check
checklist — not shown upfront as an answer key.

**Composition-flavoured questions reuse this shape too.** A couple of real
History questions (write an eyewitness report, describe how you'd relate to
a symbol from someone else's perspective) are Language/composition rather
than strictly argumentative — but the interaction is identical (write
freely, get qualitative feedback), so they use the same `analytical` shape
with criteria that check for real grounding + adopted voice rather than
argument soundness. Don't build a separate shape until a real question
shows up that this one genuinely can't represent.

**Multi-part real questions with mixed formats get split by format, not
kept as one problem.** History's Fig. 14(a)/14(b) Activity is one real
box, but two of its four sentences ask something genuinely visual (read the
map's year-coding — a real, determinate answer) and the rest ask something
genuinely analytical (do you think these people saw themselves as Italians
— no fixed answer). Splitting it into one `visual` problem and one
`analytical` problem is correct — rule 0's classification applies at the
problem level, and forcing a fixed-answer map-reading question and a no-
fixed-answer opinion question through the same shape would misrepresent one
of them, whichever shape was picked.

## 0b. Some real activities are genuinely out of scope — say so, don't drop them silently

Not every real question a textbook asks can become an in-app Practice
interaction. History Ch.1 has two: "plot on a map of Europe the changes
drawn up by the Vienna Congress" (a real drawing/plotting activity this app
has no map-plotting surface for) and the end-of-chapter "Project" (find
nationalist symbols outside Europe — a genuine multi-day open research
task, not a single-sitting practice question). Both are real, both were
found during the rule-3b inventory, and both are excluded — but the
exclusion itself is written down, next to the inventory, with the reason.
The test is the same as rule 3's "no silent caps": a citation that's out of
scope is still a citation that was found and accounted for, not one that
quietly never got mentioned.

**Verify a chapter's real facts by fetching them, not by recalling them.**
Building History's course-catalog entry required knowing the book's real
5-chapter list and each chapter's real title — rather than trusting
memory (which chapter numbering maps to which subject-code prefix is easy
to misremember, and Class 10 Social Science alone has four different
subject-code prefixes), every chapter's PDF was actually downloaded from
`ncert.nic.in` and its first real page checked directly. The same
discipline applies to any fact that feeds a catalog entry, a chapter list,
or a citation — if it can be fetched and checked, fetch and check it,
even when it feels like something you already "know."

**A real citation's own numbering can be ambiguous — note that, don't
silently resolve it.** One History Activity, as printed, refers to "Fig.
17" in a spot where the surrounding page layout and the question's actual
content clearly point at Fig. 18 instead (likely a page-numbering artifact
in how the two figures sit on consecutive pages). Rather than quietly
"correcting" the citation to what seemed intended, or building the
question exactly as literally printed while ignoring the mismatch, the
right move is to build the question grounded in what the content clearly
requires (both figures, and the real contrast between them) while noting
the discrepancy explicitly in the grounding notes — so anyone auditing the
content later can see the ambiguity was noticed, not missed.

**A chapter's own unnumbered introduction is a real, separate section —
don't fold it into "Section 1."** History Ch.1 opens with real content (the
Sorrieu print, Renan's "What is a Nation?" essay) that sits *before* the
numbered heading "1 The French Revolution and the Idea of the Nation"
begins. An earlier build treated this intro material as if it belonged to
Section 1 — real content, correctly cited, wrong placement — and as a
direct result, real Section 1 itself (which has no in-text question of its
own) never got properly inventoried on its own terms. This is the same
root failure rule 3b already names (build against a written inventory, not
memory/assumption) showing up one level higher: it's not just individual
citations that need inventorying against their real section, the section
boundaries themselves need verifying against exact page/line position
before any content gets assigned to them. When a book's own layout puts
real content before its first numbered heading, that's the book telling you
it's a distinct part — check where a numbered section actually *starts*
(not just what topic its early paragraphs seem to be about) before
building anything under its name.

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

## 1a. Content must be complete, not just accurate

Rule 1 stops you from inventing facts — it doesn't stop you from leaving real
ones out. A citation can be completely accurate (a real Theorem, a real
Example, correct numbers) and still be an incomplete account of what the
textbook actually says about that concept, if a defining illustration or
property from the source got dropped along the way.

This happened for Chapter 1's "Unique prime factorisation" topic: the intro
correctly cited Theorem 1.1 and the 32760 factor tree, and Example 1 was
fully and correctly worked — but the textbook's own concrete illustration of
what "unique apart from order" actually means (2 × 3 × 5 × 7 regarded as the
same factorisation as 7 × 5 × 3 × 2) was never included. The topic passed
every existing check — real citation, correct category, correct numbers —
and still had a real gap, caught only when a narration script built *from*
this already-approved intro was diffed against the source PDF directly,
months after the topic was first marked done.

Before marking any Explain concept done, re-read its source PDF section
fresh — not from memory of the earlier build — and diff every explanatory
element (theorem statements, defining illustrations, properties the concept
depends on) against what's on screen. Two categories:
- **Required**: anything that defines or illustrates the core property being
  taught. Missing one of these is the same class of bug as rule 1's
  "invented content," just the opposite direction — an incomplete account
  presented as if it were the full one.
- **Safely omittable**: motivating scaffolding/lead-in questions, historical
  or biographical asides, notation conventions, and repeat worked examples
  that reinforce a point already demonstrated some other way. Leaving these
  out doesn't change whether the concept is understood.

If in doubt which category something falls into, ask: "would a student who
only saw what's on screen be missing something they need to actually grasp
the concept, or just something extra?"

## 1b. Practice problem statements must be complete, not just accurate

Rule 1a checks whether a *concept's* exposition is a complete account of the
source. This is the same check applied to a *problem's* statement, and it's
a distinct failure mode from what rules 3/3a/3b and rule 4 already catch:

- Rules 3/3a/3b catch a missing **question** — a whole citation or
  question-block that never became a topic.
- Rule 4 catches a missing **derivation step** — the solution skipping from
  question to answer.
- Rule 1b catches something neither of those will: the on-screen **question
  text itself** — the prompt, a shared premise across sub-parts, a
  condition, a unit — silently missing a piece the real textbook question
  has, even though the citation is real, the numbers are correct, and the
  derivation is fully shown. A word problem missing one clause of its setup,
  or a multi-part question whose shared stem got dropped when only the
  sub-part-specific text was carried over, are both this bug, not rule 4's.

Before marking a Practice problem done, re-read its exact question in the
source PDF fresh and diff it word-for-word against the on-screen prompt —
not just the numbers used in the derivation. Same two-category test as rule
1a: a dropped clause/condition/shared premise is required; the book's own
scaffolding language around the question (e.g. "Let us consider some
examples" before it) is not.

## 1c. Language must be plain, not idiomatic — the student is learning math in a second language

Every topic here is written for a Class 10 Indian student — many of whom are
confident in math but not fluent in English. Rules 1/1a/1b are about whether
the *content* is real and complete; this rule is about whether the *English
carrying that content* is actually accessible to this specific reader. Content
can be perfectly accurate and complete and still fail the student if the
sentence wrapped around it needs native-speaker fluency to parse.

The failure mode isn't math vocabulary — "composite number," "prime
factorisation," "exponent" are the curriculum's own required terms and stay
exactly as they are; simplifying those away would be removing the actual
lesson. The failure mode is figurative, native-speaker-idiomatic *connective*
English wrapped around that vocabulary — phrases whose meaning isn't
derivable from their individual words. Real examples caught in Chapter 1's
"Unique prime factorisation" topic, in both `TOPIC_COPY` and its narration
script:

- "That's uniqueness **doing real work**" — a metaphor; "work" here means
  nothing like its everyday sense. Fix: "that's what uniqueness actually
  guarantees."
- "you'd **land on** exactly the same primes" — spatial metaphor for
  "arrive at." Fix: "you'd arrive at."
- "which **works out to** 2²ⁿ" — idiomatic for "equals." Fix: "equals."
- "five was never there **to begin with** / **to start with**" — idiomatic
  for "from the start." Fix: "from the start."

None of these are hard to fix — say the literal thing instead, even where it
reads slightly less "natural" to a fluent English ear. Natural-sounding-to-a-
native-speaker is not the goal here. The test: could a student who reads or
hears every individual word correctly, but doesn't know English idiom, still
get the sentence's actual meaning? If not, replace it with the literal
phrasing.

Not every multi-word phrase is a violation — extremely common, low-ambiguity
ones that are already basic-English-education staples ("breaks down into,"
"made up of") don't need hunting down. The bar is specifically figurative
phrases where the individual words don't add up to the intended meaning
without already knowing the idiom.

**A second, related failure mode: sentence fragments that drop the subject
or verb.** "Still one fact about the number." isn't idiomatic — every word
is literal — but it's not a complete sentence either; it leans on the reader
to silently supply "[This is] still one fact about the number." A fluent
speaker does that automatically. A student still learning English grammar is
more likely to be parsing for a subject and a verb and finds neither — a
different barrier than idiom, but the same underlying problem: economy of
language that assumes a fluency this reader may not have. Prefer a complete
subject-verb sentence ("That's still one fact about the number.") even where
the fragment reads punchier to a fluent ear — caught first in this same
topic's narration script, where a comma-attached clause in `TOPIC_COPY` (
"...is the same factorisation as 7×5×3×2, still one fact about the number,"
grammatically complete as an attached clause) got split into its own
sentence for spoken pacing and became a fragment in the process.

This applies to every piece of Explain/Practice copy — `TOPIC_COPY`,
narration scripts, video on-screen text, everything. Audio and video carry an
even tighter bar than on-screen text: a student can re-read a confusing
sentence in a chat bubble, but a narrated line is heard once and gone.

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

## 3b. Inventory every question-block before writing anything, and don't let shared numbers fake coverage

Rule 3a's check ("does every block have its own topic") only works if you
actually know every block exists. Before writing a single topic, read the
*whole* chapter once and write down every real question-block — every
inline "QUESTIONS" box, every embedded activity-turned-question, every
numbered "EXERCISE" — against the section it actually sits in. Build
against that list. Don't discover structure opportunistically section-by-
section, because a block sitting after content you haven't built yet is
exactly the kind of thing that goes unnoticed if "have I started this
section" is the only thing prompting you to look for one.

This is precisely how it happened again, right after rule 3a was written
for it: Science Ch.1 section 1.3 (Corrosion, Rancidity) was left out of
the sample scope entirely, and its trailing "QUESTIONS" box — 3 real
questions — was never inventoried, so it didn't register as something to
either build or explicitly mark out of scope. One of those three
questions (CuO(s) + H₂(g) → Cu(s) + H₂O(l), identify oxidised/reduced)
happened to share its numbers with section 1.2.5's own worked example,
which *was* built — and that coincidence, recalled from memory rather
than checked against a written inventory, made the box feel already
covered. It wasn't: the other two real questions in that same box were
never touched, and the box itself got mislabeled in code comments as
section 1.2's, not 1.3's.

**Two real citations sharing the same numbers are still two citations.**
Building one doesn't retire the other from the list — verify against the
inventory, not against what a previous build happens to remind you of.

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
- Every Explain concept re-checked against a *fresh* read of its source PDF
  section for completeness, not just accuracy (rule 1a) — don't rely on
  memory of the earlier build.
- Every Practice problem's on-screen question text diffed word-for-word
  against its real source question, not just its numbers (rule 1b).
- Every sentence checked for native-speaker idiom that doesn't survive literal
  reading — math vocabulary kept, figurative connective English replaced
  with the literal phrasing (rule 1c).
- No redundant copy, consistent sibling strings (rules 8–9)?

Report what was checked, not just what was built — the audit is part of the
deliverable, the same way it was for Chapter 1's 17-problem arithmetic pass.
