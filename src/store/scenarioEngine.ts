import type { AppAction, Scenario, ScenarioStep, Post, GroupPost, Message, MessageThread, AppState } from '../types';
import { usersData, scenariosData } from '../mockData';
import { generateContextualResponse } from './responseEngine';

type Dispatch = React.Dispatch<AppAction>;

const allUsers = usersData.allUsers;
const scenarios = scenariosData as Scenario[];

/* === Random content pools === */
const randomPostContents = [
  "Właśnie odkryłem niesamowity plugin do VS Code! Zmienił moje życie developera 🚀 Polecam każdemu!",
  "Kto jeszcze pracuje o tej porze? ☕ Nocna zmiana programistów, łączmy się!",
  "Dzisiaj miałem fenomenalny dzień — 3 PR-y zmergowane i zero bugów. To chyba rekord! 🎉",
  "Szukam rekomendacji na dobry podcast technologiczny po polsku. Macie coś? 🎧",
  "Właśnie skończyłam kurs machine learningu! Czuję się jak superbohater z nowymi supermocami 🦸‍♀️📊",
  "Weekend w górach zrobił swoje — nowe siły i nowe pomysły na projekty! ⛰️✨",
  "Kto chętny na wspólne code review? Mam projekt w React + TypeScript, potrzebuję świeżego spojrzenia 👀",
  "Ciekawostka dnia: średnio programista pisze ~100 linii kodu dziennie, ale czyta ~1000. Czytanie to klucz! 📖",
  "Właśnie dołączyłem do nowego projektu open source. Szukamy kontrybutorów — piszcie jeśli zainteresowani! 🌍",
  "Poniedziałki nie są takie złe, kiedy robisz to, co kochasz 💪 Miłego początku tygodnia!",
  "Kto próbował Edge Functions w Supabase? Mam kilka pytań dotyczących wydajności 🤔",
  "Właśnie wróciłam ze spotkania UI/UX meetup — tyle inspiracji! Muszę się teraz podzielić notatkami 🎨",
];

/**
 * Get user object by ID, with support for "_random" placeholder.
 */
function resolveUser(userId: string) {
  if (userId === '_random') {
    const nonCurrentUsers = allUsers.filter(u => u.id !== 'u1');
    return nonCurrentUsers[Math.floor(Math.random() * nonCurrentUsers.length)];
  }
  return allUsers.find(u => u.id === userId);
}

/**
 * Get group admin user ID.
 */
function getGroupAdmin(groupId: string, state: AppState): string | null {
  const group = state.groups.find(g => g.id === groupId);
  if (!group) return null;
  const admin = group.members.find(m => m.role === 'admin');
  return admin?.id || group.members[0]?.id || null;
}

/**
 * Resolve random content for posts.
 */
function resolveContent(content: string): string {
  if (content === '_random') {
    return randomPostContents[Math.floor(Math.random() * randomPostContents.length)];
  }
  return content;
}

/**
 * Ensure a chat thread exists between two users, creating one if needed.
 */
