import { useState, useRef, useEffect, useCallback } from 'react';
import { getAssetUrl } from '../../utils/assetUrl';
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
  Trash2,
  ChevronRight,
} from 'lucide-react';
import styles from './TopBar.module.css';
import type { User, AppNotification, MessageThread, AppAction, Group, ActiveView, ReadThreads, NotificationLink } from '../../types';
import { schedulePostCommentResponse } from '../../store/responseEngine';
import { usersData } from '../../mockData';

interface TopBarProps {
  currentUser: User;
  notifications: AppNotification[];
  messages: MessageThread[];
  readThreads: ReadThreads;
  onOpenChat: (threadId: string) => void;
  onNavigateHome: () => void;
  isCreatePostOpen: boolean;
  onOpenCreatePost: () => void;
  onCloseCreatePost: () => void;
  dispatch: React.Dispatch<AppAction>;
  onViewProfile?: (userId: string) => void;
  groups: Group[];
  friends: Set<string>;
  pendingFriends: Set<string>;
  onNavigate: (view: ActiveView) => void;
  onNotificationClick?: (link: NotificationLink) => void;
}

const notifIconMap: Record<string, { icon: React.ReactNode; className: string }> = {
  like: { icon: <Heart size={16} />, className: 'notifIconLike' },
  comment: { icon: <MessageSquare size={16} />, className: 'notifIconComment' },
  group: { icon: <Users size={16} />, className: 'notifIconGroup' },
  mention: { icon: <AtSign size={16} />, className: 'notifIconMention' },
  friend: { icon: <UserPlus size={16} />, className: 'notifIconFriend' },
};

