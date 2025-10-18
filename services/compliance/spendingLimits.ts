// Spending Limits Service - Responsible gambling features
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SpendingLimits {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface SpendingRecord {
  amount: number;
  date: string;
  gameId: string;
  gameName: string;
}

export interface SpendingStatus {
  dailySpent: number;
  weeklySpent: number;
  monthlySpent: number;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  canSpend: boolean;
  warnings: string[];
}

export class SpendingLimitsService {
  private static readonly LIMITS_KEY = 'spending_limits';
  private static readonly RECORDS_KEY = 'spending_records';
  private static readonly DEFAULT_LIMITS: SpendingLimits = {
    daily: 50,
    weekly: 200,
    monthly: 500
  };

  /**
   * Set user's spending limits
   */
  static async setSpendingLimits(limits: SpendingLimits): Promise<void> {
    // Validate limits
    if (limits.daily <= 0 || limits.weekly <= 0 || limits.monthly <= 0) {
      throw new Error('Spending limits must be positive numbers');
    }

    if (limits.daily > limits.weekly || limits.weekly > limits.monthly) {
      throw new Error('Limits must be: daily ≤ weekly ≤ monthly');
    }

    const limitsWithTimestamp = {
      ...limits,
      setDate: new Date().toISOString()
    };

    await AsyncStorage.setItem(this.LIMITS_KEY, JSON.stringify(limitsWithTimestamp));
  }

  /**
   * Get current spending limits
   */
  static async getSpendingLimits(): Promise<SpendingLimits> {
    try {
      const stored = await AsyncStorage.getItem(this.LIMITS_KEY);
      if (stored) {
        const { daily, weekly, monthly } = JSON.parse(stored);
        return { daily, weekly, monthly };
      }
    } catch (error) {
      console.error('Failed to get spending limits:', error);
    }

    return this.DEFAULT_LIMITS;
  }

  /**
   * Record a spending transaction
   */
  static async recordSpending(
    amount: number,
    gameId: string,
    gameName: string
  ): Promise<void> {
    const record: SpendingRecord = {
      amount,
      date: new Date().toISOString(),
      gameId,
      gameName
    };

    try {
      const existingRecords = await this.getSpendingRecords();
      const updatedRecords = [...existingRecords, record];

      // Keep only last 3 months of records
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentRecords = updatedRecords.filter(
        record => new Date(record.date) > threeMonthsAgo
      );

      await AsyncStorage.setItem(this.RECORDS_KEY, JSON.stringify(recentRecords));
    } catch (error) {
      console.error('Failed to record spending:', error);
      throw error;
    }
  }

  /**
   * Get current spending status
   */
  static async getSpendingStatus(): Promise<SpendingStatus> {
    const limits = await this.getSpendingLimits();
    const records = await this.getSpendingRecords();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailySpent = this.calculateSpending(records, today);
    const weeklySpent = this.calculateSpending(records, weekStart);
    const monthlySpent = this.calculateSpending(records, monthStart);

    const warnings: string[] = [];
    let canSpend = true;

    // Check limits and generate warnings
    if (dailySpent >= limits.daily) {
      warnings.push('Daily spending limit reached');
      canSpend = false;
    } else if (dailySpent >= limits.daily * 0.8) {
      warnings.push('Approaching daily spending limit');
    }

    if (weeklySpent >= limits.weekly) {
      warnings.push('Weekly spending limit reached');
      canSpend = false;
    } else if (weeklySpent >= limits.weekly * 0.8) {
      warnings.push('Approaching weekly spending limit');
    }

    if (monthlySpent >= limits.monthly) {
      warnings.push('Monthly spending limit reached');
      canSpend = false;
    } else if (monthlySpent >= limits.monthly * 0.8) {
      warnings.push('Approaching monthly spending limit');
    }

    return {
      dailySpent,
      weeklySpent,
      monthlySpent,
      dailyLimit: limits.daily,
      weeklyLimit: limits.weekly,
      monthlyLimit: limits.monthly,
      canSpend,
      warnings
    };
  }

  /**
   * Check if user can spend a specific amount
   */
  static async canSpend(amount: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const status = await this.getSpendingStatus();

    if (!status.canSpend) {
      return {
        allowed: false,
        reason: 'Spending limit already reached'
      };
    }

    // Check if this purchase would exceed limits
    if (status.dailySpent + amount > status.dailyLimit) {
      return {
        allowed: false,
        reason: 'Would exceed daily spending limit'
      };
    }

    if (status.weeklySpent + amount > status.weeklyLimit) {
      return {
        allowed: false,
        reason: 'Would exceed weekly spending limit'
      };
    }

    if (status.monthlySpent + amount > status.monthlyLimit) {
      return {
        allowed: false,
        reason: 'Would exceed monthly spending limit'
      };
    }

    return { allowed: true };
  }

  /**
   * Get spending records
   */
  private static async getSpendingRecords(): Promise<SpendingRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(this.RECORDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get spending records:', error);
      return [];
    }
  }

  /**
   * Calculate total spending since a given date
   */
  private static calculateSpending(records: SpendingRecord[], sinceDate: Date): number {
    return records
      .filter(record => new Date(record.date) >= sinceDate)
      .reduce((total, record) => total + record.amount, 0);
  }

  /**
   * Get spending summary for display
   */
  static async getSpendingSummary(): Promise<{
    todaySpent: number;
    weekSpent: number;
    monthSpent: number;
    recentTransactions: SpendingRecord[];
  }> {
    const records = await this.getSpendingRecords();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      todaySpent: this.calculateSpending(records, today),
      weekSpent: this.calculateSpending(records, weekStart),
      monthSpent: this.calculateSpending(records, monthStart),
      recentTransactions: records.slice(-10).reverse() // Last 10 transactions
    };
  }

  /**
   * Reset all spending data (for testing or user request)
   */
  static async resetSpendingData(): Promise<void> {
    await AsyncStorage.removeItem(this.RECORDS_KEY);
  }

  /**
   * Get responsible gambling resources
   */
  static getResponsibleGamblingResources(): {
    helpline: string;
    website: string;
    selfExclusionInfo: string;
  } {
    return {
      helpline: '1-800-333-HOPE (Minnesota Problem Gambling Helpline)',
      website: 'https://www.ncpgambling.org',
      selfExclusionInfo: 'Minnesota self-exclusion program available through the lottery commission'
    };
  }
}