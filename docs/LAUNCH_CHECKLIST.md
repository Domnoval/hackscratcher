# 🚀 Scratch Oracle - Launch Checklist

## Pre-Launch Checklist

Use this checklist to ensure everything is ready before submitting to Google Play Store.

---

## Phase 1: Development Environment Setup

### Package Installation
- [ ] **Restart your computer** (resolve file lock issues)
- [ ] **Install camera packages**:
  ```bash
  npm install expo-camera expo-barcode-scanner --legacy-peer-deps
  ```
- [ ] **Install notification packages**:
  ```bash
  npm install expo-notifications expo-background-fetch expo-task-manager expo-device --legacy-peer-deps
  ```
- [ ] **Install map packages**:
  ```bash
  npm install react-native-maps expo-location --legacy-peer-deps
  ```
- [ ] **Verify all packages installed**: Check `package.json`

### Configuration Files
- [x] ✅ `app.json` updated with production config
- [x] ✅ `eas.json` created for build pipeline
- [ ] **Update Google Maps API key** in `app.json`:
  - Get key from: https://console.cloud.google.com
  - Enable Maps SDK for Android
  - Add to: `android.config.googleMaps.apiKey`
- [ ] **Get EAS Project ID**:
  ```bash
  eas init
  ```
  - Add to `app.json` → `extra.eas.projectId`

---

## Phase 2: Testing

### Local Testing
- [ ] **Start development server**:
  ```bash
  npx expo start --clear
  ```
- [ ] **Test on Android device/emulator**:
  - Install Expo Go app
  - Scan QR code
  - Test all screens

### Feature Testing
- [ ] **Core Features**:
  - [ ] Age verification flow (18+)
  - [ ] Budget input and recommendations
  - [ ] EV calculations display correctly
  - [ ] Barcode scanner UI loads (camera when packages installed)
  - [ ] Win/loss tracker shows stats
  - [ ] Store heat map displays locations

- [ ] **Advanced Features**:
  - [ ] Lucky Mode calculations (numerology, moon phases)
  - [ ] AI predictions generate correctly
  - [ ] Social feed displays posts
  - [ ] Leaderboards and challenges work

- [ ] **Monetization**:
  - [ ] Free trial activation
  - [ ] Pro tier features gate correctly
  - [ ] Upgrade screen displays
  - [ ] Payment flow works (test in production)

- [ ] **Compliance**:
  - [ ] Spending limits enforce correctly
  - [ ] Responsible gambling disclaimers show
  - [ ] Privacy settings work
  - [ ] Age verification re-prompts after 90 days

### Performance Testing
- [ ] **App loads in < 3 seconds**
- [ ] **No memory leaks** (use Chrome DevTools)
- [ ] **Smooth scrolling** (60fps)
- [ ] **Offline functionality** works (cached data)
- [ ] **Push notifications** deliver (test with Expo)

---

## Phase 3: Assets & Legal

