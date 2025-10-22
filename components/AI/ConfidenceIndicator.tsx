import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-100
  showLabel?: boolean;
}

/**
 * Confidence Indicator Component
 *
 * Shows how confident the AI is in its prediction
 * - 70-100: High (3 bars, green)
 * - 40-69: Medium (2 bars, yellow)
 * - 0-39: Low (1 bar, red)
 */
export function ConfidenceIndicator({ confidence, showLabel = true }: ConfidenceIndicatorProps) {
  const getConfidenceLevel = (conf: number): 'low' | 'medium' | 'high' => {
    if (conf >= 70) return 'high';
    if (conf >= 40) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'high': return '#00FF7F'; // Green
      case 'medium': return '#FFD700'; // Gold
      case 'low': return '#FF4500'; // Red
    }
  };

  const getConfidenceLabel = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'high': return 'High Confidence';
      case 'medium': return 'Medium Confidence';
      case 'low': return 'Low Confidence';
    }
  };

  const level = getConfidenceLevel(confidence);
  const color = getConfidenceColor(level);
  const label = getConfidenceLabel(level);
  const barCount = level === 'high' ? 3 : level === 'medium' ? 2 : 1;

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {[1, 2, 3].map((bar) => (
          <View
            key={bar}
            style={[
              styles.bar,
              bar <= barCount && { backgroundColor: color },
              bar > barCount && styles.inactiveBar,
            ]}
          />
        ))}
      </View>
      {showLabel && (
        <Text style={[styles.label, { color }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'flex-end',
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  inactiveBar: {
    backgroundColor: '#2E2E3F',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

// Different bar heights for visual appeal
StyleSheet.create({
  bar: {
    width: 4,
    borderRadius: 2,
  },
});

// Update bar component to have different heights
const BAR_HEIGHTS = [12, 16, 20]; // Small, medium, large

export function ConfidenceIndicatorWithHeights({ confidence, showLabel = true }: ConfidenceIndicatorProps) {
  const getConfidenceLevel = (conf: number): 'low' | 'medium' | 'high' => {
    if (conf >= 70) return 'high';
    if (conf >= 40) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'high': return '#00FF7F';
      case 'medium': return '#FFD700';
      case 'low': return '#FF4500';
    }
  };

  const getConfidenceLabel = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'high': return 'High Confidence';
      case 'medium': return 'Medium Confidence';
      case 'low': return 'Low Confidence';
    }
  };

  const level = getConfidenceLevel(confidence);
  const color = getConfidenceColor(level);
  const label = getConfidenceLabel(level);
  const barCount = level === 'high' ? 3 : level === 'medium' ? 2 : 1;

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {BAR_HEIGHTS.map((height, index) => {
          const barNumber = index + 1;
          const isActive = barNumber <= barCount;
          return (
            <View
              key={barNumber}
              style={[
                {
                  width: 4,
                  height: height,
                  borderRadius: 2,
                  backgroundColor: isActive ? color : '#2E2E3F',
                },
              ]}
            />
          );
        })}
      </View>
      {showLabel && (
        <Text style={[styles.label, { color }]}>
          {label}
        </Text>
      )}
    </View>
  );
}
