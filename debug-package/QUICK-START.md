# 🚀 Quick Start - Debug Package

## TL;DR - The Problem
App crashes on launch with `TypeError: undefined is not a function` because `WinTracker` component uses Supabase even though we disabled Supabase initialization everywhere else.

## The Fix (90% confident this works)
Comment out `WinTracker` in `components/recommendations/RecommendationCard.tsx`:

**Line 4:**
```typescript
// import { WinTracker } from '../tracking';
```

**Lines 48-54:**
```typescript
{/* DISABLED: Requires Supabase
<WinTracker
  gameId={item.gameId}
  gameName={item.game.name}
  gamePrice={item.game.price}
/>
*/}
```

Then rebuild and test.

## Files to Check
1. **App.tsx** - Main component (line 114 has commented Supabase init)
2. **components/recommendations/RecommendationCard.tsx** - Renders WinTracker (line 49)
3. **components/tracking/WinTracker.tsx** - Uses Supabase (line 12 import, line 67 usage)
4. **lib/supabase.ts** - Supabase client init (line 37)

## Full Details
See **DEBUG-HANDOFF-PACKAGE.md** for complete information.

## Test Build
- **Current version:** 1.0.10 (crashes)
- **Next version:** 1.0.11 (with fix)
- **Build command:** `npx eas build --platform android --profile preview --non-interactive`
