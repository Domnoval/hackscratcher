#!/bin/bash

################################################################################
# SCRATCH ORACLE - DEPLOYMENT VERIFICATION SCRIPT
#
# Purpose: Verify deployment was successful
# Use after: Any deployment to ensure everything is working
#
# Usage:
#   ./scripts/verify-deployment.sh                  # Verify latest build
#   ./scripts/verify-deployment.sh <build-id>       # Verify specific build
################################################################################

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

################################################################################
# CONFIGURATION
################################################################################

BUILD_ID="${1:-latest}"
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

################################################################################
# FUNCTIONS
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_passed() {
    ((CHECKS_PASSED++))
    ((CHECKS_TOTAL++))
    log_success "$1"
}

check_failed() {
    ((CHECKS_FAILED++))
    ((CHECKS_TOTAL++))
    log_error "$1"
}

section_header() {
    echo ""
    echo -e "${BOLD}$1${NC}"
    echo "========================================"
}

################################################################################
# PRE-FLIGHT CHECKS
################################################################################

echo ""
echo -e "${BOLD}=========================================${NC}"
echo -e "${BOLD}DEPLOYMENT VERIFICATION${NC}"
echo -e "${BOLD}=========================================${NC}"
echo ""

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

log_info "Verifying deployment..."
echo ""

################################################################################
# 1. BUILD STATUS
################################################################################

section_header "1. Build Status"

log_info "Fetching build information..."

# Get build info
if [[ "${BUILD_ID}" == "latest" ]]; then
    BUILD_INFO=$(eas build:list --platform android --limit 1 --json 2>/dev/null || echo "")
else
    BUILD_INFO=$(eas build:view "${BUILD_ID}" --json 2>/dev/null || echo "")
fi

if [[ -z "${BUILD_INFO}" ]]; then
    check_failed "Could not fetch build information"
    exit 1
fi

# Extract build details
BUILD_STATUS=$(echo "${BUILD_INFO}" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
BUILD_PLATFORM=$(echo "${BUILD_INFO}" | grep -o '"platform":"[^"]*"' | head -1 | cut -d'"' -f4)
BUILD_PROFILE=$(echo "${BUILD_INFO}" | grep -o '"buildProfile":"[^"]*"' | head -1 | cut -d'"' -f4)
ACTUAL_BUILD_ID=$(echo "${BUILD_INFO}" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

log_info "Build ID: ${ACTUAL_BUILD_ID}"
log_info "Platform: ${BUILD_PLATFORM}"
log_info "Profile: ${BUILD_PROFILE}"
log_info "Status: ${BUILD_STATUS}"
echo ""

# Check build status
case "${BUILD_STATUS}" in
    "finished")
        check_passed "Build completed successfully"
        ;;
    "in-progress"|"pending")
        check_failed "Build still in progress (status: ${BUILD_STATUS})"
        log_info "Wait for build to complete before verification"
        exit 1
        ;;
    "errored")
        check_failed "Build failed with errors"
        log_info "Check build logs: eas build:view ${ACTUAL_BUILD_ID}"
        exit 1
        ;;
    "canceled")
        check_failed "Build was canceled"
        exit 1
        ;;
    *)
        check_failed "Unknown build status: ${BUILD_STATUS}"
        exit 1
        ;;
esac

################################################################################
# 2. BUILD ARTIFACTS
################################################################################

section_header "2. Build Artifacts"

