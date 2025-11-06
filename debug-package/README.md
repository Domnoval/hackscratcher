# 📦 Scratch Oracle - Debug Package v1.0.10

**Package Date:** November 5, 2025
**Status:** App crashes on launch - needs debugging

---

## 📂 What's Inside

```
debug-package/
├── README.md                          ← You are here
├── QUICK-START.md                     ← Fast overview + proposed fix
├── DEBUG-HANDOFF-PACKAGE.md          ← Complete documentation (READ THIS)
├── crash-logs-v1.0.10.txt            ← Full Android logcat output
├── App.tsx                           ← Main app component
├── app.config.js                     ← App configuration & version
├── package.json                      ← Dependencies
├── components/
│   ├── recommendations/
│   │   └── RecommendationCard.tsx    ← Renders WinTracker (problem here)
│   └── tracking/
│       └── WinTracker.tsx            ← Uses Supabase (crashes here)
└── lib/
    └── supabase.ts                   ← Supabase client initialization
```

---

## 🎯 Start Here

1. **Read QUICK-START.md** (2 minutes) for immediate context
2. **Read DEBUG-HANDOFF-PACKAGE.md** (10 minutes) for full details
3. **Review crash-logs-v1.0.10.txt** for error logs
4. **Check the code files** listed above

---

## 🔴 The Problem in 30 Seconds

**What happens:** App crashes immediately after launch with `TypeError: undefined is not a function`

**Why:** The `WinTracker` component (used in `RecommendationCard`) imports and calls Supabase methods, but Supabase client initialization is broken in production builds.

**Where:**
- Crash occurs in `AppContent` component (App.tsx)
- Root cause: `WinTracker.tsx` line 67 calls `supabase.from('user_scans').insert()`
- Even though we disabled Supabase initialization everywhere else!

**Proposed fix:** Disable `WinTracker` component temporarily (see QUICK-START.md)

---

## 📞 Questions?

See **DEBUG-HANDOFF-PACKAGE.md** section "Questions for Debugger" for specific technical questions.

---

## ✅ Quick Checklist

Before debugging:
- [ ] Read QUICK-START.md
- [ ] Read DEBUG-HANDOFF-PACKAGE.md
- [ ] Review crash logs
- [ ] Understand the crash chain (see DEBUG-HANDOFF-PACKAGE.md)

For the fix:
- [ ] Comment out WinTracker in RecommendationCard.tsx
- [ ] Update version to 1.0.11 in app.config.js
- [ ] Build with EAS: `npx eas build --platform android --profile preview`
- [ ] Test on Android emulator
- [ ] Verify app launches successfully

---

**Good luck! 🍀**
