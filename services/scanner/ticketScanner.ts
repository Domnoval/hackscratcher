// Ticket Scanner Service - Barcode validation and win checking
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScannedTicket, ScanHistory, WinLossStats } from '../../types/scanner';
import { MinnesotaLotteryService } from '../lottery/minnesotaData';

export class TicketScannerService {
  private static readonly HISTORY_KEY = 'scanned_tickets';
  private static readonly MAX_HISTORY = 500; // Keep last 500 scans

  /**
   * Track a scanned ticket (inventory tracking only)
   * NOTE: This does NOT validate wins - users must check with retailer
   */
  static async validateTicket(barcode: string): Promise<ScannedTicket> {
    // Extract game info from barcode
    // Minnesota lottery barcodes typically encode game ID and serial number
    const gameInfo = this.parseBarcode(barcode);

    // Get game data
    const game = await MinnesotaLotteryService.getGameById(gameInfo.gameId);

    if (!game) {
      throw new Error('Game not found - invalid barcode');
    }

    // CRITICAL: We do NOT validate wins automatically
    // Users must manually enter win results after checking with retailer
    const scannedTicket: ScannedTicket = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      barcode,
      gameId: game.id,
      gameName: game.name,
      price: game.price,
      scannedDate: new Date().toISOString(),
      isWinner: false, // Default to false - user must update manually
      prizeAmount: 0,
      validated: false // Not validated until user checks with retailer
    };

    // Save to history
    await this.saveToHistory(scannedTicket);

