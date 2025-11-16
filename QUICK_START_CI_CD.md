# Quick Start: CI/CD Setup

Get your automated CI/CD pipeline running in 10 minutes.

---

## Step 1: Add GitHub Secrets (5 minutes)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these 4 required secrets:

### Required Secrets

```bash
# 1. EXPO_TOKEN
# Get it by running:
npx eas login
npx expo whoami

# 2. EXPO_PUBLIC_SUPABASE_URL
# From: https://supabase.com → Your Project → Settings → API
# Example: https://wqealxmdjpwjbhfrnplk.supabase.co

# 3. EXPO_PUBLIC_SUPABASE_ANON_KEY
# From: https://supabase.com → Your Project → Settings → API → anon/public
# Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 4. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
# From: https://console.cloud.google.com → APIs & Services → Credentials
# Example: AIzaSyA1uBiGC7mQxIlNe_XOPQrwdYHYoy-znXc
```

**Note:** See `GITHUB_SECRETS.md` for detailed instructions.

---

## Step 2: Test the Pipeline (2 minutes)

### Test CI/CD Workflow
```bash
# Make a small change
echo "# CI/CD Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: CI/CD pipeline"
git push origin main
```

**What happens:**
- Tests run automatically (2 min)
- OTA update deploys to production
- You get a commit comment with status

**Check it:** https://github.com/YOUR_USERNAME/scratch-oracle-app/actions

---

## Step 3: Test PR Preview (2 minutes)

```bash
# Create a test branch
git checkout -b test-pr-preview

# Make a change
echo "# Test" >> README.md

# Push and create PR
git add README.md
git commit -m "test: PR preview build"
git push origin test-pr-preview
```

**Then:**
1. Go to GitHub
2. Create a Pull Request
3. Wait 10-15 minutes
4. Preview APK link will be posted to the PR

---

## Step 4: Test Native Build (1 minute)

1. Go to GitHub → **Actions** tab
2. Click **"Native Production Build"**
3. Click **"Run workflow"**
4. Select:
   - Platform: `android`
   - Profile: `preview`
   - Auto-submit: `false`
5. Click **"Run workflow"**

**Wait 15 minutes**, then download the AAB from the Actions artifacts.

---

## That's It!

You now have:
- ✅ Automated testing on every commit
- ✅ Instant OTA deployments
- ✅ Preview builds for PRs
- ✅ Production builds on demand

---

## Next Steps

### Read the Docs
- **Full Setup Guide:** `CI_CD_SETUP.md`
- **Secrets Reference:** `GITHUB_SECRETS.md`
- **Quick Reference:** `.github/workflows/WORKFLOWS_GUIDE.md`
- **Architecture:** `CI_CD_ARCHITECTURE.md`
- **Implementation Summary:** `CI_CD_IMPLEMENTATION_SUMMARY.md`

### Optional Enhancements
- Add Codecov for coverage tracking
- Set up auto-submit to Play Store
- Add Slack/Discord notifications
- Configure branch protection rules

---

## Common Commands

### Deploy OTA Update
```bash
git add .
git commit -m "feat: new feature"
git push origin main
# Done! Users get update in 2-3 minutes
```

### Build Preview for Testing
```bash
git checkout -b feature/my-feature
# ... make changes ...
git push origin feature/my-feature
# Create PR → Preview APK builds automatically
```

### Build for Play Store
1. Go to Actions tab
2. Run "Native Production Build"
3. Download AAB
4. Upload to Play Console

---

## Troubleshooting

### "EXPO_TOKEN not found"
- Check secret is added in Settings → Secrets
- Name must be exactly `EXPO_TOKEN`
- Get fresh token: `npx eas login`

### Tests failing
```bash
# Run locally first
npm test
npx tsc --noEmit

# Fix issues, then push again
```

### Build not triggering
- Check `.github/workflows/` exists
- Verify you pushed to `main` branch
- Check Actions tab for errors

---

## Quick Reference

| Action | Command | Time | Output |
|--------|---------|------|--------|
| Deploy OTA | `git push origin main` | 2-3 min | Live update |
| PR Preview | Create PR | 10-15 min | Preview APK |
| Native Build | Manual trigger | 15-20 min | AAB/IPA |

---

## Success Indicators

After setup, you should see:
- ✅ Green checkmarks in GitHub Actions
- ✅ Commit comments with deployment status
- ✅ PR comments with build links
- ✅ Coverage reports on PRs
- ✅ Artifacts available for download

---

## Need Help?

1. Check `CI_CD_SETUP.md` for detailed docs
2. Review workflow logs in Actions tab
3. Check EAS dashboard for build logs
4. See `GITHUB_SECRETS.md` for secret issues

---

**Setup Time:** 10 minutes
**Deployment Time:** 2-3 minutes
**Time Saved:** 90%+

Happy deploying! 🚀
