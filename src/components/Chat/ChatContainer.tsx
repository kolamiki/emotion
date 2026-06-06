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
  onClose,
  onViewProfile,
}) => {
  return (
    <div className={styles.chatContainer}>
      {threads.map(thread => (
        <ChatWindow
          key={thread.threadId}
          thread={thread}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isTyping={!!typing[thread.threadId]}
          dispatch={dispatch}
          pendingFriends={pendingFriends}
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
  onClose,
  onViewProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages, isTyping]);

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

    // Schedule auto-response
    scheduleChatResponse(dispatch, thread.threadId, thread.participant.id, text, pendingFriends, currentUserName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.chatWindow}>
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
        <input
          className={styles.chatInput}
          type="text"
          placeholder="Aa"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
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
