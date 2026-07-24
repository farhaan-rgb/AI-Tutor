# Developer Handoff — Test Prep App (Duolingo/Wondering Style)

## 📦 What You're Getting

This is a **fully functional** gamified test prep app for Indian students, built with React, TypeScript, React Router, and Tailwind CSS v4. The design follows Duolingo/Wondering-style vertical learning paths with rich animations and 3D effects.

**✨ You get the FULL SOURCE CODE, not just a design!**

---

## 🎯 Quick Start

### 1. **Access the Code**
👉 **[Figma Make Link]** ← When you open this link:

**What you'll see:**
- 🖥️ **Live Preview** (left side) → Working interactive app
- 📝 **Code Editor** (right side) → Full React/TypeScript source code
- 📂 **File Explorer** → All project files

**How to use the code:**

#### **Option A: View & Copy Code** (Quick)
1. Click on any file in the file explorer (e.g., `/src/app/App.tsx`)
2. View the code in the editor
3. Copy individual files or components as needed
4. Review the structure and implementation

#### **Option B: Download the Full Project** (Recommended)
1. In Figma Make, look for the **Download** or **Export** button
2. Download the entire project as a `.zip` file
3. Extract and you'll get:
   ```
   /src               ← All source code
   /package.json      ← Dependencies
   /vite.config.js    ← Build configuration
   /tsconfig.json     ← TypeScript config
   ```
4. Run locally:
   ```bash
   npm install        # Install dependencies
   npm run dev        # Start dev server
   npm run build      # Build for production
   ```

#### **Option C: Fork/Clone** (If available in Figma Make)
1. Look for a **Fork** or **Remix** button
2. Create your own copy to edit directly in Figma Make
3. Make changes in the browser
4. Download when ready

---

### 2. **What's Included in the Code**
- **Frontend Framework**: React 18.3.1 + TypeScript
- **Routing**: React Router 7.13.0 (Data mode pattern)
- **Styling**: Tailwind CSS v4 + CSS Variables
- **Icons**: Lucide React + Material-UI Icons
- **Animations**: Motion (formerly Framer Motion)
- **Target Viewport**: 1280×800px (desktop-first)
- **Theme**: Dark mode default, light mode supported

### 3. **Design System Foundation**
This project uses **CSS Variables** exclusively for ALL styling. Never use hardcoded colors!

**🚨 CRITICAL RULE**: 
- ❌ **NEVER** use raw hex codes (`#1DA1F2`)
- ❌ **NEVER** use hardcoded RGBA (`rgba(29, 155, 240, 0.25)`)
- ✅ **ALWAYS** use CSS variables (`var(--primary)`, `var(--primary-alpha-20)`)

All colors, spacing, typography, radius, and shadows are defined in:
- `/src/styles/theme.css` → All CSS variables
- `/Guidelines.md` → Complete design system rules

---

## 📂 Project Structure

```
/src
├── /app
│   ├── /components
│   │   ├── /onboarding          # 13 onboarding screens
│   │   ├── /learning-path       # Main learning path UI
│   │   ├── /app                 # Main app screens (AI Tutor, Profile, etc.)
│   │   ├── /learning-content    # Learn flows (videos, notes, concept cards)
│   │   ├── /practice-content    # Practice flows (quick, PYQ, timed)
│   │   ├── /assessment          # Test flows (mock tests, results)
│   │   ├── /profile             # Profile screens (settings, analytics, streaks)
│   │   └── /live-class          # Live class interface
│   ├── /contexts               # React Context providers
│   ├── /data                   # Mock data for exams, subjects, topics
│   ├── /hooks                  # Custom React hooks
│   ├── routes.ts               # React Router configuration
│   └── App.tsx                 # Root component
├── /styles
│   ├── theme.css               # 🎨 ALL CSS VARIABLES (colors, spacing, typography)
│   └── fonts.css               # Font imports (Inter)
└── /imports                    # Figma-imported assets (if any)

/Guidelines.md                  # 📖 Complete design system documentation
/package.json                   # Dependencies
```

