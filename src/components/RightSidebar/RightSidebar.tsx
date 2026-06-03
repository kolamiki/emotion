import styles from './RightSidebar.module.css';
import type { MessageThread, ReadThreads } from '../../types';

interface RightSidebarProps {
  messages: MessageThread[];
  readThreads: ReadThreads;
  currentUserId: string;
  onOpenChat: (threadId: string) => void;
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

export const RightSidebar: React.FC<RightSidebarProps> = ({ messages, readThreads, currentUserId, onOpenChat, onViewProfile }) => {
  const isThreadUnread = (thread: MessageThread): boolean => {
    const lastReadTs = readThreads[thread.threadId];
    const otherMessages = thread.messages.filter(m => m.senderId !== currentUserId);
    if (otherMessages.length === 0) return false;
    if (!lastReadTs) return true;
    const lastOtherMsg = otherMessages[otherMessages.length - 1];
    return new Date(lastOtherMsg.timestamp) > new Date(lastReadTs);
  };

  return (
    <div className={styles.rightSidebar}>
      {/* Contacts */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>Kontakty</div>
        {messages.map(thread => {
          const unread = isThreadUnread(thread);
          return (
          <div
            key={thread.threadId}
            className={styles.contactItem}
            onClick={() => onOpenChat(thread.threadId)}
          >
            <div className={styles.contactAvatarWrap}>
              <img
                src={thread.participant.avatarUrl}
                alt={thread.participant.name}
                className={styles.contactAvatar}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewProfile) onViewProfile(thread.participant.id);
                }}
                style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
              />
              <div className={thread.participant.isOnline ? styles.contactOnline : styles.contactOffline} />
            </div>
            <span className={`${styles.contactName} ${unread ? styles.contactNameUnread : ''}`}>{thread.participant.name}</span>
            {unread ? (
              <span className={styles.unreadBadge} />
            ) : (
              <span className={styles.contactStatus}>
                {thread.participant.isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
          );
        })}
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
