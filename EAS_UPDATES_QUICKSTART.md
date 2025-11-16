# EAS Updates Quickstart Guide

## Overview

EAS Updates allows you to deploy JavaScript and asset changes to your production app in **12-15 minutes**, bypassing the 3-7 day app store review process.

**Project Configuration:**
- **Project ID:** `78e2e800-e081-4b43-86e0-2968fffec441`
- **Update URL:** `https://u.expo.dev/78e2e800-e081-4b43-86e0-2968fffec441`
- **Runtime Version Policy:** `appVersion` (uses version from app.json)
- **Owner:** `mm444`

---

## Quick Deploy (12-15 Minutes)

### Production Update (Most Common)

```bash
# Option 1: With custom message
npm run update:production "Fixed lottery prize calculation bug"

# Option 2: Auto-generate message from last git commit
npm run update:production:auto

# Option 3: Direct command
eas update --branch production --message "Your update message here"
```

**Timeline:**
- Build & upload: 8-12 minutes
- Global CDN propagation: 2-3 minutes
- Users receive update: On next app launch

---

## Update Channels Explained

### Production Channel
- **Purpose:** Updates for live users in Google Play Store
- **Audience:** All production app users
- **Use when:** Deploying bug fixes, features, UI improvements
- **Testing:** Should be tested in preview first

```bash
npm run update:production "Your message"
```

### Preview Channel
- **Purpose:** Internal testing before production
- **Audience:** Team members with preview builds
- **Use when:** Testing new features, validating bug fixes
- **Testing:** Safe environment for QA

```bash
npm run update:preview "Testing new map features"
```

### Development Channel
- **Purpose:** Active development and debugging
- **Audience:** Developers only
- **Use when:** Rapid iteration, experimental features
- **Testing:** Unstable, frequent updates

```bash
npm run update:development "Experimenting with new UI"
```

---

## Common Update Scenarios

### Scenario 1: Bug Fix in Production

```bash
# 1. Fix the bug in your code
# 2. Test locally
npm start

# 3. Deploy to preview for team testing
npm run update:preview "Fixed ticket scanner crash - needs QA"

# 4. After QA approval, deploy to production
npm run update:production "Fixed ticket scanner crash on Android"

# 5. Monitor rollout
npm run update:view
```

**Time: 12-15 minutes total**

### Scenario 2: New Feature Rollout

```bash
# 1. Complete feature development
# 2. Test in development channel
npm run update:development "New lottery analytics feature"

# 3. Team testing in preview
npm run update:preview "New analytics feature - ready for UAT"

# 4. Production release
npm run update:production "Added lottery analytics dashboard"
```

**Time: 15 minutes per channel**

### Scenario 3: Rollback Bad Update

```bash
# Quick rollback to previous update
npm run update:rollback

# Or manually republish a specific update
eas update --branch production --message "Rollback to stable" --republish --group <update-group-id>
```

**Time: 5-8 minutes**

### Scenario 4: Emergency Hotfix

```bash
# Skip preview, go straight to production
npm run update:production "HOTFIX: Critical security patch"

# Monitor deployment
npm run update:view
```

**Time: 12 minutes**

---

## Available Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `update:production` | `npm run update:production "message"` | Deploy to production users |
| `update:preview` | `npm run update:preview "message"` | Deploy to preview channel |
| `update:development` | `npm run update:development "message"` | Deploy to dev channel |
| `update:production:auto` | `npm run update:production:auto` | Auto-message from git commit |
| `update:preview:auto` | `npm run update:preview:auto` | Auto-message from git commit |
| `update:rollback` | `npm run update:rollback` | Rollback production update |
| `update:list` | `npm run update:list` | View all updates |
| `update:view` | `npm run update:view` | View latest update details |

---

## What Can Be Updated OTA?

### YES - Can be updated instantly
- JavaScript code changes
- React components
- Business logic
- API integrations
- Styling and layouts
- Assets (images, fonts, etc.)
- Configuration changes

### NO - Requires new app build
- Native code changes
- New native dependencies
- app.json native configuration changes (permissions, etc.)
- Expo SDK version upgrades
- New expo plugins

---

## Update Behavior

### How Updates are Delivered

1. **On App Launch:** App checks for updates automatically
2. **Download:** Update downloads in background if available
3. **Apply:** Update applies on next app restart
4. **Fallback:** If update fails, app uses embedded bundle

### Runtime Version Strategy

