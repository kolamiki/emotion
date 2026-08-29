import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Layout.module.css';
import { TopBar } from '../TopBar/TopBar';
import { LeftSidebar } from '../LeftSidebar/LeftSidebar';
import { Feed } from '../Feed/Feed';
import { GroupView } from '../GroupView/GroupView';
import { RightSidebar } from '../RightSidebar/RightSidebar';
import { ChatContainer } from '../Chat/ChatContainer';
import { ProfilePreview } from '../ProfilePreview/ProfilePreview';
import { ScenarioPanel } from '../ScenarioPanel/ScenarioPanel';
import { FriendsList } from '../FriendsList/FriendsList';
import { DailyChallenge } from '../DailyChallenge/DailyChallenge';
import { useAppStore } from '../../store/appStore';
import { ScenarioManager } from '../../store/scenarioEngine';
import { scheduleGroupJoinAdminResponse } from '../../store/responseEngine';
import { usersData } from '../../mockData';
import type { ActiveView, MessageThread, NotificationLink, Message } from '../../types';
import { ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useDailyChallengeState } from '../../hooks/useDailyChallengeState';
import { useQuestSystem } from '../../hooks/useQuestSystem';
import { ToastContainer } from '../Toast/ToastContainer';
import { QuestModal } from '../QuestTracker/QuestModal';
import { TutorialOverlay, type TourStep } from '../Tutorial/TutorialOverlay';

