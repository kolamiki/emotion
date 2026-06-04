import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, CheckCircle, XCircle, Scissors, ArrowRight, Trophy, Zap } from 'lucide-react';
import styles from './quiz.module.css';
import type { QuizQuestion, QuizPuzzle } from './puzzles';

interface QuizPuzzleProps {
  puzzle: { items: QuizPuzzle[] };
  onSolved?: (timeSeconds: number) => void;
  onGiveUp?: () => void;
}

const TOTAL_QUESTIONS = 10;
const FIFTY_PENALTY = 15;
const WRONG_PENALTY = 30;

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

/**
 * Category icon mapping for visual variety
 */
const categoryEmoji: Record<string, string> = {
  'Nauka': '🔬',
  'Historia': '📜',
  'Geografia': '🌍',
  'Kultura': '🎭',
  'Technologia': '💻',
};

export const QuizPuzzleComponent: React.FC<QuizPuzzleProps> = ({ puzzle, onSolved, onGiveUp }) => {
  // Gather all questions from all items and select TOTAL_QUESTIONS random ones
  const selectedQuestions = useMemo(() => {
    const allQuestions: QuizQuestion[] = [];
    for (const item of puzzle.items) {
      allQuestions.push(...item.questions);
    }

    // Shuffle
    const pool = [...allQuestions];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Try to pick from diverse categories
    const selected: QuizQuestion[] = [];
    const categoriesUsed = new Set<string>();
    
    // First pass: one from each category
    for (const q of pool) {
      if (selected.length >= TOTAL_QUESTIONS) break;
      if (!categoriesUsed.has(q.category)) {
        selected.push(q);
        categoriesUsed.add(q.category);
      }
    }

    // Fill remaining
    for (const q of pool) {
      if (selected.length >= TOTAL_QUESTIONS) break;
      if (!selected.includes(q)) {
        selected.push(q);
      }
    }

    // Shuffle final selection
    return selected.sort(() => Math.random() - 0.5);
  }, [puzzle.items]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [recentPenalty, setRecentPenalty] = useState<number | null>(null);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<Set<number>>(new Set());

  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0); // accumulated seconds before current pause
  const penaltyPopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = selectedQuestions[currentIndex];

  // Start / resume timer
  const startTimer = () => {
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const currentSegment = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(accumulatedRef.current + currentSegment);
    }, 1000);
  };

  // Pause timer, save accumulated time
  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const currentSegment = Math.floor((Date.now() - startTimeRef.current) / 1000);
    accumulatedRef.current += currentSegment;
    setElapsedSeconds(accumulatedRef.current);
  };

  // Initial timer start
  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered || hiddenOptions.has(optionIndex)) return;

    setSelectedOption(optionIndex);
    setIsAnswered(true);
    pauseTimer(); // stop timer so player can read the explanation

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
      setPenaltySeconds(prev => prev + WRONG_PENALTY);
      showPenaltyPopup(WRONG_PENALTY);
    }
    setResults(prev => [...prev, isCorrect]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= TOTAL_QUESTIONS || currentIndex + 1 >= selectedQuestions.length) {
      handleFinish();
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setFiftyUsed(false);
      setHiddenOptions(new Set());
      startTimer(); // resume timer for next question
    }
  };

  const handleFinish = () => {
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (onSolved) {
      onSolved(elapsedSeconds + penaltySeconds);
    }
  };

  const handleFiftyFifty = () => {
    if (fiftyUsed || isAnswered) return;
    
    setFiftyUsed(true);
    setPenaltySeconds(prev => prev + FIFTY_PENALTY);
    showPenaltyPopup(FIFTY_PENALTY);

    // Hide 2 wrong answers
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== currentQuestion.correctIndex);
    // Shuffle wrong indices and pick 2
    for (let i = wrongIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
    }
    setHiddenOptions(new Set(wrongIndices.slice(0, 2)));
  };

  if (!currentQuestion) return null;

  const totalTime = elapsedSeconds + penaltySeconds;
  const totalAnswered = correctCount + wrongCount;

  // === Finished Screen ===
  if (isFinished) {
    const percentage = Math.round((correctCount / Math.max(totalAnswered, 1)) * 100);
    return (
      <div className={styles.successOverlay}>
        <div className={styles.successTitle}>
          <Trophy size={48} />
          Quiz ukończony!
        </div>
        <div className={styles.successStats}>
          <div className={styles.successStat}>
            <span className={styles.successStatValue}>{correctCount}/{totalAnswered}</span>
            <span className={styles.successStatLabel}>Poprawne</span>
          </div>
          <div className={styles.successStat}>
            <span className={styles.successStatValue}>{percentage}%</span>
            <span className={styles.successStatLabel}>Trafność</span>
          </div>
          <div className={styles.successStat}>
            <span className={styles.successStatValue}>{formatTime(totalTime)}</span>
            <span className={styles.successStatLabel}>Czas</span>
          </div>
        </div>
        <div className={styles.successTime}>
          Czas bazowy: {formatTime(elapsedSeconds)} + kary: {formatTime(penaltySeconds)}
        </div>
      </div>
    );
  }

  const isCorrectAnswer = selectedOption === currentQuestion.correctIndex;

  return (
    <div className={styles.quizContainer}>
      {/* Header: Progress & Timer */}
      <div className={styles.headerBar}>
        <div className={styles.progressSection}>
          <div className={styles.progressDots}>
            {Array.from({ length: Math.min(TOTAL_QUESTIONS, selectedQuestions.length) }).map((_, i) => (
              <div
                key={i}
                className={`${styles.progressDot} ${
                  i === currentIndex ? styles.progressDotActive :
                  i < results.length ? (results[i] ? styles.progressDotCorrect : styles.progressDotWrong) : ''
                }`}
              />
            ))}
          </div>
          <span className={styles.progressLabel}>
            Pytanie {currentIndex + 1} z {Math.min(TOTAL_QUESTIONS, selectedQuestions.length)}
          </span>
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

      {/* Score Badges */}
      <div className={styles.scoreRow}>
        <div className={`${styles.scoreBadge} ${styles.scoreBadgeCorrect}`}>
          <CheckCircle size={16} /> {correctCount} poprawne
        </div>
        <div className={`${styles.scoreBadge} ${styles.scoreBadgeWrong}`}>
          <XCircle size={16} /> {wrongCount} błędne
        </div>
      </div>

      {/* Category */}
      <div className={styles.categoryBadge}>
        {categoryEmoji[currentQuestion.category] || '📝'} {currentQuestion.category}
      </div>

      {/* Question Card */}
      <div className={styles.questionCard} key={`q-${currentQuestion.id}`}>
        <div className={styles.questionNumber}>
          Pytanie {currentIndex + 1}
        </div>
        <p className={styles.questionText}>
          {currentQuestion.question}
        </p>
      </div>

      {/* Options */}
      <div className={styles.optionsGrid}>
        {currentQuestion.options.map((option, idx) => {
          let optionClass = styles.optionBtn;
          
          if (isAnswered) {
            if (idx === currentQuestion.correctIndex) {
              optionClass += ` ${styles.optionCorrect}`;
            } else if (idx === selectedOption) {
              optionClass += ` ${styles.optionWrong}`;
            } else {
              optionClass += ` ${styles.optionDisabled}`;
            }
          }

          if (hiddenOptions.has(idx)) {
            optionClass += ` ${styles.optionHidden}`;
          }

          return (
            <button
              key={idx}
              className={optionClass}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswered}
            >
              <span className={styles.optionLabel}>{OPTION_LABELS[idx]}</span>
              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation (after answering) */}
      {isAnswered && (
        <div className={`${styles.explanationBox} ${isCorrectAnswer ? styles.explanationCorrect : styles.explanationWrong}`}>
          <div className={styles.explanationIcon}>
            {isCorrectAnswer ? <CheckCircle size={20} /> : <XCircle size={20} />}
          </div>
          <div>
            <strong>{isCorrectAnswer ? 'Brawo!' : 'Niestety!'}</strong>{' '}
            {currentQuestion.explanation}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actionsRow}>
        {!isAnswered && (
          <button
            className={`${styles.btn} ${styles.fiftyBtn} ${fiftyUsed ? styles.fiftyBtnUsed : ''}`}
            onClick={handleFiftyFifty}
            disabled={fiftyUsed}
          >
            <Scissors size={18} />
            {fiftyUsed ? '50/50 użyte' : `50/50 (+${FIFTY_PENALTY}s)`}
          </button>
        )}

        {isAnswered && (
          <button className={`${styles.btn} ${styles.nextBtn}`} onClick={handleNext}>
            {currentIndex + 1 >= Math.min(TOTAL_QUESTIONS, selectedQuestions.length) ? (
              <>
                <Zap size={18} />
                Zakończ quiz
              </>
            ) : (
              <>
                <ArrowRight size={18} />
                Następne pytanie
              </>
            )}
          </button>
        )}
      </div>

      {/* Give Up */}
      <div className={styles.secondaryActions}>
        <button className={styles.giveUpBtn} onClick={onGiveUp}>
          Poddaję się
        </button>
      </div>
    </div>
  );
};
