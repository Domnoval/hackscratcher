// Push Notification Service - Real-time alerts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataSyncService, SyncResult } from '../sync/dataSyncService';
import { EVCalculator } from '../calculator/evCalculator';
import { MinnesotaLotteryService } from '../lottery/minnesotaData';

const PUSH_TOKEN_KEY = 'expo_push_token';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  newGames: boolean;
  hotTickets: boolean;
  bigWins: boolean;
  dailyRecommendations: boolean;
  priceAlerts: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string;
}

export interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static readonly DEFAULT_SETTINGS: NotificationSettings = {
    enabled: true,
    newGames: true,
    hotTickets: true,
    bigWins: true,
    dailyRecommendations: true,
    priceAlerts: true,
  };

  /**
   * Initialize notification service
   */
  static async initialize(): Promise<void> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return;
    }

    try {
      const token = await this.registerForPushNotifications();
      if (token) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        console.log('Push token registered:', token);
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Register for push notifications
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission denied');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'scratch-oracle-app', // Will be updated with actual EAS project ID
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00FFFF',
        });

        // Create channels for different notification types
        await Notifications.setNotificationChannelAsync('hot-tickets', {
          name: 'Hot Tickets',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
        });

        await Notifications.setNotificationChannelAsync('new-games', {
          name: 'New Games',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#00FFFF',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Get notification permissions status
   */
  static async getPermissions(): Promise<NotificationPermissions> {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
      status: status as 'granted' | 'denied' | 'undetermined',
    };
  }

  /**
   * Get notification settings
   */
  static async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : this.DEFAULT_SETTINGS;
    } catch {
      return this.DEFAULT_SETTINGS;
    }
  }

  /**
   * Update notification settings
   */
  static async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
  }

  /**
   * Check if notifications are allowed at current time (quiet hours)
   */
  private static async isQuietHours(): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= settings.quietHoursStart && currentTime <= settings.quietHoursEnd;
  }

  /**
   * Send local notification
   */
  static async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    channelId: string = 'default'
  ): Promise<void> {
    if (await this.isQuietHours()) {
      console.log('Quiet hours - notification suppressed');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Process sync results and send relevant notifications
   */
  static async processSyncResults(syncResult: SyncResult): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled) return;

    // New games notification
    if (settings.newGames && syncResult.newGames.length > 0) {
      const gamesList = syncResult.newGames.join(', ');
      await this.sendLocalNotification(
        '🎮 New Games Available!',
        `Check out: ${gamesList}`,
        { type: 'new_games', games: syncResult.newGames },
        'new-games'
      );
    }

    // Hot tickets notification
    if (settings.hotTickets && syncResult.hotGames.length > 0) {
      for (const gameName of syncResult.hotGames) {
        await this.sendLocalNotification(
          '🔥 HOT TICKET ALERT!',
          `${gameName} is heating up! Big prizes being claimed.`,
          { type: 'hot_ticket', game: gameName },
          'hot-tickets'
        );
      }
    }

    // Retired games warning
    if (syncResult.retiredGames.length > 0) {
      const gamesList = syncResult.retiredGames.join(', ');
      await this.sendLocalNotification(
        '⚠️ Games Ending Soon',
        `These games are retiring: ${gamesList}`,
        { type: 'retired_games', games: syncResult.retiredGames }
      );
    }
  }

  /**
   * Send daily recommendation notification
   */
  static async sendDailyRecommendation(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.dailyRecommendations) return;

    try {
      const games = await MinnesotaLotteryService.getActiveGames();
      const evCalculations = games.map(game => EVCalculator.calculateEV(game));

      // Find the hottest game
      const hottestGame = evCalculations.reduce((max, calc) =>
        calc.hotness > max.hotness ? calc : max
      );

      const game = games.find(g => g.id === hottestGame.gameId);
      if (!game) return;

      await this.sendLocalNotification(
        '💎 Today\'s Top Pick',
        `${game.name} - ${hottestGame.hotness.toFixed(0)}% hot! EV: ${hottestGame.adjustedEV.toFixed(2)}`,
        { type: 'daily_recommendation', gameId: game.id }
      );
    } catch (error) {
      console.error('Failed to send daily recommendation:', error);
    }
  }

  /**
   * Send big win alert (community feature)
   */
  static async sendBigWinAlert(gameName: string, amount: number, location?: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.bigWins) return;

    const locationText = location ? ` at ${location}` : '';
    await this.sendLocalNotification(
      '🎉 BIG WIN NEARBY!',
      `Someone just won $${amount.toLocaleString()} on ${gameName}${locationText}!`,
      { type: 'big_win', game: gameName, amount, location },
      'hot-tickets'
    );
  }

  /**
   * Send price alert (when user's budget allows a new recommendation)
   */
  static async sendPriceAlert(gameName: string, oldPrice: number, newPrice: number): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || !settings.priceAlerts) return;

    await this.sendLocalNotification(
      '💰 Price Change Alert',
      `${gameName} price changed: $${oldPrice} → $${newPrice}`,
      { type: 'price_alert', game: gameName, oldPrice, newPrice }
    );
  }

  /**
   * Schedule daily recommendation notification
   */
  static async scheduleDailyRecommendation(hour: number = 10, minute: number = 0): Promise<void> {
    // Cancel existing daily notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'daily_recommendation') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    // Schedule new daily notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💎 Daily Recommendation Ready!',
        body: 'Check your personalized hot picks for today',
        data: { type: 'daily_recommendation' },
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification badge count
   */
  static async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set notification badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear notification badge
   */
  static async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Add notification received listener
   */
  static addNotificationReceivedListener(
    handler: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  static addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }
}
