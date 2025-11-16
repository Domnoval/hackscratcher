# Deployment Scripts

Automated deployment scripts for Scratch Oracle app.

---

## Quick Start

```bash
# Make scripts executable (first time only)
chmod +x scripts/*.sh

# Run pre-flight check
./scripts/pre-flight-check.sh

# Deploy hotfix
./scripts/deploy-hotfix.sh "Fix description"

# Deploy feature
./scripts/deploy-feature.sh "Feature description"

# Deploy to production
./scripts/deploy-native.sh --production
```

---

## Scripts Overview

### 1. `deploy-hotfix.sh`

**Purpose:** Emergency bug fix deployment
**Target Time:** 5 minutes
**When to use:** Critical bugs, crashes, security issues

**Usage:**
```bash
./scripts/deploy-hotfix.sh "Fix crash on app launch"
```

**What it does:**
- ✅ Creates backup tag
- ✅ Increments patch version (1.0.1 → 1.0.2)
- ✅ Builds preview APK
- ✅ Commits and pushes changes
- ✅ Creates release tag

**Output:**
- New version in app.json
- Git tag: `v1.0.2-hotfix`
- Backup tag: `backup_before_hotfix_TIMESTAMP`
- EAS build ID

---

### 2. `deploy-feature.sh`

**Purpose:** New feature deployment with full testing
**Target Time:** 12 minutes
**When to use:** New features, enhancements, non-critical updates

**Usage:**
```bash
./scripts/deploy-feature.sh "Add barcode scanner"

# Skip tests (use cautiously)
RUN_TESTS=false ./scripts/deploy-feature.sh "Feature description"
```

**What it does:**
- ✅ Pulls latest changes
- ✅ Runs test suite
- ✅ Runs TypeScript checks
- ✅ Creates backup tag
- ✅ Increments minor version (1.0.1 → 1.1.0)
- ✅ Updates CHANGELOG.md
- ✅ Builds preview APK
- ✅ Commits and pushes
- ✅ Creates release tag

**Output:**
- New version in app.json
- Updated CHANGELOG.md
- Git tag: `v1.1.0`
- Backup tag: `backup_before_feature_TIMESTAMP`
- EAS build ID

---

### 3. `deploy-native.sh`

**Purpose:** Build production APK/AAB for Play Store
**Target Time:** 15-20 minutes
**When to use:** Ready for production release

**Usage:**
```bash
# Preview build (APK)
./scripts/deploy-native.sh

# Production build (AAB)
./scripts/deploy-native.sh --production

# Build and submit to Play Store
./scripts/deploy-native.sh --production --submit

# Wait for build to complete
./scripts/deploy-native.sh --production --wait

# All together
./scripts/deploy-native.sh --production --submit --wait
```

**Options:**
- `--production` - Build AAB for Play Store
- `--submit` - Auto-submit to Play Store
- `--wait` - Wait for build completion

**What it does:**
- ✅ Verifies production requirements
- ✅ Builds APK or AAB
- ✅ Optionally submits to Play Store
- ✅ Creates build tag
- ✅ Downloads artifact (if --wait)

**Output:**
- EAS build ID
- Build artifact (APK or AAB)
- Git tag: `build_production_VERSIONCODE_TIMESTAMP`

---

### 4. `rollback.sh`

**Purpose:** Instant rollback to previous version
**Target Time:** 2 minutes
**When to use:** Deployment went wrong, critical bugs found

**Usage:**
```bash
# Rollback to last backup
./scripts/rollback.sh --last

# Interactive rollback (shows list of tags)
./scripts/rollback.sh

# Rollback to specific version
./scripts/rollback.sh v1.0.5

# Rollback to specific backup
./scripts/rollback.sh backup_before_hotfix_20250106_143022
```

**What it does:**
- ✅ Creates safety backup of current state
- ✅ Resets code to target version
- ✅ Optionally triggers new build
- ✅ Force pushes to remote (with confirmation)
- ✅ Creates rollback marker tag

**Output:**
- Code reset to target version
- Safety backup tag: `safety_backup_before_rollback_TIMESTAMP`
- Rollback marker tag: `rollback_to_TAG_TIMESTAMP`
- Optional: new build ID

