import type { User } from '../types';
import rawUsersData from './users.json';
import { getAssetUrl } from '../utils/assetUrl';

function resolveAvatarUrl(url: string): string {
  if (!url) return '';
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

/**
 * Returns the full User object from users.json by id.
 * Returns undefined if the user does not exist in the registry.
 */
export function getUserById(id: string): User | undefined {
  return usersData.allUsers.find(u => u.id === id);
}

/**
 * Resolves author data by id:
 * - looks up in usersData (always up-to-date, reflects changes in users.json)
 * - if not found, falls back to the data embedded in the post/comment JSON
 *
 * Safe to use with localStorage — usersData always takes priority.
 */
export function resolveAuthor(
  embedded: { id: string; name: string; avatarUrl: string }
): Pick<User, 'id' | 'name' | 'avatarUrl'> {
  const live = getUserById(embedded.id);
  return live ?? embedded;
}
