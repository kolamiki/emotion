export interface PersonalityTraits {
  openness: number;         // 0.0 - 1.0 (curiosity, openness to new ideas)
  conscientiousness: number;// 0.0 - 1.0 (thoroughness, self-discipline)
  extraversion: number;     // 0.0 - 1.0 (extraversion vs introversion)
  agreeableness: number;    // 0.0 - 1.0 (cooperativeness, empathy vs coldness/criticism)
  neuroticism: number;      // 0.0 - 1.0 (emotionality, tendency toward stress/irritability)
  patience: number;         // 0.0 - 1.0 (patience in conversation)
  humor: number;            // 0.0 - 1.0 (sense of humor, tendency toward jokes/sarcasm)
}

export interface CommunicationStyle {
  tone: string;             // e.g. "direct, professional, slightly cold"
  sentenceLength: string;   // e.g. "short, concise sentences" | "elaborate, vivid descriptions"
  vocabulary: string;       // e.g. "colloquial, youthful" | "specialist, academic"
  useEmojis: boolean | 'rarely' | 'frequently';
  catchphrases?: string[];  // characteristic recurring phrases
}

export interface AIPersonalityConfig {
  id: string;               // userId matching allUsers (e.g. "u2", "u14", "u_matylda")
  name: string;
  role: string;
  bio: string;
  traits: PersonalityTraits;
  communicationStyle: CommunicationStyle;
  background: string;       // Who the character is, what they do, what they've been through
  hiddenMotives?: string;   // Character's goals in conversation (e.g. hiding a secret, studying the user)
  knowledgeBase?: string[]; // Fields of knowledge they feel comfortable in
  rules: string[];          // Strict behavioural rules for conversation
  messageLimit?: number;    // Message limit from user before farewell (20-50)
  farewellMessage?: string; // Farewell in character after reaching the limit
  offlineMessage?: string;  // Auto-reply after reaching the limit (offline status)
}

export interface AIPersonalitiesData {
  personalities: Record<string, AIPersonalityConfig>;
}

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequestPayload {
  personalityId: string;
  systemPrompt: string;
  messages: ChatMessagePayload[];
}

export interface AIResponsePayload {
  reply: string;
  model?: string;
  usage?: {
    totalTokens?: number;
  };
}
