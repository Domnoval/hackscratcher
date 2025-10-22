import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type RecommendationType = 'strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid';

interface RecommendationChipProps {
  recommendation: RecommendationType;
  size?: 'small' | 'medium';
}

/**
 * Recommendation Chip Component
 *
 * Visual chip showing AI recommendation:
 * - strong_buy: "Hot Pick" (fire emoji, green)
 * - buy: "Recommended" (checkmark, blue)
 * - neutral: "Neutral" (dash, gray)
 * - avoid: "Pass" (warning, red)
 * - strong_avoid: "Avoid" (stop sign, dark red)
 */
export function RecommendationChip({ recommendation, size = 'medium' }: RecommendationChipProps) {
  const config = {
    strong_buy: {
      label: 'Hot Pick',
      emoji: '🔥',
      color: '#00FF7F',
      backgroundColor: 'rgba(0, 255, 127, 0.15)',
    },
    buy: {
      label: 'Recommended',
      emoji: '✅',
      color: '#00BFFF',
      backgroundColor: 'rgba(0, 191, 255, 0.15)',
    },
    neutral: {
      label: 'Neutral',
      emoji: '➖',
      color: '#708090',
      backgroundColor: 'rgba(112, 128, 144, 0.15)',
    },
    avoid: {
      label: 'Pass',
      emoji: '⚠️',
      color: '#FF4500',
      backgroundColor: 'rgba(255, 69, 0, 0.15)',
    },
    strong_avoid: {
      label: 'Avoid',
      emoji: '🛑',
      color: '#DC143C',
      backgroundColor: 'rgba(220, 20, 60, 0.15)',
    },
  };

  const { label, emoji, color, backgroundColor } = config[recommendation];

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 8, paddingVertical: 4 },
      text: { fontSize: 11 },
      emoji: { fontSize: 12 },
    },
    medium: {
      container: { paddingHorizontal: 12, paddingVertical: 6 },
      text: { fontSize: 12 },
      emoji: { fontSize: 14 },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        currentSize.container,
        { backgroundColor, borderColor: color },
      ]}
    >
      <Text style={[styles.emoji, currentSize.emoji]}>{emoji}</Text>
      <Text style={[styles.label, currentSize.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  emoji: {
    lineHeight: 16,
  },
  label: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
