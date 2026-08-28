import React, { useState } from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Clapperboard,
  ShieldAlert,
  Ban,
  FileText,
  Key,
} from 'lucide-react';
import styles from './QuestModal.module.css';
import type { QuestState, QuestStage } from '../../types/quest';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  questState: QuestState;
}

const stageIconMap: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle size={18} />,
  Clapperboard: <Clapperboard size={18} />,
  ShieldAlert: <ShieldAlert size={18} />,
  Ban: <Ban size={18} />,
  FileText: <FileText size={18} />,
  Key: <Key size={18} />,
  Sparkles: <Sparkles size={18} />,
};

export const QuestModal: React.FC<QuestModalProps> = ({ isOpen, onClose, questState }) => {
  const activeStage = questState.stages.find(s => s.isActive);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(() => {
    return activeStage ? activeStage.id : questState.stages[0]?.id || null;
  });

  if (!isOpen) return null;

  const toggleStage = (stageId: string) => {
    setExpandedStageId(prev => (prev === stageId ? null : stageId));
  };

  // Only show active and completed stages, with active stage at the top and older at the bottom
  const visibleStages = questState.stages
    .filter(stage => !stage.isLocked)
    .sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.stageNumber - a.stageNumber;
    });

  const progressLabel = activeStage
    ? `Postęp bieżącego etapu (${activeStage.title})`
    : 'Śledztwo zrealizowane';
  const progressText = activeStage
    ? `${questState.activeStageCompletedSubtasks} / ${questState.activeStageTotalSubtasks} celów (${questState.activeStagePercent}%)`
    : 'Wszystkie poszlaki odkryte (100%)';
  const progressFill = activeStage ? questState.activeStagePercent : 100;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTop}>
            <div className={styles.headerTitleWrap}>
              <div className={styles.headerIconBadge}>
                <Compass size={22} />
              </div>
              <div>
                <h2 className={styles.headerTitle}>Dziennik Śledztwa</h2>
                <p className={styles.headerSubtitle}>
                  Śledź poszlaki, rozwiązuj zadania i odkryj tajemnicę Natalie Chalamet
                </p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Zamknij">
              <X size={18} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressSection}>
            <div className={styles.progressLabelRow}>
              <span>{progressLabel}</span>
              <span className={styles.progressPercent}>{progressText}</span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progressFill}%` }}
              />
            </div>
          </div>
        </div>

        {/* Body - Stages List */}
        <div className={styles.modalBody}>
          {visibleStages.map((stage: QuestStage) => {
            const isExpanded = expandedStageId === stage.id || stage.isActive;
            const cardClass = stage.isCompleted
              ? styles.stageCardCompleted
              : styles.stageCardActive;

            return (
              <div key={stage.id} className={`${styles.stageCard} ${cardClass}`}>
                <div
                  className={styles.stageHeader}
                  onClick={() => toggleStage(stage.id)}
                >
                  <div className={styles.stageHeaderLeft}>
                    <div className={styles.stageNumberBadge}>
                      {stage.isCompleted ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        stageIconMap[stage.icon] || stage.stageNumber
                      )}
                    </div>
                    <div className={styles.stageInfo}>
                      <div className={styles.stageTitleRow}>
                        <span className={styles.stageTitle}>
                          Rozdział {stage.stageNumber}: {stage.title}
                        </span>
                      </div>
                      <div className={styles.stageSubtitle}>{stage.subtitle}</div>
                    </div>
                  </div>

                  <div className={styles.stageHeaderRight}>
                    {stage.isCompleted ? (
                      <span className={`${styles.statusPill} ${styles.statusPillCompleted}`}>
                        Ukończono
                      </span>
                    ) : (
                      <span className={`${styles.statusPill} ${styles.statusPillActive}`}>
                        Aktualne zadanie
                      </span>
                    )}

                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (() => {
                  const firstIncompleteIdx = stage.subtasks.findIndex(s => !s.isCompleted);
                  const visibleSubtasks = firstIncompleteIdx === -1
                    ? stage.subtasks
                    : stage.subtasks.slice(0, firstIncompleteIdx + 1);

                  return (
                    <div className={styles.stageDetails}>
                      <p className={styles.stageDesc}>{stage.description}</p>

                      <div className={styles.subtaskList}>
                        {visibleSubtasks.map(subtask => (
                          <div
                            key={subtask.id}
                            className={`${styles.subtaskItem} ${subtask.isCompleted ? styles.subtaskItemCompleted : ''}`}
                          >
                            {subtask.isCompleted ? (
                              <CheckCircle2 size={18} className={styles.subtaskCheckbox} />
                            ) : (
                              <div className={styles.subtaskCheckboxIncomplete} />
                            )}
                            <div className={styles.subtaskContent}>
                              <div className={styles.subtaskTitle}>{subtask.title}</div>
                              <div className={styles.subtaskDescription}>
                                {subtask.description}
                              </div>
                              {!subtask.isCompleted && subtask.hint && (
                                <div className={styles.subtaskHint}>
                                  <Lightbulb size={12} />
                                  <span>Wskazówka: {subtask.hint}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerHint}>
            💡 Wykonuj cele w serwisie, aby odkrywać kolejne poszlaki.
          </div>
          <button className={styles.closeActionBtn} onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
