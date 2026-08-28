import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Target,
  Keyboard,
  Search,
  HelpCircle,
  BrainCircuit,
  Layers,
  Building2,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Medal,
  Award,
  Flame,
  Check,
} from 'lucide-react';
import styles from './DailyChallenge.module.css';
import { dailyPuzzles, PUZZLE_CATEGORIES } from './puzzles';
import type { PuzzleType, ArchitectPuzzle } from './puzzles';
import { ArchitectPuzzleComponent } from './ArchitectPuzzle';
import { RebusPuzzleComponent } from './RebusPuzzle';
import { QuizPuzzleComponent } from './QuizPuzzle';
import { CrosswordPuzzleComponent } from './CrosswordPuzzle';
import { SudokuPuzzleComponent } from './SudokuPuzzle';
import { WordsearchPuzzleComponent } from './WordsearchPuzzle';
import { MemoryPuzzleComponent } from './MemoryPuzzle';
import { Leaderboard, computeLeaderboardRank } from './Leaderboard';
import { useDailyChallengeState } from '../../hooks/useDailyChallengeState';

interface DailyChallengeProps {
  currentUserName?: string;
  currentUserAvatar?: string;
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({
  currentUserName = 'Jan Kowalski',
  currentUserAvatar = 'https://i.pravatar.cc/150?u=u1',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PuzzleType | null>(null);
  const [puzzleData, setPuzzleData] = useState<any>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [lastEarnedPoints, setLastEarnedPoints] = useState<number | null>(null);
  const [lastEarnedRank, setLastEarnedRank] = useState<number | null>(null);

  const {
    isLoaded,
    overallXp,
    levelInfo,
    categoryStats,
    dailyAttempts,
    completedTodayCount,
    totalChallengesCount,
    completeChallenge,
    giveUpChallenge,
    resetTodayAttempts,
    debugResetAll,
    addBonusXp,
  } = useDailyChallengeState();

  const isStartedRef = React.useRef(false);
  useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  // Load random puzzle item when category is selected
  useEffect(() => {
    if (!selectedCategory) {
      setPuzzleData(null);
      setIsStarted(false);
      return;
    }

    const collection = Object.values(dailyPuzzles).find(p => p.type === selectedCategory);
    if (collection) {
      const randomItem = collection.items[Math.floor(Math.random() * collection.items.length)];
      setPuzzleData(randomItem);
    }
  }, [selectedCategory]);

  // Window unload warnings
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStartedRef.current && selectedCategory) {
        const attempt = dailyAttempts[selectedCategory];
        if (!attempt || attempt.status === 'unplayed') {
          e.preventDefault();
          e.returnValue = 'Przerwanie wyzwania zostanie potraktowane jako poddanie się.';
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    (window as any).confirmNavigation = () => {
      if (isStartedRef.current && selectedCategory) {
        const attempt = dailyAttempts[selectedCategory];
        if (!attempt || attempt.status === 'unplayed') {
          return window.confirm('Czy na pewno chcesz przerwać? Zostanie to potraktowane jako poddanie się.');
        }
      }
      return true;
    };

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      delete (window as any).confirmNavigation;
    };
  }, [selectedCategory, dailyAttempts]);

  const handleSelectCategory = (type: PuzzleType) => {
    setSelectedCategory(type);
    setIsStarted(false);
    setLastEarnedPoints(null);
    setLastEarnedRank(null);
  };

  const handleBackToDashboard = () => {
    if (isStarted && selectedCategory) {
      const attempt = dailyAttempts[selectedCategory];
      if (!attempt || attempt.status === 'unplayed') {
        const confirm = window.confirm('Czy chcesz wrócić do Dashboardu? Rozpoczęta gra zostanie anulowana jako poddanie się.');
        if (!confirm) return;
        giveUpChallenge(selectedCategory);
      }
    }
    setSelectedCategory(null);
    setIsStarted(false);
  };

  const handleStartGame = () => {
    setIsStarted(true);
  };

