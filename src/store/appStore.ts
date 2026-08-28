import { createContext, useContext } from 'react';
import type { AppState, AppAction, Post, MessageThread } from '../types';
import { mockData, usersData } from '../mockData';

/* === localStorage helpers === */
const STORAGE_KEY = 'emotion-app-state';

// State limits to prevent localStorage bloat
const MAX_POSTS = 200;
const MAX_NOTIFICATIONS = 100;
const MAX_MESSAGES_PER_THREAD = 200;
const MAX_COMMENTS_PER_POST = 50;

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
      readThreads: state.readThreads,
      currentUser: state.currentUser,
      friends: Array.from(state.friends),
      pendingFriends: Array.from(state.pendingFriends),
      matyldaLikesActive: state.matyldaLikesActive,
      pendingGroupJoins: Array.from(state.pendingGroupJoins),
      isBanned: state.isBanned,
      bannedReason: state.bannedReason,
      primeChatUnlocked: state.primeChatUnlocked,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch {
    // localStorage may be full or unavailable
  }
}

/* === Initial State === */
export function getInitialState(): AppState {
  const persisted = loadPersistedState();
  
  // Build initial friends set from mock data
  const initialFriends = new Set(
    usersData.allUsers.filter(u => u.isFriend && u.id !== 'u1').map(u => u.id)
  );

  const base: AppState = {
    posts: mockData.posts,
    groups: mockData.groups,
    messages: mockData.messages,
    notifications: mockData.notifications,
    favorites: mockData.favorites,
    currentUser: persisted?.currentUser ?? mockData.currentUser,
    likedPosts: {},
    typing: {},
    readThreads: {},
    friends: initialFriends,
    pendingFriends: new Set(),
    matyldaLikesActive: false,
    pendingGroupJoins: new Set(),
    isBanned: persisted?.isBanned ?? false,
    bannedReason: persisted?.bannedReason ?? undefined,
    primeChatUnlocked: persisted?.primeChatUnlocked ?? false,
  };

  if (persisted) {
    // Merge arrays to ensure newly added mock data is not lost
    const mergeArrays = <T extends { id?: string; threadId?: string }>(baseArr: T[], persistedArr: T[] = []) => {
      const persistedIds = new Set(persistedArr.map(item => item.id || item.threadId));
      const missingFromPersisted = baseArr.filter(item => !persistedIds.has(item.id || item.threadId));
      return [...persistedArr, ...missingFromPersisted];
    };

    const rawMessages = mergeArrays(base.messages, persisted.messages);
    
    // Deduplicate threads by participant (merge messages if duplicates exist)
    const messagesByParticipant = new Map<string, typeof rawMessages[0]>();
    for (const thread of rawMessages) {
      const pid = thread.participant.id;
      if (!messagesByParticipant.has(pid)) {
        messagesByParticipant.set(pid, { ...thread, messages: [...thread.messages] });
      } else {
        const existingThread = messagesByParticipant.get(pid)!;
        // merge and sort messages by timestamp
        const allMsgs = [...existingThread.messages, ...thread.messages];
        const uniqueMsgs = Array.from(new Map(allMsgs.map(m => [m.id, m])).values());
        uniqueMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        existingThread.messages = uniqueMsgs;
      }
    }
    const dedupedMessages = Array.from(messagesByParticipant.values());

    // Smart merge for groups: always take latest base posts & comments, preserve user created posts and membership
    const mergedGroups = base.groups.map(baseGroup => {
      const persistedGroup = (persisted.groups || []).find(g => g.id === baseGroup.id);
      if (!persistedGroup) return baseGroup;

      const basePostIds = new Set(baseGroup.posts.map(p => p.id));
      const userCreatedPosts = persistedGroup.posts.filter(p => !basePostIds.has(p.id));

      const updatedBasePosts = baseGroup.posts.map(basePost => {
        const persistedPost = persistedGroup.posts.find(p => p.id === basePost.id);
        if (!persistedPost) return basePost;

        const baseCommentIds = new Set(basePost.comments.map(c => c.id));
        const userAddedComments = persistedPost.comments.filter(c => !baseCommentIds.has(c.id));

        return {
          ...basePost,
          likes: Math.max(basePost.likes, persistedPost.likes),
          comments: [...basePost.comments, ...userAddedComments],
        };
      });

      return {
        ...baseGroup,
        isMember: persistedGroup.isMember ?? baseGroup.isMember,
        posts: [...updatedBasePosts, ...userCreatedPosts],
      };
    });

    // Smart merge for feed posts
    const basePostIds = new Set(base.posts.map(p => p.id));
    const userCreatedFeedPosts = (persisted.posts || []).filter(p => !basePostIds.has(p.id));
    const updatedBaseFeedPosts = base.posts.map(basePost => {
      const persistedPost = (persisted.posts || []).find(p => p.id === basePost.id);
      if (!persistedPost) return basePost;
      const baseCommentIds = new Set(basePost.comments.map(c => c.id));
      const userAddedComments = persistedPost.comments.filter(c => !baseCommentIds.has(c.id));
      return {
        ...basePost,
        likes: Math.max(basePost.likes, persistedPost.likes),
        comments: [...basePost.comments, ...userAddedComments],
      };
    });

    const stateToReturn = {
      ...base,
      posts: [...userCreatedFeedPosts, ...updatedBaseFeedPosts],
      groups: mergedGroups,
      messages: dedupedMessages,
      notifications: mergeArrays(base.notifications, persisted.notifications),
      likedPosts: persisted.likedPosts ?? base.likedPosts,
      readThreads: persisted.readThreads ?? base.readThreads,
      friends: Array.isArray((persisted as any).friends)
        ? new Set((persisted as any).friends as string[])
        : base.friends,
      pendingFriends: Array.isArray((persisted as any).pendingFriends)
        ? new Set((persisted as any).pendingFriends as string[])
        : base.pendingFriends,
      matyldaLikesActive: (persisted as any).matyldaLikesActive ?? base.matyldaLikesActive,
      pendingGroupJoins: Array.isArray((persisted as any).pendingGroupJoins)
        ? new Set((persisted as any).pendingGroupJoins as string[])
        : base.pendingGroupJoins,
    };

    // Update u1 author in posts to match current user name/avatar
    stateToReturn.posts = stateToReturn.posts.map(post => {
      let updatedPost = post;
      if (post.author.id === 'u1') {
        updatedPost = {
          ...post,
          author: { ...post.author, name: stateToReturn.currentUser.name, avatarUrl: stateToReturn.currentUser.avatarUrl }
        };
      }
      // Update comments authored by u1
      if (updatedPost.comments.some(c => c.author.id === 'u1')) {
        updatedPost = {
          ...updatedPost,
          comments: updatedPost.comments.map(c => c.author.id === 'u1' ? {
            ...c,
            author: { ...c.author, name: stateToReturn.currentUser.name, avatarUrl: stateToReturn.currentUser.avatarUrl }
          } : c)
        };
      }
      return updatedPost;
    });

    stateToReturn.groups = stateToReturn.groups.map(group => ({
      ...group,
      posts: group.posts.map(post => {
        let updatedPost = post;
        if (post.author.id === 'u1') {
          updatedPost = {
            ...post,
            author: { ...post.author, name: stateToReturn.currentUser.name, avatarUrl: stateToReturn.currentUser.avatarUrl }
          };
        }
        if (updatedPost.comments.some(c => c.author.id === 'u1')) {
          updatedPost = {
            ...updatedPost,
            comments: updatedPost.comments.map(c => c.author.id === 'u1' ? {
              ...c,
              author: { ...c.author, name: stateToReturn.currentUser.name, avatarUrl: stateToReturn.currentUser.avatarUrl }
            } : c)
          };
        }
        return updatedPost;
      })
    }));

    // Update usersData globally
    const u1Index = usersData.allUsers.findIndex(u => u.id === 'u1');
    if (u1Index !== -1) {
      usersData.allUsers[u1Index] = { ...usersData.allUsers[u1Index], name: stateToReturn.currentUser.name, avatarUrl: stateToReturn.currentUser.avatarUrl };
    }

    return stateToReturn;
  }

  // If no persisted state, still ensure mock data is updated just in case
  base.posts = base.posts.map(post => {
    let updatedPost = post;
    if (post.author.id === 'u1') {
      updatedPost = {
        ...post,
        author: { ...post.author, name: base.currentUser.name, avatarUrl: base.currentUser.avatarUrl }
      };
    }
    if (updatedPost.comments.some(c => c.author.id === 'u1')) {
      updatedPost = {
        ...updatedPost,
        comments: updatedPost.comments.map(c => c.author.id === 'u1' ? {
          ...c,
          author: { ...c.author, name: base.currentUser.name, avatarUrl: base.currentUser.avatarUrl }
        } : c)
      };
    }
    return updatedPost;
  });

  base.groups = base.groups.map(group => ({
    ...group,
    posts: group.posts.map(post => {
      let updatedPost = post;
      if (post.author.id === 'u1') {
        updatedPost = {
          ...post,
          author: { ...post.author, name: base.currentUser.name, avatarUrl: base.currentUser.avatarUrl }
        };
      }
      if (updatedPost.comments.some(c => c.author.id === 'u1')) {
        updatedPost = {
          ...updatedPost,
          comments: updatedPost.comments.map(c => c.author.id === 'u1' ? {
            ...c,
            author: { ...c.author, name: base.currentUser.name, avatarUrl: base.currentUser.avatarUrl }
          } : c)
        };
      }
      return updatedPost;
    })
  }));

  // Update usersData globally
  const fallbackU1Index = usersData.allUsers.findIndex(u => u.id === 'u1');
  if (fallbackU1Index !== -1) {
    usersData.allUsers[fallbackU1Index] = { ...usersData.allUsers[fallbackU1Index], name: base.currentUser.name, avatarUrl: base.currentUser.avatarUrl };
  }

  return base;
}

