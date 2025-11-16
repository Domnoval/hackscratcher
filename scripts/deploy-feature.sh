#!/bin/bash

################################################################################
# SCRATCH ORACLE - FEATURE DEPLOYMENT SCRIPT
#
# Purpose: Deploy new features with full testing (TARGET: 12 minutes)
# Use when: New features, enhancements, non-critical updates
#
# Usage: ./scripts/deploy-feature.sh "Add ticket scanner"
################################################################################

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start timer
START_TIME=$(date +%s)

################################################################################
# CONFIGURATION
################################################################################

FEATURE_DESCRIPTION="${1:-New feature deployment}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_TAG="backup_before_feature_${TIMESTAMP}"
RUN_TESTS="${RUN_TESTS:-true}"  # Set to false to skip tests

################################################################################
# FUNCTIONS
################################################################################

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

show_elapsed_time() {
    local END_TIME=$(date +%s)
    local ELAPSED=$((END_TIME - START_TIME))
    local MINUTES=$((ELAPSED / 60))
    local SECONDS=$((ELAPSED % 60))
    echo -e "${GREEN}Time elapsed: ${MINUTES}m ${SECONDS}s${NC}"
}

################################################################################
# PRE-FLIGHT CHECKS
################################################################################

log_info "========================================="
log_info "FEATURE DEPLOYMENT STARTING"
log_info "========================================="
log_info "Description: ${FEATURE_DESCRIPTION}"
log_info "Current branch: ${CURRENT_BRANCH}"
log_info ""

# Check if git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository!"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    log_error "You have uncommitted changes! Commit or stash them first."
    git status -s
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    log_error "EAS CLI not found! Install with: npm install -g eas-cli"
    exit 1
fi

# Check if logged into EAS
if ! eas whoami &> /dev/null; then
    log_error "Not logged into EAS! Run: eas login"
    exit 1
fi

# Check if on main/master branch
if [[ "${CURRENT_BRANCH}" != "main" && "${CURRENT_BRANCH}" != "master" ]]; then
    log_warning "You're not on main/master branch!"
    read -p "Continue deployment from ${CURRENT_BRANCH}? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled"
        exit 1
    fi
fi

log_success "Pre-flight checks passed"
echo ""

################################################################################
# PULL LATEST CHANGES
################################################################################

log_info "Step 1/10: Pulling latest changes..."

if git pull origin "${CURRENT_BRANCH}"; then
    log_success "Repository up to date"
else
    log_error "Failed to pull latest changes"
    exit 1
fi

echo ""

################################################################################
# RUN TESTS
################################################################################

if [[ "${RUN_TESTS}" == "true" ]]; then
    log_info "Step 2/10: Running test suite..."

    # Check if package.json has test script
    if grep -q '"test":' package.json; then
        if npm test; then
            log_success "All tests passed"
        else
            log_error "Tests failed! Fix issues before deploying."
            exit 1
        fi
    else
        log_warning "No test script found in package.json, skipping tests"
    fi
else
    log_warning "Step 2/10: Skipping tests (RUN_TESTS=false)"
fi

echo ""

################################################################################
# LINT CHECK
################################################################################

log_info "Step 3/10: Running TypeScript checks..."

if npx tsc --noEmit 2>&1 | head -20; then
    log_success "TypeScript checks passed"
else
    log_warning "TypeScript errors detected (non-blocking)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled"
        exit 1
    fi
fi

echo ""

################################################################################
# BACKUP CURRENT STATE
################################################################################

log_info "Step 4/10: Creating backup tag..."
git tag -a "${BACKUP_TAG}" -m "Backup before feature: ${FEATURE_DESCRIPTION}"
git push origin "${BACKUP_TAG}" 2>&1 | grep -v "warning:" || true
log_success "Backup tag created: ${BACKUP_TAG}"
echo ""

################################################################################
# INCREMENT VERSION
################################################################################

log_info "Step 5/10: Incrementing minor version..."

# Get current version from app.json
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
log_info "Current version: ${CURRENT_VERSION}"

# Increment minor version (e.g., 1.0.1 -> 1.1.0)
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]:-0}"
NEW_MINOR=$((MINOR + 1))
NEW_VERSION="${MAJOR}.${NEW_MINOR}.0"

log_info "New version: ${NEW_VERSION}"

# Update app.json
sed -i.bak "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" app.json

# Increment Android versionCode
CURRENT_VERSION_CODE=$(grep -o '"versionCode": [0-9]*' app.json | grep -o '[0-9]*')
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))
sed -i.bak "s/\"versionCode\": ${CURRENT_VERSION_CODE}/\"versionCode\": ${NEW_VERSION_CODE}/" app.json

