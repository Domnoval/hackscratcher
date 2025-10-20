# Scratch Oracle - Integration Plan Summary

**Quick Reference Guide for Supabase Integration**

---

## At a Glance

### What's Being Integrated
- **41 real Minnesota lottery games** from Supabase
- **AI prediction scores** (0-100) with confidence levels
- **Real-time data** instead of mock/static data
- **Offline caching** for seamless user experience

### Technology Stack
- **State Management**: React Query (TanStack Query)
- **Database**: Supabase (PostgreSQL)
- **Caching**: AsyncStorage + React Query Persist
- **Migration**: Feature flags for gradual rollout

---

## Key Files Summary

### Files to Create (NEW)

| File | Purpose | Lines |
|------|---------|-------|
| `lib/queryClient.ts` | React Query configuration | ~50 |
| `services/lottery/supabaseLotteryService.ts` | Supabase data service | ~200 |
| `services/config/featureFlags.ts` | Feature flag system | ~80 |
| `hooks/useGames.ts` | React Query hooks | ~100 |
| `hooks/useNetworkStatus.ts` | Network detection | ~30 |
| `components/common/SkeletonCard.tsx` | Loading skeleton | ~80 |
| `components/common/ErrorBoundary.tsx` | Error handling | ~60 |
| `components/AI/AIPredictionsWithScoresScreen.tsx` | AI predictions UI | ~300 |

**Total New Code**: ~900 lines

### Files to Modify (EXISTING)

| File | Changes Required | Complexity |
|------|-----------------|------------|
| `types/lottery.ts` | Add AI score fields | Low |
| `services/recommendations/recommendationEngine.ts` | Integrate AI scores | Medium |
| `App.tsx` | Add AI badges, loading states | Medium |
| `package.json` | Add dependencies | Low |

---

## Quick Start Checklist

### Prerequisites
- [ ] Supabase project created
- [ ] Database schema deployed (41 games populated)
- [ ] AI predictions generated in `predictions` table
- [ ] Supabase credentials in `.env` file

### Installation (5 minutes)
```bash
npm install @tanstack/react-query
npm install @tanstack/react-query-persist-client
npm install @react-native-community/netinfo
```

### Implementation Steps

**Week 1: Core Setup**
1. Create `lib/queryClient.ts`
2. Create `services/lottery/supabaseLotteryService.ts`
3. Create `services/config/featureFlags.ts`
4. Test connection to Supabase

**Week 2: UI Components**
1. Update `App.tsx` with AI score badges
2. Create `AIPredictionsWithScoresScreen.tsx`
3. Add loading skeletons
4. Add error handling

**Week 3: Testing**
1. Test offline mode
2. Test performance
3. Compare mock vs Supabase data
4. Fix bugs

**Week 4: Migration**
1. Enable for 10% of users
2. Monitor for issues
3. Enable for 100% if stable
4. Remove mock data

---

## UI Changes Preview

### Before (Mock Data)
```
┌─────────────────────────────┐
│ #1 Lucky 7s            $5   │
│ Expected Value: +$2.34      │
│ Confidence: 85%             │
│ Hotness: 🔥                 │
└─────────────────────────────┘
```

### After (Supabase + AI)
```
┌─────────────────────────────┐
│ #1 Lucky 7s            $5   │
│ ┌─────────────────────────┐ │
│ │ AI Score: 85/100        │ │
│ │ 92% confidence          │ │
│ │ [STRONG BUY]            │ │
│ └─────────────────────────┘ │
│ Expected Value: +$2.34      │
│ AI Analysis: Game shows     │
│ strong momentum...          │
└─────────────────────────────┘
```

---

## Data Flow

### Current (Mock)
```
App.tsx
  ↓
RecommendationEngine
  ↓
MinnesotaLotteryService (MOCK)
  ↓
5 hardcoded games
```

### Future (Supabase)
```
App.tsx
  ↓
useActiveGames() hook
  ↓
React Query Cache
  ↓ (if stale)
SupabaseLotteryService
  ↓
Supabase Database
  ↓
active_games_with_predictions view
  ↓
41 real games + AI predictions
```

---

## Performance Targets

| Metric | Target | How Achieved |
|--------|--------|--------------|
| Initial Load | <2s | Skeleton screens, prefetching |
| Cached Load | <500ms | React Query cache |
| Offline Support | 100% | AsyncStorage persistence |
| Scroll FPS | 60fps | FlatList optimization, memoization |
| Error Rate | <1% | Retry logic, exponential backoff |

---

## Migration Strategy

### Phase 1: Dual Mode (Week 1-2)
- Both mock and Supabase services exist
- Feature flag controls which is active
- Default: **mock data**

### Phase 2: Testing (Week 3)
- Enable Supabase for developers only
- Compare results between mock and real
- Fix discrepancies

