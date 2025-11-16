# Lottery Data Scraping Strategy

## Overview
This app needs fresh lottery data to provide accurate recommendations. As prizes are claimed throughout the day, our scraping system keeps the database updated.

## Scraping Solutions Implemented

### 1. **Automated GitHub Actions (Primary)** ⭐
**Status:** ✅ Configured and ready to use

The `.github/workflows/scheduled-scraping.yml` workflow runs scrapers automatically:

- **Schedule:** 3 times per day
  - 9:00 AM CT (morning lottery buyers)
  - 1:00 PM CT (lunch hour buyers)
  - 6:00 PM CT (evening buyers)

- **What it scrapes:**
  - Minnesota lottery games and prizes
  - Florida lottery prizes
  - Updates Supabase database directly

- **Cost:** FREE (2,000 GitHub Actions minutes/month)
- **Reliability:** High (99.9% uptime)

**Setup Required:**
1. Add Supabase credentials to GitHub Secrets:
   ```
   EXPO_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

2. Push to GitHub - workflows activate automatically

3. Manual trigger available from Actions tab

### 2. **Manual Scraping (Development/Testing)**
For immediate updates or testing:

```bash
# Scrape Minnesota games
npm run scrape

# Scrape Minnesota prizes
npm run scrape:prizes:mn

# Scrape Florida prizes
npm run scrape:prizes:fl

# Scrape everything
npm run scrape:all
```

**When to use:**
- Initial database population
- Testing scraper changes
- Emergency data refresh
- Development/debugging

### 3. **Data Freshness Monitoring (User-Facing)**
Users see when data was last updated via the `DataFreshnessBadge` component.

**Freshness Levels:**
- ✅ **Fresh** (< 1 hour): "Data updated 23 minutes ago"
- 🕐 **Recent** (1-6 hours): "Data updated 3 hours ago"
- ⚠️ **Stale** (6-24 hours): Warning shown
- ❌ **Very Stale** (> 24 hours): Strong warning

**User Actions:**
- Manual refresh button (calls scraper on-demand)
- Auto-refresh on app open if data > 6 hours old
- Transparency about data age

## Comparison of All Options

| Solution | Cost | Frequency | Setup | Reliability | Best For |
|----------|------|-----------|-------|-------------|----------|
| **GitHub Actions** | Free | 3x/day | Easy | ⭐⭐⭐⭐⭐ | Production (MVP) |
| Supabase Cron | $25/mo | Any | Medium | ⭐⭐⭐⭐ | Production (Scale) |
| AWS Lambda | $0-5/mo | Any | Hard | ⭐⭐⭐⭐⭐ | Enterprise |
| Vercel Cron | Free-$20 | 1x/day-1x/hour | Easy | ⭐⭐⭐⭐ | Vercel users |
| Manual Scripts | Free | On-demand | None | ⭐⭐ | Development |

## Current Architecture

```
┌─────────────────────┐
│  GitHub Actions     │
│  (Scheduled 3x/day) │
└──────────┬──────────┘
           │
           ├──> scrape-mn-lottery.ts
           │    └──> Supabase: games table
           │
           ├──> scrape-mn-prizes.ts
           │    └──> Supabase: prize_tiers table
           │
           └──> scrape-fl-prizes.ts
                └──> Supabase: prize_tiers table

┌─────────────────────┐
│   React Native App  │
└──────────┬──────────┘
           │
           ├──> DataFreshnessService
           │    └──> Checks last_updated timestamp
           │
           ├──> Manual Refresh Button
           │    └──> Triggers scraper workflow
           │
           └──> Auto-refresh on app open
                └──> If data > 6 hours old
```

## Recommended Scraping Frequency by Use Case

### MVP / Beta Testing
- **3x per day** (GitHub Actions - FREE)
- Good balance of freshness and resource usage
- Captures morning, afternoon, evening prize changes

### Production (< 10K users)
- **6x per day** (GitHub Actions + Supabase Cron)
- Every 4 hours
- Cost: ~$0-5/month

### Production (10K+ users)
- **Hourly** (Supabase Cron or AWS Lambda)
- Real-time data
- Cost: $25-50/month

### Enterprise (100K+ users)
- **Every 30 minutes** (AWS Lambda + CloudWatch)
- Near real-time recommendations
- Cost: $50-100/month

## Future Enhancements

### Phase 2: Webhook-Based Updates
Some lottery sites offer webhooks for prize updates:
- Instant updates when prizes claimed
- No unnecessary scraping
- Lower costs

### Phase 3: Distributed Scraping
For multiple states:
- Parallel scraper jobs
- State-specific schedules
- Regional data freshness

### Phase 4: ML-Based Scraping Optimization
- Predict when prizes likely to be claimed
- Scrape more frequently for hot games
- Reduce scraping for unpopular games

## Monitoring & Alerts

### GitHub Actions Dashboard
- View scraping history
- Check for failed runs
- Download error logs

### Supabase Logs
- Query execution times
- Database size growth
- API usage

### User-Facing Indicators
- Data freshness badge
- Last updated timestamp
- Refresh button

## Troubleshooting

### Scraper Fails
1. Check GitHub Actions logs
2. Verify Supabase credentials
3. Test locally: `npm run scrape`
4. Check lottery website structure changes

### Stale Data
1. Verify GitHub Actions are enabled
2. Check cron schedule syntax
3. Ensure Supabase credentials in secrets
4. Manually trigger workflow

### Database Errors
1. Check Supabase connection
2. Verify table schema matches
3. Check for quota limits
4. Review error logs in Supabase

## Setup Checklist

- [ ] Add Supabase secrets to GitHub
- [ ] Enable GitHub Actions on repository
- [ ] Test manual scraping locally
- [ ] Verify first scheduled run
- [ ] Add DataFreshnessBadge to UI
- [ ] Configure monitoring/alerts
- [ ] Document scraper maintenance

## Cost Estimates

### Free Tier (Recommended for Start)
- GitHub Actions: 2,000 minutes/month FREE
- Scraping time: ~5 minutes per run
- Max runs: 400/month = 13/day ✅

### Paid Tiers (For Scale)
- Supabase Pro: $25/month (includes cron)
- AWS Lambda: $0.20 per million requests
- Vercel Pro: $20/month (includes cron)

## Next Steps

1. **Immediate:** Push code to GitHub to activate scheduled workflows
2. **This Week:** Monitor first few automated runs
3. **This Month:** Add manual refresh button to UI
4. **Next Month:** Consider upgrading frequency if user growth demands
