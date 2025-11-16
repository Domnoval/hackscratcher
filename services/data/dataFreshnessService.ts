/**
 * Data Freshness Service
 * Tracks when lottery data was last updated and alerts users if stale
 */

import { supabase } from '../../lib/supabase';

export interface DataFreshnessInfo {
  lastUpdated: Date | null;
  isStale: boolean;
  staleness: 'fresh' | 'recent' | 'stale' | 'very-stale' | 'unknown';
  message: string;
  minutesOld: number | null;
}

export class DataFreshnessService {
  // Data is considered "stale" after 6 hours
  private static STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000;

  // Data is "very stale" after 24 hours
  private static VERY_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

  /**
   * Check when data was last updated
   * Queries the most recent game update timestamp
   */
  static async getDataFreshness(): Promise<DataFreshnessInfo> {
    try {
      // Query the most recent updated_at timestamp from games table
      const { data, error } = await supabase
        .from('games')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('[DataFreshness] Error fetching update time:', error);
        return this.createUnknownFreshness();
      }

      if (!data || !data.updated_at) {
        return this.createUnknownFreshness();
      }

      const lastUpdated = new Date(data.updated_at);
      const now = new Date();
      const ageMs = now.getTime() - lastUpdated.getTime();
      const minutesOld = Math.floor(ageMs / (60 * 1000));

      return this.analyzeFreshness(lastUpdated, ageMs, minutesOld);
    } catch (error) {
      console.error('[DataFreshness] Exception:', error);
      return this.createUnknownFreshness();
    }
  }

  /**
   * Analyze data age and return freshness info
   */
  private static analyzeFreshness(
    lastUpdated: Date,
    ageMs: number,
    minutesOld: number
  ): DataFreshnessInfo {
    let staleness: DataFreshnessInfo['staleness'];
    let isStale: boolean;
    let message: string;

    if (ageMs < 60 * 60 * 1000) {
      // Less than 1 hour
      staleness = 'fresh';
      isStale = false;
      message = `Data updated ${minutesOld} minute${minutesOld !== 1 ? 's' : ''} ago`;
    } else if (ageMs < this.STALE_THRESHOLD_MS) {
      // 1-6 hours
      const hoursOld = Math.floor(minutesOld / 60);
      staleness = 'recent';
      isStale = false;
      message = `Data updated ${hoursOld} hour${hoursOld !== 1 ? 's' : ''} ago`;
    } else if (ageMs < this.VERY_STALE_THRESHOLD_MS) {
      // 6-24 hours
      const hoursOld = Math.floor(minutesOld / 60);
      staleness = 'stale';
      isStale = true;
      message = `⚠️ Data is ${hoursOld} hours old - recommendations may not reflect latest prizes`;
    } else {
      // Over 24 hours
      const daysOld = Math.floor(minutesOld / (60 * 24));
      staleness = 'very-stale';
      isStale = true;
      message = `⚠️ Data is ${daysOld} day${daysOld !== 1 ? 's' : ''} old - use with caution`;
    }

    return {
      lastUpdated,
      isStale,
      staleness,
      message,
      minutesOld,
    };
  }

  /**
   * Create unknown freshness response
   */
  private static createUnknownFreshness(): DataFreshnessInfo {
    return {
      lastUpdated: null,
      isStale: true,
      staleness: 'unknown',
      message: 'Unable to verify data freshness',
      minutesOld: null,
    };
  }

  /**
   * Get a color indicator for UI display
   */
  static getFreshnessColor(staleness: DataFreshnessInfo['staleness']): string {
    switch (staleness) {
      case 'fresh':
        return '#10b981'; // Green
      case 'recent':
        return '#3b82f6'; // Blue
      case 'stale':
        return '#f59e0b'; // Orange
      case 'very-stale':
        return '#ef4444'; // Red
      case 'unknown':
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get an emoji indicator
   */
  static getFreshnessEmoji(staleness: DataFreshnessInfo['staleness']): string {
    switch (staleness) {
      case 'fresh':
        return '✅';
      case 'recent':
        return '🕐';
      case 'stale':
        return '⚠️';
      case 'very-stale':
        return '❌';
      case 'unknown':
        return '❓';
    }
  }

  /**
   * Format last update time as human-readable string
   */
  static formatUpdateTime(date: Date | null): string {
    if (!date) return 'Unknown';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}
