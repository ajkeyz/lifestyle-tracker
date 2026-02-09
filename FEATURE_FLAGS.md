# Feature Flag System

A lightweight feature flag management system using localStorage for enabling/disabling experimental features and debug settings.

## 🚀 Quick Start

### Accessing the Debug Screen

1. **Hidden Gesture**: Tap the app logo **5 times rapidly** (within 2 seconds) on the home page
2. The debug screen will open showing all available feature flags
3. Toggle flags on/off using the switches
4. Changes are saved to localStorage and persist across sessions

### Available Flags

| Flag | Description | Requires Reload |
|------|-------------|-----------------|
| **Experimental Animations** | Enhanced confetti effects with more particles, longer duration, and extra visual effects | No |
| **Premium UI Override** | Force all premium features visible for testing (UI only - doesn't grant backend access) | Yes |
| **New Game Modes** | Enable upcoming game mode variations (timed, survival, etc.) | No |
| **Advanced Analytics** | Extra event tracking and performance monitoring | No |
| **Beta Social Features** | Experimental community challenges and friend competitions | No |

## 🔧 Implementation Details

### Files Created

1. **`client/src/lib/feature-flags.ts`** - Core feature flag module
   - Type-safe flag definitions
   - localStorage persistence
   - Runtime toggle functions
   - Flag statistics

2. **`client/src/components/debug-screen.tsx`** - Debug UI component
   - Modal dialog for flag management
   - Visual indicators for active flags
   - Reload warnings for flags that require page refresh
   - Statistics dashboard

### Example Flags Wired Up

#### 1. Experimental Animations (`experimental_animations`)

**Location:** `client/src/components/confetti.tsx`

**Effects:**
- **Perfect Score**: 2x particle count, wider spread, extra star bursts
- **Streak Milestone**: 1.5x particles, 360° firework burst, longer duration
- Enhanced visual polish for celebrations

**Usage:**
```typescript
const isExperimental = isFeatureEnabled("experimental_animations");
const particleCount = isExperimental ? 6 : 3;
```

#### 2. Premium UI Override (`premium_ui_override`)

**Location:** `client/src/hooks/use-premium.ts`

**Effects:**
- Forces `tier = "pro"` for UI purposes
- Makes all premium features visible:
  - Extended game history
  - Trend charts
  - Category insights
  - Personality insights
- **Important**: UI only - doesn't bypass backend authorization

**Usage:**
```typescript
const hasPremiumOverride = isFeatureEnabled("premium_ui_override");
const tier: MembershipTier = hasPremiumOverride ? "pro" : actualTier;
```

## 📚 API Reference

### Core Functions

```typescript
// Check if a flag is enabled
isFeatureEnabled(flag: FeatureFlag): boolean

// Enable a flag
enableFeature(flag: FeatureFlag): void

// Disable a flag
disableFeature(flag: FeatureFlag): void

// Toggle a flag
toggleFeature(flag: FeatureFlag): boolean

// Get all flags with current state
getAllFeatureFlags(): Array<FeatureFlagConfig & { enabled: boolean }>

// Reset all flags to defaults
resetAllFlags(): void

// Get statistics
getFlagStats(): { total: number; enabled: number; disabled: number; flags: Array<...> }
```

### Adding New Flags

1. **Define the flag** in `client/src/lib/feature-flags.ts`:

```typescript
export type FeatureFlag =
  | "experimental_animations"
  | "premium_ui_override"
  | "your_new_flag";  // Add here

export const FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  // ... existing flags
  your_new_flag: {
    key: "your_new_flag",
    name: "Your New Feature",
    description: "What this flag does",
    defaultEnabled: false,
    requiresReload: false,  // Set to true if page reload needed
  },
};
```

2. **Use the flag** in your component:

```typescript
import { isFeatureEnabled } from "@/lib/feature-flags";

function YourComponent() {
  const isNewFeatureEnabled = isFeatureEnabled("your_new_flag");

  return (
    <div>
      {isNewFeatureEnabled && (
        <NewFeatureComponent />
      )}
    </div>
  );
}
```

## 🎯 Use Cases

### 1. Testing Premium Features
Enable `premium_ui_override` to:
- Test premium UI components without backend changes
- Verify premium layouts and interactions
- Screenshot premium features for marketing

### 2. Debugging Animations
Enable `experimental_animations` to:
- Test enhanced celebration effects
- Verify animation performance
- Preview upcoming visual improvements

### 3. Feature Development
Create a flag for your work-in-progress feature:
- Develop in production safely
- Easy on/off toggle during development
- Gradual rollout to users

### 4. A/B Testing
Use flags to:
- Test different UI variations
- Compare user engagement
- Measure feature adoption

## 🔒 Security Notes

1. **Frontend Only**: All flags are client-side and stored in localStorage
2. **No Backend Bypass**: Flags like `premium_ui_override` only affect UI - backend still validates permissions
3. **Development Tool**: Feature flags are meant for development, testing, and debugging
4. **User-Controllable**: Users can access the debug screen, so don't use flags for access control

## 🐛 Troubleshooting

### Debug screen won't open
- Make sure you're tapping the logo **5 times rapidly** (within 2 seconds)
- Try refreshing the page and tapping again
- Check browser console for errors

### Flag changes not taking effect
- Some flags require page reload (marked with "Reload" badge)
- Click "Reload Now" button in the debug screen
- Check if the flag is actually enabled (green "Active" badge)

### Premium features still hidden
- Make sure `premium_ui_override` flag is enabled
- Click "Reload Page" after enabling the flag
- Note: Some features may still require backend permissions

### localStorage full
- Browser localStorage has size limits (~5-10MB)
- Reset flags with "Reset All" button
- Clear browser data if needed

## 📊 Flag Statistics

Access flag stats programmatically:

```typescript
import { getFlagStats } from "@/lib/feature-flags";

const stats = getFlagStats();
console.log(`Enabled: ${stats.enabled}/${stats.total} flags`);
```

## 🔄 Future Enhancements

Potential improvements:
- [ ] Remote flag configuration (server-controlled)
- [ ] User-specific flag overrides
- [ ] Analytics integration for flag usage tracking
- [ ] Flag expiration dates
- [ ] Flag dependencies (flag A requires flag B)
- [ ] Environment-based defaults (dev vs prod)

## 📝 Best Practices

1. **Descriptive Names**: Use clear, action-oriented flag names
2. **Good Descriptions**: Explain what the flag does and its impact
3. **Default Off**: New experimental features should default to `false`
4. **Document Reload**: Mark flags with `requiresReload: true` if needed
5. **Clean Up**: Remove flags once features are fully rolled out
6. **Test Both States**: Always test with flag on AND off

---

**Storage Key**: `lifestyle_tracker_flags`
**Format**: JSON object with flag keys and boolean values
**Persistence**: localStorage (survives page refreshes, cleared on logout/browser data clear)
