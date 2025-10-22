# 🌴 Florida Lottery Expansion - Strategic Brief

**Proposal**: Add Florida as 2nd supported state
**Current State**: Minnesota only (41 games)
**Requested By**: Founder
**Status**: Research Complete, Awaiting Stakeholder Decision

---

## 🔍 TECHNICAL FEASIBILITY

### Florida Lottery Data Sources

**Option 1: Find Their API (Recommended)**
- **Method**: Network inspection (same as we did for Minnesota)
- **Likelihood**: HIGH (they use Vue.js, must have an API)
- **Effort**: 1-2 hours
- **Cost**: $0
- **Reliability**: High
- **Example**: Minnesota uses `gateway.gameon.mnlottery.com/services/game/api/published-games`
- **Florida likely**: Similar structure (`floridalottery.com/api/...` or third-party gateway)

**Option 2: GitHub Open Source API**
- **Source**: `kawhyte/Lotto-Tickets-API` (Node + Express + MongoDB)
- **Effort**: 2-3 hours to integrate
- **Cost**: $0
- **Reliability**: Unknown (community maintained)
- **Risk**: May not be up-to-date

**Option 3: RapidAPI Commercial**
- **Provider**: `florida-lottery-scratch-off-tickets-data`
- **Cost**: Unknown (RapidAPI typically $10-50/month)
- **Effort**: 1 hour integration
- **Reliability**: High
- **Downside**: Monthly cost, vendor lock-in

**Option 4: Web Scraping (Fallback)**
- **Method**: Puppeteer/Playwright on remaining prizes page
- **Effort**: 4-6 hours
- **Cost**: $0
- **Reliability**: Medium (breaks if UI changes)
- **Maintenance**: Higher

### Recommendation: Option 1
Start with network inspection. If that fails, try GitHub API. Commercial API as last resort.

---

## 💾 DATABASE IMPACT

### What Changes Are Needed?

**Good News**: Our schema already supports multi-state! ✅

**Current Schema**:
```sql
CREATE TABLE games (
  id UUID PRIMARY KEY,
  game_number VARCHAR NOT NULL,
  game_name VARCHAR NOT NULL,
  state VARCHAR(2) DEFAULT 'MN',  -- <-- Already here!
  ...
)
```

**Changes Required**:
1. ✅ **None for schema** (already multi-state ready)
2. **New scraper file**: `scripts/scrape-fl-lottery.ts` (copy MN, change API)
3. **Compound unique key**: Change `game_number` unique constraint to `(state, game_number)`

**Migration**:
```sql
-- Drop old constraint
ALTER TABLE games DROP CONSTRAINT games_game_number_key;

-- Add new compound constraint
ALTER TABLE games ADD CONSTRAINT games_state_game_number_key
  UNIQUE (state, game_number);
```

**Effort**: 30 minutes

---

## 🎨 UI IMPACT

### What Changes Are Needed?

**State Selector**: Users need to pick MN or FL

**Option A: Simple Toggle** (Quick - 1 hour)
```
┌─────────────────────────────┐
│ Select State:               │
│ ⚪ Minnesota  ⚫ Florida     │
└─────────────────────────────┘
```

**Option B: Dropdown** (Medium - 2 hours)
```
┌─────────────────────────────┐
│ State: [Florida ▼]          │
│   - Minnesota               │
│   - Florida                 │
│   - (More states later)     │
└─────────────────────────────┘
```

**Option C: Auto-Detect Location** (Complex - 4 hours)
- Use device GPS to detect state
- Default to user's state
- Allow manual override
- Best UX, most work

**Home Screen Changes**:
- Add state selector at top
- Filter games by selected state
- Show "41 Florida games" vs "41 Minnesota games"
- ML predictions per state (separate models)

**Effort**: 1-4 hours depending on option

---

## 🤖 ML IMPACT

### How Does This Affect Predictions?

**Challenge**: Different states = different game mechanics

**Option 1: Shared Model** (Simple)
- Train one model on all states
- Add `state` as a feature
- **Pro**: Simpler, more data
- **Con**: May miss state-specific patterns

**Option 2: Per-State Models** (Better)
- Train separate models: `model_mn.pkl`, `model_fl.pkl`
- Each optimized for that state's games
- **Pro**: Better accuracy
- **Con**: Need more data per state, 2x storage

**Option 3: Hybrid** (Best)
- Start with shared model (limited data)
- Split into per-state after 8-12 weeks
- **Pro**: Best of both worlds
- **Con**: More complex

**Recommendation**: Option 3 (start shared, split later)

**Effort**:
- Shared model: 0 hours (already works)
- Per-state: 3-4 hours

---

## ⏱️ DEVELOPMENT TIMELINE

### Fast Track (Minnesota-Style)
**Assumption**: Florida has discoverable API like Minnesota

| Task | Time | Who |
|------|------|-----|
| Find Florida API endpoint | 1-2h | Dev |
| Create FL scraper | 1h | Dev |
| Update DB constraints | 0.5h | Dev |
| Test FL scraper | 0.5h | Dev |
| Add state selector UI | 2h | Dev |
| Update ML pipeline | 1h | ML |
| Test everything | 2h | All |
| **TOTAL** | **8-9 hours** | **~1 day** |

### Slow Track (Requires Scraping)
**Assumption**: No API, need Puppeteer

