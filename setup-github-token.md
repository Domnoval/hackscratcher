# 🔑 ADD EXPO_TOKEN TO GITHUB SECRETS

**Quick Setup Guide**

---

## Step 1: Create Expo Access Token

1. Open in browser: https://expo.dev/accounts/mm444/settings/access-tokens
2. Click **"Create Token"** button
3. Enter name: `GitHub Actions CI/CD`
4. Click **"Create"**
5. **COPY THE TOKEN** (it only shows once!)

---

## Step 2: Add to GitHub Secrets

1. Open in browser: https://github.com/Domnoval/hackscratcher/settings/secrets/actions
2. Click **"New repository secret"**
3. Fill in:
   - **Name:** `EXPO_TOKEN`
   - **Value:** Paste the token from Step 1
4. Click **"Add secret"**

---

## Step 3: Verify It Works

After adding the secret, GitHub Actions will automatically:
- Build your app on every push to `main`
- Run type checks on pull requests
- Post build links as commit comments

Test it:
```bash
git add .
git commit -m "Test GitHub Actions"
git push
```

Then check: https://github.com/Domnoval/hackscratcher/actions

---

## 🎯 DONE!

Your builds will now run automatically on GitHub's servers instead of waiting in EAS queue!

**Monitor builds at:**
- GitHub: https://github.com/Domnoval/hackscratcher/actions
- EAS: https://expo.dev/accounts/mm444/projects/scratch-oracle-app/builds

---

## 🔒 Security Note

This token gives GitHub Actions permission to:
- Trigger EAS builds
- Access your Expo projects
- Upload build artifacts

**Keep it secret!** Never share or commit to git.