**Current Strategy:** `appVersion` policy
- Runtime version = app version from app.json (currently `1.0.1`)
- Only users with matching runtime version receive updates
- When you change app version, you create a new update group

**Example:**
```json
{
  "expo": {
    "version": "1.0.1"  // This is your runtime version
  }
}
```

All OTA updates work for users on version `1.0.1`. If you bump to `1.0.2`, users on `1.0.1` won't receive new updates until they install the new app version.

---

## Monitoring & Verification

### View Update Status

```bash
# List all updates
npm run update:list

# View specific update details
npm run update:view

# View updates for specific branch
eas update:list --branch production

# Check channel configuration
eas channel:list
```

### Verify Update Deployment

```bash
# Check update was published
eas update:view --branch production

# Verify runtime version
eas update:list --branch production
```

---

## Team Workflow (Recommended)

### Standard Development Flow

```
Developer → Development Channel → Preview Channel → Production Channel
   (1)            (2-3)                (4-5)              (6)
```

1. **Code & Test Locally** (2-3 hours)
   - Develop feature
   - Test with `npm start`

2. **Deploy to Development** (Optional, 12 min)
   ```bash
   npm run update:development "Feature XYZ - WIP"
   ```

3. **Deploy to Preview** (12 min)
   ```bash
   npm run update:preview "Feature XYZ - ready for QA"
   ```

4. **Team Testing** (30 min - 2 hours)
   - QA team tests preview build
   - Product team reviews
   - Stakeholder approval

5. **Deploy to Production** (12 min)
   ```bash
   npm run update:production "Feature XYZ - launching to users"
   ```

6. **Monitor** (Ongoing)
   ```bash
   npm run update:view
   ```

**Total Time: 3-6 hours including development**
**Deploy Time: 12-15 minutes per environment**

### Fast-Track for Hotfixes

```
Developer → Preview Channel → Production Channel
   (1)            (2-3)              (4)
```

1. **Fix & Test Locally** (30 min)
2. **Quick Preview Test** (5 min test + 12 min deploy)
3. **Deploy to Production** (12 min)

**Total Time: ~1 hour for critical fixes**

---

## Troubleshooting

### Update Not Showing in App

**Problem:** Users report not receiving update

**Solutions:**
1. Check runtime version matches
   ```bash
   eas update:list --branch production
   ```

2. Verify update was published successfully
   ```bash
   npm run update:view
   ```

3. Ensure app is using correct channel
   - Check eas.json build configuration
   - Verify build was created with correct channel

4. Force app restart
   - Updates apply on app restart, not in background

### Error: Runtime Version Mismatch

**Problem:** `Runtime version mismatch` error

**Solution:**
- Update was published for different runtime version
- Check app.json version matches target users
- Consider publishing update for older runtime version:
  ```bash
  eas update --branch production --runtime-version 1.0.0 --message "Update for older version"
  ```

### Update Failed to Build

**Problem:** `eas update` command fails

**Solutions:**
1. Check EAS CLI is updated
   ```bash
   npm install -g eas-cli@latest
   ```

2. Verify authentication
   ```bash
   eas whoami
   ```

3. Check for TypeScript errors
   ```bash
   npx tsc --noEmit
   ```

4. Review error logs carefully

### Update Too Large

**Problem:** Update bundle exceeds size limits

**Solutions:**
1. Optimize images (use WebP, compress)
2. Remove unused assets
3. Enable Hermes engine (already default)
4. Review bundle with:
   ```bash
   npx expo export
   ```

---

## Best Practices

### 1. Version Control
```bash
# Always commit before deploying
git add .
git commit -m "Your changes"
npm run update:production:auto  # Uses commit message
```

### 2. Descriptive Messages
```bash
# Good
npm run update:production "Fixed map crash on Android 13"

# Bad
npm run update:production "fix"
```

### 3. Test Before Production
```bash
# Always test in preview first
npm run update:preview "Test message"
# Wait for team confirmation
npm run update:production "Confirmed message"
```

### 4. Monitor After Deploy
```bash
# Check update was received
npm run update:view
# Monitor error tracking (Sentry, etc.)
```

### 5. Communicate Updates
```bash
# Announce in team chat
"Deployed lottery prize fix to production - update will roll out over next hour"
```

### 6. Document Breaking Changes
- Keep changelog updated
- Note any required user actions
- Document API changes

---

## Channel Management

### View Current Channels

```bash
eas channel:list
```

### Link Channel to Build

Channels are automatically linked during build:

