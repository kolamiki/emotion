import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, CheckCircle, HelpCircle, RotateCcw, Flag, Trophy, Sparkles, Search } from 'lucide-react';
import styles from './wordsearch.module.css';

export interface WordsearchData {
  id: number;
  theme: string;
  grid: string[][];
  words: string[];
}

interface WordsearchPuzzleProps {
  puzzle: WordsearchData;
  onSolved?: (timeSeconds: number) => void;
  onGiveUp?: () => void;
}

const HINT_PENALTY = 15;

const HIGHLIGHT_COLORS = [
  'rgba(108, 43, 217, 0.4)',
  'rgba(16, 185, 129, 0.4)',
  'rgba(234, 179, 8, 0.45)',
  'rgba(239, 68, 68, 0.4)',
  'rgba(59, 130, 246, 0.4)',
  'rgba(236, 72, 153, 0.4)',
  'rgba(20, 184, 166, 0.4)',
  'rgba(249, 115, 22, 0.4)',
];

export const WordsearchPuzzleComponent: React.FC<WordsearchPuzzleProps> = ({
  puzzle,
  onSolved,
  onGiveUp,
}) => {
  const { theme, grid, words } = puzzle;
  const rows = grid.length;
  const cols = grid[0].length;

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundWordPositions, setFoundWordPositions] = useState<{ word: string; cells: string[]; color: string }[]>([]);
  const [selectionStart, setSelectionStart] = useState<[number, number] | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<[number, number] | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hintCell, setHintCell] = useState<string | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [recentPenalty, setRecentPenalty] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  // Reset state when puzzle changes
  useEffect(() => {
    setFoundWords([]);
    setFoundWordPositions([]);
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
    setIsSolved(false);
    setHintCell(null);
  }, [puzzle]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

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

  // Get line of cells between start and end
  const getLineCells = (start: [number, number], end: [number, number]): [number, number][] => {
    const [r1, c1] = start;
    const [r2, c2] = end;

    const dr = r2 - r1;
    const dc = c2 - c1;
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return [start];

    // Must be straight line: horizontal, vertical, or 45-deg diagonal
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
      return [start];
    }

    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    const cells: [number, number][] = [];
    for (let i = 0; i <= len; i++) {
      cells.push([r1 + i * stepR, c1 + i * stepC]);
    }
    return cells;
  };

  const currentSelectionCells = useMemo(() => {
    if (!selectionStart || !selectionEnd) return [];
    return getLineCells(selectionStart, selectionEnd);
  }, [selectionStart, selectionEnd]);

  // Handle word checking
  const checkSelection = (start: [number, number], end: [number, number]) => {
    const line = getLineCells(start, end);
    const forward = line.map(([r, c]) => grid[r][c]).join('').toUpperCase();
    const backward = [...forward].reverse().join('').toUpperCase();

    const matchedWord = words.find(
      w => !foundWords.includes(w) && (w.toUpperCase() === forward || w.toUpperCase() === backward)
    );

    if (matchedWord) {
      const cellKeys = line.map(([r, c]) => `${r},${c}`);
      const color = HIGHLIGHT_COLORS[foundWords.length % HIGHLIGHT_COLORS.length];

      const nextFound = [...foundWords, matchedWord];
      const nextPositions = [...foundWordPositions, { word: matchedWord, cells: cellKeys, color }];

      setFoundWords(nextFound);
      setFoundWordPositions(nextPositions);

      // Check if all found
      if (nextFound.length === words.length && !isSolved) {
        setIsSolved(true);
        if (timerRef.current) clearInterval(timerRef.current);
        const totalTime = elapsedSeconds + penaltySeconds;
        setTimeout(() => {
          onSolved?.(totalTime);
        }, 600);
      }
    }

    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
  };

  // Mouse / Touch handlers
  const handleCellMouseDown = (r: number, c: number) => {
    if (isSolved) return;
    setSelectionStart([r, c]);
    setSelectionEnd([r, c]);
    setIsSelecting(true);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (!isSelecting || isSolved) return;
    setSelectionEnd([r, c]);
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      checkSelection(selectionStart, selectionEnd);
    }
  };

  // Also support click to start, click to end
  const handleCellClick = (r: number, c: number) => {
    if (isSolved) return;
    if (!selectionStart) {
      setSelectionStart([r, c]);
      setSelectionEnd([r, c]);
    } else {
      checkSelection(selectionStart, [r, c]);
    }
  };

  // Hint: finds an unfound word in grid and reveals its first letter
  const handleUseHint = () => {
    if (isSolved) return;
    const unfound = words.find(w => !foundWords.includes(w));
    if (!unfound) return;

    // Search for unfound word in grid
    const target = unfound.toUpperCase();
    let hintPos: [number, number] | null = null;

    // Search all 8 directions
    const dirs = [
      [0, 1], [1, 0], [1, 1], [-1, 1],
      [0, -1], [-1, 0], [-1, -1], [1, -1]
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        for (const [dr, dc] of dirs) {
          let match = true;
          for (let i = 0; i < target.length; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc].toUpperCase() !== target[i]) {
              match = false;
              break;
            }
          }
          if (match) {
            hintPos = [r, c];
            break;
          }
        }
        if (hintPos) break;
      }
      if (hintPos) break;
    }

    if (hintPos) {
      setPenaltySeconds(prev => prev + HINT_PENALTY);
      showPenaltyPopup(HINT_PENALTY);
      setHintCell(`${hintPos[0]},${hintPos[1]}`);
      setTimeout(() => setHintCell(null), 3000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Czy na pewno chcesz zresetować znalezione słowa?')) {
      setFoundWords([]);
      setFoundWordPositions([]);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  return (
    <div className={styles.wordsearchWrapper} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
      {/* Top Header */}
      <div className={styles.wsHeader}>
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
          <span>Znalezione słowa: {foundWords.length} / {words.length}</span>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.hintBtn}
            onClick={handleUseHint}
            disabled={isSolved || foundWords.length === words.length}
            title="Podświetl pierwszą literę ukrytego słowa (+15s kary)"
          >
            <HelpCircle size={16} />
            <span>Podpowiedź (+15s)</span>
          </button>
          <button
            className={styles.resetBtn}
            onClick={handleReset}
            disabled={isSolved}
            title="Zresetuj grę"
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

      {/* Words Target List Card */}
      <div className={styles.wordsCard}>
        <div className={styles.wordsCardHeader}>
          <Search size={16} className={styles.wordsIcon} />
          <span>Kategoria: <strong>{theme}</strong></span>
        </div>
        <div className={styles.wordsList}>
          {words.map(w => {
            const isFound = foundWords.includes(w);
            const foundData = foundWordPositions.find(p => p.word === w);

            return (
              <div
                key={w}
                className={`${styles.wordTag} ${isFound ? styles.wordTagFound : ''}`}
                style={isFound && foundData ? { borderColor: foundData.color } : {}}
              >
                <span>{w}</span>
                {isFound && <CheckCircle size={13} className={styles.wordCheck} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid Card */}
      <div className={styles.boardCard}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            maxWidth: `min(100%, ${cols * 44}px)`,
          }}
        >
          {grid.map((row, r) =>
            row.map((char, c) => {
              const key = `${r},${c}`;
              const isSelected = currentSelectionCells.some(([sr, sc]) => sr === r && sc === c);
              const foundMatch = foundWordPositions.find(p => p.cells.includes(key));
              const isHint = hintCell === key;

              return (
                <div
                  key={key}
                  className={`
                    ${styles.cell}
                    ${isSelected ? styles.cellSelected : ''}
                    ${isHint ? styles.cellHint : ''}
                  `}
                  style={foundMatch ? { backgroundColor: foundMatch.color, borderColor: 'transparent' } : {}}
                  onMouseDown={() => handleCellMouseDown(r, c)}
                  onMouseEnter={() => handleCellMouseEnter(r, c)}
                  onClick={() => handleCellClick(r, c)}
                >
                  <span className={styles.cellChar}>{char}</span>
                </div>
              );
            })
          )}
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
            <h2 className={styles.modalTitle}>Wykreślanka Rozwiązana! 🎉</h2>
            <p className={styles.modalSubtitle}>
              Świetnie! Znalazłeś wszystkie ukryte słowa z kategorii „{theme}”.
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
