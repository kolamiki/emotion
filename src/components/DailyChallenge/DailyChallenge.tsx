import React, { useState, useEffect } from 'react';
import { Trophy, Puzzle, BrainCircuit, Target, Keyboard, HelpCircle, Building2 } from 'lucide-react';
import styles from './DailyChallenge.module.css';
import crosswordStyles from './crossword.module.css';
import { dailyPuzzles } from './puzzles';
import type { PuzzleType, ArchitectPuzzle } from './puzzles';
import { ArchitectPuzzleComponent } from './ArchitectPuzzle';
import { RebusPuzzleComponent } from './RebusPuzzle';
import { Leaderboard } from './Leaderboard';
import { useDailyChallengeState } from '../../hooks/useDailyChallengeState';

interface DailyChallengeProps {
  currentUserName?: string;
  currentUserAvatar?: string;
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({
  currentUserName = 'Jan Kowalski',
  currentUserAvatar = 'https://i.pravatar.cc/150?u=u1',
}) => {
  const [currentPuzzle, setCurrentPuzzle] = useState<any>(null);
  const [puzzleData, setPuzzleData] = useState<any>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [solveTime, setSolveTime] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const { status, timeSeconds, completeChallenge, giveUpChallenge } = useDailyChallengeState();
  const isStartedRef = React.useRef(false);

  useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  useEffect(() => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
    const todayChallenge = dailyPuzzles[today];
    
    if (todayChallenge) {
      setCurrentPuzzle(todayChallenge);
      // Randomly select one puzzle item from the collection
      const randomItem = todayChallenge.items[Math.floor(Math.random() * todayChallenge.items.length)];
      setPuzzleData(randomItem);
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStartedRef.current && !isSolved && status === 'unplayed') {
        e.preventDefault();
        e.returnValue = 'Zamknięcie strony spowoduje automatyczne poddanie się w wyzwaniu. Czy na pewno chcesz wyjść?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Register internal navigation blocker
    (window as any).confirmNavigation = () => {
      if (isStartedRef.current && !isSolved && status === 'unplayed') {
        return window.confirm('Ostrzeżenie: Wyjście z tego widoku spowoduje automatyczne poddanie się w wyzwaniu. Czy na pewno chcesz przerwać?');
      }
      return true;
    };

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      delete (window as any).confirmNavigation;
      
      // Auto give-up on unmount if started and not solved
      if (isStartedRef.current && !isSolved && status === 'unplayed') {
        giveUpChallenge();
      }
    };
  }, [isSolved, status, giveUpChallenge]);

  const handleStart = () => {
    setIsStarted(true);
  };

  const handlePuzzleSolved = (timeSec: number) => {
    setIsSolved(true);
    setSolveTime(timeSec);
    completeChallenge(timeSec);
  };

  const handleGiveUp = () => {
    giveUpChallenge();
  };

  if (!currentPuzzle || !puzzleData) return null;

  // Determine tomorrow's challenge
  const todayIndex = new Date().getDay();
  const tomorrowIndex = (todayIndex + 1) % 7;
  const tomorrowChallenge = dailyPuzzles[tomorrowIndex];

  const renderPuzzleIcon = (type: PuzzleType) => {
    switch (type) {
      case 'sudoku': return <Target size={24} />;
      case 'crossword': return <Keyboard size={24} />;
      case 'wordsearch': return <Puzzle size={24} />;
      case 'rebus': return <HelpCircle size={24} />;
      case 'quiz': return <BrainCircuit size={24} />;
      case 'memory': return <Puzzle size={24} />;
      case 'architect': return <Building2 size={24} />;
      default: return <Trophy size={24} />;
    }
  };

