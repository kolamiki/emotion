import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import styles from './leaderboard.module.css';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl: string;
  timeSeconds: number;
  isCurrentUser: boolean;
}

interface LeaderboardProps {
  userTimeSeconds: number;
  currentUserName: string;
  currentUserAvatar: string;
  hideCurrentUser?: boolean;
  challengeTitle?: string;
}

// Fictional users for the leaderboard
const fakeUsers = [
  { id: 'lb-1', name: 'Profesor Prime', avatarUrl: './avatars/prime.png' },
  { id: 'lb-2', name: 'Piotr Wiśniewski', avatarUrl: 'https://i.pravatar.cc/150?u=u3' },
  { id: 'lb-3', name: 'Tomek Krawczyk', avatarUrl: 'https://i.pravatar.cc/150?u=u5' },
  { id: 'lb-4', name: 'Natalia Wójcik', avatarUrl: 'https://i.pravatar.cc/150?u=u10' },
  { id: 'lb-5', name: 'Michał Dąbrowski', avatarUrl: 'https://i.pravatar.cc/150?u=u7' },
  { id: 'lb-6', name: 'Marta Lewandowska', avatarUrl: 'https://i.pravatar.cc/150?u=u6' },
  { id: 'lb-7', name: 'Bartek Nowicki', avatarUrl: 'https://i.pravatar.cc/150?u=u9' },
  { id: 'lb-8', name: 'Ola Kamińska', avatarUrl: 'https://i.pravatar.cc/150?u=u8' },
  { id: 'lb-9', name: 'Jakub Mazur', avatarUrl: 'https://i.pravatar.cc/150?u=u11' },
  { id: 'lb-10', name: 'Karolina Szymańska', avatarUrl: 'https://i.pravatar.cc/150?u=u12' },
];

/**
 * Generate realistic solving times for fake users.
 * Times are spread between 90 seconds and 15 minutes (900 seconds).
 * Uses a seeded distribution for consistency within a session.
 */
function generateFakeTimes(): number[] {
  // Seed based on today's date so times are consistent for the day
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Simple seeded random
  let rng = seed;
  const nextRandom = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };

  return fakeUsers.map(() => {
    // Generate times between 90s and 900s with a bell-curve-like distribution
    const r = nextRandom();
    const time = Math.floor(90 + r * r * 810); // Skewed toward faster times
    return time;
  });
}

export const formatLeaderboardTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Calculates rank position (1 to 10+) of the user for scoring purposes.
 */
export function computeLeaderboardRank(userTimeSeconds: number): number {
  if (userTimeSeconds >= 999999) return 11;
  const fakeTimes = generateFakeTimes();
  let rank = 2; // Profesor Prime is always ahead of user (#1)
  for (let i = 1; i < fakeTimes.length; i++) {
    if (fakeTimes[i] < userTimeSeconds) {
      rank++;
    }
  }
  return Math.min(rank, 11);
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  userTimeSeconds,
  currentUserName,
  currentUserAvatar,
  hideCurrentUser = false,
  challengeTitle,
}) => {
  const entries = useMemo<LeaderboardEntry[]>(() => {
    const fakeTimes = generateFakeTimes();

    // Create entries for fake users
    const fakeEntries: LeaderboardEntry[] = fakeUsers.map((user, i) => ({
      ...user,
      timeSeconds: fakeTimes[i],
      isCurrentUser: false,
    }));

    const primeIndex = fakeEntries.findIndex(e => e.name === 'Profesor Prime');
    if (primeIndex !== -1) {
      let primeTime;
      if (!hideCurrentUser && userTimeSeconds < 999999) {
        // User solved the puzzle
        primeTime = Math.max(1, userTimeSeconds - 5);
      } else {
        // User gave up or hideCurrentUser is true
        const minFakeTime = Math.min(...fakeTimes);
        primeTime = Math.max(1, minFakeTime - 10);
      }
      
      fakeEntries[primeIndex].timeSeconds = primeTime;

      // Ensure no other fake user is faster than Prime
      fakeEntries.forEach((entry, i) => {
        if (i !== primeIndex && entry.timeSeconds <= primeTime) {
          entry.timeSeconds = primeTime + Math.floor(Math.random() * 15) + 1;
        }
      });
    }

    const all = [...fakeEntries];

    if (!hideCurrentUser) {
      // Add current user
      const currentUserEntry: LeaderboardEntry = {
        id: 'current-user',
        name: currentUserName,
        avatarUrl: currentUserAvatar,
        timeSeconds: userTimeSeconds,
        isCurrentUser: true,
      };
      all.push(currentUserEntry);
    }

    // Sort
    all.sort((a, b) => a.timeSeconds - b.timeSeconds);

    return all;
  }, [userTimeSeconds, currentUserName, currentUserAvatar, hideCurrentUser]);

  const getMedal = (position: number): string => {
    switch (position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '';
    }
  };

  const getRowClass = (index: number, isCurrentUser: boolean): string => {
    const classes = [styles.leaderboardRow];
    if (isCurrentUser) classes.push(styles.rowCurrentUser);
    if (index === 0) classes.push(styles.rowGold);
    else if (index === 1) classes.push(styles.rowSilver);
    else if (index === 2) classes.push(styles.rowBronze);
    return classes.join(' ');
  };

  const getPositionClass = (index: number): string => {
    const classes = [styles.positionNumber];
    if (index === 0) classes.push(styles.positionGold);
    else if (index === 1) classes.push(styles.positionSilver);
    else if (index === 2) classes.push(styles.positionBronze);
    return classes.join(' ');
  };

  return (
    <div className={styles.leaderboardContainer}>
      <div className={styles.leaderboardHeader}>
        <div className={styles.leaderboardIcon}>
          <Trophy size={22} />
        </div>
        <div>
          <h3 className={styles.leaderboardTitle}>Tablica Wyników</h3>
          <p className={styles.leaderboardSubtitle}>
            Dzisiejsze rozwiązania zagadki: {challengeTitle || 'Wyzwanie Dnia'}
          </p>
        </div>
      </div>

      <table className={styles.leaderboardTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Gracz</th>
            <th>Czas</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr
              key={entry.id}
              className={getRowClass(index, entry.isCurrentUser)}
            >
              <td>
                <div className={styles.positionCell}>
                  <div className={getPositionClass(index)}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <span className={styles.medal}>{getMedal(index)}</span>
                  )}
                </div>
              </td>
              <td>
                <div className={styles.userCell}>
                  <img
                    src={entry.avatarUrl}
                    alt={entry.name}
                    className={styles.userAvatar}
                  />
                  <span className={styles.userName}>
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className={styles.youBadge}>TY</span>
                    )}
                  </span>
                </div>
              </td>
              <td>
                <span className={styles.timeValue}>
                  {formatLeaderboardTime(entry.timeSeconds)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
