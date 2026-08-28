import { useState, useEffect, useCallback } from 'react';
import type { PuzzleType } from '../components/DailyChallenge/puzzles';

export type ChallengeStatus = 'unplayed' | 'completed' | 'gave_up';

export interface DailyPuzzleAttempt {
  played: boolean;
  status: ChallengeStatus;
  timeSeconds?: number;
  rank?: number;
  pointsEarned?: number;
  completedAt?: string;
}

export interface CategoryStats {
  xp: number;
  level: number;
  timesPlayed: number;
  bestTimeSeconds?: number;
  lastPoints?: number;
}

export interface LevelInfo {
  level: number;
  tier: 'bronze' | 'silver' | 'gold';
  tierName: string;
  currentLevelXp: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  totalXp: number;
}

export interface DailyChallengeStorageState {
  date: string; // YYYY-MM-DD
  overallXp: number;
  categoryStats: Record<PuzzleType, CategoryStats>;
  dailyAttempts: Record<PuzzleType, DailyPuzzleAttempt>;
}

const STORAGE_KEY = 'emotion_daily_challenge_v2';

const ALL_PUZZLE_TYPES: PuzzleType[] = [
  'crossword',
  'sudoku',
  'wordsearch',
  'rebus',
  'quiz',
  'memory',
  'architect',
];

const getTodayString = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
};

/**
 * Calculates progressive level information based on total XP.
 * Curve:
 * Level 1 -> 2: 50 XP
 * Level 2 -> 3: 100 XP
 * Level 3 -> 4: 200 XP
 * Level 4 -> 5: 400 XP
 * Level 5+ : progressive curve (+200 XP per level above 4)
 */
export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let accumulated = 0;

  while (level < 100) {
    let step: number;
    if (level === 1) step = 50;
    else if (level === 2) step = 100;
    else if (level === 3) step = 200;
    else if (level === 4) step = 400;
    else step = 400 + (level - 4) * 200;

    if (totalXp < accumulated + step) {
      const currentLevelXp = Math.max(0, totalXp - accumulated);
      const progressPercent = Math.min(100, Math.round((currentLevelXp / step) * 100));

      let tier: 'bronze' | 'silver' | 'gold' = 'bronze';
      let tierName = 'Brąz';
      if (level >= 26) {
        tier = 'gold';
        tierName = 'Złoto';
      } else if (level >= 11) {
        tier = 'silver';
        tierName = 'Srebro';
      }

      return {
        level,
        tier,
        tierName,
        currentLevelXp,
        xpNeededForNextLevel: step,
        progressPercent,
        totalXp,
      };
    }

    accumulated += step;
    level++;
  }

  return {
    level: 100,
    tier: 'gold',
    tierName: 'Złoto',
    currentLevelXp: 0,
    xpNeededForNextLevel: 1000,
    progressPercent: 100,
    totalXp,
  };
}

/**
 * Calculates rank points:
 * 1st place -> 100 pts
 * 2nd place -> 90 pts
 * 3rd place -> 80 pts
 * ...
 * 10th place -> 10 pts
 * > 10th -> 5 pts
 */
export function calculatePointsFromRank(rank: number): number {
  if (rank <= 0) return 5;
  if (rank === 1) return 100;
  if (rank === 2) return 90;
  if (rank === 3) return 80;
  if (rank === 4) return 70;
  if (rank === 5) return 60;
  if (rank === 6) return 50;
  if (rank === 7) return 40;
  if (rank === 8) return 30;
  if (rank === 9) return 20;
  if (rank === 10) return 10;
  return 5;
}

const createDefaultCategoryStats = (): Record<PuzzleType, CategoryStats> => {
  const stats: Partial<Record<PuzzleType, CategoryStats>> = {};
  for (const type of ALL_PUZZLE_TYPES) {
    stats[type] = {
      xp: 0,
      level: 1,
      timesPlayed: 0,
    };
  }
  return stats as Record<PuzzleType, CategoryStats>;
};

const createDefaultDailyAttempts = (): Record<PuzzleType, DailyPuzzleAttempt> => {
  const attempts: Partial<Record<PuzzleType, DailyPuzzleAttempt>> = {};
  for (const type of ALL_PUZZLE_TYPES) {
    attempts[type] = {
      played: false,
      status: 'unplayed',
    };
  }
  return attempts as Record<PuzzleType, DailyPuzzleAttempt>;
};

const createInitialState = (): DailyChallengeStorageState => ({
  date: getTodayString(),
  overallXp: 0,
  categoryStats: createDefaultCategoryStats(),
  dailyAttempts: createDefaultDailyAttempts(),
});

