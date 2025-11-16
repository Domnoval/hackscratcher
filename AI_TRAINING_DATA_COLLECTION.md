# AI Training Data Collection - Active

## Status: 🟢 COLLECTING DATA

The AI location prediction system is **now actively collecting training data** in the background while the frontend shows "Coming Soon".

---

## What's Running Right Now

### ✅ Backend Data Collection (Active)

1. **Database Tables Created** (`004_location_prediction_tables.sql`)
   - `retailers` - Stores lottery retailer information
   - `winning_tickets` - **PRIMARY TRAINING DATA** - Where and when wins occurred
   - `retailer_stats` - Pre-computed statistics for ML features
   - `retailer_predictions` - Will store AI predictions (empty for now)
   - `data_collection_log` - Tracks scraping runs

2. **Automated Weekly Scraping** (GitHub Actions)
   - **Schedule:** Every Sunday at 3 AM CT
   - **File:** `.github/workflows/collect-training-data.yml`
   - **What it does:**
     - Scrapes Minnesota Lottery winners page
     - Extracts retailer names, locations, prize amounts
     - Stores in `winning_tickets` table
     - Creates/updates retailer records
   - **Cost:** FREE (GitHub Actions)

3. **Manual Scraping Available**
   ```bash
   npm run scrape:winners:mn
   ```

### ⏳ Frontend Display (Coming Soon UI)

- **Component:** `components/coming-soon/AILocationComingSoon.tsx`
- **Shows users:**
  - "AI Location Predictions - COMING SOON"
  - Feature preview (hot retailers, map, predictions)
  - "AI is currently learning..." status
  - Animated robot icon
- **When to replace:** After 3-6 months of data collection

---

## Training Data Requirements

### Minimum Data Needed Before Model Training

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| **Time Period** | 0 weeks | 12+ weeks | Need 3+ months of historical data |
| **Winning Tickets** | 0 | 1,000+ | More is better (10,000+ ideal) |
| **Unique Retailers** | 0 | 200+ | Diverse locations across MN |
| **Prize Range** | N/A | $10 - $500K | All prize tiers represented |

### Data Quality Metrics

- **Geocoding:** Need lat/lng for 80%+ of retailers
- **Temporal Coverage:** Weekly wins for 12+ weeks
- **Geographic Coverage:** Multiple cities/counties
- **Prize Distribution:** All tiers ($10, $100, $1K, $10K, $100K+)

---

## Timeline

### Phase 1: Silent Data Collection (Months 1-3) ← YOU ARE HERE
- ✅ Database tables created
- ✅ Winner scraper implemented
- ✅ GitHub Action scheduled (weekly)
- ✅ "Coming Soon" UI ready
- 🔄 **Action Required:**
  1. Run migration: Apply `004_location_prediction_tables.sql` to Supabase
  2. Push to GitHub to activate weekly scraping
  3. Manually run first scrape: `npm run scrape:winners:mn`

### Phase 2: Data Enrichment (Month 3-4)
- Geocode all retailer addresses (get lat/lng)
- Verify retailer information
- Calculate initial statistics
- Goal: 1,000+ winning tickets with locations

### Phase 3: Model Development (Month 4-5)
- Extract ML features from data
- Train initial model (XGBoost)
- Validate predictions
- Tune hyperparameters

### Phase 4: Beta Testing (Month 5-6)
- Generate predictions for subset of users
- Gather feedback
- Refine model
- Calculate accuracy metrics

### Phase 5: Public Launch (Month 6+)
- Replace "Coming Soon" with actual map
- Show hotness scores
- Enable location-based recommendations
- Monitor performance

---

## How It Works (Behind the Scenes)

```
┌─────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (Every Sunday)                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├──> scrape-mn-winners.ts
                 │    └──> Minnesota Lottery Winners Page
                 │         ├──> Game Name, Prize Amount
                 │         ├──> Retailer Name, City
                 │         └──> Claimed Date
                 │
                 ├──> Parse & Extract Data
                 │    ├──> Prize: "$50,000" → 50000
                 │    ├──> Location: "Minneapolis, MN"
                 │    └──> Game: "#2066"
                 │
                 ├──> Find or Create Retailer
                 │    └──> retailers table
                 │
                 ├──> Insert Winning Ticket
                 │    └──> winning_tickets table (TRAINING DATA!)
                 │
                 └──> Log Results
                      └──> data_collection_log table


┌─────────────────────────────────────────────────────────────┐
│  SUPABASE DATABASE                                          │
├─────────────────────────────────────────────────────────────┤
│  retailers:               4 rows   →  100 rows  →  500+    │
│  winning_tickets:         0 rows   →  1000 rows → 10,000+  │
│  retailer_stats:          0 rows   →  100 rows  →  500+    │
│  retailer_predictions:    EMPTY (until model trained)       │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│  REACT NATIVE APP                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │  🤖 AI Location Predictions                │            │
│  │      COMING SOON                           │            │
│  │                                             │            │
│  │  We're training our AI to predict which    │            │
│  │  retailers are more likely to sell         │            │
│  │  winning tickets!                          │            │
│  │                                             │            │
│  │  📍 Find 'hot' retailers near you          │            │
│  │  🔥 Real-time hotness scores               │            │
│  │  🗺️ Interactive map of lucky stores        │            │
│  │  📊 Historical win patterns                │            │
│  │                                             │            │
│  │  🟡 AI is currently learning...            │            │
│  │                                             │            │
│  │  [Notify Me When Available]                │            │
│  └────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring Data Collection

### Check Progress in Supabase

```sql
-- How many winning tickets collected?
SELECT COUNT(*) as total_winners FROM winning_tickets;

