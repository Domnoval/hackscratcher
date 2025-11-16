# Scratch Oracle - Deployment Playbook

**Complete guide to deploying the Scratch Oracle app**

Last Updated: January 2025
Version: 1.0

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Deployment Types](#deployment-types)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Deployment Workflows](#deployment-workflows)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Quick Start

### First-Time Setup

```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Login to EAS
eas login

# 3. Verify setup
./scripts/pre-flight-check.sh
```

### Deploy Workflow (30 seconds)

```bash
# Hotfix (5 min)
./scripts/deploy-hotfix.sh "Fix crash on startup"

# Feature (12 min)
./scripts/deploy-feature.sh "Add ticket scanner"

# Production (when ready)
./scripts/deploy-native.sh --production --submit
```

---

## Deployment Types

### 1. Hotfix Deployment (5 minutes)

**When to use:**
- Critical bugs affecting users
- App crashes
- Security vulnerabilities
- Data loss issues
- Blocking issues preventing app use

**What it does:**
- Increments patch version (1.0.1 → 1.0.2)
- Builds preview APK
- Creates backup tag
- Fast deployment path

**Command:**
```bash
./scripts/deploy-hotfix.sh "Fix description"
```

**Example:**
```bash
./scripts/deploy-hotfix.sh "Fix crash when viewing game details"
```

**Timeline:**
- Script execution: 30 seconds
- EAS build: 3-5 minutes
- Total: ~5 minutes

---

### 2. Feature Deployment (12 minutes)

**When to use:**
- New features
- Enhancements to existing features
- UI improvements
- Performance optimizations
- Non-critical bug fixes

**What it does:**
- Runs full test suite
- TypeScript checks
- Increments minor version (1.0.1 → 1.1.0)
- Updates changelog
- Builds preview APK
- Creates release tag

**Command:**
```bash
./scripts/deploy-feature.sh "Feature description"
```

**Example:**
```bash
./scripts/deploy-feature.sh "Add barcode scanner for tickets"
```

**Timeline:**
- Pre-flight checks: 1 minute
- Tests: 2 minutes
- Script execution: 1 minute
- EAS build: 3-5 minutes
- Total: ~12 minutes

**Skip tests** (use cautiously):
```bash
RUN_TESTS=false ./scripts/deploy-feature.sh "Feature description"
```

---

### 3. Native Production Build (15-20 minutes)

**When to use:**
- Ready for Play Store release
- After extensive testing
- Beta testing complete
- All QA checks passed

**What it does:**
- Builds Android App Bundle (AAB)
- Optionally submits to Play Store
- Creates production build
- Generates release artifacts

**Commands:**

**Build only:**
```bash
./scripts/deploy-native.sh --production
```

**Build and submit to Play Store:**
```bash
./scripts/deploy-native.sh --production --submit
```

**Wait for build to complete:**
```bash
./scripts/deploy-native.sh --production --wait
```

**Timeline:**
- Pre-flight checks: 1 minute
- Build submission: 30 seconds
- EAS build: 10-15 minutes
- Total: 12-20 minutes

---

## Pre-Deployment Checklist

### Before Every Deployment

**Run pre-flight checks:**
```bash
./scripts/pre-flight-check.sh
```

This checks:
- ✓ Git repository state
- ✓ Uncommitted changes
- ✓ Dependencies installed
- ✓ EAS CLI configured
- ✓ Environment variables
- ✓ Build assets
- ✓ Code quality
- ✓ Internet connectivity
- ✓ Security (secrets not committed)

**Strict mode** (all checks must pass):
```bash
./scripts/pre-flight-check.sh --strict
```

---

### Manual Checklist

#### Code Quality
- [ ] All features tested locally
- [ ] TypeScript compilation clean
- [ ] No console errors in dev mode
- [ ] Tests passing
- [ ] Code reviewed (if team)
- [ ] No debug code or commented blocks

#### Version Management
- [ ] Version number appropriate for change
- [ ] Changelog updated
- [ ] Breaking changes documented
- [ ] Migration scripts ready (if needed)

#### Build Requirements
- [ ] All dependencies in package.json
- [ ] No missing environment variables
- [ ] Assets optimized (images, etc.)
- [ ] No hardcoded development URLs

#### Testing
- [ ] Tested on Android device
- [ ] Tested on different screen sizes
- [ ] Offline mode tested
- [ ] Performance acceptable
- [ ] Battery usage normal

---

## Deployment Workflows

### Workflow 1: Emergency Hotfix

**Scenario:** Critical bug discovered in production

```bash
# 1. Pre-flight check (optional but recommended)
./scripts/pre-flight-check.sh

# 2. Deploy hotfix
./scripts/deploy-hotfix.sh "Fix critical crash on game list"

# 3. Wait for build (3-5 min)
# Check status:
eas build:list

# 4. Download and test
eas build:download --latest

# 5. Install on device
adb install -r app.apk

# 6. Test thoroughly (15-30 min)

# 7. If good -> distribute to users
# 8. If bad -> rollback
./scripts/rollback.sh --last
```

**Total time:** 5 min (deploy) + 5 min (build) + 30 min (test) = **40 minutes**

---

### Workflow 2: Feature Release

**Scenario:** New feature ready for beta testing

```bash
# 1. Ensure on main branch
git checkout main
git pull origin main

# 2. Run pre-flight checks
./scripts/pre-flight-check.sh --strict

# 3. Fix any issues found

# 4. Deploy feature
./scripts/deploy-feature.sh "Add ticket scanning feature"

# 5. Wait for build
eas build:list
# or
eas build:view

# 6. Download build
eas build:download --latest

# 7. Test on multiple devices

# 8. Verify deployment
./scripts/verify-deployment.sh

# 9. Distribute to beta testers

# 10. Collect feedback

# 11. If issues -> hotfix or rollback
# 12. If good -> proceed to production
```

**Total time:** 12 min (deploy) + 5 min (build) + 2 hours (testing) = **~2.5 hours**

---

### Workflow 3: Production Release

**Scenario:** App ready for Play Store

```bash
# 1. Ensure all tests pass
npm test

# 2. Run strict pre-flight
./scripts/pre-flight-check.sh --strict

# 3. Ensure on main branch with latest code
git checkout main
git pull origin main

# 4. Verify app.json version
cat app.json | grep version

# 5. Build production
./scripts/deploy-native.sh --production --wait

# 6. This takes 10-15 minutes (with --wait)

# 7. Download AAB
eas build:download --latest

# 8. Test AAB on device (requires uploading to Play Console test track)

# 9. If good -> submit
eas submit --platform android

# 10. Or rebuild with auto-submit:
./scripts/deploy-native.sh --production --submit --wait

# 11. Go to Play Console
# https://play.google.com/console

# 12. Release from internal testing -> production
```

**Total time:** 15 min (build) + 1 hour (testing) + 2 hours (Play Store review) = **~3-4 hours**

---

## Post-Deployment Verification

### Automated Verification

```bash
# Verify latest deployment
./scripts/verify-deployment.sh

# Verify specific build
./scripts/verify-deployment.sh <build-id>
```

This checks:
- ✓ Build completed successfully
- ✓ Artifacts available
- ✓ Version matches git
- ✓ Tags created
- ✓ Code pushed to remote
- ✓ Backend connectivity
- ✓ Play Store submission (if production)
- ✓ Changelog updated

---

### Manual Verification

#### Build Quality
- [ ] Build completed without errors
- [ ] APK/AAB downloaded successfully
- [ ] File size reasonable (30-80 MB)
- [ ] Install on device successful

#### Functionality
- [ ] App launches without crash
- [ ] All screens accessible
- [ ] Data loads correctly
- [ ] Network requests working
- [ ] Offline mode works
- [ ] Location permissions work
- [ ] Maps display correctly

#### Performance
- [ ] App launches in <3 seconds
- [ ] Scrolling smooth (60 fps)
- [ ] No memory leaks
- [ ] Battery usage normal
- [ ] Network usage reasonable

#### User Experience
- [ ] UI renders correctly
- [ ] Dark mode works
- [ ] Fonts load properly
- [ ] Images display
- [ ] Animations smooth
- [ ] Touch targets adequate

---

## Rollback Procedures

See detailed [ROLLBACK_PROCEDURES.md](./ROLLBACK_PROCEDURES.md)

### Quick Rollback

```bash
# Rollback to last backup
./scripts/rollback.sh --last

# Rollback to specific tag
./scripts/rollback.sh v1.0.5

# Interactive rollback (shows recent tags)
./scripts/rollback.sh
```

### When to Rollback

**Immediate rollback required:**
- App crashes on launch
- Critical feature broken
- Data corruption
- Security vulnerability introduced
- Cannot connect to backend
- Payment processing broken

**Consider rollback:**
- Multiple user complaints
- Performance degradation >50%
- Major UI bugs
- Feature not working as expected
- Increased error rates in logs

**Do NOT rollback:**
- Minor UI glitches
- Single user issue
- Cosmetic bugs
- Already distributed to >50% users (fix forward instead)

---

## Production Deployment

### Play Store Release Process

#### 1. Prepare Release

```bash
# Ensure version is correct
grep version app.json

# Build production
./scripts/deploy-native.sh --production --wait
```

#### 2. Test Build

```bash
# Download AAB
eas build:download --latest

# Upload to Play Console internal testing track
# https://play.google.com/console -> Release -> Testing -> Internal testing

# Install and test on device
```

#### 3. Submit to Play Store

```bash
# Automated submission
eas submit --platform android

# Or use script
./scripts/deploy-native.sh --production --submit --wait
```

#### 4. Play Console Steps

1. Go to https://play.google.com/console
2. Select "Scratch Oracle" app
3. Navigate to "Release" → "Production"
4. Click "Create new release"
5. Upload AAB (or use automated submission)
6. Add release notes
7. Review release
8. Click "Start rollout to Production"

#### 5. Staged Rollout (Recommended)

- Start with 5% rollout
- Monitor for 24 hours
- If stable, increase to 20%
- Monitor for 48 hours
- If stable, increase to 50%
- If stable, increase to 100%

#### 6. Monitor Release

**Key metrics to watch:**
- Crash rate (<1%)
- ANR (Application Not Responding) rate (<0.5%)
- User ratings (maintain >4.0)
- User reviews (respond quickly)
- Install/uninstall ratio

**Where to monitor:**
- Play Console → Quality → Android vitals
- Play Console → Statistics
- Firebase Crashlytics (if integrated)
- Supabase logs

---

## Troubleshooting

See detailed [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Common Issues

#### Build Fails

```bash
# View build details
eas build:list
eas build:view <build-id>

# Check logs
eas build:view <build-id> --logs

# Common fixes:
# 1. Clear cache
eas build --platform android --clear-cache

# 2. Check eas.json configuration
cat eas.json

# 3. Verify environment variables
grep EXPO_PUBLIC eas.json
```

#### Version Conflicts

```bash
# Reset to specific version
git checkout v1.0.5 -- app.json

# Manually set version
# Edit app.json:
# "version": "1.0.6"
# "versionCode": 7
```

#### Push Rejected

```bash
# Pull latest changes
git pull --rebase origin main

# Force push (dangerous!)
git push origin main --force

# Better: create new branch
git checkout -b hotfix/my-fix
git push origin hotfix/my-fix
```

---

## Best Practices

### Version Numbering

**Format:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes, major redesign (1.0.0 → 2.0.0)
- **MINOR:** New features, enhancements (1.0.0 → 1.1.0)
- **PATCH:** Bug fixes, hotfixes (1.0.0 → 1.0.1)

**Examples:**
- Add new feature: `1.0.5 → 1.1.0`
- Fix crash: `1.1.0 → 1.1.1`
- Redesign UI: `1.5.2 → 2.0.0`

### Git Workflow

**Branch naming:**
- `main` - production-ready code
- `develop` - integration branch
- `feature/ticket-scanner` - new features
- `hotfix/crash-on-launch` - emergency fixes
- `release/1.2.0` - release preparation

**Commit messages:**
```
feat: Add barcode scanner for tickets
fix: Prevent crash when game data missing
perf: Optimize game list rendering
docs: Update deployment playbook
chore: Bump version to 1.2.0
```

### Testing Strategy

**Before every deployment:**
1. Run unit tests: `npm test`
2. TypeScript check: `npx tsc --noEmit`
3. Build locally: `expo start`
4. Test on physical device
5. Check different Android versions
6. Test offline mode
7. Test edge cases

**Before production:**
1. All of the above, plus:
2. Test on multiple devices
3. Beta testing (5-10 users, 3-7 days)
4. Performance testing
5. Security audit
6. Accessibility check

### Deployment Timing

**Best times to deploy:**
- **Monday-Wednesday:** Most users available for feedback
- **Morning (9 AM - 12 PM):** Developers available for hotfixes
- **Avoid Friday deployments:** Limited time to fix issues

**Worst times:**
- Late Friday
- Before holidays
- During major events (when usage spikes expected)

### Communication

**Before deployment:**
- Notify team
- Schedule deployment window
- Prepare rollback plan

**After deployment:**
- Announce to team
- Monitor for 1 hour
- Update status channels
- Document issues

### Automation Ideas

**GitHub Actions workflow** (future):
```yaml
name: Deploy on Tag
on:
  push:
    tags:
      - 'v*'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: ./scripts/deploy-native.sh --production
```

---

## Deployment Checklist Template

Copy this for each deployment:

```markdown
## Deployment Checklist - [VERSION] - [DATE]

### Pre-Deployment
- [ ] Version number updated
- [ ] Changelog updated
- [ ] All tests passing
- [ ] TypeScript clean
- [ ] Tested on device
- [ ] Pre-flight check passed
- [ ] Backup tag created
- [ ] Team notified

### Deployment
- [ ] Script executed successfully
- [ ] Build submitted to EAS
- [ ] Build completed
- [ ] Artifacts downloaded

### Post-Deployment
- [ ] Verification script passed
- [ ] Installed on test device
- [ ] Functionality verified
- [ ] Performance acceptable
- [ ] No crashes detected
- [ ] Team updated

### Production (if applicable)
- [ ] AAB uploaded to Play Console
- [ ] Release notes added
- [ ] Staged rollout started
- [ ] Monitoring enabled
- [ ] Documentation updated

### Issues Found
- None / [List issues]

### Rollback Plan
- Tag: [backup tag name]
- Command: ./scripts/rollback.sh [tag]
```

---

## Quick Command Reference

```bash
# Pre-flight
./scripts/pre-flight-check.sh
./scripts/pre-flight-check.sh --strict

# Deploy
./scripts/deploy-hotfix.sh "Description"
./scripts/deploy-feature.sh "Description"
./scripts/deploy-native.sh --production

# Verify
./scripts/verify-deployment.sh
eas build:list
eas build:view <id>

# Rollback
./scripts/rollback.sh --last
./scripts/rollback.sh <tag>

# Download
eas build:download --latest
eas build:download --id <id>

# Submit
eas submit --platform android
```

---

## Support

**Issues with deployment?**
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Run `./scripts/pre-flight-check.sh --strict`
3. Check EAS build logs: `eas build:view <id>`
4. Check git status: `git status`

**Need help?**
- EAS Documentation: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/
- GitHub Issues: [Your repo]/issues

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Maintained by:** Development Team
