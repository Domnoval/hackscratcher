import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
// import { NotificationService, NotificationSettings } from '../../services/notifications/notificationService';

export default function NotificationSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({ granted: false, canAskAgain: true, status: 'undetermined' as const });
  const [settings, setSettings] = useState({
    enabled: true,
    newGames: true,
    hotTickets: true,
    bigWins: true,
    dailyRecommendations: true,
    priceAlerts: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Once expo-notifications is installed, uncomment:
      // const [perms, sets] = await Promise.all([
      //   NotificationService.getPermissions(),
      //   NotificationService.getSettings()
      // ]);
      // setPermissions(perms);
      // setSettings(sets);

      // For now, simulate loaded settings
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      // Once expo-notifications is installed, uncomment:
      // await NotificationService.initialize();
      // const perms = await NotificationService.getPermissions();
      // setPermissions(perms);

      // For now, simulate
      Alert.alert(
        'Notifications Ready',
        'Once expo-notifications is installed, push notifications will work!'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    try {
      // Once expo-notifications is installed, uncomment:
      // await NotificationService.updateSettings({ [key]: value });
      console.log('Setting updated:', key, value);
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const testNotification = async () => {
    try {
      // Once expo-notifications is installed, uncomment:
      // await NotificationService.sendLocalNotification(
      //   '🔥 Test Notification',
      //   'This is what a hot ticket alert looks like!',
      //   { type: 'test' },
      //   'hot-tickets'
      // );

      Alert.alert(
        'Test Notification',
        'Once expo-notifications is installed, you\'ll receive a real notification!'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Notifications</Text>
        <Text style={styles.headerSubtitle}>Stay updated on hot tickets</Text>
      </View>

      {/* Permission Status */}
      {!permissions.granted && (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>⚠️</Text>
          <Text style={styles.permissionTitle}>Notifications Disabled</Text>
          <Text style={styles.permissionText}>
            Enable notifications to get alerts about new games, hot tickets, and big wins nearby!
          </Text>
          {permissions.canAskAgain && (
            <TouchableOpacity style={styles.enableButton} onPress={requestPermissions}>
              <Text style={styles.enableButtonText}>Enable Notifications</Text>
            </TouchableOpacity>
          )}
          {!permissions.canAskAgain && (
            <Text style={styles.settingsHint}>
              Please enable notifications in your device settings
            </Text>
          )}
        </View>
      )}

      {/* Main Toggle */}
      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Enable Notifications</Text>
            <Text style={styles.settingDescription}>
              Master switch for all notifications
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(value) => updateSetting('enabled', value)}
            trackColor={{ false: '#2E2E3F', true: '#00FFFF' }}
            thumbColor={settings.enabled ? '#FFFFFF' : '#708090'}
          />
        </View>
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Types</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>🎮 New Games</Text>
            <Text style={styles.settingDescription}>
              Get notified when new scratch-offs launch
            </Text>
          </View>
          <Switch
            value={settings.newGames}
            onValueChange={(value) => updateSetting('newGames', value)}
            trackColor={{ false: '#2E2E3F', true: '#00FFFF' }}
            thumbColor={settings.newGames ? '#FFFFFF' : '#708090'}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>🔥 Hot Tickets</Text>
            <Text style={styles.settingDescription}>
              Alerts when games heat up (big prizes claimed)
            </Text>
          </View>
          <Switch
            value={settings.hotTickets}
            onValueChange={(value) => updateSetting('hotTickets', value)}
            trackColor={{ false: '#2E2E3F', true: '#FFD700' }}
            thumbColor={settings.hotTickets ? '#FFFFFF' : '#708090'}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>🎉 Big Wins</Text>
            <Text style={styles.settingDescription}>
              See when people win big near you
            </Text>
          </View>
          <Switch
            value={settings.bigWins}
            onValueChange={(value) => updateSetting('bigWins', value)}
            trackColor={{ false: '#2E2E3F', true: '#00FF7F' }}
            thumbColor={settings.bigWins ? '#FFFFFF' : '#708090'}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>💎 Daily Recommendations</Text>
            <Text style={styles.settingDescription}>
              Your personalized picks every morning
            </Text>
          </View>
          <Switch
            value={settings.dailyRecommendations}
            onValueChange={(value) => updateSetting('dailyRecommendations', value)}
            trackColor={{ false: '#2E2E3F', true: '#00FFFF' }}
            thumbColor={settings.dailyRecommendations ? '#FFFFFF' : '#708090'}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>💰 Price Alerts</Text>
            <Text style={styles.settingDescription}>
              Notify when ticket prices change
            </Text>
          </View>
          <Switch
            value={settings.priceAlerts}
            onValueChange={(value) => updateSetting('priceAlerts', value)}
            trackColor={{ false: '#2E2E3F', true: '#00FFFF' }}
            thumbColor={settings.priceAlerts ? '#FFFFFF' : '#708090'}
            disabled={!settings.enabled}
          />
        </View>
      </View>

      {/* Test Notification */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.testButton, !settings.enabled && styles.testButtonDisabled]}
          onPress={testNotification}
          disabled={!settings.enabled}
        >
          <Text style={styles.testButtonText}>📣 Send Test Notification</Text>
        </TouchableOpacity>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔥</Text>
          <Text style={styles.infoTitle}>Hot Ticket Alerts</Text>
          <Text style={styles.infoText}>
            When big prizes are claimed, remaining prizes become more valuable. We'll alert you within minutes!
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>⏰</Text>
          <Text style={styles.infoTitle}>Smart Timing</Text>
          <Text style={styles.infoText}>
            Data syncs every hour. Notifications are sent in real-time, respecting your quiet hours.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🎯</Text>
          <Text style={styles.infoTitle}>Personalized</Text>
          <Text style={styles.infoText}>
            We only notify you about games within your budget and preferences. No spam!
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Pro Tip: Enable all notifications to never miss a hot ticket opportunity!
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
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFD700',
  },
  permissionCard: {
    backgroundColor: '#2E1A1A',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF4500',
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 16,
  },
  enableButton: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enableButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsHint: {
    fontSize: 12,
    color: '#708090',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#708090',
  },
  testButton: {
    backgroundColor: '#00FFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#2E2E3F',
    opacity: 0.5,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0A0F',
  },
  infoSection: {
    margin: 20,
    marginTop: 0,
  },
  infoCard: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#708090',
    lineHeight: 20,
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
