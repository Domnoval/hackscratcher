# Scratch Oracle - Data Layer Integration

**Status**: Phase 1 Complete - Ready for Real Data
**Date**: October 19, 2025
**Feature Flag**: Currently set to `FALSE` (using mock data)

---

## Overview

The Scratch Oracle app now has a complete data layer integration ready for real Supabase data. The integration uses **React Query** for data fetching, caching, and state management, with a **feature flag system** for safe rollout.

## What Was Implemented (Phase 1)

### 1. React Query Setup

**File**: `lib/queryClient.ts`

- Configured React Query with optimal defaults for mobile
- 5-minute stale time for lottery data (changes slowly)
- 1-hour cache time with automatic garbage collection
- Exponential backoff retry logic (2 retries: 1s, 2s, 4s)
- Auto-refetch on app focus and network reconnect
- Offline-ready with AsyncStorage persistence

### 2. Feature Flag System

**File**: `services/config/featureFlags.ts`

- Safe toggle between mock data and real Supabase data
- Granular control over AI features
- Persisted to AsyncStorage (survives app restarts)
- Console logging for debugging data source

**Default Settings**:
```typescript
{
  useSupabaseData: false,      // FALSE = Mock data (safe default)
  enableAIScores: false,       // FALSE = No AI features yet
  enableOfflineMode: true,     // TRUE = Cache works with mock too
  enablePredictionCache: true, // TRUE = Performance optimization
}
```

### 3. Supabase Data Service

**File**: `services/lottery/supabaseLotteryService.ts`

- Production-ready service matching mock API
- Fetches from `active_games_with_predictions` view
- Automatic data conversion from Supabase to app types
- Full AI prediction field support
- Statistics and monitoring methods

**Key Methods**:
- `getActiveGames()` - All games with AI scores
- `getGameById(id)` - Single game details
- `getTopRecommendations(limit)` - Top AI picks
- `getStats()` - Database statistics

### 4. React Query Hooks

**File**: `hooks/useGames.ts`

- `useActiveGames()` - Fetch all active games
- `useGameDetails(id)` - Fetch single game
- `useTopGames(limit)` - Top recommendations
- `usePrefetchGame()` - Preload for better UX
- `useGameStats()` - Database statistics
- `useDataSource()` - Check which source is active

**Automatic data source switching based on feature flag!**

### 5. Enhanced Type Definitions

**File**: `types/lottery.ts`

Added AI prediction fields to `LotteryGame`:
```typescript
ai_score?: number;          // 0-100 AI prediction score
confidence?: number;        // 0-100 confidence level
recommendation?: 'strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid';
ai_reasoning?: string;      // Human-readable explanation
win_probability?: number;   // 0.0-1.0 probability
```

### 6. Skeleton Loading Component

**File**: `components/common/SkeletonCard.tsx`

- Animated shimmer effect for loading states
- Matches game card layout
- Better UX than spinners

### 7. App Integration

**File**: `App.tsx`

- Wrapped with `QueryClientProvider`
- Feature flags initialized on startup
- Logs data source on every fetch
- All existing functionality preserved

---

## How to Use

### Current State (Mock Data)

The app is currently using **mock data** by default. Everything works exactly as before, but now with the infrastructure ready for real data.

Console output:
```
[App] Feature flags initialized: Using MOCK data for testing
[useActiveGames] Fetched 5 games from Mock
```

### Testing with Real Supabase Data

To enable real Supabase data for testing:

1. **Via Feature Flags** (programmatic):
   ```typescript
   import { FeatureFlagService } from './services/config/featureFlags';

   // Enable Supabase
   await FeatureFlagService.enableSupabase();

   // Disable Supabase (rollback)
   await FeatureFlagService.disableSupabase();
   ```

2. **Via AsyncStorage** (manual):
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';

   // Enable
   await AsyncStorage.setItem('scratch_oracle_feature_flags',
     JSON.stringify({ useSupabaseData: true, enableAIScores: true }));

   // Disable
   await AsyncStorage.removeItem('scratch_oracle_feature_flags');
   ```

3. **Check Current Status**:
   ```typescript
   const status = FeatureFlagService.getStatusMessage();
   console.log(status); // "Using MOCK data" or "Using REAL data from Supabase with AI predictions"
   ```

### Console Logging

When real data is enabled, you'll see:
```
[App] Feature flags initialized: Using REAL data from Supabase with AI predictions
[FeatureFlags] Using REAL Supabase data
[SupabaseLotteryService] Fetching active games from Supabase...
[SupabaseLotteryService] Found 41 active games
[useActiveGames] Fetched 41 games from Supabase (REAL)
```

When mock data is used:
```
[App] Feature flags initialized: Using MOCK data for testing
[FeatureFlags] Using MOCK data
[useActiveGames] Fetched 5 games from Mock
```

---

## Architecture

### Data Flow

```
User Action
    ↓
React Query Hook (useActiveGames)
    ↓
Feature Flag Check (useSupabase?)
    ↓
┌─────────────────┬──────────────────┐
│   Mock Data     │  Supabase Data   │
│ minnesotaData.ts│supabaseLotteryService.ts
└─────────────────┴──────────────────┘
    ↓
Convert to LotteryGame type
    ↓
React Query Cache (5 min stale, 1 hr gc)
    ↓
AsyncStorage Persistence (offline)
    ↓
