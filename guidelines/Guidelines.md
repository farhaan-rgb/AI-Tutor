# Guidelines — Test Prep App

## Critical Design System Rule

This project uses **Untitled UI PRO** as its sole design system.

### What this means — read carefully:

1. **Colors**: Every color must come from Untitled UI's color styles, variables, or tokens. Never use raw hex codes, hardcoded RGB values, or colors from any other source. Reference Untitled UI color names exactly as defined in the library (e.g., `primary-600`, `gray-900`, `success-500`, `error-500`). When generating code, use Untitled UI CSS variables (e.g., `var(--color-primary-600)`) — never raw hex.

2. **Typography**: Every text element must use Untitled UI's typography styles. The font is **Inter**. Use Untitled UI's type scale names exactly (e.g., `Display xl`, `Display sm`, `Text xl/Semibold`, `Text md/Regular`, `Text sm/Medium`). When generating code, use Untitled UI typography tokens. Never use a different font, custom font size, or font weight outside of the Untitled UI type scale.

3. **Components**: Every UI element must be built from Untitled UI's component library. Use the exact component names from the library (e.g., `_Button/Primary`, `_Input field`, `_Badge`, `_Avatar`, `_Toggle`, `_Tabs`, `_Progress bar`, `_Modal`, `_Dropdown`, `_Checkbox`, `_Radio`). If a custom element is needed (e.g., mastery ring, streak counter), compose it from existing Untitled UI primitives — never build from scratch.

4. **Spacing**: Use Untitled UI's spacing scale variables only. Typical values in the system: 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64px. Never use arbitrary values like 13px, 19px, 37px, etc. When generating code, use Untitled UI spacing tokens.

5. **Border Radius**: Use Untitled UI's radius variables only (e.g., `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `full`). Never hardcode radius values.

6. **Shadows / Effects**: Use Untitled UI's shadow styles only (e.g., `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`). Never create custom box-shadows.

7. **Icons**: Use Untitled UI's bundled icon set only. The library includes 2000+ icons. Never import icons from external libraries (no Lucide, no Heroicons, no Material Icons — only what comes with Untitled UI).

8. **Dark Mode**: Use Untitled UI's built-in dark mode color variables. The system supports switching with one click via color variables. Never manually define dark mode colors. When generating code, use the semantic color tokens that automatically swap in dark mode.

**If you are unsure whether a style exists in Untitled UI — look at the attached library first. If it exists, use it. If it does not exist, compose from what does exist. Never invent outside the system.**

---

## Project Context

### What is this app?
A mobile-first test preparation app for students in India preparing for competitive exams.

### Supported exams
JEE Main, JEE Advanced, NEET, UPSC, CAT, GATE, SSC CGL, Banking (IBPS), CLAT, CBSE Boards, State PSCs, and more. Students can prepare for multiple exams simultaneously.

### Target users
Students aged 15–28 across India. Mostly on mid-range Android phones. Many study late at night. Many in tier 2/3 cities with limited internet. Stressed, overwhelmed by syllabus, need structure.

### Design philosophy
- Professional + motivating. Smart coach energy. Never childish or cartoon-like.
- Clean, modern, focused. Favor whitespace over density.
- Dark mode is the default theme (students study at night). Light mode also supported.
- Mobile-first: design for 360 × 800px viewport.

---

## App Structure

### Bottom Navigation (4 tabs — always visible on main screens)
| Tab | Icon | Purpose |
|---|---|---|
| Home | home icon | Daily command center: study plan, continue card, progress |
| My Exams | book-open icon | Browse exams → subjects → chapters → topics. Study + test |
| AI Tutor | sparkles icon | Doubt solver, concept chat, photo solver, study advisor |
| Profile | user icon | Analytics, streaks, badges, bookmarks, settings, account |

Only 4 tabs. Never more. Never less. Onboarding screens do NOT show the bottom navigation.

### Content Hierarchy
```
Exam → Subject → Chapter → Topic
```
At the Topic level, both learning resources and practice questions coexist on the same page.

### Test Organization
Tests live inside the exam context (not a separate tab):
```
My Exams → [Select Exam] → Exam Dashboard → [Tests Tab]
```
The Exam Dashboard has two top tabs: **Syllabus** and **Tests**.

---

## Component Mapping

Map every app element to an Untitled UI component. Use exact Untitled UI component names.

### Navigation & Layout
| App Element | Untitled UI Component |
|---|---|
| Bottom navigation bar | Bottom bar navigation or Tab bar |
| Top app bar | Header / Navigation |
| Screen sections | Container with Auto Layout |
| Dividers between sections | Divider |

### Actions
| App Element | Untitled UI Component |
|---|---|
| Primary CTA ("Start", "Continue", "Submit") | Button / Primary (size lg or xl) |
| Secondary CTA ("Skip", "See all") | Button / Secondary or Button / Link |
| Destructive action ("Remove exam") | Button / Destructive |
| Icon-only actions (back, bell, settings) | Icon button |
| Quick action chips | Badge or Button / Tertiary (small) |

