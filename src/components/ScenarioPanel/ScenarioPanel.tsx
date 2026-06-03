import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Zap,
  Clock,
  MessageSquare,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import styles from './ScenarioPanel.module.css';
import type { ScenarioManager } from '../../store/scenarioEngine';
import type { Scenario } from '../../types';

interface ScenarioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioManager: ScenarioManager | null;
}

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap size={18} />,
  Clock: <Clock size={18} />,
  MessageSquare: <MessageSquare size={18} />,
  MessagesSquare: <MessageSquare size={18} />,
  Palette: <Zap size={18} />,
};

const triggerLabels: Record<string, string> = {
  group_enter: '🚪 Wejście do grupy',
  group_post: '📝 Post w grupie',
  timer: '⏱️ Cykliczny timer',
  manual: '👆 Ręczne uruchomienie',
};

const actionLabels: Record<string, string> = {
  create_post: '📄 Utwórz post',
  send_message: '💬 Wyślij wiadomość',
  add_comment: '💭 Dodaj komentarz',
  add_notification: '🔔 Powiadomienie',
};

export const ScenarioPanel: React.FC<ScenarioPanelProps> = ({
  isOpen,
  onClose,
  scenarioManager,
}) => {
  const [scenarios, setScenarios] = useState<(Scenario & { running: boolean; executedSteps: number })[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refreshScenarios = useCallback(() => {
    if (scenarioManager) {
      setScenarios(scenarioManager.getScenarios());
    }
  }, [scenarioManager]);

  useEffect(() => {
    refreshScenarios();
    if (scenarioManager) {
      const unsub = scenarioManager.subscribe(refreshScenarios);
      return () => { unsub(); };
    }
  }, [scenarioManager, refreshScenarios]);

  const handleToggle = (id: string) => {
    scenarioManager?.toggleScenario(id);
    refreshScenarios();
  };

  const handleRun = (id: string) => {
    scenarioManager?.runScenario(id);
    refreshScenarios();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Zap size={20} className={styles.headerIcon} />
            <span>Scenariusze</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.headerSubtitle}>
          Automatyczne akcje fikcyjnych użytkowników
        </div>

        {/* Scenario Cards */}
        <div className={styles.body}>
          {scenarios.map(scenario => {
            const isExpanded = expandedId === scenario.id;
            const triggerType = scenario.trigger.type;

            return (
              <div key={scenario.id} className={styles.card}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    {iconMap[scenario.icon] || <Zap size={18} />}
                  </div>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardName}>{scenario.name}</div>
                    <div className={styles.cardTrigger}>
                      {triggerLabels[triggerType] || triggerType}
                    </div>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={scenario.enabled}
                      onChange={() => handleToggle(scenario.id)}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Card Description */}
                <div className={styles.cardDesc}>{scenario.description}</div>

                {/* Status */}
                {scenario.running && (
                  <div className={styles.runningBadge}>
                    <Loader2 size={12} className={styles.spinIcon} />
                    Wykonywanie... ({scenario.executedSteps}/{scenario.steps.length} kroków)
                  </div>
                )}

                {/* Actions */}
                <div className={styles.cardActions}>
                  {(triggerType === 'manual' || triggerType === 'timer') && (
                    <button
                      className={styles.runBtn}
                      onClick={() => handleRun(scenario.id)}
                      disabled={scenario.running}
                    >
                      {scenario.running ? (
                        <>
                          <Pause size={13} />
                          Działa...
                        </>
                      ) : (
                        <>
                          <Play size={13} />
                          Uruchom
                        </>
                      )}
                    </button>
                  )}
                  <button
                    className={styles.expandBtn}
                    onClick={() => toggleExpand(scenario.id)}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? 'Ukryj' : 'Pokaż'} kroki
                  </button>
                </div>

                {/* Steps Timeline */}
                {isExpanded && (
                  <div className={styles.timeline}>
                    {scenario.steps.map((step, idx) => {
                      const isDone = scenario.executedSteps > idx;
                      const isCurrent = scenario.running && scenario.executedSteps === idx;

                      return (
                        <div key={idx} className={styles.timelineStep}>
                          <div className={styles.timelineIndicator}>
                            {isDone ? (
                              <CheckCircle2 size={16} className={styles.stepDone} />
                            ) : isCurrent ? (
                              <Loader2 size={16} className={`${styles.stepCurrent} ${styles.spinIcon}`} />
                            ) : (
                              <Circle size={16} className={styles.stepPending} />
                            )}
                            {idx < scenario.steps.length - 1 && (
                              <div className={`${styles.timelineLine} ${isDone ? styles.timelineLineDone : ''}`} />
                            )}
                          </div>
                          <div className={styles.stepContent}>
                            <div className={styles.stepAction}>
                              {actionLabels[step.action] || step.action}
                            </div>
                            <div className={styles.stepDetail}>
                              {'text' in step && (step as { text?: string }).text
                                ? `"${((step as { text: string }).text).slice(0, 50)}..."`
                                : 'content' in step && (step as { content?: string }).content
                                  ? `"${((step as { content: string }).content).slice(0, 50)}..."`
                                  : (step as { message?: string }).message
                                    ? `"${((step as { message: string }).message).slice(0, 50)}..."`
                                    : ''}
                            </div>
                            {step.delayMs > 0 && (
                              <div className={styles.stepDelay}>
                                ⏱️ +{(step.delayMs / 1000).toFixed(1)}s
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            {scenarios.filter(s => s.enabled).length} z {scenarios.length} aktywnych
          </div>
        </div>
      </div>
    </>
  );
};
