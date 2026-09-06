import React, { useMemo } from 'react';
import styles from './RightSidebar.module.css';
import type { MessageThread, ReadThreads } from '../../types';
import { usersData } from '../../mockData';

interface RightSidebarProps {
  messages: MessageThread[];
  readThreads: ReadThreads;
  currentUserId: string;
  friends?: Set<string>;
  onOpenChat: (threadId: string) => void;
  onOpenChatUser?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const fakeActivity = [
  { name: 'Anna Nowak', action: 'polubiła post', target: 'Tomka Krawczyka', avatar: 'https://i.pravatar.cc/150?u=u2', time: '2 min temu', userId: 'u2' },
  { name: 'Piotr Wiśniewski', action: 'skomentował post', target: 'Marty Lewandowskiej', avatar: 'https://i.pravatar.cc/150?u=u3', time: '15 min temu', userId: 'u3' },
];

const trendingTopics = [
  { label: 'Popularne w e-Motion', tag: '#mood', count: '100.2k postów' },
  { label: 'Lifestyle', tag: '#PhotoOfTheDay', count: '20.7k postów' },
  { label: 'Technologia', tag: '#PorteFuture', count: '100.2k postów' },
  { label: 'Kultura', tag: '#wyparowanie', count: '10.2k postów' },
  { label: 'Sport', tag: '#Mundial', count: '100.2k postów' },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  messages,
  readThreads,
  currentUserId,
  friends,
  onOpenChat,
  onOpenChatUser,
  onViewProfile,
}) => {
  const contacts = useMemo(() => {
    const isThreadUnread = (thread: MessageThread): boolean => {
      const lastReadTs = readThreads[thread.threadId];
      const otherMessages = thread.messages.filter(m => m.senderId !== currentUserId);
      if (otherMessages.length === 0) return false;
      if (!lastReadTs) return true;
      const lastOtherMsg = otherMessages[otherMessages.length - 1];
      return new Date(lastOtherMsg.timestamp) > new Date(lastReadTs);
    };

    const contactMap = new Map<string, {
      userId: string;
      name: string;
      avatarUrl: string;
      isOnline: boolean;
      threadId?: string;
      unread: boolean;
    }>();

    // Add all existing message threads
    for (const thread of messages) {
      contactMap.set(thread.participant.id, {
        userId: thread.participant.id,
        name: thread.participant.name,
        avatarUrl: thread.participant.avatarUrl,
        isOnline: !!thread.participant.isOnline,
        threadId: thread.threadId,
        unread: isThreadUnread(thread),
      });
    }

    // Add friends from state.friends who might not have a message thread yet
    if (friends) {
      for (const friendId of friends) {
        if (!contactMap.has(friendId)) {
          const user = usersData.allUsers.find(u => u.id === friendId);
          if (user) {
            contactMap.set(user.id, {
              userId: user.id,
              name: user.name,
              avatarUrl: user.avatarUrl,
              isOnline: !!user.isOnline,
              unread: false,
            });
          }
        }
      }
    }

    const list = Array.from(contactMap.values());
    return list.sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.name.localeCompare(b.name, 'pl');
    });
  }, [messages, friends, readThreads, currentUserId]);

  return (
    <div className={styles.rightSidebar}>
      {/* Contacts */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>Kontakty ({contacts.length})</div>
        {contacts.map(contact => (
          <div
            key={contact.userId}
            className={styles.contactItem}
            onClick={() => {
              if (onOpenChatUser) {
                onOpenChatUser(contact.userId);
              } else if (contact.threadId) {
                onOpenChat(contact.threadId);
              }
            }}
          >
            <div className={styles.contactAvatarWrap}>
              <img
                src={contact.avatarUrl}
                alt={contact.name}
                className={styles.contactAvatar}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewProfile) onViewProfile(contact.userId);
                }}
                style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
              />
              <div className={contact.isOnline ? styles.contactOnline : styles.contactOffline} />
            </div>
            <span className={`${styles.contactName} ${contact.unread ? styles.contactNameUnread : ''}`}>
              {contact.name}
            </span>
            {contact.unread ? (
              <span className={styles.unreadBadge} />
            ) : (
              <span className={styles.contactStatus}>
                {contact.isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>Ostatnia aktywność</div>
        {fakeActivity.map((item, i) => (
          <div key={i} className={styles.activityItem}>
            <img
              src={item.avatar}
              alt={item.name}
              className={styles.activityAvatar}
              onClick={() => onViewProfile && onViewProfile(item.userId)}
              style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
            />
            <div>
              <div className={styles.activityText}>
                <span className={styles.activityName}>{item.name}</span>{' '}
                {item.action}{' '}
                <span className={styles.activityName}>{item.target}</span>
              </div>
              <div className={styles.activityTime}>{item.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trending */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>Trendy</div>
        {trendingTopics.map((topic, i) => (
          <div key={i} className={styles.trendingItem}>
            <div className={styles.trendingLabel}>{topic.label}</div>
            <div className={styles.trendingTag}>{topic.tag}</div>
            <div className={styles.trendingCount}>{topic.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
