# Course Detail — Icon Handoff

Icons used on the **Crash Course Detail** page (`src/screens/crash-course-detail.tsx`).

Every asset is delivered in two variants:
- `*-dark.svg` — for the **dark** theme (`.dark` class on `<html>`)
- `*-light.svg` — for the **light** theme (`.light` class on `<html>`)

Source family: **Lucide** (MIT). 24×24 viewBox, 2px stroke, round caps/joins. Tile composites embed a colored rounded-rect background so they render correctly as a single asset.

---

## Color tokens used

| Token              | Dark              | Light             | Where it appears |
|--------------------|-------------------|-------------------|------------------|
| `--primary`        | `#1C8CD1`         | `#1DA1F2`         | Free Demo / Curriculum / Show more |
| `--muted-foreground` | `rgba(255,255,255,0.45)` | `rgba(0,0,0,0.45)` | Stats row, "What You Need" |
| Crash accent       | `#52C41A` (AntD green-6) | `#389E0D` (AntD green-7) | "What you'll learn" checks, "This course includes" tiles, top "CRASH COURSE" badge |
| `--foreground`     | `#FFFFFF`         | `rgba(0,0,0,0.85)` | "Have questions?" phone tile icon |
| White overlay      | `#FFFFFF` (both modes) | — | Header back / share buttons (always on a dark hero overlay) |

---

## Assets

### Header overlay buttons
Rendered over the green hero — same in both modes.

| File | Size | Where |
|------|------|-------|
| `back-arrow-{dark,light}.svg` | 24×24 | top-left back button |
| `share-{dark,light}.svg`      | 24×24 | top-right share button |

### Action buttons (primary stroke)
| File | Size | Where |
|------|------|-------|
| `play-primary-{dark,light}.svg`      | 24×24, filled | "Free Demo" button |
| `book-open-primary-{dark,light}.svg` | 24×24         | "Curriculum" button |

### Stats row (muted stroke)
Below the title, next to "15 Days · Maths & Science · 22 chapters".

| File | Size | Where |
|------|------|-------|
| `clock-muted-{dark,light}.svg`     | 24×24 | "15 Days" |
| `book-open-muted-{dark,light}.svg` | 24×24 | "Maths & Science" |
| `video-muted-{dark,light}.svg`     | 24×24 | "22 chapters" |

### "What you'll learn" list (accent stroke)
| File | Size | Where |
|------|------|-------|
| `check-circle-accent-{dark,light}.svg` | 24×24 | each list item bullet |

### "This course includes" — tile composites (32×32)
8% accent fill + 16×16 accent icon centered.

| File | Size | Where |
|------|------|-------|
| `tile-video-accent-{dark,light}.svg` | 32×32 | "Live classes for every chapter" |
| `tile-book-accent-{dark,light}.svg`  | 32×32 | "Class recordings" |
| `tile-clock-accent-{dark,light}.svg` | 32×32 | "15 days · summer break-friendly" |
| `tile-check-accent-{dark,light}.svg` | 32×32 | "One-time payment · lifetime access" |

### "What You Need" (muted stroke)
| File | Size | Where |
|------|------|-------|
| `smartphone-muted-{dark,light}.svg` | 24×24 | "Smartphone or tablet" |
| `wifi-muted-{dark,light}.svg`       | 24×24 | "Stable internet" |
| `pencil-muted-{dark,light}.svg`     | 24×24 | "A notebook for practice" |
| `clock-muted-{dark,light}.svg`      | 24×24 | "1–2 hours a day" (same file as the stats clock) |

### "Have questions?" — tile composite (40×40)
8% foreground fill + 20×20 foreground icon centered.

| File | Size | Where |
|------|------|-------|
| `tile-phone-{dark,light}.svg` | 40×40 | left of the "Have questions?" card |

### Description show more / less (primary stroke)
| File | Size | Where |
|------|------|-------|
| `chevron-down-primary-{dark,light}.svg` | 24×24 | collapsed state |
| `chevron-up-primary-{dark,light}.svg`   | 24×24 | expanded state |

---

## Notes for the developer

- **All non-tile icons can be replaced with CSS-driven `currentColor`** if you'd rather color them via theme variables — the current SVGs hard-code the resolved stroke color for each mode. Easy to swap if needed.
- **Tile composites have the background baked in.** If you want to switch theming dynamically (e.g., the "What you'll learn" accent changes per program), render the icon + bg separately in DOM/CSS instead of using these composites.
- Source path data: Lucide v0.x, MIT license. Drop-in replacements are available via `lucide-react` if you already have it on the page.
