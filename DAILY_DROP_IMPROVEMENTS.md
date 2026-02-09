# Daily Drop UI Improvements - NYT Games × Duolingo Style

## Goals
- **Better Hierarchy**: Clear separation of context, question, choices
- **Micro-interactions**: Spring animations, pressed states, smooth transitions
- **Accessibility**: Larger touch targets, better labels, VoiceOver support
- **Polish**: NYT Games typography + Duolingo celebration

## Components to Create

### 1. ChoiceCard Component
**File**: `client/src/components/choice-card.tsx`
- Reusable choice button with animations
- Pressed state (scale down)
- Result states (correct/incorrect)
- Min 44px touch target
- Accessible labels

### 2. ProgressPill Component
**File**: `client/src/components/progress-pill.tsx`
- Compact progress indicator
- Shows current/total questions
- Animated transitions
- Accessible progress info

### 3. QuestionCard Component (extract from ScenarioCard)
**File**: `client/src/components/question-card.tsx`
- Clean question display
- Context badge
- Category icon
- Better typography hierarchy

## Files to Modify

### 1. game.tsx
**Changes**:
- Improved layout structure
- Better progress UI
- Use new components
- Enhanced accessibility labels

### 2. scenario-card.tsx
**Changes**:
- Simplify to use ChoiceCard components
- Better hierarchy (question at top, choices grid below)
- Improved spacing
- Context as subtle card above question

## Key Improvements

### Visual Hierarchy
```
Before:                    After:
┌─────────────┐           ┌─────────────┐
│ [Cat] Q1/5  │           │   Q 1 of 5  │  <- Clear pill
│ Timer: 15s  │           │             │
│             │           │ [Context]   │  <- Subtle context card
│ Context...  │           │             │
│             │           │ Question?   │  <- Large, bold question
│ Question?   │           │             │
│             │           │ ┌─────────┐ │
│ [A] Choice  │           │ │  Choice │ │  <- Card-style choices
│ [B] Choice  │           │ │  Choice │ │  <- with animations
│ [C] Choice  │           │ │  Choice │ │
│ [D] Choice  │           │ └─────────┘ │
└─────────────┘           └─────────────┘
```

### Micro-interactions
- **Tap/Click**: Scale down (0.95) with spring
- **Hover**: Subtle lift (2px translate-y)
- **Correct**: Celebrate with scale pulse + confetti
- **Incorrect**: Shake animation
- **Transition**: Slide in/out with ease-out

### Accessibility
- Touch targets: 44px minimum (WCAG AAA)
- ARIA labels: Question number, choice letters
- VoiceOver: Proper role="radiogroup" for choices
- Keyboard: Already supports 1-4 keys
- Contrast: Maintain WCAG AA (4.5:1)

## Implementation Order
1. Create ChoiceCard component
2. Create ProgressPill component
3. Update game.tsx layout
4. Refactor scenario-card.tsx to use new components
5. Test accessibility
6. Visual QA

---

## Detailed Changes Below
