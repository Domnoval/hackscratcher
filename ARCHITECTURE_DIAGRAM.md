# Scratch Oracle - Integration Architecture

**Visual guide to data flow and component relationships**

---

## Current Architecture (Mock Data)

```
┌──────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  - Age verification                                          │
│  - Budget input                                              │
│  - Recommendation display                                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ calls getRecommendations()
                     ↓
┌──────────────────────────────────────────────────────────────┐
│              RecommendationEngine                            │
│  - Filter by budget                                          │
│  - Calculate scores                                          │
│  - Generate reasons                                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ calls getActiveGames()
                     ↓
┌──────────────────────────────────────────────────────────────┐
│           MinnesotaLotteryService (MOCK)                     │
│  - 5 hardcoded games                                         │
│  - Simulated API delay (500ms)                               │
│  - No AI scores                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Future Architecture (Supabase Integration)

```
┌──────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  - Wrapped in QueryClientProvider                           │
│  - Displays AI score badges                                  │
│  - Shows loading skeletons                                   │
│  - Handles offline banner                                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ useActiveGames() hook
                     ↓
┌──────────────────────────────────────────────────────────────┐
│                  React Query Layer                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Query Cache (Memory)                      │  │
│  │  - Stores fetched games                                │  │
│  │  - Auto-refetches when stale (5 min)                  │  │
│  │  - Background updates every hour                       │  │
│  └─────────────────────┬──────────────────────────────────┘  │
│                        │                                      │
│                        │ if cache miss or stale               │
│                        ↓                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │       AsyncStorage (Offline Persistence)               │  │
│  │  - Persists cache to disk                              │  │
│  │  - Survives app restarts                               │  │
│  │  - Enables offline mode                                │  │
│  └─────────────────────┬──────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         │ if offline cache miss
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                   Feature Flag Service                       │
│  useSupabase: true/false ← Controls data source              │
└────────────────────┬────────────┬────────────────────────────┘
                     │            │
        if false     │            │     if true
                     ↓            ↓
         ┌─────────────────┐  ┌──────────────────────┐
         │ Minnesota       │  │ Supabase             │
         │ LotteryService  │  │ LotteryService       │
         │ (MOCK)          │  │ (REAL DATA)          │
         │                 │  │                      │
         │ - 5 games       │  │ - 41 games           │
         │ - No AI scores  │  │ - AI predictions     │
         └─────────────────┘  └──────┬───────────────┘
                                     │
                                     │ API calls
                                     ↓
┌──────────────────────────────────────────────────────────────┐
│                  Supabase Database                           │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │   games table    │  │ predictions      │                 │
│  │  (41 rows)       │  │ table (41 rows)  │                 │
│  │                  │  │                  │                 │
│  │ - id             │  │ - game_id        │                 │
│  │ - game_name      │  │ - ai_score       │                 │
│  │ - ticket_price   │  │ - confidence     │                 │
│  │ - top_prize      │  │ - recommendation │                 │
│  │ - remaining      │  │ - reasoning      │                 │
│  └────────┬─────────┘  └──────────┬───────┘                 │
│           │                       │                          │
│           └───────────┬───────────┘                          │
│                       │                                      │
│  ┌────────────────────▼──────────────────────────┐           │
│  │  active_games_with_predictions (VIEW)        │           │
│  │  Joins games + predictions for performance   │           │
│  └───────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── QueryClientProvider (NEW)
│   └── PersistQueryClientProvider (NEW)
│       └── SafeAreaView
│           ├── StatusBar
│           └── ScrollView
│               ├── OfflineBanner (NEW - shown when offline)
│               │
│               ├── AgeGate (if not verified)
│               │   ├── Title
│               │   ├── Disclaimers
│               │   └── VerifyButton
│               │
│               └── MainApp (if verified)
│                   ├── Header
│                   ├── BudgetInput
│                   ├── RecommendButton
│                   │
│                   └── FlatList (Recommendations)
│                       └── GameCard (repeated)
│                           ├── CardHeader
│                           │   ├── GameTitle
│                           │   └── GamePrice
│                           │
│                           ├── AIScoreBadge (NEW)
│                           │   ├── ScoreCircle
│                           │   ├── ConfidenceLevel
│                           │   └── RecommendationBadge (NEW)
│                           │
│                           ├── EVContainer
│                           │   ├── EVLabel
│                           │   └── EVValue
│                           │
│                           ├── MetricsContainer
│                           │   ├── Confidence
│                           │   ├── Hotness
│                           │   └── Odds
│                           │
│                           └── ReasonsContainer
│                               └── Reasons (including AI reasons) (NEW)
```

---

## Data Flow Diagram

### Fetching Games

```
User opens app
      │
      ▼
