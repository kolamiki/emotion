import type { AppData } from '../types';
import rawUsersData from './users.json';
import postsData from './posts.json';
import groupsData from './groups.json';
import messagesData from './messages.json';
import notificationsData from './notifications.json';
import { getAssetUrl } from '../utils/assetUrl';

/**
 * Resolve local asset paths (starting with /) in avatar URLs.
 * External URLs (https://) are left as-is.
 */
function resolveAvatarUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return getAssetUrl(url);
}

// Process users data to fix local avatar paths for GitHub Pages
const processedUsersData = {
  ...rawUsersData,
  currentUser: {
    ...rawUsersData.currentUser,
    avatarUrl: resolveAvatarUrl(rawUsersData.currentUser.avatarUrl),
  },
  allUsers: rawUsersData.allUsers.map(user => ({
    ...user,
    avatarUrl: resolveAvatarUrl(user.avatarUrl),
  })),
};

export const mockData: AppData = {
  currentUser: processedUsersData.currentUser,
  posts: postsData,
  groups: groupsData,
  favorites: groupsData.filter(g => g.id === 'g1' || g.id === 'g2'),
  notifications: notificationsData.notifications,
  messages: messagesData,
} as AppData;

export { default as responsesData } from './responses.json';
export { usersData } from './processedUsers';
export { default as scenariosData } from './scenarios.json';
export { default as groupsData } from './groups.json';

