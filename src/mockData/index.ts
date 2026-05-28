import type { AppData } from '../types';
import usersData from './users.json';
import postsData from './posts.json';
import groupsData from './groups.json';
import messagesData from './messages.json';
import notificationsData from './notifications.json';

export const mockData: AppData = {
  currentUser: usersData.currentUser,
  posts: postsData,
  groups: groupsData,
  favorites: notificationsData.favorites,
  notifications: notificationsData.notifications,
  messages: messagesData,
} as AppData;

export { default as responsesData } from './responses.json';
export { default as usersData } from './users.json';
