// Barcode Scanner Types for Scratch Oracle

export interface ScannedTicket {
  id: string;
  barcode: string;
  gameId: string;
  gameName: string;
  price: number;
  scannedDate: string;
  isWinner: boolean;
  prizeAmount?: number;
  validated: boolean;
}

export interface ScanHistory {
  tickets: ScannedTicket[];
  totalScanned: number;
  totalWinners: number;
  totalWinnings: number;
  totalSpent: number;
  winRate: number; // percentage
  roi: number; // return on investment percentage
}

export interface ScannerPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface WinLossStats {
  todaySpent: number;
  todayWon: number;
  weekSpent: number;
  weekWon: number;
  monthSpent: number;
  monthWon: number;
  allTimeSpent: number;
  allTimeWon: number;
  biggestWin: {
    amount: number;
    game: string;
    date: string;
  };
  currentStreak: {
    type: 'winning' | 'losing';
    count: number;
  };
}