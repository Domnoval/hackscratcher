/**
 * NativeWind Examples - Tailwind CSS for React Native
 *
 * REPLACES: StyleSheet.create() for most styling
 *
 * Benefits over StyleSheet:
 * - 10x faster to write styles
 * - Responsive design built-in
 * - Dark mode with one class
 * - Consistent design tokens
 * - Smaller bundle (unused classes removed)
 * - Better developer experience
 * - Platform-specific styles easier
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

// NativeWind v4 - No need for styled() wrapper, use className directly
// Components work with className prop out of the box

/**
 * BEFORE (StyleSheet) vs AFTER (NativeWind)
 */

// BEFORE - Traditional StyleSheet way (verbose, separate file)
/*
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  title: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#00FFFF',
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

<View style={styles.container}>
  <View style={styles.card}>
    <Text style={styles.title}>Title</Text>
  </View>
</View>
*/

// AFTER - NativeWind way (inline, faster, responsive)
export function NativeWindBasicExample() {
  return (
    <View className="flex-1 bg-[#0A0A0F] p-5">
      <View className="bg-[#1A1A2E] rounded-xl p-4 mb-4 border border-[#2E2E3F]">
        <Text className="text-[#E0E0E0] text-lg font-bold">
          Title
        </Text>
      </View>
    </View>
  );
}

/**
 * Example 1: Card Component Comparison
 */
