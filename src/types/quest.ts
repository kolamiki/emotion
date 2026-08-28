export interface QuestSubtask {
  id: string;
  title: string;
  description: string;
  hint?: string;
  isCompleted: boolean;
}

export interface QuestStage {
  id: string;
  stageNumber: number;
  title: string;
  subtitle: string;
  description: string;
  rewardText?: string;
  icon: string;
  subtasks: QuestSubtask[];
  isCompleted: boolean;
  isActive: boolean;
  isLocked: boolean;
}

export interface QuestState {
  isActivated: boolean;
  currentStageNumber: number;
  stages: QuestStage[];
  completedSubtaskCount: number;
  totalSubtaskCount: number;
  progressPercent: number;
  activeStagePercent: number;
  activeStageCompletedSubtasks: number;
  activeStageTotalSubtasks: number;
}
