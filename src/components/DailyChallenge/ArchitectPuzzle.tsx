import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, RotateCcw, CheckCircle, Flame } from 'lucide-react';
import styles from './architect.module.css';
import type { ArchitectPuzzle } from './puzzles';

interface ArchitectPuzzleProps {
  puzzle: ArchitectPuzzle;
  onSolved?: (timeSeconds: number) => void;
}



/**
 * Check if two positions are diagonally or orthogonally adjacent.
 */
function areTouching(a: [number, number], b: [number, number]): boolean {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

/**
 * Check if a tank position is orthogonally adjacent to a house.
 */
function isAdjacentToHouse(tank: [number, number], houses: [number, number][]): boolean {
  return houses.some(h => {
    const dr = Math.abs(tank[0] - h[0]);
    const dc = Math.abs(tank[1] - h[1]);
    return (dr + dc) === 1; // orthogonal only
  });
}

/**
 * Find which house a tank is connected to (closest orthogonal house).
 */
function getConnectedHouse(tank: [number, number], houses: [number, number][]): [number, number] | null {
  for (const h of houses) {
    const dr = Math.abs(tank[0] - h[0]);
    const dc = Math.abs(tank[1] - h[1]);
    if ((dr + dc) === 1) return h;
  }
  return null;
}

/**
 * Get connection direction from tank to house.
 */
function getConnectionDirection(tank: [number, number], house: [number, number]): 'up' | 'down' | 'left' | 'right' | null {
  if (house[0] === tank[0] - 1 && house[1] === tank[1]) return 'up';
  if (house[0] === tank[0] + 1 && house[1] === tank[1]) return 'down';
  if (house[0] === tank[0] && house[1] === tank[1] - 1) return 'left';
  if (house[0] === tank[0] && house[1] === tank[1] + 1) return 'right';
  return null;
}

export const ArchitectPuzzleComponent: React.FC<ArchitectPuzzleProps> = ({ puzzle, onSolved }) => {
  const { size, houses, rowClues, colClues } = puzzle;

  // Grid state: tracks placed tanks
  const [tanks, setTanks] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [isSolved, setIsSolved] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // House lookup set
  const houseSet = new Set(houses.map(([r, c]) => `${r},${c}`));

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

  // Count tanks per row/col
  const getTankCountForRow = useCallback((row: number): number => {
    let count = 0;
    tanks.forEach(key => {
      const [r] = key.split(',').map(Number);
      if (r === row) count++;
    });
    return count;
  }, [tanks]);

  const getTankCountForCol = useCallback((col: number): number => {
    let count = 0;
    tanks.forEach(key => {
      const [, c] = key.split(',').map(Number);
      if (c === col) count++;
    });
    return count;
  }, [tanks]);

  // Click handler
  const handleCellClick = (row: number, col: number) => {
    if (isSolved) return;
    const key = `${row},${col}`;

    // Can't click on houses
    if (houseSet.has(key)) return;

    setErrorMsg('');
    setErrorCells(new Set());

    const newTanks = new Set(tanks);
    if (newTanks.has(key)) {
      // Remove tank
      newTanks.delete(key);
    } else {
      // Place tank
      newTanks.add(key);
    }

    setTanks(newTanks);
  };

  // Find error cells (tanks touching each other)
  const findTouchingTanks = useCallback((): Set<string> => {
    const tankList = Array.from(tanks).map(k => k.split(',').map(Number) as [number, number]);
    const errors = new Set<string>();

    for (let i = 0; i < tankList.length; i++) {
      for (let j = i + 1; j < tankList.length; j++) {
        if (areTouching(tankList[i], tankList[j])) {
          errors.add(`${tankList[i][0]},${tankList[i][1]}`);
          errors.add(`${tankList[j][0]},${tankList[j][1]}`);
        }
      }
    }

    return errors;
  }, [tanks]);

  // Validate solution
  const handleCheck = () => {
    const tankList = Array.from(tanks).map(k => k.split(',').map(Number) as [number, number]);

    // 1. Check tank count matches total houses
    if (tankList.length !== houses.length) {
      setErrorMsg(`Umieść dokładnie ${houses.length} zbiorników (obecnie: ${tankList.length})`);
      return;
    }

    // 2. Check no tanks touch each other
    const touching = findTouchingTanks();
    if (touching.size > 0) {
      setErrorCells(touching);
      setErrorMsg('Zbiorniki nie mogą się stykać — ani bokiem, ani rogiem!');
      return;
    }

    // 3. Check each tank is adjacent to a house
    for (const tank of tankList) {
      if (!isAdjacentToHouse(tank, houses)) {
        setErrorCells(new Set([`${tank[0]},${tank[1]}`]));
        setErrorMsg('Każdy zbiornik musi stać obok domku (góra/dół/lewo/prawo)');
        return;
      }
    }

    // 4. Check each house has exactly one adjacent tank
    for (const house of houses) {
      const adjTanks = tankList.filter(t => {
        const dr = Math.abs(t[0] - house[0]);
        const dc = Math.abs(t[1] - house[1]);
        return (dr + dc) === 1;
      });
      if (adjTanks.length === 0) {
        setErrorMsg('Każdy domek musi mieć swój zbiornik!');
        return;
      }
      if (adjTanks.length > 1) {
        setErrorMsg('Każdy domek powinien mieć dokładnie jeden zbiornik');
        return;
      }
    }

    // 5. Check row clues
    for (let r = 0; r < size; r++) {
      const count = getTankCountForRow(r);
      if (count !== rowClues[r]) {
        setErrorMsg(`Wiersz ${r + 1}: oczekiwano ${rowClues[r]} zbiorników, masz ${count}`);
        return;
      }
    }

    // 6. Check column clues
    for (let c = 0; c < size; c++) {
      const count = getTankCountForCol(c);
      if (count !== colClues[c]) {
        setErrorMsg(`Kolumna ${c + 1}: oczekiwano ${colClues[c]} zbiorników, masz ${count}`);
        return;
      }
    }

    // SUCCESS!
    setIsSolved(true);
    setErrorMsg('');
    setErrorCells(new Set());
    if (timerRef.current) clearInterval(timerRef.current);
    if (onSolved) onSolved(elapsedSeconds);
  };

  const handleReset = () => {
    setTanks(new Set());
    setErrorMsg('');
    setErrorCells(new Set());
    setIsSolved(false);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
  };

  // Render
  return (
    <div className={styles.architectContainer}>
      {/* Rules */}
      <div className={styles.rulesBox}>
        <h4>💣🏫 Zasady — Bombowa Szkoła</h4>
        <ul>
          <li>Wskaż miejsce bomby (💣) przy każdej szkole</li>
          <li>Bomby nie mogą się stykać — ani bokiem, ani rogiem</li>
          <li>Liczby na krawędziach = ile bomb w danym wierszu/kolumnie</li>
        </ul>
      </div>

      {/* Timer & Reset */}
      <div className={styles.timerBar}>
        <div className={styles.timer}>
          <Clock size={18} />
          {formatTime(elapsedSeconds)}
        </div>
        <button className={styles.resetBtn} onClick={handleReset}>
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* Grid */}
      <div className={styles.gridWrapper} style={{ position: 'relative' }}>
        {/* Column clues */}
        <div className={styles.colCluesRow}>
          {colClues.map((clue, c) => {
            const count = getTankCountForCol(c);
            const isSatisfied = count === clue;
            const isOver = count > clue;
            return (
              <div
                key={`col-${c}`}
                className={`${styles.colClue} ${isSatisfied ? styles.colClueSatisfied : ''} ${isOver ? styles.colClueOver : ''}`}
              >
                {clue}
              </div>
            );
          })}
        </div>

        {/* Grid rows */}
        {Array.from({ length: size }, (_, row) => {
          const rowCount = getTankCountForRow(row);
          const rowSatisfied = rowCount === rowClues[row];
          const rowOver = rowCount > rowClues[row];

          return (
            <div key={`row-${row}`} className={styles.gridRow}>
              {/* Row clue */}
              <div
                className={`${styles.rowClue} ${rowSatisfied ? styles.rowClueSatisfied : ''} ${rowOver ? styles.rowClueOver : ''}`}
              >
                {rowClues[row]}
              </div>

              {/* Cells */}
              {Array.from({ length: size }, (_, col) => {
                const key = `${row},${col}`;
                const isHouse = houseSet.has(key);
                const isTank = tanks.has(key);
                const isError = errorCells.has(key);

                // Determine connection line from tank to house
                let connectionDir: string | null = null;
                if (isTank) {
                  const connectedHouse = getConnectedHouse([row, col], houses);
                  if (connectedHouse) {
                    connectionDir = getConnectionDirection([row, col], connectedHouse);
                  }
                }

                return (
                  <div
                    key={key}
                    className={`${styles.cell} ${isHouse ? styles.cellHouse : ''} ${isTank ? styles.cellTank : ''} ${isTank && isError ? styles.cellTankError : ''}`}
                    onClick={() => handleCellClick(row, col)}
                  >
                    {isHouse && (
                      <span className={styles.houseIcon}>🏫</span>
                    )}
                    {isTank && (
                      <>
                        <Flame size={22} className={styles.tankIcon} />
                        {connectionDir && (
                          <div
                            className={`${styles.connectionLine} ${connectionDir === 'left' || connectionDir === 'right'
                              ? styles.connectionLineH
                              : styles.connectionLineV
                              }`}
                            style={{
                              ...(connectionDir === 'left' ? { right: '50%', left: 0 } : {}),
                              ...(connectionDir === 'right' ? { left: '50%', right: 0 } : {}),
                              ...(connectionDir === 'up' ? { bottom: '50%', top: 0 } : {}),
                              ...(connectionDir === 'down' ? { top: '50%', bottom: 0 } : {}),
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Success overlay */}
        {isSolved && (
          <div className={styles.successOverlay}>
            <CheckCircle size={48} color="var(--success)" />
            <div className={styles.successTitle}>🎉 Brawo!</div>
            <div className={styles.successTime}>
              Rozwiązano w {formatTime(elapsedSeconds)}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      <div className={styles.errorMsg}>
        {errorMsg}
      </div>

      {/* Actions */}
      {!isSolved && (
        <div className={styles.actionsRow}>
          <button
            className={styles.checkBtn}
            onClick={handleCheck}
            disabled={tanks.size === 0}
          >
            <CheckCircle size={18} />
            Sprawdź rozwiązanie
          </button>
        </div>
      )}
    </div>
  );
};
