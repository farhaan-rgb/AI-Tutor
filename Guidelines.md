# Guidelines — Test Prep App (Duolingo/Wondering Style)

## Critical Design System Rule

This project uses **custom CSS variables** defined in `/src/styles/global.css` and `/src/styles/theme.css` as the design system foundation.

### What this means — read carefully:

1. **Colors**: Every color must come from the CSS variables defined in `/src/styles/global.css` and `/src/styles/theme.css`. 
   - **NEVER use raw hex codes** (e.g., `#1DA1F2`, `#FF0000`)
   - **NEVER use hardcoded RGB/RGBA values** (e.g., `rgba(29, 155, 240, 0.25)`, `rgb(255, 255, 255)`)
   - **ALWAYS use CSS variables** for ALL colors including alpha/opacity variants
   - Reference color names exactly as defined: `var(--primary)`, `var(--foreground)`, `var(--success-500)`, `var(--error-500)`
   - For semi-transparent colors, use alpha variants: `var(--primary-alpha-8)`, `var(--primary-alpha-20)`, `var(--overlay-bg)`, `var(--white-alpha-90)`
   - The design system uses CSS custom properties for automatic light/dark mode switching
   - **This rule is CRITICAL**: Hardcoded colors break light/dark mode theming

2. **Typography**: Every text element must use the font families and sizes defined in `/src/styles/global.css`. The font is **Inter**. Use CSS variable typography tokens:
   - Font sizes: `var(--text-xs)` through `var(--text-3xl)`
   - Font weights: `var(--font-weight-normal)`, `var(--font-weight-medium)`, `var(--font-weight-semibold)`, `var(--font-weight-bold)`
   - Font family: `var(--font-family-inter)`
   
   Never use a different font or arbitrary font sizes. All typography must reference the CSS variables.

3. **Spacing**: Use the spacing values defined in CSS variables. The design system follows a strict 4px spacing system:
   - **Screen-level left/right padding**: ALWAYS 16px (never 20px or any other value)
   - **Spacing between elements**: Only use 0, 2, 4, or multiples of 4 (8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, etc.)
   - **Never use**: 13px, 19px, 37px, or any non-4px-multiple values
   - **All sizes must be whole numbers**: No decimals like 2.5px, 1.5rem, etc. Always use whole numbers.
   - **Component padding/margin**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

4. **Border Radius**: Use CSS variables for border radius:
   - `var(--radius-2)`: 2px
   - `var(--radius-xs)`: 4px
   - `var(--radius)` or `var(--radius-md)`: 8px
   - `var(--radius-card)` or `var(--radius-lg)`: 12px
   - `var(--radius-button)`: 16px
   - `var(--radius-xl)`: 16px
   - `var(--radius-full)`: 999px
   - `var(--radius-circle)`: 50%
   
   Never hardcode radius values.

5. **Shadows / Elevation**: Use CSS variables for shadows:
   - `var(--elevation-xs)`, `var(--elevation-sm)`, `var(--elevation-md)`, `var(--elevation-lg)`, `var(--elevation-xl)`
   - `var(--glow-primary)`: Primary color glow effect
   - Never create custom box-shadows outside these tokens.

6. **Icons**: Use icons from `lucide-react` package. Import named icons like:
   ```tsx
   import { Home, BookOpen, Sparkles, User, CheckCircle2, ArrowLeft } from 'lucide-react';
   ```

7. **Dark Mode**: Use the CSS variables which automatically handle light/dark mode switching. Never manually define dark mode colors. The system handles theme switching automatically.

**If you are unsure whether a style exists — check `/src/styles/global.css` and `/src/styles/theme.css` first. If it exists, use it. If it does not exist, compose from what does exist. Never invent styles outside the system.**

---

## Project Context

### What is this app?
A desktop-first test preparation app for students in India preparing for competitive exams, built with a **Duolingo/Wondering-style** game-like, engaging UX with a flattened vertical learning path.

### Supported exams
JEE Main, JEE Advanced, NEET, UPSC, CAT, GATE, SSC CGL, Banking (IBPS), CLAT, CBSE Boards, State PSCs, and more. Students can prepare for multiple exams simultaneously.

### Target users
Students aged 15–28 across India. Many study late at night. Stressed, overwhelmed by syllabus, need structure and motivation.

