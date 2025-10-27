# 🚀 Google Play Store Deployment Checklist

**Goal:** Get Scratch Oracle live in Google Play Store (Internal Testing first)

**Timeline:** Today! Then iterate to production.

---

## ✅ Pre-Deployment Checklist

### 1. App Build ⏳
- [ ] EAS Build complete
- [ ] Download AAB file
- [ ] Test AAB locally (optional)
- **Status:** Building now (5-15 min)
- **URL:** https://expo.dev/accounts/mm444/projects/scratch-oracle-app/builds/cc9d67b1-3c93-4f95-b5b8-6551bfcdeb1d

### 2. Legal Documents ✅
- [x] Privacy Policy created (PRIVACY_POLICY.md)
- [x] Terms of Service created (TERMS_OF_SERVICE.md)
- [ ] Host these on a website (required by Google)
- **Action Needed:** Upload to a public URL
- **Options:**
  - GitHub Pages (free, easy)
  - Your domain
  - Netlify/Vercel (free hosting)

### 3. Play Store Listing Content ✅
- [x] App description written (PLAY_STORE_LISTING.md)
- [x] Short description (80 chars)
- [x] Keywords list
- [ ] Screenshots (need to take)
- [ ] Feature graphic (need to create)
- [ ] App icon (already have in assets/)

### 4. Scrapers & AI Training ✅
- [x] MN scraper working
- [x] Daily automation script created
- [ ] Task Scheduler configured
- **Action:** Run `setup-daily-scraper.ps1` as Admin

---

## 📋 Google Play Console Setup

### Step 1: Create Google Play Console Account

**If you don't have an account:**
1. Go to: https://play.google.com/console
2. Click "Sign up"
3. Pay one-time $25 registration fee
4. Complete developer profile

**If you have an account:**
1. Go to: https://play.google.com/console
2. Sign in

### Step 2: Create New App

1. Click "Create app"
2. Fill in details:
   - **App name:** Scratch Oracle
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
   - **Declarations:** Check all required boxes

3. Click "Create app"

### Step 3: Store Listing

Navigate to: **Store presence → Store listing**

#### Required Fields:

**App name:** Scratch Oracle

**Short description:** (max 80 chars)
```
Smart lottery scratch-off picks. Make data-driven decisions. 18+ only.
```

**Full description:** (Copy from PLAY_STORE_LISTING.md - already written!)

**App icon:**
- Upload from `assets/icon.png`
- Must be 512 x 512px

**Feature graphic:** (Need to create)
- 1024 x 500px
- PNG or JPEG
- No transparency

**Phone screenshots:** (Need to take)
- At least 2 required
- Recommended: 4-8
- 1080 x 1920px

**Category:**
- **App category:** Tools
- **Content rating:** Will be determined by questionnaire

**Contact details:**
- **Email:** support@scratchoracle.com (or your email)
- **Phone:** (Optional)
- **Website:** (Optional for now)

**Privacy policy:**
- **URL:** (Need to host PRIVACY_POLICY.md)
- **Action:** Create GitHub Pages or host somewhere

### Step 4: Content Rating

Navigate to: **Policy → App content → Content rating**

Click "Start questionnaire"

**Answer honestly:**
- Violence: None
- Sex/Nudity: None
- Drugs: None
- Gambling: **Yes - Simulated gambling/lottery info**
- User interaction: Yes (login)
- Shares location: No
- Digital purchases: No

**Expected rating:** ESRB Teen or Mature due to gambling content

### Step 5: Target Audience

Navigate to: **Policy → App content → Target audience and content**

**Target age group:**
- 18 and over ONLY
- Check "18 and over"

**Store listing:**
- Will be marked "Mature 17+"

### Step 6: Privacy Policy & Data Safety

Navigate to: **Policy → App content → Privacy policy**

**Privacy policy URL:**
- Must host PRIVACY_POLICY.md on public URL
- Enter URL here

**Data safety:**
- Click "Start"
- Answer questions about data collection:
  - ✅ Collect email, password
  - ✅ Collect usage data
  - ❌ Don't sell data
  - ❌ Don't share with third parties (except services)
- Follow wizard

### Step 7: App Access

Navigate to: **Policy → App content → App access**

- Choose: "All or some functionality is restricted"
- Reason: Age verification (18+)
- Provide test account credentials:
  - Email: test@scratchoracle.com
  - Password: [Create test account]

### Step 8: Ads

Navigate to: **Policy → App content → Ads**

- Select: **No, my app does not contain ads**

---

## 🚀 Upload Build (Internal Testing)

### Step 1: Create Internal Testing Track

1. Go to: **Testing → Internal testing**
2. Click "Create new release"

### Step 2: Upload AAB

1. Click "Upload"
2. Select the AAB file from EAS Build download
3. Wait for upload to complete

**File name:** `scratch-oracle-app-[version].aab`

### Step 3: Release Notes

**What's new in this release:**
```
🎉 Initial Beta Release!

✨ Features:
• Smart scratch-off game recommendations
• Expected Value (EV) calculations
• Minnesota & Florida support
• 18+ age verification
• Responsible gaming tools
• Beautiful onboarding flow
• Empty states & loading skeletons
• Performance optimized

🛡️ Security:
• Certificate pinning
• Input validation
• Secure authentication

🎯 This is a beta test release. Please report any bugs or feedback!
```

