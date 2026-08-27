import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, HelpCircle, RotateCcw, Flag, Trophy, Sparkles, Delete } from 'lucide-react';
import styles from './sudoku.module.css';

export interface SudokuData {
  id: number;
  grid: number[][];
  solution?: number[][];
}

interface SudokuPuzzleProps {
  puzzle: SudokuData;
  onSolved?: (timeSeconds: number) => void;
  onGiveUp?: () => void;
}

const HINT_PENALTY = 15;

export const SudokuPuzzleComponent: React.FC<SudokuPuzzleProps> = ({
  puzzle,
  onSolved,
  onGiveUp,
}) => {
  const { grid, solution } = puzzle;

  // Initialize board from initial grid
  const [board, setBoard] = useState<number[][]>(() => grid.map(row => [...row]));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 0]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [recentPenalty, setRecentPenalty] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Sync board when puzzle changes
  useEffect(() => {
    setBoard(puzzle.grid.map(row => [...row]));
    setErrorCells(new Set());
    setSelectedCell([0, 0]);
    setIsSolved(false);
  }, [puzzle]);

  // Check which cells were initially fixed
  const isInitialCell = (r: number, c: number) => grid[r] && grid[r][c] !== 0;

  // Timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (!isSolved) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSolved]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const showPenaltyPopup = (seconds: number) => {
    setRecentPenalty(seconds);
    setTimeout(() => setRecentPenalty(null), 1500);
  };

  // Find all conflicts in current board
  const calculateConflicts = (currentBoard: number[][]): Set<string> => {
    const errors = new Set<string>();

    // Rows
    for (let r = 0; r < 9; r++) {
      const seen = new Map<number, number[]>();
      for (let c = 0; c < 9; c++) {
        const val = currentBoard[r][c];
        if (val !== 0) {
          const list = seen.get(val) || [];
          list.push(c);
          seen.set(val, list);
        }
      }
      seen.forEach(cols => {
        if (cols.length > 1) {
          cols.forEach(c => errors.add(`${r},${c}`));
        }
      });
    }

    // Columns
    for (let c = 0; c < 9; c++) {
      const seen = new Map<number, number[]>();
      for (let r = 0; r < 9; r++) {
        const val = currentBoard[r][c];
        if (val !== 0) {
          const list = seen.get(val) || [];
          list.push(r);
          seen.set(val, list);
        }
      }
      seen.forEach(rows => {
        if (rows.length > 1) {
          rows.forEach(r => errors.add(`${r},${c}`));
        }
      });
    }

    // 3x3 Boxes
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const seen = new Map<number, [number, number][]>();
        for (let r = br * 3; r < br * 3 + 3; r++) {
          for (let c = bc * 3; c < bc * 3 + 3; c++) {
            const val = currentBoard[r][c];
            if (val !== 0) {
              const list = seen.get(val) || [];
              list.push([r, c]);
              seen.set(val, list);
            }
          }
        }
        seen.forEach(cells => {
          if (cells.length > 1) {
            cells.forEach(([r, c]) => errors.add(`${r},${c}`));
          }
        });
      }
    }

    return errors;
  };

  // Check if fully solved
  const checkVictory = (currentBoard: number[][]) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] === 0) return false;
      }
    }

    const errors = calculateConflicts(currentBoard);
    if (errors.size > 0) return false;

    if (solution) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c] !== solution[r][c]) return false;
        }
      }
    }

    return true;
  };

  const handleCellSelect = (r: number, c: number) => {
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isSolved) return;
    const [r, c] = selectedCell;
    if (isInitialCell(r, c)) return;

    const nextBoard = board.map(row => [...row]);
    nextBoard[r][c] = num;
    setBoard(nextBoard);

    const conflicts = calculateConflicts(nextBoard);
    setErrorCells(conflicts);

    if (checkVictory(nextBoard)) {
      setIsSolved(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const totalTime = elapsedSeconds + penaltySeconds;
      setTimeout(() => {
        onSolved?.(totalTime);
      }, 600);
    }
  };

  const handleDelete = () => {
    if (!selectedCell || isSolved) return;
    const [r, c] = selectedCell;
    if (isInitialCell(r, c)) return;

    const nextBoard = board.map(row => [...row]);
    nextBoard[r][c] = 0;
    setBoard(nextBoard);

    const conflicts = calculateConflicts(nextBoard);
    setErrorCells(conflicts);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isSolved) return;
      const [r, c] = selectedCell;

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleDelete();
      } else if (e.key === 'ArrowUp') {
        setSelectedCell([Math.max(0, r - 1), c]);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setSelectedCell([Math.min(8, r + 1), c]);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        setSelectedCell([r, Math.max(0, c - 1)]);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        setSelectedCell([r, Math.min(8, c + 1)]);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Hint
  const handleUseHint = () => {
    if (!selectedCell || !solution || isSolved) return;
    const [r, c] = selectedCell;
    if (isInitialCell(r, c)) return;

    setPenaltySeconds(prev => prev + HINT_PENALTY);
    showPenaltyPopup(HINT_PENALTY);

    const nextBoard = board.map(row => [...row]);
    nextBoard[r][c] = solution[r][c];
    setBoard(nextBoard);

    const conflicts = calculateConflicts(nextBoard);
    setErrorCells(conflicts);

    if (checkVictory(nextBoard)) {
      setIsSolved(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const totalTime = elapsedSeconds + penaltySeconds + HINT_PENALTY;
      setTimeout(() => {
        onSolved?.(totalTime);
      }, 600);
    }
  };

  const handleReset = () => {
    if (window.confirm('Czy na pewno chcesz zresetować planszę Sudoku?')) {
      setBoard(grid.map(row => [...row]));
      setErrorCells(new Set());
    }
  };

  const filledCount = board.flat().filter(v => v !== 0).length;

  return (
    <div className={styles.sudokuWrapper}>
      {/* Top Header Controls */}
      <div className={styles.sudokuHeader}>
        <div className={styles.timerDisplay}>
          <Clock size={18} className={styles.timerIcon} />
          <span className={styles.timerText}>{formatTime(elapsedSeconds)}</span>
          {penaltySeconds > 0 && (
            <span className={styles.penaltyBadge}>+{penaltySeconds}s kary</span>
          )}
          {recentPenalty !== null && (
            <span className={styles.penaltyPopup}>+{recentPenalty}s</span>
          )}
        </div>

        <div className={styles.progressDisplay}>
          <CheckCircle size={18} className={styles.progressIcon} />
          <span>Wypełnione: {filledCount} / 81</span>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.hintBtn}
            onClick={handleUseHint}
            disabled={!selectedCell || isInitialCell(selectedCell[0], selectedCell[1]) || isSolved}
            title="Odkryj poprawną cyfrę (+15s kary)"
          >
            <HelpCircle size={16} />
            <span>Podpowiedź (+15s)</span>
          </button>
          <button
            className={styles.resetBtn}
            onClick={handleReset}
            disabled={isSolved}
            title="Wyczyść wpisane cyfry"
          >
            <RotateCcw size={16} />
          </button>
          {onGiveUp && (
            <button
              className={styles.giveUpBtn}
              onClick={onGiveUp}
              disabled={isSolved}
              title="Poddaj się"
            >
              <Flag size={16} />
              <span>Poddaj się</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Board & Keypad Card */}
      <div className={styles.mainCard}>
        {/* Sudoku Grid */}
        <div className={styles.gridContainer}>
          <div className={styles.sudokuGrid}>
            {board.map((row, r) =>
              row.map((val, c) => {
                const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                const isSameRowCol = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
                const selectedVal = selectedCell ? board[selectedCell[0]][selectedCell[1]] : 0;
                const isSameNumber = selectedVal !== 0 && val === selectedVal;
                const isInitial = isInitialCell(r, c);
                const isError = errorCells.has(`${r},${c}`);

                let cellStateClass = isInitial ? styles.cellInitial : styles.cellUser;
                if (isSameRowCol && !isSelected) cellStateClass += ` ${styles.cellHighlight}`;
                if (isSameNumber && !isSelected) cellStateClass += ` ${styles.cellSameValue}`;
                if (isSelected) cellStateClass += ` ${styles.cellSelected}`;
                if (isError) cellStateClass += ` ${styles.cellError}`;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`
                      ${styles.sudokuCell}
                      ${cellStateClass}
                      ${c % 3 === 2 && c !== 8 ? styles.borderRightThick : ''}
                      ${r % 3 === 2 && r !== 8 ? styles.borderBottomThick : ''}
                    `}
                    onClick={() => handleCellSelect(r, c)}
                  >
                    {val !== 0 ? val : ''}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Number Keypad */}
        <div className={styles.keypad}>
          <div className={styles.keypadNumbers}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                className={styles.numBtn}
                onClick={() => handleNumberInput(num)}
                disabled={isSolved}
              >
                {num}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.eraseBtn}
            onClick={handleDelete}
            disabled={isSolved}
            title="Usuń wpisaną cyfrę"
          >
            <Delete size={18} />
            <span>Wyczyść pole</span>
          </button>
        </div>
      </div>

      {/* Completion Modal */}
      {isSolved && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalTrophy}>
              <Trophy size={48} className={styles.trophyIcon} />
              <Sparkles size={24} className={styles.sparkleIcon} />
            </div>
            <h2 className={styles.modalTitle}>Sudoku Ukończone! 🎉</h2>
            <p className={styles.modalSubtitle}>
              Gratulacje! Poprawnie wypełniłeś całą planszę 9x9.
            </p>
            <div className={styles.modalStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Czas podstawowy</span>
                <span className={styles.statValue}>{formatTime(elapsedSeconds)}</span>
              </div>
              {penaltySeconds > 0 && (
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Kary</span>
                  <span className={styles.statValue}>+{penaltySeconds}s</span>
                </div>
              )}
              <div className={`${styles.statItem} ${styles.statFinal}`}>
                <span className={styles.statLabel}>Czas końcowy</span>
                <span className={styles.statValueFinal}>
                  {formatTime(elapsedSeconds + penaltySeconds)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
