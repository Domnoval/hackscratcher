# 🎯 SCRATCH ORACLE - RESUME CHECKPOINT
**Date Paused:** October 25, 2025
**Status:** Ready to execute critical security fixes
**Next Session:** Start with Step 1 below

---

## 🚨 WHERE WE LEFT OFF

We completed a **comprehensive 7-agent audit** and created a **3-week launch plan**. We were just starting the **highest-risk security fixes** when we paused.

### Decisions Made:
✅ **Safe Launch Strategy** (3-4 weeks to production)
✅ **MVP First, AI Later** (defer AI predictions until data collected)
✅ **Minnesota Only** at launch (defer Florida to Phase 3)
✅ **Priority:** Highest risk items → Testing → Polish → Launch

---

## 📋 CRITICAL FINDINGS SUMMARY

### 🔴 P0 CRITICAL (MUST FIX - Week 1)
1. **API Keys Exposed** in `.env` file
   - Supabase URL & anon key visible
   - Google Maps API key unrestricted
   - **Risk:** Database access, $10K+ bills
   - **Location:** `D:\Scratch_n_Sniff\scratch-oracle-app\.env`

2. **Weak RLS Policies** - Anyone can read all user data
   - **Location:** `supabase/migrations/002_user_scans_policies.sql`
   - Current: `WITH CHECK (true)` (allows anyone!)
   - **Fix:** Replace with `auth.uid() = user_id`

3. **No Authentication System** - App runs anonymous
   - Cannot enforce user-specific security
   - **Fix:** Implement Supabase Auth

4. **Age Verification Bypassable** - Legal risk
   - Currently: Just click "Yes, I'm 18+"
   - **Location:** `App.tsx:102-118`
   - **Fix:** Require actual birthdate input

5. **Algorithm Bugs** - Division by zero, invalid data
   - **Location:** `services/calculator/evCalculator.ts:51, 92-95`
   - Can crash app or give wrong recommendations

### 🟡 P1 HIGH (Week 2)
6. Testing (0% coverage currently)
7. UX improvements (onboarding, empty states)
8. Performance optimization
9. Compliance features (session limits, helplines)

---

## 🎯 IMMEDIATE NEXT STEPS (When Resuming)

### STEP 1: API Key Security (30 minutes)
**What:** Rotate keys and secure them properly

```bash
# 1. Go to Supabase dashboard
#    - Project Settings → API
#    - Reset anon key (will generate new one)
#    - Copy new key

# 2. Go to Google Cloud Console
#    - APIs & Services → Credentials
#    - Edit API key → Add restrictions:
#      - Application restrictions: Android app (SHA-1)
#      - API restrictions: Maps SDK only
#    - Or regenerate new restricted key

# 3. Update .env with new keys
#    (Make sure .env is in .gitignore - it already is ✅)

# 4. Store in EAS Secrets (for builds)
npx eas secret:create --scope project --name SUPABASE_URL --value "new_url"
npx eas secret:create --scope project --name SUPABASE_ANON_KEY --value "new_key"
npx eas secret:create --scope project --name GOOGLE_MAPS_KEY --value "new_key"
```

**Verification:**
- Old keys no longer work
- New keys restricted properly
- App still loads (test locally)

---

### STEP 2: Fix RLS Policies (1 hour)
**What:** Prevent unauthorized data access

**File to edit:** `supabase/migrations/002_user_scans_policies.sql`

**Current (INSECURE):**
```sql
CREATE POLICY "Allow anyone to insert scan results"
ON user_scans
FOR INSERT
WITH CHECK (true);  -- ❌ Anyone can insert!

CREATE POLICY "Allow anyone to read scan results"
ON user_scans
FOR SELECT
USING (true);  -- ❌ Anyone can read everything!
```

**New (SECURE):**
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Allow anyone to insert scan results" ON user_scans;
DROP POLICY IF EXISTS "Allow anyone to read scan results" ON user_scans;

-- Create secure policies
CREATE POLICY "Users can insert own scans"
ON user_scans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own scans"
ON user_scans
FOR SELECT
USING (auth.uid() = user_id);

