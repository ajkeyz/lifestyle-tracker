# UI Consistency Spec - Lifestyle Tracker

> Current patterns and standards for maintaining visual consistency across the app

## Color System

### Primary Palette
- **Primary (Emerald)**: `hsl(160 84% 39%)` - Main CTAs, brand elements
- **Accent (Gold)**: `hsl(43 96% 56%)` - Highlights, rewards, premium features
- **Destructive (Red)**: `hsl(0 84% 60%)` - Errors, warnings, scam indicators

### Semantic Colors
- **Background**: `hsl(150 10% 97%)` light / `hsl(160 20% 6%)` dark
- **Card**: `hsl(0 0% 100%)` light / `hsl(160 18% 9%)` dark
- **Muted**: `hsl(150 8% 95%)` light / `hsl(160 15% 12%)` dark

### Category Colors (Scenario Cards)
Consistent color mapping across all category badges:
- **Tech**: Blue (`chart-4`)
- **Travel**: Primary emerald
- **Lifestyle**: Accent gold
- **Scam**: Destructive red
- **Investing**: Purple (`chart-5`)
- **Debt**: Orange
- **Career**: Blue
- **Relationships**: Pink

## Typography Scale

### Font Families
```css
--font-sans: 'Inter', 'Plus Jakarta Sans', system-ui
--font-display: 'Space Grotesk', 'Plus Jakarta Sans'
--font-serif: Georgia, serif
--font-mono: 'Fira Code', Menlo
```

### Type Scale
- **Headings**: Use `font-display` with `tracking-tight`
  - H1: `text-4xl font-bold` (36px)
  - H2: `text-3xl font-bold` (30px)
  - H3: `text-2xl font-semibold` (24px) - Card titles
  - H4: `text-xl font-semibold` (20px)
  - H5: `text-lg font-semibold` (18px)

- **Body**: Use `font-sans`
  - Base: `text-base` (16px)
  - Small: `text-sm` (14px) - Card descriptions, metadata
  - XSmall: `text-xs` (12px) - Badges, labels

- **Muted Text**: `text-muted-foreground` for secondary info

## Spacing System

### Base Unit
`--spacing: 0.25rem` (4px) - Use multiples of 4

### Common Patterns
- **Card Padding**: `p-6` (24px) header/footer, `pt-0` for content
- **Stack Spacing**: `space-y-4` (16px) for related content
- **Grid Gaps**: `gap-4` (16px) or `gap-6` (24px)
- **Button Gaps**: `gap-2` (8px) for icon + text
- **Section Margins**: `mb-6` or `mb-8` between major sections

## Border Radius

```css
--radius: .625rem (10px)
lg: .5625rem (9px)
md: .375rem (6px)
sm: .1875rem (3px)
```

### Usage
- **Cards**: `rounded-xl` (12px)
- **Buttons**: `rounded-md` (6px)
- **Badges**: `rounded-md` (6px)
- **Avatars**: `rounded-full`
- **Glass cards**: `rounded-xl` for premium feel

## Shadow Scale

Defined in CSS variables with careful elevation:

```css
--shadow-xs: 0px 1px 3px 0px rgba(0,0,0,0.04), 0px 1px 2px 0px rgba(0,0,0,0.02)
--shadow-sm: 0px 2px 4px 0px rgba(0,0,0,0.05), 0px 1px 2px 0px rgba(0,0,0,0.03)
--shadow: 0px 4px 6px -1px rgba(0,0,0,0.07), 0px 2px 4px 0px rgba(0,0,0,0.04)
--shadow-md: 0px 6px 12px -2px rgba(0,0,0,0.08), 0px 3px 6px 0px rgba(0,0,0,0.05)
--shadow-lg: 0px 12px 24px -4px rgba(0,0,0,0.10), 0px 4px 8px 0px rgba(0,0,0,0.06)
```

### Elevation Hierarchy
1. **Base**: `shadow-sm` - Cards at rest
2. **Interactive**: `shadow-xs` - Badges, small components
3. **Hover**: `hover-elevate` (adds `--elevate-1`)
4. **Active**: `active-elevate-2` (adds `--elevate-2`)
5. **Modals**: `shadow-lg` - Dialogs, popovers
6. **Hero**: `shadow-xl` - Premium features, celebrations

## Button Hierarchy

### Primary Actions
```tsx
<Button variant="default">
  Play Daily Drop
</Button>
```
- Background: `bg-primary`
- Border: `border-primary-border`
- Used for: Main CTAs, game start, confirmations

### Secondary Actions
```tsx
<Button variant="secondary">
  View Stats
</Button>
```
- Background: `bg-secondary`
- Used for: Navigation, secondary features

### Tertiary Actions
```tsx
<Button variant="outline">
  Cancel
</Button>
```
- Background: Transparent, inherits from context
- Border: `border-button-outline`
- Used for: Dismiss, back, optional actions

### Ghost Buttons
```tsx
<Button variant="ghost">
  <Settings />
</Button>
```
- No visible border/background at rest
- Used for: Icon buttons, subtle actions

### Sizes
- `size="lg"`: Hero CTAs (40px min-height)
- `size="default"`: Standard (36px min-height)
- `size="sm"`: Compact UI (32px min-height)
- `size="icon"`: Square icon buttons (36x36px)

