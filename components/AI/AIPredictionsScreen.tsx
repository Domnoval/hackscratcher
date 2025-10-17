import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated
} from 'react-native';
import { AIPredictionEngine } from '../../services/ai/aiPredictionEngine';
import { HotTicketPrediction, AIInsight, PredictionAccuracy } from '../../types/ai';

export default function AIPredictionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'24h' | '48h' | '7d'>('24h');
  const [predictions, setPredictions] = useState<HotTicketPrediction[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [accuracy, setAccuracy] = useState<PredictionAccuracy | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadPredictions();
    startPulseAnimation();
  }, [timeframe]);

  const loadPredictions = async () => {
    try {
      const [preds, insightData, accuracyData] = await Promise.all([
        AIPredictionEngine.predictHotTickets(timeframe),
        AIPredictionEngine.generateInsights(),
        AIPredictionEngine.trackAccuracy()
      ]);

      setPredictions(preds);
      setInsights(insightData);
      setAccuracy(accuracyData);
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPredictions();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const getRecommendationColor = (rec: string): string => {
    if (rec === 'buy_now') return '#00FF7F';
    if (rec === 'avoid') return '#FF4500';
    return '#FFD700';
  };

  const getRecommendationText = (rec: string): string => {
    if (rec === 'buy_now') return '✅ BUY NOW';
    if (rec === 'avoid') return '❌ AVOID';
    return '⏸️ WAIT';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#00FF7F';
    if (confidence >= 60) return '#FFD700';
    if (confidence >= 40) return '#FFA500';
    return '#708090';
  };

  const getPriorityIcon = (priority: string): string => {
    if (priority === 'high') return '🔴';
    if (priority === 'medium') return '🟡';
    return '🟢';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Animated.Text style={[styles.loadingIcon, { transform: [{ scale: pulseAnim }] }]}>
          🤖
        </Animated.Text>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.loadingText}>AI analyzing patterns...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFFF" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Animated.Text style={[styles.aiIcon, { transform: [{ scale: pulseAnim }] }]}>
          🤖
        </Animated.Text>
        <Text style={styles.headerTitle}>AI Predictions</Text>
        <Text style={styles.headerSubtitle}>Machine Learning Hot Ticket Analysis</Text>
      </View>

      {/* Accuracy Badge */}
      {accuracy && (
        <View style={styles.accuracyCard}>
          <Text style={styles.accuracyLabel}>Model Accuracy</Text>
          <Text style={styles.accuracyValue}>{(accuracy.accuracy * 100).toFixed(1)}%</Text>
          <Text style={styles.accuracySubtext}>
            Based on {accuracy.totalPredictions} predictions
          </Text>
        </View>
      )}

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === '24h' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('24h')}
        >
          <Text style={[styles.timeframeText, timeframe === '24h' && styles.timeframeTextActive]}>
            24 Hours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === '48h' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('48h')}
        >
          <Text style={[styles.timeframeText, timeframe === '48h' && styles.timeframeTextActive]}>
            48 Hours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === '7d' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('7d')}
        >
          <Text style={[styles.timeframeText, timeframe === '7d' && styles.timeframeTextActive]}>
            7 Days
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Insights */}
      {insights.length > 0 && (
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>💡 AI Insights</Text>
          {insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightCard,
                insight.type === 'opportunity' && styles.opportunityCard,
                insight.type === 'warning' && styles.warningCard
              ]}
            >
              <View style={styles.insightHeader}>
                <Text style={styles.insightPriority}>{getPriorityIcon(insight.priority)}</Text>
                <Text style={styles.insightTitle}>{insight.title}</Text>
              </View>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              {insight.affectedGames.length > 0 && insight.affectedGames.length <= 3 && (
                <Text style={styles.insightGames}>
                  Games: {insight.affectedGames.join(', ')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Predictions */}
      <View style={styles.predictionsSection}>
        <Text style={styles.sectionTitle}>🎯 Hot Ticket Predictions</Text>

        {predictions.map((pred, index) => (
          <View key={pred.gameId} style={styles.predictionCard}>
            {/* Rank Badge */}
            {index < 3 && (
              <View style={[styles.rankBadge, index === 0 && styles.rank1Badge]}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
            )}

            {/* Game Header */}
            <View style={styles.predHeader}>
              <Text style={styles.predGameName}>{pred.gameName}</Text>
              <View
                style={[
                  styles.recBadge,
                  { backgroundColor: getRecommendationColor(pred.recommendation) }
                ]}
              >
                <Text style={styles.recText}>{getRecommendationText(pred.recommendation)}</Text>
              </View>
            </View>

            {/* Hotness Comparison */}
            <View style={styles.hotnessComparison}>
              <View style={styles.hotnessItem}>
                <Text style={styles.hotnessLabel}>Current</Text>
                <Text style={styles.hotnessValue}>{pred.currentHotness}%</Text>
              </View>
              <Text style={styles.hotnessArrow}>→</Text>
              <View style={styles.hotnessItem}>
                <Text style={styles.hotnessLabel}>Predicted ({pred.timeframe})</Text>
                <Text
                  style={[
                    styles.hotnessValue,
                    { color: pred.predictedHotness > pred.currentHotness ? '#00FF7F' : '#FF4500' }
                  ]}
                >
                  {pred.predictedHotness}%
                </Text>
              </View>
            </View>

            {/* Confidence */}
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${pred.confidence}%`,
                      backgroundColor: getConfidenceColor(pred.confidence)
                    }
                  ]}
                />
              </View>
              <Text style={[styles.confidenceText, { color: getConfidenceColor(pred.confidence) }]}>
                {pred.confidence}%
              </Text>
            </View>

            {/* Signals */}
            {pred.signals.length > 0 && (
              <View style={styles.signalsContainer}>
                <Text style={styles.signalsLabel}>🔔 Active Signals</Text>
                {pred.signals.map((signal, idx) => (
                  <View key={idx} style={styles.signalItem}>
                    <View
                      style={[
                        styles.signalDot,
                        { backgroundColor: signal.direction === 'positive' ? '#00FF7F' : '#FF4500' }
                      ]}
                    />
                    <Text style={styles.signalText}>{signal.description}</Text>
                    <Text style={styles.signalStrength}>
                      {(signal.strength * 100).toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Reasoning */}
            <View style={styles.reasoningContainer}>
              <Text style={styles.reasoningLabel}>📊 Analysis</Text>
              {pred.reasoning.map((reason, idx) => (
                <Text key={idx} style={styles.reasoningText}>
                  • {reason}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksCard}>
        <Text style={styles.howItWorksTitle}>🧠 How AI Predictions Work</Text>
        <Text style={styles.howItWorksText}>
          Our AI engine analyzes multiple data sources:
        </Text>
        <Text style={styles.howItWorksBullet}>
          • 📈 Prize claim velocity and trends
        </Text>
        <Text style={styles.howItWorksBullet}>
          • 🔍 Historical pattern matching
        </Text>
        <Text style={styles.howItWorksBullet}>
          • 🌙 Mystical factors (moon phases)
        </Text>
        <Text style={styles.howItWorksBullet}>
          • 📊 EV trajectory analysis
        </Text>
        <Text style={styles.howItWorksBullet}>
          • 🏪 Store clustering patterns
        </Text>
        <Text style={styles.howItWorksFooter}>
          Predictions improve over time as the model learns from real outcomes.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🤖 AI predictions are data-driven insights, not guarantees. Always gamble responsibly!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  loadingText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  aiIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9370DB',
  },
  accuracyCard: {
    backgroundColor: '#1A2E1A',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FF7F',
  },
  accuracyLabel: {
    fontSize: 12,
    color: '#00FF7F',
    marginBottom: 4,
  },
  accuracyValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FF7F',
    marginBottom: 4,
  },
  accuracySubtext: {
    fontSize: 10,
    color: '#708090',
  },
  timeframeContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#00FFFF',
  },
  timeframeText: {
    fontSize: 14,
    color: '#708090',
  },
  timeframeTextActive: {
    color: '#0A0A0F',
    fontWeight: 'bold',
  },
  insightsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  opportunityCard: {
    borderColor: '#00FF7F',
    backgroundColor: '#1A2E1A',
  },
  warningCard: {
    borderColor: '#FF4500',
    backgroundColor: '#2E1A1A',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightPriority: {
    fontSize: 16,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  insightDescription: {
    fontSize: 14,
    color: '#708090',
    marginBottom: 8,
  },
  insightGames: {
    fontSize: 12,
    color: '#00FFFF',
    fontStyle: 'italic',
  },
  predictionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  predictionCard: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E2E3F',
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  rank1Badge: {
    backgroundColor: '#00FFFF',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A0A0F',
  },
  predHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predGameName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E0E0E0',
    flex: 1,
  },
  recBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  recText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A0A0F',
  },
  hotnessComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2E2E3F',
  },
  hotnessItem: {
    alignItems: 'center',
    flex: 1,
  },
  hotnessLabel: {
    fontSize: 10,
    color: '#708090',
    marginBottom: 4,
  },
  hotnessValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FFFF',
  },
  hotnessArrow: {
    fontSize: 20,
    color: '#FFD700',
    marginHorizontal: 8,
  },
  confidenceContainer: {
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#708090',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#2E2E3F',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  signalsContainer: {
    backgroundColor: '#2E2E3F',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  signalsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 8,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  signalText: {
    flex: 1,
    fontSize: 12,
    color: '#E0E0E0',
  },
  signalStrength: {
    fontSize: 10,
    color: '#708090',
    fontWeight: 'bold',
  },
  reasoningContainer: {
    backgroundColor: '#2E2E3F',
    padding: 12,
    borderRadius: 8,
  },
  reasoningLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 12,
    color: '#708090',
    marginBottom: 4,
  },
  howItWorksCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9370DB',
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9370DB',
    marginBottom: 12,
  },
  howItWorksText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 12,
  },
  howItWorksBullet: {
    fontSize: 12,
    color: '#708090',
    marginBottom: 6,
    paddingLeft: 8,
  },
  howItWorksFooter: {
    fontSize: 11,
    color: '#708090',
    fontStyle: 'italic',
    marginTop: 12,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#708090',
    textAlign: 'center',
  },
});
