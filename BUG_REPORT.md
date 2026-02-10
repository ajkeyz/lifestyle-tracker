# 🐛 Bug & Performance Analysis Report

**Date:** 2026-02-08
**Scope:** UI Polish Implementation Review
**Status:** 🔴 **12 Issues Found** (3 Critical, 1 High, 4 Medium, 4 Low)

---

## 🔴 CRITICAL BUGS (Fix Immediately)

### Bug #1: Duplicate `@keyframes shimmer` Definition
**File:** `client/src/index.css`
**Lines:** 337-340 (first), 412-416 (second)
**Impact:** Broken shimmer animations on progress bars and skeletons

**Problem:**
```css
/* Line 337 - COMPLETE */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Line 412 - INCOMPLETE (OVERRIDES ABOVE!) */
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
```

**Effect:** The second definition (incomplete) overrides the first. Shimmer animation only has end state, no start state → **animation won't work**.

**Used In:**
- `.shimmer` class (line 329)
- `.animate-shimmer` class (line 419)
- Progress bar shimmer effect
- Skeleton loaders

**Fix:** Delete the second definition (lines 412-416).

---

### Bug #2: Duplicate `@keyframes pulse-glow` Definition
**File:** `client/src/index.css`
**Lines:** 315-322 (first), 437-444 (second)
**Impact:** Glow animations don't respect theme changes

**Problem:**
```css
/* Line 315 - Uses CSS variables (THEMEABLE) */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 8px hsl(var(--primary) / 0.3);
  }
  50% {
    box-shadow: 0 0 24px hsl(var(--primary) / 0.5);
  }
}

/* Line 437 - Hard-coded green (OVERRIDES!) */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
  }
}
```

**Effect:** Glow is always green (#10b981) regardless of theme. Dark mode users see bright green glows that don't match their theme colors.

**Used In:**
- `.pulse-glow` class (line 311)
- `.animate-pulse-glow` class (line 447)
- Various glow effects throughout the app

**Fix:** Delete the second definition (lines 437-444). Keep the first (themeable) version.

---

### Bug #3: Duplicate `@keyframes float` Definition
**File:** `client/src/index.css`
**Lines:** 366-369 (first), 451-458 (second)
**Impact:** Inconsistent float animation distances

**Problem:**
```css
/* Line 366 - 6px movement */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* Line 451 - 10px movement (OVERRIDES!) */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
```

**Effect:** Float animation uses 10px instead of intended 6px. Might make floating elements too "bouncy".

**Used In:**
- `.float` class (line 362)
- `.animate-float` class (line 461)
- Floating UI elements

**Fix:** Choose one version and delete the other. Suggest keeping 10px version for more noticeable effect.

---

## 🟠 HIGH PRIORITY BUGS

### Bug #4: Triple "border" Class in Secondary Button
**File:** `client/src/components/ui/button.tsx`
**Line:** 21
**Impact:** Unexpected CSS behavior on secondary buttons

**Problem:**
```typescript
secondary: "border bg-secondary text-secondary-foreground border border-secondary-border ",
```

The word "border" appears **3 times**:
1. First `border` - sets border width to 1px
2. Second `border` - DUPLICATE (does nothing, Tailwind ignores)
3. Third `border-secondary-border` - sets border color

**Effect:** Confusing, likely a typo. Doesn't break functionality but bad code quality.

**Fix:** Remove duplicate "border":
```typescript
secondary: "bg-secondary text-secondary-foreground border border-secondary-border",
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### Issue #5: Z-Index Layering Conflict
**File:** `client/src/index.css` (line 231) + `client/src/pages/home.tsx` (line 172)
**Impact:** Hover effects could appear above sticky header

**Problem:**
```css
/* index.css line 231 */
.hover-elevate::after {
  z-index: 999;  /* Very high! */
}

/* home.tsx header */
<header className="... z-50 sticky top-0">
```

**Effect:** When hovering a card with `hover-elevate`, the pseudo-element overlay (z-999) will render **above** the sticky header (z-50). This creates visual glitches where hover effects "leak" over the header.

**Fix:** Reduce `.hover-elevate::after` z-index to something more reasonable like `z-index: 1` or `z-index: 10`. The pseudo-element only needs to be above its parent content, not the entire page.

---

### Issue #6: Multiple Simultaneous Animations
**File:** `client/src/pages/home.tsx`
**Impact:** Performance degradation on slower devices

**Problem:**
- **Ambient Background:** 3-5 orbs with 20-second infinite animations
- **Framer Motion:** Multiple `motion.div` containers animating on page load
- **Hover States:** 6+ cards with scale/shadow transitions
- **All running simultaneously**

**Effect:** On slower devices (older phones, budget laptops), the combination of:
- 5 `.ambient-orb` elements with CSS animations (20s infinite)
- 3-4 Framer Motion entrance animations
- Multiple hover state listeners

Can cause:
- Frame drops (below 60fps)
- Jank during scrolling
- Battery drain on mobile devices

**Recommendation:**
1. Use `will-change: transform` on animated elements
2. Consider `prefers-reduced-motion` media query
3. Lazy-load ambient background only after initial render
4. Disable animations on low-end devices

---

### Issue #7: Layout Shift from Hover Translate
**File:** `client/src/index.css` (line 632)
**Impact:** CLS (Cumulative Layout Shift) metric degradation

**Problem:**
```css
.hover-lift:hover {
  @apply -translate-y-1 shadow-2xl;
}
```

**Effect:** When hovering cards, they move UP by 1px (-translate-y-1). This creates a layout shift that:
- Affects Google's Core Web Vitals CLS score
- Can feel jarring if multiple cards shift at once
- Pushes content below downward

**Recommendation:**
- Add `transform-origin: center` to prevent shifts
- Consider using `scale` instead of `translate` for hover effect
- Or accept the trade-off (1px shift is minimal)

---

### Issue #8: Button Hover/Active Animation Stack
**File:** `client/src/components/ui/button.tsx`
**Lines:** 8-9
**Impact:** Potentially conflicting animations

**Problem:**
```typescript
"hover:scale-105 active:scale-95" +  // Tailwind scale
" hover-elevate active-elevate-2",   // Custom overlay
```

**Effect:** Buttons have FOUR layers of animation on interaction:
1. **Hover:** `scale-105` (scales to 105%)
2. **Hover:** `.hover-elevate::after` (adds background overlay)
3. **Active:** `scale-95` (scales to 95%)
4. **Active:** `.active-elevate-2::after` (adds stronger overlay)

This creates a complex visual where buttons both scale AND have overlay effects. Might feel "too much".

**Recommendation:**
- Test if both are needed
- Consider removing `.hover-elevate` classes if Tailwind scale is sufficient
- Or vice versa - pick one approach

---

## 🟢 LOW PRIORITY ISSUES

### Issue #9: Missing Accessibility Labels
**Files:** `client/src/pages/home.tsx`, `client/src/pages/stats.tsx`
**Impact:** Screen readers can't describe icon-only buttons

**Problem:**
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => navigate("/stats")}
  data-testid="button-stats"
>
  <BarChart3 className="w-4 h-4" />
</Button>
```

No `aria-label` or `aria-describedby` attribute. Screen readers will announce "button" with no context.

**Fix:** Add aria-label to all icon-only buttons:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => navigate("/stats")}
  data-testid="button-stats"
  aria-label="View statistics"
