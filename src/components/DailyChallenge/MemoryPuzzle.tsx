import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, HelpCircle, RotateCcw, Flag, Trophy, Sparkles, Layers } from 'lucide-react';
import styles from './memory.module.css';

export interface MemoryData {
  id: number;
  theme?: string;
  pairs: {
    id: string;
    icon: string;
    name: string;
  }[];
}

interface MemoryPuzzleProps {
  puzzle: MemoryData;
  onSolved?: (timeSeconds: number) => void;
  onGiveUp?: () => void;
}

const HINT_PENALTY = 15;

interface CardInstance {
  uniqueId: number;
  pairId: string;
  icon: string;
  name: string;
}

// Shuffle array
const shuffle = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const MemoryPuzzleComponent: React.FC<MemoryPuzzleProps> = ({
  puzzle,
  onSolved,
  onGiveUp,
}) => {
  const { pairs } = puzzle;

  // Generate 2 instances of each pair and shuffle
  const [cards, setCards] = useState<CardInstance[]>(() => {
    const deck: CardInstance[] = [];
    pairs.forEach((pair, idx) => {
      deck.push({ uniqueId: idx * 2, pairId: pair.id, icon: pair.icon, name: pair.name });
      deck.push({ uniqueId: idx * 2 + 1, pairId: pair.id, icon: pair.icon, name: pair.name });
    });
    return shuffle(deck);
  });

  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [isLocked, setIsLocked] = useState(false);
  const [movesCount, setMovesCount] = useState(0);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [recentPenalty, setRecentPenalty] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [hintedCards, setHintedCards] = useState<number[]>([]);

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

  const handleCardClick = (uniqueId: number) => {
    if (isLocked || isSolved) return;
    const card = cards.find(c => c.uniqueId === uniqueId);
    if (!card) return;

    // Already matched or currently flipped
    if (matchedPairs.has(card.pairId) || flippedCards.includes(uniqueId)) return;

    if (flippedCards.length === 0) {
      setFlippedCards([uniqueId]);
    } else if (flippedCards.length === 1) {
      const firstId = flippedCards[0];
      const firstCard = cards.find(c => c.uniqueId === firstId);
      if (!firstCard) return;

      setFlippedCards([firstId, uniqueId]);
      setMovesCount(prev => prev + 1);

      if (firstCard.pairId === card.pairId) {
        // MATCH!
        const nextMatched = new Set(matchedPairs);
        nextMatched.add(card.pairId);
        setMatchedPairs(nextMatched);
        setFlippedCards([]);

        // Check if all matched
        if (nextMatched.size === pairs.length && !isSolved) {
          setIsSolved(true);
          if (timerRef.current) clearInterval(timerRef.current);
          const totalTime = elapsedSeconds + penaltySeconds;
          setTimeout(() => {
            onSolved?.(totalTime);
          }, 600);
        }
      } else {
        // NO MATCH -> Flip back after delay
        setIsLocked(true);
        setTimeout(() => {
          setFlippedCards([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  // Hint: reveals one unmatched pair for 1.2s
  const handleUseHint = () => {
    if (isLocked || isSolved) return;
    const unmatchedPairsList = pairs.filter(p => !matchedPairs.has(p.id));
    if (unmatchedPairsList.length === 0) return;

    const targetPair = unmatchedPairsList[0];
    const pairCards = cards.filter(c => c.pairId === targetPair.id).map(c => c.uniqueId);

    setPenaltySeconds(prev => prev + HINT_PENALTY);
    showPenaltyPopup(HINT_PENALTY);

    setHintedCards(pairCards);
    setTimeout(() => {
      setHintedCards([]);
    }, 1400);
  };

  const handleReset = () => {
    if (window.confirm('Czy na pewno chcesz przetasować i zresetować grę Memory?')) {
      const deck: CardInstance[] = [];
      pairs.forEach((pair, idx) => {
        deck.push({ uniqueId: idx * 2, pairId: pair.id, icon: pair.icon, name: pair.name });
        deck.push({ uniqueId: idx * 2 + 1, pairId: pair.id, icon: pair.icon, name: pair.name });
      });
      setCards(shuffle(deck));
      setFlippedCards([]);
      setMatchedPairs(new Set());
      setMovesCount(0);
    }
  };

  return (
    <div className={styles.memoryWrapper}>
      {/* Top Header */}
      <div className={styles.memHeader}>
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
          <span>Dopasowane: {matchedPairs.size} / {pairs.length} (Ruchy: {movesCount})</span>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.hintBtn}
            onClick={handleUseHint}
            disabled={isSolved || matchedPairs.size === pairs.length}
            title="Odkryj jedną losową parę (+15s kary)"
          >
            <HelpCircle size={16} />
            <span>Podpowiedź (+15s)</span>
          </button>
          <button
            className={styles.resetBtn}
            onClick={handleReset}
            disabled={isSolved}
            title="Przetasuj i zacznij od nowa"
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

      {/* Main Cards Grid */}
      <div className={styles.boardCard}>
        <div className={styles.cardsGrid}>
          {cards.map(card => {
            const isFlipped = flippedCards.includes(card.uniqueId) || hintedCards.includes(card.uniqueId);
            const isMatched = matchedPairs.has(card.pairId);

            return (
              <div
                key={card.uniqueId}
                className={`
                  ${styles.cardContainer}
                  ${isFlipped || isMatched ? styles.cardFlipped : ''}
                  ${isMatched ? styles.cardMatched : ''}
                `}
                onClick={() => handleCardClick(card.uniqueId)}
              >
                <div className={styles.cardInner}>
                  {/* Card Back (Hidden state) */}
                  <div className={styles.cardBack}>
                    <Layers size={24} className={styles.cardBackIcon} />
                  </div>

                  {/* Card Front (Revealed state) */}
                  <div className={styles.cardFront}>
                    <span className={styles.cardEmoji}>{card.icon}</span>
                    <span className={styles.cardName}>{card.name}</span>
                    {isMatched && (
                      <div className={styles.matchedBadge}>
                        <CheckCircle size={12} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
            <h2 className={styles.modalTitle}>Wszystkie Pary Odnalezione! 🎉</h2>
            <p className={styles.modalSubtitle}>
              Wspaniała pamięć! Ukończyłeś wyzwanie w {movesCount} ruchach.
            </p>
            <div className={styles.modalStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Liczba ruchów</span>
                <span className={styles.statValue}>{movesCount}</span>
              </div>
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
