// Social Service - Community Features, Leaderboards, Challenges
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  WinPost,
  Leaderboard,
  Challenge,
  Referral,
  WinFeedFilters,
  Badge,
  Achievement
} from '../../types/social';

export class SocialService {
  private static readonly PROFILE_KEY = 'user_profile';
  private static readonly WIN_FEED_KEY = 'win_feed';
  private static readonly LEADERBOARDS_KEY = 'leaderboards';
  private static readonly CHALLENGES_KEY = 'challenges';
  private static readonly REFERRAL_KEY = 'referral';

  /**
   * Get user profile
   */
  static async getUserProfile(userId?: string): Promise<UserProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(this.PROFILE_KEY);
      if (!stored) {
        // Create default profile
        return await this.createDefaultProfile();
      }
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Create default user profile
   */
  private static async createDefaultProfile(): Promise<UserProfile> {
    const profile: UserProfile = {
      userId: `user-${Date.now()}`,
      username: `oracle_${Math.floor(Math.random() * 10000)}`,
      displayName: 'Lucky Player',
      joinDate: new Date().toISOString(),
      stats: {
        totalScanned: 0,
        totalWins: 0,
        totalWinnings: 0,
        totalSpent: 0,
        roi: 0,
        biggestWin: 0,
        currentStreak: 0,
        level: 1
      },
      badges: [],
      achievements: [],
      following: [],
      followers: [],
      privacySettings: {
        showWins: true,
        showStats: true,
        showLocation: false
      }
    };

    await AsyncStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }

  /**
   * Post a win to social feed
   */
  static async postWin(
    gameId: string,
    gameName: string,
    prizeAmount: number,
    storeId?: string,
    storeName?: string,
    mood?: string
  ): Promise<WinPost> {
    const profile = await this.getUserProfile();
    if (!profile) throw new Error('User profile not found');

    const post: WinPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: profile.userId,
      username: profile.username,
      gameId,
      gameName,
      prizeAmount,
      storeId,
      storeName,
      timestamp: new Date().toISOString(),
      verified: true,
      likes: 0,
      comments: [],
      likedBy: [],
      mood
    };

    // Save to feed
    const feed = await this.getWinFeed();
    feed.unshift(post);
    await AsyncStorage.setItem(this.WIN_FEED_KEY, JSON.stringify(feed.slice(0, 500))); // Keep last 500

    // Check for achievements
    await this.checkAchievements(profile, post);