### Phase 3: Gradual Rollout (Week 4)
- Day 1: 10% of users → Supabase
- Day 3: 50% of users → Supabase
- Day 5: 100% of users → Supabase

### Phase 4: Cleanup (Week 5)
- Remove mock data service
- Remove feature flags
- Celebrate! 🎉

---

## Rollback Plan

### Instant Rollback (Feature Flag)
```typescript
await FeatureFlagService.setFlags({
  useSupabaseData: false,
  enableAIScores: false,
});
```

### Emergency Rollback (Code)
- Revert commits
- Redeploy previous version
- Mock data still exists as fallback

---

## AI Score Fields

### New Fields in `LotteryGame` Type
```typescript
interface LotteryGame {
  // ... existing fields ...

  // NEW AI fields
  ai_score?: number;        // 0-100
  confidence?: number;      // 0-100
  recommendation?: 'strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid';
  ai_reasoning?: string;
}
```

### AI Score Color Coding
- **80-100** (Green): Strong buy signal
- **60-79** (Gold): Good opportunity
- **40-59** (Orange): Neutral/caution
- **0-39** (Red): Avoid

---

## Database Schema (Key Tables)

### `games` (41 rows)
```
id, game_name, ticket_price, top_prize_amount,
remaining_top_prizes, overall_odds, is_active
```

### `prize_tiers` (~200 rows)
```
id, game_id, prize_amount, total_prizes, remaining_prizes
```

### `predictions` (41 rows, updated daily)
```
id, game_id, ai_score, win_probability,
confidence_level, recommendation, reasoning
```

### `active_games_with_predictions` (VIEW)
Joins `games` + `predictions` for optimal query performance.

---

## Dependencies to Install

```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-query-persist-client": "^5.0.0",
  "@react-native-community/netinfo": "^11.0.0"
}
```

**Size Impact**: ~100KB added to bundle

---

## Testing Checklist

### Unit Tests
- [ ] `SupabaseLotteryService.getActiveGames()` returns games
- [ ] `SupabaseLotteryService.getGameById()` returns single game
- [ ] AI scores are in valid range (0-100)
- [ ] Feature flags toggle correctly

### Integration Tests
- [ ] Recommendations include AI scores
- [ ] AI scores influence ranking
- [ ] Offline mode works (cached data shown)
- [ ] Network reconnection triggers sync

### E2E Tests
- [ ] Cold start shows cached data immediately
- [ ] Pull-to-refresh updates from Supabase
- [ ] Airplane mode shows offline banner
- [ ] AI score badges display correctly
- [ ] Performance meets targets (<2s load)

---

## Cost Estimate

### Development Time
- **Week 1**: 20 hours (setup, data service)
- **Week 2**: 25 hours (UI components)
- **Week 3**: 20 hours (testing, optimization)
- **Week 4**: 15 hours (migration, monitoring)
- **Total**: 80 hours (~2 weeks full-time)

### Supabase Costs
- **Free Tier**: Up to 500MB database, 50K MAU
- **Expected Usage**: ~10MB data, <10K MAU initially
- **Cost**: $0/month (free tier sufficient)

### Risk Level
- **Low**: Feature flags allow instant rollback
- **Minimal Code Changes**: Only ~900 lines of new code
- **No Breaking Changes**: Mock data stays as fallback

---

## Success Metrics

### Week 1 Targets
- [ ] Supabase connection working
- [ ] Can fetch 41 games successfully
- [ ] AI scores display in UI

### Week 2 Targets
- [ ] All screens using Supabase data
- [ ] Loading states implemented
- [ ] Error handling working

### Week 3 Targets
- [ ] Performance <2s initial load
- [ ] Offline mode functional
- [ ] No critical bugs

### Week 4 Targets
- [ ] 100% of users on Supabase
- [ ] Crash rate: 0%
- [ ] User satisfaction: 4.5+ stars

---

## FAQs

**Q: What if Supabase goes down?**
A: App shows cached data. Users can still browse last fetched games.

**Q: How often are AI scores updated?**
A: Daily. Predictions table refreshed every 24 hours.

**Q: Can users toggle between mock and real data?**
A: Yes, via feature flag (can add toggle in Settings for testing).

**Q: What if a game has no AI prediction?**
A: Falls back to EV-based recommendation. No errors shown.

**Q: How do we measure success?**
A: Track: load time, error rate, user retention, Play Store rating.

---

## Contact & Support

**Full Plan**: See `INTEGRATION_PLAN.md` (15,000+ words)
**Supabase Docs**: https://supabase.com/docs
**React Query Docs**: https://tanstack.com/query/latest

---

**Ready to implement?** Start with:
1. Install dependencies
2. Create `lib/queryClient.ts`
3. Test Supabase connection

**Need help?** Review the full `INTEGRATION_PLAN.md` for detailed code examples.
