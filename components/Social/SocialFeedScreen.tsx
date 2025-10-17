import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SocialService } from '../../services/social/socialService';
import { WinPost, Leaderboard, Challenge } from '../../types/social';

export default function SocialFeedScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'feed' | 'leaderboard' | 'challenges'>('feed');
  const [winFeed, setWinFeed] = useState<WinPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    try {
      if (tab === 'feed') {
        const feed = await SocialService.getWinFeed({ timeframe: 'week' });
        setWinFeed(feed);
      } else if (tab === 'leaderboard') {
        const board = await SocialService.getLeaderboard('total_winnings', 'weekly');
        setLeaderboard(board);
      } else if (tab === 'challenges') {
        const chall = await SocialService.getChallenges();
        setChallenges(chall);
      }
    } catch (error) {
      console.error('Failed to load social data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLike = async (postId: string) => {
    const profile = await SocialService.getUserProfile();
    if (!profile) return;

    await SocialService.likePost(postId, profile.userId);
    loadData();
  };

  const renderWinFeed = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFFF" />}>
      {winFeed.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{post.username[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.username}>{post.username}</Text>
                <Text style={styles.timestamp}>
                  {new Date(post.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
            {post.mood && <Text style={styles.mood}>{post.mood}</Text>}
          </View>

          <View style={styles.winContent}>
            <Text style={styles.winAmount}>${post.prizeAmount.toLocaleString()}</Text>
            <Text style={styles.gameName}>{post.gameName}</Text>
            {post.storeName && (
              <Text style={styles.storeName}>📍 {post.storeName}</Text>
            )}
          </View>

          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(post.id)}
            >
              <Text style={styles.actionIcon}>❤️</Text>
              <Text style={styles.actionText}>{post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>{post.comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🔗</Text>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFFF" />}>
      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardTitle}>🏆 Top Winners This Week</Text>
        <Text style={styles.leaderboardSubtitle}>
          Your Rank: #{leaderboard?.userRank} of {leaderboard?.totalParticipants}
        </Text>
      </View>

      {leaderboard?.entries.map((entry) => (
        <View key={entry.userId} style={styles.leaderboardCard}>
          <View style={styles.rankContainer}>
            {entry.badge ? (
              <Text style={styles.rankBadge}>{entry.badge}</Text>
            ) : (
              <Text style={styles.rankNumber}>#{entry.rank}</Text>
            )}
          </View>

          <View style={styles.leaderboardInfo}>
            <Text style={styles.leaderboardUsername}>{entry.displayName}</Text>
            <Text style={styles.leaderboardScore}>
              ${entry.score.toLocaleString()}
            </Text>
          </View>

          {entry.change !== 0 && (
            <View style={styles.changeContainer}>
              <Text
                style={[
                  styles.changeText,
                  { color: entry.change > 0 ? '#00FF7F' : '#FF4500' }
                ]}
              >
                {entry.change > 0 ? '↑' : '↓'}{Math.abs(entry.change)}
              </Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderChallenges = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFFF" />}>
      <View style={styles.challengesHeader}>
        <Text style={styles.challengesTitle}>⚡ Active Challenges</Text>
        <Text style={styles.challengesSubtitle}>Complete to earn rewards!</Text>
      </View>

      {challenges.map((challenge) => (
        <View key={challenge.id} style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeIcon}>{challenge.icon}</Text>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDescription}>{challenge.description}</Text>
            </View>
          </View>

          {challenge.userProgress && (
            <>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${challenge.userProgress.percentage}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {challenge.userProgress.current} / {challenge.goal.target}
                </Text>
              </View>

              {challenge.userProgress.rank && (
                <Text style={styles.challengeRank}>
                  Your Rank: #{challenge.userProgress.rank}
                </Text>
              )}
            </>
          )}

          <View style={styles.challengeFooter}>
            <Text style={styles.participants}>
              👥 {challenge.participants.toLocaleString()} participants
            </Text>
            <Text style={styles.reward}>
              🎁 {challenge.reward.type === 'premium_days'
                ? `${challenge.reward.value} days Premium`
                : challenge.reward.type}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.loadingText}>Loading community...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌟 Community</Text>
        <Text style={styles.headerSubtitle}>Connect with Fellow Winners</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'feed' && styles.tabActive]}
          onPress={() => setTab('feed')}
        >
          <Text style={[styles.tabText, tab === 'feed' && styles.tabTextActive]}>
            🎉 Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'leaderboard' && styles.tabActive]}
          onPress={() => setTab('leaderboard')}
        >
          <Text style={[styles.tabText, tab === 'leaderboard' && styles.tabTextActive]}>
            🏆 Leaderboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'challenges' && styles.tabActive]}
          onPress={() => setTab('challenges')}
        >
          <Text style={[styles.tabText, tab === 'challenges' && styles.tabTextActive]}>
            ⚡ Challenges
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'feed' && renderWinFeed()}
      {tab === 'leaderboard' && renderLeaderboard()}
      {tab === 'challenges' && renderChallenges()}
    </View>
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#00FFFF',
  },
  tabText: {
    fontSize: 14,
    color: '#708090',
  },
  tabTextActive: {
    color: '#0A0A0F',
    fontWeight: 'bold',
  },
  postCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00FFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A0A0F',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  timestamp: {
    fontSize: 10,
    color: '#708090',
  },
  mood: {
    fontSize: 12,
    color: '#FFD700',
  },
  winContent: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2E2E3F',
    marginBottom: 12,
  },
  winAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00FF7F',
    marginBottom: 8,
  },
  gameName: {
    fontSize: 18,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 12,
    color: '#00FFFF',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#708090',
  },
  leaderboardHeader: {
    padding: 20,
    alignItems: 'center',
  },
  leaderboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  leaderboardSubtitle: {
    fontSize: 14,
    color: '#708090',
  },
  leaderboardCard: {
    backgroundColor: '#1A1A2E',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankBadge: {
    fontSize: 32,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FFFF',
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  leaderboardUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 4,
  },
  leaderboardScore: {
    fontSize: 18,
    color: '#00FF7F',
  },
  changeContainer: {
    marginLeft: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  challengesHeader: {
    padding: 20,
    alignItems: 'center',
  },
  challengesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  challengesSubtitle: {
    fontSize: 14,
    color: '#708090',
  },
  challengeCard: {
    backgroundColor: '#1A1A2E',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  challengeIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#708090',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2E2E3F',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FFFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#708090',
    textAlign: 'right',
  },
  challengeRank: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 12,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#2E2E3F',
  },
  participants: {
    fontSize: 12,
    color: '#708090',
  },
  reward: {
    fontSize: 12,
    color: '#00FF7F',
    fontWeight: 'bold',
  },
});
