import styles from './RightSidebar.module.css';
import type { MessageThread } from '../../types';

interface RightSidebarProps {
  messages: MessageThread[];
  onOpenChat: (threadId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const fakeActivity = [
  { name: 'Anna Nowak', action: 'polubiła post', target: 'Tomka Krawczyka', avatar: 'https://i.pravatar.cc/150?u=u2', time: '2 min temu', userId: 'u2' },
  { name: 'Kasia Zielińska', action: 'dodała nowy post w', target: 'Design i UX', avatar: 'https://i.pravatar.cc/150?u=u4', time: '8 min temu', userId: 'u4' },
  { name: 'Piotr Wiśniewski', action: 'skomentował post', target: 'Marty Lewandowskiej', avatar: 'https://i.pravatar.cc/150?u=u3', time: '15 min temu', userId: 'u3' },
  { name: 'Marta Lewandowska', action: 'dołączyła do grupy', target: 'Biegacze Amatorzy', avatar: 'https://i.pravatar.cc/150?u=u6', time: '32 min temu', userId: 'u6' },
];

const trendingTopics = [
  { label: 'Popularne w e-Motion', tag: '#React20', count: '1.2k postów' },
  { label: 'Trending', tag: '#WeekendWGórach', count: '847 postów' },
  { label: 'Technologia', tag: '#TypeScript', count: '2.1k postów' },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({ messages, onOpenChat, onViewProfile }) => {
  return (
    <div className={styles.rightSidebar}>
      {/* Contacts */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>Kontakty</div>
        {messages.map(thread => (
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
            <span className={styles.contactName}>{thread.participant.name}</span>
            <span className={styles.contactStatus}>
              {thread.participant.isOnline ? 'Online' : 'Offline'}
            </span>
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