function ensureThread(dispatch: Dispatch, state: AppState, fromId: string, toId: string): string {
  const otherUserId = fromId === 'u1' ? toId : fromId;
  
  // Check if thread already exists
  const existing = state.messages.find(m => m.participant.id === otherUserId);
  if (existing) return existing.threadId;

  // Create new thread
  const otherUser = resolveUser(otherUserId);
  if (!otherUser) return '';

  const threadId = `t-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const newThread: MessageThread = {
    threadId,
    participant: {
      id: otherUser.id,
      name: otherUser.name,
      avatarUrl: otherUser.avatarUrl,
      isOnline: otherUser.isOnline,
    },
    messages: [],
  };

  dispatch({ type: 'CREATE_THREAD', thread: newThread });
  return threadId;
}

/**
 * Execute a single scenario step.
 */
function executeStep(
  step: ScenarioStep,
  dispatch: Dispatch,
  state: AppState,
  context: { groupId?: string; userContent?: string }
): void {
  switch (step.action) {
    case 'create_post': {
      const author = resolveUser(step.authorId);
      if (!author) return;

      const content = step.contextRef === 'user_post' && context.userContent
        ? generateContextualResponse(context.userContent, step.authorId)
        : resolveContent(step.content);

      if (step.target === 'feed') {
        const post: Post = {
          id: `sc-p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          author: {
            id: author.id,
            name: author.name,
            avatarUrl: author.avatarUrl,
            isOnline: author.isOnline,
          },
          content,
          timestamp: new Date().toISOString(),
          likes: Math.floor(Math.random() * 5),
          comments: [],
          shares: 0,
        };
        dispatch({ type: 'ADD_FEED_POST_FROM_USER', post });
      } else {
        const groupId = step.target.groupId;
        const groupPost: GroupPost = {
          id: `sc-gp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          author: {
            id: author.id,
            name: author.name,
            avatarUrl: author.avatarUrl,
          },
          content,
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: [],
        };
        dispatch({ type: 'ADD_GROUP_POST', groupId, post: groupPost });
      }
      break;
    }

    case 'send_message': {
      let fromId = step.fromId;

      // Resolve _group_admin placeholder
      if (fromId === '_group_admin' && context.groupId) {
        const adminId = getGroupAdmin(context.groupId, state);
        if (!adminId) return;
        fromId = adminId;
      }

      const fromUser = resolveUser(fromId);
      if (!fromUser) return;

      // Find existing thread or create one
      const existingThread = state.messages.find(m => m.participant.id === fromId);
      let threadId: string;

      if (existingThread) {
        threadId = existingThread.threadId;
      } else {
        threadId = ensureThread(dispatch, state, fromId, step.toId);
      }

      if (!threadId) return;

      const messageText = step.contextRef === 'user_post' && context.userContent
        ? generateContextualResponse(context.userContent, fromId)
        : step.text;

      // Slight delay to ensure thread creation is processed
      setTimeout(() => {
        const msg: Message = {
          id: `sc-m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          senderId: fromId,
          text: messageText,
          timestamp: new Date().toISOString(),
        };

        dispatch({ type: 'SET_TYPING', threadId, isTyping: true });

        setTimeout(() => {
          dispatch({ type: 'SET_TYPING', threadId, isTyping: false });
          dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: msg });
        }, 1500 + Math.random() * 1000);
      }, 200);
      break;
    }

    case 'add_comment': {
      const author = resolveUser(step.authorId);
      if (!author) return;

      const commentText = step.contextRef === 'user_post' && context.userContent
        ? generateContextualResponse(context.userContent, step.authorId)
        : step.text;

      const comment = {
        id: `sc-c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        author: {
          id: author.id,
          name: author.name,
          avatarUrl: author.avatarUrl,
        },
        text: commentText,
        timestamp: new Date().toISOString(),
      };

      if (step.postRef === 'latest_feed') {
        const latestPost = state.posts[0];
        if (latestPost) {
          dispatch({ type: 'ADD_COMMENT', postId: latestPost.id, comment });
        }
      } else if (step.postRef === 'latest_group' && context.groupId) {
        const group = state.groups.find(g => g.id === context.groupId);
        if (group && group.posts.length > 0) {
          dispatch({
            type: 'ADD_GROUP_COMMENT',
            groupId: context.groupId,
            postId: group.posts[0].id,
            comment,
          });
        }
      }
      break;
    }

    case 'add_notification': {
      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: {
          id: `sc-n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          message: step.message,
          isRead: false,
          timestamp: new Date().toISOString(),
          type: step.notifType,
          ...(step.link ? { link: step.link } : {}),
        },
      });
      break;
    }
  }
}

/**
 * ScenarioManager — manages lifecycle of all scenarios.
 */
export class ScenarioManager {
  private activeTimers: Map<string, ReturnType<typeof setTimeout>[]> = new Map();
  private intervalTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private timeoutTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private dispatch: Dispatch;
  private getState: () => AppState;
  private scenarioStates: Map<string, { enabled: boolean; running: boolean; executedSteps: number }> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor(dispatch: Dispatch, getState: () => AppState) {
    this.dispatch = dispatch;
    this.getState = getState;

    // Initialize scenario states
    for (const sc of scenarios) {
      this.scenarioStates.set(sc.id, {
        enabled: sc.enabled,
        running: false,
        executedSteps: 0,
      });
    }
  }

  /** Subscribe to state changes */
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  /** Get all scenarios with their current state */
  getScenarios(): (Scenario & { running: boolean; executedSteps: number })[] {
    return scenarios.map(sc => {
      const state = this.scenarioStates.get(sc.id);
      return {
        ...sc,
        enabled: state?.enabled ?? sc.enabled,
        running: state?.running ?? false,
        executedSteps: state?.executedSteps ?? 0,
      };
    });
  }

  /** Toggle a scenario on/off */
  toggleScenario(scenarioId: string) {
    const state = this.scenarioStates.get(scenarioId);
    if (!state) return;

    state.enabled = !state.enabled;

    if (!state.enabled) {
      this.stopScenario(scenarioId);
      const timeout = this.timeoutTimers.get(scenarioId);
      if (timeout) {
        clearTimeout(timeout);
        this.timeoutTimers.delete(scenarioId);
      }
    }

    // If it's a timer/timeout scenario and just enabled, start it
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario && state.enabled) {
      if (scenario.trigger.type === 'timer') {
        this.startTimerScenario(scenario);
      } else if (scenario.trigger.type === 'timeout') {
        this.startTimeoutScenario(scenario);
      }
    }

