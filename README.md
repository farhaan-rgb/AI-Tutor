# Test Prep App — Gamified Learning Platform

<div align="center">

**A Duolingo-style test preparation app for Indian students**

Built with React + TypeScript + Tailwind CSS v4

[View Live Demo](#) • [Developer Guide](./DEVELOPER_HANDOFF.md) • [Design System](./Guidelines.md)

</div>

---

## 🎯 What is This?

A **production-ready** gamified test prep app designed for Indian students preparing for competitive exams (JEE, NEET, UPSC, CAT, etc.). The app features:

- 🎮 **Duolingo/Wondering-style** vertical learning path with animated lesson nodes
- 🌙 **Dark mode by default** (pure black #000000) with light mode support
- 🎨 **Ant Design color system** via CSS variables (zero hardcoded colors!)
- 📱 **Desktop-first** design (1280×800px target)
- ⚡ **Rich animations** using Motion (Framer Motion)
- 🧭 **13 onboarding screens** + full learning experience

---

## 📦 For Developers

### **Quick Start**

```bash
# 1. Download the project from Figma Make link
# 2. Extract the .zip file
# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev

# 5. Build for production
npm run build
```

### **📖 Documentation**

| Document | Purpose |
|----------|---------|
| [🚀 HOW_TO_USE_FIGMA_MAKE.md](./HOW_TO_USE_FIGMA_MAKE.md) | **START HERE!** How to access and download code |
| [👨‍💻 DEVELOPER_HANDOFF.md](./DEVELOPER_HANDOFF.md) | Complete technical guide, project structure, API reference |
| [🎨 Guidelines.md](./Guidelines.md) | Design system rules, CSS variables, component standards |

### **🔑 Key Principles**

```tsx
// ✅ DO: Use CSS variables
<div style={{ color: 'var(--primary)' }}>Text</div>

// ❌ DON'T: Hardcode colors
<div style={{ color: '#1890ff' }}>Text</div>
```

**Everything uses CSS variables:**
- Colors → `var(--primary)`, `var(--success)`, `var(--error)`
- Spacing → Multiples of 4px (4, 8, 12, 16, 20, 24...)
- Typography → `var(--text-lg)`, `var(--font-weight-semibold)`
- Radius → `var(--radius-md)`, `var(--radius-card)`
- Shadows → `var(--elevation-md)`, `var(--glow-primary)`

**Why?** Change the entire theme by editing ONE file: `/src/styles/theme.css`

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18.3.1 + TypeScript |
| **Routing** | React Router 7.13.0 |
| **Styling** | Tailwind CSS v4 + CSS Variables |
| **Icons** | Lucide React + Material-UI Icons |
| **Animations** | Motion (Framer Motion) |
| **Build Tool** | Vite 6.3.5 |
| **UI Components** | Radix UI + Custom components |
| **Charts** | Recharts |
| **Deployment** | Static (any CDN/hosting) |

---

## 📂 Project Structure

```
/src
├── /app
│   ├── /components
│   │   ├── /onboarding           # 13 onboarding screens
│   │   ├── /learning-path        # ⭐ Main learning UI (Duolingo-style)
│   │   ├── /app                  # AI Tutor, Profile, Mock Tests
│   │   ├── /learning-content     # Video lessons, concept cards, notes
│   │   ├── /practice-content     # Quick practice, PYQ, timed tests
│   │   └── /assessment           # Test interface, results
│   ├── /data                     # Mock data (replace with API)
│   ├── /contexts                 # React Context providers
│   ├── /hooks                    # Custom hooks
│   ├── routes.ts                 # React Router config
│   └── App.tsx                   # Root component
├── /styles
│   ├── theme.css                 # 🎨 ALL CSS VARIABLES (edit this!)
│   └── fonts.css                 # Font imports
└── /imports                      # Figma assets

/Guidelines.md                    # Design system documentation
/DEVELOPER_HANDOFF.md             # Developer guide
/HOW_TO_USE_FIGMA_MAKE.md         # How to download & use code
/package.json                     # Dependencies
```

---

## 🎨 Design System

### **Colors** (Dark Mode Default)

```css
/* Semantic (auto-adapt to light/dark) */
--background: rgba(0, 0, 0, 1);              /* Pure black */
--foreground: rgba(255, 255, 255, 0.85);     /* White 85% */
--card: rgba(20, 20, 20, 1);                 /* Card background */
--border: rgba(255, 255, 255, 0.12);         /* Borders */

/* Status Colors (Ant Design) */
--primary: rgba(24, 144, 255, 1);            /* Blue #1890ff */
--success: rgba(82, 196, 26, 1);             /* Green #52c41a */
--warning: rgba(250, 173, 20, 1);            /* Gold #faad14 */
--error: rgba(255, 77, 79, 1);               /* Red #ff4d4f */

/* Alpha Variants (for backgrounds, overlays) */
--primary-alpha-20: rgba(24, 144, 255, 0.20);
--white-alpha-12: rgba(255, 255, 255, 0.12);
--overlay-bg: rgba(0, 0, 0, 0.60);
```

### **Typography**

```css
/* Font: Inter (loaded from Google Fonts) */
--font-family-inter: 'Inter', sans-serif;

/* Sizes */
--text-xs: 12px     --text-lg: 18px
--text-sm: 14px     --text-xl: 20px
--text-base: 16px   --text-2xl: 30px
                    --text-3xl: 48px

/* Weights */
--font-weight-normal: 400      --font-weight-semibold: 600
--font-weight-medium: 500      --font-weight-bold: 700
```

### **Spacing** (4px System)

```
Screen padding: 16px (left/right)
Component spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80...
⚠️ Only use multiples of 4!
```

**📖 Full Reference:** `/src/styles/theme.css`

---

## 🧭 App Structure

### **User Journey**

```
Splash Screen
    ↓
Onboarding (13 steps)
    ├─ Welcome
    ├─ Signup / OTP
    ├─ Name Entry
    ├─ Exam Selection (JEE/NEET/UPSC...)
    ├─ Language Selection
    ├─ Preparation Level
    ├─ Study Hours
    ├─ Building Plan Animation
    └─ Ready Screen
    ↓
Main App (3 tabs)
    ├─ Learning Path (Home) ⭐ Duolingo-style vertical path
    ├─ Mock Tests
    └─ AI Tutor
```

### **Key Screens**

| Screen | Route | Description |
|--------|-------|-------------|
| Splash | `/splash` | Entry point (auto-redirects from `/`) |
| Learning Path | `/learning-path` | Main home screen with vertical lesson nodes |
| Lesson Detail | `/learning-path/lesson` | Detailed view of a lesson with Learn + Practice |
| AI Tutor | `/ai-tutor` | Chat interface for doubt solving |
| Mock Tests | `/mock-tests` | Browse and take mock tests |
| Profile | `/profile` | User profile, analytics, streaks |

---

## ⭐ Key Features

### **1. Wondering-Style Vertical Learning Path**

Visual design inspired by Duolingo/Wondering:
- ✅ Zigzag vertical layout with lesson circles (64px)
- ✅ 4 node states: **locked**, **available**, **in-progress**, **completed**
- ✅ 3D shadow effects (6px depth + inset highlights)
- ✅ Rich animations:
  - **In-progress**: Floating animation + glow
  - **Completed**: Green checkmark + 3D shadow
  - **Available**: Blue play icon + 3D shadow
  - **Locked**: Gray lock icon + subtle border

**File:** `/src/app/components/learning-path/wondering-vertical-path.tsx`

### **2. Onboarding Flow (13 Screens)**

Guides users through:
- Exam selection (multi-select: JEE, NEET, UPSC...)
- Language preference
- Preparation level assessment
- Study hours commitment
- Personalized study plan generation

**Files:** `/src/app/components/onboarding/`

### **3. Dark Mode (Default)**

- Pure black background (`#000000`)
- Ant Design color system
- CSS variables auto-switch for light mode
- No manual theme logic needed!

**Toggle:** Add `.light` class to `<html>` element

### **4. Daily Goals Bottom Sheet**

Track daily progress:
- XP Goal (e.g., 50/100 XP)
- Lesson Goal (e.g., 2/3 lessons)
- Streak Goal (e.g., 7-day streak)

**File:** `/src/app/components/learning-path/learning-path-screen.tsx`

---

## 🛠️ Customization Guide

### **Change Colors**

Edit `/src/styles/theme.css`:

```css
:root {
  /* Change primary from blue to purple */
  --primary: rgba(135, 108, 255, 1);
  --primary-600: rgba(108, 73, 255, 1);
  --primary-700: rgba(85, 50, 230, 1);
}
```

**All components update automatically!** No code changes needed.

### **Change Typography**

```css
:root {
  --text-base: 18px;              /* Increase base font size */
  --font-family-inter: 'Poppins', sans-serif;  /* Change font */
}
```

### **Change Spacing**

```css
/* Increase screen padding from 16px to 20px */
/* Edit components that use: paddingLeft: 16, paddingRight: 16 */
```

### **Add New Screens**

1. Create component: `/src/app/components/my-screen/my-screen.tsx`
2. Export as Component:
   ```tsx
   export const Component = MyScreen;
   ```
3. Add route: `/src/app/routes.ts`
   ```tsx
   { path: "my-screen", Component: MyScreen }
   ```

---

## 🚀 Deployment

### **Build**

```bash
npm run build
# Output: /dist folder
```

### **Deploy to:**

- **Vercel**: `vercel deploy`
- **Netlify**: Drag `/dist` to Netlify dashboard
- **AWS S3 + CloudFront**: Upload `/dist` contents
- **GitHub Pages**: Use `gh-pages` package

**Note:** Configure routing to handle React Router (redirect all to `index.html`)

---

## 📊 Project Stats

- **React Components**: 50+ files
- **Total Lines of Code**: ~10,000+
- **Design System Variables**: 200+ CSS variables
- **Routes**: 40+ screens/flows
- **Dependencies**: 30+ packages (all listed in `package.json`)

---

## 🎯 Target Audience

**Students in India** preparing for:
- JEE Main / JEE Advanced
- NEET
- UPSC Civil Services
- CAT (MBA entrance)
- GATE
- SSC CGL
- Banking exams (IBPS)
- CLAT
- State PSC exams
- CBSE Boards

**Age Range:** 15–28 years  
**Device:** Desktop-first (1280×800px), mobile-responsive  
**Study Pattern:** Late-night study, long sessions, need for motivation

---

## 📖 Documentation Index

| File | Description | Read If... |
|------|-------------|-----------|
| `README.md` | This file! Project overview | You're new here |
| `HOW_TO_USE_FIGMA_MAKE.md` | How to download and access code | You have the Figma Make link |
| `DEVELOPER_HANDOFF.md` | Complete technical guide | You're building/customizing |
| `Guidelines.md` | Design system rules | You're designing/styling |
| `/src/styles/theme.css` | All CSS variables | You're changing colors/spacing |
| `/src/app/routes.ts` | Routing configuration | You're adding screens |

---

## 🤝 Contributing

This is a Figma Make project. To contribute:

1. Download the project from the Figma Make link
2. Make changes locally
3. Test thoroughly
4. Share your fork/modifications

---

## 📄 License

This project was built using Figma Make. Check with your organization for licensing details.

---

## 🙏 Credits

- **Design System**: Ant Design color palette
- **Inspiration**: Duolingo, Wondering (learning path design)
- **Icons**: Lucide React, Material-UI Icons
- **Font**: Inter (Google Fonts)
- **Built With**: Figma Make

---

<div align="center">

**Built with ❤️ for Indian students**

[Report Bug](#) • [Request Feature](#) • [Documentation](./DEVELOPER_HANDOFF.md)

</div>
