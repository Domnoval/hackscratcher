# 🐛 Scratch Oracle App - Debug Handoff Package
**Version:** 1.0.10
**Date:** November 5, 2025
**Status:** App crashes immediately on launch (production build only)
**Platform:** Android (React Native / Expo)

---

## 📋 Executive Summary

The Scratch Oracle Android app builds successfully but **crashes immediately on launch** in production builds. The crash occurs during component initialization with a `TypeError: undefined is not a function` error in the `AppContent` component.

**Key Discovery:** The crash is caused by Supabase initialization even though we've disabled:
- ✅ AuthProvider wrapper
- ✅ Auth screens
- ✅ FeatureFlagService.enableSupabase()
- ❌ **WinTracker component still imports and uses Supabase** ← Root cause

---

## 🔴 The Error

### Error Message
```
ReactNativeJS: { [TypeError: undefined is not a function]
  componentStack: '\n    at AppContent (address at index.android.bundle:1:780432)\n    at QueryClientProvider (address at index.android.bundle:1:857331)
```

### Full Error Context
```
11-05 05:22:25.344  7809  7836 I ReactNativeJS: '[Supabase] Environment check:', { hasExpoConfig: true,
11-05 05:22:25.344  7809  7836 I ReactNativeJS:   hasExtra: true,
11-05 05:22:25.344  7809  7836 I ReactNativeJS:   hasUrl: true,
11-05 05:22:25.344  7809  7836 I ReactNativeJS:   hasKey: true,
11-05 05:22:25.344  7809  7836 I ReactNativeJS:   url: 'https://wqealxmdjpwj...' }
11-05 05:22:25.359  7809  7836 I ReactNativeJS: Running "main"
11-05 05:22:25.448  7809  7836 E ReactNativeJS: { [TypeError: undefined is not a function]
11-05 05:22:25.448  7809  7836 E ReactNativeJS:   componentStack: '\n    at AppContent (address at index.android.bundle:1:780432)\n    at QueryClientProvider (address at index.android.bundle:1:857331)\n    at RNCSafeAreaProvider (<anonymous>)\n    at SafeAreaProvider (address at index.android.bundle:1:786837)\n    at App (<anonymous>)\n    at RCTView (<anonymous>)\n    at View (address at index.android.bundle:1:199777)\n    at AppContainer (address at index.android.bundle:1:439561)',
11-05 05:22:25.448  7809  7836 E ReactNativeJS:   isComponentError: true }
11-05 05:22:25.449  7809  7836 I ReactNativeJS: '[FeatureFlags] Using defaults:', { useSupabaseData: false,
11-05 05:22:25.449  7809  7836 I ReactNativeJS:   enableAIScores: false,
11-05 05:22:25.449  7809  7836 I ReactNativeJS:   enableOfflineMode: true,
11-05 05:22:25.449  7809  7836 I ReactNativeJS:   enablePredictionCache: true }
11-05 05:22:25.449  7809  7836 I ReactNativeJS: '[App] Feature flags initialized:', 'Using MOCK data for testing'
11-05 05:22:25.482  7809  7837 E AndroidRuntime: FATAL EXCEPTION: mqt_v_native
```

**Note:** Feature flags show `useSupabaseData: false` but crash still occurs!

---

## 🔍 Root Cause Analysis

### The Crash Chain
1. `App.tsx` → `AppContent` component renders
2. `AppContent` eventually renders `RecommendationCard` component
3. `RecommendationCard` (line 49) renders `<WinTracker />` component
4. `WinTracker.tsx` (line 12) imports `supabase` from `lib/supabase.ts`
5. `lib/supabase.ts` (line 37) calls `createClient(supabaseUrl, supabaseAnonKey)`
6. When `WinTracker` tries to call `supabase.from('user_scans').insert()` (line 67), **it crashes**

### Why It Crashes
Even though we disabled Supabase initialization in the app flow, the `WinTracker` component still imports and tries to use the Supabase client. The client is initialized when the module loads, but something about the production build environment causes `supabase.from()` to be undefined or broken.

---

## 📁 Key Files Involved

### 1. **App.tsx** (Main App Component)
**Location:** `D:\Scratch_n_Sniff\scratch-oracle-app\App.tsx`

