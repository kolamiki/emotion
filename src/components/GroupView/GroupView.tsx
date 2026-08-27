import { useState } from 'react';
import { ArrowLeft, Users, Heart, MessageCircle, Clock, Shield, Send, PenLine } from 'lucide-react';
import styles from './GroupView.module.css';
import type { Group, User, Comment, AppAction, LikedPosts } from '../../types';
import { scheduleGroupPostCommentResponse } from '../../store/responseEngine';

interface GroupViewProps {
  group: Group;
  currentUser: User;
  likedPosts: LikedPosts;
  dispatch: React.Dispatch<AppAction>;
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
  onPostCreated?: () => void;
}

export const GroupView: React.FC<GroupViewProps> = ({ group, currentUser, likedPosts, dispatch, onBack, onViewProfile, onPostCreated }) => {
  const [newGroupPostText, setNewGroupPostText] = useState('');

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Teraz';
    if (mins < 60) return `${mins} min temu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h temu`;
    return `${Math.floor(hrs / 24)}d temu`;
  };

  const handlePublishGroupPost = () => {
    if (!newGroupPostText.trim()) return;

    const newPost = {
      id: `gp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
      },
      content: newGroupPostText.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
    };

    dispatch({ type: 'ADD_GROUP_POST', groupId: group.id, post: newPost });
    setNewGroupPostText('');

    // Schedule AI / simulated comment from a group member
    setTimeout(() => {
      scheduleGroupPostCommentResponse(dispatch, group.id, newPost.id, newPost.content, currentUser.id, currentUser.name);
    }, 100);

    // Trigger scenario engine
    if (onPostCreated) onPostCreated();
  };

  return (
    <div className={styles.groupView}>
      {/* Back */}
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} />
        Wróć do feedu
      </button>

      {/* Group Header Card */}
      <div className={styles.groupHeader}>
        <div className={styles.groupCover} style={{ background: group.coverColor }}>
          <div className={styles.groupCoverOverlay} />
          <div className={styles.groupCoverContent}>
            <h1 className={styles.groupName}>{group.name}</h1>
          </div>
        </div>

        <div className={styles.groupInfo}>
          <p className={styles.groupDesc}>{group.description}</p>

          <div className={styles.groupMeta}>
            <div className={styles.groupMetaItem}>
              <Users size={16} />
              <span className={styles.groupMetaValue}>{group.membersCount.toLocaleString()}</span>
              członków
            </div>
            <div className={styles.groupMetaItem}>
              <Clock size={16} />
              <span className={styles.groupMetaValue}>{group.posts.length}</span>
              postów
            </div>
            <div className={styles.membersPreview}>
              <div className={styles.memberAvatars}>
                {group.members.slice(0, 4).map(m => (
                  <img 
                    key={m.id} 
                    src={m.avatarUrl} 
                    alt={m.name} 
                    className={styles.memberAvatar}
                    onClick={() => onViewProfile && onViewProfile(m.id)}
                    style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.groupActions}>
          {group.isMember ? (
            <button 
              className={`${styles.groupActionBtn} ${styles.groupActionSecondary}`}
              onClick={() => dispatch({ type: 'TOGGLE_GROUP_MEMBERSHIP', groupId: group.id })}
            >
              <Shield size={14} style={{ marginRight: 4 }} />
              Opuść grupę
            </button>
          ) : (
            <button 
              className={`${styles.groupActionBtn} ${styles.groupActionPrimary}`}
              onClick={() => dispatch({ type: 'TOGGLE_GROUP_MEMBERSHIP', groupId: group.id })}
            >
              Dołącz do grupy
            </button>
          )}
          <button className={`${styles.groupActionBtn} ${styles.groupActionSecondary}`}>
            Zaproś znajomych
          </button>
        </div>
      </div>

      {/* Members Panel */}
      <div className={styles.membersPanel}>
        <div className={styles.sectionTitle}>Członkowie ({group.members.length})</div>
        {group.members.map(member => (
          <div key={member.id} className={styles.memberRow}>
            <img 
              src={member.avatarUrl} 
              alt={member.name} 
              className={styles.memberRowAvatar}
              onClick={() => onViewProfile && onViewProfile(member.id)}
              style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
            />
            <span className={styles.memberRowName}>{member.name}</span>
            {member.role === 'admin' && (
              <span className={`${styles.roleBadge} ${styles.roleBadgeAdmin}`}>Admin</span>
            )}
            {member.role === 'moderator' && (
              <span className={`${styles.roleBadge} ${styles.roleBadgeMod}`}>Moderator</span>
            )}
          </div>
        ))}
      </div>

      {/* Create Group Post - Only if member */}
      {group.isMember && (
        <div className={styles.groupComposeBox}>
          <div className={styles.groupComposeHeader}>
            <PenLine size={16} />
            <span>Napisz post w grupie</span>
          </div>
          <div className={styles.groupComposeBody}>
            <img src={currentUser.avatarUrl} alt={currentUser.name} className={styles.groupComposeAvatar} />
            <textarea
              className={styles.groupComposeTextarea}
              placeholder={`Co chcesz powiedzieć w ${group.name}?`}
              value={newGroupPostText}
              onChange={e => setNewGroupPostText(e.target.value)}
              rows={2}
            />
          </div>
          <div className={styles.groupComposeFooter}>
            <button
              className={styles.groupComposePublishBtn}
              disabled={!newGroupPostText.trim()}
              onClick={handlePublishGroupPost}
            >
              Opublikuj
            </button>
          </div>
        </div>
      )}

      {/* Group Posts */}
      <div className={styles.sectionTitle}>Ostatnie posty</div>
      {group.posts.length === 0 && (
        <div className={styles.groupPost} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          Brak postów w tej grupie. Bądź pierwszy!
        </div>
      )}
      {group.posts.map(post => (
        <GroupPostCard
          key={post.id}
          post={post}
          groupId={group.id}
          currentUser={currentUser}
          isLiked={!!likedPosts[post.id]}
          dispatch={dispatch}
          formatTime={formatTime}
          onViewProfile={onViewProfile}
          onPostCreated={onPostCreated}
        />
      ))}
    </div>
  );
};

/* === Group Post Card === */
interface GroupPostCardProps {
  post: Group['posts'][number];
  groupId: string;
  currentUser: User;
  isLiked: boolean;
  dispatch: React.Dispatch<AppAction>;
  formatTime: (ts: string) => string;
  onViewProfile?: (userId: string) => void;
  onPostCreated?: () => void;
}

const GroupPostCard: React.FC<GroupPostCardProps> = ({
  post,
  groupId,
  currentUser,
  isLiked,
  dispatch,
  formatTime,
  onViewProfile,
  onPostCreated,
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLike = () => {
    dispatch({ type: 'TOGGLE_LIKE_GROUP_POST', groupId, postId: post.id });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const comment: Comment = {
      id: `user-gc-${Date.now()}`,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
      },
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_GROUP_COMMENT', groupId, postId: post.id, comment });

    // Schedule auto-response
    scheduleGroupPostCommentResponse(dispatch, groupId, post.id, commentText.trim(), currentUser.id, currentUser.name);

    // Trigger scenario engine
    if (onPostCreated) onPostCreated();

    setCommentText('');
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className={styles.groupPost}>
      <div className={styles.gpHeader}>
        <img 
          src={post.author.avatarUrl} 
          alt={post.author.name} 
          className={styles.gpAvatar}
          onClick={() => onViewProfile && onViewProfile(post.author.id)}
          style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
        />
        <div>
          <div className={styles.gpAuthor}>{post.author.name}</div>
          <div className={styles.gpTime}>{formatTime(post.timestamp)}</div>
        </div>
      </div>
      <div className={styles.gpContent}>
        {post.content.length > 168 && !isExpanded ? (
          <>
            {post.content.slice(0, 168)}...{' '}
            <span 
              className={styles.readMoreBtn} 
              onClick={() => setIsExpanded(true)}
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
            >
              wyświetl więcej
            </span>
          </>
        ) : (
          <>
            {post.content}
            {post.content.length > 168 && (
              <>
                {' '}
                <span 
                  className={styles.readMoreBtn} 
                  onClick={() => setIsExpanded(false)}
                  style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Wyświetl mniej
                </span>
              </>
            )}
          </>
        )}
      </div>

      {(post.likes > 0 || post.comments.length > 0) && (
        <div className={styles.gpStats}>
          <span>{post.likes > 0 ? `${post.likes} polubień` : ''}</span>
          <span>{post.comments.length > 0 ? `${post.comments.length} komentarzy` : ''}</span>
        </div>
      )}

      <hr className={styles.gpDivider} />
      <div className={styles.gpActions}>
        <button
          className={styles.gpActionBtn}
          onClick={handleLike}
          style={isLiked ? { color: 'var(--accent)' } : {}}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          Lubię to
        </button>
        <button
          className={styles.gpActionBtn}
          onClick={() => setShowCommentInput(!showCommentInput)}
        >
          <MessageCircle size={16} />
          Komentarz
        </button>
      </div>

      {/* Comments */}
      {post.comments.length > 0 && (
        <div className={styles.gpComments}>
          {post.comments.map(c => (
            <div key={c.id} className={styles.gpComment}>
              <img 
                src={c.author.avatarUrl} 
                alt={c.author.name} 
                className={styles.gpCommentAvatar}
                onClick={() => onViewProfile && onViewProfile(c.author.id)}
                style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
              />
              <div className={styles.gpCommentBubble}>
                <div className={styles.gpCommentAuthor}>{c.author.name}</div>
                <div className={styles.gpCommentText}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Input */}
      {showCommentInput && (
        <div className={styles.gpCommentInputArea}>
          <img src={currentUser.avatarUrl} alt={currentUser.name} className={styles.gpCommentAvatar} />
          <div className={styles.gpCommentInputWrap}>
            <input
              className={styles.gpCommentInput}
              type="text"
              placeholder="Napisz komentarz..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              autoFocus
            />
            <button
              className={styles.gpCommentSendBtn}
              onClick={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