# Check if artifact is available
ARTIFACT_URL=$(echo "${BUILD_INFO}" | grep -o '"artifactUrl":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -n "${ARTIFACT_URL}" && "${ARTIFACT_URL}" != "null" ]]; then
    check_passed "Build artifact available"
    log_info "Download URL: ${ARTIFACT_URL}"

    # Try to get artifact size
    if command -v curl &> /dev/null; then
        ARTIFACT_SIZE=$(curl -sI "${ARTIFACT_URL}" | grep -i "content-length" | awk '{print $2}' | tr -d '\r')
        if [[ -n "${ARTIFACT_SIZE}" ]]; then
            ARTIFACT_SIZE_MB=$(( ARTIFACT_SIZE / 1024 / 1024 ))
            check_passed "Artifact size: ${ARTIFACT_SIZE_MB} MB"

            # Sanity check on size
            if [[ ${ARTIFACT_SIZE_MB} -lt 10 ]]; then
                check_failed "Artifact suspiciously small (${ARTIFACT_SIZE_MB} MB)"
            elif [[ ${ARTIFACT_SIZE_MB} -gt 200 ]]; then
                log_warning "Artifact very large (${ARTIFACT_SIZE_MB} MB)"
            fi
        fi
    fi
else
    check_failed "No build artifact available"
fi

################################################################################
# 3. VERSION INFORMATION
################################################################################

section_header "3. Version Information"

# Get version from git
if git rev-parse --git-dir > /dev/null 2>&1; then
    GIT_VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
    GIT_VERSION_CODE=$(grep -o '"versionCode": [0-9]*' app.json | grep -o '[0-9]*' 2>/dev/null || echo "unknown")

    log_info "Current git version: ${GIT_VERSION}"
    log_info "Current git versionCode: ${GIT_VERSION_CODE}"

    # Get version from build
    BUILD_APP_VERSION=$(echo "${BUILD_INFO}" | grep -o '"appVersion":"[^"]*"' | head -1 | cut -d'"' -f4)
    BUILD_VERSION_CODE=$(echo "${BUILD_INFO}" | grep -o '"versionCode":[0-9]*' | head -1 | grep -o '[0-9]*')

    if [[ -n "${BUILD_APP_VERSION}" ]]; then
        log_info "Build app version: ${BUILD_APP_VERSION}"

        if [[ "${GIT_VERSION}" == "${BUILD_APP_VERSION}" ]]; then
            check_passed "Version matches git (${GIT_VERSION})"
        else
            check_failed "Version mismatch (git: ${GIT_VERSION}, build: ${BUILD_APP_VERSION})"
        fi
    fi

    if [[ -n "${BUILD_VERSION_CODE}" ]]; then
        log_info "Build versionCode: ${BUILD_VERSION_CODE}"

        if [[ "${GIT_VERSION_CODE}" == "${BUILD_VERSION_CODE}" ]]; then
            check_passed "VersionCode matches git (${GIT_VERSION_CODE})"
        else
            check_failed "VersionCode mismatch (git: ${GIT_VERSION_CODE}, build: ${BUILD_VERSION_CODE})"
        fi
    fi
fi

################################################################################
# 4. GIT TAGS
################################################################################

section_header "4. Git Tags"

if git rev-parse --git-dir > /dev/null 2>&1; then
    CURRENT_COMMIT=$(git rev-parse --short HEAD)
    log_info "Current commit: ${CURRENT_COMMIT}"

    # Check for version tag
    VERSION_TAG="v${GIT_VERSION}"
    if git rev-parse "${VERSION_TAG}" >/dev/null 2>&1; then
        check_passed "Version tag exists: ${VERSION_TAG}"

        # Check if tag points to current commit
        TAG_COMMIT=$(git rev-parse --short "${VERSION_TAG}")
        if [[ "${TAG_COMMIT}" == "${CURRENT_COMMIT}" ]]; then
            check_passed "Version tag points to current commit"
        else
            log_warning "Version tag points to different commit (${TAG_COMMIT})"
        fi
    else
        log_warning "No version tag found (${VERSION_TAG})"
    fi

    # Check for backup tags
    RECENT_BACKUP=$(git tag -l "backup_*" --sort=-creatordate | head -1)
    if [[ -n "${RECENT_BACKUP}" ]]; then
        check_passed "Backup tag exists: ${RECENT_BACKUP}"
    else
        log_warning "No backup tags found"
    fi
fi

################################################################################
# 5. REMOTE SYNC
################################################################################

section_header "5. Remote Sync"

if git rev-parse --git-dir > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

    # Check if pushed to remote
    if git remote get-url origin > /dev/null 2>&1; then
        git fetch origin "${CURRENT_BRANCH}" 2>/dev/null || true

        LOCAL=$(git rev-parse @)
        REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "unknown")

        if [[ "${LOCAL}" == "${REMOTE}" ]]; then
            check_passed "Code pushed to remote (${CURRENT_BRANCH})"
        else
            check_failed "Code not pushed to remote"
            log_info "Run: git push origin ${CURRENT_BRANCH}"
        fi
    else
        log_warning "No remote origin configured"
    fi
fi

################################################################################
# 6. BUILD LOGS
################################################################################

section_header "6. Build Logs Analysis"

log_info "Checking for common issues in build logs..."

# Get build logs
BUILD_LOGS=$(eas build:view "${ACTUAL_BUILD_ID}" 2>&1 || echo "")

# Check for warnings
WARNING_COUNT=$(echo "${BUILD_LOGS}" | grep -i "warning" | wc -l || echo "0")
ERROR_COUNT=$(echo "${BUILD_LOGS}" | grep -i "error" | wc -l || echo "0")

if [[ ${ERROR_COUNT} -eq 0 ]]; then
    check_passed "No errors in build logs"
else
    log_warning "Found ${ERROR_COUNT} error messages in logs"
fi

if [[ ${WARNING_COUNT} -lt 10 ]]; then
    check_passed "Minimal warnings (${WARNING_COUNT})"
else
    log_warning "Many warnings in build logs (${WARNING_COUNT})"
fi

################################################################################
# 7. SUPABASE CONNECTIVITY
################################################################################

section_header "7. Backend Connectivity"