**Relevant sections:**
- Lines 108-125: `initializeApp()` function
- Line 114: `await FeatureFlagService.enableSupabase()` ← **COMMENTED OUT in v1.0.10**
- Lines 69-71: `useAuth()` hooks ← **COMMENTED OUT**
- Lines 341-383: Auth screen rendering ← **COMMENTED OUT**

```typescript
// Line 108-116
const initializeApp = async () => {
  try {
    // Initialize feature flags first
    await FeatureFlagService.initialize();

    // AUTH DISABLED - Don't enable Supabase features for now
    // await FeatureFlagService.enableSupabase();

    console.log('[App] Feature flags initialized:', FeatureFlagService.getStatusMessage());
```

### 2. **RecommendationCard.tsx** (Renders WinTracker)
**Location:** `D:\Scratch_n_Sniff\scratch-oracle-app\components\recommendations\RecommendationCard.tsx`

**Problem:** Line 4 imports WinTracker, Line 49 renders it:
```typescript
// Line 4
import { WinTracker } from '../tracking';

// Lines 48-54
{/* Win Tracking - Help us improve! */}
<WinTracker
  gameId={item.gameId}
  gameName={item.game.name}
  gamePrice={item.game.price}
/>
```

### 3. **WinTracker.tsx** (Uses Supabase directly)
**Location:** `D:\Scratch_n_Sniff\scratch-oracle-app\components\tracking\WinTracker.tsx`

**Problem:** Lines 12 and 67:
```typescript
// Line 12 - Imports Supabase
import { supabase } from '../../lib/supabase';

// Lines 62-73 - Calls Supabase
const saveResult = async (won: boolean, amount: number) => {
  setIsSaving(true);

  try {
    // Save to user_scans table
    const { error } = await supabase.from('user_scans').insert({
      game_id: gameId,
      was_winner: won,
      prize_amount: amount,
      scan_date: new Date().toISOString(),
      // user_id will be null for now (add auth later)
    });
```

### 4. **lib/supabase.ts** (Supabase Client)
**Location:** `D:\Scratch_n_Sniff\scratch-oracle-app\lib\supabase.ts`

**Initialization code (lines 25-49):**
```typescript
// Lines 25-35 - Environment validation
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage =
    'Missing Supabase environment variables.\n' +
    'Supabase URL: ' + (supabaseUrl ? 'OK' : 'MISSING') + '\n' +
    'Supabase Key: ' + (supabaseAnonKey ? 'OK' : 'MISSING') + '\n' +
    'Constants.expoConfig: ' + (Constants.expoConfig ? 'exists' : 'MISSING') + '\n' +
    'Constants.expoConfig.extra: ' + (Constants.expoConfig?.extra ? 'exists' : 'MISSING');

  console.error('[Supabase] ' + errorMessage);
  throw new Error(errorMessage);
}

// Lines 37-49 - Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    // Use custom fetch with SSL certificate pinning for all Supabase requests
    // In development (__DEV__), use regular fetch since SSL pinning doesn't work in Expo Go
    fetch: __DEV__ ? fetch : (pinnedFetch as unknown as typeof fetch),
  },
});
```

---

## 🔧 What We've Tried

### Version 1.0.9 (Failed)
- ❌ Removed `AuthProvider` wrapper from App component
- ❌ Commented out auth screens (SignInScreen, SignUpScreen)
- ❌ Commented out `useAuth()` hooks
- **Result:** Still crashed with same error

### Version 1.0.10 (Failed)
- ❌ All changes from v1.0.9
- ❌ Commented out `await FeatureFlagService.enableSupabase()` in `initializeApp()`
- **Result:** Still crashed with same error
- **Discovery:** WinTracker component still uses Supabase directly!

---

## 🎯 Proposed Solution (Not Yet Implemented)

### Option A: Disable WinTracker Component
**Quick fix to get app launched:**

1. Comment out WinTracker import in `RecommendationCard.tsx`:
```typescript
// Line 4
// import { WinTracker } from '../tracking';
```

2. Comment out WinTracker rendering in `RecommendationCard.tsx`:
```typescript
// Lines 48-54
{/* DISABLED: WinTracker requires Supabase
<WinTracker
  gameId={item.gameId}
  gameName={item.game.name}
  gamePrice={item.game.price}
/>
*/}
```

### Option B: Make WinTracker Optional/Conditional
**Better long-term solution:**

