# Scratch Oracle - Data Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                              │
│                   (Get Recommendations)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT QUERY HOOKS                             │
│                    hooks/useGames.ts                             │
│  • useActiveGames()  • useGameDetails()  • useTopGames()        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE FLAG CHECK                            │
│                services/config/featureFlags.ts                   │
│              FeatureFlagService.useSupabase()                    │
│                                                                  │
│            DEFAULT: false (Use Mock Data)                        │
└──────────────────┬──────────────────────┬───────────────────────┘
                   │                      │
        false ◄────┘                      └────► true
           │                                      │
           ▼                                      ▼
┌──────────────────────┐            ┌──────────────────────────┐
│    MOCK DATA         │            │   SUPABASE DATA          │
│  minnesotaData.ts    │            │supabaseLotteryService.ts │
│                      │            │                          │
│  • 5 hardcoded games │            │  • 41+ real games        │
│  • Simulated delay   │            │  • AI predictions        │
│  • Static prizes     │            │  • Live updates          │
└──────────┬───────────┘            └───────────┬──────────────┘
           │                                    │
           └─────────────┬──────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA TRANSFORMATION                            │
│            Convert to LotteryGame Type                           │
│                                                                  │
│  Database Fields        →        App Fields                     │
│  ─────────────────              ─────────────                   │
│  game_name              →        name                           │
│  ticket_price           →        price                          │
│  ai_score               →        ai_score                       │
│  recommendation         →        recommendation                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT QUERY CACHE                             │
│                    lib/queryClient.ts                            │
│                                                                  │
│  Stale Time:    5 minutes                                       │
│  Cache Time:    1 hour                                          │
│  Retry Logic:   2 retries (1s, 2s, 4s)                         │
│  Refetch:       On focus, reconnect                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ASYNCSTORAGE PERSISTENCE                       │
│              (Optional - for offline support)                    │
│                                                                  │
│  Key: SCRATCH_ORACLE_QUERY_CACHE                                │
│  Survives: App restarts, offline mode                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI COMPONENTS                               │
│                                                                  │
│  App.tsx (Main Screen)                                          │
│    ├── RecommendationCard  ← Shows AI score if available        │
│    ├── SkeletonCard       ← Loading state                       │
│    └── ErrorBoundary      ← Error handling                      │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── QueryClientProvider  ← NEW: Wraps entire app
│   └── AppContent
│       ├── AgeGateScreen (if not verified)
│       └── MainApp (if verified)
│           ├── Budget Input
│           ├── Get Recommendations Button
│           └── FlatList (Recommendations)
│               ├── SkeletonCard (loading)  ← NEW
│               └── RecommendationCard[]
│                   ├── Game Name
│                   ├── Price
│                   ├── AI Score Badge  ← NEW (when enabled)
│                   ├── EV Container
│                   ├── Metrics Row
│                   └── Reasons List
```

## Service Layer

```
services/
├── lottery/
│   ├── minnesotaData.ts              [EXISTING]
│   │   └── MinnesotaLotteryService
│   │       ├── getActiveGames()
│   │       ├── getGameById(id)
│   │       └── refreshGameData()
│   │
│   └── supabaseLotteryService.ts    [NEW]
│       └── SupabaseLotteryService
│           ├── getActiveGames()      ← Fetches from view
│           ├── getGameById(id)       ← Fetches with prize_tiers
│           ├── getTopRecommendations() ← Sorted by AI score
│           ├── refreshGameData()     ← No-op (always fresh)
│           ├── validateGameData()
│           └── getStats()            ← Database statistics
│
├── config/
│   └── featureFlags.ts               [NEW]
│       └── FeatureFlagService
│           ├── initialize()          ← Load from AsyncStorage
│           ├── useSupabase()         ← true/false
│           ├── showAIScores()        ← true/false
│           ├── enableSupabase()      ← Toggle on
│           ├── disableSupabase()     ← Toggle off
│           ├── setFlags()
│           ├── getFlags()
│           ├── resetToDefaults()
│           └── getStatusMessage()
│
└── recommendations/
    └── recommendationEngine.ts       [MODIFIED]
        └── RecommendationEngine
            ├── getRecommendations()  ← Uses feature flag to pick service
            ├── incorporateAIScore()  ← NEW: Blends EV + AI
            └── generateReasons()     ← NEW: Includes AI reasoning
```

## Data Types

```typescript
// Core Type (UPDATED)
interface LotteryGame {
  // Existing fields
  id: string;
  name: string;
  price: number;
  overall_odds: string;
  status: 'Active' | 'Retired' | 'New';
  prizes: Prize[];
  launch_date: string;
  last_updated: string;
  total_tickets?: number;

  // NEW: AI Prediction Fields
  ai_score?: number;          // 0-100
  confidence?: number;        // 0-100
  recommendation?: 'strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid';
  ai_reasoning?: string;      // "Fresh game with high prize availability..."
  win_probability?: number;   // 0.0-1.0
}

