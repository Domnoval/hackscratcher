# 🎯 Scratch Oracle - Stakeholder Status Report
**Date**: October 22, 2025
**Days Since Last Check**: 2-3 days
**Session Type**: Full System Diagnostic + Roundtable

---

## 🚨 CRITICAL ISSUES DISCOVERED

### Issue #1: Scraper Field Mapping Bug (HIGH PRIORITY)
**Status**: 🔴 **BROKEN**
**Impact**: Historical snapshots failing, undefined console output

**Root Cause**:
- API returns `name`, `retailPrice`, `gameId` (string)
- Code expects `gameName`, `ticketPrice`, `gameNumber`
- Fallbacks exist in `upsertGame()` ✅ (working)
- But console logging uses wrong fields (lines 245-246)
- Snapshot creation uses non-existent `game.remainingTopPrizes` (line 194) ❌

**Evidence**:
```
Console Output:
✅ undefined (#undefined) - $undefined - undefined/undefined top prizes left

Error:
null value in column "remaining_top_prizes" of relation
"historical_snapshots" violates not-null constraint
```

**Database Impact**:
- ✅ Games ARE being saved (41 games upserted successfully)
- ❌ Historical snapshots FAILING (can't track prize depletion over time)
- ❌ Console output useless for monitoring

**Fix Required**: 2 small code changes in `scrape-mn-lottery.ts`

---

### Issue #2: Uncommitted Code (MEDIUM PRIORITY)
**Status**: 🟡 **PENDING**

**Uncommitted Files**:
- `App.tsx` (modified - AI component integration)
- `BETA_LAUNCH_BUILD.md` (new)
- `components/AI/` (3 new files)
- `components/tracking/` (new directory)
- `supabase/migrations/002_user_scans_policies.sql` (new)

**Impact**:
- Work from 2-3 days ago not in git history
- Team can't review changes
- Risk of losing work

**Fix Required**: Commit and push all changes

---

## ✅ WHAT'S WORKING

### Database ✅
- **Supabase Connection**: Active
- **Games Table**: 41 Minnesota scratch games loaded
- **Real Data**: Current as of Oct 22, 2025
- **RLS Policies**: Configured for games, predictions

### API Integration ✅
- **MN Lottery API**: Responding correctly
- **Data Fetch**: 41 games retrieved
- **Game Upsert**: Working (despite console showing "undefined")
- **API Endpoint**: `https://gateway.gameon.mnlottery.com/services/game/api/published-games`

### Frontend Components (Built 2-3 Days Ago) ✅
- **AIScoreBadge**: Complete, color-coded 0-100 scores
- **ConfidenceIndicator**: Signal bars (Low/Med/High)
- **RecommendationChip**: 5 types (🔥Hot Pick, ✅Recommended, etc.)
- **WinTracker**: Full modal for tracking wins/losses
- **App Integration**: All components integrated in App.tsx

### ML Pipeline (Unknown Status)
- **Last Test**: 2-3 days ago
- **Model File**: Likely exists at `models/lottery_predictor.pkl`
- **Status**: NEEDS TESTING

---

## 🔍 UNTESTED SINCE LAST SESSION

### Not Verified Today:
- [ ] ML model training works
- [ ] Prediction generation works
- [ ] Web build runs
- [ ] Tunnel mode connects to phone
- [ ] AI components render correctly
- [ ] Win tracking saves to database
- [ ] TypeScript compiles without errors

---

## 📊 CURRENT STATE SUMMARY

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase DB | 🟢 Working | 41 games loaded |
| API Scraper | 🟡 Partial | Games save, snapshots fail |
| ML Pipeline | ⚪ Unknown | Not tested today |
| AI Components | ⚪ Unknown | Built but not tested |
| Win Tracking | ⚪ Unknown | Built but not tested |
| Git History | 🟡 Behind | 8 uncommitted files |
| TypeScript | ⚪ Unknown | Not compiled |
| Web Build | ⚪ Unknown | Not tested |
| Mobile Test | ⚪ Unknown | Not tested |

---

## 🎯 WHAT STAKEHOLDERS NEED TO DECIDE

### Decision #1: Fix Bugs Now or Test First?
**Option A**: Fix scraper bugs immediately, then test everything
**Option B**: Test what we have first, document all issues, then fix batch

**Recommendation**: Option A (fix scraper, it's a 5-minute fix)

### Decision #2: Commit Strategy
**Option A**: Commit everything now as-is
**Option B**: Test first, fix bugs, then commit working code

**Recommendation**: Option B (don't commit broken code)

### Decision #3: Testing Priority
With limited time, what do we test first?

1. Fix scraper → run scraper → verify data quality
2. Test ML pipeline → ensure predictions work
3. Test web UI → see AI components render
4. Test mobile → full end-to-end experience
5. TypeScript compile → catch type errors

**Recommendation**: Do all 5 in order (2 hours total)

### Decision #4: Beta Timeline
**Current Status**: Have all features but untested

**Options**:
- **Week 1** (this week): Fix bugs, test everything, commit
- **Week 2**: Polish UI, fix issues found
- **Week 3-4**: Closed beta (10-20 users)
- **Week 5-6**: Iterate on feedback
- **Week 7-8**: Play Store submission

**OR**: Delay 1-2 weeks to build more features first?

---

## 🐛 DETAILED BUG REPORT

### Bug #1: Console Logging Wrong Fields
**File**: `scripts/scrape-mn-lottery.ts:245`

**Current Code**:
```typescript
console.log(
  `✅ ${game.gameName} (#${game.gameNumber}) - $${game.ticketPrice} - ${game.remainingTopPrizes}/${game.totalTopPrizes} top prizes left`
);
```

**Problem**: APIGame doesn't have those fields

**Fix**:
```typescript
const gameName = game.name;
const gameNumber = String(game.gameId);
const ticketPrice = game.retailPrice;
console.log(
  `✅ ${gameName} (#${gameNumber}) - $${ticketPrice} - Saved to DB`
);
```

### Bug #2: Snapshot Using Wrong Field
**File**: `scripts/scrape-mn-lottery.ts:194`

**Current Code**:
```typescript
remaining_top_prizes: game.remainingTopPrizes,
```

**Problem**: APIGame doesn't have `remainingTopPrizes` field

**Fix**: Extract from prize table like in `upsertGame()`:
```typescript
const topPrize = game.prizeTable?.[0];
const remainingTopPrizes = topPrize?.remaining || topPrize?.remainingPrizes || null;

await supabase.from('historical_snapshots').upsert({
  game_id: gameId,
  snapshot_date: today,
  remaining_top_prizes: remainingTopPrizes,
  // ...
});
```

**Alternative**: Pass extracted data from `upsertGame()` to `createSnapshot()`

---

## 📈 METRICS WE NEED

### Data Quality Metrics
- How many games have prize table data?
- How many games have remaining prize counts?
- What % of snapshots are successfully created?

### Model Performance Metrics
- What's current prediction accuracy?
- How many predictions have been generated?
- What's the score distribution (how many 80+, 60-79, etc.)?

### User Readiness Metrics
- Does the app load in <3 seconds?
- Do all UI components render?
- Is the data real or still mock?

---

## 🚀 RECOMMENDED ACTION PLAN

### Today (Next 2 Hours)
1. **Fix Scraper** (10 min) - Bug #1 and #2
2. **Run Scraper** (5 min) - Verify clean output
3. **Test ML Pipeline** (15 min) - Train + predict
4. **Check TypeScript** (5 min) - Compile test
5. **Test Web Build** (20 min) - Full UI test
6. **Test Mobile** (30 min) - Tunnel mode + phone
7. **Commit Everything** (10 min) - Push to GitHub
8. **Document Findings** (25 min) - Update this report

### This Week
- Polish any issues found in testing
- Run scraper daily to build historical data
- Monitor Supabase for errors

### Next 2 Weeks
- Beta user recruitment (find 10-20 testers)
- Create onboarding docs
- Set up feedback collection

---

## 💬 STAKEHOLDER QUESTIONS

### For Product Manager:
1. Are we still targeting closed beta in Week 3-4?
2. Should we add more features before beta or ship what we have?
3. What's our success criteria for beta?

### For ML Engineer:
1. How many weeks of data do you NEED before model is reliable?
2. Should we hide AI scores until we have more data?
3. What accuracy % would you be comfortable showing users?

### For Mobile Developer:
1. Are all dependencies installed and working?
2. Do we need any performance optimizations?
3. Should we test on physical device or emulator?

### For Business Lead:
1. Do we have budget for beta testing (maybe incentives)?
2. What's our target user acquisition cost?
3. When do we start thinking about monetization?

### For Founder:
**What's the priority: Speed vs Quality?**
- Ship fast with bugs → learn from real users → iterate
- Ship slow but polished → better first impression → less churn

---

## 🎬 READY FOR STAKEHOLDER ROUNDTABLE

**Agenda**:
1. Review this status report (10 min)
2. Discuss critical bugs (5 min)
3. Watch live demos/tests (30 min)
4. Make decisions on priorities (10 min)
5. Assign action items (5 min)

**Total Time**: ~60 minutes

---

**Status**: Ready to begin stakeholder meeting 🎤
