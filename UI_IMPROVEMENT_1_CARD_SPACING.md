# UI Improvement #1: Standardize Card Spacing

## Summary
Fix inconsistent padding across card implementations to match design system standard of `p-6` (24px) for all card sections.

## Current Problems
- **21 instances** of `CardContent` using `p-4` (16px) instead of standard `p-6` (24px)
- Some cards use `p-3`, `p-8`, or custom padding
- Violates UI Consistency Spec section on Card Patterns

## Design System Standard

### Correct Pattern
```tsx
<Card>
  <CardHeader className="p-6">
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    {/* Content */}
  </CardContent>
  <CardFooter className="p-6 pt-0">
    {/* Footer */}
  </CardFooter>
</Card>
```

### Key Rules
1. **All card sections use `p-6`** (24px padding all around)
2. **Content/Footer use `pt-0`** to avoid double padding with header
3. **Exceptions**: Empty states can use `p-8` for extra breathing room

## Files to Update

### High Priority (User-Facing)
1. **community.tsx** (line 95)
   - ScenarioCard: `p-4` → `p-6 pt-0`
   - Empty state: Already correct with `p-8`

2. **community-detail.tsx** (lines 94, 349, 371, 443, 488, 525)
   - Main content: `p-4` → `p-6 pt-0`
   - Comments: `p-3` → `p-6` (too small currently)
   - Replies: `p-3` → `p-4` (nested, can stay smaller)

3. **stats.tsx** (lines 125, 139, 153, 167)
   - Stat cards: `p-4` → `p-6 pt-0`
   - Empty state: Already correct with `p-8`

4. **weekly-recap.tsx** (lines 161, 178, 195, 247, 253, 259, 268)
   - Category breakdown cards: `p-4` → `p-6 pt-0`
   - Empty states: `p-4` → `p-8` (too tight for empty states)

5. **notifications-prefs.tsx** (line 108)
   - Settings card: `p-4` → `p-6 pt-0`

6. **streak-insurance.tsx** (line 189)
   - Feature card: `p-4` → `p-6 pt-0`

7. **community-submit.tsx** (lines 121, 190)
   - Form sections: `p-4` → `p-6 pt-0`
   - Choice preview: `p-3` → `p-4` (stays smaller, is nested)

## Implementation Strategy

### Phase 1: Main Content Cards
Replace all main content `CardContent` instances:
- Find: `<CardContent className="p-4`
- Replace: `<CardContent className="p-6 pt-0`
- Verify: No layout breaks, check spacing looks good

### Phase 2: Nested Cards
Handle nested/compact cards (comments, replies):
- Keep `p-4` for replies/nested content
- Update `p-3` to `p-4` (too cramped)

### Phase 3: Empty States
Ensure all empty states use `p-8`:
- Find: `<CardContent className="p-4 text-center"`
- Replace: `<CardContent className="p-8 text-center"`

### Phase 4: Headers/Footers
Audit all CardHeader/CardFooter instances:
- Should already have `p-6` from component defaults
- Add explicit `className="p-6"` if missing

## Testing Checklist

- [ ] community.tsx - Scenario cards look balanced
- [ ] community-detail.tsx - Comments not too cramped
- [ ] stats.tsx - Stat cards have proper breathing room
- [ ] weekly-recap.tsx - Charts and breakdowns look good
- [ ] notifications-prefs.tsx - Settings card readable
- [ ] streak-insurance.tsx - Feature cards professional
- [ ] community-submit.tsx - Form sections clear

**Visual tests**:
- [ ] Light mode - all cards
- [ ] Dark mode - all cards
- [ ] Mobile (< 640px) - no overflow
- [ ] Tablet (768px) - proper scaling

## Before/After Examples

### Before (community.tsx ScenarioCard)
```tsx
<Card>
  <CardContent className="p-4 space-y-3">
    {/* Feels cramped, text too close to edges */}
  </CardContent>
</Card>
```

### After (community.tsx ScenarioCard)
```tsx
<Card>
  <CardContent className="p-6 pt-0 space-y-3">
    {/* Proper breathing room, professional spacing */}
  </CardContent>
</Card>
```

Note: Since no header, remove `pt-0` in this case:
```tsx
<Card>
  <CardContent className="p-6 space-y-3">
    {/* Correct for cards without headers */}
  </CardContent>
</Card>
```

## Expected Impact

### Metrics
- **Consistency**: 21 → 0 non-standard card paddings
- **Visual Rhythm**: Improved predictability across app
- **Development**: Clearer pattern for future cards

### User Experience
- ✅ More professional, polished feel
- ✅ Content easier to read with proper breathing room
- ✅ Consistent spacing reduces cognitive load
- ✅ Better visual hierarchy

### Performance
- ⚠️ Neutral - pure CSS class changes
- ✅ No runtime impact
- ✅ No additional JavaScript

## Rollback Plan
If issues arise:
1. Git revert the commit
2. Or manually revert specific files
3. All changes are pure className updates, easy to undo

## Future Prevention
- [ ] Add ESLint rule: warn on `p-4` in CardContent
- [ ] Update component docs with examples
- [ ] Add Storybook story showing correct card patterns
- [ ] Code review checklist item for card spacing
