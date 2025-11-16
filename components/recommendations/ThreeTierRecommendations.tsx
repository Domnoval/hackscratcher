/**
 * Three-Tier Recommendations Component
 * Displays SAFE, MODERATE, and INSANE recommendations with interactive stats
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Stat3DCard } from '../visualizations/Stat3DCard';

interface ThreeTierRecommendation {
  safe: any[];
  moderate: any[];
  insane: any[];
}

interface Props {
  recommendations: ThreeTierRecommendation;
  onGameSelect: (game: any) => void;
}

export function ThreeTierRecommendations({ recommendations, onGameSelect }: Props) {
  const [selectedTier, setSelectedTier] = useState<'safe' | 'moderate' | 'insane'>('moderate');
  const [showExplainer, setShowExplainer] = useState<string | null>(null);

  const tierConfig = {
    safe: {
      title: '🛡️ SAFE PICKS',
      subtitle: 'Low Risk, Consistent Returns',
      color: '#10b981', // green
      bgColor: '#d1fae5',
      description: 'Conservative picks with lower volatility and better win rates',
    },
    moderate: {
      title: '⚖️ MODERATE PICKS',
      subtitle: 'Balanced Risk/Reward',
      color: '#3b82f6', // blue
      bgColor: '#dbeafe',
      description: 'Best overall value with balanced risk and upside potential',
    },
    insane: {
      title: '🚀 INSANE PICKS',
      subtitle: 'High Risk, Massive Prizes',
      color: '#ef4444', // red
      bgColor: '#fee2e2',
      description: 'Maximum upside with huge top prizes - accept high volatility',
    },
  };

  const getCurrentRecommendations = () => {
    const recs = recommendations[selectedTier] || [];
    console.log(`[ThreeTierRecs] ${selectedTier} tier has ${recs.length} games`);
    recs.forEach((rec, i) => {
      console.log(`[ThreeTierRecs] ${selectedTier}[${i}]: ${rec.game.name} - Price: ${rec.game.price}`);
    });
    return recs;
  };

  return (
    <View style={styles.container}>
      {/* Tier Selector */}
      <View style={styles.tierSelector}>
        {(Object.keys(tierConfig) as Array<keyof typeof tierConfig>).map(tier => (
          <TouchableOpacity
            key={tier}
            style={[
              styles.tierButton,
              selectedTier === tier && {
                backgroundColor: tierConfig[tier].color,
                borderColor: tierConfig[tier].color,
              },
            ]}
            onPress={() => setSelectedTier(tier)}
          >
            <Text
              style={[
                styles.tierButtonText,
                selectedTier === tier && styles.tierButtonTextActive,
              ]}
            >
              {tierConfig[tier].title}
            </Text>
            <Text
              style={[
                styles.tierSubtext,
                selectedTier === tier && styles.tierSubtextActive,
              ]}
            >
              {tierConfig[tier].subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tier Description */}
      <View style={[styles.tierDescription, { backgroundColor: tierConfig[selectedTier].bgColor }]}>
        <Text style={[styles.tierDescText, { color: tierConfig[selectedTier].color }]}>
          {tierConfig[selectedTier].description}
        </Text>
      </View>

      {/* Recommendations List */}
      <ScrollView style={styles.recommendationsList}>
        {getCurrentRecommendations().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No games found for this tier at your budget</Text>
          </View>
        ) : (
          getCurrentRecommendations().map((rec, index) => (
            <GameCard
              key={rec.gameId}
              recommendation={rec}
              rank={index + 1}
              tierColor={tierConfig[selectedTier].color}
              onPress={() => onGameSelect(rec.game)}
              onStatPress={(statName: string) => setShowExplainer(statName)}
            />
          ))
        )}
      </ScrollView>

      {/* Statistics Explainer Modal */}
      {showExplainer && (
        <StatExplainerModal
          statName={showExplainer}
          onClose={() => setShowExplainer(null)}
        />
      )}
    </View>
  );
}

