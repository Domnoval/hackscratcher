# CI/CD Setup Guide for Scratch Oracle

Complete automated CI/CD pipeline using GitHub Actions for testing, building, and deploying your Scratch Oracle app.

## Overview

This repository includes three automated workflows:

1. **ci-cd.yml** - Main pipeline (tests + OTA deployment)
2. **pr-preview.yml** - Build preview APKs for pull requests
3. **native-build.yml** - Build production AAB/IPA for app stores

---

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Every push to `main` or `develop`
- Every pull request to `main` or `develop`

**What it does:**
- Runs TypeScript type checking
- Executes all tests with coverage reporting
- Uploads coverage to Codecov (optional)
- Posts coverage report on PRs
- Deploys OTA updates when merging to `main`
- Runs security audits
- Sends failure notifications

**Jobs:**
1. **test** - Runs tests and quality checks
2. **deploy-ota** - Publishes OTA update (main branch only)
3. **security** - Scans for vulnerabilities
4. **status** - Reports overall build status

### 2. PR Preview (`pr-preview.yml`)

**Triggers:**
- When a pull request is opened
- When commits are pushed to a PR
- When a PR is reopened

**What it does:**
- Builds a preview APK for testing
- Posts installation instructions on the PR
- Shows PR guidelines for first-time contributors
- Analyzes bundle size
- Provides EAS dashboard links

**Jobs:**
1. **build-preview** - Builds preview APK via EAS
2. **pr-info** - Posts helpful guidelines (first PR only)
3. **analyze-size** - Reports bundle size analysis

### 3. Native Production Build (`native-build.yml`)

**Triggers:**
- Manual workflow dispatch only (for controlled releases)

**Inputs:**
- `platform` - Choose android, ios, or all
- `profile` - Choose production or preview
- `auto_submit` - Optionally auto-submit to Play Store

**What it does:**
- Validates code before building
- Builds Android AAB for Play Store
- Builds iOS IPA for App Store (optional)
- Uploads artifacts for download
- Optionally submits to Play Store automatically
- Creates comprehensive build summaries

**Jobs:**
1. **validate** - Pre-build validation (tests, TypeScript)
2. **build-android** - Builds Android AAB
3. **submit-android** - Submits to Play Store (optional)
4. **build-ios** - Builds iOS IPA (if selected)
5. **notify** - Posts build status summary

---

## Required GitHub Secrets

Add these secrets to your GitHub repository:

### Essential Secrets

1. **EXPO_TOKEN** (Required)
   - Your Expo authentication token
   - Used for EAS builds and OTA updates
   - **How to get it:**
     ```bash
     npx eas login
     npx eas build:configure
     npx expo whoami
     ```

2. **EXPO_PUBLIC_SUPABASE_URL** (Required)
   - Your Supabase project URL
   - Example: `https://xxxxx.supabase.co`

3. **EXPO_PUBLIC_SUPABASE_ANON_KEY** (Required)
   - Your Supabase anonymous key
   - Get from Supabase Dashboard → Settings → API

4. **EXPO_PUBLIC_GOOGLE_MAPS_API_KEY** (Required)
   - Your Google Maps API key
   - Get from Google Cloud Console

### Optional Secrets

5. **CODECOV_TOKEN** (Optional)
   - For uploading test coverage to Codecov
   - Sign up at https://codecov.io
   - Only needed if you want coverage tracking

6. **GOOGLE_PLAY_SERVICE_ACCOUNT_JSON** (Optional)
   - For automatic Play Store submissions
   - JSON key file from Google Play Console
   - Only needed if using auto-submit feature

---

## Setup Instructions

### Step 1: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret from the list above

**Example: Adding EXPO_TOKEN**
```bash
# Get your Expo token
npx eas login
npx eas build:configure

# Copy the token
npx expo whoami
```

Then in GitHub:
- Name: `EXPO_TOKEN`
- Value: [paste your token]
- Click "Add secret"

### Step 2: Configure EAS

Make sure your `eas.json` is properly configured:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Step 3: Test the Workflows

#### Test CI/CD Pipeline:
```bash
# Create a test commit
git add .
git commit -m "Test CI/CD pipeline"
git push origin main
```

Check: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

#### Test PR Preview:
```bash
# Create a new branch
git checkout -b test-pr-preview

# Make a change
echo "# Test" >> README.md

# Push and create PR
git add .
git commit -m "Test PR preview"
git push origin test-pr-preview
```

Then create a PR on GitHub.

