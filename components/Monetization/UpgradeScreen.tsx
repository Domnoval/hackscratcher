import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { InAppPurchaseService, SubscriptionTier } from '../../services/monetization/inAppPurchaseService';

export default function UpgradeScreen() {
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(InAppPurchaseService.TIERS[0]);
  const [purchaseState, setPurchaseState] = useState<any>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    loadPurchaseInfo();
  }, []);

  const loadPurchaseInfo = async () => {
    try {
      const state = await InAppPurchaseService.getPurchaseState();
      const days = await InAppPurchaseService.getDaysRemaining();

      setPurchaseState(state);
      setDaysRemaining(days);
    } catch (error) {
      console.error('Failed to load purchase info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      await InAppPurchaseService.startFreeTrial();
      Alert.alert(
        '🎉 Trial Started!',
        'Enjoy 7 days of Pro features absolutely free. Cancel anytime!',
        [{ text: 'Start Exploring', onPress: () => loadPurchaseInfo() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start trial');
    }
  };

  const handlePurchase = async () => {
    try {
      const productId = selectedTier.id === 'pro_monthly'
        ? 'com.scratchoracle.pro.monthly'
        : 'com.scratchoracle.pro.yearly';

      const success = await InAppPurchaseService.purchaseSubscription(productId);

      if (success) {
        Alert.alert(
          '🎊 Welcome to Pro!',
          'You now have access to all premium features!',
          [{ text: 'Awesome!', onPress: () => loadPurchaseInfo() }]
        );
      }
    } catch (error) {
      Alert.alert('Purchase Failed', 'Please try again');
    }
  };

  const handleRestore = async () => {
    try {
      const restored = await InAppPurchaseService.restorePurchases();

      if (restored) {
        Alert.alert('✅ Restored!', 'Your Pro subscription has been restored');
        loadPurchaseInfo();
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases to restore');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Please try again');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show Pro status if already subscribed
  if (purchaseState?.isPro) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.proHeader}>
          <Text style={styles.proIcon}>👑</Text>
          <Text style={styles.proTitle}>You're Pro!</Text>
          <Text style={styles.proSubtitle}>
            {purchaseState.isTrialing ? 'Free Trial' : purchaseState.tier?.name}
          </Text>
        </View>

        {daysRemaining !== null && (
          <View style={styles.expirationCard}>
            <Text style={styles.expirationText}>
              {purchaseState.isTrialing
                ? `${daysRemaining} days left in trial`
                : `${daysRemaining} days remaining`}
            </Text>
          </View>
        )}

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ Your Pro Features</Text>
          {InAppPurchaseService.TIERS[0].features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✅</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {purchaseState.isTrialing && (
          <View style={styles.upgradeSection}>
            <Text style={styles.upgradeTitle}>Love Pro? Subscribe Now!</Text>
            <Text style={styles.upgradeSubtext}>
              Continue enjoying all features after trial ends
            </Text>
            <TouchableOpacity style={styles.subscribeButton} onPress={handlePurchase}>
              <Text style={styles.subscribeButtonText}>
                Subscribe for $2.99/month
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>👑</Text>
        <Text style={styles.heroTitle}>Upgrade to Pro</Text>
        <Text style={styles.heroSubtitle}>
          Unlock the full power of Scratch Oracle
        </Text>
      </View>

      {/* Trial CTA */}
      <View style={styles.trialCard}>
        <Text style={styles.trialBadge}>🎁 LIMITED TIME</Text>
        <Text style={styles.trialTitle}>7-Day Free Trial</Text>
        <Text style={styles.trialText}>
          Try all Pro features absolutely free. No credit card required until trial ends!
        </Text>
        <TouchableOpacity style={styles.trialButton} onPress={handleStartTrial}>
          <Text style={styles.trialButtonText}>Start Free Trial</Text>
        </TouchableOpacity>
      </View>

      {/* Tier Selection */}
      <View style={styles.tiersSection}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        {InAppPurchaseService.TIERS.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[
              styles.tierCard,
              selectedTier.id === tier.id && styles.tierCardSelected,
              tier.popular && styles.tierCardPopular
            ]}
            onPress={() => setSelectedTier(tier)}
          >
            {tier.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}

            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <View style={styles.tierPrice}>
                <Text style={styles.tierPriceAmount}>${tier.price}</Text>
                <Text style={styles.tierPricePeriod}>/{tier.period === 'monthly' ? 'mo' : 'yr'}</Text>
              </View>
            </View>

            {tier.period === 'yearly' && (
              <Text style={styles.savings}>Save 16% vs monthly!</Text>
            )}

            {selectedTier.id === tier.id && (
              <Text style={styles.selectedCheck}>✓ Selected</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Features Comparison */}
      <View style={styles.comparisonSection}>
        <Text style={styles.sectionTitle}>What's Included</Text>

        <View style={styles.comparisonTable}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonHeaderText}>Feature</Text>
            <Text style={styles.comparisonHeaderText}>Free</Text>
            <Text style={[styles.comparisonHeaderText, styles.proText]}>Pro</Text>
          </View>

          {[
            { feature: 'Basic recommendations', free: true, pro: true },
            { feature: 'Scans per day', free: '5', pro: 'Unlimited' },
            { feature: 'AI predictions', free: false, pro: true },
            { feature: 'Store heat map', free: false, pro: true },
            { feature: 'Lucky Mode 2.0', free: false, pro: true },
            { feature: 'Real-time alerts', free: false, pro: true },
            { feature: 'Social features', free: '❌', pro: true },
            { feature: 'Ad-free experience', free: false, pro: true }
          ].map((row, index) => (
            <View key={index} style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>{row.feature}</Text>
              <Text style={styles.comparisonValue}>
                {typeof row.free === 'boolean' ? (row.free ? '✓' : '❌') : row.free}
              </Text>
              <Text style={[styles.comparisonValue, styles.proText]}>
                {typeof row.pro === 'boolean' ? (row.pro ? '✓' : '❌') : row.pro}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresGrid}>
        {selectedTier.features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <Text style={styles.featureIcon}>✨</Text>
            <Text style={styles.featureCardText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Purchase Button */}
      <View style={styles.purchaseSection}>
        <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
          <Text style={styles.purchaseButtonText}>
            Subscribe - ${selectedTier.price}/{selectedTier.period === 'monthly' ? 'month' : 'year'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          • Auto-renews until cancelled{'\n'}
          • Cancel anytime in account settings{'\n'}
          • Billed through App Store/Google Play
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
  loadingText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginTop: 16,
  },
  hero: {
    padding: 40,
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#708090',
    textAlign: 'center',
  },
  trialCard: {
    backgroundColor: 'linear-gradient(135deg, #1A2E1A 0%, #1A1A2E 100%)',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FF7F',
  },
  trialBadge: {
    backgroundColor: '#00FF7F',
    color: '#0A0A0F',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  trialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF7F',
    marginBottom: 8,
  },
  trialText: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 20,
  },
  trialButton: {
    backgroundColor: '#00FF7F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    width: '100%',
  },
  trialButtonText: {
    color: '#0A0A0F',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tiersSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 16,
  },
  tierCard: {
    backgroundColor: '#1A1A2E',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2E2E3F',
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: '#00FFFF',
    backgroundColor: '#1A2E2E',
  },
  tierCardPopular: {
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#0A0A0F',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  tierPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPriceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
  },
  tierPricePeriod: {
    fontSize: 14,
    color: '#708090',
  },
  savings: {
    fontSize: 12,
    color: '#00FF7F',
    fontWeight: 'bold',
  },
  selectedCheck: {
    fontSize: 14,
    color: '#00FFFF',
    fontWeight: 'bold',
    marginTop: 8,
  },
  comparisonSection: {
    margin: 20,
    marginTop: 0,
  },
  comparisonTable: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E2E3F',
    padding: 12,
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#708090',
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E3F',
  },
  comparisonFeature: {
    flex: 1,
    fontSize: 12,
    color: '#E0E0E0',
  },
  comparisonValue: {
    flex: 1,
    fontSize: 12,
    color: '#708090',
    textAlign: 'center',
  },
  proText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  featuresGrid: {
    margin: 20,
    marginTop: 0,
  },
  featureCard: {
    backgroundColor: '#1A1A2E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureCardText: {
    fontSize: 14,
    color: '#E0E0E0',
    flex: 1,
  },
  purchaseSection: {
    margin: 20,
    marginTop: 0,
  },
  purchaseButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  purchaseButtonText: {
    color: '#0A0A0F',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restoreButton: {
    paddingVertical: 12,
  },
  restoreButtonText: {
    color: '#00FFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 10,
    color: '#708090',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
  proHeader: {
    padding: 40,
    alignItems: 'center',
  },
  proIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  proTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  proSubtitle: {
    fontSize: 16,
    color: '#708090',
  },
  expirationCard: {
    backgroundColor: '#1A2E2E',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00FFFF',
  },
  expirationText: {
    fontSize: 14,
    color: '#00FFFF',
    fontWeight: 'bold',
  },
  featuresSection: {
    margin: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureCheck: {
    fontSize: 18,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#E0E0E0',
    flex: 1,
  },
  upgradeSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2E1A1A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  upgradeSubtext: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 16,
  },
  subscribeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  subscribeButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
