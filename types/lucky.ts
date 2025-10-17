// Lucky Mode Types - Numerology, Astrology, Moon Phases

export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type MoonPhase =
  | 'new_moon'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full_moon'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export interface UserBirthProfile {
  birthDate: Date;
  zodiacSign: ZodiacSign;
  lifePathNumber: number; // 1-9
  luckyNumbers: number[]; // Derived from birthdate and name
  favoriteColor?: string;
  luckyDay?: string;
}

export interface MoonPhaseInfo {
  phase: MoonPhase;
  phaseEmoji: string;
  phaseName: string;
  illumination: number; // 0-100%
  nextPhaseDate: Date;
  luckyGames: string[]; // Game types favored by this phase
  energy: 'new_beginnings' | 'growth' | 'peak' | 'release';
}

export interface NumerologyReading {
  lifePathNumber: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  luckyNumbers: number[];
  challengeNumbers: number[];
  meaning: string;
  advice: string;
}

export interface ZodiacReading {
  sign: ZodiacSign;
  element: 'fire' | 'earth' | 'air' | 'water';
  luckyColor: string;
  luckyDay: string;
  luckyNumbers: number[];
  compatibility: ZodiacSign[];
  todaysFortune: string;
  lotteryAdvice: string;
}

export interface LuckyPrediction {
  date: string;
  overallLuck: number; // 0-100
  luckyGame: {
    gameId: string;
    gameName: string;
    confidence: number;
    reason: string;
  };
  luckyNumbers: number[];
  luckyColors: string[];
  luckyTime: string; // "morning", "afternoon", "evening"
  fortune: string;
  mysticalFactors: {
    moonPhase: MoonPhaseInfo;
    numerology: NumerologyReading;
    zodiac: ZodiacReading;
  };
  warnings?: string[];
  boosters?: string[];
}

export interface PersonalLuckyProfile {
  userId: string;
  birthProfile: UserBirthProfile;
  luckyNumbers: number[];
  luckyColors: string[];
  luckyDays: string[];
  winHistory: {
    date: string;
    gameId: string;
    moonPhase: MoonPhase;
    personalDay: number;
    amount: number;
  }[];
  patternInsights: {
    bestMoonPhase?: MoonPhase;
    bestDayOfWeek?: string;
    bestNumber?: number;
    bestColor?: string;
  };
}

export interface DailyHoroscope {
  zodiacSign: ZodiacSign;
  date: string;
  overall: string;
  lottery: string;
  luckyNumbers: number[];
  luckyColors: string[];
  avoid: string;
  recommendation: string;
}
