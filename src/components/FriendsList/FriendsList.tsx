import React, { useState, useMemo } from 'react';
import { UserPlus, UserMinus, MessageCircle, MapPin, Calendar, Search, X, Clock } from 'lucide-react';
import styles from './FriendsList.module.css';
import { usersData } from '../../mockData';
import { BLOCKED_FRIEND_IDS } from '../../types';
import type { User } from '../../types';

interface FriendsListProps {
  currentUser: User;
  onViewProfile: (userId: string) => void;
  friends: Set<string>;
  pendingFriends: Set<string>;
  onToggleFriend: (userId: string) => void;
  onOpenChat?: (userId: string) => void;
}

function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .trim();
}

const EXCLUDED_RECOMMENDATION_IDS = new Set([
  'u_gaston',    // Gaston Desole
  'u14',         // Nicolas de La Hire
  'u_matylda',   // Matylda Iggermann
  'u13',         // Anonimowy użytkownik
  'u_behrmann',  // Helmut Behrmann
]);

function isExcludedFromRecommendations(user: User): boolean {
  // Exclude any fictional characters marked in users.json
  if (user.fictionalCharacter) return true;
  if (EXCLUDED_RECOMMENDATION_IDS.has(user.id)) return true;
  const lower = user.name.toLowerCase();
  if (lower.includes('gaston')) return true;
  if (lower.includes('nicolas') || lower.includes('la hire')) return true;
  if (lower.includes('matyld')) return true;
  if (lower.includes('anonim')) return true;
  if (lower.includes('behrmann') || lower.includes('helmut')) return true;
  return false;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  currentUser,
  onViewProfile,
  friends,
  pendingFriends,
  onToggleFriend,
  onOpenChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

  const allUsers = useMemo(
    () => usersData.allUsers.filter(u => u.id !== currentUser.id),
    [currentUser.id]
  );
  const friendUsers = useMemo(
    () => allUsers.filter(u => friends.has(u.id)),
    [allUsers, friends]
  );
  const recommendations = useMemo(
    () => allUsers.filter(u => !friends.has(u.id) && !isExcludedFromRecommendations(u)),
    [allUsers, friends]
  );

  const filterUser = (u: User, normQ: string) => {
    if (!normQ) return true;
    return (
      normalizeSearch(u.name).includes(normQ) ||
      (u.location && normalizeSearch(u.location).includes(normQ)) ||
      (u.bio && normalizeSearch(u.bio).includes(normQ))
    );
  };

  const normQuery = normalizeSearch(searchQuery);
  const filteredFriends = useMemo(
    () => friendUsers.filter(u => filterUser(u, normQuery)),
    [friendUsers, normQuery]
  );
  const filteredSuggestions = useMemo(() => {
    const list = normQuery
      ? recommendations.filter(u => filterUser(u, normQuery))
      : recommendations;
    return list.slice(0, 5);
  }, [recommendations, normQuery]);

  const handleToggleFriend = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!friends.has(userId) && !pendingFriends.has(userId) && BLOCKED_FRIEND_IDS.has(userId)) return;
    onToggleFriend(userId);
  };

  const renderUserCard = (user: User, isFriend: boolean) => {
    const isConfirming = confirmUserId === user.id;

    return (
      <div key={user.id} className={styles.userCard}>
        <div 
          className={styles.userHeader} 
          onClick={() => onViewProfile(user.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onViewProfile(user.id);
            }
          }}
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
            isConfirming ? (
              <div className={styles.confirmBox}>
                <span className={styles.confirmPrompt}>Usunąć {user.name} ze znajomych?</span>
                <div className={styles.confirmButtons}>
                  <button 
                    className={`${styles.actionBtn} ${styles.dangerBtn}`}
                    onClick={(e) => {
                      handleToggleFriend(e, user.id);
                      setConfirmUserId(null);
                    }}
                  >
                    Tak, usuń
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmUserId(null);
                    }}
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <>
                {onOpenChat && (
                  <button 
                    className={`${styles.actionBtn} ${styles.primaryBtn}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChat(user.id);
                    }}
                  >
                    <MessageCircle size={16} />
                    Wiadomość
                  </button>
                )}
                <button 
                  className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmUserId(user.id);
                  }}
                  title="Usuń ze znajomych"
                >
                  <UserMinus size={16} />
                  Usuń ze znajomych
                </button>
              </>
            )
          ) : pendingFriends.has(user.id) ? (
            <button 
              className={`${styles.actionBtn} ${styles.pendingBtn}`}
              onClick={(e) => handleToggleFriend(e, user.id)}
              title="Kliknij, aby anulować zaproszenie"
            >
              <Clock size={15} className={styles.pendingIconDefault} />
              <X size={15} className={styles.pendingIconHover} />
              <span className={styles.pendingTextDefault}>Zaproszenie wysłane</span>
              <span className={styles.pendingTextHover}>Anuluj zaproszenie</span>
            </button>
          ) : (
            <button 
              className={`${styles.actionBtn} ${styles.primaryBtn} ${BLOCKED_FRIEND_IDS.has(user.id) ? styles.btnDisabled : ''}`}
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
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Znajomi</h1>
          <p className={styles.subtitle}>Zarządzaj swoimi znajomymi i odkrywaj nowe osoby</p>
        </div>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Szukaj osób..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery('')}
              aria-label="Wyczyść szukanie"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Twoi znajomi ({filteredFriends.length}{searchQuery ? ` z ${friendUsers.length}` : ''})
        </h2>
        <div className={styles.grid}>
          {filteredFriends.length > 0 ? (
            filteredFriends.map(user => renderUserCard(user, true))
          ) : (
            <div className={styles.emptyState}>
              {searchQuery ? 'Brak znajomych pasujących do wyszukiwania.' : 'Nie masz jeszcze żadnych znajomych. Dodaj kogoś z propozycji poniżej!'}
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Rekomendacje znajomych ({filteredSuggestions.length})
        </h2>
        <div className={styles.grid}>
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map(user => renderUserCard(user, false))
          ) : (
            <div className={styles.emptyState}>
              {searchQuery ? 'Brak rekomendacji pasujących do wyszukiwania.' : 'Brak nowych rekomendacji znajomości.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