### Design philosophy
- **Engaging and playful** like Duolingo/Wondering — not corporate or boring
- **Game-like interactions**: animations, celebrations, immediate feedback, progress visualization
- **Microinteractions everywhere**: button presses, answer reveals, XP earning, level ups
- **Professional but fun**: motivating without being childish
- Dark mode is the default theme (students study at night). Light mode also supported.
- **Desktop-first**: 1280×800px viewport primary target

---

## Navigation Structure

### Desktop (1280×800px primary)
- **Vertical learning path** as the main experience
- **Tab navigation** at top with 4 main sections:
  - **Learn** (first tab, main path view)
  - **Practice**
  - **Profile**
  - **Settings**
- Content area fills available space
- Onboarding and full-screen experiences do NOT show navigation

### Layout Components
- Use `AppLayout` for standard app screens (includes navigation)
- Use `FullScreenLayout` for immersive screens (onboarding, tests, practice sessions)

---

## Onboarding Flow

### Streamlined Flow (12 screens total)

**Sequence:**
1. **Splash Screen** - App branding with animation
2. **Welcome Screen** - "Welcome to [App Name]" + Get Started
3. **Signup Screen** - Phone number input
4. **OTP Screen** - Verification code
5. **Name Entry Screen** - Personalization
6. **Exam Selection Screen** - Multi-select exam cards (Step 1 of 3)
7. **Transition Screen** - "Finding the perfect exams..." with sparkle animations (4.5-5s)
8. **Preparation Level Screen** - Beginner/Intermediate/Advanced (Step 2 of 3)
9. **Transition Screen** - "Analyzing your preparation level..." (4.5-5s)
10. **Study Hours Screen** - 1-2 hours / 3-4 hours / 5+ hours (Step 3 of 3)
11. **Transition Screen** - "Customizing your study plan..." (4.5-5s)
12. **Building Plan Screen** - "Building your personalized plan" with progress bar (7s)
13. **Plan Ready Screen** - "Your plan is ready!" celebration

### Onboarding Design Patterns

**Common Elements:**
- Full-screen layout using `FullScreenLayout`
- No navigation bars
- Consistent horizontal padding: 16px
- OnboardingTopBar component at top (app branding)
- All spacing in 4px multiples

**Selection Screens (Steps 1-3):**
- Back button (top-left, 40px circle)
- Step indicator ("Step X of 3")
- Animated progress bar (height: 4px)
- Title + subtitle
- Selection cards with:
  - Gradient backgrounds when selected
  - White checkmark on primary background (visible against gradient)
  - Emoji icons in circles
  - Hover animations (scale 1.02, translate)
  - Spring animations on selection
- Continue button (bottom, fixed, disabled when nothing selected)

**Transition Screens:**
- Sparkle particle animations (floating upward)
- Gradient orb backgrounds (animated)
- Main heading + subtitle
- Collected data cards with:
  - Subtle gradient background: `linear-gradient(135deg, var(--card) 0%, var(--muted) 100%)`
  - Soft shadow: `0 4px 12px rgba(0, 0, 0, 0.08)`
  - Rounded corners: `var(--radius-card)`
  - Checkmark icon in primary color
  - Non-interactive styling (no blue border, no hover states)
- Progress bar at bottom (animated)
- Duration: 4.5-5 seconds (transition screens), 7 seconds (building plan)
- Auto-navigation to next step

**Color & Style:**
- Use `var(--gradient-primary-btn)` for selected states
- Use `var(--glow-primary)` for glows and shadows
- Cards use gradient backgrounds, not solid colors
- All animations use Motion (Framer Motion) with spring physics

---

## UX Pattern: Flattened Vertical Learning Path

### Core Hierarchy (Simplified)

**Old nested navigation (removed):**
```
My Exams → Exam List → Exam Dashboard → Subject → Chapter → Topic
```

**New flattened path:**
```
Learn Tab → Vertical Learning Path (all topics as interactive nodes)
```

### Learning Path Screen Design

