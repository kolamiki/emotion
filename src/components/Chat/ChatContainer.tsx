import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import styles from './Chat.module.css';
import type { MessageThread, Message, AppAction, TypingState } from '../../types';
import { scheduleChatResponse } from '../../store/responseEngine';

interface ChatContainerProps {
  threads: MessageThread[];
  currentUserId: string;
  currentUserName: string;
  typing: TypingState;
  dispatch: React.Dispatch<AppAction>;
  pendingFriends: Set<string>;
  pendingGroupJoins?: Set<string>;
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

  const visibleThreads = isMobile && threads.length > 0 ? [threads[threads.length - 1]] : threads;

  return (
    <div className={styles.chatContainer}>
      {visibleThreads.map(thread => (
        <ChatWindow
          key={thread.threadId}
          thread={thread}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isTyping={!!typing[thread.threadId]}
          dispatch={dispatch}
          pendingFriends={pendingFriends}
          pendingGroupJoins={pendingGroupJoins}
          onClose={() => onClose(thread.threadId)}
          onViewProfile={onViewProfile}
        />
      ))}
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
    scheduleChatResponse(dispatch, thread.threadId, thread.participant.id, text, pendingFriends, currentUserName, allMessages, currentUserId, pendingGroupJoins);
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

  return (
    <div className={styles.chatWindow} onClick={markAsRead}>
      <div className={styles.chatHeader}>
        <div className={styles.chatAvatarWrap}>
          <img 
            src={thread.participant.avatarUrl} 
            alt={thread.participant.name} 
            className={styles.chatAvatar}
            onClick={() => onViewProfile && onViewProfile(thread.participant.id)}
            style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
          />
          {thread.participant.isOnline && <div className={styles.chatOnline} />}
        </div>
        <div className={styles.chatHeaderInfo}>
          <span className={styles.chatName}>{thread.participant.name}</span>
          {isTyping && (
            <span className={styles.chatTypingLabel}>pisze...</span>
          )}
        </div>
        <button className={styles.chatCloseBtn} onClick={onClose}>
          <X size={14} />
        </button>
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
