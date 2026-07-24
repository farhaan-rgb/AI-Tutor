# Project: PrepMaster (Test-schadcn)

A gamified test preparation app for Indian students (JEE, NEET, UPSC, CAT, etc.), styled in Duolingo/Wondering-style. Built from a Figma Make export.

---

## Shared System

This project uses the Teachmint shared design system located at:
```
~/Desktop/teachmint-system/
```

Before building anything, read the following files:
- **Design system:** `~/Desktop/teachmint-system/design-foundations/design-system-web.md`
- **Component patterns:** `~/Desktop/teachmint-system/design-foundations/component-patterns.md`
- **Code conventions:** `~/Desktop/teachmint-system/code-conventions/tech-stack-web.md`
- **Component template:** `~/Desktop/teachmint-system/code-conventions/component-template-web.md`
- **Handoff conventions:** `~/Desktop/teachmint-system/code-conventions/handoff-conventions.md`
- **Product context:** `~/Desktop/teachmint-system/product-context/product-overview.md`
- **User personas:** `~/Desktop/teachmint-system/product-context/user-personas.md`

---

## Project Context

```
Feature name:     PrepMaster — Gamified Test Prep
Platform:         Web (mobile-first, viewed in DevicePreviewToolbar)
Target user:      Students
User segment:     Indian students (JEE, NEET, UPSC, CAT, etc.)
Sprint goal:      Polished, production-quality screens across all flows
Constraints:      Dark mode by default, mobile-first (360px baseline), no backend yet
Design system:    CSS variables (src/styles/theme.css) + Tailwind CSS v4
Related feature:  Learning Path, Live Class, Practice, Profile
```

---

## Stack
- React 18 + TypeScript
- Tailwind CSS v4 (via @tailwindcss/vite)
- Vite 6
- MUI (Material UI v7) + Emotion
- Radix UI primitives (full suite)
- React Router v7
- Motion (Framer Motion)
- Recharts, react-hook-form, react-day-picker, cmdk, sonner, vaul, embla-carousel, react-three/fiber (Three.js)

## Install & Run
```bash
npm install --legacy-peer-deps   # REQUIRED: --legacy-peer-deps needed because @react-three/fiber@9.x requires React 19 but project uses React 18
npm run dev                       # Starts Vite dev server at http://localhost:5173/
```

## Source Structure
- `src/main.tsx` — entry point, wraps App with DevicePreviewToolbar
- `src/app/App.tsx` — root app component (RouterProvider)
- `src/app/routes.ts` — all route definitions (React Router)
- `src/app/DevicePreviewToolbar.tsx` — Figma-Make-style preview toolbar (iframe-based, W/H inputs, page selector)
- `src/app/contexts/theme-context.tsx` — theme provider (dark/light), exports `useTheme()`
- `src/app/components/` — screen components organized by feature:
  - `app/` — profile, manage-exams, bottom-nav, sidebar-nav, app-layout, full-screen-layout. Shared UI in `premium-ui.tsx` (GlassHeader, StatusBar, Card, StaggerList, StaggerItem, typo, etc.)
  - `learning-path/` — learning-path-v2/v3/v4, practice-complete, lesson-complete, topic-analytics, plus helper components (sticky-section-header, lesson-node, celebration-animations, etc.)
  - `learning-content/` — concept cards, video lesson, ncert notes, formula sheet, mind map, solved examples, ai summary, quick-learn
  - `practice-content/` — quick practice, pyqs, mistakes, timed practice, practice results
  - `assessment/` — empty (all test screens removed)
  - `live-class/` — live class interface
  - `profile/` — settings, edit-profile, upload-photo, analytics, saved-items, downloads, study-schedule, account-settings, help-support, feedback, privacy-policy, terms, language
  - `goals/` — daily goals screen + bottom sheet
  - `transitions/` — page transition wrapper
  - `figma/` — ImageWithFallback utility
  - `ui/` — 55+ Radix/shadcn UI primitives
- `src/imports/` — raw Figma-imported screen components
- `src/styles/` — global styles (index.css → fonts.css, tailwind.css, theme.css)

## Behavioral Rules for Claude

Follow these rules for every response in this project:

### Design tokens and spatial rules
- **Dark mode by default** — pure black `#000000` background
- **No hardcoded colors** — always use CSS variables (`var(--primary-600)`, `var(--foreground)`, etc.) defined in `src/styles/theme.css`
- Use `useTheme()` from `src/app/contexts/theme-context.tsx` for theme access
- **Spacing/padding:** only 0px, 2px, 4px, or multiples of 4px — no arbitrary values (no 5px, 10px, 15px, 18px, etc.)
- **Sizing (non-text):** all widths, heights, icons, avatars, containers must be multiples of 4px
- **Border radius:** only multiples of 4px (0, 4, 8, 12, 16, 20, 24) or 9999 for pill. Never 2px, 6px, 10px, 14px radius. **Cards cap at 12:** big section containers / cards / heroes / sheets use `12` (not 16/20 — those read too round). Small inner elements (icon tiles, chips, thumbnails) may step down to `8`. Status/tag/count pills use `9999`.
- **No decimal values** anywhere — whole integers only. Exception: 0.5px for hairline borders.
- No arbitrary Tailwind values like `p-[13px]` or `rounded-[10px]` — use only values that land on the 4px grid
- **Typography scale:** `--text-2xs: 11px` (badges/chips/tags), `--text-xs: 12px`, `--text-sm: 14px`, `--text-base: 16px`. Use `var(--text-2xs)` for all badge text, pill labels, "SOON" tags, and uppercase chip labels. The 11px exception is intentional for dense tag UI.
- **CTA / Button heights:** ONLY `36px`, `40px`, or `44px`. Never larger. Pick by density: `36px` for inline/compact actions, `40px` for standard, `44px` for primary/sticky bottom CTAs (also the iOS touch-target minimum). Label is always `14px / weight 600` (semibold). No exceptions — heroic XL buttons are banned. Applies to `<button>`, anchor-as-button, sticky bottom CTAs, sheet actions, segmented controls. Icon-only buttons follow the same height (square: 36/40/44).
- **Primary CTA — ONE canonical treatment everywhere:** filled `backgroundColor: var(--primary-500)`, `color: var(--white)`, `borderRadius: 12`, height `44` (or `36` only when genuinely compact/inline), label `14px / 600`. Disabled → `var(--disabled-bg)` bg + `var(--disabled-text)`. Do NOT color the primary CTA by an event/subject accent, `--warning-500`, `--purple-500`, or a gradient — accents belong to heroes/cards/progress, never the main action button. Secondary CTA = same height/radius/label but `var(--card)`/`--card-bg-secondary` bg (or transparent + `0.5px` border) with `--foreground` text. This keeps the whole Arena/feature surface on one CTA language. Optional pill radius (`9999`) is reserved for chips/tags/status pills, not action CTAs.

### Web styling split — non-negotiable
- **Tailwind for layout only:** `flex`, `grid`, `gap-*`, `p-*`, `m-*`, `w-*`, `h-*`, responsive prefixes (`md:`, `lg:`)
- **CSS variables for all visuals:** every color, shadow, border-radius, and font-size must come from `var(--token-name)`
- Apply CSS variable values through `style={{}}`, never through Tailwind color classes
- ❌ Never use Tailwind color classes (`text-blue-500`, `bg-primary-500`, `border-red-300`) — these are violations
- ❌ Never hardcode hex values in `style={{}}` — use a CSS variable

```tsx
// CORRECT
<div className="flex items-center gap-4 p-6" style={{ color: 'var(--foreground)', backgroundColor: 'var(--background)' }}>

// WRONG
<div className="flex items-center gap-4 p-6 text-blue-500 bg-black">
<div style={{ color: '#1890ff', display: 'flex' }}>
```

### Shared UI components
Use components from `src/app/components/app/premium-ui.tsx` — `GlassHeader`, `Card`, `StaggerList`, `StaggerItem`, `typo`, `StatusBar`, etc. Don't reinvent these.

### Bottom-sheet style (action menus)

The product's bottom-sheet language — used in Options / Recording-name / Add-attachment / Course-overflow menus — follows this pattern. Match it whenever an action/options sheet is needed.

**Anatomy (top → bottom):**
1. **Drag handle** — 36×4 pill, `var(--foreground)` at 18% opacity, centered, 12px top padding
2. **Header row** — `padding: 8 16 12 16`
   - Title on the **left**: `var(--text-base)` / weight 700 / `var(--foreground)`, single-line ellipsis
   - Close icon (`X`, 20px) on the **right**: 32×32 hitbox, `var(--muted-foreground)`
