# 🎯 Scanner Feature - Quick Implementation Plan

**Status:** Post-Launch Feature (Week 4+)
**Priority:** HIGH - Game Changer
**Effort:** 3-5 days (Phase 1), +3-5 days (Phase 2 if API approved)

---

## Phase 1: Basic Scanner (No API) - LAUNCH FIRST

### What It Does:
1. Scan PDF417 barcode on lottery tickets
2. Extract ticket ID and game info
3. Display to user
4. Link to MN Lottery official checker

### Tech Stack:
- `react-native-vision-camera` (already in package, just excluded)
- ML Kit barcode scanner
- Camera permissions

### Implementation:
```typescript
// New screen: /screens/ScannerScreen.tsx
// New component: /components/scanner/BarcodeScanner.tsx
// New service: /services/scanner/ticketDecoder.ts
```

### Timeline: 3-5 days post-launch

---

## Phase 2: Full Auto-Check (If API Approved)

### Prerequisites:
- API access from MN Lottery
- Legal agreement signed
- API credentials

### What It Adds:
- Automatic winner validation
- Prize amount display
- Scan history with results
- Push notifications for wins

### Timeline: +3-5 days after API approval

---

## API Request Email (Draft Ready)

**To:** cs.support@mnlottery.com
**Subject:** API Partnership Request - Scratch Oracle App

See: MN_LOTTERY_API_REQUEST_DRAFT.txt

---

## Next Steps:
1. ✅ Research complete
2. ✅ Plan documented
3. Launch Play Store first
4. Add scanner feature (Week 4)
5. Send API request email
6. Wait for response
7. Implement Phase 2 if approved

---

**Value:** Huge differentiator, viral potential, user love it!
