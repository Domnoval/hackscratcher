import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

/**
 * Skeleton loader for recommendation cards
 *
 * Shows a placeholder while recommendation data is loading
 */
export function RecommendationCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Title and Price Row */}
      <View style={styles.headerRow}>
        <SkeletonLoader width="60%" height={24} borderRadius={4} />
        <SkeletonLoader width="20%" height={24} borderRadius={4} />
      </View>

      {/* Coming Soon Badge */}
      <SkeletonLoader width="80%" height={40} borderRadius={8} style={styles.badge} />

      {/* Game Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <SkeletonLoader width="40%" height={16} borderRadius={4} />
          <SkeletonLoader width="30%" height={16} borderRadius={4} />
        </View>
        <View style={styles.infoRow}>
          <SkeletonLoader width="35%" height={16} borderRadius={4} />
          <SkeletonLoader width="40%" height={16} borderRadius={4} />
        </View>
        <View style={styles.infoRow}>
          <SkeletonLoader width="30%" height={16} borderRadius={4} />
          <SkeletonLoader width="25%" height={16} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

/**
 * Renders multiple skeleton cards
 */
export function RecommendationSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <RecommendationCardSkeleton key={index} />
      ))}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    marginBottom: 16,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    paddingTop: 16,
  },
});
