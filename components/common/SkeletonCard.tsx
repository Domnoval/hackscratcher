// Skeleton loading component for game cards
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Skeleton Card - Animated loading placeholder
 * Shows while game data is being fetched
 * Provides better UX than spinners by showing layout structure
 */
export function SkeletonGameCard() {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create infinite pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnimation]);

  // Interpolate opacity for shimmer effect
  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      {/* Header - Game name and price */}
      <View style={styles.header}>
        <Animated.View style={[styles.skeletonLine, styles.title, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.price, { opacity }]} />
      </View>

      {/* EV Container */}
      <Animated.View style={[styles.skeletonLine, styles.evBox, { opacity }]} />

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <Animated.View style={[styles.skeletonLine, styles.metric, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.metric, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.metric, { opacity }]} />
      </View>

      {/* Reasons */}
      <View style={styles.reasonsContainer}>
        <Animated.View style={[styles.skeletonLine, styles.reason, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.reason, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.reason, { opacity }]} />
      </View>
    </View>
  );
}

/**
 * Multiple Skeleton Cards - Shows 3 loading cards
 * Use while fetching initial recommendations
 */
export function SkeletonGameCardList() {
  return (
    <View>
      <SkeletonGameCard />
      <SkeletonGameCard />
      <SkeletonGameCard />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonLine: {
    backgroundColor: '#2E2E3F',
    borderRadius: 4,
  },
  title: {
    height: 20,
    width: '60%',
  },
  price: {
    height: 20,
    width: 50,
  },
  evBox: {
    height: 50,
    width: '100%',
    marginBottom: 12,
    borderRadius: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    height: 40,
    width: '30%',
  },
  reasonsContainer: {
    marginTop: 8,
  },
  reason: {
    height: 16,
    width: '90%',
    marginBottom: 6,
  },
});
