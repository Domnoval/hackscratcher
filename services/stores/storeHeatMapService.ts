// Store Heat Map Service - Community Lucky Stores
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StoreLocation,
  WinRecord,
  StoreHeatScore,
  HotStore,
  UserStoreRating,
  StoreSearchFilters,
  HeatMapLayer
} from '../../types/stores';

export class StoreHeatMapService {
  private static readonly STORES_KEY = 'store_locations';
  private static readonly WINS_KEY = 'win_records';
  private static readonly RATINGS_KEY = 'store_ratings';
  private static readonly USER_LOCATION_KEY = 'user_location';

  /**
   * Get Minnesota lottery retailer mock data
   * In production, this would pull from MN Lottery retailer API
   */
  private static getMockStores(): StoreLocation[] {
    return [
      {
        id: 'store-001',
        name: 'Target',
        address: '1515 Lake St E',
        city: 'Minneapolis',
        state: 'MN',
        zipCode: '55407',
        latitude: 44.9481,
        longitude: -93.2441,
        type: 'grocery',
        phoneNumber: '(612) 555-0101'
      },
      {
        id: 'store-002',
        name: 'Holiday Gas Station',
        address: '2801 Hennepin Ave',
        city: 'Minneapolis',
        state: 'MN',
        zipCode: '55408',
        latitude: 44.9486,
        longitude: -93.2989,
        type: 'gas_station',
        phoneNumber: '(612) 555-0102'
      },
      {
        id: 'store-003',
        name: 'Cub Foods',
        address: '3600 Chicago Ave',
        city: 'Minneapolis',
        state: 'MN',
        zipCode: '55407',
        latitude: 44.9349,
        longitude: -93.2626,
        type: 'grocery',
        phoneNumber: '(612) 555-0103'
      },
      {
        id: 'store-004',
        name: 'Speedway',
        address: '1500 University Ave SE',
        city: 'Minneapolis',
        state: 'MN',
        zipCode: '55414',
        latitude: 44.9766,
        longitude: -93.2327,
        type: 'gas_station',
        phoneNumber: '(612) 555-0104'
      },
      {
        id: 'store-005',
        name: 'MGM Wine & Spirits',
        address: '4600 Excelsior Blvd',
        city: 'Minneapolis',
        state: 'MN',
        zipCode: '55416',
        latitude: 44.9272,
        longitude: -93.3509,
        type: 'liquor',
        phoneNumber: '(612) 555-0105'
      },
      {
        id: 'store-006',
        name: '7-Eleven',
        address: '800 Washington Ave S',
        city: 'Minneapolis',
        state: 'MN',
        zipCode: '55415',
        latitude: 44.9739,
        longitude: -93.2567,
        type: 'convenience',
        phoneNumber: '(612) 555-0106'
      },
      {
        id: 'store-007',
        name: 'Kwik Trip',
        address: '5201 Brooklyn Blvd',
        city: 'Brooklyn Center',
        state: 'MN',
        zipCode: '55429',
        latitude: 45.0611,
        longitude: -93.3149,
        type: 'gas_station',
        phoneNumber: '(763) 555-0107'
      },
      {
        id: 'store-008',
        name: 'Rainbow Foods',
        address: '2100 Ford Pkwy',
        city: 'St Paul',
        state: 'MN',
        zipCode: '55116',
        latitude: 44.9153,
        longitude: -93.1784,
        type: 'grocery',
        phoneNumber: '(651) 555-0108'
      },
    ];
  }

