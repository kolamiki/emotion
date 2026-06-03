import React from 'react';
import { UserPlus, MessageCircle, MapPin, Calendar } from 'lucide-react';
import styles from './FriendsList.module.css';
import { usersData } from '../../mockData';
import type { User } from '../../types';

interface FriendsListProps {
  currentUser: User;
  onViewProfile: (userId: string) => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({ currentUser, onViewProfile }) => {
  const friends = usersData.allUsers.filter(u => u.isFriend && u.id !== currentUser.id);
  const suggestions = usersData.allUsers.filter(u => !u.isFriend && u.id !== currentUser.id);

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
          <button className={`${styles.actionBtn} ${styles.primaryBtn}`}>
            <MessageCircle size={16} />
            Wyślij wiadomość
          </button>
        ) : (
          <button className={`${styles.actionBtn} ${styles.secondaryBtn}`}>
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
        <h2 className={styles.sectionTitle}>Twoi znajomi ({friends.length})</h2>
        <div className={styles.grid}>
          {friends.map(user => renderUserCard(user, true))}
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