┌─────────────────┐
│ useActiveGames()│  ← React Query hook
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ Check cache          │
│ - Is data fresh?     │ ← staleTime: 5 minutes
│ - Is data available? │
└────────┬─────────────┘
         │
         ├─── YES (cache hit) ──────┐
         │                          │
         └─── NO (cache miss) ──────┤
                                    ▼
                          ┌───────────────────────┐
                          │ getActiveGames()      │
                          │ - Feature flag check  │
                          │ - Call Supabase       │
                          └───────┬───────────────┘
                                  │
                                  ▼
                          ┌───────────────────────┐
                          │ Supabase.from(view)   │
                          │ .select('*')          │
                          │ .order('ai_score')    │
                          └───────┬───────────────┘
                                  │
                                  ▼
                          ┌───────────────────────┐
                          │ Parse response        │
                          │ - Map to LotteryGame  │
                          │ - Extract AI fields   │
                          └───────┬───────────────┘
                                  │
                                  ▼
         ┌────────────────────────┴────────────────────────┐
         │                                                  │
         ▼                                                  ▼
┌──────────────────┐                            ┌─────────────────────┐
│ Update cache     │                            │ Persist to          │
│ (memory)         │                            │ AsyncStorage        │
└────────┬─────────┘                            └──────────┬──────────┘
         │                                                  │
         └───────────────────┬──────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Return to UI   │
                    │ - Display games│
                    │ - Show AI scores│
                    └────────────────┘
```

### Offline Mode

```
User opens app (offline)
      │
      ▼
┌─────────────────┐
│ Check network   │  ← useNetworkStatus() hook
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ No connection   │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ React Query checks   │
│ AsyncStorage cache   │
└────────┬─────────────┘
         │
         ├─── Cache exists ──────┐
         │                       │
         └─── No cache ──────────┤
                                 ▼
                    ┌────────────────────────┐
                    │ Display cached data    │
                    │ + "Offline" banner     │
                    └────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ User can browse         │
                    │ - View recommendations  │
                    │ - See AI scores         │
                    │ - Read game details     │
                    └─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Network reconnects      │
                    │ - Auto-sync triggered   │
                    │ - Cache updated         │
                    │ - Banner removed        │
                    └─────────────────────────┘
```

---

## State Management Flow

### React Query State Machine

```
Query States:
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  idle    │─────→│ loading  │─────→│ success  │─────→│  stale   │
└──────────┘      └──────────┘      └──────────┘      └────┬─────┘
                        │                                   │
                        │                                   │
                        ▼                                   ▼
                  ┌──────────┐                       ┌──────────┐
                  │  error   │                       │refetching│
                  └──────────┘                       └──────────┘
                        │                                   │
                        └────────── retry ─────────────────┘

UI Rendering:
- idle/loading    → Show SkeletonCard
- success         → Show GameCard with data
- error           → Show ErrorBoundary with retry
- stale           → Show GameCard + refresh indicator
- refetching      → Show GameCard + loading indicator
```

### Feature Flag Flow

```
App Initialization
      │
      ▼