// Prize Type (UPDATED)
interface Prize {
  tier: string;
  amount: number;
  total: number;
  remaining: number;
  odds?: string;              // NEW: "1 in 100,000"
}

// Feature Flags (NEW)
interface FeatureFlags {
  useSupabaseData: boolean;      // Main toggle
  enableAIScores: boolean;       // Show AI features
  enableOfflineMode: boolean;    // Cache to AsyncStorage
  enablePredictionCache: boolean;// Cache predictions
}
```

## State Flow

```
1. APP STARTUP
   └── Initialize FeatureFlagService
       └── Load flags from AsyncStorage
           └── Default: { useSupabaseData: false, ... }

2. USER CLICKS "GET RECOMMENDATIONS"
   └── RecommendationEngine.getRecommendations(budget)
       └── Check FeatureFlagService.useSupabase()
           ├── false → MinnesotaLotteryService.getActiveGames()
           └── true  → SupabaseLotteryService.getActiveGames()
               └── React Query cache check
                   ├── Cache HIT  → Return cached data (instant)
                   └── Cache MISS → Fetch from Supabase
                       └── supabase.from('active_games_with_predictions').select('*')
                           └── Transform to LotteryGame[]
                               └── Cache for 5 minutes
                                   └── Persist to AsyncStorage
                                       └── Return to UI

3. USER RETURNS TO APP (OFFLINE)
   └── React Query restores from AsyncStorage
       └── Shows cached recommendations
           └── Displays "Offline" banner if needed
```

## Caching Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                       CACHE LAYERS                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: MEMORY (React Query)                               │
│  ─────────────────────────────                               │
│  • Stale Time: 5 minutes                                     │
│  • GC Time: 1 hour                                           │
│  • Super fast: <100ms access                                 │
│  • Lost on: App restart                                      │
│                                                               │
│  Layer 2: ASYNCSTORAGE (Persistence)                         │
│  ──────────────────────────────────                          │
│  • Throttle: 1 second                                        │
│  • Survives: App restarts                                    │
│  • Slower: ~200ms access                                     │
│  • Lost on: App uninstall                                    │
│                                                               │
│  Layer 3: SUPABASE (Source of Truth)                         │
│  ─────────────────────────────────                           │
│  • Always accurate                                           │
│  • Requires: Network connection                              │
│  • Slower: 1-2s fetch time                                   │
│  • Updates: Realtime via websockets (future)                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘

Request Flow:
1. Check Memory Cache → HIT? Return immediately
2. Check AsyncStorage → HIT? Restore to memory + return
3. Fetch from Supabase → Store in memory + AsyncStorage
```

## Error Handling

```
TRY: Fetch from Supabase
│
├── SUCCESS
│   └── Return data + cache
│
└── FAILURE
    ├── Network Error
    │   ├── Retry 1 (after 1s)
    │   ├── Retry 2 (after 2s)
    │   └── Give Up → Check AsyncStorage
    │       ├── Cache exists → Use stale data (show warning)
    │       └── No cache → Show error + retry button
    │
    ├── Auth Error
    │   └── Check Supabase keys in .env
    │       └── Show error message
    │
    └── Database Error
        └── Log to console
            └── Fallback to mock data (if flag allows)
```

## Feature Flag States

```
STATE 1: DEVELOPMENT (Current)
─────────────────────────────
useSupabaseData:      false  ✓ Safe default
enableAIScores:       false  ✓ No AI UI yet
enableOfflineMode:    true   ✓ Cache works with mock
enablePredictionCache: true  ✓ Performance optimization

Result: Uses mock data, no AI features visible


STATE 2: TESTING
────────────────
useSupabaseData:      true   ← TOGGLE THIS
enableAIScores:       true   ← AUTO-ENABLED
enableOfflineMode:    true
enablePredictionCache: true

Result: Uses real Supabase data, AI scores visible


STATE 3: PRODUCTION
───────────────────
useSupabaseData:      true
enableAIScores:       true
enableOfflineMode:    true
enablePredictionCache: true
+ Remove feature flags (hardcode true)
+ Delete mock data service

Result: Always uses Supabase, AI features on
```

## Performance Optimizations

```
IMPLEMENTED:
✓ React Query caching (5 min stale, 1 hr gc)
✓ Exponential backoff retries
✓ Auto-refetch on focus/reconnect
✓ Stale-while-revalidate pattern
✓ AsyncStorage persistence

FUTURE:
○ Prefetching on card press
○ Background refresh (expo-task-manager)
○ Image caching (expo-image)
○ FlatList optimization (windowSize, getItemLayout)
○ Memoization (React.memo, useMemo)
○ Code splitting (React.lazy)
```

---

**Architecture Ready for Scale!** 🚀
