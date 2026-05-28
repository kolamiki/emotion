export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline?: boolean;
  isFriend?: boolean;
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
}

export interface AppNotification {
  id: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  type: 'like' | 'comment' | 'group' | 'mention' | 'friend';
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
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

export type ActiveView = { type: 'feed' } | { type: 'group'; groupId: string };

/* === Response System Types === */

export interface ResponseOption {
  text: string;
  delayBeforeTyping: number;
  typingDuration: number;
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

/* === App State Types === */

export interface TypingState {
  [threadId: string]: boolean;
}

export interface LikedPosts {
  [postId: string]: boolean;
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
}

export type AppAction =
  | { type: 'ADD_POST'; content: string }
  | { type: 'TOGGLE_LIKE_POST'; postId: string }
  | { type: 'TOGGLE_LIKE_GROUP_POST'; groupId: string; postId: string }
  | { type: 'ADD_COMMENT'; postId: string; comment: Comment }
  | { type: 'ADD_GROUP_COMMENT'; groupId: string; postId: string; comment: Comment }
  | { type: 'SEND_MESSAGE'; threadId: string; message: Message }
  | { type: 'ADD_RESPONSE_MESSAGE'; threadId: string; message: Message }
  | { type: 'SET_TYPING'; threadId: string; isTyping: boolean }
  | { type: 'MARK_NOTIFICATION_READ'; notificationId: string }
  | { type: 'ADD_NOTIFICATION'; notification: AppNotification }
  | { type: 'LOAD_STATE'; state: Partial<AppState> };