## Card Patterns

### Standard Card
```tsx
<Card className="p-6">
  <CardHeader className="p-6">
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    Content
  </CardContent>
</Card>
```

### Glass Card (Premium)
```tsx
<GlassCard blur="md" gradient glow>
  Premium content
</GlassCard>
```
- Use for: Results, celebrations, premium features
- Adds: Backdrop blur, subtle gradient, glow effect

### Interactive Cards
- Add `cursor-pointer` for clickable cards
- Use `hover:shadow-md transition-shadow` for lift effect
- Optional: TiltCard wrapper for 3D effect

## Empty States

### Standard Pattern
```tsx
<EmptyState
  type="no-friends"
  actionLabel="Add Friends"
  onAction={() => navigate("/friends")}
/>
```

### Anatomy
1. **Icon**: 80x80px rounded-2xl gradient background
2. **Title**: `text-lg font-display font-bold`
3. **Description**: `text-sm text-muted-foreground max-w-xs`
4. **Action Button**: Primary variant with Sparkles icon

### Animation Sequence
- Icon: Scale 0.8 → 1.0 (spring)
- Content: Fade in after 0.2s
- Button: Slide up after 0.3s

## Icon Usage

### Sizes
- **Hero**: 48px - Large feature icons
- **Default**: 16px - `w-4 h-4` inline with text
- **Large**: 24px - `w-6 h-6` standalone icons
- **Badge Icons**: 14px - Category indicators

### Source
- Primary: Lucide React icons
- Consistent visual weight across app
- Always include descriptive text/aria-label

## Loading States

### Skeleton Pattern
```tsx
<Skeleton className="h-4 w-32" /> // Text
<Skeleton className="h-10 w-full" /> // Button
<Skeleton className="h-48 w-full rounded-xl" /> // Card
```

### Usage
- Match exact dimensions of content
- Use multiple stacked for complex UI
- Respect spacing of actual content
- Optional: ShimmerSkeleton for premium feel

## Animation Standards

### Motion Principles
1. **Subtle by default**: Avoid distracting animations
2. **Purposeful**: Enhance comprehension, don't just add movement
3. **Fast**: 200-400ms duration typical
4. **Respect prefers-reduced-motion**

### Common Patterns
```tsx
// Page enter
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

// Stagger children
<motion.div
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.div variants={staggerItem} key={item.id}>
  ))}
</motion.div>

// Hover scale
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
```

### Easing
- **Standard**: `ease-out` for enters
- **Snappy**: `ease-in` for exits
- **Spring**: `type: "spring"` for playful UI (badges, rewards)

## Badge Variants

### Default (Primary)
```tsx
<Badge>New</Badge>
```
- Solid primary background
- High contrast text

### Secondary
```tsx
<Badge variant="secondary">Beta</Badge>
```
- Muted background
- Lower contrast

### Outline
```tsx
<Badge variant="outline">Category</Badge>
```
- Transparent background
- Visible border
- Inherits text color from context

### Destructive
```tsx
<Badge variant="destructive">Scam</Badge>
```
- Red background
- Used for warnings, errors, scam categories

## Form Patterns

### Input Fields
- Height: `h-10` (40px)
- Padding: `px-3 py-2`
- Border: `border-input`
- Focus: `focus-visible:ring-1 focus-visible:ring-ring`

### Labels
- `text-sm font-medium`
- Positioned above input with `mb-2`

### Error States
- Border: `border-destructive`
- Text: `text-sm text-destructive` below input

### Helper Text
- `text-xs text-muted-foreground`
- Below input, non-error state

## Responsive Breakpoints

Following Tailwind defaults:
- **sm**: 640px - Small tablets
- **md**: 768px - Tablets
- **lg**: 1024px - Small laptops
- **xl**: 1280px - Large screens

### Mobile-First Patterns
- Stack cards vertically on mobile
- Convert tabs to select dropdowns < md
- Hide secondary info on small screens
- Use bottom navigation on mobile

## Accessibility

### Focus States
- All interactive elements have visible focus rings
- `focus-visible:ring-1 focus-visible:ring-ring`
- Never use `outline-none` without replacement

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Primary buttons: 21:1 contrast ratio
- Muted text: 7:1 contrast ratio

### Keyboard Navigation
- Logical tab order
- Escape closes modals/menus
- Arrow keys for lists/tabs
- Enter/Space activate buttons

### Screen Readers
- Semantic HTML elements
- ARIA labels for icon-only buttons
- Live regions for dynamic content
- Skip links for navigation

## Best Practices

### DOs ✅
- Use semantic color names (`bg-primary` not `bg-green-500`)
- Maintain consistent spacing multiples of 4
- Use design tokens from CSS variables
- Match animation timing across similar interactions
- Test in both light and dark modes
- Provide loading states for async actions
- Use Empty States for zero-data scenarios

### DON'Ts ❌
- Don't use raw hex colors
- Don't mix spacing values (stick to 4px multiples)
- Don't create new button variants (use existing)
- Don't animate on every interaction
- Don't use auto-generated IDs for testability
- Don't skip error states in forms
- Don't hide critical info on mobile

---

*This spec reflects patterns observed in production code. Update as design system evolves.*
