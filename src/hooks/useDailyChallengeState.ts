import { useState, useEffect, useCallback } from 'react';

export type ChallengeStatus = 'unplayed' | 'completed' | 'gave_up';

interface DailyChallengeState {
  date: string;
  status: ChallengeStatus;
  timeSeconds?: number;
}

const STORAGE_KEY = 'emotion_daily_challenge_state';

const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
};

export const useDailyChallengeState = () => {
  const [state, setState] = useState<DailyChallengeState>({
    date: getTodayString(),
    status: 'unplayed',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DailyChallengeState;
        // Only load if it's from today
        if (parsed.date === getTodayString()) {
          setState(parsed);
        } else {
          // It's a new day, reset status
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Error reading daily challenge state:', e);
    }
  }, []);

  const completeChallenge = useCallback((timeSeconds: number) => {
    const newState: DailyChallengeState = {
      date: getTodayString(),
      status: 'completed',
      timeSeconds,
    };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const giveUpChallenge = useCallback(() => {
    const newState: DailyChallengeState = {
      date: getTodayString(),
      status: 'gave_up',
    };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const debugReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      date: getTodayString(),
      status: 'unplayed',
    });
  }, []);

  return {
    status: state.status,
    timeSeconds: state.timeSeconds,
    completeChallenge,
    giveUpChallenge,
    debugReset, // Useful for testing
  };
};