┌─────────────────────────┐
│ FeatureFlagService      │
│ .initialize()           │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Load from AsyncStorage  │
│ Key: 'feature_flags'    │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Flags object:                        │
│ {                                    │
│   useSupabaseData: false,  ← Toggle  │
│   enableAIScores: false,   ← Toggle  │
│   enableOfflineMode: true            │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Check in service:       │
│                         │
│ if (FeatureFlag         │
│     .useSupabase()) {   │
│   → Supabase            │
│ } else {                │
│   → Mock                │
│ }                       │
└─────────────────────────┘
```

---

## Error Handling Flow

```
API Call
   │
   ▼
┌────────────────┐
│ Try fetch      │
└────┬───────────┘
     │
     ├─── Success ────────────────┐
     │                            │
     └─── Error ──────────────────┤
                                  ▼
                        ┌─────────────────────┐
                        │ Retry Logic         │
                        │ - Attempt 1: +1s    │
                        │ - Attempt 2: +2s    │
                        │ - Attempt 3: +4s    │
                        └────────┬────────────┘
                                 │
                                 ├─── Success ──────────┐
                                 │                      │
                                 └─── All retries fail ─┤
                                                        ▼
                                              ┌─────────────────┐
                                              │ Error boundary  │
                                              │ - Show UI       │
                                              │ - Offer retry   │
                                              │ - Log error     │
                                              └─────────────────┘
                                                        │
                                              ┌─────────▼─────────┐
                                              │ User clicks retry │
                                              └─────────┬─────────┘
                                                        │
                                                        └───► (Loop back to Try fetch)
```

---

## Caching Strategy Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       React Query Cache                          │
│                                                                  │
│  Layer 1: Memory (Fast, 60 min lifespan)                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Query: ['games', 'active']                                 │  │
│  │ Data: [{ id: '1', name: 'Lucky 7s', ai_score: 85 }, ...]  │  │
│  │ Status: fresh (fetched 2 min ago)                          │  │
│  │ StaleTime: 5 min                                           │  │
│  │ GcTime: 60 min                                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Query: ['games', 'game-123']                               │  │
│  │ Data: { id: 'game-123', name: 'Cash Blast', ... }         │  │
│  │ Status: stale (fetched 35 min ago)                         │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Persists every 1 second
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    AsyncStorage (Disk)                           │
│  Layer 2: Persistent (Survives restarts, offline support)       │
│                                                                  │
│  Key: 'SCRATCH_ORACLE_QUERY_CACHE'                              │
│  Value: Serialized React Query cache                            │
│  Size: ~500KB (41 games + metadata)                             │
│                                                                  │
│  Last Persisted: 2 seconds ago                                  │
│  TTL: None (manual cleanup after 7 days)                        │
└──────────────────────────────────────────────────────────────────┘

Timeline:
┌────────────────────────────────────────────────────────────────────┐
│ 0s          5m           30m          60m          90m             │
│ │           │            │             │            │              │
│ Fetch ──────┤────────────┤─────────────┤────────────┤──────────────┤
│ ↓    fresh  │   stale    │  stale      │  removed   │              │
│ Cache       Auto-refetch Background    Garbage      (no cache)     │
│             (if viewing) refetch       collected                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## AI Score Display Logic

```
Game Card Render
      │
      ▼
┌─────────────────────┐
│ Check feature flag  │
│ showAIScores()?     │
└────────┬────────────┘
         │
         ├─── NO ──────────────────────┐
         │                             │
         └─── YES ─────────────────────┤
                                       ▼
                             ┌─────────────────────┐
                             │ Check game.ai_score │
                             └────────┬────────────┘
                                      │
                                      ├─── undefined ──────────┐
                                      │                        │
                                      └─── has value ──────────┤
                                                               ▼
                                                     ┌─────────────────┐
                                                     │ Render AI Badge │
                                                     └────────┬────────┘
                                                              │
                                      ┌───────────────────────┴──────────┐
                                      │                                  │
                                      ▼                                  ▼
                            ┌─────────────────┐              ┌─────────────────┐
                            │ Score Color     │              │ Recommendation  │
                            │ - 80-100: Green │              │ Badge           │
                            │ - 60-79: Gold   │              │ - strong_buy    │
                            │ - 40-59: Orange │              │ - buy           │
                            │ - 0-39: Red     │              │ - neutral       │
                            └─────────────────┘              │ - avoid         │
                                                             └─────────────────┘
```

---

## File Structure (After Integration)

```
scratch-oracle-app/
│
├── lib/
│   ├── supabase.ts              (EXISTING - already configured)
│   └── queryClient.ts           (NEW - React Query setup)
│
├── services/
│   ├── lottery/
│   │   ├── minnesotaData.ts         (EXISTING - mock service)
│   │   └── supabaseLotteryService.ts (NEW - real data service)
│   │
│   ├── config/
│   │   └── featureFlags.ts          (NEW - feature toggles)
│   │
│   ├── recommendations/
│   │   └── recommendationEngine.ts  (MODIFY - add AI score logic)
│   │
│   └── ... (other services unchanged)
│
├── hooks/
│   ├── useGames.ts              (NEW - React Query hooks)
│   └── useNetworkStatus.ts     (NEW - network detection)
│
├── components/
│   ├── common/
│   │   ├── SkeletonCard.tsx    (NEW - loading state)
│   │   └── ErrorBoundary.tsx   (NEW - error handling)
│   │
│   ├── AI/
│   │   └── AIPredictionsWithScoresScreen.tsx (NEW - AI UI)
│   │
│   └── ... (other components)
│
├── types/
│   └── lottery.ts               (MODIFY - add AI fields)
│
├── App.tsx                      (MODIFY - wrap with providers)
│
└── package.json                 (MODIFY - add dependencies)
```

---

## Migration Timeline

```
Week 1: Foundation
├── Day 1-2: Setup
│   ├── Install dependencies ✓
│   ├── Create queryClient.ts ✓
│   └── Create featureFlags.ts ✓
│
├── Day 3-4: Data Service
│   ├── Create supabaseLotteryService.ts ✓
│   ├── Create useGames.ts hooks ✓
│   └── Update types ✓
│
└── Day 5: Testing
    └── Test connection ✓

Week 2: UI Enhancement
├── Day 1-2: Components
│   ├── Create AIScoreBadge ✓
│   └── Create SkeletonCard ✓
│
├── Day 3-4: Screens
│   ├── Update App.tsx ✓
│   └── Create AIPredictionsScreen ✓
│
└── Day 5: Polish
    └── Add animations ✓

Week 3: Testing
├── Day 1-2: Unit/Integration tests
├── Day 3-4: Performance testing
└── Day 5: Bug fixes

Week 4: Migration
├── Day 1: 10% rollout → Monitor
├── Day 3: 50% rollout → Monitor
├── Day 5: 100% rollout → Monitor
└── Cleanup: Remove mock service
```

---

## Performance Optimization Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    Optimization Layers                          │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Network
├── Supabase database view (pre-joined queries)
├── Database indexes on game_id, ai_score
└── Edge caching (Supabase Edge Functions)

Layer 2: App Cache
├── React Query memory cache (5 min fresh)
├── AsyncStorage persistence (offline support)
└── Prefetching on user interaction

Layer 3: Rendering
├── React.memo() for GameCard components
├── useMemo() for sorted/filtered lists
├── FlatList optimization (windowing, batch rendering)
└── Skeleton screens (immediate UI feedback)

Layer 4: Bundle
├── Code splitting (lazy load AI screen)
├── Tree shaking (remove unused code)
└── Minification (production build)

Result:
- Initial load: <2s (target)
- Cached load: <500ms (target)
- Smooth 60fps scrolling
```

---

## Summary

This architecture provides:

1. **Scalability**: React Query handles caching, reducing Supabase calls
2. **Offline Support**: AsyncStorage persistence ensures app works without internet
3. **Flexibility**: Feature flags allow gradual rollout and instant rollback
4. **Performance**: Multi-layer caching, optimized queries, and efficient rendering
5. **Maintainability**: Clean separation between mock and real data services

**Next Steps**: Follow the implementation timeline in `INTEGRATION_PLAN.md`
