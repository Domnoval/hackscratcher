import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Services
import { AgeVerificationService } from './services/compliance/ageVerification';
import { RecommendationEngine } from './services/recommendations/recommendationEngine';
import { Recommendation } from './types/lottery';

export default function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [budget, setBudget] = useState('20');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    checkAgeVerification();
  }, []);

  const checkAgeVerification = async () => {
    try {
      const status = await AgeVerificationService.checkVerificationStatus();
      setIsVerified(status.isVerified && !status.requiresReverification);
    } catch (error) {
      console.error('Age verification check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeVerification = async () => {
    // Web-compatible version using browser's native prompt
    if (Platform.OS === 'web') {
      const birthYear = window.prompt('Enter your birth year (you must be 18 or older):');
      if (!birthYear) return;

      const year = parseInt(birthYear);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        window.alert('Error: Please enter a valid birth year');
        return;
      }

      const birthDate = new Date(year, 0, 1);
      const result = await AgeVerificationService.verifyAge(birthDate);

      if (result.isVerified) {
        setIsVerified(true);
        window.alert('Welcome to Scratch Oracle! Age verification successful.');
      } else {
        window.alert('Age Verification Failed: You must be 18 or older to use this app');
      }
    } else {
      // Mobile version using Alert.prompt
      Alert.prompt(
        'Age Verification Required',
        'Enter your birth year (you must be 18 or older):',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Verify',
            onPress: async (birthYear) => {
              if (!birthYear) return;

              const year = parseInt(birthYear);
              if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
                Alert.alert('Error', 'Please enter a valid birth year');
                return;
              }

              const birthDate = new Date(year, 0, 1);
              const result = await AgeVerificationService.verifyAge(birthDate);

              if (result.isVerified) {
                setIsVerified(true);
                Alert.alert('Welcome to Scratch Oracle!', 'Age verification successful');
              } else {
                Alert.alert(
                  'Age Verification Failed',
                  'You must be 18 or older to use this app'
                );
              }
            }
          }
        ],
        'plain-text',
        '',
        'numeric'
      );
    }
  };

  const getRecommendations = async () => {
    const budgetAmount = parseFloat(budget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    setLoadingRecommendations(true);

    try {
      const recs = await RecommendationEngine.getRecommendations(budgetAmount);
      setRecommendations(recs);

      if (recs.length === 0) {
        Alert.alert(
          'No Recommendations',
          'No suitable games found for your budget. Try increasing your budget.'
        );
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      Alert.alert('Error', 'Failed to get recommendations. Please try again.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const renderRecommendation = useCallback(({ item, index }: { item: Recommendation; index: number }) => (
    <View style={styles.recommendationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.gameTitle}>#{index + 1} {item.game.name}</Text>
        <Text style={styles.gamePrice}>${item.game.price}</Text>
      </View>

      <View style={styles.evContainer}>
        <Text style={styles.evLabel}>Expected Value:</Text>
        <Text style={[
          styles.evValue,
          { color: item.ev.adjustedEV > 0 ? '#00FF7F' : '#FF4500' }
        ]}>
          {item.ev.adjustedEV > 0 ? '+' : ''}${item.ev.adjustedEV.toFixed(2)}
        </Text>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Confidence</Text>
          <Text style={styles.metricValue}>
            {(item.ev.confidence * 100).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Hotness</Text>
          <Text style={styles.metricValue}>
            {item.ev.hotness > 0.7 ? '🔥' : item.ev.hotness > 0.4 ? '🌡️' : '❄️'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Odds</Text>
          <Text style={styles.metricValue}>{item.game.overall_odds}</Text>
        </View>
      </View>

      <View style={styles.reasonsContainer}>
        <Text style={styles.reasonsTitle}>Why this game:</Text>
        {item.reasons.slice(0, 3).map((reason, idx) => (
          <Text key={idx} style={styles.reason}>• {reason}</Text>
        ))}
      </View>
    </View>
  ), []);

  const renderAgeGate = () => (
    <View style={styles.ageGateContainer}>
      <Text style={styles.ageGateTitle}>🎯 Scratch Oracle</Text>
      <Text style={styles.ageGateSubtitle}>Minnesota Lottery Assistant</Text>

      <View style={styles.disclaimerContainer}>
        {AgeVerificationService.getAgeGateDisclaimers().map((disclaimer, index) => (
          <Text key={index} style={styles.disclaimer}>• {disclaimer}</Text>
        ))}
      </View>

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleAgeVerification}
        accessibilityLabel="Verify your age"
        accessibilityHint="Opens age verification prompt. You must be 18 or older to use this app"
        accessibilityRole="button"
      >
        <Text style={styles.verifyButtonText}>Verify Age (18+)</Text>
      </TouchableOpacity>

      <Text style={styles.helpText}>
        Problem gambling help: 1-800-333-HOPE
      </Text>
    </View>
  );

  const renderMainApp = () => (
    <View style={styles.mainContainer}>
      <Text style={styles.appTitle}>🎯 Scratch Oracle</Text>
      <Text style={styles.appSubtitle}>Smart Minnesota Lottery Recommendations</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Your Budget:</Text>
        <View style={styles.budgetInputContainer}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.budgetInput}
            value={budget}
            onChangeText={setBudget}
            placeholder="20"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.recommendButton, loadingRecommendations && styles.disabledButton]}
        onPress={getRecommendations}
        disabled={loadingRecommendations}
        accessibilityLabel="Get lottery recommendations"
        accessibilityHint="Fetches personalized scratch-off recommendations based on your budget"
        accessibilityRole="button"
        accessibilityState={{ disabled: loadingRecommendations }}
      >
        {loadingRecommendations ? (
          <ActivityIndicator color="#FFFFFF" accessibilityLabel="Loading recommendations" />
        ) : (
          <Text style={styles.recommendButtonText}>Get Smart Recommendations</Text>
        )}
      </TouchableOpacity>

      {recommendations.length > 0 && (
        <FlatList
          data={recommendations}
          renderItem={renderRecommendation}
          keyExtractor={(item) => item.gameId}
          style={styles.recommendationsContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={3}
          ListHeaderComponent={
            <Text style={styles.recommendationsTitle}>
              🎲 Top Recommendations for ${budget}
            </Text>
          }
          ListFooterComponent={
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                💡 Based on Expected Value, confidence, and prize availability
              </Text>
              <Text style={styles.footerDisclaimer}>
                Lottery games involve risk. Play responsibly within your budget.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
          <Text style={styles.loadingText}>Loading Scratch Oracle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollContainer}>
        {!isVerified ? renderAgeGate() : renderMainApp()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginTop: 16,
  },
  ageGateContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 600,
  },
  ageGateTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  ageGateSubtitle: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 32,
    textAlign: 'center',
  },
  disclaimerContainer: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  disclaimer: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  verifyButton: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  verifyButtonText: {
    color: '#0A0A0F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    color: '#708090',
    fontSize: 14,
    textAlign: 'center',
  },
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#E0E0E0',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2E3F',
    paddingHorizontal: 16,
  },
  dollarSign: {
    color: '#00FFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  budgetInput: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 18,
    paddingVertical: 12,
  },
  recommendButton: {
    backgroundColor: '#00FFFF',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#708090',
  },
  recommendButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recommendationsContainer: {
    flex: 1,
  },
  recommendationsTitle: {
    color: '#E0E0E0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  recommendationCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  evContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2E2E3F',
    borderRadius: 6,
  },
  evLabel: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  evValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: '#708090',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '500',
  },
  reasonsContainer: {
    marginTop: 8,
  },
  reasonsTitle: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  reason: {
    color: '#708090',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  footerContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    marginBottom: 32,
  },
  footerText: {
    color: '#708090',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerDisclaimer: {
    color: '#FF4500',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});