3. **Divider** — 0.5px, `color-mix(var(--foreground) 10%, transparent)`, inset 16px each side
4. **Action rows wrapped in a card** — outer wrapper `padding: 16`, inner card uses `var(--card-bg-secondary)` bg + `borderRadius: 12` + `overflow: hidden`. Rows live inside this single card.
   - Each row: `padding: 0 16`, `min-height: 56`, label LEFT, icon RIGHT
   - Label: `var(--text-base)` / weight 500 / `var(--foreground)`
   - Action icon (20px) on the **right** — *not* a chevron, it's the action's own icon. Color `var(--foreground)`
   - Destructive actions use `var(--error-500)` for both label and icon
   - Optional trailing-dot (8×8 success-500) next to label for status indicators
   - **Inline divider** (0.5px, foreground 10%, inset 16px each side) between rows — no divider after the last row
5. **Container reuses** `FeedbackSheet` shell — backdrop + slide-up animation + drag-to-dismiss

**What NOT to do:** no left icon-tile (those Material-style 40×40 rounded squares), no chevrons (this isn't a nav list), no sublabels (titles should be self-explanatory), no flat rows directly on the sheet background (they need the card-bg-secondary container).

**Reference implementation:** `src/screens/course-overflow-menu.tsx` (`OverflowMenuPopover`).

### Animations
- Use Framer Motion (`motion.*` + `AnimatePresence`) for all enter/exit and micro-interactions
- Keep durations subtle: `0.15–0.25s`, displacement `4–8px`
- Every element that enters or leaves the DOM must be wrapped in `AnimatePresence`

### Component standards
- Follow the template in `~/Desktop/teachmint-system/code-conventions/component-template-web.md` exactly
- Always add TypeScript interfaces for all props — no `any`
- Extract sub-components when a component exceeds 60 lines

### States — always implement ALL:
- Default
- Loading (skeleton or spinner, as appropriate)
- Empty state (with helpful copy)
- Error state (with retry mechanism)
- Disabled (where applicable)
- Success (where applicable)

### Dummy data conventions
- All placeholder data must use `DUMMY_` prefix
- Every `DUMMY_` variable must have a `// TODO(api): GET /api/...` comment above it
- Data shapes must match expected API response format

### Accessibility
- All interactive elements: minimum 44px touch target
- All icon-only elements: `aria-label` required
- All form inputs: `<label>` required
- Use semantic HTML — `<button>` not `<div onClick>`

### Responsive
- Design mobile-first (360px baseline)
- Test mentally at: 360px / 390px / 768px / 1024px / 1440px
- No hover-only interactions (must have touch equivalent)

### No emojis — use icons
- **Never use emojis in UI** — no emoji characters in JSX, message strings, labels, or copy
- Always use a Lucide icon instead (e.g. `<Hand />` instead of ✋, `<MessageCircle />` instead of 💬, `<Sparkles />` instead of ✨)
- This applies everywhere: tour steps, chat messages, nudge copy, participant data, onboarding copy, error states, empty states

### Code quality
- No `console.log` in final code
- No commented-out blocks
- No unused imports

## Preview Toolbar
`DevicePreviewToolbar.tsx` provides a Figma-Make-style preview:
- Uses `<iframe>` with `?embed` query param so the app gets its own viewport (100vh works correctly)
- Toolbar: page selector dropdown (all routes) + custom W/H inputs + close button
- **When adding new routes**: also add them to the PAGES array in `DevicePreviewToolbar.tsx`

## Key Docs
- `Guidelines.md` — design system rules, CSS variables, component standards
- `DEVELOPER_HANDOFF.md` — full technical guide
- `COMPONENT_ARCHITECTURE.md` — component structure
- `COLOR_MIGRATION_GUIDE.md` — color migration guide

## Known Issues Fixed
- `profile-screen.tsx` — was missing imports for `useState`, `GlassHeader`, `StaggerList`, `StaggerItem`, `Card`, `typo`, `useTheme`, and several lucide-react icons (Camera, BarChart3, Bookmark, Download, Mail, Lock, Shield, Globe, Moon, Sun, WifiOff, HelpCircle, MessageCircle, CheckCircle2). All fixed.
- Other screens may have similar missing import issues (Figma Make exports sometimes omit imports). When a screen crashes with "X is not defined", check imports first.

## Current State (as of 2026-04-08)

**Learning paths:** V2 (`/learning-path-v2`), V3 (`/learning-path`), V4 onboarding (`/onboarding-default`, `/onboarding-cat`). No V1. No mock tests / assessment flow (all deleted).

**Live Class (`/live-class`):**
- Interaction overlay fires at 30s, auto-dismisses after 20s, blocked when chat/hand-raise active
- Chat panel: portrait bottom sheet + desktop landscape sidebar, close button on right (no border/bg)
- Keyboard: simulated QWERTY shown in portrait only (`!isDesktopLandscape`)
- Chapter menu (hamburger) removed
- Next Live Class card: SOON badge with live countdown, in-sheet reschedule slot picker

**Recording Player (`/recording`):**
- YouTube-style play/pause button (semi-transparent dark circle)
- Bottom controls: time (left), speed + fullscreen icons (right)
- Chapter list with animated equalizer for "now playing" state
- Floating CTA: "Continue to Practice" → `/practice/pyq`

**Learning Path V3:** 5 topic names per chapter for all JEE/NEET subjects. Icon grid order: Live Class first. Recording icon navigates to `/recording`.

**Sticky Section Header:** shows unit number + title + topic count only (no percentage).

**Daily Goals sheet:** simple task list + progress bar. No XP, no streak display.

**PYQs:** full solve flow (list → MCQ solve with 60s timer → explanation → summary).

**Profile:** full sub-pages (edit, upload-photo, account-settings, help-support, feedback, privacy-policy, terms, language, analytics, saved-items, downloads, all-chats, study-schedule).

**Manage Exams:** gradient fill + glow on selection, animated checkmark, pulsing icon orb.

**Mascot:** custom AI Tutor SVG at `/public/ai-mascot.svg`, base64 data URI, bobbing animation.

**Marketplace — Devices (Primebook):** 3 SKUs `pb-neo`, `pb-pro`, `pb-max` defined in `PRIMEBOOK_PRODUCTS` (marketplace-product.tsx). Hero shots are local `/primebook-{neo|pro|max}.png` (clean — text-free); feature slides come from Primebook's Shopify CDN (only `*neo.png` suffixes exist there; shared across all 3 SKUs since PrimeOS/Gemini/CloudPC apply universally). End-to-end flow: marketplace-v1 → `/marketplace/product/pb-*` → `/marketplace/checkout` → `/marketplace/order-confirm` → `/marketplace/orders` → `/marketplace/order-detail` (device order shows `DeviceWarrantyCard` + 4-step shipping timeline) → `/marketplace/return` (4-step return wizard with photo upload, replacement-vs-refund picker, pickup confirm). Return policy mirrors Primebook's published terms (7-day return, 24-hr damage report, 10-business-day refund). `OrderStatus` includes `"Returned"`; `ProductKind` includes `"device"` (Monitor icon).

**My Test Series (post-purchase library):** After buying a mock pack, students access tests via Classes tab → `My Test Series` rail (sits between My Classrooms and My Courses, only renders when packs exist). Tap card → `/my-test-series/:packId` (pack detail with mock list, status pills, sticky "Continue Mock N" CTA). Tap a not-started mock → `/my-test-series/:packId/mock/:mockId/instructions` (consent gate) → `/take` (realistic shell — timer, section tabs Physics/Chemistry/Maths, MCQ + numerical types, question palette sheet with status colors, mark-for-review, submit modal) → `/result` (score, AIR prediction, subject-wise breakdown). State + helpers in `src/shared/test-series-progress.ts`. Two demo packs seeded: JEE Main mid-progress (6/30 completed, AIR 4200, trend +20) and NEET UG fresh (0/32). Order Confirm + Order Detail both deep-link to the relevant pack — student never has to come back to the store to find their tests. 15 stub questions across 3 sections; real bank is server-side TODO.

**Marketplace — Test Series:** New top-level main category on marketplace-v1 alongside Courses / Apps / Devices. 10 Indian competitive exams grouped into 4 sub-rails (Engineering: JEE Main + JEE Adv + GATE CSE · Medical: NEET UG + NEET PG · MBA & Law: CAT + CLAT · Civils & Govt: UPSC + SSC CGL + Bank PO). Card data in `TEST_SERIES_STREAMS` (marketplace-v1.tsx) renders via existing `PremiumMockTestCard`. Per-exam full product pages live in `TEST_SERIES_PRODUCTS` (marketplace-product.tsx) — each has 3 pack variants (Starter / Standard / Complete) with exam-realistic structure (NEET 180-Q, CAT 66-Q with section lockdown, UPSC 100-Q with current affairs, GATE NAT+MCQ+MSQ, etc). IDs follow `mt-{exam}` pattern (`mt-jee-main`, `mt-neet-ug`, etc). Age-gated: visible on All / Class 11–12 / College / Competitive; hidden on Primary / Secondary. Flows into existing `test-series` ProductKind pipeline (FileText icon, success-500 accent, 18% GST, HSN 9992) — no new screens needed for checkout/orders/invoice.

## Dev Server
- **Always start with:** `npm run dev` — `vite.config.ts` has `host: '0.0.0.0'` so it serves both local and WiFi automatically
- Local: `http://localhost:5173`
- WiFi: `http://<machine-ip>:5173` (run `ipconfig getifaddr en0` to get current IP)
- If server is down and user asks to host: start it with the command above, then report both URLs
- **Do NOT use plain `npm run dev -- --host`** — config already handles it

## Claude CLI Workflow Rules

These rules govern how Claude behaves during CLI sessions — not what to build, but how to work.

### Session management
- On starting a session: **read SESSION.md first**, then **read `~/Desktop/teachmint-system/agents/buddy-agent.md` and activate Buddy mode** for the rest of the session. All agent orchestration goes through Buddy unless Sagar calls a specific agent directly.
- On completing a major milestone: update SESSION.md immediately, then use `/compact` to free up context
- On ending a session: update SESSION.md with current status, next action, and any open questions

### Project-specific session rules
- When fixing errors: always check for missing imports first (common issue with Figma Make exports)
- When adding new routes to `routes.ts`, also update the PAGES array in `DevicePreviewToolbar.tsx`
- Use `npm install --legacy-peer-deps` — never plain `npm install`

### Auto-update SESSION.md — NON-NEGOTIABLE

SESSION.md must be updated **in the same response** as the work. Not after. Not when asked. Every single time.

**Trigger → what to update (exact field mapping):**

| What happened this response | Fields to update in SESSION.md |
|----------------------------|-------------------------------|
| Built or modified a component/screen | Status table row + Work Log Completed list |
| Made a design or code decision | Decisions Log row + Work Log "Decisions made" |
| Ran any agent | Work Log "Completed" list: agent name + key finding |
| Finished a task / hit a milestone | Resume Context: Current status + Next action |
| Hit a blocker | Resume Context: Blocked on |
| Raised an open question | Open Questions table |
| End of session / before `/compact` | ALL Resume Context fields + full Work Log entry |

**How to do it (in every response where work happened):**
1. Write the output to Sagar first
2. Then silently use the Edit/Write tool on SESSION.md in the same response
3. Update `Last updated` to today's date
4. Update `Current status` and `Next action` in Resume Context
5. Add the work to the Work Log for this session
6. Update the Status table if any screen/component changed state

**Hard rules — no exceptions:**
- NEVER wait to be asked. If work happened, SESSION.md gets updated.
- NEVER skip because the change was "small" — small changes compound into lost context
- NEVER announce "I'll update SESSION.md" — just do it silently
- The Resume Context must reflect the project's current state at all times

### Code changes
- **Prefer diffs over full file rewrites** for small changes — don't rewrite an entire 200-line file to change 5 lines
- For new files or major restructuring, full file writes are fine

### Task execution
- **Break large tasks into steps** — share the plan first, then execute step by step
- Confirm the plan before executing if it involves: creating more than 3 files, deleting or renaming existing files, changing shared components used by other screens, or anything irreversible
- For straightforward tasks (build a single component, fix a bug, add a state), just execute — don't over-plan

### Communication
- Keep responses concise — no unnecessary explanations or preambles
- When showing code, show only the relevant parts unless asked for the full file
- After building something, state what was built and what to do next — don't explain how React works

### Context management
- If context is getting long, proactively suggest `/compact`
- When resuming after `/compact`, re-read SESSION.md and CLAUDE.md to restore context
- Don't repeat information that's already in CLAUDE.md or SESSION.md

### Session Files
- `CLAUDE.md` — permanent reference (stable guidelines, standards, preferences). Do NOT add task-specific context here.
- `SESSION.md` (project root) — working context: current task, what's done, key decisions, next steps. Keep under 300 words. Update after each major step. This replaces chat history.

---

## Buddy — Your Workflow Agent

All agent work goes through Buddy. You never call individual agents by name — Buddy figures out which ones to run and runs them.

**Activate Buddy:** Read `~/Desktop/teachmint-system/agents/buddy-agent.md` at session start. Stay in Buddy mode for the entire session.

### What you say → what Buddy does

| What you say | Buddy runs |
|---|---|
| "Here's a problem statement / feature request" | PM Agent → User Persona Agent (×2) → Competitive Research Agent (if relevant) |
| "Let's map the flow" | UX Flow Agent → Scope Negotiator Agent |
| "I built [screen] / Check this" | Design System Enforcer + Accessibility Auditor + Responsive Device Agent (parallel) |
| "Clean this up" | Code Cleanup Agent → Design System Enforcer (re-check) |
| "Final check / All screens done" | Micro-interaction Agent → Design Critic + First-Time User Agent + Developer Reviewer (parallel) |
| "Hand off / Send to developer" | Code Cleanup Agent → Handoff Doc Generator |
| "I made changes after handoff" | Changelog Agent |
| "Status update" | Stakeholder Update Agent |
| "Here's the data / analytics" | Analytics Interpreter Agent → Iteration Prioritizer Agent |
| "Here's the bug list / feedback" | Iteration Prioritizer Agent |
| "Wrap up" / "Project done" | Scans project for new patterns → offers to update shared system files |

### Direct agent shortcuts (bypass Buddy)

| Shortcut | Agent |
|---|---|
| `run pm` | PM Agent |
| `run persona` | User Persona Agent |
| `run competitor` | Competitive Research Agent |
| `run flow` | UX Flow Agent |
| `run scope` | Scope Negotiator Agent |
| `run qa` | Design System Enforcer |
| `run cleanup` | Code Cleanup Agent |
| `run a11y` | Accessibility Auditor |
| `run responsive` | Responsive Device Agent |
| `run interactions` | Micro-interaction Agent |
| `run critic` | Design Critic Agent |
| `run devreview` | Developer Reviewer Agent |
| `run ftue` | First-Time User Agent |
| `run principles` | Design Principles Reviewer |
| `run handoff` | Handoff Doc Generator |
| `run changelog` | Changelog Agent |
| `run update` | Stakeholder Update Agent |
| `run analytics` | Analytics Interpreter Agent |
| `run prioritize` | Iteration Prioritizer Agent |

---

## Decisions Log

Track all significant design decisions here. Add a new entry whenever a non-obvious choice is made.

| Date | Decision | Rationale | Alternatives rejected |
|------|----------|-----------|----------------------|
| 2026-04-08 | Dark mode by default, pure black #000000 | Matches Duolingo/gaming aesthetic for student engagement | Light mode default |
| 2026-04-08 | CSS variables for colors instead of inline hex | Enables theme switching, consistent with design system | Hardcoded hex values |
| 2026-04-08 | Tailwind CSS v4 for layout only | Clean separation of layout vs visual concerns | Tailwind for everything |

---

## Session Resume Context

> Update this section at the end of every Claude CLI session so the next session can pick up instantly.

```
Last updated: 2026-05-19
Current status: Desktop relief pass — Design Critic agent walked 5 exam shells, surfaced 10 ship-now noise reductions, 8 shipped. StatusBar gated to mobile only on take screen. MARKED chip removed (redundant). Instructions + Result desktop top bars collapsed 6 elements + dividers → 3. Hindi-coming-soon yellow banner removed. IBPS section banner softened 14% → 6% accent. Pack progress count toned to text-xs/muted. Section-tab per-tab "X/Y" count removed (palette has it). Net: take screen 3 stacked header bands → 2. Deferred: merging Q metadata into candidate strip (invasive), per-exam "different real-portal feel" gaps. Prior: Per-exam test-taking chrome shipped via new `takeAccent` field. App chrome (pack/instructions) stays brand-blue; **take screen adopts per-exam accent** matching real portal family — NTA blue (JEE/NEET/UPSC/SSC), CAT amber, IBPS orange, CLAT green, GATE indigo. IBPS adds: 5-option support (auto-appends "None of these"), section-prominence banner above top bar. NTA/UPSC/SSC: desktop-only TCS-iON candidate strip (photo+name+roll+exam). SSC: top-bar EN|हिं language toggle (display-only). Prior: Multi-exam mock test support shipped. 8 packs now in DUMMY_MY_TEST_SERIES (was 3): JEE, NEET, CAT, UPSC, SSC CGL, IBPS PO, CLAT (Beta), GATE CSE (Beta). Take screen has 3 new mode flags: isIBPS (sectional timer + no manual lock + no tabs + forced linear), isSectionalTimed (CAT||IBPS shared engine), isSingleSection (UPSC, hides tabs). Per-exam INSTRUCTIONS_BY_EXAM + EXAM_PATTERN_LABEL + getMarkingScheme already plumbed end-to-end. CLAT (split-pane passage view) + GATE (MSQ/NAT/scientific calc) deferred to follow-up sessions — marketed as Beta in pack titles. Prior: Score tags centered + visually balanced. NEXT pill matches AntD-tag style. Action bar secondaries switched from neutral to AntD blue secondary (3 buttons all use primary-500 accent — JEE brand). ExitModal rewritten as destructive: "Exit this attempt? / Your progress will be lost / Exit anyway (error-red)" — no false save promise. In-progress demo seed removed (mock-7 now not-started; no flow produces in-progress with exit-loses-progress). Take screen header collapsed to single line (dropped JEE MAIN subtitle; just shows mock title). Prior: Instructions disabled Start CTA now uses --disabled-bg/--disabled-text (project-standard, same as live-class continue + AI-tutor send buttons). Mock 1 (and all historical mocks) now show By Section card — reconstructResult synthesizes per-section data evenly from totals. Pack screen back button always lands on /classes (was unreliable navigate(-1)). Prior: ScoreTag now uses AntD dark-mode tokens (--error-d2/d4, --warning-d2/d4, --success-d2/d4 — solid hex backgrounds + matching borders + colored text) — added the missing red/amber dark tokens to theme.css. PAUSED chip removed from MockRow (NEXT pill + subtitle + Resume CTA already triple-communicate). Action bar collapsed to 2 colors total (green primary + neutral for all 3 secondaries) — Save & Mark / Mark / Clear are now visually identical, differentiated by label only. ExitModal + SectionLockModal both rebuilt: bg var(--background)→var(--card) so they're visible against pure black; Keep going / Stay-in switched to --card-bg-secondary so they're visible buttons; Save & Exit / Lock & Continue switched from warning-yellow to --primary-500 (consistent modal primary). Overlay rgba(0,0,0,0.7) → var(--overlay-strong). Build green (1.80 MB JS, 2327 modules).
Prior status (this session morning): Buddy review applied to Instructions + Pack screens (3rd Buddy session today). Pack listing now uses color-banded score chips (green/amber/red by % of max) + NEXT pill on next-pending row + de-emphasized completed titles — students can scan 30 rows and instantly read strengths/weaknesses/what's next. Performance strip swapped "Last 5 mocks" trend for "Best score" (color-banded). Sticky CTA: frosted glass chrome, flat accent fill, all-done state surfaces "review your report" instead of disappearing. Instructions screen disabled CTA fixed (muted-accent fill, not invisible grey ghost on black); penalty stat color neutralized (only icon red); StatCell values 22/700 → 20/600; checkboxes 22/r6 → 20/r4; PALETTE_LEGEND tokens (hex → CSS vars); all "#fff" → var(--white). Build green (1.80 MB JS, 2327 modules).
Next task: Browser QA. /my-test-series/mt-jee-main → 6 completed mocks should render with color-banded score chips (all <50% so amber/red — actually need to verify: 108/360=30% red, 156/360=43% amber); the in-progress mock-7 should show NEXT pill + accent border + tinted bg. /my-test-series/mt-jee-main/mock/mock-8/instructions → disabled Start CTA should show muted-accent fill (visible), not grey ghost. Tick the box → CTA becomes solid accent.
Open questions: Pack screen "all 30 done" state currently routes to last completed mock's result — needs a real /report-card screen eventually.
Files modified this session: src/screens/my-test-series-pack.tsx (heavy MockRow rewrite), src/screens/my-test-series-mock-instructions.tsx (medium)
Handoff status: Not started
```