>
  <BarChart3 className="w-4 h-4" />
</Button>
```

**Affected Locations:**
- Home page: Settings, Stats, Logout buttons (lines ~187-194)
- Stats page: Back button (line ~130)
- Other pages with icon-only buttons

---

### Issue #10: Unsafe React Key (Potential Collision)
**File:** `client/src/pages/stats.tsx`
**Line:** 335
**Impact:** React warnings if games have duplicate dates

**Problem:**
```typescript
{displayedGames.map((game, index) => (
  <div
    key={`${game.date}-${index}`}
    ...
  >
```

**Effect:** If two games have the same `date` string, React relies on `index` to differentiate. If the array is reordered (e.g., sorting), React might incorrectly recycle components.

**Fix:** Use unique game ID if available:
```typescript
key={game.id || `${game.date}-${index}`}
```

---

### Issue #11: Glass Card Position Context
**File:** `client/src/pages/stats.tsx`
**Lines:** 159, 173, 187, 201
**Impact:** Potential hover effect rendering issues

**Problem:**
```tsx
<Card data-testid="card-games-played" className="hover-lift glass-card">
```

The `glass-card` class doesn't explicitly set `position: relative`, but hover effects with pseudo-elements (::after) require positioned context.

**Effect:** If Card component doesn't have position context, the hover overlay might render incorrectly.

**Fix:** Add explicit positioning:
```tsx
<Card className="hover-lift glass-card relative">
```

Or ensure `.glass-card` includes `@apply relative` in CSS.

---

### Issue #12: Missing Component Exports Verification
**File:** `client/src/components/glass-card.tsx`
**Lines:** 62-192
**Impact:** Unused components might not be importable

**Problem:**
The file defines:
- `GlassCard` ✅ (exported)
- `GradientBackground` (lines 69-123)
- `FloatingOrb` (lines 132-171)
- `MeshGradient` (lines 178-192)

But only `GlassCard` is imported elsewhere. The other 3 components may not have explicit exports.

**Effect:** If trying to import `FloatingOrb` or `MeshGradient`, might get import errors.

**Fix:** Add named exports at end of file or mark as exported inline:
```typescript
export { GlassCard, GradientBackground, FloatingOrb, MeshGradient };
```

---

## 📊 Issue Summary

| Priority | Count | Action |
|----------|-------|--------|
| 🔴 Critical | 3 | Fix immediately |
| 🟠 High | 1 | Fix before release |
| 🟡 Medium | 4 | Fix soon |
| 🟢 Low | 4 | Fix when convenient |
| **Total** | **12** | |

---

## 🎯 Recommended Fix Order

### Immediate (Today)
1. Remove duplicate `@keyframes shimmer` (Bug #1)
2. Remove duplicate `@keyframes pulse-glow` (Bug #2)
3. Remove duplicate `@keyframes float` (Bug #3)
4. Fix triple "border" in button (Bug #4)

**Time:** ~10 minutes
**Impact:** Fixes all animation bugs

### High Priority (This Week)
5. Fix z-index layering (Issue #5)
6. Add `will-change` hints for performance (Issue #6)
7. Test button animation stack (Issue #8)

**Time:** ~30 minutes
**Impact:** Better performance and visual consistency

### Low Priority (Next Sprint)
8. Add aria-labels to icon buttons (Issue #9)
9. Use unique keys in game list (Issue #10)
10. Add `relative` to glass cards (Issue #11)
11. Export all glass-card components (Issue #12)

**Time:** ~1 hour
**Impact:** Better accessibility and code quality

---

## ✅ Testing Checklist

After fixes:
- [ ] Shimmer animation works on progress bars
- [ ] Pulse glow respects theme (light/dark)
- [ ] Float animation is consistent
- [ ] Secondary buttons render correctly
- [ ] Hover effects don't overlap header
- [ ] Page scrolls smoothly with animations
- [ ] Screen readers can describe all buttons
- [ ] No React key warnings in console

---

**Next Step:** Await approval to proceed with fixes.
