import { useState, useRef, useEffect } from 'react';
import { X, Send, Minus } from 'lucide-react';
import styles from './Chat.module.css';
import type { MessageThread, Message, AppAction, TypingState } from '../../types';
import { scheduleChatResponse } from '../../store/responseEngine';
import { usersData } from '../../mockData';

interface ChatContainerProps {
  threads: MessageThread[];
  currentUserId: string;
  currentUserName: string;
  typing: TypingState;
  dispatch: React.Dispatch<AppAction>;
  pendingFriends: Set<string>;
  pendingGroupJoins?: Set<string>;
  hasAntiPrimePost?: boolean;
  readThreads?: Record<string, string>;
  minimizedChatIds: Set<string>;
  onMinimize: (threadId: string) => void;
  onRestore: (threadId: string) => void;
  onClose: (threadId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  threads,
  currentUserId,
  currentUserName,
  typing,
  dispatch,
  pendingFriends,
  pendingGroupJoins,
  hasAntiPrimePost,
  readThreads,
  minimizedChatIds,
  onMinimize,
  onRestore,
  onClose,
  onViewProfile,
}) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const expandedThreads = threads.filter(t => !minimizedChatIds.has(t.threadId));
  const minimizedThreads = threads.filter(t => minimizedChatIds.has(t.threadId));

  // On mobile: show active expanded thread if open, otherwise show minimized folder stack
  // On desktop: show minimized folder stack at right edge, expanded windows to its left
  const visibleExpanded = isMobile && expandedThreads.length > 0
    ? [expandedThreads[0]]
    : expandedThreads;

  const showMinimizedStack = minimizedThreads.length > 0 && (!isMobile || expandedThreads.length === 0);

  return (
    <div className={styles.chatContainer}>
      {/* 1. Minimized Folder Stack - docked at the far right edge, layered like folder cards */}
      {showMinimizedStack && (
        <div className={styles.minimizedFolderStack}>
          {minimizedThreads.map((thread, index) => (
            <MinimizedChatTab
              key={thread.threadId}
              thread={thread}
              index={index}
              total={minimizedThreads.length}
              isMobile={isMobile}
              currentUserId={currentUserId}
              isTyping={!!typing[thread.threadId]}
              readThreads={readThreads}
              onRestore={() => onRestore(thread.threadId)}
              onClose={() => onClose(thread.threadId)}
            />
          ))}
        </div>
      )}

      {/* 2. Expanded Chat Windows sit to the left of the minimized folder stack */}
      {visibleExpanded.map(thread => (
        <ChatWindow
          key={thread.threadId}
          thread={thread}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isTyping={!!typing[thread.threadId]}
          dispatch={dispatch}
          pendingFriends={pendingFriends}
          pendingGroupJoins={pendingGroupJoins}
          onMinimize={() => onMinimize(thread.threadId)}
          onClose={() => onClose(thread.threadId)}
          onViewProfile={onViewProfile}
          hasAntiPrimePost={hasAntiPrimePost}
        />
      ))}
    </div>
  );
};

interface MinimizedChatTabProps {
  thread: MessageThread;
  index: number;
  total: number;
  isMobile: boolean;
  currentUserId: string;
  isTyping: boolean;
  readThreads?: Record<string, string>;
  onRestore: () => void;
  onClose: () => void;
}

const MinimizedChatTab: React.FC<MinimizedChatTabProps> = ({
  thread,
  index,
  total: _total,
  isMobile,
  currentUserId,
  isTyping,
  readThreads,
  onRestore,
  onClose,
}) => {
  const liveUser = usersData.allUsers.find(u => u.id === thread.participant.id);
  const participantAvatar = liveUser?.avatarUrl || thread.participant.avatarUrl;
  const participantName = liveUser?.name || thread.participant.name;

  const isUnread = (() => {
    const otherMessages = thread.messages.filter(m => m.senderId !== currentUserId);
    if (otherMessages.length === 0) return false;
    const lastOtherMsg = otherMessages[otherMessages.length - 1];
    const lastReadTs = readThreads?.[thread.threadId];
    if (!lastReadTs) return true;
    return new Date(lastOtherMsg.timestamp) > new Date(lastReadTs);
  })();

  // Shift subsequent tabs to overlap previous ones horizontally, like index divider tabs in a folder
  const overlapMargin = index > 0 ? (isMobile ? -100 : -118) : 0;

  return (
    <div
      className={`${styles.folderTab} ${isUnread ? styles.folderTabUnread : ''}`}
      style={{
        zIndex: 10 + index,
        marginLeft: `${overlapMargin}px`,
      }}
      onClick={onRestore}
      title={`Otwórz czat: ${participantName}`}
    >
      <div className={styles.folderTabAvatarWrap}>
        <img src={participantAvatar} alt={participantName} className={styles.folderTabAvatar} />
        {thread.participant.isOnline && <div className={styles.folderTabOnline} />}
      </div>
      <span className={styles.folderTabName}>{participantName}</span>
      {isTyping && <span className={styles.folderTabTyping}>pisze...</span>}
      {isUnread && <span className={styles.folderTabUnreadDot} />}
      <button
        type="button"
        className={styles.folderTabCloseBtn}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Zamknij czat"
      >
        <X size={13} />
      </button>
    </div>
  );
};