---

## 🎨 Design System Reference

### **Colors** (ALWAYS use CSS variables!)

```css
/* Semantic Colors (adapt to light/dark mode) */
--background              /* Pure black (#000) in dark mode */
--foreground              /* White with 85% opacity */
--card                    /* Card background */
--border                  /* Border color (auto-adapts) */
--muted                   /* Muted backgrounds */
--muted-foreground        /* Muted text */

/* Primary / Accent */
--primary                 /* Ant Design Blue #1890ff */
--primary-foreground      /* White text on primary */
--primary-600, --primary-700  /* Darker shades */

/* Status Colors */
--success                 /* Green #52c41a */
--warning                 /* Gold #faad14 */
--error                   /* Red #ff4d4f */

/* Subject Colors */
--physics                 /* Blue */
--chemistry               /* Green */
--mathematics             /* Orange */
--biology                 /* Purple */

/* Alpha/Opacity Variants (for backgrounds, overlays) */
--primary-alpha-8         /* 8% opacity primary */
--primary-alpha-20        /* 20% opacity primary */
--white-alpha-12          /* 12% opacity white */
--black-alpha-20          /* 20% opacity black */
--overlay-bg              /* Modal backdrop */
```

**📖 Full reference**: `/src/styles/theme.css`

---

### **Typography** (ALWAYS use CSS variables!)

```css
/* Font Sizes */
--text-xs: 12px
--text-sm: 14px
--text-base: 16px
--text-lg: 18px
--text-xl: 20px
--text-2xl: 30px
--text-3xl: 48px

/* Font Weights */
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

/* Font Family */
--font-family-inter: 'Inter', sans-serif
```

**Example:**
```tsx
<div style={{ 
  fontSize: 'var(--text-lg)', 
  fontWeight: 'var(--font-weight-semibold)',
  fontFamily: 'var(--font-family-inter)',
  color: 'var(--foreground)' 
}}>
  Hello World
</div>
```

---

### **Spacing** (4px system - ALWAYS use multiples of 4!)

```
✅ Use: 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80
❌ Never: 13px, 19px, 37px, 2.5rem, 1.5rem

🔒 Screen-level left/right padding: ALWAYS 16px
```

---

### **Border Radius**

```css
--radius-xs: 4px
--radius-md: 8px
--radius-card: 12px
--radius-button: 16px
--radius-full: 999px
--radius-circle: 50%
```

---

### **Shadows / Elevation**

```css
--elevation-xs, --elevation-sm, --elevation-md, --elevation-lg, --elevation-xl
--glow-primary              /* Primary color glow */
--glow-primary-strong       /* Stronger glow */
```

---

## 🧭 Routing Structure

**File**: `/src/app/routes.ts`

### **Entry Point**
- `/` → Redirects to `/splash` (Splash Screen)

### **Onboarding Flow** (No bottom navigation)
```
/splash → /welcome → /signup → /otp → /name-entry 
→ /exam-selection → /language-selection → /preparation-level 
→ /study-hours → /study-schedule-onboarding → /building-plan 
→ /plan-ready → /transition → /mascot-preview
```

### **Main App** (With bottom navigation - 3 tabs)
```
/learning-path          # Home: Vertical path with lesson nodes
/mock-tests             # Mock tests screen
/ai-tutor               # AI Tutor chat
/profile                # Profile, analytics, streaks
```

### **Detail Pages** (No bottom navigation)
```
/learning-path/lesson           # Lesson detail screen
/learning-path/topic-analytics  # Topic analytics
/settings                       # Settings
/edit-profile                   # Edit profile
/analytics                      # Detailed analytics
/streaks                        # Streaks & achievements
```

### **Full-Screen Flows** (No chrome, immersive)
```
/learn/concept-cards            # Concept cards flow
/learn/video-lesson             # Video lesson flow
/learn/ncert-notes              # NCERT notes flow
/practice/quick                 # Quick practice
/practice/pyq                   # Previous year questions
/test-interface                 # Test taking interface
/live-class                     # Live class interface
```

