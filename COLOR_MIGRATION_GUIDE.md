# Ant Design Color System Migration Guide

## Complete Color Replacement Map

### Black & White Alpha Values
```
rgba(0, 0, 0, 0.04) → var(--black-alpha-4)
rgba(0, 0, 0, 0.06) → var(--black-alpha-6)
rgba(0, 0, 0, 0.08) → var(--black-alpha-8)
rgba(0, 0, 0, 0.10) → var(--black-alpha-10)
rgba(0, 0, 0, 0.12) → var(--black-alpha-12)
rgba(0, 0, 0, 0.15) → var(--black-alpha-15)
rgba(0, 0, 0, 0.20) → var(--black-alpha-20)
rgba(0, 0, 0, 0.30) → var(--black-alpha-30)
rgba(0, 0, 0, 0.40) → var(--black-alpha-40)
rgba(0, 0, 0, 0.50) → var(--black-alpha-50)
rgba(0, 0, 0, 0.60) → var(--black-alpha-60)

rgba(255, 255, 255, 0.04) → var(--white-alpha-4)
rgba(255, 255, 255, 0.05) → var(--white-alpha-6)
rgba(255, 255, 255, 0.06) → var(--white-alpha-6)
rgba(255, 255, 255, 0.08) → var(--white-alpha-8)
rgba(255, 255, 255, 0.10) → var(--white-alpha-10)
rgba(255, 255, 255, 0.12) → var(--white-alpha-12)
rgba(255, 255, 255, 0.15) → var(--white-alpha-15)
rgba(255, 255, 255, 0.2) → var(--white-alpha-20)
rgba(255, 255, 255, 0.25) → var(--white-alpha-25)
rgba(255, 255, 255, 0.3) → var(--white-alpha-30)
rgba(255, 255, 255, 0.4) → var(--white-alpha-40)
rgba(255, 255, 255, 0.45) → var(--white-alpha-45)
rgba(255, 255, 255, 0.5) → var(--white-alpha-50)
rgba(255, 255, 255, 0.65) → var(--white-alpha-65)
rgba(255, 255, 255, 0.75) → var(--white-alpha-75)
rgba(255, 255, 255, 0.8) → var(--white-alpha-80)
rgba(255, 255, 255, 0.85) → var(--white-alpha-85)
rgba(255, 255, 255, 0.9) → var(--white-alpha-90)
rgba(255, 255, 255, 0.95) → var(--white-alpha-95)
```

### Primary (Blue) Alpha Values
```
rgba(24, 144, 255, 0.04) → var(--primary-alpha-4)
rgba(24, 144, 255, 0.06) → var(--primary-alpha-6)
rgba(24, 144, 255, 0.08) → var(--primary-alpha-8)
rgba(24, 144, 255, 0.12) → var(--primary-alpha-12)
rgba(24, 144, 255, 0.15) → var(--primary-alpha-15)
rgba(24, 144, 255, 0.20) → var(--primary-alpha-20)
rgba(24, 144, 255, 0.25) → var(--primary-alpha-25)
rgba(24, 144, 255, 0.30) → var(--primary-alpha-30)

// Old Twitter Blue (needs replacement)
rgba(29, 155, 240, 0.12) → var(--primary-alpha-12)
rgba(29, 155, 240, 0.15) → var(--primary-alpha-15)
rgba(29, 155, 240, 0.25) → var(--primary-alpha-25)
```

### Success (Green) Alpha Values
```
rgba(82, 196, 26, 0.06) → var(--success-alpha-6)
rgba(82, 196, 26, 0.08) → var(--success-alpha-8)
rgba(82, 196, 26, 0.12) → var(--success-alpha-12)
rgba(82, 196, 26, 0.15) → var(--success-alpha-15)
rgba(82, 196, 26, 0.20) → var(--success-alpha-20)
rgba(82, 196, 26, 0.25) → var(--success-alpha-25)
rgba(82, 196, 26, 0.30) → var(--success-alpha-30)

// Old Material Green (needs replacement)
rgba(23, 178, 106, 0.08) → var(--success-alpha-8)
rgba(23, 178, 106, 0.12) → var(--success-alpha-12)
rgba(23, 178, 106, 0.2) → var(--success-alpha-20)
rgba(76, 175, 80, 0.3) → var(--success-alpha-30)

#4CAF50 → var(--success)
```

### Warning (Gold/Orange) Alpha Values
```
rgba(250, 173, 20, 0.12) → var(--warning-alpha-12)
rgba(250, 173, 20, 0.15) → var(--warning-alpha-15)
rgba(250, 173, 20, 0.20) → var(--warning-alpha-20)
rgba(250, 173, 20, 0.25) → var(--warning-alpha-25)
rgba(250, 173, 20, 0.30) → var(--warning-alpha-30)

// Old warning colors (needs replacement)
rgba(247, 144, 9, 0.12) → var(--warning-alpha-12)
rgba(247, 144, 9, 0.15) → var(--warning-alpha-15)
rgba(247, 144, 9, 0.20) → var(--warning-alpha-20)
rgba(247, 144, 9, 0.3) → var(--warning-alpha-30)
rgba(251, 191, 36, 0.1) → var(--warning-alpha-12)
rgba(251, 191, 36, 0.3) → var(--warning-alpha-30)
```

