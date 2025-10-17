// In-App Purchase Service - Pro Tier Subscriptions
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as InAppPurchases from 'expo-in-app-purchases';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
}

export interface PurchaseState {
  isPro: boolean;
  tier?: SubscriptionTier;
  expirationDate?: string;
  trialEndsAt?: string;
  isTrialing: boolean;
}

export class InAppPurchaseService {
  private static readonly PURCHASE_STATE_KEY = 'purchase_state';
  private static readonly PRODUCT_IDS = {
    PRO_MONTHLY: 'com.scratchoracle.pro.monthly',
    PRO_YEARLY: 'com.scratchoracle.pro.yearly'
  };

  /**
   * Available subscription tiers
   */
  static readonly TIERS: SubscriptionTier[] = [
    {
      id: 'pro_monthly',
      name: 'Pro Monthly',
      price: 2.99,
      period: 'monthly',
      popular: true,
      features: [
        '🔥 Real-time hot ticket alerts',
        '🤖 AI predictions',
        '🗺️ Store heat map',
        '🔮 Lucky Mode 2.0',
        '📊 Advanced statistics',
        '🎯 Unlimited scans',
        '👥 Social features',
        '🏆 Leaderboard access',
        '⚡ Challenge participation',
        '📈 ROI tracking',
        '🎁 Exclusive badges',
        '🚫 No ads'
      ]
    },
    {
      id: 'pro_yearly',
      name: 'Pro Yearly',
      price: 29.99,
      period: 'yearly',
      features: [
        '✅ All Pro Monthly features',
        '💰 Save 16% vs monthly',
        '🎁 Bonus: Lucky Charm badge',
        '⭐ Priority support'
      ]
    }
  ];

  /**
   * Free tier features
   */
  static readonly FREE_FEATURES = [
    '📊 Basic recommendations',
    '🎲 Limited scans (5/day)',
    '📈 Basic statistics',
    '🔍 Game comparisons'
  ];

  /**
   * Initialize IAP service
   */
  static async initialize(): Promise<void> {
    try {
      // Connect to store
      // await InAppPurchases.connectAsync();

      // Set purchase listener
      // InAppPurchases.setPurchaseListener(this.handlePurchaseUpdate);

      console.log('IAP service initialized');
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
    }
  }

