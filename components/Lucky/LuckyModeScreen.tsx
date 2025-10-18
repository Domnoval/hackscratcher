import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert
} from 'react-native';
import { LuckyModeService } from '../../services/lucky/luckyModeService';
import { LuckyPrediction, UserBirthProfile } from '../../types/lucky';

export default function LuckyModeScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserBirthProfile | null>(null);
  const [prediction, setPrediction] = useState<LuckyPrediction | null>(null);
  const [glowAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadLuckyData();

    // Start animation with proper cleanup
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.3,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    // CRITICAL: Cleanup animation when component unmounts
    return () => {
      animation.stop();
      glowAnim.setValue(1); // Reset to default value
    };
  }, []);

  const loadLuckyData = async () => {
    try {
      const userProfile = await LuckyModeService.getUserProfile();

      if (!userProfile) {
        // Prompt user to create profile
        setLoading(false);
        return;
      }

      setProfile(userProfile);

      // Get today's lucky prediction
      const pred = await LuckyModeService.getDailyLuckyPrediction(userProfile.birthDate);
      setPrediction(pred);
    } catch (error) {
      console.error('Failed to load lucky data:', error);
      Alert.alert('Error', 'Failed to load lucky prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupProfile = () => {
    // This would open a modal/screen to collect birth date
    Alert.prompt(
      '🔮 Create Lucky Profile',
      'Enter your birth date (YYYY-MM-DD):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (dateStr) => {
            if (dateStr) {
              try {
                const birthDate = new Date(dateStr);
                const newProfile = await LuckyModeService.saveUserProfile(birthDate);
                setProfile(newProfile);
                loadLuckyData();
              } catch {
                Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD');
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const getLuckColor = (luck: number): string => {
    if (luck >= 80) return '#FFD700'; // Gold
    if (luck >= 60) return '#00FFFF'; // Cyan
    if (luck >= 40) return '#9370DB'; // Purple
    return '#708090'; // Gray
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Animated.Text style={[styles.loadingIcon, { transform: [{ scale: glowAnim }] }]}>
          🔮
        </Animated.Text>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Reading the stars...</Text>
      </View>
    );
  }

  if (!profile || !prediction) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.setupIcon}>🔮</Text>
        <Text style={styles.setupTitle}>Welcome to Lucky Mode</Text>
        <Text style={styles.setupText}>
          Unlock personalized mystical predictions based on numerology, moon phases, and your zodiac sign!
        </Text>
        <TouchableOpacity style={styles.setupButton} onPress={handleSetupProfile}>
          <Text style={styles.setupButtonText}>✨ Create Lucky Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { mysticalFactors } = prediction;

  return (
    <ScrollView style={styles.container}>
      {/* Mystical Header */}
      <View style={styles.header}>
        <Animated.Text style={[styles.moonEmoji, { transform: [{ scale: glowAnim }] }]}>
          {mysticalFactors.moonPhase.phaseEmoji}
        </Animated.Text>
        <Text style={styles.headerTitle}>🔮 Lucky Mode</Text>
        <Text style={styles.headerSubtitle}>Mystical Predictions</Text>
      </View>

      {/* Overall Luck Score */}
      <View style={styles.luckScoreCard}>
        <Text style={styles.luckScoreLabel}>Today's Luck</Text>
        <Animated.View style={{ transform: [{ scale: glowAnim }] }}>
          <Text style={[styles.luckScore, { color: getLuckColor(prediction.overallLuck) }]}>
            {prediction.overallLuck}%
          </Text>
        </Animated.View>
        <Text style={styles.luckScoreMeaning}>
          {prediction.overallLuck >= 80 ? '✨ Extremely Lucky!' :
           prediction.overallLuck >= 60 ? '🌟 Very Lucky!' :
           prediction.overallLuck >= 40 ? '💫 Lucky!' : '⭐ Moderate Luck'}
        </Text>
      </View>

      {/* Fortune */}
      <View style={styles.fortuneCard}>
        <Text style={styles.fortuneIcon}>🥠</Text>
        <Text style={styles.fortuneText}>"{prediction.fortune}"</Text>
      </View>

      {/* Boosters */}
      {prediction.boosters && prediction.boosters.length > 0 && (
        <View style={styles.boostersCard}>
          {prediction.boosters.map((booster, index) => (
            <Text key={index} style={styles.boosterText}>{booster}</Text>
          ))}
        </View>
      )}

      {/* Lucky Game */}
      <View style={styles.luckyGameCard}>
        <View style={styles.luckyGameHeader}>
          <Text style={styles.luckyGameLabel}>💎 Today's Lucky Game</Text>
          <Text style={styles.luckyGameConfidence}>
            {prediction.luckyGame.confidence}% confidence
          </Text>
        </View>
        <Text style={styles.luckyGameName}>{prediction.luckyGame.gameName}</Text>
        <Text style={styles.luckyGameReason}>{prediction.luckyGame.reason}</Text>
      </View>

      {/* Lucky Numbers */}
      <View style={styles.numbersCard}>
        <Text style={styles.numbersLabel}>🎯 Your Lucky Numbers</Text>
        <View style={styles.numbersGrid}>
          {prediction.luckyNumbers.map((num, index) => (
            <View key={index} style={styles.numberBubble}>
              <Text style={styles.numberText}>{num}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Moon Phase */}
      <View style={styles.moonCard}>
        <View style={styles.moonHeader}>
          <Text style={styles.moonEmoji}>{mysticalFactors.moonPhase.phaseEmoji}</Text>
          <View style={styles.moonInfo}>
            <Text style={styles.moonPhase}>{mysticalFactors.moonPhase.phaseName}</Text>
            <Text style={styles.moonIllumination}>
              {mysticalFactors.moonPhase.illumination}% illuminated
            </Text>
          </View>
        </View>
        <Text style={styles.moonEnergy}>
          Energy: {mysticalFactors.moonPhase.energy.replace('_', ' ')}
        </Text>
        <Text style={styles.moonGames}>
          Favors: {mysticalFactors.moonPhase.luckyGames.join(', ')}
        </Text>
        <Text style={styles.moonNext}>
          Next phase: {mysticalFactors.moonPhase.nextPhaseDate.toLocaleDateString()}
        </Text>
      </View>

      {/* Numerology */}
      <View style={styles.numerologyCard}>
        <Text style={styles.numerologyTitle}>🔢 Numerology</Text>
        <View style={styles.numerologyStats}>
          <View style={styles.numerologyStat}>
            <Text style={styles.numerologyLabel}>Life Path</Text>
            <Text style={styles.numerologyValue}>{mysticalFactors.numerology.lifePathNumber}</Text>
          </View>
          <View style={styles.numerologyStat}>
            <Text style={styles.numerologyLabel}>Personal Day</Text>
            <Text style={styles.numerologyValue}>{mysticalFactors.numerology.personalDay}</Text>
          </View>
          <View style={styles.numerologyStat}>
            <Text style={styles.numerologyLabel}>Personal Year</Text>
            <Text style={styles.numerologyValue}>{mysticalFactors.numerology.personalYear}</Text>
          </View>
        </View>
        <Text style={styles.numerologyMeaning}>{mysticalFactors.numerology.meaning}</Text>
        <Text style={styles.numerologyAdvice}>{mysticalFactors.numerology.advice}</Text>
      </View>

      {/* Zodiac */}
      <View style={styles.zodiacCard}>
        <Text style={styles.zodiacTitle}>
          ♈ {mysticalFactors.zodiac.sign.charAt(0).toUpperCase() + mysticalFactors.zodiac.sign.slice(1)}
        </Text>
        <View style={styles.zodiacInfo}>
          <View style={styles.zodiacItem}>
            <Text style={styles.zodiacLabel}>Element:</Text>
            <Text style={styles.zodiacValue}>{mysticalFactors.zodiac.element}</Text>
          </View>
          <View style={styles.zodiacItem}>
            <Text style={styles.zodiacLabel}>Lucky Color:</Text>
            <Text style={styles.zodiacValue}>{mysticalFactors.zodiac.luckyColor}</Text>
          </View>
          <View style={styles.zodiacItem}>
            <Text style={styles.zodiacLabel}>Lucky Day:</Text>
            <Text style={styles.zodiacValue}>{mysticalFactors.zodiac.luckyDay}</Text>
          </View>
        </View>
        <Text style={styles.zodiacFortune}>{mysticalFactors.zodiac.todaysFortune}</Text>
        <Text style={styles.zodiacAdvice}>{mysticalFactors.zodiac.lotteryAdvice}</Text>
      </View>

      {/* Warnings */}
      {prediction.warnings && prediction.warnings.length > 0 && (
        <View style={styles.warningsCard}>
          <Text style={styles.warningsTitle}>⚠️ Mystic Warnings</Text>
          {prediction.warnings.map((warning, index) => (
            <Text key={index} style={styles.warningText}>{warning}</Text>
          ))}
        </View>
      )}

      {/* Lucky Time */}
      <View style={styles.luckyTimeCard}>
        <Text style={styles.luckyTimeText}>
          ⏰ Best Time: {prediction.luckyTime.charAt(0).toUpperCase() + prediction.luckyTime.slice(1)}
        </Text>
        <Text style={styles.luckyTimeSubtext}>
          Visit stores during this time for maximum luck!
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🌙 Lucky Mode combines ancient wisdom with modern data science for the ultimate edge! ✨
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
    padding: 20,
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
  setupIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
  },
  setupText: {
    fontSize: 16,
    color: '#708090',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  setupButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  setupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A0A0F',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  moonEmoji: {
    fontSize: 48,
    position: 'absolute',
    top: 20,
    right: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9370DB',
  },
  luckScoreCard: {
    backgroundColor: 'linear-gradient(135deg, #1A1A2E 0%, #2E1A2E 100%)',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9370DB',
  },
  luckScoreLabel: {
    fontSize: 16,
    color: '#9370DB',
    marginBottom: 8,
  },
  luckScore: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  luckScoreMeaning: {
    fontSize: 18,
    color: '#E0E0E0',
  },
  fortuneCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  fortuneIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  fortuneText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#FFD700',
    textAlign: 'center',
  },
  boostersCard: {
    backgroundColor: '#1A2E1A',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00FF7F',
  },
  boosterText: {
    fontSize: 14,
    color: '#00FF7F',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  luckyGameCard: {
    backgroundColor: '#2E1A1A',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  luckyGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  luckyGameLabel: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  luckyGameConfidence: {
    fontSize: 12,
    color: '#00FF7F',
  },
  luckyGameName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  luckyGameReason: {
    fontSize: 14,
    color: '#708090',
    fontStyle: 'italic',
  },
  numbersCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  numbersLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 16,
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  numberBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9370DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  moonCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9370DB',
  },
  moonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moonInfo: {
    flex: 1,
  },
  moonPhase: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9370DB',
    marginBottom: 4,
  },
  moonIllumination: {
    fontSize: 14,
    color: '#708090',
  },
  moonEnergy: {
    fontSize: 14,
    color: '#00FFFF',
    marginBottom: 8,
  },
  moonGames: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  moonNext: {
    fontSize: 12,
    color: '#708090',
  },
  numerologyCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  numerologyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 16,
  },
  numerologyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  numerologyStat: {
    alignItems: 'center',
  },
  numerologyLabel: {
    fontSize: 12,
    color: '#708090',
    marginBottom: 4,
  },
  numerologyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9370DB',
  },
  numerologyMeaning: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
    textAlign: 'center',
  },
  numerologyAdvice: {
    fontSize: 12,
    color: '#708090',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  zodiacCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  zodiacTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  zodiacInfo: {
    marginBottom: 16,
  },
  zodiacItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  zodiacLabel: {
    fontSize: 14,
    color: '#708090',
  },
  zodiacValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  zodiacFortune: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  zodiacAdvice: {
    fontSize: 12,
    color: '#708090',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  warningsCard: {
    backgroundColor: '#2E1A1A',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4500',
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#FF4500',
    marginBottom: 8,
  },
  luckyTimeCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  luckyTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 4,
  },
  luckyTimeSubtext: {
    fontSize: 12,
    color: '#708090',
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
