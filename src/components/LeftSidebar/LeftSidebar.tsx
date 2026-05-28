import {
  Newspaper,
  Users,
  Bookmark,
  Code,
  Gamepad2,
  Palette,
  Coffee,
  Footprints,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import styles from './LeftSidebar.module.css';
import type { User, Group, ActiveView } from '../../types';

interface LeftSidebarProps {
  currentUser: User;
  groups: Group[];
  favorites: Group[];
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onViewProfile?: (userId: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Code: <Code size={16} />,
  Gamepad2: <Gamepad2 size={16} />,
  Palette: <Palette size={16} />,
  Coffee: <Coffee size={16} />,
  Footprints: <Footprints size={16} />,
  Cpu: <Cpu size={16} />,
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentUser,
  groups,
  favorites,
  activeView,
  onNavigate,
  onViewProfile,
}) => {
  return (
    <nav className={styles.sidebar}>
      {/* Profile */}
      <div 
        className={styles.profileCard}
        onClick={() => onViewProfile?.(currentUser.id)}
        style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
      >
        <img src={currentUser.avatarUrl} alt={currentUser.name} className={styles.profileAvatar} />
        <div>
          <div className={styles.profileName}>{currentUser.name}</div>
          <div className={styles.profileLabel}>Twój profil</div>
        </div>
      </div>

      {/* Quick Nav */}
      <div className={styles.section}>
        <div className={styles.quickNav}>
          <button
            className={`${styles.quickNavBtn} ${activeView.type === 'feed' ? styles.quickNavBtnActive : ''}`}
            onClick={() => onNavigate({ type: 'feed' })}
          >
            <Newspaper size={20} />
            Feed
          </button>
          <button className={styles.quickNavBtn}>
            <Users size={20} />
            Znajomi
          </button>
          <button className={styles.quickNavBtn}>
            <Bookmark size={20} />
            Zapisane
          </button>
        </div>
      </div>

      {/* Groups */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>Twoje Grupy</div>
        {groups.map(group => {
          const isActive = activeView.type === 'group' && activeView.groupId === group.id;
          return (
            <div
              key={group.id}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={() => onNavigate({ type: 'group', groupId: group.id })}
            >
              <div
                className={styles.navIcon}
                style={{ background: group.coverColor }}
              >
                {iconMap[group.icon] || <Users size={16} />}
              </div>
              <span className={styles.navLabel}>{group.name}</span>
              <ChevronRight size={14} className={styles.navChevron} />
            </div>
          );
        })}
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>Ulubione</div>
          {favorites.map(fav => (
            <div key={fav.id} className={styles.navItem}>
              <div
                className={styles.navIcon}
                style={{ background: fav.coverColor }}
              >
                {iconMap[fav.icon] || <Bookmark size={16} />}
              </div>
              <span className={styles.navLabel}>{fav.name}</span>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
};
