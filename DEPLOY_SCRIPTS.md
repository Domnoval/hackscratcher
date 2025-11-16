# Deploy Scripts Reference

Quick reference for all EAS Update deployment scripts available in package.json.

---

## Production Deployments

### Standard Production Update

```bash
npm run update:production "Your update message"
```

**Example:**
```bash
npm run update:production "Fix lottery prize display bug"
```

**When to use:**
- Bug fixes
- New features (after QA)
- Performance improvements
- UI updates

**Time:** 12-15 minutes

---

### Auto-Message Production Update

```bash
npm run update:production:auto
```

**What it does:**
- Uses your last git commit message as the update message
- Automatically formats message

**Example workflow:**
```bash
git add .
git commit -m "Fix lottery prize display bug"
npm run update:production:auto
# Update message will be: "Auto update: Fix lottery prize display bug"
```

**When to use:**
- When your commit message is descriptive
- To save time
- For consistent messaging

---

## Preview Deployments

### Standard Preview Update

```bash
npm run update:preview "Your update message"
```

**Example:**
```bash
npm run update:preview "New analytics dashboard - ready for QA"
```

**When to use:**
- Before production deploy
- Team testing
- QA validation
- Stakeholder review

**Time:** 12-15 minutes

---

### Auto-Message Preview Update

```bash
npm run update:preview:auto
```

**Example workflow:**
```bash
git add .
git commit -m "Add lottery analytics dashboard"
npm run update:preview:auto
# Update message will be: "Auto update: Add lottery analytics dashboard"
```

---

## Development Deployments

### Standard Development Update

```bash
npm run update:development "Your update message"
```

**Example:**
```bash
npm run update:development "Experimenting with new map UI"
```

**When to use:**
- Rapid iteration
- Experimental features
- Developer testing
- Unstable code

**Time:** 12-15 minutes

---

## Rollback & Recovery

### Emergency Rollback

```bash
npm run update:rollback
```

**What it does:**
- Immediately republishes the last known good update to production
- Fastest way to recover from bad deployment

**When to use:**
- Production is broken
- Critical bug introduced
- Emergency recovery needed

**Time:** 5-8 minutes

---

## Monitoring & Inspection

### View Latest Update

```bash
npm run update:view
```

**What it shows:**
- Latest update details
- Branch/channel
- Runtime version
- Publish timestamp
- Message
- Status

**Example output:**
```
Branch: production
Runtime Version: 1.0.2
Message: Fix lottery prize display bug
Published: 2 minutes ago
Status: Published
```

---

### List All Updates

```bash
npm run update:list
```

**What it shows:**
- All recent updates
- Update group IDs
- Timestamps
- Branches
- Messages

**Use for:**
- Finding specific update to rollback to
- Viewing update history
- Debugging update issues

---

### View Updates for Specific Branch

```bash
# Not in package.json, but useful command
eas update:list --branch production
eas update:list --branch preview
eas update:list --branch development
```

---

## Build Commands

### Build Production

```bash
npm run build:production
```

**What it does:**
- Builds Android AAB for Google Play Store
- Uses production channel
- Auto-increments version code

**When to use:**
- Initial app submission
- Native code changes
- Expo SDK upgrades
- New native dependencies

**Time:** 20-30 minutes

---

### Build Preview

```bash
npm run build:preview
```

**What it does:**
- Builds Android APK for internal testing
- Uses preview channel
- Can be shared directly with team

**When to use:**
- Testing before store submission
- Internal team distribution
- QA builds

**Time:** 15-20 minutes

---

## Common Workflows

### Workflow 1: Standard Feature Deploy

```bash
# 1. Develop locally
npm start

# 2. Commit changes
git add .
git commit -m "Add new feature"

# 3. Deploy to preview
npm run update:preview:auto

# 4. After QA approval, deploy to production
npm run update:production:auto

# 5. Verify deployment
npm run update:view
```

---

### Workflow 2: Quick Bug Fix

```bash
# 1. Fix bug locally

# 2. Test fix
npm start

# 3. Commit
git add .
git commit -m "Fix critical bug"

# 4. Optional: Quick preview test
npm run update:preview:auto

# 5. Deploy to production
npm run update:production:auto

# 6. Monitor
npm run update:view
```

---

### Workflow 3: Experimental Development

```bash
# 1. Create feature branch
git checkout -b feature/new-ui

# 2. Develop and iterate
npm run update:development "New UI iteration 1"
# ... make changes ...
npm run update:development "New UI iteration 2"
# ... make changes ...
npm run update:development "New UI iteration 3"

# 3. When ready, merge and promote
git checkout main
git merge feature/new-ui
npm run update:preview "New UI - ready for review"

# 4. After approval
npm run update:production "Launch new UI"
```

---

### Workflow 4: Emergency Rollback

```bash
# 1. Detect issue in production
npm run update:view

# 2. Immediate rollback
npm run update:rollback

# 3. Verify rollback
npm run update:view

# 4. Communicate to team
# "Production rolled back due to [issue]"

# 5. Fix issue locally and redeploy
npm run update:production "HOTFIX: Resolve [issue]"
```

---

## Script Customization

All scripts are defined in `package.json`:

