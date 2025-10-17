#!/bin/bash

# Scratch Oracle - Setup Script
# Run this after restarting your computer to install all packages

echo "🎰 Scratch Oracle - Setup Script"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_success "Found package.json"
echo ""

# Step 1: Clean install (optional)
echo "Step 1: Clean Install (Optional)"
echo "--------------------------------"
read -p "Do you want to delete node_modules and reinstall? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Removing node_modules..."
    rm -rf node_modules
    rm -f package-lock.json
    print_success "Cleanup complete"
fi
echo ""

# Step 2: Install base dependencies
echo "Step 2: Installing Base Dependencies"
echo "-------------------------------------"
print_info "This may take 5-10 minutes..."
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    print_success "Base dependencies installed"
else
    print_error "Failed to install base dependencies"
    exit 1
fi
echo ""

# Step 3: Install camera packages
echo "Step 3: Installing Camera & Barcode Scanner"
echo "-------------------------------------------"
npm install expo-camera expo-barcode-scanner --legacy-peer-deps

if [ $? -eq 0 ]; then
    print_success "Camera packages installed"
else
    print_error "Failed to install camera packages"
    print_info "You can manually install later with:"
    print_info "npm install expo-camera expo-barcode-scanner --legacy-peer-deps"
fi
echo ""

# Step 4: Install notification packages
echo "Step 4: Installing Notification System"
echo "---------------------------------------"
npm install expo-notifications expo-background-fetch expo-task-manager expo-device --legacy-peer-deps

if [ $? -eq 0 ]; then
    print_success "Notification packages installed"
else
    print_error "Failed to install notification packages"
    print_info "You can manually install later with:"
    print_info "npm install expo-notifications expo-background-fetch expo-task-manager expo-device --legacy-peer-deps"
fi
echo ""

# Step 5: Install map packages
echo "Step 5: Installing Map & Location Services"
echo "-------------------------------------------"
npm install react-native-maps expo-location --legacy-peer-deps

if [ $? -eq 0 ]; then
    print_success "Map packages installed"
else
    print_error "Failed to install map packages"
    print_info "You can manually install later with:"
    print_info "npm install react-native-maps expo-location --legacy-peer-deps"
fi
echo ""

# Step 6: Install EAS CLI globally
echo "Step 6: Installing EAS CLI"
echo "--------------------------"
print_info "Installing EAS CLI globally..."
npm install -g eas-cli

if [ $? -eq 0 ]; then
    print_success "EAS CLI installed"
else
    print_error "Failed to install EAS CLI"
    print_info "Try: sudo npm install -g eas-cli"
fi
echo ""

# Step 7: Verify installation
echo "Step 7: Verifying Installation"
echo "-------------------------------"

# Check if critical packages are installed
PACKAGES=("expo-camera" "expo-notifications" "react-native-maps" "expo-location")
MISSING=()

for pkg in "${PACKAGES[@]}"; do
    if npm list "$pkg" &>/dev/null; then
        print_success "$pkg installed"
    else
        print_error "$pkg NOT installed"
        MISSING+=("$pkg")
    fi
done

echo ""

# Step 8: Configuration check
echo "Step 8: Configuration Check"
echo "----------------------------"

# Check app.json
if grep -q "YOUR_GOOGLE_MAPS_API_KEY" app.json; then
    print_error "Google Maps API key not set in app.json"
    print_info "Get key from: https://console.cloud.google.com"
else
    print_success "Google Maps API key configured"
fi

# Check EAS project ID
if grep -q "YOUR_EAS_PROJECT_ID" app.json; then
    print_error "EAS Project ID not set in app.json"
    print_info "Run: eas init"
else
    print_success "EAS Project ID configured"
fi

echo ""

# Final summary
echo "================================="
echo "🎊 Setup Summary"
echo "================================="

if [ ${#MISSING[@]} -eq 0 ]; then
    print_success "All packages installed successfully!"
    echo ""
    print_info "Next steps:"
    echo "  1. Update Google Maps API key in app.json"
    echo "  2. Run: eas init (if not done)"
    echo "  3. Run: npx expo start --clear"
    echo "  4. Test all features on device"
    echo ""
    print_success "You're ready to build and deploy! 🚀"
else
    print_error "Some packages failed to install:"
    for pkg in "${MISSING[@]}"; do
        echo "  - $pkg"
    done
    echo ""
    print_info "Retry installing missing packages manually or"
    print_info "restart your computer and run this script again."
fi

echo ""
echo "📚 Documentation available in docs/ folder:"
echo "  - DEPLOYMENT_GUIDE.md - Complete Play Store guide"
echo "  - LAUNCH_CHECKLIST.md - Step-by-step launch plan"
echo "  - TROUBLESHOOTING.md - Fix common issues"
echo ""

print_success "Setup script complete!"
