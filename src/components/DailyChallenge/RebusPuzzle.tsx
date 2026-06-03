import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lightbulb, CheckCircle, Clock, SkipForward } from 'lucide-react';
import styles from './rebus.module.css';
import type { RebusPuzzle } from './puzzles';

interface RebusPuzzleProps {
  // puzzle prop now acts as the pool of all available rebus puzzles for today
  puzzle: { items: RebusPuzzle[] }; 
  onSolved?: (timeSeconds: number) => void;
  onGiveUp?: () => void;
}

/**
 * Normalizes strings for loose comparison.
 * Lowercase, trims whitespace, and removes punctuation.
 */
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const TOTAL_ROUNDS = 5;
const HINT_PENALTY = 20;
const SKIP_PENALTY = 90;

export const RebusPuzzleComponent: React.FC<RebusPuzzleProps> = ({ puzzle, onSolved, onGiveUp }) => {
  // Select 5 random unique puzzles from the pool (ideally from different categories if possible)
  const selectedPuzzles = useMemo(() => {
    const pool = [...puzzle.items];
    const selected: RebusPuzzle[] = [];
    
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Try to pick diverse categories first
    const categoriesUsed = new Set<string>();
    for (const item of pool) {
      if (selected.length >= TOTAL_ROUNDS) break;
      if (!categoriesUsed.has(item.category)) {
        selected.push(item);
        categoriesUsed.add(item.category);
      }
    }
    
    // Fill the rest if we still need more
    for (const item of pool) {
      if (selected.length >= TOTAL_ROUNDS) break;
      if (!selected.includes(item)) {
        selected.push(item);
      }
    }

    // Shuffle again
    return selected.sort(() => Math.random() - 0.5);
  }, [puzzle.items]);

  const [currentRound, setCurrentRound] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isError, setIsError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [recentPenalty, setRecentPenalty] = useState<number | null>(null);
  
  const [isFinished, setIsFinished] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const penaltyPopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPuzzle = selectedPuzzles[currentRound];

  // Main Timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (!isFinished) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const showPenaltyPopup = (seconds: number) => {
    setRecentPenalty(seconds);
    if (penaltyPopupTimeoutRef.current) clearTimeout(penaltyPopupTimeoutRef.current);
    penaltyPopupTimeoutRef.current = setTimeout(() => {
      setRecentPenalty(null);
    }, 1500);
  };

  const addPenalty = (seconds: number) => {
    setPenaltySeconds(prev => prev + seconds);
    showPenaltyPopup(seconds);
  };

  const handleNextRound = () => {
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      handleFinish();
    } else {
      setCurrentRound(prev => prev + 1);
      setInputValue('');
      setShowHint(false);
      setIsError(false);
    }
  };

  const handleFinish = () => {
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (onSolved) {
      // Calculate final time = base time + penalties
      onSolved(elapsedSeconds + penaltySeconds);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isFinished) return;

    if (normalizeText(inputValue) === normalizeText(currentPuzzle.answer)) {
      handleNextRound();
    } else {
      // Error
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
    }
  };

  const handleSkip = () => {
    addPenalty(SKIP_PENALTY);
    handleNextRound();
  };

  const handleHintToggle = () => {
    if (!showHint) {
      addPenalty(HINT_PENALTY);
    }
    setShowHint(!showHint);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!currentPuzzle) return null;

  const totalTime = elapsedSeconds + penaltySeconds;

  if (isFinished) {
    return (
      <div className={styles.successOverlay}>
        <div className={styles.successTitle}>
          <CheckCircle size={48} />
          Ukończono wyzwanie!
        </div>
        <div className={styles.successTime}>
          Twój całkowity czas (wraz z karami): <strong>{formatTime(totalTime)}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.rebusContainer}>
      
      {/* Header: Progress & Timer */}
      <div className={styles.headerBar}>
        <div className={styles.progressIndicator}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div 
              key={i} 
              className={`${styles.progressDot} ${i === currentRound ? styles.progressDotActive : ''} ${i < currentRound ? styles.progressDotCompleted : ''}`} 
            />
          ))}
        </div>
        
        <div className={styles.timer}>
          <Clock size={18} />
          {formatTime(totalTime)}
          
          {recentPenalty !== null && (
            <span key={Date.now()} className={styles.penaltyPopup}>
              +{recentPenalty}s
            </span>
          )}
        </div>
      </div>

      {/* Category Badge */}
      <div className={styles.categoryBadge}>
        Kategoria: {currentPuzzle.category}
      </div>

      {/* Emojis Display */}
      <div className={styles.emojisContainer} key={`rebus-${currentPuzzle.id}`}>
        {currentPuzzle.emojis.map((emoji, index) => (
          <span key={`${currentPuzzle.id}-${index}`} className={styles.emoji}>
            {emoji}
          </span>
        ))}
      </div>

      <div className={styles.inputSection}>
        {/* Answer Input */}
        <input
          type="text"
          className={`${styles.answerInput} ${isError ? styles.answerInputError : ''}`}
          placeholder="Wpisz odpowiedź..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        {/* Hint Area */}
        {showHint && (
          <div className={styles.hintBox}>
            <Lightbulb size={20} className={styles.hintIcon} />
            <div>{currentPuzzle.hint}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actionsRow}>
          <button
            className={`${styles.btn} ${styles.hintBtn} ${showHint ? styles.hintBtnActive : ''}`}
            onClick={handleHintToggle}
            disabled={showHint}
          >
            <Lightbulb size={18} />
            {showHint ? 'Podpowiedź odkryta' : `Podpowiedź (+${HINT_PENALTY}s)`}
          </button>
          
          <button
            className={`${styles.btn} ${styles.checkBtn}`}
            onClick={() => handleSubmit()}
            disabled={inputValue.trim().length === 0}
          >
            <CheckCircle size={18} />
            Sprawdź
          </button>

          <button
            className={`${styles.btn} ${styles.skipBtn}`}
            onClick={handleSkip}
          >
            <SkipForward size={18} />
            Pomiń (+${SKIP_PENALTY}s)
          </button>
        </div>

        {/* Give Up */}
        <div className={styles.secondaryActions}>
          <button className={styles.giveUpBtn} onClick={onGiveUp}>
            Poddaję się, chcę sprawdzić odpowiedzi
          </button>
        </div>
      </div>
    </div>
  );
};