  /**
   * Get available products from store
   */
  static async getProducts(): Promise<any[]> {
    try {
      // const { results } = await InAppPurchases.getProductsAsync([
      //   this.PRODUCT_IDS.PRO_MONTHLY,
      //   this.PRODUCT_IDS.PRO_YEARLY
      // ]);
      // return results;

      // Mock products for demo
      return [
        {
          productId: this.PRODUCT_IDS.PRO_MONTHLY,
          price: '$2.99',
          priceAmountMicros: 2990000,
          title: 'Scratch Oracle Pro (Monthly)',
          description: 'Unlock all premium features'
        },
        {
          productId: this.PRODUCT_IDS.PRO_YEARLY,
          price: '$29.99',
          priceAmountMicros: 29990000,
          title: 'Scratch Oracle Pro (Yearly)',
          description: 'Save 16% with annual billing'
        }
      ];
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  /**
   * Purchase subscription
   */
  static async purchaseSubscription(productId: string): Promise<boolean> {
    try {
      // await InAppPurchases.purchaseItemAsync(productId);
      // The purchase listener will handle the result

      // For demo, simulate successful purchase
      console.log('Purchase initiated:', productId);

      // Activate pro tier
      const tier = this.TIERS.find(t =>
        (t.id === 'pro_monthly' && productId === this.PRODUCT_IDS.PRO_MONTHLY) ||
        (t.id === 'pro_yearly' && productId === this.PRODUCT_IDS.PRO_YEARLY)
      );

      if (tier) {
        await this.activatePro(tier);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  }

  /**
   * Start free trial
   */
  static async startFreeTrial(): Promise<void> {
    const trialDays = 7;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const state: PurchaseState = {
      isPro: true,
      isTrialing: true,
      trialEndsAt: trialEndsAt.toISOString(),
      tier: this.TIERS[0] // Pro Monthly
    };

    await AsyncStorage.setItem(this.PURCHASE_STATE_KEY, JSON.stringify(state));
  }

  /**
   * Check if user is Pro
   */
  static async isPro(): Promise<boolean> {
    const state = await this.getPurchaseState();
    if (!state.isPro) return false;

    // Check if trial or subscription expired
    if (state.trialEndsAt) {
      const trialEnd = new Date(state.trialEndsAt);
      if (new Date() > trialEnd && !state.expirationDate) {
        // Trial ended, not subscribed
        await this.deactivatePro();
        return false;
      }
    }

    if (state.expirationDate) {
      const expiration = new Date(state.expirationDate);
      if (new Date() > expiration) {
        // Subscription expired
        await this.deactivatePro();
        return false;
      }
    }

    return true;
  }

  /**
   * Get purchase state
   */
  static async getPurchaseState(): Promise<PurchaseState> {
    try {
      const stored = await AsyncStorage.getItem(this.PURCHASE_STATE_KEY);
      if (!stored) {
        return {
          isPro: false,
          isTrialing: false
        };
      }
      return JSON.parse(stored);
    } catch {
      return {
        isPro: false,
        isTrialing: false
      };
    }
  }

  /**
   * Activate Pro tier
   */
  private static async activatePro(tier: SubscriptionTier): Promise<void> {
    const expirationDate = new Date();
    if (tier.period === 'monthly') {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    } else {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    }

    const state: PurchaseState = {
      isPro: true,
      tier,
      expirationDate: expirationDate.toISOString(),
      isTrialing: false
    };

    await AsyncStorage.setItem(this.PURCHASE_STATE_KEY, JSON.stringify(state));
  }

  /**
   * Deactivate Pro tier
   */
  private static async deactivatePro(): Promise<void> {
    const state: PurchaseState = {
      isPro: false,
      isTrialing: false
    };

    await AsyncStorage.setItem(this.PURCHASE_STATE_KEY, JSON.stringify(state));
  }

  /**
   * Restore purchases
   */
  static async restorePurchases(): Promise<boolean> {
    try {
      // const { results } = await InAppPurchases.getPurchaseHistoryAsync();

      // Check for active subscriptions
      // const activeSub = results.find(purchase =>
      //   purchase.acknowledged && !this.isPurchaseExpired(purchase)
      // );

      // if (activeSub) {
      //   const tier = activeSub.productId === this.PRODUCT_IDS.PRO_YEARLY
      //     ? this.TIERS[1]
      //     : this.TIERS[0];

      //   await this.activatePro(tier);
      //   return true;
      // }

      // For demo, simulate restore
      console.log('Restore purchases');
      return false;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(): Promise<void> {
    // Note: Actual cancellation happens through App Store/Play Store
    // This just updates local state

    const state = await this.getPurchaseState();
    if (state.expirationDate) {
      // Keep Pro active until expiration
      await AsyncStorage.setItem(this.PURCHASE_STATE_KEY, JSON.stringify({
        ...state,
        willRenew: false
      }));
    }
  }

  /**
   * Handle purchase update
   */
  private static handlePurchaseUpdate = (purchaseUpdate: any) => {
    const { responseCode, results, errorCode } = purchaseUpdate;

    if (responseCode === 0) {
      // Success
      results?.forEach(async (purchase: any) => {
        if (purchase.acknowledged === false) {
          // Finish transaction
          // await InAppPurchases.finishTransactionAsync(purchase, true);

          // Activate Pro
          const tier = purchase.productId === this.PRODUCT_IDS.PRO_YEARLY
            ? this.TIERS[1]
            : this.TIERS[0];

          await this.activatePro(tier);
        }
      });
    } else {
      console.error('Purchase failed:', errorCode);
    }
  };

  /**
   * Get days remaining in trial/subscription
   */
  static async getDaysRemaining(): Promise<number | null> {
    const state = await this.getPurchaseState();

    if (state.isTrialing && state.trialEndsAt) {
      const end = new Date(state.trialEndsAt);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }

    if (state.expirationDate) {
      const end = new Date(state.expirationDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }

    return null;
  }
}
