import { useState, useEffect, useRef } from 'react';
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
import type { ActiveView, MessageThread, NotificationLink } from '../../types';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export const Layout: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const [activeChats, setActiveChats] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'feed' });
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [isScenarioPanelOpen, setIsScenarioPanelOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

  // Scenario Manager ref - stable reference across renders
  const scenarioManagerRef = useRef<ScenarioManager | null>(null);

  // Initialize ScenarioManager once
  useEffect(() => {
    const manager = new ScenarioManager(dispatch, () => state);
    scenarioManagerRef.current = manager;
    manager.startTimerScenarios();

    return () => {
      manager.destroy();
      scenarioManagerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Keep the getState closure up to date
  useEffect(() => {
    if (scenarioManagerRef.current) {
      (scenarioManagerRef.current as unknown as { getState: () => typeof state }).getState = () => state;
    }
  }, [state]);

  // Manage max active chats based on window size
  useEffect(() => {
    const handleResize = () => {
      const maxChats = window.innerWidth <= 768 ? 1 : 2;
      setActiveChats(prev => {
        if (prev.length > maxChats) {
          return prev.slice(-maxChats);
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
      const next = [...withoutNew, threadId];
      return next.slice(-maxChats);
    });
    dispatch({ type: 'MARK_THREAD_READ', threadId });
  };

  const handleCloseChat = (threadId: string) => {
    setActiveChats(prev => prev.filter(id => id !== threadId));
  };

  const handleNavigate = (view: ActiveView) => {
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
          />
        </aside>

        {/* Mobile Toggle Button */}
        <button
          className={`${styles.mobileMenuBtn} ${isMobileSidebarOpen ? styles.mobileMenuBtnOpen : ''}`}
          onClick={() => setIsMobileSidebarOpen(prev => !prev)}
        >
          {isMobileSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        <section className={styles.middleColumn}>
          <div className={styles.feedContainer}>
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

        <aside className={styles.rightColumn}>
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
    </div>
  );
};