interface ChatWindowProps {
  thread: MessageThread;
  currentUserId: string;
  currentUserName: string;
  isTyping: boolean;
  dispatch: React.Dispatch<AppAction>;
  pendingFriends: Set<string>;
  pendingGroupJoins?: Set<string>;
  hasAntiPrimePost?: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onViewProfile?: (userId: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  thread,
  currentUserId,
  currentUserName,
  isTyping,
  dispatch,
  pendingFriends,
  pendingGroupJoins,
  hasAntiPrimePost,
  onMinimize,
  onClose,
  onViewProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (thread.messages.length > 0) {
      dispatch({ type: 'MARK_THREAD_READ', threadId: thread.threadId });
    }
  }, [thread.messages, isTyping, dispatch, thread.threadId]);

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    adjustTextareaHeight();
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    const newMsg: Message = {
      id: `local-${Date.now()}`,
      senderId: currentUserId,
      text,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'SEND_MESSAGE', threadId: thread.threadId, message: newMsg });
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Schedule auto-response (pass full thread messages + user ID for AI context)
    const allMessages = [...thread.messages, newMsg];
    scheduleChatResponse(dispatch, thread.threadId, thread.participant.id, text, pendingFriends, currentUserName, allMessages, currentUserId, pendingGroupJoins, hasAntiPrimePost);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  const markAsRead = () => {
    if (thread.messages.length > 0) {
      dispatch({ type: 'MARK_THREAD_READ', threadId: thread.threadId });
    }
  };

  const liveUser = usersData.allUsers.find(u => u.id === thread.participant.id);
  const participantAvatar = liveUser?.avatarUrl || thread.participant.avatarUrl;
  const participantName = liveUser?.name || thread.participant.name;



  return (
    <div className={styles.chatWindow} onClick={markAsRead}>
      <div className={styles.chatHeader}>
        <div className={styles.chatAvatarWrap}>
          <img 
            src={participantAvatar} 
            alt={participantName} 
            className={styles.chatAvatar}
            onClick={() => onViewProfile && onViewProfile(thread.participant.id)}
            style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
          />
          {thread.participant.isOnline && <div className={styles.chatOnline} />}
        </div>
        <div className={styles.chatHeaderInfo}>
          <span className={styles.chatName}>{participantName}</span>
          {isTyping && (
            <span className={styles.chatTypingLabel}>pisze...</span>
          )}
        </div>
        <div className={styles.chatHeaderActions}>
          <button
            type="button"
            className={styles.chatActionBtn}
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            title="Minimalizuj czat"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className={styles.chatCloseBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Zamknij czat"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className={styles.chatMessages}>
        {thread.messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isSent={msg.senderId === currentUserId}
            time={formatTime(msg.timestamp)}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className={`${styles.bubbleRow} ${styles.bubbleRowReceived}`}>
            <div className={`${styles.bubble} ${styles.bubbleReceived} ${styles.typingBubble}`}>
              <div className={styles.typingDots}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.chatInputArea}>
        <textarea
          ref={textareaRef}
          rows={1}
          className={styles.chatInput}
          placeholder="Napisz wiadomość..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <button className={styles.chatSendBtn} onClick={handleSend} disabled={!inputText.trim()}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  time: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSent, time }) => {
  return (
    <div className={`${styles.bubbleRow} ${isSent ? styles.bubbleRowSent : styles.bubbleRowReceived}`}>
      <div className={`${styles.bubble} ${isSent ? styles.bubbleSent : styles.bubbleReceived}`}>
        {message.text}
        <div className={`${styles.bubbleTime} ${isSent ? styles.bubbleTimeSent : ''}`}>{time}</div>
      </div>
    </div>
  );
};