export function RecommendationCardNativeWind() {
  return (
    <View className="bg-[#1A1A2E] rounded-xl p-4 mb-4 border border-[#2E2E3F]">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-[#E0E0E0] text-lg font-bold flex-1">
          #1 Mega Millions Crossword
        </Text>
        <Text className="text-[#FFD700] text-base font-bold">
          $10
        </Text>
      </View>

      {/* AI Badge */}
      <View className="bg-[#00BFFF]/10 px-3 py-2 rounded-lg border border-[#00BFFF] mt-2">
        <Text className="text-[#00BFFF] text-sm font-semibold text-center">
          🤖 AI Score: 92/100
        </Text>
      </View>

      {/* Game Info */}
      <View className="mt-3 gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-[#708090] text-sm">Overall Odds:</Text>
          <Text className="text-[#E0E0E0] text-sm font-medium">1 in 3.5</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-[#708090] text-sm">Status:</Text>
          <Text className="text-[#00FF7F] text-sm font-medium">Active</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Example 2: Responsive Design (sm:, md:, lg: breakpoints)
 */
export function ResponsiveLayoutExample() {
  return (
    <View className="flex-1 p-4 md:p-8 lg:p-12">
      {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
      <View className="flex-row flex-wrap gap-4">
        <View className="w-full md:w-1/2 lg:w-1/3">
          <Text className="text-base md:text-lg lg:text-xl">
            Responsive Card
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Example 3: Dark Mode Support
 */
export function DarkModeExample() {
  return (
    <View className="bg-white dark:bg-[#0A0A0F] p-4">
      <Text className="text-black dark:text-white text-lg">
        This text adapts to dark mode automatically
      </Text>
      <View className="bg-gray-200 dark:bg-[#1A1A2E] p-4 rounded-lg mt-4">
        <Text className="text-gray-800 dark:text-[#E0E0E0]">
          Card background also adapts
        </Text>
      </View>
    </View>
  );
}

/**
 * Example 4: Platform-Specific Styles
 */
export function PlatformSpecificExample() {
  return (
    <View className="p-4">
      {/* Different padding on Android vs iOS */}
      <View className="android:px-4 ios:px-6">
        <Text>Platform-specific padding</Text>
      </View>

      {/* Different shadows */}
      <View className="android:elevation-4 ios:shadow-lg bg-white p-4 rounded-lg mt-4">
        <Text>Platform-specific shadows</Text>
      </View>
    </View>
  );
}

/**
 * Example 5: State-Based Styling
 */
export function ButtonExample() {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isDisabled, setIsDisabled] = React.useState(false);

  return (
    <View className="p-4">
      <TouchableOpacity
        className={`
          bg-[#00FFFF] py-4 rounded-lg
          ${isPressed ? 'opacity-70' : 'opacity-100'}
          ${isDisabled ? 'bg-[#708090]' : 'bg-[#00FFFF]'}
        `}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        disabled={isDisabled}
      >
        <Text className="text-[#0A0A0F] text-base font-bold text-center">
          Get Smart Recommendations
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 py-2"
        onPress={() => setIsDisabled(!isDisabled)}
      >
        <Text className="text-[#00FFFF] text-center">
          Toggle Disabled: {isDisabled ? 'ON' : 'OFF'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Example 6: Complete App Screen (Before vs After)
 */

// BEFORE - StyleSheet (from App.tsx)
/*
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 4,
  },
  // ... 50+ more style definitions
});
*/

// AFTER - NativeWind
export function AppScreenNativeWind() {
  return (
    <ScrollView className="flex-1 bg-[#0A0A0F]">
      <View className="p-5">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-5">
          <View className="flex-1">
            <Text className="text-[28px] font-bold text-[#00FFFF] mb-1">
              🎯 Scratch Oracle
            </Text>
            <Text className="text-base text-[#FFD700]">
              Smart Lottery Recommendations
            </Text>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-[#1A1A2E] border border-[#2E2E3F] items-center justify-center">
            <Text className="text-2xl text-[#00FFFF]">ⓘ</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Input */}
        <View className="mb-6">
          <Text className="text-[#E0E0E0] text-base mb-2 font-medium">
            Your Budget:
          </Text>
          <View className="flex-row items-center bg-[#1A1A2E] rounded-lg border border-[#2E2E3F] px-4">
            <Text className="text-[#00FFFF] text-lg font-bold mr-1">
              $
            </Text>
            {/* TextInput would go here */}
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity className="bg-[#00FFFF] py-4 rounded-lg mb-6">
          <Text className="text-[#0A0A0F] text-base font-bold text-center">
            Get Smart Recommendations
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/**
 * Example 7: Utility Classes Showcase
 */
export function UtilityClassesExample() {
  return (
    <View className="p-4">
      {/* Spacing */}
      <View className="mb-4">
        <Text className="text-white mb-2">Spacing: m-4, p-4, gap-2</Text>
      </View>

      {/* Flexbox */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white">Flex Item 1</Text>
        <Text className="text-white">Flex Item 2</Text>
      </View>

      {/* Colors */}
      <View className="bg-blue-500 p-4 rounded-lg mb-4">
        <Text className="text-white">Tailwind color: bg-blue-500</Text>
      </View>

      {/* Custom colors */}
      <View className="bg-[#00FFFF] p-4 rounded-lg mb-4">
        <Text className="text-[#0A0A0F]">Custom color: bg-[#00FFFF]</Text>
      </View>

      {/* Typography */}
      <View className="mb-4">
        <Text className="text-xs text-white">Extra Small (text-xs)</Text>
        <Text className="text-sm text-white">Small (text-sm)</Text>
        <Text className="text-base text-white">Base (text-base)</Text>
        <Text className="text-lg text-white">Large (text-lg)</Text>
        <Text className="text-xl text-white">Extra Large (text-xl)</Text>
        <Text className="text-2xl text-white">2XL (text-2xl)</Text>
      </View>

      {/* Font Weights */}
      <View className="mb-4">
        <Text className="font-light text-white">Light (font-light)</Text>
        <Text className="font-normal text-white">Normal (font-normal)</Text>
        <Text className="font-medium text-white">Medium (font-medium)</Text>
        <Text className="font-semibold text-white">Semibold (font-semibold)</Text>
        <Text className="font-bold text-white">Bold (font-bold)</Text>
      </View>

      {/* Borders */}
      <View className="border border-[#00FFFF] rounded-lg p-4 mb-4">
        <Text className="text-white">Border + Rounded</Text>
      </View>

      {/* Opacity */}
      <View className="bg-[#00FFFF]/10 p-4 rounded-lg mb-4">
        <Text className="text-[#00FFFF]">10% opacity background</Text>
      </View>

      {/* Shadow (iOS only) */}
      <View className="ios:shadow-xl bg-white p-4 rounded-lg">
        <Text>Shadow on iOS</Text>
      </View>
    </View>
  );
}

/**
 * Migration Checklist for your app:
 *
 * 1. Install dependencies:
 *    npm install nativewind
 *    npm install --save-dev tailwindcss@3.4.0
 *
 * 2. Create tailwind.config.js:
 *    npx tailwindcss init
 *
 * 3. Update babel.config.js:
 *    Add: plugins: ['nativewind/babel']
 *
 * 4. Update app.json:
 *    Add PostCSS configuration
 *
 * 5. Create global.css with Tailwind directives
 *
 * 6. Import in App.tsx:
 *    import './global.css'
 *
 * 7. Start migrating components:
 *    - Replace StyleSheet with className
 *    - Use styled() HOC for components
 *    - Test and verify
 *
 * 8. Benefits you'll see:
 *    - 50-70% less code in component files
 *    - Faster development (no switching between style object and JSX)
 *    - Better consistency (design tokens from Tailwind)
 *    - Easier responsive design
 *    - Better dark mode support
 */

export default function NativeWindExamplesScreen() {
  return (
    <ScrollView className="flex-1 bg-[#0A0A0F]">
      <View className="p-5">
        <Text className="text-[#00FFFF] text-2xl font-bold mb-6">
          NativeWind Examples
        </Text>

        <Text className="text-[#E0E0E0] text-base mb-4">
          See components above for before/after comparisons
        </Text>

        <RecommendationCardNativeWind />
        <ButtonExample />
      </View>
    </ScrollView>
  );
}
