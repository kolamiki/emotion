import React from 'react';
import { CheckCircle2, Trophy, X, Sparkles } from 'lucide-react';
import styles from './ToastContainer.module.css';

export interface QuestToastItem {
  id: string;
  type: 'subtask_completed' | 'stage_completed' | 'quest_activated';
  title: string;
  description?: string;
  category?: string;
}

interface ToastContainerProps {
  toasts: QuestToastItem[];
  onDismiss: (id: string) => void;
  onClickToast?: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss, onClickToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer} aria-live="polite">
      {toasts.map(toast => {
        const isStage = toast.type === 'stage_completed' || toast.type === 'quest_activated';
        return (
          <div
            key={toast.id}
            className={`${styles.toast} ${isStage ? styles.toastStage : styles.toastSubtask}`}
            onClick={() => {
              onClickToast?.();
              onDismiss(toast.id);
            }}
          >
            <div className={styles.toastIconWrap}>
              {toast.type === 'stage_completed' ? (
                <Trophy size={20} />
              ) : toast.type === 'quest_activated' ? (
                <Sparkles size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
            </div>
            <div className={styles.toastBody}>
              <div className={styles.toastCategory}>
                {toast.category || (isStage ? 'Ukończono Rozdział' : 'Zrealizowano Cel')}
              </div>
              <div className={styles.toastTitle}>{toast.title}</div>
              {toast.description && <div className={styles.toastDesc}>{toast.description}</div>}
            </div>
            <button
              className={styles.toastClose}
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(toast.id);
              }}
              aria-label="Zamknij powiadomienie"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
