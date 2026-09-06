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

const processedPostsData = postsData.map(post => ({
  ...post,
  author: {
    ...post.author,
    avatarUrl: resolveAvatarUrl(post.author.avatarUrl),
  },
  comments: post.comments.map(c => ({
    ...c,
    author: {
      ...c.author,
      avatarUrl: resolveAvatarUrl(c.author.avatarUrl),
    },
  })),
}));

const processedGroupsData = groupsData.map(group => ({
  ...group,
  members: group.members.map(m => ({
    ...m,
    avatarUrl: resolveAvatarUrl(m.avatarUrl),
  })),
  posts: group.posts.map(p => ({
    ...p,
    author: {
      ...p.author,
      avatarUrl: resolveAvatarUrl(p.author.avatarUrl),
    },
    comments: p.comments.map(c => ({
      ...c,
      author: {
        ...c.author,
        avatarUrl: resolveAvatarUrl(c.author.avatarUrl),
      },
    })),
  })),
}));

export const mockData: AppData = {
  currentUser: processedUsersData.currentUser,
  posts: processedPostsData,
  groups: processedGroupsData,
  favorites: processedGroupsData.filter(g => g.id === 'g1' || g.id === 'g2'),
  notifications: notificationsData.notifications,
  messages: messagesData,
} as AppData;

export { default as responsesData } from './responses.json';
export { usersData } from './processedUsers';
export { default as scenariosData } from './scenarios.json';
export { processedGroupsData as groupsData };

