// Store Heat Map Types - Community Lucky Stores

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  type: 'gas_station' | 'convenience' | 'grocery' | 'liquor' | 'other';
  phoneNumber?: string;
}

export interface WinRecord {
  id: string;
  storeId: string;
  gameId: string;
  gameName: string;
  prizeAmount: number;
  winDate: string;
  userId?: string; // If user shares their win
  verified: boolean;
  upvotes: number;
  downvotes: number;
}

export interface StoreHeatScore {
  storeId: string;
  score: number; // 0-100
  totalWins: number;
  totalPayout: number;
  recentWins: number; // Last 30 days
  bigWins: number; // $1000+
  winStreak: number;
  lastWinDate: string;
  hotGames: string[]; // Games with recent wins at this store
}

export interface HotStore extends StoreLocation {
  heatScore: StoreHeatScore;
  distance?: number; // Miles from user
  recentWins: WinRecord[];
  rating: number; // 0-5 stars (community rating)
  totalRatings: number;
}

export interface UserStoreRating {
  storeId: string;
  userId: string;
  rating: number; // 1-5 stars
  comment?: string;
  visitDate: string;
  purchased: string[]; // Game IDs purchased
  won: boolean;
  winAmount?: number;
}

export interface StoreSearchFilters {
  radius?: number; // Miles from user location
  minHeatScore?: number;
  storeTypes?: ('gas_station' | 'convenience' | 'grocery' | 'liquor' | 'other')[];
  hasRecentWins?: boolean; // Within 7 days
  minPayout?: number;
  gameId?: string; // Filter by specific game
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface HeatMapLayer {
  points: {
    latitude: number;
    longitude: number;
    weight: number; // Heat intensity (0-1)
  }[];
  gradient: {
    colors: string[];
    stops: number[];
  };
}
