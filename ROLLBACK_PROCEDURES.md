# Scratch Oracle - Rollback Procedures

**Complete guide to rolling back failed deployments**

Last Updated: January 2025

---

## Table of Contents

1. [Quick Rollback](#quick-rollback)
2. [When to Rollback](#when-to-rollback)
3. [Rollback Types](#rollback-types)
4. [Step-by-Step Procedures](#step-by-step-procedures)
5. [Verification](#verification)
6. [Communication](#communication)
7. [Post-Rollback](#post-rollback)
8. [Prevention](#prevention)

---

## Quick Rollback

### Emergency Rollback (2 minutes)

```bash
# Rollback to last known good version
./scripts/rollback.sh --last

# Trigger new build
eas build --platform android --profile preview --no-wait

# Notify team
```

### Interactive Rollback

```bash
# Shows recent tags, choose one
./scripts/rollback.sh
```

### Specific Version Rollback

```bash
# Rollback to specific tag
./scripts/rollback.sh v1.0.5

# Rollback to specific backup
./scripts/rollback.sh backup_before_hotfix_20250106_143022
```

---

## When to Rollback

### IMMEDIATE ROLLBACK REQUIRED 🔴

These issues require immediate rollback:

#### Critical Failures
- **App crashes on launch** - Users cannot open app
- **White screen of death** - App opens but shows nothing
- **Infinite loop/freeze** - App becomes unresponsive
- **Data corruption** - User data being damaged
- **Backend unreachable** - Cannot connect to Supabase
- **Authentication broken** - Users cannot login
- **Payment broken** - If we have payments, critical blocker

#### Security Issues
- **API keys exposed** - Secrets leaked in code
- **Authentication bypass** - Unauthorized access possible
- **Data leak** - User data accessible by others
- **XSS/injection vulnerabilities** - Security holes

#### Data Issues
- **Wrong data displayed** - Showing incorrect game info
- **Database errors** - Unable to read/write data
- **Cache corruption** - Stale/corrupt data shown

**Action:** Roll back immediately, don't wait for fix

```bash
./scripts/rollback.sh --last
```

---

### ROLLBACK RECOMMENDED ⚠️

Consider rollback for:

#### Major Functional Issues
- **Key feature broken** - Scanner, game list, predictions
- **Multiple screens affected** - Widespread UI issues
- **Performance degradation >50%** - App noticeably slower
- **Battery drain** - Significant increase in battery usage
- **Memory leaks** - App memory grows over time
- **Network errors** - Frequent timeout/retry issues

#### User Impact
- **>10 user complaints** within 1 hour
- **>5 crash reports** for same issue
- **>20% error rate** in analytics
- **Store rating drop** below 4.0
- **Uninstall spike** >20% increase

**Action:** Assess severity, rollback if fix will take >2 hours

```bash
# Rollback
./scripts/rollback.sh --last

# Or fix forward if simple
./scripts/deploy-hotfix.sh "Quick fix description"
```

---

### FIX FORWARD (Don't Rollback) ✅

Don't rollback for:

#### Minor Issues
- **Cosmetic bugs** - Small UI glitches
- **Single user issue** - Cannot reproduce
- **Edge case bug** - Rare scenario
- **Minor performance** - <10% degradation
- **Non-critical feature** - Optional feature broken

#### Already Distributed
- **>50% users have update** - Too late to rollback
- **24+ hours since deployment** - Users already on new version
- **Positive user feedback** - Overall response good

**Action:** Fix forward with hotfix

```bash
./scripts/deploy-hotfix.sh "Fix minor UI glitch"
```

---

## Rollback Types

### Type 1: Code Rollback Only

**Use when:** Build in progress, code not yet distributed

**What it does:**
- Reverts code to previous version
- Does NOT trigger new build
- Tags current state for safety

**Command:**
```bash
./scripts/rollback.sh <tag>
# Answer 'n' when asked to build
# Answer 'y' to force push
```

**Timeline:** 30 seconds

---

### Type 2: Code Rollback + New Build

**Use when:** Bad build distributed, need replacement ASAP

**What it does:**
- Reverts code to previous version
- Triggers new EAS build
- Force pushes to remote

**Command:**
```bash
./scripts/rollback.sh <tag>
# Answer 'y' when asked to build
# Answer 'y' to force push
```

**Timeline:** 30 seconds (rollback) + 5 minutes (build) = 5.5 minutes

---

### Type 3: Database Rollback

**Use when:** Database schema changed, breaking app

**Manual process:**
1. Rollback code (as above)
2. Revert database migration
3. Restore data from backup (if needed)

**Supabase rollback:**
```sql
-- Revert migration
-- Go to Supabase Dashboard → SQL Editor
-- Run rollback SQL (keep backups of migrations!)

-- Example: Revert added column
ALTER TABLE games DROP COLUMN IF EXISTS new_column;

-- Example: Restore dropped column
ALTER TABLE games ADD COLUMN old_column TEXT;
```

---

## Step-by-Step Procedures

### Procedure 1: Emergency Rollback

**Scenario:** Critical bug found, users affected NOW

**Timeline:** 5-10 minutes

```bash
# 1. Identify issue (30 seconds)
# Check logs, user reports, analytics

# 2. Find last good version (30 seconds)
git tag -l "v*" --sort=-creatordate | head -10
# or
git tag -l "backup_*" --sort=-creatordate | head -10

# 3. Execute rollback (30 seconds)
./scripts/rollback.sh --last

# 4. Build new version (confirm when prompted)
# Script will ask: "Build preview APK now? (y/N)"
# Answer: y

# 5. Wait for build (3-5 minutes)
# Check progress:
eas build:list

# 6. Download build (30 seconds)
eas build:download --latest

# 7. Quick smoke test (2 minutes)
# Install on device
adb install -r app.apk
# Test critical functionality

# 8. Distribute (30 seconds)
# Share APK with users via Slack/email/link

# 9. Notify team (immediately)
# Post in team chat
# Update status page if you have one

# 10. Create incident report
# Document what happened, why, how fixed
```

---

### Procedure 2: Planned Rollback

**Scenario:** Deployment not meeting quality bar, planned rollback

**Timeline:** 10-15 minutes

```bash
# 1. Announce rollback (1 minute)
# Notify team, stakeholders

# 2. Document reason (2 minutes)
# Create incident doc
# List issues found
# Attach screenshots/logs

# 3. Run verification first (2 minutes)
./scripts/verify-deployment.sh
# Confirms what's wrong

# 4. Identify rollback target (1 minute)
./scripts/rollback.sh
# Choose from list

# 5. Execute rollback (30 seconds)
# Follow prompts

# 6. Build new version (5 minutes)
# Confirm build when prompted

# 7. Comprehensive testing (5 minutes)
# Test all critical paths
# Verify issue resolved

# 8. Update changelog (1 minute)
# Document rollback in CHANGELOG.md

# 9. Deploy fix (when ready)
# Fix root cause
# Deploy hotfix
```

---

### Procedure 3: Partial Rollback

**Scenario:** Only specific feature needs rollback

**Timeline:** 15-20 minutes

```bash
# 1. Identify problematic commits
git log --oneline -20

# 2. Create hotfix branch
git checkout -b hotfix/rollback-feature

# 3. Revert specific commits
git revert <commit-hash>
# or revert range
git revert <start-hash>^..<end-hash>

# 4. Test locally
npm start
# Verify feature removed but app works

# 5. Deploy hotfix
./scripts/deploy-hotfix.sh "Rollback feature X due to Y"

# 6. Merge to main
git checkout main
git merge hotfix/rollback-feature
git push origin main
```

---

## Verification

### Post-Rollback Checks

After rollback, verify:

#### 1. Code State
```bash
# Check version
grep version app.json

# Check commit
git log --oneline -5

# Check tags
git tag -l | tail -5

# Verify remote sync
git status
```

#### 2. Build Quality
```bash
# Verify build
./scripts/verify-deployment.sh

# Check build status
eas build:list

# Download and test
eas build:download --latest
```

#### 3. Functionality
- [ ] App launches
- [ ] No crashes
- [ ] Critical features work
- [ ] Data loads correctly
- [ ] Backend connectivity OK
- [ ] No console errors

#### 4. Performance
- [ ] Launch time <3s
- [ ] Scrolling smooth
- [ ] Memory usage normal
- [ ] Battery drain normal

---

## Communication

### Internal Communication Template

```markdown
## 🔴 ROLLBACK IN PROGRESS

**Status:** Rolling back v1.2.0 to v1.1.5

**Reason:** Critical crash on game list screen (affects 100% of users)

**Timeline:**
- Issue detected: 2:30 PM
- Rollback started: 2:35 PM
- ETA completion: 2:45 PM

**Actions:**
1. [✓] Rollback initiated
2. [⏳] Build in progress
3. [ ] Testing
4. [ ] Distribution

**Impact:**
- Users affected: All users who updated to v1.2.0
- Workaround: Use previous APK or wait for fix
- ETA for fix: TBD (root cause analysis needed)

**Team:**
- Incident lead: [Name]
- Comms: [Name]
- Testing: [Name]

**Updates:**
- 2:40 PM: Build 50% complete
- 2:45 PM: Build complete, testing...
- 2:50 PM: Tests passed, distributing...
- 2:55 PM: Rollback complete ✅

**Post-mortem:** Scheduled for [Date/Time]
```

---

### User Communication Template

```markdown
## Temporary Issue Resolved

We identified an issue in the latest app update that caused crashes for some users.

**What we did:**
We've rolled back to the previous stable version while we fix the issue.

**What you should do:**
If you're experiencing issues:
1. Uninstall the app
2. Download the latest version from [link]
3. Reinstall

**When will this be fixed?**
We're working on a fix now. Expected release: [Date]

**Questions?**
Contact support at [email]

Thank you for your patience!
```

---

## Post-Rollback

### Incident Report Template

Create issue in GitHub/project tracker:

```markdown
## Rollback Incident Report - [DATE]

### Summary
Brief description of what happened

### Timeline
- [Time] - Issue first detected
- [Time] - Issue confirmed
- [Time] - Rollback decision made
- [Time] - Rollback executed
- [Time] - New build available
- [Time] - Issue resolved

### Root Cause
What caused the issue?

### Impact
- Users affected: [number/percentage]
- Duration: [time period]
- Severity: Critical/High/Medium/Low

### What Went Wrong
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

### What Went Right
1. [Success 1]
2. [Success 2]

### Lessons Learned
1. [Lesson 1]
2. [Lesson 2]

### Action Items
- [ ] [Action 1] - Owner: [Name] - Due: [Date]
- [ ] [Action 2] - Owner: [Name] - Due: [Date]
- [ ] Update deployment checklist
- [ ] Add new tests
- [ ] Improve monitoring

### Prevention
How to prevent this in the future?
```

---

### Root Cause Analysis (5 Whys)

Example:

**Problem:** App crashed on launch

1. **Why did it crash?** - Undefined variable accessed
2. **Why was variable undefined?** - Migration didn't run
3. **Why didn't migration run?** - Database connection failed
4. **Why did connection fail?** - Wrong Supabase URL in eas.json
5. **Why was URL wrong?** - Manual copy/paste error

**Root cause:** No validation of environment variables before build

**Fix:** Add pre-flight check for required env vars

---

## Prevention

### Pre-Deployment Safeguards

**Always do:**
1. Run pre-flight checks
2. Test on physical device
3. Check critical user paths
4. Review diff before deploying
5. Deploy during business hours
6. Have rollback plan ready
7. Monitor first 30 minutes

**Never do:**
1. Deploy on Friday afternoon
2. Deploy without testing
3. Deploy before holiday
4. Deploy during high-traffic period
5. Deploy multiple changes at once
6. Skip version control
7. Delete backup tags

---

### Rollback Prevention Checklist

Before every deployment:

```bash
# 1. Run all checks
./scripts/pre-flight-check.sh --strict

# 2. Test locally
npm start
# Manual testing

# 3. Run tests
npm test

# 4. Review changes
git diff HEAD~1

# 5. Check breaking changes
# Review code for:
# - Database schema changes
# - API changes
# - Dependency updates
# - Environment variable changes

# 6. Create backup
# Automatic with deploy scripts

# 7. Document rollback plan
# In deployment checklist

# 8. Test rollback procedure
# Verify backup tags exist
git tag -l "backup_*" | tail -5
```

---

### Monitoring

**Set up alerts for:**
- Crash rate >1%
- Error rate >5%
- Response time >3s
- Memory usage >200MB
- User complaints spike

**Where to monitor:**
- EAS build dashboard
- Supabase logs
- Play Console vitals
- User reviews
- Analytics

---

## Rollback Decision Tree

```
Issue detected
    |
    ├─ Affects >50% users? ──YES──> IMMEDIATE ROLLBACK
    |                         |
    ├─ Critical feature? ─────YES──> ROLLBACK
    |                         |
    ├─ Security issue? ───────YES──> IMMEDIATE ROLLBACK
    |                         |
    ├─ Data corruption? ──────YES──> IMMEDIATE ROLLBACK
    |                         |
    ├─ Can fix in <30 min? ──YES──> FIX FORWARD
    |                         |
    ├─ Cosmetic only? ────────YES──> FIX FORWARD
    |                         |
    └─ Default ──────────────────> ASSESS & DECIDE
                                       |
                        ├─ Team vote
                        ├─ Impact analysis
                        └─ Time to fix estimate
```

---

## Quick Reference

```bash
# Emergency rollback
./scripts/rollback.sh --last

# Interactive rollback
./scripts/rollback.sh

# Specific version
./scripts/rollback.sh v1.0.5

# View recent tags
git tag -l "backup_*" --sort=-creatordate | head -10
git tag -l "v*" --sort=-creatordate | head -10

# Verify rollback
./scripts/verify-deployment.sh
git log --oneline -5
grep version app.json

# Build after rollback
eas build --platform android --profile preview

# Check build
eas build:list
eas build:download --latest
```

---

## Support

**Issues with rollback?**
1. Check git status: `git status`
2. Check remote sync: `git fetch origin main`
3. Verify tags exist: `git tag -l`
4. Manual rollback: `git reset --hard <tag>`

**Need help?**
- Check logs: `git log --oneline -20`
- Check builds: `eas build:list`
- Review docs: DEPLOYMENT_PLAYBOOK.md

---

**Remember:** Rollback is not failure. It's a safety mechanism. Use it confidently when needed.

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Maintained by:** Development Team
