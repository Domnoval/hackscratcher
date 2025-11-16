#!/bin/bash

################################################################################
# SCRATCH ORACLE - HOTFIX DEPLOYMENT SCRIPT
#
# Purpose: Emergency bug fix deployment (TARGET: 5 minutes)
# Use when: Critical bugs, security issues, app crashes
#
# Usage: ./scripts/deploy-hotfix.sh "Fix crash on app launch"
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

HOTFIX_DESCRIPTION="${1:-Emergency hotfix}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_TAG="backup_before_hotfix_${TIMESTAMP}"

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
log_info "HOTFIX DEPLOYMENT STARTING"
log_info "========================================="
log_info "Description: ${HOTFIX_DESCRIPTION}"
log_info "Current branch: ${CURRENT_BRANCH}"
log_info ""

# Check if git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository!"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    log_warning "You have uncommitted changes!"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled"
        exit 1
    fi
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

log_success "Pre-flight checks passed"
echo ""

################################################################################
# BACKUP CURRENT STATE
################################################################################

log_info "Step 1/6: Creating backup tag..."
git tag -a "${BACKUP_TAG}" -m "Backup before hotfix: ${HOTFIX_DESCRIPTION}"
git push origin "${BACKUP_TAG}" 2>&1 | grep -v "warning:" || true
log_success "Backup tag created: ${BACKUP_TAG}"
echo ""

################################################################################
# INCREMENT VERSION
################################################################################

log_info "Step 2/6: Incrementing patch version..."

# Get current version from app.json
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
log_info "Current version: ${CURRENT_VERSION}"

# Increment patch version (e.g., 1.0.1 -> 1.0.2)
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"

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
# BUILD PREVIEW APK
################################################################################

log_info "Step 3/6: Building preview APK (this may take 3-5 minutes)..."
log_warning "Building on EAS servers..."

if eas build --platform android --profile preview --non-interactive --no-wait; then
    log_success "Build submitted to EAS!"
    log_info "Build will continue in background"
    log_info "Check status: eas build:list"
else
    log_error "Build submission failed!"
    log_warning "Rolling back version changes..."
    git checkout app.json
    exit 1
fi

echo ""

################################################################################
# COMMIT CHANGES
################################################################################

log_info "Step 4/6: Committing version bump..."

git add app.json
git commit -m "Hotfix v${NEW_VERSION}: ${HOTFIX_DESCRIPTION}

- Patch version: ${CURRENT_VERSION} -> ${NEW_VERSION}
- versionCode: ${CURRENT_VERSION_CODE} -> ${NEW_VERSION_CODE}
- Deployed via deploy-hotfix.sh

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

log_success "Changes committed"
echo ""

################################################################################
# PUSH TO REMOTE
################################################################################

log_info "Step 5/6: Pushing to remote..."

if git push origin "${CURRENT_BRANCH}"; then
    log_success "Pushed to origin/${CURRENT_BRANCH}"
else
    log_error "Push failed! You may need to pull first"
    log_warning "Build is still in progress on EAS"
    exit 1
fi

echo ""

################################################################################
# CREATE RELEASE TAG
################################################################################

log_info "Step 6/6: Creating release tag..."

RELEASE_TAG="v${NEW_VERSION}-hotfix"
git tag -a "${RELEASE_TAG}" -m "Hotfix ${NEW_VERSION}: ${HOTFIX_DESCRIPTION}"
git push origin "${RELEASE_TAG}"

log_success "Release tag created: ${RELEASE_TAG}"
echo ""

################################################################################
# SUMMARY
################################################################################

log_success "========================================="
log_success "HOTFIX DEPLOYMENT COMPLETE!"
log_success "========================================="
echo ""
echo "Version: ${NEW_VERSION}"
echo "Tag: ${RELEASE_TAG}"
echo "Backup tag: ${BACKUP_TAG}"
echo ""
echo "Build Status:"
echo "  - Check build: eas build:list"
echo "  - Download APK: eas build:download --latest"
echo ""
echo "Next Steps:"
echo "  1. Wait for build to complete (~3-5 min)"
echo "  2. Download and test APK locally"
echo "  3. If good -> share with testers"
echo "  4. If broken -> run: ./scripts/rollback.sh ${BACKUP_TAG}"
echo ""
echo "To submit to Play Store:"
echo "  ./scripts/deploy-native.sh --submit"
echo ""

show_elapsed_time

log_info "Deployment started at: $(date -d @${START_TIME} '+%Y-%m-%d %H:%M:%S')"
log_info "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
