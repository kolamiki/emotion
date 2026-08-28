import { useEffect, useRef } from 'react';
import { X, MessageCircle, UserPlus, UserCheck, MapPin, Calendar, Users, FileText, Trophy } from 'lucide-react';
import styles from './ProfilePreview.module.css';
import type { User, Group, Post } from '../../types';
import { BLOCKED_FRIEND_IDS } from '../../types';
import { useDailyChallengeState } from '../../hooks/useDailyChallengeState';

// Fictional user challenge levels for lore consistency
const CHARACTER_CHALLENGE_LEVELS: Record<string, { level: number; tierName: string; tier: 'bronze' | 'silver' | 'gold'; totalXp: number }> = {
  'u14': { level: 42, tierName: 'Złoto', tier: 'gold', totalXp: 9800 },
  'u_matylda': { level: 19, tierName: 'Srebro', tier: 'silver', totalXp: 3950 },
  'u_damian': { level: 12, tierName: 'Srebro', tier: 'silver', totalXp: 2150 },
  'u_kornel': { level: 8, tierName: 'Brąz', tier: 'bronze', totalXp: 680 },
  'u_marinette': { level: 4, tierName: 'Brąz', tier: 'bronze', totalXp: 310 },
  'u_natalie': { level: 6, tierName: 'Brąz', tier: 'bronze', totalXp: 490 },
  'u_gaston': { level: 2, tierName: 'Brąz', tier: 'bronze', totalXp: 80 },
  'u_weronika': { level: 7, tierName: 'Brąz', tier: 'bronze', totalXp: 580 },
  'u3': { level: 5, tierName: 'Brąz', tier: 'bronze', totalXp: 410 },
  'u5': { level: 9, tierName: 'Brąz', tier: 'bronze', totalXp: 740 },
  'u10': { level: 15, tierName: 'Srebro', tier: 'silver', totalXp: 2850 },
};

interface ProfilePreviewProps {
  user: User;
  currentUserId: string;
  groups: Group[];
  posts: Post[];
  friends: Set<string>;
  pendingFriends: Set<string>;
  onToggleFriend: (userId: string) => void;
  onClose: () => void;
  onOpenChat?: (userId: string) => void;
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({
  user,
  currentUserId,
  groups,
  posts,
  friends,
  pendingFriends,
  onToggleFriend,
  onClose,
  onOpenChat,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { levelInfo: currentLevelInfo } = useDailyChallengeState();

  const isCurrentUser = user.id === currentUserId;
  const userLevel = isCurrentUser
    ? currentLevelInfo
    : (CHARACTER_CHALLENGE_LEVELS[user.id] || { level: 3, tierName: 'Brąz', tier: 'bronze', totalXp: 220 });

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Find groups this user belongs to
  const userGroups = groups.filter(g =>
    g.members.some(m => m.id === user.id)
  );

  // Find posts by this user (feed posts)
  const userPosts = posts.filter(p => p.author.id === user.id);

  // Mutual groups (groups where both current user and profile user are members)
  const mutualGroups = groups.filter(g =>
    g.members.some(m => m.id === user.id) &&
    g.members.some(m => m.id === currentUserId)
  );

  // Find the most recent post
  const latestPost = userPosts.length > 0
    ? userPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null;

  // Compute total likes received
  const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);

  const formatJoinDate = () => user.joinDate || 'maj 2026';
  const formatLocation = () => user.location || 'Polska';
  const getBio = () => user.bio || 'Użytkownik e-Motion';

  const handleMessageClick = () => {
    if (onOpenChat) {
      onOpenChat(user.id);
    }
    onClose();
  };

  const isFriend = friends.has(user.id);

  const handleToggleFriend = () => {
    if (!isFriend && BLOCKED_FRIEND_IDS.has(user.id)) return;
    if (pendingFriends.has(user.id)) return;
    onToggleFriend(user.id);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        {/* Cover / Header */}
        <div className={styles.coverSection}>
          <div className={styles.coverGradient} />
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Avatar area */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrap}>
            <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
            <div className={`${styles.statusDot} ${user.isOnline ? styles.statusOnline : styles.statusOffline}`} />
          </div>
        </div>

        {/* User info */}
        <div className={styles.infoSection}>
          <h2 className={styles.userName}>{user.name}</h2>
          <span className={`${styles.statusLabel} ${user.isOnline ? styles.statusLabelOnline : ''}`}>
            {user.isOnline ? '● Online' : '○ Offline'}
          </span>
          <p className={styles.bio}>{getBio()}</p>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <MapPin size={14} />
              <span>{formatLocation()}</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={14} />
              <span>Dołączył(a) {formatJoinDate()}</span>
            </div>
          </div>
        </div>

        {/* Daily Challenge Level Badge (Above Stats) */}
        <div className={styles.challengeBadgeWrap}>
          <div className={`${styles.challengeBadge} ${styles['tier_' + userLevel.tier]}`}>
            <Trophy size={14} strokeWidth={2.2} />
            <span>Wyzwania Dnia: <strong>Poziom {userLevel.level}</strong> ({userLevel.tierName})</span>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{userPosts.length}</span>
            <span className={styles.statLabel}>
              <FileText size={13} />
              Postów
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalLikes}</span>
            <span className={styles.statLabel}>
              ❤️ Polubień
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{userGroups.length}</span>
            <span className={styles.statLabel}>
              <Users size={13} />
              Grup
            </span>
          </div>
        </div>

