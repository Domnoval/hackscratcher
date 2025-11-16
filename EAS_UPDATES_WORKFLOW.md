# EAS Updates: Team Workflow Guide

## Overview

This document outlines the standard operating procedures for deploying updates to the Scratch Oracle app using EAS Updates. The workflow is designed for speed, safety, and team collaboration.

---

## Core Principle: 12-15 Minute Deployments

**Traditional App Store Process:**
- Submit to Google Play → 3-7 days
- User downloads new version → varies
- Total time to user: 3-7+ days

**EAS Updates Process:**
- Publish OTA update → 12-15 minutes
- User receives automatically → on next app launch
- Total time to user: 12-15 minutes

---

## The Three-Channel System

### Channel Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Development Channel                   │
│  Purpose: Active development & experimentation          │
│  Audience: Individual developers                        │
│  Stability: Unstable, frequent updates                  │
│  Testing: Minimal                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     Preview Channel                      │
│  Purpose: Team testing & QA validation                  │
│  Audience: Internal team, QA testers                    │
│  Stability: Beta quality                                │
│  Testing: Full QA cycle                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Production Channel                    │
│  Purpose: Live user deployments                         │
│  Audience: All Google Play Store users                  │
│  Stability: Production ready                            │
│  Testing: Validated in preview                          │
└─────────────────────────────────────────────────────────┘
```

---

## Standard Workflows

### Workflow 1: Regular Feature Deployment (Recommended)

**Use for:** New features, enhancements, non-critical bug fixes

**Timeline:** 30 minutes - 4 hours (depending on testing)

```bash
# Step 1: Development (2-4 hours)
# - Write code
# - Test locally with `npm start`
# - Ensure TypeScript compilation: npm run typecheck
# - Run tests: npm test

# Step 2: Deploy to Preview (12 min)
git add .
git commit -m "Add lottery analytics dashboard"
npm run update:preview "Analytics dashboard - ready for QA"

# Step 3: QA Testing (30 min - 2 hours)
# - QA team tests preview build
# - Product team reviews
# - Stakeholder approval
# - Bug fixes if needed (repeat step 2)

# Step 4: Deploy to Production (12 min)
npm run update:production "Add lottery analytics dashboard"

# Step 5: Monitor (ongoing)
npm run update:view
# Check error tracking dashboard
# Monitor user feedback
```

**Decision Points:**
- ✅ **Use preview first** for: New features, UI changes, logic changes
- ⚠️ **Skip preview** only for: Critical hotfixes (see Workflow 2)

---

### Workflow 2: Emergency Hotfix

**Use for:** Critical bugs, security issues, app-breaking problems

**Timeline:** 30-60 minutes

```bash
# Step 1: Quick Fix & Local Test (15-30 min)
# - Identify issue
# - Fix code
# - Test locally thoroughly
# - Run: npm run typecheck

# Step 2: Optional Preview Test (5-10 min testing + 12 min deploy)
# If time allows, deploy to preview for quick smoke test
npm run update:preview "HOTFIX: Critical map crash - needs validation"
# Quick manual test by 1-2 team members

# Step 3: Production Deploy (12 min)
npm run update:production "HOTFIX: Fix map crash on Android 13"

# Step 4: Monitor Closely (30 min)
npm run update:view
# Watch error rates
# Check user reports
# Prepare rollback if needed
```

**Decision Criteria for Skipping Preview:**
- ✅ Production is completely broken
- ✅ Security vulnerability exposed
- ✅ Data loss or corruption occurring
- ❌ Minor visual bug
- ❌ Feature not working but app usable
- ❌ Inconvenience but not critical

---

### Workflow 3: Gradual Feature Rollout

**Use for:** Major features, risky changes, A/B testing

**Timeline:** 1-2 weeks

```bash
# Phase 1: Development Channel (Week 1)
npm run update:development "New ticket scanner v2 - experimental"
# Developer testing and iteration

# Phase 2: Preview Channel (Week 1, Day 5)
npm run update:preview "New ticket scanner v2 - ready for QA"
# Full team testing

# Phase 3: Production Channel (Week 2)
npm run update:production "Launch ticket scanner v2"
# Gradual rollout to all users

# Phase 4: Monitor & Iterate
# Week 2+: Monitor metrics, gather feedback, iterate
```

---

### Workflow 4: Rapid Iteration Cycle

**Use for:** UI polish, minor tweaks, experimentation

**Timeline:** Multiple updates per day

```bash
# Morning: First iteration
npm run update:development "UI polish - testing new button styles"

