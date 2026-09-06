import type { User } from '../types';
import rawUsersData from './users.json';
import { getAssetUrl } from '../utils/assetUrl';

function resolveAvatarUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return getAssetUrl(url);
}

export const usersData: { currentUser: User; allUsers: User[] } = {
  ...rawUsersData,
  currentUser: {
    ...rawUsersData.currentUser,
    avatarUrl: resolveAvatarUrl(rawUsersData.currentUser.avatarUrl),
  },
  allUsers: rawUsersData.allUsers.map(user => ({
    ...user,
    avatarUrl: resolveAvatarUrl(user.avatarUrl),
  })) as User[],
};