### Data Entry
| App Element | Untitled UI Component |
|---|---|
| Phone number input | Input field |
| OTP boxes | Input field (small, fixed width) |
| Search | Input field with search icon |
| Exam date selector | Dropdown / Select |
| Study hours slider | Slider |
| Exam selection (multi-select) | Checkbox group or Checkbox card |
| Language selection (single) | Radio group or Radio card |
| MCQ options | Radio card or custom using Radio |

### Display
| App Element | Untitled UI Component |
|---|---|
| Exam cards | Card |
| Subject cards | Card with colored accent |
| Chapter list items | List item / Row |
| Topic list items | List item / Row with status |
| Study plan tasks | Checkbox + list item |
| Progress bars (syllabus, daily) | Progress bar |
| Difficulty label (Easy/Medium/Hard) | Badge (success/warning/error variant) |
| Subject tags (Physics/Chemistry) | Badge (colored) |
| PYQ frequency tag | Badge |
| Exam countdown | Badge or inline text |
| Streak counter | Badge + icon |
| XP display | Badge + icon |
| Mastery level indicators | Progress bar or Step indicator |
| Avatars (student profile) | Avatar |
| Notification dot | Indicator dot (from Badge or Avatar) |

### Feedback & Overlay
| App Element | Untitled UI Component |
|---|---|
| Correct answer highlight | Success state (use success colors) |
| Wrong answer highlight | Error state (use error colors) |
| Toast messages ("Saved!", "Synced!") | Toast / Alert |
| Modals (confirm, info) | Modal / Dialog |
| Bottom sheets (options, filters) | Modal variant or Drawer |
| Tooltips | Tooltip |
| Empty states | Empty state pattern |
| Loading | Skeleton or Spinner |

### AI Tutor
| App Element | Untitled UI Component |
|---|---|
| Chat messages (AI) | Card (left-aligned) |
| Chat messages (student) | Card (right-aligned, primary bg) |
| Chat input bar | Input field + Icon buttons |
| Photo upload button | Button / Icon |
| Floating AI button (FAB) | Button / Primary (round, elevated) |

---

## Subject Color Mapping

Each subject uses a specific color range from Untitled UI's palette. Use the closest Untitled UI color tokens:

| Subject | Untitled UI Color Range | Usage |
|---|---|---|
| Physics | Blue tones (e.g., blue-500, blue-600) | Left border on cards, progress bars, tags |
| Chemistry | Green tones (e.g., green-500, green-600) | Left border on cards, progress bars, tags |
| Mathematics | Orange tones (e.g., orange-500, orange-600) | Left border on cards, progress bars, tags |
| Biology | Purple tones (e.g., purple-500, purple-600) | Left border on cards, progress bars, tags |
| General / Default | Primary tones | Default when no subject context |

These accent colors appear as: left borders on cards (3–4px), progress bar fill colors, subject tag badge backgrounds, and icon tints.

---

## Screen-Specific Rules

### Onboarding (8 screens)
- Full-screen layout. No bottom navigation bar.
- Center-aligned content.
- One primary CTA button at bottom (Untitled UI Button/Primary, full width).
- Step progress indicator at top (Untitled UI Progress bar, thin).
- Minimal content per screen: one heading, one subtext, one input area, one button.
- Back arrow (Untitled UI Icon button) top-left on screens 2+.

### Home Screen
- Bottom navigation visible (Home tab active).
- Top bar: app logo left, streak counter + notification bell right.
- Sections stack vertically with consistent Untitled UI section spacing.
- "Continue" area shows up to 3 items (horizontal scroll cards).
- Study plan shows 3–4 task items as checkbox list.
- Quick actions as horizontal scroll of small badges/buttons.

### My Exams
- Bottom navigation visible (My Exams tab active).
- Exam list shows cards with progress bars and countdown badges.
- Exam Dashboard uses Untitled UI Tabs component for Syllabus | Tests.
- Subject cards show subject color as left border + matching progress bar color.
- Chapter list uses Untitled UI list items with status badges.
- Topic page: Learn and Practice sections stack vertically (not as separate tabs).

### Question / Practice Screen
- Minimal chrome. Progress bar at top. Question counter top-right.
- Question text in a card. Large, readable (minimum Untitled UI Text xl size).
- MCQ options as radio cards or selectable list items with clear selected/unselected states.
- Post-answer: correct option gets success styling, wrong gets error styling.
- Solution area below as expandable card.

### Mock Test Screen
- Full-screen mode. No bottom navigation. No distractions.
- Timer at top center.
- Question palette (numbered grid) in a drawer/sheet.
- Must simulate real exam interface patterns.

### AI Tutor Screen
- Chat interface layout.
- AI messages left-aligned, student messages right-aligned.
- Input bar fixed at bottom with text input + camera icon + mic icon.
- Context banner at top when accessed from a specific topic.

