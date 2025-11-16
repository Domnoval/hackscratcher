/**
 * Data Freshness Badge
 * Shows users when lottery data was last updated
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DataFreshnessService, DataFreshnessInfo } from '../../services/data/dataFreshnessService';

interface DataFreshnessBadgeProps {
  onRefreshRequest?: () => void;
  showRefreshButton?: boolean;
}

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  onRefreshRequest,
  showRefreshButton = false,
}) => {
  const [freshness, setFreshness] = useState<DataFreshnessInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkFreshness();

    // Re-check every 5 minutes
    const interval = setInterval(checkFreshness, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkFreshness = async () => {
    const info = await DataFreshnessService.getDataFreshness();
    setFreshness(info);
  };

  const handleRefresh = async () => {
    if (isRefreshing || !onRefreshRequest) return;

    setIsRefreshing(true);
    try {
      await onRefreshRequest();
      await checkFreshness();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!freshness) {
    return null;
  }

  const color = DataFreshnessService.getFreshnessColor(freshness.staleness);
  const emoji = DataFreshnessService.getFreshnessEmoji(freshness.staleness);

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.message, { color }]}>{freshness.message}</Text>
      </View>

      {showRefreshButton && (
        <TouchableOpacity
          style={[styles.refreshButton, isRefreshing && styles.refreshingButton]}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    flex: 1,
  },
  emoji: {
    fontSize: 14,
    marginRight: 6,
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  refreshButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  refreshingButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#9ca3af',
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
