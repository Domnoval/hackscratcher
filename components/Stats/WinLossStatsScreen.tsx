import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { TicketScannerService } from '../../services/scanner/ticketScanner';
import { WinLossStats, ScannedTicket } from '../../types/scanner';

export default function WinLossStatsScreen() {
  const [stats, setStats] = useState<WinLossStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScannedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsData, recentData] = await Promise.all([
        TicketScannerService.getWinLossStats(),
        TicketScannerService.getRecentScans(10)
      ]);

      setStats(statsData);
      setRecentScans(recentData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.loadingText}>Loading your stats...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Stats Yet</Text>
        <Text style={styles.emptyText}>
          Start scanning tickets to track your wins and losses!
        </Text>
      </View>
    );
  }

  const todayRoi = stats.todaySpent > 0
    ? ((stats.todayWon - stats.todaySpent) / stats.todaySpent) * 100
    : 0;

  const weekRoi = stats.weekSpent > 0
    ? ((stats.weekWon - stats.weekSpent) / stats.weekSpent) * 100
    : 0;

  const allTimeRoi = stats.allTimeSpent > 0
    ? ((stats.allTimeWon - stats.allTimeSpent) / stats.allTimeSpent) * 100
    : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFFF" />
      }
    >
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Your Lottery Stats</Text>
        <Text style={styles.headerSubtitle}>Win/Loss Tracking</Text>
      </View>

      {/* Current Streak */}
      {stats.currentStreak.count > 0 && (
        <View style={[
          styles.streakCard,
          stats.currentStreak.type === 'winning' && styles.winningStreakCard
        ]}>
          <Text style={styles.streakIcon}>
            {stats.currentStreak.type === 'winning' ? '🔥' : '❄️'}
          </Text>
          <Text style={styles.streakText}>
            {stats.currentStreak.count} {stats.currentStreak.type} streak!
          </Text>
        </View>
      )}

      {/* Today's Stats */}
      <View style={styles.periodCard}>
        <Text style={styles.periodTitle}>Today</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, styles.spentColor]}>
              ${stats.todaySpent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Won</Text>
            <Text style={[styles.statValue, styles.wonColor]}>
              ${stats.todayWon.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>ROI</Text>
            <Text style={[
              styles.statValue,
              todayRoi >= 0 ? styles.positiveColor : styles.negativeColor
            ]}>
              {todayRoi >= 0 ? '+' : ''}{todayRoi.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* This Week's Stats */}
      <View style={styles.periodCard}>
        <Text style={styles.periodTitle}>This Week</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, styles.spentColor]}>
              ${stats.weekSpent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Won</Text>
            <Text style={[styles.statValue, styles.wonColor]}>
              ${stats.weekWon.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>ROI</Text>
            <Text style={[
              styles.statValue,
              weekRoi >= 0 ? styles.positiveColor : styles.negativeColor
            ]}>
              {weekRoi >= 0 ? '+' : ''}{weekRoi.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* This Month's Stats */}
      <View style={styles.periodCard}>
        <Text style={styles.periodTitle}>This Month</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, styles.spentColor]}>
              ${stats.monthSpent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Won</Text>
            <Text style={[styles.statValue, styles.wonColor]}>
              ${stats.monthWon.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>ROI</Text>
            <Text style={[
              styles.statValue,
              (stats.monthWon - stats.monthSpent) >= 0 ? styles.positiveColor : styles.negativeColor
            ]}>
              {(stats.monthWon - stats.monthSpent) >= 0 ? '+' : ''}
              ${(stats.monthWon - stats.monthSpent).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* All Time Stats */}
      <View style={[styles.periodCard, styles.allTimeCard]}>
        <Text style={styles.periodTitle}>🏆 All Time</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, styles.spentColor]}>
              ${stats.allTimeSpent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Won</Text>
            <Text style={[styles.statValue, styles.wonColor]}>
              ${stats.allTimeWon.toFixed(2)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>ROI</Text>
            <Text style={[
              styles.statValue,
              allTimeRoi >= 0 ? styles.positiveColor : styles.negativeColor
            ]}>
              {allTimeRoi >= 0 ? '+' : ''}{allTimeRoi.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Biggest Win */}
      {stats.biggestWin.amount > 0 && (
        <View style={styles.biggestWinCard}>
          <Text style={styles.biggestWinTitle}>🎉 Biggest Win</Text>
          <Text style={styles.biggestWinAmount}>
            ${stats.biggestWin.amount.toLocaleString()}
          </Text>
          <Text style={styles.biggestWinGame}>{stats.biggestWin.game}</Text>
          <Text style={styles.biggestWinDate}>
            {new Date(stats.biggestWin.date).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <View style={styles.recentScansSection}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <FlatList
            data={recentScans}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            nestedScrollEnabled={false}
            removeClippedSubviews={true}
            renderItem={({ item: scan }) => (
              <View
                style={[styles.scanItem, scan.isWinner && styles.winnerScanItem]}
              >
                <View style={styles.scanHeader}>
                  <Text style={styles.scanGame}>{scan.gameName}</Text>
                  <Text style={styles.scanDate}>
                    {new Date(scan.scannedDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.scanDetails}>
                  <Text style={styles.scanPrice}>${scan.price}</Text>
                  {scan.isWinner ? (
                    <Text style={styles.scanWin}>
                      Won: ${scan.prizeAmount?.toLocaleString()} 🎉
                    </Text>
                  ) : (
                    <Text style={styles.scanLoss}>Not a winner</Text>
                  )}
                </View>
              </View>
            )}
          />
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Track every ticket to optimize your lottery strategy!
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
  loadingText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginTop: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#708090',
    textAlign: 'center',
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
  streakCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#708090',
  },
  winningStreakCard: {
    borderColor: '#FFD700',
    backgroundColor: '#2E1A1A',
  },
  streakIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  streakText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  periodCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  allTimeCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#708090',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spentColor: {
    color: '#FF4500',
  },
  wonColor: {
    color: '#00FF7F',
  },
  positiveColor: {
    color: '#00FF7F',
  },
  negativeColor: {
    color: '#FF4500',
  },
  biggestWinCard: {
    backgroundColor: '#2E1A1A',
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  biggestWinTitle: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 12,
  },
  biggestWinAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00FF7F',
    marginBottom: 8,
  },
  biggestWinGame: {
    fontSize: 18,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  biggestWinDate: {
    fontSize: 14,
    color: '#708090',
  },
  recentScansSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 12,
  },
  scanItem: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  winnerScanItem: {
    borderColor: '#FFD700',
    backgroundColor: '#1A2E1A',
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scanGame: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  scanDate: {
    fontSize: 12,
    color: '#708090',
  },
  scanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanPrice: {
    fontSize: 14,
    color: '#708090',
  },
  scanWin: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00FF7F',
  },
  scanLoss: {
    fontSize: 14,
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