    this.notify();
  }

  /** Manually run a scenario */
  runScenario(scenarioId: string) {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const state = this.scenarioStates.get(scenarioId);
    if (!state) return;

    this.executeScenario(scenario, {});
  }

  /** Trigger scenarios based on an event */
  trigger(eventType: 'group_enter' | 'group_post', groupId: string, userContent?: string) {
    for (const scenario of scenarios) {
      const state = this.scenarioStates.get(scenario.id);
      if (!state?.enabled) continue;

      if (scenario.trigger.type === eventType) {
        const triggerGroupId = scenario.trigger.groupId;
        if (triggerGroupId === '*' || triggerGroupId === groupId) {
          this.executeScenario(scenario, { groupId, userContent });
        }
      }
    }
  }

  /** Start all timer-based scenarios that are enabled */
  startTimerScenarios() {
    for (const scenario of scenarios) {
      const state = this.scenarioStates.get(scenario.id);
      if (state?.enabled) {
        if (scenario.trigger.type === 'timer') {
          this.startTimerScenario(scenario);
        } else if (scenario.trigger.type === 'timeout') {
          this.startTimeoutScenario(scenario);
        }
      }
    }
  }

  private startTimerScenario(scenario: Scenario) {
    if (scenario.trigger.type !== 'timer') return;

    // Clear existing interval
    const existingInterval = this.intervalTimers.get(scenario.id);
    if (existingInterval) clearInterval(existingInterval);

    const interval = setInterval(() => {
      const state = this.scenarioStates.get(scenario.id);
      if (!state?.enabled) {
        clearInterval(interval);
        this.intervalTimers.delete(scenario.id);
        return;
      }
      this.executeScenario(scenario, {});
    }, scenario.trigger.intervalMs);

    this.intervalTimers.set(scenario.id, interval);
  }

  private startTimeoutScenario(scenario: Scenario) {
    if (scenario.trigger.type !== 'timeout') return;

    // Clear existing timeout
    const existingTimeout = this.timeoutTimers.get(scenario.id);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(() => {
      const state = this.scenarioStates.get(scenario.id);
      if (!state?.enabled) {
        this.timeoutTimers.delete(scenario.id);
        return;
      }
      this.executeScenario(scenario, {});
    }, scenario.trigger.delayMs);

    this.timeoutTimers.set(scenario.id, timeout);
  }

  /** Execute a scenario's steps sequentially with delays */
  private executeScenario(scenario: Scenario, context: { groupId?: string; userContent?: string }) {
    const scenarioState = this.scenarioStates.get(scenario.id);
    if (!scenarioState) return;

    scenarioState.running = true;
    scenarioState.executedSteps = 0;
    this.notify();

    const timers: ReturnType<typeof setTimeout>[] = [];

    let cumulativeDelay = 0;
    scenario.steps.forEach((step, index) => {
      cumulativeDelay += step.delayMs;

      const timer = setTimeout(() => {
        const currentState = this.getState();
        executeStep(step, this.dispatch, currentState, context);

        scenarioState.executedSteps = index + 1;
        this.notify();

        // If last step, mark as not running
        if (index === scenario.steps.length - 1) {
          scenarioState.running = false;
          this.notify();
        }
      }, cumulativeDelay);

      timers.push(timer);
    });

    this.activeTimers.set(scenario.id, timers);
  }

  /** Stop a running scenario */
  private stopScenario(scenarioId: string) {
    const timers = this.activeTimers.get(scenarioId);
    if (timers) {
      timers.forEach(t => clearTimeout(t));
      this.activeTimers.delete(scenarioId);
    }

    const interval = this.intervalTimers.get(scenarioId);
    if (interval) {
      clearInterval(interval);
      this.intervalTimers.delete(scenarioId);
    }

    const state = this.scenarioStates.get(scenarioId);
    if (state) {
      state.running = false;
      this.notify();
    }
  }

  /** Cleanup all timers */
  destroy() {
    this.activeTimers.forEach(timers => timers.forEach(t => clearTimeout(t)));
    this.intervalTimers.forEach(interval => clearInterval(interval));
    this.timeoutTimers.forEach(timeout => clearTimeout(timeout));
    this.activeTimers.clear();
    this.intervalTimers.clear();
    this.timeoutTimers.clear();
    this.listeners.clear();
  }
}