### Step 4: Add Internal Testers

1. Create tester list:
   - Name: "Internal Testers"
   - Add email addresses (yourself + team)

2. Save and send invitations

### Step 5: Review and Roll Out

1. Review all information
2. Click "Review release"
3. Click "Start rollout to Internal testing"

**Wait time:**
- Internal testing: Usually live within 1-2 hours
- No Google review required for internal testing!

---

## 📸 Create Screenshots (Quick Method)

### Option 1: Take from Running App

1. Start app: `npm start`
2. Open in browser or Expo Go
3. Use device/browser screenshot tool
4. Resize to 1080 x 1920px

**Tools:**
- Browser: F12 → Device toolbar → Screenshot
- Phone: Native screenshot
- Resize: Use online tool or Photoshop

### Option 2: Use Expo Device Frames

1. Take raw screenshots
2. Add device frames
3. Add captions
4. Tool: https://screenshots.pro or similar

### Screenshots to Take:

1. **Onboarding Screen** - Show beautiful intro
2. **Recommendations List** - Show 3 games with scores
3. **Game Details** - Show detailed game info
4. **State Selector** - Show MN/FL toggle
5. **Responsible Gaming** - Show helpline button

---

## 🎨 Create Feature Graphic (Quick)

### Option 1: Canva (Easy)
1. Go to Canva.com
2. Custom size: 1024 x 500px
3. Use template or create:
   - Background: Dark (#0A0A0F)
   - Logo: Scratch Oracle
   - Tagline: "Smart Lottery Decisions"
   - Phone mockup (optional)
   - Gold/cyan colors

### Option 2: Figma (Better)
1. Create 1024 x 500px canvas
2. Design feature graphic
3. Export as PNG

### Quick Placeholder:
- Use app icon on dark background
- Add text: "Scratch Oracle - Smart Lottery Picks"
- Save as PNG

---

## 🌐 Host Legal Documents

### Quick Option: GitHub Pages

1. Create new repo: `scratch-oracle-legal`
2. Add files:
   - `privacy.html` (convert PRIVACY_POLICY.md to HTML)
   - `terms.html` (convert TERMS_OF_SERVICE.md to HTML)
3. Enable GitHub Pages
4. URLs will be:
   - `https://[username].github.io/scratch-oracle-legal/privacy.html`
   - `https://[username].github.io/scratch-oracle-legal/terms.html`

### Alternative: Simple HTML Host
```html
<!DOCTYPE html>
<html>
<head>
    <title>Scratch Oracle - Privacy Policy</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #00FFFF; }
        h2 { color: #FFD700; }
    </style>
</head>
<body>
    <!-- Paste converted markdown here -->
</body>
</html>
```

---

## ⏱️ Timeline to Live

### Internal Testing (Today):
1. ✅ Build complete (15 min)
2. Screenshots (30 min)
3. Feature graphic (15 min)
4. Host legal docs (15 min)
5. Play Console setup (30 min)
6. Upload build (10 min)
7. **Total: ~2 hours** → Live in internal testing!

### Production (Week 1-2):
1. Internal testing (3-7 days)
2. Fix bugs, collect feedback
3. Submit for production review
4. Google review (1-3 days)
5. **Live in Play Store!**

---

## 🐛 Common Issues

### Build Failed
- Check build logs: https://expo.dev
- Usually: Missing dependencies or syntax errors
- Re-run: `npx eas build --platform android --profile production`

### Privacy Policy Required
- Google requires public URL
- Can't upload without it
- Use GitHub Pages (free)

### Screenshots Wrong Size
- Must be exactly 1080 x 1920px
- Use online resizer
- PNG or JPEG format

### Content Rating Issues
- Be honest about gambling content
- App will be rated Mature/Teen
- That's expected and OK

---

## 📞 Need Help?

**EAS Build Issues:**
- Docs: https://docs.expo.dev/build/introduction/
- Forum: https://forums.expo.dev/

**Play Console Issues:**
- Help: https://support.google.com/googleplay/android-developer
- Common issues: https://support.google.com/googleplay/android-developer/answer/9859455

---

## ✅ Final Checklist Before Submission

- [ ] AAB file downloaded from EAS
- [ ] Privacy policy hosted (public URL)
- [ ] Terms of service hosted (public URL)
- [ ] At least 2 screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] App icon uploaded (512x512px)
- [ ] Short description (under 80 chars)
- [ ] Full description
- [ ] Content rating questionnaire complete
- [ ] Data safety section complete
- [ ] Internal testers added
- [ ] Release notes written

**Once all checked → Click "Start rollout to Internal testing"**

---

## 🎉 Success!

Once uploaded:
1. Check email for confirmation
2. Testers receive invitation
3. App shows in Play Store (internal link)
4. Collect feedback
5. Iterate and improve
6. Submit for production when ready!

**Next:** After 3-7 days of internal testing with no critical bugs → Submit for production review!
