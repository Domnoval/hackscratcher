// Lucky Mode Service - Numerology, Astrology, Moon Phases
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ZodiacSign,
  MoonPhase,
  UserBirthProfile,
  MoonPhaseInfo,
  NumerologyReading,
  ZodiacReading,
  LuckyPrediction,
  DailyHoroscope
} from '../../types/lucky';
import { MinnesotaLotteryService } from '../lottery/minnesotaData';
import { EVCalculator } from '../calculator/evCalculator';

export class LuckyModeService {
  private static readonly PROFILE_KEY = 'lucky_profile';

  /**
   * Calculate zodiac sign from birth date
   */
  static getZodiacSign(birthDate: Date): ZodiacSign {
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
    return 'pisces';
  }

  /**
   * Calculate Life Path Number (Pythagorean numerology)
   */
  static calculateLifePathNumber(birthDate: Date): number {
    const dateStr = birthDate.toISOString().split('T')[0].replace(/-/g, '');
    let sum = dateStr.split('').reduce((acc, digit) => acc + parseInt(digit), 0);

    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }

    return sum > 9 ? sum % 9 || 9 : sum;
  }

  /**
   * Calculate lucky numbers from birth date and name
   */
  static calculateLuckyNumbers(birthDate: Date, name?: string): number[] {
    const numbers: number[] = [];

    // Birth date numbers
    const day = birthDate.getDate();
    const month = birthDate.getMonth() + 1;
    const year = birthDate.getFullYear();

    numbers.push(day);
    numbers.push(month);
    numbers.push(year % 100);

    // Life path number
    const lifePathNumber = this.calculateLifePathNumber(birthDate);
    numbers.push(lifePathNumber);

    // Name numerology (if provided)
    if (name) {
      const nameValue = name.toUpperCase().split('').reduce((sum, char) => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? sum + ((code - 64) % 9 || 9) : sum;
      }, 0);
      numbers.push(nameValue % 9 || 9);
    }

    // Add derived lucky numbers
    numbers.push((day + month) % 31 + 1);
    numbers.push((day * month) % 31 + 1);

    // Return unique numbers, sorted
    return [...new Set(numbers)].sort((a, b) => a - b).slice(0, 7);
  }

  /**
   * Get current moon phase
   */
  static getCurrentMoonPhase(): MoonPhaseInfo {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    // Simplified moon phase calculation (Julian day method)
    const julianDay = Math.floor(365.25 * year) + Math.floor(30.6 * (month + 1)) + day - 694039.09;
    const synodicMonth = 29.53058867;
    const moonAge = (julianDay % synodicMonth + synodicMonth) % synodicMonth;
    const illumination = (1 - Math.cos((moonAge / synodicMonth) * 2 * Math.PI)) / 2 * 100;

    let phase: MoonPhase;
    let phaseEmoji: string;
    let phaseName: string;
    let energy: 'new_beginnings' | 'growth' | 'peak' | 'release';
    let luckyGames: string[];

    if (moonAge < 1.84566) {
      phase = 'new_moon';
      phaseEmoji = '🌑';
      phaseName = 'New Moon';
      energy = 'new_beginnings';
      luckyGames = ['New launches', 'Low price games ($1-$2)'];
    } else if (moonAge < 5.53699) {
      phase = 'waxing_crescent';
      phaseEmoji = '🌒';
      phaseName = 'Waxing Crescent';
      energy = 'growth';
      luckyGames = ['Rising EV games', 'Mid-range ($5-$10)'];
    } else if (moonAge < 9.22831) {
      phase = 'first_quarter';
      phaseEmoji = '🌓';
      phaseName = 'First Quarter';
      energy = 'growth';
      luckyGames = ['Balanced games', 'Mixed odds'];
    } else if (moonAge < 12.91963) {
      phase = 'waxing_gibbous';
      phaseEmoji = '🌔';
      phaseName = 'Waxing Gibbous';
      energy = 'peak';
      luckyGames = ['Hot tickets', 'High EV games'];
    } else if (moonAge < 16.61096) {
      phase = 'full_moon';
      phaseEmoji = '🌕';
      phaseName = 'Full Moon';
      energy = 'peak';
      luckyGames = ['Big jackpot games ($20+)', 'Maximum prizes'];
    } else if (moonAge < 20.30228) {
      phase = 'waning_gibbous';
      phaseEmoji = '🌖';
      phaseName = 'Waning Gibbous';
      energy = 'release';
      luckyGames = ['Retiring games', 'Last chances'];
    } else if (moonAge < 23.99361) {
      phase = 'last_quarter';
      phaseEmoji = '🌗';
      phaseName = 'Last Quarter';
      energy = 'release';
      luckyGames = ['Clearance games', 'Low remaining prizes'];
    } else {
      phase = 'waning_crescent';
      phaseEmoji = '🌘';
      phaseName = 'Waning Crescent';
      energy = 'new_beginnings';
      luckyGames = ['Upcoming launches', 'Save for new games'];
    }

    const nextPhaseDate = new Date(now.getTime() + (synodicMonth - moonAge) * 24 * 60 * 60 * 1000);

    return {
      phase,
      phaseEmoji,
      phaseName,
      illumination: Math.round(illumination),
      nextPhaseDate,
      luckyGames,
      energy
    };
  }

  /**
   * Get numerology reading for a date
   */
  static getNumerologyReading(birthDate: Date, targetDate: Date = new Date()): NumerologyReading {
    const lifePathNumber = this.calculateLifePathNumber(birthDate);
    const luckyNumbers = this.calculateLuckyNumbers(birthDate);

    // Calculate personal year, month, day
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();

    const birthMonth = birthDate.getMonth() + 1;
    const birthDay = birthDate.getDate();

    const personalYear = ((birthMonth + birthDay + year) % 9) || 9;
    const personalMonth = ((personalYear + month) % 9) || 9;
    const personalDay = ((personalMonth + day) % 9) || 9;

    const challengeNumbers = [(9 - lifePathNumber + 9) % 9 || 9];

    const meanings: { [key: number]: string } = {
      1: 'Leadership and new beginnings. Take initiative today!',
      2: 'Balance and partnerships. Collaborate for success.',
      3: 'Creativity and expression. Trust your instincts.',
      4: 'Stability and foundation. Build systematically.',
      5: 'Change and adventure. Embrace opportunities.',
      6: 'Harmony and responsibility. Help others win.',
      7: 'Wisdom and introspection. Analyze before acting.',
      8: 'Power and abundance. Big wins possible.',
      9: 'Completion and humanitarianism. Share your fortune.'
    };

    const advice = `Your life path ${lifePathNumber} combined with personal day ${personalDay} creates ${personalYear === personalDay ? 'amplified' : 'balanced'} energy for lottery luck!`;

    return {
      lifePathNumber,
      personalYear,
      personalMonth,
      personalDay,
      luckyNumbers,
      challengeNumbers,
      meaning: meanings[personalDay] || 'Special energy today!',
      advice
    };
  }

  /**
   * Get zodiac reading
   */
  static getZodiacReading(zodiacSign: ZodiacSign): ZodiacReading {
    const zodiacData: { [key in ZodiacSign]: any } = {
      aries: {
        element: 'fire',
        luckyColor: 'Red',
        luckyDay: 'Tuesday',
        luckyNumbers: [1, 9, 19],
        compatibility: ['leo', 'sagittarius'],
        todaysFortune: 'Bold moves bring bold rewards!',
        lotteryAdvice: 'Trust your first instinct. Quick picks favored.'
      },
      taurus: {
        element: 'earth',
        luckyColor: 'Green',
        luckyDay: 'Friday',
        luckyNumbers: [2, 6, 24],
        compatibility: ['virgo', 'capricorn'],
        todaysFortune: 'Patience pays dividends.',
        lotteryAdvice: 'Stick to your budget. Consistent play wins.'
      },
      gemini: {
        element: 'air',
        luckyColor: 'Yellow',
        luckyDay: 'Wednesday',
        luckyNumbers: [3, 5, 12],
        compatibility: ['libra', 'aquarius'],
        todaysFortune: 'Variety brings luck!',
        lotteryAdvice: 'Mix different games. Try new launches.'
      },
      cancer: {
        element: 'water',
        luckyColor: 'Silver',
        luckyDay: 'Monday',
        luckyNumbers: [2, 7, 22],
        compatibility: ['scorpio', 'pisces'],
        todaysFortune: 'Follow your intuition.',
        lotteryAdvice: 'Emotional connection to numbers matters.'
      },
      leo: {
        element: 'fire',
        luckyColor: 'Gold',
        luckyDay: 'Sunday',
        luckyNumbers: [1, 5, 19],
        compatibility: ['aries', 'sagittarius'],
        todaysFortune: 'Fortune favors the bold!',
        lotteryAdvice: 'Go for jackpot games. Big wins await.'
      },
      virgo: {
        element: 'earth',
        luckyColor: 'Navy Blue',
        luckyDay: 'Wednesday',
        luckyNumbers: [5, 14, 23],
        compatibility: ['taurus', 'capricorn'],
        todaysFortune: 'Attention to detail pays off.',
        lotteryAdvice: 'Check odds carefully. Data-driven wins.'
      },
      libra: {
        element: 'air',
        luckyColor: 'Pink',
        luckyDay: 'Friday',
        luckyNumbers: [6, 15, 24],
        compatibility: ['gemini', 'aquarius'],
        todaysFortune: 'Balance brings blessings.',
        lotteryAdvice: 'Split your budget evenly. Harmony wins.'
      },
      scorpio: {
        element: 'water',
        luckyColor: 'Deep Red',
        luckyDay: 'Tuesday',
        luckyNumbers: [8, 11, 18],
        compatibility: ['cancer', 'pisces'],
        todaysFortune: 'Intensity attracts miracles.',
        lotteryAdvice: 'Secret tickets bring secret wins.'
      },
      sagittarius: {
        element: 'fire',
        luckyColor: 'Purple',
        luckyDay: 'Thursday',
        luckyNumbers: [3, 9, 21],
        compatibility: ['aries', 'leo'],
        todaysFortune: 'Adventure awaits!',
        lotteryAdvice: 'Try new stores. Explore hot spots.'
      },
      capricorn: {
        element: 'earth',
        luckyColor: 'Brown',
        luckyDay: 'Saturday',
        luckyNumbers: [4, 8, 26],
        compatibility: ['taurus', 'virgo'],
        todaysFortune: 'Discipline creates destiny.',
        lotteryAdvice: 'Stick to proven winners. Track patterns.'
      },
      aquarius: {
        element: 'air',
        luckyColor: 'Electric Blue',
        luckyDay: 'Saturday',
        luckyNumbers: [4, 11, 29],
        compatibility: ['gemini', 'libra'],
        todaysFortune: 'Innovation brings fortune.',
        lotteryAdvice: 'Use technology. AI picks favored.'
      },
      pisces: {
        element: 'water',
        luckyColor: 'Sea Green',
        luckyDay: 'Thursday',
        luckyNumbers: [3, 7, 12],
        compatibility: ['cancer', 'scorpio'],
        todaysFortune: 'Dreams become reality.',
        lotteryAdvice: 'Trust your dreams. Synchronicity is real.'
      }
    };

    return {
      sign: zodiacSign,
      ...zodiacData[zodiacSign]
    };
  }

  /**
   * Generate daily lucky prediction
   */
  static async getDailyLuckyPrediction(birthDate: Date): Promise<LuckyPrediction> {
    const today = new Date();
    const zodiacSign = this.getZodiacSign(birthDate);
    const moonPhase = this.getCurrentMoonPhase();
    const numerology = this.getNumerologyReading(birthDate, today);
    const zodiac = this.getZodiacReading(zodiacSign);

    // Get all games and calculate mystical scores
    const games = await MinnesotaLotteryService.getActiveGames();

    const mysticalScores = games.map(game => {
      let score = 0;

      // Moon phase bonus
      if (moonPhase.phase === 'full_moon' && game.price >= 20) score += 30;
      if (moonPhase.phase === 'new_moon' && game.price <= 2) score += 30;
      if (moonPhase.energy === 'growth' && game.price >= 5 && game.price <= 10) score += 20;

      // Numerology bonus
      const gamePrice = game.price;
      if (numerology.luckyNumbers.includes(gamePrice)) score += 25;
      if (numerology.personalDay === gamePrice) score += 15;

      // Color matching (game name colors)
      const nameLower = game.name.toLowerCase();
      if (nameLower.includes(zodiac.luckyColor.toLowerCase())) score += 20;

      // EV factor (still matters!)
      const ev = EVCalculator.calculateEV(game);
      score += ev.adjustedEV * 50;

      return { game, score };
    });

    // Find lucky game
    mysticalScores.sort((a, b) => b.score - a.score);
    const luckyGame = mysticalScores[0].game;

    // Calculate overall luck (0-100)
    const overallLuck = Math.min(
      Math.round((numerology.personalDay / 9) * 40 + (moonPhase.illumination / 100) * 30 + 30),
      100
    );

    // Fortune cookie wisdom
    const fortunes = [
      'The stars align in your favor. Fortune smiles upon you today.',
      'A lucky streak begins now. Trust the universe.',
      'Today brings unexpected blessings. Stay open to miracles.',
      'Your intuition is sharp. Follow it to fortune.',
      'The cosmos conspire for your success. Believe and receive.',
      'Lucky energy surrounds you. Seize the moment.',
      'Divine timing is at play. Your moment is now.',
      'Abundance flows to you. Welcome prosperity.'
    ];
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

    // Warnings and boosters
    const warnings: string[] = [];
    const boosters: string[] = [];

    if (moonPhase.phase === 'waning_crescent') {
      warnings.push('Moon energy is low. Consider smaller bets.');
    }
    if (numerology.personalDay === 4) {
      warnings.push('Day 4 favors patience over impulse.');
    }
    if (moonPhase.phase === 'full_moon') {
      boosters.push('🌕 Full Moon Power! Big wins possible.');
    }
    if (numerology.personalDay === 8) {
      boosters.push('💰 Power Number 8! Abundance day.');
    }

    return {
      date: today.toISOString(),
      overallLuck,
      luckyGame: {
        gameId: luckyGame.id,
        gameName: luckyGame.name,
        confidence: Math.round(mysticalScores[0].score),
        reason: `Moon phase ${moonPhase.phaseName} + Your ${zodiac.sign} energy + Numerology ${numerology.personalDay}`
      },
      luckyNumbers: [...new Set([...numerology.luckyNumbers, ...zodiac.luckyNumbers])].slice(0, 7),
      luckyColors: [zodiac.luckyColor],
      luckyTime: today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening',
      fortune,
      mysticalFactors: {
        moonPhase,
        numerology,
        zodiac
      },
      warnings,
      boosters
    };
  }

  /**
   * Save user profile
   */
  static async saveUserProfile(birthDate: Date, name?: string): Promise<UserBirthProfile> {
    const profile: UserBirthProfile = {
      birthDate,
      zodiacSign: this.getZodiacSign(birthDate),
      lifePathNumber: this.calculateLifePathNumber(birthDate),
      luckyNumbers: this.calculateLuckyNumbers(birthDate, name)
    };

    await AsyncStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }

  /**
   * Get saved user profile
   */
  static async getUserProfile(): Promise<UserBirthProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(this.PROFILE_KEY);
      if (!stored) return null;

      const profile = JSON.parse(stored);
      profile.birthDate = new Date(profile.birthDate);
      return profile;
    } catch {
      return null;
    }
  }
}