  const handlePuzzleSolved = (timeSec: number) => {
    if (!selectedCategory) return;
    setIsStarted(false);

    const rank = computeLeaderboardRank(timeSec);
    const points = completeChallenge(selectedCategory, timeSec, rank);

    setLastEarnedRank(rank);
    setLastEarnedPoints(points);
  };

  const handleGiveUp = () => {
    if (!selectedCategory) return;
    setIsStarted(false);
    giveUpChallenge(selectedCategory);
    setLastEarnedPoints(0);
    setLastEarnedRank(null);
  };

  const renderCategoryIcon = (type: PuzzleType, size = 20) => {
    switch (type) {
      case 'crossword': return <Keyboard size={size} strokeWidth={2.2} />;
      case 'sudoku': return <Target size={size} strokeWidth={2.2} />;
      case 'wordsearch': return <Search size={size} strokeWidth={2.2} />;
      case 'rebus': return <HelpCircle size={size} strokeWidth={2.2} />;
      case 'quiz': return <BrainCircuit size={size} strokeWidth={2.2} />;
      case 'memory': return <Layers size={size} strokeWidth={2.2} />;
      case 'architect': return <Building2 size={size} strokeWidth={2.2} />;
      default: return <Trophy size={size} strokeWidth={2.2} />;
    }
  };

  const renderTierIcon = () => {
    if (levelInfo.tier === 'gold') return <Trophy size={26} strokeWidth={2.2} />;
    if (levelInfo.tier === 'silver') return <Medal size={26} strokeWidth={2.2} />;
    return <Award size={26} strokeWidth={2.2} />;
  };

  const getTierClass = () => {
    if (levelInfo.tier === 'gold') return styles.tierGold;
    if (levelInfo.tier === 'silver') return styles.tierSilver;
    return styles.tierBronze;
  };

  if (!isLoaded) return null;

