#!/bin/bash

################################################################################
# SCRATCH ORACLE - NATIVE BUILD & PLAY STORE DEPLOYMENT
#
# Purpose: Build production APK/AAB and optionally submit to Play Store
# Use when: Ready for production release
#
# Usage:
#   ./scripts/deploy-native.sh              # Build only
#   ./scripts/deploy-native.sh --submit     # Build and submit
#   ./scripts/deploy-native.sh --production # Production build (AAB)
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

BUILD_PROFILE="preview"  # Default to preview (APK)
AUTO_SUBMIT=false
WAIT_FOR_BUILD=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --production)
            BUILD_PROFILE="production"
            shift
            ;;
        --submit)
            AUTO_SUBMIT=true
            shift
            ;;
        --wait)
            WAIT_FOR_BUILD=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--production] [--submit] [--wait]"
            exit 1
            ;;
    esac
done

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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
log_info "NATIVE BUILD DEPLOYMENT"
log_info "========================================="
log_info "Build profile: ${BUILD_PROFILE}"
log_info "Auto-submit: ${AUTO_SUBMIT}"
log_info "Current branch: ${CURRENT_BRANCH}"
log_info ""

# Check if git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository!"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    log_error "You have uncommitted changes! Commit them first."
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

# Production build requires main branch
if [[ "${BUILD_PROFILE}" == "production" && "${CURRENT_BRANCH}" != "main" && "${CURRENT_BRANCH}" != "master" ]]; then
    log_error "Production builds must be from main/master branch!"
    log_error "Current branch: ${CURRENT_BRANCH}"
    exit 1
fi

# Check if Play Store service account exists (for submission)
if [[ "${AUTO_SUBMIT}" == "true" ]]; then
    if [[ ! -f "google-play-service-account.json" ]]; then
        log_error "Play Store service account not found!"
        log_error "Required file: google-play-service-account.json"
        exit 1
    fi
    log_success "Play Store service account found"
fi

log_success "Pre-flight checks passed"
echo ""

################################################################################
# GET VERSION INFO
################################################################################

log_info "Step 1/5: Getting version information..."

CURRENT_VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
VERSION_CODE=$(grep -o '"versionCode": [0-9]*' app.json | grep -o '[0-9]*')
PACKAGE_NAME=$(grep -o '"package": "[^"]*"' app.json | cut -d'"' -f4)

log_info "Version: ${CURRENT_VERSION}"
log_info "Version Code: ${VERSION_CODE}"
log_info "Package: ${PACKAGE_NAME}"

# Confirm production deployment
if [[ "${BUILD_PROFILE}" == "production" ]]; then
    log_warning "========================================="
    log_warning "PRODUCTION BUILD WARNING"
    log_warning "========================================="
    log_warning "You are about to create a PRODUCTION build"
    log_warning "Version: ${CURRENT_VERSION}"
    log_warning "Build type: Android App Bundle (AAB)"

    if [[ "${AUTO_SUBMIT}" == "true" ]]; then
        log_warning "This will be AUTOMATICALLY SUBMITTED to Play Store"
    fi

    log_warning "========================================="
    read -p "Are you ABSOLUTELY sure? Type 'yes' to continue: " -r
    if [[ ! $REPLY == "yes" ]]; then
        log_error "Production build cancelled"
        exit 1
    fi
fi

echo ""

################################################################################
# BUILD NATIVE APP
################################################################################

log_info "Step 2/5: Building native Android app..."

if [[ "${BUILD_PROFILE}" == "production" ]]; then
    log_info "Building Android App Bundle (AAB) for Play Store..."
    BUILD_TYPE="app-bundle"
else
    log_info "Building APK for testing..."
    BUILD_TYPE="apk"
fi

if [[ "${WAIT_FOR_BUILD}" == "true" ]]; then
    log_warning "Waiting for build to complete (this can take 10-15 minutes)..."
    BUILD_CMD="eas build --platform android --profile ${BUILD_PROFILE}"
else
    log_info "Build will run in background..."
    BUILD_CMD="eas build --platform android --profile ${BUILD_PROFILE} --non-interactive --no-wait"
fi

if ${BUILD_CMD}; then
    log_success "Build submitted successfully!"
else
    log_error "Build submission failed!"
    exit 1
fi

