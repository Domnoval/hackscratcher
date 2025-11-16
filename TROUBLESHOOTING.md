# Scratch Oracle - Deployment Troubleshooting Guide

**Solutions to common deployment issues**

Last Updated: January 2025

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Build Failures](#build-failures)
3. [Git Issues](#git-issues)
4. [Environment Issues](#environment-issues)
5. [EAS Issues](#eas-issues)
6. [App Issues](#app-issues)
7. [Play Store Issues](#play-store-issues)
8. [Script Issues](#script-issues)

---

## Quick Diagnostics

### First Steps for Any Issue

```bash
# 1. Run pre-flight check
./scripts/pre-flight-check.sh

# 2. Check git status
git status

# 3. Check EAS login
eas whoami

# 4. View recent builds
eas build:list

# 5. Check latest build logs
eas build:view --latest
```

### Common Quick Fixes

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset git to clean state
git stash
git pull origin main

# Re-login to EAS
eas logout
eas login

# Clear EAS cache
eas build --platform android --clear-cache
```

---

## Build Failures

### Error: Build Failed - Gradle Issues

**Symptom:**
```
> Task :app:mergeReleaseResources FAILED
FAILURE: Build failed with an exception.
```

**Causes:**
- Corrupted Android build cache
- Dependency conflicts
- Resource conflicts

**Solutions:**

```bash
# 1. Clear build cache
eas build --platform android --profile preview --clear-cache

# 2. Check for duplicate resources
# Look in app.json for duplicate assets

# 3. Verify gradle configuration
# Build logs will show which gradle task failed

# 4. Update dependencies
npm update
npm audit fix
```

---

### Error: JavaScript Heap Out of Memory

**Symptom:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Causes:**
- Large bundle size
- Memory leak in build process
- Too many assets

**Solutions:**

```bash
# 1. Increase Node memory (temporary)
export NODE_OPTIONS="--max-old-space-size=4096"
eas build --platform android --profile preview

# 2. Optimize assets
# - Compress images
# - Remove unused dependencies
# - Check bundle size

# 3. Clear metro cache
rm -rf node_modules/.cache

# 4. Check for circular dependencies
npm run build # if you have build script
```

---

### Error: Module Not Found

**Symptom:**
```
Error: Unable to resolve module @react-native-async-storage/async-storage
```

**Causes:**
- Dependency not installed
- Wrong package name
- Cache issues

**Solutions:**

```bash
# 1. Install missing package
npm install @react-native-async-storage/async-storage

# 2. Clear caches
rm -rf node_modules
npm install
npx expo start --clear

# 3. Verify package.json
cat package.json | grep async-storage

# 4. Rebuild
eas build --platform android --profile preview --clear-cache
```

---

### Error: Build Timeout

**Symptom:**
```
Build timed out after 30 minutes
```

**Causes:**
- Large dependencies (TensorFlow, etc.)
- Slow build server
- Network issues

**Solutions:**

```bash
# 1. Retry build (servers may be slow)
eas build --platform android --profile preview

# 2. Use different build profile (may have more resources)
# Edit eas.json to increase timeout (if available)

# 3. Reduce bundle size
# - Remove large dependencies
# - Use lighter alternatives
# - Split features

# 4. Contact EAS support if persistent
# https://expo.dev/support
```

---

### Error: Certificate/Keystore Issues

**Symptom:**
```
Could not find keystore
Certificate fingerprint mismatch
```

**Causes:**
- Missing keystore
- Wrong keystore credentials
- Expired certificate

**Solutions:**

```bash
# 1. Check keystore exists
ls -la *.jks *.keystore

# 2. Verify keystore in EAS
eas credentials

# 3. Reset credentials (if needed)
eas credentials --clear

# 4. Generate new keystore
eas build --platform android --profile production
# Follow prompts to generate new credentials
```

---

## Git Issues

### Error: Push Rejected - Not Fast-Forward

**Symptom:**
```
! [rejected]        main -> main (non-fast-forward)
```

**Causes:**
- Remote has commits you don't have
- Force push needed
- Diverged branches

**Solutions:**

```bash
# OPTION 1: Pull and merge (SAFE)
git pull --rebase origin main
git push origin main

# OPTION 2: Force push (DANGEROUS - use only if sure)
git push origin main --force-with-lease

# OPTION 3: Create new branch instead
git checkout -b hotfix/my-fix
git push origin hotfix/my-fix
```

---

### Error: Uncommitted Changes

**Symptom:**
```
error: Your local changes would be overwritten by merge
```

**Solutions:**

```bash
# OPTION 1: Commit changes
git add .
git commit -m "WIP: Save current work"

# OPTION 2: Stash changes
git stash
# Do your work
git stash pop

# OPTION 3: Discard changes (CAREFUL!)
git reset --hard HEAD
```

---

### Error: Tag Already Exists

**Symptom:**
```
fatal: tag 'v1.0.5' already exists
```

**Solutions:**

```bash
# OPTION 1: Delete and recreate tag
git tag -d v1.0.5
git push origin :refs/tags/v1.0.5
git tag -a v1.0.5 -m "Version 1.0.5"
git push origin v1.0.5

# OPTION 2: Use force
git tag -f -a v1.0.5 -m "Version 1.0.5"
git push origin v1.0.5 --force

# OPTION 3: Increment version instead
# Edit app.json to v1.0.6
```

---

### Error: Detached HEAD State

**Symptom:**
```
You are in 'detached HEAD' state
```

**Solutions:**

```bash
# OPTION 1: Create branch from current state
git checkout -b recovery-branch

# OPTION 2: Return to main
git checkout main

# OPTION 3: Discard changes and return to main
git checkout -f main
```

---

## Environment Issues

### Error: Environment Variable Not Found

**Symptom:**
```
Cannot find EXPO_PUBLIC_SUPABASE_URL
```

**Causes:**
- Not set in eas.json
- Typo in variable name
- Missing from build profile

**Solutions:**

```bash
# 1. Check eas.json
cat eas.json | grep EXPO_PUBLIC

# 2. Verify build profile has env vars
cat eas.json | jq '.build.preview.env'

# 3. Add missing variables
# Edit eas.json:
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-key"
      }
    }
  }
}

# 4. Rebuild
eas build --platform android --profile preview
```

---

### Error: Invalid Supabase URL

**Symptom:**
```
Invalid URL: supabase
Network request failed
```

**Solutions:**

```bash
# 1. Check URL format
echo $EXPO_PUBLIC_SUPABASE_URL
# Should be: https://xxxxx.supabase.co

# 2. Verify in eas.json
grep SUPABASE_URL eas.json

# 3. Test connectivity
curl https://your-project.supabase.co/rest/v1/

# 4. Update eas.json with correct URL
# Format: https://<project-id>.supabase.co
```

---

## EAS Issues

### Error: Not Logged In

**Symptom:**
```
Not logged in to EAS
```

**Solutions:**

```bash
# 1. Login
eas login

# 2. If using SSO
eas login --sso

# 3. Check credentials
eas whoami

# 4. If issues persist, logout and login
eas logout
eas login
```

---

### Error: No EAS Project ID

**Symptom:**
```
No project ID found in app.json
```

**Solutions:**

```bash
# 1. Check app.json
cat app.json | grep projectId

# 2. Add project ID
# Edit app.json:
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}

# 3. Or initialize new project
eas init

# 4. Rebuild
eas build --platform android --profile preview
```

---

### Error: Build Quota Exceeded

**Symptom:**
```
Build limit exceeded for your plan
```

**Solutions:**

```bash
# 1. Check quota
eas build:list

# 2. Upgrade plan (if needed)
# Visit: https://expo.dev/settings/billing

# 3. Delete old builds (may free quota)
# Go to https://expo.dev/builds

# 4. Wait for quota reset (monthly)
```

---

## App Issues

### Error: App Crashes on Launch

**Symptom:**
App installs but immediately crashes

**Diagnostics:**

```bash
# 1. Check device logs
adb logcat | grep -i crash

# 2. Check specific package
adb logcat | grep com.scratchoracle.app

# 3. Look for errors
adb logcat *:E

# 4. Check build logs
eas build:view --latest
```

**Common Causes & Fixes:**

**Missing Permissions:**
```json
// app.json
{
  "android": {
    "permissions": [
      "INTERNET",
      "ACCESS_NETWORK_STATE"
    ]
  }
}
```

**Environment Variables:**
```bash
# Verify in eas.json
cat eas.json | jq '.build.preview.env'
```

**Native Module Issues:**
```bash
# Clear and rebuild
rm -rf android/
eas build --platform android --clear-cache
```

---

### Error: White Screen

**Symptom:**
App opens but shows white/blank screen

**Solutions:**

```bash
# 1. Check metro bundler errors
npx expo start --clear

# 2. Check for JavaScript errors
adb logcat | grep ReactNativeJS

# 3. Verify index.ts exists
ls -la index.ts

# 4. Check app.json main entry
cat app.json | grep main

# 5. Clear cache and rebuild
rm -rf node_modules .expo
npm install
eas build --platform android --clear-cache
```

---

### Error: Network Requests Failing

**Symptom:**
```
Network request failed
Unable to connect to Supabase
```

**Solutions:**

```bash
# 1. Test backend directly
curl https://your-project.supabase.co/rest/v1/

# 2. Check certificate pinning (if using)
# May be blocking requests
# Temporarily disable in code to test

# 3. Check network permissions
cat app.json | jq '.android.permissions'
# Should include "INTERNET"

# 4. Test on different network
# Wi-Fi vs cellular

# 5. Check Supabase status
# https://status.supabase.com/
```

---

## Play Store Issues

### Error: Upload Rejected - Signature Mismatch

**Symptom:**
```
Upload failed: Signature does not match previous version
```

**Causes:**
- Different keystore used
- Keystore changed
- Wrong app signing

**Solutions:**

```bash
# 1. Check current credentials
eas credentials

# 2. If production, MUST use same keystore
# Cannot change keystore for published app

# 3. If testing, clear and regenerate
eas credentials --clear

# 4. For production, recover keystore
# Check backups
# Contact EAS support if lost
```

---

### Error: Version Code Already Exists

**Symptom:**
```
Version code 5 has already been used
```

**Solutions:**

```bash
# 1. Increment versionCode in app.json
# Current: "versionCode": 5
# Change to: "versionCode": 6

# 2. Rebuild
eas build --platform android --profile production

# 3. Submit
eas submit --platform android
```

---

### Error: Play Store Submission Failed

**Symptom:**
```
Submission failed: Invalid credentials
```

**Solutions:**

```bash
# 1. Check service account exists
ls -la google-play-service-account.json

# 2. Verify permissions in Play Console
# Service account needs "Release Manager" role

# 3. Update service account
# Download new JSON from Play Console
# Save as google-play-service-account.json

# 4. Retry submission
eas submit --platform android --id <build-id>
```

---

## Script Issues

### Error: Permission Denied

**Symptom:**
```bash
./scripts/deploy-hotfix.sh: Permission denied
```

**Solution:**

```bash
# Make executable
chmod +x scripts/deploy-hotfix.sh
chmod +x scripts/deploy-feature.sh
chmod +x scripts/deploy-native.sh
chmod +x scripts/rollback.sh
chmod +x scripts/pre-flight-check.sh
chmod +x scripts/verify-deployment.sh

# Or all at once
chmod +x scripts/*.sh
```

---

### Error: Command Not Found

**Symptom:**
```bash
./scripts/deploy-hotfix.sh: eas: command not found
```

**Solution:**

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version

# If still issues, check PATH
echo $PATH
which eas
```

---

### Error: sed: No Such File

**Symptom:**
```bash
sed: can't read app.json.bak: No such file or directory
```

**Solutions:**

```bash
# macOS sed compatibility
# If on macOS, install GNU sed
brew install gnu-sed

# Or modify scripts to use sed differently
# Change: sed -i.bak
# To: sed -i ''
```

---

### Error: Script Aborted

**Symptom:**
Script stops unexpectedly

**Solutions:**

```bash
# 1. Check for syntax errors
bash -n scripts/deploy-hotfix.sh

# 2. Run with verbose mode
bash -x scripts/deploy-hotfix.sh "Test"

# 3. Check git status
git status

# 4. Run pre-flight check first
./scripts/pre-flight-check.sh
```

---

## Common Error Messages Reference

### "Cannot read property of undefined"

**Location:** JavaScript/TypeScript code

**Fix:**
```typescript
// Add null checks
if (data && data.games) {
  // Use data.games
}

// Or use optional chaining
const games = data?.games ?? [];
```

---

### "Module not found: Can't resolve"

**Location:** Build time

**Fix:**
```bash
# Install missing module
npm install <module-name>

# Clear cache
rm -rf node_modules
npm install
```

---

### "Network request failed"

**Location:** Runtime, API calls

**Fix:**
```typescript
// Add error handling
try {
  const response = await supabase.from('games').select('*');
} catch (error) {
  console.error('Failed to fetch games:', error);
  // Handle error
}
```

---

### "Unable to resolve module"

**Location:** Build/Runtime

**Fix:**
```bash
# Clear metro cache
npx expo start --clear

# Restart metro
npx expo start --reset-cache

# Rebuild
eas build --clear-cache
```

---

## Debug Checklist

When something goes wrong:

```markdown
1. [ ] Run pre-flight check
2. [ ] Check git status (uncommitted changes?)
3. [ ] Check EAS login (logged in?)
4. [ ] View build logs (what failed?)
5. [ ] Check environment variables (all set?)
6. [ ] Test locally (works on dev?)
7. [ ] Check dependencies (up to date?)
8. [ ] Clear caches (stale cache?)
9. [ ] Verify app.json (correct version?)
10. [ ] Check device logs (runtime errors?)
```

---

## Getting Help

### Internal Resources

1. Check this troubleshooting guide
2. Review [DEPLOYMENT_PLAYBOOK.md](./DEPLOYMENT_PLAYBOOK.md)
3. Check [ROLLBACK_PROCEDURES.md](./ROLLBACK_PROCEDURES.md)
4. Run diagnostics: `./scripts/pre-flight-check.sh --strict`

### External Resources

1. **EAS Documentation**
   - https://docs.expo.dev/build/introduction/
   - https://docs.expo.dev/build/troubleshooting/

2. **Expo Forums**
   - https://forums.expo.dev/
   - Search for error message

3. **GitHub Issues**
   - https://github.com/expo/expo/issues
   - Check for known issues

4. **Stack Overflow**
   - Tag: [expo] [react-native]
   - Search error message

### Creating a Support Request

Include:
1. Error message (full text)
2. Build ID: `eas build:list`
3. Build logs: `eas build:view <id> --logs`
4. Git commit: `git rev-parse HEAD`
5. Version: `cat app.json | grep version`
6. Platform: Android/iOS
7. Steps to reproduce
8. What you've tried

---

## Prevention

### Pre-Deployment Checks

```bash
# Always run before deploying
./scripts/pre-flight-check.sh --strict

# Catches:
# - Uncommitted changes
# - Missing dependencies
# - Wrong branch
# - Env var issues
# - Build asset issues
# - TypeScript errors
# - Test failures
```

### Code Quality

```bash
# Run before committing
npm test
npx tsc --noEmit
npx eslint .
```

### Regular Maintenance

```bash
# Weekly
npm outdated
npm audit

# Monthly
npm update
npm audit fix

# Clean caches
rm -rf node_modules .expo
npm install
```

---

## Emergency Contacts

**Build Failing Repeatedly:**
- Clear all caches
- Rollback to last known good
- Contact EAS support

**Play Store Issues:**
- Check Play Console
- Review policies: https://play.google.com/console/developers/app-quality
- Contact Play Store support

**Critical Production Issue:**
1. Rollback immediately: `./scripts/rollback.sh --last`
2. Assess impact
3. Fix and deploy hotfix
4. Post-mortem

---

**Remember:** Most issues have been seen before. Check logs, search forums, ask for help!

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Maintained by:** Development Team
