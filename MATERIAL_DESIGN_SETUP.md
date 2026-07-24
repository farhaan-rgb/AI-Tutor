# Material Design Setup Guide

## ✅ What's Been Done

Your app is now fully configured to use **Material Design 3 (Material UI)** instead of Untitled UI.

### 1. **Material UI Installed** ✅
All required packages are already in your `package.json`:
- `@mui/material` (7.3.5)
- `@mui/icons-material` (7.3.5)
- `@emotion/react` (peer dependency)
- `@emotion/styled` (peer dependency)

### 2. **Theme Provider Created** ✅
File: `/src/app/theme.ts`

This theme maps Material UI components to your CSS variables from `/src/styles/theme.css`. All colors, typography, spacing, and styles come from your design system.

### 3. **App Wrapped with MUI Theme** ✅
File: `/src/app/App.tsx`

```tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Resets browser defaults */}
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
```

### 4. **Material Examples Created** ✅
File: `/src/app/components/material-examples.tsx`

A comprehensive showcase of all Material UI components styled with your CSS variables.

**To view it:** Navigate to `/material-examples` in your app.

### 5. **Guidelines Updated** ✅
File: `/Guidelines.md`

Completely rewritten to reflect Material Design patterns and enforce CSS variable usage.

---

## 🎨 How to Use Material Design Components

### Import Material UI Components
```tsx
import { 
  Button, 
  Card, 
  CardContent,
  TextField, 
  Chip,
  LinearProgress,
  Avatar,
  Typography,
  Box 
} from '@mui/material';
```

### Import Material Icons
```tsx
import HomeIcon from '@mui/icons-material/Home';
import BookIcon from '@mui/icons-material/Book';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
```

### Use with CSS Variables

#### ✅ CORRECT: Using CSS Variables
```tsx
<Button 
  variant="contained" 
  sx={{ 
    backgroundColor: 'var(--primary)',
    borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-family-inter)',
    fontSize: 'var(--text-base)',
    '&:hover': {
      backgroundColor: 'var(--primary-700)',
    }
  }}
>
  Start Learning
</Button>
```

#### ❌ WRONG: Hardcoding Values
```tsx
<Button 
  variant="contained" 
  sx={{ 
    backgroundColor: '#7F56D9',  // ❌ Never hardcode
    borderRadius: '8px',         // ❌ Never hardcode
    fontFamily: 'Inter',         // ❌ Never hardcode
    fontSize: '16px',            // ❌ Never hardcode
  }}
>
  Start Learning
</Button>
```

---

## 📚 Common Material UI Patterns

### Buttons
```tsx
// Primary action
<Button variant="contained" color="primary" size="large">
  Continue
</Button>

// Secondary action
<Button variant="outlined" color="primary">
  Cancel
</Button>

// Text button
<Button variant="text" color="primary">
  Skip
</Button>

// Destructive action
<Button variant="contained" color="error">
  Delete
</Button>

// With icon
<Button variant="contained" startIcon={<CheckCircleIcon />}>
  Submit
</Button>
```

### Cards
```tsx
<Card sx={{ 
  borderRadius: 'var(--radius-card)',
  backgroundColor: 'var(--card)',
  borderLeft: '4px solid var(--physics)' // Subject accent
}}>
  <CardContent>
    <Typography variant="h4" sx={{ color: 'var(--foreground)' }}>
      Physics Chapter 1
    </Typography>
    <Typography variant="body2" sx={{ color: 'var(--muted-foreground)' }}>
      Newton's Laws of Motion
    </Typography>
  </CardContent>
</Card>
```

### Progress Bars
```tsx
// Default progress
<LinearProgress variant="determinate" value={75} />

// Subject-colored progress (Physics)
<LinearProgress 
  variant="determinate" 
  value={75} 
  sx={{ 
    '& .MuiLinearProgress-bar': { 
      backgroundColor: 'var(--physics)' 
    } 
  }} 
/>
```

### Text Fields
```tsx
<TextField 
  label="Email" 
  variant="outlined" 
  fullWidth 
  placeholder="rahul@example.com"
  sx={{
    '& .MuiOutlinedInput-root': {
      fontFamily: 'var(--font-family-inter)',
      fontSize: 'var(--text-base)',
    }
  }}
/>
```

### Chips (Tags/Badges)
```tsx
// Subject chip
<Chip 
  label="Physics" 
  sx={{ 
    backgroundColor: 'var(--physics-alpha-15)', 
    color: 'var(--physics)' 
  }} 
/>

// Difficulty chip
<Chip label="Easy" color="success" />
<Chip label="Medium" color="warning" />
<Chip label="Hard" color="error" />
```

### Typography
```tsx
<Typography 
  variant="h1" 
  sx={{ 
    fontFamily: 'var(--font-family-inter)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--foreground)'
  }}
>
  Heading Text
</Typography>

<Typography 
  variant="body1"
  sx={{ 
    fontFamily: 'var(--font-family-inter)',
    fontSize: 'var(--text-base)',
    color: 'var(--muted-foreground)'
  }}
>
  Body text here
</Typography>
```

---

## 🎯 Subject Color System

Use these CSS variables for subject-specific styling:

```tsx
// Physics (Blue)
<Box sx={{ borderLeft: '4px solid var(--physics)' }}>
  <LinearProgress sx={{ '& .MuiLinearProgress-bar': { backgroundColor: 'var(--physics)' } }} />
  <Chip sx={{ backgroundColor: 'var(--physics-alpha-15)', color: 'var(--physics)' }} label="Physics" />
</Box>

// Chemistry (Green)
<Box sx={{ borderLeft: '4px solid var(--chemistry)' }}>
  <LinearProgress sx={{ '& .MuiLinearProgress-bar': { backgroundColor: 'var(--chemistry)' } }} />
  <Chip sx={{ backgroundColor: 'var(--chemistry-alpha-15)', color: 'var(--chemistry)' }} label="Chemistry" />
</Box>

// Mathematics (Orange)
<Box sx={{ borderLeft: '4px solid var(--mathematics)' }}>
  <LinearProgress sx={{ '& .MuiLinearProgress-bar': { backgroundColor: 'var(--mathematics)' } }} />
  <Chip sx={{ backgroundColor: 'var(--mathematics-alpha-15)', color: 'var(--mathematics)' }} label="Mathematics" />
</Box>

// Biology (Purple)
<Box sx={{ borderLeft: '4px solid var(--biology)' }}>
  <LinearProgress sx={{ '& .MuiLinearProgress-bar': { backgroundColor: 'var(--biology)' } }} />
  <Chip sx={{ backgroundColor: 'var(--biology-alpha-15)', color: 'var(--biology)' }} label="Biology" />
</Box>
```

---

## 🔧 Updating Your Design System

All styling can be changed by editing CSS files — **no code changes needed**!

### Change Colors
Edit `/src/styles/theme.css`:
```css
:root {
  --primary: rgba(127, 86, 217, 1); /* Change this */
  --physics: rgba(46, 144, 250, 1); /* Change this */
  /* etc. */
}
```

### Change Typography
Edit `/src/styles/theme.css`:
```css
:root {
  --text-xl: 20px; /* Change this */
  --font-weight-semibold: 600; /* Change this */
  --font-family-inter: 'Inter', sans-serif; /* Change this */
}
```

### Change Spacing/Radius/Shadows
Edit `/src/styles/theme.css`:
```css
:root {
  --radius-card: 12px; /* Change this */
  --elevation-md: 0px 2px 4px rgba(...); /* Change this */
}
```

---

## 🚫 What About "Untitled UI" in Figma?

The screenshot you showed is **Figma's design library connection**, not code. Here's how to handle it:

### In Figma (Design Tool):
1. Click the "Untitled UI" dropdown in Figma
2. Click the settings icon ⚙️
3. Select "Disable" or "Remove library"
4. **Optional:** Search Figma Community for "Material Design 3" or "Material You" kit
5. Enable the Material Design library

### In Code (Already Done! ✅):
- Material UI is already installed and configured
- Your app now uses MUI components
- All styling comes from `/src/styles/theme.css`
- No Untitled UI code exists in your project

**You don't need a Figma library connected at all** — your CSS variables are what drive the design system in code.

---

## 📱 Navigation Icons (Material Icons)

Replace old icons with Material Icons:

| Old (Lucide) | New (Material UI) | Import |
|---|---|---|
| `Home` | `HomeIcon` | `import HomeIcon from '@mui/icons-material/Home';` |
| `BookOpen` | `BookIcon` | `import BookIcon from '@mui/icons-material/Book';` |
| `Sparkles` | `AutoAwesomeIcon` | `import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';` |
| `User` | `PersonIcon` | `import PersonIcon from '@mui/icons-material/Person';` |
| `Check` | `CheckCircleIcon` | `import CheckCircleIcon from '@mui/icons-material/CheckCircle';` |
| `X` | `CloseIcon` | `import CloseIcon from '@mui/icons-material/Close';` |
| `ChevronRight` | `ChevronRightIcon` | `import ChevronRightIcon from '@mui/icons-material/ChevronRight';` |
| `Search` | `SearchIcon` | `import SearchIcon from '@mui/icons-material/Search';` |

Browse all icons: https://mui.com/material-ui/material-icons/

---

## 🎬 Next Steps

1. **View the Material Examples**: Navigate to `/material-examples` in your app to see all components in action
2. **Start Building**: Use Material UI components in your screens
3. **Customize Colors**: Edit `/src/styles/theme.css` to match your brand
4. **Follow Guidelines**: Read `/Guidelines.md` for complete design system rules
5. **Add Animations**: Use the `motion` package for Duolingo-style interactions

---

## 🆘 Quick Reference

### File Locations
- **Theme Configuration**: `/src/app/theme.ts`
- **App Wrapper**: `/src/app/App.tsx`
- **Material Examples**: `/src/app/components/material-examples.tsx`
- **Design System CSS**: `/src/styles/theme.css`
- **Guidelines**: `/Guidelines.md`

### Key Principles
1. ✅ Always use CSS variables (`var(--primary)`, never `#7F56D9`)
2. ✅ Always use Material UI components from `@mui/material`
3. ✅ Always use Material Icons from `@mui/icons-material`
4. ✅ Always use Inter font via `var(--font-family-inter)`
5. ✅ Never hardcode colors, spacing, radius, or shadows
6. ✅ Test in dark mode (default) and light mode

---

## 🎉 You're All Set!

Material Design is now fully integrated with your custom design system. All future components should use Material UI styled with your CSS variables.

**Test it:** Run your app and navigate to `/material-examples` to see it in action!
