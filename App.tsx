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
  Platform,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';

// Services
import { AgeVerificationService } from './services/compliance/ageVerification';
import { RecommendationEngine } from './services/recommendations/recommendationEngine';
import { FeatureFlagService } from './services/config/featureFlags';
import { queryClient } from './lib/queryClient';
import { Recommendation } from './types/lottery';

// AI Components
import { AIScoreBadge, ConfidenceIndicatorWithHeights, RecommendationChip } from './components/AI';

// Tracking Components
import { WinTracker } from './components/tracking';

// State Selector
import { StateSelector } from './components/common/StateSelector';

// Legal Components
import { AgeVerification } from './components/legal/AgeVerification';
import { AboutScreen } from './components/screens/AboutScreen';

// Error Handling
import { NetworkMonitor, ErrorHandler } from './utils/errorHandler';

type State = 'MN' | 'FL';

function AppContent() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedState, setSelectedState] = useState<State>('MN');
  const [budget, setBudget] = useState('20');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    initializeApp();

    // Initialize network monitoring
    NetworkMonitor.initialize();
    setIsOnline(NetworkMonitor.getStatus());

    const unsubscribe = NetworkMonitor.subscribe((online) => {
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
      NetworkMonitor.cleanup();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize feature flags first
      await FeatureFlagService.initialize();

      // ENABLE REAL SUPABASE DATA WITH AI PREDICTIONS!
      await FeatureFlagService.enableSupabase();

      console.log('[App] Feature flags initialized:', FeatureFlagService.getStatusMessage());

      // Then check age verification
      await checkAgeVerification();
    } catch (error) {
      console.error('[App] Initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAgeVerification = async () => {
    try {
      const status = await AgeVerificationService.checkVerificationStatus();
      const verified = status.isVerified && !status.requiresReverification;
      setIsVerified(verified);
      setShowAgeVerification(!verified);
    } catch (error) {
      console.error('Age verification check failed:', error);
    }
  };

  const handleAgeConfirm = async () => {
    try {
      // Set a birth date that makes the user 18+ (e.g., 20 years ago)
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 20);

      const result = await AgeVerificationService.verifyAge(birthDate);

      if (result.isVerified) {
        setIsVerified(true);
        setShowAgeVerification(false);
      }
    } catch (error) {
      console.error('Age verification failed:', error);
      Alert.alert('Error', 'Age verification failed. Please try again.');
    }
  };

  const handleAgeDecline = () => {
    Alert.alert(
      'Age Requirement',
      'You must be 18 or older to use Scratch Oracle. For more information about responsible gaming, please visit the National Council on Problem Gambling at ncpgambling.org.',
      [{ text: 'OK', onPress: () => setShowAgeVerification(true) }]
    );
  };

  const getRecommendations = async () => {
    const budgetAmount = parseFloat(budget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    // Check network status first
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your connection and try again.'
      );
      return;
    }

    setLoadingRecommendations(true);

    try {
      const recs = await ErrorHandler.retry(
        () => RecommendationEngine.getRecommendations(budgetAmount, undefined, 3, selectedState),
        2 // Retry once if network fails
      );
      setRecommendations(recs);

      if (recs.length === 0) {
        Alert.alert(
          'No Recommendations',
          'No suitable games found for your budget. Try increasing your budget.'
        );
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      ErrorHandler.handleNetworkError(error, 'Get recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const renderRecommendation = useCallback(({ item, index }: { item: Recommendation; index: number }) => {
    // Extract AI prediction data (will be null/undefined for mock data)
    const aiScore = item.game.ai_score || item.score || 0;
    const confidence = item.game.confidence || (item.ev.confidence * 100) || 0;
    const recommendation = item.game.recommendation ||
      (aiScore >= 80 ? 'strong_buy' : aiScore >= 60 ? 'buy' : aiScore >= 40 ? 'neutral' : 'avoid');

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
  }, []);

  const renderMainApp = () => (
    <View style={styles.mainContainer}>
      {/* Offline Indicator */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠️ No Internet Connection</Text>
        </View>
      )}

      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.appTitle}>🎯 Scratch Oracle</Text>
          <Text style={styles.appSubtitle}>Smart Lottery Recommendations</Text>
        </View>
        <TouchableOpacity
          style={styles.aboutButton}
          onPress={() => setShowAbout(true)}
          accessibilityLabel="About and Settings"
          accessibilityRole="button"
        >
          <Text style={styles.aboutButtonText}>ⓘ</Text>
        </TouchableOpacity>
      </View>

      <StateSelector
        selectedState={selectedState}
        onStateChange={setSelectedState}
      />

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
        {renderMainApp()}
      </ScrollView>

      {/* Age Verification Modal */}
      <AgeVerification
        visible={showAgeVerification}
        onConfirm={handleAgeConfirm}
        onDecline={handleAgeDecline}
      />

      {/* About Screen Modal */}
      <Modal
        visible={showAbout}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAbout(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <AboutScreen />
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Main App component wrapped with React Query provider
 * Enables data caching and automatic refetching
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#FFD700',
  },
  aboutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2E2E3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutButtonText: {
    fontSize: 24,
    color: '#00FFFF',
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
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
  aiTransparency: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2E2E3F',
  },
  transparencyText: {
    color: '#708090',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
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
  modalHeader: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E3F',
    alignItems: 'flex-end',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#00FFFF',
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});