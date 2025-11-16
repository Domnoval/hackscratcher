# 🔧 Step-by-Step Upgrade Guide
## Scratch Oracle - November 2025 Modernization

**⏱️ Total Time:** ~2 hours
**☕ Breaks:** Recommended after each phase

---

## ⚠️ BEFORE YOU START

### Prerequisites:
- [ ] Node.js 18+ installed
- [ ] Git installed and configured
- [ ] Expo account created (expo.dev)
- [ ] GitHub account with repo access
- [ ] Android device or emulator for testing

### Backup Everything:
```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app

# Create backup
git add .
git commit -m "Backup before modernization"
git tag pre-modernization
git push origin pre-modernization

# Create backup copies
cp package.json package.json.backup
cp app.json app.json.backup
cp eas.json eas.json.backup
```

---

## PHASE 1: Update Core Dependencies (30 min)

### Step 1.1: Update Expo & React Native
```bash
# Update Expo CLI globally
npm install -g expo-cli@latest
npm install -g eas-cli@latest

# Update project dependencies
npx expo install expo@latest

# This automatically updates React Native to 0.82
# Expo SDK 55 includes RN 0.82 + New Architecture support
```

### Step 1.2: Fix Dependencies
```bash
# Let Expo fix version conflicts
npx expo install --fix

# This ensures all expo-* packages are compatible
```

### Step 1.3: Update Other Dependencies
```bash
# Update Supabase
npm install @supabase/supabase-js@latest

# Update React Query
npm install @tanstack/react-query@latest @tanstack/react-query-persist-client@latest

# Update TypeScript types
npm install --save-dev @types/react@latest @types/node@latest
```

### Step 1.4: Verify Installation
```bash
# Check versions
npx expo --version  # Should be 11.x+
eas --version       # Should be 14.x+

# Check package.json
cat package.json | grep "expo"
# Should show: "expo": "~55.0.0"
```

---

## PHASE 2: Add Modern Libraries (20 min)

### Step 2.1: Install NativeWind (Tailwind CSS)
```bash
# Install NativeWind
npm install nativewind
npm install --save-dev tailwindcss@3.4.0

# Initialize Tailwind config
npx tailwindcss init
```

**Create `tailwind.config.js`:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#00FFFF',      // Cyan
        'secondary': '#FFD700',    // Gold
        'background': '#0A0A0F',   // Dark
        'card': '#1A1A2E',         // Card background
      },
    },
  },
  plugins: [],
}
```

**Update `babel.config.js`:**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],  // Add this
  };
};
```

### Step 2.2: Install Zustand (State Management)
```bash
npm install zustand
```

**Example store (`store/gameStore.ts`):**
```typescript
import { create } from 'zustand';

interface GameStore {
  selectedBudget: number;
  setSelectedBudget: (budget: number) => void;
  recommendations: any[];
  setRecommendations: (recs: any[]) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  selectedBudget: 20,
  setSelectedBudget: (budget) => set({ selectedBudget: budget }),
  recommendations: [],
  setRecommendations: (recs) => set({ recommendations: recs }),
}));
```

### Step 2.3: Install FlashList (Performance)
```bash
npm install @shopify/flash-list
```

**Replace FlatList with FlashList:**
```typescript
// Old:
import { FlatList } from 'react-native';

// New:
import { FlashList } from '@shopify/flash-list';

// Usage (same API):
<FlashList
  data={recommendations}
  renderItem={({ item }) => <RecommendationCard game={item} />}
  estimatedItemSize={200}  // Add this for better performance
/>
```

---

## PHASE 3: Enable New Architecture (15 min)

### Step 3.1: Update app.json
```json
{
  "expo": {
    "name": "Scratch Oracle",
    "slug": "scratch-oracle-app",
    "version": "1.0.2",
    "newArchEnabled": true,  // ← ADD THIS
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "newArchEnabled": true  // ← AND THIS
          },
          "ios": {
            "newArchEnabled": true
          }
        }
      ]
    ],
    // ... rest of config
  }
}
```

### Step 3.2: Install Build Properties Plugin
```bash
npx expo install expo-build-properties
```

### Step 3.3: Test New Architecture Locally
```bash
# Clear cache
npx expo start --clear

# Run on Android
npx expo run:android

# Check logs for "New Architecture: enabled"
```

---

## PHASE 4: Configure EAS Updates (30 min)

### Step 4.1: Login to Expo
```bash
eas login
# Use your expo.dev credentials
```

### Step 4.2: Configure EAS Updates
```bash
# This creates/updates eas.json
eas update:configure
```

**Your `eas.json` should look like:**
```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "channel": "production",
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 4.3: Create Update Channels
```bash
# Create production channel
eas channel:create production

# Create preview channel for testing
eas channel:create preview