# Check Supabase URL from eas.json
if [[ -f "eas.json" ]]; then
    SUPABASE_URL=$(grep -o 'EXPO_PUBLIC_SUPABASE_URL[^,]*' eas.json | cut -d'"' -f3 | head -1)

    if [[ -n "${SUPABASE_URL}" ]]; then
        log_info "Supabase URL: ${SUPABASE_URL}"

        # Test connectivity
        if command -v curl &> /dev/null; then
            HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SUPABASE_URL}/rest/v1/" --max-time 5 || echo "000")

            if [[ "${HTTP_STATUS}" == "200" || "${HTTP_STATUS}" == "401" ]]; then
                check_passed "Supabase backend reachable (HTTP ${HTTP_STATUS})"
            else
                check_failed "Supabase backend unreachable (HTTP ${HTTP_STATUS})"
            fi
        fi
    else
        log_warning "Supabase URL not found in eas.json"
    fi
fi

################################################################################
# 8. PLAY STORE STATUS (if production)
################################################################################

if [[ "${BUILD_PROFILE}" == "production" ]]; then
    section_header "8. Play Store Status"

    # Check if submitted
    SUBMIT_INFO=$(eas submit:list --platform android --limit 1 --json 2>/dev/null || echo "")

    if [[ -n "${SUBMIT_INFO}" ]]; then
        SUBMIT_STATUS=$(echo "${SUBMIT_INFO}" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        SUBMIT_ID=$(echo "${SUBMIT_INFO}" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

        log_info "Latest submission: ${SUBMIT_ID}"
        log_info "Status: ${SUBMIT_STATUS}"

        case "${SUBMIT_STATUS}" in
            "finished")
                check_passed "Successfully submitted to Play Store"
                ;;
            "in-progress"|"pending")
                log_warning "Submission in progress"
                ;;
            "errored")
                check_failed "Submission failed"
                ;;
            *)
                log_warning "Unknown submission status: ${SUBMIT_STATUS}"
                ;;
        esac
    else
        log_warning "No Play Store submissions found"
        log_info "Submit with: eas submit --platform android --id ${ACTUAL_BUILD_ID}"
    fi
fi

################################################################################
# 9. CHANGELOG
################################################################################

section_header "9. Documentation"

# Check if changelog updated
if [[ -f "CHANGELOG.md" ]]; then
    check_passed "CHANGELOG.md exists"

    # Check if current version is in changelog
    if grep -q "${GIT_VERSION}" CHANGELOG.md; then
        check_passed "Current version documented in changelog"
    else
        log_warning "Current version not in changelog"
    fi
else
    log_warning "CHANGELOG.md not found"
fi

################################################################################
# SUMMARY
################################################################################

echo ""
echo -e "${BOLD}=========================================${NC}"
echo -e "${BOLD}VERIFICATION SUMMARY${NC}"
echo -e "${BOLD}=========================================${NC}"
echo ""

echo -e "Total checks: ${BOLD}${CHECKS_TOTAL}${NC}"
echo -e "Passed: ${GREEN}${CHECKS_PASSED}${NC}"
echo -e "Failed: ${RED}${CHECKS_FAILED}${NC}"
echo ""

if [[ ${CHECKS_TOTAL} -gt 0 ]]; then
    PASS_RATE=$(( (CHECKS_PASSED * 100) / CHECKS_TOTAL ))
    echo -e "Success rate: ${BOLD}${PASS_RATE}%${NC}"
    echo ""
fi

# Overall status
if [[ ${CHECKS_FAILED} -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✓ DEPLOYMENT VERIFIED SUCCESSFULLY!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Download build: eas build:download --id ${ACTUAL_BUILD_ID}"
    echo "  2. Test on physical device"
    echo "  3. Share with beta testers"

    if [[ "${BUILD_PROFILE}" == "preview" ]]; then
        echo "  4. When ready, build production: ./scripts/deploy-native.sh --production"
    elif [[ "${BUILD_PROFILE}" == "production" ]]; then
        echo "  4. Submit to Play Store: eas submit --platform android --id ${ACTUAL_BUILD_ID}"
        echo "  5. Release to production when testing complete"
    fi

    EXIT_CODE=0
else
    echo -e "${RED}${BOLD}✗ VERIFICATION FAILED${NC}"
    echo ""
    echo "Issues found:"
    echo "  - ${CHECKS_FAILED} check(s) failed"
    echo ""
    echo "Actions required:"
    echo "  1. Review failed checks above"
    echo "  2. Fix issues"
    echo "  3. Re-run verification"
    echo ""
    echo "To view build details:"
    echo "  eas build:view ${ACTUAL_BUILD_ID}"

    EXIT_CODE=1
fi

echo ""
echo "Build Information:"
echo "  ID: ${ACTUAL_BUILD_ID}"
echo "  Status: ${BUILD_STATUS}"
echo "  Platform: ${BUILD_PLATFORM}"
echo "  Profile: ${BUILD_PROFILE}"
echo "  Version: ${BUILD_APP_VERSION:-unknown}"
if [[ -n "${ARTIFACT_URL}" && "${ARTIFACT_URL}" != "null" ]]; then
    echo "  Download: ${ARTIFACT_URL}"
fi

echo ""
exit ${EXIT_CODE}