  /**
   * Generate mock win records for demonstration
   */
  private static getMockWinRecords(): WinRecord[] {
    const now = new Date();
    const recentDate = (daysAgo: number) =>
      new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    return [
      {
        id: 'win-001',
        storeId: 'store-001',
        gameId: 'MN-2025-001',
        gameName: 'Lucky 7s',
        prizeAmount: 77777,
        winDate: recentDate(2),
        verified: true,
        upvotes: 45,
        downvotes: 2
      },
      {
        id: 'win-002',
        storeId: 'store-002',
        gameId: 'MN-2025-002',
        gameName: 'Cash Blast',
        prizeAmount: 10000,
        winDate: recentDate(5),
        verified: true,
        upvotes: 23,
        downvotes: 0
      },
      {
        id: 'win-003',
        storeId: 'store-001',
        gameId: 'MN-2025-004',
        gameName: 'Golden Ticket',
        prizeAmount: 2500,
        winDate: recentDate(1),
        verified: true,
        upvotes: 67,
        downvotes: 3
      },
      {
        id: 'win-004',
        storeId: 'store-005',
        gameId: 'MN-2025-002',
        gameName: 'Cash Blast',
        prizeAmount: 200000,
        winDate: recentDate(3),
        verified: true,
        upvotes: 234,
        downvotes: 5
      },
      {
        id: 'win-005',
        storeId: 'store-003',
        gameId: 'MN-2025-001',
        gameName: 'Lucky 7s',
        prizeAmount: 777,
        winDate: recentDate(7),
        verified: true,
        upvotes: 12,
        downvotes: 1
      },
    ];
  }

