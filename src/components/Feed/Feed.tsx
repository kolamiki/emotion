import { useState } from 'react';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';
import styles from './Feed.module.css';
import type { Post, User, Comment, AppAction, LikedPosts } from '../../types';
import { schedulePostCommentResponse } from '../../store/responseEngine';

interface FeedProps {
  posts: Post[];
  currentUser: User;
  likedPosts: LikedPosts;
  dispatch: React.Dispatch<AppAction>;
  onOpenCreatePost: () => void;
  onViewProfile?: (userId: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ posts, currentUser, likedPosts, dispatch, onOpenCreatePost, onViewProfile }) => {
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className={styles.feed}>
      <div className={styles.createTeaser} onClick={onOpenCreatePost}>
        <img 
          src={currentUser.avatarUrl} 
          alt={currentUser.name} 
          className={styles.createAvatar}
          onClick={(e) => {
            e.stopPropagation();
            if (onViewProfile) onViewProfile(currentUser.id);
          }}
          style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
        />
        <div className={styles.createInput}>
          Co słychać, {currentUser.name.split(' ')[0]}?
        </div>
      </div>

      {sortedPosts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          isLiked={!!likedPosts[post.id]}
          dispatch={dispatch}
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  );
};

/* === PostCard === */
interface PostCardProps {
  post: Post;
  currentUser: User;
  isLiked: boolean;
  dispatch: React.Dispatch<AppAction>;
  onViewProfile?: (userId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, isLiked, dispatch, onViewProfile }) => {
  const [popping, setPopping] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    if (!isLiked) {
      setPopping(true);
      setTimeout(() => setPopping(false), 350);
    }
    dispatch({ type: 'TOGGLE_LIKE_POST', postId: post.id });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const comment: Comment = {
      id: `user-c-${Date.now()}`,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
      },
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_COMMENT', postId: post.id, comment });

    // Schedule auto-response comment
    schedulePostCommentResponse(dispatch, post.id, commentText.trim(), currentUser.id);

    setCommentText('');
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Teraz';
    if (mins < 60) return `${mins} min temu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h temu`;
    const days = Math.floor(hrs / 24);
    return `${days} ${days === 1 ? 'dzień' : 'dni'} temu`;
  };

  const visibleComments = showAllComments
    ? post.comments
    : post.comments.slice(-2);

  // Fake "like avatars" — use first commenters + author as likers
  const likeAvatarsData = [
    { url: post.author.avatarUrl, id: post.author.id },
    ...post.comments.slice(0, 2).map(c => ({ url: c.author.avatarUrl, id: c.author.id })),
  ].slice(0, 3);

  return (
    <article className={styles.postCard}>
      <div className={styles.postHeader}>
        <div className={styles.avatarWrap}>
          <img 
            src={post.author.avatarUrl} 
            alt={post.author.name} 
            className={styles.postAvatar}
            onClick={() => onViewProfile && onViewProfile(post.author.id)}
            style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
          />
          {post.author.isOnline && <div className={styles.avatarOnline} />}
        </div>
        <div className={styles.postMeta}>
          <div className={styles.postAuthor}>{post.author.name}</div>
          <div className={styles.postTime}>{formatTime(post.timestamp)}</div>
        </div>
      </div>

      <div className={styles.postContent}>{post.content}</div>

      {/* Engagement Stats */}
      {(post.likes > 0 || post.comments.length > 0 || post.shares > 0) && (
        <div className={styles.postStats}>
          <div className={styles.likeStats}>
            {post.likes > 0 && (
              <>
                <div className={styles.likeAvatars}>
                  {likeAvatarsData.map((data, i) => (
                    <img 
                      key={i} 
                      src={data.url} 
                      alt="" 
                      className={styles.likeAvatarImg}
                      onClick={() => onViewProfile && onViewProfile(data.id)}
                      style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
                    />
                  ))}
                </div>
                <span>{post.likes}</span>
              </>
            )}
          </div>
          <div className={styles.commentShareStats}>
            {post.comments.length > 0 && (
              <span className={styles.statLink}>
                {post.comments.length} {post.comments.length === 1 ? 'komentarz' : 'komentarzy'}
              </span>
            )}
            {post.shares > 0 && (
              <span className={styles.statLink}>
                {post.shares} udostępnień
              </span>
            )}
          </div>
        </div>
      )}

      <hr className={styles.postDivider} />

      <div className={styles.postActions}>
        <button
          className={`${styles.actionButton} ${isLiked ? styles.likeActive : ''} ${popping ? styles.likePop : ''}`}
          onClick={handleLike}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          Lubię to
        </button>
        <button
          className={styles.actionButton}
          onClick={() => setShowCommentInput(!showCommentInput)}
        >
          <MessageCircle size={18} />
          Komentarz
        </button>
        <button className={styles.actionButton}>
          <Share2 size={18} />
          Udostępnij
        </button>
      </div>

      {/* Comments */}
      {post.comments.length > 0 && (
        <div className={styles.commentsSection}>
          <hr className={styles.postDivider} style={{ margin: '0 0 4px 0' }} />
          {post.comments.length > 2 && !showAllComments && (
            <div
              className={styles.showMoreComments}
              onClick={() => setShowAllComments(true)}
            >
              Zobacz {post.comments.length - 2} więcej komentarzy...
            </div>
          )}
          {visibleComments.map((comment: Comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <img 
                src={comment.author.avatarUrl} 
                alt={comment.author.name} 
                className={styles.commentAvatar}
                onClick={() => onViewProfile && onViewProfile(comment.author.id)}
                style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
              />
              <div>
                <div className={styles.commentBubble}>
                  <div className={styles.commentAuthor}>{comment.author.name}</div>
                  <div className={styles.commentText}>{comment.text}</div>
                </div>
                <div className={styles.commentTime}>{formatTime(comment.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Input */}
      {showCommentInput && (
        <div className={styles.commentInputArea}>
          <img src={currentUser.avatarUrl} alt={currentUser.name} className={styles.commentAvatar} />
          <div className={styles.commentInputWrap}>
            <input
              className={styles.commentInput}
              type="text"
              placeholder="Napisz komentarz..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              autoFocus
            />
            <button
              className={styles.commentSendBtn}
              onClick={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
