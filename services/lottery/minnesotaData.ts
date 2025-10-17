// Minnesota Lottery Data Service - MVP Implementation
import { LotteryGame } from '../../types/lottery';

// MVP: Static data for top 10 Minnesota scratch-off games
// In production, this would scrape from https://www.mnlottery.com/games/scratchers
export class MinnesotaLotteryService {
  private static mockGames: LotteryGame[] = [
    {
      id: 'MN-2025-001',
      name: 'Lucky 7s',
      price: 5,
      overall_odds: '1 in 3.45',
      status: 'Active',
      prizes: [
        { tier: 'Jackpot', amount: 100000, total: 2, remaining: 1 },
        { tier: 'Second', amount: 10000, total: 5, remaining: 3 },
        { tier: 'Third', amount: 1000, total: 20, remaining: 15 },
        { tier: 'Fourth', amount: 100, total: 200, remaining: 120 },
        { tier: 'Fifth', amount: 50, total: 500, remaining: 300 }
      ],
      launch_date: '2025-01-01',
      last_updated: new Date().toISOString(),
      total_tickets: 150000
    },
    {
      id: 'MN-2025-002',
      name: 'Cash Blast',
      price: 10,
      overall_odds: '1 in 2.89',
      status: 'Active',
      prizes: [
        { tier: 'Jackpot', amount: 500000, total: 1, remaining: 1 },
        { tier: 'Second', amount: 50000, total: 3, remaining: 2 },
        { tier: 'Third', amount: 5000, total: 15, remaining: 8 },
        { tier: 'Fourth', amount: 500, total: 100, remaining: 65 },
        { tier: 'Fifth', amount: 100, total: 300, remaining: 180 }
      ],
      launch_date: '2025-01-05',
      last_updated: new Date().toISOString(),
      total_tickets: 200000
    },
    {
      id: 'MN-2025-003',
      name: 'Diamond Mine',
      price: 20,
      overall_odds: '1 in 2.15',
      status: 'Active',
      prizes: [
        { tier: 'Jackpot', amount: 1000000, total: 1, remaining: 0 }, // Zombie game!
        { tier: 'Second', amount: 100000, total: 2, remaining: 0 },
        { tier: 'Third', amount: 10000, total: 10, remaining: 3 },
        { tier: 'Fourth', amount: 1000, total: 50, remaining: 25 },
        { tier: 'Fifth', amount: 200, total: 200, remaining: 100 }
      ],
      launch_date: '2024-12-20',
      last_updated: new Date().toISOString(),
      total_tickets: 100000
    },
    {
      id: 'MN-2025-004',
      name: 'Golden Ticket',
      price: 30,
      overall_odds: '1 in 1.95',
      status: 'Active',
      prizes: [
        { tier: 'Jackpot', amount: 2000000, total: 1, remaining: 1 },
        { tier: 'Second', amount: 200000, total: 2, remaining: 2 },
        { tier: 'Third', amount: 20000, total: 8, remaining: 6 },
        { tier: 'Fourth', amount: 2000, total: 40, remaining: 28 },
        { tier: 'Fifth', amount: 300, total: 150, remaining: 95 }
      ],
      launch_date: '2025-01-10',
      last_updated: new Date().toISOString(),
      total_tickets: 75000
    },
    {
      id: 'MN-2025-005',
      name: 'Triple Win',
      price: 2,
      overall_odds: '1 in 4.12',
      status: 'Active',
      prizes: [
        { tier: 'Jackpot', amount: 25000, total: 3, remaining: 2 },
        { tier: 'Second', amount: 2500, total: 10, remaining: 7 },
        { tier: 'Third', amount: 250, total: 50, remaining: 35 },
        { tier: 'Fourth', amount: 25, total: 500, remaining: 350 },
        { tier: 'Fifth', amount: 10, total: 1000, remaining: 650 }
      ],
      launch_date: '2024-12-15',
      last_updated: new Date().toISOString(),
      total_tickets: 300000
    }
  ];

  static async getActiveGames(): Promise<LotteryGame[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return this.mockGames.filter(game => game.status === 'Active');
  }

  static async getGameById(id: string): Promise<LotteryGame | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return this.mockGames.find(game => game.id === id) || null;
  }

  static async refreshGameData(): Promise<void> {
    // MVP: Just update timestamps
    // In production: scrape from Minnesota Lottery API
    this.mockGames.forEach(game => {
      game.last_updated = new Date().toISOString();

      // Simulate some prize claims for realism
      game.prizes.forEach(prize => {
        if (Math.random() < 0.1 && prize.remaining > 0) {
          prize.remaining = Math.max(0, prize.remaining - 1);
        }
      });
    });
  }

  static validateGameData(game: LotteryGame): boolean {
    if (!game.id || !game.name || game.price <= 0) return false;

    // Check prize structure
    for (const prize of game.prizes) {
      if (prize.remaining < 0 || prize.remaining > prize.total) {
        return false;
      }
    }

    return true;
  }

  static getDataFreshness(): string {
    const lastUpdate = Math.max(...this.mockGames.map(g =>
      new Date(g.last_updated).getTime()
    ));
    const minutesAgo = Math.floor((Date.now() - lastUpdate) / (1000 * 60));

    if (minutesAgo < 1) return 'Just updated';
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo} hours ago`;
  }
}