#### Test Native Build:
1. Go to GitHub Actions
2. Select "Native Production Build"
3. Click "Run workflow"
4. Choose platform, profile, and options
5. Click "Run workflow"

---

## How It Works

### On Every Commit

1. **Tests run automatically**
   - TypeScript type checking
   - Unit tests with coverage
   - Security audit

2. **Quality gates**
   - Must pass 80% code coverage
   - No TypeScript errors
   - No critical security issues

### On Pull Request

1. **All tests run**
2. **Preview APK builds** automatically
3. **Coverage report** posted as comment
4. **Bundle size** analysis shown
5. **Guidelines** posted for new contributors

### On Merge to Main

1. **All tests run**
2. **OTA update** publishes automatically
3. **Users get update** next time they open app
4. **No app store review needed** for OTA updates

### Manual Production Build

1. **Trigger manually** via GitHub Actions UI
2. **Validates** everything first
3. **Builds** AAB/IPA via EAS
4. **Downloads** artifact to Actions
5. **Optionally submits** to Play Store
6. **Creates** detailed summary

---

## Workflow Features

### Caching
- npm dependencies cached for faster builds
- Typical build time: 2-3 minutes

### Notifications
- PR comments for build status
- Commit comments for deployments
- Failure alerts
- Build summaries

### Security
- npm audit on every build
- Dependency vulnerability scanning
- Credentials never logged
- Service account JSON cleaned up after use

### Quality Gates
- 80% code coverage required
- TypeScript must compile
- All tests must pass
- No moderate/high security issues

---

## Common Workflows

### Deploy OTA Update
```bash
# Just push to main
git checkout main
git add .
git commit -m "Fix: button alignment"
git push origin main
```

OTA deploys automatically. Users get it next time they open the app.

### Create Preview Build for Testing
```bash
# Create PR
git checkout -b feature/new-button
# make changes
git push origin feature/new-button
# Create PR on GitHub
```

Preview APK builds automatically. Download from EAS Dashboard.

### Build for Play Store
1. Go to Actions tab
2. Click "Native Production Build"
3. Click "Run workflow"
4. Select:
   - Platform: android
   - Profile: production
   - Auto-submit: false (or true)
5. Wait 10-15 minutes
6. Download AAB from Actions artifacts
7. Upload to Play Console

### Emergency Hotfix
```bash
# Create hotfix branch
git checkout -b hotfix/critical-bug
# fix the bug
git add .
git commit -m "Fix: critical crash on startup"
git push origin hotfix/critical-bug

# Create PR - tests run automatically
# After approval, merge to main
# OTA deploys automatically within minutes
```

---

## Cost Analysis

### GitHub Actions
- **Free tier:** 2,000 minutes/month (private repos)
- **Public repos:** Unlimited free
- **Each workflow run:** ~2-5 minutes
- **Estimated capacity:** 400+ builds/month free

### EAS Builds
- **Free tier:** Limited builds/month
- **Paid plans:** Start at $29/month
- **Consider:** Native builds on GitHub runners (100% free)

### Recommendations
- Use OTA updates for most changes (free, instant)
- Use native builds only when needed (native code changes)
- PR previews: Use sparingly for major features
- Production builds: Manual trigger for releases

---

## Troubleshooting

### Build fails with "EXPO_TOKEN not found"
- Check that secret is added in GitHub Settings
- Secret name must be exactly `EXPO_TOKEN`
- Token should not have spaces or quotes

### OTA update not deploying
- Check that you pushed to `main` branch
- Verify EXPO_TOKEN is valid: `npx expo whoami`
- Look for error messages in Actions logs

### Preview build not starting
- Check EAS credits/subscription
- Verify eas.json has "preview" profile
- Check Actions logs for detailed error

### Tests failing in CI but pass locally
- Check Node version matches (18.x)
- Ensure all dependencies in package.json
- Look for environment-specific issues
- Check test timeout settings

### Coverage not uploading to Codecov
- Add CODECOV_TOKEN secret (optional)
- Or remove Codecov steps from workflow
- Coverage still generated in artifacts

### Native build fails
- Check EAS credentials are configured
- Verify app.json and eas.json are valid
- Look for native dependency issues
- Check EAS build logs for details

---

## Advanced Configuration

### Add Slack Notifications

Add to any workflow job:

```yaml
- name: Send Slack notification
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Build ${{ job.status }}: ${{ github.workflow }}"
      }
```

### Add Version Bumping

