import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AIScoreBadgeProps {
  score: number; // 0-100
  size?: 'small' | 'medium' | 'large';
}

/**
 * AI Score Badge Component
 *
 * Displays AI prediction score with color coding:
 * - 80-100 (Green): Strong Buy
 * - 60-79 (Blue): Good
 * - 40-59 (Yellow): Fair
 * - 0-39 (Red): Avoid
 */
export function AIScoreBadge({ score, size = 'medium' }: AIScoreBadgeProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#00FF7F'; // Spring Green - Strong Buy
    if (score >= 60) return '#00BFFF'; // Deep Sky Blue - Good
    if (score >= 40) return '#FFD700'; // Gold - Fair
    return '#FF4500'; // Orange Red - Avoid
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Strong Buy';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Avoid';
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 8, paddingVertical: 4 },
      score: { fontSize: 16 },
      label: { fontSize: 10 },
    },
    medium: {
      container: { paddingHorizontal: 12, paddingVertical: 6 },
      score: { fontSize: 20 },
      label: { fontSize: 11 },
    },
    large: {
      container: { paddingHorizontal: 16, paddingVertical: 8 },
      score: { fontSize: 24 },
      label: { fontSize: 12 },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container, { borderColor: scoreColor }]}>
      <Text style={[styles.scoreText, currentSize.score, { color: scoreColor }]}>
        {Math.round(score)}
      </Text>
      <Text style={[styles.labelText, currentSize.label, { color: scoreColor }]}>
        {scoreLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  scoreText: {
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  labelText: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