**Important:** Use with caution, force push required

---

### 5. `pre-flight-check.sh`

**Purpose:** Verify everything is ready before deployment
**Target Time:** 30 seconds
**When to use:** Before every deployment

**Usage:**
```bash
# Standard check
./scripts/pre-flight-check.sh

# Strict mode (all checks must pass)
./scripts/pre-flight-check.sh --strict
```

**What it checks:**
1. **Git Repository**
   - Repository initialized
   - Current branch
   - Uncommitted changes
   - Remote configured
   - Sync with remote

2. **Dependencies & Tools**
   - Node.js installed
   - npm installed
   - node_modules exists
   - EAS CLI installed
   - Logged into EAS

3. **Project Configuration**
   - app.json exists and valid
   - package.json exists
   - eas.json exists
   - Version numbers
   - Package name
   - EAS project ID

4. **Environment Variables**
   - .env file
   - Supabase URL
   - Supabase key
   - Google Maps API key

5. **Build Assets**
   - Icon images
   - Splash screen
   - Adaptive icon
   - Play Store service account

6. **Code Quality**
   - TypeScript configuration
   - TypeScript checks
   - Test script configured
   - Tests passing (if --strict)

7. **Deployment Scripts**
   - All scripts exist
   - Scripts are executable

8. **System Resources**
   - Disk space available
   - Memory available

9. **Connectivity**
   - Internet connection
   - Can reach expo.dev
   - Can reach Supabase

10. **Security**
    - .gitignore exists
    - Secrets not committed

**Output:**
- Detailed check results
- Pass/warning/fail counts
- Overall status
- Next steps

**Exit codes:**
- `0` - All checks passed
- `1` - Issues found (in strict mode or critical issues)

---

### 6. `verify-deployment.sh`

**Purpose:** Verify deployment was successful
**Target Time:** 30 seconds
**When to use:** After deployment to ensure everything worked

**Usage:**
```bash
# Verify latest deployment
./scripts/verify-deployment.sh

# Verify specific build
./scripts/verify-deployment.sh <build-id>
```

**What it checks:**
1. **Build Status**
   - Build completed
   - Build status (finished/errored/canceled)
   - Platform and profile

2. **Build Artifacts**
   - Artifact available
   - Artifact size
   - Download URL

3. **Version Information**
   - Version matches git
   - Version code matches
   - Version tag exists

4. **Git Tags**
   - Version tag created
   - Backup tag exists
   - Tags point to correct commits

5. **Remote Sync**
   - Code pushed to remote
   - Branch synchronized

6. **Build Logs**
   - No errors
   - Minimal warnings

7. **Backend Connectivity**
   - Supabase reachable
   - Backend responding

8. **Play Store Status** (if production)
   - Submission status
   - Submission ID

9. **Documentation**
   - CHANGELOG updated
   - Version documented

**Output:**
- Check results
- Pass/fail counts
- Build information
- Next steps

**Exit codes:**
- `0` - Verification successful
- `1` - Verification failed

---

## Script Architecture

All scripts follow this structure:

```bash
#!/bin/bash

# 1. Configuration
set -e  # Exit on error
set -o pipefail  # Catch pipe errors

# 2. Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 3. Functions
log_info() { ... }
log_success() { ... }
log_warning() { ... }
log_error() { ... }

# 4. Pre-flight checks
# - Verify prerequisites
# - Check required tools
# - Validate inputs

# 5. Main execution
# - Step-by-step process
# - Error handling
# - Progress reporting

# 6. Summary
# - Display results
# - Show next steps
# - Provide help
```

---

## Error Handling

All scripts include:

- **Exit on error:** `set -e` - Script stops if any command fails
- **Pipe errors:** `set -o pipefail` - Catch errors in pipes
- **Input validation:** Check arguments and prerequisites
- **Rollback on failure:** Undo changes if something goes wrong
- **Helpful error messages:** Clear instructions on what went wrong
- **Recovery instructions:** How to fix the issue

---

## Safety Features

### Automatic Backups

