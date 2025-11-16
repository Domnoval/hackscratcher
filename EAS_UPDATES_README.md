# EAS Updates - Quick Reference

Deploy updates to production in **12-15 minutes** instead of 3-7 days.

---

## Quick Commands

```bash
# Deploy to production
npm run update:production "Your update message"

# Deploy to preview (for testing)
npm run update:preview "Testing new feature"

# Check status
npm run update:view

# Rollback if something breaks
npm run update:rollback
```

---

## Typical Workflow

```bash
# 1. Make your changes
# ... edit code ...

# 2. Test locally
npm start

# 3. Commit
git add .
git commit -m "Fix lottery prize bug"

# 4. Deploy to preview
npm run update:preview:auto

# 5. After QA approval, deploy to production
npm run update:production:auto

# 6. Verify
npm run update:view
```

**Time from step 4 to users having update: 12-15 minutes**

---

## What Can You Update?

### YES (OTA Updates - 12-15 minutes)
- JavaScript/TypeScript code
- React components
- UI/styling
- Business logic
- Images and assets
- API integrations
- Bug fixes
- New features

### NO (Requires new build - 3-7 days)
- Native code changes
- New native dependencies
- App permissions
- Expo SDK upgrades

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run update:production "message"` | Deploy to all users |
| `npm run update:preview "message"` | Deploy to team for testing |
| `npm run update:development "message"` | Deploy to dev channel |
| `npm run update:production:auto` | Auto-message from git |
| `npm run update:rollback` | Rollback production |
| `npm run update:view` | View latest update |
| `npm run update:list` | List all updates |

---

## Three-Channel System

1. **Development** - Personal testing, unstable
2. **Preview** - Team testing, QA validation
3. **Production** - Live users, stable

Always test in preview before production!

---

## Full Documentation

- **EAS_UPDATES_QUICKSTART.md** - Complete guide
- **EAS_UPDATES_WORKFLOW.md** - Team workflows
- **DEPLOY_SCRIPTS.md** - All commands
- **EAS_UPDATES_SETUP_SUMMARY.md** - Configuration details

---

## Project Info

- **Project ID:** 78e2e800-e081-4b43-86e0-2968fffec441
- **Update URL:** https://u.expo.dev/78e2e800-e081-4b43-86e0-2968fffec441
- **Current Version:** 1.0.2
- **Owner:** mm444

---

## Need Help?

1. Check `EAS_UPDATES_QUICKSTART.md`
2. Review error message carefully
3. Run `npm run update:view` to check status
4. Ask in team chat
5. Read official docs: https://docs.expo.dev/eas-update/

---

**Remember:** Deploy often, deploy safely, monitor always.
