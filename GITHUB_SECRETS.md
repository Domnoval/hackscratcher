# Required GitHub Secrets

This document lists all GitHub Secrets required for the CI/CD workflows to function properly.

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Enter the name and value
5. Click **"Add secret"**

---

## Essential Secrets (Required)

### 1. EXPO_TOKEN
**Required for:** All workflows
**Description:** Expo authentication token for EAS builds and OTA updates

**How to get it:**
```bash
npx eas login
npx expo whoami
```

The token is stored in your local Expo configuration after login.

**Alternative method:**
```bash
npx eas build:configure
```

Then check: `~/.expo/state.json` for the token.

---

### 2. EXPO_PUBLIC_SUPABASE_URL
**Required for:** ci-cd.yml, pr-preview.yml
**Description:** Your Supabase project URL

**How to get it:**
1. Go to https://supabase.com
2. Open your project
3. Click Settings → API
4. Copy "Project URL"

**Example value:**
```
https://wqealxmdjpwjbhfrnplk.supabase.co
```

---

### 3. EXPO_PUBLIC_SUPABASE_ANON_KEY
**Required for:** ci-cd.yml, pr-preview.yml
**Description:** Your Supabase anonymous/public API key

**How to get it:**
1. Go to https://supabase.com
2. Open your project
3. Click Settings → API
4. Copy "anon/public" key

**Example value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZWFseG1kanB3amJoZnJucGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwNTI3NzIsImV4cCI6MjA0NTYyODc3Mn0.oVhgk9LUjCPIB0UvxpjhP3ihSHx2jH6WqzaVGvmNlT8
```

**Note:** This is the public key, safe to use in builds.

---

### 4. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
**Required for:** ci-cd.yml, pr-preview.yml
**Description:** Google Maps API key for location features

**How to get it:**
1. Go to https://console.cloud.google.com
2. Create or select a project
3. Enable "Maps SDK for Android"
4. Create API credentials
5. Copy the API key

**Example value:**
```
AIzaSyA1uBiGC7mQxIlNe_XOPQrwdYHYoy-znXc
```

**Important:** Restrict this key to your app's package name in Google Cloud Console.

---

## Optional Secrets (Enhance Functionality)

### 5. CODECOV_TOKEN
**Required for:** ci-cd.yml (optional)
**Description:** Token for uploading test coverage to Codecov

**How to get it:**
1. Go to https://codecov.io
2. Sign up with GitHub
3. Add your repository
4. Copy the upload token

**If not added:** Coverage still works, just won't upload to Codecov. Remove the Codecov step from ci-cd.yml if not needed.

---

### 6. GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
**Required for:** native-build.yml (auto-submit only)
**Description:** JSON key file for Google Play Console API access

**How to get it:**
1. Go to Google Play Console
2. Setup → API access
3. Create or link a Google Cloud project
4. Create a new service account
5. Grant "Release Manager" permissions
6. Download the JSON key file
7. Copy the entire contents of the JSON file

**Example value structure:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**If not added:** Manual native builds still work. You just can't use the auto-submit feature.

---

## Future Secrets (For Additional Features)

### 7. SLACK_WEBHOOK_URL
**Required for:** Slack notifications (if implemented)
**Description:** Webhook URL for sending build notifications to Slack

**How to get it:**
1. Go to https://api.slack.com/apps
2. Create a new app
3. Enable Incoming Webhooks
4. Create a webhook for your channel
5. Copy the webhook URL

---

### 8. DISCORD_WEBHOOK
**Required for:** Discord notifications (if implemented)
**Description:** Webhook URL for sending build notifications to Discord

**How to get it:**
1. Open Discord server settings
2. Integrations → Webhooks
3. New Webhook
4. Choose channel
5. Copy webhook URL

---

## Secrets Summary Table

| Secret Name | Required | Used By | Purpose |
|-------------|----------|---------|---------|
| EXPO_TOKEN | ✅ Yes | All workflows | EAS builds & OTA updates |
| EXPO_PUBLIC_SUPABASE_URL | ✅ Yes | ci-cd, pr-preview | Database connection |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | ✅ Yes | ci-cd, pr-preview | Database authentication |
| EXPO_PUBLIC_GOOGLE_MAPS_API_KEY | ✅ Yes | ci-cd, pr-preview | Maps functionality |
| CODECOV_TOKEN | ⚙️ Optional | ci-cd | Coverage reporting |
| GOOGLE_PLAY_SERVICE_ACCOUNT_JSON | ⚙️ Optional | native-build | Auto Play Store submit |
| SLACK_WEBHOOK_URL | ⚠️ Future | All workflows | Slack notifications |
| DISCORD_WEBHOOK | ⚠️ Future | All workflows | Discord notifications |

---

## Security Best Practices

### DO:
- ✅ Use GitHub Secrets for all sensitive data
- ✅ Rotate tokens regularly (every 90 days)
- ✅ Use service accounts for automation
- ✅ Restrict API keys to specific apps/domains
- ✅ Enable 2FA on all accounts
- ✅ Review secret access logs

### DON'T:
- ❌ Never commit secrets to code
- ❌ Never log secrets in workflows
- ❌ Never share secrets in screenshots
- ❌ Never use personal API keys for CI
- ❌ Never store secrets in environment files (.env)
- ❌ Never hardcode secrets in app code

---

## Testing Secrets

### Test EXPO_TOKEN
```bash
# Set token locally
export EXPO_TOKEN="your-token-here"