    return post;
  }

  /**
   * Get win feed with filters
   */
  static async getWinFeed(filters?: WinFeedFilters): Promise<WinPost[]> {
    try {
      const stored = await AsyncStorage.getItem(this.WIN_FEED_KEY);
      let feed: WinPost[] = stored ? JSON.parse(stored) : this.getMockWinFeed();

      // Apply filters
      if (filters) {
        if (filters.timeframe) {
          const now = new Date();
          const cutoff = new Date();
          if (filters.timeframe === 'today') cutoff.setHours(0, 0, 0, 0);
          else if (filters.timeframe === 'week') cutoff.setDate(now.getDate() - 7);
          else if (filters.timeframe === 'month') cutoff.setMonth(now.getMonth() - 1);

          feed = feed.filter(post => new Date(post.timestamp) >= cutoff);
        }

        if (filters.minAmount) {
          feed = feed.filter(post => post.prizeAmount >= filters.minAmount!);
        }

        if (filters.gameId) {
          feed = feed.filter(post => post.gameId === filters.gameId);
        }

        if (filters.userId) {
          feed = feed.filter(post => post.userId === filters.userId);
        }
      }

      return feed;
    } catch {
      return this.getMockWinFeed();
    }
  }

  /**
   * Get mock win feed for demo
   */
  private static getMockWinFeed(): WinPost[] {
    const now = new Date();
    return [
      {
        id: 'post-001',
        userId: 'user-123',
        username: 'lucky_lucy',
        gameId: 'MN-2025-001',
        gameName: 'Lucky 7s',
        prizeAmount: 77777,
        storeName: 'Target on Lake St',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        verified: true,
        likes: 156,
        comments: [],
        likedBy: [],
        mood: '🎉 Ecstatic!'
      },
      {
        id: 'post-002',
        userId: 'user-456',
        username: 'scratch_king',
        gameId: 'MN-2025-002',
        gameName: 'Cash Blast',
        prizeAmount: 10000,
        storeName: 'Holiday Gas',
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        verified: true,
        likes: 89,
        comments: [],
        likedBy: [],
        mood: '💰 Money Moves!'
      },
      {
        id: 'post-003',
        userId: 'user-789',
        username: 'oracle_master',
        gameId: 'MN-2025-004',
        gameName: 'Golden Ticket',
        prizeAmount: 2500,
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        verified: true,
        likes: 42,
        comments: [],
        likedBy: []
      }
    ];
  }

  /**
   * Like a win post
   */
  static async likePost(postId: string, userId: string): Promise<void> {
    const feed = await this.getWinFeed();
    const post = feed.find(p => p.id === postId);

    if (post && !post.likedBy.includes(userId)) {
      post.likes++;
      post.likedBy.push(userId);
      await AsyncStorage.setItem(this.WIN_FEED_KEY, JSON.stringify(feed));
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(
    type: 'total_winnings' | 'roi' | 'win_streak' | 'scans' | 'lucky_score',
    timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'
  ): Promise<Leaderboard> {
    // Mock leaderboard data
    const entries = [
      {
        rank: 1,
        userId: 'user-top1',
        username: 'mega_winner',
        displayName: 'Mega Winner',
        score: 250000,
        change: 0,
        badge: '🥇'
      },
      {
        rank: 2,
        userId: 'user-top2',
        username: 'scratch_legend',
        displayName: 'Scratch Legend',
        score: 180000,
        change: 1,
        badge: '🥈'
      },
      {
        rank: 3,
        userId: 'user-top3',
        username: 'lucky_star',
        displayName: 'Lucky Star',
        score: 145000,
        change: -1,
        badge: '🥉'
      },
      {
        rank: 4,
        userId: 'user-top4',
        username: 'oracle_pro',
        displayName: 'Oracle Pro',
        score: 98000,
        change: 2
      },
      {
        rank: 5,
        userId: 'user-top5',
        username: 'win_machine',
        displayName: 'Win Machine',
        score: 76000,
        change: 0
      }
    ];

    return {
      type,
      timeframe,
      entries,
      userRank: 42,
      totalParticipants: 1584
    };
  }

  /**
   * Get active challenges
   */
  static async getChallenges(): Promise<Challenge[]> {
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return [
      {
        id: 'challenge-001',
        type: 'community',
        title: '🎯 Weekend Warrior',
        description: 'Scan 10 tickets this weekend',
        icon: '🎯',
        startDate: now.toISOString(),
        endDate: weekEnd.toISOString(),
        status: 'active',
        goal: {
          type: 'scans',
          target: 10
        },
        reward: {
          type: 'premium_days',
          value: 3
        },
        participants: 342,
        userProgress: {
          current: 6,
          percentage: 60,
          rank: 45
        }
      },
      {
        id: 'challenge-002',
        type: 'community',
        title: '💰 ROI Master',
        description: 'Achieve 50%+ ROI this month',
        icon: '💰',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate: monthEnd.toISOString(),
        status: 'active',
        goal: {
          type: 'roi',
          target: 50
        },
        reward: {
          type: 'badge',
          value: { id: 'roi_master', name: 'ROI Master' }
        },
        participants: 1247,
        userProgress: {
          current: 32,
          percentage: 64,
          rank: 120
        }
      },
      {
        id: 'challenge-003',
        type: 'personal',
        title: '🔥 Hot Streak',
        description: 'Win 3 times in a row',
        icon: '🔥',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        goal: {
          type: 'win_streak',
          target: 3
        },
        reward: {
          type: 'boost',
          value: { type: 'luck_multiplier', multiplier: 1.5, duration: 7 }
        },
        participants: 1,
        userProgress: {
          current: 1,
          percentage: 33
        }
      }
    ];
  }

  /**
   * Get user's referral code and stats
   */
  static async getReferralInfo(): Promise<Referral> {
    const profile = await this.getUserProfile();
    if (!profile) throw new Error('User profile not found');

    return {
      code: `ORACLE${profile.userId.slice(-6).toUpperCase()}`,
      userId: profile.userId,
      uses: 3,
      maxUses: undefined,
      rewards: {
        referrer: {
          type: 'premium_days',
          value: 7
        },
        referee: {
          type: 'premium_days',
          value: 3
        }
      },
      referredUsers: [
        {
          userId: 'ref-001',
          username: 'friend1',
          joinDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          rewardClaimed: true
        },
        {
          userId: 'ref-002',
          username: 'friend2',
          joinDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          rewardClaimed: true
        },
        {
          userId: 'ref-003',
          username: 'friend3',
          joinDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          rewardClaimed: false
        }
      ]
    };
  }

  /**
   * Get available badges
   */
  static getAvailableBadges(): Badge[] {
    return [
      {
        id: 'first_win',
        name: 'First Blood',
        description: 'Win your first prize',
        icon: '🎉',
        rarity: 'common'
      },
      {
        id: 'big_winner',
        name: 'Big Winner',
        description: 'Win $1000+ on a single ticket',
        icon: '💎',
        rarity: 'rare'
      },
      {
        id: 'hot_streak_5',
        name: 'On Fire',
        description: 'Win 5 times in a row',
        icon: '🔥',
        rarity: 'epic'
      },
      {
        id: 'jackpot_hunter',
        name: 'Jackpot Hunter',
        description: 'Win a top prize',
        icon: '👑',
        rarity: 'legendary'
      },
      {
        id: 'roi_master',
        name: 'ROI Master',
        description: 'Achieve 100%+ ROI',
        icon: '📈',
        rarity: 'epic'
      },
      {
        id: 'scanner_pro',
        name: 'Scanner Pro',
        description: 'Scan 100 tickets',
        icon: '📱',
        rarity: 'rare'
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Get 100 likes on posts',
        icon: '🦋',
        rarity: 'rare'
      },
      {
        id: 'lucky_zodiac',
        name: 'Cosmic Winner',
        description: 'Win on your lucky day',
        icon: '⭐',
        rarity: 'epic'
      }
    ];
  }

  /**
   * Get achievements
   */
  static async getAchievements(): Promise<Achievement[]> {
    const profile = await this.getUserProfile();
    if (!profile) return [];

    return [
      {
        id: 'scan_10',
        title: 'Ticket Scanner',
        description: 'Scan 10 tickets',
        icon: '📱',
        progress: Math.min((profile.stats.totalScanned / 10) * 100, 100),
        requirement: 10,
        category: 'scanning'
      },
      {
        id: 'win_5',
        title: 'Winner',
        description: 'Win 5 prizes',
        icon: '🎉',
        progress: Math.min((profile.stats.totalWins / 5) * 100, 100),
        requirement: 5,
        reward: {
          type: 'badge',
          value: { id: 'winner', name: 'Winner' }
        },
        category: 'wins'
      },
      {
        id: 'roi_50',
        title: 'Profitable Player',
        description: 'Achieve 50% ROI',
        icon: '💰',
        progress: Math.min((Math.max(profile.stats.roi, 0) / 50) * 100, 100),
        requirement: 50,
        category: 'wins'
      },
      {
        id: 'share_3',
        title: 'Community Member',
        description: 'Share 3 wins',
        icon: '🌟',
        progress: 66,
        requirement: 3,
        category: 'social'
      },
      {
        id: 'lucky_mode',
        title: 'Mystic Oracle',
        description: 'Use Lucky Mode 10 times',
        icon: '🔮',
        progress: 40,
        requirement: 10,
        category: 'lucky'
      }
    ];
  }

  /**
   * Check and award achievements
   */
  private static async checkAchievements(profile: UserProfile, post: WinPost): Promise<void> {
    const newBadges: Badge[] = [];

    // First win
    if (profile.stats.totalWins === 1 && !profile.badges.find(b => b.id === 'first_win')) {
      newBadges.push({
        id: 'first_win',
        name: 'First Blood',
        description: 'Win your first prize',
        icon: '🎉',
        rarity: 'common',
        unlockedAt: new Date().toISOString()
      });
    }

    // Big winner
    if (post.prizeAmount >= 1000 && !profile.badges.find(b => b.id === 'big_winner')) {
      newBadges.push({
        id: 'big_winner',
        name: 'Big Winner',
        description: 'Win $1000+ on a single ticket',
        icon: '💎',
        rarity: 'rare',
        unlockedAt: new Date().toISOString()
      });
    }

    if (newBadges.length > 0) {
      profile.badges.push(...newBadges);
      await AsyncStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));

      // In production, show achievement notification
      console.log('🎉 New badges unlocked:', newBadges.map(b => b.name).join(', '));
    }
  }

  /**
   * Update user level based on XP
   */
  static calculateLevel(stats: UserProfile['stats']): number {
    const xp = stats.totalScanned * 10 + stats.totalWins * 100 + stats.totalWinnings / 10;
    return Math.floor(Math.log2(xp / 100 + 1)) + 1;
  }
}
