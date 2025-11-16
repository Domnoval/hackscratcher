# Scratch Oracle - Deployment Quick Reference

**One-page cheat sheet for fast deployments**

---

## 🚀 Quick Deploy Commands

### Hotfix (5 min - Critical bugs)
```bash
./scripts/deploy-hotfix.sh "Fix crash on launch"
```

### Feature (12 min - New features)
```bash
./scripts/deploy-feature.sh "Add ticket scanner"
```

### Production (15 min - Play Store release)
```bash
./scripts/deploy-native.sh --production --submit --wait
```

---

## ✅ Pre-Flight

### Quick Check
```bash
./scripts/pre-flight-check.sh
```

### Strict Mode (all checks must pass)
```bash
./scripts/pre-flight-check.sh --strict
```

---

## 📦 Build Commands

### Check Build Status
```bash
eas build:list                    # List all builds
eas build:view <id>               # View specific build
eas build:view --latest           # View latest build
```

### Download Builds
```bash
eas build:download --latest       # Download latest
eas build:download --id <id>      # Download specific
```

### Manual Build
```bash
# Preview (APK)
eas build --platform android --profile preview

# Production (AAB)
eas build --platform android --profile production

# Wait for completion
eas build --platform android --profile preview --wait

# Clear cache
eas build --platform android --clear-cache
```

---

## ↩️ Rollback

### Quick Rollback
```bash
./scripts/rollback.sh --last      # Rollback to last backup
./scripts/rollback.sh v1.0.5      # Rollback to specific version
./scripts/rollback.sh             # Interactive (shows list)
```

### Rollback Decision
- **Critical crash** → Rollback NOW
- **Major bug** → Rollback if fix >2 hours
- **Minor issue** → Fix forward with hotfix
- **Cosmetic** → Fix in next release

---

## 🔍 Verification

### Post-Deployment Check
```bash
./scripts/verify-deployment.sh              # Verify latest
./scripts/verify-deployment.sh <build-id>   # Verify specific
```

### Manual Checks
```bash
# App version
grep version app.json

# Git status
git status
git log --oneline -5

# Recent tags
git tag -l "v*" --sort=-creatordate | head -5
```

---

## 🏪 Play Store

### Submit to Play Store
```bash
eas submit --platform android
eas submit --platform android --id <build-id>
```

### Check Submission Status
```bash
eas submit:list --platform android
```

### Play Console
https://play.google.com/console

---

## 🔧 Troubleshooting

### Build Failed
```bash
eas build:view <id> --logs        # View logs
eas build --clear-cache           # Clear cache
npm install                       # Reinstall deps
```

### Git Issues
```bash
git pull --rebase origin main     # Pull latest
git stash                         # Stash changes
git reset --hard HEAD             # Reset (CAREFUL!)
```

### EAS Issues
```bash
eas whoami                        # Check login
eas logout && eas login           # Re-login
eas credentials                   # Check credentials
```

### App Crashes
```bash
adb logcat | grep -i crash        # View crash logs
adb logcat | grep ReactNativeJS   # JS errors
npx expo start --clear            # Clear metro cache
```

---

## 📋 Version Management

### Current Version
```bash
grep '"version"' app.json         # Check version
grep '"versionCode"' app.json     # Check versionCode
```

### Bump Version
- **Hotfix:** 1.0.1 → 1.0.2 (patch)
- **Feature:** 1.0.5 → 1.1.0 (minor)
- **Major:** 1.9.0 → 2.0.0 (major)

### Manual Version Update
```json
// app.json
{
  "expo": {
    "version": "1.0.6",
    "android": {
      "versionCode": 7
    }
  }
}
```

---

## 🏷️ Git Tags

### View Tags
```bash
git tag -l "v*" --sort=-creatordate | head -10
git tag -l "backup_*" --sort=-creatordate | head -10
```

### Create Tag
```bash
git tag -a v1.0.5 -m "Release 1.0.5"
git push origin v1.0.5
```

### Delete Tag
```bash
git tag -d v1.0.5                 # Delete local
git push origin :refs/tags/v1.0.5 # Delete remote
```

---

## 🌐 Environment Variables

### Check Variables
```bash
cat eas.json | grep EXPO_PUBLIC   # List env vars
cat .env                          # Local env file
```

### Required Variables
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## 📱 Device Testing

### Install APK
```bash
adb devices                       # List devices
adb install -r app.apk            # Install
adb uninstall com.scratchoracle.app  # Uninstall
```

### View Logs
```bash
adb logcat                        # All logs
adb logcat *:E                    # Errors only
adb logcat | grep ReactNative     # React Native logs
adb logcat -c                     # Clear logs
```

---

## ⚡ Emergency Procedures

