# 🚀 Quick Start Guide - Duolingo-Style Test Prep App

## ▶️ Run the App

```bash
npm run dev
# or
pnpm dev
```

Visit: `http://localhost:5173`

---

## 📍 Key Routes

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Splash | Auto-navigates to learning path after 2.5s |
| `/learning-path` | Learning Path | Main vertical path with lesson nodes |
| `/lesson-start` | Lesson Preview | Shows objectives, time, XP before starting |
| `/practice` | Practice | Question/answer screen (your existing) |
| `/lesson-complete` | Celebration | Confetti, stats, +XP display |
| `/ai-tutor` | AI Tutor | Chat with AI (your existing) |
| `/profile` | Profile | User stats, achievements (your existing) |
| `/material-examples` | Material UI Demo | Component showcase |

---

## 🎨 Styling System

**Everything uses CSS variables from `/src/styles/theme.css`**

### Quick Color Reference

```css
var(--primary)          /* Purple brand color */
var(--physics)          /* Blue subject color */
var(--chemistry)        /* Green subject color */
var(--mathematics)      /* Orange subject color */
var(--biology)          /* Purple subject color */
var(--success)          /* Green (checkmarks, success) */
var(--warning)          /* Orange (XP, streaks) */
var(--foreground)       /* White text */
var(--muted-foreground) /* Gray text */
var(--card)             /* Card backgrounds */
var(--border)           /* Border color */
```

### Quick Typography Reference

```css
var(--font-family-inter)    /* Inter font (ONLY font) */
var(--text-3xl)             /* 48px - Large titles */
var(--text-2xl)             /* 30px - Section titles */
var(--text-xl)              /* 20px - Headings */
var(--text-base)            /* 16px - Body text */
var(--text-sm)              /* 14px - Small text */
var(--text-xs)              /* 12px - Captions */
var(--font-weight-bold)     /* 700 */
var(--font-weight-semibold) /* 600 */
```

---

## 🎮 User Flow

```
Splash Screen (2.5s)
    ↓
Learning Path
    ↓ (click lesson node)
Lesson Start Screen
    ↓ (click "Start Lesson")
Practice/Questions
    ↓ (complete all questions)
Lesson Complete Screen
    ↓ (click "Continue Learning")
Learning Path (with updated progress)
```

---

## 🎯 Lesson Node States

| State | Icon | Color | Behavior |
|-------|------|-------|----------|
| 🔒 Locked | Lock | Gray | Not clickable, no access |
| ▶️ Available | Play | Subject color | Clickable, ready to start |
| 🔄 In Progress | Play + Ring | Subject color | Clickable, shows progress % |
| ✅ Completed | Checkmark | Subject color | Clickable, shows +XP badge |

---

## 💡 Quick Tips

### Change Primary Color

Edit `/src/styles/theme.css`:
```css
--primary: rgba(127, 86, 217, 1); /* Change this */
```

### Add New Subject

Add color to `/src/styles/theme.css`:
```css
--history: rgba(255, 100, 100, 1); /* New subject */
```

Use in component:
```tsx
subjectColor: 'var(--history)'
```

### Modify Animations

Edit component files, find Motion/Framer Motion config:
```tsx
<motion.div
  transition={{ duration: 0.5 }} /* Change speed */
>
```

### Add New Lesson

Edit `/src/app/components/learning-path/learning-path-screen.tsx`:
```tsx
lessons: [
  {
    id: 'lesson-10',
    title: 'New Topic',
    subtitle: 'Description',
    status: 'available',
  },
]
```

---

## 🐛 Common Issues

**Q: Bottom nav not showing**  
A: Check that route uses `LearningPathLayout` wrapper

**Q: Animations jerky**  
A: Ensure Motion is installed: `npm install motion`

**Q: CSS variables not working**  
A: Verify `/src/styles/theme.css` is imported

**Q: Material UI components look wrong**  
A: Check `/src/app/App.tsx` has `<ThemeProvider>` wrapper

---

## 📦 Key Files

| File | Purpose |
|------|---------|
| `/src/app/routes.ts` | All route definitions |
| `/src/styles/theme.css` | **ALL STYLING** (colors, fonts, spacing) |
| `/src/app/theme.ts` | Material UI theme config |
| `/src/app/components/learning-path/` | All learning path components |

---

## 🎨 Component Import Quick Reference

```tsx
// Material UI
import { Box, Typography, Button, Chip, LinearProgress } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

// Animations
import { motion } from 'motion/react';

// Navigation
import { useNavigate } from 'react-router';

// Styling - NO IMPORTS NEEDED!
// Just use: style={{ color: 'var(--primary)' }}
// Or sx={{ color: 'var(--primary)' }}
```

---

## ✅ Before You Build More

1. **Read** `/DUOLINGO_REDESIGN_COMPLETE.md` for full details
2. **View** `/material-examples` to see all Material UI components
3. **Check** `/MATERIAL_DESIGN_SETUP.md` for Material UI usage
4. **Follow** `/Guidelines.md` for design system rules

---

## 🚀 Next Features to Build

1. ✅ Learning Path - DONE
2. ✅ Lesson Preview - DONE
3. ✅ Celebration Screen - DONE
4. ⏳ Redesign Practice/Question Screen (Duolingo-style cards)
5. ⏳ Profile Screen (XP graph, badges, leaderboard)
6. ⏳ AI Tutor Chat Interface
7. ⏳ Backend Integration (save progress)
8. ⏳ Social Features (friends, challenges)

---

**Ready to code? Start with `/learning-path` and explore the new experience!** 🎉