**Concept:**
- Single **vertical scrollable canvas** (like a game map)
- Visual **lesson nodes** representing topics
- **Color-coded sections** by subject (Physics = blue, Chemistry = green, Math = orange, Biology = purple)
- **Chapter headers** as milestone markers
- **Visual connectors** between nodes showing progression
- **Node states**:
  - 🔒 **Locked** (gray, disabled): Future topics not yet unlocked
  - ⭐ **Available** (colored, glowing): Ready to start, pulsing animation
  - 🔄 **In Progress** (colored, partially filled): Started but not completed
  - ✅ **Completed** (colored with checkmark): Finished with full progress ring

**Layout Structure:**
```
┌─────────────────────────────────┐
│   Header (Exam, Streak, Profile) │
├─────────────────────────────────┤
│                                 │
│        Future Progress          │ ← Top (aspirational)
│             │                   │
│         ┌───▼───┐              │
│         │ 🔒    │  Locked      │
│         └───┬───┘              │
│         ┌───▼───┐              │
│         │ ⭐    │  Available   │ ← Glowing/pulsing
│         └───┬───┘              │
│         ┌───▼───┐              │
│         │ ✅    │  Completed   │ ← With progress ring
│         └───┴───┘              │
│                                 │
│    ═══ Chapter 2 Header ═══    │ ← Milestone
│         ┌───────┐              │
│         │ Topic │              │
│         └───┬───┘              │
│             │                   │
│    ═══ Chapter 1 Header ═══    │
│         ┌───────┐              │
│         │ Topic │ ← Start here │
│         └───────┘              │
└─────────────────────────────────┘
```

---

## Animation System (Using Motion / Framer Motion)

All animations use the `motion` package (already installed). Import with:
```tsx
import { motion } from 'motion/react';
```

### Key Animations

1. **Page Transitions**
   - Fade in with slide up: `initial={{ opacity: 0, y: 20 }}`
   - Stagger children animations with delay increments

2. **Selection States**
   - Scale on hover: `whileHover={{ scale: 1.02 }}`
   - Scale on tap: `whileTap={{ scale: 0.98 }}`
   - Spring animations for checkmark reveal

3. **Progress Bars**
   - Animate width changes with smooth transitions
   - Use `transition={{ duration: 0.5 }}` or spring physics

4. **Sparkle Animations**
   - Floating particles moving upward
   - Fade in/out with scale changes
   - Random positions and delays for natural effect

5. **Gradient Orbs**
   - Slow animated blur and movement
   - Subtle scale pulsing
   - Multiple layers for depth

6. **Button Interactions**
   - All buttons have `whileHover` and `whileTap` states
   - Disabled states have no animations

---

## Subject Color Mapping

Each subject uses a specific color from CSS variables:

| Subject | CSS Variable | Usage |
|---|---|---|
| Physics | `var(--physics)` (blue) | Node borders, progress bars, tags |
| Chemistry | `var(--chemistry)` (green) | Node borders, progress bars, tags |
| Mathematics | `var(--mathematics)` (orange) | Node borders, progress bars, tags |
| Biology | `var(--biology)` (purple) | Node borders, progress bars, tags |
| General / Default | `var(--primary)` | Default when no subject context |

**Alpha variants** (for subtle backgrounds):
- `var(--physics-alpha-12)`, `var(--chemistry-alpha-15)`, etc.

These accent colors appear as:
- **Border accents** on cards (3-4px)
- **Progress bar fills**
- **Badge backgrounds** (with alpha variants)
- **Node glows** on learning path

---

## Component Patterns

### Cards
- Background: `var(--card)` or gradient backgrounds
- Border radius: `var(--radius-card)`
- Shadow: `var(--elevation-sm)` or custom soft shadows
- Padding: 16px or 20px
- Border: Optional, `1px solid var(--border)`

### Buttons
- Primary: `background: var(--gradient-primary-btn)`, `boxShadow: var(--glow-primary)`
- Secondary: `background: var(--card)`, `border: 1px solid var(--border)`
- Disabled: `background: var(--muted)`, `color: var(--muted-foreground)`, no cursor
- Border radius: `var(--radius-button)`
- Height: 44px (small), 48px (medium), 56px (large)
- Font: `var(--font-family-inter)`, `var(--font-weight-semibold)`

### Inputs
- Background: `var(--input-background)` or `var(--card)`
- Border: `1px solid var(--border)`
- Border radius: `var(--radius)`
- Focus state: Border changes to `var(--primary)`
- Padding: 12px

