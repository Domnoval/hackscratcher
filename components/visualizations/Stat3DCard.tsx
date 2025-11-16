/**
 * 3D Stat Card Component
 * Interactive 3D visualization for lottery game statistics
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';

interface Stat3DCardProps {
  label: string;
  value: string | number;
  color: string;
  icon?: string;
  onPress?: () => void;
  positive?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 3; // 3 cards per row with padding

export function Stat3DCard({ label, value, color, icon, onPress, positive }: Stat3DCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedRotateX = useRef(new Animated.Value(0)).current;
  const animatedRotateY = useRef(new Animated.Value(0)).current;
  const animatedGlow = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsPressed(true);

    // Parallel animations for press effect
    Animated.parallel([
      // Scale down
      Animated.spring(animatedScale, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 3,
        tension: 40,
      }),
      // 3D flip effect
      Animated.spring(animatedRotateX, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
        tension: 40,
      }),
      // Glow effect
      Animated.timing(animatedGlow, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);

    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
        tension: 40,
      }),
      Animated.spring(animatedRotateX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 3,
        tension: 40,
      }),
      Animated.timing(animatedGlow, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (onPress) onPress();
    });
  };

  // Continuous floating animation
  const floatAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const rotateX = animatedRotateX.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  const glowOpacity = animatedGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const shadowColor = positive === true ? '#10b981' : positive === false ? '#ef4444' : color;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: color,
            transform: [
              { translateY: floatTranslateY },
              { scale: animatedScale },
              { perspective: 1000 },
              { rotateX },
            ],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              backgroundColor: shadowColor,
            },
          ]}
        />

        {/* Glass morphism overlay */}
        <View style={styles.glassOverlay} />

        {/* Content */}
        <View style={styles.content}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>

        {/* 3D highlight effect */}
        <View style={styles.highlight} />

        {/* Shimmer effect */}
        <View style={styles.shimmer} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: CARD_WIDTH,
    maxWidth: CARD_WIDTH + 20,
  },
  card: {
    minHeight: 100,
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 20,
    zIndex: -1,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
});
