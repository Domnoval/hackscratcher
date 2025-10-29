# 🚀 SCRATCH ORACLE - LAUNCH CHECKLIST

**Current Status:** Build in progress → Ready to upload fixed version!

---

## ✅ COMPLETED TODAY:

### 🏗️ Build & Infrastructure:
- [x] Production AAB built (v1 - crashed)
- [x] Diagnosed crash (missing Supabase env vars)
- [x] Added secrets to EAS (Supabase + Google Maps)
- [x] Rebuilt with fixes (v2 - in progress)
- [x] GitHub Actions CI/CD configured
- [x] All code pushed to GitHub

### 📄 Legal & Compliance:
- [x] Privacy Policy written & hosted
- [x] Terms of Service written & hosted
- [x] Account deletion page created
- [x] All documents live at: https://domnoval.github.io/hackscratcher/

### 🎮 Play Store Setup:
- [x] App created in Play Console
- [x] Store listing completed
- [x] Content rating submitted
- [x] Data safety questionnaire filled
- [x] Target audience set (18+)
- [x] App category selected (Tools)
- [x] Ads declaration (No ads)
- [x] Closed Testing - Alpha created

### 🔒 Security:
- [x] Certificate pinning implemented
- [x] Age verification enforced
- [x] Input validation (Zod schemas)
- [x] RLS policies configured
- [x] Secure authentication

---

## 📋 NEXT STEPS (After Build Finishes):

### 1. Download Fixed AAB (2 min)
```bash
# Build will be available at:
https://expo.dev/accounts/mm444/projects/scratch-oracle-app/builds/6853d295-0a97-4882-8e75-cdca957f7347

# Click download button or use CLI:
npx eas build:download --platform android --latest
```

### 2. Upload to Play Console (5 min)
- Go to: https://play.google.com/console/u/0/developers/[YOUR_ID]/app/[APP_ID]/tracks/closed-testing
- Click "Closed testing" → "alpha" → "Create new release"
- Upload the new AAB
- Keep same release notes (or update version to 1.0.1)
- Click "Review release" → "Start rollout"

### 3. Test the App (10 min)
**Critical Tests:**
- [ ] App opens without crashing
- [ ] Age verification shows
- [ ] Can create account or login
- [ ] Games load from Supabase
- [ ] Recommendations appear
- [ ] State selector works (MN/FL toggle)
- [ ] Responsible gaming helpline visible
- [ ] About screen shows legal links

**Test Account:**
- Email: admin@scratchoracle.com
- Password: Password137!
- (Create this in Supabase after app works!)

### 4. Add Testers (5 min)
- Go to: Closed testing → Testers tab
- Create email list: "Beta Testers"
- Add emails:
  - Your email
  - yourname+test1@gmail.com (Gmail + trick)
  - Friends/family
- Copy opt-in link
- Share with testers

### 5. Monitor & Iterate (Ongoing)
- Check for crashes in Play Console
- Gather feedback from testers
- Fix critical bugs
- Prepare for Production release

---

## 🐛 IF THE APP STILL CRASHES:

### Check EAS Build Logs:
```bash
npx eas build:view 6853d295-0a97-4882-8e75-cdca957f7347
```

### Common Issues:
1. **Supabase connection fails**
   - Verify secrets were included in build
   - Check if Supabase URL is correct
   - Test connection from app logs

2. **Certificate pinning too strict**
   - May need to disable for testing
   - Or add proper certificates

3. **Age verification crashes**
   - Check AsyncStorage permissions
   - Verify storage is working

### Debug Steps:
1. Check Play Console crash reports
2. Download and review EAS build logs
3. Test in development mode first
4. Add console.log statements
5. Rebuild with fixes

---

## 🎯 SUCCESS CRITERIA:

**Before moving to Production:**
- [ ] App opens successfully
- [ ] No crashes on startup
- [ ] At least 3 testers have used it
- [ ] All critical features work
- [ ] No major bugs reported
- [ ] 4.0+ star feedback from testers

**Ready for Production when:**
- [ ] 10+ successful test sessions
- [ ] Zero critical bugs
- [ ] All feedback addressed
- [ ] Screenshots updated (if using real app screens)
- [ ] Marketing materials ready

---

## 📊 KEY LINKS:

**Development:**
- GitHub: https://github.com/Domnoval/hackscratcher
- EAS Builds: https://expo.dev/accounts/mm444/projects/scratch-oracle-app/builds
- Supabase: https://wqealxmdjpwjbhfrnplk.supabase.co

**Play Store:**
- Console: https://play.google.com/console
- Store URL: https://play.google.com/store/apps/details?id=com.scratchoracle.app
- Alpha Testing: (get link after adding testers)

**Legal:**
- Privacy: https://domnoval.github.io/hackscratcher/privacy.html
- Terms: https://domnoval.github.io/hackscratcher/terms.html
- Delete Account: https://domnoval.github.io/hackscratcher/delete-account.html

---

## 🔄 ITERATION CYCLE:

**Daily (During Testing):**
1. Check crash reports
2. Read tester feedback
3. Fix critical bugs
4. Push fixes to GitHub
5. GitHub Actions auto-builds
6. Upload to Play Console
7. Notify testers

**Weekly:**
1. Review metrics (crashes, engagement)
2. Prioritize features/fixes
3. Update roadmap
4. Communicate with testers

---

## 📈 FUTURE FEATURES (POST-LAUNCH):

**Week 4:**
- [ ] Vegas UI theme integration
- [ ] Scanner feature (barcode scanning)
- [ ] Improve animations/polish

**Week 5-6:**
- [ ] Hot Spots Map (legal review first!)
- [ ] Community Win Stories (moderation plan)
- [ ] AI predictions enabled (after data collection)

**Week 7+:**
- [ ] Multi-state expansion (more states!)
- [ ] Premium features (subscription)
- [ ] Advanced analytics

---

## 🎉 YOU'RE ALMOST THERE!

**Status:** Waiting for build to complete
**ETA:** ~5 more minutes
**Next:** Download AAB → Upload → Test → ADD TESTERS → LAUNCH! 🚀

---

**REMEMBER:**
- First version doesn't have to be perfect
- Get it in testers' hands
- Iterate based on feedback
- Launch fast, improve faster!

**LET'S GOOOOO!** 💪🔥