  /**
   * Calculate heat score for a store
   */
  static calculateHeatScore(storeId: string, wins: WinRecord[]): StoreHeatScore {
    const storeWins = wins.filter(w => w.storeId === storeId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalWins = storeWins.length;
    const totalPayout = storeWins.reduce((sum, w) => sum + w.prizeAmount, 0);
    const recentWins = storeWins.filter(w => new Date(w.winDate) >= thirtyDaysAgo).length;
    const bigWins = storeWins.filter(w => w.prizeAmount >= 1000).length;

    // Calculate win streak (consecutive days with wins)
    const sortedWins = [...storeWins].sort((a, b) =>
      new Date(b.winDate).getTime() - new Date(a.winDate).getTime()
    );
    let winStreak = 0;
    let lastWinDate = new Date(sortedWins[0]?.winDate || 0);

    for (const win of sortedWins) {
      const winDate = new Date(win.winDate);
      const daysDiff = Math.floor((lastWinDate.getTime() - winDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        winStreak++;
        lastWinDate = winDate;
      } else {
        break;
      }
    }

    // Get hot games at this store
    const gameCounts = new Map<string, number>();
    storeWins.forEach(w => {
      gameCounts.set(w.gameName, (gameCounts.get(w.gameName) || 0) + 1);
    });
    const hotGames = Array.from(gameCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([game, _]) => game);

    // Calculate score (0-100)
    const recencyScore = Math.min(recentWins * 10, 40); // Max 40 points
    const payoutScore = Math.min(totalPayout / 10000, 30); // Max 30 points
    const bigWinScore = Math.min(bigWins * 5, 20); // Max 20 points
    const streakScore = Math.min(winStreak * 2, 10); // Max 10 points

    const score = Math.min(recencyScore + payoutScore + bigWinScore + streakScore, 100);

    return {
      storeId,
      score: Math.round(score),
      totalWins,
      totalPayout,
      recentWins,
      bigWins,
      winStreak,
      lastWinDate: sortedWins[0]?.winDate || '',
      hotGames
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get hot stores with filters
   */
  static async getHotStores(
    userLocation?: { latitude: number; longitude: number },
    filters: StoreSearchFilters = {}
  ): Promise<HotStore[]> {
    const stores = this.getMockStores();
    const wins = this.getMockWinRecords();
    const ratings = await this.getAllRatings();

    let hotStores: HotStore[] = stores.map(store => {
      const heatScore = this.calculateHeatScore(store.id, wins);
      const storeWins = wins.filter(w => w.storeId === store.id);
      const storeRatings = ratings.filter(r => r.storeId === store.id);

      const avgRating = storeRatings.length > 0
        ? storeRatings.reduce((sum, r) => sum + r.rating, 0) / storeRatings.length
        : 0;

      const distance = userLocation
        ? this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            store.latitude,
            store.longitude
          )
        : undefined;

      return {
        ...store,
        heatScore,
        distance,
        recentWins: storeWins.slice(0, 5),
        rating: Math.round(avgRating * 10) / 10,
        totalRatings: storeRatings.length
      };
    });

    // Apply filters
    if (filters.radius && userLocation) {
      hotStores = hotStores.filter(s => (s.distance || 999) <= filters.radius!);
    }

    if (filters.minHeatScore) {
      hotStores = hotStores.filter(s => s.heatScore.score >= filters.minHeatScore!);
    }

    if (filters.storeTypes && filters.storeTypes.length > 0) {
      hotStores = hotStores.filter(s => filters.storeTypes!.includes(s.type));
    }

    if (filters.hasRecentWins) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      hotStores = hotStores.filter(s =>
        s.heatScore.lastWinDate && new Date(s.heatScore.lastWinDate) >= sevenDaysAgo
      );
    }

    if (filters.minPayout) {
      hotStores = hotStores.filter(s => s.heatScore.totalPayout >= filters.minPayout!);
    }

    if (filters.gameId) {
      hotStores = hotStores.filter(s =>
        s.recentWins.some(w => w.gameId === filters.gameId)
      );
    }

    // Sort by heat score (descending)
    hotStores.sort((a, b) => b.heatScore.score - a.heatScore.score);

    return hotStores;
  }

  /**
   * Submit a win record
   */
  static async submitWin(win: Omit<WinRecord, 'id' | 'verified' | 'upvotes' | 'downvotes'>): Promise<WinRecord> {
    const newWin: WinRecord = {
      ...win,
      id: `win-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      verified: false, // Requires community verification
      upvotes: 0,
      downvotes: 0
    };

    // Save to storage
    const wins = this.getMockWinRecords();
    wins.push(newWin);
    await AsyncStorage.setItem(this.WINS_KEY, JSON.stringify(wins));

    return newWin;
  }

  /**
   * Vote on a win record (verify legitimacy)
   */
  static async voteOnWin(winId: string, upvote: boolean): Promise<void> {
    const wins = this.getMockWinRecords();
    const win = wins.find(w => w.id === winId);

    if (win) {
      if (upvote) {
        win.upvotes++;
      } else {
        win.downvotes++;
      }

      // Auto-verify if upvotes >= 10 and ratio > 80%
      if (win.upvotes >= 10 && win.upvotes / (win.upvotes + win.downvotes) > 0.8) {
        win.verified = true;
      }

      await AsyncStorage.setItem(this.WINS_KEY, JSON.stringify(wins));
    }
  }

  /**
   * Rate a store
   */
  static async rateStore(rating: Omit<UserStoreRating, 'visitDate'>): Promise<void> {
    const ratings = await this.getAllRatings();
    const newRating: UserStoreRating = {
      ...rating,
      visitDate: new Date().toISOString()
    };

    ratings.push(newRating);
    await AsyncStorage.setItem(this.RATINGS_KEY, JSON.stringify(ratings));
  }

  /**
   * Get all store ratings
   */
  private static async getAllRatings(): Promise<UserStoreRating[]> {
    try {
      const stored = await AsyncStorage.getItem(this.RATINGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Generate heat map layer data
   */
  static async getHeatMapLayer(
    userLocation?: { latitude: number; longitude: number },
    filters: StoreSearchFilters = {}
  ): Promise<HeatMapLayer> {
    const hotStores = await this.getHotStores(userLocation, filters);

    const points = hotStores.map(store => ({
      latitude: store.latitude,
      longitude: store.longitude,
      weight: store.heatScore.score / 100 // Normalize to 0-1
    }));

    return {
      points,
      gradient: {
        colors: ['#00FF7F', '#FFD700', '#FF4500'], // Green → Gold → Red
        stops: [0, 0.5, 1]
      }
    };
  }

  /**
   * Get top 3 hottest stores nearby
   */
  static async getTopHotStores(
    userLocation: { latitude: number; longitude: number },
    radius: number = 10
  ): Promise<HotStore[]> {
    const stores = await this.getHotStores(userLocation, { radius });
    return stores.slice(0, 3);
  }

  /**
   * Save user location
   */
  static async saveUserLocation(location: { latitude: number; longitude: number }): Promise<void> {
    await AsyncStorage.setItem(this.USER_LOCATION_KEY, JSON.stringify(location));
  }

  /**
   * Get saved user location
   */
  static async getUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const stored = await AsyncStorage.getItem(this.USER_LOCATION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