| Task | Time |
|------|------|
| Build Puppeteer scraper | 4-6h |
| Everything else above | 7h |
| **TOTAL** | **11-13 hours** | **~2 days** |

---

## 💰 BUSINESS IMPACT

### Why Add Florida?

**Market Size**:
- **Minnesota**: 5.7M population
- **Florida**: 22.6M population (4x larger!)
- **FL Lottery**: $9.5B in sales (2024)
- **MN Lottery**: $654M in sales (2024)

**Florida is 14.5x bigger market** 🚀

**Target Users**:
- Minnesota: ~570,000 regular scratch players
- Florida: ~2,260,000 regular scratch players

**Retention**:
- Multi-state support = broader appeal
- "Moving to Florida? We got you covered"
- Snowbirds who play in both states

### Revenue Potential

**Freemium Model** (hypothetical):
- Free: Top 5 games for your state
- Pro ($2.99/mo): All games, both states

**If Florida launches**:
- Minnesota only: 570K potential users
- MN + FL: 2,830K potential users (5x larger TAM)
- Even 0.1% conversion = 2,830 paying users
- Revenue: $8,500/month vs $1,700/month

**ROI on 1-2 days of dev work**: Massive

---

## 🎯 STRATEGIC OPTIONS

### Option A: Add Florida Before Beta
**Timeline**: This week
**Pros**:
- Bigger beta test pool (recruit in FL too)
- Prove multi-state model works early
- More data for ML training
- Bigger market = more feedback

**Cons**:
- Delays beta by 1-2 days
- More complexity to test
- Two states = 2x bugs potentially

### Option B: Launch MN Beta, Add FL After
**Timeline**: Add Florida in Week 3-4
**Pros**:
- Ship faster (beta this week)
- Validate with one state first
- Less to test initially
- Focus on core features

**Cons**:
- Smaller TAM for beta
- Have to recruit beta testers in MN only
- Florida users can't try it yet

### Option C: Launch Both States Simultaneously
**Timeline**: Add Florida, test everything, launch together
**Pros**:
- Big splash at launch
- "Available in MN and FL" sounds more serious
- Maximizes initial user acquisition

**Cons**:
- Most work upfront
- Most testing needed
- Delays everything by 1-2 weeks

---

## 🚨 RISKS & MITIGATION

### Risk #1: Florida API Doesn't Exist
**Mitigation**:
- Try network inspection first (2 hours)
- Fallback to GitHub open source (2 hours)
- Last resort: RapidAPI commercial ($)

### Risk #2: Florida Data Format Different
**Mitigation**:
- Build abstraction layer for scrapers
- Each state has adapter pattern
- Easy to add Texas, California later

### Risk #3: ML Model Performs Poorly on FL
**Mitigation**:
- Start with shared model (works immediately)
- Monitor accuracy per state
- Split models if needed after data collection

### Risk #4: Delays Beta Launch
**Mitigation**:
- Set hard deadline (e.g., "if not done in 2 days, ship MN only")
- Parallel work (Dev on scraper, Designer on state selector)

---

## 📊 STAKEHOLDER DECISION MATRIX

| Criteria | MN Only | Add FL Now | Add FL Later |
|----------|---------|------------|--------------|
| **Speed to Beta** | ✅ Fastest | 🟡 +1-2 days | ✅ Same |
| **Market Size** | 570K | 2.8M ✅ | 570K → 2.8M |
| **Complexity** | ✅ Simple | 🟡 Medium | ✅ Simple now |
| **Beta Pool** | Small | ✅ Large | Small |
| **Revenue Potential** | $1.7K/mo | ✅ $8.5K/mo | $1.7K → $8.5K |
| **Risk** | ✅ Low | 🟡 Medium | ✅ Low |
| **Testing Effort** | ✅ 4 hours | 🟡 8 hours | ✅ 4 hours |

---

## 💬 QUESTIONS FOR STAKEHOLDERS

### Product Manager:
1. Does adding Florida change our beta timeline?
2. Can we recruit beta testers in Florida?
3. Should we market as "Multi-State AI Lottery App" from day 1?

### ML Engineer:
1. Shared model or per-state models?
2. How much FL data do we need before predictions are reliable?
3. Do we show AI scores for Florida immediately or wait?

### Mobile Developer:
1. State selector UI - which option (toggle/dropdown/auto)?
2. How do we handle state switching (reload app or seamless)?
3. Cache data per state or combined?

### Business Lead:
1. Is Florida worth delaying beta by 1-2 days?
2. Should we run parallel betas (MN + FL at same time)?
3. Do we need FL-specific marketing materials?

### Founder:
**Why do you want Florida?**
- Bigger market opportunity?
- You live in FL / have connections there?
- Testing multi-state before full launch?
- Specific competitive pressure?

---

## ✅ RECOMMENDATION

**IF the goal is maximum growth**: Add Florida NOW
- 8-9 hours of work
- 5x larger market
- Proves we can scale to 50 states
- Better beta results

**IF the goal is speed**: Ship MN beta, add FL Week 3
- Validate core product first
- Add complexity incrementally
- Lower risk

**My vote**: **Add Florida this week** (Option A)
- The dev work is small (1 day)
- The upside is massive (5x market)
- We're already fixing bugs - what's one more day?
- "Minnesota & Florida" sounds way more legit than "Minnesota only"

---

**Ready to discuss in stakeholder meeting** 🎤