```bash
# Production build automatically uses production channel
eas build --platform android --profile production

# Preview build uses preview channel
eas build --platform android --profile preview
```

### Update Channel Without Build

You can publish updates to any channel without rebuilding:

```bash
eas update --branch production --message "Update message"
eas update --branch preview --message "Test message"
```

---

## Advanced Usage

### Targeting Specific Platforms

```bash
# iOS only (when you add iOS)
eas update --branch production --platform ios --message "iOS fix"

# Android only
eas update --branch production --platform android --message "Android fix"
```

### Custom Runtime Version

```bash
# Override automatic runtime version
eas update --branch production --runtime-version "1.0.1" --message "Specific version update"
```

### Republishing Previous Update

```bash
# List updates to find group ID
npm run update:list

# Republish specific update
eas update --branch production --republish --group <update-group-id>
```

### Setting Update Priority

```bash
# Critical update (faster rollout)
eas update --branch production --message "Critical security fix" --auto
```

---

## Configuration Files Reference

### eas.json

```json
{
  "cli": {
    "version": ">= 14.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "channel": "development",
      // ... build config
    },
    "preview": {
      "channel": "preview",
      // ... build config
    },
    "production": {
      "channel": "production",
      "autoIncrement": true,
      // ... build config
    }
  }
}
```

**Key Settings:**
- `channel`: Links build to update channel
- `autoIncrement`: Auto-increments Android versionCode
- `appVersionSource: "remote"`: Uses remote version tracking

### app.json

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/78e2e800-e081-4b43-86e0-2968fffec441",
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

**Key Settings:**
- `url`: Your EAS Updates endpoint
- `checkAutomatically: "ON_LOAD"`: Check for updates when app starts
- `fallbackToCacheTimeout: 0`: No timeout for update checks
- `runtimeVersion.policy: "appVersion"`: Use app version as runtime version

---

## FAQ

### Q: How long does an OTA update take?
**A:** 12-15 minutes from running command to users receiving update.

### Q: Do users need to download from Play Store?
**A:** No! Updates happen automatically in the background.

### Q: Can I rollback a bad update?
**A:** Yes, use `npm run update:rollback` (5-8 minutes).

### Q: What happens if update fails?
**A:** App falls back to embedded bundle, user experience unaffected.

### Q: Can I update native code?
**A:** No, native code requires new app store build.

### Q: How do I know if update succeeded?
**A:** Run `npm run update:view` to see deployment status.

### Q: Can I test update before production?
**A:** Yes, deploy to preview channel first: `npm run update:preview "message"`

### Q: Do all users get update immediately?
**A:** Update downloads on app launch, applies on next restart.

### Q: Can I target specific users?
**A:** Use different channels (production, preview) for different user groups.

### Q: How big can updates be?
**A:** No strict limit, but keep under 10MB for best user experience.

---

## Support & Resources

### Official Documentation
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Runtime Versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [Update Strategies](https://docs.expo.dev/eas-update/deployment-patterns/)

### Command Reference
```bash
# Full EAS Update CLI reference
eas update --help
eas channel --help
eas build --help
```

### Getting Help

1. **Check Status:** `npm run update:view`
2. **View Logs:** Review EAS dashboard at expo.dev
3. **Team Chat:** Ask in development channel
4. **Documentation:** Refer to this guide and official docs

---

## Appendix: Complete Command Reference

### Update Commands
```bash
# Publish updates
eas update --branch <branch> --message "<message>"
eas update --branch <branch> --message "<message>" --republish
eas update --branch <branch> --message "<message>" --platform android

# View updates
eas update:list
eas update:list --branch production
eas update:view
eas update:view --branch production
eas update:view --group <update-group-id>

# Manage updates
eas update:delete --branch production --group <update-group-id>
eas update:republish --branch production --group <update-group-id>
```

### Channel Commands
```bash
# View channels
eas channel:list
eas channel:view production

# Create/edit channels
eas channel:create <channel-name>
eas channel:edit <channel-name>

# Point channel to update
eas channel:rollout --channel production --update-id <update-id>
```

### Build Commands (with channels)
```bash
# Build with specific channel
eas build --platform android --profile production  # Uses production channel
eas build --platform android --profile preview     # Uses preview channel
eas build --platform android --profile development # Uses development channel

# View builds
eas build:list
eas build:view <build-id>
```

---

**Last Updated:** 2025-11-06
**Configuration Version:** 1.0.1
**EAS CLI Version:** >= 14.0.0
