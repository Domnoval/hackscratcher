import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated
} from 'react-native';
// import { DataSyncService, SyncResult } from '../../services/sync/dataSyncService';
// import { NotificationService } from '../../services/notifications/notificationService';

interface SyncStatusBannerProps {
  onSyncComplete?: () => void;
}

export default function SyncStatusBanner({ onSyncComplete }: SyncStatusBannerProps) {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    checkLastSync();
    // Set up sync check interval
    const interval = setInterval(checkLastSync, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Pulse animation for sync button when sync is needed
    let animation: Animated.CompositeAnimation | null = null;

    if (lastSyncTime && needsSync()) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }

    // CRITICAL: Cleanup animation when component unmounts or lastSyncTime changes
    return () => {
      if (animation) {
        animation.stop();
      }
      pulseAnim.setValue(1); // Reset to default value
    };
  }, [lastSyncTime]);

  const checkLastSync = async () => {
    try {
      // Once sync service packages are installed, uncomment:
      // const lastSync = await DataSyncService.getLastSyncTime();
      // setLastSyncTime(lastSync);

      // For now, simulate
      const mockLastSync = new Date(Date.now() - 45 * 60 * 1000); // 45 min ago
      setLastSyncTime(mockLastSync);
    } catch (error) {
      console.error('Failed to check last sync:', error);
    }
  };

  const handleSync = async () => {
    if (syncing) return;

    setSyncing(true);
    try {
      // Once sync service packages are installed, uncomment:
      // const result = await DataSyncService.syncData();
      // setSyncResult(result);
      // setLastSyncTime(new Date(result.timestamp));

      // if (result.success) {
      //   await NotificationService.processSyncResults(result);
      //   onSyncComplete?.();
      // }

      // For now, simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResult = {
        success: true,
        gamesUpdated: 5,
        newGames: ['Lucky Strike'],
        retiredGames: [],
        hotGames: ['Cash Blast', 'Lucky 7s'],
        timestamp: new Date().toISOString()
      };
      setSyncResult(mockResult);
      setLastSyncTime(new Date());
      onSyncComplete?.();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const needsSync = (): boolean => {
    if (!lastSyncTime) return true;
    const timeSinceSync = Date.now() - lastSyncTime.getTime();
    return timeSinceSync >= 3600000; // 1 hour
  };

  const getTimeSinceSync = (): string => {
    if (!lastSyncTime) return 'Never';

    const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getSyncStatusColor = (): string => {
    if (!lastSyncTime) return '#FF4500';

    const timeSinceSync = Date.now() - lastSyncTime.getTime();
    if (timeSinceSync < 1800000) return '#00FF7F'; // < 30 min: green
    if (timeSinceSync < 3600000) return '#FFD700'; // < 1 hour: gold
    return '#FF4500'; // > 1 hour: red
  };

  return (
    <View style={styles.container}>
      {/* Sync Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: getSyncStatusColor() }]} />
        <Text style={styles.statusText}>
          {syncing ? 'Syncing...' : `Updated ${getTimeSinceSync()}`}
        </Text>
      </View>

      {/* Sync Button */}
      <TouchableOpacity
        style={styles.syncButton}
        onPress={handleSync}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator size="small" color="#00FFFF" />
        ) : (
          <Animated.Text
            style={[
              styles.syncIcon,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            🔄
          </Animated.Text>
        )}
      </TouchableOpacity>

      {/* Sync Results (show briefly after sync) */}
      {syncResult && syncResult.success && !syncing && (
        <View style={styles.resultsContainer}>
          {syncResult.newGames.length > 0 && (
            <Text style={styles.resultText}>
              🎮 {syncResult.newGames.length} new game(s)
            </Text>
          )}
          {syncResult.hotGames.length > 0 && (
            <Text style={styles.resultTextHot}>
              🔥 {syncResult.hotGames.length} hot ticket(s)
            </Text>
          )}
          {syncResult.retiredGames.length > 0 && (
            <Text style={styles.resultTextRetired}>
              ⚠️ {syncResult.retiredGames.length} ending soon
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E3F',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#708090',
  },
  syncButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E2E3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncIcon: {
    fontSize: 16,
  },
  resultsContainer: {
    position: 'absolute',
    top: 50,
    right: 12,
    backgroundColor: '#1A1A2E',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00FFFF',
    minWidth: 150,
  },
  resultText: {
    fontSize: 11,
    color: '#00FFFF',
    marginBottom: 4,
  },
  resultTextHot: {
    fontSize: 11,
    color: '#FFD700',
    marginBottom: 4,
  },
  resultTextRetired: {
    fontSize: 11,
    color: '#FF4500',
  },
});