### Error (Red) Alpha Values
```
rgba(255, 77, 79, 0.06) → var(--error-alpha-6)
rgba(255, 77, 79, 0.08) → var(--error-alpha-8)
rgba(255, 77, 79, 0.10) → var(--error-alpha-10)
rgba(255, 77, 79, 0.12) → var(--error-alpha-12)
rgba(255, 77, 79, 0.15) → var(--error-alpha-15)
rgba(255, 77, 79, 0.25) → var(--error-alpha-25)

// Old error colors (needs replacement)
rgba(240, 68, 56, 0.12) → var(--error-alpha-12)
```

### Solid Colors
```
#FFFFFF → var(--white)
#ffffff → var(--white)
#000000 → var(--black)

// Old background colors
rgba(12, 17, 29, 0.95) → var(--background) with 95% opacity → rgba(0, 0, 0, 0.95)
rgba(12, 17, 29, 0.60) → var(--overlay-bg)
```

### Gradients
```
// Replace hex color gradients with CSS variable gradients
linear-gradient(135deg, #4CAF50 0%, #388E3C 100%) 
→ linear-gradient(135deg, var(--success) 0%, var(--success-700) 100%)

linear-gradient(135deg, #2196F3 0%, #1976D2 100%)
→ linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)

linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%)
→ linear-gradient(180deg, var(--white-alpha-40) 0%, transparent 100%)

radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)
→ radial-gradient(circle at 50% 0%, var(--white-alpha-15) 0%, transparent 60%)
```

### Box Shadows
```
// Replace hardcoded rgba shadows with CSS variable shadows
0 1px 3px rgba(0, 0, 0, 0.08) → var(--elevation-sm)
0 2px 8px rgba(0, 0, 0, 0.12) → var(--elevation-md)
0 4px 12px rgba(0, 0, 0, 0.15) → var(--elevation-md)
0 8px 24px rgba(0, 0, 0, 0.2) → var(--elevation-lg)

// Or use CSS variables for custom shadows
boxShadow: \`0 2px 8px var(--black-alpha-8)\`
boxShadow: \`0 4px 16px var(--primary-alpha-20)\`
```

### Special Colors (Ant Design specific)
```
// Gold/Trophy colors
#FFD700 → rgba(250, 173, 20, 1) (Ant Design Gold)
#FFC107 → var(--warning)
#FFA500 → var(--warning-500)

// Purple (for Biology)
#8B5CF6 → var(--biology)
#876CFF → var(--biology)

// Material Design colors to replace
#3B82F6 → var(--primary)
#10B981 → var(--success)
#F59E0B → var(--warning)
```

### Common SVG Fill Colors
```
fill="#ffffff" → fill="var(--white)"
fill="#4285F4" → fill="var(--primary)" (Google blue)
fill="#34A853" → fill="var(--success)" (Google green)
fill="#FBBC05" → fill="var(--warning)" (Google yellow)
fill="#EA4335" → fill="var(--error)" (Google red)
```

### Color Prop Patterns
```
color: '#FFFFFF' → color: 'var(--white)'
color: '#4CAF50' → color: 'var(--success)'
color: 'rgba(255, 255, 255, 0.9)' → color: 'var(--white-alpha-90)'
```

## Migration Strategy

1. **Search for patterns**: Use regex to find all instances:
   - `rgba\([0-9]+,\s*[0-9]+,\s*[0-9]+,\s*[0-9.]+\)`
   - `#[0-9a-fA-F]{6}`
   - `#[0-9a-fA-F]{3}`

2. **Replace systematically**:
   - Start with most common patterns (black/white alpha)
   - Then semantic colors (primary, success, warning, error)
   - Finally custom colors

3. **Test both light and dark modes** to ensure smooth transitions

4. **Verify no hardcoded colors remain**:
   ```bash
   grep -r "rgba\|rgb\|#[0-9a-fA-F]" src/app/components --include="*.tsx" | grep -v "var(--"
   ```

## Files Requiring Updates

Based on search results, these files need color migrations:

### High Priority (Core Features)
- `/src/app/components/live-class/live-class-interface.tsx`
- `/src/app/components/learning-path/*.tsx` (all files)
- `/src/app/components/app/*.tsx` (all files)

### Medium Priority (Onboarding)
- `/src/app/components/onboarding/*.tsx` (all files)

### Lower Priority (UI Components, Mascots)
- `/src/app/components/ui/*.tsx` (some files)
- `/src/app/components/onboarding/mascots/*.tsx`

## Example Before/After

### Before:
```tsx
<div style={{
  backgroundColor: 'rgba(29, 155, 240, 0.15)',
  border: '1px solid rgba(29, 155, 240, 0.3)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
  color: '#FFFFFF'
}}>
```

### After:
```tsx
<div style={{
  backgroundColor: 'var(--primary-alpha-15)',
  border: '1px solid var(--primary-alpha-30)',
  boxShadow: 'var(--elevation-md)',
  color: 'var(--white)'
}}>
```

## Status

✅ Theme CSS updated with full Ant Design color system  
🔄 Component files pending migration (31 files, 200+ instances)
