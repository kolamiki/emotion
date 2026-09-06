import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Send, Loader2, ShieldAlert } from 'lucide-react';
import styles from './Feed.module.css';
import type { Post, User, Comment, AppAction, LikedPosts } from '../../types';
import { schedulePostCommentResponse } from '../../store/responseEngine';

interface FeedProps {
  posts: Post[];
  currentUser: User;
  likedPosts: LikedPosts;
  dispatch: React.Dispatch<AppAction>;
  matyldaLikesActive: boolean;
  onOpenCreatePost: () => void;
  onViewProfile?: (userId: string) => void;
  highlightedPostId?: string | null;
  onClearHighlight?: () => void;
  isBanned?: boolean;
}

export const Feed: React.FC<FeedProps> = ({ posts, currentUser, likedPosts, dispatch, matyldaLikesActive, onOpenCreatePost, onViewProfile, highlightedPostId, onClearHighlight, isBanned }) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < sortedPosts.length && !isLoadingMore) {
        setIsLoadingMore(true);
        // Simulate network delay for smoother UX
        setTimeout(() => {
          setVisibleCount(prev => prev + 5);
          setIsLoadingMore(false);
        }, 600);
      }
    }, { rootMargin: '400px' }); // Load when within 400px of bottom

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [visibleCount, sortedPosts.length, isLoadingMore]);

  const visiblePosts = sortedPosts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedPosts.length;

  // Scroll to highlighted post
  useEffect(() => {
    if (!highlightedPostId) return;

    // Ensure the post is visible (expand visibleCount if needed)
    const postIndex = sortedPosts.findIndex(p => p.id === highlightedPostId);
    if (postIndex >= 0 && postIndex >= visibleCount) {
      setVisibleCount(postIndex + 5);
    }

    // Wait a tick for DOM to update
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-post-id="${highlightedPostId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add(styles.postHighlighted);

        // Remove highlight after animation
        setTimeout(() => {
          el.classList.remove(styles.postHighlighted);
          if (onClearHighlight) onClearHighlight();
        }, 2500);
      } else {
        if (onClearHighlight) onClearHighlight();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [highlightedPostId]);

  const handleTeaserClick = () => {
    if (isBanned) {
      alert('Publikowanie postów jest zablokowane z powodu zawieszenia konta (§ 12.3 Regulaminu).');
      return;
    }
    onOpenCreatePost();
  };

  return (
    <div className={styles.feed}>
      <div className={styles.createTeaser} onClick={handleTeaserClick}>
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
          {isBanned ? 'Konto zawieszone — publikowanie zablokowane' : `Co słychać, ${currentUser.name.split(' ')[0]}?`}
        </div>
      </div>

      {visiblePosts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          isLiked={!!likedPosts[post.id]}
          dispatch={dispatch}
          matyldaLikesActive={matyldaLikesActive}
          onViewProfile={onViewProfile}
          isBanned={isBanned}
        />
      ))}

      {hasMore && (
        <div ref={loadMoreRef} className={styles.loadMore}>
          {isLoadingMore && <Loader2 size={24} className={styles.loaderIcon} />}
        </div>
      )}
    </div>
  );
};

/* === PostCard === */
interface PostCardProps {
  post: Post;
  currentUser: User;
  isLiked: boolean;
  dispatch: React.Dispatch<AppAction>;
  matyldaLikesActive: boolean;
  onViewProfile?: (userId: string) => void;
  isBanned?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, isLiked, dispatch, matyldaLikesActive, onViewProfile, isBanned }) => {
  const [popping, setPopping] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLike = () => {
    if (isBanned) {
      alert('Konto zawieszone (§ 12.3 Regulaminu). Polubienia są zablokowane.');
      return;
    }
    if (!isLiked) {
      setPopping(true);
      setTimeout(() => setPopping(false), 350);
    }
    dispatch({ type: 'TOGGLE_LIKE_POST', postId: post.id });
  };

  const handleAddComment = () => {
    if (isBanned) {
      alert('Konto zawieszone (§ 12.3 Regulaminu). Dodawanie komentarzy jest zablokowane.');
      return;
    }
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

  // Fake "like avatars" - use first commenters + author as likers
  let likeAvatarsData = [
    { url: post.author.avatarUrl, id: post.author.id },
    ...post.comments.slice(0, 2).map(c => ({ url: c.author.avatarUrl, id: c.author.id })),
  ].slice(0, 3);

  let displayLikes = post.likes;

  // Add Matylda's like
  if (matyldaLikesActive && post.author.id === currentUser.id) {
    likeAvatarsData = [
      { url: 'https://i.pravatar.cc/150?u=u_matylda', id: 'u_matylda' },
      ...likeAvatarsData.slice(0, 2)
    ];
    if (displayLikes === 0) displayLikes = 1;
  }

  const isModerated = post.author.id === 'u13' || post.content.startsWith('[');

  return (
    <article className={`${styles.postCard} ${isModerated ? styles.moderatedCard : ''}`} data-post-id={post.id}>
      <div className={styles.postHeader}>
        <div className={styles.avatarWrap}>
          <img
            src={post.author.id === currentUser.id ? currentUser.avatarUrl : post.author.avatarUrl}
            alt={post.author.id === currentUser.id ? currentUser.name : post.author.name}
            className={styles.postAvatar}
            onClick={() => onViewProfile && onViewProfile(post.author.id)}
            style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
          />
          {post.author.isOnline && <div className={styles.avatarOnline} />}
        </div>
        <div className={styles.postMeta}>
          <div className={styles.postAuthor}>
            {post.author.id === currentUser.id ? currentUser.name : post.author.name}
            {isModerated && <span className={styles.moderatedBadge}>Zmoderowano</span>}
          </div>
          <div className={styles.postTime}>{formatTime(post.timestamp)}</div>
        </div>
      </div>

      <div className={styles.postContent}>
        {isModerated ? (
          <div className={styles.moderatedNotice}>
            <ShieldAlert size={18} className={styles.moderatedIcon} />
            <div className={styles.moderatedText}>{post.content}</div>
          </div>
        ) : post.content.length > 168 && !isExpanded ? (
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

      {/* Engagement Stats */}
      {(displayLikes > 0 || post.comments.length > 0 || post.shares > 0) && (
        <div className={styles.postStats}>
          <div className={styles.likeStats}>
            {displayLikes > 0 && (
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
                <span>{displayLikes}</span>
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
                src={comment.author.id === currentUser.id ? currentUser.avatarUrl : comment.author.avatarUrl}
                alt={comment.author.id === currentUser.id ? currentUser.name : comment.author.name}
                className={styles.commentAvatar}
                onClick={() => onViewProfile && onViewProfile(comment.author.id)}
                style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
              />
              <div>
                <div className={styles.commentBubble}>
                  <div className={styles.commentAuthor}>
                    {comment.author.id === currentUser.id ? currentUser.name : comment.author.name}
                  </div>
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
              placeholder={isBanned ? "Konto zawieszone — komentowanie zablokowane" : "Napisz komentarz..."}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              disabled={isBanned}
              autoFocus
            />
            <button
              className={styles.commentSendBtn}
              onClick={handleAddComment}
              disabled={isBanned || !commentText.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
