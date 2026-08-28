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
  Trophy,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import styles from './LeftSidebar.module.css';
import type { User, Group, ActiveView } from '../../types';
import { useDailyChallengeState } from '../../hooks/useDailyChallengeState';

interface LeftSidebarProps {
  currentUser: User;
  groups: Group[];
  favorites: Group[];
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onViewProfile?: (userId: string) => void;
  isBanned?: boolean;
  isQuestActivated?: boolean;
  questProgressPercent?: number;
  activeQuestTitle?: string;
  onOpenQuestTracker?: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Code: <Code size={16} />,
  Gamepad2: <Gamepad2 size={16} />,
  Palette: <Palette size={16} />,
  Coffee: <Coffee size={16} />,
  Footprints: <Footprints size={16} />,
  Cpu: <Cpu size={16} />,
  AlertTriangle: <AlertTriangle size={16} />,
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentUser,
  groups,
  favorites,
  activeView,
  onNavigate,
  onViewProfile,
  isBanned,
  isQuestActivated,
  questProgressPercent = 0,
  activeQuestTitle = 'Śledztwo w toku',
  onOpenQuestTracker,
}) => {
  const { levelInfo } = useDailyChallengeState();

  const handleGroupClick = (groupId: string) => {
    if (isBanned) {
      alert('Dostęp do grup został zablokowany z powodu zawieszenia konta (§ 12.3 Regulaminu eMotion). Osiągnij Poziom 5 w Wyzwaniach Dnia, aby zdjąć blokadę.');
      return;
    }
    onNavigate({ type: 'group', groupId });
  };

  return (
    <nav className={styles.sidebar} id="tour-sidebar-left">
      {/* Profile */}
      <div
        className={styles.profileCard}
        onClick={() => onViewProfile?.(currentUser.id)}
        style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
      >
        <img src={currentUser.avatarUrl} alt={currentUser.name} className={styles.profileAvatar} />
        <div className={styles.profileMeta}>
          <div className={styles.profileName}>{currentUser.name}</div>
          <div className={styles.profileSubRow}>
            <span className={styles.profileLabel}>Twój profil</span>
            <span className={styles.levelBadgeMini}>
              <Trophy size={10} /> Poz. {levelInfo.level}
            </span>
          </div>
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
          <button
            className={`${styles.quickNavBtn} ${activeView.type === 'friends' ? styles.quickNavBtnActive : ''}`}
            onClick={() => onNavigate({ type: 'friends' })}
          >
            <Users size={20} />
            Znajomi
          </button>
          <button
            id="tour-daily-challenge"
            className={`${styles.quickNavBtn} ${activeView.type === 'daily_challenge' ? styles.quickNavBtnActive : ''}`}
            onClick={() => onNavigate({ type: 'daily_challenge' })}
          >
            <Trophy size={20} />
            Wyzwanie dnia
          </button>
        </div>
      </div>

      {/* Quest Tracker (Activates after first interaction with Marinette) */}
      {isQuestActivated && (
        <div className={styles.questSection}>
          <button
            className={styles.questTrackerBtn}
            onClick={onOpenQuestTracker}
            title="Otwórz Dziennik Śledztwa i listę zadań"
          >
            <div className={styles.questTrackerIconWrap}>
              <Compass size={20} className={styles.questCompassIcon} />
            </div>
            <div className={styles.questTrackerText}>
              <div className={styles.questTrackerTitleRow}>
                <span className={styles.questTrackerLabel}>Zadania</span>
                <span className={styles.questTrackerProgressBadge}>{questProgressPercent}%</span>
              </div>
              <div className={styles.questTrackerDesc}>
                {activeQuestTitle}
              </div>
            </div>
            <ChevronRight size={16} className={styles.questTrackerChevron} />
          </button>
        </div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>Ulubione</div>
          {favorites.map(fav => {
            const isActive = activeView.type === 'group' && activeView.groupId === fav.id;
            return (
              <div
                key={fav.id}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${isBanned ? styles.navItemDisabled : ''}`}
                onClick={() => handleGroupClick(fav.id)}
                title={isBanned ? "Konto zawieszone — grupy zablokowane (§ 12.3 ToS)" : fav.name}
              >
                <div
                  className={styles.navIcon}
                  style={{ background: fav.coverColor }}
                >
                  {iconMap[fav.icon] || <Bookmark size={16} />}
                </div>
                <span className={styles.navLabel}>{fav.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Groups */}
      <div className={styles.section} id="tour-groups">
        <div className={styles.sectionHeader}>Twoje Grupy</div>
        {groups.filter(g => g.isMember && !favorites.some(f => f.id === g.id)).map(group => {
          const isActive = activeView.type === 'group' && activeView.groupId === group.id;
          return (
            <div
              key={group.id}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${isBanned ? styles.navItemDisabled : ''}`}
              onClick={() => handleGroupClick(group.id)}
              title={isBanned ? "Konto zawieszone — grupy zablokowane (§ 12.3 ToS)" : group.name}
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
        {groups.filter(g => g.isMember && !favorites.some(f => f.id === g.id)).length === 0 && (
          <div className={styles.emptyState}>Brak innych grup</div>
        )}
      </div>

      {/* Recommended Groups */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>Polecane grupy</div>
        {groups.filter(g => !g.isMember && g.id !== 'g_szukam').slice(0, 3).map(group => {
          const isActive = activeView.type === 'group' && activeView.groupId === group.id;
          return (
            <div
              key={group.id}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${isBanned ? styles.navItemDisabled : ''}`}
              onClick={() => handleGroupClick(group.id)}
              title={isBanned ? "Konto zawieszone — grupy zablokowane (§ 12.3 ToS)" : group.name}
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
    </nav>
  );
};
