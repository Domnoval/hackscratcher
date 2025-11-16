# 🚀 QUICK START: Supabase + Production Build

## Part 1: Supabase Setup (10 minutes)

### 1. Create Project
- Go to: https://supabase.com/dashboard
- Click "New Project"
- Name: `scratch-oracle-production`
- Password: Generate & SAVE IT!
- Region: US East
- Click "Create" and wait 2-3 minutes

### 2. Get Credentials
Once ready:
- Go to **Settings** → **API**
- Copy **Project URL** (looks like: `https://abc123.supabase.co`)
- Copy **anon public** key (long JWT token starting with `eyJ...`)

### 3. Update .env File
Edit `D:\Scratch_n_Sniff\scratch-oracle-app\.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_NEW_URL.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY_HERE
```

### 4. Update eas.json
Replace OLD credentials in `eas.json` lines 16, 28, 40 with your NEW ones:
```json
"EXPO_PUBLIC_SUPABASE_URL": "https://YOUR_NEW_URL.supabase.co",
"EXPO_PUBLIC_SUPABASE_ANON_KEY": "YOUR_NEW_ANON_KEY",
```

### 5. Run SQL Migration
- In Supabase Dashboard → **SQL Editor**
- Click "New Query"
- Copy ENTIRE contents of `PRODUCTION_LAUNCH_PLAN.md` SQL section (lines 70-250)
- Paste and click "Run"
- Should see: "Success. No rows returned"

### 6. Test Connection
```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app
npx tsx scripts/test-supabase-connection.ts
```
Should see: ✅ Success messages

### 7. Populate Database
```bash
npm run scrape:all
```
Should import 41 games successfully!

---

## Part 2: Production Build (20 minutes)

### Option A: Build APK Locally (Faster for testing)
```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app

# Build APK
eas build --platform android --profile production --local

# This creates a .apk file you can install directly on your phone
```

### Option B: Build AAB in Cloud (For Play Store)
```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app

# Build AAB (Android App Bundle)
eas build --platform android --profile production

# Wait 15-20 minutes
# Download from: https://expo.dev/accounts/mm444/builds
```

### Test APK on Phone
```bash
# Install via ADB
adb install path/to/your.apk

# OR
# Download APK to phone and install manually
```

**Test checklist**:
- [ ] App launches without crash
- [ ] 41 games display
- [ ] Game details show correctly
- [ ] No network errors
- [ ] Smooth scrolling

---

## Part 3: Upload to Play Store (10 minutes)

### 1. Go to Play Console
- https://play.google.com/console
- Select your app (or create new)

### 2. Create Closed Testing Release
- Go to **Testing** → **Closed Testing**
- Click "Create New Release"
- Upload your AAB file
- Release notes: "Beta v1.0.12 - Real Minnesota lottery data with AI predictions"
- Click "Review Release" → "Start Rollout to Closed Testing"

### 3. Add Testers
- Create email list
- Add beta testers
- Save

### 4. Get Test Link
- Copy opt-in URL
- Send to testers
- They can install and test!

---

## Troubleshooting

### "Cannot connect to database"
- Check .env has correct URL/key
- Verify Supabase project is active (not paused)
- Run: `npx expo start --clear`

### Build fails
- Check: `eas whoami` (should show your username)
- Re-auth: `eas login`
- Try local build instead: add `--local` flag

### APK crashes
- Check logs: `adb logcat | grep Scratch`
- Clear app data: `adb shell pm clear com.scratchoracle.app`
- Reinstall APK

---

## Timeline

- ⏱️ Supabase setup: 10 min
- ⏱️ Database migration: 2 min
- ⏱️ Data population: 3 min
- ⏱️ Build APK: 20 min
- ⏱️ Test on device: 5 min
- ⏱️ Upload to Play Store: 10 min
- **Total: ~50 minutes**

---

## Need Help?

Just share your Supabase credentials (URL + anon key) and I'll:
- Update all config files
- Run database migration
- Test connection
- Start the build!