/* === Reducer === */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_POST': {
      const newPost: Post = {
        id: action.id || `p-${Date.now()}`,
        author: state.currentUser,
        content: action.content,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
        shares: 0,
      };
      return { ...state, posts: [newPost, ...state.posts].slice(0, MAX_POSTS) };
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

    case 'INCREMENT_POST_LIKES': {
      const newPosts = state.posts.map(p =>
        p.id === action.postId ? { ...p, likes: p.likes + 1 } : p
      );
      return { ...state, posts: newPosts };
    }

    case 'INCREMENT_GROUP_POST_LIKES': {
      const newGroups = state.groups.map(g => {
        if (g.id !== action.groupId) return g;
        return {
          ...g,
          posts: g.posts.map(p =>
            p.id === action.postId ? { ...p, likes: p.likes + 1 } : p
          ),
        };
      });
      return { ...state, groups: newGroups };
    }

    case 'ADD_COMMENT': {
      const newPosts = state.posts.map(p =>
        p.id === action.postId
          ? { ...p, comments: [...p.comments, action.comment].slice(-MAX_COMMENTS_PER_POST) }
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
              ? { ...p, comments: [...p.comments, action.comment].slice(-MAX_COMMENTS_PER_POST) }
              : p
          ),
        };
      });
      return { ...state, groups: newGroups };
    }

    case 'SEND_MESSAGE': {
      const newMessages = state.messages.map(t =>
        t.threadId === action.threadId
          ? { ...t, messages: [...t.messages, action.message].slice(-MAX_MESSAGES_PER_THREAD) }
          : t
      );
      return { ...state, messages: newMessages };
    }

    case 'ADD_RESPONSE_MESSAGE': {
      const senderId = action.message.senderId;
      const targetThreadIndex = state.messages.findIndex(
        t => t.threadId === action.threadId || t.participant.id === senderId
      );

      if (targetThreadIndex === -1) {
        const participantUser = usersData.allUsers.find(u => u.id === senderId) || {
          id: senderId,
          name: senderId === 'u_marinette' ? 'Marinette Dupont' : senderId === 'u_damian' ? 'Damian Wilk' : senderId === 'u_matylda' ? 'Matylda Iggermann' : senderId,
          avatarUrl: senderId === 'u_marinette' ? 'https://i.pravatar.cc/150?u=marinette' : `https://i.pravatar.cc/150?u=${senderId}`,
          isOnline: true,
        };
        const newThread: MessageThread = {
          threadId: action.threadId,
          participant: {
            id: participantUser.id,
            name: participantUser.name,
            avatarUrl: participantUser.avatarUrl,
            isOnline: participantUser.isOnline ?? true,
          },
          messages: [action.message],
        };
        return { ...state, messages: [...state.messages, newThread] };
      }

      const targetThread = state.messages[targetThreadIndex];
      const msgAlreadyExists = targetThread.messages.some(m => m.id === action.message.id);
      const updatedMessages = msgAlreadyExists
        ? targetThread.messages
        : [...targetThread.messages, action.message].slice(-MAX_MESSAGES_PER_THREAD);

      const updatedThread = { ...targetThread, messages: updatedMessages };
      const newMessages = state.messages.map((t, idx) => idx === targetThreadIndex ? updatedThread : t);
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
        notifications: [action.notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
      };
    }

    case 'LOAD_STATE': {
      return { ...state, ...action.state };
    }

    case 'ADD_FEED_POST_FROM_USER': {
      return { ...state, posts: [action.post, ...state.posts].slice(0, MAX_POSTS) };
    }

    case 'ADD_GROUP_POST': {
      const newGroups = state.groups.map(g => {
        if (g.id !== action.groupId) return g;
        return { ...g, posts: [action.post, ...g.posts].slice(0, MAX_POSTS) };
      });
      return { ...state, groups: newGroups };
    }

    case 'CREATE_THREAD': {
      // Don't create duplicate threads by threadId OR by participant ID
      const exists = state.messages.some(
        m => m.threadId === action.thread.threadId || m.participant.id === action.thread.participant.id
      );
      if (exists) return state;
      return { ...state, messages: [...state.messages, action.thread] };
    }

    case 'MARK_THREAD_READ': {
      const thread = state.messages.find(t => t.threadId === action.threadId);
      const lastMsg = thread?.messages && thread.messages.length > 0 ? thread.messages[thread.messages.length - 1] : null;
      const readTimestamp = lastMsg ? lastMsg.timestamp : new Date().toISOString();
      return {
        ...state,
        readThreads: {
          ...state.readThreads,
          [action.threadId]: readTimestamp,
        },
      };
    }

    case 'TOGGLE_GROUP_MEMBERSHIP': {
      const newGroups = state.groups.map(g =>
        g.id === action.groupId ? { ...g, isMember: !g.isMember } : g
      );
      return { ...state, groups: newGroups };
    }

    case 'UPDATE_CURRENT_USER': {
      const newUser = { ...state.currentUser, ...action.user };
      
      const u1Index = usersData.allUsers.findIndex(u => u.id === 'u1');
      if (u1Index !== -1) {
        usersData.allUsers[u1Index] = { ...usersData.allUsers[u1Index], ...action.user };
      }

      return { 
        ...state, 
        currentUser: newUser,
        posts: state.posts.map(post => {
          let updatedPost = post;
          if (post.author.id === 'u1') {
            updatedPost = { ...post, author: { ...post.author, ...action.user } };
          }
          if (updatedPost.comments.some(c => c.author.id === 'u1')) {
            updatedPost = {
              ...updatedPost,
              comments: updatedPost.comments.map(c => c.author.id === 'u1' ? { ...c, author: { ...c.author, ...action.user } } : c)
            };
          }
          return updatedPost;
        }),
        groups: state.groups.map(group => ({
          ...group,
          posts: group.posts.map(post => {
            let updatedPost = post;
            if (post.author.id === 'u1') {
              updatedPost = { ...post, author: { ...post.author, ...action.user } };
            }
            if (updatedPost.comments.some(c => c.author.id === 'u1')) {
              updatedPost = {
                ...updatedPost,
                comments: updatedPost.comments.map(c => c.author.id === 'u1' ? { ...c, author: { ...c.author, ...action.user } } : c)
              };
            }
            return updatedPost;
          })
        }))
      };
    }

    case 'TOGGLE_FRIEND': {
      const newFriends = new Set(state.friends);
      if (newFriends.has(action.userId)) {
        newFriends.delete(action.userId);
      } else {
        newFriends.add(action.userId);
      }
      return { ...state, friends: newFriends };
    }

    case 'ADD_PENDING_FRIEND': {
      const newPending = new Set(state.pendingFriends);
      newPending.add(action.userId);
      return { ...state, pendingFriends: newPending };
    }

    case 'ACCEPT_FRIEND': {
      const newPending = new Set(state.pendingFriends);
      newPending.delete(action.userId);
      const newFriends = new Set(state.friends);
      newFriends.add(action.userId);
      return { ...state, pendingFriends: newPending, friends: newFriends };
    }

    case 'REMOVE_FRIEND': {
      const newFriends = new Set(state.friends);
      newFriends.delete(action.userId);
      const newPending = new Set(state.pendingFriends);
      newPending.delete(action.userId);
      return { ...state, friends: newFriends, pendingFriends: newPending };
    }

    case 'ACTIVATE_MATYLDA_LIKES': {
      return { ...state, matyldaLikesActive: true };
    }

    case 'SET_GROUP_PENDING_JOIN': {
      const newPending = new Set(state.pendingGroupJoins);
      newPending.add(action.groupId);
      return { ...state, pendingGroupJoins: newPending };
    }

    case 'APPROVE_GROUP_JOIN': {
      const newPending = new Set(state.pendingGroupJoins);
      newPending.delete(action.groupId);
      const newGroups = state.groups.map(g =>
        g.id === action.groupId ? { ...g, isMember: true } : g
      );
      return { ...state, pendingGroupJoins: newPending, groups: newGroups };
    }

    case 'SET_BANNED': {
      return {
        ...state,
        isBanned: action.isBanned,
        bannedReason: action.reason,
      };
    }

    case 'UNLOCK_PRIME_CHAT': {
      return {
        ...state,
        primeChatUnlocked: true,
      };
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
