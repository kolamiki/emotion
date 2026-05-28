import { useState, useRef, useEffect } from 'react';
import {
  PenLine,
  MessageCircle,
  Bell,
  Search,
  X,
  Heart,
  MessageSquare,
  Users,
  AtSign,
  UserPlus,
} from 'lucide-react';
import styles from './TopBar.module.css';
import type { User, AppNotification, MessageThread, AppAction } from '../../types';
import { schedulePostCommentResponse } from '../../store/responseEngine';

interface TopBarProps {
  currentUser: User;
  notifications: AppNotification[];
  messages: MessageThread[];
  onOpenChat: (threadId: string) => void;
  onNavigateHome: () => void;
  isCreatePostOpen: boolean;
  onOpenCreatePost: () => void;
  onCloseCreatePost: () => void;
  dispatch: React.Dispatch<AppAction>;
  onViewProfile?: (userId: string) => void;
}

const notifIconMap: Record<string, { icon: React.ReactNode; className: string }> = {
  like: { icon: <Heart size={16} />, className: 'notifIconLike' },
  comment: { icon: <MessageSquare size={16} />, className: 'notifIconComment' },
  group: { icon: <Users size={16} />, className: 'notifIconGroup' },
  mention: { icon: <AtSign size={16} />, className: 'notifIconMention' },
  friend: { icon: <UserPlus size={16} />, className: 'notifIconFriend' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  notifications,
  messages,
  onOpenChat,
  onNavigateHome,
  isCreatePostOpen,
  onOpenCreatePost,
  onCloseCreatePost,
  dispatch,
  onViewProfile,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'notifications' | 'messages' | null>(null);
  const [newPostText, setNewPostText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (type: 'notifications' | 'messages') => {
    setActiveDropdown(prev => (prev === type ? null : type));
  };

  const closeDropdown = () => setActiveDropdown(null);

  useEffect(() => {
    if (!activeDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeDropdown]);

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const handlePublish = () => {
    if (!newPostText.trim()) return;
    const content = newPostText.trim();
    dispatch({ type: 'ADD_POST', content });

    // Schedule auto-comment from fictional user
    const postId = `p-${Date.now()}`;
    // Small delay to ensure state is updated
    setTimeout(() => {
      schedulePostCommentResponse(dispatch, postId, content, currentUser.id);
    }, 100);

    setNewPostText('');
    onCloseCreatePost();
  };

  return (
    <>
      <header className={styles.topbar}>
        {/* Logo */}
        <div className={styles.logo} onClick={onNavigateHome}>
          <img src="/logo.png" alt="e-Motion" className={styles.logoImage} />
          <span className={styles.logoText}>e-Motion</span>
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            id="search-input"
            className={styles.searchInput}
            type="text"
            placeholder="Szukaj osób, grup, postów..."
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            id="btn-create-post"
            className={styles.actionBtn}
            title="Utwórz post"
            onClick={onOpenCreatePost}
          >
            <PenLine size={18} />
          </button>

          <button
            id="btn-messages"
            className={`${styles.actionBtn} ${activeDropdown === 'messages' ? styles.actionBtnActive : ''}`}
            title="Wiadomości"
            onClick={() => toggleDropdown('messages')}
          >
            <MessageCircle size={18} />
          </button>

          <button
            id="btn-notifications"
            className={`${styles.actionBtn} ${activeDropdown === 'notifications' ? styles.actionBtnActive : ''}`}
            title="Powiadomienia"
            onClick={() => toggleDropdown('notifications')}
          >
            <Bell size={18} />
            {unreadNotifs > 0 && (
              <span className={styles.badge}>{unreadNotifs}</span>
            )}
          </button>

          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className={styles.userAvatar}
            onClick={() => onViewProfile && onViewProfile(currentUser.id)}
            style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
          />
        </div>
      </header>

      {/* Dropdowns */}
      {activeDropdown && (
        <div ref={dropdownRef}>
          {activeDropdown === 'notifications' && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Powiadomienia</span>
              </div>
              <div className={styles.dropdownBody}>
                {notifications.map(n => {
                  const iconInfo = notifIconMap[n.type] || notifIconMap.like;
                  return (
                    <div
                      key={n.id}
                      className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ''}`}
                      onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', notificationId: n.id })}
                    >
                      <div className={`${styles.notifIcon} ${styles[iconInfo.className]}`}>
                        {iconInfo.icon}
                      </div>
                      <div className={styles.notifContent}>
                        <div className={styles.notifText}>{n.message}</div>
                        <div className={styles.notifTime}>{formatTime(n.timestamp)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeDropdown === 'messages' && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Wiadomości</span>
              </div>
              <div className={styles.dropdownBody}>
                {messages.map(thread => {
                  const lastMsg = thread.messages[thread.messages.length - 1];
                  return (
                    <div
                      key={thread.threadId}
                      className={styles.msgItem}
                      onClick={() => { onOpenChat(thread.threadId); closeDropdown(); }}
                    >
                      <div className={styles.msgAvatarWrap}>
                        <img
                          src={thread.participant.avatarUrl}
                          alt={thread.participant.name}
                          className={styles.msgAvatar}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewProfile) {
                              onViewProfile(thread.participant.id);
                              closeDropdown();
                            }
                          }}
                          style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
                        />
                        {thread.participant.isOnline && <div className={styles.onlineDot} />}
                      </div>
                      <div className={styles.msgInfo}>
                        <div className={styles.msgName}>{thread.participant.name}</div>
                        <div className={styles.msgPreview}>{lastMsg?.text}</div>
                      </div>
                      <div className={styles.msgTime}>{formatTime(lastMsg?.timestamp)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      {isCreatePostOpen && (
        <div className={styles.modalOverlay} onClick={onCloseCreatePost}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Utwórz post</span>
              <button className={styles.modalClose} onClick={onCloseCreatePost}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalUserRow}>
                <img src={currentUser.avatarUrl} alt={currentUser.name} className={styles.modalAvatar} />
                <span className={styles.modalUserName}>{currentUser.name}</span>
              </div>
              <textarea
                id="new-post-textarea"
                className={styles.postTextarea}
                placeholder={`Co słychać, ${currentUser.name.split(' ')[0]}?`}
                value={newPostText}
                onChange={e => setNewPostText(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                id="btn-publish-post"
                className={styles.publishBtn}
                disabled={!newPostText.trim()}
                onClick={handlePublish}
              >
                Opublikuj
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
