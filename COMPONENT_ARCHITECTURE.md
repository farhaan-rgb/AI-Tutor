# 🏗️ Component Architecture - Learning Path System

## Component Hierarchy

```
App.tsx
├─ ThemeProvider (Material UI)
│  └─ RouterProvider
│     └─ RootLayout
│        ├─ Splash Screen → Auto-navigates to Learning Path
│        │
│        ├─ Learning Path Layout (with bottom nav)
│        │  ├─ Learning Path Screen ⭐
│        │  │  ├─ Top Header (sticky)
│        │  │  │  ├─ Title ("Learning Path")
│        │  │  │  └─ Subject Filter Chips (All, Physics, Chemistry)
│        │  │  │
│        │  │  ├─ Gamification Header
│        │  │  │  ├─ Streak Counter (🔥 icon + number)
│        │  │  │  ├─ Level Display (🏆 icon + level)
│        │  │  │  ├─ Total XP (📈 icon + number)
│        │  │  │  ├─ Daily Goal Progress Bar
│        │  │  │  └─ Level Progress Bar
│        │  │  │
│        │  │  ├─ Path Container (scrollable)
│        │  │  │  ├─ Unit 1
│        │  │  │  │  ├─ Unit Header
│        │  │  │  │  │  ├─ Unit number & title
│        │  │  │  │  │  ├─ Description
│        │  │  │  │  │  └─ Progress (X/Y lessons)
│        │  │  │  │  │
│        │  │  │  │  ├─ Lesson 1 (Completed)
│        │  │  │  │  │  └─ LessonNode
│        │  │  │  │  │     ├─ Circular node (88x88px)
│        │  │  │  │  │     ├─ Checkmark icon
│        │  │  │  │  │     ├─ +XP badge
│        │  │  │  │  │     └─ Label (title + subtitle)
│        │  │  │  │  │
│        │  │  │  │  ├─ PathConnector (solid line)
│        │  │  │  │  │
│        │  │  │  │  ├─ Lesson 2 (In Progress)
│        │  │  │  │  │  └─ LessonNode
│        │  │  │  │  │     ├─ Progress ring (SVG)
│        │  │  │  │  │     ├─ Play icon
│        │  │  │  │  │     └─ Label
│        │  │  │  │  │
│        │  │  │  │  ├─ PathConnector (solid line)
│        │  │  │  │  │
│        │  │  │  │  ├─ Lesson 3 (Available)
│        │  │  │  │  │  └─ LessonNode
│        │  │  │  │  │     ├─ Play icon
│        │  │  │  │  │     └─ Label
│        │  │  │  │  │
│        │  │  │  │  └─ PathConnector (dashed line)
│        │  │  │  │
│        │  │  │  ├─ Unit 2
│        │  │  │  │  ├─ Unit Header
│        │  │  │  │  ├─ Lesson 4 (Available)
│        │  │  │  │  ├─ PathConnector
│        │  │  │  │  ├─ Lesson 5 (Locked)
│        │  │  │  │  │  └─ LessonNode
│        │  │  │  │  │     ├─ Lock icon
│        │  │  │  │  │     └─ Label (grayed out)
│        │  │  │  │  └─ ...
│        │  │  │  │
│        │  │  │  └─ End Message ("More units coming soon!")
│        │  │  │
│        │  │  └─ Floating AI Tutor Button (bottom-right, fixed)
│        │  │
│        │  └─ Learning Path Bottom Nav (fixed bottom)
│        │     ├─ Learn Tab (SchoolIcon)
│        │     ├─ AI Tutor Tab (AutoAwesomeIcon)
│        │     └─ Profile Tab (PersonIcon)
│        │
│        ├─ Lesson Start Screen
│        │  ├─ Top Bar
│        │  │  ├─ Close Button (X)
│        │  │  └─ Progress Bar (if in-progress)
│        │  │
│        │  ├─ Content (centered)
│        │  │  ├─ Lesson Icon (large circular)
│        │  │  ├─ Title + Subtitle
│        │  │  ├─ Stats Row
│        │  │  │  ├─ Time Card (⏱️ X minutes)
│        │  │  │  └─ XP Card (🏆 X XP to earn)
│        │  │  │
│        │  │  └─ Learning Objectives
│        │  │     ├─ Objective 1 (✅ completed)
│        │  │     ├─ Objective 2 (✅ completed)
│        │  │     └─ Objective 3 (⭕ not completed)
│        │  │
│        │  └─ Bottom CTA
│        │     └─ "Start Lesson" / "Continue Lesson" Button
│        │
│        ├─ Practice Screen (your existing)
│        │  └─ [To be redesigned in Duolingo style]
│        │
│        └─ Lesson Complete Screen
│           ├─ Background
│           │  └─ Confetti Particles (30 pieces, animated)
│           │
│           ├─ Content (centered)
│           │  ├─ Trophy Icon (large)
│           │  ├─ "Lesson Complete!" Title
│           │  ├─ Lesson Name
│           │  ├─ Large +XP Number
│           │  ├─ Stats Cards
│           │  │  ├─ Accuracy Card (✅ 80%)
│           │  │  ├─ Questions Card (📈 8/10)
│           │  │  └─ Streak Card (🔥 13 Day Streak!)
│           │  │
│           │  └─ Action Buttons
│           │     ├─ "Continue Learning" (primary)
│           │     └─ "Review Answers" (outlined)
│           │
│           └─ Level Up Banner (if applicable, top)
│              └─ "🎉 Level 9 reached!"
```