        {/* Mutual groups */}
        {mutualGroups.length > 0 && !isCurrentUser && (
          <div className={styles.mutualSection}>
            <div className={styles.mutualTitle}>
              Wspólne grupy ({mutualGroups.length})
            </div>
            <div className={styles.mutualList}>
              {mutualGroups.map(g => (
                <div key={g.id} className={styles.mutualItem}>
                  <div
                    className={styles.mutualIcon}
                    style={{ background: g.coverColor }}
                  />
                  <span className={styles.mutualName}>{g.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest post preview */}
        {latestPost && (
          <div className={styles.latestPostSection}>
            <div className={styles.latestPostTitle}>Ostatni post</div>
            <div className={styles.latestPostContent}>
              {latestPost.content.length > 120
                ? latestPost.content.slice(0, 120) + '...'
                : latestPost.content}
            </div>
            <div className={styles.latestPostMeta}>
              ❤️ {latestPost.likes} · 💬 {latestPost.comments.length}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isCurrentUser && (
          <div className={styles.actionsRow}>
            {isFriend ? (
              <button 
                className={`${styles.actionBtn} ${styles.actionBtnFriend}`}
                onClick={handleToggleFriend}
              >
                <UserCheck size={16} />
                Znajomi
              </button>
            ) : pendingFriends.has(user.id) ? (
              <button 
                className={`${styles.actionBtn} ${styles.actionBtnDisabled}`}
                disabled
              >
                <UserPlus size={16} />
                Zaproszenie wysłane
              </button>
            ) : (
              <button 
                className={`${styles.actionBtn} ${styles.actionBtnAdd} ${BLOCKED_FRIEND_IDS.has(user.id) ? styles.actionBtnDisabled : ''}`}
                onClick={handleToggleFriend}
                disabled={BLOCKED_FRIEND_IDS.has(user.id)}
                title={BLOCKED_FRIEND_IDS.has(user.id) ? 'Ten użytkownik zablokował możliwość wysyłania zaproszeń' : ''}
              >
                <UserPlus size={16} />
                Dodaj do znajomych
              </button>
            )}
            <button
              className={`${styles.actionBtn} ${styles.actionBtnMessage} ${!isFriend ? styles.actionBtnDisabled : ''}`}
              onClick={handleMessageClick}
              disabled={!isFriend}
              title={!isFriend ? 'Wiadomości mogą wysyłać tylko znajomi' : ''}
            >
              <MessageCircle size={16} />
              Wyślij wiadomość
            </button>
          </div>
        )}

        {isCurrentUser && (
          <div className={styles.actionsRow}>
            <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`}>
              To Twój profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