    return scannedTicket;
  }

  /**
   * Parse barcode to extract game information
   */
  private static parseBarcode(barcode: string): { gameId: string; serial: string } {
    // Minnesota lottery barcode format (example):
    // First 2-3 digits: game number
    // Remaining: serial number

    // For MVP, map common patterns
    const gameMapping: { [key: string]: string } = {
      '001': 'MN-2025-001', // Lucky 7s
      '002': 'MN-2025-002', // Cash Blast
      '003': 'MN-2025-003', // Diamond Mine
      '004': 'MN-2025-004', // Golden Ticket
      '005': 'MN-2025-005', // Triple Win
    };

    const gameCode = barcode.substring(0, 3);
    const gameId = gameMapping[gameCode] || 'MN-2025-001'; // Default to Lucky 7s
    const serial = barcode.substring(3);

    return { gameId, serial };
  }

  /**
   * Update ticket win status manually
   * User checks ticket with retailer and updates result in app
   */
  static async updateTicketWinStatus(
    ticketId: string,
    isWinner: boolean,
    prizeAmount: number = 0
  ): Promise<void> {
    try {
      const history = await this.getHistory();
      const ticket = history.tickets.find(t => t.id === ticketId);

      if (ticket) {
        ticket.isWinner = isWinner;
        ticket.prizeAmount = prizeAmount;
        ticket.validated = true;

        await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(history.tickets));
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    }
  }

  // REMOVED: checkIfWinner() - was generating fake win/loss results
  // Win validation requires official lottery API access, which we don't have
  // Users must verify wins with retailers and manually update in app

  /**
   * Save scanned ticket to history
   */
  private static async saveToHistory(ticket: ScannedTicket): Promise<void> {
    try {
      const history = await this.getHistory();
      const updatedHistory = [ticket, ...history.tickets].slice(0, this.MAX_HISTORY);

      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  }

  /**
   * Get complete scan history
   */
  static async getHistory(): Promise<ScanHistory> {
    try {
      const stored = await AsyncStorage.getItem(this.HISTORY_KEY);
      const tickets: ScannedTicket[] = stored ? JSON.parse(stored) : [];

      const totalScanned = tickets.length;
      const winners = tickets.filter(t => t.isWinner);
      const totalWinners = winners.length;
      const totalWinnings = winners.reduce((sum, t) => sum + (t.prizeAmount || 0), 0);
      const totalSpent = tickets.reduce((sum, t) => sum + t.price, 0);
      const winRate = totalScanned > 0 ? (totalWinners / totalScanned) * 100 : 0;
      const roi = totalSpent > 0 ? ((totalWinnings - totalSpent) / totalSpent) * 100 : 0;

      return {
        tickets,
        totalScanned,
        totalWinners,
        totalWinnings,
        totalSpent,
        winRate,
        roi
      };
    } catch (error) {
      console.error('Failed to get scan history:', error);
      return {
        tickets: [],
        totalScanned: 0,
        totalWinners: 0,
        totalWinnings: 0,
        totalSpent: 0,
        winRate: 0,
        roi: 0
      };
    }
  }

  /**
   * Get detailed win/loss statistics
   */
  static async getWinLossStats(): Promise<WinLossStats> {
    const history = await this.getHistory();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTickets = history.tickets.filter(t => new Date(t.scannedDate) >= today);
    const weekTickets = history.tickets.filter(t => new Date(t.scannedDate) >= weekStart);
    const monthTickets = history.tickets.filter(t => new Date(t.scannedDate) >= monthStart);

    const calculateStats = (tickets: ScannedTicket[]) => {
      const spent = tickets.reduce((sum, t) => sum + t.price, 0);
      const won = tickets.filter(t => t.isWinner).reduce((sum, t) => sum + (t.prizeAmount || 0), 0);
      return { spent, won };
    };

    const todayStats = calculateStats(todayTickets);
    const weekStats = calculateStats(weekTickets);
    const monthStats = calculateStats(monthTickets);
    const allTimeStats = calculateStats(history.tickets);

    // Find biggest win
    const winners = history.tickets.filter(t => t.isWinner && t.prizeAmount);
    const biggestWin = winners.length > 0
      ? winners.reduce((max, t) => (t.prizeAmount! > (max.prizeAmount || 0) ? t : max))
      : null;

    // Calculate current streak
    let currentStreak: { type: 'winning' | 'losing', count: number } = { type: 'losing', count: 0 };
    if (history.tickets.length > 0) {
      const recent = history.tickets.slice(0, 20); // Last 20 tickets
      let count = 0;
      const type = recent[0].isWinner ? 'winning' : 'losing';

      for (const ticket of recent) {
        if ((type === 'winning' && ticket.isWinner) || (type === 'losing' && !ticket.isWinner)) {
          count++;
        } else {
          break;
        }
      }

      currentStreak = { type, count };
    }

    return {
      todaySpent: todayStats.spent,
      todayWon: todayStats.won,
      weekSpent: weekStats.spent,
      weekWon: weekStats.won,
      monthSpent: monthStats.spent,
      monthWon: monthStats.won,
      allTimeSpent: allTimeStats.spent,
      allTimeWon: allTimeStats.won,
      biggestWin: biggestWin ? {
        amount: biggestWin.prizeAmount!,
        game: biggestWin.gameName,
        date: biggestWin.scannedDate
      } : {
        amount: 0,
        game: 'None yet',
        date: ''
      },
      currentStreak
    };
  }

  /**
   * Clear scan history
   */
  static async clearHistory(): Promise<void> {
    await AsyncStorage.removeItem(this.HISTORY_KEY);
  }

  /**
   * Get recent scans (last N)
   */
  static async getRecentScans(limit: number = 10): Promise<ScannedTicket[]> {
    const history = await this.getHistory();
    return history.tickets.slice(0, limit);
  }

  /**
   * Check if barcode format is valid
   */
  static isValidBarcode(barcode: string): boolean {
    // Minnesota lottery barcodes are typically 12-18 digits
    const barcodeRegex = /^\d{12,18}$/;
    return barcodeRegex.test(barcode);
  }

  /**
   * Get quick stats summary
   */
  static async getQuickStats(): Promise<{
    totalScanned: number;
    winRate: number;
    roi: number;
    lastScan?: ScannedTicket;
  }> {
    const history = await this.getHistory();
    const lastScan = history.tickets.length > 0 ? history.tickets[0] : undefined;

    return {
      totalScanned: history.totalScanned,
      winRate: history.winRate,
      roi: history.roi,
      lastScan
    };
  }
}