### Progress Bars
- Container: `background: var(--muted)`, `height: 4px`, `border-radius: 2px`
- Fill: `background: var(--gradient-primary-btn)` or subject color
- Animate width changes smoothly

---

## Content Rules

- **Never use Lorem Ipsum**. Always use realistic Indian exam prep content.
- **Student name**: "Rahul", "Priya", "Arjun" (default: "Rahul")
- **Example subjects**: Physics, Chemistry, Mathematics, Biology
- **Example chapters**: 
  - Physics: Kinematics, Newton's Laws, Thermodynamics, Electromagnetic Induction
  - Chemistry: Periodic Table, Organic Chemistry, Chemical Bonding, Thermochemistry
  - Mathematics: Calculus, Algebra, Trigonometry, Coordinate Geometry
  - Biology: Cell Biology, Genetics, Ecology, Human Physiology
- **Example topics**: 
  - Faraday's Law, Projectile Motion, Ideal Gas Equation
  - SN1 vs SN2 Reactions, Oxidation Numbers
  - Limits and Continuity, Integration by Parts
- **Example exams**: JEE Main 2027, NEET 2027, UPSC CSE 2028
- **Example scores**: 178/300, 142/200, 65%, 450/720
- **Exam countdown**: "142 days left", "89 days left", "3 months to go"
- **PYQ data**: "Asked 12 times in last 15 years", "High weightage topic"

---

## Tone & Visual Rules

### Gamification (Duolingo-style)
- **Animations are essential**: Every interaction should feel delightful
- **Immediate positive reinforcement**: Correct answers get micro-celebrations
- **Progress visualization**: Show advancement clearly
- **Achievements**: Badges that feel rewarding with unlock animations

### Visual Language
- **Playful but polished**: Like Duolingo, not childish
- **Bright accent colors** on dark background (dark mode default)
- **Generous whitespace**: Don't cram the interface
- **Clear visual hierarchy**: Important actions are obvious
- **Smooth transitions**: Everything animates, nothing just "appears"

### Feedback Patterns
- **Success**: Green highlights, checkmark icons, celebration animations
- **Error**: Red highlights, X icons, gentle shake animations
- **Loading**: Skeleton loaders, animated dots, shimmer effects
- **Empty states**: Encouraging, actionable messages

---

## Code Generation Standards

### CSS Variable Usage
```tsx
// ✅ CORRECT: Use CSS variables
<div style={{ 
  color: 'var(--foreground)', 
  backgroundColor: 'var(--card)',
  borderRadius: 'var(--radius-card)',
  padding: 16,
  boxShadow: 'var(--elevation-md)'
}}>

// ❌ WRONG: Never hardcode colors
<div style={{ 
  color: '#F9FAFB', 
  backgroundColor: '#101828',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}}>
```

### Typography with CSS Variables
```tsx
// ✅ CORRECT
<h1 style={{ 
  fontFamily: 'var(--font-family-inter)',
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--foreground)'
}}>

// ❌ WRONG
<h1 style={{ 
  fontFamily: 'Inter, sans-serif',
  fontSize: '20px',
  fontWeight: 600,
  color: '#F9FAFB'
}}>
```

### Animation with Motion
```tsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {/* content */}
</motion.div>

// Hover and tap states
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Click me
</motion.button>
```

### Spacing Rules
```tsx
// ✅ CORRECT: Multiples of 4
<div style={{ padding: 16, gap: 12, marginBottom: 24 }}>

// ❌ WRONG: Non-4px multiples
<div style={{ padding: 15, gap: 13, marginBottom: 25 }}>
```

### Icon Usage
```tsx
// ✅ CORRECT: Lucide React
import { Home, CheckCircle2, ArrowLeft } from 'lucide-react';

<Home style={{ width: 20, height: 20, color: 'var(--foreground)' }} />

// ❌ WRONG: Other icon libraries
import HomeIcon from '@mui/icons-material/Home';
```

---

## File Structure

### Component Organization
- `/src/app/components/` - All React components
- `/src/app/components/onboarding/` - Onboarding flow components
- `/src/app/components/layouts/` - Layout components (AppLayout, FullScreenLayout)
- `/src/app/routes.tsx` - React Router configuration
- `/src/app/App.tsx` - Main app component with RouterProvider

