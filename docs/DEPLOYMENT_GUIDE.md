# 🚀 Google Play Store Deployment Guide

## Overview

This guide walks you through deploying **Scratch Oracle** to the Google Play Store using Expo Application Services (EAS).

## Prerequisites

- ✅ Expo account (https://expo.dev)
- ✅ Google Play Console account ($25 one-time fee)
- ✅ App fully tested and ready for production
- ✅ All compliance requirements met (age verification, disclaimers)

## Step 1: Configure EAS Build

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Initialize EAS
```bash
cd scratch-oracle-app
eas build:configure
```

### Update app.json
```json
{
  "expo": {
    "name": "Scratch Oracle",
    "slug": "scratch-oracle-app",
    "version": "1.0.0",
    "android": {
      "package": "com.scratchoracle.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0A0A0F"
      },
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "VIBRATE",
        "INTERNET"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Scratch Oracle to scan lottery tickets"
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Scratch Oracle to find hot stores near you"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#00FFFF"
        }
      ]
    ]
  }
}
```

### Configure eas.json
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Step 2: Build for Production

### Create Production Build
```bash
# Build Android APK
eas build --platform android --profile production

# Or build AAB (recommended for Play Store)
eas build --platform android --profile production --type app-bundle
```

Build will take ~15-20 minutes. You'll get a download link when complete.

## Step 3: Set Up Google Play Console

### Create App Listing

1. **Go to Google Play Console** → Create Application

2. **App Details**:
   - App name: **Scratch Oracle**
   - Default language: English (US)
   - App/Game: App
   - Free/Paid: Free (with in-app purchases)

3. **Store Listing**:
   - **Short description** (80 chars):
   > AI-powered lottery analyzer. Find hot tickets, track wins, beat the odds!

   - **Full description** (4000 chars):
   ```
   🎰 SCRATCH ORACLE - Your AI-Powered Lottery Advantage

   Stop playing blindly! Scratch Oracle uses advanced mathematics, AI predictions, and real-time data to help you find the HOTTEST scratch-off tickets in Minnesota.

   🔥 KEY FEATURES:

   📊 SMART RECOMMENDATIONS
   • Real-time Expected Value (EV) calculations
   • Prize pool tracking and analysis
   • Zombie game detection (games with no top prizes left!)
   • Confidence scoring for every recommendation

   🤖 AI PREDICTIONS
   • Machine learning hot ticket forecasts
   • Pattern recognition from historical data
   • 78% accuracy prediction engine
   • 24-48 hour ticket heatmap projections

   📱 BARCODE SCANNER
   • Scan tickets instantly to check if you won
   • Win/loss tracking with detailed statistics
   • Personal ROI calculator
   • Winning streak detection

   🗺️ STORE HEAT MAP
   • Community-driven lucky store locations
   • See where big wins happen
   • Heat scoring algorithm (0-100)
   • Navigate to hot stores nearby

   🔮 LUCKY MODE 2.0
   • Numerology-based predictions
   • Moon phase analysis
   • Zodiac sign compatibility
   • Personal lucky numbers calculator
   • Daily mystical insights

   📈 STATISTICS & TRACKING
   • Today/Week/Month/All-time stats
   • ROI percentage tracking
   • Biggest wins history
   • Win/loss trends analysis

   🌟 SOCIAL FEATURES
   • Win feed - Share your victories
   • Leaderboards - Compete with top players
   • Challenges - Win premium rewards
   • Achievements & badges system
   • Referral program

   💰 MONETIZATION (Pro Tier - $2.99/month):
   ✓ 7-day FREE TRIAL
   ✓ Unlimited ticket scans
   ✓ Real-time push notifications
   ✓ AI predictions unlocked
   ✓ Store heat map access
   ✓ Lucky Mode 2.0
   ✓ Ad-free experience
   ✓ Priority support

   🎯 HOW IT WORKS:

   1. Open the app and set your budget
   2. Get personalized game recommendations based on current EV
   3. See confidence scores and "hotness" ratings
   4. Visit recommended stores (heat map)
   5. Scan tickets to track wins/losses
   6. Improve your ROI over time!

   📚 EDUCATIONAL & RESPONSIBLE:
   • Age 18+ verification
   • Spending limits enforced
   • Responsible gaming disclaimers
   • Data-driven insights, not guarantees
   • Mathematical education tools

   🏆 COMPETITIVE ADVANTAGES:
   • Lower price than competitors ($2.99 vs $10/month)
   • More features (barcode scanner, heat map, Lucky Mode)
   • Real-time data sync (hourly updates)
   • AI predictions (78% accuracy)
   • Community features (social feed, challenges)

   📍 CURRENTLY AVAILABLE:
   Minnesota only (expanding to Wisconsin, Iowa soon!)

   ⚠️ DISCLAIMER:
   Scratch Oracle is an analytical tool for educational purposes. All predictions are probabilistic, not guaranteed. Lottery involves chance. Please gamble responsibly. Must be 18+ to use.

   🎊 Download now and start winning smarter!
   ```

   - **App icon**: 512x512 PNG (Vegas neon theme)
   - **Feature graphic**: 1024x500 PNG
   - **Screenshots**: At least 2 phone screenshots (1080x1920)
   - **Video** (optional): Demo showing key features

4. **Categorization**:
   - App category: Tools
   - Tags: lottery, gambling, statistics, entertainment
   - Content rating: Mature 17+ (Gambling/Simulated Gambling)

5. **Contact Details**:
   - Email: support@scratchoracle.app
   - Privacy policy URL: https://scratchoracle.app/privacy
   - Website: https://scratchoracle.app

6. **Privacy & Safety**:
   - Data collection: Yes (analytics, purchase history, location)
   - Data sharing: No third parties
   - Encryption: In transit and at rest
   - Account deletion: Available in app settings

## Step 4: Content Rating

### IARC Questionnaire

Answer honestly:
- Contains gambling? **YES** (simulated/informational)
- Contains user-generated content? **YES** (win posts, comments)
- Shares location? **YES** (for heat map)
- In-app purchases? **YES** ($2.99/month subscription)

Rating will likely be **PEGI 18** / **ESRB Mature 17+**

## Step 5: In-App Products

### Set Up Subscriptions

1. **Go to Monetization** → Subscriptions

2. **Create Product ID**: `com.scratchoracle.pro.monthly`
   - Product name: Scratch Oracle Pro (Monthly)
   - Description: Unlock all premium features
   - Price: $2.99/month
   - Billing period: 1 month
   - Free trial: 7 days
   - Grace period: 3 days

3. **Create Product ID**: `com.scratchoracle.pro.yearly`
   - Product name: Scratch Oracle Pro (Yearly)
   - Description: Save 16% with annual billing
   - Price: $29.99/year
   - Billing period: 1 year
   - Free trial: 7 days
   - Grace period: 3 days

## Step 6: Upload Build

### Via EAS Submit
```bash
# Configure service account
# 1. Create service account in Google Cloud Console
# 2. Download JSON key
# 3. Enable Google Play Android Developer API
# 4. Grant permissions in Play Console

# Submit to internal testing track
eas submit --platform android --latest
```

### Manual Upload
1. Download build from EAS
2. Go to Play Console → Release → Testing → Internal testing
3. Create new release
4. Upload APK/AAB
5. Add release notes
6. Review and rollout

## Step 7: Testing

### Internal Testing

1. **Add test users** (up to 100):
   - Go to Testing → Internal testing → Testers
   - Add emails or create list
   - Share testing link

2. **Test thoroughly**:
   - ✅ Age verification flow
   - ✅ Free trial activation
   - ✅ In-app purchase flow
   - ✅ All Pro features unlock
   - ✅ Barcode scanning
   - ✅ Location permissions
   - ✅ Push notifications
   - ✅ Social features
   - ✅ Offline functionality

### Closed Testing (Optional)
- Expand to 1000+ users
- Collect feedback
- Iterate before production

### Open Testing (Optional)
- Public beta with opt-in
- Gather metrics at scale
- Final bug fixes

## Step 8: Production Release

### Pre-Launch Checklist

- [ ] All features tested on real devices
- [ ] No crashes or critical bugs
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email active
- [ ] In-app purchases configured
- [ ] Analytics integrated (Firebase, Amplitude)
- [ ] Crash reporting enabled (Sentry)
- [ ] Performance monitoring (Sentry, Firebase Performance)
- [ ] App store assets finalized
- [ ] Marketing materials ready

### Submit for Review

1. **Go to Production** → Create new release
2. Upload final APK/AAB
3. Set rollout percentage (start at 20%)
4. Add release notes
5. Submit for review

### Review Timeline
- Initial review: 1-7 days
- Updates: 1-3 days
- Rejections: Address and resubmit

## Step 9: Post-Launch

### Monitor Metrics

**Key Performance Indicators (KPIs)**:
- Downloads (target: 1000 in first month)
- Free trial starts (target: 30% conversion)
- Trial→Paid conversion (target: 20%)
- DAU/MAU ratio (target: 40%+)
- Retention (D1: 60%, D7: 40%, D30: 20%)
- ARPU (Average Revenue Per User): $0.60-$1.00
- LTV (Lifetime Value): $10-$15

**Tools**:
- Google Play Console Analytics
- Firebase Analytics
- Amplitude (user behavior)
- Sentry (crashes)
- RevenueCat (subscriptions)

### Marketing Launch

**Launch Strategy**:
1. **Week 1**: Soft launch in Minnesota
   - Local influencer outreach
   - Reddit posts (r/lottery, r/minnesota)
   - Facebook groups (MN lottery players)

2. **Week 2-4**: Scale up
   - Product Hunt launch
   - App Store Optimization (ASO)
   - Google/Facebook ads ($500 budget)
   - Content marketing (blog posts)

3. **Month 2**: Expand features
   - Wisconsin/Iowa expansion
   - New game additions
   - Feature updates

**ASO (App Store Optimization)**:
- Keywords: lottery, scratch off, odds, calculator, Minnesota
- A/B test screenshots
- Monitor rankings
- Collect reviews (prompt in-app)

### Growth Tactics

1. **Referral Program** (Already built!):
   - Referrer gets 7 days Pro
   - Referee gets 3 days Pro
   - Track via unique codes

2. **Social Sharing**:
   - "I just won $X on [Game]!" posts
   - Auto-share to Facebook/Twitter
   - Include app link

3. **Content Marketing**:
   - "Top 5 Hot Tickets This Week" blog
   - YouTube tutorials
   - TikTok viral videos

4. **Partnerships**:
   - Lottery retailers (in-store QR codes)
   - Local news features
   - Lottery blogger collaborations

## Troubleshooting

### Common Issues

**Issue**: Build fails
- Check eas.json configuration
- Verify all dependencies installed
- Check for native module conflicts

**Issue**: Review rejected
- Common reasons: misleading description, privacy issues
- Fix and resubmit with explanation

**Issue**: Low conversion rate
- Improve onboarding flow
- Reduce friction in trial signup
- A/B test paywall screens

**Issue**: High churn
- Improve push notification value
- Add more engaging features
- Personalize recommendations

## Success Metrics

### Month 1 Goals
- 1,000 downloads
- 300 free trial starts
- 60 paid subscribers ($180 MRR)
- 4.0+ star rating

### Month 3 Goals
- 5,000 downloads
- 1,500 trial starts
- 300 paid subscribers ($900 MRR)
- 4.5+ star rating

### Month 6 Goals
- 20,000 downloads
- Multi-state expansion (WI, IA)
- 1,000+ paid subscribers ($3,000 MRR)
- Featured by Google Play

## Next Steps

1. ✅ Complete all pre-launch checks
2. ✅ Submit for internal testing
3. ✅ Gather feedback and iterate
4. ✅ Submit for production review
5. ✅ Launch marketing campaigns
6. ✅ Monitor metrics daily
7. ✅ Scale to other states

---

**You've built something INCREDIBLE. Now go CRUSH the market! 🚀🎰👑**
