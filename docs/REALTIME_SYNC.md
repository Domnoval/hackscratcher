# Real-Time Data Sync & Push Notifications

## 🚀 Overview

Scratch Oracle's real-time sync system keeps lottery data fresh and alerts users instantly when opportunities arise. This is a **key competitive advantage** over competitors like ScratchOdds and LottoEdge.

## 🏗️ Architecture

### 1. **Data Sync Service** (`services/sync/dataSyncService.ts`)

**Core Functions:**
- Scrapes live Minnesota Lottery data every hour
- Detects changes: new games, retired games, hot tickets
- Caches data locally for offline access
- Runs in background using `expo-background-fetch` and `expo-task-manager`

**Key Features:**
```typescript
// Sync data and detect changes
const result = await DataSyncService.syncData();
// Returns: { newGames, retiredGames, hotGames, timestamp }

// Check if sync is needed
const needsSync = await DataSyncService.needsSync();

// Register background sync (runs every hour)
await DataSyncService.registerBackgroundSync();
```

**Hot Game Detection:**
The algorithm detects when a game is "heating up":
- Tracks when 2+ big prizes ($1000+) are claimed
- This makes remaining smaller prizes more valuable
- Triggers instant "Hot Ticket Alert" notification

### 2. **Notification Service** (`services/notifications/notificationService.ts`)

**Notification Types:**
1. 🎮 **New Games** - When MN Lottery launches new scratch-offs
2. 🔥 **Hot Tickets** - When games heat up (big prizes claimed)
3. 🎉 **Big Wins** - Community feature: nearby big winners
4. 💎 **Daily Recommendations** - Personalized morning picks
5. 💰 **Price Alerts** - Ticket price changes

**Core Functions:**
```typescript
// Initialize notifications
await NotificationService.initialize();

// Process sync results and send alerts
await NotificationService.processSyncResults(syncResult);

// Send specific alerts
await NotificationService.sendBigWinAlert('Lucky 7s', 77777, 'Target on Lake St');
await NotificationService.sendDailyRecommendation();

// Schedule daily recommendations (10am default)
await NotificationService.scheduleDailyRecommendation(10, 0);
```

**Smart Features:**
- Quiet hours support (no notifications during sleep)
- Granular controls (toggle each notification type)
- Android notification channels for priority handling
- Badge count management

### 3. **Background Sync Task**

**How it works:**
```typescript
// Task runs every hour automatically
TaskManager.defineTask('LOTTERY_DATA_SYNC', async () => {
  const result = await DataSyncService.syncData();

  if (result.success) {
    // Automatically triggers notifications via NotificationService
    return BackgroundFetch.BackgroundFetchResult.NewData;
  }

  return BackgroundFetch.BackgroundFetchResult.NoData;
});
```

**Sync Interval:** 1 hour (3600000ms)
- Balances freshness with battery life
- Can be adjusted per user preference in Pro tier

## 📱 UI Components

### 1. **NotificationSettingsScreen** (`components/Settings/NotificationSettingsScreen.tsx`)

Full-featured settings UI:
- Permission status display
- Master enable/disable toggle
- Individual notification type toggles
- Test notification button
- Quiet hours configuration (future)
- Info cards explaining each alert type

### 2. **SyncStatusBanner** (`components/Sync/SyncStatusBanner.tsx`)

Real-time sync status:
- Color-coded status dot:
  - 🟢 Green: < 30 min ago
  - 🟡 Gold: < 1 hour ago
  - 🔴 Red: > 1 hour (needs sync)
- Manual sync button with pulse animation
- Shows sync results (new games, hot tickets)
- Auto-updates every minute

## 🔥 Competitive Advantages

