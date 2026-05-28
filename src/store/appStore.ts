import { createContext, useContext } from 'react';
import type { AppState, AppAction, Post } from '../types';
import { mockData } from '../mockData';

/* === localStorage helpers === */
const STORAGE_KEY = 'emotion-app-state';

export function loadPersistedState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function persistState(state: AppState) {
  try {
    // Only persist user-generated data, not the full mock data
    const toPersist = {
      posts: state.posts,
      groups: state.groups,
      messages: state.messages,
      notifications: state.notifications,
      likedPosts: state.likedPosts,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch {
    // localStorage may be full or unavailable
  }
}

/* === Initial State === */
export function getInitialState(): AppState {
  const persisted = loadPersistedState();
  
  const base: AppState = {
    posts: mockData.posts,
    groups: mockData.groups,
    messages: mockData.messages,
    notifications: mockData.notifications,
    favorites: mockData.favorites,
    currentUser: mockData.currentUser,
    likedPosts: {},
    typing: {},
  };

  if (persisted) {
    return {
      ...base,
      posts: persisted.posts ?? base.posts,
      groups: persisted.groups ?? base.groups,
      messages: persisted.messages ?? base.messages,
      notifications: persisted.notifications ?? base.notifications,
      likedPosts: persisted.likedPosts ?? base.likedPosts,
    };
  }

  return base;
}

/* === Reducer === */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_POST': {
      const newPost: Post = {
        id: `p-${Date.now()}`,
        author: state.currentUser,
        content: action.content,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
        shares: 0,
      };
      return { ...state, posts: [newPost, ...state.posts] };
    }

    case 'TOGGLE_LIKE_POST': {
      const isLiked = state.likedPosts[action.postId];
      const newLikedPosts = { ...state.likedPosts, [action.postId]: !isLiked };
      if (isLiked) delete newLikedPosts[action.postId];

      const newPosts = state.posts.map(p =>
        p.id === action.postId
          ? { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      );
      return { ...state, posts: newPosts, likedPosts: newLikedPosts };
    }

    case 'TOGGLE_LIKE_GROUP_POST': {
      const newGroups = state.groups.map(g => {
        if (g.id !== action.groupId) return g;
        return {
          ...g,
          posts: g.posts.map(p => {
            if (p.id !== action.postId) return p;
            const isLiked = state.likedPosts[action.postId];
            return { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 };
          }),
        };
      });
      const isLiked = state.likedPosts[action.postId];
      const newLikedPosts = { ...state.likedPosts, [action.postId]: !isLiked };
      if (isLiked) delete newLikedPosts[action.postId];
      return { ...state, groups: newGroups, likedPosts: newLikedPosts };
    }

    case 'ADD_COMMENT': {
      const newPosts = state.posts.map(p =>
        p.id === action.postId
          ? { ...p, comments: [...p.comments, action.comment] }
          : p
      );
      return { ...state, posts: newPosts };
    }

    case 'ADD_GROUP_COMMENT': {
      const newGroups = state.groups.map(g => {
        if (g.id !== action.groupId) return g;
        return {
          ...g,
          posts: g.posts.map(p =>
            p.id === action.postId
              ? { ...p, comments: [...p.comments, action.comment] }
              : p
          ),
        };
      });
      return { ...state, groups: newGroups };
    }

    case 'SEND_MESSAGE': {
      const newMessages = state.messages.map(t =>
        t.threadId === action.threadId
          ? { ...t, messages: [...t.messages, action.message] }
          : t
      );
      return { ...state, messages: newMessages };
    }

    case 'ADD_RESPONSE_MESSAGE': {
      const newMessages = state.messages.map(t =>
        t.threadId === action.threadId
          ? { ...t, messages: [...t.messages, action.message] }
          : t
      );
      return { ...state, messages: newMessages };
    }

    case 'SET_TYPING': {
      return {
        ...state,
        typing: { ...state.typing, [action.threadId]: action.isTyping },
      };
    }

    case 'MARK_NOTIFICATION_READ': {
      const newNotifications = state.notifications.map(n =>
        n.id === action.notificationId ? { ...n, isRead: true } : n
      );
      return { ...state, notifications: newNotifications };
    }

    case 'ADD_NOTIFICATION': {
      return {
        ...state,
        notifications: [action.notification, ...state.notifications],
      };
    }

    case 'LOAD_STATE': {
      return { ...state, ...action.state };
    }

    default:
      return state;
  }
}

/* === Context === */
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useAppStore(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