### Naming Conventions
- Component files: `kebab-case.tsx` (e.g., `splash-screen.tsx`, `exam-selection-screen.tsx`)
- Use named exports: `export function Component() { ... }`
- React Router expects `Component` export for route components

---

## React Router Data Mode

The app uses React Router's Data mode pattern:

```tsx
// src/app/App.tsx
import { RouterProvider } from 'react-router';
import { router } from './routes';

function App() {
  return <RouterProvider router={router} />;
}
```

```tsx
// src/app/routes.tsx
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./components/onboarding/splash-screen"),
  },
  {
    path: "/welcome",
    lazy: () => import("./components/onboarding/welcome-screen"),
  },
  // ... more routes
]);
```

---

## Responsive Behavior

### Desktop (1280×800px primary target)
- Content centered with max-width constraints where appropriate
- Hover states on all interactive elements
- Smooth transitions and animations

### Future Mobile Support
- Would use bottom navigation
- Would use bottom sheets for modals
- Would have single column layouts
- Currently not the primary focus

---

## Session Storage Usage

Onboarding uses sessionStorage to maintain state:

```tsx
// Store data
sessionStorage.setItem('onboarding-exams', JSON.stringify(selectedExams));
sessionStorage.setItem('onboarding-preparation-level', preparationLevel);
sessionStorage.setItem('onboarding-study-hours', studyHours);

// Retrieve data
const exams = JSON.parse(sessionStorage.getItem('onboarding-exams') || '[]');
```

Used for:
- Selected exams
- Preparation level
- Study hours
- Current step tracking for transitions

---

## Checklist Before Every Component

Before generating any component, verify:

- [ ] Every color uses CSS variables from `/src/styles/global.css` and `/src/styles/theme.css`
- [ ] Every font uses `var(--font-family-inter)` and size variables
- [ ] Every spacing is a multiple of 4px
- [ ] Every border radius uses CSS variables
- [ ] Every shadow uses CSS variables
- [ ] Icons are from `lucide-react`
- [ ] Content is realistic Indian exam prep content
- [ ] Animations use Motion (Framer Motion)
- [ ] Layout uses flexbox/grid (no absolute positioning unless necessary)
- [ ] Component uses named export `export function Component()`

---

## Critical Reminders

1. **Horizontal padding is ALWAYS 16px** at the screen level
2. **All spacing must be multiples of 4**
3. **All sizes must be whole numbers** (no decimals)
4. **Selected states use gradient backgrounds** with visible checkmarks
5. **Transition screens auto-navigate** after their duration
6. **All interactive elements have hover and tap animations**
7. **CSS variables for everything** - no hardcoded values
8. **Onboarding is complete** - follow the established patterns for new screens

---

## Mock Tests & Assessment System

### Overview

The Mock Tests feature is designed to simulate real exam conditions for comprehensive test preparation. It focuses on three core categories:

1. **Full Length Mock Tests** - Complete exam simulations
2. **Previous Year Papers (PYPs)** - Actual exam papers from past years
3. **Custom Tests** - User-generated tests from selected topics

### Navigation Structure

```
Bottom Nav → Tests Tab → Mock Tests Screen
├── Tab 1: Mock Tests (Full length simulations)
├── Tab 2: Previous Years (Historical exam papers)
└── Tab 3: Custom Tests (User-generated)
    └── "Create Custom Test" button → Custom Test Builder
```

### Mock Tests Screen (`/mock-tests`)

**Key Components:**
- Glass header with test icon and title
- Three-tab interface (Mock Tests | Previous Years | Custom Tests)
- Test cards showing:
  - Test name and subtitle
  - Duration, questions count, total marks
  - Attempt status (Attempted/Not Attempted badge)
  - For attempted: Score, Rank, Percentile in accent-colored stats card
  - For not attempted: Students attempted count
- All cards use `whileTap={{ scale: 0.98 }}` interaction

**Visual Design:**
- 16px left/right padding (strict adherence)
- 12px border radius for cards
- Test stats use icon + text pairs in 3-column grid
- Green checkmark badge for attempted tests
- Accent background for result cards

### Custom Test Builder (`/custom-test-builder`)

**Multi-step Flow:**

**Step 1: Select Subjects**
- Grid of subject cards with color accents
- Subjects: Physics (blue), Chemistry (green), Mathematics (orange), Biology (purple)
- Selected state: 2px colored border + checkmark icon
- Shows chapter count per subject