# Clean up backup file
rm -f app.json.bak

log_success "Version updated: ${CURRENT_VERSION} -> ${NEW_VERSION}"
log_success "Android versionCode: ${CURRENT_VERSION_CODE} -> ${NEW_VERSION_CODE}"
echo ""

################################################################################
# UPDATE CHANGELOG
################################################################################

log_info "Step 6/10: Updating changelog..."

CHANGELOG_FILE="CHANGELOG.md"

if [[ ! -f "${CHANGELOG_FILE}" ]]; then
    log_warning "CHANGELOG.md not found, creating it..."
    cat > "${CHANGELOG_FILE}" << EOF
# Changelog

All notable changes to Scratch Oracle will be documented in this file.

## [${NEW_VERSION}] - $(date +"%Y-%m-%d")

### Added
- ${FEATURE_DESCRIPTION}

EOF
else
    # Prepend new version to existing changelog
    TEMP_FILE=$(mktemp)
    cat > "${TEMP_FILE}" << EOF
# Changelog

All notable changes to Scratch Oracle will be documented in this file.

## [${NEW_VERSION}] - $(date +"%Y-%m-%d")

### Added
- ${FEATURE_DESCRIPTION}

EOF
    tail -n +3 "${CHANGELOG_FILE}" >> "${TEMP_FILE}"
    mv "${TEMP_FILE}" "${CHANGELOG_FILE}"
fi

log_success "Changelog updated"
echo ""

################################################################################
# BUILD PREVIEW APK
################################################################################

log_info "Step 7/10: Building preview APK (this may take 3-5 minutes)..."
log_warning "Building on EAS servers..."

if eas build --platform android --profile preview --non-interactive --no-wait; then
    log_success "Build submitted to EAS!"
    log_info "Build will continue in background"
else
    log_error "Build submission failed!"
    log_warning "Rolling back changes..."
    git checkout app.json "${CHANGELOG_FILE}"
    exit 1
fi

echo ""

################################################################################
# COMMIT CHANGES
################################################################################

log_info "Step 8/10: Committing changes..."

git add app.json "${CHANGELOG_FILE}"
git commit -m "Feature v${NEW_VERSION}: ${FEATURE_DESCRIPTION}

- Minor version bump: ${CURRENT_VERSION} -> ${NEW_VERSION}
- versionCode: ${CURRENT_VERSION_CODE} -> ${NEW_VERSION_CODE}
- Updated changelog
- Deployed via deploy-feature.sh

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

log_success "Changes committed"
echo ""

################################################################################
# PUSH TO REMOTE
################################################################################

log_info "Step 9/10: Pushing to remote..."

if git push origin "${CURRENT_BRANCH}"; then
    log_success "Pushed to origin/${CURRENT_BRANCH}"
else
    log_error "Push failed! You may need to pull first"
    exit 1
fi

echo ""

################################################################################
# CREATE RELEASE TAG
################################################################################

log_info "Step 10/10: Creating release tag..."

RELEASE_TAG="v${NEW_VERSION}"
git tag -a "${RELEASE_TAG}" -m "Release ${NEW_VERSION}: ${FEATURE_DESCRIPTION}"
git push origin "${RELEASE_TAG}"

log_success "Release tag created: ${RELEASE_TAG}"
echo ""

################################################################################
# SUMMARY
################################################################################

log_success "========================================="
log_success "FEATURE DEPLOYMENT COMPLETE!"
log_success "========================================="
echo ""
echo "Version: ${NEW_VERSION}"
echo "Tag: ${RELEASE_TAG}"
echo "Backup tag: ${BACKUP_TAG}"
echo ""
echo "Build Status:"
echo "  - Check build: eas build:list"
echo "  - Download APK: eas build:download --latest"
echo "  - View logs: eas build:view"
echo ""
echo "Next Steps:"
echo "  1. Wait for build to complete (~3-5 min)"
echo "  2. Download and test APK thoroughly"
echo "  3. Test all new features"
echo "  4. Share with beta testers"
echo "  5. Collect feedback"
echo "  6. If issues found -> fix and deploy hotfix"
echo "  7. If all good -> consider production deployment"
echo ""
echo "To submit to Play Store:"
echo "  ./scripts/deploy-native.sh --production --submit"
echo ""
echo "To rollback if needed:"
echo "  ./scripts/rollback.sh ${BACKUP_TAG}"
echo ""

show_elapsed_time

log_info "Deployment started at: $(date -d @${START_TIME} '+%Y-%m-%d %H:%M:%S')"
log_info "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