  // ============================================
  //  ACTIVE PUZZLE VIEW
  // ============================================
  if (selectedCategory) {
    const currentMeta = PUZZLE_CATEGORIES.find(c => c.type === selectedCategory);
    const collection = Object.values(dailyPuzzles).find(p => p.type === selectedCategory);
    const attempt = dailyAttempts[selectedCategory];
    const catStats = categoryStats[selectedCategory];

    const isFinished = attempt && (attempt.status === 'completed' || attempt.status === 'gave_up');

    const renderPuzzleGame = () => {
      if (!isStarted && (!attempt || attempt.status === 'unplayed')) {
        return (
          <div className={styles.startCard}>
            <div
              className={styles.startIcon}
              style={{ background: currentMeta?.accentColor || 'var(--primary)' }}
            >
              {renderCategoryIcon(selectedCategory, 30)}
            </div>
            <h3 className={styles.startTitle}>{currentMeta?.title}</h3>
            <p className={styles.startDescription}>
              {collection?.description || currentMeta?.shortDesc}
            </p>
            <div className={styles.startRuleNote}>
              Wyzwanie dostępne raz dziennie. Czas rozwiązania decyduje o pozycji w TOP 10 rankingu (do +100 XP).
            </div>
            <button className={styles.startPlayBtn} onClick={handleStartGame}>
              Rozpocznij wyzwanie
            </button>
          </div>
        );
      }

      if (selectedCategory === 'sudoku') {
        return (
          <SudokuPuzzleComponent
            puzzle={puzzleData}
            onSolved={handlePuzzleSolved}
            onGiveUp={handleGiveUp}
          />
        );
      }
      if (selectedCategory === 'crossword') {
        return (
          <CrosswordPuzzleComponent
            puzzle={puzzleData}
            onSolved={handlePuzzleSolved}
            onGiveUp={handleGiveUp}
          />
        );
      }
      if (selectedCategory === 'wordsearch') {
        return (
          <WordsearchPuzzleComponent
            puzzle={puzzleData}
            onSolved={handlePuzzleSolved}
            onGiveUp={handleGiveUp}
          />
        );
      }
      if (selectedCategory === 'rebus' && collection) {
        return (
          <RebusPuzzleComponent
            puzzle={collection as any}
            onSolved={handlePuzzleSolved}
            onGiveUp={handleGiveUp}
          />
        );
      }
      if (selectedCategory === 'quiz' && collection) {
        return (
          <QuizPuzzleComponent
            puzzle={collection as any}
            onSolved={handlePuzzleSolved}
            onGiveUp={handleGiveUp}
          />
        );
      }
      if (selectedCategory === 'memory') {
        return (
          <MemoryPuzzleComponent
            puzzle={puzzleData}
            onSolved={handlePuzzleSolved}
            onGiveUp={handleGiveUp}
          />
        );
      }
      if (selectedCategory === 'architect') {
        return (
          <ArchitectPuzzleComponent
            puzzle={puzzleData as ArchitectPuzzle}
            onSolved={handlePuzzleSolved}
          />
        );
      }

      return null;
    };

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <button className={styles.backBtn} onClick={handleBackToDashboard}>
              <ArrowLeft size={16} /> Powrót do Wyzwań
            </button>
            <div className={styles.headerIcon}>
              {renderCategoryIcon(selectedCategory)}
            </div>
            <div>
              <h2 className={styles.title}>{currentMeta?.title}</h2>
              <p className={styles.subtitle}>
                Poziom kategorii: {catStats?.level || 1} • {catStats?.xp || 0} XP
              </p>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.gameContainer}>
            {isFinished ? (
              <>
                <div className={styles.resultSummaryCard}>
                  {attempt.status === 'completed' ? (
                    <>
                      <h3 className={styles.resultTitle}>Wyzwanie Ukończone</h3>
                      <div className={styles.rewardChips}>
                        <span className={styles.rewardChip}>
                          Pozycja: #{attempt.rank || lastEarnedRank || 2}
                        </span>
                        <span className={styles.rewardChip} style={{ color: 'var(--primary)' }}>
                          +{attempt.pointsEarned || lastEarnedPoints || 90} XP
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className={styles.resultTitle}>Wyzwanie Przerwane</h3>
                      <p className={styles.startDescription} style={{ marginBottom: 0 }}>
                        Poddano się w dzisiejszym wyzwaniu. Kolejna próba będzie dostępna jutro.
                      </p>
                    </>
                  )}

                  <button className={styles.backBtn} onClick={handleBackToDashboard} style={{ marginTop: '0.5rem' }}>
                    <ArrowLeft size={16} /> Wróć do Dashboardu
                  </button>
                </div>

                <Leaderboard
                  userTimeSeconds={attempt.status === 'completed' ? (attempt.timeSeconds || 60) : 999999}
                  currentUserName={currentUserName}
                  currentUserAvatar={currentUserAvatar}
                  hideCurrentUser={attempt.status === 'gave_up'}
                  challengeTitle={currentMeta?.title}
                />
              </>
            ) : (
              renderPuzzleGame()
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  //  DASHBOARD VIEW (ALL 7 CATEGORIES)
  // ============================================
  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <div className={styles.headerIcon}>
            <Trophy size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className={styles.title}>Centrum Wyzwań</h2>
            <p className={styles.subtitle}>
              Codzienne testy analityczne i łamigłówki logiczne społeczności eMotion
            </p>
          </div>
        </div>

        {/* Subtle Developer Actions */}
        <div className={styles.headerActions}>
          <button
            className={`${styles.devPill} ${styles.devPillPrimary}`}
            onClick={() => addBonusXp(400)}
            title="Dodaj +400 XP (test awansu na Poziom 5)"
          >
            <Sparkles size={13} />
            +400 XP (Test)
          </button>
          <button
            className={styles.devPill}
            onClick={resetTodayAttempts}
            title="Resetuje dzisiejsze próby"
          >
            <RotateCcw size={12} />
            Reset Dnia
          </button>
          <button
            className={styles.devPill}
            onClick={debugResetAll}
            title="Resetuje cały postęp"
          >
            Reset XP
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.dashboardWrap}>
          {/* Player Progression Banner */}
          <div className={`${styles.progressBanner} ${getTierClass()}`}>
            <div className={styles.bannerTop}>
              <div className={styles.levelBadgeWrap}>
                <div className={styles.tierEmblem}>
                  {renderTierIcon()}
                </div>
                <div className={styles.levelDetails}>
                  <div className={styles.levelHeading}>
                    <span className={styles.levelTitle}>Poziom {levelInfo.level}</span>
                    <span className={styles.tierPill}>
                      Ranga {levelInfo.tierName}
                    </span>
                  </div>
                  <span className={styles.totalXpSubtext}>
                    Łączny dorobek: <strong>{overallXp} XP</strong>
                  </span>
                </div>
              </div>

              <div className={styles.statsGroup}>
                <div className={styles.statItem}>
                  <Check size={14} strokeWidth={2.5} color="var(--success, #10b981)" />
                  Ukończono dziś: <strong>{completedTodayCount}/{totalChallengesCount}</strong>
                </div>
                <div className={styles.statItem}>
                  <Flame size={14} strokeWidth={2.5} color="#d97706" />
                  Wymóg weryfikacji: <strong>Poziom 5</strong>
                </div>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className={styles.progressSection}>
              <div className={styles.progressLabels}>
                <span>Postęp do Poziomu {levelInfo.level + 1}</span>
                <span>
                  {levelInfo.currentLevelXp} / {levelInfo.xpNeededForNextLevel} XP ({levelInfo.progressPercent}%)
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Tier Legend */}
            <div className={styles.tierLegend}>
              <span className={styles.legendItem}>
                <strong>Brąz:</strong> Poz. 1–10
              </span>
              <span className={styles.legendItem}>
                <strong>Srebro:</strong> Poz. 11–25
              </span>
              <span className={styles.legendItem}>
                <strong>Złoto:</strong> Poz. 26–50+
              </span>
              <span className={styles.legendItem}>
                <strong>Punktacja:</strong> Top 10 w rankingu (10–100 XP)
              </span>
            </div>
          </div>