# Afternoon: Second iteration
npm run update:development "UI polish - refined colors based on feedback"

# Evening: Third iteration
npm run update:development "UI polish - final tweaks"

# Next day: Promote to preview
npm run update:preview "UI polish - ready for review"

# After approval: Production
npm run update:production "Improved button styling and colors"
```

**Best Practices:**
- Use development channel for rapid iteration
- Consolidate changes before preview
- Don't spam production with minor tweaks

---

## Role-Based Guidelines

### For Developers

**Your Responsibilities:**
1. Test locally before deploying to any channel
2. Use descriptive commit messages
3. Deploy to development/preview, not production
4. Communicate updates to team
5. Monitor error logs after deployment

**Commands You'll Use Most:**
```bash
npm run update:development "Your message"
npm run update:preview "Your message"
npm run update:list
npm run update:view
```

**When to Ask Permission:**
- Before deploying to production
- Before rolling back production
- Before making breaking changes
- When unsure about impact

---

### For QA/Testers

**Your Responsibilities:**
1. Test preview builds thoroughly
2. Validate all user flows
3. Check edge cases
4. Approve or reject for production
5. Document issues found

**How to Access Preview Updates:**
1. Install preview build (get from team)
2. Wait for update notification or restart app
3. Verify update loaded:
   - Check version in settings
   - Look for new features/fixes

**Testing Checklist:**
- ✅ Core functionality works
- ✅ New feature works as expected
- ✅ No regressions in existing features
- ✅ Performance is acceptable
- ✅ UI renders correctly
- ✅ Error handling works

---

### For Product/Tech Leads

**Your Responsibilities:**
1. Approve production deployments
2. Prioritize hotfixes vs regular updates
3. Decide when to rollback
4. Monitor user impact
5. Communicate with stakeholders

**Commands You'll Use:**
```bash
npm run update:production "Your message"  # After team approval
npm run update:rollback                    # If issues found
npm run update:list                        # View history
npm run update:view                        # Check status
```

**Decision Framework:**

**Should We Deploy?**
- ✅ QA approved
- ✅ Product approved
- ✅ Tests passing
- ✅ No known blockers
- ✅ Team available to monitor

**Should We Rollback?**
- ✅ Critical functionality broken
- ✅ Widespread user reports
- ✅ Error rate spike
- ✅ Data corruption risk
- ❌ Single user report
- ❌ Minor visual issue

---

## Communication Protocols

### Before Deployment

**Template for Preview:**
```
📱 Preview Update Deployed

Feature: [Feature name]
Description: [What changed]
Testing needed: [What to test]
Timeline: [How long for QA]

Update: npm run update:preview "message"
Who needs to test: @qa-team @product
```

**Template for Production:**
```
🚀 Production Update Ready

Feature: [Feature name]
Tested by: [QA names]
Approved by: [Product/Tech lead]
Impact: [What users will see]

Deploying in: [Time]
ETA to users: ~15 minutes after deploy
```

### After Deployment

**Template for Success:**
```
✅ Production Update Live

Update: [Description]
Deploy time: [XX minutes]
Status: Successful
Monitoring: [Link to dashboard]

Next steps: Monitor for 1 hour, check error rates
```

**Template for Issues:**
```
⚠️ Production Update Issue

