import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Flag,
  Trophy,
  Sparkles,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ListFilter
} from 'lucide-react';
import styles from './crossword.module.css';

export interface CrosswordWord {
  id: number;
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: 'horizontal' | 'vertical';
}

export interface CrosswordData {
  id: number;
  size: { rows: number; cols: number };
  words: CrosswordWord[];
}

interface CrosswordPuzzleProps {
  puzzle: CrosswordData;
  onSolved?: (timeSeconds: number) => void;
  onGiveUp?: () => void;
}

const HINT_PENALTY = 15;

export const CrosswordPuzzleComponent: React.FC<CrosswordPuzzleProps> = ({
  puzzle,
  onSolved,
  onGiveUp,
}) => {
  const { size, words } = puzzle;

  // Map each valid cell to its expected letter and metadata
  const cellMap = useMemo(() => {
    const map = new Map<string, { letter: string; number?: number; wordIds: number[] }>();

    words.forEach(word => {
      const { row, col, direction, answer, number, id } = word;
      for (let i = 0; i < answer.length; i++) {
        const r = direction === 'vertical' ? row + i : row;
        const c = direction === 'horizontal' ? col + i : col;
        const key = `${r},${c}`;
        const char = answer[i].toUpperCase();

        const existing = map.get(key);
        if (existing) {
          existing.wordIds.push(id);
          if (i === 0 && !existing.number) {
            existing.number = number;
          }
        } else {
          map.set(key, {
            letter: char,
            number: i === 0 ? number : undefined,
            wordIds: [id],
          });
        }
      }
    });

    return map;
  }, [words]);

  // Initial selection
  const firstWord = words[0];
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(
    firstWord ? { row: firstWord.row, col: firstWord.col } : null
  );
  const [selectedDirection, setSelectedDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [checkStatus, setCheckStatus] = useState<Record<string, 'correct' | 'wrong' | null>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [recentPenalty, setRecentPenalty] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [showCheckFeedback, setShowCheckFeedback] = useState(false);
  const [showAllClues, setShowAllClues] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Active word based on selected cell & direction
  const activeWord = useMemo(() => {
    if (!selectedCell) return null;
    const { row, col } = selectedCell;

    // Find words that contain this cell
    const matchingWords = words.filter(w => {
      if (w.direction === 'horizontal') {
        return w.row === row && col >= w.col && col < w.col + w.answer.length;
      } else {
        return w.col === col && row >= w.row && row < w.row + w.answer.length;
      }
    });

    if (matchingWords.length === 0) return null;

    // Prefer word matching selectedDirection
    const inDirection = matchingWords.find(w => w.direction === selectedDirection);
    return inDirection || matchingWords[0];
  }, [selectedCell, selectedDirection, words]);

  // Alternate word for intersection cells
  const alternateWord = useMemo(() => {
    if (!selectedCell || !activeWord) return null;
    const { row, col } = selectedCell;

    return words.find(w => {
      if (w.id === activeWord.id) return false;
      if (w.direction === 'horizontal') {
        return w.row === row && col >= w.col && col < w.col + w.answer.length;
      } else {
        return w.col === col && row >= w.row && row < w.row + w.answer.length;
      }
    }) || null;
  }, [selectedCell, activeWord, words]);

  // Set of cell keys that belong to active word
  const activeWordCells = useMemo(() => {
    if (!activeWord) return new Set<string>();
    const set = new Set<string>();
    for (let i = 0; i < activeWord.answer.length; i++) {
      const r = activeWord.direction === 'vertical' ? activeWord.row + i : activeWord.row;
      const c = activeWord.direction === 'horizontal' ? activeWord.col + i : activeWord.col;
      set.add(`${r},${c}`);
    }
    return set;
  }, [activeWord]);

  // Check which words are fully correct
  const completedWords = useMemo(() => {
    const set = new Set<number>();
    words.forEach(w => {
      let fullMatch = true;
      for (let i = 0; i < w.answer.length; i++) {
        const r = w.direction === 'vertical' ? w.row + i : w.row;
        const c = w.direction === 'horizontal' ? w.col + i : w.col;
        const key = `${r},${c}`;
        if ((userInputs[key] || '').toUpperCase() !== w.answer[i].toUpperCase()) {
          fullMatch = false;
          break;
        }
      }
      if (fullMatch) {
        set.add(w.id);
      }
    });
    return set;
  }, [words, userInputs]);

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

  // Check if puzzle is fully solved
  const verifyCompletion = (inputs: Record<string, string>) => {
    let allCorrect = true;
    for (const [key, meta] of cellMap.entries()) {
      const val = (inputs[key] || '').toUpperCase();
      if (val !== meta.letter.toUpperCase()) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect && !isSolved) {
      setIsSolved(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const totalTime = elapsedSeconds + penaltySeconds;
      setTimeout(() => {
        onSolved?.(totalTime);
      }, 600);
    }
  };

  // Cell click handler
  const handleCellClick = (row: number, col: number) => {
    const key = `${row},${col}`;
    if (!cellMap.has(key)) return;

    if (selectedCell?.row === row && selectedCell?.col === col) {
      // Toggle direction if cell is intersection
      const meta = cellMap.get(key);
      if (meta && meta.wordIds.length > 1) {
        setSelectedDirection(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
      }
    } else {
      setSelectedCell({ row, col });
      // If cell belongs to only one direction, switch to it
      const meta = cellMap.get(key);
      if (meta && meta.wordIds.length === 1) {
        const w = words.find(item => item.id === meta.wordIds[0]);
        if (w) setSelectedDirection(w.direction);
      }
    }

    inputRefs.current[key]?.focus();
  };

  // Toggle direction explicitly
  const handleToggleDirection = () => {
    if (alternateWord) {
      setSelectedDirection(alternateWord.direction);
      if (selectedCell) {
        const key = `${selectedCell.row},${selectedCell.col}`;
        inputRefs.current[key]?.focus();
      }
    } else {
      setSelectedDirection(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    }
  };

  // Clue click handler
  const handleClueClick = (word: CrosswordWord) => {
    setSelectedDirection(word.direction);
    let targetRow = word.row;
    let targetCol = word.col;

    for (let i = 0; i < word.answer.length; i++) {
      const r = word.direction === 'vertical' ? word.row + i : word.row;
      const c = word.direction === 'horizontal' ? word.col + i : word.col;
      const key = `${r},${c}`;
      if (!userInputs[key]) {
        targetRow = r;
        targetCol = c;
        break;
      }
    }

    setSelectedCell({ row: targetRow, col: targetCol });
    inputRefs.current[`${targetRow},${targetCol}`]?.focus();
  };

  // Input change & key handlers
  const handleInputChange = (row: number, col: number, value: string) => {
    const key = `${row},${col}`;
    const cleanVal = value.slice(-1).toUpperCase();

    const nextInputs = { ...userInputs, [key]: cleanVal };
    setUserInputs(nextInputs);

    if (checkStatus[key]) {
      setCheckStatus(prev => ({ ...prev, [key]: null }));
    }

    if (cleanVal) {
      moveToNextCell(row, col);
    }

    verifyCompletion(nextInputs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const key = `${row},${col}`;

    if (e.key === 'Backspace') {
      if (!userInputs[key]) {
        moveToPrevCell(row, col);
      } else {
        setUserInputs(prev => ({ ...prev, [key]: '' }));
      }
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      moveInGrid(row, col + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      moveInGrid(row, col - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      moveInGrid(row + 1, col);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      moveInGrid(row - 1, col);
      e.preventDefault();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      handleToggleDirection();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const currentIndex = words.findIndex(w => w.id === activeWord?.id);
      const nextWord = words[(currentIndex + 1) % words.length];
      if (nextWord) handleClueClick(nextWord);
    }
  };

  const moveToNextCell = (row: number, col: number) => {
    if (!activeWord) return;
    const isHoriz = activeWord.direction === 'horizontal';
    const nextRow = isHoriz ? row : row + 1;
    const nextCol = isHoriz ? col + 1 : col;
    const nextKey = `${nextRow},${nextCol}`;

    if (activeWordCells.has(nextKey)) {
      setSelectedCell({ row: nextRow, col: nextCol });
      inputRefs.current[nextKey]?.focus();
    }
  };

  const moveToPrevCell = (row: number, col: number) => {
    if (!activeWord) return;
    const isHoriz = activeWord.direction === 'horizontal';
    const prevRow = isHoriz ? row : row - 1;
    const prevCol = isHoriz ? col - 1 : col;
    const prevKey = `${prevRow},${prevCol}`;

    if (activeWordCells.has(prevKey)) {
      setSelectedCell({ row: prevRow, col: prevCol });
      setUserInputs(prev => ({ ...prev, [prevKey]: '' }));
      inputRefs.current[prevKey]?.focus();
    }
  };

  const moveInGrid = (row: number, col: number) => {
    if (row < 0 || row >= size.rows || col < 0 || col >= size.cols) return;
    const key = `${row},${col}`;
    if (cellMap.has(key)) {
      setSelectedCell({ row, col });
      inputRefs.current[key]?.focus();
    }
  };

  // Hint button
  const handleUseHint = () => {
    if (!selectedCell || isSolved) return;
    const key = `${selectedCell.row},${selectedCell.col}`;
    const meta = cellMap.get(key);
    if (!meta) return;

    setPenaltySeconds(prev => prev + HINT_PENALTY);
    showPenaltyPopup(HINT_PENALTY);

    const nextInputs = { ...userInputs, [key]: meta.letter };
    setUserInputs(nextInputs);
    moveToNextCell(selectedCell.row, selectedCell.col);
    verifyCompletion(nextInputs);
  };

  // Check answers
  const handleCheck = () => {
    const status: Record<string, 'correct' | 'wrong' | null> = {};
    for (const [key, meta] of cellMap.entries()) {
      const val = (userInputs[key] || '').toUpperCase();
      if (!val) {
        status[key] = null;
      } else if (val === meta.letter.toUpperCase()) {
        status[key] = 'correct';
      } else {
        status[key] = 'wrong';
      }
    }
    setCheckStatus(status);
    setShowCheckFeedback(true);
    setTimeout(() => setShowCheckFeedback(false), 3000);
  };

  // Reset grid
  const handleReset = () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić wszystkie wpisane litery?')) {
      setUserInputs({});
      setCheckStatus({});
    }
  };

  const horizontalWords = words.filter(w => w.direction === 'horizontal');
  const verticalWords = words.filter(w => w.direction === 'vertical');

  return (
    <div className={styles.crosswordWrapper}>
      {/* Top Controls & Status Bar */}
      <div className={styles.crosswordHeader}>
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
          <span>Odgadnięte hasła: {completedWords.size} / {words.length}</span>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.hintBtn}
            onClick={handleUseHint}
            disabled={!selectedCell || isSolved}
            title="Odkryj zaznaczoną literę (+15s kary)"
          >
            <HelpCircle size={16} />
            <span>Podpowiedź (+15s)</span>
          </button>
          <button
            className={styles.checkBtn}
            onClick={handleCheck}
            disabled={isSolved}
            title="Sprawdź poprawność wpisanych liter"
          >
            <CheckCircle size={16} />
            <span>Sprawdź</span>
          </button>
          <button
            className={styles.resetBtn}
            onClick={handleReset}
            disabled={isSolved}
            title="Wyczyść całą krzyżówkę"
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

      {showCheckFeedback && (
        <div className={styles.feedbackBanner}>
          Wpisane litery zostały sprawdzone! Zielone są poprawne, czerwone błędne.
        </div>
      )}

      {/* ACTIVE CLUE / INSTRUCTION BANNER - ABOVE CROSSWORD GRID */}
      <div className={styles.activeClueBanner}>
        {activeWord ? (
          <div className={styles.clueBannerContent}>
            <div className={styles.clueBannerBadgeArea}>
              <span className={styles.clueBadge}>
                {activeWord.number}. {activeWord.direction === 'horizontal' ? 'Poziomo' : 'Pionowo'}
              </span>
              <span className={styles.clueLength}>({activeWord.answer.length} liter)</span>
              {alternateWord && (
                <button
                  type="button"
                  className={styles.directionToggleBtn}
                  onClick={handleToggleDirection}
                  title="Kliknij, aby zmienić kierunek na krzyżujące się hasło"
                >
                  <ArrowRightLeft size={13} />
                  <span>Zmień na: {alternateWord.number}. {alternateWord.direction === 'horizontal' ? 'Poziomo' : 'Pionowo'}</span>
                </button>
              )}
            </div>
            <div className={styles.clueBannerText}>
              {activeWord.clue}
            </div>
          </div>
        ) : (
          <div className={styles.instructionBanner}>
            <Lightbulb size={20} className={styles.instructionIcon} />
            <div className={styles.instructionText}>
              <strong>Jak grać:</strong> Kliknij dowolne pole na planszy, aby podświetlić hasło i wpisać odpowiedź.
              Kliknij pole ponownie lub naciśnij spację, aby zmienić kierunek (poziomo / pionowo).
            </div>
          </div>
        )}
      </div>

      {/* Main Crossword Card - Grid Centered Full Width */}
      <div className={styles.boardCard}>
        <div
          className={styles.crosswordGrid}
          style={{
            gridTemplateColumns: `repeat(${size.cols}, minmax(0, 1fr))`,
            maxWidth: `min(100%, ${size.cols * 42}px)`,
          }}
        >
          {Array.from({ length: size.rows }).map((_, r) =>
            Array.from({ length: size.cols }).map((_, c) => {
              const key = `${r},${c}`;
              const meta = cellMap.get(key);
              const isCell = Boolean(meta);
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isInActiveWord = activeWordCells.has(key);
              const val = userInputs[key] || '';
              const correctness = checkStatus[key];

              if (!isCell) {
                return <div key={key} className={styles.cellEmpty} />;
              }

              return (
                <div
                  key={key}
                  className={`
                    ${styles.cell}
                    ${isSelected ? styles.cellSelected : ''}
                    ${isInActiveWord ? styles.cellInActiveWord : ''}
                    ${correctness === 'correct' ? styles.cellCorrect : ''}
                    ${correctness === 'wrong' ? styles.cellWrong : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  {meta?.number && (
                    <span className={styles.cellNumber}>{meta.number}</span>
                  )}
                  <input
                    ref={el => { inputRefs.current[key] = el; }}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={e => handleInputChange(r, c, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, r, c)}
                    className={styles.cellInput}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Collapsible Full Clues Drawer below the grid */}
      <div className={styles.cluesAccordion}>
        <button
          type="button"
          className={styles.accordionToggle}
          onClick={() => setShowAllClues(prev => !prev)}
        >
          <div className={styles.accordionToggleLeft}>
            <ListFilter size={16} className={styles.accordionIcon} />
            <span>Wszystkie hasła krzyżówki ({words.length})</span>
          </div>
          <div className={styles.accordionToggleRight}>
            <span>{showAllClues ? 'Ukryj listę haseł' : 'Pokaż pełną listę haseł'}</span>
            {showAllClues ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showAllClues && (
          <div className={styles.cluesCard}>
            <div className={styles.cluesColumns}>
              {/* Horizontal */}
              <div className={styles.cluesSection}>
                <h4 className={styles.cluesSectionTitle}>
                  <span>Poziomo</span>
                </h4>
                <div className={styles.cluesList}>
                  {horizontalWords.map(w => {
                    const isActive = activeWord?.id === w.id;
                    const isDone = completedWords.has(w.id);

                    return (
                      <div
                        key={w.id}
                        className={`
                          ${styles.clueItem}
                          ${isActive ? styles.clueItemActive : ''}
                          ${isDone ? styles.clueItemDone : ''}
                        `}
                        onClick={() => {
                          handleClueClick(w);
                        }}
                      >
                        <span className={styles.clueNumber}>{w.number}.</span>
                        <span className={styles.clueContent}>{w.clue}</span>
                        {isDone && <CheckCircle size={14} className={styles.clueDoneIcon} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vertical */}
              <div className={styles.cluesSection}>
                <h4 className={styles.cluesSectionTitle}>
                  <span>Pionowo</span>
                </h4>
                <div className={styles.cluesList}>
                  {verticalWords.map(w => {
                    const isActive = activeWord?.id === w.id;
                    const isDone = completedWords.has(w.id);

                    return (
                      <div
                        key={w.id}
                        className={`
                          ${styles.clueItem}
                          ${isActive ? styles.clueItemActive : ''}
                          ${isDone ? styles.clueItemDone : ''}
                        `}
                        onClick={() => {
                          handleClueClick(w);
                        }}
                      >
                        <span className={styles.clueNumber}>{w.number}.</span>
                        <span className={styles.clueContent}>{w.clue}</span>
                        {isDone && <CheckCircle size={14} className={styles.clueDoneIcon} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {isSolved && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalTrophy}>
              <Trophy size={48} className={styles.trophyIcon} />
              <Sparkles size={24} className={styles.sparkleIcon} />
            </div>
            <h2 className={styles.modalTitle}>Krzyżówka Rozwiązana! 🎉</h2>
            <p className={styles.modalSubtitle}>
              Doskonała robota! Wszystkie hasła zostały odgadnięte prawidłowo.
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