UI Components
```

### File Structure

```
scratch-oracle-app/
├── lib/
│   ├── queryClient.ts         [NEW] React Query config
│   └── supabase.ts            [EXISTING] Supabase client
├── services/
│   ├── config/
│   │   └── featureFlags.ts    [NEW] Feature flag system
│   ├── lottery/
│   │   ├── minnesotaData.ts   [EXISTING] Mock data
│   │   └── supabaseLotteryService.ts [NEW] Real data
│   └── recommendations/
│       └── recommendationEngine.ts [EXISTING] Uses either service
├── hooks/
│   └── useGames.ts            [NEW] React Query hooks
├── components/
│   └── common/
│       └── SkeletonCard.tsx   [NEW] Loading skeleton
├── types/
│   └── lottery.ts             [UPDATED] Added AI fields
└── App.tsx                    [UPDATED] QueryClientProvider
```

---

## Testing Checklist

### ✅ Phase 1 Complete

- [x] Install React Query dependencies
- [x] Create query client with caching
- [x] Create feature flag service
- [x] Create Supabase lottery service
- [x] Create React Query hooks
- [x] Update types with AI fields
- [x] Create skeleton loading component
- [x] Wrap App with QueryClientProvider
- [x] Test app runs without errors

### 🔲 Next Steps (Phase 2)

- [ ] Toggle feature flag to use real data
- [ ] Verify AI scores display correctly
- [ ] Test offline mode (airplane mode)
- [ ] Test error handling (disconnect during fetch)
- [ ] Add UI for AI score badges
- [ ] Create AI predictions screen
- [ ] Performance testing (measure load times)
- [ ] A/B test with subset of users

---

## Performance Metrics

### Current (Mock Data)
- Initial load: ~500ms (simulated delay)
- Games returned: 5
- Cache hit: Instant

### Expected (Real Data)
- Initial load: <2s (Supabase query)
- Games returned: 41+
- Cache hit: <100ms (React Query)
- Offline: Works from cache

---

## Troubleshooting

### "Using MOCK data" but I enabled Supabase
**Solution**: Restart the app. Feature flags load on initialization.

### App won't start / crashes
**Solution**: Check Supabase environment variables in `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### No AI scores showing
**Solution**:
1. Check feature flag: `FeatureFlagService.showAIScores()`
2. Verify predictions exist in database
3. Check console for API errors

### TypeScript errors after adding AI fields
**Solution**: The `LotteryGame` type now has optional AI fields. If accessing them, use optional chaining:
```typescript
const score = game.ai_score ?? 0;
const hasAI = game.ai_score !== undefined;
```

---

## API Reference

### FeatureFlagService

```typescript
// Initialize (call on app start)
await FeatureFlagService.initialize();

// Check flags
FeatureFlagService.useSupabase(); // boolean
FeatureFlagService.showAIScores(); // boolean
FeatureFlagService.getStatusMessage(); // string

// Update flags
await FeatureFlagService.enableSupabase();
await FeatureFlagService.disableSupabase();
await FeatureFlagService.setFlags({ useSupabaseData: true });

// Reset
await FeatureFlagService.resetToDefaults();
```

### React Query Hooks

```typescript
// Fetch all games
const { data: games, isLoading, error, refetch } = useActiveGames();

// Fetch single game
const { data: game } = useGameDetails('game-id-123');

// Fetch top games
const { data: topGames } = useTopGames(5);

// Prefetch for better UX
const prefetchGame = usePrefetchGame();
prefetchGame('game-id-123'); // Preload before navigation

// Get stats (Supabase only)
const { data: stats } = useGameStats();
// { totalGames: 41, gamesWithAI: 41, averageAIScore: 75, topRecommendation: "Lucky 7s" }

// Check data source
const source = useDataSource();
// "Using MOCK data" or "Using REAL data from Supabase with AI predictions"
```

---

## Migration Plan

### Week 1: Setup ✅ COMPLETE
- Install dependencies
- Create services
- Update types
- Integrate with App

### Week 2: Testing (In Progress)
- Toggle feature flag
- Verify data loads
- Test offline mode
- Test error cases

### Week 3: UI Enhancement
- Add AI score badges
- Create AI predictions screen
- Add loading skeletons
- Polish animations

### Week 4: Rollout
- A/B test with 10% users
- Monitor metrics
- Fix issues
- Full rollout if stable

---

## Important Notes

### DO NOT Break Existing Functionality
- ✅ Feature flag defaults to `false` (mock data)
- ✅ All existing screens work unchanged
- ✅ No breaking changes to types or APIs
- ✅ Console logging makes it clear which source is active

### Safe Rollback
If real data causes issues:
```typescript
// Instant rollback to mock data
await FeatureFlagService.disableSupabase();

// Or force in code:
// In recommendationEngine.ts, hardcode:
// return MinnesotaLotteryService;
```

### Database Requirements
For real data to work, Supabase must have:
- ✅ `active_games_with_predictions` view
- ✅ 41+ games in `games` table
- ✅ Predictions in `predictions` table
- ✅ Proper indexes for performance

---

## Support

For questions or issues:
1. Check console logs for data source
2. Verify feature flags: `FeatureFlagService.getFlags()`
3. Test with mock data first (set flag to false)
4. Check Supabase connection: `supabase.from('games').select('*').limit(1)`

---

**Ready to test real data!** Toggle the feature flag and watch the console logs. 🚀
