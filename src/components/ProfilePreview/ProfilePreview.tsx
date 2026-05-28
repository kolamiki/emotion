import { useEffect, useRef } from 'react';
import { X, MessageCircle, UserPlus, UserCheck, MapPin, Calendar, Users, FileText } from 'lucide-react';
import styles from './ProfilePreview.module.css';
import type { User, Group, Post } from '../../types';

interface ProfilePreviewProps {
  user: User;
  currentUserId: string;
  groups: Group[];
  posts: Post[];
  onClose: () => void;
  onOpenChat?: (userId: string) => void;
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({
  user,
  currentUserId,
  groups,
  posts,
  onClose,
  onOpenChat,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isCurrentUser = user.id === currentUserId;

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

  const formatJoinDate = () => {
    // Simulate a join date based on userId
    const dates: Record<string, string> = {
      u1: 'styczeń 2025',
      u2: 'marzec 2025',
      u3: 'luty 2025',
      u4: 'kwiecień 2025',
      u5: 'maj 2025',
      u6: 'styczeń 2026',
    };
    return dates[user.id] || 'maj 2026';
  };

  const formatLocation = () => {
    const locations: Record<string, string> = {
      u1: 'Warszawa, Polska',
      u2: 'Kraków, Polska',
      u3: 'Zakopane, Polska',
      u4: 'Wrocław, Polska',
      u5: 'Gdańsk, Polska',
      u6: 'Barcelona, Hiszpania',
    };
    return locations[user.id] || 'Polska';
  };

  const getBio = () => {
    const bios: Record<string, string> = {
      u1: 'Pasjonat technologii i kawy. Full-stack developer z miłością do React i TypeScript. ☕💻',
      u2: 'Entuzjastka jogi, podróży i zdrowego stylu życia. Szukam inspiracji w każdym dniu! 🧘‍♀️✈️',
      u3: 'Biegacz, planszówkowicz, miłośnik gór. Weekend bez szlaku to stracony weekend. ⛰️🎲',
      u4: 'Graphic designer & UX enthusiast. Tworzę piękne rzeczy i dzielę się inspiracjami. 🎨✨',
      u5: 'Senior developer by day, bug creator by night. 12 lat w branży i wciąż się uczę. 💻🐛',
      u6: 'Podróżniczka, fotografka amatorka, miłośniczka architektury. Ostatnio zakochana w Barcelonie. 📸🇪🇸',
    };
    return bios[user.id] || 'Użytkownik e-Motion';
  };

  const handleMessageClick = () => {
    if (onOpenChat) {
      onOpenChat(user.id);
    }
    onClose();
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
            {user.isFriend ? (
              <button className={`${styles.actionBtn} ${styles.actionBtnFriend}`}>
                <UserCheck size={16} />
                Znajomi
              </button>
            ) : (
              <button className={`${styles.actionBtn} ${styles.actionBtnAdd}`}>
                <UserPlus size={16} />
                Dodaj do znajomych
              </button>
            )}
            <button
              className={`${styles.actionBtn} ${styles.actionBtnMessage}`}
              onClick={handleMessageClick}
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