```json
{
  "scripts": {
    "update:production": "eas update --branch production --message",
    "update:preview": "eas update --branch preview --message",
    "update:development": "eas update --branch development --message",
    "update:production:auto": "eas update --branch production --message \"Auto update: $(git log -1 --pretty=%B)\"",
    "update:preview:auto": "eas update --branch preview --message \"Auto update: $(git log -1 --pretty=%B)\"",
    "update:rollback": "eas update --branch production --message \"Rollback\" --republish",
    "update:list": "eas update:list",
    "update:view": "eas update:view",
    "build:production": "eas build --platform android --profile production",
    "build:preview": "eas build --platform android --profile preview"
  }
}
```

---

## Advanced Commands (Not in Scripts)

### Platform-Specific Update

```bash
# Android only
eas update --branch production --platform android --message "Android fix"

# iOS only (when added)
eas update --branch production --platform ios --message "iOS fix"
```

---

### Update for Specific Runtime Version

```bash
eas update --branch production --runtime-version "1.0.1" --message "Update for v1.0.1"
```

---

### Republish Specific Update

```bash
# First, find update ID
npm run update:list

# Then republish
eas update --branch production --republish --group <update-group-id>
```

---

### View Channel Configuration

```bash
eas channel:list
eas channel:view production
```

---

## Troubleshooting Scripts

### Check Authentication

```bash
eas whoami
```

**If not logged in:**
```bash
eas login
```

---

### Verify Configuration

```bash
# Check eas.json
cat eas.json

# Check app.json
cat app.json

# View project info
eas project:info
```

---

### Test Build Locally

```bash
# Export bundle (tests if update will build)
npx expo export

# Check bundle size
du -sh dist/
```

---

### TypeScript Check

```bash
npm run typecheck
```

**Add to package.json if not present:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

---

### Run Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

---

## Environment Variables

Scripts automatically use environment variables from `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "...",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "...",
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "..."
      }
    }
  }
}
```

These are embedded in updates automatically.

---

## Tips & Best Practices

### 1. Always Use Descriptive Messages

```bash
# Good
npm run update:production "Fix map crash on Android 13"

# Bad
npm run update:production "fix"
```

---

### 2. Verify Before Production

```bash
# Always check what you're deploying
git status
git diff

# Then deploy
npm run update:production "Your message"
```

---

### 3. Monitor After Deploy

```bash
# Deploy
npm run update:production "Your message"

# Immediately verify
npm run update:view

# Check again in 5 minutes
npm run update:view
```

---

### 4. Use Auto-Message for Speed

```bash
# Instead of typing message twice
git commit -m "Fix lottery prize bug"
npm run update:production:auto

# Faster than
git commit -m "Fix lottery prize bug"
npm run update:production "Fix lottery prize bug"
```

---

### 5. Keep Commit History Clean

```bash
# Good commit messages = good update messages
git commit -m "Fix lottery prize calculation rounding error"
npm run update:production:auto
# Update message: "Auto update: Fix lottery prize calculation rounding error"
```

---

## Quick Decision Tree

```
Need to deploy?
│
├─ Development/Testing
│  └─ npm run update:development "message"
│
├─ Team Review/QA
│  └─ npm run update:preview "message"
│
├─ Live Users
│  ├─ New feature/fix
│  │  └─ npm run update:production "message"
│  │
│  └─ Emergency/Broken
│     └─ npm run update:rollback
│
└─ Check Status
   ├─ Latest update: npm run update:view
   └─ All updates: npm run update:list
```

---

## Script Execution Times

| Script | Typical Duration | Notes |
|--------|-----------------|-------|
| `update:production` | 12-15 min | Build and upload time |
| `update:preview` | 12-15 min | Same as production |
| `update:development` | 12-15 min | Same as production |
| `update:rollback` | 5-8 min | Faster, just republish |
| `update:view` | <1 sec | Instant |
| `update:list` | 1-2 sec | Depends on history |
| `build:production` | 20-30 min | Full native build |
| `build:preview` | 15-20 min | APK faster than AAB |

---

## Error Messages & Solutions

### "Not authenticated"

**Solution:**
```bash
eas login
```

---

### "Project not found"

**Solution:**
```bash
eas project:info
# Verify project ID matches app.json
```

---

### "Runtime version mismatch"

**Solution:**
```bash
# Check runtime version
npm run update:list

# Update for correct version
eas update --branch production --runtime-version "1.0.2" --message "Your message"
```

---

### "Build failed"

**Solution:**
```bash
# Check TypeScript
npm run typecheck

# Test export
npx expo export

# Review error message carefully
```

---

### "Cannot find module"

**Solution:**
```bash
# Reinstall dependencies
npm install

# Or clean install
rm -rf node_modules
npm ci
```

---

## Keyboard Shortcuts (Bash/Zsh)

```bash
# Create aliases in ~/.bashrc or ~/.zshrc
alias euprod='npm run update:production'
alias euprev='npm run update:preview'
alias eudev='npm run update:development'
alias euview='npm run update:view'
alias eulist='npm run update:list'
alias euback='npm run update:rollback'

# Then use like:
euprod "Your message"
euview
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Update

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run update:production:auto
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## Documentation References

- **Main Guide:** `EAS_UPDATES_QUICKSTART.md`
- **Workflow Guide:** `EAS_UPDATES_WORKFLOW.md`
- **This File:** `DEPLOY_SCRIPTS.md`
- **EAS Config:** `eas.json`
- **App Config:** `app.json`
- **Package Scripts:** `package.json`

---

**Version:** 1.0
**Last Updated:** 2025-11-06
**Maintained By:** Development Team
