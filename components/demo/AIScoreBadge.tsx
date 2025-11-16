/**
 * AI Score Badge Component
 * Created with: artifacts-builder skill
 * Demonstrates React component generation for Scratch Oracle
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AIScoreBadgeProps {
  score: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

/**
 * Displays an AI prediction score with color-coded visual feedback
 *
 * @param score - AI prediction score (0-100)
 * @param size - Badge size variant
 * @param showLabel - Whether to show "AI Score" label
 *
 * Color Scheme:
 * - 80-100: Green (Strong Buy)
 * - 60-79: Blue (Good)
 * - 40-59: Yellow (Fair)
 * - 0-39: Red (Avoid)
 */
export const AIScoreBadge: React.FC<AIScoreBadgeProps> = ({
  score,
  size = 'medium',
  showLabel = true,
}) => {
  // Validation
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color based on score
  const getScoreColor = (s: number): string => {
    if (s >= 80) return '#10b981'; // Green - Strong Buy
    if (s >= 60) return '#3b82f6'; // Blue - Good
    if (s >= 40) return '#f59e0b'; // Yellow - Fair
    return '#ef4444'; // Red - Avoid
  };

  // Determine recommendation text
  const getRecommendation = (s: number): string => {
    if (s >= 80) return 'Strong Buy';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    return 'Avoid';
  };

  // Size configurations
  const sizeConfig = {
    small: { badgeSize: 50, fontSize: 16, labelFontSize: 10 },
    medium: { badgeSize: 70, fontSize: 24, labelFontSize: 12 },
    large: { badgeSize: 90, fontSize: 32, labelFontSize: 14 },
  };

  const config = sizeConfig[size];
  const scoreColor = getScoreColor(clampedScore);
  const recommendation = getRecommendation(clampedScore);

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={[styles.label, { fontSize: config.labelFontSize }]}>
          AI Score
        </Text>
      )}

      {/* Circular Badge */}
      <View
        style={[
          styles.badge,
          {
            width: config.badgeSize,
            height: config.badgeSize,
            borderRadius: config.badgeSize / 2,
            backgroundColor: scoreColor,
          },
        ]}
      >
        <Text
          style={[
            styles.scoreText,
            { fontSize: config.fontSize },
          ]}
        >
          {clampedScore}
        </Text>
      </View>

      {/* Recommendation Text */}
      {showLabel && (
        <Text
          style={[
            styles.recommendation,
            { fontSize: config.labelFontSize, color: scoreColor },
          ]}
        >
          {recommendation}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  label: {
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recommendation: {
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default AIScoreBadge;

/**
 * Usage Examples:
 *
 * // Basic usage
 * <AIScoreBadge score={85} />
 *
 * // Small badge without label
 * <AIScoreBadge score={72} size="small" showLabel={false} />
 *
 * // Large badge with full details
 * <AIScoreBadge score={45} size="large" />
 *
 * // In a game card
 * <View style={styles.gameCard}>
 *   <Text>{game.name}</Text>
 *   <AIScoreBadge score={game.aiScore} size="medium" />
 * </View>
 */
