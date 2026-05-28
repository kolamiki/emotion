import type { AppAction, ResponseOption, PostCommentResponseOption, Message, Comment } from '../types';
import { responsesData, usersData } from '../mockData';

type Dispatch = React.Dispatch<AppAction>;

const responses = responsesData as {
  chatResponses: {
    id: string;
    participantId: string;
    triggers: string[];
    responses: ResponseOption[];
  }[];
  postCommentResponses: {
    id: string;
    triggers: string[];
    responses: PostCommentResponseOption[];
  }[];
  fallbackResponses: {
    chat: Record<string, ResponseOption[]>;
    postComments: PostCommentResponseOption[];
  };
};

const allUsers = usersData.allUsers;

/**
 * Normalize text for keyword matching:
 * - lowercase
 * - strip Polish diacritics
 * - trim
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .trim();
}

/**
 * Score how well a set of triggers matches the input text.
 * Returns 0 if no match, higher = better match.
 */
function scoreTriggers(text: string, triggers: string[]): number {
  const normalizedText = normalize(text);
  let score = 0;
  for (const trigger of triggers) {
    const normalizedTrigger = normalize(trigger);
    // Check if the trigger appears as a word or substring in the text
    if (normalizedText.includes(normalizedTrigger)) {
      score += normalizedTrigger.length; // longer trigger = more specific = higher score
    }
  }
  return score;
}

/**
 * Find the best chat response for a given message text and participant.
 */
export function matchChatResponse(
  text: string,
  participantId: string
): ResponseOption | null {
  let bestScore = 0;
  let bestResponses: ResponseOption[] = [];

  for (const rule of responses.chatResponses) {
    // Match participant-specific rules or wildcard rules
    if (rule.participantId !== participantId && rule.participantId !== '*') continue;

    const score = scoreTriggers(text, rule.triggers);
    if (score > bestScore) {
      bestScore = score;
      bestResponses = rule.responses;
    }
  }

  if (bestScore > 0 && bestResponses.length > 0) {
    // Pick random response from best match
    return bestResponses[Math.floor(Math.random() * bestResponses.length)];
  }

  return null;
}

/**
 * Get a fallback response for a specific participant.
 */
function getFallbackChatResponse(participantId: string): ResponseOption {
  const participantFallbacks = responses.fallbackResponses.chat[participantId];
  const genericFallbacks = responses.fallbackResponses.chat['*'];

  const pool = participantFallbacks ?? genericFallbacks;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Find the best post comment response for user-generated content.
 */
export function matchPostCommentResponse(
  text: string,
  currentUserId: string
): PostCommentResponseOption | null {
  let bestScore = 0;
  let bestResponses: PostCommentResponseOption[] = [];

  for (const rule of responses.postCommentResponses) {
    const score = scoreTriggers(text, rule.triggers);
    if (score > bestScore) {
      bestScore = score;
      // Filter out responses from the current user
      bestResponses = rule.responses.filter(r => r.authorId !== currentUserId);
    }
  }

  if (bestScore > 0 && bestResponses.length > 0) {
    return bestResponses[Math.floor(Math.random() * bestResponses.length)];
  }

  return null;
}

/**
 * Get a fallback post comment response.
 */
function getFallbackPostCommentResponse(currentUserId: string): PostCommentResponseOption {
  const pool = responses.fallbackResponses.postComments.filter(
    r => r.authorId !== currentUserId
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get user info by id.
 */
function getUserById(userId: string) {
  return allUsers.find(u => u.id === userId);
}

/**
 * Schedule a simulated chat response after the user sends a message.
 * Handles: delay → typing indicator → response message
 */
export function scheduleChatResponse(
  dispatch: Dispatch,
  threadId: string,
  participantId: string,
  userText: string
): void {
  const matched = matchChatResponse(userText, participantId);
  const responseOption = matched ?? getFallbackChatResponse(participantId);

  // Phase 1: delay before typing starts
  setTimeout(() => {
    dispatch({ type: 'SET_TYPING', threadId, isTyping: true });

    // Phase 2: typing duration, then send message
    setTimeout(() => {
      dispatch({ type: 'SET_TYPING', threadId, isTyping: false });

      const responseMsg: Message = {
        id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderId: participantId,
        text: responseOption.text,
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_RESPONSE_MESSAGE', threadId, message: responseMsg });
    }, responseOption.typingDuration);
  }, responseOption.delayBeforeTyping);
}

/**
 * Schedule a simulated comment response on a new post.
 */
export function schedulePostCommentResponse(
  dispatch: Dispatch,
  postId: string,
  postContent: string,
  currentUserId: string
): void {
  const matched = matchPostCommentResponse(postContent, currentUserId);
  const responseOption = matched ?? getFallbackPostCommentResponse(currentUserId);

  const author = getUserById(responseOption.authorId);
  if (!author) return;

  // Phase 1: delay before "typing" (we just wait)
  const totalDelay = responseOption.delayBeforeTyping + responseOption.typingDuration;

  setTimeout(() => {
    const comment: Comment = {
      id: `auto-c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatarUrl,
      },
      text: responseOption.text,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_COMMENT', postId, comment });

    // Also add a notification
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: `notif-${Date.now()}`,
        message: `${author.name} skomentował(a) Twój post.`,
        isRead: false,
        timestamp: new Date().toISOString(),
        type: 'comment',
      },
    });
  }, totalDelay);
}

/**
 * Schedule a simulated comment response on a group post.
 */
export function scheduleGroupPostCommentResponse(
  dispatch: Dispatch,
  groupId: string,
  postId: string,
  postContent: string,
  currentUserId: string
): void {
  const matched = matchPostCommentResponse(postContent, currentUserId);
  const responseOption = matched ?? getFallbackPostCommentResponse(currentUserId);

  const author = getUserById(responseOption.authorId);
  if (!author) return;

  const totalDelay = responseOption.delayBeforeTyping + responseOption.typingDuration;

  setTimeout(() => {
    const comment: Comment = {
      id: `auto-gc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatarUrl,
      },
      text: responseOption.text,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_GROUP_COMMENT', groupId, postId, comment });
  }, totalDelay);
}
