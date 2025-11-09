# GitHub Actions Build Setup

This guide explains how to build your Android AAB using GitHub Actions instead of EAS or local builds.

## Advantages

- **No File Locks**: Clean Linux environment every build
- **Free**: Unlimited builds for public repos, 2000 min/month for private
- **Automated**: Builds on every push to main/master
- **Reproducible**: Same environment every time
- **No EAS Quota**: Independent of Expo's build limits

## Prerequisites

1. Your code must be in a GitHub repository
2. You need a Google Play signing keystore (or use the existing one)

## Setup Instructions

### Step 1: Prepare Your Keystore

If you don't have a production keystore yet, create one:

```bash
keytool -genkey -v -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Save these values securely:
- Keystore password
- Key alias
- Key password

### Step 2: Encode Your Keystore to Base64

```bash
# On Windows (PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\release.keystore"))

# On Linux/Mac:
base64 -i release.keystore -o release.keystore.base64
cat release.keystore.base64
```

Copy the entire base64 string output.

### Step 3: Add GitHub Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `RELEASE_KEYSTORE_BASE64` | Base64-encoded keystore file | `MIIJRAIBAzCCCP...` |
| `RELEASE_STORE_PASSWORD` | Keystore password | `your-keystore-password` |
| `RELEASE_KEY_ALIAS` | Key alias | `my-key-alias` |
| `RELEASE_KEY_PASSWORD` | Key password | `your-key-password` |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase URL (if using) | `https://xxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (if using) | `eyJhbGciOi...` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (if using) | `AIzaSy...` |

### Step 4: Push Your Code to GitHub

```bash
git add .
git commit -m "Add GitHub Actions build workflow"
git push origin main
```

### Step 5: Trigger a Build

**Option A: Automatic (on push to main)**
- Every push to `main` or `master` triggers a build automatically

**Option B: Manual trigger**
1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Build Android AAB** workflow
4. Click **Run workflow** → **Run workflow**

### Step 6: Download the AAB

1. Go to the **Actions** tab
2. Click on the completed workflow run
3. Scroll down to **Artifacts**
4. Download `app-release-{version}.aab`

## Workflow Configuration

The workflow file is located at: `.github/workflows/build-android.yml`

### Build Triggers

- **Push to main/master**: Automatic build
- **Pull requests**: Builds on PR to validate changes
- **Manual**: Use the "Run workflow" button

### Build Process

1. Checkout code
2. Setup Node.js 18 and JDK 17
3. Install npm dependencies
4. Create `.env` file from secrets
5. Decode release keystore
6. Build AAB with `./gradlew bundleRelease`
7. Upload AAB and mapping files as artifacts

### Artifacts Retention

- **AAB file**: 30 days
- **Mapping file**: 90 days (for crash report symbolication)

## Using the AAB for Google Play

1. Download the AAB from GitHub Actions artifacts
2. Go to [Google Play Console](https://play.google.com/console)
3. Select your app → **Release** → **Production**
4. Click **Create new release**
5. Upload the AAB file
6. Fill in release notes
7. Review and roll out

## Troubleshooting

### Build fails with "Kotlin compilation error"

This is usually due to outdated dependencies. The workflow uses `npm ci` which installs exact versions from `package-lock.json`. To fix:

1. Update your dependencies locally
2. Commit the updated `package-lock.json`
3. Push to trigger a new build

### Build fails with "Keystore not found"

Make sure:
- `RELEASE_KEYSTORE_BASE64` secret is set correctly
- The base64 string is complete (no line breaks)
- You copied the entire output

### Environment variables not available in app

Make sure you've added all required secrets:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

The workflow creates a `.env` file from these secrets before building.

## Updating the Version

Before building a new release:

1. Update version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.12",
       "android": {
         "versionCode": 13
       }
     }
   }
   ```

2. Update version in `android/app/build.gradle`:
   ```gradle
   defaultConfig {
       versionCode 13
       versionName "1.0.12"
   }
   ```

3. Commit and push - the workflow will automatically include the version in the artifact name.

## Cost Comparison

| Method | Cost | Build Time | File Locks | Quota |
|--------|------|------------|------------|-------|
| **GitHub Actions** | Free (public) / $0.008/min (private) | 6-8 min | None | 2000 min/month (private) |
| **EAS Free** | Free | 10-15 min | N/A | 30 builds/month |
| **EAS Pro** | $29/month | 10-15 min | N/A | Unlimited |
| **Local Build** | Free | 5-10 min | Windows locks | Unlimited |

## Next Steps

- **Automate version bumping**: Create a script to auto-increment version numbers
- **Add automated testing**: Run tests before building
- **Deploy to Play Store**: Use GitHub Actions to auto-deploy to internal/beta tracks
- **Notify on completion**: Add Slack/Discord notifications when builds finish

## Support

If you encounter issues:
1. Check the workflow logs in GitHub Actions
2. Verify all secrets are set correctly
3. Ensure your keystore is valid
4. Test the build locally first with `./gradlew bundleRelease`
