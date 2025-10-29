# GitHub Actions CI/CD Workflows

## 🚀 Automated Builds for Scratch Oracle

This directory contains GitHub Actions workflows that automate building and testing your app.

---

## 📋 Workflows

### 1. **build-production.yml** - Production Builds
**Triggers:**
- Push to `main` branch
- Manual trigger via GitHub Actions UI

**What it does:**
- Installs dependencies
- Triggers EAS build for Android
- Posts build link as commit comment

**Requirements:**
- `EXPO_TOKEN` secret must be set in GitHub

---

### 2. **pr-checks.yml** - Pull Request Checks
**Triggers:**
- Pull requests to `main` or `develop`

**What it does:**
- TypeScript type checking
- Runs tests
- Validates code quality

---

## 🔧 Setup Instructions

### Step 1: Get Your Expo Token

Run this command locally:
```bash
npx eas login
npx eas whoami
```

Then get your token:
```bash
npx eas build:token
```

Copy the token that's output.

---

### Step 2: Add GitHub Secret

1. Go to your GitHub repo: https://github.com/Domnoval/hackscratcher
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `EXPO_TOKEN`
5. Value: Paste the token from Step 1
6. Click **"Add secret"**

---

### Step 3: Test It!

Push a commit to `main`:
```bash
git add .
git commit -m "Test automated build"
git push
```

Go to: https://github.com/Domnoval/hackscratcher/actions

You should see your build running! 🎉

---

## 🎯 How to Use

### Automatic Builds (Every push to main)
Just push to main and the build triggers automatically:
```bash
git push origin main
```

### Manual Builds (Anytime)
1. Go to: https://github.com/Domnoval/hackscratcher/actions
2. Click "Build Production Android"
3. Click "Run workflow"
4. Select branch and profile
5. Click "Run workflow"

---

## 📊 Build Status

View your builds at:
- GitHub Actions: https://github.com/Domnoval/hackscratcher/actions
- EAS Dashboard: https://expo.dev/accounts/mm444/projects/scratch-oracle-app/builds

---

## 🔄 Future Enhancements

**Planned additions:**
- [ ] Automatic Play Store upload
- [ ] Slack/Discord notifications
- [ ] Version bump automation
- [ ] Release notes generation
- [ ] Native Android builds (skip EAS)

---

## 💰 Cost

**GitHub Actions:**
- 2,000 free minutes/month (private repos)
- Each build takes ~2-3 minutes
- ~600+ builds/month for FREE

**EAS Builds:**
- Still uses your EAS credits
- Consider switching to native builds later to go 100% free

---

## 🐛 Troubleshooting

### Build fails with "EXPO_TOKEN not found"
- Make sure you added the secret in GitHub Settings → Secrets
- Secret name must be exactly `EXPO_TOKEN` (case-sensitive)

### Build doesn't trigger
- Check that `.github/workflows/` is in your main branch
- Make sure you pushed the workflow files

### Want to disable auto-builds temporarily?
- Comment out the `on: push:` section in the workflow file
- Or disable the workflow in GitHub Actions UI

---

**Questions?** Check the GitHub Actions docs: https://docs.github.com/actions
