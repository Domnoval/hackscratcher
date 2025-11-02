// Load environment variables from .env file for local development
// In production (EAS builds), environment variables come from EAS secrets
require('dotenv').config();

module.exports = {
  expo: {
    name: "Scratch Oracle",
    slug: "scratch-oracle-app",
    version: "1.0.5",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A0F"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.scratchoracle.app"
    },
    android: {
      package: "com.scratchoracle.app",
      versionCode: 6,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0A0F"
      },
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.scratchoracle.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [],
    extra: {
      eas: {
        projectId: "78e2e800-e081-4b43-86e0-2968fffec441"
      },
      // These will be available via Constants.expoConfig.extra
      // They're loaded from .env in dev, and from EAS secrets in production
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    owner: "mm444",
    autolinking: {
      exclude: [
        "expo-barcode-scanner",
        "expo-camera",
        "expo-location",
        "expo-notifications",
        "expo-task-manager",
        "expo-background-fetch"
      ]
    }
  }
};