export const useDailyChallengeState = () => {
  const [state, setState] = useState<DailyChallengeStorageState>(createInitialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DailyChallengeStorageState;
        const today = getTodayString();

        // Check if stored data is from today, or a new day
        if (parsed.date === today) {
          // Ensure all categories exist
          const mergedCatStats = { ...createDefaultCategoryStats(), ...parsed.categoryStats };
          const mergedDailyAttempts = { ...createDefaultDailyAttempts(), ...parsed.dailyAttempts };
          setState({
            ...parsed,
            categoryStats: mergedCatStats,
            dailyAttempts: mergedDailyAttempts,
          });
        } else {
          // New day: keep overall XP and category stats, but reset daily attempts
          const mergedCatStats = { ...createDefaultCategoryStats(), ...parsed.categoryStats };
          const resetDailyAttempts = createDefaultDailyAttempts();
          const newState: DailyChallengeStorageState = {
            date: today,
            overallXp: parsed.overallXp || 0,
            categoryStats: mergedCatStats,
            dailyAttempts: resetDailyAttempts,
          };
          setState(newState);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }
      }
    } catch (e) {
      console.error('Error reading daily challenge state:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when state changes
  const saveState = useCallback((newState: DailyChallengeStorageState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Error saving daily challenge state:', e);
    }
  }, []);

  /**
   * Completes a challenge, awards XP and points based on rank, updates category & overall level.
   */
  const completeChallenge = useCallback((
    type: PuzzleType,
    timeSeconds: number,
    rank: number,
    customPoints?: number
  ) => {
    const pointsEarned = customPoints !== undefined ? customPoints : calculatePointsFromRank(rank);

    setState(prev => {
      const prevCat = prev.categoryStats[type] || { xp: 0, level: 1, timesPlayed: 0 };
      const newCatXp = prevCat.xp + pointsEarned;
      const newCatLevelInfo = getLevelInfo(newCatXp);

      const newCategoryStats = {
        ...prev.categoryStats,
        [type]: {
          xp: newCatXp,
          level: newCatLevelInfo.level,
          timesPlayed: prevCat.timesPlayed + 1,
          bestTimeSeconds: prevCat.bestTimeSeconds
            ? Math.min(prevCat.bestTimeSeconds, timeSeconds)
            : timeSeconds,
          lastPoints: pointsEarned,
        },
      };

      const newDailyAttempts = {
        ...prev.dailyAttempts,
        [type]: {
          played: true,
          status: 'completed' as ChallengeStatus,
          timeSeconds,
          rank,
          pointsEarned,
          completedAt: new Date().toISOString(),
        },
      };

      const newOverallXp = prev.overallXp + pointsEarned;

      const newState: DailyChallengeStorageState = {
        date: prev.date,
        overallXp: newOverallXp,
        categoryStats: newCategoryStats,
        dailyAttempts: newDailyAttempts,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        console.error('Error saving daily challenge state:', e);
      }

      return newState;
    });

    return pointsEarned;
  }, []);

  /**
   * Marks a challenge as gave_up for today.
   */
  const giveUpChallenge = useCallback((type: PuzzleType) => {
    setState(prev => {
      const prevCat = prev.categoryStats[type] || { xp: 0, level: 1, timesPlayed: 0 };

      const newCategoryStats = {
        ...prev.categoryStats,
        [type]: {
          ...prevCat,
          timesPlayed: prevCat.timesPlayed + 1,
        },
      };

      const newDailyAttempts = {
        ...prev.dailyAttempts,
        [type]: {
          played: true,
          status: 'gave_up' as ChallengeStatus,
          pointsEarned: 0,
          completedAt: new Date().toISOString(),
        },
      };

      const newState: DailyChallengeStorageState = {
        date: prev.date,
        overallXp: prev.overallXp,
        categoryStats: newCategoryStats,
        dailyAttempts: newDailyAttempts,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        console.error('Error saving daily challenge state:', e);
      }

      return newState;
    });
  }, []);

  /**
   * Resets today's attempts while keeping total XP (for testing)
   */
  const resetTodayAttempts = useCallback(() => {
    setState(prev => {
      const newState: DailyChallengeStorageState = {
        ...prev,
        dailyAttempts: createDefaultDailyAttempts(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        console.error('Error resetting today attempts:', e);
      }
      return newState;
    });
  }, []);

  /**
   * Complete reset of all progress & XP (for testing)
   */
  const debugResetAll = useCallback(() => {
    const initialState = createInitialState();
    saveState(initialState);
  }, [saveState]);

  /**
   * Add bonus XP (for quick testing of Level 5+)
   */
  const addBonusXp = useCallback((amount: number) => {
    setState(prev => {
      const newXp = prev.overallXp + amount;
      const newState = {
        ...prev,
        overallXp: newXp,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        console.error('Error adding bonus XP:', e);
      }
      return newState;
    });
  }, []);

  const overallLevelInfo = getLevelInfo(state.overallXp);

  const completedTodayCount = Object.values(state.dailyAttempts).filter(
    a => a.status === 'completed'
  ).length;

  return {
    isLoaded,
    overallXp: state.overallXp,
    levelInfo: overallLevelInfo,
    categoryStats: state.categoryStats,
    dailyAttempts: state.dailyAttempts,
    completedTodayCount,
    totalChallengesCount: ALL_PUZZLE_TYPES.length,
    completeChallenge,
    giveUpChallenge,
    resetTodayAttempts,
    debugResetAll,
    addBonusXp,
  };
};