  const renderSudoku = (grid: number[][]) => {
    return (
      <div className={styles.sudokuGrid}>
        {grid.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className={styles.sudokuRow} style={{ display: 'contents' }}>
            {row.map((cell, colIndex) => (
              <input
                key={`cell-${rowIndex}-${colIndex}`}
                type="text"
                maxLength={1}
                className={styles.sudokuCell}
                defaultValue={cell !== 0 ? cell.toString() : ''}
                readOnly={cell !== 0}
                style={{ 
                  color: cell !== 0 ? 'var(--primary)' : 'var(--text)',
                  backgroundColor: cell !== 0 ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface)'
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderCrossword = (data: any) => {
    if (!data || !data.size || !data.words) {
      return renderPlaceholder();
    }

    // Generate grid based on size
    const grid: any[][] = Array(data.size.rows).fill(null).map(() => Array(data.size.cols).fill(null));
    
    // Fill the grid with words
    data.words.forEach((word: any) => {
      const { row, col, direction, answer, number } = word;
      for (let i = 0; i < answer.length; i++) {
        const r = direction === 'vertical' ? row + i : row;
        const c = direction === 'horizontal' ? col + i : col;
        
        if (!grid[r][c]) {
          grid[r][c] = { isEmpty: false, number: null };
        }
        if (i === 0) {
          grid[r][c].number = number;
        }
      }
    });

    const horizontalWords = data.words.filter((w: any) => w.direction === 'horizontal');
    const verticalWords = data.words.filter((w: any) => w.direction === 'vertical');

    return (
      <div className={crosswordStyles.crosswordContainer}>
        <div 
          className={crosswordStyles.crosswordGrid}
          style={{ gridTemplateColumns: `repeat(${data.size.cols}, 1fr)` }}
        >
          {grid.map((row, r) => 
            row.map((cell, c) => (
              <div 
                key={`c-${r}-${c}`} 
                className={`${crosswordStyles.crosswordCell} ${!cell ? crosswordStyles.crosswordCellEmpty : ''}`}
              >
                {cell && (
                  <>
                    {cell.number && <span className={crosswordStyles.crosswordNumber}>{cell.number}</span>}
                    <input type="text" maxLength={1} className={crosswordStyles.crosswordInput} />
                  </>
                )}
              </div>
            ))
          )}
        </div>
        <div className={crosswordStyles.crosswordClues}>
          <div className={crosswordStyles.cluesSection}>
            <h4>Poziomo</h4>
            {horizontalWords.map((w: any) => (
              <div key={w.id} className={crosswordStyles.clueItem}>
                <strong>{w.number}.</strong> {w.clue}
              </div>
            ))}
          </div>
          <div className={crosswordStyles.cluesSection}>
            <h4>Pionowo</h4>
            {verticalWords.map((w: any) => (
              <div key={w.id} className={crosswordStyles.clueItem}>
                <strong>{w.number}.</strong> {w.clue}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPlaceholder = () => (
    <div className={styles.placeholderCard}>
      <h3 className={styles.placeholderTitle}>{currentPuzzle.title}</h3>
      <p className={styles.placeholderText}>
        To jest szablon dla zagadki typu: <strong>{currentPuzzle.type}</strong>. 
        Wkrótce pojawi się tutaj interaktywna gra przygotowana specjalnie na ten dzień tygodnia!
      </p>
    </div>
  );

  const renderPuzzleContent = () => {
    if (status === 'unplayed' && !isStarted) {
      return (
        <div className={styles.startScreen}>
          <h3 className={styles.startTitle}>Gotowy na wyzwanie?</h3>
          <p className={styles.startText}>
            Uruchomienie zagadki włączy stoper. Jeśli zamkniesz to okno w trakcie gry, zostanie to potraktowane jako poddanie się!
          </p>
          <button className={styles.startBtn} onClick={handleStart}>
            Rozpocznij Wyzwanie
          </button>
        </div>
      );
    }

    if (currentPuzzle.type === 'sudoku') {
      return renderSudoku(puzzleData.grid);
    }
    if (currentPuzzle.type === 'crossword') {
      return renderCrossword(puzzleData);
    }
    if (currentPuzzle.type === 'rebus') {
      return (
        <RebusPuzzleComponent
          // We pass the full collection so RebusComponent can pick 5
          puzzle={currentPuzzle} 
          onSolved={handlePuzzleSolved}
          onGiveUp={handleGiveUp}
        />
      );
    }
    if (currentPuzzle.type === 'architect') {
      return (
        <ArchitectPuzzleComponent
          puzzle={puzzleData as ArchitectPuzzle}
          onSolved={handlePuzzleSolved}
        />
      );
    }
    
    // For other types, return a placeholder for now
    return renderPlaceholder();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <div className={styles.icon}>
            {renderPuzzleIcon(currentPuzzle.type)}
          </div>
          <div>
            <h2 className={styles.title}>Wyzwanie Dnia</h2>
            <p className={styles.subtitle}>{currentPuzzle.title} - {currentPuzzle.description}</p>
          </div>
        </div>
      </div>
      
      <div className={styles.content}>
        {(status === 'completed' || isSolved) ? (
          <>
            <div className={styles.lockedMessage}>
              <h3 className={styles.lockedTitle}>Wyzwanie zaliczone! 🎉</h3>
              <p>Świetna robota! Wróć jutro, aby spróbować swoich sił w: <strong>{tomorrowChallenge?.title}</strong>.</p>
            </div>
            <Leaderboard
              userTimeSeconds={timeSeconds || solveTime}
              currentUserName={currentUserName}
              currentUserAvatar={currentUserAvatar}
              challengeTitle={currentPuzzle.title}
            />
          </>
        ) : status === 'gave_up' ? (
          <>
            <div className={styles.lockedMessage}>
              <h3 className={styles.lockedTitle}>Głowa do góry! 💛</h3>
              <p>Każdy ma czasem gorszy dzień. Odpocznij i wróć jutro na: <strong>{tomorrowChallenge?.title}</strong>!</p>
            </div>
            {/* Show leaderboard without user score when they give up */}
            <Leaderboard
              userTimeSeconds={999999} // Dummy high time so they don't rank high
              currentUserName={currentUserName}
              currentUserAvatar={currentUserAvatar}
              hideCurrentUser={true} // (Need to add this prop to leaderboard if we don't want them in the list)
              challengeTitle={currentPuzzle.title}
            />
          </>
        ) : (
          renderPuzzleContent()
        )}
      </div>
    </div>
  );
};