# Test authentication
npx expo whoami

# Should show your Expo username
```

### Test Supabase Secrets
```bash
# Test connection
curl "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"

# Should return Supabase API info
```

### Test Google Maps Key
```bash
# Test key validity
curl "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"

# Should return JavaScript
```

---

## Troubleshooting

### "Secret not found" error
- Check spelling is exactly correct (case-sensitive)
- Verify secret is added in repository settings
- Check you're in the correct repository
- Re-add the secret if unsure

### "Invalid token" error
- EXPO_TOKEN may have expired
- Re-login: `npx eas login`
- Get fresh token
- Update GitHub secret

### "Permission denied" error
- Service account may lack permissions
- Check Google Play Console permissions
- Service account needs "Release Manager" role
- Re-download JSON and update secret

### Secrets not working in forks
- GitHub Secrets are not available in forked repos
- This is a security feature
- Contributors need to use their own secrets
- Or maintainer must review PRs from trusted sources

---

## Maintenance

### Monthly Tasks
- [ ] Review secret usage
- [ ] Check for expired tokens
- [ ] Audit access logs
- [ ] Update service account keys

### Quarterly Tasks
- [ ] Rotate EXPO_TOKEN
- [ ] Rotate API keys
- [ ] Review permissions
- [ ] Update documentation

### Yearly Tasks
- [ ] Full security audit
- [ ] Update all secrets
- [ ] Review automation access
- [ ] Check compliance requirements

---

## Quick Setup Checklist

```
Step 1: Essential Secrets (Required for basic functionality)
[ ] Add EXPO_TOKEN
[ ] Add EXPO_PUBLIC_SUPABASE_URL
[ ] Add EXPO_PUBLIC_SUPABASE_ANON_KEY
[ ] Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

Step 2: Test Workflows
[ ] Push a commit to trigger ci-cd.yml
[ ] Create a PR to trigger pr-preview.yml
[ ] Check Actions tab for results

Step 3: Optional Features
[ ] Add CODECOV_TOKEN (for coverage tracking)
[ ] Add GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (for auto-submit)

Step 4: Advanced Features (Future)
[ ] Add SLACK_WEBHOOK_URL (for notifications)
[ ] Add DISCORD_WEBHOOK (for notifications)
```

---

## Need Help?

**Documentation:**
- [GitHub Secrets Docs](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [EAS Environment Variables](https://docs.expo.dev/build-reference/variables/)
- [Supabase API Docs](https://supabase.com/docs/guides/api)

**Support:**
- Check CI_CD_SETUP.md for workflow documentation
- Review workflow logs in GitHub Actions tab
- Check EAS build logs for detailed errors

---

**Last Updated:** 2025-11-06
**Maintained by:** CI/CD Automation Agent
