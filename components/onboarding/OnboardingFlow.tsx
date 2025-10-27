import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingScreen {
  id: number;
  icon: string;
  title: string;
  description: string;
  highlight: string;
}

const ONBOARDING_SCREENS: OnboardingScreen[] = [
  {
    id: 1,
    icon: '🎯',
    title: 'Maximize Your Scratch-Off Wins',
    description: 'Scratch Oracle analyzes lottery data in real-time to help you make smarter choices about which tickets to buy.',
    highlight: 'Data-driven recommendations',
  },
  {
    id: 2,
    icon: '🧮',
    title: 'Expected Value (EV) Scores',
    description: 'Our algorithm calculates the mathematical expected value of each game based on remaining prizes and odds.',
    highlight: 'Know the real value before you buy',
  },
  {
    id: 3,
    icon: '🛡️',
    title: 'Play Responsibly',
    description: 'Gambling should be fun, not a problem. We provide tools to help you stay in control and play responsibly.',
    highlight: '18+ only • Free help available 24/7',
  },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentScreen < ONBOARDING_SCREENS.length - 1) {
      const nextScreen = currentScreen + 1;
      setCurrentScreen(nextScreen);
      scrollViewRef.current?.scrollTo({
        x: nextScreen * width,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentScreen(index);
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Scrollable Screens */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {ONBOARDING_SCREENS.map((screen) => (
          <View key={screen.id} style={styles.screen}>
            <View style={styles.content}>
              {/* Icon */}
              <Text style={styles.icon}>{screen.icon}</Text>

              {/* Title */}
              <Text style={styles.title}>{screen.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{screen.description}</Text>

              {/* Highlight Badge */}
              <View style={styles.highlightBadge}>
                <Text style={styles.highlightText}>{screen.highlight}</Text>
              </View>

              {/* Special content for last screen */}
              {screen.id === 3 && (
                <View style={styles.helplineContainer}>
                  <Text style={styles.helplineLabel}>Need Help?</Text>
                  <Text style={styles.helplineNumber}>1-800-333-HOPE (4673)</Text>
                  <Text style={styles.helplineSubtext}>
                    Minnesota Problem Gambling Helpline
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {ONBOARDING_SCREENS.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Next/Get Started Button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentScreen === ONBOARDING_SCREENS.length - 1
            ? 'Get Started'
            : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#708090',
    fontSize: 16,
    fontWeight: '600',
  },
  screen: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    fontSize: 96,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 36,
  },
  description: {
    fontSize: 18,
    color: '#B0B0C0',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  highlightBadge: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  highlightText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  helplineContainer: {
    marginTop: 40,
    padding: 24,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00FFFF',
    width: '100%',
  },
  helplineLabel: {
    color: '#00FFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helplineNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  helplineSubtext: {
    color: '#708090',
    fontSize: 12,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    marginHorizontal: 4,
  },
  nextButton: {
    position: 'absolute',
    bottom: 40,
    left: 32,
    right: 32,
    backgroundColor: '#00FF00',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#0A0A0F',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