---

## Component Data Flow

```
Learning Path Screen
  ↓ (click lesson node)
  passes lessonId
  ↓
Lesson Start Screen
  ↓ (click "Start Lesson")
  passes lesson data
  ↓
Practice Screen
  ↓ (complete all questions)
  passes completion data
  ↓
Lesson Complete Screen
  ↓ (click "Continue Learning")
  navigates back to
  ↓
Learning Path Screen
  (with updated lesson status)
```

---

## State Management

### Current Approach (Mock Data)

```tsx
// In LearningPathScreen
const mockUnits = [ /* hardcoded units */ ];
const userData = { streak: 12, totalXP: 2450, ... };

// In LessonStartScreen
const lessonData = { /* hardcoded lesson info */ };

// In LessonCompleteScreen
const completionData = { /* hardcoded results */ };
```

### Future Approach (Real Data)

```tsx
// Context or State Management (Zustand/Redux)
const { userData, units, updateLessonProgress } = useUserStore();

// API Calls
const { data: units } = useQuery('units', fetchUnits);
const { mutate: completeLesson } = useMutation(completeLessonAPI);

// Local Storage (for offline)
const savedProgress = localStorage.getItem('user-progress');
```

---

## Component Responsibilities

### LearningPathScreen
- **Renders:** Vertical path with all units and lessons
- **Manages:** Subject filter state
- **Handles:** Lesson node click → navigate to preview
- **Props:** None (uses mock data internally)

### LessonNode
- **Renders:** Circular node with icon, label, badges
- **Manages:** Visual state based on status prop
- **Handles:** Click events (if interactive)
- **Props:** 
  - `title`, `subtitle`, `status`, `progress`, `subjectColor`, `xp`, `onClick`, `delay`

### PathConnector
- **Renders:** Vertical line between nodes
- **Manages:** Solid/dashed style based on lesson status
- **Handles:** Animation timing
- **Props:** 
  - `color`, `height`, `dashed`, `delay`

### UnitHeader
- **Renders:** Unit title, description, progress
- **Manages:** None (pure presentation)
- **Handles:** None
- **Props:** 
  - `unitNumber`, `title`, `description`, `subjectColor`, `completedLessons`, `totalLessons`, `delay`

### GamificationHeader
- **Renders:** Streak, XP, level, progress bars
- **Manages:** None (receives data as props)
- **Handles:** Pulsing fire animation
- **Props:** 
  - `streak`, `totalXP`, `dailyGoalCurrent`, `dailyGoalTarget`, `level`, `xpToNextLevel`, `userLevelXP`

### LearningPathBottomNav
- **Renders:** 3-tab navigation bar
- **Manages:** Active tab based on route
- **Handles:** Navigation between main sections
- **Props:** None (uses `useLocation` + `useNavigate`)

### LessonStartScreen
- **Renders:** Preview modal with lesson details
- **Manages:** Loading state when starting
- **Handles:** Start/Continue button click → navigate to practice
- **Props:** None (uses mock data, should receive lessonId in future)

### LessonCompleteScreen
- **Renders:** Celebration with confetti, stats, buttons
- **Manages:** Timed reveal of stats and buttons
- **Handles:** 
  - "Continue Learning" → navigate to learning path
  - "Review Answers" → navigate to solution
- **Props:** None (uses mock data, should receive completionData in future)

---

## CSS Variable Usage

Every component follows this pattern:

```tsx
<Box
  sx={{
    backgroundColor: 'var(--card)',      // Always use CSS variables
    color: 'var(--foreground)',          // Never hardcode colors
    fontFamily: 'var(--font-family-inter)', // Only Inter font
    fontSize: 'var(--text-base)',        // Use type scale
    fontWeight: 'var(--font-weight-semibold)', // Use weight scale
    borderRadius: 'var(--radius-card)',  // Use radius scale
    padding: 2,                          // MUI spacing (2 = 16px)
  }}
>
```