### vs. ScratchOdds ($10/month)
- ✅ **Instant alerts** (they don't have push notifications)
- ✅ **Hot ticket detection** (we detect EV spikes in real-time)
- ✅ **Community wins** (social proof of nearby winners)
- ✅ **Lower price** ($2.99/month vs $10/month)

### vs. LottoEdge ($5/month)
- ✅ **Background sync** (always up-to-date without opening app)
- ✅ **Personalized daily picks** (push notification each morning)
- ✅ **Price change alerts** (catch opportunities immediately)

## 📊 Data Flow

```
1. Background Task (Every Hour)
   ↓
2. DataSyncService.syncData()
   ↓
3. Scrape MN Lottery Website
   ↓
4. Detect Changes (new/retired/hot games)
   ↓
5. Cache Updated Data
   ↓
6. NotificationService.processSyncResults()
   ↓
7. Send Relevant Push Notifications
   ↓
8. Update UI (SyncStatusBanner)
   ↓
9. User Gets Instant Alert 🔔
```

## 🛠️ Installation

**Required Packages:**
```bash
npm install expo-notifications expo-background-fetch expo-task-manager expo-device --legacy-peer-deps
```

**Setup in App:**
```typescript
import { DataSyncService } from './services/sync/dataSyncService';
import { NotificationService } from './services/notifications/notificationService';

// In App.tsx useEffect:
useEffect(() => {
  // Initialize notifications
  NotificationService.initialize();

  // Register background sync
  DataSyncService.registerBackgroundSync();

  // Do initial sync
  DataSyncService.syncData().then(result => {
    NotificationService.processSyncResults(result);
  });

  // Schedule daily recommendations
  NotificationService.scheduleDailyRecommendation(10, 0); // 10am
}, []);
```

## 🎯 User Experience

**First Launch:**
1. App requests notification permission
2. User grants permission
3. Background sync registers automatically
4. Initial data sync runs
5. User sees "Updated just now" status

**Hourly Sync (Background):**
1. Task wakes up at hour mark
2. Scrapes latest lottery data
3. Detects 2 games are hot (big prizes claimed)
4. Sends push notifications: "🔥 HOT TICKET ALERT! Lucky 7s is heating up!"
5. User taps notification → opens to game details
6. User buys hot ticket → better odds!

**Daily Recommendation (10am):**
1. Scheduled notification fires
2. Analyzes all games based on user's budget/profile
3. Sends: "💎 Today's Top Pick: Cash Blast - 85% hot! EV: 0.73"
4. User sees notification → opens app → buys recommended ticket

## 🚧 Current Status

**✅ Completed:**
- Data sync service with change detection
- Notification service with all alert types
- Settings UI for granular control
- Sync status banner for real-time feedback
- Background task architecture

**⏳ Pending (Package Installation):**
- `expo-notifications` - Currently blocked by EPERM file lock
- `expo-background-fetch` - Same issue
- `expo-task-manager` - Same issue
- `expo-device` - Same issue

**Once packages are installed:**
1. Uncomment package imports in all files
2. Test notification permissions flow
3. Test background sync (use expo-dev-client for testing)
4. Deploy to TestFlight/Google Play for real device testing

## 🎨 Notification Examples

**New Game Alert:**
```
🎮 New Games Available!
Check out: Lucky Strike, Diamond Dash

[Tap to view details]
```

**Hot Ticket Alert:**
```
🔥 HOT TICKET ALERT!
Cash Blast is heating up! Big prizes being claimed.

[Tap to see why]
```

**Daily Recommendation:**
```
💎 Today's Top Pick
Lucky 7s - 92% hot! EV: 0.81
Perfect for your $20 budget

[Tap to buy]
```

**Big Win Alert (Community):**
```
🎉 BIG WIN NEARBY!
Someone just won $77,777 on Lucky 7s at Target on Lake St!

[See hot stores map]
```

## 🔮 Future Enhancements

1. **Smart Sync Frequency** - Increase frequency when user is active
2. **Geofencing** - Alert when near hot stores
3. **Predictive Alerts** - ML model predicts next hot ticket
4. **Social Proof** - Show real-time win feed in notifications
5. **Quiet Hours** - Auto-detect sleep schedule
6. **Priority Alerts** - Different notification sounds per type

---

**This system positions Scratch Oracle as the most responsive, real-time lottery app on the market. 🚀**