# Get build ID
BUILD_ID=$(eas build:list --platform android --limit 1 --json 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")

log_info "Build ID: ${BUILD_ID}"
echo ""

################################################################################
# WAIT FOR BUILD (if requested)
################################################################################

if [[ "${WAIT_FOR_BUILD}" == "true" ]]; then
    log_info "Step 3/5: Waiting for build to complete..."
    log_info "This may take 10-15 minutes. You can cancel and check later with: eas build:list"

    # Note: EAS build command with --wait flag handles this automatically
    # If we get here, build is complete

    log_success "Build completed!"
    echo ""
else
    log_info "Step 3/5: Build running in background..."
    log_info "Check status with: eas build:list"
    log_info "View build: eas build:view ${BUILD_ID}"
    echo ""
fi

################################################################################
# DOWNLOAD BUILD (if build completed)
################################################################################

if [[ "${WAIT_FOR_BUILD}" == "true" ]]; then
    log_info "Step 4/5: Downloading build artifact..."

    DOWNLOAD_DIR="builds/${BUILD_PROFILE}_${TIMESTAMP}"
    mkdir -p "${DOWNLOAD_DIR}"

    if eas build:download --id "${BUILD_ID}" --output "${DOWNLOAD_DIR}"; then
        log_success "Build downloaded to: ${DOWNLOAD_DIR}"

        # Find the downloaded file
        ARTIFACT=$(find "${DOWNLOAD_DIR}" -type f \( -name "*.apk" -o -name "*.aab" \) | head -1)
        if [[ -n "${ARTIFACT}" ]]; then
            ARTIFACT_SIZE=$(du -h "${ARTIFACT}" | cut -f1)
            log_info "Artifact: ${ARTIFACT} (${ARTIFACT_SIZE})"
        fi
    else
        log_warning "Failed to download build artifact"
    fi
    echo ""
else
    log_info "Step 4/5: Skipping download (build in progress)"
    log_info "Download later with: eas build:download --id ${BUILD_ID}"
    echo ""
fi

################################################################################
# SUBMIT TO PLAY STORE (if requested)
################################################################################

if [[ "${AUTO_SUBMIT}" == "true" ]]; then
    if [[ "${BUILD_PROFILE}" != "production" ]]; then
        log_error "Cannot submit non-production build to Play Store!"
        log_error "Use --production flag for Play Store submission"
        exit 1
    fi

    log_info "Step 5/5: Submitting to Google Play Store..."
    log_warning "Submitting as DRAFT to internal testing track..."

    if [[ "${WAIT_FOR_BUILD}" != "true" ]]; then
        log_error "Must wait for build to complete before submitting!"
        log_error "Re-run with --wait flag, or submit manually later with:"
        log_error "  eas submit --platform android --id ${BUILD_ID}"
        exit 1
    fi

    if eas submit --platform android --id "${BUILD_ID}" --non-interactive; then
        log_success "Submitted to Play Store!"
        log_info "Track: Internal Testing"
        log_info "Status: Draft (requires manual release)"
    else
        log_error "Submission failed!"
        log_info "You can retry manually with:"
        log_info "  eas submit --platform android --id ${BUILD_ID}"
        exit 1
    fi
else
    log_info "Step 5/5: Skipping Play Store submission"
    log_info "To submit later:"
    log_info "  eas submit --platform android --id ${BUILD_ID}"
fi

echo ""

################################################################################
# CREATE GIT TAG
################################################################################

log_info "Creating git tag for this build..."

BUILD_TAG="build_${BUILD_PROFILE}_${VERSION_CODE}_${TIMESTAMP}"
git tag -a "${BUILD_TAG}" -m "Native build ${BUILD_PROFILE} v${CURRENT_VERSION} (${VERSION_CODE})"

if git push origin "${BUILD_TAG}" 2>&1 | grep -v "warning:"; then
    log_success "Build tag created: ${BUILD_TAG}"
else
    log_warning "Failed to push tag (non-critical)"
fi

echo ""

################################################################################
# SUMMARY
################################################################################

log_success "========================================="
log_success "NATIVE BUILD DEPLOYMENT COMPLETE!"
log_success "========================================="
echo ""
echo "Build Details:"
echo "  Profile: ${BUILD_PROFILE}"
echo "  Version: ${CURRENT_VERSION}"
echo "  Version Code: ${VERSION_CODE}"
echo "  Build ID: ${BUILD_ID}"
echo "  Tag: ${BUILD_TAG}"
echo ""

if [[ "${WAIT_FOR_BUILD}" == "true" ]]; then
    echo "Build Status: COMPLETED"
    if [[ -n "${ARTIFACT}" ]]; then
        echo "  Artifact: ${ARTIFACT}"
        echo "  Size: ${ARTIFACT_SIZE}"
    fi
else
    echo "Build Status: IN PROGRESS"
    echo "  Check: eas build:list"
    echo "  View: eas build:view ${BUILD_ID}"
    echo "  Download: eas build:download --id ${BUILD_ID}"
fi

echo ""

if [[ "${AUTO_SUBMIT}" == "true" ]]; then
    echo "Play Store Submission: COMPLETED (DRAFT)"
    echo "  Next: Go to Play Console and release from internal testing"
    echo "  URL: https://play.google.com/console"
else
    echo "Play Store Submission: NOT SUBMITTED"
    echo "  To submit: eas submit --platform android --id ${BUILD_ID}"
fi

echo ""
echo "Next Steps:"

if [[ "${BUILD_PROFILE}" == "production" ]]; then
    echo "  1. Wait for build to complete (if not already)"
    echo "  2. Download AAB file"
    echo "  3. Test on multiple devices"
    echo "  4. Submit to Play Store (if not auto-submitted)"
    echo "  5. Release to internal testing"
    echo "  6. Promote to production when ready"
else
    echo "  1. Wait for build to complete (if not already)"
    echo "  2. Download APK file"
    echo "  3. Install on test devices: adb install -r app.apk"
    echo "  4. Test thoroughly"
    echo "  5. Share with beta testers"
    echo "  6. When ready, build production: ./scripts/deploy-native.sh --production"
fi

echo ""

show_elapsed_time

log_info "Deployment started at: $(date -d @${START_TIME} '+%Y-%m-%d %H:%M:%S')"
log_info "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
