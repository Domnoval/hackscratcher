// Social Features Types - Community, Leaderboards, Challenges

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  joinDate: string;
  location?: string;
  zodiacSign?: string;
  stats: {
    totalScanned: number;
    totalWins: number;
    totalWinnings: number;
    totalSpent: number;
    roi: number;
    biggestWin: number;
    currentStreak: number;
    level: number;
  };
  badges: Badge[];
  achievements: Achievement[];
  following: string[]; // User IDs
  followers: string[]; // User IDs
  privacySettings: {
    showWins: boolean;
    showStats: boolean;
    showLocation: boolean;
  };
}

export interface WinPost {
  id: string;
  userId: string;
  username: string;
  gameId: string;
  gameName: string;
  prizeAmount: number;
  storeId?: string;
  storeName?: string;
  timestamp: string;
  verified: boolean;
  likes: number;
  comments: Comment[];
  likedBy: string[]; // User IDs
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  mood?: string; // "🎉 Ecstatic!", "💪 Feeling Lucky!"
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number; // 0-100
  requirement: number;
  reward?: {
    type: 'badge' | 'boost' | 'premium_days';
    value: any;
  };
  category: 'wins' | 'scanning' | 'social' | 'lucky';
}

export interface Leaderboard {
  type: 'total_winnings' | 'roi' | 'win_streak' | 'scans' | 'lucky_score';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time';
  entries: LeaderboardEntry[];
  userRank?: number;
  totalParticipants: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  change: number; // Rank change from previous period
  badge?: string; // Top 3 get special badges
}

export interface Challenge {
  id: string;
  type: 'community' | 'personal' | 'versus';
  title: string;
  description: string;
  icon: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  goal: {
    type: 'total_wins' | 'roi' | 'scans' | 'lucky_score';
    target: number;
  };
  reward: {
    type: 'premium_days' | 'badge' | 'boost';
    value: any;
  };
  participants: number;
  leaderboard?: LeaderboardEntry[];
  userProgress?: {
    current: number;
    percentage: number;
    rank?: number;
  };
}

export interface Referral {
  code: string;
  userId: string;
  uses: number;
  maxUses?: number;
  rewards: {
    referrer: {
      type: 'premium_days' | 'boost';
      value: number;
    };
    referee: {
      type: 'premium_days' | 'boost';
      value: number;
    };
  };
  referredUsers: {
    userId: string;
    username: string;
    joinDate: string;
    rewardClaimed: boolean;
  }[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'challenge' | 'achievement' | 'win_nearby';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  data?: any;
}

export interface WinFeedFilters {
  timeframe?: 'today' | 'week' | 'month' | 'all';
  minAmount?: number;
  gameId?: string;
  userId?: string;
  nearMe?: boolean;
  following?: boolean;
}