**📖 Full routing details**: `/src/app/routes.ts`

---

## 🎮 Key Features

### **1. Wondering-Style Vertical Learning Path**
- **File**: `/src/app/components/learning-path/wondering-vertical-path.tsx`
- Zigzag vertical layout with lesson nodes
- 4 node states: `locked`, `available`, `in-progress`, `completed`
- Rich animations:
  - In-progress nodes: Floating animation + glow
  - Completed nodes: Green with checkmark + 3D shadow
  - Available nodes: Blue with play icon + 3D shadow
  - Locked nodes: Gray with lock icon + subtle shadow

### **2. Lesson Nodes (Duolingo Style)**
- **Circle size**: 64px
- **Icons**: 
  - ✅ Check (completed)
  - ▶️ Play (available / in-progress - filled icon for in-progress)
  - 🔒 Lock (locked)
- **3D Effects**: 
  - Box shadow depth (6px bottom offset)
  - Inset highlights and shadows
  - Hover: `translateY(-3px)`

### **3. Daily Goals Bottom Sheet**
- **File**: `/src/app/components/learning-path/learning-path-screen.tsx`
- XP goal, lesson goal, streak goal
- Backdrop overlay: `var(--overlay-bg)`
- Close button with high contrast

### **4. Bottom Navigation** (3 tabs)
- Learning Path (Home)
- Mock Tests
- AI Tutor
- Profile removed from bottom nav (accessible via settings)

### **5. Dark Mode by Default**
- Pure black background (`#000000`)
- White text with opacity variants (`rgba(255,255,255,0.85)`)
- Ant Design color system
- Light mode also supported (auto-switches via CSS variables)

---

## 📚 Mock Data Structure

**File**: `/src/app/data/learning-path-data.ts`

```typescript
interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  xp?: number;
  prepScore?: number; // 0-100, undefined if not practiced
}

interface Unit {
  id: string;
  number: number;
  title: string;
  description: string;
  lessons: Lesson[];
  progress: string; // "2 of 8 lessons"
}
```

**Example Units:**
- Unit 1: Kinematics & Laws of Motion
- Unit 2: Work, Energy & Power
- Unit 3: Rotational Mechanics

---

## 🛠️ Dependencies

**Key packages** (see `/package.json` for full list):

```json
{
  "react": "18.3.1",
  "react-router": "7.13.0",
  "tailwindcss": "4.1.12",
  "lucide-react": "0.487.0",
  "motion": "12.23.24",
  "@mui/material": "7.3.5",
  "@radix-ui/*": "Various versions",
  "recharts": "2.15.2",
  "sonner": "2.0.3"
}
```

**Icon imports:**
```tsx
import { Play, Lock, Check, Clock } from 'lucide-react';
import Star from '@mui/icons-material/Star';
```

---

## 🎯 Implementation Guidelines

### **DO:**
✅ Use CSS variables for ALL colors, spacing, typography  
✅ Follow 4px spacing system (0, 4, 8, 12, 16, 20, 24, 32...)  
✅ Use Inter font family via `var(--font-family-inter)`  
✅ Use semantic color variables that adapt to light/dark mode  
✅ Follow component structure in `/src/app/components`  
✅ Test both dark and light modes  
✅ Keep screen-level padding at 16px left/right  

### **DON'T:**
❌ Hardcode colors (`#1890ff`, `rgba(24,144,255,0.2)`)  
❌ Use arbitrary spacing (13px, 19px, 2.5rem)  
❌ Use fonts other than Inter  
❌ Create custom box-shadows (use `var(--elevation-*)`)  
❌ Use absolute positioning (prefer flexbox/grid)  
❌ Break the 4px spacing system  

---

## 📖 Key Files to Review

### **Must Read First:**
1. `/Guidelines.md` → Complete design system rules
2. `/src/styles/theme.css` → All CSS variables
3. `/src/app/routes.ts` → Routing structure
4. `/package.json` → Dependencies