// Game Card Component
function GameCard({ recommendation, rank, tierColor, onPress, onStatPress }: any) {
  return (
    <TouchableOpacity style={styles.gameCard} onPress={onPress}>
      {/* Rank Badge */}
      <View style={[styles.rankBadge, { backgroundColor: tierColor }]}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <Text style={styles.gameName}>{recommendation.game.name}</Text>
        <Text style={styles.gamePrice}>${recommendation.game.price}</Text>
      </View>

      {/* Interactive 3D Stats Row */}
      <View style={styles.statsRow}>
        <Stat3DCard
          label="EV"
          value={`$${recommendation.ev.adjustedEV.toFixed(2)}`}
          color={recommendation.ev.adjustedEV >= 0 ? '#10b981' : '#ef4444'}
          icon={recommendation.ev.adjustedEV >= 0 ? '📈' : '📉'}
          onPress={() => onStatPress('ev')}
          positive={recommendation.ev.adjustedEV >= 0}
        />

        <Stat3DCard
          label="Sharpe"
          value={recommendation.riskMetrics.sharpeRatio.toFixed(2)}
          color={recommendation.riskMetrics.sharpeRatio > 0 ? '#3b82f6' : '#94a3b8'}
          icon="⚖️"
          onPress={() => onStatPress('sharpe')}
        />

        <Stat3DCard
          label="Win %"
          value={`${(recommendation.riskMetrics.winRate * 100).toFixed(1)}%`}
          color="#8b5cf6"
          icon="🎯"
          onPress={() => onStatPress('winRate')}
        />
      </View>

      {/* Reasons */}
      <View style={styles.reasonsContainer}>
        {recommendation.reasons.map((reason: string, idx: number) => (
          <Text key={idx} style={styles.reasonText}>• {reason}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// Statistics Explainer Modal
function StatExplainerModal({ statName, onClose }: { statName: string; onClose: () => void }) {
  const explainers: Record<string, { title: string; explanation: string; formula: string; interpretation: string }> = {
    ev: {
      title: 'Expected Value (EV)',
      explanation: 'The average amount you can expect to win or lose per ticket, based on exact hypergeometric probability calculations.',
      formula: 'EV = Σ(Prize × Probability) - Ticket Cost',
      interpretation: 'Positive EV = Good value. Negative EV = Expected loss. A $5 ticket with +$0.50 EV means you get back $5.50 on average.',
    },
    sharpe: {
      title: 'Sharpe Ratio',
      explanation: 'Measures risk-adjusted return - how much return you get per unit of risk. Used by hedge funds to evaluate investments.',
      formula: 'Sharpe = (Expected Return - Risk-Free Rate) / Standard Deviation',
      interpretation: '< 0 = Poor. 0-0.5 = Weak. 0.5-1.0 = Acceptable. 1.0+ = Good. 2.0+ = Excellent (rare in lottery).',
    },
    winRate: {
      title: 'Win Rate (Any Prize)',
      explanation: 'Probability of winning ANY prize (including small prizes). Calculated using hypergeometric distribution.',
      formula: 'P(win) = 1 - P(lose all prizes)',
      interpretation: '25% win rate = 1 in 4 tickets wins something. Higher win rate = more frequent small wins.',
    },
    variance: {
      title: 'Variance & Volatility',
      explanation: 'How much returns vary from the expected value. Higher variance = bigger swings (rare big wins or common losses).',
      formula: 'Variance = E[X²] - (E[X])²',
      interpretation: 'Low variance = consistent returns. High variance = lottery-like (rare huge wins).',
    },
    kelly: {
      title: 'Kelly Criterion',
      explanation: 'Optimal bet size to maximize long-term growth while minimizing ruin risk. Used by professional gamblers and traders.',
      formula: 'f* = (bp - q) / b',
      interpretation: 'Tells you what % of bankroll to bet. We use 25% of full Kelly for safety.',
    },
  };

  const info = explainers[statName] || explainers.ev;

  return (
    <Modal visible transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.explainerCard}>
          <Text style={styles.explainerTitle}>{info.title}</Text>

          <Text style={styles.explainerLabel}>What it is:</Text>
          <Text style={styles.explainerText}>{info.explanation}</Text>

          <Text style={styles.explainerLabel}>Formula:</Text>
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>{info.formula}</Text>
          </View>

          <Text style={styles.explainerLabel}>How to interpret:</Text>
          <Text style={styles.explainerText}>{info.interpretation}</Text>

          <TouchableOpacity style={styles.gotItButton} onPress={onClose}>
            <Text style={styles.gotItText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tierSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tierButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  tierButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 2,
  },
  tierButtonTextActive: {
    color: '#ffffff',
  },
  tierSubtext: {
    fontSize: 10,
    color: '#9ca3af',
  },
  tierSubtextActive: {
    color: '#ffffff',
    opacity: 0.9,
  },
  tierDescription: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  tierDescText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  recommendationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  gameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  gameInfo: {
    marginBottom: 12,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  gamePrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3b82f6',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statPositive: {
    color: '#10b981',
  },
  statNegative: {
    color: '#ef4444',
  },
  reasonsContainer: {
    gap: 4,
  },
  reasonText: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 18,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  explainerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  explainerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  explainerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  explainerText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  formulaBox: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#111827',
  },
  gotItButton: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  gotItText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