### App Store Assets
- [ ] **App Icon** (512x512 PNG):
  - Design: Vegas neon theme (#0A0A0F bg, #00FFFF cyan, #FFD700 gold)
  - Include: Dice or scratch-off motif
  - Tool: Canva, Figma, or hire designer ($50-100)

- [ ] **Feature Graphic** (1024x500 PNG):
  - Showcase: "AI-Powered Lottery Oracle"
  - Highlight: Key features (scanner, AI, heat map)
  - Include: "7-Day Free Trial" badge

- [ ] **Screenshots** (at least 2, recommended 4-8):
  - Screenshot 1: Home screen with recommendations
  - Screenshot 2: Barcode scanner in action
  - Screenshot 3: Win/loss stats dashboard
  - Screenshot 4: Store heat map
  - Screenshot 5: Lucky Mode prediction
  - Screenshot 6: AI predictions screen
  - Screenshot 7: Social feed
  - Screenshot 8: Pro upgrade screen
  - Size: 1080x1920 (portrait)
  - Tool: Android Studio emulator + screenshot

- [ ] **Promo Video** (optional, 30-60 seconds):
  - Show: Quick feature tour
  - Emphasize: "Find hot tickets with AI"
  - End: "Download now - 7 day free trial"

### Legal Documents
- [x] ✅ **Privacy Policy** created (`docs/PRIVACY_POLICY.md`)
- [x] ✅ **Terms of Service** created (`docs/TERMS_OF_SERVICE.md`)
- [ ] **Host on website**:
  - Create simple website: https://scratchoracle.app
  - Upload privacy policy: /privacy
  - Upload terms: /terms
  - Tools: Netlify, Vercel (free), or GitHub Pages

- [ ] **Support Email Setup**:
  - Create: support@scratchoracle.app
  - Create: privacy@scratchoracle.app
  - Create: legal@scratchoracle.app
  - Use: Google Workspace ($6/mo) or Zoho Mail (free)

### Store Listing Content
- [ ] **App Title**: "Scratch Oracle - Lottery Analyzer"
- [ ] **Short Description** (80 chars):
  > "AI-powered lottery analyzer. Find hot tickets, track wins, beat the odds!"

- [ ] **Full Description** (4000 chars):
  - See: `docs/DEPLOYMENT_GUIDE.md` for complete description
  - Highlight: AI predictions, barcode scanner, heat map
  - Include: Features list, pricing, disclaimer

- [ ] **Keywords/Tags**:
  - lottery, scratch off, odds calculator, Minnesota
  - Expected Value, EV, probability, gambling
  - ticket scanner, win tracker, analytics

- [ ] **Category**: Tools
- [ ] **Content Rating**: Complete IARC questionnaire → Mature 17+

---

## Phase 4: Build & Deploy

### EAS Setup
- [ ] **Install EAS CLI**:
  ```bash
  npm install -g eas-cli
  ```
- [ ] **Login to Expo**:
  ```bash
  eas login
  ```
- [ ] **Configure builds**:
  ```bash
  eas build:configure
  ```

### Test Build
- [ ] **Create preview build** (APK):
  ```bash
  eas build --platform android --profile preview
  ```
- [ ] **Download and install APK** on real device
- [ ] **Test all features** on physical device
- [ ] **Fix any issues** found

### Production Build
- [ ] **Create production build** (AAB):
  ```bash
  eas build --platform android --profile production
  ```
- [ ] **Download AAB** when complete
- [ ] **Verify build** has correct version code (1) and name (1.0.0)

---

## Phase 5: Google Play Console Setup

### Account Setup
- [ ] **Create Google Play Console account** ($25 one-time)
  - URL: https://play.google.com/console
  - Complete: Identity verification
  - Accept: Developer agreement

### App Listing
- [ ] **Create app**:
  - App name: Scratch Oracle
  - Default language: English (US)
  - App/Game: App
  - Free/Paid: Free (with in-app purchases)

- [ ] **Store listing**:
  - Upload: App icon, feature graphic, screenshots
  - Add: Short & full descriptions
  - Set: Category (Tools), Tags, Contact details
  - Privacy policy URL: https://scratchoracle.app/privacy

- [ ] **Content rating**:
  - Complete IARC questionnaire
  - Answer YES to: Gambling (simulated/informational)
  - Expected rating: Mature 17+

- [ ] **App content**:
  - Privacy policy: Link added
  - Ads: No ads (Pro tier)
  - Target audience: 18+
  - COVID-19 contact tracing: No

### In-App Products
- [ ] **Create subscription products**:
  - Product ID: `com.scratchoracle.pro.monthly`
    - Price: $2.99/month
    - Free trial: 7 days
    - Billing: Every 1 month
  - Product ID: `com.scratchoracle.pro.yearly`
    - Price: $29.99/year
    - Free trial: 7 days
    - Billing: Every 1 year

- [ ] **Activate products** when app is published

### Release Setup
- [ ] **Create internal testing release**:
  - Upload: Production AAB
  - Add: Release notes (v1.0.0 features)
  - Add: Testers (your email + 5-10 friends)
  - Rollout: 100% to internal testers

- [ ] **Test internal release**:
  - Install from internal testing track
  - Verify all features work
  - Test in-app purchases (use test account)
  - Collect feedback

---

## Phase 6: Production Release

### Pre-Launch Review
- [ ] **Double-check everything**:
  - [ ] All screenshots accurate
  - [ ] Description has no typos
  - [ ] Privacy policy accessible
  - [ ] Support email working
  - [ ] No placeholder content
  - [ ] Age verification works
  - [ ] Disclaimers visible

### Submit for Review
- [ ] **Promote to production**:
  - Go to: Production → Create new release
  - Upload: Same AAB from internal testing
  - Add: Release notes
  - Set: Rollout percentage (start 20%)
  - Submit: For review

- [ ] **Monitor review status**:
  - Typical review time: 1-7 days
  - Check email for updates
  - Respond quickly to any questions

### Go Live!
- [ ] **App approved** ✅
- [ ] **Increase rollout**: 20% → 50% → 100%
- [ ] **Monitor metrics**:
  - Crashes (should be 0%)
  - ANRs (should be < 0.5%)
  - Ratings (target 4.0+)
  - Downloads

---

## Phase 7: Marketing Launch

### Launch Day
- [ ] **Announce on social media**:
  - [ ] Reddit: r/lottery, r/minnesota (no spam, genuine post)
  - [ ] Facebook: Minnesota lottery groups
  - [ ] Twitter/X: #lottery #Minnesota #app
  - [ ] LinkedIn: Personal network

- [ ] **Product Hunt launch**:
  - Submit: https://producthunt.com/posts/new
  - Schedule: Tuesday-Thursday for best results
  - Engage: Respond to all comments

- [ ] **Press release**:
  - Send to: Local MN news outlets
  - Pitch: "Minnesota developer creates AI lottery app"
  - Include: Free trial offer, key features

### Week 1 Marketing
- [ ] **Content marketing**:
  - [ ] Blog post: "5 Hot Scratch-Offs in MN This Week"
  - [ ] YouTube video: App demo/tutorial
  - [ ] TikTok: "I found a $10,000 winner using this app"

- [ ] **Paid advertising** ($500 budget):
  - [ ] Facebook Ads: Target MN lottery players
  - [ ] Google Ads: Keyword "Minnesota lottery"
  - [ ] Reddit Ads: r/lottery community

- [ ] **Influencer outreach**:
  - [ ] Contact MN lottery YouTubers
  - [ ] Offer: Free Pro access for review
  - [ ] Ask: Honest review video

### Ongoing Marketing
- [ ] **Weekly**: Update "Hot Tickets" blog post
- [ ] **Weekly**: Social media posts (wins, tips)
- [ ] **Monthly**: Email newsletter (when 500+ users)
- [ ] **Monitor**: App Store Optimization (ASO)
  - Track: Keyword rankings
  - A/B test: Screenshots, description
  - Respond: All reviews (especially negative)

---

## Phase 8: Monitoring & Iteration

### Daily Monitoring (Week 1)
- [ ] **Check metrics**:
  - [ ] Downloads (target: 50+/day)
  - [ ] Crashes (should be 0)
  - [ ] Free trial starts
  - [ ] User reviews (respond to all)

- [ ] **Fix critical issues** within 24 hours
- [ ] **Update app** if major bugs found

### Weekly Review
- [ ] **Analyze data**:
  - Conversion: Install → Free Trial (target 30%)
  - Retention: D1 (60%), D7 (40%), D30 (20%)
  - Revenue: Trial → Paid (target 20%)
  - Engagement: Features used most

- [ ] **User feedback**:
  - Read all reviews
  - Implement top feature requests
  - Fix reported bugs

### Monthly Goals
- [ ] **Month 1**:
  - 1,000 downloads
  - 300 free trials
  - 60 paid subscribers ($180 MRR)
  - 4.0+ star rating

- [ ] **Month 3**:
  - 5,000 downloads
  - 1,500 trials
  - 300 paid subs ($900 MRR)
  - 4.5+ stars

- [ ] **Month 6**:
  - 20,000 downloads
  - Multi-state expansion (WI, IA)
  - 1,000 paid subs ($3,000 MRR)
  - Featured by Google Play

---

## Success Criteria

### Technical Success
- ✅ 0% crash rate
- ✅ < 0.5% ANR rate
- ✅ 4.0+ star rating
- ✅ All features working
- ✅ No critical bugs

### Business Success
- ✅ 1,000 downloads (Month 1)
- ✅ 30% install → trial conversion
- ✅ 20% trial → paid conversion
- ✅ $180 MRR (Month 1)
- ✅ Positive user feedback

### User Success
- ✅ Users finding value (check reviews)
- ✅ Users winning (check win feed)
- ✅ Users engaging (daily active users)
- ✅ Users referring friends (track referrals)

---

## Emergency Contacts

**If something goes wrong**:

- **App crashed for all users**:
  - Rollback: Play Console → Halt rollout
  - Fix: Push hotfix build immediately
  - Timeline: Fix within 4 hours

- **Payment issues**:
  - Contact: Google Play Support
  - Check: Google Play Console → Financial reports

- **Legal issues**:
  - Contact: Legal counsel
  - Suspend: Features if needed
  - Update: Privacy policy/Terms

- **Security breach**:
  - Notify: Users within 72 hours (CCPA requirement)
  - Fix: Patch vulnerability immediately
  - Report: To appropriate authorities

---

## Resources

### Documentation
- ✅ [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full Play Store guide
- ✅ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Fix common issues
- ✅ [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) - User privacy
- ✅ [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md) - Legal terms
- ✅ [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Complete overview

### External Resources
- Expo Docs: https://docs.expo.dev
- Google Play Console: https://play.google.com/console
- EAS Build: https://docs.expo.dev/build/introduction
- React Native Docs: https://reactnative.dev

### Support
- **Developer Support**: support@scratchoracle.app
- **Technical Issues**: See TROUBLESHOOTING.md
- **Community**: Expo Forums, Stack Overflow

---

## Final Pre-Launch Checklist

**Before you click "Submit for Review"**:

- [ ] All tests passing
- [ ] All assets uploaded
- [ ] Legal docs published
- [ ] Support email active
- [ ] In-app purchases configured
- [ ] Privacy policy accessible
- [ ] Age verification working
- [ ] Disclaimers visible
- [ ] No placeholder content
- [ ] Screenshots accurate
- [ ] Description proofread
- [ ] Release notes written
- [ ] Confident it works!

## 🎊 YOU'RE READY TO LAUNCH!

When all boxes are checked:
1. Click "Submit for Review"
2. Wait 1-7 days for approval
3. Start marketing campaigns
4. Monitor metrics daily
5. Iterate based on feedback
6. **MAKE IT RAIN!** 💰

---

**Good luck! You've built something amazing. Now go make it successful! 🚀**

---

**Questions?** Email: support@scratchoracle.app
