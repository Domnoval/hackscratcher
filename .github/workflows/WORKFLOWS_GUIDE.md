# GitHub Actions Workflows Quick Guide

Quick reference for all CI/CD workflows in the Scratch Oracle app.

---

## 📋 Available Workflows

### 1. CI/CD Pipeline
**File:** `ci-cd.yml`
**Status Badge:** ![CI/CD](https://github.com/YOUR_USERNAME/scratch-oracle-app/workflows/CI%2FCD%20Pipeline/badge.svg)

### 2. PR Preview
**File:** `pr-preview.yml`
**Status Badge:** ![PR Preview](https://github.com/YOUR_USERNAME/scratch-oracle-app/workflows/PR%20Preview%20Build/badge.svg)

### 3. Native Build
**File:** `native-build.yml`
**Status Badge:** ![Native Build](https://github.com/YOUR_USERNAME/scratch-oracle-app/workflows/Native%20Production%20Build/badge.svg)

---

## 🚀 Quick Actions

### Deploy OTA Update
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```
**Result:** Tests run → OTA update deploys automatically

### Create Preview Build
```bash
git checkout -b feature/my-feature
git push origin feature/my-feature
# Create PR on GitHub
```
**Result:** Preview APK builds automatically

### Build for Play Store
1. Go to GitHub Actions tab
2. Click "Native Production Build"
3. Click "Run workflow"
4. Select platform and options
5. Download AAB from artifacts

---

## 📊 Workflow Comparison

| Feature | CI/CD | PR Preview | Native Build |
|---------|-------|------------|--------------|
| **Trigger** | Auto (push) | Auto (PR) | Manual |
| **Duration** | 2-3 min | 10-15 min | 10-20 min |
| **Output** | OTA update | Preview APK | Production AAB |
| **Cost** | Free | EAS credits | EAS credits |
| **Use Case** | Every commit | Testing PRs | Releases |

---

## 🎯 When to Use Each Workflow

### Use CI/CD Pipeline When:
- Making any code change
- Fixing bugs
- Adding features
- Want instant OTA updates
- Need fast iteration

### Use PR Preview When:
- Testing major changes
- Need team feedback
- Want to test on device
- Before merging to main
- Demonstrating features

### Use Native Build When:
- Preparing Play Store release
- Native code changed
- New app version
- Major release
- Monthly builds

---

## ⚡ Common Workflows

### Daily Development
```bash
# Make changes
git add .
git commit -m "fix: button styling"
git push origin main

# Wait 2 minutes
# OTA update live ✅
```

### Feature Development
```bash
# Create feature branch
git checkout -b feature/calculator

# Develop feature
# ... write code ...

# Push and create PR
git push origin feature/calculator

# Preview APK builds automatically
# Test on device
# Get feedback
# Merge when ready
```

### Release Process
```bash
# Update version in app.json
# Update CHANGELOG.md
# Commit changes
git add .
git commit -m "chore: bump version to 1.1.0"
git push origin main

# Trigger native build manually
# Download AAB
# Upload to Play Store
```

---

## 🔧 Workflow Configuration

### Modify CI/CD Pipeline
**File:** `.github/workflows/ci-cd.yml`

**Change test coverage threshold:**
```yaml
# In test job, find:
run: npm run test:coverage
# Coverage thresholds are in jest.config.js
```

**Change OTA deployment branch:**
```yaml
# Find:
if: github.ref == 'refs/heads/main'
# Change 'main' to your branch
```

### Modify PR Preview
**File:** `.github/workflows/pr-preview.yml`

**Change build profile:**
```yaml
# Find:
--profile preview
# Change to --profile production
```

**Disable preview builds:**
```yaml
# Comment out the entire file
# Or add condition:
if: github.event.pull_request.draft == false
```

### Modify Native Build
**File:** `.github/workflows/native-build.yml`

**Add new platform:**
```yaml
# In inputs section, add:
options:
  - android
  - ios
  - web  # new
```

**Change default profile:**
```yaml
# In inputs section, find:
default: 'production'
# Change to 'preview'
```

---

## 📈 Monitoring Workflows

### View All Runs
```bash
gh run list --limit 10
```

### View Specific Workflow
```bash
gh run list --workflow=ci-cd.yml
```

### Watch Running Workflow
```bash
gh run watch
```

### Download Artifacts
```bash
gh run download [run-id]
```

### View Logs
```bash
gh run view [run-id] --log
```

---

## 🐛 Debugging Failed Workflows

### Step 1: Check the Logs
1. Go to Actions tab
2. Click failed workflow
3. Click failed job
4. Expand failed step
5. Read error message

### Step 2: Common Issues

**Tests failing:**
```bash
# Run tests locally first
npm test

# Fix any failures
# Push again
```

**TypeScript errors:**
```bash
# Check types locally
npx tsc --noEmit

# Fix errors
# Push again
```

**Build failing:**
```bash
# Check EAS status
npx eas build:list

# View detailed logs
npx eas build:view [build-id]
```

**Secrets missing:**
```bash
# Verify secrets exist
# Settings → Secrets → Actions
# Check spelling (case-sensitive)
```

### Step 3: Re-run Failed Jobs
1. Go to failed workflow run
2. Click "Re-run failed jobs"
3. Or "Re-run all jobs"

---

## 🎨 Customization Examples

### Add Lint Check
```yaml
- name: Run ESLint
  run: npm run lint
```

### Add E2E Tests
```yaml
- name: Run E2E tests
  run: npm run test:e2e
  continue-on-error: true
```

### Add Notification
```yaml
- name: Send notification
  if: always()
  uses: some-notification-action
  with:
    status: ${{ job.status }}
```

### Add Deploy to Firebase
```yaml
- name: Deploy to Firebase
  run: firebase deploy
  env:
    FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

---

## 📱 Platform-Specific Notes

### Android
- AAB builds take 10-15 minutes
- APK builds take 8-12 minutes
- Requires signing credentials
- Auto-submit uses service account

### iOS
- IPA builds take 15-20 minutes
- Requires Apple Developer account
- Requires certificates and profiles
- Auto-submit requires App Store Connect API key

---

## 💡 Tips & Best Practices

### Speed Up Builds
- Use npm ci instead of npm install
- Cache node_modules
- Run tests in parallel
- Skip builds for docs changes

### Save EAS Credits
- Use continue-on-error for optional steps
- Don't build PRs from forks
- Use --no-wait for non-blocking builds
- Schedule builds during off-peak hours

### Improve Reliability
- Pin action versions (@v4, not @latest)
- Set timeouts on long-running steps
- Use continue-on-error judiciously
- Add retry logic for flaky steps

### Better Notifications
- Use job summaries ($GITHUB_STEP_SUMMARY)
- Comment on PRs and commits
- Send Slack/Discord notifications
- Create GitHub releases automatically

---

## 🔐 Security Checklist

- [ ] All secrets added to GitHub Secrets
- [ ] No secrets in workflow files
- [ ] Service accounts have minimal permissions
- [ ] Workflows don't run on fork PRs
- [ ] Branch protection enabled on main
- [ ] Required status checks configured
- [ ] Auto-merge disabled for security PRs

---

## 📚 Additional Resources

### Documentation
- [Main CI/CD Guide](../../CI_CD_SETUP.md)
- [GitHub Secrets Guide](../../GITHUB_SECRETS.md)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

### Workflow Examples
- [Expo GitHub Actions](https://github.com/expo/expo-github-action)
- [React Native CI/CD](https://reactnative.dev/docs/running-on-device)
- [GitHub Actions Examples](https://github.com/actions/starter-workflows)

---

## 🆘 Getting Help

**Workflow not running:**
1. Check workflow file is in `.github/workflows/`
2. Verify YAML syntax is valid
3. Check branch matches trigger condition
4. Look for workflow disabled in UI

**Need to debug:**
1. Add debug step: `run: env | sort`
2. Enable debug logging in Actions settings
3. Use `continue-on-error: true` to see all steps
4. Check GitHub Actions logs

**EAS build issues:**
1. Check EAS Dashboard for detailed logs
2. Run build locally: `eas build --platform android --profile preview --local`
3. Verify credentials: `eas credentials`
4. Check build limits and quotas

---

**Last Updated:** 2025-11-06
**Version:** 1.0.0