### **Key Components:**
1. `/src/app/components/learning-path/wondering-vertical-path.tsx` → Main path UI
2. `/src/app/components/learning-path/learning-path-screen.tsx` → Screen wrapper
3. `/src/app/components/app/app-layout.tsx` → Layout with bottom nav
4. `/src/app/components/onboarding/splash-screen.tsx` → First screen

### **Mock Data:**
1. `/src/app/data/learning-path-data.ts` → Learning path data
2. `/src/app/data/exam-data.ts` → Exam data (if exists)

---

## 🎨 Animations Reference

**Defined in `/src/styles/theme.css`:**

```css
@keyframes pulse-glow {
  0%, 100% { transform: scale(1.05); }
  50% { transform: scale(1.08); }
}

@keyframes float-lesson {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes play-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.9; }
}
```

**Usage:**
```tsx
animation: 'pulse-glow 2s ease-in-out infinite'
animation: 'float-lesson 2.5s ease-in-out infinite'
```

---

## 🧪 Testing Checklist

### **User Flows to Test:**
- [ ] Splash → Onboarding → Main App (full flow)
- [ ] Click on lesson node → Navigate to lesson detail
- [ ] Open Daily Goals bottom sheet → Close with backdrop/button
- [ ] Switch between bottom nav tabs
- [ ] Test light/dark mode switching
- [ ] Verify all CSS variables work in both themes
- [ ] Check responsive behavior (1280×800 target)
- [ ] Test locked vs available vs in-progress node states

### **Visual Checks:**
- [ ] No hardcoded colors visible
- [ ] All spacing is 4px multiples
- [ ] Inter font loads correctly
- [ ] 3D effects on lesson nodes work
- [ ] Animations smooth (no jank)
- [ ] Icons visible in light and dark modes
- [ ] Borders visible on locked nodes

---

## 💡 Pro Tips

### **1. How to Change Colors**
Edit `/src/styles/theme.css` only. All components will automatically update.

Example: Change primary color from blue to purple:
```css
:root {
  --primary: rgba(135, 108, 255, 1); /* Change this */
  --primary-600: rgba(108, 73, 255, 1);
  --primary-700: rgba(85, 50, 230, 1);
}
```

### **2. How to Add New Screens**
1. Create component in `/src/app/components/[category]/`
2. Export as `Component` for routes:
   ```tsx
   export const Component = MyNewScreen;
   ```
3. Add route in `/src/app/routes.ts`:
   ```tsx
   { path: "new-screen", Component: MyNewScreen }
   ```

### **3. How to Debug CSS Variables**
In browser DevTools:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--primary')
```

### **4. How to Test Dark/Light Mode**
Toggle the `light` class on `<html>` element:
```javascript
document.documentElement.classList.toggle('light')
```

---

## 🚀 Deployment Notes

- **Build command**: `npm run build`
- **Output**: `/dist` folder
- **Environment**: Static site (no backend needed)
- **Routing**: Uses `react-router` with `createBrowserRouter`
- **Assets**: All assets are bundled via Vite

---

## 📞 Questions?

If you have questions about:
- **Design System**: Check `/Guidelines.md`
- **CSS Variables**: Check `/src/styles/theme.css`
- **Routing**: Check `/src/app/routes.ts`
- **Component Structure**: Browse `/src/app/components/`
- **Mock Data**: Check `/src/app/data/`

---

## ✅ Final Checklist Before Development

- [ ] Read `/Guidelines.md` completely
- [ ] Review `/src/styles/theme.css` (all CSS variables)
- [ ] Test live preview link
- [ ] Understand routing structure (`/src/app/routes.ts`)
- [ ] Review key components (learning path, onboarding)
- [ ] Check mock data structure
- [ ] Test dark/light mode switching
- [ ] Verify all dependencies installed (`package.json`)

---

**Happy Coding! 🎉**

*Remember: This app is designed for Indian students preparing for JEE, NEET, UPSC, and other competitive exams. The gamification follows Duolingo's proven engagement patterns with a professional, motivating aesthetic.*