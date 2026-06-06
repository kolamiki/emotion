import React from 'react';
import { UserPlus, MessageCircle, MapPin, Calendar } from 'lucide-react';
import styles from './FriendsList.module.css';
import { usersData } from '../../mockData';
import { BLOCKED_FRIEND_IDS } from '../../types';
import type { User, AppAction } from '../../types';

interface FriendsListProps {
  currentUser: User;
  onViewProfile: (userId: string) => void;
  friends: Set<string>;
  pendingFriends: Set<string>;
  onToggleFriend: (userId: string) => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({ currentUser, onViewProfile, friends, pendingFriends, onToggleFriend }) => {
  const allUsers = usersData.allUsers.filter(u => u.id !== currentUser.id);
  const friendUsers = allUsers.filter(u => friends.has(u.id));
  const suggestions = allUsers.filter(u => !friends.has(u.id));

  const handleToggleFriend = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!friends.has(userId) && BLOCKED_FRIEND_IDS.has(userId)) return;
    if (pendingFriends.has(userId)) return;
    onToggleFriend(userId);
  };

  const renderUserCard = (user: User, isFriend: boolean) => (
    <div key={user.id} className={styles.userCard}>
      <div 
        className={styles.userHeader} 
        onClick={() => onViewProfile(user.id)}
        role="button"
        tabIndex={0}
      >
        <div className={styles.avatarContainer}>
          <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
          {user.isOnline && <div className={styles.onlineIndicator} />}
        </div>
        <div className={styles.userInfo}>
          <h3 className={styles.userName}>{user.name}</h3>
          {(user.location || user.joinDate) && (
            <div className={styles.userMeta}>
              {user.location && (
                <span className={styles.metaItem}>
                  <MapPin size={12} />
                  {user.location}
                </span>
              )}
              {user.joinDate && (
                <span className={styles.metaItem}>
                  <Calendar size={12} />
                  Dołączył(a) {user.joinDate}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={styles.userBio}>
        {user.bio || 'Brak opisu profilu.'}
      </div>
      <div className={styles.cardActions}>
        {isFriend ? (
          <button 
            className={`${styles.actionBtn} ${styles.primaryBtn}`}
            onClick={(e) => handleToggleFriend(e, user.id)}
          >
            <MessageCircle size={16} />
            Usuń ze znajomych
          </button>
        ) : pendingFriends.has(user.id) ? (
          <button 
            className={`${styles.actionBtn} ${styles.secondaryBtn} ${styles.btnDisabled}`}
            disabled
          >
            <UserPlus size={16} />
            Zaproszenie wysłane
          </button>
        ) : (
          <button 
            className={`${styles.actionBtn} ${styles.secondaryBtn} ${BLOCKED_FRIEND_IDS.has(user.id) ? styles.btnDisabled : ''}`}
            onClick={(e) => handleToggleFriend(e, user.id)}
            disabled={BLOCKED_FRIEND_IDS.has(user.id)}
            title={BLOCKED_FRIEND_IDS.has(user.id) ? 'Ten użytkownik zablokował możliwość wysyłania zaproszeń' : ''}
          >
            <UserPlus size={16} />
            Dodaj do znajomych
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Znajomi</h1>
        <p className={styles.subtitle}>Zarządzaj swoimi znajomymi i odkrywaj nowe osoby</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Twoi znajomi ({friendUsers.length})</h2>
        <div className={styles.grid}>
          {friendUsers.map(user => renderUserCard(user, true))}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Propozycje znajomości</h2>
          <div className={styles.grid}>
            {suggestions.map(user => renderUserCard(user, false))}
          </div>
        </div>
      )}
    </div>
  );
};