**Step 2: Select Chapters**
- Grouped by selected subjects
- Chapter cards show topic count
- Section headers with colored dot indicators
- Border changes on selection

**Step 3: Select Topics**
- Grouped by selected chapters
- Shows available question count per topic
- Colored borders matching parent subject

**Step 4: Configure Test**
- **Questions per topic**: 5, 10, 15, 20 (selectable buttons)
- **Test duration**: 30, 45, 60, 90, 120 minutes (selectable buttons)
- **Test summary card**: Shows calculated total questions, duration, marks
- Primary button: "Generate Test"

**Progress Indicator:**
- 4px height progress bar at top
- Animates from 25% → 50% → 75% → 100% through steps
- Uses `var(--primary)` fill color

### Test Details Screen (`/test-details`)

Shows before test starts:
- Test name and description
- Total questions, duration, marking scheme
- Instructions panel
- Previous attempt history (if any)
- "Start Test" primary button (full width, bottom)

### Test Interface Screen (`/test-interface`)

**Full-screen immersive test experience:**

**Header:**
- Timer (top center, large display)
- Question palette button (grid icon, top right)
- Exit/Quit button (X icon, top left with confirmation modal)

**Question Area:**
- Question number badge (e.g., "Question 12 of 90")
- Subject indicator (colored)
- Question text (large, readable)
- MCQ options as selectable cards:
  - Default: `var(--card)` background, `var(--border)` border
  - Selected: `var(--primary)` border, accent background
  - Post-submit correct: Green background
  - Post-submit incorrect: Red background
- Solution expandable section (post-answer)

**Navigation:**
- Previous/Next buttons (bottom)
- "Mark for Review" button
- Question palette (modal overlay):
  - Grid of numbered buttons
  - Color coding:
    - **Answered**: Green fill
    - **Not Answered**: Red fill
    - **Marked for Review**: Yellow/orange fill
    - **Not Visited**: Gray fill
  - Legend at top of palette
  - Summary counts (answered/marked/unanswered)

**Features:**
- Auto-save on every answer selection
- Countdown timer with auto-submit when time expires
- Warning modal before quitting
- Confirmation modal before submit
- Keyboard shortcuts (optional):
  - Arrow keys for navigation
  - 1-4 for option selection
  - M for mark review

### Test Results Screen (`/test-results`)

**Results Summary:**
- Large score display (e.g., "178/300")
- Percentage and grade
- Percentile (if applicable)
- Rank among test takers (if applicable)
- Time taken

**Subject-wise Analysis:**
- Breakdown by Physics/Chemistry/Mathematics
- Correct/Incorrect/Unanswered per subject
- Accuracy percentage
- Subject color accents

**Question-wise Review:**
- List of all questions with status icons
- Correct/Incorrect/Skipped indicators
- Click to view question + solution
- Filter by: All | Correct | Incorrect | Skipped

**Actions:**
- "Review Solutions" button
- "Retake Test" button
- "Back to Tests" button
- Share results (optional)

**Analytics Cards:**
- Strengths: Topics with high accuracy (green cards)
- Weaknesses: Topics needing improvement (red cards)
- Time management: Average time per question
- Comparison: Your score vs average

### Visual Language for Tests

**Color Coding:**
- **Success/Correct**: `var(--success)` or `#22C55E` (green)
- **Error/Incorrect**: `var(--destructive)` or `#EF4444` (red)
- **Warning/Review**: `var(--warning)` or `#F97316` (orange)
- **Neutral/Not Visited**: `var(--muted-foreground)` (gray)

**Spacing:**
- Test cards: 16px padding
- Option cards: 12px-14px padding
- Section gaps: 20px-24px
- Card margins: 12px between items

**Typography:**
- Test names: 15px semibold
- Question text: 14px-15px regular (readable)
- Stats/metadata: 12px medium
- Helper text: 11px regular

**Interactions:**
- All clickable items: `whileTap={{ scale: 0.98 }}`
- Option selection: Smooth border color transition
- Timer: Red pulsing when < 5 minutes
- Submit button: Requires confirmation modal

### Mock Data Examples