          {/* Section: 7 Challenges */}
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Dostępne Wyzwania
            </h3>
            <span className={styles.sectionSub}>
              1 próba na zadanie w ciągu doby
            </span>
          </div>

          {/* Grid of 7 Cards */}
          <div className={styles.challengesGrid}>
            {PUZZLE_CATEGORIES.map(category => {
              const attempt = dailyAttempts[category.type];
              const stats = categoryStats[category.type];
              const isCompleted = attempt && attempt.status === 'completed';
              const isGaveUp = attempt && attempt.status === 'gave_up';

              return (
                <div key={category.type} className={styles.card}>
                  {/* Card Top */}
                  <div className={styles.cardTop}>
                    <div
                      className={styles.cardIcon}
                      style={{ background: category.accentColor }}
                    >
                      {renderCategoryIcon(category.type, 19)}
                    </div>
                    <span className={styles.categoryTag}>
                      {category.categoryTag}
                    </span>
                  </div>

                  {/* Card Middle */}
                  <div className={styles.cardMiddle}>
                    <h4 className={styles.cardTitle}>{category.title}</h4>
                    <p className={styles.cardDesc}>{category.shortDesc}</p>
                  </div>

                  {/* Card Level / Status Meta */}
                  <div className={styles.cardMetaRow}>
                    <span className={styles.metaLevel}>
                      Poziom {stats?.level || 1} • {stats?.xp || 0} XP
                    </span>
                    {isCompleted ? (
                      <span className={styles.metaStatusCompleted}>
                        <CheckCircle2 size={13} /> #{attempt.rank || 2} (+{attempt.pointsEarned || 90} XP)
                      </span>
                    ) : isGaveUp ? (
                      <span className={styles.metaStatusGaveUp}>
                        Poddano się
                      </span>
                    ) : (
                      <span className={styles.metaStatusAvailable}>
                        Dostępne
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    className={`${styles.actionBtn} ${
                      isCompleted || isGaveUp ? styles.btnSecondary : styles.btnPrimary
                    }`}
                    onClick={() => handleSelectCategory(category.type)}
                  >
                    {isCompleted ? 'Zobacz Wynik' : isGaveUp ? 'Zobacz Tabelę' : 'Rozpocznij'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