---

## Content Rules

- Never use Lorem Ipsum. Always use realistic Indian exam prep content.
- Student name: "Rahul" (default for mockups).
- Example subjects: Physics, Chemistry, Mathematics, Biology.
- Example chapters: Kinematics, Electromagnetic Induction, Thermodynamics, Organic Chemistry.
- Example topics: Faraday's Law, Newton's Laws, Periodic Table Trends.
- Example exams: JEE Main 2027, NEET 2027, UPSC CSE 2027.
- Example scores: 178/300, 142/200, 65%.
- Exam countdown: "142 days left", "89 days left".
- PYQ data: "Asked 12 times in last 15 years", "High weightage".

---

## Tone & Visual Rules

- No confetti explosions. No cartoon mascots. No childish stickers.
- Celebrations should be subtle: a brief checkmark animation, a color flash, a badge earned. Never over-the-top.
- Gamification elements (streaks, XP, badges) should look professional — think LinkedIn badges, not video game trophies.
- Error states should be clear but not alarming. Use Untitled UI's error colors with appropriate messaging.
- Empty states should be helpful, not sad. Use Untitled UI's empty state patterns with actionable guidance.
- Loading states should use Untitled UI skeleton loaders — never a blank screen.

---

## Responsive Behavior

- Primary design: 360 × 800px (mobile).
- All layouts must use Auto Layout / flexbox — never absolute positioning.
- Cards and content areas should be full-width minus horizontal padding.
- Horizontal scroll sections (quick actions, continue cards) should show partial next item to indicate scrollability.
- Bottom navigation: 64px height + safe area padding.
- Top safe area: 44px (iOS) / 24px (Android) — reserve space.

---

## For Code Generation (Pencil.dev / VS Code / Claude Code)

When generating code from these designs:
- Use Untitled UI React components if building in React.
- Use Untitled UI CSS variables for all colors, spacing, radius, shadows.
- Use Inter font family via Untitled UI's typography tokens.
- Use Tailwind CSS utility classes that map to Untitled UI's design tokens.
- Structure: React with Tailwind CSS. Component-per-screen architecture.
- File naming: lowercase-kebab-case (e.g., `home-screen.tsx`, `topic-page.tsx`).
- All spacing values must be multiples of 4px, matching Untitled UI's spacing scale.
- All border radius must use Untitled UI's radius scale.
- Dark mode: use CSS `prefers-color-scheme` or a theme toggle that swaps Untitled UI CSS variables.

---

## Layer & Frame Naming Rules

Every layer and frame must be named using Untitled UI token and component names. No generic names like "Frame 1", "div", "container", "text", "box".

### Screen frames
Name as: `Onboarding/01-Splash`, `Onboarding/02-Welcome`, `App/Home`, `App/MyExams/ExamList`, `App/MyExams/ExamDashboard`, `App/TopicPage`, `App/AITutor`, `App/Profile`

### Component frames
Name after the Untitled UI component: `_Button/Primary`, `_Button/Secondary`, `_Input field`, `_Badge`, `_Badge/Success`, `_Badge/Warning`, `_Badge/Error`, `_Avatar`, `_Tabs`, `_Progress bar`, `_Checkbox`, `_Radio`, `_Toggle`, `_Dropdown`, `_Modal`, `_Toast`, `_Tooltip`, `_Divider`, `Card`, `Icon button`

### Text layers
Name with Untitled UI typography style: `Display xl/Semibold`, `Display sm/Semibold`, `Text xl/Semibold`, `Text lg/Medium`, `Text md/Regular`, `Text sm/Regular`, `Text sm/Medium`, `Text xs/Regular`, `Text xs/Medium`

### Color references in naming
When a layer's purpose is color-specific, include the token: `bg/gray-950`, `bg/gray-800`, `border/gray-700`, `fill/primary-600`, `fill/success-500`

### Container/layout frames
Name by purpose: `Section/Welcome`, `Section/StudyPlan`, `Section/ContinueCards`, `Row/ExamCard`, `Row/ChapterItem`, `Row/TopicItem`, `Row/MCQOption`, `Header/TopBar`, `Nav/BottomBar`

---

## Checklist Before Every Screen Generation

Before generating or reviewing any screen, verify:

- [ ] Every color references an Untitled UI color token (no hex codes)
- [ ] Every text uses Inter font via Untitled UI typography style (no other fonts)
- [ ] Every component maps to an Untitled UI component (no custom builds)
- [ ] Every spacing value is from Untitled UI's spacing scale (multiples of 4)
- [ ] Every radius is from Untitled UI's radius scale
- [ ] Every shadow is from Untitled UI's effects styles
- [ ] Every icon is from Untitled UI's icon set
- [ ] Content is realistic Indian exam prep content (no Lorem Ipsum)
- [ ] Dark mode uses Untitled UI's dark mode variables (no manual dark colors)
- [ ] Layout uses Auto Layout / flexbox (no absolute positioning)