# Daily Drop - Exact Diffs for Implementation

## File 1: client/src/pages/game.tsx

### Diff 1: Update imports
```diff
 import { ScenarioCard } from "@/components/scenario-card";
+import { ProgressPill } from "@/components/progress-pill";
 import { ThemeToggle } from "@/components/theme-toggle";
```

### Diff 2: Replace progress indicator in header (around line 213)
```diff
           <div className="flex items-center gap-3">
-            {!isLoading && currentScenario && (
-              <div className="text-sm font-medium text-muted-foreground">
-                {currentIndex + 1} / {totalScenarios}
-              </div>
-            )}
+            {!isLoading && currentScenario && (
+              <ProgressPill
+                current={currentIndex + 1}
+                total={totalScenarios}
+              />
+            )}
             <ThemeToggle />
           </div>
```

### Diff 3: Improve Continue button (around line 317)
```diff
             {currentIndex < totalScenarios - 1 ? (
               <Button
                 onClick={handleNext}
                 disabled={!showResults[currentScenario.id]}
                 size="lg"
-                className="w-full"
+                className="w-full h-14 text-base font-semibold"
                 aria-label="Continue to next question"
                 data-testid="button-next"
               >
```

### Diff 4: Improve Submit button (around line 329)
```diff
             ) : (
               <Button
                 onClick={handleSubmit}
                 disabled={!allAnswered || submitMutation.isPending}
                 size="lg"
-                className="w-full"
+                className="w-full h-14 text-base font-semibold"
                 aria-label="Submit your answers"
                 data-testid="button-submit"
               >
```

### Diff 5 (Optional): Use improved scenario card
```diff
 import { ScenarioCard } from "@/components/scenario-card";
+import { ScenarioCard as ScenarioCardImproved } from "@/components/scenario-card-improved";
 import { ProgressPill } from "@/components/progress-pill";
```

And in the render (around line 299):
```diff
-              <ScenarioCard
+              <ScenarioCardImproved
                 scenario={currentScenario}
                 selectedChoice={answers[currentScenario.id] || null}
                 onSelectChoice={handleSelectChoice}
                 showResult={showResults[currentScenario.id] || false}
                 questionNumber={currentIndex + 1}
                 totalQuestions={totalScenarios}
               />
```

---

## File 2: client/src/components/scenario-card.tsx (Optional Full Replacement)

### Option A: Minimal Updates to Existing Component

#### Diff 1: Improve choice button sizing
```diff
 <button
   key={choice.label}
   onClick={() => onSelectChoice(choice.label)}
   disabled={showResult}
-  className={cn(
-    "w-full p-4 rounded-lg border-2 text-left transition-all",
+  className={cn(
+    "w-full min-h-[56px] p-4 rounded-lg border-2 text-left transition-all",
+    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
```

#### Diff 2: Add ARIA labels to choices
```diff
 <button
   key={choice.label}
   onClick={() => onSelectChoice(choice.label)}
   disabled={showResult}
+  role="radio"
+  aria-checked={isSelected}
+  aria-label={`Choice ${choice.label}: ${choice.text}`}
   className={cn(
```

### Option B: Replace with Improved Component
Simply copy `scenario-card-improved.tsx` to `scenario-card.tsx`.

---

## Summary of Changes

### Minimal Changes (Safe, Low Risk)
1. Add ProgressPill component import
2. Replace progress text with ProgressPill
3. Increase button heights to h-14
4. Add min-h-[56px] to choice buttons
5. Add ARIA labels to choices

**Total Changes**: 5 small diffs across 2 files
**Lines Changed**: ~15 lines
**Risk**: Very Low

### Full Replacement (Recommended for Best Experience)
1. All minimal changes above
2. Use ScenarioCardImproved component
3. Includes all new micro-interactions
4. Includes QuestionHeader and ChoiceCard components

**Total Changes**: 4 new components + 2 modified files
**Lines Changed**: ~400 lines
**Risk**: Low (isolated components)

---

## Application Steps

### Step 1: Create New Components
```bash
# These files already exist:
# - client/src/components/choice-card.tsx
# - client/src/components/progress-pill.tsx
# - client/src/components/question-header.tsx
# - client/src/components/scenario-card-improved.tsx
```

### Step 2: Apply Minimal Changes to game.tsx
```bash
# Manually apply Diffs 1-4 from File 1 above
# Or use your editor's find/replace
```

### Step 3 (Optional): Switch to Improved Card
```bash
# Apply Diff 5 from File 1 above
# This enables the full improved experience
```

### Step 4: Test
```bash
npm run dev
# Navigate to /game
# Test all interactions
```

---

## Quick Copy-Paste Sections

### For game.tsx - Add Import
```typescript
import { ProgressPill } from "@/components/progress-pill";
```

### For game.tsx - Replace Progress Indicator
```typescript
{!isLoading && currentScenario && (
  <ProgressPill
    current={currentIndex + 1}
    total={totalScenarios}
  />
)}
```

### For game.tsx - Button Classes
```typescript
className="w-full h-14 text-base font-semibold"
```

### For scenario-card.tsx - Min Height
```typescript
className="w-full min-h-[56px] p-4 rounded-lg border-2 text-left transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### For scenario-card.tsx - ARIA Props
```typescript
role="radio"
aria-checked={isSelected}
aria-label={`Choice ${choice.label}: ${choice.text}`}
```

---

## Verification Commands

### Check for TypeScript Errors
```bash
npm run check
```

### Run Tests
```bash
npm test
```

### Build Check
```bash
npm run build
```

### Visual Regression Test
```bash
# Manual: Open /game in browser
# Compare with screenshots in DAILY_DROP_IMPROVEMENTS.md
```

---

## Git Commit Message
```
feat(game): improve Daily Drop UX with NYT Games × Duolingo style

- Add ProgressPill component for compact progress display
- Increase button touch targets (h-14, min-h-[56px] choices)
- Add micro-interactions (hover lift, tap scale, shake on wrong)
- Improve visual hierarchy (category → context → question flow)
- Enhance accessibility (ARIA labels, focus states, touch targets)
- Extract reusable ChoiceCard, QuestionHeader components

Implements NYT Games clean typography and Duolingo playful animations
while maintaining existing game logic and data flow.
```

---

## Files List (Complete)

### New Files (4)
1. `client/src/components/choice-card.tsx` (176 lines)
2. `client/src/components/progress-pill.tsx` (36 lines)
3. `client/src/components/question-header.tsx` (84 lines)
4. `client/src/components/scenario-card-improved.tsx` (104 lines)

### Modified Files (2)
5. `client/src/pages/game.tsx` (15 lines changed)
6. `client/src/components/scenario-card.tsx` (optional, 8 lines changed OR full replacement)

### Documentation Files (3)
7. `DAILY_DROP_IMPROVEMENTS.md` (original plan)
8. `DAILY_DROP_IMPLEMENTATION.md` (this guide)
9. `DAILY_DROP_DIFFS.md` (exact diffs)

**Total Files Touched**: 6 source files (4 new, 2 modified)