1. Check feature flags before rendering WinTracker:
```typescript
// In RecommendationCard.tsx
import { FeatureFlagService } from '../../services/config/featureFlags';

// In component:
{FeatureFlagService.isSupabaseEnabled() && (
  <WinTracker
    gameId={item.gameId}
    gameName={item.game.name}
    gamePrice={item.game.price}
  />
)}
```

2. Add null checks in WinTracker before calling Supabase:
```typescript
const saveResult = async (won: boolean, amount: number) => {
  if (!supabase) {
    Alert.alert('Feature Unavailable', 'Win tracking is not available in offline mode.');
    return;
  }
  // ... rest of code
}
```

### Option C: Mock Supabase Client
**Alternative approach:**

Create a mock Supabase client for offline mode that doesn't crash but stores data locally.

---

## 🏗️ Build Information

### EAS Build Details
- **Build ID:** f6615408-885c-4db6-8a6a-d83d63360760
- **Platform:** Android
- **Profile:** preview
- **SDK Version:** 54.0.0
- **Version:** 1.0.10
- **Version Code:** 11
- **Build Time:** 13 minutes 18 seconds
- **APK Size:** 66.8 MB
- **Status:** Completed successfully
- **Download URL:** https://expo.dev/artifacts/eas/wqAAjW36Zotx3r7js1xcGL.apk
- **Build Logs:** https://expo.dev/accounts/mm444/projects/scratch-oracle-app/builds/f6615408-885c-4db6-8a6a-d83d63360760

### Git Information
- **Commit:** c6152a3f6a46dafea3f62683ef31f1951d9b447a
- **Commit Message:** "v1.0.10: Disable ALL Supabase initialization"
- **Branch:** master (assumed)
- **Repository:** Scratch Oracle App

---

## 💻 Environment Details

### Development Environment
- **Working Directory:** `D:\Scratch_n_Sniff\scratch-oracle-app`
- **Platform:** Windows (win32)
- **Date:** November 5, 2025

### React Native / Expo Stack
- **Expo SDK:** 54.0.0
- **React Native:** (version in SDK 54)
- **React Query:** @tanstack/react-query (version TBD)
- **Supabase JS:** @supabase/supabase-js (version TBD)