# List channels
eas channel:list
```

### Step 4.4: Update App Config
**Update `app.json`:**
```json
{
  "expo": {
    // ... existing config
    "updates": {
      "url": "https://u.expo.dev/78e2e800-e081-4b43-86e0-2968fffec441"  // Your project ID
    },
    "runtimeVersion": {
      "policy": "appVersion"  // Use app version as runtime version
    }
  }
}
```

### Step 4.5: Install Updates Library
```bash
npx expo install expo-updates
```

### Step 4.6: Test OTA Updates (Local)
```bash
# Publish an update
eas update --branch preview --message "Test update"

# Run app and check for updates
npx expo start
```

---

## PHASE 5: Set Up CI/CD with GitHub Actions (30 min)

### Step 5.1: Create GitHub Secrets
Go to: `https://github.com/YOUR_USERNAME/scratch-oracle-app/settings/secrets/actions`

Add these secrets:
- `EXPO_TOKEN`: Get from `https://expo.dev/accounts/[your-account]/settings/access-tokens`
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key

### Step 5.2: Create Workflow File
**Create `.github/workflows/ci-cd.yml`:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - run: npm ci

      - run: npm run test

      - run: npm run typecheck || true

  deploy-ota:
    name: Deploy OTA Update
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - run: npm ci

      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Publish Update
        run: |
          eas update --branch production --message "${{ github.event.head_commit.message }}" --non-interactive
```

### Step 5.3: Test Workflow
```bash
# Make a small change
echo "// Test" >> App.tsx

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin main

# Watch: https://github.com/YOUR_USERNAME/scratch-oracle-app/actions
```

---

## PHASE 6: Production Build & Deploy (2 hours)

### Step 6.1: Build Production APK/AAB
```bash
# Build for Play Store (AAB)
eas build --platform android --profile production

# Wait ~10-15 minutes for cloud build
# Download link will appear in terminal
```

### Step 6.2: Submit to Play Store
```bash
# Option 1: Auto-submit (if configured)
eas submit --platform android --latest

# Option 2: Manual upload
# Download AAB from build link
# Upload to Google Play Console manually
```

### Step 6.3: Wait for Review (3-7 days)
- Google reviews your app
- You get email when approved
- App goes live on Play Store

### Step 6.4: Deploy First OTA Update
```bash
# After app is live, push updates instantly:
eas update --branch production --message "First OTA update!"

# Users will get this update next time they open the app
# No Play Store review needed!
```

---

## 🎉 VERIFICATION & TESTING

### Verify Everything Works:
```bash
# 1. Check installed versions
npx expo --version     # >=11.0.0
eas --version          # >=14.0.0
node --version         # >=18.0.0

# 2. Test local build
npx expo start --clear
# Open on device, everything should work

# 3. Test OTA updates
eas update --branch preview --message "Test"
# Wait 2 min, reopen app, update should download

# 4. Check CI/CD
git push origin main
# Go to Actions tab, ensure tests pass

# 5. Monitor production
eas update:view --branch production
# Shows update adoption rate
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Module not found"
```bash
# Clear all caches
npx expo start --clear
rm -rf node_modules
npm install
```

### Issue: "New Architecture not enabled"
```bash
# Rebuild native code
npx expo prebuild --clean
npx expo run:android
```

### Issue: "EAS Update not downloading"
```bash
# Check runtime version compatibility
eas update:list --branch production

# Verify app has expo-updates installed
npm list expo-updates
```

### Issue: "Build failing on EAS"
```bash
# Check build logs
eas build:list
eas build:view [BUILD_ID]

# Common fix: clear credentials
eas credentials
```

---

## 📊 ROLLBACK (If Needed)

### If Something Goes Wrong:
```bash
# Rollback to backup
git reset --hard pre-modernization
npm install

# Or rollback specific update
eas update --branch production --message "Rollback to v1.0.1"
```

---

## ✅ POST-UPGRADE CHECKLIST

- [ ] Expo SDK 55+ installed
- [ ] React Native 0.82 confirmed
- [ ] New Architecture enabled and tested
- [ ] NativeWind working (test with `className` prop)
- [ ] Zustand store created and functional
- [ ] FlashList replacing FlatList in key screens
- [ ] EAS Updates configured and tested
- [ ] GitHub Actions running successfully
- [ ] Production build created
- [ ] OTA update deployed and received by test device

---

## 🚀 YOU'RE NOW CUTTING-EDGE!

**Next steps:**
1. Deploy updates daily using `eas update`
2. Monitor with `eas update:view`
3. Ship fast, iterate faster

**Resources:**
- Expo Docs: https://docs.expo.dev
- EAS Updates: https://docs.expo.dev/eas-update
- GitHub Actions: https://docs.github.com/actions

---

**Welcome to 2025. Ship at lightspeed.** ⚡