**Full Mock Test:**
```tsx
{
  id: "fmt1",
  name: "JEE Main Mock Test #1",
  subtitle: "Full Syllabus",
  questions: 90,
  duration: 180, // minutes
  marks: 300,
  attempted: false,
  studentsAttempted: 12403,
  avgScore: 156,
}
```

**Previous Year Paper:**
```tsx
{
  id: "pyp1",
  name: "JEE Main 2024",
  subtitle: "Jan 27 - Shift 1",
  questions: 90,
  duration: 180,
  marks: 300,
  attempted: true,
  score: 178,
  accuracy: 74,
  year: 2024,
}
```

**Custom Test:**
```tsx
{
  id: "ct1",
  name: "Physics + Chemistry Practice",
  subtitle: "Laws of Motion, Thermodynamics",
  questions: 45,
  duration: 60,
  marks: 180,
  createdDate: "2 days ago",
  attempted: false,
}
```

### Routing Structure

```tsx
// Main tests screen with tab navigation
{ path: "mock-tests", Component: MockTestsScreen }

// Custom test builder (multi-step)
{ path: "custom-test-builder", Component: CustomTestBuilder }

// Test lifecycle (FullScreenLayout)
{ path: "test-details", Component: TestDetailsScreen }
{ path: "test-interface", Component: TestInterfaceScreen }
{ path: "test-results", Component: TestResultsScreen }
```

---

## File Structure

### Component Organization
- `/src/app/components/` - All React components
- `/src/app/components/onboarding/` - Onboarding flow components
- `/src/app/components/layouts/` - Layout components (AppLayout, FullScreenLayout)
- `/src/app/routes.tsx` - React Router configuration
- `/src/app/App.tsx` - Main app component with RouterProvider

### Naming Conventions
- Component files: `kebab-case.tsx` (e.g., `splash-screen.tsx`, `exam-selection-screen.tsx`)
- Use named exports: `export function Component() { ... }`
- React Router expects `Component` export for route components

---

## React Router Data Mode

The app uses React Router's Data mode pattern:

```tsx
// src/app/App.tsx
import { RouterProvider } from 'react-router';
import { router } from './routes';

function App() {
  return <RouterProvider router={router} />;
}
```

```tsx
// src/app/routes.tsx
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./components/onboarding/splash-screen"),
  },
  {
    path: "/welcome",
    lazy: () => import("./components/onboarding/welcome-screen"),
  },
  // ... more routes
]);
```

---

## Responsive Behavior

### Desktop (1280×800px primary target)
- Content centered with max-width constraints where appropriate
- Hover states on all interactive elements
- Smooth transitions and animations

### Future Mobile Support
- Would use bottom navigation
- Would use bottom sheets for modals
- Would have single column layouts
- Currently not the primary focus

---

## Session Storage Usage

Onboarding uses sessionStorage to maintain state:

```tsx
// Store data
sessionStorage.setItem('onboarding-exams', JSON.stringify(selectedExams));
sessionStorage.setItem('onboarding-preparation-level', preparationLevel);
sessionStorage.setItem('onboarding-study-hours', studyHours);

// Retrieve data
const exams = JSON.parse(sessionStorage.getItem('onboarding-exams') || '[]');
```

Used for:
- Selected exams
- Preparation level
- Study hours
- Current step tracking for transitions

---

## Checklist Before Every Component

Before generating any component, verify:

- [ ] Every color uses CSS variables from `/src/styles/global.css` and `/src/styles/theme.css`
- [ ] Every font uses `var(--font-family-inter)` and size variables
- [ ] Every spacing is a multiple of 4px
- [ ] Every border radius uses CSS variables
- [ ] Every shadow uses CSS variables
- [ ] Icons are from `lucide-react`
- [ ] Content is realistic Indian exam prep content
- [ ] Animations use Motion (Framer Motion)
- [ ] Layout uses flexbox/grid (no absolute positioning unless necessary)
- [ ] Component uses named export `export function Component()`

---

## Critical Reminders

1. **Horizontal padding is ALWAYS 16px** at the screen level
2. **All spacing must be multiples of 4**
3. **All sizes must be whole numbers** (no decimals)
4. **Selected states use gradient backgrounds** with visible checkmarks
5. **Transition screens auto-navigate** after their duration
6. **All interactive elements have hover and tap animations**
7. **CSS variables for everything** - no hardcoded values
8. **Onboarding is complete** - follow the established patterns for new screens