### Key Dependencies (package.json)
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "@tanstack/react-query": "^5.x.x",
    "expo": "~54.0.0",
    "react": "18.x.x",
    "react-native": "0.76.x",
    "react-native-safe-area-context": "^4.x.x",
    "@react-native-async-storage/async-storage": "^2.x.x"
  }
}
```

### Android Testing Environment
- **Emulator:** Android Studio Emulator
- **ADB Path:** `C:\Users\Domno\AppData\Local\Android\Sdk\platform-tools\adb.exe`
- **Testing Method:** Manual APK installation via adb

---

## 📝 Steps to Reproduce

1. **Clone repository** (if not already)
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure EAS (if needed):**
   ```bash
   npx eas build:configure
   ```

4. **Build preview APK:**
   ```bash
   npx eas build --platform android --profile preview --non-interactive
   ```

5. **Download APK when build completes:**
   ```bash
   curl -o scratch-oracle-v1.0.10.apk -L [build-artifact-url]
   ```

6. **Install on Android device/emulator:**
   ```bash
   adb install -r scratch-oracle-v1.0.10.apk
   ```

7. **Launch app:**
   ```bash
   adb shell am start -n com.scratchoracle.app/.MainActivity
   ```

8. **Monitor logs:**
   ```bash
   adb logcat | grep -E "(FATAL|ReactNativeJS)"
   ```

9. **Observe crash** within 1-2 seconds of launch

---

## 📊 Complete Crash Logs

**Full crash logs exported to:** `crash-logs-v1.0.10.txt`

**Key sections:**

### Supabase Initialization Logs
```
11-05 05:22:25.344  7809  7836 I ReactNativeJS: '[Supabase] Environment check:', { hasExpoConfig: true,
11-05 05:22:25.344  7809  7836 I ReactNativeJS:   hasExtra: true,
11-05 05:22:25.344  7809  7836 I ReactNativeJS:   hasUrl: true,
11-05 05:22:25.344  7809  7836 I ReactNativeJS:   hasKey: true,
11-05 05:22:25.344  7809  7836 I ReactNativeJS:   url: 'https://wqealxmdjpwj...' }
```

### Feature Flag Logs
```
11-05 05:22:25.449  7809  7836 I ReactNativeJS: '[FeatureFlags] Using defaults:', { useSupabaseData: false,
11-05 05:22:25.449  7809  7836 I ReactNativeJS:   enableAIScores: false,
11-05 05:22:25.449  7809  7836 I ReactNativeJS:   enableOfflineMode: true,
11-05 05:22:25.449  7809  7836 I ReactNativeJS:   enablePredictionCache: true }
11-05 05:22:25.449  7809  7836 I ReactNativeJS: '[App] Feature flags initialized:', 'Using MOCK data for testing'
```

### Crash Error
```
11-05 05:22:25.448  7809  7836 E ReactNativeJS: { [TypeError: undefined is not a function]
11-05 05:22:25.448  7809  7836 E ReactNativeJS:   componentStack: '\n    at AppContent (address at index.android.bundle:1:780432)\n    at QueryClientProvider (address at index.android.bundle:1:857331)\n    at RNCSafeAreaProvider (<anonymous>)\n    at SafeAreaProvider (address at index.android.bundle:1:786837)\n    at App (<anonymous>)\n    at RCTView (<anonymous>)\n    at View (address at index.android.bundle:1:199777)\n    at AppContainer (address at index.android.bundle:1:439561)',
11-05 05:22:25.448  7809  7836 E ReactNativeJS:   isComponentError: true }
11-05 05:22:25.482  7809  7837 E AndroidRuntime: FATAL EXCEPTION: mqt_v_native
```

---

## ❓ Questions for Debugger

1. **Is the Supabase client initialization failing silently?**
   - The logs show environment vars are present, but `supabase.from()` seems undefined

2. **Could this be related to SSL certificate pinning?**
   - Line 47 in `lib/supabase.ts` uses `pinnedFetch` in production
   - Could this be causing the client to initialize incorrectly?

3. **Is there a timing issue?**
   - WinTracker is rendered immediately when RecommendationCard loads
   - Could the Supabase client not be ready yet?

4. **Are there bundling issues?**
   - Could the production build be tree-shaking or minifying something incorrectly?
   - Metro bundler configuration issue?

5. **Could this be an AsyncStorage issue?**
   - Supabase uses AsyncStorage for auth persistence (line 39)
   - Could AsyncStorage be unavailable when client initializes?

---

## 🎯 Next Steps

### Immediate (Get app launched):
1. **Disable WinTracker component** (Option A above)
2. Build v1.0.11 with WinTracker disabled
3. Test on emulator
4. If successful, build production AAB and upload to Play Console

### Short-term (Fix properly):
1. Implement conditional WinTracker rendering based on feature flags (Option B)
2. Add proper error handling in WinTracker
3. Add retry logic and fallback for Supabase calls
4. Consider implementing local storage fallback for offline mode

### Long-term (Improve architecture):
1. Implement dependency injection for Supabase client
2. Create service layer that abstracts Supabase away from components
3. Add proper initialization lifecycle management
4. Consider alternative auth solutions (Firebase, Auth0, etc.)

---

## 📦 Files Included in This Package

1. **DEBUG-HANDOFF-PACKAGE.md** (this file) - Complete debug documentation
2. **crash-logs-v1.0.10.txt** - Full device logs from crash
3. **App.tsx** - Main app component
4. **components/recommendations/RecommendationCard.tsx** - Component that renders WinTracker
5. **components/tracking/WinTracker.tsx** - Component that crashes
6. **lib/supabase.ts** - Supabase client initialization
7. **app.config.js** - App configuration with version info
8. **package.json** - Dependencies

---

## 🆘 Contact Information

**Project:** Scratch Oracle App
**Developer:** mm444 (Expo account)
**Package:** com.scratchoracle.app

**For questions or updates, please contact the project owner.**

---

## 📌 Quick Reference

**Crash occurs at:** `AppContent` component initialization
**Error type:** `TypeError: undefined is not a function`
**Root cause:** `WinTracker` component imports and uses Supabase directly
**Quick fix:** Comment out WinTracker in RecommendationCard.tsx (lines 4 and 49-54)
**Build to test:** v1.0.11 (next version)

---

*Package created: November 5, 2025*
*Last updated: November 5, 2025*
*Status: Ready for external debugging*