-- Allow public read for games (they're public data)
CREATE POLICY "Anyone can read games"
ON games
FOR SELECT
USING (true);
```

**How to apply:**
1. Open Supabase Dashboard → SQL Editor
2. Paste the SQL above
3. Run it
4. Test: Try to read someone else's scan (should fail)

---

### STEP 3: Implement Auth (4 hours)
**What:** Add Supabase authentication

**Files to modify:**
- Create: `services/auth/authService.ts`
- Update: `App.tsx` (add auth check)
- Update: `lib/supabase.ts` (already configured, just needs usage)

**Implementation outline:**
```typescript
// services/auth/authService.ts
export class AuthService {
  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  static async signOut() {
    await supabase.auth.signOut();
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
}
```

---

### STEP 4: Fix Age Verification (2 hours)
**What:** Require actual birthdate, not just "click yes"

**File:** `App.tsx:102-118`

**Current (INSECURE):**
```typescript
const birthDate = new Date();
birthDate.setFullYear(birthDate.getFullYear() - 20); // Hardcoded!
```

**New (SECURE):**
```typescript
// Use DateTimePicker from @react-native-community/datetimepicker
import DateTimePicker from '@react-native-community/datetimepicker';

const [birthDate, setBirthDate] = useState(new Date());
const [showPicker, setShowPicker] = useState(false);

<DateTimePicker
  value={birthDate}
  mode="date"
  display="spinner"
  onChange={(event, selectedDate) => {
    setBirthDate(selectedDate || birthDate);
  }}
  maximumDate={new Date()} // Can't select future
  minimumDate={new Date(1900, 0, 1)} // Reasonable minimum
/>
```

---

### STEP 5: Fix Algorithm Bugs (3 hours)
**What:** Prevent crashes and wrong calculations

**File:** `services/calculator/evCalculator.ts`

**Bugs to fix:**

1. **Line 42-44:** Division by zero check
```typescript
// Add after line 44:
if (!game.total_tickets || game.total_tickets === 0) {
  return {
    baseEV: -game.price,
    adjustedEV: -game.price,
    confidence: 0.3,
    hotness: 0,
    reasons: ['Insufficient ticket data available']
  };
}
```

2. **Line 51:** Add validation
```typescript
for (const prize of game.prizes) {
  // ADD THIS:
  if (prize.remaining < 0 || prize.remaining > prize.total) {
    console.warn(`Invalid prize data for game ${game.id}`);
    continue; // Skip corrupted data
  }

  if (prize.remaining > 0) {
    const probability = prize.remaining / game.total_tickets;
    expectedWinnings += prize.amount * probability;
  }
}
```

3. **Line 92-95:** Fix array bounds
```typescript
const topPrizes = game.prizes.slice(0, Math.min(2, game.prizes.length));

// ADD THIS CHECK:
if (topPrizes.length === 0) {
  return 0; // No prizes = not hot
}

const topPrizeDepletionRate = topPrizes.reduce((sum, p) => {
  const depletionForTier = p.total > 0 ? (1 - (p.remaining / p.total)) : 0;
  return sum + depletionForTier;
}, 0) / topPrizes.length;
```

---

## 📊 3-WEEK TIMELINE (Quick Reference)

### Week 1: SECURITY & STABILITY (Nov 4-8)
- Day 1-2: Security fixes (API keys, RLS, auth)
- Day 3-4: Algorithm fixes (bugs, validation)
- Day 5: Compliance (helplines, session limits)

### Week 2: POLISH & TESTING (Nov 11-15)
- Day 6-7: UX improvements (onboarding, empty states)
- Day 8-9: Write tests (80%+ coverage)
- Day 10: Performance optimization

### Week 3: BETA & LAUNCH (Nov 18-22)
- Day 11-12: Closed beta (20 users)
- Day 13-14: App store submission
- Day 15: PUBLIC LAUNCH 🚀

**Target Date:** November 22, 2025

---

## 📁 KEY FILES TO KNOW

### Security
- `scratch-oracle-app/.env` - API keys (needs rotation)
- `supabase/migrations/002_user_scans_policies.sql` - RLS policies (needs fix)
- `lib/supabase.ts` - Supabase client (ready to use)

### Algorithm
- `services/calculator/evCalculator.ts` - EV calculations (has bugs)
- `services/recommendations/recommendationEngine.ts` - Main logic
- `services/lottery/supabaseLotteryService.ts` - Data fetching

### UI
- `App.tsx` - Main app entry (age verification here)
- `components/legal/AgeVerification.tsx` - Age gate modal
- `components/AI/*` - Defer these features

### Data
- `scripts/scrape-mn-lottery.ts` - Daily scraper (has console bug)
- `supabase/migrations/` - Database schema

---

## 🔧 TOOLS & COMMANDS

### Development
```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app

# Start app
npm start

# Run tests (when we write them)
npm test

# Type check
npx tsc --noEmit

# Scrape data manually
npm run scrape
```

### EAS (Expo Application Services)
```bash
# Store secrets
npx eas secret:create --scope project --name KEY_NAME --value "value"

# List secrets
npx eas secret:list

# Build
npx eas build --platform android --profile production
```

### Supabase
- Dashboard: https://supabase.com/dashboard
- Project: wqealxmdjpwjbhfrnplk
- SQL Editor: For running migrations

---

## 📞 WHEN YOU'RE READY TO RESUME

**Say:** "Let's resume the Scratch Oracle security fixes"

**I will:**
1. ✅ Review this document with you
2. ✅ Start with Step 1 (API key rotation)
3. ✅ Guide you through each fix step-by-step
4. ✅ Test after each change
5. ✅ Move to next step when complete

**Estimated time to complete Week 1:** 32 hours (4 full days of focused work)

---

## 💾 BACKUP REMINDER

**Before making changes:**
```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app
git add .
git commit -m "Checkpoint before security fixes"
git push
```

**This way you can always revert if needed!**

---

## 📚 HELPFUL REFERENCES

All agent reports are available in chat history:
- Security Vault Keeper Report (vulnerabilities)
- EV Algorithm Guardian Report (math bugs)
- Compliance Enforcer Report (legal requirements)
- Test Coverage Prophet Report (testing strategy)
- Performance Optimizer Report (speed improvements)
- UX Luck Designer Report (UI/UX issues)
- Data Wizard Report (scraper bugs)

**Questions?** Just ask when you resume!

---

**Status:** ✅ READY TO RESUME ANYTIME
**Next Action:** API Key Rotation (Step 1)
**Time Required:** ~30 minutes to get started