/* === Polish diacritic normalization for search === */
function normalizeText(text: string): string {
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

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  notifications,
  messages,
  readThreads,
  onOpenChat,
  onNavigateHome,
  isCreatePostOpen,
  onOpenCreatePost,
  onCloseCreatePost,
  dispatch,
  onViewProfile,
  groups,
  friends,
  pendingFriends,
  onNavigate,
  onNotificationClick,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'notifications' | 'messages' | null>(null);
  const [newPostText, setNewPostText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof usersData.allUsers>([]);
  const [searchGroupResults, setSearchGroupResults] = useState<Group[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toggleDropdown = (type: 'notifications' | 'messages') => {
    setActiveDropdown(prev => (prev === type ? null : type));
    setShowSearchResults(false);
  };

  const closeDropdown = () => setActiveDropdown(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!activeDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      if (target.closest('#btn-messages, #btn-notifications')) return;
      closeDropdown();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeDropdown]);

  // Close search results on outside click
  useEffect(() => {
    if (!showSearchResults) return;
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSearchResults]);

  // Debounced search
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchGroupResults([]);
      setShowSearchResults(false);
      return;
    }

    const normalized = normalizeText(query);
    const userResults = usersData.allUsers.filter(user => {
      const normalizedName = normalizeText(user.name);
      const normalizedBio = normalizeText(user.bio || '');
      const normalizedLocation = normalizeText(user.location || '');
      return (
        normalizedName.includes(normalized) ||
        normalizedBio.includes(normalized) ||
        normalizedLocation.includes(normalized)
      );
    });

    const groupResults = groups.filter(group => {
      const normalizedName = normalizeText(group.name);
      const normalizedDesc = normalizeText(group.description);
      return normalizedName.includes(normalized) || normalizedDesc.includes(normalized);
    });

    setSearchResults(userResults);
    setSearchGroupResults(groupResults);
    setShowSearchResults(true);
  }, [groups]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const handleSearchResultClick = (userId: string) => {
    if (onViewProfile) onViewProfile(userId);
    setSearchQuery('');
    setSearchResults([]);
    setSearchGroupResults([]);
    setShowSearchResults(false);
  };

  const handleGroupResultClick = (groupId: string) => {
    onNavigate({ type: 'group', groupId });
    setSearchQuery('');
    setSearchResults([]);
    setSearchGroupResults([]);
    setShowSearchResults(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const normalizedQuery = normalizeText(query);
    const normalizedText = normalizeText(text);
    const index = normalizedText.indexOf(normalizedQuery);
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return (
      <>
        {before}<span className={styles.searchHighlight}>{match}</span>{after}
      </>
    );
  };

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  // Check if a thread has unread messages (messages from others after last read timestamp)
  const isThreadUnread = (thread: MessageThread): boolean => {
    const lastReadTs = readThreads[thread.threadId];
    const otherMessages = thread.messages.filter(m => m.senderId !== currentUser.id);
    if (otherMessages.length === 0) return false;
    if (!lastReadTs) return true; // never read = unread
    const lastOtherMsg = otherMessages[otherMessages.length - 1];
    return new Date(lastOtherMsg.timestamp) > new Date(lastReadTs);
  };

  const unreadMessages = messages.filter(isThreadUnread).length;

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

  const handleClearData = () => {
    if (confirm('Czy na pewno chcesz usunąć wszystkie dane z localStorage i przeładować stronę? (Opcja deweloperska)')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handlePublish = () => {
    if (!newPostText.trim()) return;
    const content = newPostText.trim();
    const postId = `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    dispatch({ type: 'ADD_POST', id: postId, content });

    // Schedule auto-comment from fictional user
    setTimeout(() => {
      schedulePostCommentResponse(dispatch, postId, content, currentUser.id, currentUser.name);
    }, 100);

    setNewPostText('');
    onCloseCreatePost();
  };

  return (
    <>
      <header className={styles.topbar}>
        {/* Logo */}
        <div className={styles.logo} onClick={onNavigateHome}>
          <img src={getAssetUrl('/logo.png')} alt="e-Motion" className={styles.logoImage} />
          <span className={styles.logoText}>eMotion</span>
        </div>

        {/* Search */}
        <div className={`${styles.mobileSearchWrapper} ${isMobileSearchOpen ? styles.mobileSearchWrapperOpen : ''}`}>
          <div className={styles.mobileSearchBackdrop} onClick={() => setIsMobileSearchOpen(false)} />
          <div className={styles.searchContainer} ref={searchRef}>
            <Search size={16} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              id="search-input"
              className={styles.searchInput}
              type="text"
              placeholder="Szukaj osób, grup, postów..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
            />
            {searchQuery && (
              <button
                className={styles.searchClear}
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setSearchGroupResults([]);
                  setShowSearchResults(false);
                  searchInputRef.current?.focus();
                }}
              >
                <X size={14} />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className={styles.searchDropdown}>
                {searchResults.length > 0 && (
                  <>
                    <div className={styles.searchDropdownHeader}>
                      <span className={styles.searchDropdownTitle}>Użytkownicy</span>
                      <span className={styles.searchDropdownCount}>{searchResults.length} wyników</span>
                    </div>
                    {searchResults.map(user => (
                      <div
                        key={user.id}
                        className={styles.searchResultItem}
                        onClick={() => handleSearchResultClick(user.id)}
                      >
                        <div className={styles.searchResultAvatarWrap}>
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className={styles.searchResultAvatar}
                          />
                          {user.isOnline && <div className={styles.searchResultOnline} />}
                        </div>
                        <div className={styles.searchResultInfo}>
                          <div className={styles.searchResultName}>
                            {highlightMatch(user.name, searchQuery)}
                          </div>
                          {user.bio && (
                            <div className={styles.searchResultBio}>
                              {user.bio.length > 60 ? user.bio.slice(0, 60) + '...' : user.bio}
                            </div>
                          )}
                          {user.location && (
                            <div className={styles.searchResultLocation}>
                              📍 {user.location}
                            </div>
                          )}
                        </div>
                        {friends.has(user.id) ? (
                          <span className={styles.searchResultFriendBadge}>Znajomy</span>
                        ) : pendingFriends.has(user.id) ? (
                          <span className={styles.searchResultFriendBadge} style={{ background: 'var(--gray-200)', color: 'var(--text-secondary)' }}>Wysłane</span>
                        ) : null}
                      </div>
                    ))}
                  </>
                )}

                {searchGroupResults.length > 0 && (
                  <>
                    <div className={styles.searchDropdownHeader}>
                      <span className={styles.searchDropdownTitle}>Grupy</span>
                      <span className={styles.searchDropdownCount}>{searchGroupResults.length} wyników</span>
                    </div>
                    {searchGroupResults.map(group => (
                      <div
                        key={group.id}
                        className={styles.searchResultItem}
                        onClick={() => handleGroupResultClick(group.id)}
                      >
                        <div className={styles.searchResultAvatarWrap}>
                          <div
                            className={styles.searchResultAvatar}
                            style={{
                              background: group.coverColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '1.2rem'
                            }}
                          >
                            {group.name.charAt(0)}
                          </div>
                        </div>
                        <div className={styles.searchResultInfo}>
                          <div className={styles.searchResultName}>
                            {highlightMatch(group.name, searchQuery)}
                          </div>
                          <div className={styles.searchResultBio}>
                            {group.description.length > 60 ? group.description.slice(0, 60) + '...' : group.description}
                          </div>
                          <div className={styles.searchResultLocation}>
                            👥 {group.membersCount.toLocaleString()} członków
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {searchResults.length === 0 && searchGroupResults.length === 0 && (
                  <div className={styles.searchEmpty}>
                    <Search size={24} />
                    <span>Brak wyników dla „{searchQuery}"</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            title="Wyczyść dane (Dev)"
            onClick={handleClearData}
            style={{ color: 'var(--accent)' }}
          >
            <Trash2 size={18} />
          </button>

          <button
            className={`${styles.actionBtn} ${styles.mobileSearchBtn}`}
            onClick={() => {
              setIsMobileSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
          >
            <Search size={18} />
          </button>

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
            {unreadMessages > 0 && (
              <span className={styles.badge}>{unreadMessages}</span>
            )}
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

          {/* onToggleScenarioPanel && (
            <button
              id="btn-scenarios"
              className={styles.actionBtn}
              title="Scenariusze"
              onClick={onToggleScenarioPanel}
            >
              <Zap size={18} />
            </button>
          ) */}

          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className={styles.userAvatar}
            onClick={() => onViewProfile && onViewProfile(currentUser.id)}
            style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
          />
        </div>

        {/* Dropdowns */}
        {activeDropdown && (
          <>
            {activeDropdown === 'notifications' && (
              <div className={styles.dropdown} ref={dropdownRef}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownTitle}>Powiadomienia</span>
                </div>
                <div className={styles.dropdownBody}>
                  {notifications.map(n => {
                    const iconInfo = notifIconMap[n.type] || notifIconMap.like;
                    return (
                      <div
                        key={n.id}
                        className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ''} ${n.link ? styles.notifClickable : ''}`}
                        onClick={() => {
                          dispatch({ type: 'MARK_NOTIFICATION_READ', notificationId: n.id });
                          if (n.link && onNotificationClick) {
                            onNotificationClick(n.link);
                            closeDropdown();
                          }
                        }}
                      >
                        <div className={`${styles.notifIcon} ${styles[iconInfo.className]}`}>
                          {iconInfo.icon}
                        </div>
                        <div className={styles.notifContent}>
                          <div className={styles.notifText}>{n.message}</div>
                          <div className={styles.notifTime}>{formatTime(n.timestamp)}</div>
                        </div>
                        {n.link && (
                          <div className={styles.notifChevron}>
                            <ChevronRight size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeDropdown === 'messages' && (
              <div className={styles.dropdown} ref={dropdownRef}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownTitle}>Wiadomości</span>
                </div>
                <div className={styles.dropdownBody}>
                  {[...messages].sort((a, b) => {
                    const lastA = a.messages[a.messages.length - 1];
                    const lastB = b.messages[b.messages.length - 1];
                    const timeA = lastA ? new Date(lastA.timestamp).getTime() : 0;
                    const timeB = lastB ? new Date(lastB.timestamp).getTime() : 0;
                    return timeB - timeA;
                  }).map(thread => {
                    const lastMsg = thread.messages[thread.messages.length - 1];
                    const unread = isThreadUnread(thread);
                    return (
                      <div
                        key={thread.threadId}
                        className={`${styles.msgItem} ${unread ? styles.msgUnread : ''}`}
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
          </>
        )}
      </header>

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