Update: [Description]
Issue: [What's wrong]
Impact: [How many users]
Action: [Rolling back / Hot fixing]

ETA for fix: [Time]
```

---

## Best Practices & Standards

### Commit Message Standards

**Good Examples:**
```bash
git commit -m "Fix map crash on Android 13 devices"
git commit -m "Add lottery analytics dashboard"
git commit -m "Improve prize calculation accuracy"
git commit -m "Update Supabase query performance"
```

**Bad Examples:**
```bash
git commit -m "fix"
git commit -m "updates"
git commit -m "changes"
git commit -m "wip"
```

**Format:**
```
[Action] [What] [Where/Context]

Examples:
Fix crash in map component
Add analytics dashboard feature
Update prize calculation logic
Improve loading performance
```

---

### Update Message Standards

**Good Examples:**
```bash
npm run update:production "Fix map crash on Android 13"
npm run update:production "Add lottery analytics dashboard"
npm run update:production "Improve prize loading speed by 50%"
npm run update:production "HOTFIX: Resolve ticket scanner crash"
```

**Bad Examples:**
```bash
npm run update:production "fix"
npm run update:production "updates"
npm run update:production "new stuff"
npm run update:production "v1.0.2"
```

**Template:**
```
[HOTFIX: ] [Action] [specific change] [context if needed]

Examples:
Fix lottery prize calculation rounding
Add ticket scanner history view
Improve map marker performance
HOTFIX: Resolve Supabase connection timeout
Update store locator search algorithm
```

---

### Testing Checklist

**Before Deploying to Preview:**
- ✅ Code compiles: `npm run typecheck`
- ✅ Tests pass: `npm test`
- ✅ App runs locally: `npm start`
- ✅ Core features work
- ✅ No console errors

**Before Deploying to Production:**
- ✅ Preview deployment successful
- ✅ QA team approved
- ✅ Product team approved
- ✅ No critical bugs in preview
- ✅ Error rates normal in preview
- ✅ Team available to monitor

**After Production Deploy:**
- ✅ Update published successfully: `npm run update:view`
- ✅ Monitor error tracking for 30 min
- ✅ Check user feedback channels
- ✅ Verify update downloading to test devices
- ✅ Confirm no error rate spikes

---

## Monitoring & Verification

### Immediate Post-Deploy (0-15 minutes)

```bash
# 1. Verify publish success
npm run update:view

# Expected output:
# ✓ Branch: production
# ✓ Runtime version: 1.0.1
# ✓ Message: Your update message
# ✓ Published: Just now
# ✓ Status: Published
```

### Short-Term Monitoring (15-60 minutes)

**Check These Metrics:**
1. **Error Tracking Dashboard**
   - Error rate should be stable or lower
   - No new error types
   - No error rate spikes

2. **User Reports**
   - Monitor support channels
   - Check app store reviews
   - Watch social media mentions

3. **App Functionality**
   - Test on personal device
   - Verify update applied
   - Check core features work

4. **Update Distribution**
   ```bash
   npm run update:view
   # Check distribution percentage increases
   ```

### Long-Term Monitoring (1+ hours)

**Check These Metrics:**
1. **User Engagement**
   - Session duration
   - Feature usage
   - User retention

2. **Performance Metrics**
   - App load time
   - Screen render time
   - API response time

3. **Update Adoption**
   - What % of users updated
   - Time to full rollout
   - Any update failures

---

## Rollback Procedures

### When to Rollback

**Immediate Rollback Required:**
- ✅ App crashes on launch
- ✅ Critical feature completely broken
- ✅ Data loss or corruption
- ✅ Security vulnerability introduced
- ✅ Error rate spike >50%

**Fix Forward Instead:**
- ❌ Minor visual bug
- ❌ Single feature has issue (other features work)
- ❌ Small number of users affected
- ❌ Easy quick fix available

---

### Rollback Methods

#### Method 1: Quick Rollback (Fastest - 5 minutes)

```bash
# Rollback to previous update immediately
npm run update:rollback

# This republishes the last known good update
```

**Use when:**
- Critical issue
- Need fastest possible resolution
- Don't have time to investigate

---

#### Method 2: Targeted Rollback (10 minutes)

```bash
# Step 1: Find the update to rollback to
npm run update:list

# Step 2: Copy the update group ID of last good update

# Step 3: Republish that specific update
eas update --branch production --republish --group <update-group-id> --message "Rollback to version before crash"
```

**Use when:**
- Need to rollback to specific version
- Want to skip multiple bad updates
- Have time to be precise

---

#### Method 3: Fix Forward (12 minutes)

```bash
# Step 1: Fix the issue in code
# Step 2: Test locally
# Step 3: Deploy fixed update

npm run update:production "HOTFIX: Resolve issue from previous update"
```

**Use when:**
- Fix is simple and fast
- More confidence in fix than rollback
- Want to move forward not backward

---

### Post-Rollback Actions

1. **Communicate**
   ```
   ⚠️ Production Rollback Executed

   Issue: [What went wrong]
   Action taken: Rolled back to [version/time]
   Current status: Stable
   Root cause: Under investigation
   Next steps: [Plan to re-deploy fix]
   ```

2. **Investigate**
   - Review error logs
   - Reproduce issue locally
   - Identify root cause
   - Plan fix

3. **Fix & Redeploy**
   - Fix issue
   - Test thoroughly in preview
   - Get approval
   - Redeploy to production

4. **Post-Mortem**
   - Document what went wrong
   - Why it wasn't caught in preview
   - How to prevent in future
   - Update processes if needed

---

## Advanced Scenarios

### Scenario 1: Multiple Simultaneous Features

**Challenge:** Multiple developers working on different features

**Solution: Branch-Based Development**

```bash
# Developer A: Works on Feature X
git checkout -b feature/analytics-dashboard
# ... develop feature ...
git commit -m "Add analytics dashboard"
npm run update:development "Analytics dashboard - Dev A testing"

# Developer B: Works on Feature Y
git checkout -b feature/ticket-history
# ... develop feature ...
git commit -m "Add ticket history view"
npm run update:development "Ticket history - Dev B testing"

# When ready: Merge to main and deploy preview
git checkout main
git merge feature/analytics-dashboard
npm run update:preview "Analytics dashboard - ready for QA"

# After QA: Deploy to production
npm run update:production "Add analytics dashboard"

# Repeat for Feature Y
```

---

### Scenario 2: Versioned Rollout Strategy

**Challenge:** Want to deploy to subset of users first

**Solution: Staged Channel Rollout**

```bash
# Stage 1: Preview channel (internal team - Day 1)
npm run update:preview "New feature - internal testing"
# 10-20 internal users test

# Stage 2: Production channel (all users - Day 3)
npm run update:production "New feature - public release"
# All users receive update

# Monitor adoption
npm run update:view
```

**Note:** EAS doesn't support percentage-based rollouts by default. All users on a channel receive updates. For more granular control, you'd need feature flags in your code.

---

### Scenario 3: Cross-Platform Updates

**Challenge:** Update affects both Android and iOS (future)

**Solution: Platform-Specific Testing**

```bash
# Test on Android first
npm run update:preview "New feature - Android testing"
# QA tests on Android devices

# If iOS build exists, test separately
eas update --branch preview --platform ios --message "New feature - iOS testing"
# QA tests on iOS devices

# Deploy to production for both
npm run update:production "New feature - all platforms"
# Both platforms receive update
```

---

## Troubleshooting Common Issues

### Issue 1: Update Not Appearing on Device

**Symptoms:** Published update, but device still shows old version

**Troubleshooting Steps:**

1. **Verify update published**
   ```bash
   npm run update:view
   # Should show your update as published
   ```

2. **Check device is on correct channel**
   - Ensure device has build from correct profile
   - Production build → production updates
   - Preview build → preview updates

3. **Check runtime version matches**
   ```bash
   npm run update:list
   # Runtime version should match app.json version
   ```

4. **Force app restart**
   - Close app completely (swipe from recents)
   - Reopen app
   - Updates apply on restart, not while running

5. **Clear app cache** (last resort)
   - Uninstall app
   - Reinstall from store/build
   - Should download latest update

**Solution:**
```bash
# If runtime version mismatch, publish for correct version
eas update --branch production --runtime-version "1.0.1" --message "Update for v1.0.1"
```

---

### Issue 2: Update Build Failed

**Symptoms:** `eas update` command fails with errors

**Troubleshooting Steps:**

1. **Check for TypeScript errors**
   ```bash
   npm run typecheck
   # Fix any TypeScript errors
   ```

2. **Verify dependencies installed**
   ```bash
   npm install
   # or
   npm ci  # Clean install
   ```

3. **Check asset references**
   - Ensure all imported assets exist
   - Verify file paths are correct
   - Check for typos in imports

4. **Review error message carefully**
   - Often points to specific file/line
   - Look for module not found errors
   - Check for syntax errors

5. **Test build locally**
   ```bash
   npx expo export
   # If this fails, fix before updating
   ```

**Common Errors:**

```bash
# Error: Module not found
# Solution: Check imports, install missing package

# Error: TypeScript compilation failed
# Solution: npm run typecheck, fix errors

# Error: Asset not found
# Solution: Verify file exists at specified path

# Error: Not authenticated
# Solution: eas login
```

---

### Issue 3: Update Too Slow / Timing Out

**Symptoms:** Update takes longer than 15 minutes or times out

**Troubleshooting Steps:**

1. **Check bundle size**
   ```bash
   npx expo export
   # Check size of dist folder
   ```

2. **Optimize assets**
   - Compress images
   - Remove unused assets
   - Use WebP format

3. **Check internet connection**
   - Ensure stable connection
   - Try different network

4. **Retry update**
   ```bash
   npm run update:production "Your message"
   # EAS will resume from last checkpoint
   ```

---

### Issue 4: Different Behavior After Update

**Symptoms:** App works differently after OTA update than in development

**Possible Causes:**

1. **Environment variables**
   - Check eas.json env configuration
   - Verify production env vars are correct

2. **Caching issues**
   - Update might be cached partially
   - User might need to clear app cache

3. **Runtime version mismatch**
   - Update might have loaded for wrong version
   - Check runtime version in update

4. **Native dependencies**
   - Remember: Can't update native code via OTA
   - Native changes require new build

**Investigation:**
```bash
# Check what was published
npm run update:view

# Compare with local code
git diff

# Verify env configuration
cat eas.json
```

---

## Key Metrics to Track

### Update Performance

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Deploy time | 12-15 min | Time from command to published |
| Adoption rate | 80% in 24h | Update view stats |
| Update success rate | >99% | Error tracking |
| Rollback frequency | <5% of deploys | Manual tracking |

### App Performance

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Error rate | <1% sessions | Error tracking dashboard |
| Crash rate | <0.1% sessions | Crash reporting tool |
| Load time | <3 seconds | Performance monitoring |
| User satisfaction | >4.0 rating | App store reviews |

### Team Velocity

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Features per week | 2-3 | Manual tracking |
| Bug fix time | <24h | Issue tracker |
| Deploy frequency | Daily | Deployment log |
| Preview → Production time | <4 hours | Manual tracking |

---

## Checklist Templates

### Pre-Deploy Checklist (Print & Use)

```
Developer Name: __________
Date: __________
Feature: __________
Target Channel: [ ] Development  [ ] Preview  [ ] Production

Code Quality:
[ ] TypeScript compiles (npm run typecheck)
[ ] Tests pass (npm test)
[ ] Linting clean (npm run lint)
[ ] No console.log statements
[ ] Code reviewed by: __________

Testing:
[ ] Tested locally in dev mode
[ ] Tested core user flows
[ ] Tested on Android device
[ ] Tested edge cases
[ ] No errors in console

Documentation:
[ ] Update message prepared
[ ] Team notified via: __________
[ ] Changelog updated (if production)
[ ] Rollback plan identified

Approvals (Production only):
[ ] QA approved by: __________
[ ] Product approved by: __________
[ ] Tech lead approved by: __________

Deploy Command:
[ ] npm run update:production "message"

Post-Deploy:
[ ] Verified with: npm run update:view
[ ] Monitoring for: __________ minutes
[ ] No errors detected
[ ] Team notified of completion
```

---

### Post-Deploy Monitoring Checklist

```
Update: __________
Deploy Time: __________
Deployed By: __________

0-15 Minutes:
[ ] Update published successfully
[ ] No immediate errors in tracking
[ ] Update visible in: npm run update:view
[ ] Spot check on test device

15-30 Minutes:
[ ] Error rate checked: __________
[ ] User reports checked: __________
[ ] Core features verified working
[ ] Team notified of stable deployment

30-60 Minutes:
[ ] Update adoption: _________%
[ ] Performance metrics checked
[ ] No rollback needed
[ ] Post-deploy summary sent

Issues Encountered:
__________________________________________________
__________________________________________________

Actions Taken:
__________________________________________________
__________________________________________________

Sign-off: __________  Date/Time: __________
```

---

## Quick Reference Card

### Most Used Commands

```bash
# Preview Testing
npm run update:preview "Your message"

# Production Deploy
npm run update:production "Your message"

# Emergency Rollback
npm run update:rollback

# Check Status
npm run update:view

# List Updates
npm run update:list
```

### Emergency Contacts

```
Tech Lead: __________
QA Lead: __________
Product Manager: __________
DevOps: __________

Emergency Procedures:
1. Identify issue severity
2. Notify tech lead
3. Execute rollback if critical
4. Communicate to team
5. Investigate root cause
```

### Key URLs

- **EAS Dashboard:** https://expo.dev/accounts/mm444/projects/scratch-oracle-app
- **Update Endpoint:** https://u.expo.dev/78e2e800-e081-4b43-86e0-2968fffec441
- **Play Store:** https://play.google.com/store/apps/details?id=com.scratchoracle.app
- **Error Tracking:** [Your error tracking URL]
- **Analytics:** [Your analytics URL]

---

**Document Version:** 1.0
**Last Updated:** 2025-11-06
**Next Review:** 2025-12-06
**Owner:** Development Team