Every deployment creates backup tags:
- `backup_before_hotfix_TIMESTAMP`
- `backup_before_feature_TIMESTAMP`
- `safety_backup_before_rollback_TIMESTAMP`

### Confirmations

Scripts ask for confirmation before:
- Force pushing to remote
- Rolling back code
- Submitting to Play Store
- Deploying from non-main branch

### Validation

Scripts validate:
- Git repository state
- EAS authentication
- Required files exist
- Version numbers
- Environment variables

---

## Requirements

### System Requirements

- **Bash:** 4.0+
- **Git:** 2.0+
- **Node.js:** 16+
- **npm:** 8+

### Tools Required

- **EAS CLI:** `npm install -g eas-cli`
- **Expo CLI:** `npm install -g expo-cli` (optional)

### Permissions

Scripts need:
- Git push access to repository
- EAS account with project access
- Write access to local files

---

## Configuration

### Environment Variables

Scripts use these environment variables:

**From eas.json:**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

**Optional:**
- `RUN_TESTS` - Set to `false` to skip tests in deploy-feature.sh

### File Locations

Scripts expect this structure:
```
scratch-oracle-app/
├── app.json                    # App configuration
├── eas.json                    # EAS build config
├── package.json                # Dependencies
├── CHANGELOG.md                # Version history
├── scripts/
│   ├── deploy-hotfix.sh
│   ├── deploy-feature.sh
│   ├── deploy-native.sh
│   ├── rollback.sh
│   ├── pre-flight-check.sh
│   └── verify-deployment.sh
└── google-play-service-account.json  # For submissions
```

---

## Customization

### Modifying Scripts

To customize for your project:

1. **Update package name:**
   - Search for `com.scratchoracle.app`
   - Replace with your package name

2. **Change version scheme:**
   - Modify version increment logic
   - Update in `deploy-hotfix.sh` and `deploy-feature.sh`

3. **Add custom checks:**
   - Edit `pre-flight-check.sh`
   - Add your validation logic

4. **Change build profiles:**
   - Modify `--profile` flags
   - Update eas.json accordingly

### Adding New Scripts

Template for new scripts:

```bash
#!/bin/bash

set -e
set -o pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Main
log_info "Starting..."

# Your logic here

log_success "Complete!"
```

---

## Troubleshooting

### Scripts Won't Run

```bash
# Make executable
chmod +x scripts/*.sh

# Check bash version
bash --version

# Run with bash explicitly
bash scripts/deploy-hotfix.sh "Description"
```

### Permission Denied

```bash
# Fix permissions
chmod +x scripts/*.sh

# Or run with sudo (not recommended)
sudo ./scripts/deploy-hotfix.sh
```

### Command Not Found

```bash
# Install EAS CLI
npm install -g eas-cli

# Verify installation
which eas
eas --version
```

### Script Errors

```bash
# Run in verbose mode
bash -x scripts/deploy-hotfix.sh "Test"

# Check syntax
bash -n scripts/deploy-hotfix.sh
```

---

## Best Practices

### Before Running

1. Always run pre-flight check first
2. Ensure on correct branch
3. Pull latest changes
4. Commit any uncommitted work
5. Test locally

### During Deployment

1. Monitor script output
2. Don't interrupt scripts mid-execution
3. Wait for confirmations
4. Read warnings carefully

### After Deployment

1. Run verification script
2. Test on device
3. Monitor for errors
4. Update team

---

## Support

**For script issues:**
1. Check [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
2. Run pre-flight check: `./scripts/pre-flight-check.sh --strict`
3. Check script with: `bash -n scripts/script-name.sh`
4. Run in verbose mode: `bash -x scripts/script-name.sh`

**For deployment issues:**
1. Check [DEPLOYMENT_PLAYBOOK.md](../DEPLOYMENT_PLAYBOOK.md)
2. Check [ROLLBACK_PROCEDURES.md](../ROLLBACK_PROCEDURES.md)
3. View EAS logs: `eas build:view <id> --logs`

---

## Contributing

To improve scripts:

1. Test thoroughly
2. Add error handling
3. Include helpful messages
4. Update documentation
5. Follow existing style

---

**Script Version:** 1.0
**Last Updated:** January 2025
