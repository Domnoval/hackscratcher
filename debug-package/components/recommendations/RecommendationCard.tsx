import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Recommendation } from '../../types/lottery';
import { WinTracker } from '../tracking';

interface RecommendationCardProps {
  item: Recommendation;
  index: number;
}

/**
 * Memoized Recommendation Card Component
 *
 * Prevents unnecessary re-renders for better performance
 */
const RecommendationCardComponent = ({ item, index }: RecommendationCardProps) => {
  return (
    <View style={styles.recommendationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.gameTitle}>#{index + 1} {item.game.name}</Text>
          <Text style={styles.gamePrice}>${item.game.price}</Text>
        </View>

        {/* AI COMING SOON Badge */}
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>🤖 AI Predictions Coming Soon</Text>
          <Text style={styles.comingSoonSubtext}>Collecting data to train model...</Text>
        </View>
      </View>

      {/* Basic Game Info */}
      <View style={styles.gameInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ticket Price:</Text>
          <Text style={styles.infoValue}>${item.game.price}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Overall Odds:</Text>
          <Text style={styles.infoValue}>{item.game.overall_odds}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, { color: '#00FF7F' }]}>{item.game.status}</Text>
        </View>
      </View>

      {/* Win Tracking - Help us improve! */}
      <WinTracker
        gameId={item.gameId}
        gameName={item.game.name}
        gamePrice={item.game.price}
      />
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const RecommendationCard = memo(RecommendationCardComponent, (prevProps, nextProps) => {
  // Only re-render if the game ID or index changes
  return prevProps.item.gameId === nextProps.item.gameId &&
         prevProps.index === nextProps.index;
});

const styles = StyleSheet.create({
  recommendationCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameTitle: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  gamePrice: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00BFFF',
    marginTop: 8,
  },
  comingSoonText: {
    color: '#00BFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  comingSoonSubtext: {
    color: '#708090',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  gameInfo: {
    marginTop: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#708090',
    fontSize: 13,
  },
  infoValue: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '500',
  },
});