export const Layout: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const { levelInfo } = useDailyChallengeState();
  const { questState, toasts, dismissToast } = useQuestSystem(state);
  const [activeChats, setActiveChats] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'feed' });
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [isScenarioPanelOpen, setIsScenarioPanelOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

  // Check IS_DEV mode for tutorial
  const isDevMode =
    import.meta.env.IS_DEV === 'true' ||
    import.meta.env.VITE_IS_DEV === 'true';

  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    if (isDevMode) return false;
    return localStorage.getItem('emotion-tutorial-completed') !== 'true';
  });

  const [hasOpenedQuestTracker, setHasOpenedQuestTracker] = useState<boolean>(() => {
    return localStorage.getItem('emotion-quest-tracker-opened') === 'true';
  });

  const handleOpenQuestTracker = () => {
    setIsQuestModalOpen(true);
    if (!hasOpenedQuestTracker) {
      setHasOpenedQuestTracker(true);
      localStorage.setItem('emotion-quest-tracker-opened', 'true');
    }
  };

  // Message tracking for automatic chat popups
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef(true);

  // Scenario Manager ref - stable reference across renders
  const scenarioManagerRef = useRef<ScenarioManager | null>(null);

  // Initialize ScenarioManager once
  useEffect(() => {
    const manager = new ScenarioManager(dispatch, () => state);
    scenarioManagerRef.current = manager;

    // Start timer scenarios only if tutorial is NOT currently open
    if (!isTutorialOpen) {
      manager.startTimerScenarios();
    }

    return () => {
      manager.destroy();
      scenarioManagerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleTourStepChange = useCallback((_stepIndex: number, step: TourStep) => {
    if (window.innerWidth <= 768) {
      if (step.requiresMobileSidebar) {
        setIsMobileSidebarOpen(true);
      } else {
        setIsMobileSidebarOpen(false);
      }
    }
  }, []);

  const handleCompleteTutorial = () => {
    localStorage.setItem('emotion-tutorial-completed', 'true');
    setIsTutorialOpen(false);
    setIsMobileSidebarOpen(false);
    // Start scenario timer (e.g. Marinette 30s delay) after tutorial closes
    scenarioManagerRef.current?.startTimerScenarios();
  };

  // Keep the getState closure up to date
  useEffect(() => {
    if (scenarioManagerRef.current) {
      (scenarioManagerRef.current as unknown as { getState: () => typeof state }).getState = () => state;
    }
  }, [state]);

  // Auto-open incoming chat messages immediately in window for player immersion
  useEffect(() => {
    if (isInitialMountRef.current) {
      state.messages.forEach(thread => {
        thread.messages.forEach(msg => seenMessageIdsRef.current.add(msg.id));
      });
      isInitialMountRef.current = false;
      return;
    }

    state.messages.forEach(thread => {
      thread.messages.forEach(msg => {
        if (!seenMessageIdsRef.current.has(msg.id)) {
          seenMessageIdsRef.current.add(msg.id);
          if (msg.senderId !== state.currentUser.id) {
            handleOpenChat(thread.threadId);
          }
        }
      });
    });
  }, [state.messages, state.currentUser.id]);

  // Auto-unban monitoring: Level 5 in daily challenges triggers Damian's unban
  useEffect(() => {
    if (state.isBanned && levelInfo.level >= 5) {
      dispatch({ type: 'SET_BANNED', isBanned: false });

      setTimeout(() => {
        const damianThreadId = 't_u_damian';
        const damianMsg: Message = {
          id: `damian-unban-${Date.now()}`,
          senderId: 'u_damian',
          text: 'Pięknie! Skrypt odwoławczy przeszedł pomyślnie i ban został zdjęty! 🚀 Masz znowu pełen dostęp do serwisu. Wejdź teraz do grupy STOP Szarlatanom i przejrzyj posty – znajdziesz tam coś bardzo ciekawego o Natalie...',
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId: damianThreadId, message: damianMsg });
      }, 1000);
    }
  }, [state.isBanned, levelInfo.level, dispatch]);

  // Manage max active chats based on window size
  useEffect(() => {
    const handleResize = () => {
      const maxChats = window.innerWidth <= 768 ? 1 : 2;
      setActiveChats(prev => {
        if (prev.length > maxChats) {
          return prev.slice(0, maxChats);
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenChat = (threadId: string) => {
    setActiveChats(prev => {
      const maxChats = window.innerWidth <= 768 ? 1 : 2;
      const withoutNew = prev.filter(id => id !== threadId);
      // Place newest chat at index 0 so it is always first/most prominent
      const next = [threadId, ...withoutNew];
      return next.slice(0, maxChats);
    });
    dispatch({ type: 'MARK_THREAD_READ', threadId });
  };

  const handleCloseChat = (threadId: string) => {
    setActiveChats(prev => prev.filter(id => id !== threadId));
  };

  // Track if Marinette's Filmowe polecajki reaction has fired
  const marinetteFilmClueTriggeredRef = useRef<boolean>(false);

  // Reactive Marinette trigger: when in Filmowe polecajki (g1) AND missing post is liked
  useEffect(() => {
    if (activeView.type === 'group' && activeView.groupId === 'g1' && !marinetteFilmClueTriggeredRef.current) {
      const isMissingPostLiked = !!state.likedPosts['gp_missing_1'];

      if (isMissingPostLiked) {
        marinetteFilmClueTriggeredRef.current = true;
        const existingMarinette = state.messages.find(m => m.participant.id === 'u_marinette');
        const marinetteThreadId = existingMarinette ? existingMarinette.threadId : 't_u_marinette';

        setTimeout(() => {
          const msg1: Message = {
            id: `marinette-clue-1-${Date.now()}`,
            senderId: 'u_marinette',
            text: 'Hej! Dziękuję Ci bardzo za zaangażowanie i polubienie mojego posta w grupie poszukiwawczej! 💛 Czy udało Ci się natrafić na jakieś poszlaki albo tropy w sprawie Natalie?',
            timestamp: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId: marinetteThreadId, message: msg1 });

          setTimeout(() => {
            const msg2: Message = {
              id: `marinette-clue-2-${Date.now()}`,
              senderId: 'u_marinette',
              text: 'Widziałam te okropne komentarze sugerujące porwanie z zemsty... Nie rozumiem ludzi, którzy tak piszą. Natalie była naprawdę sympatyczną dziewczyną! Fakt, miewała ostry język i nie gryzła się w niego, ale to nie przekreśla jej joako osoby.',
              timestamp: new Date().toISOString(),
            };
            dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId: marinetteThreadId, message: msg2 });
          }, 3500);
        }, 1500);
      }
    }
  }, [activeView, state.likedPosts, state.messages, dispatch]);

  // Auto-redirect out of group if banned
  useEffect(() => {
    if (state.isBanned && activeView.type === 'group') {
      setActiveView({ type: 'feed' });
    }
  }, [state.isBanned, activeView.type]);

  const handleNavigate = (view: ActiveView) => {
    // If user is banned and tries to navigate to a group, block it
    if (view.type === 'group' && state.isBanned) {
      alert('Dostęp do grup został zablokowany z powodu zawieszenia konta (§ 12.3 Regulaminu eMotion).');
      return;
    }

    // If a component registered a navigation block, ask for confirmation
    if (typeof window !== 'undefined' && (window as any).confirmNavigation) {
      if (!(window as any).confirmNavigation()) {
        return; // User cancelled navigation
      }
    }

    setActiveView(view);

    // Trigger scenario engine on group enter
    if (view.type === 'group' && scenarioManagerRef.current) {
      scenarioManagerRef.current.trigger('group_enter', view.groupId);
    }

    // Close mobile sidebar on navigate
    setIsMobileSidebarOpen(false);
  };

  const handleOpenCreatePost = () => {
    setIsCreatePostOpen(true);
  };

  const handleViewProfile = (userId: string) => {
    setViewedUserId(userId);
  };

  const handleNotificationClick = (link: NotificationLink) => {
    switch (link.type) {
      case 'post':
        handleNavigate({ type: 'feed' });
        if (link.postId) {
          // Short delay to let the feed render before scrolling
          setTimeout(() => setHighlightedPostId(link.postId!), 100);
        }
        break;
      case 'group':
        if (link.groupId && link.groupId !== '*') {
          handleNavigate({ type: 'group', groupId: link.groupId });
        }
        break;
      case 'profile':
        if (link.userId) handleViewProfile(link.userId);
        break;
      case 'chat':
        if (link.threadId) handleOpenChat(link.threadId);
        break;
    }
  };

  const handleToggleFriend = (userId: string) => {
    if (state.friends.has(userId)) {
      dispatch({ type: 'REMOVE_FRIEND', userId });
    } else {
      dispatch({ type: 'ADD_PENDING_FRIEND', userId });

      if (userId === 'u_matylda') {
        if (scenarioManagerRef.current) {
          scenarioManagerRef.current.runScenario('sc_matylda_friend_request');
        }
      } else {
        // Domyślny timer dla innych użytkowników
        setTimeout(() => {
          dispatch({ type: 'ACCEPT_FRIEND', userId });

          const user = usersData.allUsers.find(u => u.id === userId);
          if (user) {
            dispatch({
              type: 'ADD_NOTIFICATION',
              notification: {
                id: `n-acc-${Date.now()}`,
                type: 'friend',
                message: `${user.name} zaakceptował(a) Twoje zaproszenie do znajomych.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                link: { type: 'profile', userId: user.id }
              }
            });
          }
        }, 15000);
      }
    }
  };

  const handleRequestGroupJoin = (groupId: string) => {
    dispatch({ type: 'SET_GROUP_PENDING_JOIN', groupId });
    const targetGroup = state.groups.find(g => g.id === groupId);
    if (targetGroup) {
      scheduleGroupJoinAdminResponse(dispatch, targetGroup, state.currentUser, state.messages);
    }
  };

  // Derive active message threads
  const activeThreads: MessageThread[] = activeChats
    .map(id => state.messages.find(m => m.threadId === id))
    .filter((t): t is MessageThread => t !== undefined);

  const currentGroup =
    activeView.type === 'group'
      ? state.groups.find(g => g.id === activeView.groupId)
      : null;

  const viewedUser = viewedUserId
    ? (viewedUserId === state.currentUser.id
      ? state.currentUser
      : usersData.allUsers.find(u => u.id === viewedUserId))
    : null;

  // Active quest stage for LeftSidebar display
  const activeStage = questState.stages.find(s => s.isActive);
  const activeQuestTitle = activeStage ? `Rozdział ${activeStage.stageNumber}: ${activeStage.title}` : 'Dziennik Śledztwa';
  const hasQuestAttention = Boolean(questState.isActivated && !hasOpenedQuestTracker);

  return (
    <div className={styles.layoutContainer}>
      <TopBar
        currentUser={state.currentUser}
        notifications={state.notifications}
        messages={state.messages}
        readThreads={state.readThreads}
        onOpenChat={handleOpenChat}
        onNavigateHome={() => handleNavigate({ type: 'feed' })}
        isCreatePostOpen={isCreatePostOpen}
        onOpenCreatePost={handleOpenCreatePost}
        onCloseCreatePost={() => setIsCreatePostOpen(false)}
        dispatch={dispatch}
        onViewProfile={handleViewProfile}
        groups={state.groups}
        friends={state.friends}
        pendingFriends={state.pendingFriends}
        pendingGroupJoins={state.pendingGroupJoins}
        onNavigate={handleNavigate}
        onNotificationClick={handleNotificationClick}
      />

      <main className={styles.mainGrid}>
        {/* Mobile Overlay */}
        <div
          className={`${styles.mobileOverlay} ${isMobileSidebarOpen ? styles.open : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        <aside className={`${styles.leftColumn} ${isMobileSidebarOpen ? styles.open : ''}`}>
          <LeftSidebar
            currentUser={state.currentUser}
            groups={state.groups}
            favorites={state.favorites}
            activeView={activeView}
            onNavigate={handleNavigate}
            onViewProfile={handleViewProfile}
            isBanned={state.isBanned}
            isQuestActivated={questState.isActivated}
            questProgressPercent={questState.activeStagePercent}
            activeQuestTitle={activeQuestTitle}
            onOpenQuestTracker={handleOpenQuestTracker}
            hasQuestAttention={hasQuestAttention}
          />
        </aside>

        {/* Mobile Toggle Button */}
        <button
          className={`${styles.mobileMenuBtn} ${isMobileSidebarOpen ? styles.mobileMenuBtnOpen : ''} ${hasQuestAttention && !isMobileSidebarOpen ? styles.mobileMenuBtnAttention : ''}`}
          onClick={() => setIsMobileSidebarOpen(prev => !prev)}
          title={hasQuestAttention ? "Nowe zadanie fabularne! Otwórz menu" : "Menu"}
        >
          {isMobileSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        <section className={styles.middleColumn} id="tour-feed">
          <div className={styles.feedContainer}>
            {state.isBanned && (
              <div className={styles.banBanner}>
                <div className={styles.banBannerContent}>
                  <AlertTriangle size={20} className={styles.banBannerIcon} />
                  <div>
                    <strong className={styles.banBannerTitle}>
                      Konto zawieszone (§ 12.3 Regulaminu eMotion)
                    </strong>
                    <p className={styles.banBannerText}>
                      Twoje konto zostało tymczasowo zablokowane z powodu publikacji treści naruszających dobre imię PrimeCo. Publikowanie postów, komentarzy i przeglądanie grup zostało zawieszone. Dostępne pozostają: Czat oraz Wyzwania Dnia (§ 8.4 ToS).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeView.type === 'feed' && (
              <Feed
                posts={state.posts}
                currentUser={state.currentUser}
                likedPosts={state.likedPosts}
                dispatch={dispatch}
                matyldaLikesActive={state.matyldaLikesActive}
                onOpenCreatePost={handleOpenCreatePost}
                onViewProfile={handleViewProfile}
                highlightedPostId={highlightedPostId}
                onClearHighlight={() => setHighlightedPostId(null)}
                isBanned={state.isBanned}
              />
            )}
            {activeView.type === 'group' && currentGroup && (
              <GroupView
                group={currentGroup}
                currentUser={state.currentUser}
                likedPosts={state.likedPosts}
                dispatch={dispatch}
                onBack={() => handleNavigate({ type: 'feed' })}
                onViewProfile={handleViewProfile}
                onPostCreated={() => {
                  // Trigger scenario engine on group post
                  if (scenarioManagerRef.current && activeView.type === 'group') {
                    scenarioManagerRef.current.trigger('group_post', activeView.groupId);
                  }
                }}
                pendingGroupJoins={state.pendingGroupJoins}
                onRequestGroupJoin={handleRequestGroupJoin}
                isBanned={state.isBanned}
              />
            )}
            {activeView.type === 'friends' && (
              <FriendsList
                currentUser={state.currentUser}
                onViewProfile={handleViewProfile}
                friends={state.friends}
                pendingFriends={state.pendingFriends}
                onToggleFriend={handleToggleFriend}
              />
            )}
            {activeView.type === 'daily_challenge' && (
              <DailyChallenge
                currentUserName={state.currentUser.name}
                currentUserAvatar={state.currentUser.avatarUrl}
              />
            )}
          </div>
        </section>

        <aside className={styles.rightColumn} id="tour-friends">
          <RightSidebar
            messages={state.messages}
            readThreads={state.readThreads}
            currentUserId={state.currentUser.id}
            onOpenChat={handleOpenChat}
            onViewProfile={handleViewProfile}
          />
        </aside>
      </main>

      <ChatContainer
        threads={activeThreads}
        currentUserId={state.currentUser.id}
        currentUserName={state.currentUser.name}
        typing={state.typing}
        dispatch={dispatch}
        onClose={handleCloseChat}
        onViewProfile={handleViewProfile}
        pendingFriends={state.pendingFriends}
        pendingGroupJoins={state.pendingGroupJoins}
      />

      {viewedUser && (
        <ProfilePreview
          user={viewedUser}
          currentUserId={state.currentUser.id}
          groups={state.groups}
          posts={state.posts}
          friends={state.friends}
          pendingFriends={state.pendingFriends}
          onToggleFriend={handleToggleFriend}
          onClose={() => setViewedUserId(null)}
          onOpenChat={(userId) => {
            // Find or create chat thread
            const existingThread = state.messages.find(m => m.participant.id === userId);
            if (existingThread) {
              handleOpenChat(existingThread.threadId);
            }
          }}
        />
      )}

      <ScenarioPanel
        isOpen={isScenarioPanelOpen}
        onClose={() => setIsScenarioPanelOpen(false)}
        scenarioManager={scenarioManagerRef.current}
      />

      {/* Quest Tracker Modal Dialog */}
      <QuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        questState={questState}
      />

      {/* Floating Quest Toasts */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onClickToast={handleOpenQuestTracker}
      />

      {/* Interactive Onboarding Spotlight Tutorial */}
      <TutorialOverlay
        isOpen={isTutorialOpen}
        onComplete={handleCompleteTutorial}
        onStepChange={handleTourStepChange}
      />
    </div>
  );
};