Add before build step:

```yaml
- name: Bump version
  run: |
    npm version patch -m "Bump version to %s"
    git push --tags
```

### Add Release Notes

Add after successful build:

```yaml
- name: Create release notes
  uses: actions/create-release@v1
  with:
    tag_name: v${{ steps.version.outputs.version }}
    release_name: Release ${{ steps.version.outputs.version }}
    body_path: CHANGELOG.md
```

### Add Discord Webhooks

```yaml
- name: Discord notification
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "Build Status"
```

---

## Best Practices

### Branch Strategy
- `main` - Production, auto-deploys OTA
- `develop` - Development, runs tests only
- `feature/*` - Feature branches, PR previews
- `hotfix/*` - Emergency fixes, fast-track to main

### Commit Messages
Use conventional commits for auto-changelogs:
- `feat: add new calculator screen`
- `fix: resolve crash on startup`
- `chore: update dependencies`
- `docs: update README`

### Testing Strategy
- Write tests for all new features
- Maintain 80%+ coverage
- Test on preview APKs before merging
- Use physical devices for final testing

### Release Strategy
1. Develop in feature branches
2. Create PR with preview build
3. Test preview APK thoroughly
4. Merge to main (triggers OTA)
5. Monitor crash reports
6. Build native AAB monthly or for major releases

---

## Monitoring

### GitHub Actions Dashboard
- View all workflow runs
- Download build artifacts
- Check logs and errors
- See timing and resource usage

URL: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

### EAS Dashboard
- View build status
- Download APK/AAB files
- See build logs
- Monitor submission status

URL: `https://expo.dev/accounts/mm444/projects/scratch-oracle-app/builds`

### Codecov Dashboard
- Track coverage over time
- See coverage by file
- Monitor trends
- Get PR coverage diffs

URL: `https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO`

---

## Migration from Manual Builds

### Before (Manual)
```bash
# Every time you want to deploy
npm install
npm test
eas build --platform android --profile production
# Wait 10-15 minutes
# Download AAB
# Upload to Play Console
# Wait for review
```

### After (Automated)
```bash
# For most updates (OTA)
git push origin main
# Users get update instantly ✅

# For native updates (rare)
# Just click "Run workflow" in GitHub
# Download AAB from artifacts
```

**Time saved:** 90%+ on deployments

---

## Security Considerations

### Secrets Management
- Never commit secrets to code
- Use GitHub Secrets for sensitive data
- Rotate tokens regularly
- Use service accounts for automation

### Access Control
- Limit who can trigger workflows
- Require PR approvals
- Use branch protection rules
- Enable 2FA for all accounts

### Dependency Security
- Automated security scans on every build
- npm audit runs automatically
- Dependabot alerts enabled
- Regular dependency updates

---

## Support

### Resources
- [GitHub Actions Docs](https://docs.github.com/actions)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Workflow Docs](https://docs.expo.dev/guides/github-actions/)

### Getting Help
1. Check workflow logs in Actions tab
2. Review this documentation
3. Check EAS build logs
4. Search GitHub Issues
5. Ask in Expo Discord

---

## Quick Reference

### Workflow Triggers

| Workflow | Trigger | Duration | Cost |
|----------|---------|----------|------|
| CI/CD | Every push | 2-3 min | Free |
| PR Preview | Every PR | 10-15 min | EAS credits |
| Native Build | Manual only | 10-20 min | EAS credits |

### Deployment Types

| Type | Speed | Review Required | Use Case |
|------|-------|-----------------|----------|
| OTA Update | Instant | No | Bug fixes, features |
| Preview APK | 10-15 min | No | Testing PRs |
| Production AAB | 10-20 min | Yes (Google) | Major releases |

### Commands

```bash
# View workflow status
gh workflow list

# View recent runs
gh run list

# Watch a workflow run
gh run watch

# Download artifacts
gh run download [run-id]

# Trigger manual workflow
gh workflow run native-build.yml
```

---

## Next Steps

1. ✅ Set up GitHub Secrets
2. ✅ Test workflows with a commit
3. ✅ Create a test PR to verify preview builds
4. ✅ Trigger a manual native build
5. ⚙️ Configure branch protection rules
6. ⚙️ Set up Codecov (optional)
7. ⚙️ Add Slack/Discord notifications (optional)
8. 🚀 Start using automated deployments!

---

**Last Updated:** 2025-11-06
**Version:** 1.0.0
**Maintained by:** CI/CD Automation Agent
