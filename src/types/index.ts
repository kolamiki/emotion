export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline?: boolean;
  isFriend?: boolean;
  bio?: string;
  location?: string;
  joinDate?: string;
}

export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  shares: number;
}

export interface GroupMember {
  id: string;
  name: string;
  avatarUrl: string;
  role: 'admin' | 'moderator' | 'member';
}

export interface GroupPost {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  description: string;
  coverColor: string;
  membersCount: number;
  members: GroupMember[];
  posts: GroupPost[];
  isMember: boolean;
  isRestricted?: boolean;
  adminId?: string;
  joinTaskType?: 'convince' | 'write_post_against';
  joinTaskTarget?: string;
}

export interface NotificationLink {
  type: 'post' | 'group' | 'profile' | 'chat';
  postId?: string;
  groupId?: string;
  userId?: string;
  threadId?: string;
}

export interface AppNotification {
  id: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  type: 'like' | 'comment' | 'group' | 'mention' | 'friend' | 'system' | 'chat';
  link?: NotificationLink;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
}

export interface MessageThread {
  threadId: string;
  participant: User;
  messages: Message[];
}

export interface AppData {
  currentUser: User;
  posts: Post[];
  groups: Group[];
  favorites: Group[];
  notifications: AppNotification[];
  messages: MessageThread[];
}

export type ActiveView = { type: 'feed' } | { type: 'group'; groupId: string } | { type: 'friends' } | { type: 'daily_challenge' };

/* === Sentiment & Topic Analysis Types === */

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'funny' | 'question' | 'vulgar';
export type Topic = 'tech' | 'sport' | 'food' | 'travel' | 'work' | 'mood' | 'design' | 'music' | 'games' | 'general';

export interface ContextAnalysis {
  sentiment: Sentiment;
  topics: Topic[];
  keywords: string[];
  hasEmoji: boolean;
}

/** User IDs that cannot be added as friends */
export const BLOCKED_FRIEND_IDS: ReadonlySet<string> = new Set([
  'u14',       // Nicolas de La Hire
  'u_behrmann', // Helmut Behrmann
  'u_gaston',   // Gaston Desole
]);

/* === Response System Types === */

export interface ResponseOption {
  text: string;
  delayBeforeTyping: number;
  typingDuration: number;
  sentiment?: Sentiment;
  topic?: Topic;
  contextTemplate?: string;
}

export interface PostCommentResponseOption extends ResponseOption {
  authorId: string;
}

export interface ChatResponseRule {
  id: string;
  participantId: string; // specific userId or "*" for any
  triggers: string[];
  responses: ResponseOption[];
}

export interface PostCommentResponseRule {
  id: string;
  triggers: string[];
  responses: PostCommentResponseOption[];
}

export interface FallbackResponses {
  chat: Record<string, ResponseOption[]>; // keyed by participantId, "*" = generic
  postComments: PostCommentResponseOption[];
}

export interface ResponsesData {
  chatResponses: ChatResponseRule[];
  postCommentResponses: PostCommentResponseRule[];
  fallbackResponses: FallbackResponses;
}

/* === Scenario System Types === */

export type ScenarioTrigger =
  | { type: 'group_enter'; groupId: string }
  | { type: 'group_post'; groupId: string }
  | { type: 'timer'; intervalMs: number }
  | { type: 'timeout'; delayMs: number }
  | { type: 'manual' };

export type ScenarioStep =
  | { action: 'create_post'; authorId: string; content: string; delayMs: number; target: 'feed' | { groupId: string }; contextRef?: 'user_post' }
  | { action: 'send_message'; fromId: string; toId: string; text: string; delayMs: number; contextRef?: 'user_post' }
  | { action: 'add_comment'; authorId: string; postRef: 'latest_feed' | 'latest_group'; text: string; delayMs: number; contextRef?: 'user_post' }
  | { action: 'add_notification'; message: string; notifType: AppNotification['type']; delayMs: number; link?: NotificationLink };

export interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger: ScenarioTrigger;
  steps: ScenarioStep[];
  enabled: boolean;
}

/* === App State Types === */

export interface TypingState {
  [threadId: string]: boolean;
}

export interface LikedPosts {
  [postId: string]: boolean;
}

export interface ReadThreads {
  [threadId: string]: string; // timestamp of last read message
}

export interface AppState {
  posts: Post[];
  groups: Group[];
  messages: MessageThread[];
  notifications: AppNotification[];
  favorites: Group[];
  currentUser: User;
  likedPosts: LikedPosts;
  typing: TypingState;
  readThreads: ReadThreads;
  friends: Set<string>;
  pendingFriends: Set<string>;
  matyldaLikesActive: boolean;
  pendingGroupJoins: Set<string>;
  isBanned?: boolean;
  bannedReason?: string;
  primeChatUnlocked?: boolean;
}

export type AppAction =
  | { type: 'ADD_POST'; content: string; id?: string }
  | { type: 'TOGGLE_LIKE_POST'; postId: string }
  | { type: 'TOGGLE_LIKE_GROUP_POST'; groupId: string; postId: string }
  | { type: 'INCREMENT_POST_LIKES'; postId: string }
  | { type: 'INCREMENT_GROUP_POST_LIKES'; groupId: string; postId: string }
  | { type: 'ADD_COMMENT'; postId: string; comment: Comment }
  | { type: 'ADD_GROUP_COMMENT'; groupId: string; postId: string; comment: Comment }
  | { type: 'SEND_MESSAGE'; threadId: string; message: Message }
  | { type: 'ADD_RESPONSE_MESSAGE'; threadId: string; message: Message }
  | { type: 'SET_TYPING'; threadId: string; isTyping: boolean }
  | { type: 'MARK_NOTIFICATION_READ'; notificationId: string }
  | { type: 'ADD_NOTIFICATION'; notification: AppNotification }
  | { type: 'LOAD_STATE'; state: Partial<AppState> }
  | { type: 'ADD_FEED_POST_FROM_USER'; post: Post }
  | { type: 'ADD_GROUP_POST'; groupId: string; post: GroupPost }
  | { type: 'CREATE_THREAD'; thread: MessageThread }
  | { type: 'MARK_THREAD_READ'; threadId: string }
  | { type: 'TOGGLE_GROUP_MEMBERSHIP'; groupId: string }
  | { type: 'UPDATE_CURRENT_USER'; user: Partial<User> }
  | { type: 'TOGGLE_FRIEND'; userId: string }
  | { type: 'ADD_PENDING_FRIEND'; userId: string }
  | { type: 'ACCEPT_FRIEND'; userId: string }
  | { type: 'REMOVE_FRIEND'; userId: string }
  | { type: 'ACTIVATE_MATYLDA_LIKES' }
  | { type: 'SET_GROUP_PENDING_JOIN'; groupId: string }
  | { type: 'APPROVE_GROUP_JOIN'; groupId: string }
  | { type: 'SET_BANNED'; isBanned: boolean; reason?: string }
  | { type: 'UNLOCK_PRIME_CHAT' };
