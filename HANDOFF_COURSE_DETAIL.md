# Course Detail Pages — Developer Handoff

## Overview

Two course detail page templates exist. Both are data-driven — new courses/tracks can be added by updating data constants, with no layout changes required.

---

## Files

| File | Route | Purpose |
|------|-------|---------|
| `src/screens/course-detail.tsx` | `/course-detail?exam=cat` | Generic exam course detail (CAT, JEE Mains, JEE Advanced, etc.) |
| `src/screens/ai-summer-camp-detail.tsx` | `/ai-summer-camp?track=explorer` | AI Summer Camp detail (Explorer / Creator tracks) |
| `src/screens/summer-camp-purchased.tsx` | `/summer-camp-purchased?track=explorer` | Post-purchase confirmation screen |
| `src/screens/classes.tsx` | `/classes` | My Classrooms + Other Courses listing |
| `src/app/routes.ts` | — | All route definitions |

---

## How to Add a New Exam Course (`course-detail.tsx`)

Add a new key to `EXAM_DATA` (line ~10). That's it — the page renders itself.

```ts
// src/screens/course-detail.tsx
const EXAM_DATA: Record<string, ExamCourse> = {
  cat: { ... },
  "jee-mains": { ... },
  "your-new-exam": {           // ← add here
    exam: "NEET",
    shortLabel: "NEET",
    price: 6999,
    originalPrice: 12999,
    heroGradient: "linear-gradient(...)",
    examAccent: "#52c41a",
    // ... rest of fields (see ExamCourse interface)
  },
};
```

Navigate to: `/course-detail?exam=your-new-exam`

**Fields requiring real API data:**
- `offerEndsIn` — currently a static string (`"2 days"`). Should be computed from a real offer deadline timestamp from the API.
- All prices, topics, sections — come from `GET /api/courses/:examId`

---

## How to Add a New Summer Camp Track (`ai-summer-camp-detail.tsx`)

Add keys to `TRACK_COLORS` and `DUMMY_CAMP_TRACKS` (lines ~27 and ~72).

```ts
const TRACK_COLORS = {
  explorer: { ... },
  creator: { ... },
  advanced: {                  // ← add here
    heroGradient: "linear-gradient(...)",
    accentColor: "#722ed1",
    heroAiColor: "#722ed1",
    badgeBg: "...",
    badgeBorder: "...",
    iconBg: "...",
  },
};
```

Navigate to: `/ai-summer-camp?track=advanced`

---

## API Integration Points

Every data constant is marked with a `// TODO(api):` comment. Search for `TODO(api)` across the codebase to find all integration points.

| Constant | File | API endpoint to wire |
|----------|------|---------------------|
| `EXAM_DATA` | `course-detail.tsx` | `GET /api/courses/:examId` |
| `DUMMY_CAMP` | `ai-summer-camp-detail.tsx` | `GET /api/courses/ai-summer-camp` |
| `DUMMY_CAMP_TRACKS` | `ai-summer-camp-detail.tsx` | `GET /api/courses/ai-summer-camp/tracks` |
| `DUMMY_TOOLS` | `ai-summer-camp-detail.tsx` | `GET /api/courses/ai-summer-camp/tools` |
| `DUMMY_INTEREST_COUNTS` | `ai-summer-camp-detail.tsx` | `GET /api/courses/ai-summer-camp/interest` |
| `DUMMY_CAMP_SCHEDULE` | `ai-summer-camp-detail.tsx` | `GET /api/courses/ai-summer-camp/schedule` |
| `CAMP_START` | `summer-camp-purchased.tsx` | `GET /api/courses/ai-summer-camp` |

---

## Action Items Before Production

### Critical
- **Replace Figma image URLs** in `ai-summer-camp-detail.tsx` → `DUMMY_TOOLS` array (5 tool logos). Currently pointing to `figma.com/api/mcp/asset/...` which are internal Figma URLs and will break in production. Replace with real CDN/public URLs.

### Required for launch
- Wire all `DUMMY_*` constants to real API responses (see table above).
- `offerEndsIn` in `course-detail.tsx` — compute from real deadline date from API.
- Interest toggle (`isInterested`) uses `localStorage` key `prepmaster_camp_interested_<track>`. Clear this key on user logout.

### Purchase flow (important to understand)
- Purchase state is **ephemeral via URL param** (`?camp_purchased=explorer`), not persisted. The `classes.tsx` screen reads it once on mount, then clears the URL. Real purchase state must come from the backend/auth layer — the frontend will check the user's purchased courses list from the API to determine card placement (My Classrooms vs. Other Courses).

---

## Stack

- React 18 + TypeScript
- Tailwind CSS v4 (layout only — `flex`, `gap`, `padding`, `width`, `height`)
- CSS variables for all colors/typography (defined in `src/styles/theme.css`)
- Framer Motion (`motion/react`) for all animations
- React Router v7 (`useNavigate`, `useSearchParams`)
- Lucide React for icons

## Run Locally

```bash
npm install --legacy-peer-deps   # --legacy-peer-deps required
npm run dev                       # http://localhost:5173
```
