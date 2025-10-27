# 🤖 Automated Daily Scraper Setup

**Purpose:** Collect daily prize data to train AI model

**Goal:** 14+ days of data before enabling AI predictions

---

## ✅ Quick Setup (Windows Task Scheduler)

### Option 1: Easy Setup (Manual)

1. **Open Task Scheduler:**
   - Press `Win + R`
   - Type `taskschd.msc`
   - Press Enter

2. **Create New Task:**
   - Click "Create Task" (right sidebar)
   - Name: `Scratch Oracle Daily Scraper`
   - Description: `Collect lottery data for AI training`
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges"

3. **Triggers Tab:**
   - Click "New..."
   - Begin the task: `On a schedule`
   - Settings: `Daily`
   - Start: `3:00 AM` (off-peak hours)
   - Recur every: `1 days`
   - Click "OK"

4. **Actions Tab:**
   - Click "New..."
   - Action: `Start a program`
   - Program/script: `D:\Scratch_n_Sniff\scratch-oracle-app\run-daily-scrapers.bat`
   - Start in: `D:\Scratch_n_Sniff\scratch-oracle-app`
   - Click "OK"

5. **Conditions Tab:**
   - Uncheck "Start only if on AC power"
   - Check "Wake computer to run this task"

6. **Settings Tab:**
   - Check "Allow task to be run on demand"
   - Check "Run task as soon as possible after scheduled start is missed"
   - If task fails, restart: `Every 1 hour`
   - Attempt to restart: `3 times`

7. **Save:**
   - Click "OK"
   - Enter your Windows password if prompted

---

## Option 2: PowerShell Setup (Automated)

Run this in PowerShell (as Administrator):

```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "D:\Scratch_n_Sniff\scratch-oracle-app\run-daily-scrapers.bat" -WorkingDirectory "D:\Scratch_n_Sniff\scratch-oracle-app"

$trigger = New-ScheduledTaskTrigger -Daily -At 3am

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -WakeToRun -RestartCount 3 -RestartInterval (New-TimeSpan -Hours 1)

Register-ScheduledTask -TaskName "Scratch Oracle Daily Scraper" -Action $action -Trigger $trigger -Settings $settings -Description "Collect lottery data for AI training" -RunLevel Highest
```

---

## 🧪 Test It Now

Before scheduling, test the script:

```bash
cd D:\Scratch_n_Sniff\scratch-oracle-app
.\run-daily-scrapers.bat
```

You should see:
1. MN scraper runs (~30-60 seconds)
2. FL scraper runs (~30-60 seconds)
3. Success message
4. Log written to `scraper-log.txt`

---

## 📊 Monitoring

### Check Scraper Logs
```bash
# View recent runs
type scraper-log.txt

# View last 10 lines
powershell Get-Content scraper-log.txt -Tail 10
```

### Check Supabase Data
1. Go to: https://supabase.com/dashboard
2. Open your project
3. Go to Table Editor
4. Check `prize_snapshots` table
5. Should see new rows daily

### Check Task Scheduler Status
1. Open Task Scheduler
2. Find "Scratch Oracle Daily Scraper"
3. Check "Last Run Result" (should be 0x0 for success)
4. Check "Last Run Time"
5. Check "Next Run Time"

---

## 🚨 Troubleshooting

### Scraper Fails
**Problem:** Script runs but scraper fails

**Solutions:**
1. Check internet connection
2. Check Supabase credentials in `.env`
3. Test manually: `npm run scrape:prizes:mn`
4. Check `scraper-log.txt` for errors

### Task Doesn't Run
**Problem:** Scheduled task doesn't execute

**Solutions:**
1. Check Task Scheduler → Task History
2. Ensure "Run whether user is logged on or not" is checked
3. Ensure "Wake computer to run task" is checked
4. Test: Right-click task → "Run"

### Computer Sleeps
**Problem:** Task missed because computer was asleep

**Solutions:**
1. Enable "Wake computer to run this task" (Conditions tab)
2. Enable "Run task as soon as possible after missed" (Settings tab)
3. Consider running at a time when computer is usually on

---

## 📈 AI Training Timeline

**Day 1-3:** Initial data collection
- Scraper runs daily
- Building baseline dataset
- ~10-30 games tracked

**Day 4-7:** Pattern detection
- Prize depletion rates visible
- Game popularity trends emerge
- ~50-100 data points

**Day 8-14:** Model readiness
- Sufficient data for training
- Can start ML model training
- ~150-300 data points

**Day 15+:** AI predictions enabled!
- Model trained and validated
- AI predictions go live
- Users see AI scores

---

## 🎯 Next Steps After Setup

1. ✅ Set up Task Scheduler (above)
2. ⏳ Wait 14 days for data collection
3. 🤖 Train ML model: `npm run train-model`
4. 🎨 Enable AI UI features
5. 🚀 Launch AI predictions to users

---

## 📝 Manual Run (Anytime)

Want to run scrapers manually?

```bash
# MN only
npm run scrape:prizes:mn

# FL only
npm run scrape:prizes:fl

# Both
npm run scrape:all
```

---

**Set this up now and forget about it!**
The scrapers will run daily in the background, collecting data for your AI model. 🎉
