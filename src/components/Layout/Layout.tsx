import { useState } from 'react';
import styles from './Layout.module.css';
import { TopBar } from '../TopBar/TopBar';
import { LeftSidebar } from '../LeftSidebar/LeftSidebar';
import { Feed } from '../Feed/Feed';
import { GroupView } from '../GroupView/GroupView';
import { RightSidebar } from '../RightSidebar/RightSidebar';
import { ChatContainer } from '../Chat/ChatContainer';
import { ProfilePreview } from '../ProfilePreview/ProfilePreview';
import { useAppStore } from '../../store/appStore';
import { usersData } from '../../mockData';
import type { ActiveView, MessageThread } from '../../types';

export const Layout: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const [activeChats, setActiveChats] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'feed' });
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);

  const handleOpenChat = (threadId: string) => {
    setActiveChats(prev =>
      prev.includes(threadId) ? prev : [...prev, threadId]
    );
  };

  const handleCloseChat = (threadId: string) => {
    setActiveChats(prev => prev.filter(id => id !== threadId));
  };

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
  };

  const handleOpenCreatePost = () => {
    setIsCreatePostOpen(true);
  };

  const handleViewProfile = (userId: string) => {
    setViewedUserId(userId);
  };

  const activeThreads: MessageThread[] = activeChats
    .map(id => state.messages.find(m => m.threadId === id))
    .filter((t): t is MessageThread => t !== undefined);

  const currentGroup =
    activeView.type === 'group'
      ? state.groups.find(g => g.id === activeView.groupId)
      : null;

  const viewedUser = viewedUserId
    ? usersData.allUsers.find(u => u.id === viewedUserId)
    : null;

  return (
    <div className={styles.layoutContainer}>
      <TopBar
        currentUser={state.currentUser}
        notifications={state.notifications}
        messages={state.messages}
        onOpenChat={handleOpenChat}
        onNavigateHome={() => handleNavigate({ type: 'feed' })}
        isCreatePostOpen={isCreatePostOpen}
        onOpenCreatePost={handleOpenCreatePost}
        onCloseCreatePost={() => setIsCreatePostOpen(false)}
        dispatch={dispatch}
        onViewProfile={handleViewProfile}
      />

      <main className={styles.mainGrid}>
        <aside className={styles.leftColumn}>
          <LeftSidebar
            currentUser={state.currentUser}
            groups={state.groups}
            favorites={state.favorites}
            activeView={activeView}
            onNavigate={handleNavigate}
            onViewProfile={handleViewProfile}
          />
        </aside>

        <section className={styles.middleColumn}>
          <div className={styles.feedContainer}>
            {activeView.type === 'feed' && (
              <Feed
                posts={state.posts}
                currentUser={state.currentUser}
                likedPosts={state.likedPosts}
                dispatch={dispatch}
                onOpenCreatePost={handleOpenCreatePost}
                onViewProfile={handleViewProfile}
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
              />
            )}
          </div>
        </section>

        <aside className={styles.rightColumn}>
          <RightSidebar
            messages={state.messages}
            onOpenChat={handleOpenChat}
            onViewProfile={handleViewProfile}
          />
        </aside>
      </main>

      <ChatContainer
        threads={activeThreads}
        currentUserId={state.currentUser.id}
        typing={state.typing}
        dispatch={dispatch}
        onClose={handleCloseChat}
        onViewProfile={handleViewProfile}
      />

      {viewedUser && (
        <ProfilePreview
          user={viewedUser}
          currentUserId={state.currentUser.id}
          groups={state.groups}
          posts={state.posts}
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
    </div>
  );
};