---

## Animation Patterns

### Staggered Entry
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }} // Stagger by index
>
```

### Spring Animation
```tsx
<motion.div
  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
>
```

### Hover/Tap Feedback
```tsx
<motion.div
  whileHover={{ scale: 1.05, y: -4 }}
  whileTap={{ scale: 0.95 }}
>
```

### Progress Ring
```tsx
<motion.circle
  strokeDasharray={2 * Math.PI * radius}
  strokeDashoffset={2 * Math.PI * radius * (1 - progress / 100)}
  transition={{ duration: 0.8, ease: 'easeOut' }}
/>
```

### Confetti
```tsx
<motion.div
  initial={{ y: -20, x: 0, opacity: 1 }}
  animate={{ y: window.innerHeight + 20, x: randomX, opacity: 0 }}
  transition={{ duration: randomDuration, delay: index * 0.05 }}
/>
```

---

## Material UI Integration

All components use Material UI styled with CSS variables:

```tsx
// Box - Container
<Box sx={{ backgroundColor: 'var(--card)' }}>

// Typography - Text
<Typography sx={{ 
  fontFamily: 'var(--font-family-inter)',
  fontSize: 'var(--text-xl)',
  color: 'var(--foreground)'
}}>

// Button - CTA
<Button sx={{
  backgroundColor: 'var(--primary)',
  color: 'var(--white)',
  fontFamily: 'var(--font-family-inter)',
}}>

// LinearProgress - Progress bars
<LinearProgress sx={{
  '& .MuiLinearProgress-bar': {
    backgroundColor: 'var(--physics)'
  }
}}>

// Chip - Tags
<Chip sx={{
  backgroundColor: 'var(--physics-alpha-15)',
  color: 'var(--physics)'
}}>

// Fab - Floating button
<Fab sx={{
  backgroundColor: 'var(--primary)',
  boxShadow: 'var(--glow-primary-strong)'
}}>
```

---

## File Organization

```
/src/app/components/learning-path/
├── learning-path-screen.tsx        (Main path, 390 lines)
├── lesson-node.tsx                 (Node component, 257 lines)
├── path-connector.tsx              (Connector line, ~60 lines)
├── unit-header.tsx                 (Unit header, ~120 lines)
├── gamification-header.tsx         (Streak/XP/Level, 287 lines)
├── bottom-nav.tsx                  (3-tab nav, 157 lines)
├── learning-path-layout.tsx        (Wrapper, 23 lines)
├── lesson-start-screen.tsx         (Preview modal, 525 lines)
└── lesson-complete-screen.tsx      (Celebration, 521 lines)

Total: ~2,340 lines of code
```

---

## Testing Strategy

### Manual Testing Checklist

- [ ] All lesson node states display correctly
- [ ] Click available/in-progress nodes → navigates to preview
- [ ] Click locked nodes → no action
- [ ] Start lesson → navigates to practice
- [ ] Complete lesson → shows celebration
- [ ] Confetti animates smoothly
- [ ] Bottom nav switches tabs correctly
- [ ] Subject filters work (if implemented)
- [ ] Floating AI button navigates to chat
- [ ] All animations run at 60fps
- [ ] Responsive on mobile (360px+)
- [ ] Dark mode looks correct

### Future Unit Testing

```tsx
// Example test structure
describe('LessonNode', () => {
  it('renders locked state correctly', () => {
    render(<LessonNode status="locked" />);
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });
  
  it('shows progress ring for in-progress lessons', () => {
    render(<LessonNode status="in-progress" progress={60} />);
    expect(screen.getByTestId('progress-ring')).toHaveAttribute('stroke-dashoffset', ...);
  });
});
```

---

## Performance Considerations

### Optimizations Applied

1. **Staggered Animations:** Delays prevent all nodes animating at once
2. **Motion Optimization:** Uses `will-change` and GPU-accelerated properties
3. **Lazy Loading:** Future: Load only visible units
4. **Memoization:** Future: Wrap expensive components in `React.memo()`

### Future Optimizations

```tsx
// Virtualize long lists
import { Virtuoso } from 'react-virtuoso';

// Lazy load units
const UnitComponent = React.lazy(() => import('./unit'));

// Memoize lesson nodes
const LessonNode = React.memo(LessonNodeComponent);

// Debounce filter input
const debouncedFilter = useDebouncedValue(filterText, 300);
```

---

**This architecture is designed to scale from prototype to production!** 🏗️