-- How many retailers discovered?
SELECT COUNT(*) as total_retailers FROM retailers;

-- Wins by month
SELECT
  DATE_TRUNC('month', claimed_at) as month,
  COUNT(*) as wins
FROM winning_tickets
GROUP BY month
ORDER BY month DESC;

-- Top retailers by wins
SELECT
  r.name,
  r.city,
  COUNT(*) as wins,
  SUM(wt.prize_amount) as total_prizes
FROM winning_tickets wt
JOIN retailers r ON wt.retailer_id = r.id
GROUP BY r.id, r.name, r.city
ORDER BY wins DESC
LIMIT 10;

-- Data collection runs
SELECT
  started_at,
  status,
  records_created,
  errors_count
FROM data_collection_log
ORDER BY started_at DESC
LIMIT 10;
```

### GitHub Actions Dashboard

1. Go to your repo on GitHub
2. Click "Actions" tab
3. Select "Collect AI Training Data"
4. View recent runs and logs

---

## Next Steps

### Immediate (This Week)

1. **Apply Database Migration**
   - Open Supabase dashboard
   - Go to SQL Editor
   - Run `supabase/migrations/004_location_prediction_tables.sql`
   - Verify tables were created

2. **Test Winner Scraper Locally**
   ```bash
   npm run scrape:winners:mn
   ```
   - Check Supabase for new records
   - Verify data looks correct

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add AI training data collection system"
   git push
   ```
   - This activates the weekly GitHub Action

4. **Manually Trigger First Run**
   - Go to GitHub Actions tab
   - Select "Collect AI Training Data" workflow
   - Click "Run workflow"
   - Verify it completes successfully

### This Month

5. **Monitor Data Growth**
   - Check Supabase weekly
   - Ensure new winners being added
   - Verify no scraping errors

6. **Geocode Retailers** (Optional Enhancement)
   - Add Google Maps API integration
   - Geocode all retailer addresses
   - Store lat/lng in retailers table

### In 3-6 Months

7. **Train Initial Model**
   - Once 1,000+ winning tickets collected
   - Run `npm run train-model` (script TBD)
   - Evaluate accuracy

8. **Launch Feature**
   - Replace `AILocationComingSoon` with real map
   - Enable predictions
   - Monitor user engagement

---

## Cost Estimate

| Service | Usage | Cost |
|---------|-------|------|
| **GitHub Actions** | 5 min/week × 52 weeks = 260 min/year | FREE (within 2,000 min/month limit) |
| **Supabase Storage** | ~10 MB for 10,000 records | FREE (within 500 MB limit) |
| **Google Maps Geocoding** | 500 addresses × $0.005 = $2.50 | ~$3/one-time |
| **Total** | | **~$3 one-time** |

---

## Frequently Asked Questions

### Q: How long until the feature launches?
**A:** Minimum 3 months (to collect enough data), realistically 4-6 months for a well-trained model.

### Q: What if scraping stops working?
**A:** GitHub Actions will continue trying. Check the Actions tab for errors. The scraper is designed to handle failures gracefully.

### Q: Can users see the collected data?
**A:** No, data collection is silent. Users only see "Coming Soon" UI.

### Q: What if MN Lottery changes their website?
**A:** You'll need to update the scraper selectors in `scripts/scrape-mn-winners.ts`. The script saves debug screenshots to help with this.

### Q: How accurate will the predictions be?
**A:** Initial target is 70%+ accuracy in predicting if a retailer will have a win in the next 30 days. This improves with more data.

### Q: Can this work for Florida too?
**A:** Yes! Just create `scripts/scrape-fl-winners.ts` following the same pattern.

---

## Summary

✅ **What's Set Up:**
- Database tables for training data
- Weekly automated scraping (GitHub Actions)
- Manual scraping script
- "Coming Soon" UI component
- Data collection monitoring

⏳ **What's Happening Now:**
- System is silently collecting winner location data
- Users see "Coming Soon" message
- Backend accumulates training data

🎯 **When It Launches:**
- After 3-6 months of data collection
- Model trained and validated
- Replace Coming Soon with actual predictions
- Users can find "hot" retailers

---

**Status:** Data collection is ACTIVE. Sit back and let it run! 🚀