### Critical Bug in Production
```bash
# 1. Immediate rollback
./scripts/rollback.sh --last

# 2. Build replacement
# (Script prompts, answer 'y')

# 3. Verify
./scripts/verify-deployment.sh

# 4. Notify team
# Post in team chat

# 5. Fix and redeploy
./scripts/deploy-hotfix.sh "Fix critical issue"
```

### App Won't Build
```bash
# Nuclear option (rebuilds everything)
rm -rf node_modules package-lock.json
npm install
eas build --platform android --clear-cache
```

### Can't Push to Git
```bash
# Pull and rebase
git pull --rebase origin main

# Or force push (DANGEROUS)
git push origin main --force-with-lease
```

---

## 📊 Monitoring

### Build Status
```bash
eas build:list                    # View all builds
watch -n 30 'eas build:list'      # Auto-refresh
```

### Play Console Vitals
- Crash rate: <1%
- ANR rate: <0.5%
- Rating: >4.0

### Links
- Play Console: https://play.google.com/console
- EAS Dashboard: https://expo.dev/accounts/[username]/projects/scratch-oracle-app
- Supabase: https://app.supabase.com/project/[project-id]

---

## 🎯 Deployment Checklist

```markdown
Before Deploy:
[ ] Tests passing (npm test)
[ ] TypeScript clean (npx tsc --noEmit)
[ ] Tested on device
[ ] Pre-flight check passed
[ ] On main branch
[ ] Version bumped
[ ] Changelog updated

After Deploy:
[ ] Build completed
[ ] Verification passed
[ ] Tested on device
[ ] No crashes
[ ] Performance OK
[ ] Team notified

Production:
[ ] Beta tested
[ ] All QA passed
[ ] Changelog finalized
[ ] Release notes ready
[ ] Staged rollout plan
```

---

## 🆘 Emergency Contacts

### Critical Issues
1. Run: `./scripts/rollback.sh --last`
2. Check: TROUBLESHOOTING.md
3. Contact: Team lead
4. Escalate: EAS Support

### Support Links
- Docs: [DEPLOYMENT_PLAYBOOK.md](./DEPLOYMENT_PLAYBOOK.md)
- Rollback: [ROLLBACK_PROCEDURES.md](./ROLLBACK_PROCEDURES.md)
- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- EAS Docs: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/

---

## 💡 Tips

### Speed Up Builds
- Use `--no-wait` for background builds
- Clear cache only when needed
- Optimize dependencies

### Reduce Errors
- Always run pre-flight check
- Test on device before deploying
- Use strict mode in pre-flight
- Keep dependencies updated

### Better Workflow
- Deploy hotfixes during business hours
- Never deploy Friday afternoon
- Monitor first 30 min after deploy
- Have rollback plan ready

---

## 🔑 Key Files

```
scripts/
├── deploy-hotfix.sh           # 5 min hotfix deploy
├── deploy-feature.sh          # 12 min feature deploy
├── deploy-native.sh           # Production builds
├── rollback.sh                # Instant rollback
├── pre-flight-check.sh        # Pre-deployment checks
└── verify-deployment.sh       # Post-deployment verification

docs/
├── DEPLOYMENT_PLAYBOOK.md     # Complete guide
├── ROLLBACK_PROCEDURES.md     # Rollback details
├── TROUBLESHOOTING.md         # Problem solutions
└── DEPLOYMENT_QUICK_REFERENCE.md  # This file

config/
├── app.json                   # App configuration
├── eas.json                   # EAS build config
├── package.json               # Dependencies
└── .gitignore                 # Git ignore rules
```

---

## 🎓 Common Workflows

### Daily Development
```bash
# 1. Pull latest
git pull origin main

# 2. Make changes
# ... code ...

# 3. Test locally
npm test
npx expo start

# 4. Commit
git add .
git commit -m "feat: Add feature"
git push origin main
```

### Weekly Beta Release
```bash
# Monday: Deploy to testers
./scripts/deploy-feature.sh "Weekly beta release"

# Tuesday-Thursday: Collect feedback
# Fix issues with hotfixes

# Friday: Prepare for production
./scripts/pre-flight-check.sh --strict
```

### Monthly Production Release
```bash
# Week 1-3: Features and testing
# Week 4: Production release

./scripts/deploy-native.sh --production --submit --wait
```

---

## 📈 Metrics to Track

### Build Metrics
- Build success rate: >95%
- Average build time: 3-5 min
- Cache hit rate: >80%

### Deployment Metrics
- Deployment frequency: Daily/Weekly
- Time to production: <15 min
- Rollback rate: <5%

### Quality Metrics
- Crash rate: <1%
- Test coverage: >70%
- User rating: >4.0

---

**Print this page and keep it handy for quick reference!**

---

**Version:** 1.0
**Last Updated:** January 2025
